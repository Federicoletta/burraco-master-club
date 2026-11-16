import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { PauseCircle, Calendar, StickyNote, X } from 'lucide-react';
import { useModalEscape } from '../../hooks/useModalEscape';

function formatOffsetDate(daysAhead) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function PauseTournamentModalForm({
  tournament,
  mode,
  onClose,
  onConfirm,
}) {
  const [resumeDate, setResumeDate] = useState(() => tournament?.resumeDate || '');
  const [resumeNote, setResumeNote] = useState(() => tournament?.resumeNote || '');

  const isEditMode = mode === 'edit';

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm({
      resumeDate: resumeDate.trim(),
      resumeNote: resumeNote.trim(),
    });
  };

  return (
    <div
      className="fixed inset-0 z-[95] flex items-end sm:items-center justify-center sm:p-4 bg-black/75 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={isEditMode ? 'Modifica promemoria torneo' : 'Metti in pausa torneo'}
    >
      <div
        className="w-full max-w-md club-card-solid rounded-t-3xl sm:rounded-2xl p-5 text-white space-y-4 club-sheet-enter pb-[calc(env(safe-area-inset-bottom,0px)+1.25rem)] sm:pb-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full bg-white/20 mx-auto sm:hidden" />

        <div className="flex items-start justify-between gap-3 pb-3 border-b club-divider">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl club-inset club-text-gold flex items-center justify-center shrink-0">
              <PauseCircle className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-display text-lg font-bold text-white truncate">
                {isEditMode ? 'Promemoria Ripresa' : 'Metti in Pausa Torneo'}
              </h3>
              <p className="text-xs club-text-muted truncate mt-0.5">
                {tournament.name}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="min-w-[40px] min-h-[40px] rounded-xl club-inset club-text-muted hover:text-white flex items-center justify-center cursor-pointer shrink-0"
            aria-label="Chiudi"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Data prevista */}
          <div className="space-y-2">
            <label className="text-xs font-bold club-text-gold uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>Data prevista ripresa (opzionale)</span>
            </label>

            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setResumeDate(formatOffsetDate(1))}
                className="min-h-[36px] px-3 rounded-xl club-btn-secondary text-xs font-semibold cursor-pointer"
              >
                Domani
              </button>
              <button
                type="button"
                onClick={() => setResumeDate(formatOffsetDate(7))}
                className="min-h-[36px] px-3 rounded-xl club-btn-secondary text-xs font-semibold cursor-pointer"
              >
                Tra 7 giorni
              </button>
              {resumeDate && (
                <button
                  type="button"
                  onClick={() => setResumeDate('')}
                  className="min-h-[36px] px-3 rounded-xl club-inset club-text-muted hover:text-white text-xs font-semibold cursor-pointer"
                >
                  Rimuovi data
                </button>
              )}
            </div>

            <input
              type="date"
              value={resumeDate}
              onChange={(e) => setResumeDate(e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl club-input text-sm font-mono-num"
            />
          </div>

          {/* Nota promemoria */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold club-text-gold uppercase tracking-wider flex items-center gap-1.5">
                <StickyNote className="w-3.5 h-3.5" />
                <span>Nota promemoria (opzionale)</span>
              </label>
              <span className="text-[11px] font-mono-num club-text-subtle">
                {resumeNote.length}/240
              </span>
            </div>

            <textarea
              rows={3}
              maxLength={240}
              value={resumeNote}
              onChange={(e) => setResumeNote(e.target.value)}
              placeholder="Es: Mancano gli ultimi 2 tavoli della 3ª giornata, si riprende giovedì da Marco"
              className="w-full p-3 rounded-xl club-input text-xs sm:text-sm resize-none leading-relaxed"
            />
          </div>

          {!isEditMode && (
            <p className="text-xs club-text-subtle leading-relaxed m-0">
              Tutti i punteggi e gli incontri restano salvati in locale e nel Cloud. Potrai riprendere da qui in qualsiasi momento.
            </p>
          )}

          <div className="flex items-center gap-2 pt-2 border-t club-divider">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 min-h-[44px] rounded-xl club-btn-secondary text-xs font-semibold cursor-pointer"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="flex-1 min-h-[44px] px-4 rounded-xl gold-gradient font-bold text-xs sm:text-sm cursor-pointer active:scale-95"
            >
              {isEditMode ? 'Salva Promemoria' : 'Metti in Pausa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function PauseTournamentModal({
  isOpen,
  tournament,
  mode = 'pause', // 'pause' | 'edit'
  onClose,
  onConfirm,
}) {
  useModalEscape(isOpen, onClose);

  if (!isOpen || !tournament || typeof document === 'undefined') return null;

  return createPortal(
    <PauseTournamentModalForm
      key={`${tournament.id}_${mode}`}
      tournament={tournament}
      mode={mode}
      onClose={onClose}
      onConfirm={onConfirm}
    />,
    document.body
  );
}
