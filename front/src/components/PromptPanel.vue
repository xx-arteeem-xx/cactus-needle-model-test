<template>
  <div class="card pp-card">
    <div class="pp-head">
      <div class="pp-title">Что уходит в модель</div>
      <div class="pp-sub mono">{{ surfaceId }} · compile → grammar → constrained decode</div>
    </div>

    <div class="pp-part">
      <div class="pp-part-title mono">1 · Схемы {{ selection.mode === 'tools' ? 'инструментов' : 'извлечения' }}</div>
      <p class="pp-hint" v-if="selection.mode === 'tools'">
        Каждая схема — контракт: модель выбирает инструмент и заполняет аргументы,
        грамматика не даёт выйти за пределы типов и перечислений.
      </p>
      <p class="pp-hint" v-else>
        Схема записи — единственный «инструмент»; catch-all триггер заставляет модель
        заполнить его на любом тексте вместо отказа.
      </p>
      <details v-for="t in surfaceTools" :key="t.name" class="pp-tool">
        <summary class="mono">
          <span class="pp-caret">▸</span> {{ t.name }}
          <span class="pp-props">{{ Object.keys(t.parameters?.properties || {}).length }} полей</span>
        </summary>
        <div class="json-block" v-html="jsonHtml(t)"></div>
      </details>
    </div>

    <div class="pp-part">
      <div class="pp-part-title mono">2 · Факты о среде</div>
      <div v-if="selection.systemFacts" class="json-block facts-block">{{ selection.systemFacts }}</div>
      <p v-else class="pp-hint">Не заданы. Движок автоматически подставит локальную дату —
        относительные слова («завтра») без неё не разрешаются.</p>
    </div>

    <div class="pp-part">
      <div class="pp-part-title mono">3 · Текст запроса</div>
      <div v-if="selection.prompt" class="json-block query-block">«{{ selection.prompt }}»</div>
      <p v-else class="pp-hint">Введите запрос в форме — текст появится здесь.</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PromptPanel',

  props: {
    catalog: { type: Object, required: true },
    selection: { type: Object, required: true },
  },

  computed: {
    surfaceId() {
      return this.selection.surface;
    },
    surfaces() {
      return this.selection.mode === 'tools' ? this.catalog.toolsets : this.catalog.schemas;
    },
    surface() {
      return this.surfaces.find((s) => s.id === this.selection.surface);
    },
    surfaceTools() {
      if (!this.surface) return [];
      if (this.selection.mode === 'tools') return this.surface.tools;
      return [{
        name: 'record',
        description: 'Record the extracted fields found in the user text. (catch-all trigger: .*)',
        parameters: this.surface.schema,
      }];
    },
  },

  methods: {
    jsonHtml(value) {
      const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const json = JSON.stringify(value, null, 2);
      return esc(json)
        .replace(/"([^"]+)":/g, '<span class="jk">"$1"</span>:')
        .replace(/: "(.*?)"/g, ': <span class="js">"$1"</span>')
        .replace(/: (-?\d+\.?\d*)/g, ': <span class="jn">$1</span>')
        .replace(/: (true|false|null)/g, ': <span class="jb">$1</span>');
    },
  },
};
</script>

<style scoped>
.pp-card {
  align-self: start;
  position: sticky;
  top: 76px;
}

.pp-head {
  border-bottom: 1px solid var(--border);
  padding-bottom: 12px;
  margin-bottom: 14px;
}

.pp-title {
  font-size: 14px;
  font-weight: 600;
}

.pp-sub {
  font-size: 11px;
  color: var(--faint);
  margin-top: 3px;
}

.pp-part { margin-bottom: 16px; }

.pp-part-title {
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--accent);
  margin-bottom: 7px;
}

.pp-hint {
  font-size: 12px;
  color: var(--muted);
  line-height: 1.5;
}

.pp-tool { margin-bottom: 6px; }

.pp-tool summary {
  cursor: pointer;
  list-style: none;
  font-size: 12.5px;
  color: var(--text);
  background: var(--bg-soft);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 7px 11px;
  user-select: none;
}

.pp-tool summary::-webkit-details-marker { display: none; }

.pp-caret {
  color: var(--faint);
  display: inline-block;
  margin-right: 4px;
  transition: transform 0.15s;
}

.pp-tool[open] .pp-caret { transform: rotate(90deg); }

.pp-props {
  float: right;
  font-size: 10.5px;
  color: var(--faint);
}

.pp-tool .json-block {
  margin-top: 4px;
  font-size: 11px;
  max-height: 260px;
  overflow: auto;
}

.facts-block, .query-block {
  font-size: 11.5px;
  white-space: pre-wrap;
}

.query-block { color: var(--accent); }
</style>
