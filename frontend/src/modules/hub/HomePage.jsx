import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MilestoneCardSkeleton } from '../../components/Skeleton';

export default function HomePage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Brief system mounting & health verification
    const timer = setTimeout(() => setLoading(false), 450);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="home-layout">
      {/* Top Navbar */}
      <nav className="navbar">
        <div className="navbar-brand">
          <Link to="/" className="nav-home-btn" title="Return to Entrance">
            <span style={{ fontSize: '14px', marginRight: '4px' }}>&larr;</span> Entrance
          </Link>
          <div className="navbar-logo" style={{ background: 'linear-gradient(135deg, #6366f1, #3b82f6)' }}>
            M
          </div>
          <div>
            <div className="navbar-title">Engineering Milestones Hub</div>
            <div className="navbar-subtitle">FastAPI &amp; AI Engineering Suite</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span className="navbar-badge">v2.0 Architecture</span>
          <span className="badge badge-low">FastAPI + React</span>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="home-container">
        <header className="home-hero">
          <div className="home-badge">System Overview &bull; Dual-Milestone Architecture</div>
          <h1 className="home-title">Milestone Engineering Platform</h1>
          <p className="home-subtitle">
            Explore independent engineering modules: AST CSS Analysis &amp; Deterministic Function-Calling AI.
          </p>
        </header>

        {/* Vertical Card Layout */}
        <div className="home-cards-vertical">
          {loading ? (
            <>
              <MilestoneCardSkeleton />
              <MilestoneCardSkeleton />
            </>
          ) : (
            <>
          {/* Card 1: Milestone 1 */}
          <div className="milestone-card">
            <div className="milestone-card-top">
              <div className="milestone-icon-wrapper" style={{ background: 'rgba(99, 102, 241, 0.15)', borderColor: 'rgba(99, 102, 241, 0.4)' }}>
                <span style={{ fontSize: '24px' }}>🎨</span>
              </div>
              <div className="milestone-meta">
                <span className="badge badge-mid">Milestone 1</span>
                <span className="milestone-status">Completed &amp; Verified</span>
              </div>
            </div>

            <div className="milestone-card-content">
              <h2 className="milestone-card-title">Milestone 1: CSS Parser &amp; Metrics Analyzer</h2>
              <p className="milestone-card-desc">
                Parses raw CSS into structured AST-like rules, extracts selectors and declarations, and computes density and complexity metrics.
              </p>

              <div className="milestone-features">
                <div className="feature-pill">AST Rule Tokenization</div>
                <div className="feature-pill">Selector Breakdown</div>
                <div className="feature-pill">Complexity Scoring</div>
                <div className="feature-pill">Groq AI Stylesheet Audit</div>
              </div>
            </div>

            <div className="milestone-card-footer">
              <Link to="/milestone-1" className="btn btn-primary milestone-launch-btn">
                Launch Milestone 1 &rarr;
              </Link>
            </div>
          </div>

          {/* Card 2: Milestone 2 */}
          <div className="milestone-card milestone-card-highlight">
            <div className="milestone-card-top">
              <div className="milestone-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.15)', borderColor: 'rgba(16, 185, 129, 0.4)' }}>
                <span style={{ fontSize: '24px' }}>🤖</span>
              </div>
              <div className="milestone-meta">
                <span className="badge badge-low">Milestone 2</span>
                <span className="milestone-status" style={{ color: '#10b981' }}>New Feature</span>
              </div>
            </div>

            <div className="milestone-card-content">
              <h2 className="milestone-card-title">Milestone 2: Function Calling AI Agent</h2>
              <p className="milestone-card-desc">
                Augmented LLM agent executing external deterministic tools for calculations and inventory lookups without hallucination.
              </p>

              <div className="milestone-features">
                <div className="feature-pill">calculate_metrics (Safe AST Math)</div>
                <div className="feature-pill">get_product_specs (Catalog Lookup)</div>
                <div className="feature-pill">Anti-Hallucination Guardrails</div>
                <div className="feature-pill">Determinism Check (temp = 0.0)</div>
              </div>
            </div>

            <div className="milestone-card-footer">
              <Link to="/milestone-2" className="btn btn-primary milestone-launch-btn" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                Launch Milestone 2 &rarr;
              </Link>
            </div>
          </div>
            </>
          )}
        </div>

        {/* Footer info */}
        <footer className="home-footer">
          <div>FastAPI Backend running on <code>http://localhost:8000</code></div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '4px' }}>
            Both milestones operate independently with decoupled routers and strictly isolated states.
          </div>
        </footer>
      </div>
    </div>
  );
}
