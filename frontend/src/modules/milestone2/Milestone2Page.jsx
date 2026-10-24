import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../shared/Navbar';
import WelcomeChatCard from './components/WelcomeChatCard';
import AiResponseFormatter from '../../components/AiResponseFormatter';
import { sendChatMessage } from '../../api/agentApi';
import { Milestone2Skeleton } from '../../components/Skeleton';

function getCurrentTime() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function Milestone2Page() {
  const navigate = useNavigate();

  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: '__WELCOME_CARD__',
      timestamp: getCurrentTime(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  // Auto scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function handleSend(e) {
    if (e) e.preventDefault();
    const query = input.trim();
    if (!query || loading) return;

    setError(null);
    setInput('');

    // Append user message
    const userMsg = {
      id: 'user-' + Date.now(),
      role: 'user',
      content: query,
      timestamp: getCurrentTime(),
    };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const data = await sendChatMessage(query);
      const assistantMsg = {
        id: 'assistant-' + Date.now(),
        role: 'assistant',
        content: data.answer || 'No response returned from the agent.',
        timestamp: getCurrentTime(),
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      setError(err.message || 'Failed to connect to agent service.');
      const errorMsg = {
        id: 'error-' + Date.now(),
        role: 'assistant',
        content: `⚠️ **Service Error:** ${err.message || 'Could not reach agent backend. Please ensure the server is running.'}`,
        timestamp: getCurrentTime(),
        isError: true,
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  }

  function handleSelectPrompt(promptText) {
    setInput(promptText);
    setTimeout(() => {
      const inputEl = document.querySelector('.chat-input');
      if (inputEl) inputEl.focus();
    }, 50);
  }

  function handleClearChat() {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: '__WELCOME_CARD__',
        timestamp: getCurrentTime(),
      },
    ]);
    setError(null);
  }

  return (
    <div className="m2-layout">
      {/* Top Reusable Navbar */}
      <Navbar
        moduleName="Milestone 2: Programming AI Agent"
        subtitle="Groq LLM &bull; Programming Knowledge Base &bull; Deterministic Tools"
        logoText="AI"
        badgeText="Active Agent Ready"
        showBack={true}
        backTo={-1}
      />

      <div className="chat-container">
        {/* =========================================================================
            MODULE 2.2: REASONING & GROUNDED WORKSPACE CARD
            ========================================================================= */}
        <div className="chat-history-card modular-card">
          <div className="chat-card-top-bar">
            <div className="modular-badge">
              <span className="modular-badge-id">MODULE 2.2</span>
              <span className="modular-badge-sep">&bull;</span>
              <span className="modular-badge-label">GROUNDED CONVERSATION WORKSPACE</span>
              <span className="modular-pulse-dot" />
            </div>

            <div className="chat-top-actions">
              <button
                type="button"
                onClick={handleClearChat}
                className="btn btn-ghost btn-sm"
                title="Reset conversation back to welcome screen"
              >
                🧹 Clear Chat
              </button>
            </div>
          </div>

          <div className="chat-messages-scroll">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`chat-message-row ${msg.role === 'user' ? 'user-row' : 'assistant-row'}`}
              >
                {msg.role === 'user' ? (
                  <div className="chat-bubble user-bubble">
                    <div className="bubble-content">{msg.content}</div>
                    <div className="bubble-time">{msg.timestamp}</div>
                  </div>
                ) : msg.content === '__WELCOME_CARD__' ? (
                  <div className="chat-bubble assistant-bubble formatted-assistant-bubble welcome-bubble-wrap">
                    <WelcomeChatCard onSelectPrompt={handleSelectPrompt} />
                  </div>
                ) : (
                  <div className={`chat-bubble assistant-bubble formatted-assistant-bubble ${msg.isError ? 'error-bubble' : ''}`}>
                    <div className="bubble-content">
                      <AiResponseFormatter text={msg.content} />
                    </div>
                    <div className="bubble-time">{msg.timestamp}</div>
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="chat-message-row assistant-row">
                <div className="chat-bubble assistant-bubble formatted-assistant-bubble" style={{ width: '100%', maxWidth: '850px' }}>
                  <Milestone2Skeleton query={input} />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* =========================================================================
              MODULE 2.3: CONTROLLER & INPUT BAR
              ========================================================================= */}
          <div className="chat-input-bar">
            {/* Quick-Prompt suggestions chips */}
            <div className="chat-suggestions-bar">
              <span className="suggestions-label">💡 Suggested Queries:</span>
              <div className="suggestions-chips">
                <button type="button" className="chip" onClick={() => handleSelectPrompt('Explain the Python Global Interpreter Lock (GIL) in simple terms.')}>
                  🐍 Python GIL
                </button>
                <button type="button" className="chip" onClick={() => handleSelectPrompt('Explain how B-Tree indexes work in databases.')}>
                  🗄️ SQL Joins
                </button>
                <button type="button" className="chip" onClick={() => handleSelectPrompt('How does React Fiber reconciliation algorithm work?')}>
                  ⚛️ React Hooks
                </button>
                <button type="button" className="chip" onClick={() => handleSelectPrompt('What are ACID properties in database transactions?')}>
                  💾 ACID Properties
                </button>
                <button type="button" className="chip" onClick={() => handleSelectPrompt('What is Big-O complexity of quicksort and mergesort?')}>
                  📊 Big-O Notation
                </button>
                <button type="button" className="chip" onClick={() => handleSelectPrompt('What is CORS and how does it prevent cross-origin attacks?')}>
                  🛡️ CORS Security
                </button>
                <button type="button" className="chip" onClick={() => handleSelectPrompt('How does the JavaScript event loop handle microtasks vs macrotasks?')}>
                  ⚡ JS Event Loop
                </button>
              </div>
            </div>

            <form onSubmit={handleSend} className="chat-form">
              <div className="input-wrap">
                <span className="input-icon">💬</span>
                <input
                  type="text"
                  className="chat-input"
                  placeholder="Ask any programming question or tool query (e.g., Python GIL, React reconciliation, 25*4)..."
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  disabled={loading}
                  autoFocus
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary send-btn"
                disabled={loading || !input.trim()}
              >
                {loading ? 'Thinking...' : '🚀 Send'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
