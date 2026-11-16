import React from 'react';
import { X, Bell, UserPlus, Trophy, Check, Mail } from 'lucide-react';
import DeveloperBadge from './DeveloperBadge';
import { isDeveloperAccount } from '../utils/developer';
import { useModalEscape } from '../hooks/useModalEscape';

export default function NotificationsModal({
  isOpen,
  onClose,
  notifications = [],
  onAcceptFriendRequest,
  onDeclineFriendRequest,
  onAcceptGameInvite,
  onDeclineGameInvite
}) {
  useModalEscape(isOpen, onClose);

  if (!isOpen) return null;

  const friendRequests = notifications.filter(n => n.type === 'friend_request');
  const gameInvites = notifications.filter(n => n.type === 'game_invite');

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-md overflow-hidden"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Notifiche e inviti"
    >
      <div
        className="relative w-full max-w-lg club-card-solid rounded-t-3xl sm:rounded-3xl flex flex-col max-h-[92dvh] sm:max-h-[86dvh] overflow-hidden club-sheet-enter"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sm:hidden flex justify-center pt-2.5 pb-1 shrink-0">
          <span className="w-10 h-1 rounded-full bg-white/25" />
        </div>

        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b club-divider flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl gold-gradient flex items-center justify-center shrink-0">
              <Bell className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="font-display text-lg font-bold text-white m-0 truncate">Notifiche & Inviti</h2>
                {notifications.length > 0 && (
                  <span className="font-mono-num min-w-[22px] h-[22px] px-1.5 rounded-full gold-gradient text-xs font-black inline-flex items-center justify-center">
                    {notifications.length}
                  </span>
                )}
              </div>
              <p className="text-xs club-text-subtle m-0 truncate">Amicizie e inviti ai tavoli live</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-11 h-11 rounded-xl club-btn-secondary flex items-center justify-center cursor-pointer shrink-0"
            aria-label="Chiudi notifiche"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo scorrevole */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 min-h-0 space-y-4">
          {notifications.length === 0 ? (
            <div className="py-10 text-center space-y-3">
              <div className="w-14 h-14 mx-auto rounded-2xl club-inset border club-divider flex items-center justify-center club-text-subtle">
                <Bell className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white m-0">Nessuna notifica al momento</h3>
                <p className="text-xs club-text-subtle mt-1 max-w-xs mx-auto leading-relaxed">
                  Quando un amico ti inviterà a un tavolo o ti invierà una richiesta, la troverai qui.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {gameInvites.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-extrabold club-text-gold uppercase tracking-wider px-1">
                    <Trophy className="w-4 h-4" />
                    <span>Inviti ai Tavoli ({gameInvites.length})</span>
                  </div>

                  {gameInvites.map((notif) => (
                    <div
                      key={notif.id}
                      className="p-3.5 rounded-2xl club-inset border border-[var(--accent-gold)]/45 space-y-3"
                    >
                      <div className="flex items-center gap-3">
                        {notif.fromPhoto ? (
                          <img
                            src={notif.fromPhoto}
                            alt=""
                            className="w-11 h-11 rounded-full border border-[var(--accent-gold)] shrink-0 object-cover"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-full gold-gradient font-bold text-sm flex items-center justify-center shrink-0">
                            {(notif.fromName || 'U').slice(0, 1).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="text-xs club-text-subtle">Invito da</div>
                          <div className="text-sm font-bold text-white truncate flex items-center gap-1.5 flex-wrap">
                            <span>{notif.fromName}</span>
                            {isDeveloperAccount(notif.fromEmail || notif.fromUid || notif.fromName) && <DeveloperBadge size="xs" />}
                          </div>
                          <div className="text-xs club-text-gold font-medium mt-0.5">
                            Squadra: <strong className="text-white">{notif.teamName || 'Al Tavolo'}</strong>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t club-divider">
                        <button
                          type="button"
                          onClick={() => onAcceptGameInvite(notif)}
                          className="flex-1 min-h-[42px] px-3 rounded-xl gold-gradient font-bold text-xs active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Check className="w-4 h-4 stroke-[2.5]" />
                          <span>Accetta & Entra</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeclineGameInvite(notif)}
                          className="min-h-[42px] px-4 rounded-xl club-btn-secondary hover:text-rose-300 font-semibold text-xs cursor-pointer"
                        >
                          Rifiuta
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {friendRequests.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-extrabold club-text-muted uppercase tracking-wider px-1">
                    <UserPlus className="w-4 h-4 club-text-gold" />
                    <span>Richieste di Amicizia ({friendRequests.length})</span>
                  </div>

                  {friendRequests.map((notif) => (
                    <div
                      key={notif.id}
                      className="p-3.5 rounded-2xl club-inset border club-divider space-y-3"
                    >
                      <div className="flex items-center gap-3">
                        {notif.fromPhoto ? (
                          <img
                            src={notif.fromPhoto}
                            alt=""
                            className="w-11 h-11 rounded-full border border-[var(--accent-gold)] shrink-0 object-cover"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-full gold-gradient font-bold text-sm flex items-center justify-center shrink-0">
                            {(notif.fromName || 'U').slice(0, 1).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-bold text-white truncate flex items-center gap-1.5 flex-wrap">
                            <span>{notif.fromName}</span>
                            {isDeveloperAccount(notif.fromEmail || notif.fromUid || notif.fromName) && <DeveloperBadge size="xs" />}
                          </div>
                          <div className="text-xs club-text-subtle truncate flex items-center gap-1">
                            <Mail className="w-3.5 h-3.5 shrink-0" />
                            <span>{notif.fromEmail}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t club-divider">
                        <button
                          type="button"
                          onClick={() => onAcceptFriendRequest(notif)}
                          className="flex-1 min-h-[42px] px-3 rounded-xl gold-gradient font-bold text-xs active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Check className="w-4 h-4 stroke-[2.5]" />
                          <span>Accetta Amicizia</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeclineFriendRequest(notif)}
                          className="min-h-[42px] px-4 rounded-xl club-btn-secondary hover:text-rose-300 font-semibold text-xs cursor-pointer"
                        >
                          Rifiuta
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3.5 border-t club-divider flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[42px] px-5 rounded-xl club-btn-secondary text-xs font-bold active:scale-95 cursor-pointer"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
}
