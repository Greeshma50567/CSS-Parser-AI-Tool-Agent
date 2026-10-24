import React from 'react';

export default function ModuleHero() {
  return (
    <div className="hero module-hero">
      <div className="modular-badge hero-modular-badge">
        <span className="modular-badge-id">MODULE 1</span>
        <span className="modular-badge-sep">&bull;</span>
        <span className="modular-badge-label">CSS AST ENGINE &amp; GROQ AUDITOR</span>
        <span className="modular-pulse-dot" />
      </div>

      <h1 className="hero-title">
        Parse and Audit Your <span>CSS Stylesheets</span>
      </h1>
      <p className="hero-desc">
        Upload any .css file or paste raw stylesheet code to extract structured AST rules,
        calculate design tokens, and execute real-time Groq AI audits.
      </p>

      <div className="hero-stats">
        <div className="stat">
          <div className="stat-value">4</div>
          <div className="stat-label">API Endpoints</div>
        </div>
        <div className="stat">
          <div className="stat-value">120B</div>
          <div className="stat-label">Groq Model</div>
        </div>
        <div className="stat">
          <div className="stat-value">Fast</div>
          <div className="stat-label">AST Parsing</div>
        </div>
      </div>
    </div>
  );
}
