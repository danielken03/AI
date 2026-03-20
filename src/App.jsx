import { useState, useRef, useEffect } from "react";

// Point this at your Flask server. In dev: http://localhost:5000
// In production: https://api.kenndoesdev.com or wherever you host Flask
const API_URL = "";

export default function App() {
  const [view, setView] = useState("home");       // "home" | "working"
  const [mode, setMode] = useState(null);          // "compose" | "reply"
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [homeCompose, setHomeCompose] = useState("");
  const [homeReply, setHomeReply] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(null);

  const composePlaceholders = [
    'e.g. "Write an email to my manager requesting Friday off..."',
    'e.g. "Email my colleagues to follow up on..."',
    'e.g. "Write a follow-up email after a job interview at Google..."',
    'e.g. "Email my team announcing a meeting change to Thursday..."',
    'e.g. "Invite my team to a meeting on Tuesday to go over..."',
  ];

  const replyPlaceholders = [
    'Paste the email thread here, then add: "Reply and say I can meet Thursday..."',
    'Paste the email thread here, then add: "Decline politely and suggest next week..."',
    'Paste the email thread here, then add: "Reply and ask for more details on the budget..."',
    'Paste the email thread here, then add: "Accept the offer and confirm the start date..."',
    'Paste the email thread here, then add: "Reply and say I need more time to review..."',
  ];

  const [composePlaceholder] = useState(
    () => composePlaceholders[Math.floor(Math.random() * composePlaceholders.length)]
  );
  const [replyPlaceholder] = useState(
    () => replyPlaceholders[Math.floor(Math.random() * replyPlaceholders.length)]
  );

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Focus the input when entering working view
  useEffect(() => {
    if (view === "working") {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [view]);

  // Send a message to the Flask backend
  const sendMessage = async (text, currentMessages, currentMode) => {
    const newMessages = [...currentMessages, { role: "user", content: text }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages, mode: currentMode }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setMessages([...newMessages, { role: "assistant", content: data.reply }]);
    } catch (err) {
      setMessages([
        ...newMessages,
        { role: "assistant", content: "Something went wrong — please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Called when user submits from the home screen
  const handleHomeSubmit = (selectedMode, text) => {
    if (!text.trim()) return;
    setMode(selectedMode);
    setMessages([]);
    setView("working");
    sendMessage(text, [], selectedMode);
  };

  // Called when user sends a follow-up in the working view
  const handleWorkingSubmit = () => {
    if (!inputText.trim() || loading) return;
    const text = inputText;
    setInputText("");
    sendMessage(text, messages, mode);
  };

  // Copy an AI message to clipboard
  const handleCopy = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopied(index);
    setTimeout(() => setCopied(null), 2000);
  };

  // Return to home and reset state
  const handleBack = () => {
    setView("home");
    setMode(null);
    setMessages([]);
    setInputText("");
    setHomeCompose("");
    setHomeReply("");
  };

  // Enter to send, Shift+Enter for newline
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleWorkingSubmit();
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg:          #0c0c0e;
          --surface:     #141416;
          --surface2:    #1c1c1f;
          --border:      #272729;
          --text:        #e8e3d9;
          --muted:       #6b6760;
          --gold:        #c9a84c;
          --gold-dim:    #7a6530;
          --radius:      4px;
          --font-serif:  'Cormorant Garamond', serif;
          --font-sans:   'DM Sans', sans-serif;
        }

        html, body, #root {
          height: 100%;
        }

        body {
          background: var(--bg);
          color: var(--text);
          font-family: var(--font-sans);
          font-weight: 300;
          -webkit-font-smoothing: antialiased;
        }

        /* ─── LAYOUT ─────────────────────────────────────── */
        .app {
          height: 100vh;
          display: flex;
          flex-direction: column;
        }

        /* ─── HEADER ─────────────────────────────────────── */
        .header {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 22px 40px;
          border-bottom: 1px solid var(--border);
          background: var(--surface);
        }

        .logo {
          font-family: var(--font-serif);
          font-size: 20px;
          font-weight: 300;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--text);
          user-select: none;
        }

        .logo span { color: var(--gold); }

        .mode-badge {
          font-size: 10px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--gold);
          border: 1px solid var(--gold-dim);
          padding: 4px 12px;
          border-radius: 2px;
        }

        .back-btn {
          background: none;
          border: 1px solid var(--border);
          color: var(--muted);
          padding: 7px 18px;
          font-family: var(--font-sans);
          font-size: 11px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          cursor: pointer;
          border-radius: var(--radius);
          transition: border-color 0.2s, color 0.2s;
        }

        .back-btn:hover {
          border-color: var(--muted);
          color: var(--text);
        }

        /* ─── HOME VIEW ──────────────────────────────────── */
        .home {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 48px;
          padding: 48px 40px;
          overflow-y: auto;
        }

        .tagline {
          text-align: center;
        }

        .tagline h1 {
          font-family: var(--font-serif);
          font-size: 44px;
          font-weight: 300;
          letter-spacing: 0.02em;
          line-height: 1.2;
          margin-bottom: 14px;
        }

        .tagline p {
          color: var(--muted);
          font-size: 14px;
          letter-spacing: 0.06em;
        }

        .panels {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          width: 100%;
          max-width: 960px;
        }

        .panel {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 28px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          transition: border-color 0.25s;
        }

        .panel:focus-within {
          border-color: var(--gold-dim);
        }

        .panel-tag {
          font-size: 9px;
          font-weight: 500;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: var(--gold);
        }

        .panel h2 {
          font-family: var(--font-serif);
          font-size: 24px;
          font-weight: 400;
          letter-spacing: 0.02em;
          color: var(--text);
        }

        .panel p {
          font-size: 13px;
          color: var(--muted);
          line-height: 1.65;
        }

        .panel textarea {
          width: 100%;
          min-height: 120px;
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          color: var(--text);
          font-family: var(--font-sans);
          font-size: 13px;
          font-weight: 300;
          line-height: 1.65;
          padding: 13px 15px;
          resize: vertical;
          outline: none;
          transition: border-color 0.2s;
        }

        .panel textarea:focus {
          border-color: var(--gold-dim);
        }

        .panel textarea::placeholder {
          color: var(--muted);
          font-size: 12px;
          font-style: italic;
        }

        .panel-footer {
          display: flex;
          justify-content: flex-end;
        }

        .primary-btn {
          background: var(--gold);
          color: #0c0c0e;
          border: none;
          padding: 10px 22px;
          font-family: var(--font-sans);
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          cursor: pointer;
          border-radius: var(--radius);
          transition: background 0.2s, opacity 0.2s;
        }

        .primary-btn:hover:not(:disabled) { background: #d4b464; }
        .primary-btn:disabled { opacity: 0.35; cursor: not-allowed; }

        /* ─── WORKING VIEW ───────────────────────────────── */
        .working {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 0;
          max-width: 800px;
          width: 100%;
          margin: 0 auto;
          padding: 0 32px;
        }

        /* Message thread */
        .messages {
          flex: 1;
          overflow-y: auto;
          padding: 32px 0 16px;
          display: flex;
          flex-direction: column;
          gap: 28px;
          min-height: 0;
        }

        .messages::-webkit-scrollbar { width: 3px; }
        .messages::-webkit-scrollbar-track { background: transparent; }
        .messages::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

        .message {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .msg-label {
          font-size: 9px;
          font-weight: 500;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--muted);
        }

        .message.assistant .msg-label { color: var(--gold); }

        .msg-body {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 18px 20px;
          font-size: 14px;
          line-height: 1.8;
          white-space: pre-wrap;
          word-break: break-word;
          color: var(--text);
        }

        .message.user .msg-body {
          background: var(--surface2);
          color: var(--muted);
          font-style: italic;
        }

        .msg-actions {
          display: flex;
          justify-content: flex-end;
        }

        .copy-btn {
          background: none;
          border: 1px solid var(--border);
          color: var(--muted);
          padding: 5px 14px;
          font-family: var(--font-sans);
          font-size: 10px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          cursor: pointer;
          border-radius: var(--radius);
          transition: all 0.2s;
        }

        .copy-btn:hover { border-color: var(--gold-dim); color: var(--gold); }
        .copy-btn.copied { border-color: var(--gold); color: var(--gold); }

        /* Typing indicator */
        .typing {
          display: flex;
          align-items: center;
          gap: 10px;
          color: var(--muted);
          font-size: 12px;
          letter-spacing: 0.05em;
          padding: 4px 0;
        }

        .dots { display: flex; gap: 4px; }
        .dots span {
          width: 5px; height: 5px;
          border-radius: 50%;
          background: var(--gold-dim);
          animation: blink 1.3s infinite;
        }
        .dots span:nth-child(2) { animation-delay: 0.18s; }
        .dots span:nth-child(3) { animation-delay: 0.36s; }

        @keyframes blink {
          0%, 70%, 100% { opacity: 0.2; transform: scale(0.75); }
          35% { opacity: 1; transform: scale(1); }
        }

        /* Input bar */
        .input-bar {
          flex-shrink: 0;
          border-top: 1px solid var(--border);
          padding: 18px 0 26px;
          display: flex;
          align-items: flex-end;
          gap: 10px;
        }

        .input-bar textarea {
          flex: 1;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          color: var(--text);
          font-family: var(--font-sans);
          font-size: 13px;
          font-weight: 300;
          line-height: 1.6;
          padding: 12px 15px;
          resize: none;
          outline: none;
          min-height: 46px;
          max-height: 150px;
          transition: border-color 0.2s;
        }

        .input-bar textarea:focus { border-color: var(--gold-dim); }
        .input-bar textarea::placeholder { color: var(--muted); font-style: italic; }

        .send-btn {
          flex-shrink: 0;
          width: 46px; height: 46px;
          background: var(--gold);
          border: none;
          border-radius: var(--radius);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s, opacity 0.2s;
        }

        .send-btn:hover:not(:disabled) { background: #d4b464; }
        .send-btn:disabled { opacity: 0.35; cursor: not-allowed; }

        .send-btn svg {
          width: 16px; height: 16px;
          fill: none;
          stroke: #0c0c0e;
          stroke-width: 2.2;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        /* ─── RESPONSIVE ─────────────────────────────────── */
        @media (max-width: 660px) {
          .panels { grid-template-columns: 1fr; }
          .tagline h1 { font-size: 32px; }
          .header { padding: 18px 24px; }
          .home { padding: 32px 24px; gap: 36px; }
          .working { padding: 0 20px; }
        }
      `}</style>

      <div className="app">

        {/* ── HEADER ── */}
        <header className="header">
          <div className="logo">Kenn<span>.</span>Mail</div>

          {view === "working" && mode && (
            <div className="mode-badge">
              {mode === "compose" ? "Compose" : "Reply"}
            </div>
          )}

          {view === "working" ? (
            <button className="back-btn" onClick={handleBack}>
              ← New Email
            </button>
          ) : (
            <div /> /* keeps logo left-aligned on home */
          )}
        </header>

        {/* ── HOME VIEW ── */}
        {view === "home" && (
          <main className="home">
            <div className="tagline">
              <h1>Write professional emails<br />that sound like you.</h1>
              <p>Time is money, be more productive with this AI agent.</p>
            </div>

            <div className="panels">

              {/* Compose panel */}
              <div className="panel">
                <div className="panel-tag">Compose</div>
                <h2>Write a new email</h2>
                <p>Describe what you want to say and who you're writing to.</p>
                <textarea
                  value={homeCompose}
                  onChange={(e) => setHomeCompose(e.target.value)}
                  placeholder={composePlaceholder}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleHomeSubmit("compose", homeCompose);
                    }
                  }}
                />
                <div className="panel-footer">
                  <button
                    className="primary-btn"
                    onClick={() => handleHomeSubmit("compose", homeCompose)}
                    disabled={!homeCompose.trim()}
                  >
                    Write Email →
                  </button>
                </div>
              </div>

              {/* Reply panel */}
              <div className="panel">
                <div className="panel-tag">Reply</div>
                <h2>Reply to an email</h2>
                <p>Paste the email or chain, then say how you want to respond.</p>
                <textarea
                  value={homeReply}
                  onChange={(e) => setHomeReply(e.target.value)}
                  placeholder={replyPlaceholder}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleHomeSubmit("reply", homeReply);
                    }
                  }}
                />
                <div className="panel-footer">
                  <button
                    className="primary-btn"
                    onClick={() => handleHomeSubmit("reply", homeReply)}
                    disabled={!homeReply.trim()}
                  >
                    Write Reply →
                  </button>
                </div>
              </div>

            </div>
          </main>
        )}

        {/* ── WORKING VIEW ── */}
        {view === "working" && (
          <div className="working">

            <div className="messages">
              {messages.map((msg, i) => (
                <div key={i} className={`message ${msg.role}`}>
                  <div className="msg-label">
                    {msg.role === "user" ? "You" : "MailAI"}
                  </div>
                  <div className="msg-body">{msg.content}</div>
                  {msg.role === "assistant" && (
                    <div className="msg-actions">
                      <button
                        className={`copy-btn ${copied === i ? "copied" : ""}`}
                        onClick={() => handleCopy(msg.content, i)}
                      >
                        {copied === i ? "✓ Copied" : "Copy Email"}
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="typing">
                  <div className="dots">
                    <span /><span /><span />
                  </div>
                  Writing your email...
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <div className="input-bar">
              <textarea
                ref={inputRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder='Refine it — e.g. "Make it shorter" or "Sound less formal"...'
                rows={1}
              />
              <button
                className="send-btn"
                onClick={handleWorkingSubmit}
                disabled={!inputText.trim() || loading}
              >
                <svg viewBox="0 0 24 24">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>

          </div>
        )}

      </div>
    </>
  );
}
