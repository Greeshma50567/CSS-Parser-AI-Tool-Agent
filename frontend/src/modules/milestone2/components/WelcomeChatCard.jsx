import React from 'react';

export const WELCOME_TOPICS = [
  { icon: '🐍', title: 'Python', desc: 'GIL, memory management, decorators & generators', prompt: 'Explain the Python Global Interpreter Lock (GIL) and why it matters for multi-threading.' },
  { icon: '⚡', title: 'JavaScript', desc: 'Event loop, microtasks, closures & promises', prompt: 'How does the JavaScript event loop and microtask queue handle asynchronous execution?' },
  { icon: '⚛️', title: 'React', desc: 'Virtual DOM, Fiber reconciliation, hooks & memo', prompt: 'How does React Virtual DOM and Fiber reconciliation algorithm work under the hood?' },
  { icon: '🗄️', title: 'Databases', desc: 'SQL joins, B-Tree indexes & isolation levels', prompt: 'Explain how B-Tree indexes optimize SQL database queries.' },
  { icon: '💾', title: 'Transactions', desc: 'ACID guarantees, concurrency & locking', prompt: 'What are ACID properties and isolation levels in relational databases?' },
  { icon: '📊', title: 'Algorithms', desc: 'Big-O notation, sorting, Trees & Graph search', prompt: 'Explain Big-O time and space complexity with common algorithm examples.' },
  { icon: '🛡️', title: 'Web Security', desc: 'CORS, XSS, CSRF, SQL Injection & JWT security', prompt: 'What is CORS and how do you configure it in web APIs?' },
  { icon: '🧮', title: 'Math & Tools', desc: 'Safe AST math evaluation & inventory lookups', prompt: 'What is 25 multiplied by 4?' }
];

export default function WelcomeChatCard({ onSelectPrompt }) {
  return (
    <div className="welcome-chat-card">
      <div className="welcome-header">
        <div className="welcome-title-row">
          <div className="modular-badge">
            <span className="modular-badge-id">MODULE 2.1</span>
            <span className="modular-badge-sep">&bull;</span>
            <span className="modular-badge-label">DOMAIN CATALOG &amp; TOOLS</span>
            <span className="modular-pulse-dot" />
          </div>
          <span className="welcome-engine-tag">⚡ Groq LLM &bull; Local Deterministic Tools</span>
        </div>
        <h3 className="welcome-heading">👋 Welcome to Programming AI Assistant!</h3>
        <p className="welcome-subtext">
          I provide verified, concise computer science knowledge and execute deterministic Python tools without hallucination.
        </p>
      </div>

      <div className="welcome-topics-grid">
        {WELCOME_TOPICS.map((t, idx) => (
          <div
            key={idx}
            className="welcome-topic-box"
            onClick={() => onSelectPrompt(t.prompt)}
            title={`Click to ask: "${t.prompt}"`}
          >
            <div className="topic-icon-wrap">{t.icon}</div>
            <div className="topic-info">
              <div className="topic-title">{t.title}</div>
              <div className="topic-desc">{t.desc}</div>
            </div>
            <span className="topic-arrow">&rarr;</span>
          </div>
        ))}
      </div>

      <div className="welcome-footer-hint">
        <span style={{ fontSize: '1.1rem' }}>💡</span>
        <span>Click any topic card above to explore, or type your custom inquiry below!</span>
      </div>
    </div>
  );
}
