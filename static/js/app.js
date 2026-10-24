/**
 * StyleScope AI — Frontend Application Logic (Vanilla JavaScript)
 * Milestone 1: CSS Parser & Groq AI Auditor
 */

document.addEventListener('DOMContentLoaded', () => {
  // -------------------------------------------------------------------------
  // State Management
  // -------------------------------------------------------------------------
  const state = {
    activeTab: 'upload', // 'upload' | 'editor'
    selectedFile: null,
    cssText: '',
    parsedData: null,
    aiReviewData: null,
    activeCategoryFilter: 'all',
    searchQuery: '',
    sortBy: 'original',
    viewMode: 'cards', // 'cards' | 'table' | 'json'
    theme: localStorage.getItem('stylescope_theme') || 'dark',
    isProcessing: false,
  };

  // -------------------------------------------------------------------------
  // DOM Elements
  // -------------------------------------------------------------------------
  const elements = {
    // Theme & Navigation
    html: document.documentElement,
    themeToggleBtn: document.getElementById('theme-toggle-btn'),
    serverStatusPill: document.getElementById('server-status-pill'),
    serverStatusDot: document.getElementById('server-status-dot'),
    serverStatusLabel: document.getElementById('server-status-label'),
    modelPill: document.getElementById('model-pill'),
    helpModalTriggerBtn: document.getElementById('help-modal-trigger-btn'),
    helpModal: document.getElementById('help-modal'),
    modalCloseBtn: document.getElementById('modal-close-btn'),
    modalAckBtn: document.getElementById('modal-ack-btn'),

    // Hero & Quick Actions
    quickSampleBtn: document.getElementById('quick-sample-btn'),

    // Tabs
    tabUploadBtn: document.getElementById('tab-upload-btn'),
    tabEditorBtn: document.getElementById('tab-editor-btn'),
    panelUpload: document.getElementById('panel-upload'),
    panelEditor: document.getElementById('panel-editor'),
    clearInputBtn: document.getElementById('clear-input-btn'),

    // Dropzone
    dropzone: document.getElementById('dropzone'),
    fileInput: document.getElementById('file-input'),
    dropzoneEmptyState: document.getElementById('dropzone-empty-state'),
    fileLoadedState: document.getElementById('file-loaded-state'),
    loadedFilename: document.getElementById('loaded-filename'),
    loadedFilesize: document.getElementById('loaded-filesize'),
    removeFileBtn: document.getElementById('remove-file-btn'),

    // Code Editor
    editorGutter: document.getElementById('editor-gutter'),
    cssCodeEditor: document.getElementById('css-code-editor'),
    editorLineCount: document.getElementById('editor-line-count'),
    editorCharCount: document.getElementById('editor-char-count'),
    formatCssBtn: document.getElementById('format-css-btn'),

    // Action Execution
    actionSpinner: document.getElementById('action-spinner'),
    actionStatusMsg: document.getElementById('action-status-message'),
    parseBtn: document.getElementById('parse-btn'),
    analyzeBtn: document.getElementById('analyze-btn'),

    // Metrics Dashboard
    metricsDashboard: document.getElementById('metrics-dashboard'),
    metricTotalRules: document.getElementById('metric-total-rules'),
    metricTotalProps: document.getElementById('metric-total-props'),
    metricAvgProps: document.getElementById('metric-avg-props'),
    metricMaxProps: document.getElementById('metric-max-props'),
    metricTime: document.getElementById('metric-time'),

    // AI Review Section
    aiReviewSection: document.getElementById('ai-review-section'),
    aiSummaryText: document.getElementById('ai-summary-text'),
    aiSuggestionsList: document.getElementById('ai-suggestions-list'),
    aiAccessibilityList: document.getElementById('ai-accessibility-list'),
    aiBestPracticesList: document.getElementById('ai-best-practices-list'),
    suggestionsCount: document.getElementById('suggestions-count'),
    a11yCount: document.getElementById('a11y-count'),
    bestPracticesCount: document.getElementById('best-practices-count'),
    copyAiBtn: document.getElementById('copy-ai-btn'),
    exportAiMdBtn: document.getElementById('export-ai-md-btn'),

    // Rules Explorer
    rulesSection: document.getElementById('rules-section'),
    visibleRulesCount: document.getElementById('visible-rules-count'),
    ruleSearchInput: document.getElementById('rule-search-input'),
    clearSearchBtn: document.getElementById('clear-search-btn'),
    ruleSortSelect: document.getElementById('rule-sort-select'),
    viewCardsBtn: document.getElementById('view-cards-btn'),
    viewTableBtn: document.getElementById('view-table-btn'),
    viewJsonBtn: document.getElementById('view-json-btn'),
    exportJsonBtn: document.getElementById('export-json-btn'),
    categoryFiltersBar: document.getElementById('category-filters-bar'),
    rulesCardsContainer: document.getElementById('rules-cards-container'),
    rulesTableContainer: document.getElementById('rules-table-container'),
    rulesTableBody: document.getElementById('rules-table-body'),
    rulesJsonContainer: document.getElementById('rules-json-container'),
    rawJsonOutput: document.getElementById('raw-json-output'),
    copyJsonBtn: document.getElementById('copy-json-btn'),
    emptyRulesState: document.getElementById('empty-rules-state'),
    resetFilterBtn: document.getElementById('reset-filter-btn'),

    // Toast Container
    toastContainer: document.getElementById('toast-container'),
  };

  // -------------------------------------------------------------------------
  // Initialization
  // -------------------------------------------------------------------------
  function init() {
    applyTheme(state.theme);
    checkServerHealth();
    setupEventListeners();
    updateEditorStats();
  }

  // -------------------------------------------------------------------------
  // Theme Handling
  // -------------------------------------------------------------------------
  function applyTheme(theme) {
    state.theme = theme;
    elements.html.setAttribute('data-theme', theme);
    localStorage.setItem('stylescope_theme', theme);
  }

  function toggleTheme() {
    const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme);
    showToast(`Switched to ${nextTheme} theme`, 'info', 2000);
  }

  // -------------------------------------------------------------------------
  // Server Health Probe
  // -------------------------------------------------------------------------
  async function checkServerHealth() {
    const startTime = performance.now();
    try {
      const response = await fetch('/api/health');
      const latency = Math.round(performance.now() - startTime);

      if (response.ok) {
        elements.serverStatusPill.className = 'status-pill';
        elements.serverStatusDot.className = 'status-dot pulsing';
        elements.serverStatusLabel.textContent = `API Ready (${latency}ms)`;
        elements.serverStatusPill.title = `FastAPI backend is responsive. Latency: ${latency}ms`;
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (err) {
      elements.serverStatusPill.className = 'status-pill error';
      elements.serverStatusDot.className = 'status-dot';
      elements.serverStatusLabel.textContent = 'API Offline';
      elements.serverStatusPill.title = `Could not connect to FastAPI: ${err.message}`;
    }
  }

  // -------------------------------------------------------------------------
  // Toast Notifications
  // -------------------------------------------------------------------------
  function showToast(message, type = 'info', duration = 3500) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let iconSvg = '';
    if (type === 'success') {
      iconSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
    } else if (type === 'error') {
      iconSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
    } else {
      iconSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
    }

    toast.innerHTML = `${iconSvg}<span>${escapeHtml(message)}</span>`;
    elements.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'toastOut 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, duration);
  }

  // -------------------------------------------------------------------------
  // Event Listeners Setup
  // -------------------------------------------------------------------------
  function setupEventListeners() {
    // Theme toggle
    elements.themeToggleBtn.addEventListener('click', toggleTheme);

    // Help Modal
    elements.helpModalTriggerBtn.addEventListener('click', () => {
      elements.helpModal.classList.remove('hidden');
    });
    elements.modalCloseBtn.addEventListener('click', () => {
      elements.helpModal.classList.add('hidden');
    });
    elements.modalAckBtn.addEventListener('click', () => {
      elements.helpModal.classList.add('hidden');
    });
    elements.helpModal.addEventListener('click', (e) => {
      if (e.target === elements.helpModal) {
        elements.helpModal.classList.add('hidden');
      }
    });

    // Quick Sample Loading
    elements.quickSampleBtn.addEventListener('click', loadSampleCssFixture);

    // Tabs
    elements.tabUploadBtn.addEventListener('click', () => switchTab('upload'));
    elements.tabEditorBtn.addEventListener('click', () => switchTab('editor'));

    // Clear Button
    elements.clearInputBtn.addEventListener('click', clearCurrentInput);

    // Dropzone & File Input
    elements.dropzone.addEventListener('click', (e) => {
      if (!e.target.closest('#remove-file-btn')) {
        elements.fileInput.click();
      }
    });
    elements.fileInput.addEventListener('change', handleFileInputChange);

    // Drag and drop
    ['dragenter', 'dragover'].forEach((eventName) => {
      elements.dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        elements.dropzone.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach((eventName) => {
      elements.dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        elements.dropzone.classList.remove('dragover');
      });
    });

    elements.dropzone.addEventListener('drop', handleFileDrop);
    elements.removeFileBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      clearFileInput();
    });

    // Code Editor
    elements.cssCodeEditor.addEventListener('input', () => {
      updateEditorStats();
      syncGutter();
    });
    elements.cssCodeEditor.addEventListener('scroll', () => {
      elements.editorGutter.scrollTop = elements.cssCodeEditor.scrollTop;
    });
    elements.formatCssBtn.addEventListener('click', formatCssCode);

    // Keyboard Shortcuts (Ctrl+Enter to Parse, Ctrl+Shift+Enter for AI)
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (e.shiftKey) {
          executeParseAndAnalyze();
        } else {
          executeParseRules();
        }
      }
    });

    // Execution Buttons
    elements.parseBtn.addEventListener('click', executeParseRules);
    elements.analyzeBtn.addEventListener('click', executeParseAndAnalyze);

    // Rules Search & Filter
    elements.ruleSearchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value.trim().toLowerCase();
      elements.clearSearchBtn.classList.toggle('hidden', state.searchQuery === '');
      renderRulesView();
    });
    elements.clearSearchBtn.addEventListener('click', () => {
      elements.ruleSearchInput.value = '';
      state.searchQuery = '';
      elements.clearSearchBtn.classList.add('hidden');
      renderRulesView();
      elements.ruleSearchInput.focus();
    });

    // Sort Dropdown
    elements.ruleSortSelect.addEventListener('change', (e) => {
      state.sortBy = e.target.value;
      renderRulesView();
    });

    // Category Filter Pills
    elements.categoryFiltersBar.addEventListener('click', (e) => {
      const pill = e.target.closest('.filter-pill');
      if (!pill) return;

      document.querySelectorAll('.filter-pill').forEach((p) => p.classList.remove('active'));
      pill.classList.add('active');
      state.activeCategoryFilter = pill.dataset.filter || 'all';
      renderRulesView();
    });

    // Reset Filters
    elements.resetFilterBtn.addEventListener('click', () => {
      state.searchQuery = '';
      elements.ruleSearchInput.value = '';
      elements.clearSearchBtn.classList.add('hidden');
      state.activeCategoryFilter = 'all';
      document.querySelectorAll('.filter-pill').forEach((p) => {
        p.classList.toggle('active', p.dataset.filter === 'all');
      });
      renderRulesView();
    });

    // View Mode Toggle
    elements.viewCardsBtn.addEventListener('click', () => switchViewMode('cards'));
    elements.viewTableBtn.addEventListener('click', () => switchViewMode('table'));
    elements.viewJsonBtn.addEventListener('click', () => switchViewMode('json'));

    // Export & Copy
    elements.exportJsonBtn.addEventListener('click', exportParsedJson);
    elements.copyJsonBtn.addEventListener('click', copyParsedJson);
    elements.copyAiBtn.addEventListener('click', copyAiReview);
    elements.exportAiMdBtn.addEventListener('click', exportAiReviewMarkdown);
  }

  // -------------------------------------------------------------------------
  // Tab Switching
  // -------------------------------------------------------------------------
  function switchTab(tab) {
    state.activeTab = tab;
    if (tab === 'upload') {
      elements.tabUploadBtn.classList.add('active');
      elements.tabUploadBtn.setAttribute('aria-selected', 'true');
      elements.panelUpload.classList.add('active');

      elements.tabEditorBtn.classList.remove('active');
      elements.tabEditorBtn.setAttribute('aria-selected', 'false');
      elements.panelEditor.classList.remove('active');
    } else {
      elements.tabEditorBtn.classList.add('active');
      elements.tabEditorBtn.setAttribute('aria-selected', 'true');
      elements.panelEditor.classList.add('active');

      elements.tabUploadBtn.classList.remove('active');
      elements.tabUploadBtn.setAttribute('aria-selected', 'false');
      elements.panelUpload.classList.remove('active');
      syncGutter();
      elements.cssCodeEditor.focus();
    }
  }

  function clearCurrentInput() {
    if (state.activeTab === 'upload') {
      clearFileInput();
      showToast('Cleared uploaded file', 'info', 2000);
    } else {
      elements.cssCodeEditor.value = '';
      updateEditorStats();
      syncGutter();
      showToast('Cleared CSS editor', 'info', 2000);
    }
  }

  // -------------------------------------------------------------------------
  // File Upload Handlers
  // -------------------------------------------------------------------------
  function handleFileInputChange(e) {
    const file = e.target.files[0];
    if (file) {
      processSelectedFile(file);
    }
  }

  function handleFileDrop(e) {
    const file = e.dataTransfer.files[0];
    if (file) {
      processSelectedFile(file);
    }
  }

  function processSelectedFile(file) {
    if (!file.name.toLowerCase().endsWith('.css')) {
      showToast(`Invalid file type: "${file.name}". Please upload a .css file.`, 'error', 4000);
      return;
    }

    state.selectedFile = file;
    elements.loadedFilename.textContent = file.name;
    elements.loadedFilesize.textContent = formatBytes(file.size);

    elements.dropzoneEmptyState.classList.add('hidden');
    elements.fileLoadedState.classList.remove('hidden');

    elements.actionStatusMsg.textContent = `File ready: ${file.name} (${formatBytes(file.size)})`;
    showToast(`Loaded "${file.name}"`, 'success', 2500);

    // Also populate the editor with the file contents for convenience
    const reader = new FileReader();
    reader.onload = (e) => {
      elements.cssCodeEditor.value = e.target.result;
      updateEditorStats();
      syncGutter();
    };
    reader.readAsText(file);
  }

  function clearFileInput() {
    state.selectedFile = null;
    elements.fileInput.value = '';
    elements.dropzoneEmptyState.classList.remove('hidden');
    elements.fileLoadedState.classList.add('hidden');
    elements.actionStatusMsg.textContent = 'Ready to parse. Select a file or paste CSS.';
  }

  // -------------------------------------------------------------------------
  // Code Editor Helpers
  // -------------------------------------------------------------------------
  function updateEditorStats() {
    const content = elements.cssCodeEditor.value;
    const lines = content.length > 0 ? content.split('\n').length : 1;
    const chars = content.length;

    elements.editorLineCount.textContent = `${lines} ${lines === 1 ? 'line' : 'lines'}`;
    elements.editorCharCount.textContent = `${chars} chars`;
  }

  function syncGutter() {
    const content = elements.cssCodeEditor.value;
    const lines = content.length > 0 ? content.split('\n').length : 1;
    let gutterHtml = '';
    for (let i = 1; i <= lines; i++) {
      gutterHtml += `<div>${i}</div>`;
    }
    elements.editorGutter.innerHTML = gutterHtml;
  }

  function formatCssCode() {
    let css = elements.cssCodeEditor.value;
    if (!css.trim()) {
      showToast('Editor is empty', 'info', 2000);
      return;
    }

    // Clean formatting: normalize indentation
    try {
      css = css.replace(/\s*\{\s*/g, ' {\n    ')
               .replace(/;\s*/g, ';\n    ')
               .replace(/\s*\}\s*/g, '\n}\n\n')
               .replace(/\n\s*\n\s*\n/g, '\n\n')
               .trim();

      elements.cssCodeEditor.value = css;
      updateEditorStats();
      syncGutter();
      showToast('CSS formatting applied', 'success', 2000);
    } catch (err) {
      showToast('Could not format CSS', 'error', 2000);
    }
  }

  // -------------------------------------------------------------------------
  // Load Sample Fixture
  // -------------------------------------------------------------------------
  async function loadSampleCssFixture() {
    try {
      elements.actionStatusMsg.textContent = 'Fetching sample.css fixture...';
      const res = await fetch('/api/sample-css');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      // Populate editor
      elements.cssCodeEditor.value = data.content;
      updateEditorStats();
      syncGutter();

      // Create a virtual File object for upload tab
      const sampleFile = new File([data.content], data.filename, { type: 'text/css' });
      processSelectedFile(sampleFile);

      showToast('sample.css fixture loaded (14 rules ready)', 'success', 3000);

      // Trigger instant parse to delight the user immediately
      executeParseRules();
    } catch (err) {
      showToast(`Failed to load sample.css: ${err.message}`, 'error', 3500);
    }
  }

  // -------------------------------------------------------------------------
  // Execution: Parse Rules Only
  // -------------------------------------------------------------------------
  async function executeParseRules() {
    if (state.isProcessing) return;

    const payload = prepareInputPayload();
    if (!payload) return;

    setProcessingState(true, '⚡ Parsing CSS rules and selectors...');
    const startTime = performance.now();

    try {
      let result;
      if (payload.type === 'file') {
        const formData = new FormData();
        formData.append('file', payload.file);
        const res = await fetch('/parse-css', { method: 'POST', body: formData });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }));
          throw new Error(errData.detail || `Server returned error ${res.status}`);
        }
        result = await res.json();
      } else {
        const res = await fetch('/parse-css-text', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ css: payload.css, filename: payload.filename }),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }));
          throw new Error(errData.detail || `Server returned error ${res.status}`);
        }
        result = await res.json();
      }

      const elapsed = Math.round(performance.now() - startTime);
      state.parsedData = result;

      // Update UI
      renderMetrics(result, elapsed);
      renderRulesView();
      elements.rulesSection.classList.remove('hidden');

      // Hide AI card if not requested
      if (!state.aiReviewData) {
        elements.aiReviewSection.classList.add('hidden');
      }

      elements.actionStatusMsg.textContent = `Parsed ${result.total_rules} rules in ${elapsed}ms.`;
      showToast(`Extracted ${result.total_rules} CSS rules successfully!`, 'success', 3000);

      // Smooth scroll to metrics
      elements.metricsDashboard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (err) {
      elements.actionStatusMsg.textContent = `Parse failed: ${err.message}`;
      showToast(`Error: ${err.message}`, 'error', 4500);
    } finally {
      setProcessingState(false);
    }
  }

  // -------------------------------------------------------------------------
  // Execution: Parse + AI Review (Groq)
  // -------------------------------------------------------------------------
  async function executeParseAndAnalyze() {
    if (state.isProcessing) return;

    const payload = prepareInputPayload();
    if (!payload) return;

    setProcessingState(true, '✨ Consulting Groq AI (gpt-oss-120b) for code review...');
    const startTime = performance.now();

    try {
      let result;
      if (payload.type === 'file') {
        const formData = new FormData();
        formData.append('file', payload.file);
        const res = await fetch('/analyze-css', { method: 'POST', body: formData });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }));
          throw new Error(errData.detail || `Server returned error ${res.status}`);
        }
        result = await res.json();
      } else {
        const res = await fetch('/analyze-css-text', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ css: payload.css, filename: payload.filename }),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }));
          throw new Error(errData.detail || `Server returned error ${res.status}`);
        }
        result = await res.json();
      }

      const elapsed = Math.round(performance.now() - startTime);
      state.parsedData = result;
      state.aiReviewData = result.ai_review;

      // Update UI
      renderMetrics(result, elapsed);
      renderAiReview(result.ai_review);
      renderRulesView();

      elements.aiReviewSection.classList.remove('hidden');
      elements.rulesSection.classList.remove('hidden');

      elements.actionStatusMsg.textContent = `Parsed ${result.total_rules} rules + AI review in ${elapsed}ms.`;
      showToast(`AI Architectural Review complete (${elapsed}ms)!`, 'success', 3500);

      // Scroll to AI Review
      elements.aiReviewSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (err) {
      elements.actionStatusMsg.textContent = `Analysis failed: ${err.message}`;
      showToast(`Error: ${err.message}`, 'error', 5000);
    } finally {
      setProcessingState(false);
    }
  }

  function prepareInputPayload() {
    if (state.activeTab === 'upload') {
      if (!state.selectedFile) {
        showToast('Please select or drop a .css file first', 'error', 3000);
        return null;
      }
      return { type: 'file', file: state.selectedFile };
    } else {
      const code = elements.cssCodeEditor.value.trim();
      if (!code) {
        showToast('Please enter or paste some CSS code in the editor', 'error', 3000);
        return null;
      }
      return { type: 'text', css: code, filename: 'custom-input.css' };
    }
  }

  function setProcessingState(isProcessing, message = '') {
    state.isProcessing = isProcessing;
    elements.parseBtn.disabled = isProcessing;
    elements.analyzeBtn.disabled = isProcessing;
    elements.actionSpinner.style.display = isProcessing ? 'inline-block' : 'none';
    if (message) {
      elements.actionStatusMsg.textContent = message;
    }
  }

  // -------------------------------------------------------------------------
  // Render: Metrics Dashboard
  // -------------------------------------------------------------------------
  function renderMetrics(data, elapsedMs) {
    const rules = data.rules || [];
    const totalRules = rules.length;
    const totalProps = rules.reduce((acc, r) => acc + (r.property_count || 0), 0);
    const avgProps = totalRules > 0 ? (totalProps / totalRules).toFixed(1) : '0.0';

    let maxComplexity = 0;
    let maxSelector = 'None';
    rules.forEach((r) => {
      if ((r.property_count || 0) > maxComplexity) {
        maxComplexity = r.property_count;
        maxSelector = r.selector;
      }
    });

    elements.metricTotalRules.textContent = totalRules;
    elements.metricTotalProps.textContent = totalProps;
    elements.metricAvgProps.textContent = avgProps;
    elements.metricMaxProps.textContent = `${maxComplexity} props`;
    elements.metricMaxProps.title = `Highest complexity rule: ${maxSelector}`;
    elements.metricTime.textContent = `${elapsedMs} ms`;

    elements.metricsDashboard.classList.remove('hidden');
  }

  // -------------------------------------------------------------------------
  // Render: AI Review Section
  // -------------------------------------------------------------------------
  function renderAiReview(review) {
    if (!review) return;

    elements.aiSummaryText.textContent = review.summary || 'No summary returned.';

    // Pillar 1: Suggestions
    const suggestions = review.suggestions || [];
    elements.suggestionsCount.textContent = `${suggestions.length} items`;
    elements.aiSuggestionsList.innerHTML = suggestions
      .map((item) => `<li>${escapeHtml(item)}</li>`)
      .join('');

    // Pillar 2: Accessibility
    const a11y = review.accessibility || [];
    elements.a11yCount.textContent = `${a11y.length} items`;
    elements.aiAccessibilityList.innerHTML = a11y
      .map((item) => `<li>${escapeHtml(item)}</li>`)
      .join('');

    // Pillar 3: Best Practices
    const practices = review.best_practices || [];
    elements.bestPracticesCount.textContent = `${practices.length} items`;
    elements.aiBestPracticesList.innerHTML = practices
      .map((item) => `<li>${escapeHtml(item)}</li>`)
      .join('');
  }

  // -------------------------------------------------------------------------
  // Render: Rules Explorer (Filtering, Sorting, View Modes)
  // -------------------------------------------------------------------------
  function getFilteredAndSortedRules() {
    if (!state.parsedData || !state.parsedData.rules) return [];

    let list = [...state.parsedData.rules];

    // 1. Search Query
    if (state.searchQuery) {
      const q = state.searchQuery;
      list = list.filter((rule) => {
        const matchesSelector = rule.selector.toLowerCase().includes(q);
        const matchesProps = Object.entries(rule.properties || {}).some(
          ([k, v]) => k.toLowerCase().includes(q) || String(v).toLowerCase().includes(q)
        );
        return matchesSelector || matchesProps;
      });
    }

    // 2. Category Filter
    if (state.activeCategoryFilter !== 'all') {
      const cat = state.activeCategoryFilter;
      list = list.filter((rule) => {
        const props = Object.keys(rule.properties || {}).map((k) => k.toLowerCase());
        const sel = rule.selector.toLowerCase();

        switch (cat) {
          case 'layout':
            return props.some((p) => /display|flex|grid|position|float|align-|justify-|gap/.test(p));
          case 'colors':
            return props.some((p) => /color|background|border-color|box-shadow|fill|stroke/.test(p));
          case 'typography':
            return props.some((p) => /font-|line-height|letter-spacing|text-|white-space/.test(p));
          case 'spacing':
            return props.some((p) => /margin|padding/.test(p));
          case 'pseudo':
            return /:|::|hover|focus|active|visited|before|after/.test(sel);
          case 'media':
            return sel.includes('@media');
          default:
            return true;
        }
      });
    }

    // 3. Sorting
    if (state.sortBy === 'desc-props') {
      list.sort((a, b) => b.property_count - a.property_count);
    } else if (state.sortBy === 'asc-props') {
      list.sort((a, b) => a.property_count - b.property_count);
    } else if (state.sortBy === 'alpha-selector') {
      list.sort((a, b) => a.selector.localeCompare(b.selector));
    }

    return list;
  }

  function renderRulesView() {
    const rules = getFilteredAndSortedRules();
    const totalCount = state.parsedData ? state.parsedData.rules.length : 0;

    elements.visibleRulesCount.textContent = `${rules.length} of ${totalCount} Rules`;

    const hasResults = rules.length > 0;
    elements.emptyRulesState.classList.toggle('hidden', hasResults);

    if (state.viewMode === 'cards') {
      renderCardsView(rules);
      elements.rulesCardsContainer.classList.remove('hidden');
      elements.rulesTableContainer.classList.add('hidden');
      elements.rulesJsonContainer.classList.add('hidden');
    } else if (state.viewMode === 'table') {
      renderTableView(rules);
      elements.rulesCardsContainer.classList.add('hidden');
      elements.rulesTableContainer.classList.remove('hidden');
      elements.rulesJsonContainer.classList.add('hidden');
    } else if (state.viewMode === 'json') {
      renderJsonView(rules);
      elements.rulesCardsContainer.classList.add('hidden');
      elements.rulesTableContainer.classList.add('hidden');
      elements.rulesJsonContainer.classList.remove('hidden');
    }
  }

  function renderCardsView(rules) {
    if (!rules.length) {
      elements.rulesCardsContainer.innerHTML = '';
      return;
    }

    elements.rulesCardsContainer.innerHTML = rules
      .map((rule, index) => {
        const count = rule.property_count || 0;
        let badgeClass = 'badge-low';
        let badgeText = `${count} props (simple)`;

        if (count >= 6) {
          badgeClass = 'badge-high';
          badgeText = `${count} props (dense)`;
        } else if (count >= 3) {
          badgeClass = 'badge-med';
          badgeText = `${count} props (moderate)`;
        }

        const declarations = Object.entries(rule.properties || {})
          .map(([prop, val]) => {
            const isUrl = String(val).toLowerCase().includes('url(');
            const valueClass = isUrl ? 'prop-value is-url' : 'prop-value';
            const escapedVal = escapeHtml(String(val));
            const rawDecl = `${prop}: ${val};`;

            return `
              <div class="prop-row">
                <div class="prop-pair">
                  <span class="prop-name">${escapeHtml(prop)}</span><span class="prop-colon">:</span>
                  <span class="${valueClass}" title="${isUrl ? 'URL-valued property (preserves colon)' : ''}">${escapedVal};</span>
                </div>
                <button class="copy-prop-btn" data-copy="${escapeHtml(rawDecl)}" title="Copy declaration">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                </button>
              </div>
            `;
          })
          .join('');

        const ruleRawCss = `${rule.selector} {\n${Object.entries(rule.properties || {})
          .map(([p, v]) => `  ${p}: ${v};`)
          .join('\n')}\n}`;

        return `
          <div class="rule-card">
            <div class="rule-card-header">
              <div class="rule-selector-wrap">
                <span class="rule-selector">${escapeHtml(rule.selector)}</span>
                <span class="rule-complexity-badge ${badgeClass}">${badgeText}</span>
              </div>
              <button class="copy-rule-btn" data-copy="${escapeHtml(ruleRawCss)}" title="Copy entire rule CSS">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              </button>
            </div>
            <div class="rule-props-list">
              ${declarations}
            </div>
          </div>
        `;
      })
      .join('');

    // Attach copy button listeners inside cards
    elements.rulesCardsContainer.querySelectorAll('[data-copy]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const textToCopy = btn.getAttribute('data-copy');
        copyToClipboard(textToCopy, 'Copied CSS to clipboard!');
      });
    });
  }

  function renderTableView(rules) {
    if (!rules.length) {
      elements.rulesTableBody.innerHTML = '';
      return;
    }

    elements.rulesTableBody.innerHTML = rules
      .map((rule, idx) => {
        const propKeys = Object.keys(rule.properties || {});
        const tags = propKeys
          .map((k) => `<span class="prop-tag">${escapeHtml(k)}</span>`)
          .join('');

        const ruleRawCss = `${rule.selector} {\n${Object.entries(rule.properties || {})
          .map(([p, v]) => `  ${p}: ${v};`)
          .join('\n')}\n}`;

        return `
          <tr>
            <td>${idx + 1}</td>
            <td><span class="table-selector">${escapeHtml(rule.selector)}</span></td>
            <td><span class="rule-complexity-badge badge-low">${rule.property_count} props</span></td>
            <td><div class="table-props-tags">${tags}</div></td>
            <td>
              <button class="btn btn-ghost btn-sm" data-copy-table="${escapeHtml(ruleRawCss)}" title="Copy rule">
                Copy
              </button>
            </td>
          </tr>
        `;
      })
      .join('');

    elements.rulesTableBody.querySelectorAll('[data-copy-table]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const text = btn.getAttribute('data-copy-table');
        copyToClipboard(text, 'Copied rule to clipboard!');
      });
    });
  }

  function renderJsonView(rules) {
    const jsonOutput = {
      filename: state.parsedData ? state.parsedData.filename : 'css_rules.json',
      total_rules: rules.length,
      rules: rules,
    };
    elements.rawJsonOutput.textContent = JSON.stringify(jsonOutput, null, 2);
  }

  function switchViewMode(mode) {
    state.viewMode = mode;
    elements.viewCardsBtn.classList.toggle('active', mode === 'cards');
    elements.viewTableBtn.classList.toggle('active', mode === 'table');
    elements.viewJsonBtn.classList.toggle('active', mode === 'json');
    renderRulesView();
  }

  // -------------------------------------------------------------------------
  // Export & Clipboard Helpers
  // -------------------------------------------------------------------------
  function copyToClipboard(text, successMsg = 'Copied to clipboard!') {
    navigator.clipboard.writeText(text).then(
      () => showToast(successMsg, 'success', 2000),
      () => showToast('Failed to copy to clipboard', 'error', 2500)
    );
  }

  function exportParsedJson() {
    if (!state.parsedData) {
      showToast('No parsed rules to export', 'error', 2000);
      return;
    }
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state.parsedData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${state.parsedData.filename || 'parsed_rules'}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Downloaded parsed rules JSON', 'success', 2500);
  }

  function copyParsedJson() {
    if (!state.parsedData) return;
    copyToClipboard(JSON.stringify(state.parsedData, null, 2), 'Copied structured JSON AST!');
  }

  function copyAiReview() {
    if (!state.aiReviewData) return;
    const rev = state.aiReviewData;
    const text = `# Groq AI Review for ${state.parsedData.filename || 'CSS'}\n\n`
      + `## Summary\n${rev.summary}\n\n`
      + `## Actionable Improvements\n${(rev.suggestions || []).map((s) => `- ${s}`).join('\n')}\n\n`
      + `## Accessibility Notes\n${(rev.accessibility || []).map((a) => `- ${a}`).join('\n')}\n\n`
      + `## CSS Best Practices\n${(rev.best_practices || []).map((b) => `- ${b}`).join('\n')}`;

    copyToClipboard(text, 'Copied AI Review Markdown!');
  }

  function exportAiReviewMarkdown() {
    if (!state.aiReviewData) return;
    const rev = state.aiReviewData;
    const md = `# StyleScope AI Architectural Review\n\n`
      + `**File:** \`${state.parsedData.filename || 'stylesheet.css'}\`  \n`
      + `**Model:** \`openai/gpt-oss-120b\`  \n`
      + `**Rules Evaluated:** ${state.parsedData.total_rules}  \n\n`
      + `### Executive Summary\n${rev.summary}\n\n`
      + `### Actionable Improvements\n${(rev.suggestions || []).map((s) => `- ${s}`).join('\n')}\n\n`
      + `### Accessibility (a11y) Considerations\n${(rev.accessibility || []).map((a) => `- ${a}`).join('\n')}\n\n`
      + `### Best Practices & Modern CSS Standards\n${(rev.best_practices || []).map((b) => `- ${b}`).join('\n')}\n`;

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai_review_${state.parsedData.filename || 'stylesheet'}.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast('Exported Markdown Review', 'success', 2500);
  }

  // -------------------------------------------------------------------------
  // Utility Functions
  // -------------------------------------------------------------------------
  function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  function escapeHtml(str) {
    if (typeof str !== 'string') return str;
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Run initial setup
  init();
});
