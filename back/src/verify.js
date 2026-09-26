// Программная проверка ответа модели против ожидания сценария.
// Возвращает { verdict: 'pass' | 'fail', detail }.

const eq = (a, b) => {
  if (typeof a === 'number' && typeof b === 'number') return Math.abs(a - b) < 1e-6;
  if (typeof a === 'string' && typeof b === 'string') return a.toLowerCase() === b.toLowerCase();
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    const bs = [...b];
    return a.every((x) => bs.some((y) => eq(x, y)) && bs.splice(bs.findIndex((y) => eq(x, y)), 1).length);
  }
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    const ka = Object.keys(a);
    const kb = Object.keys(b);
    return ka.length === kb.length && ka.every((k) => eq(a[k], b[k]));
  }
  return a === b;
};

const subset = (expected, actual, path, misses) => {
  if (!expected || typeof expected !== 'object') return;
  for (const [k, v] of Object.entries(expected)) {
    const p = path ? `${path}.${k}` : k;
    if (actual == null || !(k in actual)) {
      misses.push({ path: p, expected: v, actual: undefined, why: 'поле отсутствует' });
    } else if (!eq(v, actual[k])) {
      misses.push({ path: p, expected: v, actual: actual[k], why: 'значение не совпало' });
    }
  }
};

export function verify(generation, expect) {
  const detail = { checks: [], misses: [] };

  if (expect.refusal) {
    const empty = !(generation.function_calls || []).length;
    const noSuppressed = !(generation.suppressed_calls || []).length;
    detail.checks.push({ check: 'отказ (пустой список вызовов и без удержанных)', ok: empty && noSuppressed });
    if (!empty || !noSuppressed) {
      detail.misses.push({ path: 'function_calls', expected: '[]', actual: generation.function_calls });
    }
  }

  if (expect.suppressed) {
    const withheld = !(generation.function_calls || []).length
      && (generation.suppressed_calls || []).length > 0;
    detail.checks.push({ check: 'вызов удержан (suppressed_calls, без исполнения)', ok: withheld });
    if (!withheld) {
      detail.misses.push({
        path: 'suppressed_calls',
        expected: 'непустой список при пустом function_calls',
        actual: { calls: generation.function_calls, suppressed: generation.suppressed_calls },
      });
    }
  }

  if (expect.calls) {
    const actual = generation.function_calls || [];
    detail.checks.push({
      check: `вызовы: ожидалось ${expect.calls.map((c) => c.name).join(', ')}`,
      ok: actual.length === expect.calls.length,
    });
    if (actual.length !== expect.calls.length) {
      detail.misses.push({ path: 'function_calls', expected: expect.calls.length, actual: actual.length, why: 'не совпало количество вызовов' });
    }
    expect.calls.forEach((want, i) => {
      const got = actual[i];
      if (!got || got.name !== want.name) {
        detail.misses.push({ path: `function_calls[${i}]`, expected: want.name, actual: got?.name, why: 'не тот инструмент' });
        return;
      }
      const args = want.args || want.argsContains || {};
      const misses = [];
      if (want.args) {
        subset(args, got.arguments, `function_calls[${i}]`, misses);
        const extra = Object.keys(got.arguments || {}).filter((k) => !(k in args));
        if (extra.length) {
          misses.push({ path: `function_calls[${i}]`, expected: 'без лишних полей', actual: extra, why: 'выдуманные поля' });
        }
      } else {
        subset(args, got.arguments, `function_calls[${i}]`, misses);
      }
      if (misses.length) detail.misses.push(...misses);
    });
  }

  if (expect.record) {
    const misses = [];
    subset(expect.record, generation.record || {}, 'record', misses);
    detail.checks.push({ check: 'запись извлечения совпадает со схемой ожидания', ok: misses.length === 0 });
    detail.misses.push(...misses);
  }

  const pass = detail.misses.length === 0;
  return { verdict: pass ? 'pass' : 'fail', detail };
}
