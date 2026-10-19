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

export default function WelcomeModal({
  isOpen,
  onClose,
  user,
  onOpenProfile
}) {
  useEffect(() => {
    if (isOpen && user) {
      // Suono di festa elegante
      try {
        sound.playBurracoChime();
      } catch {}

      // Coriandoli festosi
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
      className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md max-h-[92vh] sm:max-h-[88vh] flex flex-col my-auto overflow-hidden rounded-3xl bg-gradient-to-b from-emerald-950 via-slate-900 to-emerald-950 border-2 border-amber-400 shadow-2xl text-white relative animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow di sfondo dorato */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-32 bg-amber-400/15 blur-3xl pointer-events-none rounded-full" />

        {/* TESTATA FISSA CON TASTO CHIUDI */}
        <div className="p-3.5 sm:p-4 border-b border-emerald-800/60 flex items-center justify-between shrink-0 bg-emerald-950/90 z-10">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-400/20 text-amber-300 border border-amber-400/40">
              <Sparkles className="w-4 h-4 text-amber-300 animate-spin" style={{ animationDuration: '4s' }} />
            </span>
            <span className="text-xs font-black uppercase tracking-wider text-amber-300">
              Registrazione Ufficiale Club
            </span>
          </div>

          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-emerald-300 hover:text-white hover:bg-emerald-800/60 transition-colors cursor-pointer shrink-0"
            title="Chiudi"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CONTENUTO SCORREVOLE */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 min-h-0 space-y-4">
          
          {/* Avatar e Titolo di Benvenuto */}
          <div className="text-center space-y-2 pt-1">
            <div className="relative inline-block mx-auto">
              {photo ? (
                <img 
                  src={photo} 
                  alt={displayName} 
                  className="w-20 h-20 sm:w-22 sm:h-22 rounded-full border-3 border-amber-400 shadow-xl object-cover mx-auto"
                />
              ) : (
                <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-full bg-emerald-900 border-3 border-amber-400 flex items-center justify-center text-amber-300 font-black text-2xl shadow-xl mx-auto">
                  {displayName.slice(0, 1).toUpperCase()}
                </div>
              )}
              <span className="absolute bottom-0 right-0 p-1.5 rounded-full bg-emerald-500 text-emerald-950 border-2 border-emerald-950 shadow-md">
                <CheckCircle2 className="w-4 h-4 stroke-[3]" />
              </span>
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Account Google Verificato</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white m-0">
                Benvenuto nel Club, {displayName}!
              </h2>
              <p className="text-xs text-emerald-300/80 m-0 mt-0.5">
                Il tuo profilo è ora registrato e sincronizzato nel cloud.
              </p>
            </div>
          </div>

          {/* Scheda di Notifica e Conferma */}
          <div className="p-3.5 rounded-2xl bg-emerald-950/70 border border-emerald-700/60 space-y-3 shadow-inner">
            <div className="flex items-start gap-2.5 text-xs text-emerald-200">
              <span className="p-1 rounded-lg bg-emerald-800/80 text-emerald-300 shrink-0 mt-0.5">
                <Mail className="w-3.5 h-3.5 text-amber-300" />
              </span>
              <div>
                <span className="font-bold text-white">Notifica Google inviata:</span>
                <p className="text-[11px] text-emerald-300/80 m-0 mt-0.5">
                  Google ha registrato l'autorizzazione di sicurezza e ha confermato il tuo indirizzo email (<span className="text-amber-200 font-semibold">{email}</span>).
                </p>
              </div>
            </div>

            <div className="h-px bg-emerald-800/50" />

            <div className="flex items-start gap-2.5 text-xs text-emerald-200">
              <span className="p-1 rounded-lg bg-emerald-800/80 text-emerald-300 shrink-0 mt-0.5">
                <Users className="w-3.5 h-3.5 text-emerald-400" />
              </span>
              <div>
                <span className="font-bold text-white">Amici & Inviti al Tavolo:</span>
                <p className="text-[11px] text-emerald-300/80 m-0 mt-0.5">
                  I tuoi compagni possono ora invitarti direttamente ai tavoli da gioco o aggiungerti agli amici del club con la tua email.
                </p>
              </div>
            </div>

            <div className="h-px bg-emerald-800/50" />

            <div className="flex items-start gap-2.5 text-xs text-emerald-200">
              <span className="p-1 rounded-lg bg-emerald-800/80 text-emerald-300 shrink-0 mt-0.5">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
              </span>
              <div>
                <span className="font-bold text-white">Carriera & Storico Partite:</span>
                <p className="text-[11px] text-emerald-300/80 m-0 mt-0.5">
                  Tutti i tuoi punteggi, burrachi puliti e vittorie verranno memorizzati nel tuo profilo e consultabili in qualsiasi momento.
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* PIÈ DI PAGINA FISSO CON PULSANTI */}
        <div className="p-3.5 sm:p-4 border-t border-emerald-800/60 bg-emerald-950/90 shrink-0 flex flex-col sm:flex-row gap-2 z-10">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl gold-gradient text-emerald-950 font-black text-sm shadow-lg hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Flame className="w-4 h-4 text-emerald-950 fill-emerald-950" />
            <span>Inizia a Giocare!</span>
          </button>

          {onOpenProfile && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenProfile();
              }}
              className="py-3 px-4 rounded-xl bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200 hover:text-white border border-emerald-700/60 font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Vedi Profilo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
