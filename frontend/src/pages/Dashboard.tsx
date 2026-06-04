import React, { useState } from 'react';
import { Share2, Plus, Search, Moon, Sun, ArrowLeft, Database, Sparkles, BookOpen } from 'lucide-react';
import { api } from '../services/api';

interface DashboardProps {
  onOpenGraph: () => void;
  onBackToLanding: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  renderAnalyzer: () => React.ReactNode; // Injected from step 9
  seedCount: number;
  setSeedCount: React.Dispatch<React.SetStateAction<number>>;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onOpenGraph,
  onBackToLanding,
  theme,
  toggleTheme,
  renderAnalyzer,
  seedCount,
  setSeedCount
}) => {
  // Add Pair Form State
  const [word1, setWord1] = useState('');
  const [word2, setWord2] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');

  // External Seeding State
  const [seedLoading, setSeedLoading] = useState(false);
  const [seedSuccessMessage, setSeedSuccessMessage] = useState('');

  // Add Synonym Pair handler
  const handleAddPair = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError('');
    setAddSuccess('');

    if (!word1.trim() || !word2.trim()) {
      setAddError('Both fields are required.');
      return;
    }

    if (word1.trim().toLowerCase() === word2.trim().toLowerCase()) {
      setAddError('A word cannot be a synonym of itself.');
      return;
    }

    setAddLoading(true);
    try {
      await api.addSynonymPair(word1, word2);
      setAddSuccess(`Linked "${word1}" and "${word2}" successfully!`);
      setWord1('');
      setWord2('');
      // Trigger search update if search query matches one of the words
      if (searchQuery && (searchQuery.toLowerCase() === word1.toLowerCase() || searchQuery.toLowerCase() === word2.toLowerCase())) {
        handleSearch(null);
      }
      // Increment count slightly for visualization
      setSeedCount(prev => prev > 0 ? prev + 1 : 2);
    } catch (err: any) {
      setAddError(err.message || 'An error occurred.');
    } finally {
      setAddLoading(false);
    }
  };

  // Search handler
  const handleSearch = async (e: React.FormEvent | null) => {
    if (e) e.preventDefault();
    setSearchError('');
    setSearchResults([]);

    if (!searchQuery.trim()) {
      return;
    }

    setSearchLoading(true);
    try {
      const results = await api.getSynonyms(searchQuery);
      setSearchResults(results);
      if (results.length === 0) {
        setSearchError(`No synonyms found for "${searchQuery}".`);
      }
    } catch (err: any) {
      setSearchError(err.message || 'Error executing search.');
    } finally {
      setSearchLoading(false);
    }
  };

  // External Seeding handler
  const handleSeedExternal = async () => {
    setSeedLoading(true);
    setSeedSuccessMessage('');
    try {
      const response = await api.seedExternal();
      setSeedCount(response.totalWords);
      setSeedSuccessMessage(`Successfully seeded! Loaded ${response.totalWords} unique words and relations.`);
    } catch (err: any) {
      setSeedSuccessMessage(`Error seeding: ${err.message}`);
    } finally {
      setSeedLoading(false);
    }
  };

  return (
    <div className="dashboard-container animate-fade-in">
      {/* Navigation Header */}
      <header className="dashboard-header card-glass">
        <div className="header-left">
          <button onClick={onBackToLanding} className="btn-back" title="Back to Landing Page">
            <ArrowLeft size={18} />
          </button>
          <div className="logo-group">
            <Share2 className="logo-icon" />
            <span className="logo-text">Dashboard</span>
          </div>
        </div>

        <div className="header-actions">
          {seedCount > 0 && (
            <button onClick={onOpenGraph} className="btn btn-primary btn-graph animate-pulse-slow">
              <Share2 size={16} />
              Open Visual Graph ({seedCount} Nodes)
            </button>
          )}
          <button onClick={toggleTheme} className="theme-toggle-btn">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </header>

      {/* Main Grid Workspace */}
      <main className="dashboard-grid">
        {/* Left Side: Synonym Editor & Single Word Search */}
        <section className="dashboard-left">
          {/* Manual Entry Form */}
          <div className="card-glass panel-card">
            <div className="panel-title-group">
              <Plus className="title-icon" />
              <h2>Add Synonym Pair</h2>
            </div>
            <p className="panel-desc">Define a new bi-directional connection between two words.</p>

            <form onSubmit={handleAddPair} className="panel-form">
              <div className="input-group">
                <label htmlFor="word1">First Word</label>
                <input
                  id="word1"
                  type="text"
                  className="input-field"
                  placeholder="e.g. clean"
                  value={word1}
                  onChange={(e) => setWord1(e.target.value)}
                />
              </div>

              <div className="input-group">
                <label htmlFor="word2">Second Word</label>
                <input
                  id="word2"
                  type="text"
                  className="input-field"
                  placeholder="e.g. wash"
                  value={word2}
                  onChange={(e) => setWord2(e.target.value)}
                />
              </div>

              {addError && <div className="message-box error-box">{addError}</div>}
              {addSuccess && <div className="message-box success-box">{addSuccess}</div>}

              <button type="submit" disabled={addLoading} className="btn btn-primary btn-submit">
                {addLoading ? <span className="spinner"></span> : 'Connect Words'}
              </button>
            </form>
          </div>

          {/* Bi-Directional Search Card */}
          <div className="card-glass panel-card">
            <div className="panel-title-group">
              <Search className="title-icon" />
              <h2>Bi-directional & Transitive Lookup</h2>
            </div>
            <p className="panel-desc">Search for a word to resolve all its linked synonyms transitively.</p>

            <form onSubmit={handleSearch} className="search-form">
              <div className="search-input-wrapper">
                <input
                  type="text"
                  className="input-field search-input"
                  placeholder="Enter word (e.g. clean, fast)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button type="submit" className="btn btn-primary btn-search-icon">
                  <Search size={18} />
                </button>
              </div>
            </form>

            {searchLoading && <div className="search-loader"><span className="spinner"></span> Resolving relationships...</div>}

            {searchError && <div className="message-box error-box search-msg">{searchError}</div>}

            {searchResults.length > 0 && (
              <div className="search-results animate-fade-in">
                <h3>Synonyms for &quot;{searchQuery}&quot;:</h3>
                <div className="results-list">
                  {searchResults.map((word, idx) => (
                    <span key={idx} className="result-badge animate-fade-in" style={{ animationDelay: `${idx * 40}ms` }}>
                      {word}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Right Side: Demo Seeding & Live Sentence Analyzer */}
        <section className="dashboard-right">
          {/* Seeding Action Card */}
          <div className="card-glass panel-card seed-card">
            <div className="panel-title-group">
              <Database className="title-icon text-accent" />
              <h2>External API Demo Seeding</h2>
            </div>
            <p className="panel-desc">
              Import a massive dataset of <strong>1,000+ words</strong> from the Datamuse API to simulate a heavy, real-world synonym relational web.
            </p>

            <div className="seed-action-area">
              <button onClick={handleSeedExternal} disabled={seedLoading} className="btn btn-secondary btn-seed">
                {seedLoading ? (
                  <>
                    <span className="spinner"></span>
                    Seeding 1000+ words (Calling Datamuse)...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} className="sparkle-icon" />
                    Fetch & Seed from External API
                  </>
                )}
              </button>

              {seedSuccessMessage && (
                <div className={`message-box ${seedSuccessMessage.startsWith('Error') ? 'error-box' : 'success-box'} seed-message animate-fade-in`}>
                  {seedSuccessMessage}
                </div>
              )}

              {seedCount > 0 && !seedSuccessMessage && (
                <div className="db-stats">
                  <BookOpen size={14} />
                  <span>Currently holding {seedCount} unique words in-memory.</span>
                </div>
              )}
            </div>
          </div>

          {/* Sentence Analyzer Container */}
          {renderAnalyzer()}
        </section>
      </main>

      {/* Local Dashboard CSS styling */}
      <style>{`
        .dashboard-container {
          padding: 24px;
          max-width: 1400px;
          width: 100%;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 24px;
          flex: 1;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 24px;
          border-radius: var(--radius-md);
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .btn-back {
          background: none;
          border: 1px solid var(--border);
          color: var(--text-secondary);
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background-color var(--transition-fast), color var(--transition-fast);
        }

        .btn-back:hover {
          background-color: var(--accent-soft);
          color: var(--accent);
          border-color: var(--accent);
        }

        .logo-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .logo-icon {
          color: var(--accent);
          width: 24px;
          height: 24px;
        }

        .logo-text {
          font-family: var(--font-heading);
          font-size: 20px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .btn-graph {
          padding: 10px 18px;
          font-size: 14px;
          font-weight: 600;
        }

        .animate-pulse-slow {
          animation: pulse-glow 3s infinite ease-in-out;
        }

        .theme-toggle-btn {
          background: none;
          border: 1px solid var(--border);
          border-radius: 50%;
          width: 38px;
          height: 38px;
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

        /* Workspace Grid */
        .dashboard-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }

        @media (max-width: 900px) {
          .dashboard-grid {
            grid-template-columns: 1fr;
          }
        }

        .dashboard-left, .dashboard-right {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .panel-card {
          display: flex;
          flex-direction: column;
          gap: 12px;
          text-align: left;
        }

        .panel-title-group {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .title-icon {
          color: var(--accent);
          width: 20px;
          height: 20px;
        }

        .text-accent {
          color: var(--accent);
        }

        .panel-card h2 {
          font-size: 18px;
          font-weight: 600;
        }

        .panel-desc {
          font-size: 13px;
          color: var(--text-secondary);
          margin-bottom: 8px;
        }

        /* Forms */
        .panel-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .input-group label {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .message-box {
          padding: 10px 14px;
          border-radius: var(--radius-sm);
          font-size: 14px;
          line-height: 1.4;
        }

        .error-box {
          background-color: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #ef4444;
        }

        .success-box {
          background-color: rgba(34, 197, 94, 0.1);
          border: 1px solid rgba(34, 197, 94, 0.3);
          color: #22c55e;
        }

        .btn-submit {
          font-weight: 600;
          margin-top: 4px;
        }

        /* Search Panel */
        .search-input-wrapper {
          display: flex;
          gap: 8px;
        }

        .search-input {
          flex: 1;
        }

        .btn-search-icon {
          width: 46px;
          padding: 0;
          flex-shrink: 0;
        }

        .search-loader {
          font-size: 14px;
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 10px;
        }

        .search-msg {
          margin-top: 8px;
        }

        .search-results {
          margin-top: 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding-top: 16px;
          border-top: 1px dashed var(--border);
        }

        .search-results h3 {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .results-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .result-badge {
          background-color: var(--accent-soft);
          color: var(--accent);
          font-size: 13px;
          font-weight: 500;
          padding: 6px 12px;
          border-radius: var(--radius-sm);
          border: 1px solid rgba(79, 70, 229, 0.15);
        }

        /* Seeding Card */
        .seed-card {
          border: 1px solid rgba(99, 102, 241, 0.2);
        }

        .seed-action-area {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 8px;
        }

        .btn-seed {
          width: 100%;
          justify-content: center;
          font-weight: 600;
          border-color: rgba(99, 102, 241, 0.3);
          background-color: var(--bg-secondary);
          color: var(--accent);
        }

        .btn-seed:hover {
          background-color: var(--accent-soft);
          border-color: var(--accent);
        }

        .sparkle-icon {
          color: var(--accent);
        }

        .db-stats {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: var(--text-muted);
          justify-content: center;
          margin-top: 4px;
        }
      `}</style>
    </div>
  );
};
