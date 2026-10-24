import React from 'react';

function bCls(n) { return n <= 5 ? 'badge badge-low' : n <= 15 ? 'badge badge-mid' : 'badge badge-high'; }
function bTxt(n) { return n <= 5 ? 'Simple' : n <= 15 ? 'Moderate' : 'Complex'; }
function isUrl(v) { return typeof v === 'string' && (v.includes('http') || v.includes('url(')); }
function isColor(v) { return typeof v === 'string' && (v.startsWith('#') || v.startsWith('rgb') || v.startsWith('hsl')); }

export default function RuleCard({ rule }) {
  const entries = Object.entries(rule.properties || {});
  return (
    <div className="rule-card">
      <div className="rule-card-header">
        <span className="rule-selector">{rule.selector}</span>
        <span className={bCls(rule.property_count)}>{bTxt(rule.property_count)}</span>
      </div>
      <div className="rule-props">
        {entries.slice(0, 8).map(([k, v]) => (
          <div key={k} className="prop-row">
            <span className="prop-key">{k}</span>
            <span className={isUrl(v) ? 'prop-val is-url' : isColor(v) ? 'prop-val is-color' : 'prop-val'} title={v}>{v}</span>
          </div>
        ))}
        {entries.length > 8 && (
          <div style={{ color: 'var(--text-muted)', fontSize: '.75rem', marginTop: 4 }}>
            +{entries.length - 8} more declarations
          </div>
        )}
      </div>
      <div className="rule-card-footer">
        <span style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>{rule.property_count} declarations</span>
      </div>
    </div>
  );
}
