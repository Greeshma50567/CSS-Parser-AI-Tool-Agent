import { useState, useRef, useEffect } from 'react';
import { marked } from 'marked';

// Configure marked for clean GFM rendering
marked.setOptions({
  breaks: true,
  gfm: true,
});

// Map programming languages to icons
const LANG_ICONS = {
  PYTHON: '🐍',
  PY: '🐍',
  JAVASCRIPT: '⚡',
  JS: '⚡',
  TYPESCRIPT: '🔷',
  TS: '🔷',
  REACT: '⚛️',
  JSX: '⚛️',
  TSX: '⚛️',
  SQL: '🗄️',
  POSTGRESQL: '🐘',
  MYSQL: '🐬',
  HTML: '🌐',
  CSS: '🎨',
  JSON: '📄',
  BASH: '⚙️',
  SHELL: '⚙️',
  SH: '⚙️',
  C: '🔤',
  CPP: '⚡',
  JAVA: '☕',
  RUST: '🦀',
  GO: '🐹',
};

export default function AiResponseFormatter({ content, timestamp }) {
  const [copied, setCopied] = useState(false);
  const contentRef = useRef(null);

  // Clean mathematical delimiters like \( ... \) or \[ ... \] for cleaner display
  const cleanedContent = typeof content === 'string'
    ? content
        .split('\\(').join('')
        .split('\\)').join('')
        .split('\\[').join('')
        .split('\\]').join('')
    : '';

  // Parse markdown to HTML
  const rawHtml = marked.parse(cleanedContent || '');

  // Add rich headers and copy buttons to any <pre><code> blocks dynamically
  useEffect(() => {
    if (!contentRef.current) return;
    const preBlocks = contentRef.current.querySelectorAll('pre');

    preBlocks.forEach((pre) => {
      // Avoid duplicate toolbars
      if (pre.querySelector('.code-toolbar')) return;

      const codeElement = pre.querySelector('code');
      const codeText = codeElement ? codeElement.innerText : pre.innerText;

      // Detect language if present
      const className = codeElement ? codeElement.className : '';
      const langMatch = className.match(/language-(\w+)/);
      const rawLang = langMatch ? langMatch[1].toUpperCase() : 'CODE';
      const icon = LANG_ICONS[rawLang] || '💻';

      const toolbar = document.createElement('div');
      toolbar.className = 'code-toolbar';

      const langBadge = document.createElement('div');
      langBadge.className = 'code-lang-label';
      langBadge.innerHTML = `<span class="code-lang-icon">${icon}</span> <span>${rawLang}</span>`;

      const copyBtn = document.createElement('button');
      copyBtn.type = 'button';
      copyBtn.className = 'code-copy-btn';
      copyBtn.innerHTML = '📋 Copy';

      copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(codeText);
        copyBtn.innerHTML = '✓ Copied!';
        copyBtn.classList.add('copied');
        setTimeout(() => {
          copyBtn.innerHTML = '📋 Copy';
          copyBtn.classList.remove('copied');
        }, 2000);
      });

      toolbar.appendChild(langBadge);
      toolbar.appendChild(copyBtn);
      pre.insertBefore(toolbar, pre.firstChild);
    });

    // Wrap tables in responsive glass wrapper
    const tables = contentRef.current.querySelectorAll('table');
    tables.forEach(table => {
      if (table.parentElement && !table.parentElement.classList.contains('table-responsive-wrapper')) {
        const wrapper = document.createElement('div');
        wrapper.className = 'table-responsive-wrapper';
        table.parentNode.insertBefore(wrapper, table);
        wrapper.appendChild(table);
      }
    });

    // Enhance bullet list items with clean modern bullet markers
    const listItems = contentRef.current.querySelectorAll('li');
    listItems.forEach(li => {
      const text = li.innerText.trim();
      if (!li.dataset.enhanced) {
        li.dataset.enhanced = 'true';
        let bulletIcon = '✦';
        if (/^python/i.test(text)) bulletIcon = '🐍';
        else if (/^javascript|^typescript|^event loop/i.test(text)) bulletIcon = '⚡';
        else if (/^react|^hooks|^virtual dom/i.test(text)) bulletIcon = '⚛️';
        else if (/^database|^sql|^acid/i.test(text)) bulletIcon = '🗄️';
        else if (/^algorithm|^big-o|^dsa/i.test(text)) bulletIcon = '📊';
        else if (/^security|^cors|^jwt|^xss/i.test(text)) bulletIcon = '🛡️';
        else if (/^math|^calculate/i.test(text)) bulletIcon = '🧮';
        else if (/^note|^tip/i.test(text)) bulletIcon = '💡';
        else if (/^warning|^caution/i.test(text)) bulletIcon = '⚠️';
        
        li.setAttribute('data-bullet-icon', bulletIcon);
      }
    });
  }, [rawHtml]);

  function handleCopyAll() {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Check if response contains a reference citation or math calculation
  const hasCitation = content && (content.includes('Reference:') || content.includes('PROG-') || content.includes('DOC-'));
  const isCalculation = content && (content.includes('Evaluated') || (content.includes('=') && content.length < 80));

  return (
    <div className="ai-response-container">
      {/* Top action & info bar */}
      <div className="ai-response-header">
        <div className="ai-author-meta">
          <span className="ai-status-dot"></span>
          <span className="ai-author-name">🤖 Grounded Assistant</span>
          {hasCitation && (
            <span className="ai-citation-badge" title="Answer verified from local knowledge base">
              🛡️ Verified Fact
            </span>
          )}
          {isCalculation && (
            <span className="ai-citation-badge math-badge" title="Deterministic Math Tool Evaluated">
              🧮 Math Tool
            </span>
          )}
          <span className="ai-model-tag">⚡ Groq LLM</span>
        </div>

        <div className="ai-action-buttons">
          {timestamp && (
            <span className="ai-timestamp">
              ⏱️ {timestamp}
            </span>
          )}
          <button
            type="button"
            className={`btn-copy-response ${copied ? 'copied' : ''}`}
            onClick={handleCopyAll}
            title="Copy full response to clipboard"
          >
            {copied ? '✓ Copied' : '📋 Copy'}
          </button>
        </div>
      </div>

      {/* Formatted Markdown Content */}
      <div
        ref={contentRef}
        className="ai-markdown-content"
        dangerouslySetInnerHTML={{ __html: rawHtml }}
      />
    </div>
  );
}
