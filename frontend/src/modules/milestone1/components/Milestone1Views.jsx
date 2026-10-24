import React, { useState, useMemo } from 'react';

// ============================================================================
// 1. PALETTE VIEW COMPONENT
// ============================================================================

const COLOR_HEX_REGEX = /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})/g;
const COLOR_RGB_REGEX = /rgba?\s*\([^)]+\)/gi;
const COLOR_HSL_REGEX = /hsla?\s*\([^)]+\)/gi;

const NAMED_COLORS = new Set([
  'black','silver','gray','grey','white','maroon','red','purple','fuchsia','green',
  'lime','olive','yellow','navy','blue','teal','aqua','orange','aliceblue','antiquewhite',
  'coral','crimson','cyan','darkblue','darkcyan','darkgray','darkgrey','darkgreen',
  'darkkhaki','darkmagenta','darkolivegreen','darkorange','darkorchid','darkred',
  'darksalmon','darkseagreen','darkslateblue','darkslategray','darkturquoise','darkviolet',
  'deeppink','deepskyblue','dimgray','dimgrey','dodgerblue','firebrick','forestgreen',
  'gold','goldenrod','hotpink','indianred','indigo','ivory','khaki','lavender',
  'lavenderblush','lawngreen','lemonchiffon','lightblue','lightcoral','lightcyan',
  'lightgoldenrodyellow','lightgray','lightgrey','lightgreen','lightpink','lightsalmon',
  'lightseagreen','lightskyblue','lightslategray','lightslategrey','lightsteelblue',
  'lightyellow','magenta','mediumaquamarine','mediumblue','mediumorchid','mediumpurple',
  'mediumseagreen','mediumslateblue','mediumspringgreen','mediumturquoise',
  'mediumvioletred','midnightblue','mintcream','mistyrose','moccasin','navajowhite',
  'oldlace','olivedrab','orangered','orchid','palegoldenrod','palegreen','paleturquoise',
  'palevioletred','papayawhip','peachpuff','peru','pink','plum','powderblue',
  'rosybrown','royalblue','saddlebrown','salmon','sandybrown','seagreen','seashell',
  'sienna','skyblue','slateblue','slategray','slategrey','snow','springgreen',
  'steelblue','tan','thistle','tomato','turquoise','violet','wheat','whitesmoke',
  'yellowgreen','transparent','currentcolor'
]);

const COLOR_TARGET_PROPS = new Set([
  'color', 'background', 'background-color', 'border-color', 'border',
  'outline-color', 'outline', 'fill', 'stroke', 'box-shadow', 'text-shadow',
  'caret-color', 'accent-color', 'stop-color', 'flood-color'
]);

export function extractPaletteTokens(rules) {
  const tokenMap = new Map();

  for (const rule of rules) {
    const props = rule.properties || {};
    for (const [propKey, rawVal] of Object.entries(props)) {
      const p = propKey.trim().toLowerCase();
      const val = String(rawVal).trim();
      
      const isTarget = COLOR_TARGET_PROPS.has(p) || (p.startsWith('--') && (p.includes('color') || p.includes('bg')));
      if (!isTarget) continue;

      const found = [];
      const hexMatches = val.match(COLOR_HEX_REGEX);
      if (hexMatches) found.push(...hexMatches);

      const rgbMatches = val.match(COLOR_RGB_REGEX);
      if (rgbMatches) found.push(...rgbMatches);

      const hslMatches = val.match(COLOR_HSL_REGEX);
      if (hslMatches) found.push(...hslMatches);

      if (found.length === 0) {
        const clean = val.toLowerCase();
        if (NAMED_COLORS.has(clean)) {
          found.push(clean);
        }
      }

      const isVar = propKey.startsWith('--');

      for (const rawMatch of found) {
        const norm = rawMatch.toLowerCase().replace(/\s+/g, ' ');
        if (!tokenMap.has(norm)) {
          let fmt = 'HEX';
          if (norm.startsWith('rgb')) fmt = 'RGB';
          else if (norm.startsWith('hsl')) fmt = 'HSL';
          else if (!norm.startsWith('#')) fmt = 'NAMED';

          tokenMap.set(norm, {
            color: norm,
            tokenName: isVar ? propKey : (p === 'background-color' || p === 'background' ? 'background' : p),
            isCustomProp: isVar,
            format: fmt,
            sources: [],
            count: 0
          });
        }
        const item = tokenMap.get(norm);
        item.count += 1;
        if (isVar && !item.isCustomProp) {
          item.tokenName = propKey;
          item.isCustomProp = true;
        }
        if (item.sources.length < 6) {
          item.sources.push({ selector: rule.selector, prop: propKey });
        }
      }
    }
  }

  return Array.from(tokenMap.values()).sort((a, b) => b.count - a.count);
}

