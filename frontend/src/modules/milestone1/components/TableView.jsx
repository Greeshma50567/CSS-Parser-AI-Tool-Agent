import React from 'react';

function bCls(n) { return n <= 5 ? 'badge badge-low' : n <= 15 ? 'badge badge-mid' : 'badge badge-high'; }

export default function TableView({ rules }) {
  return (
    <div className="table-wrap">
      <table className="rules-table">
        <thead>
          <tr><th>#</th><th>Selector</th><th>Count</th><th>Properties</th></tr>
        </thead>
        <tbody>
          {rules.map((r, i) => (
            <tr key={i}>
              <td>{i + 1}</td>
              <td><span className="table-selector">{r.selector}</span></td>
              <td><span className={bCls(r.property_count)}>{r.property_count}</span></td>
              <td>
                <div className="prop-tags">
                  {Object.keys(r.properties || {}).slice(0, 8).map(k => <span key={k} className="prop-tag">{k}</span>)}
                  {Object.keys(r.properties || {}).length > 8 && (
                    <span className="prop-tag">+{Object.keys(r.properties || {}).length - 8}</span>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
