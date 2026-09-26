<template>
  <div class="card">
    <div class="wf-list">
      <div v-for="(step, i) in steps" :key="i" class="wf-step">
        <div class="wf-num mono">{{ String(i + 1).padStart(2, '0') }}</div>
        <div class="wf-body">
          <div class="wf-title">{{ step.title }} <span class="wf-where mono">{{ step.where }}</span></div>
          <div class="wf-text">{{ step.text }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'WorkflowSteps',

  data() {
    return {
      steps: [
        {
          where: 'браузер',
          title: 'Форма → POST /api/generate',
          text: 'Текст запроса, поверхность (набор инструментов или схема извлечения), факты о среде и лимит токенов уходят на бэкенд одним запросом.',
        },
        {
          where: 'express · back',
          title: 'Валидация и диспетчеризация',
          text: 'Бэкенд проверяет параметры, фиксирует время начала прогона и передаёт запрос в LLM-сервис по внутренней сети.',
        },
        {
          where: 'fastapi · llm',
          title: 'Выбор поверхности и чистый контекст',
          text: 'Сервис держит по одному «тёплому» агенту на каждую комбинацию поверхность+факты. Контекст сбрасывается (reset), вызовы сериализуются локом: движок один.',
        },
        {
          where: 'движок needle',
          title: 'Компиляция грамматики и декодирование',
          text: 'JSON-схемы инструментов компилируются в байтовую грамматику; модель декодирует ответ токен за токеном под этим ограничением. Считаются prefill/decode tps и калиброванный confidence.',
        },
        {
          where: 'движок needle',
          title: 'Ремонт и заземление аргументов',
          text: 'Детерминированный проход: даты разрешаются относительно факта date, полярности следуют глаголу запроса, поля без опоры в тексте отбрасываются или вызов удерживается (suppressed_calls).',
        },
        {
          where: 'express · back',
          title: 'Запись в PostgreSQL',
          text: 'Ответ, обоснование аргументов, confidence, латентность движка и полный roundtrip сохраняются одной строкой. Для сценариев регресса ответ сразу сверяется с ожиданием — вердикт пишется рядом.',
        },
        {
          where: 'redis',
          title: 'Инвалидация кеша',
          text: 'Кеши журнала, сводки и сценариев сбрасываются, чтобы чтение всегда отдавало свежую серию.',
        },
        {
          where: 'браузер',
          title: 'Журнал, сводка, вердикт',
          text: 'Фронт перечитывает данные: запись появляется в журнале испытаний, агрегаты пересчитываются, у сценария обновляется последний прогон и вердикт.',
        },
      ],
    };
  },
};
</script>

<style scoped>
.wf-list {
  display: grid;
  gap: 0;
}

.wf-step {
  display: flex;
  gap: 18px;
  padding: 16px 0;
  border-bottom: 1px solid var(--border);
}

.wf-step:last-child { border-bottom: 0; }

.wf-num {
  flex: 0 0 34px;
  font-size: 13px;
  color: var(--accent);
  padding-top: 2px;
}

.wf-title {
  font-size: 13.5px;
  font-weight: 600;
  margin-bottom: 4px;
}

.wf-where {
  font-size: 10.5px;
  font-weight: 400;
  color: var(--faint);
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 1px 8px;
  margin-left: 8px;
}

.wf-text {
  font-size: 13px;
  color: var(--muted);
  line-height: 1.55;
}
</style>
