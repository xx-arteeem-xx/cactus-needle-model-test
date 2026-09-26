<template>
  <div class="card">
    <div class="form-row" style="margin-bottom: 16px">
      <div>
        <span class="field-label">Режим</span>
        <div class="seg">
          <button
            type="button"
            :class="{ active: mode === 'tools' }"
            @click="setMode('tools')"
          >tools · вызовы</button>
          <button
            type="button"
            :class="{ active: mode === 'extract', 'extract-mode': mode === 'extract' }"
            @click="setMode('extract')"
          >extract · извлечение</button>
        </div>
      </div>
      <div>
        <span class="field-label">{{ mode === 'tools' ? 'Набор инструментов' : 'Схема извлечения' }}</span>
        <select v-model="surface">
          <option v-for="s in surfaces" :key="s.id" :value="s.id">
            {{ s.label }} — {{ s.description }}
          </option>
        </select>
      </div>
    </div>

    <span class="field-label">Запрос</span>
    <textarea
      v-model="prompt"
      :placeholder="promptPlaceholder"
      maxlength="8000"
    ></textarea>

    <div class="form-row" style="margin: 16px 0 20px">
      <div>
        <span class="field-label">Факты о среде (system facts, опционально)</span>
        <input
          v-model="systemFacts"
          type="text"
          placeholder="date: 2026-09-26 Sat 14:00; locale: en-US; device: phone"
        />
      </div>
      <div style="max-width: 220px">
        <span class="field-label">Лимит токенов декодирования</span>
        <input v-model.number="maxNewTokens" type="number" min="32" max="1024" step="32" />
      </div>
    </div>

    <button class="btn-primary" :disabled="submitting" @click="submit">
      <span v-if="submitting" class="spinner"></span>
      {{ submitting ? 'Модель декодирует…' : 'Прогнать запрос' }}
    </button>

    <div v-if="error" class="alert">{{ error }}</div>
  </div>
</template>

<script>
export default {
  name: 'GenerateForm',

  props: {
    catalog: { type: Object, required: true },
    submitting: { type: Boolean, default: false },
  },

  emits: ['submit'],

  data() {
    return {
      prompt: '',
      mode: 'tools',
      surface: this.catalog?.toolsets?.[0]?.id || 'smart_home',
      systemFacts: '',
      maxNewTokens: 512,
      error: null,
    };
  },

  computed: {
    surfaces() {
      return this.mode === 'tools' ? this.catalog.toolsets : this.catalog.schemas;
    },
    promptPlaceholder() {
      return this.mode === 'tools'
        ? 'Например: set the bedroom lights to 40 percent and lock the front door'
        : 'Например: Invoice from Acme Corp, issued March 4th, total $1,240.50, due in 30 days…';
    },
  },

  watch: {
    mode() {
      this.surface = this.surfaces[0]?.id;
    },
  },

  methods: {
    setMode(m) {
      this.mode = m;
    },
    async submit() {
      if (!this.prompt.trim() || this.submitting) return;
      this.error = null;
      const payload = {
        prompt: this.prompt.trim(),
        mode: this.mode,
        max_new_tokens: this.maxNewTokens,
      };
      if (this.mode === 'tools') payload.toolset = this.surface;
      else payload.schema_name = this.surface;
      if (this.systemFacts.trim()) payload.system_facts = this.systemFacts.trim();
      try {
        await this.$emit('submit', payload);
        // on success the parent refreshes the journal; keep the prompt for repeatability
      } catch (e) {
        this.error = e.message;
      }
    },
  },
};
</script>
