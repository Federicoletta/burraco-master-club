import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  CheckCircle2,
  Mail,
  Users,
  Trophy,
  X,
  ShieldCheck,
  ArrowRight,
  Flame
} from 'lucide-react';
import { sound } from '../utils/soundEffects';
import { useModalEscape } from '../hooks/useModalEscape';

export default function WelcomeModal({
  isOpen,
  onClose,
  user,
  onOpenProfile
}) {
  useModalEscape(Boolean(isOpen && user), onClose);

  useEffect(() => {
    if (isOpen && user) {
      try {
        sound.playBurracoChime();
      } catch {}

      try {
        const count = 120;
        const defaults = { origin: { y: 0.6 } };

        function fire(particleRatio, opts) {
          confetti({
            ...defaults,
            ...opts,
            particleCount: Math.floor(count * particleRatio)
          });
        }

        fire(0.25, { spread: 30, startVelocity: 45 });
        fire(0.2, { spread: 60 });
        fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
        fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92 });
      } catch {}
    }
  }, [isOpen, user]);

  if (!isOpen || !user) return null;

  const displayName = user.displayName || 'Giocatore Burraco';
  const email = user.email || '';
  const photo = user.photoURL;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-md"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Benvenuto nel club"
    >
      <div
        className="w-full max-w-md max-h-[92dvh] flex flex-col overflow-hidden rounded-t-3xl sm:rounded-3xl club-card-solid border-2 border-[var(--accent-gold)] text-white relative club-sheet-enter"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 sm:px-5 py-3.5 border-b club-divider flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 club-text-gold" />
            <span className="text-xs font-extrabold uppercase tracking-wider club-text-gold">
              Registrazione Club
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-xl club-btn-secondary flex items-center justify-center cursor-pointer shrink-0"
            title="Chiudi"
            aria-label="Chiudi benvenuto"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenuto */}
        <div className="p-5 overflow-y-auto flex-1 min-h-0 space-y-4">
          <div className="text-center space-y-2.5 pt-1">
            <div className="relative inline-block mx-auto">
              {photo ? (
                <img
                  src={photo}
                  alt={displayName}
                  className="w-20 h-20 rounded-full border-2 border-[var(--accent-gold)] shadow-xl object-cover mx-auto"
                />
              ) : (
                <div className="w-20 h-20 rounded-full gold-gradient flex items-center justify-center font-display font-bold text-3xl shadow-xl mx-auto">
                  {displayName.slice(0, 1).toUpperCase()}
                </div>
              )}
              <span className="absolute bottom-0 right-0 p-1 rounded-full bg-emerald-500 text-emerald-950 border-2 border-[var(--surface-card-solid)]">
                <CheckCircle2 className="w-4 h-4 stroke-[3]" />
              </span>
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-300 mb-1">
                <ShieldCheck className="w-4 h-4" />
                <span>Account Google Verificato</span>
              </div>
              <h2 className="font-display text-2xl font-bold text-white m-0">
                Benvenuto, {displayName}
              </h2>
              <p className="text-xs club-text-subtle m-0 mt-1">
                Il tuo profilo è ora sincronizzato nel cloud del Club.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl club-inset border club-divider space-y-3">
            <div className="flex items-start gap-2.5 text-xs club-text-muted">
              <Mail className="w-4 h-4 club-text-gold shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white block">Indirizzo verificato</span>
                <p className="text-xs club-text-subtle m-0 mt-0.5">{email}</p>
              </div>
            </div>

            <div className="h-px bg-[var(--border-subtle)]" />

            <div className="flex items-start gap-2.5 text-xs club-text-muted">
              <Users className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white block">Amici & Inviti al Tavolo</span>
                <p className="text-xs club-text-subtle m-0 mt-0.5">
                  I compagni possono invitarti ai tavoli con un tocco.
                </p>
              </div>
            </div>

            <div className="h-px bg-[var(--border-subtle)]" />

            <div className="flex items-start gap-2.5 text-xs club-text-muted">
              <Trophy className="w-4 h-4 club-text-gold shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white block">Carriera & Storico Cloud</span>
                <p className="text-xs club-text-subtle m-0 mt-0.5">
                  Punteggi, burrachi e classifiche sempre salvati.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t club-divider shrink-0 flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 min-h-[46px] px-4 rounded-xl gold-gradient font-bold text-sm active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Flame className="w-4 h-4 fill-current" />
            <span>Inizia a Giocare</span>
          </button>

          {onOpenProfile && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenProfile();
              }}
              className="min-h-[46px] px-4 rounded-xl club-btn-secondary font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Vedi Profilo</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
