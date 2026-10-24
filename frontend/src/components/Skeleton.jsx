import React from 'react';

// ============================================================================
// 1. PRIMITIVE SKELETON COMPONENT
// ============================================================================

export function Skeleton({
  width = '100%',
  height = '1rem',
  variant = 'rect', // 'text' | 'rect' | 'circle' | 'pill'
  className = '',
  style = {}
}) {
  const getRadius = () => {
    switch (variant) {
      case 'circle': return '50%';
      case 'pill': return '99px';
      case 'text': return '4px';
      default: return 'var(--radius-sm, 8px)';
    }
  };

  return (
    <div
      className={`skeleton-base skeleton-shimmer ${className}`}
      style={{
        width,
        height,
        borderRadius: getRadius(),
        ...style
      }}
      aria-hidden="true"
    />
  );
}

// ============================================================================
// 2. MILESTONE 1 SKELETON COMPONENTS
// ============================================================================

export function SkeletonRuleCard() {
  return (
    <div className="skeleton-rule-card">
      {/* Header */}
      <div className="skeleton-card-header">
        <Skeleton width="55%" height="16px" variant="text" />
        <Skeleton width="60px" height="20px" variant="pill" />
      </div>

      {/* Property rows */}
      <div className="skeleton-card-body">
        <div className="skeleton-prop-row">
          <Skeleton width="35%" height="13px" variant="text" />
          <Skeleton width="45%" height="13px" variant="text" />
        </div>
        <div className="skeleton-prop-row">
          <Skeleton width="28%" height="13px" variant="text" />
          <Skeleton width="50%" height="13px" variant="text" />
        </div>
        <div className="skeleton-prop-row">
          <Skeleton width="40%" height="13px" variant="text" />
          <Skeleton width="38%" height="13px" variant="text" />
        </div>
        <div className="skeleton-prop-row">
          <Skeleton width="30%" height="13px" variant="text" />
          <Skeleton width="55%" height="13px" variant="text" />
        </div>
      </div>

      {/* Footer */}
      <div className="skeleton-card-footer">
        <Skeleton width="85px" height="14px" variant="text" />
      </div>
    </div>
  );
}

