import React, { useEffect, useState } from 'react';
import { Bell, Trophy, UserCheck, X, Check, Users, Sparkles } from 'lucide-react';

export default function NotificationToast({
  notification,
  onAccept,
  onDecline,
  onClose
}) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!notification) return;

    // Timer per barra di progresso di 9 secondi
    const duration = 9000;
    const intervalTime = 50;
    const decrement = (intervalTime / duration) * 100;

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev <= decrement) {
          clearInterval(interval);
          onClose();
          return 0;
        }
        return prev - decrement;
      });
    }, intervalTime);

    return () => clearInterval(interval);
  }, [notification]);

  if (!notification) return null;

  const isInvite = notification.type === 'game_invite';

  return (
    <aside 
      aria-label="Notifica in arrivo"
      className="fixed top-4 right-4 z-50 max-w-sm w-full mx-auto p-0 animate-in fade-in slide-in-from-top-4 duration-300 shadow-2xl rounded-2xl overflow-hidden border border-amber-500/40 bg-gradient-to-b from-slate-900 via-emerald-950 to-slate-950 text-white backdrop-blur-md"
    >
      {/* Barra di progresso superiore */}
      <div 
        className="h-1 bg-gradient-to-r from-amber-400 to-emerald-400 transition-all ease-linear"
        style={{ width: `${progress}%` }}
      />

      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Icona o Avatar mittente */}
          <div className="relative shrink-0">
            {notification.fromPhoto ? (
              <img 
                src={notification.fromPhoto} 
                alt={notification.fromName || 'Mittente'} 
                className="w-11 h-11 rounded-full object-cover border-2 border-amber-400/80 shadow-md"
              />
            ) : (
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-slate-950 font-bold shadow-md">
                {isInvite ? <Trophy className="w-6 h-6 text-slate-950" /> : <UserCheck className="w-6 h-6 text-slate-950" />}
              </div>
            )}
            <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500 items-center justify-center text-[9px] font-black text-slate-950">
                !
              </span>
            </span>
          </div>

          {/* Dettagli notifica */}
          <div className="flex-1 min-w-0 pr-2">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-400">
              {isInvite ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Invito al Tavolo</span>
                </>
              ) : (
                <>
                  <Users className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Richiesta Amicizia</span>
                </>
              )}
            </div>

            <p className="font-bold text-sm text-slate-100 truncate mt-0.5">
              {notification.fromName || notification.fromEmail}
            </p>

            <p className="text-xs text-slate-300 mt-0.5 line-clamp-2">
              {isInvite 
                ? `Ti ha invitato a giocare nella squadra "${notification.teamName || 'In Partita'}"!`
                : `Vuole diventare tuo amico per giocare online.`}
            </p>
          </div>

          {/* Chiudi toast */}
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/60 transition"
            title="Chiudi"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Pulsanti Azione Rapida */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-800/80">
          <button
            onClick={() => {
              onClose?.();
              onAccept?.(notification);
            }}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-xs shadow-md transition active:scale-95 cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{isInvite ? 'Accetta ed Entra' : 'Accetta Amicizia'}</span>
          </button>

          <button
            onClick={() => {
              onClose?.();
              onDecline?.(notification);
            }}
            className="py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-red-950/60 text-slate-300 hover:text-red-400 font-medium text-xs border border-slate-700 hover:border-red-500/40 transition active:scale-95 cursor-pointer"
          >
            Rifiuta
          </button>
        </div>
      </div>
    </aside>
  );
}
