import React from 'react';
import { Unlink } from 'lucide-react';
import { Trans, useTranslation } from 'react-i18next';

interface DeleteRelationshipModalProps {
  isOpen: boolean;
  word1: string;
  word2: string;
  loading: boolean;
  error: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export const DeleteRelationshipModal: React.FC<DeleteRelationshipModalProps> = ({
  isOpen,
  word1,
  word2,
  loading,
  error,
  onCancel,
  onConfirm,
}) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container card-glass relationship-modal">
        <div className="modal-header">
          <Unlink className="warning-icon animate-pulse-slow" size={24} />
          <h2>{t('dashboard.deleteLinkModalTitle')}</h2>
        </div>

        <div className="modal-body">
          <p className="modal-desc">
            <Trans i18nKey="dashboard.deleteLinkModalDesc" values={{ word1, word2 }}>
              Are you sure you want to delete the direct synonym connection between <strong>&quot;{word1}&quot;</strong> and <strong>&quot;{word2}&quot;</strong>?
            </Trans>
          </p>

          {error && <div className="message-box error-box modal-error">{error}</div>}

          <div className="delete-info-box info-single">
            <p className="info-explanation">
              This action will sever the bidirectional relationship between these two words. If either word ends up with no other synonym connections, it will be automatically removed from the database.
            </p>
          </div>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            disabled={loading}
            onClick={onCancel}
            className="btn btn-secondary"
          >
            {t('dashboard.deleteLinkCancelBtn')}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className="btn btn-danger btn-disconnect"
          >
            {loading ? <span className="spinner btn-spinner"></span> : t('dashboard.deleteLinkConfirmBtn')}
          </button>
        </div>
      </div>

      <style>{`
        .relationship-modal {
          border: 1px solid var(--accent) !important;
        }
        .btn-disconnect {
          background-color: #ef4444 !important;
          color: #ffffff !important;
          border-color: #ef4444 !important;
        }
        .btn-disconnect:hover:not(:disabled) {
          background-color: #dc2626 !important;
          box-shadow: 0 0 12px rgba(239, 68, 68, 0.4);
        }
      `}</style>
    </div>
  );
};
