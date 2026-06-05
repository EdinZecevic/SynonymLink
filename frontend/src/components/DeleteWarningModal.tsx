import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Trans, useTranslation } from 'react-i18next';
import type { DeletePreviewResponse } from '../services/api';

interface DeleteWarningModalProps {
  isOpen: boolean;
  word: string;
  preview: DeletePreviewResponse | null;
  mode: 'single' | 'cascade';
  loading: boolean;
  error: string;
  setMode: (mode: 'single' | 'cascade') => void;
  onCancel: () => void;
  onConfirm: () => void;
}

export const DeleteWarningModal: React.FC<DeleteWarningModalProps> = ({
  isOpen,
  word,
  preview,
  mode,
  loading,
  error,
  setMode,
  onCancel,
  onConfirm
}) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container card-glass">
        <div className="modal-header">
          <AlertTriangle className="warning-icon animate-pulse-slow" size={24} />
          <h2>{t('dashboard.deleteModalTitle')}</h2>
        </div>

        <div className="modal-body">
          <p className="modal-desc">
            <Trans i18nKey="dashboard.deleteModalDesc" values={{ word }}>
              Choose deletion option for word <strong>&quot;{word}&quot;</strong>.
            </Trans>
          </p>

          {/* Toggle switch/tabs */}
          <div className="delete-tabs">
            <button
              type="button"
              className={`delete-tab ${mode === 'single' ? 'active' : ''}`}
              onClick={() => setMode('single')}
            >
              {t('dashboard.deleteTabSingle')}
            </button>
            <button
              type="button"
              className={`delete-tab ${mode === 'cascade' ? 'active' : ''}`}
              onClick={() => setMode('cascade')}
            >
              {t('dashboard.deleteTabCascade')}
            </button>
          </div>

          {error && <div className="message-box error-box modal-error">{error}</div>}

          {mode === 'single' ? (
            <div className="delete-info-box info-single animate-fade-in">
              <p><strong>{t('dashboard.deleteInfoSingleTitle')}</strong></p>
              <ul className="delete-list">
                <li>
                  {t('dashboard.deleteInfoSingleBullet', { word: '' })}
                  <span className="word-to-delete">{word}</span>
                </li>
              </ul>
              <p className="info-explanation">
                {t('dashboard.deleteInfoSingleDesc')}
              </p>
            </div>
          ) : (
            <div className="delete-info-box info-cascade animate-fade-in">
              <p><strong>{t('dashboard.deleteInfoCascadeTitle')}</strong></p>
              
              {!preview && !error && (
                <div className="preview-loader">
                  <span className="spinner"></span> {t('dashboard.deleteInfoCascadeLoading')}
                </div>
              )}

              {preview && (
                <div className="connections-preview">
                  <div className="preview-section">
                    <span className="section-label">{t('dashboard.deleteInfoCascadeMainWord')}</span>
                    <div className="badges-row">
                      <span className="badge-target">{preview.targetWord}</span>
                    </div>
                  </div>

                  {preview.firstConnections.length > 0 && (
                    <div className="preview-section">
                      <span className="section-label">{t('dashboard.deleteInfoCascadeFirstConn')}</span>
                      <div className="badges-row">
                        {preview.firstConnections.map((w, i) => (
                          <span key={i} className="badge-first">{w}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {preview.secondConnections.length > 0 && (
                    <div className="preview-section">
                      <span className="section-label">{t('dashboard.deleteInfoCascadeSecondConn')}</span>
                      <div className="badges-row">
                        {preview.secondConnections.map((w, i) => (
                          <span key={i} className="badge-second">{w}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="total-warning-alert">
                    <Trans i18nKey="dashboard.deleteInfoCascadeWarning" values={{ count: 1 + preview.firstConnections.length + preview.secondConnections.length }}>
                      A total of <strong>{1 + preview.firstConnections.length + preview.secondConnections.length}</strong> words will be deleted. This action is irreversible!
                    </Trans>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button
            type="button"
            disabled={loading}
            onClick={onCancel}
            className="btn btn-secondary"
          >
            {t('dashboard.deleteCancelBtn')}
          </button>
          <button
            type="button"
            disabled={loading || (mode === 'cascade' && !preview)}
            onClick={onConfirm}
            className="btn btn-danger"
          >
            {loading ? <span className="spinner btn-spinner"></span> : t('dashboard.deleteConfirmBtn')}
          </button>
        </div>
      </div>

      <style>{`
        /* Persistent Warning Modal Overlay */
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
          border: 1px solid rgba(239, 68, 68, 0.4) !important;
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

        .warning-icon {
          color: #ef4444;
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

        /* Tabs */
        .delete-tabs {
          display: flex;
          background-color: #f1f5f9 !important;
          border: 1px solid #e2e8f0 !important;
          border-radius: var(--radius-sm);
          padding: 4px;
          gap: 4px;
        }

        .delete-tab {
          flex: 1;
          background: none;
          border: none;
          padding: 8px 12px;
          font-family: var(--font-heading);
          font-size: 14px;
          font-weight: 600;
          border-radius: calc(var(--radius-sm) - 4px);
          cursor: pointer;
          color: #475569 !important;
          transition: all var(--transition-fast);
        }

        .delete-tab:hover {
          color: #0f172a !important;
          background-color: rgba(0, 0, 0, 0.05) !important;
        }

        .delete-tab.active {
          background-color: #ffffff !important;
          color: var(--accent) !important;
          box-shadow: var(--shadow-sm) !important;
        }

        .delete-info-box {
          border-radius: var(--radius-sm);
          padding: 14px;
          font-size: 14px;
          background-color: #f8fafc !important;
          border: 1px solid #e2e8f0 !important;
          display: flex;
          flex-direction: column;
          gap: 10px;
          color: #334155 !important;
        }

        .delete-info-box p, .delete-info-box strong {
          color: #334155 !important;
        }

        .delete-list {
          list-style: none;
          padding-left: 0;
        }

        .word-to-delete {
          font-weight: 700;
          color: #ef4444;
          background-color: rgba(239, 68, 68, 0.1);
          padding: 2px 6px;
          border-radius: 4px;
        }

        .info-explanation {
          font-size: 12px;
          color: #64748b !important;
          line-height: 1.4;
          margin-top: 4px;
        }

        .preview-loader {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #475569 !important;
          font-size: 13px;
        }

        .connections-preview {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .preview-section {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .section-label {
          font-size: 12px;
          font-weight: 600;
          color: #64748b !important;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .badges-row {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .badge-target {
          background-color: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.2);
          font-size: 13px;
          font-weight: 600;
          padding: 4px 8px;
          border-radius: 4px;
        }

        .badge-first {
          background-color: rgba(245, 158, 11, 0.1);
          color: #f59e0b;
          border: 1px solid rgba(245, 158, 11, 0.2);
          font-size: 13px;
          font-weight: 500;
          padding: 4px 8px;
          border-radius: 4px;
        }

        .badge-second {
          background-color: var(--accent-soft);
          color: var(--accent);
          border: 1px solid rgba(79, 70, 229, 0.15);
          font-size: 13px;
          font-weight: 500;
          padding: 4px 8px;
          border-radius: 4px;
        }

        .total-warning-alert {
          background-color: rgba(239, 68, 68, 0.08);
          border-left: 4px solid #ef4444;
          padding: 10px;
          font-size: 13px;
          color: #ef4444;
          border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
          margin-top: 6px;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          border-top: 1px dashed #e2e8f0 !important;
          padding-top: 16px;
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
