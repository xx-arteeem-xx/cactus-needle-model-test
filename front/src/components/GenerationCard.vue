<template>
  <article class="card" style="padding: 18px 20px">
    <header style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 12px">
      <span class="mono" style="font-size: 12px; color: var(--faint)">#{{ item.id }}</span>
      <span class="badge" :class="item.mode">
        {{ item.mode === 'tools' ? item.toolset : item.schema_name }}
      </span>
      <span class="badge" :class="item.success ? 'ok' : 'fail'">
        {{ item.success ? 'ok' : (item.error_code || 'error') }}
      </span>
      <span v-if="item.scenario_id" class="badge mono" title="Прогон по сценарию регресса">{{ item.scenario_id }}</span>
      <span v-if="item.verdict" class="badge" :class="item.verdict === 'pass' ? 'pass' : 'fail'">
        {{ item.verdict === 'pass' ? 'ожидание выполнено' : 'ожидание нарушено' }}
      </span>
      <span v-if="item.confidence != null" class="conf">
        <span class="conf-track">
          <span
            class="conf-fill"
            :class="confClass"
            :style="{ width: Math.round(item.confidence * 100) + '%' }"
          ></span>
        </span>
        conf {{ (item.confidence ?? 0).toFixed(2) }}
      </span>
      <span
        class="mono"
        style="margin-left: auto; font-size: 12px; color: var(--faint)"
      >{{ item.latency_ms }} мс · {{ fmtDate }}</span>
    </header>

    <p class="mono" style="font-size: 13px; color: var(--text); margin-bottom: 12px; white-space: pre-wrap">
      {{ item.prompt }}
    </p>

    <!-- tools mode -->
    <template v-if="item.mode === 'tools'">
      <div v-if="calls.length" style="display: grid; gap: 8px">
        <div
          v-for="(c, i) in calls"
          :key="i"
          class="mono"
          style="font-size: 13px; background: var(--accent-dim); border: 1px solid rgba(201,242,78,.18); border-radius: 8px; padding: 9px 13px; overflow-x: auto; white-space: pre; color: var(--text)"
        >{{ c.name }}({{ argsInline(c.arguments) }})</div>
      </div>
      <div
        v-else-if="!suppressed.length"
        class="badge fail"
        style="font-size: 12px"
      >пустой список вызовов — отказ</div>
      <div v-if="suppressed.length" style="margin-top: 8px">
        <span class="badge" style="color: var(--warn); border-color: rgba(255,194,75,.35)">
          удержано низкой достоверностью: {{ callInline(suppressed) }}
        </span>
      </div>
    </template>

    <!-- extract mode -->
    <template v-else>
      <table v-if="recordFields.length" class="data" style="font-size: 13px">
        <tbody>
          <tr v-for="f in recordFields" :key="f.key">
            <td class="mono" style="width: 220px; color: var(--extract)">{{ f.key }}</td>
            <td class="mono" style="color: var(--text)">{{ f.value }}</td>
          </tr>
        </tbody>
      </table>
      <div v-else class="badge fail" style="font-size: 12px">запись не сформирована</div>
    </template>

    <p
      v-if="item.reasoning"
      style="margin-top: 12px; font-size: 12.5px; color: var(--muted); border-left: 2px solid var(--border-strong); padding-left: 12px"
    >
      <span class="mono" style="font-size: 11px; color: var(--faint); text-transform: uppercase; letter-spacing: .06em">обоснование · </span>{{ item.reasoning }}
    </p>

    <footer
      class="mono"
      style="display: flex; gap: 18px; flex-wrap: wrap; margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border); font-size: 11.5px; color: var(--faint)"
    >
      <span>decode {{ fmt(item.decode_tps) }} tok/s</span>
      <span>prefill {{ fmt(item.prefill_tps) }} tok/s</span>
      <span>~{{ item.est_output_tokens ?? '—' }} токенов</span>
      <span>roundtrip {{ item.roundtrip_ms }} мс</span>
      <span>max_new_tokens {{ item.max_new_tokens }}</span>
      <span v-if="item.system_facts">facts: {{ item.system_facts }}</span>
      <span style="margin-left: auto">v{{ item.iteration }}</span>
    </footer>
  </article>
</template>

<script>
export default {
  name: 'GenerationCard',

  props: {
    item: { type: Object, required: true },
  },

  computed: {
    calls() {
      return Array.isArray(this.item.function_calls) ? this.item.function_calls : [];
    },
    suppressed() {
      return Array.isArray(this.item.suppressed_calls) ? this.item.suppressed_calls : [];
    },
    record() {
      return this.item.record && typeof this.item.record === 'object' ? this.item.record : null;
    },
    recordFields() {
      if (!this.record) return [];
      return Object.entries(this.record).map(([key, value]) => ({
        key,
        value: typeof value === 'string' ? value : JSON.stringify(value),
      }));
    },
    confClass() {
      const c = this.item.confidence ?? 0;
      if (c >= 0.7) return '';
      return c >= 0.4 ? 'mid' : 'low';
    },
    fmtDate() {
      const d = new Date(this.item.created_at);
      return d.toLocaleString('ru-RU', {
        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
      });
    },
  },

  methods: {
    fmt(v) {
      return v == null ? '—' : Number(v).toFixed(0);
    },
    argsInline(args) {
      if (!args || typeof args !== 'object') return '';
      return Object.entries(args)
        .map(([k, v]) => `${k}: ${typeof v === 'string' ? `"${v}"` : JSON.stringify(v)}`)
        .join(', ');
    },
    callInline(calls) {
      return calls
        .map((c) => `${c.name}(${this.argsInline(c.arguments)})`)
        .join('; ');
    },
  },
};
</script>
