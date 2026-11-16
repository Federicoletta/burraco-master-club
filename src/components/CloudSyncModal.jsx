import React, { useState, useEffect } from 'react';
import { X, QrCode, Copy, Check, Users, UserPlus, MessageCircle, Share2, Loader2 } from 'lucide-react';
import QRCode from 'qrcode';
import DeveloperBadge from './DeveloperBadge';
import { isDeveloperAccount } from '../utils/developer';
import { findGameByPinOrId } from '../services/firebase';
import { useModalEscape } from '../hooks/useModalEscape';

export default function CloudSyncModal({
  isOpen,
  onClose,
  activeGame,
  currentUser = null,
  tablePlayers = [],
  friendsList = [],
  onSendFriendRequest,
  onInviteFriendToGame,
  onJoinGame
}) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPin, setCopiedPin] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [sendingFriendUids, setSendingFriendUids] = useState({});
  const [sentFriendUids, setSentFriendUids] = useState({});
  const [invitingFriendUids, setInvitingFriendUids] = useState({});
  const [invitedFriendUids, setInvitedFriendUids] = useState({});
  const [joinInput, setJoinInput] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState('');

  useModalEscape(isOpen, onClose);

  const currentUrl = typeof window !== 'undefined'
    ? window.location.origin + (activeGame?.id ? `?game=${activeGame.id}` : '')
    : '';

  useEffect(() => {
    if (!isOpen || !showQr || !currentUrl) return undefined;
    let active = true;
    QRCode.toDataURL(currentUrl, { width: 220, margin: 2 })
      .then((dataUrl) => {
        if (active) setQrDataUrl(dataUrl);
      })
      .catch(() => {
        if (active) setQrDataUrl('');
      });
    return () => {
      active = false;
    };
  }, [isOpen, showQr, currentUrl]);

  if (!isOpen) return null;

  const rawDigits = (activeGame?.id || '').replace(/\D/g, '');
  const shortPin = rawDigits.length >= 6 ? rawDigits.slice(-6) : (activeGame?.id || '').slice(-6).toUpperCase();
  const formattedPin = shortPin.length === 6 ? `${shortPin.slice(0, 3)} · ${shortPin.slice(3)}` : shortPin;

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

  const teamsStr = activeGame?.team1?.name && activeGame?.team2?.name
    ? ` (${activeGame.team1.name} vs ${activeGame.team2.name})`
    : '';
  const whatsappText = encodeURIComponent(
    `🃏 *Burraco Score Live*\n` +
    `Unisciti al nostro tavolo${teamsStr} per seguire i punteggi e le mani in tempo reale!\n\n` +
    `👉 Clicca qui per entrare: ${currentUrl}\n` +
    (shortPin ? `🔢 PIN Tavolo: ${formattedPin}` : '')
  );
  const whatsappHref = `https://api.whatsapp.com/send?text=${whatsappText}`;

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
    if ((!targetPlayer?.email && !targetPlayer?.uid) || !onSendFriendRequest) return;
    const key = targetPlayer.uid || targetPlayer.email;
    setSendingFriendUids(prev => ({ ...prev, [key]: true }));
    try {
      await onSendFriendRequest(targetPlayer);
      setSentFriendUids(prev => ({ ...prev, [key]: true }));
    } catch (err) {
      console.warn('Errore richiesta:', err);
    } finally {
      setSendingFriendUids(prev => ({ ...prev, [key]: false }));
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-md overflow-hidden"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Invita al tavolo e condividi"
    >
      <div
        className="relative w-full max-w-lg club-card-solid rounded-t-3xl sm:rounded-3xl max-h-[92dvh] flex flex-col overflow-hidden club-sheet-enter"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sm:hidden flex justify-center pt-2.5 pb-1 shrink-0">
          <span className="w-10 h-1 rounded-full bg-white/25" />
        </div>

        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b club-divider flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl gold-gradient flex items-center justify-center shrink-0">
              <Share2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="font-display text-lg sm:text-xl font-bold text-white m-0 truncate">
                Invita al Tavolo
              </h2>
              <p className="text-xs club-text-subtle m-0 truncate">
                Collega amici per seguire i punti live
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-11 h-11 rounded-xl club-btn-secondary flex items-center justify-center cursor-pointer shrink-0"
            aria-label="Chiudi condivisione"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto flex-1 min-h-0 space-y-4">
          {activeGame && (
            <div className="p-4 rounded-2xl club-inset border border-[var(--accent-gold)]/45 space-y-3">
              {/* PIN Tavolo */}
              <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-black/30 border club-divider">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-[11px] club-text-muted font-bold uppercase tracking-wider">
                      PIN Tavolo Live
                    </span>
                  </div>
                  <div className="font-mono-num text-2xl font-bold club-text-gold tracking-widest mt-0.5">
                    {formattedPin}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCopyPin}
                  className="min-h-[42px] px-3.5 rounded-xl club-btn-secondary club-text-gold font-bold text-xs flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
                >
                  {copiedPin ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedPin ? 'Copiato' : 'Copia PIN'}</span>
                </button>
              </div>

              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full min-h-[46px] px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 no-underline"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                <span>Invia su WhatsApp</span>
              </a>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setShowQr(prev => !prev)}
                  className={`min-h-[42px] px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                    showQr ? 'gold-gradient border-[var(--accent-gold)]' : 'club-btn-secondary'
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  <span>{showQr ? 'Nascondi QR' : 'Mostra QR'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="min-h-[42px] px-3 rounded-xl club-btn-secondary text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                >
                  {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedLink ? 'Link Copiato' : 'Copia Link'}</span>
                </button>
              </div>

              {showQr && (
                <div className="p-4 rounded-2xl bg-white flex flex-col items-center justify-center text-center border-2 border-[var(--accent-gold)]">
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt="QR Code Tavolo"
                      className="w-44 h-44 rounded-lg"
                    />
                  ) : (
                    <div className="w-44 h-44 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-500 text-xs font-semibold">
                      Generazione QR...
                    </div>
                  )}
                  <p className="text-zinc-900 font-bold text-xs mt-2.5 mb-0">
                    Inquadra per collegarti al tavolo
                  </p>
                  <span className="font-mono-num text-xs font-bold text-emerald-800 mt-0.5">
                    PIN: {formattedPin}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Giocatori al Tavolo */}
          {tablePlayers.length > 0 && (
            <div className="p-3.5 rounded-2xl club-inset border club-divider space-y-2.5">
              <div className="text-xs font-bold club-text-muted uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 club-text-gold" />
                  <span>Al Tavolo ({tablePlayers.length})</span>
                </span>
                <span className="text-[11px] text-emerald-300 font-semibold">Live</span>
              </div>

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
                      className="p-2.5 rounded-xl bg-black/20 border club-divider flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {player.photoURL ? (
                          <img src={player.photoURL} alt="" className="w-7 h-7 rounded-full border border-[var(--accent-gold)] object-cover shrink-0" />
                        ) : (
                          <div className="w-7 h-7 rounded-full gold-gradient font-bold text-xs flex items-center justify-center shrink-0">
                            {(player.displayName || player.email || 'G').slice(0, 1).toUpperCase()}
                          </div>
                        )}
                        <span className="text-white font-semibold truncate">{player.displayName || player.email}</span>
                        {isDeveloperAccount(player, currentUser) && <DeveloperBadge size="xs" />}
                      </div>

                      <div className="shrink-0">
                        {isMe ? (
                          <span className="text-[11px] club-text-subtle font-semibold">Tu</span>
                        ) : isFriend ? (
                          <span className="text-[11px] font-bold club-text-gold">★ Amico</span>
                        ) : isSent ? (
                          <span className="text-[11px] font-bold text-emerald-300">✓ Inviata</span>
                        ) : (player.email || player.uid) ? (
                          <button
                            type="button"
                            disabled={isSending}
                            onClick={() => handleRequestFriendship(player)}
                            className="min-h-[34px] px-2.5 rounded-lg gold-gradient font-bold text-[11px] active:scale-95 cursor-pointer disabled:opacity-50 flex items-center gap-1"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>{isSending ? '...' : 'Amicizia'}</span>
                          </button>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Invita Amici */}
          {activeGame && currentUser && (
            <div className="p-3.5 rounded-2xl club-inset border club-border space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold club-text-gold uppercase tracking-wider flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4" />
                  <span>Invita Amici ({friendsNotAtTable.length})</span>
                </span>
              </div>

              {friendsNotAtTable.length === 0 ? (
                <div className="p-3 rounded-xl bg-black/20 border club-divider text-center text-xs club-text-subtle">
                  {friendsList.length === 0
                    ? 'Aggiungi amici dal tuo Profilo o condividi il PIN sopra.'
                    : 'Tutti i tuoi amici sono già collegati al tavolo.'}
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {friendsNotAtTable.map((friend) => {
                    const fKey = friend.uid || friend.email;
                    const isInvited = invitedFriendUids[fKey];
                    const isInviting = invitingFriendUids[fKey];

                    return (
                      <div
                        key={fKey}
                        className="p-2.5 rounded-xl bg-black/20 border club-divider flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {friend.photoURL ? (
                            <img src={friend.photoURL} alt="" className="w-8 h-8 rounded-full border border-[var(--accent-gold)] object-cover shrink-0" />
                          ) : (
                            <div className="w-8 h-8 rounded-full gold-gradient font-bold text-xs flex items-center justify-center shrink-0">
                              {(friend.displayName || friend.email || 'A').slice(0, 1).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-white truncate flex items-center gap-1.5 flex-wrap">
                              <span>{friend.displayName || 'Amico'}</span>
                              {isDeveloperAccount(friend, currentUser) && <DeveloperBadge size="xs" />}
                            </div>
                            <div className="text-[11px] club-text-subtle truncate">{friend.email}</div>
                          </div>
                        </div>

                        <div className="shrink-0">
                          {isInvited ? (
                            <span className="min-h-[36px] px-3 rounded-xl bg-emerald-500/15 text-emerald-300 font-bold text-xs border border-emerald-400/35 inline-flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" />
                              <span>Invitato</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              disabled={isInviting}
                              onClick={() => handleInviteFriend(friend)}
                              className="min-h-[38px] px-3 rounded-xl gold-gradient font-bold text-xs active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                            >
                              {isInviting ? 'Invio...' : 'Invita'}
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

          {/* Unisciti con PIN */}
          <div className="p-3.5 rounded-2xl club-inset border club-divider space-y-2.5">
            <span className="text-xs font-bold club-text-muted uppercase tracking-wider block">
              Oppure entra in un altro tavolo
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
                  const extractedId = found?.id || (val.includes('game=') ? val.split('game=')[1].split('&')[0] : null);
                  if (!found && !extractedId) {
                    setJoinError('Partita non trovata. Controlla il PIN o link inserito.');
                    setIsJoining(false);
                    return;
                  }
                  if (typeof onJoinGame === 'function') {
                    await onJoinGame(found || extractedId);
                  } else {
                    const url = new URL(window.location.href);
                    url.searchParams.set('game', extractedId);
                    window.history.replaceState({}, '', url.toString());
                    onClose();
                  }
                } catch {
                  setJoinError('Impossibile trovare la partita. Controlla il PIN o link.');
                } finally {
                  setIsJoining(false);
                }
              }}
              className="space-y-1.5"
            >
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="PIN a 6 cifre o link..."
                  value={joinInput}
                  onChange={(e) => {
                    setJoinInput(e.target.value);
                    if (joinError) setJoinError('');
                  }}
                  disabled={isJoining}
                  className="flex-1 min-h-[44px] px-3.5 rounded-xl club-input text-sm disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={isJoining || !joinInput.trim()}
                  className="min-h-[44px] px-4 rounded-xl club-btn-secondary club-text-gold font-bold text-xs cursor-pointer shrink-0 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isJoining && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{isJoining ? 'Cerco...' : 'Entra'}</span>
                </button>
              </div>
              {joinError && (
                <div className="text-xs text-rose-300 font-semibold">{joinError}</div>
              )}
            </form>
          </div>
        </div>

        <div className="px-4 sm:px-6 py-3.5 border-t club-divider flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[42px] px-5 rounded-xl gold-gradient font-bold text-xs cursor-pointer active:scale-95"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
}
