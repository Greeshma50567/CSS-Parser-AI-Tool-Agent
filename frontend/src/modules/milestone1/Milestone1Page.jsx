import React, { useState, useCallback, useRef } from 'react';
import Navbar from '../shared/Navbar';
import ModuleHero from './components/ModuleHero';
import DropZone from './components/DropZone';
import RuleCard from './components/RuleCard';
import TableView from './components/TableView';
import AiReviewCard from './components/AiReviewCard';
import VerticalStepperModal from './components/VerticalStepperModal';
import {
  PaletteView,
  CodeView,
  AstTreeView,
  AnalyticsView
} from './components/Milestone1Views';
import { Milestone1Skeleton } from '../../components/Skeleton';
import {
  parseCssFile,
  analyzeCssFile,
  parseCssText,
  analyzeCssText,
  getSampleCss
} from '../../api/cssApi';

function useToast() {
  const [toasts, setToasts] = useState([]);
  const show = useCallback((msg, type = 'info', duration = 3000) => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), duration);
  }, []);
  return { toasts, show };
}

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'layout', label: 'Layout' },
  { key: 'colors', label: 'Colors' },
  { key: 'typography', label: 'Typography' },
  { key: 'spacing', label: 'Spacing' },
];

function filterRules(rules, filter, search) {
  let r = rules;
  if (filter !== 'all') {
    const maps = {
      layout: ['display', 'flex', 'grid', 'position', 'width', 'height'],
      colors: ['color', 'background', 'border'],
      typography: ['font', 'text', 'line-height'],
      spacing: ['margin', 'padding', 'gap'],
    };
    const keys = maps[filter] || [];
    r = r.filter(rule =>
      keys.some(k => rule.selector.includes(k) || Object.keys(rule.properties || {}).some(p => p.includes(k)))
    );
  }
  if (search) {
    const q = search.toLowerCase();
    r = r.filter(rule =>
      rule.selector.toLowerCase().includes(q) ||
      Object.keys(rule.properties || {}).some(k => k.includes(q))
    );
  }
  return r;
}

