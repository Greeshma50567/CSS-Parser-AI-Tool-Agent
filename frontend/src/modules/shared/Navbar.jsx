import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Navbar({
  moduleName = "StyleScope AI",
  subtitle = "CSS Parser and Groq Auditor",
  logoText = "CSS",
  badgeText = "Groq Powered",
  showBack = false,
  backTo = "/"
}) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (backTo === -1) {
      if (window.history.state && window.history.state.idx > 0) {
        navigate(-1);
      } else {
        navigate('/milestones');
      }
    } else {
      navigate(backTo);
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        {showBack ? (
          <button
            type="button"
            onClick={handleBack}
            className="nav-home-btn"
            title="Return to previous page"
          >
            <span style={{ fontSize: '14px', marginRight: '4px' }}>&larr;</span> Back
          </button>
        ) : (
          <Link to="/milestones" className="nav-home-btn" title="Return to Milestone Hub">
            <span style={{ fontSize: '14px', marginRight: '4px' }}>&larr;</span> Milestones
          </Link>
        )}
        <div className="navbar-logo">{logoText}</div>
        <div>
          <div className="navbar-title">{moduleName}</div>
          <div className="navbar-subtitle">{subtitle}</div>
        </div>
      </div>
      <span className="navbar-badge">{badgeText}</span>
    </nav>
  );
}
