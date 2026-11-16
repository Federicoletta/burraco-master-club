import React from 'react';
import { Users, Bell, UserPlus, Check, Trash2, Search, Send, Star } from 'lucide-react';
import { getFriendOnlineStatus } from '../../services/social';
import { useConfirm } from '../../context/confirmContextStore';
import DeveloperBadge from '../DeveloperBadge';
import { isDeveloperAccount } from '../../utils/developer';

export default function FriendsTab({
  incomingFriendRequests = [],
  friendsList = [],
  onlineCount = 0,
  activeGame = null,
  tablePlayers = [],
  invitingFriendUids = {},
  invitedFriendUids = {},
  onAcceptFriendRequest,
  onDeclineFriendRequest,
  handleInviteToActiveGame,
  handleChallenge,
  onRemoveFriend,
  onToggleCloseFriend,
  friendSearchInput = '',
  setFriendSearchInput,
  handleFormSubmit,
  handleSendFriend,
  isSendingFriend = false,
  filteredSuggestions = [],
  friendFeedback = null,
}) {
  const confirm = useConfirm();

  return (
    <div className="space-y-4">
      {/* RICHIESTE DI AMICIZIA IN ARRIVO */}
      {incomingFriendRequests.length > 0 && (
        <div className="p-3.5 rounded-2xl club-inset border border-[var(--accent-gold)] space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-extrabold club-text-gold uppercase tracking-wider">
            <Bell className="w-4 h-4 shrink-0" />
            <span>Richieste in Arrivo ({incomingFriendRequests.length})</span>
          </div>

          <div className="space-y-2">
            {incomingFriendRequests.map(notif => (
              <div
                key={notif.id}
                className="p-3 rounded-xl club-card border club-divider flex items-center justify-between gap-2.5"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-sm text-white truncate flex items-center gap-1.5 flex-wrap">
                    <span>{notif.fromName || 'Giocatore'}</span>
                    {isDeveloperAccount(notif.fromEmail || notif.fromUid || notif.fromName) && (
                      <DeveloperBadge size="xs" />
                    )}
                  </div>
                  <div className="text-xs club-text-subtle truncate">{notif.fromEmail}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => onAcceptFriendRequest && onAcceptFriendRequest(notif)}
                    className="min-h-[42px] px-3.5 rounded-xl gold-gradient font-bold text-xs active:scale-95 cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    <span>Accetta</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeclineFriendRequest && onDeclineFriendRequest(notif)}
                    className="w-[42px] h-[42px] rounded-xl club-btn-secondary hover:text-rose-300 flex items-center justify-center cursor-pointer"
                    title="Rifiuta richiesta"
                    aria-label="Rifiuta richiesta"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RUBRICA AMICI CONFERMATI */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold club-text-gold uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-4 h-4" />
            <span>I Tuoi Amici ({friendsList.length})</span>
          </span>
          {onlineCount > 0 && (
            <span className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>{onlineCount} online</span>
            </span>
          )}
        </div>

        {friendsList.length > 0 && (
          <div className="p-3 rounded-xl club-inset border club-divider text-xs club-text-muted flex items-start gap-2.5 leading-relaxed">
            <Star className="w-4 h-4 club-text-gold shrink-0 mt-0.5 fill-current" />
            <span>
              <strong className="text-white">Amici Stretti:</strong> tocca la stella per inserire un amico al tavolo subito senza attendere risposta all'invito.
            </span>
          </div>
        )}

        {friendsList.length === 0 ? (
          <div className="p-5 rounded-2xl club-inset border club-divider text-center space-y-1.5">
            <p className="text-sm font-semibold text-white m-0">
              Rubrica ancora vuota
            </p>
            <p className="text-xs club-text-subtle m-0">
              Cerca i tuoi compagni qui sotto tramite nome o email Google per inviare l'amicizia.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {friendsList.map(friend => {
              const status = getFriendOnlineStatus(friend.lastSeen);
              const isAtTable = tablePlayers.some(
                p => (friend.uid && p.uid === friend.uid) || (friend.email && p.email?.toLowerCase() === friend.email?.toLowerCase())
              );
              const isInvited = invitedFriendUids[friend.uid || friend.email];
              const isInviting = invitingFriendUids[friend.uid || friend.email];

              return (
                <div
                  key={friend.uid || friend.email}
                  className="p-3 rounded-2xl club-inset border club-divider space-y-2.5"
                >
                  {/* Riga superiore: Identità amico + tasto Stella & Elimina */}
                  <div className="flex items-center justify-between gap-2.5">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="relative shrink-0">
                        {friend.photoURL ? (
                          <img
                            src={friend.photoURL}
                            alt=""
                            className="w-10 h-10 rounded-full border border-[var(--accent-gold)] object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full gold-gradient font-bold text-sm flex items-center justify-center">
                            {(friend.displayName || friend.email || 'U').slice(0, 1).toUpperCase()}
                          </div>
                        )}
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[var(--surface-card-solid)] ${
                            status.color === 'emerald'
                              ? 'bg-emerald-400'
                              : status.color === 'amber'
                              ? 'bg-amber-400'
                              : 'bg-zinc-500'
                          }`}
                          title={status.label}
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-sm text-white truncate">
                            {friend.displayName || 'Giocatore'}
                          </span>
                          {isDeveloperAccount(friend) && (
                            <DeveloperBadge size="xs" />
                          )}
                          {friend.isCloseFriend && (
                            <span className="text-[10px] club-text-gold font-bold">
                              ★ Stretto
                            </span>
                          )}
                        </div>
                        <div className="text-xs club-text-subtle truncate">
                          {friend.email}
                        </div>
                        <div className="text-[11px] font-medium mt-0.5 flex items-center gap-1.5">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              status.color === 'emerald' ? 'bg-emerald-400' : status.color === 'amber' ? 'bg-amber-400' : 'bg-zinc-500'
                            }`}
                          />
                          <span className={status.color === 'emerald' ? 'text-emerald-300 font-semibold' : status.color === 'amber' ? 'club-text-gold' : 'club-text-subtle'}>
                            {status.label}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {onToggleCloseFriend && (
                        <button
                          type="button"
                          onClick={() => onToggleCloseFriend(friend)}
                          className={`w-10 h-10 rounded-xl border transition-all cursor-pointer flex items-center justify-center active:scale-95 ${
                            friend.isCloseFriend
                              ? 'bg-[var(--accent-ring)] border-[var(--accent-gold)] club-text-gold'
                              : 'club-btn-secondary club-text-subtle'
                          }`}
                          title={
                            friend.isCloseFriend
                              ? 'Amico Stretto (entra subito senza invito). Tocca per rimuovere.'
                              : 'Promuovi ad Amico Stretto'
                          }
                          aria-label="Imposta come Amico Stretto"
                        >
                          <Star className={`w-4 h-4 ${friend.isCloseFriend ? 'fill-current' : ''}`} />
                        </button>
                      )}

                      {onRemoveFriend && (
                        <button
                          type="button"
                          onClick={async () => {
                            const ok = await confirm({
                              title: 'Rimuovi Amico',
                              message: `Vuoi rimuovere ${friend.displayName || friend.email} dai tuoi amici?`,
                              confirmText: 'Rimuovi',
                              variant: 'danger'
                            });
                            if (ok) {
                              onRemoveFriend(friend);
                            }
                          }}
                          className="w-10 h-10 rounded-xl club-btn-secondary club-text-subtle hover:text-rose-300 flex items-center justify-center cursor-pointer"
                          title="Rimuovi amico"
                          aria-label="Rimuovi amico"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Riga Azioni Tavolo (>=42px target comodi anche su schermo stretto) */}
                  <div className="flex items-center gap-2 pt-2 border-t club-divider">
                    {activeGame && activeGame.id && handleInviteToActiveGame && (
                      isAtTable ? (
                        <span className="flex-1 min-h-[40px] px-3 rounded-xl bg-emerald-500/15 text-emerald-300 font-bold text-xs border border-emerald-400/35 flex items-center justify-center">
                          Già al Tavolo
                        </span>
                      ) : isInvited ? (
                        <span className="flex-1 min-h-[40px] px-3 rounded-xl bg-emerald-500/15 text-emerald-300 font-bold text-xs border border-emerald-400/35 flex items-center justify-center gap-1.5">
                          <Check className="w-4 h-4" />
                          <span>Invitato</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={isInviting}
                          onClick={() => handleInviteToActiveGame(friend)}
                          className="flex-1 min-h-[40px] px-3 rounded-xl gold-gradient font-bold text-xs active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                          title="Invita al tavolo attivo"
                        >
                          <span>{isInviting ? 'Invio...' : 'Invita al Tavolo'}</span>
                        </button>
                      )
                    )}

                    <button
                      type="button"
                      onClick={() => handleChallenge(friend)}
                      className="flex-1 min-h-[40px] px-3 rounded-xl club-btn-secondary font-bold text-xs active:scale-95 transition-all cursor-pointer"
                      title="Avvia una nuova partita con questo amico"
                    >
                      Nuova Sfida
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* AGGIUNGI AMICO TRAMITE EMAIL */}
      <div className="p-3.5 rounded-2xl club-inset border club-divider space-y-3">
        <div className="flex items-center gap-2 text-xs font-extrabold club-text-gold uppercase tracking-wider">
          <UserPlus className="w-4 h-4" />
          <span>Aggiungi Nuovo Amico</span>
        </div>

        <form onSubmit={handleFormSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 club-text-subtle absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={friendSearchInput}
              onChange={(e) => setFriendSearchInput(e.target.value)}
              placeholder="Nome o email compagno..."
              className="w-full min-h-[44px] pl-10 pr-3 rounded-xl club-input text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={isSendingFriend || !friendSearchInput.trim()}
            className="min-h-[44px] px-4 rounded-xl gold-gradient font-bold text-xs active:scale-95 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shrink-0"
          >
            <Send className="w-4 h-4" />
            <span>{isSendingFriend ? 'Invio...' : 'Invia'}</span>
          </button>
        </form>

        {filteredSuggestions.length > 0 && (
          <div className="space-y-1.5 pt-2 border-t club-divider">
            <span className="text-[11px] club-text-subtle font-bold uppercase tracking-wider block">
              Membri del Club trovati:
            </span>
            {filteredSuggestions.map(sug => (
              <button
                type="button"
                key={sug.uid || sug.email}
                onClick={() => handleSendFriend(sug)}
                className="w-full min-h-[48px] p-2.5 rounded-xl club-btn-secondary flex items-center justify-between gap-2 text-left cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {sug.photoURL ? (
                    <img src={sug.photoURL} alt="" className="w-8 h-8 rounded-full border border-[var(--accent-gold)] object-cover shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded-full gold-gradient font-bold text-xs flex items-center justify-center shrink-0">
                      {(sug.displayName || 'U').slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-white truncate">{sug.displayName}</span>
                      {isDeveloperAccount(sug) && <DeveloperBadge size="xs" />}
                    </div>
                    <span className="text-[11px] club-text-subtle truncate block">{sug.email}</span>
                  </div>
                </div>
                <span className="text-xs font-bold club-text-gold shrink-0">+ Invia</span>
              </button>
            ))}
          </div>
        )}

        {friendFeedback && (
          <div
            className={`p-3 rounded-xl text-xs font-semibold border ${
              friendFeedback.type === 'success'
                ? 'bg-emerald-500/15 text-emerald-200 border-emerald-400/40'
                : 'bg-rose-950/75 text-rose-200 border-rose-500/40'
            }`}
          >
            {friendFeedback.text}
          </div>
        )}
      </div>
    </div>
  );
}