import express from 'express';
import cors from 'cors';

import { config } from './config.js';
import { query, ping as pingDb } from './db.js';
import { cached, bust, ping as pingRedis, redisReady } from './cache.js';
import { CHANGELOG } from './changelog.js';
import { changelogMd } from './changelogMd.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '256kb' }));

await redisReady;

const KEYS = {
  generations: (limit) => `needle-bench:generations:${limit}`,
  stats: 'needle-bench:stats',
};

function llmFetch(pathname, options = {}) {
  return fetch(`${config.llmUrl}${pathname}`, {
    ...options,
    signal: AbortSignal.timeout(config.llmTimeoutMs),
  });
}

let catalogCache = { data: null, at: 0 };

async function getCatalog() {
  if (catalogCache.data && Date.now() - catalogCache.at < 60_000) return catalogCache.data;
  try {
    const res = await llmFetch('/info', { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(`llm ${res.status}`);
    catalogCache = { data: await res.json(), at: Date.now() };
  } catch {
    catalogCache = { data: null, at: Date.now() };
  }
  return catalogCache.data;
}

app.get('/api/health', async (_req, res) => {
  const out = { ok: true, db: false, redis: false };
  try { await pingDb(); out.db = true; } catch { /* noop */ }
  try { await pingRedis(); out.redis = true; } catch { /* noop */ }
  out.ok = out.db && out.redis;
  res.status(out.ok ? 200 : 503).json(out);
});

app.get('/api/meta', async (_req, res) => {
  const catalog = await getCatalog();
  res.json({
    name: config.projectName,
    version: config.projectVersion,
    changelog: CHANGELOG,
    changelog_md: changelogMd,
    catalog,
  });
});

const MODES = new Set(['tools', 'extract']);

app.post('/api/generate', async (req, res) => {
  const body = req.body || {};
  const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
  if (!prompt) return res.status(400).json({ error: 'prompt is required' });
  if (prompt.length > 8000) return res.status(400).json({ error: 'prompt is too long' });

  const mode = body.mode || 'tools';
  if (!MODES.has(mode)) return res.status(400).json({ error: `unknown mode: ${mode}` });

  const toolset = mode === 'tools' ? body.toolset : undefined;
  const schemaName = mode === 'extract' ? body.schema_name : undefined;
  if (mode === 'tools' && !toolset) return res.status(400).json({ error: 'toolset is required for tools mode' });
  if (mode === 'extract' && !schemaName) return res.status(400).json({ error: 'schema_name is required for extract mode' });

  let maxNewTokens = Number(body.max_new_tokens ?? 512);
  if (!Number.isInteger(maxNewTokens) || maxNewTokens < 32 || maxNewTokens > 1024) {
    return res.status(400).json({ error: 'max_new_tokens must be an integer in [32, 1024]' });
  }

  const systemFacts = typeof body.system_facts === 'string' && body.system_facts.trim()
    ? body.system_facts.trim().slice(0, 500)
    : undefined;

  const t0 = Date.now();
  let llm;
  try {
    const r = await llmFetch('/infer', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        prompt,
        mode,
        toolset,
        schema_name: schemaName,
        system_facts: systemFacts,
        max_new_tokens: maxNewTokens,
      }),
    });
    if (r.status === 503) {
      return res.status(503).json({ error: 'llm service is warming up' });
    }
    if (!r.ok) {
      const detail = await r.json().catch(() => ({}));
      return res.status(502).json({ error: detail.detail || `llm returned ${r.status}` });
    }
    llm = await r.json();
  } catch (err) {
    const aborted = err?.name === 'TimeoutError' || err?.cause?.name === 'TimeoutError';
    return res.status(aborted ? 504 : 502).json({ error: `llm unreachable: ${err?.message || err}` });
  }
  const roundtripMs = Date.now() - t0;

  const metrics = llm.metrics || {};
  const row = {
    iteration: config.projectVersion,
    mode: llm.mode,
    toolset: llm.toolset || null,
    schema_name: llm.schema_name || null,
    system_facts: llm.system_facts || null,
    max_new_tokens: maxNewTokens,
    model: llm.model,
    prompt,
    response: llm.raw ?? {},
    function_calls: llm.function_calls ? JSON.stringify(llm.function_calls) : null,
    suppressed_calls: llm.suppressed_calls && llm.suppressed_calls.length
      ? JSON.stringify(llm.suppressed_calls) : null,
    record: llm.record ? JSON.stringify(llm.record) : null,
    reasoning: llm.reasoning || null,
    confidence: llm.confidence ?? null,
    success: llm.success !== false,
    error: llm.error || null,
    error_code: llm.error_code || null,
    latency_ms: metrics.wall_ms ?? roundtripMs,
    roundtrip_ms: roundtripMs,
    prefill_tps: metrics.prefill_tps ?? null,
    decode_tps: metrics.decode_tps ?? null,
    est_output_tokens: metrics.est_output_tokens ?? null,
  };

  const inserted = await query(
    `INSERT INTO generations
       (iteration, mode, toolset, schema_name, system_facts, max_new_tokens, model,
        prompt, response, function_calls, suppressed_calls, record, reasoning,
        confidence, success, error, error_code, latency_ms, roundtrip_ms,
        prefill_tps, decode_tps, est_output_tokens)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)
     RETURNING *`,
    [row.iteration, row.mode, row.toolset, row.schema_name, row.system_facts,
     row.max_new_tokens, row.model, row.prompt, JSON.stringify(row.response),
     row.function_calls, row.suppressed_calls, row.record, row.reasoning,
     row.confidence, row.success, row.error, row.error_code, row.latency_ms,
     row.roundtrip_ms, row.prefill_tps, row.decode_tps, row.est_output_tokens],
  );

  await bust();
  res.status(201).json(shapeRow(inserted.rows[0]));
});

