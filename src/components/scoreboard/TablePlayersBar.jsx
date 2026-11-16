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
  const [isTablePlayersCollapsed, setIsTablePlayersCollapsed] = useState(false);

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

  const isTrio = activeGame.mode === 'trio';
  const rawDigits = (activeGame?.id || '').replace(/\D/g, '');
  const shortPin = rawDigits.length >= 6 ? rawDigits.slice(-6) : (activeGame?.id || '').slice(-6).toUpperCase();

  return (
    <div className="p-2.5 sm:p-3.5 rounded-2xl felt-card shadow-lg min-w-0 overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5 pb-2 mb-2 border-b border-white/10 min-w-0">
        <div className="flex items-start gap-2 min-w-0 flex-1">
          <span className="relative flex h-2.5 w-2.5 shrink-0 mt-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 shadow-sm"></span>
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5 min-w-0">
              <h3 className="text-xs sm:text-sm font-black text-white m-0 flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 uppercase tracking-wider min-w-0 max-w-full">
                <span className="shrink-0">Tavolo:</span>
                <span
                  className="text-amber-300 normal-case font-bold min-w-0 break-words"
                  title={`${activeGame.team1?.name || 'Squadra 1'} vs ${activeGame.team2?.name || 'Squadra 2'}${isTrio && activeGame.team3?.name ? ` vs ${activeGame.team3.name}` : ''}`}
                >
                  {activeGame.team1?.name || 'Squadra 1'} vs {activeGame.team2?.name || 'Squadra 2'}
                  {isTrio && activeGame.team3?.name ? ` vs ${activeGame.team3.name}` : ''}
                </span>
              </h3>
              {shortPin && onShareGame && (
                <button
                  type="button"
                  onClick={onShareGame}
                  className="px-2 py-0.5 rounded-md bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 border border-amber-400/40 text-[10px] font-mono font-black cursor-pointer transition-all flex items-center gap-1 shadow-xs shrink-0 whitespace-nowrap"
                  title="PIN rapido per unirsi al tavolo (clicca per QR Code)"
                >
                  <span className="text-white/60">PIN:</span>
                  <strong className="tracking-wider text-amber-200">{shortPin}</strong>
                </button>
              )}
              {activeGame?.ledgerChain && activeGame.ledgerChain.length > 0 && (
                <span
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 shrink-0 whitespace-nowrap"
                  title={`Tavolo Distribuito CRDT: ${activeGame.ledgerChain.length} blocchi certificati`}
                >
                  <span>⛓️ #{activeGame.ledgerChain.length}</span>
                </span>
              )}
              {isCloudJoined && (
                <span className="px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 shrink-0 whitespace-nowrap">
                  Collegato
                </span>
              )}
              {displayTablePlayers.length > 0 && (
                <span className="text-emerald-400 font-mono text-[10px] sm:text-[11px] font-bold shrink-0 whitespace-nowrap">
                  ({displayTablePlayers.length} {displayTablePlayers.length === 1 ? 'collegato' : 'collegati'})
                </span>
              )}
            </div>
            {!isTablePlayersCollapsed && (
              <p className="text-[10px] sm:text-[11px] text-emerald-300/80 m-0 mt-0.5 hidden xs:block">
                {displayTablePlayers.length > 1
                  ? "Puoi chiedere l'amicizia al volo ai compagni con cui stai giocando!"
                  : "Invita i tuoi amici al tavolo condividendo il codice partita!"}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs self-start sm:self-auto shrink-0 flex-wrap">
          {onShareGame && (
            <button
              type="button"
              onClick={onShareGame}
              className="px-2.5 sm:px-3 py-1.5 rounded-lg gold-gradient text-emerald-950 font-black text-xs hover:brightness-110 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
              title="Invita amici al tavolo, mostra PIN o QR Code"
            >
              <UserPlus className="w-3.5 h-3.5 text-emerald-950 stroke-[2.5]" />
              <span>Invita al Tavolo</span>
            </button>
          )}
          {isCloudJoined && onLeaveCloudTable && (
            <button
              type="button"
              onClick={onLeaveCloudTable}
              className="px-2 sm:px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-bold text-[10px] sm:text-[11px] hover:text-white active:scale-95 transition-all cursor-pointer flex items-center gap-1 shadow-sm"
              title="Esci dal tavolo sincronizzato online"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span>Scollegati</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsTablePlayersCollapsed(prev => !prev)}
            className="p-1 rounded-lg text-emerald-400 hover:text-white hover:bg-emerald-900/60 transition-colors cursor-pointer"
            title={isTablePlayersCollapsed ? "Espandi partecipanti al tavolo" : "Riduci partecipanti"}
          >
            {isTablePlayersCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Se ridotto: barra orizzontale compatta */}
      {isTablePlayersCollapsed ? (
        <div className="flex items-center justify-between gap-2 pt-0.5 text-xs text-emerald-300/90">
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 min-w-0">
            <span className="text-[10px] text-emerald-400 font-bold shrink-0">Giocatori:</span>
            {displayTablePlayers.map((p, i) => (
              <span key={i} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-900/60 border border-emerald-700/50 text-[10px] text-white shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="max-w-[70px] truncate">{p.displayName}</span>
              </span>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setIsTablePlayersCollapsed(false)}
            className="text-[10px] text-amber-300 font-bold hover:underline shrink-0"
          >
            Espandi ({displayTablePlayers.length})
          </button>
        </div>
      ) : (
        /* Griglia Giocatori al Tavolo - 2 Colonne compatte su Mobile */
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-1.5 sm:gap-2">
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
                className={`min-w-0 overflow-hidden p-1.5 sm:p-2.5 rounded-xl border flex items-center justify-between gap-1.5 sm:gap-2 transition-all ${
                  isMe
                    ? 'bg-white/10 border-amber-400/40'
                    : isFriend
                    ? 'bg-amber-950/30 border-amber-500/30'
                    : 'bg-black/30 border-white/10 hover:border-amber-400/50'
                }`}
              >
                {/* Avatar & Nome */}
                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
                  <div className="relative shrink-0">
                    {player.photoURL ? (
                      <img
                        src={player.photoURL}
                        alt=""
                        className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border border-amber-400/80 object-cover"
                      />
                    ) : (
                      <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-amber-400 text-emerald-950 font-black text-[10px] sm:text-xs flex items-center justify-center">
                        {(player.displayName || player.email || 'G').slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border border-emerald-950" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] sm:text-xs font-bold text-white truncate flex items-center gap-1 flex-wrap">
                      <span className="truncate">{player.displayName || 'Giocatore'}</span>
                      {isDeveloperAccount(player, currentUser) && <DeveloperBadge size="xs" />}
                      {isMe && <span className="text-[9px] text-emerald-400 font-semibold shrink-0">(Tu)</span>}
                      {isFriend && <span className="text-[9px] text-amber-400 shrink-0" title="Amico confermato">⭐</span>}
                    </div>
                    {/* Email solo su tablet/desktop per non occupare spazio verticale su iPhone */}
                    <div className="hidden sm:block text-[10px] text-emerald-300/70 truncate">
                      {player.email ? player.email : 'Al tavolo da gioco'}
                    </div>
                    {err && (
                      <div className="text-[9px] text-rose-300 font-bold truncate">{err}</div>
                    )}
                  </div>
                </div>

                {/* Azione: Badge o Tasto Chiedi Amicizia */}
                <div className="shrink-0">
                  {isMe ? (
                    <span className="px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-emerald-900/80 text-emerald-300 border border-emerald-600/50">
                      Tu
                    </span>
                  ) : isFriend ? (
                    <span className="px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black bg-amber-400/20 text-amber-300 border border-amber-400/40 flex items-center gap-0.5 sm:gap-1 shadow-sm">
                      <span>⭐</span>
                      <span className="hidden xs:inline">Amici</span>
                    </span>
                  ) : isSent ? (
                    <span className="px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/50 flex items-center gap-1 animate-in fade-in">
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="hidden xs:inline">Inviata!</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={isSending || (!player.email && !player.uid)}
                      onClick={() => handleRequestFriendship(player)}
                      className="px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-emerald-950 font-black text-[9px] sm:text-[11px] shadow-sm flex items-center gap-1 cursor-pointer active:scale-95 transition-all disabled:opacity-50"
                      title={(player.email || player.uid) ? `Chiedi l'amicizia a ${player.displayName || player.email}` : 'Giocatore ospite non registrato'}
                    >
                      <UserPlus className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-950" />
                      <span>{isSending ? '...' : '+ Amico'}</span>
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