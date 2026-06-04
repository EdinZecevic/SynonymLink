import { useState, useEffect, useRef } from 'react';
import { MessageSquare } from 'lucide-react';
import { api } from '../services/api';

interface SentenceAnalyzerProps {
  // Let the parent know if it needs to update or trigger graph updates
}

const PRESET_SENTENCES = [
  "The quick and rapid runner felt happy and cheerful.",
  "Please wash and clean the dirty dishes to purify them.",
  "An intelligent and clever student solved the fast puzzle.",
  "A joyful child loves a clean and tidy room.",
  "The rapid response was smart and quick."
];

export const SentenceAnalyzer: React.FC<SentenceAnalyzerProps> = () => {
  const [sentence, setSentence] = useState('');
  const [wordSynonyms, setWordSynonyms] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced API call to analyze sentence
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!sentence.trim()) {
      setWordSynonyms({});
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const response = await api.analyzeSentence(sentence);
        setWordSynonyms(response.wordSynonyms || {});
      } catch (err) {
        console.error('Error analyzing sentence:', err);
      } finally {
        setLoading(false);
      }
    }, 300); // 300ms debounce delay

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [sentence]);

  const handlePresetClick = (preset: string) => {
    setSentence(preset);
  };


  // Safe cleaner using standard javascript regex (since JS doesn't support C# \p{Punctuation} directly without full unicode flag)
  const cleanWordJs = (word: string): string => {
    // Strip leading and trailing punctuation (non-alphanumeric at boundaries)
    return word.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '').toLowerCase();
  };

  // Split sentence into words, maintaining whitespace
  const tokens = sentence.split(/(\s+)/);

  return (
    <div className="card-glass panel-card analyzer-card">
      <div className="panel-title-group">
        <MessageSquare className="title-icon text-accent" />
        <h2>Live Sentence Analyzer</h2>
      </div>
      <p className="panel-desc">
        Type a sentence. Synonym overlays will appear dynamically above matching words as you type.
      </p>

      {/* Input Field */}
      <textarea
        className="input-field textarea-field"
        rows={3}
        placeholder="Type a sentence here... (e.g. The runner was quick and happy)"
        value={sentence}
        onChange={(e) => setSentence(e.target.value)}
      />

      {/* Visual Live Output Grid */}
      {sentence.trim() && (
        <div className="analysis-output-container card-glass">
          <div className="analysis-header">
            <span>Visual Tokenizer Output</span>
            {loading && <span className="spinner spinner-sm"></span>}
          </div>

          <div className="tokens-grid">
            {tokens.map((token, idx) => {
              // If it is whitespace, render it as spacing or a simple blank text
              if (/^\s+$/.test(token)) {
                return <span key={idx} className="whitespace-token">{token}</span>;
              }

              if (!token.trim()) return null;

              const clean = cleanWordJs(token);
              const synonyms = wordSynonyms[clean];

              return (
                <div key={idx} className="word-column">
                  {/* Synonyms display above the word */}
                  <div className="synonym-bubble-area">
                    {synonyms && synonyms.length > 0 ? (
                      <div className="synonym-tooltip animate-fade-in">
                        {synonyms.slice(0, 3).join(', ')}
                        {synonyms.length > 3 && '...'}
                      </div>
                    ) : (
                      <div className="synonym-spacer"></div>
                    )}
                  </div>

                  {/* The original word below */}
                  <div className={`word-label ${synonyms ? 'has-synonyms' : ''}`}>
                    {token}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Presets List */}
      <div className="presets-area">
        <span className="presets-label">Quick-Start Preset Sentences:</span>
        <div className="presets-list">
          {PRESET_SENTENCES.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              className="preset-btn"
              onClick={() => handlePresetClick(preset)}
              title="Click to fill analyzer"
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      {/* Custom local CSS for Sentence Analyzer */}
      <style>{`
        .analyzer-card {
          border: 1px solid rgba(99, 102, 241, 0.15);
        }

        .textarea-field {
          resize: vertical;
          min-height: 80px;
          line-height: 1.5;
        }

        /* Presets */
        .presets-area {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 4px;
        }

        .presets-label {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .presets-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .preset-btn {
          background-color: var(--bg-primary);
          border: 1px solid var(--border);
          color: var(--text-secondary);
          padding: 8px 12px;
          font-size: 13px;
          border-radius: var(--radius-sm);
          text-align: left;
          cursor: pointer;
          transition: background-color var(--transition-fast), border-color var(--transition-fast), color var(--transition-fast);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .preset-btn:hover {
          background-color: var(--accent-soft);
          border-color: var(--accent);
          color: var(--accent);
        }

        /* Output Visualizer */
        .analysis-output-container {
          margin-top: 16px;
          padding: 16px;
          background-color: var(--bg-primary);
          border-color: var(--border);
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .analysis-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12px;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 1px solid var(--border);
          padding-bottom: 8px;
        }

        .spinner-sm {
          width: 14px;
          height: 14px;
          border-width: 2px;
        }

        .tokens-grid {
          display: flex;
          flex-wrap: wrap;
          align-items: flex-end;
          row-gap: 18px;
          column-gap: 2px;
          line-height: 1;
        }

        .whitespace-token {
          white-space: pre-wrap;
          font-size: 16px;
        }

        .word-column {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
        }

        .synonym-bubble-area {
          height: 24px;
          display: flex;
          align-items: flex-end;
          margin-bottom: 4px;
          width: 100%;
          justify-content: center;
        }

        .synonym-tooltip {
          background-color: var(--accent);
          color: white;
          font-size: 10px;
          font-weight: 600;
          padding: 3px 6px;
          border-radius: 4px;
          white-space: nowrap;
          box-shadow: var(--shadow-sm);
          text-transform: capitalize;
        }

        .synonym-spacer {
          height: 1px;
        }

        .word-label {
          font-size: 16px;
          font-weight: 500;
          color: var(--text-primary);
          padding: 2px 4px;
          border-radius: 4px;
          transition: background-color var(--transition-fast);
        }

        .word-label.has-synonyms {
          background-color: var(--accent-soft);
          color: var(--accent);
          font-weight: 600;
        }
      `}</style>
    </div>
  );
};
