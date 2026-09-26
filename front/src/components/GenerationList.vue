<template>
  <div>
    <div v-if="loading && !items.length" class="card mono" style="color: var(--muted); font-size: 13px">
      Загрузка журнала…
    </div>

    <div
      v-else-if="!items.length"
      class="card"
      style="color: var(--faint); font-size: 13.5px; text-align: center; padding: 44px 20px"
    >
      Журнал пуст. Прогоните первый запрос в разделе «Эксперимент».
    </div>

    <transition-group v-else name="fade" style="display: grid; gap: 12px">
      <GenerationCard v-for="g in items" :key="g.id" :item="g" />
    </transition-group>
  </div>
</template>

<script>
import GenerationCard from './GenerationCard.vue';

export default {
  name: 'GenerationList',

  components: { GenerationCard },

  props: {
    items: { type: Array, default: () => [] },
    loading: { type: Boolean, default: false },
  },
};
</script>
