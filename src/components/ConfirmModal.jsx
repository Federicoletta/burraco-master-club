import React from 'react';
import { AlertCircle, Trash2, CheckCircle2, X } from 'lucide-react';

export default function ConfirmModal({
  isOpen,
  title = 'Conferma operazione',
  message = 'Sei sicuro di voler procedere?',
  confirmText = 'Conferma',
  cancelText = 'Annulla',
  variant = 'warning', // 'warning' | 'danger' | 'info'
  onConfirm,
  onCancel,
}) {
  if (!isOpen) return null;

  const isDanger = variant === 'danger';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-sm rounded-3xl bg-emerald-950/95 border-2 border-emerald-600/40 p-5 sm:p-6 shadow-2xl relative text-center backdrop-blur-xl animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Pulsante chiusura X */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-1.5 rounded-full text-emerald-400/80 hover:text-white hover:bg-emerald-900/60 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icona indicatore */}
        <div className={`w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center shadow-lg ${
          isDanger 
            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' 
            : 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
        }`}>
          {isDanger ? (
            <Trash2 className="w-7 h-7 text-rose-400" />
          ) : (
            <AlertCircle className="w-7 h-7 text-amber-400" />
          )}
        </div>

        <h3 className="text-base sm:text-lg font-black text-white mb-2">
          {title}
        </h3>

        <p className="text-xs sm:text-sm text-emerald-200/80 mb-6 leading-relaxed">
          {message}
        </p>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="py-2.5 px-3 rounded-xl bg-emerald-900/60 hover:bg-emerald-900 text-emerald-200 border border-emerald-700/50 font-bold text-xs sm:text-sm cursor-pointer transition-all active:scale-95"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className={`py-2.5 px-3 rounded-xl font-black text-xs sm:text-sm shadow-md cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-1.5 ${
              isDanger
                ? 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-rose-950/50'
                : 'gold-gradient text-emerald-950 hover:brightness-110 shadow-amber-950/40'
            }`}
          >
            {isDanger ? <Trash2 className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}