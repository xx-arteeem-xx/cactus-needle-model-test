# Needle Bench

Испытательный стенд для инструментальной оценки [Needle 3](https://github.com/cactus-compute/needle) —
компактной базовой модели автоматизации от Cactus Compute (121M параметров, 2-битное квантование,
35 МБ весов). Стенд прогоняет модель через контролируемые сценарии вызова инструментов и
структурного извлечения данных и сохраняет каждый ответ с полной телеметрией.

## Архитектура

```
┌─────────────┐   /api    ┌─────────────┐  /infer  ┌──────────────┐
│  front       │ ───────▶ │  back        │ ───────▶ │  llm          │
│  Vue 3       │          │  Express     │          │  FastAPI      │
│  (nginx)     │          │              │          │  cactus-needle│
└─────────────┘           └──────┬───────┘          └──────┬───────┘
                                 │                         │ engine + weights
                          ┌──────┴───────┐                 │ (HF, в образе)
                          │ db    redis  │                 ▼
                          │ PostgreSQL   │           cpu inference
                          └──────────────┘
```

- **front** — Vue 3 (Options API) + Vite, раздаётся nginx; `/api` проксируется в бэк.
- **back** — Express: `POST /api/generate` (прогон + запись в БД), `GET /api/generations`
  (журнал), `GET /api/stats` (агрегаты), `GET /api/meta` (версия + changelog + каталог
  поверхностей), `DELETE /api/generations` (очистка серии). Кеш чтения — Redis.
- **llm** — FastAPI-обёртка над `cactus-needle`: два режима (`tools`, `extract`),
  сериализация вызовов локом, прогрев движка на старте. Engine и веса зашиты в образ.
- **db** — PostgreSQL 16, схема в `db/init.sql`.
- **redis** — кеш журнала и агрегатов с инвалидацией на записи.

## Запуск

```bash
docker compose up -d --build
```

Фронт: http://localhost:8088 · Бэк: http://127.0.0.1:3100 · LLM: http://127.0.0.1:8100

Первый старт: контейнер `llm` греет движок ~1–2 минуты (healthcheck `start_period: 120s`),
остальные сервисы поднимаются за секунды.

## Переменные окружения

Лежат в `env/`, коммитятся, названы по сервисам: `front.env`, `back.env`, `llm.env`,
`db.env`, `redis.env`. Пароли сгенерированы, плейсхолдеров нет.

## Поверхности испытаний

**Инструменты (mode=tools)** — модель выбирает вызов и заполняет аргументы:
`smart_home` (свет, термостат, замок, пылесос, охрана), `media_player`,
`productivity`, `messaging & payments`.

**Извлечение (mode=extract)** — схема как единственный инструмент с catch-all триггером:
`invoice`, `contact`, `meeting_request`, `support_ticket`.

## Метрики прогона

`latency_ms` (движок), `roundtrip_ms` (весь контур), `prefill_tps`, `decode_tps`,
`est_output_tokens`, `confidence` (калиброванная оценка модели), `reasoning`
(обоснование каждого аргумента), сырой ответ движка в `response`.

## Версии и итерации

Версия стенда = итерация испытаний (`PROJECT_VERSION` в `env/back.env`).
История — в `CHANGELOG.md` и на странице стенда (раздел «Версии»).
Отчёты по итерациям — в `reports/`. Между итерациями база очищается.
