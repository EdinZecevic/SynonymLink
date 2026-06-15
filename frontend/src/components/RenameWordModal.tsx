import React, { useState } from 'react';
import { Edit } from 'lucide-react';
import { Trans, useTranslation } from 'react-i18next';

interface RenameWordModalProps {
  isOpen: boolean;
  word: string;
  loading: boolean;
  error: string;
  onCancel: () => void;
  onConfirm: (newWord: string) => void;
}

export const RenameWordModal: React.FC<RenameWordModalProps> = ({
  isOpen,
  word,
  loading,
  error,
  onCancel,
  onConfirm,
}) => {
  const { t } = useTranslation();
  const [newWordName, setNewWordName] = useState(word);
  const [localError, setLocalError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    const trimmed = newWordName.trim();
    if (!trimmed) {
      setLocalError(t('dashboard.errorRenameRequired'));
      return;
    }

    if (trimmed.toLowerCase() === word.toLowerCase()) {
      setLocalError(t('dashboard.errorRenameSelf'));
      return;
    }

    onConfirm(trimmed);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container card-glass">
        <div className="modal-header">
          <Edit className="warning-icon animate-pulse-slow" size={24} style={{ color: 'var(--accent)' }} />
          <h2>{t('dashboard.renameModalTitle')}</h2>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <p className="modal-desc">
            <Trans i18nKey="dashboard.renameModalDesc" values={{ word }}>
              Enter a new name for the word <strong>&quot;{word}&quot;</strong>. All of its synonym connections will be preserved under the new name.
            </Trans>
          </p>

          <div className="input-group">
            <label htmlFor="newWordName" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {t('dashboard.renameInputLabel')}
            </label>
            <input
              id="newWordName"
              type="text"
              className="input-field"
              placeholder={t('dashboard.renameInputPlaceholder')}
              value={newWordName}
              onChange={(e) => setNewWordName(e.target.value)}
              disabled={loading}
              autoFocus
            />
          </div>

          {(localError || error) && (
            <div className="message-box error-box modal-error">
              {localError || error}
            </div>
          )}

          <div className="modal-footer">
            <button
              type="button"
              disabled={loading}
              onClick={onCancel}
              className="btn btn-secondary"
            >
              {t('dashboard.renameCancelBtn')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? <span className="spinner btn-spinner"></span> : t('dashboard.renameConfirmBtn')}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        /* Reuse modal overlay and container styles, ensuring styled inputs */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(255, 255, 255, 0.6) !important;
          backdrop-filter: blur(12px) !important;
          -webkit-backdrop-filter: blur(12px) !important;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .modal-container {
          max-width: 500px;
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 20px;
          animation: modalFadeIn var(--transition-normal) forwards;
          border: 1px solid rgba(79, 70, 229, 0.3) !important;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
          background-color: #ffffff !important;
          color: #0f172a !important;
          border-radius: var(--radius-md);
          padding: 24px;
        }

        @keyframes modalFadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }

        .modal-header {
          display: flex;
          align-items: center;
          gap: 12px;
          border-bottom: 1px dashed #e2e8f0 !important;
          padding-bottom: 12px;
        }

        .modal-header h2 {
          font-size: 20px;
          font-weight: 700;
          color: #0f172a !important;
        }

        .modal-body {
          display: flex;
          flex-direction: column;
          gap: 16px;
          text-align: left;
        }

        .modal-desc {
          font-size: 15px;
          color: #475569 !important;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          border-top: 1px dashed #e2e8f0 !important;
          padding-top: 16px;
          width: 100%;
        }

        .btn-spinner {
          width: 16px;
          height: 16px;
          border-width: 2px;
        }
      `}</style>
    </div>
  );
};
