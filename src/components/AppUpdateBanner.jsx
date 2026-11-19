import React, { useState, useEffect } from 'react';
import { RotateCw, Sparkles, X } from 'lucide-react';
import { subscribeToAppUpdates, applyAppUpdate } from '../utils/versionCheck';

/**
 * Banner non intrusivo che avvisa l'utente quando è disponibile una nuova versione
 * (Service Worker in attesa o nuova build rilevata via /version.json).
 * Non forza mai il ricaricamento automatico mentre si sta giocando una mano.
 */
export default function AppUpdateBanner() {
  const [updateState, setUpdateState] = useState({ hasUpdate: false, remoteDate: '' });
  const [dismissed, setDismissed] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    return subscribeToAppUpdates((state) => {
      setUpdateState(state);
    });
  }, []);

  if (!updateState.hasUpdate || dismissed) return null;

  const handleApply = async () => {
    setIsUpdating(true);
    await applyAppUpdate();
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed left-3 right-3 sm:left-auto sm:right-5 sm:max-w-md z-40 club-card-solid rounded-2xl p-3.5 shadow-2xl border border-[var(--accent-gold)] club-sheet-enter"
      style={{
        bottom: 'calc(env(safe-area-inset-bottom, 0px) + 5.25rem)',
      }}
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl gold-gradient flex items-center justify-center shrink-0 mt-0.5">
          <Sparkles className="w-4 h-4" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-bold club-text-primary m-0 leading-tight">
              Nuova versione disponibile
            </p>
            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="w-7 h-7 -mr-1 -mt-1 rounded-lg club-hover-soft club-text-subtle flex items-center justify-center cursor-pointer shrink-0"
              aria-label="Chiudi avviso aggiornamento"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs club-text-muted mt-0.5 mb-2.5 leading-snug">
            Ricarica l&apos;app per applicare i miglioramenti senza perdere la partita in corso.
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isUpdating}
              onClick={handleApply}
              className="min-h-[38px] px-3.5 rounded-xl gold-gradient text-xs font-bold flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-60"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isUpdating ? 'animate-spin' : ''}`} />
              <span>{isUpdating ? 'Aggiornamento...' : 'Aggiorna ora'}</span>
            </button>

            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="min-h-[38px] px-3 rounded-xl club-btn-secondary club-text-muted text-xs font-semibold cursor-pointer"
            >
              Più tardi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