function shapeRow(r) {
  const json = (v) => (typeof v === 'string' ? JSON.parse(v) : v);
  return {
    id: Number(r.id),
    created_at: r.created_at,
    iteration: r.iteration,
    mode: r.mode,
    toolset: r.toolset,
    schema_name: r.schema_name,
    system_facts: r.system_facts,
    max_new_tokens: r.max_new_tokens,
    model: r.model,
    prompt: r.prompt,
    response: json(r.response),
    function_calls: json(r.function_calls),
    suppressed_calls: json(r.suppressed_calls),
    record: json(r.record),
    reasoning: r.reasoning,
    confidence: r.confidence,
    success: r.success,
    error: r.error,
    error_code: r.error_code,
    latency_ms: r.latency_ms,
    roundtrip_ms: r.roundtrip_ms,
    prefill_tps: r.prefill_tps,
    decode_tps: r.decode_tps,
    est_output_tokens: r.est_output_tokens,
  };
}

app.get('/api/generations', async (req, res) => {
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 500);
  const rows = await cached(KEYS.generations(limit), async () => {
    const r = await query('SELECT * FROM generations ORDER BY id DESC LIMIT $1', [limit]);
    return r.rows.map(shapeRow);
  });
  res.json({ items: rows, total: rows.length });
});

app.get('/api/stats', async (_req, res) => {
  const stats = await cached(KEYS.stats, async () => {
    const main = await query(`
      SELECT
        count(*)::int AS total,
        count(*) FILTER (WHERE success)::int AS success,
        count(*) FILTER (WHERE NOT success)::int AS failed,
        count(*) FILTER (WHERE mode = 'tools' AND jsonb_array_length(COALESCE(function_calls, '[]'::jsonb)) > 0)::int AS with_calls,
        count(*) FILTER (WHERE mode = 'tools'
                           AND jsonb_array_length(COALESCE(function_calls, '[]'::jsonb)) = 0
                           AND jsonb_array_length(COALESCE(suppressed_calls, '[]'::jsonb)) = 0)::int AS empty_refusals,
        percentile_cont(0.5) WITHIN GROUP (ORDER BY latency_ms) AS p50_latency_ms,
        percentile_cont(0.95) WITHIN GROUP (ORDER BY latency_ms) AS p95_latency_ms,
        avg(latency_ms)::real AS avg_latency_ms,
        avg(confidence)::real AS avg_confidence,
        avg(decode_tps)::real AS avg_decode_tps,
        avg(prefill_tps)::real AS avg_prefill_tps,
        COALESCE(sum(est_output_tokens), 0)::int AS total_output_tokens
      FROM generations`);
    const byMode = await query(`
      SELECT mode,
             count(*)::int AS total,
             count(*) FILTER (WHERE success)::int AS success,
             avg(latency_ms)::real AS avg_latency_ms,
             avg(confidence)::real AS avg_confidence,
             avg(decode_tps)::real AS avg_decode_tps
      FROM generations GROUP BY mode`);
    const byToolset = await query(`
      SELECT mode, COALESCE(toolset, schema_name) AS surface,
             count(*)::int AS total,
             count(*) FILTER (WHERE success)::int AS success,
             count(*) FILTER (WHERE mode = 'tools' AND jsonb_array_length(COALESCE(function_calls, '[]'::jsonb)) > 0)::int AS with_calls,
             count(*) FILTER (WHERE confidence >= 0.7)::int AS confident_calls,
             avg(latency_ms)::real AS avg_latency_ms,
             avg(confidence)::real AS avg_confidence
      FROM generations
      GROUP BY mode, COALESCE(toolset, schema_name)
      ORDER BY total DESC`);
    const recent = await query(`
      SELECT id, mode, latency_ms, confidence,
             COALESCE(decode_tps, 0) AS decode_tps
      FROM generations ORDER BY id DESC LIMIT 24`);
    return {
      totals: main.rows[0],
      by_mode: byMode.rows,
      by_surface: byToolset.rows,
      recent: recent.rows,
    };
  });
  res.json(stats);
});

app.delete('/api/generations', async (_req, res) => {
  const r = await query('TRUNCATE generations RESTART IDENTITY');
  await bust();
  res.json({ ok: true, truncated: true, command: r.command });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'internal error' });
});

app.listen(config.port, () => {
  console.log(`needle-bench back listening on :${config.port} (v${config.projectVersion})`);
});
