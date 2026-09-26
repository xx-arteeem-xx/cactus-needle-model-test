<template>
  <div>
    <div v-for="(items, group) in grouped" :key="group" style="margin-bottom: 26px">
      <div class="group-head">
        <span class="badge" :class="groupMode(group)">{{ group }}</span>
        <span class="group-count mono">{{ items.length }} сценар{{ items.length === 1 ? 'ий' : (items.length < 5 ? 'ия' : 'иев') }}</span>
        <span class="group-score mono" v-if="known(group)">{{ passed(group) }}/{{ known(group) }} пройдено</span>
      </div>
      <div class="scen-grid">
        <ScenarioCard
          v-for="s in items"
          :key="s.id"
          :scenario="s"
          :running="running === s.id"
          @run="$emit('run', s)"
        />
      </div>
    </div>
  </div>
</template>

<script>
import ScenarioCard from './ScenarioCard.vue';

export default {
  name: 'ScenarioBoard',

  components: { ScenarioCard },

  props: {
    scenarios: { type: Array, default: () => [] },
    running: { type: String, default: null },
  },

  computed: {
    grouped() {
      const out = {};
      for (const s of this.scenarios) {
        (out[s.group] ||= []).push(s);
      }
      return out;
    },
  },

  methods: {
    groupMode(group) {
      return group === 'invoice' || group === 'contact' || group === 'meeting_request' || group === 'support_ticket'
        ? 'extract' : 'tools';
    },
    known(group) {
      return this.grouped[group].filter((s) => s.last_run).length;
    },
    passed(group) {
      return this.grouped[group].filter((s) => s.last_run?.verdict === 'pass').length;
    },
  },
};
</script>

<style scoped>
.group-head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.group-count {
  font-size: 11.5px;
  color: var(--faint);
}

.group-score {
  margin-left: auto;
  font-size: 12px;
  color: var(--muted);
}

.scen-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

@media (max-width: 900px) {
  .scen-grid { grid-template-columns: 1fr; }
}
</style>
