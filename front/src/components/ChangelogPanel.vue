<template>
  <div>
    <details
      v-for="(v, i) in changelog"
      :key="v.version"
      class="version"
      :open="i === 0"
    >
      <summary>
        <span class="v-tag">v{{ v.version }}</span>
        <span class="v-title">{{ v.title }}</span>
        <span class="v-date">{{ v.date }}</span>
        <span class="v-caret">▸</span>
      </summary>
      <div class="version-body">
        <ul>
          <li v-for="(item, j) in v.items" :key="j">{{ item }}</li>
        </ul>
      </div>
    </details>
  </div>
</template>

<script>
export default {
  name: 'ChangelogPanel',

  props: {
    changelog: { type: Array, required: true },
  },
};
</script>
