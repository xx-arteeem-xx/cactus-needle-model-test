<template>
  <div>
    <header class="header">
      <div class="wrap header-inner">
        <a href="#top" class="wordmark">needle<span class="dot">·</span>bench</a>
        <nav class="nav">
          <a href="#model">Модель</a>
          <a href="#lab">Эксперимент</a>
          <a href="#journal">Журнал</a>
          <a href="#summary">Сводка</a>
          <a href="#versions">Версии</a>
          <span v-if="meta" class="version-pill">v{{ meta.version }}</span>
        </nav>
      </div>
    </header>

    <div id="top" class="wrap">
      <div v-if="loadError" class="alert" style="margin-top: 24px">
        Бэкенд недоступен: {{ loadError }}. Проверьте, что стенд поднят (docker compose up).
      </div>

      <!-- ============ HERO ============ -->
      <section class="hero">
        <div class="hero-kicker">Открытый испытательный стенд · Cactus Needle 3</div>
        <h1>Модель на 35&nbsp;МБ.<br /><span class="dim">Проверяем на деле.</span></h1>
        <p class="hero-lead">
          <b>Needle 3</b> — базовая модель автоматизации от Cactus Compute, рассчитанная на
          телефоны, носимые устройства и микроконтроллеры. Стенд прогоняет её через
          контролируемые сценарии вызова инструментов и извлечения данных и публикует
          каждый ответ вместе с полной телеметрией: латентностью, скоростью декодирования
          и оценкой достоверности.
        </p>

        <div class="spec-strip">
          <div class="spec-cell">
            <div class="spec-value">35 МБ</div>
            <div class="spec-label">вес архива needle3.cact</div>
          </div>
          <div class="spec-cell">
            <div class="spec-value">2 бита</div>
            <div class="spec-label">на один весовой коэффициент</div>
          </div>
          <div class="spec-cell">
            <div class="spec-value">121M</div>
            <div class="spec-label">параметров, лестница до 20 слоёв</div>
          </div>
          <div class="spec-cell">
            <div class="spec-value">JSON</div>
            <div class="spec-label">гарантированная грамматикой структура ответа</div>
          </div>
        </div>
      </section>

      <!-- ============ 01 MODEL ============ -->
      <section id="model" class="section">
        <div class="section-head">
          <span class="section-index">01</span>
          <h2 class="section-title">Что умеет модель</h2>
        </div>
        <p class="section-sub">
          Needle 3 обучена не вести свободный диалог, а решать две прикладные задачи.
          Грамматика декодирования компилируется из схемы каждого запроса, поэтому
          структура ответа корректна по построению — вариативным остаётся только содержание.
          Каждый ответ снабжён калиброванной оценкой достоверности и кратким обоснованием,
          из какого фрагмента запроса взят каждый аргумент.
        </p>
        <div class="card">
          <ul class="checklist">
            <li>Выбор инструмента из набора и заполнение аргументов по тексту пользователя.</li>
            <li>Отказ без догадок: внеконтекстный запрос возвращает пустой список вызовов.</li>
            <li>Извлечение типизированных полей из неупорядоченного текста по схеме.</li>
            <li>Разрешение относительных дат («завтра в семь») при наличии фактов о среде.</li>
            <li>Соблюдение ограничений схемы: границы чисел, перечисления, обязательные поля.</li>
            <li>Удержание вызовов с низкой достоверностью вместо рискованного исполнения.</li>
          </ul>
        </div>
      </section>

      <!-- ============ 02 LAB ============ -->
      <section id="lab" class="section">
        <div class="section-head">
          <span class="section-index">02</span>
          <h2 class="section-title">Эксперимент</h2>
        </div>
        <p class="section-sub">
          Запрос уходит в бэкенд, передаётся модели и возвращается записью: решение,
          обоснование аргументов, достоверность, тайминги и скорость декодирования.
          Прогон сохраняется в базу и попадает в журнал испытаний ниже.
        </p>

        <div class="steps">
          <div class="step">
            <div class="step-num">ШАГ 1</div>
            <div class="step-title">Запрос</div>
            <div class="step-text">
              Команда для инструментов или исходный текст для извлечения — в свободной форме.
            </div>
          </div>
          <div class="step">
            <div class="step-num">ШАГ 2</div>
            <div class="step-title">Поверхность</div>
            <div class="step-text">
              Набор инструментов (умный дом, медиа, продуктивность, платежи) или схема извлечения.
            </div>
          </div>
          <div class="step">
            <div class="step-num">ШАГ 3</div>
            <div class="step-title">Прогон</div>
            <div class="step-text">
              Ответ появится в карточке под формой и строкой в журнале испытаний.
            </div>
          </div>
        </div>

        <GenerateForm
          v-if="catalog"
          :catalog="catalog"
          :submitting="submitting"
          @submit="runGeneration"
        />
      </section>

      <!-- ============ 03 JOURNAL ============ -->
      <section id="journal" class="section">
        <div class="section-head">
          <span class="section-index">03</span>
          <h2 class="section-title">Журнал испытаний</h2>
        </div>
        <p class="section-sub">
          Каждая запись — один прогон: исходный запрос, решение модели, обоснование
          аргументов, достоверность и тайминги. Данные читаются напрямую из PostgreSQL
          через второй эндпоинт бэкенда.
        </p>

        <GenerationList :items="generations" :loading="loadingList" />
      </section>

      <!-- ============ 04 SUMMARY ============ -->
      <section id="summary" class="section">
        <div class="section-head">
          <span class="section-index">04</span>
          <h2 class="section-title">Сводка по серии</h2>
        </div>
        <p class="section-sub">
          Агрегаты по всем прогонам текущей серии. Пересчитываются после каждого эксперимента;
          кеш на Redis обновляется при каждой записи.
        </p>

        <DashboardPanel :stats="stats" />
      </section>

      <!-- ============ 05 VERSIONS ============ -->
      <section id="versions" class="section">
        <div class="section-head">
          <span class="section-index">05</span>
          <h2 class="section-title">Версии стенда</h2>
        </div>
        <p class="section-sub">
          Номер версии совпадает с итерацией испытаний: изменения поверхностей инструментов,
          схем и настроек декодирования фиксируются в журнале версий. База данных между
          итерациями очищается, чтобы метрики серий оставались сопоставимыми.
        </p>

        <ChangelogPanel v-if="meta" :changelog="meta.changelog" />
      </section>

      <footer class="footer">
        <div class="footer-inner">
          <div>
            needle·bench — локальный стенд инструментальной оценки Needle 3.
            Модель и движок: <span class="mono">cactus-needle</span>, Apache-2.0.
          </div>
          <div class="mono">vue 3 · express · postgresql · redis · fastapi</div>
        </div>
      </footer>
    </div>
  </div>
