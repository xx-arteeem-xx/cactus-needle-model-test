<template>
  <div>
    <header class="header">
      <div class="wrap header-inner">
        <a href="#top" class="wordmark">needle<span class="dot">·</span>bench</a>
        <nav class="nav">
          <a href="#model">Модель</a>
          <a href="#workflow">Как идёт запрос</a>
          <a href="#scenarios">Сценарии</a>
          <a href="#lab">Эксперимент</a>
          <a href="#journal">Журнал</a>
          <a href="#summary">Сводка</a>
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

      <!-- ============ 02 WORKFLOW ============ -->
      <section id="workflow" class="section">
        <div class="section-head">
          <span class="section-index">02</span>
          <h2 class="section-title">Что происходит при прогоне</h2>
        </div>
        <p class="section-sub">
          У Needle нет свободного текстового промпта: «промпт» модели собирается из трёх
          частей — JSON-схем инструментов, фактов о среде и текста запроса. Из схем
          компилируется байтовая грамматика, которая ограничивает каждый токен декодирования,
          поэтому структура ответа корректна всегда. Полный путь запроса:
        </p>
        <WorkflowSteps />
      </section>

      <!-- ============ 03 SCENARIOS ============ -->
      <section id="scenarios" class="section">
        <div class="section-head">
          <span class="section-index">03</span>
          <h2 class="section-title">Сценарии регресса</h2>
        </div>
        <p class="section-sub">
          Протокол испытаний стенда: каждый сценарий — реальный запрос с зафиксированным
          ожиданием. Кнопка «Прогнать» отправляет запрос по полному контуру, ответ модели
          автоматически сверяется с ожиданием, вердикт сохраняется в базу.
        </p>

        <ScenarioBoard :scenarios="scenarios" :running="runningScenario" @run="runScenario" />
      </section>

      <!-- ============ 04 LAB ============ -->
      <section id="lab" class="section">
        <div class="section-head">
          <span class="section-index">04</span>
          <h2 class="section-title">Ручной эксперимент</h2>
        </div>
        <p class="section-sub">
          Произвольный запрос к любой поверхности. Справа — точный вид того, что уйдёт
          в модель: схемы инструментов, факты о среде и текст запроса.
        </p>

        <div class="lab-grid">
          <div>
            <GenerateForm
              v-if="catalog"
              :catalog="catalog"
              :submitting="submitting"
              @submit="runGeneration"
              @change="onSelectionChange"
            />
          </div>
          <PromptPanel
            v-if="catalog && selection"
            :catalog="catalog"
            :selection="selection"
          />
        </div>
      </section>

      <!-- ============ 05 JOURNAL ============ -->
      <section id="journal" class="section">
        <div class="section-head">
          <span class="section-index">05</span>
          <h2 class="section-title">Журнал испытаний</h2>
        </div>
        <p class="section-sub">
          Каждая запись — один прогон: исходный запрос, решение модели, обоснование
          аргументов, достоверность и тайминги. Данные читаются напрямую из PostgreSQL
          через второй эндпоинт бэкенда.
        </p>

        <GenerationList :items="generations" :loading="loadingList" />
      </section>

      <!-- ============ 06 SUMMARY ============ -->
      <section id="summary" class="section">
        <div class="section-head">
          <span class="section-index">06</span>
          <h2 class="section-title">Сводка по серии</h2>
        </div>
        <p class="section-sub">
          Агрегаты по всем прогонам текущей серии. Пересчитываются после каждого эксперимента;
          кеш на Redis обновляется при каждой записи.
        </p>

        <DashboardPanel :stats="stats" />
      </section>

      <!-- ============ 07 VERSIONS ============ -->
      <section id="versions" class="section">
        <div class="section-head">
          <span class="section-index">07</span>
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
import ScenarioBoard from './components/ScenarioBoard.vue';
import WorkflowSteps from './components/WorkflowSteps.vue';
import PromptPanel from './components/PromptPanel.vue';

export default {
  name: 'App',

  components: {
    GenerateForm,
    GenerationList,
    DashboardPanel,
    ChangelogPanel,
    ScenarioBoard,
    WorkflowSteps,
    PromptPanel,
  },

  data() {
    return {
      meta: null,
      generations: [],
      scenarios: [],
      stats: null,
      loadingList: false,
      submitting: false,
      runningScenario: null,
      loadError: null,
      selection: null,
    };
  },

  computed: {
    catalog() {
      return this.meta?.catalog || null;
    },
  },

  async created() {
    await this.loadMeta();
    this.selection = { mode: 'tools', surface: 'smart_home', systemFacts: '', prompt: '' };
    await this.refresh();
  },

  methods: {
    async loadMeta() {
      try {
        this.meta = await api.meta();
      } catch (e) {
        this.loadError = e.message;
      }
    },
    async refresh() {
      await Promise.all([
        this.loadGenerations(),
        this.loadScenarios(),
        this.loadStats(),
      ]);
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
    async loadScenarios() {
      try {
        const data = await api.scenarios();
        this.scenarios = data.items;
      } catch (e) {
        // scenarios are non-critical at page load
      }
    },
    async loadStats() {
      try {
        this.stats = await api.stats();
      } catch (e) {
        // dashboard is non-critical
      }
    },
    onSelectionChange(sel) {
      this.selection = sel;
    },
    async runGeneration(payload) {
      this.submitting = true;
      try {
        await api.generate(payload);
        await this.refresh();
      } finally {
        this.submitting = false;
      }
    },
    async runScenario(scenario) {
      this.runningScenario = scenario.id;
      try {
        await api.generate({
          scenario_id: scenario.id,
          prompt: scenario.prompt,
          mode: scenario.mode,
          toolset: scenario.toolset,
          schema_name: scenario.schema_name,
          system_facts: scenario.system_facts,
        });
        await this.refresh();
      } finally {
        this.runningScenario = null;
      }
    },
  },
};
</script>
