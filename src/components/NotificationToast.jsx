import React, { useEffect, useState } from 'react';
import { Trophy, UserCheck, X, Check, Users, Sparkles } from 'lucide-react';

export default function NotificationToast({
  notification,
  onAccept,
  onDecline,
  onClose
}) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!notification) return;

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
  }, [notification, onClose]);

  if (!notification) return null;

  const isInvite = notification.type === 'game_invite';

  return (
    <aside
      aria-label="Notifica in arrivo"
      className="fixed top-4 left-4 right-4 sm:left-auto sm:right-4 z-[70] sm:max-w-sm shadow-2xl rounded-2xl overflow-hidden border border-[var(--accent-gold)] club-card-solid text-white"
    >
      <div
        className="h-1 gold-gradient transition-all ease-linear"
        style={{ width: `${progress}%` }}
      />

      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="relative shrink-0">
            {notification.fromPhoto ? (
              <img
                src={notification.fromPhoto}
                alt={notification.fromName || 'Mittente'}
                className="w-11 h-11 rounded-full object-cover border-2 border-[var(--accent-gold)]"
              />
            ) : (
              <div className="w-11 h-11 rounded-full gold-gradient flex items-center justify-center font-bold">
                {isInvite ? <Trophy className="w-5 h-5" /> : <UserCheck className="w-5 h-5" />}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 pr-1">
            <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider club-text-gold">
              {isInvite ? (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Invito al Tavolo</span>
                </>
              ) : (
                <>
                  <Users className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Richiesta Amicizia</span>
                </>
              )}
            </div>

            <p className="font-bold text-sm text-white truncate mt-0.5 m-0">
              {notification.fromName || notification.fromEmail}
            </p>

            <p className="text-xs club-text-muted mt-0.5 line-clamp-2 m-0">
              {isInvite
                ? `Ti ha invitato in "${notification.teamName || 'Al Tavolo'}"`
                : 'Vuole aggiungerti agli amici del Club.'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-lg club-btn-secondary flex items-center justify-center cursor-pointer shrink-0"
            title="Chiudi"
            aria-label="Chiudi notifica"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2 mt-3 pt-3 border-t club-divider">
          <button
            type="button"
            onClick={() => {
              onClose?.();
              onAccept?.(notification);
            }}
            className="flex-1 min-h-[42px] flex items-center justify-center gap-1.5 px-3 rounded-xl gold-gradient font-bold text-xs transition active:scale-95 cursor-pointer"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>{isInvite ? 'Accetta & Entra' : 'Accetta'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose?.();
              onDecline?.(notification);
            }}
            className="min-h-[42px] px-4 rounded-xl club-btn-secondary hover:text-rose-300 font-semibold text-xs transition active:scale-95 cursor-pointer"
          >
            Rifiuta
          </button>
        </div>
      </div>
    </aside>
  );
}
