import React from 'react';
import { Users, Bell, UserPlus, Check, Trash2, Search, Send } from 'lucide-react';
import { getFriendOnlineStatus } from '../../services/social';
import { useConfirm } from '../../context/ConfirmContext';
import DeveloperBadge, { isDeveloperAccount } from '../DeveloperBadge';

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
    <div className="space-y-3.5 animate-in fade-in duration-150">
      
      {/* RICHIESTE DI AMICIZIA IN ARRIVO */}
      {incomingFriendRequests.length > 0 && (
        <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-950/90 to-emerald-950/90 border border-amber-400/80 shadow-lg space-y-2.5 animate-in slide-in-from-top-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-black text-amber-300 uppercase tracking-wider">
              <Bell className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
              <span>Richieste di Amicizia in Arrivo ({incomingFriendRequests.length})</span>
            </div>
          </div>

          <div className="space-y-2">
            {incomingFriendRequests.map(notif => (
              <div 
                key={notif.id}
                className="p-2.5 rounded-xl bg-emerald-950/90 border border-amber-400/40 flex items-center justify-between gap-2 text-xs"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-white truncate flex items-center gap-1.5 flex-wrap">
                    <span>{notif.fromName || 'Giocatore'}</span>
                    {isDeveloperAccount(notif.fromEmail || notif.fromUid || notif.fromName) && (
                      <DeveloperBadge size="xs" />
                    )}
                  </div>
                  <div className="text-[10px] text-emerald-300/70 truncate">{notif.fromEmail}</div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => onAcceptFriendRequest && onAcceptFriendRequest(notif)}
                    className="px-2.5 py-1 rounded-lg gold-gradient text-emerald-950 font-black text-[11px] shadow hover:brightness-110 active:scale-95 cursor-pointer flex items-center gap-1"
                  >
                    <Check className="w-3 h-3 text-emerald-950 stroke-[3]" />
                    <span>Accetta</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeclineFriendRequest && onDeclineFriendRequest(notif)}
                    className="p-1 rounded-lg bg-emerald-900/60 hover:bg-rose-950/80 text-emerald-400 hover:text-rose-300 border border-emerald-700/40 transition-colors cursor-pointer"
                    title="Rifiuta richiesta"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RUBRICA AMICI CONFERMATI */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-amber-400" />
            <span>I Tuoi Amici ({friendsList.length})</span>
          </span>
          {onlineCount > 0 && (
            <span className="text-[10px] font-bold text-emerald-300 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{onlineCount} online adesso</span>
            </span>
          )}
        </div>

        {friendsList.length === 0 ? (
          <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-800/40 text-center space-y-1.5">
            <p className="text-xs text-emerald-300/80 m-0">
              Non hai ancora amici nella tua rubrica di gioco.
            </p>
            <p className="text-[11px] text-emerald-400/60 m-0">
              Usa il modulo sottostante per cercare e aggiungere altri giocatori tramite la loro email Google!
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {friendsList.map(friend => {
              const status = getFriendOnlineStatus(friend.lastSeen);
              return (
                <div 
                  key={friend.uid || friend.email}
                  className="p-2.5 rounded-xl bg-emerald-950/75 border border-emerald-700/40 hover:border-amber-400/40 transition-all flex items-center justify-between gap-2.5 shadow-sm"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="relative shrink-0">
                      {friend.photoURL ? (
                        <img 
                          src={friend.photoURL} 
                          alt="" 
                          className="w-9 h-9 rounded-full border-2 border-amber-400 object-cover" 
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-emerald-900 border-2 border-amber-400 text-amber-300 font-bold text-xs flex items-center justify-center">
                          {(friend.displayName || friend.email || 'U').slice(0, 1).toUpperCase()}
                        </div>
                      )}
                      <span 
                        className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-emerald-950 ${
                          status.color === 'emerald'
                            ? 'bg-emerald-400 shadow-sm shadow-emerald-400'
                            : status.color === 'amber'
                            ? 'bg-amber-400'
                            : 'bg-zinc-500'
                        }`}
                        title={status.label}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-xs sm:text-sm text-white truncate">
                          {friend.displayName || 'Giocatore'}
                        </span>
                        {isDeveloperAccount(friend) ? (
                          <DeveloperBadge size="xs" />
                        ) : (
                          <span className="text-[10px] text-amber-400">⭐</span>
                        )}
                      </div>
                      <div className="text-[10px] text-emerald-300/70 truncate">
                        {friend.email}
                      </div>
                      <div className="text-[9px] font-medium mt-0.5 flex items-center gap-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          status.color === 'emerald' ? 'bg-emerald-400 animate-pulse' : status.color === 'amber' ? 'bg-amber-400' : 'bg-zinc-500'
                        }`} />
                        <span className={status.color === 'emerald' ? 'text-emerald-300 font-bold' : status.color === 'amber' ? 'text-amber-300/90' : 'text-zinc-400'}>
                          {status.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Tasti Azione */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {activeGame && activeGame.id && handleInviteToActiveGame && (
                      tablePlayers.some(p => (friend.uid && p.uid === friend.uid) || (friend.email && p.email?.toLowerCase() === friend.email?.toLowerCase())) ? (
                        <span className="px-2 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 font-bold text-[10px] border border-emerald-400/40">
                          Al Tavolo 🟢
                        </span>
                      ) : invitedFriendUids[friend.uid || friend.email] ? (
                        <span className="px-2 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 font-bold text-[10px] border border-emerald-400/40 flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>Invitato!</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={invitingFriendUids[friend.uid || friend.email]}
                          onClick={() => handleInviteToActiveGame(friend)}
                          className="px-2.5 py-1 rounded-xl gold-gradient text-emerald-950 font-black text-[10px] shadow-sm hover:brightness-110 active:scale-95 transition-all cursor-pointer flex items-center gap-1"
                          title="Invita al tavolo attivo di oggi"
                        >
                          <span>🎯</span>
                          <span>{invitingFriendUids[friend.uid || friend.email] ? 'Invio...' : 'Invita al Tavolo'}</span>
                        </button>
                      )
                    )}

                    <button
                      type="button"
                      onClick={() => handleChallenge(friend)}
                      className="px-2 py-1 rounded-xl bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200 border border-emerald-700/60 font-bold text-[10px] transition-all cursor-pointer"
                      title="Avvia una nuova partita con questo amico"
                    >
                      Sfida
                    </button>

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
                        className="p-1 rounded-lg text-emerald-400/60 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                        title="Rimuovi amico"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* AGGIUNGI AMICO TRAMITE EMAIL */}
      <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800/60 space-y-2.5">
        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300 uppercase tracking-wider">
          <UserPlus className="w-3.5 h-3.5 text-amber-400" />
          <span>Aggiungi Nuovo Amico</span>
        </div>

        <form onSubmit={handleFormSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-emerald-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={friendSearchInput}
              onChange={(e) => setFriendSearchInput(e.target.value)}
              placeholder="Digita email o nome compagno..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-emerald-900/60 border border-emerald-700/50 text-white placeholder-emerald-400/50 text-xs focus:outline-hidden focus:border-amber-400 transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={isSendingFriend || !friendSearchInput.trim()}
            className="px-3.5 py-2 rounded-xl gold-gradient text-emerald-950 font-bold text-xs shadow-md hover:brightness-110 active:scale-95 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shrink-0"
          >
            <Send className="w-3.5 h-3.5 text-emerald-950" />
            <span>{isSendingFriend ? 'Invio...' : 'Invia'}</span>
          </button>
        </form>

        {filteredSuggestions.length > 0 && (
          <div className="space-y-1 pt-1 border-t border-emerald-800/40">
            <span className="text-[10px] text-emerald-400/80 font-bold uppercase tracking-wider">
              Membri Club suggeriti:
            </span>
            {filteredSuggestions.map(sug => (
              <div
                key={sug.uid || sug.email}
                onClick={() => handleSendFriend(sug)}
                className="p-2 rounded-lg bg-emerald-950/60 hover:bg-emerald-800/80 flex items-center justify-between cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {sug.photoURL ? (
                    <img src={sug.photoURL} alt="" className="w-6 h-6 rounded-full border border-amber-400 object-cover shrink-0" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-emerald-800 text-amber-300 font-bold text-[10px] flex items-center justify-center shrink-0">
                      {(sug.displayName || 'U').slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-white truncate">{sug.displayName}</span>
                      {isDeveloperAccount(sug) && <DeveloperBadge size="xs" />}
                    </div>
                    <span className="text-[10px] text-emerald-300/70 truncate block">{sug.email}</span>
                  </div>
                </div>
                <span className="text-xs font-bold text-amber-300 shrink-0">➕ Invia Richiesta</span>
              </div>
            ))}
          </div>
        )}

        {friendFeedback && (
          <div className={`p-2 rounded-lg text-xs font-medium ${
            friendFeedback.type === 'success'
              ? 'bg-emerald-900/80 text-emerald-200 border border-emerald-600/60'
              : 'bg-rose-950/80 text-rose-200 border border-rose-700/60'
          }`}>
            {friendFeedback.text}
          </div>
        )}
      </div>

    </div>
  );
}