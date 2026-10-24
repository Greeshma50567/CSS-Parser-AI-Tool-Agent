import React from 'react';

export default function AiReviewCard({ review, filename }) {
  if (!review) return null;
  return (
    <div className="ai-review modular-card">
      <div className="modular-card-header">
        <div className="modular-badge">
          <span className="modular-badge-id">MODULE 1.4</span>
          <span className="modular-badge-sep">&bull;</span>
          <span className="modular-badge-label">GROQ AI DEEP AUDIT</span>
          <span className="modular-pulse-dot" />
        </div>
        <div className="ai-review-meta">
          <span className="ai-filename">{filename}</span>
          <span className="ai-review-model">openai/gpt-oss-120b</span>
        </div>
      </div>

      <div className="ai-review-body">
        <div className="ai-section full-width">
          <div className="ai-section-title" style={{ color: 'var(--accent-light)' }}>
            <span>📋</span> Executive Summary
          </div>
          <div className="ai-summary-text">{review.summary}</div>
        </div>

        <div className="ai-section">
          <div className="ai-section-title" style={{ color: 'var(--yellow)' }}>
            <span>💡</span> Suggestions &amp; Optimizations
          </div>
          <ul className="ai-list">
            {(review.suggestions || []).map((s, i) => <li key={i} data-icon="•">{s}</li>)}
          </ul>
        </div>

        <div className="ai-section">
          <div className="ai-section-title" style={{ color: 'var(--green)' }}>
            <span>♿</span> Accessibility &amp; Contrast
          </div>
          <ul className="ai-list">
            {(review.accessibility || []).map((a, i) => <li key={i} data-icon="✓">{a}</li>)}
          </ul>
        </div>

        <div className="ai-section full-width">
          <div className="ai-section-title" style={{ color: 'var(--blue)' }}>
            <span>⭐</span> Architecture &amp; Best Practices
          </div>
          <ul className="ai-list">
            {(review.best_practices || []).map((b, i) => <li key={i} data-icon="★">{b}</li>)}
          </ul>
        </div>
      </div>
    </div>
  );
}
