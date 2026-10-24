import { useNavigate } from 'react-router-dom';

export default function EntrancePage() {
  const navigate = useNavigate();

  function handleEnter() {
    navigate('/milestones');
  }

  return (
    <div className="entrance-page">
      {/* Sky Clouds Background using user's sky.png */}
      <div className="entrance-sky-bg" />

      {/* Main Glass Content Container */}
      <div className="entrance-content">
        <div className="entrance-badge">
          <span className="entrance-badge-icon">☁️</span>
          <span>Next-Gen Engineering Suite</span>
        </div>

        {/* Title with Logo Icon */}
        <div className="entrance-title-row">
          <img
            src="/stylescope_logo.png"
            alt="StyleScope Logo"
            className="entrance-logo-img"
          />
          <h1 className="entrance-title">
            STYLESCOPE AL
          </h1>
        </div>

        <p className="entrance-subtitle">
          Deterministic Function-Calling AI Agent &bull; AST CSS Metrics &bull; Full-Stack Architecture
        </p>

        {/* Custom Animated Button */}
        <div className="btn-wrapper">
          <button className="btn" onClick={handleEnter} aria-label="Enter Milestones Platform">
            <div className="txt-box">
              <span className="txt">Explore Milestones</span>
              <span className="txt">Enter Platform &rarr;</span>
            </div>

            <div className="frame">
              <div className="point top left"></div>
              <div className="point top right"></div>
              <div className="point bottom left"></div>
              <div className="point bottom right"></div>
            </div>
          </button>

          <span className="txt-secondary" id="hint1">
            Hover to preview
          </span>
          <span className="txt-secondary" id="hint2">
            Click to launch Milestone 1 &amp; 2
          </span>
        </div>

        {/* Feature Pills */}
        <div className="entrance-footer-tags">
          <div className="entrance-tag">🎨 Milestone 1: CSS Parser</div>
          <div className="entrance-tag">🤖 Milestone 2: AI Tool Agent</div>
          <div className="entrance-tag">⚡ Groq LLM &bull; FastAPI &bull; React</div>
        </div>
      </div>
    </div>
  );
}
