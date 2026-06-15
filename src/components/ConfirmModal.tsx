'use client';

import { AlertCircle, CheckCircle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: (reason?: string) => void;
  onCancel: () => void;
  variant?: 'success' | 'danger';
  confirmLabel?: string;
  cancelLabel?: string;
  withReason?: boolean;
  reasonPlaceholder?: string;
  isLoading?: boolean;
  reason?: string;
  onReasonChange?: (r: string) => void;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  variant = 'danger',
  confirmLabel,
  cancelLabel = 'Cancel',
  withReason,
  reasonPlaceholder = 'Enter reason...',
  isLoading,
  reason = '',
  onReasonChange,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const isDanger = variant === 'danger';
  const btnClass = isDanger ? 'btn btn-danger' : 'btn btn-success';
  const defaultConfirmLabel = confirmLabel ?? (isDanger ? 'Confirm' : 'Approve');

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onCancel()}>
      <div className="modal modal-sm">
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {isDanger ? (
              <AlertCircle size={20} color="var(--danger)" />
            ) : (
              <CheckCircle size={20} color="var(--success)" />
            )}
            <span className="modal-title">{title}</span>
          </div>
          <button className="modal-close" onClick={onCancel}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            {message}
          </p>

          {withReason && (
            <textarea
              className="input"
              style={{ width: '100%', marginTop: 16, minHeight: 100, resize: 'vertical' }}
              placeholder={reasonPlaceholder}
              value={reason}
              onChange={e => onReasonChange?.(e.target.value)}
            />
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onCancel} disabled={isLoading}>
            {cancelLabel}
          </button>
          <button
            className={btnClass}
            onClick={() => onConfirm(reason)}
            disabled={isLoading || (withReason && !reason.trim())}
          >
            {isLoading ? 'Processing...' : defaultConfirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
