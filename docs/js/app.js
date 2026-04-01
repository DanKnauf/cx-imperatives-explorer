/**
 * CX Imperatives 2026 – Main Application
 * Navigation, state management, and UI orchestration
 */

'use strict';

(function () {

  // -------------------------------------------------------------------------
  // Module aliases
  // -------------------------------------------------------------------------

  const CONFIG = window.CX.CONFIG;
  const DU = window.CX.DataUtils;
  const Charts = window.CX.Charts;

  // -------------------------------------------------------------------------
  // Application state
  // -------------------------------------------------------------------------

  const state = {
    data: null,               // full survey JSON
    currentView: 'home',      // 'home' | 'explorer'
    currentSectionId: null,
    currentQuestionId: null,
    chartType: 'bar',
    dimension: 'by_category', // 'by_category' | 'by_sector'
    activityIndex: 0,
    visibleCols: [],
    sortMode: 'net_desc',
    sidebarOpen: false,
  };

  // ECharts instance
  let chartInstance = null;

  // -------------------------------------------------------------------------
  // DOM helpers
  // -------------------------------------------------------------------------

  const el = (id) => document.getElementById(id);
  const qs = (sel, root = document) => root.querySelector(sel);
  const qsa = (sel, root = document) => [...root.querySelectorAll(sel)];

  // -------------------------------------------------------------------------
  // Init
  // -------------------------------------------------------------------------

  const init = async () => {
    try {
      const resp = await fetch('data/survey-data.json');
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      state.data = await resp.json();
    } catch (err) {
      console.error('Failed to load survey data:', err);
      document.body.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:system-ui;color:#64748B;flex-direction:column;gap:12px">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="22" stroke="#E2E8F0" stroke-width="2"/><path d="M24 16v8M24 30v2" stroke="#64748B" stroke-width="2.5" stroke-linecap="round"/></svg>
          <p style="font-size:16px;font-weight:600;color:#1A202C">Could not load survey data</p>
          <p style="font-size:13px">Please ensure the app is served via a web server (not file://)</p>
          <code style="font-size:12px;background:#F4F6FA;padding:8px 16px;border-radius:6px">python -m http.server 8080</code>
        </div>`;
      return;
    }

    bindEvents();
    renderHomePage();
    navigateToHome();
  };

  // -------------------------------------------------------------------------
  // Navigation
  // -------------------------------------------------------------------------

  const navigateToHome = () => {
    state.currentView = 'home';
    state.currentSectionId = null;
    state.currentQuestionId = null;

    el('view-home').classList.add('active');
    el('view-explorer').classList.remove('active');

    // Update nav
    qsa('.nav-btn').forEach(b => b.classList.remove('active'));
    el('btn-home')?.classList.add('active');
  };

  const navigateToSection = (sectionId, questionId = null) => {
    if (!state.data) return;
    const section = state.data.sections.find(s => s.id === sectionId);
    if (!section) return;

    state.currentView = 'explorer';
    state.currentSectionId = sectionId;

    el('view-home').classList.remove('active');
    el('view-explorer').classList.add('active');

    // Update nav highlights
    qsa('.nav-btn').forEach(b => b.classList.remove('active'));
    const navMap = {
      'screening': 'btn-screening',
      'cx-activities': 'btn-cx',
      'personalization': 'btn-personalization',
      'digital-ai': 'btn-digital',
    };
    el(navMap[sectionId])?.classList.add('active');

    // Build sidebar
    buildSidebar(section);

    // Breadcrumb
    const meta = CONFIG.SECTION_META[sectionId] || {};
    el('sidebar-section-title').textContent = meta.shortTitle || section.title;
    el('breadcrumb-section').textContent = meta.shortTitle || section.title;

    // Load first question or specified one
    const targetId = questionId || section.questions[0]?.id;
    if (targetId) {
      loadQuestion(targetId);
    }
  };

  // -------------------------------------------------------------------------
  // Sidebar
  // -------------------------------------------------------------------------

  const buildSidebar = (section) => {
    const list = el('question-list');
    list.innerHTML = '';
    section.questions.forEach(q => {
      const item = document.createElement('div');
      item.className = 'question-list-item';
      item.dataset.questionId = q.id;
      item.setAttribute('role', 'button');
      item.setAttribute('tabindex', '0');
      item.setAttribute('aria-label', `${q.questionNumber}: ${q.text}`);

      const typeLabel = CONFIG.TYPE_LABELS[q.type] || q.type;
      item.innerHTML = `
        <span class="ql-num">${q.questionNumber}</span>
        <div>
          <div class="ql-text">${q.text}</div>
          <div class="ql-type">${typeLabel}</div>
        </div>`;

      item.addEventListener('click', () => loadQuestion(q.id));
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); loadQuestion(q.id); }
      });
      list.appendChild(item);
    });
  };

  const updateSidebarActive = (questionId) => {
    qsa('.question-list-item').forEach(item => {
      item.classList.toggle('active', item.dataset.questionId === questionId);
    });
    // Scroll active item into view
    const active = qs('.question-list-item.active');
    if (active) active.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  };

  // -------------------------------------------------------------------------
  // Question loading
  // -------------------------------------------------------------------------

  const loadQuestion = (questionId) => {
    if (!state.data || !state.currentSectionId) return;
    const section = state.data.sections.find(s => s.id === state.currentSectionId);
    if (!section) return;
    const question = section.questions.find(q => q.id === questionId);
    if (!question) return;

    state.currentQuestionId = questionId;

    updateSidebarActive(questionId);

    // Update question header
    el('question-number-badge').textContent = question.questionNumber;
    el('question-section-badge').textContent = CONFIG.SECTION_META[state.currentSectionId]?.shortTitle || '';
    el('question-text').textContent = question.text;

    // Reset activity index when switching questions
    state.activityIndex = 0;

    // Set up filter controls
    setupFilters(question);

    // Determine valid chart types
    const effectiveType = question.type;
    const validTypes = CONFIG.CHART_TYPES_FOR[effectiveType] || ['bar', 'table'];

    // Set default chart type
    const defaultType = CONFIG.DEFAULT_CHART_FOR[effectiveType] || 'bar';
    if (!validTypes.includes(state.chartType)) {
      state.chartType = defaultType;
    }

    // Update chart type switcher
    updateChartTypeSwitcher(validTypes, state.chartType);

    // Render
    renderCurrentChart(question);
  };

  // -------------------------------------------------------------------------
  // Filter controls
  // -------------------------------------------------------------------------

  const setupFilters = (question) => {
    const isDual = question.type === 'dual_crosstab';
    const isMultiActivity = question.type === 'by_sector_multi_activity';
    const isTopline = question.type === 'topline';
    const isCrosstab = !isTopline;

    // Dimension toggle (by_category vs by_sector)
    const dimGroup = el('dimension-toggle-group');
    dimGroup.style.display = isDual ? 'flex' : 'none';
    if (isDual) {
      el('dim-btn-category').classList.toggle('active', state.dimension === 'by_category');
      el('dim-btn-sector').classList.toggle('active', state.dimension === 'by_sector');
    }

    // Activity selector
    const actGroup = el('activity-selector-group');
    if (isMultiActivity) {
      actGroup.style.display = 'flex';
      const select = el('activity-select');
      select.innerHTML = '';
      (question.activities || []).forEach((act, i) => {
        const opt = document.createElement('option');
        opt.value = i;
        opt.textContent = act.activity;
        select.appendChild(opt);
      });
      select.value = state.activityIndex;
    } else {
      actGroup.style.display = 'none';
    }

    // Column chips
    const chipGroup = el('column-selector-group');
    if (isCrosstab) {
      chipGroup.style.display = 'flex';
      const resolved = DU.resolveQuestionData(question, state);
      const allCols = resolved.crossTabColumns || [];

      // Default visible cols
      if (!state.visibleCols || state.visibleCols.length === 0 || state._lastQuestionId !== state.currentQuestionId) {
        state.visibleCols = DU.defaultVisibleCols(allCols, resolved.responses, CONFIG.DEFAULT_VISIBLE_COLS);
        state._lastQuestionId = state.currentQuestionId;
      }

      buildColumnChips(allCols, state.visibleCols);
    } else {
      chipGroup.style.display = 'none';
      state.visibleCols = ['NET'];
    }
  };

  const buildColumnChips = (allCols, selectedCols) => {
    const container = el('column-chips');
    container.innerHTML = '';
    allCols.forEach(col => {
      const chip = document.createElement('button');
      chip.className = 'chip-btn' + (selectedCols.includes(col) ? ' selected' : '');
      chip.textContent = col === 'NET' ? 'NET (All)' : col;
      chip.dataset.col = col;
      chip.setAttribute('aria-pressed', selectedCols.includes(col) ? 'true' : 'false');
      chip.addEventListener('click', () => {
        const idx = state.visibleCols.indexOf(col);
        if (idx > -1) {
          if (state.visibleCols.length > 1) {
            state.visibleCols = state.visibleCols.filter(c => c !== col);
          }
        } else {
          state.visibleCols = [...state.visibleCols, col];
        }
        chip.classList.toggle('selected', state.visibleCols.includes(col));
        chip.setAttribute('aria-pressed', state.visibleCols.includes(col) ? 'true' : 'false');
        rerenderChart();
      });
      container.appendChild(chip);
    });
  };

  // -------------------------------------------------------------------------
  // Chart type switcher
  // -------------------------------------------------------------------------

  const updateChartTypeSwitcher = (validTypes, activeType) => {
    const switcher = el('chart-type-switcher');
    qsa('.chart-type-btn', switcher).forEach(btn => {
      const type = btn.dataset.type;
      const isValid = validTypes.includes(type);
      const isActive = type === activeType;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      btn.style.opacity = isValid ? '1' : '0.35';
      btn.style.pointerEvents = isValid ? 'auto' : 'none';
    });
  };

  // -------------------------------------------------------------------------
  // Chart rendering
  // -------------------------------------------------------------------------

  const ensureChartInstance = () => {
    const canvas = el('main-chart');
    if (!canvas) return null;
    if (!chartInstance || chartInstance.isDisposed()) {
      chartInstance = echarts.init(canvas, 'merkle');
      window.addEventListener('resize', () => {
        chartInstance?.resize();
      });
    }
    return chartInstance;
  };

  const renderCurrentChart = (question) => {
    const q = question || getCurrentQuestion();
    if (!q) return;

    const chartArea = el('chart-area');
    const mainChart = el('main-chart');
    const tableView = el('table-view');
    const placeholder = el('chart-placeholder');

    placeholder.style.display = 'none';

    const resolved = DU.resolveQuestionData(q, {
      dimension: state.dimension,
      activityIndex: state.activityIndex,
    });

    if (state.chartType === 'table') {
      mainChart.style.display = 'none';
      tableView.style.display = 'block';
      tableView.innerHTML = Charts.buildDataTable(resolved, state.visibleCols, state.sortMode);
      return;
    }

    mainChart.style.display = 'block';
    tableView.style.display = 'none';

    // Adjust canvas height based on data size
    const rowCount = resolved.responses?.length || 0;
    const colCount = (state.visibleCols?.length || 0) + 1;
    if (state.chartType === 'bar' || state.chartType === 'heatmap') {
      const h = Math.max(400, Math.min(720, rowCount * (colCount <= 2 ? 32 : colCount <= 5 ? 24 : 18) + 120));
      mainChart.style.height = h + 'px';
    } else if (state.chartType === 'pie') {
      mainChart.style.height = '420px';
    } else {
      mainChart.style.height = '500px';
    }

    const chart = ensureChartInstance();
    if (!chart) return;
    chart.resize();

    Charts.render(chart, state.chartType, resolved, state.visibleCols, state.sortMode, q.text);
  };

  const rerenderChart = () => {
    const q = getCurrentQuestion();
    if (q) renderCurrentChart(q);
  };

  const getCurrentQuestion = () => {
    if (!state.data || !state.currentSectionId || !state.currentQuestionId) return null;
    const section = state.data.sections.find(s => s.id === state.currentSectionId);
    return section?.questions.find(q => q.id === state.currentQuestionId) || null;
  };

  // -------------------------------------------------------------------------
  // Home page
  // -------------------------------------------------------------------------

  const renderHomePage = () => {
    // Hero chart
    const heroChartEl = el('hero-chart');
    if (heroChartEl && state.data) {
      const heroChart = echarts.init(heroChartEl, 'merkle');
      heroChart.setOption(Charts.buildHeroChart(state.data));
      window.addEventListener('resize', () => heroChart.resize());
    }

    // Insights
    if (state.data) {
      const insights = DU.extractInsights(state.data);
      const grid = el('insights-grid');
      if (grid) {
        grid.innerHTML = insights.map(ins => `
          <div class="insight-card">
            <div class="insight-pct">${DU.fmt(ins.pct, 0)}</div>
            <div class="insight-text">${ins.text}</div>
            <div class="insight-source">${ins.source}</div>
          </div>`).join('');
      }
    }
  };

  // -------------------------------------------------------------------------
  // Sidebar search
  // -------------------------------------------------------------------------

  const setupSearch = () => {
    const input = el('question-search');
    if (!input) return;
    input.addEventListener('input', () => {
      const query = input.value.toLowerCase().trim();
      qsa('.question-list-item').forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = !query || text.includes(query) ? 'flex' : 'none';
      });
    });
  };

  // -------------------------------------------------------------------------
  // Event binding
  // -------------------------------------------------------------------------

  const bindEvents = () => {
    // Nav buttons
    el('btn-home')?.addEventListener('click', navigateToHome);
    el('btn-screening')?.addEventListener('click', () => navigateToSection('screening'));
    el('btn-cx')?.addEventListener('click', () => navigateToSection('cx-activities'));
    el('btn-personalization')?.addEventListener('click', () => navigateToSection('personalization'));
    el('btn-digital')?.addEventListener('click', () => navigateToSection('digital-ai'));

    // Section cards on home page
    document.addEventListener('click', (e) => {
      const card = e.target.closest('.section-card');
      if (card) {
        navigateToSection(card.dataset.section);
      }
    });

    // Breadcrumb home
    el('breadcrumb-home')?.addEventListener('click', navigateToHome);

    // Chart type switcher
    el('chart-type-switcher')?.addEventListener('click', (e) => {
      const btn = e.target.closest('.chart-type-btn');
      if (!btn) return;
      const type = btn.dataset.type;
      if (!type) return;
      state.chartType = type;
      qsa('.chart-type-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.type === type);
        b.setAttribute('aria-pressed', b.dataset.type === type ? 'true' : 'false');
      });
      rerenderChart();
    });

    // Dimension toggle
    el('dim-btn-category')?.addEventListener('click', () => {
      state.dimension = 'by_category';
      state.visibleCols = [];
      el('dim-btn-category').classList.add('active');
      el('dim-btn-sector').classList.remove('active');
      const q = getCurrentQuestion();
      if (q) { setupFilters(q); rerenderChart(); }
    });

    el('dim-btn-sector')?.addEventListener('click', () => {
      state.dimension = 'by_sector';
      state.visibleCols = [];
      el('dim-btn-category').classList.remove('active');
      el('dim-btn-sector').classList.add('active');
      const q = getCurrentQuestion();
      if (q) { setupFilters(q); rerenderChart(); }
    });

    // Activity selector
    el('activity-select')?.addEventListener('change', (e) => {
      state.activityIndex = parseInt(e.target.value, 10);
      state.visibleCols = [];
      const q = getCurrentQuestion();
      if (q) { setupFilters(q); rerenderChart(); }
    });

    // Sort
    el('sort-select')?.addEventListener('change', (e) => {
      state.sortMode = e.target.value;
      rerenderChart();
    });

    // Column chips: select all / clear
    el('btn-select-all-cols')?.addEventListener('click', () => {
      const q = getCurrentQuestion();
      if (!q) return;
      const resolved = DU.resolveQuestionData(q, state);
      state.visibleCols = [...(resolved.crossTabColumns || [])];
      buildColumnChips(resolved.crossTabColumns || [], state.visibleCols);
      rerenderChart();
    });

    el('btn-clear-cols')?.addEventListener('click', () => {
      const q = getCurrentQuestion();
      if (!q) return;
      const resolved = DU.resolveQuestionData(q, state);
      const allCols = resolved.crossTabColumns || [];
      // Keep at least NET
      state.visibleCols = allCols.includes('NET') ? ['NET'] : [allCols[0]];
      buildColumnChips(allCols, state.visibleCols);
      rerenderChart();
    });

    // Export: PNG
    el('btn-download-png')?.addEventListener('click', () => {
      if (chartInstance && !chartInstance.isDisposed()) {
        const url = chartInstance.getDataURL({
          type: 'png',
          pixelRatio: 2,
          backgroundColor: '#FFFFFF',
        });
        const a = document.createElement('a');
        a.href = url;
        a.download = `cx-imperatives-${state.currentQuestionId || 'chart'}.png`;
        a.click();
      }
    });

    // Export: CSV
    el('btn-download-csv')?.addEventListener('click', () => {
      const q = getCurrentQuestion();
      if (!q) return;
      const resolved = DU.resolveQuestionData(q, state);
      const csv = DU.buildCsv(resolved, state.visibleCols, q.text);
      DU.downloadCsv(csv, `cx-imperatives-${state.currentQuestionId || 'data'}.csv`);
    });

    // Sidebar toggle (desktop)
    el('sidebar-toggle')?.addEventListener('click', () => {
      const sidebar = qs('.explorer-sidebar');
      sidebar?.classList.toggle('collapsed');
    });

    // Mobile menu
    const mobileBtn = el('mobile-menu-btn');
    mobileBtn?.addEventListener('click', () => {
      state.sidebarOpen = !state.sidebarOpen;
      qs('.explorer-sidebar')?.classList.toggle('open', state.sidebarOpen);
      mobileBtn.setAttribute('aria-expanded', state.sidebarOpen ? 'true' : 'false');
    });

    // Close mobile sidebar on outside click
    document.addEventListener('click', (e) => {
      if (state.sidebarOpen && !e.target.closest('.explorer-sidebar') && !e.target.closest('#mobile-menu-btn')) {
        state.sidebarOpen = false;
        qs('.explorer-sidebar')?.classList.remove('open');
        mobileBtn?.setAttribute('aria-expanded', 'false');
      }
    });

    // Section card keyboard support
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        const card = e.target.closest('.section-card');
        if (card) {
          e.preventDefault();
          navigateToSection(card.dataset.section);
        }
      }
    });

    // Search
    setupSearch();
  };

  // -------------------------------------------------------------------------
  // Boot
  // -------------------------------------------------------------------------

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
