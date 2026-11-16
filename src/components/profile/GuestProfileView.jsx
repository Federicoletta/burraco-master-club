import React from 'react';
import { User, Sparkles, Trophy, BarChart3, Users, Cloud, ShieldCheck } from 'lucide-react';
import { isFirebaseConfigured } from '../../services/firebase';

export default function GuestProfileView({ onLogin, onClose }) {
  return (
    <div className="p-4 sm:p-6 text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
      
      {/* Badge Header Club */}
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-[11px] font-black tracking-wider uppercase">
        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
        <span>Burraco Master Club</span>
        <span className="text-amber-400/60">•</span>
        <span className="text-emerald-300 font-mono">♠ ♥ ♦ ♣</span>
      </div>

      {/* Avatar Icon Hero */}
      <div className="relative mx-auto w-20 h-20">
        <div className="absolute inset-0 rounded-full bg-amber-400/20 blur-xl animate-pulse" />
        <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-emerald-900 to-emerald-950 border-2 border-amber-400/80 flex items-center justify-center text-amber-300 shadow-2xl">
          <User className="w-10 h-10 text-amber-300 drop-shadow" />
        </div>
      </div>

      {/* Titoli e descrizione */}
      <div className="space-y-1.5">
        <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
          Entra nel Club dei Giocatori
        </h3>
        <p className="text-xs text-emerald-300/80 max-w-sm mx-auto leading-relaxed">
          Accedi con il tuo account Google per sbloccare le funzionalità esclusive del tavolo da gioco e della tua carriera.
        </p>
      </div>

      {/* Grid dei vantaggi dell'account */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left max-w-md mx-auto">
        <div className="p-2.5 rounded-xl bg-emerald-950/70 border border-emerald-700/40 flex items-start gap-2.5 shadow-sm">
          <span className="p-1.5 rounded-lg gold-gradient text-emerald-950 shrink-0">
            <Trophy className="w-3.5 h-3.5 text-emerald-950" />
          </span>
          <div className="min-w-0">
            <h4 className="text-xs font-black text-white">Carriera & Trofei</h4>
            <p className="text-[10px] text-emerald-300/70 leading-snug">Salva vittorie, chiusure e record storici personali.</p>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-emerald-950/70 border border-emerald-700/40 flex items-start gap-2.5 shadow-sm">
          <span className="p-1.5 rounded-lg gold-gradient text-emerald-950 shrink-0">
            <BarChart3 className="w-3.5 h-3.5 text-emerald-950" />
          </span>
          <div className="min-w-0">
            <h4 className="text-xs font-black text-white">Grafici & Statistiche</h4>
            <p className="text-[10px] text-emerald-300/70 leading-snug">Andamento punti mani e proporzione Burrachi.</p>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-emerald-950/70 border border-emerald-700/40 flex items-start gap-2.5 shadow-sm">
          <span className="p-1.5 rounded-lg gold-gradient text-emerald-950 shrink-0">
            <Users className="w-3.5 h-3.5 text-emerald-950" />
          </span>
          <div className="min-w-0">
            <h4 className="text-xs font-black text-white">Amici & Inviti Rapidi</h4>
            <p className="text-[10px] text-emerald-300/70 leading-snug">Componi il tavolo con 1 tocco e vedi chi è online.</p>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-emerald-950/70 border border-emerald-700/40 flex items-start gap-2.5 shadow-sm">
          <span className="p-1.5 rounded-lg gold-gradient text-emerald-950 shrink-0">
            <Cloud className="w-3.5 h-3.5 text-emerald-950" />
          </span>
          <div className="min-w-0">
            <h4 className="text-xs font-black text-white">Sync Cloud Sicuro</h4>
            <p className="text-[10px] text-emerald-300/70 leading-snug">Passa da iPhone a iPad senza perdere una smazzata.</p>
          </div>
        </div>
      </div>

      {/* Pulsante Login con Google */}
      <div className="pt-2 max-w-sm mx-auto space-y-2.5">
        {!isFirebaseConfigured && (
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-400/40 text-amber-200 text-[11px] font-semibold leading-snug">
            Modalità locale attiva: l&apos;accesso con Google e la sincronizzazione cloud richiedono le variabili Firebase configurate.
          </div>
        )}
        <button
          type="button"
          onClick={onLogin}
          disabled={!isFirebaseConfigured}
          className="w-full py-3.5 px-5 rounded-2xl bg-white hover:bg-zinc-100 disabled:bg-zinc-300 disabled:text-zinc-600 disabled:cursor-not-allowed text-zinc-900 font-black text-sm shadow-xl hover:shadow-amber-400/20 flex items-center justify-center gap-3 cursor-pointer transition-all active:scale-95 group"
        >
          <svg className="w-5 h-5 shrink-0 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          <span>{isFirebaseConfigured ? 'Accedi con Google' : 'Accesso Cloud Disabilitato'}</span>
        </button>

        <div className="flex items-center justify-center gap-1.5 text-[11px] text-emerald-400/60 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Nessuna password da ricordare, sicuro e istantaneo</span>
        </div>
      </div>

      {onClose && (
        <div className="pt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl text-emerald-400/70 hover:text-white text-xs font-semibold cursor-pointer transition-colors"
          >
            Continua come Ospite
          </button>
        </div>
      )}
    </div>
  );
}
