# Отчёт итерации 1 — v0.1.0

Дата: 2026-09-26 · Стенд: needle-bench · Модель: needle-3 (cactus-needle 3.0.1, движок 2.x linux-x86_64)

## Методика

Серия прогонов через полный контур: curl → Express → FastAPI → cactus-needle → PostgreSQL.
Каждый прогон фиксирует: вызовы, reasoning, confidence, латентность, prefill/decode tps,
оценку выходных токенов. Анализ по записям журнала (GET /api/generations).

## Результаты

### Tools: smart_home

| # | Запрос | Ожидание | Факт | Вердикт |
|---|--------|----------|------|---------|
| 1 | set the bedroom lights to 40 percent | on=true, brightness=40 | `on=false`, brightness=40, conf 0.56 | **ОШИБКА** — полярность булева поля не определена без глагола |
| 2 | it's freezing, warm up to 24 degrees | mode=heat | `mode=cool`, conf 1.0 | **ОШИБКА** — уверенная, систематическая |
| 3 | lock the front door and start cleaning the kitchen | 2 вызова по порядку | оба верны, conf 1.0 | OK |
| 4 | what's the weather in Paris tomorrow? | пусто (отказ) | пусто + внятный reasoning, conf 0.64 | OK — отказ без догадки |

### Tools: media_player

| # | Запрос | Факт | Вердикт |
|---|--------|------|---------|
| 5 | play some jazz | play_media(title="Jazz"), conf 1.0 | OK (допустимо) |
| 6 | turn the volume down | пусто + suppressed set_volume(level=30), conf 1.0 | OK — движок удержал выдуманный уровень |

### Tools: productivity / messaging

| # | Запрос | Факт | Вердикт |
|---|--------|------|---------|
| 7 | schedule a standup with the team tomorrow at 9 (+ facts) | error: token budget exhausted, 106 с | **ОШИБКА** — бюджет 512 токенов мал для вызова с массивом attendees |
| 8 | email the accountant about the Q3 report | subject/body заполнены из запроса, conf 1.0 | OK в рамках контракта «required refilled from request» |
| 9 | send @maria twenty bucks | amount=20, to=maria, conf 1.0 | OK («twenty»→20) |
| 10 | taxi office → airport, comfort | все поля верны, conf 1.0 | OK |

### Extract

| # | Схема | Факт | Вердикт |
|---|-------|------|---------|
| 11 | invoice | все поля верны, кроме `items[2].quantity=2` (delivery fee; должно быть 1); conf 0.38 корректно низкий | почти OK |
| 12 | contact | **null**: «Give me a call» прочитано как запрос на звонок; conf 0.99 на отказе | **ОШИБКА** — императив в тексте ломает извлечение |
| 13 | meeting_request | прогон не завершён (таймаут шелла), перенесён в итерацию 2 | — |
| 14 | support_ticket | прогон не завершён, перенесён в итерацию 2 | — |

### Мультиязычность

| # | Запрос | Факт | Вердикт |
|---|--------|------|---------|
| 15 | «включи свет на кухне…» (ru) | arm_security(away) — вызов не в тему, reasoning зациклен, 108 с | **ПРОВАЛ** — модель англоцентрична |

## Телеметрия

- decode tps: 2.7–8.9 ток/с (медленный CPU-движок, микроконтроллерный класс); латентность 4.5–106 с.
- Латентность растёт нелинейно при длинных выводах: бюджет 512 токенов при 5 ток/с ≈ 100 с.
- peak_ram_mb ≈ 160 МБ в сыром ответе движка.
- Confidence информативен: низкий (0.38, 0.56) совпал с реальными ошибками, ложный отказ в contact получил conf 0.99 — доверять только в связке с наличием вызова.

## Причины и правки для v0.2.0

1. **Булево полярное поле** — модель не может вывести polarity без глагола. Фикс: enum `action: [on, off]` в set_lights (правило «an enum moves to the one option the request names»). Прямые пробы подтвердили: 4/4 сценария света проходят.
2. **Термостат mode=cool на «warm up»** — систематическое смещение, 4 варианта формулировок описания не помогли. Фикс: значения enum = слова пользователя (`warm, cool, auto`) — «warm the place up» → mode=warm, conf 0.997. Правило гайда «names users would say» работает и на уровне значений.
3. **Ложный отказ извлечения на императивах** — описание тулов записи и system-facts не помогли. Фикс: catch-all `triggers: [".*"]` на инструменте записи (документированный механизм «триггер требует вызов») — contact извлекается, conf 0.80.
4. **Обрывы по бюджету** — DEFAULT_MAX_NEW_TOKENS 512 → 768.

## Что осталось open

- Русский текст: ограничение модели, стендом не компенсируется (фиксировать в выводах, не чинить).
- delivery fee quantity: проверить, воспроизводится ли после смены бюджета.
- meeting_request и support_ticket: прогнать в итерации 2.
- Медленный decode: это железный потолок движка, не параметр стенда.