export default function Milestone1Page() {
  const { toasts, show } = useToast();
  const [tab, setTab] = useState('file');
  const [file, setFile] = useState(null);
  const [cssText, setCssText] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadMsg, setLoadMsg] = useState('');
  const [data, setData] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isApiDone, setIsApiDone] = useState(false);
  const [apiResult, setApiResult] = useState(null);
  const apiResultRef = useRef(null);

  const [view, setView] = useState('cards');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = data ? filterRules(data.rules || [], filter, search) : [];

  async function handleParse(withAi = true) {
    if (tab === 'file' && !file) {
      show('Please select a CSS file', 'error');
      return;
    }
    if (tab === 'text' && !cssText.trim()) {
      show('Please enter some CSS', 'error');
      return;
    }

    try {
      setLoading(true);
      setShowModal(true);
      setIsApiDone(false);
      setApiResult(null);
      apiResultRef.current = null;
      setLoadMsg('Parsing CSS and calling Groq AI...');

      const result = tab === 'file'
        ? await analyzeCssFile(file)
        : await analyzeCssText(cssText);

      apiResultRef.current = result;
      setApiResult(result);
      setIsApiDone(true);
    } catch (e) {
      setShowModal(false);
      setLoading(false);
      show(e.message || 'Failed to analyze CSS', 'error', 5000);
    }
  }

  const handleModalComplete = useCallback(() => {
    setShowModal(false);
    setLoading(false);
    const finalData = apiResultRef.current;
    if (finalData) {
      setData(finalData);
      setFilter('all');
      setSearch('');
      show('Parsed ' + finalData.total_rules + ' rules with AI review', 'success');
      setTimeout(() => {
        const el = document.getElementById('results-view');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }, [show]);

  async function handleSample() {
    try {
      setLoading(true);
      setLoadMsg('Loading sample CSS...');
      const s = await getSampleCss();
      setTab('text');
      setCssText(s.content);
      show('Sample CSS loaded!', 'success');
    } catch (e) {
      show(e.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  function exportJson() {
    if (!data) return;
    const a = document.createElement('a');
    a.href = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2));
    a.download = (data.filename || 'parsed') + '.json';
    a.click();
    show('JSON exported!', 'success');
  }

  function copyJson() {
    if (!data) return;
    navigator.clipboard.writeText(JSON.stringify(data, null, 2))
      .then(() => show('Copied JSON!', 'success'))
      .catch(() => show('Copy failed', 'error'));
  }

  return (
    <div className="m1-layout">
      {/* Reusable Navbar */}
      <Navbar
        moduleName="StyleScope AI"
        subtitle="CSS Parser &amp; Groq Auditor"
        logoText="CSS"
        badgeText="Groq 120B Powered"
      />

      {/* Module Hero Banner */}
      <ModuleHero />

      <main className="main">
        {/* =========================================================================
            MODULE 1.1: SOURCE INPUT & CONFIGURATION CARD
            ========================================================================= */}
        <section className="upload-panel modular-card">
          <div className="panel-header">
            <div className="panel-title">
              <div className="modular-badge">
                <span className="modular-badge-id">MODULE 1.1</span>
                <span className="modular-badge-sep">&bull;</span>
                <span className="modular-badge-label">SOURCE INPUT</span>
                <span className="modular-pulse-dot" />
              </div>
            </div>

            <div className="tabs" style={{ maxWidth: 300 }}>
              <button
                className={tab === 'file' ? 'tab active' : 'tab'}
                onClick={() => setTab('file')}
              >
                File Upload
              </button>
              <button
                className={tab === 'text' ? 'tab active' : 'tab'}
                onClick={() => setTab('text')}
              >
                Paste CSS
              </button>
            </div>
          </div>

          {tab === 'file' ? (
            <DropZone file={file} onFile={setFile} />
          ) : (
            <div>
              <textarea
                className="css-editor"
                value={cssText}
                onChange={e => setCssText(e.target.value)}
                placeholder=".navbar { display: flex; background: #111; }"
              />
              <div className="editor-toolbar">
                <button className="btn btn-ghost btn-sm" onClick={handleSample}>
                  Load Sample CSS
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => setCssText('')}>
                  Clear
                </button>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              className="btn btn-primary"
              onClick={() => handleParse(true)}
              disabled={loading}
              style={{ minWidth: '210px' }}
            >
              {loading ? 'Analyzing & Auditing...' : '✨ Parse + AI Review'}
            </button>
          </div>
        </section>

        {/* Modular Stepper Popup (Execution Pipeline) */}
        <VerticalStepperModal
          isOpen={showModal}
          isApiDone={isApiDone}
          onComplete={handleModalComplete}
          filename={tab === 'file' && file ? file.name : 'custom.css'}
        />

        {/* Loading Skeleton */}
        {loading && !showModal && (
          <Milestone1Skeleton loadMsg={loadMsg} isAi={true} />
        )}

        {/* =========================================================================
            STRUCTURED RESULTS SECTION (MODULES 1.2, 1.3, 1.4)
            ========================================================================= */}
        {!loading && data && (
          <div className="results" id="results-view">
            {/* MODULE 1.2: SUMMARY & METRICS BAR */}
            <section className="summary-bar modular-card">
              <div className="summary-stat">
                <div className="summary-stat-icon purple">📄</div>
                <div>
                  <div className="summary-stat-val">{data.filename}</div>
                  <div className="summary-stat-lbl">Filename</div>
                </div>
              </div>

              <div className="summary-stat">
                <div className="summary-stat-icon green">📏</div>
                <div>
                  <div className="summary-stat-val">{data.total_rules}</div>
                  <div className="summary-stat-lbl">Total Rules</div>
                </div>
              </div>

              <div className="summary-stat">
                <div className="summary-stat-icon yellow">🔢</div>
                <div>
                  <div className="summary-stat-val">
                    {(data.rules || []).reduce((a, r) => a + r.property_count, 0)}
                  </div>
                  <div className="summary-stat-lbl">Declarations</div>
                </div>
              </div>

              <div className="summary-actions">
                <button className="btn btn-ghost btn-sm" onClick={copyJson}>Copy JSON</button>
                <button className="btn btn-green btn-sm" onClick={exportJson}>Export JSON</button>
              </div>
            </section>

            {/* MODULE 1.3: STRUCTURED ANALYSIS & VIEW MODES */}
            <section className="modular-view-container">
              <div className="view-switcher modular-card">
                <span className="view-switcher-label">
                  <span className="modular-badge" style={{ padding: '2px 8px', fontSize: '0.72rem' }}>
                    MODULE 1.3 &bull; VIEW MODES
                  </span>
                </span>
                {['cards', 'table', 'json', 'palette', 'code', 'tree', 'analytics'].map(v => (
                  <button
                    key={v}
                    className={view === v ? 'tab active' : 'tab'}
                    onClick={() => setView(v)}
                    style={{ textTransform: 'capitalize' }}
                  >
                    {v === 'tree' ? 'AST Tree' : v}
                  </button>
                ))}
              </div>

              {['cards', 'table'].includes(view) && (
                <div className="filter-pills modular-card">
                  <span className="filter-label">Filter:</span>
                  {FILTERS.map(f => (
                    <button
                      key={f.key}
                      className={filter === f.key ? 'pill active' : 'pill'}
                      onClick={() => setFilter(f.key)}
                    >
                      {f.label}
                    </button>
                  ))}
                  <div className="search-wrap" style={{ marginLeft: 'auto' }}>
                    <span className="search-icon">🔍</span>
                    <input
                      className="search-input"
                      placeholder="Search selector or property..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* View Renderers */}
              {view === 'cards' && (
                filtered.length === 0 ? (
                  <div className="empty-state">No rules match the current filter.</div>
                ) : (
                  <div className="cards-grid">
                    {filtered.map((r, i) => <RuleCard key={i} rule={r} />)}
                  </div>
                )
              )}

              {view === 'table' && (
                filtered.length === 0 ? (
                  <div className="empty-state">No rules match the current filter.</div>
                ) : (
                  <TableView rules={filtered} />
                )
              )}

              {view === 'json' && (
                <div className="json-wrap">
                  <pre className="json-pre">{JSON.stringify(data, null, 2)}</pre>
                </div>
              )}

              {view === 'palette' && <PaletteView rules={data.rules || []} />}
              {view === 'code' && <CodeView rules={data.rules || []} filename={data.filename} />}
              {view === 'tree' && <AstTreeView rules={data.rules || []} filename={data.filename} />}
              {view === 'analytics' && <AnalyticsView data={data} />}
            </section>

            {/* MODULE 1.4: GROQ AI AUDIT */}
            {data.ai_review && (
              <AiReviewCard review={data.ai_review} filename={data.filename} />
            )}
          </div>
        )}
      </main>

      <footer className="footer">
        <div className="footer-left">StyleScope AI &bull; Milestone 1 Modular CSS Parser</div>
        <div className="footer-right">
          <a href="http://localhost:8000/docs" target="_blank" rel="noreferrer">Swagger API Docs</a>
          <a href="http://localhost:8000/redoc" target="_blank" rel="noreferrer">ReDoc</a>
        </div>
      </footer>

      {/* Toast notifications */}
      <div className="toast-container">
        {toasts.map(t => <div key={t.id} className={'toast ' + t.type}>{t.msg}</div>)}
      </div>
    </div>
  );
}