export function PaletteView({ rules }) {
  const [copiedKey, setCopiedKey] = useState(null);
  const [filterType, setFilterType] = useState('ALL');
  const [search, setSearch] = useState('');

  const tokens = useMemo(() => extractPaletteTokens(rules || []), [rules]);

  const filteredTokens = useMemo(() => {
    return tokens.filter(t => {
      const matchType = filterType === 'ALL' ||
        (filterType === 'VAR' && t.isCustomProp) ||
        (filterType === t.format);
      
      const q = search.trim().toLowerCase();
      const matchSearch = !q ||
        t.color.toLowerCase().includes(q) ||
        t.tokenName.toLowerCase().includes(q) ||
        t.sources.some(s => s.selector.toLowerCase().includes(q));

      return matchType && matchSearch;
    });
  }, [tokens, filterType, search]);

  const copyToClipboard = (color) => {
    navigator.clipboard.writeText(color);
    setCopiedKey(color);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  return (
    <div className="palette-view-container">
      {/* Top Summary Bar */}
      <div className="palette-toolbar">
        <div className="palette-badge-pill">
          <span className="palette-badge-dot"></span>
          <span>Found <strong>{tokens.length}</strong> Unique Color Tokens</span>
        </div>

        <div className="palette-filters">
          {['ALL', 'HEX', 'RGB', 'HSL', 'VAR'].map(type => (
            <button
              key={type}
              className={`palette-filter-chip ${filterType === type ? 'active' : ''}`}
              onClick={() => setFilterType(type)}
            >
              {type === 'VAR' ? 'CSS Variables' : type}
            </button>
          ))}
        </div>

        <div className="palette-search-wrap">
          <span className="palette-search-icon">🔍</span>
          <input
            type="text"
            className="palette-search-input"
            placeholder="Search color or token..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {filteredTokens.length === 0 ? (
        <div className="empty-state" style={{ padding: '3rem' }}>
          <div className="empty-icon">🎨</div>
          <div className="empty-title">No Color Tokens Found</div>
          <div className="empty-sub">
            {tokens.length === 0
              ? 'No hex, rgb, hsl, or CSS color variables were detected in these parsed rules.'
              : 'Try clearing your search query or filter chips.'}
          </div>
        </div>
      ) : (
        <div className="palette-grid">
          {filteredTokens.map(token => {
            const isCopied = copiedKey === token.color;
            return (
              <div key={token.color} className="palette-card">
                {/* Visual Swatch */}
                <div className="palette-swatch-wrapper">
                  <div className="palette-swatch-checkers"></div>
                  <div
                    className="palette-swatch-fill"
                    style={{ backgroundColor: token.color }}
                  ></div>
                  <span className="palette-format-badge">{token.format}</span>
                  {token.count > 1 && (
                    <span className="palette-count-badge" title={`Used in ${token.count} declarations`}>
                      {token.count}x
                    </span>
                  )}
                </div>

                {/* Info & Copy */}
                <div className="palette-card-body">
                  <div className="palette-token-header">
                    <span className={`palette-token-name ${token.isCustomProp ? 'is-var' : ''}`} title={token.tokenName}>
                      {token.tokenName}
                    </span>
                    <button
                      className={`palette-copy-btn ${isCopied ? 'copied' : ''}`}
                      onClick={() => copyToClipboard(token.color)}
                      title="Copy color code"
                    >
                      {isCopied ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>

                  <div className="palette-color-code" title={token.color}>
                    <code>{token.color}</code>
                  </div>

                  <div className="palette-sources">
                    <span className="palette-sources-label">Sources:</span>
                    <div className="palette-source-tags">
                      {token.sources.slice(0, 3).map((s, idx) => (
                        <span key={idx} className="palette-source-tag" title={`${s.selector} { ${s.prop} }`}>
                          {s.selector}
                        </span>
                      ))}
                      {token.sources.length > 3 && (
                        <span className="palette-source-tag more">+{token.sources.length - 3}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 2. RAW / CLEAN CODE VIEW COMPONENT
// ============================================================================

export function CodeView({ rules, filename = 'clean_styles.css' }) {
  const [minified, setMinified] = useState(false);
  const [copied, setCopied] = useState(false);

  const formattedCss = useMemo(() => {
    if (!rules || rules.length === 0) return '/* No rules to display */';
    return rules.map(rule => {
      const props = Object.entries(rule.properties || {})
        .map(([k, v]) => `  ${k}: ${v};`)
        .join('\n');
      return `${rule.selector} {\n${props}\n}`;
    }).join('\n\n');
  }, [rules]);

  const minifiedCss = useMemo(() => {
    if (!rules || rules.length === 0) return '/* No rules to display */';
    return rules.map(rule => {
      const props = Object.entries(rule.properties || {})
        .map(([k, v]) => `${k}:${v}`)
        .join(';');
      return `${rule.selector}{${props}${props ? ';' : ''}}`;
    }).join('');
  }, [rules]);

  const activeCss = minified ? minifiedCss : formattedCss;
  const lineCount = activeCss.split('\n').length;
  const byteCount = new Blob([activeCss]).size;

  const handleCopy = () => {
    navigator.clipboard.writeText(activeCss);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const downloadName = minified
      ? filename.replace(/\.css$/i, '.min.css')
      : (filename.endsWith('.css') ? filename : `${filename}.css`);
    const blob = new Blob([activeCss], { type: 'text/css;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = downloadName.includes('.css') ? downloadName : 'clean_styles.css';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="code-view-container">
      {/* Top Control Toolbar */}
      <div className="code-toolbar">
        <div className="code-meta-badge">
          <span className="code-lang-tag">CSS</span>
          <span className="code-stats-text">
            {rules.length} Rules • {lineCount} Lines • {(byteCount / 1024).toFixed(2)} KB
          </span>
        </div>

        <div className="code-toolbar-actions">
          {/* Minify Toggle */}
          <div className="code-toggle-wrap">
            <span className={`code-toggle-lbl ${!minified ? 'active' : ''}`}>Formatted</span>
            <label className="code-switch">
              <input
                type="checkbox"
                checked={minified}
                onChange={(e) => setMinified(e.target.checked)}
              />
              <span className="code-slider round"></span>
            </label>
            <span className={`code-toggle-lbl ${minified ? 'active' : ''}`}>Minified</span>
          </div>

          {/* Copy Button */}
          <button className={`btn btn-sm ${copied ? 'btn-green' : 'btn-ghost'}`} onClick={handleCopy}>
            {copied ? '✓ Copied!' : 'Copy CSS'}
          </button>

          {/* Download Button */}
          <button className="btn btn-sm btn-primary" onClick={handleDownload}>
            ⬇ Download Clean CSS
          </button>
        </div>
      </div>

      {/* Code Display */}
      <div className="code-pre-wrapper">
        <pre className="clean-code-pre">
          <code>{activeCss}</code>
        </pre>
      </div>
    </div>
  );
}

// ============================================================================
// 3. AST / TREE VIEW COMPONENT
// ============================================================================

function getSelectorType(selector) {
  if (!selector) return 'Tag';
  const s = selector.trim();
  if (s.startsWith('@')) return 'AtRule';
  if (s.startsWith(':root')) return 'Root';
  if (s === '*') return 'Universal';
  if (s.startsWith('.') || s.includes('.')) return 'Class';
  if (s.startsWith('#')) return 'ID';
  if (s.startsWith(':') || s.startsWith('::')) return 'Pseudo';
  return 'Tag';
}

function AstTreeNode({ rule, index, isExpanded, onToggle }) {
  const [declExpanded, setDeclExpanded] = useState(true);
  const selectorType = getSelectorType(rule.selector);
  const entries = Object.entries(rule.properties || {});

  return (
    <div className="tree-rule-node">
      {/* Rule Header Node (Level 1) */}
      <div
        className={`tree-node-header ${isExpanded ? 'expanded' : ''}`}
        onClick={onToggle}
      >
        <span className="tree-arrow">{isExpanded ? '▼' : '▶'}</span>
        <span className="tree-node-type">RuleNode</span>
        <span className="tree-selector-title">{rule.selector}</span>
        <span className={`tree-type-pill type-${selectorType.toLowerCase()}`}>
          {selectorType}
        </span>
        <span className="tree-count-pill">
          {entries.length} {entries.length === 1 ? 'decl' : 'decls'}
        </span>
      </div>

      {/* Collapsible Children (Level 2) */}
      {isExpanded && (
        <div className="tree-children">
          {/* Level 2: Selector Node */}
          <div className="tree-subnode selector-subnode">
            <div className="tree-subnode-header">
              <span className="tree-subnode-icon">🏷️</span>
              <span className="tree-subnode-label">Selector:</span>
              <code className="tree-subnode-code">{rule.selector}</code>
              <span className="tree-dim-meta">(Type: {selectorType})</span>
            </div>
          </div>

          {/* Level 2: Declarations Branch Node */}
          <div className="tree-subnode decls-subnode">
            <div
              className="tree-subnode-header clickable"
              onClick={() => setDeclExpanded(!declExpanded)}
            >
              <span className="tree-arrow-sm">{declExpanded ? '▼' : '▶'}</span>
              <span className="tree-subnode-icon">⚙️</span>
              <span className="tree-subnode-label">Declarations</span>
              <span className="tree-dim-meta">({entries.length})</span>
            </div>

            {/* Level 3: Declaration Leaves */}
            {declExpanded && (
              <div className="tree-decl-list">
                {entries.map(([k, v]) => {
                  const isCol = String(v).startsWith('#') || String(v).startsWith('rgb') || String(v).startsWith('hsl');
                  return (
                    <div key={k} className="tree-decl-leaf">
                      <span className="tree-leaf-bullet">└</span>
                      <span className="tree-prop-name">{k}</span>
                      <span className="tree-colon">:</span>
                      <span className="tree-prop-value">{v}</span>
                      {isCol && (
                        <span
                          className="tree-color-swatch-dot"
                          style={{ backgroundColor: v }}
                          title={v}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function AstTreeView({ rules }) {
  const [expandedIndices, setExpandedIndices] = useState(() => new Set(rules.map((_, i) => i)));
  const [filterQuery, setFilterQuery] = useState('');

  const filteredRules = useMemo(() => {
    if (!filterQuery.trim()) return rules;
    const q = filterQuery.toLowerCase();
    return rules.filter(r =>
      r.selector.toLowerCase().includes(q) ||
      Object.keys(r.properties || {}).some(k => k.includes(q))
    );
  }, [rules, filterQuery]);

  const toggleNode = (idx) => {
    setExpandedIndices(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const expandAll = () => {
    setExpandedIndices(new Set(rules.map((_, i) => i)));
  };

  const collapseAll = () => {
    setExpandedIndices(new Set());
  };

  const totalDeclarations = useMemo(() => {
    return (rules || []).reduce((acc, r) => acc + (r.property_count || Object.keys(r.properties || {}).length), 0);
  }, [rules]);

  return (
    <div className="ast-tree-container">
      {/* Tree Toolbar */}
      <div className="ast-toolbar">
        <div className="ast-root-info">
          <span className="ast-root-icon">📁</span>
          <span className="ast-root-title">StyleSheet AST</span>
          <span className="ast-meta-badge">{rules.length} Rules</span>
          <span className="ast-meta-badge">{totalDeclarations} Total Declarations</span>
        </div>

        <div className="ast-toolbar-controls">
          <button className="btn btn-sm btn-ghost" onClick={expandAll}>
            ⊞ Expand All
          </button>
          <button className="btn btn-sm btn-ghost" onClick={collapseAll}>
            ⊟ Collapse All
          </button>
          <div className="ast-search-wrap">
            <input
              type="text"
              className="ast-search-input"
              placeholder="Filter tree nodes..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Tree View Structure */}
      <div className="ast-tree-canvas">
        <div className="ast-root-node">
          <div className="ast-root-banner">
            <span className="ast-folder-icon">📂</span>
            <span className="ast-banner-name">StyleSheet</span>
            <span className="ast-banner-dim">({filteredRules.length} rule nodes shown)</span>
          </div>

          <div className="ast-nodes-list">
            {filteredRules.length === 0 ? (
              <div className="empty-state" style={{ padding: '2rem' }}>
                <div className="empty-title">No matching AST nodes</div>
                <div className="empty-sub">Adjust your filter query above.</div>
              </div>
            ) : (
              filteredRules.map((rule, idx) => (
                <AstTreeNode
                  key={idx}
                  rule={rule}
                  index={idx}
                  isExpanded={expandedIndices.has(idx)}
                  onToggle={() => toggleNode(idx)}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 4. ANALYTICS / METRICS VIEW COMPONENT
// ============================================================================

export function AnalyticsView({ rules }) {
  const metrics = useMemo(() => {
    if (!rules || rules.length === 0) {
      return {
        totalRules: 0,
        totalDeclarations: 0,
        avgPropsPerRule: 0,
        uniquePropsCount: 0,
        topProps: [],
        density: { light: 0, moderate: 0, dense: 0 },
        selectors: { class: 0, id: 0, tag: 0, pseudo: 0 },
        heaviestRule: null,
      };
    }

    const totalRules = rules.length;
    let totalDeclarations = 0;
    const propFreq = {};
    let heaviest = { selector: 'None', count: 0 };

    const density = { light: 0, moderate: 0, dense: 0 };
    const selectors = { class: 0, id: 0, tag: 0, pseudo: 0 };

    for (const rule of rules) {
      const pCount = rule.property_count || Object.keys(rule.properties || {}).length;
      totalDeclarations += pCount;

      if (pCount > heaviest.count) {
        heaviest = { selector: rule.selector, count: pCount };
      }

      // Density breakdown
      if (pCount <= 3) density.light += 1;
      else if (pCount <= 7) density.moderate += 1;
      else density.dense += 1;

      // Selector breakdown
      const s = rule.selector || '';
      if (s.includes(':')) selectors.pseudo += 1;
      else if (s.includes('#')) selectors.id += 1;
      else if (s.includes('.')) selectors.class += 1;
      else selectors.tag += 1;

      // Frequency
      for (const prop of Object.keys(rule.properties || {})) {
        propFreq[prop] = (propFreq[prop] || 0) + 1;
      }
    }

    const sortedProps = Object.entries(propFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([prop, count]) => ({
        property: prop,
        count,
        pct: totalDeclarations ? Math.round((count / totalDeclarations) * 100) : 0
      }));

    return {
      totalRules,
      totalDeclarations,
      avgPropsPerRule: (totalDeclarations / (totalRules || 1)).toFixed(1),
      uniquePropsCount: Object.keys(propFreq).length,
      topProps: sortedProps,
      density,
      selectors,
      heaviestRule: heaviest,
    };
  }, [rules]);

  if (!rules || rules.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📊</div>
        <div className="empty-title">No Parsed Data for Analytics</div>
        <div className="empty-sub">Parse a CSS file or snippet first to view statistics.</div>
      </div>
    );
  }

  const { totalRules, totalDeclarations, density, selectors, topProps } = metrics;
  const maxTopCount = topProps[0]?.count || 1;

  const lightPct = Math.round((density.light / totalRules) * 100);
  const modPct = Math.round((density.moderate / totalRules) * 100);
  const densePct = Math.round((density.dense / totalRules) * 100);

  const selClassPct = Math.round((selectors.class / totalRules) * 100);
  const selIdPct = Math.round((selectors.id / totalRules) * 100);
  const selTagPct = Math.round((selectors.tag / totalRules) * 100);
  const selPseudoPct = Math.round((selectors.pseudo / totalRules) * 100);

  return (
    <div className="analytics-view-container">
      {/* 1. Key Stat Cards */}
      <div className="analytics-stat-cards">
        <div className="analytics-card">
          <div className="analytics-card-icon purple">📑</div>
          <div className="analytics-card-val">{metrics.totalRules}</div>
          <div className="analytics-card-lbl">Total Rules</div>
        </div>
        <div className="analytics-card">
          <div className="analytics-card-icon blue">⚙️</div>
          <div className="analytics-card-val">{metrics.totalDeclarations}</div>
          <div className="analytics-card-lbl">Total Declarations</div>
        </div>
        <div className="analytics-card">
          <div className="analytics-card-icon green">📈</div>
          <div className="analytics-card-val">{metrics.avgPropsPerRule}</div>
          <div className="analytics-card-lbl">Avg Props / Rule</div>
        </div>
        <div className="analytics-card">
          <div className="analytics-card-icon yellow">🏷️</div>
          <div className="analytics-card-val">{metrics.uniquePropsCount}</div>
          <div className="analytics-card-lbl">Unique Properties</div>
        </div>
        <div className="analytics-card">
          <div className="analytics-card-icon red">🏋️</div>
          <div className="analytics-card-val" style={{ fontSize: '1.25rem' }}>
            {metrics.heaviestRule ? `${metrics.heaviestRule.count} props` : '0'}
          </div>
          <div className="analytics-card-lbl" title={metrics.heaviestRule?.selector} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {metrics.heaviestRule?.selector || 'None'}
          </div>
        </div>
      </div>

      {/* 2. Grid for Charts */}
      <div className="analytics-grid">
        {/* A) Top 5 Properties */}
        <div className="analytics-section-card">
          <div className="analytics-section-header">
            <div>
              <div className="analytics-section-title">Top 5 Most Frequent Properties</div>
              <div className="analytics-section-desc">Highest occurrence CSS properties across all parsed rules</div>
            </div>
            <span className="analytics-tag">Frequency</span>
          </div>

          <div className="analytics-bars-wrap">
            {topProps.map((item, i) => {
              const barWidth = Math.max(12, Math.round((item.count / maxTopCount) * 100));
              return (
                <div key={item.property} className="analytics-bar-row">
                  <div className="analytics-bar-info">
                    <span className="analytics-bar-rank">#{i + 1}</span>
                    <span className="analytics-bar-name">{item.property}</span>
                    <span className="analytics-bar-count">{item.count} uses ({item.pct}%)</span>
                  </div>
                  <div className="analytics-bar-track">
                    <div
                      className={`analytics-bar-fill fill-gradient-${i + 1}`}
                      style={{ width: `${barWidth}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* B) Rule Density Distribution */}
        <div className="analytics-section-card">
          <div className="analytics-section-header">
            <div>
              <div className="analytics-section-title">Rule Density Distribution</div>
              <div className="analytics-section-desc">Categorization of stylesheet complexity per rule</div>
            </div>
            <span className="analytics-tag">Complexity</span>
          </div>

          {/* Density Multi-Bar */}
          <div className="analytics-density-track">
            <div className="analytics-density-segment light" style={{ width: `${lightPct}%` }} title={`Light: ${density.light} rules (${lightPct}%)`}></div>
            <div className="analytics-density-segment moderate" style={{ width: `${modPct}%` }} title={`Moderate: ${density.moderate} rules (${modPct}%)`}></div>
            <div className="analytics-density-segment dense" style={{ width: `${densePct}%` }} title={`Dense: ${density.dense} rules (${densePct}%)`}></div>
          </div>

          {/* Density Tiles */}
          <div className="analytics-density-tiles">
            <div className="density-tile tile-light">
              <div className="density-dot dot-light"></div>
              <div>
                <div className="density-val">{density.light} rules <span className="density-pct">({lightPct}%)</span></div>
                <div className="density-lbl">Light (1–3 properties)</div>
              </div>
            </div>
            <div className="density-tile tile-moderate">
              <div className="density-dot dot-moderate"></div>
              <div>
                <div className="density-val">{density.moderate} rules <span className="density-pct">({modPct}%)</span></div>
                <div className="density-lbl">Moderate (4–7 properties)</div>
              </div>
            </div>
            <div className="density-tile tile-dense">
              <div className="density-dot dot-dense"></div>
              <div>
                <div className="density-val">{density.dense} rules <span className="density-pct">({densePct}%)</span></div>
                <div className="density-lbl">Dense (8+ properties)</div>
              </div>
            </div>
          </div>
        </div>

        {/* C) Selector Breakdown */}
        <div className="analytics-section-card full-width">
          <div className="analytics-section-header">
            <div>
              <div className="analytics-section-title">Selector Type Breakdown</div>
              <div className="analytics-section-desc">Proportions of Class, ID, Root/Tag, and Pseudo selectors</div>
            </div>
            <span className="analytics-tag">Selectors</span>
          </div>

          {/* Segmented Bar */}
          <div className="analytics-density-track" style={{ height: '14px', marginBottom: '1.5rem' }}>
            <div className="analytics-density-segment sel-class" style={{ width: `${selClassPct}%` }} title={`Class: ${selectors.class} (${selClassPct}%)`}></div>
            <div className="analytics-density-segment sel-id" style={{ width: `${selIdPct}%` }} title={`ID: ${selectors.id} (${selIdPct}%)`}></div>
            <div className="analytics-density-segment sel-pseudo" style={{ width: `${selPseudoPct}%` }} title={`Pseudo: ${selectors.pseudo} (${selPseudoPct}%)`}></div>
            <div className="analytics-density-segment sel-tag" style={{ width: `${selTagPct}%` }} title={`Tag/Root: ${selectors.tag} (${selTagPct}%)`}></div>
          </div>

          {/* Selector Metric Cards */}
          <div className="analytics-selector-grid">
            <div className="analytics-sel-box box-class">
              <div className="sel-box-header">
                <span className="sel-badge class">.class</span>
                <span className="sel-pct">{selClassPct}%</span>
              </div>
              <div className="sel-box-count">{selectors.class} Rules</div>
              <div className="sel-box-sub">Class selectors (.btn, .card)</div>
            </div>

            <div className="analytics-sel-box box-id">
              <div className="sel-box-header">
                <span className="sel-badge id">#id</span>
                <span className="sel-pct">{selIdPct}%</span>
              </div>
              <div className="sel-box-count">{selectors.id} Rules</div>
              <div className="sel-box-sub">ID selectors (#app, #nav)</div>
            </div>

            <div className="analytics-sel-box box-pseudo">
              <div className="sel-box-header">
                <span className="sel-badge pseudo">:pseudo</span>
                <span className="sel-pct">{selPseudoPct}%</span>
              </div>
              <div className="sel-box-count">{selectors.pseudo} Rules</div>
              <div className="sel-box-sub">Pseudo states (:hover, ::after)</div>
            </div>

            <div className="analytics-sel-box box-tag">
              <div className="sel-box-header">
                <span className="sel-badge tag">tag/*</span>
                <span className="sel-pct">{selTagPct}%</span>
              </div>
              <div className="sel-box-count">{selectors.tag} Rules</div>
              <div className="sel-box-sub">HTML tags, :root & *</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
