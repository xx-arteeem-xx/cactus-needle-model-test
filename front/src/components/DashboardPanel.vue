<template>
  <div>
    <div v-if="!stats || !stats.totals || stats.totals.total === 0" class="card" style="color: var(--faint); font-size: 13.5px; text-align: center; padding: 44px 20px">
      Данных пока нет — сводка появится после первого прогона.
    </div>

    <template v-else>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">{{ t.total }}</div>
          <div class="stat-label">прогонов в серии</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ successRate }}%</div>
          <div class="stat-label">без ошибок движка</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ fmtNum(t.p50_latency_ms) }}<span class="stat-unit"> мс</span></div>
          <div class="stat-label">медианная латентность</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ fmtNum(t.p95_latency_ms) }}<span class="stat-unit"> мс</span></div>
          <div class="stat-label">95-й перцентиль</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ fmtNum(t.avg_confidence) }}</div>
          <div class="stat-label">средний confidence</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ fmtNum(t.avg_decode_tps) }}<span class="stat-unit"> tok/s</span></div>
          <div class="stat-label">средняя скорость декодирования</div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px">
        <div class="chart-card">
          <div class="chart-title">Латентность последних прогонов</div>
          <div class="chart-caption">мс на запрос, новые справа · {{ recentCount }} записей</div>
          <div class="bars">
            <div
              v-for="r in stats.recent"
              :key="r.id"
              class="bar-slot"
              :title="`#${r.id} · ${r.latency_ms} мс`"
            >
              <div
                class="bar"
                :class="{ 'extract-bar': r.mode === 'extract' }"
                :style="{ height: barHeight(r.latency_ms, maxRecentLatency) + '%' }"
              ></div>
            </div>
          </div>
        </div>

        <div class="chart-card">
          <div class="chart-title">Распределение confidence</div>
          <div class="chart-caption">доля прогонов в диапазоне</div>
          <div class="bars">
            <div
              v-for="b in confBuckets"
              :key="b.label"
              class="bar-slot"
              :title="`${b.label}: ${b.count}`"
            >
              <div
                class="bar"
                :style="{ height: barHeight(b.count, maxBucket) + '%' }"
              ></div>
            </div>
          </div>
          <div class="mono" style="display: flex; gap: 5px; margin-top: 6px; font-size: 10px; color: var(--faint)">
            <span v-for="b in confBuckets" :key="b.label" style="flex: 1; text-align: center">{{ b.label }}</span>
          </div>
        </div>
      </div>

      <div class="chart-card">
        <div class="chart-title">Разбивка по поверхностям</div>
        <div class="chart-caption">инструментальные наборы и схемы извлечения</div>
        <table class="data">
          <thead>
            <tr>
              <th>Поверхность</th>
              <th>Прогонов</th>
              <th>С вызовами</th>
              <th>conf ≥ 0.7</th>
              <th>Средняя латентность</th>
              <th>Средний confidence</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in stats.by_surface" :key="row.mode + row.surface">
              <td class="mono">{{ row.surface }}</td>
              <td>{{ row.total }}</td>
              <td>{{ row.with_calls }}</td>
              <td>{{ row.confident_calls }}</td>
              <td>{{ fmtNum(row.avg_latency_ms) }} мс</td>
              <td>{{ fmtNum(row.avg_confidence) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>

<script>
export default {
  name: 'DashboardPanel',

  props: {
    stats: { type: Object, default: null },
  },

  computed: {
    t() {
      return this.stats?.totals || {};
    },
    successRate() {
      if (!this.t.total) return '0';
      return Math.round((this.t.success / this.t.total) * 100);
    },
    recentCount() {
      return this.stats?.recent?.length || 0;
    },
    maxRecentLatency() {
      return Math.max(...(this.stats?.recent || []).map((r) => Number(r.latency_ms) || 1), 1);
    },
    confBuckets() {
      const bins = [
        { label: '0–.2', min: 0, max: 0.2 },
        { label: '.2–.4', min: 0.2, max: 0.4 },
        { label: '.4–.6', min: 0.4, max: 0.6 },
        { label: '.6–.8', min: 0.6, max: 0.8 },
        { label: '.8–1', min: 0.8, max: 1.01 },
      ];
      return bins.map((b) => ({
        label: b.label,
        count: (this.stats?.recent || []).filter(
          (r) => r.confidence != null && r.confidence >= b.min && r.confidence < b.max,
        ).length,
      }));
    },
    maxBucket() {
      return Math.max(...this.confBuckets.map((b) => b.count), 1);
    },
  },

  methods: {
    barHeight(value, max) {
      return Math.max((Number(value) / max) * 100, 1.5);
    },
    fmtNum(v) {
      if (v == null) return '—';
      return Number(v).toFixed(Number(v) < 10 ? 2 : 0);
    },
  },
};
</script>

<style scoped>
.stat-unit {
  font-size: 13px;
  color: var(--faint);
}
@media (max-width: 900px) {
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>
