<template>
  <article class="card scen-card" :class="{ running }">
    <header style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px">
      <span class="mono scen-id">{{ scenario.id }}</span>
      <span
        v-if="scenario.last_run"
        class="badge"
        :class="scenario.last_run.verdict === 'pass' ? 'pass' : 'fail'"
      >{{ scenario.last_run.verdict === 'pass' ? 'pass' : 'fail' }}</span>
      <span v-else class="badge">не прогонялся</span>
    </header>

    <h3 class="scen-title">{{ scenario.title }}</h3>

    <div class="json-block scen-prompt">{{ scenario.prompt }}</div>

    <p class="scen-note">{{ scenario.note }}</p>

    <div class="scen-sec">
      <span class="field-label">Ожидание</span>
      <div class="json-block expect-block">{{ expectText }}</div>
    </div>

    <div v-if="scenario.last_run" class="scen-sec">
      <span class="field-label">Последний прогон · {{ runDate }}</span>
      <div class="json-block expect-block" :class="scenario.last_run.verdict === 'pass' ? 'ok-block' : 'bad-block'">{{ runText }}</div>
      <ul v-if="misses.length" class="miss-list">
        <li v-for="(m, i) in misses" :key="i">
          <span class="mono miss-path">{{ m.path }}</span> — {{ m.why }}:
          ожидалось <span class="mono">{{ fmt(m.expected) }}</span>,
          получено <span class="mono">{{ fmt(m.actual) }}</span>
        </li>
      </ul>
    </div>

    <button class="btn-run mono" :disabled="running" @click="$emit('run', scenario)">
      <span v-if="running" class="spinner"></span>
      {{ running ? 'декодирование…' : '▶ прогнать' }}
    </button>
  </article>
</template>

<script>
export default {
  name: 'ScenarioCard',

  props: {
    scenario: { type: Object, required: true },
    running: { type: Boolean, default: false },
  },

  emits: ['run'],

  computed: {
    expectText() {
      const e = this.scenario.expect;
      const parts = [];
      if (e.calls) {
        parts.push(e.calls.map((c) => this.callText(c)).join('\n'));
      }
      if (e.refusal) parts.push('∅ пустой список вызовов — отказ');
      if (e.suppressed) parts.push('вызов удержан (suppressed_calls), без исполнения');
      if (e.record) {
        parts.push(Object.entries(e.record)
          .map(([k, v]) => `${k} = ${JSON.stringify(v)}`)
          .join('\n'));
      }
      return parts.join('\n');
    },
    runText() {
      const g = this.scenario.last_run;
      const parts = [];
      if (g.function_calls?.length) {
        parts.push(g.function_calls
          .map((c) => `${c.name}(${Object.entries(c.arguments || {})
            .map(([k, v]) => `${k}=${JSON.stringify(v)}`).join(', ')})`)
          .join('\n'));
      } else if (g.suppressed_calls?.length) {
        parts.push(`удержано: ${g.suppressed_calls.map((c) => c.name).join(', ')}`);
      } else {
        parts.push('∅ отказ');
      }
      if (g.record) {
        parts.push(Object.entries(g.record)
          .map(([k, v]) => `${k} = ${JSON.stringify(v)}`)
          .join('\n'));
      }
      parts.push(`conf ${g.confidence?.toFixed(2)} · ${g.latency_ms} мс`);
      return parts.join('\n');
    },
    misses() {
      return this.scenario.last_run?.verdict_detail?.misses || [];
    },
    runDate() {
      return new Date(this.scenario.last_run.created_at).toLocaleString('ru-RU', {
        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
      });
    },
  },

  methods: {
    callText(c) {
      const args = c.args
        ? Object.entries(c.args).map(([k, v]) => `${k}=${JSON.stringify(v)}`).join(', ')
        : Object.entries(c.argsContains || {}).map(([k, v]) => `${k}=${JSON.stringify(v)}`).join(', ');
      const strict = c.args ? '' : ' (частичная проверка)';
      return `${c.name}(${args})${strict}`;
    },
    fmt(v) {
      if (v === undefined) return '—';
      if (typeof v === 'object') return JSON.stringify(v);
      return String(v);
    },
  },
};
</script>

<style scoped>
.scen-card {
  display: flex;
  flex-direction: column;
  padding: 16px 18px;
}

.scen-card.running { border-color: rgba(201, 242, 78, 0.4); }

.scen-id {
  font-size: 11px;
  color: var(--faint);
}

.scen-title {
  font-size: 14px;
  margin-bottom: 10px;
}

.scen-prompt {
  font-size: 11.5px;
  white-space: pre-wrap;
  margin-bottom: 10px;
  max-height: 130px;
  overflow-y: auto;
}

.scen-note {
  font-size: 12px;
  color: var(--muted);
  line-height: 1.5;
  margin-bottom: 12px;
}

.scen-sec { margin-bottom: 12px; }

.expect-block {
  font-size: 11px;
  white-space: pre-wrap;
}

.ok-block { border-color: rgba(127, 216, 143, 0.35); }
.bad-block { border-color: rgba(255, 107, 107, 0.4); }

.miss-list {
  margin: 8px 0 0;
  padding-left: 16px;
  font-size: 11.5px;
  color: var(--danger);
}

.miss-list li { margin-bottom: 3px; }

.miss-path { color: var(--warn); }

.btn-run {
  margin-top: auto;
  align-self: flex-start;
  background: transparent;
  color: var(--accent);
  border: 1px solid rgba(201, 242, 78, 0.35);
  border-radius: 8px;
  font-size: 12px;
  padding: 8px 16px;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-run:hover { background: var(--accent-dim); }
.btn-run:disabled { opacity: 0.55; cursor: wait; }
</style>
