import React from 'react';
import { AlertCircle, Trash2, CheckCircle2, X } from 'lucide-react';
import ModalShell from './ui/ModalShell';

export default function ConfirmModal({
  isOpen,
  title = 'Conferma operazione',
  message = 'Sei sicuro di voler procedere?',
  confirmText = 'Conferma',
  cancelText = 'Annulla',
  variant = 'warning',
  onConfirm,
  onCancel,
}) {
  if (!isOpen) return null;

  const isDanger = variant === 'danger';
  const isSuccess = variant === 'success';

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onCancel}
      ariaLabel={title}
      maxWidthClass="max-w-sm"
      centeredOnMobile={true}
      zIndexClass="z-[60]"
      panelClassName="p-6 text-center"
    >
      <button
        type="button"
        onClick={onCancel}
        className="absolute top-3.5 right-3.5 w-11 h-11 rounded-xl club-btn-secondary flex items-center justify-center cursor-pointer"
        aria-label="Chiudi finestra"
      >
        <X className="w-4 h-4" />
      </button>

      <div
        className={`w-14 h-14 rounded-2xl mx-auto mb-3.5 flex items-center justify-center border ${
          isDanger
            ? 'club-danger-inset club-danger-text'
            : isSuccess
            ? 'bg-emerald-500/15 club-success-text border-emerald-500/40'
            : 'bg-[var(--accent-ring)] club-text-gold border-[var(--accent-gold)]/45'
        }`}
      >
        {isDanger ? (
          <Trash2 className="w-7 h-7" />
        ) : isSuccess ? (
          <CheckCircle2 className="w-7 h-7" />
        ) : (
          <AlertCircle className="w-7 h-7" />
        )}
      </div>

      <h3 className="font-display text-lg font-bold club-text-primary mb-2">
        {title}
      </h3>

      <p className="text-xs sm:text-sm club-text-muted mb-6 leading-relaxed">
        {message}
      </p>

      <div className={cancelText ? 'grid grid-cols-2 gap-2.5' : 'flex justify-center'}>
        {cancelText && (
          <button
            type="button"
            onClick={onCancel}
            className="min-h-[44px] px-3 rounded-xl club-btn-secondary font-bold text-xs sm:text-sm cursor-pointer active:scale-95"
          >
            {cancelText}
          </button>
        )}

        <button
          type="button"
          onClick={onConfirm}
          className={`min-h-[44px] px-4 rounded-xl font-bold text-xs sm:text-sm cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-1.5 ${
            !cancelText ? 'w-full' : ''
          } ${
            isDanger
              ? 'bg-rose-600 hover:bg-rose-500 text-white'
              : 'gold-gradient'
          }`}
        >
          {isDanger ? <Trash2 className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          <span>{confirmText}</span>
        </button>
      </div>
    </ModalShell>
  );
}
