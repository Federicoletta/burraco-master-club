import React, { useState } from 'react';
import { X, Cloud, CloudCheck, ExternalLink, QrCode, Copy, Check, Smartphone, Users, UserPlus } from 'lucide-react';

export default function CloudSyncModal({
  isOpen,
  onClose,
  activeGame,
  cloudStatus, // 'connected' | 'offline' | 'pending'
  currentUser = null,
  tablePlayers = [],
  friendsList = [],
  onSendFriendRequest,
  onInviteFriendToGame
}) {
  const [copied, setCopied] = useState(false);
  const [sendingFriendUids, setSendingFriendUids] = useState({});
  const [sentFriendUids, setSentFriendUids] = useState({});
  const [invitingFriendUids, setInvitingFriendUids] = useState({});
  const [invitedFriendUids, setInvitedFriendUids] = useState({});

  if (!isOpen) return null;

  const currentUrl = window.location.origin + (activeGame?.id ? `?game=${activeGame.id}` : '');

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleInviteFriend = async (friend) => {
    if (!onInviteFriendToGame || !friend) return;
    const key = friend.uid || friend.email;
    setInvitingFriendUids(prev => ({ ...prev, [key]: true }));
    try {
      await onInviteFriendToGame(friend);
      setInvitedFriendUids(prev => ({ ...prev, [key]: true }));
    } catch (err) {
      console.warn('Errore invito amico al tavolo:', err);
    } finally {
      setInvitingFriendUids(prev => ({ ...prev, [key]: false }));
    }
  };

  const friendsNotAtTable = (friendsList || []).filter(f => {
    const fUid = f.uid;
    const fEmail = (f.email || '').toLowerCase();
    return !tablePlayers.some(p => (fUid && p.uid === fUid) || (fEmail && p.email?.toLowerCase() === fEmail));
  });

  const handleRequestFriendship = async (targetPlayer) => {
    if (!targetPlayer?.email || !onSendFriendRequest) return;
    const key = targetPlayer.uid || targetPlayer.email;
    setSendingFriendUids(prev => ({ ...prev, [key]: true }));
    try {
      await onSendFriendRequest(targetPlayer.email);
      setSentFriendUids(prev => ({ ...prev, [key]: true }));
    } catch (err) {
      console.warn('Errore richiesta:', err);
    } finally {
      setSendingFriendUids(prev => ({ ...prev, [key]: false }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg felt-card rounded-2xl border border-amber-500/40 p-4 sm:p-6 my-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Modal */}
        <div className="flex items-center justify-between pb-3 border-b border-emerald-700/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-emerald-950 font-black shadow-md">
              <Cloud className="w-5 h-5 text-emerald-950" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white m-0">Database Cloud Firestore</h2>
              <p className="text-xs text-emerald-300/80 m-0">Sincronizzazione in tempo reale tra tutti i telefoni</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-800/50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="my-4 space-y-4 text-xs sm:text-sm">
          
          {/* Box Stato Connessione */}
          <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-600/30 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
              <div>
                <span className="font-bold text-white block">Progetto Cloud Collegato:</span>
                <span className="text-emerald-300/80 text-xs font-mono">burraco-score-fedec</span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-900/90 text-emerald-200 border border-emerald-500/40">
              Pronto & Attivo
            </span>
          </div>

          {/* Condividi Tavolo con gli altri giocatori */}
          {activeGame && (
            <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-amber-500/30 space-y-2.5">
              <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <Smartphone className="w-4 h-4" />
                <span>Collega gli altri telefoni a questo tavolo</span>
              </span>
              <p className="text-xs text-emerald-300/90">
                Invia questo link ai tuoi amici al tavolo: tutti vedranno il tabellone aggiornarsi in tempo reale non appena inserisci una mano!
              </p>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={currentUrl}
                  className="flex-1 px-3 py-2 rounded-lg bg-emerald-900/80 border border-emerald-700/60 text-white font-mono text-xs focus:outline-none"
                />
                <button
                  onClick={handleCopyLink}
                  className="px-3 py-2 rounded-lg gold-gradient text-emerald-950 font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer hover:brightness-110 shrink-0"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-950" /> : <Copy className="w-3.5 h-3.5 text-emerald-950" />}
                  <span>{copied ? 'Copiato!' : 'Copia Link'}</span>
                </button>
              </div>

              <div className="text-[11px] text-emerald-400/80 pt-1 flex items-center justify-between">
                <span>Codice Tavolo: <strong className="text-amber-300 font-mono">{activeGame.id}</strong></span>
              </div>
            </div>
          )}

          {/* Giocatori Collegati al Tavolo & Amicizia al Volo */}
          {tablePlayers.length > 0 && (
            <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-600/40 space-y-2.5">
              <span className="text-xs font-bold text-emerald-200 uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-amber-400" />
                  <span>Giocatori al Tavolo ({tablePlayers.length})</span>
                </span>
                <span className="text-[10px] text-emerald-400 font-normal">Sincronizzazione Live</span>
              </span>

              <div className="space-y-1.5">
                {tablePlayers.map((player, idx) => {
                  const isMe = currentUser && (player.uid === currentUser.uid || player.email?.toLowerCase() === currentUser.email?.toLowerCase());
                  const isFriend = !isMe && friendsList.some(
                    f => (f.uid && f.uid === player.uid) || (f.email && player.email && f.email.toLowerCase() === player.email.toLowerCase())
                  );
                  const playerKey = player.uid || player.email || `p_${idx}`;
                  const isSent = sentFriendUids[playerKey];
                  const isSending = sendingFriendUids[playerKey];

                  return (
                    <div 
                      key={playerKey}
                      className="p-2 rounded-lg bg-emerald-900/40 border border-emerald-700/40 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {player.photoURL ? (
                          <img src={player.photoURL} alt="" className="w-6 h-6 rounded-full border border-amber-400 object-cover shrink-0" />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-amber-400 text-emerald-950 font-black text-[10px] flex items-center justify-center shrink-0">
                            {(player.displayName || player.email || 'G').slice(0, 1).toUpperCase()}
                          </div>
                        )}
                        <span className="text-white font-medium truncate">{player.displayName || player.email}</span>
                        {isMe && <span className="text-[10px] text-emerald-400 font-bold">(Tu)</span>}
                        {isFriend && <span className="text-[10px] text-amber-400">⭐ Amico</span>}
                      </div>

                      <div className="shrink-0">
                        {isMe ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-800 text-emerald-200">Host/Tu</span>
                        ) : isFriend ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                            Amico
                          </span>
                        ) : isSent ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                            ✓ Inviata
                          </span>
                        ) : player.email ? (
                          <button
                            type="button"
                            disabled={isSending}
                            onClick={() => handleRequestFriendship(player)}
                            className="px-2 py-0.5 rounded-lg gold-gradient text-emerald-950 font-black text-[10px] shadow hover:brightness-110 active:scale-95 cursor-pointer disabled:opacity-50 flex items-center gap-1"
                          >
                            <UserPlus className="w-3 h-3 text-emerald-950" />
                            <span>{isSending ? '...' : 'Chiedi Amicizia'}</span>
                          </button>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sezione: Invita i Tuoi Amici a questo Tavolo (per Valerio o qualsiasi compagno al tavolo) */}
          {activeGame && currentUser && (
            <div className="p-3.5 rounded-xl bg-gradient-to-br from-emerald-950 via-emerald-900/60 to-amber-950/30 border border-amber-500/40 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4 text-amber-400" />
                  <span>Invita i tuoi Amici a questo Tavolo</span>
                </span>
                <span className="text-[10px] text-emerald-300 font-semibold">
                  {friendsNotAtTable.length} disponibili
                </span>
              </div>
              <p className="text-[11px] text-emerald-300/80 m-0">
                Vuoi far entrare i tuoi amici nella partita? Premi "Invita al Tavolo" per inviare loro una notifica istantanea!
              </p>

              {friendsNotAtTable.length === 0 ? (
                <div className="p-3 rounded-lg bg-emerald-950/50 border border-emerald-800/40 text-center text-xs text-emerald-300/70">
                  {friendsList.length === 0 ? (
                    <span>Non hai ancora amici nella tua rubrica Google. Aggiungili dal tuo Profilo o condividi il link del tavolo.</span>
                  ) : (
                    <span>Tutti i tuoi amici registrati sono già presenti al tavolo! 🎉</span>
                  )}
                </div>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {friendsNotAtTable.map((friend) => {
                    const fKey = friend.uid || friend.email;
                    const isInvited = invitedFriendUids[fKey];
                    const isInviting = invitingFriendUids[fKey];

                    return (
                      <div
                        key={fKey}
                        className="p-2 rounded-xl bg-emerald-950/80 border border-emerald-700/50 flex items-center justify-between gap-2 text-xs hover:border-amber-400/40 transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {friend.photoURL ? (
                            <img src={friend.photoURL} alt="" className="w-7 h-7 rounded-full border border-amber-400 object-cover shrink-0" />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-amber-400 text-emerald-950 font-black text-xs flex items-center justify-center shrink-0">
                              {(friend.displayName || friend.email || 'A').slice(0, 1).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-white truncate">{friend.displayName || 'Amico'}</div>
                            <div className="text-[10px] text-emerald-300/70 truncate">{friend.email}</div>
                          </div>
                        </div>

                        <div className="shrink-0">
                          {isInvited ? (
                            <span className="px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 font-bold text-[10px] border border-emerald-500/40 flex items-center gap-1 shadow-sm">
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span>Invito Inviato!</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              disabled={isInviting}
                              onClick={() => handleInviteFriend(friend)}
                              className="px-3 py-1.5 rounded-xl gold-gradient text-emerald-950 font-black text-[11px] shadow-md hover:brightness-110 active:scale-95 transition-all cursor-pointer flex items-center gap-1 shrink-0 disabled:opacity-50"
                            >
                              <span>🎯</span>
                              <span>{isInviting ? 'Invio...' : 'Invita al Tavolo'}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Unisciti a un altro Tavolo */}
          <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-700/40 space-y-2">
            <span className="text-xs font-bold text-emerald-200 uppercase tracking-wider block">
              Oppure unisciti al tavolo di un amico:
            </span>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Incolla link o codice tavolo..."
                id="joinTableInput"
                className="flex-1 px-3 py-2 rounded-lg bg-emerald-900/60 border border-emerald-700/60 text-white text-xs placeholder:text-emerald-500 focus:outline-none focus:border-amber-400"
              />
              <button
                type="button"
                onClick={() => {
                  const val = document.getElementById('joinTableInput')?.value?.trim();
                  if (!val) return;
                  let targetId = val;
                  if (targetId.includes('game=')) {
                    targetId = targetId.split('game=')[1].split('&')[0];
                  }
                  window.location.href = window.location.origin + '?game=' + targetId;
                }}
                className="px-3 py-2 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-amber-300 border border-emerald-600/50 font-bold text-xs cursor-pointer transition-colors shrink-0"
              >
                Collegati
              </button>
            </div>
          </div>

        </div>

        <div className="mt-4 pt-3 border-t border-emerald-700/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl gold-gradient text-emerald-950 font-bold text-xs shadow-md transition-all cursor-pointer hover:brightness-110"
          >
            Chiudi
          </button>
        </div>

      </div>
    </div>
  );
}
