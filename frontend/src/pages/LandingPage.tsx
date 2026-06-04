import React from 'react';
import { ArrowRight, Search, Share2, Activity, Moon, Sun } from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, theme, toggleTheme }) => {
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
            A production-ready dictionary management tool featuring transitive relationships, live sentence parsing, and an interactive network graph of over 1,000 words.
          </p>

          <div className="cta-container">
            <button onClick={onGetStarted} className="btn btn-primary btn-hero">
              Get Started
              <ArrowRight size={18} className="arrow-icon" />
            </button>
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
      `}</style>
    </div>
  );
};
