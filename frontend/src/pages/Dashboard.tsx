import React, { useState } from 'react';
import { Share2, Plus, Search, Moon, Sun, ArrowLeft, Database, Sparkles, BookOpen } from 'lucide-react';
import { useTranslation, Trans } from 'react-i18next';
import { api } from '../services/api';

interface DashboardProps {
  onOpenGraph: () => void;
  onBackToLanding: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  renderAnalyzer: () => React.ReactNode; // Injected from step 9
  seedCount: number;
  setSeedCount: React.Dispatch<React.SetStateAction<number>>;
  currentUser: string | null;
  onResetSession: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onOpenGraph,
  onBackToLanding,
  theme,
  toggleTheme,
  renderAnalyzer,
  seedCount,
  setSeedCount,
  currentUser,
  onResetSession
}) => {
  const { t } = useTranslation();

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
  const [visibleCount, setVisibleCount] = useState(50);

  // Infinite Scroll scroll handler
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (target.scrollHeight - target.scrollTop <= target.clientHeight + 40) {
      setVisibleCount((prev) => Math.min(prev + 50, searchResults.length));
    }
  };


  // External Seeding State
  const [seedLoading, setSeedLoading] = useState(false);
  const [seedSuccessMessage, setSeedSuccessMessage] = useState('');
  const [hasSeeded, setHasSeeded] = useState(() => {
    const uuid = localStorage.getItem('synonym_link_uuid');
    return uuid ? localStorage.getItem(`synonyms_seeded_${uuid}`) === 'true' : false;
  });

  const isAlreadySeeded = seedCount > 100 || (hasSeeded && seedCount > 0);

  // Add Synonym Pair handler
  const handleAddPair = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError('');
    setAddSuccess('');

    if (!word1.trim() || !word2.trim()) {
      setAddError(t('dashboard.errorFieldsRequired'));
      return;
    }

    if (word1.trim().toLowerCase() === word2.trim().toLowerCase()) {
      setAddError(t('dashboard.errorSelfSynonym'));
      return;
    }

    setAddLoading(true);
    try {
      await api.addSynonymPair(word1, word2);
      setAddSuccess(t('dashboard.successLinked', { word1, word2 }));
      setWord1('');
      setWord2('');
      // Trigger search update if search query matches one of the words
      if (searchQuery && (searchQuery.toLowerCase() === word1.toLowerCase() || searchQuery.toLowerCase() === word2.toLowerCase())) {
        handleSearch(null);
      }
      // Increment count slightly for visualization
      setSeedCount(prev => prev > 0 ? prev + 1 : 2);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : t('dashboard.errorGeneral');
      setAddError(errorMsg);
    } finally {
      setAddLoading(false);
    }
  };

  // Search handler
  const handleSearch = async (e: React.FormEvent | null) => {
    if (e) e.preventDefault();
    setSearchError('');
    setSearchResults([]);
    setVisibleCount(50); // Reset visible count on new search

    if (!searchQuery.trim()) {
      return;
    }

    setSearchLoading(true);
    try {
      const results = await api.getSynonyms(searchQuery);
      setSearchResults(results);
      if (results.length === 0) {
        setSearchError(t('dashboard.errorNoSynonyms', { query: searchQuery }));
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : t('dashboard.errorSearch');
      setSearchError(errorMsg);
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
      setSeedSuccessMessage(t('dashboard.seedingSuccess', { count: response.totalWords }));
      setHasSeeded(true);
      const uuid = localStorage.getItem('synonym_link_uuid');
      if (uuid) {
        localStorage.setItem(`synonyms_seeded_${uuid}`, 'true');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : t('dashboard.errorGeneral');
      setSeedSuccessMessage(t('dashboard.seedingError', { error: errorMsg }));
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
            <span className="logo-text">{t('dashboard.title')}</span>
          </div>
          {currentUser && (
            <div className="session-badge card-glass">
              <span className="user-dot"></span>
              <span className="user-name" title={`UUID: ${localStorage.getItem('synonym_link_uuid')}`}>
                Guest: <strong>{currentUser}</strong>
              </span>
            </div>
          )}
        </div>

        <div className="header-actions">
          {seedCount > 0 && (
            <button onClick={onOpenGraph} className="btn btn-primary btn-graph animate-pulse-slow">
              <Share2 size={16} />
              {t('dashboard.openVisualGraph', { count: seedCount })}
            </button>
          )}
          <button onClick={onResetSession} className="btn btn-secondary btn-switch-session" title="Switch User / Start New Session">
            Switch Session
          </button>
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
              <h2>{t('dashboard.addSynonymPairTitle')}</h2>
            </div>
            <p className="panel-desc">{t('dashboard.addSynonymPairDesc')}</p>

            <form onSubmit={handleAddPair} className="panel-form">
              <div className="input-group">
                <label htmlFor="word1">{t('dashboard.firstWord')}</label>
                <input
                  id="word1"
                  type="text"
                  className="input-field"
                  placeholder={t('dashboard.placeholderClean')}
                  value={word1}
                  onChange={(e) => setWord1(e.target.value)}
                />
              </div>

              <div className="input-group">
                <label htmlFor="word2">{t('dashboard.secondWord')}</label>
                <input
                  id="word2"
                  type="text"
                  className="input-field"
                  placeholder={t('dashboard.placeholderWash')}
                  value={word2}
                  onChange={(e) => setWord2(e.target.value)}
                />
              </div>

              {addError && <div className="message-box error-box">{addError}</div>}
              {addSuccess && <div className="message-box success-box">{addSuccess}</div>}

              <button type="submit" disabled={addLoading} className="btn btn-primary btn-submit">
                {addLoading ? <span className="spinner"></span> : t('dashboard.connectWords')}
              </button>
            </form>
          </div>

          {/* Bi-Directional Search Card */}
          <div className="card-glass panel-card">
            <div className="panel-title-group">
              <Search className="title-icon" />
              <h2>{t('dashboard.lookupTitle')}</h2>
            </div>
            <p className="panel-desc">{t('dashboard.lookupDesc')}</p>

            <form onSubmit={handleSearch} className="search-form">
              <div className="search-input-wrapper">
                <input
                  type="text"
                  className="input-field search-input"
                  placeholder={t('dashboard.placeholderSearch')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button type="submit" className="btn btn-primary btn-search-icon">
                  <Search size={18} />
                </button>
              </div>
            </form>

            {searchLoading && <div className="search-loader"><span className="spinner"></span> {t('dashboard.resolving')}</div>}

            {searchError && <div className="message-box error-box search-msg">{searchError}</div>}

            {searchResults.length > 0 && (
              <div className="search-results animate-fade-in">
                <div className="results-header">
                  <h3>{t('dashboard.synonymsFor', { query: searchQuery })}</h3>
                  <span className="results-counter">
                    {t('dashboard.loadedCounter', { visible: Math.min(visibleCount, searchResults.length), total: searchResults.length })}
                  </span>
                </div>
                <div className="results-list-container" onScroll={handleScroll}>
                  <div className="results-list">
                    {searchResults.slice(0, visibleCount).map((word, idx) => (
                      <span key={idx} className="result-badge animate-fade-in" style={{ animationDelay: `${(idx % 50) * 15}ms` }}>
                        {word}
                      </span>
                    ))}
                  </div>
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
              <h2>{t('dashboard.seedingTitle')}</h2>
            </div>
            <p className="panel-desc">
              <Trans i18nKey="dashboard.seedingDesc">
                Import a massive dataset of <strong>1,000+ words</strong> from the Datamuse API to simulate a heavy, real-world synonym relational web.
              </Trans>
            </p>

            <div className="seed-action-area">
              <button
                onClick={handleSeedExternal}
                disabled={seedLoading || isAlreadySeeded}
                className={`btn btn-secondary btn-seed ${isAlreadySeeded ? 'btn-seeded' : ''}`}
              >
                {seedLoading ? (
                  <>
                    <span className="spinner"></span>
                    {t('dashboard.seedingBtnLoading')}
                  </>
                ) : isAlreadySeeded ? (
                  <>
                    <Database size={16} className="database-icon" />
                    {t('dashboard.seedingBtnSeeded', { count: seedCount })}
                  </>
                ) : (
                  <>
                    <Sparkles size={16} className="sparkle-icon" />
                    {t('dashboard.seedingBtnDefault')}
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
                  <span>{t('dashboard.dbStats', { count: seedCount })}</span>
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

        .results-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .results-counter {
          font-size: 12px;
          font-weight: 600;
          color: var(--accent);
          background-color: var(--accent-soft);
          padding: 2px 8px;
          border-radius: var(--radius-full);
        }

        .results-list-container {
          max-height: 300px;
          overflow-y: auto;
          padding-right: 4px;
          margin-top: 8px;
        }

        .search-results h3 {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-secondary);
          margin-bottom: 0;
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
          transition: all var(--transition-fast);
        }

        .btn-seed:hover:not(:disabled) {
          background-color: var(--accent-soft);
          border-color: var(--accent);
        }

        .btn-seed:disabled {
          cursor: not-allowed;
          opacity: 0.85;
        }

        .btn-seeded {
          background-color: rgba(34, 197, 94, 0.1) !important;
          border-color: rgba(34, 197, 94, 0.3) !important;
          color: #22c55e !important;
        }

        .database-icon {
          color: #22c55e;
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

        @media (max-width: 768px) {
          .dashboard-container {
            padding: 12px;
            gap: 16px;
          }
          .results-list-container {
            max-height: 240px;
          }
        }

        @media (max-width: 600px) {
          .dashboard-header {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
            padding: 16px;
          }
          .header-left {
            justify-content: space-between;
            width: 100%;
          }
          .session-badge {
            margin-left: 0;
            justify-content: center;
            width: 100%;
          }
          .header-actions {
            justify-content: space-between;
            width: 100%;
            gap: 8px;
          }
          .btn-graph {
            flex-grow: 1;
            justify-content: center;
            font-size: 13px;
            padding: 10px 14px;
          }
        }

        /* Session info badge */
        .session-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          background-color: var(--accent-soft);
          border: 1px solid rgba(79, 70, 229, 0.2);
          padding: 6px 12px;
          border-radius: var(--radius-sm);
          font-size: 13px;
          color: var(--text-primary);
          margin-left: 8px;
        }

        .user-dot {
          width: 8px;
          height: 8px;
          background-color: #22c55e;
          border-radius: 50%;
          box-shadow: 0 0 8px #22c55e;
        }

        .user-name strong {
          color: var(--accent);
          text-transform: capitalize;
        }

        .btn-switch-session {
          font-size: 13px;
          padding: 8px 14px;
          font-weight: 600;
          border-color: var(--border);
          background-color: var(--bg-glass);
          color: var(--text-secondary);
          transition: all var(--transition-fast);
        }

        .btn-switch-session:hover {
          background-color: var(--accent-soft);
          border-color: var(--accent);
          color: var(--accent);
        }
      `}</style>
    </div>
  );
};
