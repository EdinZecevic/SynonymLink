import React, { useState } from 'react';
import { ArrowRight, Search, Share2, Activity, Moon, Sun, User, RefreshCw } from 'lucide-react';

interface LandingPageProps {
  onStartSession: (name: string, isNew: boolean) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStartSession, theme, toggleTheme }) => {
  const [nameInput, setNameInput] = useState('');
  const [showNameForm, setShowNameForm] = useState(false);

  // Check if a session already exists
  const existingName = localStorage.getItem('synonym_link_username');
  const existingUuid = localStorage.getItem('synonym_link_uuid');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nameInput.trim()) {
      onStartSession(nameInput.trim(), true);
    }
  };

  return (
    <div className="landing-container animate-fade-in">
      {/* Floating Decorative Gradients */}
      <div className="blob blob-1"></div>
      <div className="blob blob-2"></div>

      {/* Header with Theme Toggle */}
      <header className="landing-header">
        <div className="logo-group">
          <Share2 className="logo-icon animate-pulse" />
          <span className="logo-text">SynonymLink</span>
        </div>
        <button onClick={toggleTheme} className="theme-toggle-btn" aria-label="Toggle theme">
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </header>

      {/* Hero Section */}
      <main className="landing-hero">
        <div className="hero-content">
          <div className="badge">Advanced NLP & Graph Visualization</div>
          <h1 className="hero-title">
            Explore the Hidden Connections of <span className="gradient-text">Language</span>
          </h1>
          <p className="hero-subtitle">
            A production-ready dictionary management tool featuring transitive relationships, live sentence parsing, and an isolated guest-session web graph.
          </p>

          <div className="cta-container">
            {existingName && !showNameForm ? (
              <div className="existing-session-card card-glass animate-fade-in">
                <div className="user-info">
                  <User className="user-icon" size={24} />
                  <div>
                    <div className="user-greeting">Welcome back, <strong>{existingName}</strong>!</div>
                    <div className="user-uuid-sub">Session ID: {existingUuid?.substring(0, 8)}...</div>
                  </div>
                </div>
                <div className="existing-session-actions">
                  <button 
                    onClick={() => onStartSession(existingName, false)} 
                    className="btn btn-primary btn-hero animate-pulse-slow"
                  >
                    Continue Session
                    <ArrowRight size={18} className="arrow-icon" />
                  </button>
                  <button 
                    onClick={() => setShowNameForm(true)} 
                    className="btn btn-secondary btn-reset-session"
                  >
                    <RefreshCw size={14} />
                    Start New Session
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="landing-form card-glass animate-fade-in">
                <div className="form-input-group">
                  <User size={18} className="input-icon" />
                  <input
                    type="text"
                    className="input-field landing-input"
                    placeholder="Enter interviewer name..."
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    maxLength={30}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary btn-hero">
                  Get Started
                  <ArrowRight size={18} className="arrow-icon" />
                </button>
                {existingName && (
                  <button 
                    type="button" 
                    onClick={() => setShowNameForm(false)} 
                    className="btn-cancel-new"
                  >
                    Cancel
                  </button>
                )}
              </form>
            )}
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="hero-features">
          <div className="card-glass feature-card">
            <Search className="feature-icon" />
            <h3>Transitive Lookup</h3>
            <p>If A is a synonym to B, and B to C, lookup immediately resolves and links A and C together.</p>
          </div>

          <div className="card-glass feature-card">
            <Activity className="feature-icon" />
            <h3>Live Sentence Analyzer</h3>
            <p>Type complete sentences and watch synonyms appear instantly above each recognized word as you write.</p>
          </div>

          <div className="card-glass feature-card">
            <Share2 className="feature-icon" />
            <h3>Interactive Relationship Graph</h3>
            <p>Browse a visual, force-directed network showing word clusters color-coded by semantic groups.</p>
          </div>
        </div>
      </main>

      {/* CSS Styles Local to Landing Page */}
      <style>{`
        .landing-container {
          min-height: 100vh;
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          padding: 20px 40px;
          overflow: hidden;
        }

        /* Decorative Background Elements */
        .blob {
          position: absolute;
          width: 400px;
          height: 400px;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.15;
          z-index: -1;
          pointer-events: none;
        }

        .dark .blob {
          opacity: 0.25;
        }

        .blob-1 {
          background-color: var(--accent);
          top: -100px;
          left: -100px;
        }

        .blob-2 {
          background: radial-gradient(circle, #f43f5e 0%, var(--accent) 100%);
          bottom: -100px;
          right: -100px;
        }

        /* Header */
        .landing-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          max-width: 1200px;
          margin-bottom: 60px;
          z-index: 10;
        }

        .logo-group {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .logo-icon {
          color: var(--accent);
          width: 32px;
          height: 32px;
        }

        .logo-text {
          font-family: var(--font-heading);
          font-size: 22px;
          font-weight: 700;
          letter-spacing: -0.5px;
          background: linear-gradient(135deg, var(--text-primary) 30%, var(--accent) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .theme-toggle-btn {
          background: var(--bg-glass);
          border: 1px solid var(--border);
          border-radius: 50%;
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: var(--text-primary);
          transition: background-color var(--transition-fast), border-color var(--transition-fast);
        }

        .theme-toggle-btn:hover {
          background-color: var(--accent-soft);
          border-color: var(--accent);
        }

        /* Hero */
        .landing-hero {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 100%;
          max-width: 1200px;
          z-index: 10;
          text-align: center;
          gap: 60px;
        }

        .hero-content {
          max-width: 800px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
        }

        .badge {
          background-color: var(--accent-soft);
          color: var(--accent);
          font-family: var(--font-heading);
          font-weight: 600;
          font-size: 13px;
          padding: 6px 16px;
          border-radius: var(--radius-full);
          border: 1px solid rgba(79, 70, 229, 0.2);
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .hero-title {
          font-size: clamp(36px, 6vw, 68px);
          font-weight: 800;
          letter-spacing: -2px;
          line-height: 1.1;
        }

        .gradient-text {
          background: linear-gradient(135deg, var(--accent) 30%, #ec4899 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .hero-subtitle {
          font-size: clamp(16px, 2vw, 19px);
          color: var(--text-secondary);
          max-width: 680px;
          line-height: 1.6;
        }

        .cta-container {
          margin-top: 10px;
          width: 100%;
          display: flex;
          justify-content: center;
        }

        .btn-hero {
          font-size: 16px;
          padding: 16px 36px;
          border-radius: var(--radius-md);
          font-weight: 600;
        }

        .arrow-icon {
          transition: transform var(--transition-fast);
        }

        .btn-hero:hover .arrow-icon {
          transform: translateX(4px);
        }

        /* Forms */
        .landing-form {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 12px 8px 20px;
          border-radius: var(--radius-md);
          width: 100%;
          max-width: 500px;
          box-shadow: var(--shadow-md);
          border: 1px solid var(--border);
        }

        .form-input-group {
          display: flex;
          align-items: center;
          gap: 10px;
          flex: 1;
        }

        .input-icon {
          color: var(--text-muted);
        }

        .landing-input {
          border: none !important;
          background: transparent !important;
          padding: 8px 0 !important;
          box-shadow: none !important;
          color: var(--text-primary);
          font-size: 15px;
          outline: none;
          width: 100%;
        }

        .existing-session-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          padding: 24px;
          border-radius: var(--radius-md);
          width: 100%;
          max-width: 500px;
          border: 1px solid var(--border);
          box-shadow: var(--shadow-md);
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 14px;
          text-align: left;
          width: 100%;
        }

        .user-icon {
          color: var(--accent);
          background-color: var(--accent-soft);
          padding: 10px;
          border-radius: 50%;
          width: 44px;
          height: 44px;
        }

        .user-greeting {
          font-size: 16px;
          color: var(--text-primary);
        }

        .user-greeting strong {
          color: var(--accent);
        }

        .user-uuid-sub {
          font-size: 12px;
          color: var(--text-muted);
          font-family: monospace;
          margin-top: 2px;
        }

        .existing-session-actions {
          display: flex;
          gap: 12px;
          width: 100%;
        }

        .existing-session-actions .btn {
          flex: 1;
          justify-content: center;
        }

        .btn-reset-session {
          background-color: transparent;
          border: 1px solid var(--border);
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
          transition: all var(--transition-fast);
        }

        .btn-reset-session:hover {
          background-color: var(--accent-soft);
          border-color: var(--accent);
          color: var(--accent);
        }

        .btn-cancel-new {
          background: none;
          border: none;
          color: var(--text-muted);
          font-size: 13px;
          cursor: pointer;
          transition: color var(--transition-fast);
          padding: 8px 16px;
          text-decoration: underline;
        }

        .btn-cancel-new:hover {
          color: var(--text-primary);
        }

        .animate-pulse-slow {
          animation: pulse-glow 3s infinite ease-in-out;
        }

        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 0px var(--accent-soft);
          }
          50% {
            box-shadow: 0 0 15px var(--accent);
          }
        }

        /* Features */
        .hero-features {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 24px;
          width: 100%;
          margin-bottom: 40px;
        }

        .feature-card {
          text-align: left;
          display: flex;
          flex-direction: column;
          gap: 12px;
          border-radius: var(--radius-md);
        }

        .feature-icon {
          color: var(--accent);
          width: 44px;
          height: 44px;
          padding: 8px;
          background-color: var(--accent-soft);
          border-radius: var(--radius-sm);
        }

        .feature-card h3 {
          font-size: 18px;
          font-weight: 600;
        }

        .feature-card p {
          font-size: 14px;
          color: var(--text-secondary);
          line-height: 1.5;
        }

        @media (max-width: 768px) {
          .landing-container {
            padding: 16px;
          }
          .landing-header {
            margin-bottom: 24px;
          }
          .landing-hero {
            gap: 32px;
          }
          .hero-features {
            grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
            gap: 16px;
          }
          .feature-card {
            padding: 16px;
          }
        }

        @media (max-width: 600px) {
          .landing-form {
            flex-direction: column;
            padding: 16px;
            gap: 12px;
            align-items: stretch;
          }
          .form-input-group {
            border-bottom: 1px solid var(--border);
            padding-bottom: 6px;
          }
          .existing-session-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};
