import React, { useMemo, useState } from 'react';
import { UserPlus, Check, LogOut, ChevronDown, ChevronUp } from 'lucide-react';
import { sound } from '../../utils/soundEffects';
import DeveloperBadge from '../DeveloperBadge';
import { isDeveloperAccount } from '../../utils/developer';

export default function TablePlayersBar({
  activeGame,
  tablePlayers = [],
  currentUser = null,
  friendsList = [],
  isCloudJoined = false,
  onShareGame,
  onLeaveCloudTable,
  onSendFriendRequest,
  onOpenLogin,
}) {
  const [sendingFriendUids, setSendingFriendUids] = useState({});
  const [sentFriendUids, setSentFriendUids] = useState({});
  const [friendErrors, setFriendErrors] = useState({});
  const [isTablePlayersCollapsed, setIsTablePlayersCollapsed] = useState(true);

  const displayTablePlayers = useMemo(() => {
    const list = [];
    const seenUids = new Set();
    const seenEmails = new Set();

    if (currentUser) {
      list.push({
        uid: currentUser.uid,
        displayName: currentUser.displayName || 'Tu',
        email: (currentUser.email || '').toLowerCase(),
        photoURL: currentUser.photoURL,
        isMe: true
      });
      if (currentUser.uid) seenUids.add(currentUser.uid);
      if (currentUser.email) seenEmails.add(currentUser.email.toLowerCase());
    }

    if (Array.isArray(tablePlayers)) {
      tablePlayers.forEach(p => {
        const pEmail = (p.email || '').toLowerCase();
        if (p.uid && seenUids.has(p.uid)) return;
        if (pEmail && seenEmails.has(pEmail)) return;
        const isMe = currentUser && (p.uid === currentUser.uid || (pEmail && pEmail === currentUser.email?.toLowerCase()));
        list.push({
          uid: p.uid,
          displayName: p.displayName || p.email || 'Giocatore',
          email: pEmail,
          photoURL: p.photoURL,
          isMe
        });
        if (p.uid) seenUids.add(p.uid);
        if (pEmail) seenEmails.add(pEmail);
      });
    }

    if (activeGame?.ownerEmail && !seenEmails.has(activeGame.ownerEmail.toLowerCase())) {
      list.push({
        uid: activeGame.ownerUid,
        displayName: activeGame.ownerName || activeGame.ownerEmail,
        email: activeGame.ownerEmail.toLowerCase(),
        photoURL: null,
        isMe: currentUser && activeGame.ownerEmail.toLowerCase() === currentUser.email?.toLowerCase()
      });
    }

    return list;
  }, [tablePlayers, currentUser, activeGame]);

  const handleRequestFriendship = async (targetPlayer) => {
    if (!targetPlayer?.email && !targetPlayer?.uid) return;
    if (!currentUser) {
      if (onOpenLogin) onOpenLogin();
      return;
    }
    const key = targetPlayer.uid || targetPlayer.email;
    setSendingFriendUids(prev => ({ ...prev, [key]: true }));
    try {
      if (onSendFriendRequest) {
        await onSendFriendRequest(targetPlayer);
      }
      setSentFriendUids(prev => ({ ...prev, [key]: true }));
      sound.playTrophy();
    } catch (err) {
      setFriendErrors(prev => ({ ...prev, [key]: err.message || 'Errore invio' }));
      setTimeout(() => {
        setFriendErrors(prev => {
          const c = { ...prev };
          delete c[key];
          return c;
        });
      }, 4000);
    } finally {
      setSendingFriendUids(prev => ({ ...prev, [key]: false }));
    }
  };

  if (!activeGame?.id || (displayTablePlayers.length === 0 && !isCloudJoined)) {
    return null;
  }

  const rawDigits = (activeGame?.id || '').replace(/\D/g, '');
  const shortPin = rawDigits.length >= 6 ? rawDigits.slice(-6) : (activeGame?.id || '').slice(-6).toUpperCase();

  return (
    <div className="p-3 sm:p-3.5 rounded-2xl club-card min-w-0 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 min-w-0">
        {/* Informazioni Tavolo & PIN */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <button
            type="button"
            onClick={() => setIsTablePlayersCollapsed(prev => !prev)}
            className="flex items-center gap-2 min-w-0 text-left cursor-pointer py-1"
            title={isTablePlayersCollapsed ? 'Mostra giocatori collegati' : 'Nascondi giocatori collegati'}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
            <span className="text-xs sm:text-sm font-bold club-text-primary truncate">
              Partecipanti ({displayTablePlayers.length})
            </span>
            {isTablePlayersCollapsed ? (
              <ChevronDown className="w-4 h-4 club-text-muted shrink-0" />
            ) : (
              <ChevronUp className="w-4 h-4 club-text-muted shrink-0" />
            )}
          </button>
        </div>

        {/* Azioni Tavolo (PIN / Invita / Scollegati) */}
        <div className="flex items-center gap-1.5 shrink-0">
          {shortPin && onShareGame && (
            <button
              type="button"
              onClick={onShareGame}
              className="min-h-[38px] px-3 py-1.5 rounded-xl club-btn-secondary text-xs font-mono-num font-bold club-text-gold flex items-center gap-1.5 cursor-pointer active:scale-95"
              title="Mostra PIN e QR Code del tavolo"
            >
              <span>PIN {shortPin}</span>
            </button>
          )}

          {onShareGame && (
            <button
              type="button"
              onClick={onShareGame}
              className="min-h-[38px] px-3 py-1.5 rounded-xl gold-gradient text-xs font-bold flex items-center gap-1.5 cursor-pointer active:scale-95"
              title="Invita amici al tavolo"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Invita</span>
            </button>
          )}

          {isCloudJoined && onLeaveCloudTable && (
            <button
              type="button"
              onClick={onLeaveCloudTable}
              className="min-h-[38px] px-2.5 py-1.5 rounded-xl club-danger-inset hover:bg-rose-500/20 club-danger-text border font-semibold text-xs active:scale-95 transition-all cursor-pointer flex items-center gap-1"
              title="Esci dal tavolo sincronizzato online"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Esci</span>
            </button>
          )}
        </div>
      </div>

      {/* Lista espansa giocatori */}
      {!isTablePlayersCollapsed && (
        <div className="mt-3 pt-3 border-t club-divider grid grid-cols-1 sm:grid-cols-2 gap-2">
          {displayTablePlayers.map((player, idx) => {
            const isMe = player.isMe;
            const isFriend = !isMe && friendsList.some(
              f => (f.uid && f.uid === player.uid) || (f.email && player.email && f.email.toLowerCase() === player.email.toLowerCase())
            );
            const playerKey = player.uid || player.email || `p_${idx}`;
            const isSent = sentFriendUids[playerKey];
            const isSending = sendingFriendUids[playerKey];
            const err = friendErrors[playerKey];

            return (
              <div
                key={playerKey}
                className="min-w-0 p-2.5 rounded-xl club-inset flex items-center justify-between gap-2.5"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="relative shrink-0">
                    {player.photoURL ? (
                      <img
                        src={player.photoURL}
                        alt=""
                        className="w-8 h-8 rounded-full border border-amber-400/60 object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full gold-gradient font-bold text-xs flex items-center justify-center">
                        {(player.displayName || player.email || 'G').slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-black/60" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold club-text-primary truncate flex items-center gap-1.5">
                      <span className="truncate">{player.displayName || 'Giocatore'}</span>
                      {isDeveloperAccount(player, currentUser) && <DeveloperBadge size="xs" />}
                      {isMe && <span className="text-[11px] club-text-muted font-medium">(Tu)</span>}
                    </div>
                    {player.email && (
                      <div className="text-[11px] club-text-subtle truncate">{player.email}</div>
                    )}
                    {err && (
                      <div className="text-[11px] club-danger-text font-semibold truncate">{err}</div>
                    )}
                  </div>
                </div>

                <div className="shrink-0">
                  {isMe ? null : isFriend ? (
                    <span className="text-xs font-semibold club-text-gold">Amico ★</span>
                  ) : isSent ? (
                    <span className="text-xs font-semibold club-success-text flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      Inviata
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={isSending || (!player.email && !player.uid)}
                      onClick={() => handleRequestFriendship(player)}
                      className="min-h-[36px] px-2.5 py-1 rounded-lg gold-gradient font-bold text-xs flex items-center gap-1 cursor-pointer active:scale-95 disabled:opacity-45"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>{isSending ? '...' : 'Amico'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}