</template>

<script>
import { api } from './api.js';
import GenerateForm from './components/GenerateForm.vue';
import GenerationList from './components/GenerationList.vue';
import DashboardPanel from './components/DashboardPanel.vue';
import ChangelogPanel from './components/ChangelogPanel.vue';

export default {
  name: 'App',

  components: {
    GenerateForm,
    GenerationList,
    DashboardPanel,
    ChangelogPanel,
  },

  data() {
    return {
      meta: null,
      generations: [],
      stats: null,
      loadingList: false,
      submitting: false,
      loadError: null,
      lastError: null,
    };
  },

  computed: {
    catalog() {
      return this.meta?.catalog || null;
    },
  },

  async created() {
    await this.loadMeta();
    await Promise.all([this.loadGenerations(), this.loadStats()]);
  },

  methods: {
    async loadMeta() {
      try {
        this.meta = await api.meta();
      } catch (e) {
        this.loadError = e.message;
      }
    },
    async loadGenerations() {
      this.loadingList = true;
      try {
        const data = await api.generations(50);
        this.generations = data.items;
      } catch (e) {
        this.loadError = e.message;
      } finally {
        this.loadingList = false;
      }
    },
    async loadStats() {
      try {
        this.stats = await api.stats();
      } catch (e) {
        // dashboard is non-critical
      }
    },
    async runGeneration(payload) {
      this.submitting = true;
      this.lastError = null;
      try {
        await api.generate(payload);
        await Promise.all([this.loadGenerations(), this.loadStats()]);
      } catch (e) {
        this.lastError = e.message;
        throw e;
      } finally {
        this.submitting = false;
      }
    },
  },
};
</script>
