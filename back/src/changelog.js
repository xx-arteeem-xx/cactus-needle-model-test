// Проектные версии стенда. Каждая итерация тестирования модели = отдельная версия.
// Файл читается бэкендом и отдаётся фронту через GET /api/meta.

export const CHANGELOG = [
  {
    version: '0.1.0',
    date: '2026-09-26',
    title: 'Первичная сборка стенда',
    items: [
      'Стенд развёрнут: Vue 3 + Express + PostgreSQL + Redis + FastAPI-обёртка над cactus-needle 3.0.5.',
      'Четыре поверхности инструментов: smart home, media player, productivity, messaging & payments.',
      'Четыре схемы извлечения: invoice, contact, meeting request, support ticket.',
      'Метрики каждого вызова: латентность, prefill/decode tps, оценка выходных токенов, confidence.',
      'Журнал испытаний и сводный дашборд на странице стенда.',
    ],
  },
];
