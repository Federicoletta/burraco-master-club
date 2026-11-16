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
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/85 backdrop-blur-md overflow-hidden animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Notifiche e inviti"
    >
      <div
        className="relative w-full max-w-lg felt-card rounded-2xl border border-amber-500/40 shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[86vh] my-auto overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Intestazione fissa pinnata */}
        <div className="p-3.5 sm:p-4 pb-3 border-b border-emerald-700/50 flex items-center justify-between shrink-0 bg-emerald-950/90">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl gold-gradient flex items-center justify-center text-emerald-950 font-black shadow-md">
              <Bell className="w-5 h-5 text-emerald-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white m-0">Notifiche & Inviti</h2>
                {notifications.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-400 text-emerald-950 text-xs font-black">
                    {notifications.length} {notifications.length === 1 ? 'nuova' : 'nuove'}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-emerald-300/80 m-0">Accetta amicizie e inviti alle partite dal vivo</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-800/50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo scorrevole */}
        <div className="p-3.5 sm:p-4 overflow-y-auto flex-1 min-h-0 space-y-4">
          {/* Nessuna notifica */}
          {notifications.length === 0 ? (
            <div className="py-10 text-center space-y-3">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-900/60 border border-emerald-600/40 flex items-center justify-center text-emerald-400/60 shadow-inner">
                <Bell className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white m-0">Nessuna notifica al momento</h3>
                <p className="text-xs text-emerald-300/70 mt-1 max-w-xs mx-auto">
                  Quando un amico ti manderà una richiesta o ti inviterà a giocare a un tavolo, la troverai qui!
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">

            {/* SEZIONE 1: Inviti alle Partite */}
            {gameInvites.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300 uppercase tracking-wider px-1">
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  <span>Inviti ai Tavoli di Burraco ({gameInvites.length})</span>
                </div>

                {gameInvites.map((notif) => (
                  <div 
                    key={notif.id}
                    className="p-3.5 rounded-xl bg-gradient-to-br from-emerald-950/90 to-amber-950/40 border border-amber-500/40 shadow-lg space-y-3"
                  >
                    <div className="flex items-center gap-3">
                      {notif.fromPhoto ? (
                        <img 
                          src={notif.fromPhoto} 
                          alt="" 
                          className="w-10 h-10 rounded-full border-2 border-amber-400 shrink-0 object-cover" 
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-amber-400 text-emerald-950 font-black text-sm flex items-center justify-center shrink-0">
                          {(notif.fromName || 'U').slice(0, 1).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-xs text-emerald-300/80">Invito da</div>
                        <div className="text-sm font-bold text-white truncate flex items-center gap-1.5 flex-wrap">
                          <span>{notif.fromName}</span>
                          {isDeveloperAccount(notif.fromEmail || notif.fromUid || notif.fromName) && <DeveloperBadge size="xs" />}
                        </div>
                        <div className="text-[11px] text-amber-300 font-medium mt-0.5">
                          Ti ha aggiunto in: <span className="font-bold text-amber-200">{notif.teamName || 'Squadra'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1 border-t border-emerald-800/40">
                      <button
                        type="button"
                        onClick={() => onAcceptGameInvite(notif)}
                        className="flex-1 py-2 px-3 rounded-xl gold-gradient text-emerald-950 font-bold text-xs shadow-md hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Check className="w-4 h-4 text-emerald-950 stroke-[3]" />
                        <span>Accetta & Entra al Tavolo</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeclineGameInvite(notif)}
                        className="py-2 px-3 rounded-xl bg-emerald-900/60 hover:bg-red-950/70 hover:text-red-300 text-emerald-300 border border-emerald-700/40 font-semibold text-xs transition-colors cursor-pointer"
                        title="Rifiuta invito"
                      >
                        Rifiuta
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* SEZIONE 2: Richieste di Amicizia */}
            {friendRequests.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300 uppercase tracking-wider px-1">
                  <UserPlus className="w-3.5 h-3.5 text-amber-400" />
                  <span>Richieste di Amicizia ({friendRequests.length})</span>
                </div>

                {friendRequests.map((notif) => (
                  <div 
                    key={notif.id}
                    className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-600/40 shadow-md space-y-3"
                  >
                    <div className="flex items-center gap-3">
                      {notif.fromPhoto ? (
                        <img 
                          src={notif.fromPhoto} 
                          alt="" 
                          className="w-10 h-10 rounded-full border-2 border-emerald-400 shrink-0 object-cover" 
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-emerald-800 text-amber-300 border border-amber-400 font-bold text-sm flex items-center justify-center shrink-0">
                          {(notif.fromName || 'U').slice(0, 1).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold text-white truncate flex items-center gap-1.5 flex-wrap">
                          <span>{notif.fromName}</span>
                          {isDeveloperAccount(notif.fromEmail || notif.fromUid || notif.fromName) && <DeveloperBadge size="xs" />}
                        </div>
                        <div className="text-xs text-emerald-300/80 truncate flex items-center gap-1">
                          <Mail className="w-3 h-3 text-emerald-400" />
                          <span>{notif.fromEmail}</span>
                        </div>
                        <div className="text-[10px] text-amber-300/90 font-medium mt-0.5">
                          Vuole aggiungerti ai suoi amici del Burraco Club
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1 border-t border-emerald-800/40">
                      <button
                        type="button"
                        onClick={() => onAcceptFriendRequest(notif)}
                        className="flex-1 py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold text-xs shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Check className="w-4 h-4 text-emerald-950 stroke-[3]" />
                        <span>Accetta Amicizia</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeclineFriendRequest(notif)}
                        className="py-2 px-3 rounded-xl bg-emerald-900/60 hover:bg-red-950/70 hover:text-red-300 text-emerald-300 border border-emerald-700/40 font-semibold text-xs transition-colors cursor-pointer"
                        title="Rifiuta richiesta"
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

        {/* Footer fisso */}
        <div className="p-3 border-t border-emerald-700/50 flex justify-end shrink-0 bg-emerald-950/90">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200 text-xs font-bold transition-all active:scale-95 cursor-pointer"
          >
            Chiudi
          </button>
        </div>

      </div>
    </div>
  );
}
