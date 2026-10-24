import React from 'react';

export default function ModuleBadge({ module, label, status = 'active' }) {
  return (
    <div className="modular-badge">
      <span className="modular-badge-id">{module}</span>
      <span className="modular-badge-sep">&bull;</span>
      <span className="modular-badge-label">{label}</span>
      {status === 'active' && <span className="modular-pulse-dot" />}
    </div>
  );
}
