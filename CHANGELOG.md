# Changelog — Needle Bench

Версии стенда = итерации испытаний модели. Между итерациями база очищается.

## 0.1.0 — 2026-09-26

Первичная сборка стенда.

- Стенд развёрнут: Vue 3 + Express + PostgreSQL + Redis + FastAPI-обёртка над cactus-needle 3.0.5.
- Четыре поверхности инструментов: smart home, media player, productivity, messaging & payments.
- Четыре схемы извлечения: invoice, contact, meeting request, support ticket.
- Метрики каждого вызова: латентность, prefill/decode tps, оценка выходных токенов, confidence.
- Журнал испытаний и сводный дашборд на странице стенда.