export function Milestone1Skeleton({ loadMsg = 'Parsing CSS rules...', isAi = false }) {
  return (
    <div className="skeleton-milestone1-wrapper" role="status" aria-label="Loading CSS parser results">
      {/* 1. Pulsing Status Indicator Banner */}
      <div className="skeleton-status-banner">
        <div className="skeleton-pulse-ring">
          <span className="skeleton-pulse-dot"></span>
        </div>
        <div className="skeleton-status-text">
          <span className="skeleton-status-title">{loadMsg}</span>
          <span className="skeleton-status-sub">
            {isAi
              ? 'Extracting AST tokens, checking syntax specificity, and generating Groq AI audit...'
              : 'Tokenizing CSS stylesheet into structured AST rules...'}
          </span>
        </div>
      </div>

      {/* 2. Skeleton Summary Bar */}
      <div className="skeleton-summary-bar">
        <div className="skeleton-stat-item">
          <Skeleton width="36px" height="36px" variant="rect" style={{ borderRadius: '8px' }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <Skeleton width="80px" height="18px" variant="text" />
            <Skeleton width="50px" height="12px" variant="text" />
          </div>
        </div>
        <div className="skeleton-stat-item">
          <Skeleton width="36px" height="36px" variant="rect" style={{ borderRadius: '8px' }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <Skeleton width="45px" height="18px" variant="text" />
            <Skeleton width="65px" height="12px" variant="text" />
          </div>
        </div>
        <div className="skeleton-stat-item">
          <Skeleton width="36px" height="36px" variant="rect" style={{ borderRadius: '8px' }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <Skeleton width="60px" height="18px" variant="text" />
            <Skeleton width="75px" height="12px" variant="text" />
          </div>
        </div>
        <div className="skeleton-summary-actions">
          <Skeleton width="85px" height="32px" variant="pill" />
          <Skeleton width="95px" height="32px" variant="pill" />
        </div>
      </div>

      {/* 3. Skeleton Filter Pills & View Switcher */}
      <div className="skeleton-toolbar-row">
        <div className="skeleton-filter-pills">
          <Skeleton width="45px" height="14px" variant="text" style={{ marginRight: '8px' }} />
          {['50px', '60px', '55px', '75px', '65px'].map((w, idx) => (
            <Skeleton key={idx} width={w} height="28px" variant="pill" />
          ))}
        </div>
        <div style={{ marginLeft: 'auto', minWidth: '180px' }}>
          <Skeleton width="100%" height="32px" variant="rect" style={{ borderRadius: '6px' }} />
        </div>
      </div>

      <div className="skeleton-toolbar-row" style={{ marginTop: '0.75rem' }}>
        <Skeleton width="40px" height="14px" variant="text" style={{ marginRight: '8px' }} />
        {['55px', '55px', '55px', '65px', '55px', '75px', '70px'].map((w, idx) => (
          <Skeleton key={idx} width={w} height="28px" variant="rect" style={{ borderRadius: '6px' }} />
        ))}
      </div>

      {/* 4. Skeleton Rule Cards Grid */}
      <div className="skeleton-cards-grid">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonRuleCard key={i} />
        ))}
      </div>

      {/* 5. Skeleton AI Review Card (if AI was requested) */}
      {isAi && (
        <div className="skeleton-ai-review">
          <div className="skeleton-ai-header">
            <Skeleton width="140px" height="20px" variant="text" />
            <Skeleton width="110px" height="16px" variant="text" style={{ marginLeft: '12px' }} />
            <Skeleton width="90px" height="24px" variant="pill" style={{ marginLeft: 'auto' }} />
          </div>
          <div className="skeleton-ai-body">
            <div className="skeleton-ai-section full-width">
              <Skeleton width="120px" height="14px" variant="text" style={{ marginBottom: '10px' }} />
              <Skeleton width="100%" height="14px" variant="text" style={{ marginBottom: '8px' }} />
              <Skeleton width="92%" height="14px" variant="text" style={{ marginBottom: '8px' }} />
              <Skeleton width="75%" height="14px" variant="text" />
            </div>

            <div className="skeleton-ai-section">
              <Skeleton width="100px" height="14px" variant="text" style={{ marginBottom: '12px' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Skeleton width="100%" height="36px" variant="rect" style={{ borderRadius: '6px' }} />
                <Skeleton width="100%" height="36px" variant="rect" style={{ borderRadius: '6px' }} />
              </div>
            </div>

            <div className="skeleton-ai-section">
              <Skeleton width="110px" height="14px" variant="text" style={{ marginBottom: '12px' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Skeleton width="100%" height="36px" variant="rect" style={{ borderRadius: '6px' }} />
                <Skeleton width="100%" height="36px" variant="rect" style={{ borderRadius: '6px' }} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 3. MILESTONE 2 (AI AGENT CHAT) SKELETON COMPONENT
// ============================================================================

export function Milestone2Skeleton() {
  return (
    <div className="chat-message-row assistant-row skeleton-chat-row" role="status" aria-label="AI Agent is thinking and executing tools">
      {/* Robot Avatar with Pulsing Halo */}
      <div className="chat-avatar skeleton-avatar-halo">
        🤖
      </div>

      {/* Main Assistant Skeleton Bubble */}
      <div className="chat-bubble assistant-bubble skeleton-chat-bubble">
        {/* Header */}
        <div className="chat-bubble-header">
          <span className="chat-bubble-role">AI Assistant</span>
          <span className="skeleton-thinking-badge">
            <span className="skeleton-thinking-pulse"></span>
            Executing deterministic tool &bull; Synthesizing answer...
          </span>
        </div>

        {/* Shimmering Tool Invocation Pill */}
        <div className="skeleton-tool-call">
          <span className="skeleton-tool-icon">⚙️</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
            <Skeleton width="130px" height="13px" variant="text" />
            <Skeleton width="220px" height="11px" variant="text" />
          </div>
          <Skeleton width="50px" height="18px" variant="pill" />
        </div>

        {/* Shimmering Response Lines */}
        <div className="skeleton-chat-content">
          <Skeleton width="45%" height="18px" variant="text" style={{ marginBottom: '12px' }} />
          <Skeleton width="100%" height="13px" variant="text" style={{ marginBottom: '8px' }} />
          <Skeleton width="96%" height="13px" variant="text" style={{ marginBottom: '8px' }} />
          <Skeleton width="82%" height="13px" variant="text" style={{ marginBottom: '14px' }} />

          {/* Shimmering Code Block Placeholder */}
          <div className="skeleton-code-box">
            <div className="skeleton-code-header">
              <Skeleton width="60px" height="12px" variant="text" />
              <Skeleton width="45px" height="18px" variant="pill" style={{ marginLeft: 'auto' }} />
            </div>
            <div className="skeleton-code-lines">
              <Skeleton width="75%" height="12px" variant="text" style={{ marginBottom: '6px' }} />
              <Skeleton width="88%" height="12px" variant="text" style={{ marginBottom: '6px' }} />
              <Skeleton width="60%" height="12px" variant="text" />
            </div>
          </div>

          <Skeleton width="90%" height="13px" variant="text" style={{ marginTop: '12px', marginBottom: '8px' }} />
          <Skeleton width="65%" height="13px" variant="text" />
        </div>

        {/* Shimmering Tags Row */}
        <div className="skeleton-tags-row">
          <Skeleton width="70px" height="20px" variant="pill" />
          <Skeleton width="90px" height="20px" variant="pill" />
          <Skeleton width="60px" height="20px" variant="pill" />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 4. HOME PAGE / MILESTONES HUB SKELETON
// ============================================================================

export function MilestoneCardSkeleton() {
  return (
    <div className="milestone-card skeleton-milestone-card">
      <div className="milestone-card-top">
        <Skeleton width="50px" height="50px" variant="rect" style={{ borderRadius: '12px' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <Skeleton width="90px" height="22px" variant="pill" />
          <Skeleton width="120px" height="12px" variant="text" />
        </div>
      </div>
      <div className="milestone-card-content" style={{ marginTop: '16px' }}>
        <Skeleton width="65%" height="24px" variant="text" style={{ marginBottom: '12px' }} />
        <Skeleton width="95%" height="14px" variant="text" style={{ marginBottom: '6px' }} />
        <Skeleton width="85%" height="14px" variant="text" style={{ marginBottom: '16px' }} />

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Skeleton width="130px" height="26px" variant="pill" />
          <Skeleton width="110px" height="26px" variant="pill" />
          <Skeleton width="120px" height="26px" variant="pill" />
        </div>
      </div>
      <div className="milestone-card-footer" style={{ marginTop: '20px' }}>
        <Skeleton width="160px" height="38px" variant="pill" />
      </div>
    </div>
  );
}
