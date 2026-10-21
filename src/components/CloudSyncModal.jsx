import React, { useState } from 'react';
import { X, QrCode, Copy, Check, Users, UserPlus, MessageCircle, Share2, Loader2 } from 'lucide-react';
import DeveloperBadge from './DeveloperBadge';
import { isDeveloperAccount } from '../utils/developer';
import { findGameByPinOrId } from '../services/firebase';

export default function CloudSyncModal({
  isOpen,
  onClose,
  activeGame,
  _cloudStatus, // 'connected' | 'offline' | 'pending'
  currentUser = null,
  tablePlayers = [],
  friendsList = [],
  onSendFriendRequest,
  onInviteFriendToGame
}) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPin, setCopiedPin] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [sendingFriendUids, setSendingFriendUids] = useState({});
  const [sentFriendUids, setSentFriendUids] = useState({});
  const [invitingFriendUids, setInvitingFriendUids] = useState({});
  const [invitedFriendUids, setInvitedFriendUids] = useState({});
  const [joinInput, setJoinInput] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState('');

  if (!isOpen) return null;

  const currentUrl = window.location.origin + (activeGame?.id ? `?game=${activeGame.id}` : '');
  const rawDigits = (activeGame?.id || '').replace(/\D/g, '');
  const shortPin = rawDigits.length >= 6 ? rawDigits.slice(-6) : (activeGame?.id || '').slice(-6).toUpperCase();
  const formattedPin = shortPin.length === 6 ? `${shortPin.slice(0, 3)} • ${shortPin.slice(3)}` : shortPin;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyPin = () => {
    navigator.clipboard.writeText(activeGame?.id || shortPin);
    setCopiedPin(true);
    setTimeout(() => setCopiedPin(false), 2500);
  };

  const handleShareWhatsApp = () => {
    const teamsStr = activeGame?.team1?.name && activeGame?.team2?.name 
      ? ` (${activeGame.team1.name} vs ${activeGame.team2.name})` 
      : '';
    const text = encodeURIComponent(
      `🃏 *Burraco Score Live*\n` +
      `Unisciti al nostro tavolo${teamsStr} per seguire i punteggi e le mani in tempo reale!\n\n` +
      `👉 Clicca qui per entrare: ${currentUrl}\n` +
      (shortPin ? `🔢 PIN Tavolo: ${formattedPin}` : '')
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
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
            <div className="w-9 h-9 rounded-xl gold-gradient flex items-center justify-center text-emerald-950 font-black shadow-md shrink-0">
              <Share2 className="w-5 h-5 text-emerald-950 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base sm:text-xl font-bold text-white m-0">
                Invita al Tavolo & Condividi
              </h2>
              <p className="text-[11px] sm:text-xs text-emerald-300/80 m-0">
                Collega amici e compagni per seguire i punti dal vivo
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-800/50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="my-3.5 space-y-3 text-xs sm:text-sm">
          
          {/* Card Condividi Tavolo Attivo con PIN & WhatsApp */}
          {activeGame && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-b from-emerald-950 via-emerald-900/60 to-zinc-950 border border-amber-400/50 space-y-3 shadow-lg">
              
              {/* Box PIN Tavolo Elegante */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-950/90 border border-emerald-700/60 shadow-inner">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="text-[10px] sm:text-[11px] text-emerald-300 font-bold uppercase tracking-wider">
                      PIN Tavolo Live
                    </span>
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-amber-300 font-mono tracking-widest mt-0.5">
                    {formattedPin}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleCopyPin}
                    className="px-2.5 py-1.5 rounded-lg bg-emerald-900/90 hover:bg-emerald-800 text-amber-300 border border-emerald-600/50 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-sm"
                    title="Copia codice partita"
                  >
                    {copiedPin ? <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedPin ? 'Copiato!' : 'Copia PIN'}</span>
                  </button>
                </div>
              </div>

              {/* Pulsante Invia su WhatsApp Rapido */}
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-500 hover:from-emerald-500 hover:to-green-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-950/60 cursor-pointer transition-all active:scale-98"
              >
                <MessageCircle className="w-4 h-4 text-white fill-white" />
                <span>Invia Invito su WhatsApp</span>
              </button>

              {/* Azioni Secondarie: QR Code & Copia Link Diretto */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setShowQr(prev => !prev)}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                    showQr 
                      ? 'bg-amber-400 text-emerald-950 border-amber-300 font-black shadow-md' 
                      : 'bg-emerald-900/70 text-emerald-200 border-emerald-700/60 hover:text-white hover:bg-emerald-800/70'
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  <span>{showQr ? 'Nascondi QR' : 'Inquadra QR Code'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="py-2 px-2.5 rounded-xl bg-emerald-900/70 hover:bg-emerald-800/70 text-emerald-200 hover:text-white border border-emerald-700/60 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-xs"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Link Copiato!' : 'Copia Link Web'}</span>
                </button>
              </div>

              {/* Visualizzatore QR Code se espanso */}
              {showQr && (
                <div className="p-4 rounded-2xl bg-white flex flex-col items-center justify-center text-center shadow-xl border-2 border-amber-400 animate-in fade-in zoom-in-95 duration-200">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(currentUrl)}`} 
                    alt="QR Code Tavolo" 
                    className="w-40 h-40 sm:w-48 sm:h-48 rounded-lg"
                  />
                  <p className="text-zinc-900 font-bold text-xs mt-2.5">
                    Fai inquadrare con la fotocamera per collegarsi al volo!
                  </p>
                  <span className="text-[11px] font-mono font-bold text-emerald-800 mt-0.5">
                    PIN: {formattedPin}
                  </span>
                </div>
              )}

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
                        {isDeveloperAccount(player, currentUser) && <DeveloperBadge size="xs" />}
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
                            <div className="font-bold text-white truncate flex items-center gap-1.5 flex-wrap">
                              <span>{friend.displayName || 'Amico'}</span>
                              {isDeveloperAccount(friend, currentUser) && <DeveloperBadge size="xs" />}
                            </div>
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
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const val = joinInput.trim();
                if (!val) return;
                setIsJoining(true);
                setJoinError('');
                try {
                  const found = await findGameByPinOrId(val);
                  const targetId = found?.id || (val.includes('game=') ? val.split('game=')[1].split('&')[0] : val);
                  window.location.href = window.location.origin + '?game=' + targetId;
                } catch (err) {
                  setJoinError('Impossibile trovare la partita. Controlla il PIN o link.');
                  setIsJoining(false);
                }
              }}
              className="space-y-1.5"
            >
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Inserisci PIN a 6 cifre o link..."
                  value={joinInput}
                  onChange={(e) => {
                    setJoinInput(e.target.value);
                    if (joinError) setJoinError('');
                  }}
                  disabled={isJoining}
                  className="flex-1 px-3 py-2 rounded-lg bg-emerald-900/60 border border-emerald-700/60 text-white text-xs placeholder:text-emerald-500 focus:outline-none focus:border-amber-400 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={isJoining || !joinInput.trim()}
                  className="px-3.5 py-2 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-amber-300 border border-emerald-600/50 font-bold text-xs cursor-pointer transition-colors shrink-0 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isJoining && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isJoining ? 'Cerco...' : 'Collegati'}</span>
                </button>
              </div>
              {joinError && (
                <div className="text-[11px] text-rose-300 font-semibold">{joinError}</div>
              )}
            </form>
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
