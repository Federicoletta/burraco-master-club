import React from 'react';
import { Download, Share, PlusSquare, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import ModalShell from './ui/ModalShell';

/**
 * Pulsante in-app per installare Burraco Master Club come PWA.
 * Si nasconde automaticamente quando l'app è già avviata in modalità standalone.
 */
export default function PWAInstallButton({ onAfterClick, variant = 'menu' }) {
  const {
    canInstall,
    isIos,
    showIosGuide,
    setShowIosGuide,
    promptInstall,
  } = usePWAInstall();

  if (!canInstall) return null;

  const handleClick = async () => {
    await promptInstall();
    if (!isIos && typeof onAfterClick === 'function') {
      onAfterClick();
    }
  };

  return (
    <>
      {variant === 'menu' ? (
        <button
          type="button"
          onClick={handleClick}
          className="w-full min-h-[46px] flex items-center gap-3 px-3 py-2.5 rounded-xl club-hover-soft text-left transition-colors cursor-pointer"
        >
          <Download className="w-4 h-4 club-text-gold shrink-0" />
          <div className="min-w-0">
            <div className="text-sm font-semibold club-text-primary">Installa App</div>
            <div className="text-xs club-text-subtle">
              {isIos ? 'Aggiungi alla schermata Home di iPhone/iPad' : 'Apri a schermo intero anche offline'}
            </div>
          </div>
        </button>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          className="min-h-[40px] px-3 rounded-xl club-btn-secondary club-text-gold text-xs font-bold flex items-center gap-1.5 cursor-pointer active:scale-95"
        >
          <Download className="w-4 h-4" />
          <span>Installa App</span>
        </button>
      )}

      <ModalShell
        isOpen={showIosGuide}
        onClose={() => setShowIosGuide(false)}
        ariaLabel="Installa Burraco Master Club su iOS"
        maxWidthClass="max-w-sm"
        zIndexClass="z-[110]"
      >
        <div className="px-5 py-4 border-b club-divider flex items-center justify-between gap-2 shrink-0">
          <h3 className="font-display text-base font-bold club-text-primary m-0">
            Installa su iPhone / iPad
          </h3>
          <button
            type="button"
            onClick={() => setShowIosGuide(false)}
            className="w-10 h-10 rounded-xl club-btn-secondary flex items-center justify-center cursor-pointer shrink-0"
            aria-label="Chiudi istruzioni"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-3 text-xs sm:text-sm club-text-muted">
          <p className="m-0 leading-relaxed">
            Installa <strong className="club-text-primary">Burraco Master Club</strong> sulla schermata Home per aprirlo a schermo intero, senza barra di Safari e pronto anche offline.
          </p>

          <div className="space-y-2">
            <div className="p-3 rounded-xl club-inset border club-divider flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg club-card club-text-gold flex items-center justify-center shrink-0">
                <Share className="w-4 h-4" />
              </span>
              <span>
                1. Tocca l&apos;icona <strong className="club-text-primary">Condividi</strong> nella barra di Safari.
              </span>
            </div>

            <div className="p-3 rounded-xl club-inset border club-divider flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg club-card club-text-gold flex items-center justify-center shrink-0">
                <PlusSquare className="w-4 h-4" />
              </span>
              <span>
                2. Scorri e seleziona <strong className="club-text-primary">Aggiungi alla schermata Home</strong>.
              </span>
            </div>
          </div>
        </div>

        <div className="px-5 py-3.5 border-t club-divider shrink-0">
          <button
            type="button"
            onClick={() => setShowIosGuide(false)}
            className="w-full min-h-[44px] rounded-xl gold-gradient font-bold text-sm cursor-pointer active:scale-95"
          >
            Ho capito
          </button>
        </div>
      </ModalShell>
    </>
  );
}
