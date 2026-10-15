import React, { useMemo, useState, useEffect } from 'react';
import { 
  PlusCircle, 
  Trophy, 
  Edit2, 
  Trash2, 
  Sun,
  LayoutList,
  Table,
  UserPlus,
  Check,
  Users
} from 'lucide-react';
import { getGamesHistory, calculatePlayerStats } from '../utils/storage';
import { getPlayerTitle } from '../utils/trophies';
import { wakeLock } from '../utils/wakeLock';
import { sound } from '../utils/soundEffects';

// Componente per renderizzare le pillole/chip degli eventi di gioco (Burrachi, Chiusura, Pozzetto)
function RoundEventChips({ details }) {
  if (!details) return null;
  const chips = [];

  if (details.chiusura) {
    chips.push(
      <span key="chiusura" className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400/20 text-amber-300 border border-amber-400/35 shadow-sm">
        <span>🌟</span> Chiusura
      </span>
    );
  }

  if (details.burracoPulito > 0) {
    chips.push(
      <span key="pulito" className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/35 shadow-sm">
        <span>💎</span> {details.burracoPulito} {details.burracoPulito === 1 ? 'Pulito' : 'Puliti'}
      </span>
    );
  }

  if (details.burracoSemipulito > 0) {
    chips.push(
      <span key="semipulito" className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-400/20 text-purple-300 border border-purple-400/35 shadow-sm">
        <span>🃏</span> {details.burracoSemipulito} {details.burracoSemipulito === 1 ? 'Semipulito' : 'Semipuliti'}
      </span>
    );
  }

  if (details.burracoSporco > 0) {
    chips.push(
      <span key="sporco" className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-700/60 text-slate-300 border border-slate-600/40 shadow-sm">
        <span>♠</span> {details.burracoSporco} {details.burracoSporco === 1 ? 'Sporco' : 'Sporchi'}
      </span>
    );
  }

  if (details.pozzetto === 'non_preso') {
    chips.push(
      <span key="nopozzetto" className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/35 shadow-sm">
        <span>⚠️</span> No Pozzetto
      </span>
    );
  } else if (details.pozzetto === 'preso_non_giocato') {
    chips.push(
      <span key="pozzettong" className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/35 shadow-sm">
        <span>⚠️</span> Pozzetto non giocato
      </span>
    );
  }

  if (chips.length === 0) return null;
  return <div className="flex flex-wrap gap-1.5 mt-1.5">{chips}</div>;
}

export default function ScoreBoard({
  activeGame,
  gamesHistory = [],
  currentUser = null,
  tablePlayers = [],
  friendsList = [],
  onSendFriendRequest,
  onOpenLogin,
  onAddRound,
  onEditRound,
  onDeleteLastRound,
  onEndGame,
  onShareGame: _onShareGame,
  onOpenRules: _onOpenRules,
  onOpenEditTeams,
}) {
  const [wakeLockState, setWakeLockState] = useState({
    enabled: wakeLock.enabled,
    active: wakeLock.active
  });

  const [sendingFriendUids, setSendingFriendUids] = useState({});
  const [sentFriendUids, setSentFriendUids] = useState({});
  const [friendErrors, setFriendErrors] = useState({});

  // Modalità di visualizzazione del foglio segnapunti ('cards' o 'table')
  const [viewMode, setViewMode] = useState(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return 'cards';
    }
    return 'table';
  });

  useEffect(() => {
    return wakeLock.subscribe((state) => {
      setWakeLockState({ ...state });
    });
  }, []);

  const handleRequestFriendship = async (targetPlayer) => {
    if (!targetPlayer?.email) return;
    if (!currentUser) {
      if (onOpenLogin) onOpenLogin();
      return;
    }
    const key = targetPlayer.uid || targetPlayer.email;
    setSendingFriendUids(prev => ({ ...prev, [key]: true }));
    try {
      if (onSendFriendRequest) {
        await onSendFriendRequest(targetPlayer.email);
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

  // Calcola titoli dei giocatori della partita
  const isTrio = activeGame?.mode === 'trio';

  const titlesMap = useMemo(() => {
    if (!activeGame) return {};
    const allPlayersInGame = [
      ...(activeGame.team1?.players || []),
      ...(activeGame.team2?.players || []),
      ...(activeGame.team3?.players || [])
    ].filter(Boolean);
    const history = gamesHistory.length > 0 ? gamesHistory : getGamesHistory();
    const stats = calculatePlayerStats(allPlayersInGame, history, activeGame);
    const map = {};
    stats.forEach(s => {
      map[s.name] = getPlayerTitle(s);
    });
    return map;
  }, [activeGame, gamesHistory]);

  // Calcola totali progressivi in modo immutabile
  const { roundsWithProgressive, totalTeam1, totalTeam2, totalTeam3 } = useMemo(() => {
    let runningT1 = 0;
    let runningT2 = 0;
    let runningT3 = 0;
    const list = (activeGame?.rounds || []).filter(Boolean).map((r) => {
      const s1 = Number(r.team1Score) || 0;
      const s2 = Number(r.team2Score) || 0;
      const s3 = Number(r.team3Score) || 0;
      runningT1 += s1;
      runningT2 += s2;
      runningT3 += s3;
      return {
        ...r,
        runningT1,
        runningT2,
        runningT3,
      };
    });
    return {
      roundsWithProgressive: list,
      totalTeam1: runningT1,
      totalTeam2: runningT2,
      totalTeam3: runningT3,
    };
  }, [activeGame?.rounds]);

  if (!activeGame) return null;

  const targetScore = activeGame.targetScore || 2505;

  let leader = 'tie';
  let diff = 0;

  if (isTrio) {
    if (totalTeam1 > totalTeam2 && totalTeam1 > totalTeam3) {
      leader = 'team1';
      diff = totalTeam1 - Math.max(totalTeam2, totalTeam3);
    } else if (totalTeam2 > totalTeam1 && totalTeam2 > totalTeam3) {
      leader = 'team2';
      diff = totalTeam2 - Math.max(totalTeam1, totalTeam3);
    } else if (totalTeam3 > totalTeam1 && totalTeam3 > totalTeam2) {
      leader = 'team3';
      diff = totalTeam3 - Math.max(totalTeam1, totalTeam2);
    } else {
      leader = 'tie';
      diff = 0;
    }
  } else {
    diff = totalTeam1 - totalTeam2;
    leader = diff > 0 ? 'team1' : diff < 0 ? 'team2' : 'tie';
  }

  const t1Percent = Math.min(100, Math.max(0, Math.round((totalTeam1 / targetScore) * 100)));
  const t2Percent = Math.min(100, Math.max(0, Math.round((totalTeam2 / targetScore) * 100)));
  const t3Percent = Math.min(100, Math.max(0, Math.round((totalTeam3 / targetScore) * 100)));

  const isTargetReached = totalTeam1 >= targetScore || totalTeam2 >= targetScore || (isTrio && totalTeam3 >= targetScore);

  const winningTeam = isTrio
    ? (totalTeam1 >= totalTeam2 && totalTeam1 >= totalTeam3 ? activeGame.team1 : totalTeam2 >= totalTeam1 && totalTeam2 >= totalTeam3 ? activeGame.team2 : activeGame.team3)
    : (totalTeam1 >= totalTeam2 ? activeGame.team1 : activeGame.team2);
  const winningScore = isTrio
    ? Math.max(totalTeam1, totalTeam2, totalTeam3)
    : Math.max(totalTeam1, totalTeam2);

  return (
    <div className="space-y-2.5 sm:space-y-3 pb-12">
      
      {/* AVVISO VITTORIA O TRAGUARDO RAGGIUNTO */}
      {isTargetReached && !activeGame.isFinished && (
        <div className="p-4 rounded-2xl bg-amber-500/20 border-2 border-amber-400 text-amber-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl animate-bounce-subtle">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <Trophy className="w-8 h-8 text-amber-400 shrink-0" />
            <div>
              <h3 className="text-base font-bold text-white m-0">
                Traguardo di {targetScore} punti raggiunto!
              </h3>
              <p className="text-xs text-amber-300/90 m-0">
                {winningTeam?.name} ha vinto la partita con {winningScore} punti!
              </p>
            </div>
          </div>
          <button
            onClick={onEndGame}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl gold-gradient text-emerald-950 font-black text-xs sm:text-sm shadow-md cursor-pointer hover:brightness-110 active:scale-95"
          >
            Festeggia & Termina Partita
          </button>
        </div>
      )}

      {/* WIDGET TAVOLO MULTIPLAYER LIVE & AMICIZIA AL VOLO */}
      {activeGame?.id && displayTablePlayers.length > 0 && (
        <div className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950 via-emerald-900/60 to-zinc-950 border border-emerald-600/50 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-emerald-800/50">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3 w-3 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 shadow-sm"></span>
              </span>
              <div>
                <h3 className="text-xs sm:text-sm font-black text-white m-0 flex items-center gap-1.5 uppercase tracking-wider">
                  <span>Al Tavolo Live</span>
                  <span className="text-emerald-400 font-mono text-[11px] normal-case font-bold">
                    ({displayTablePlayers.length} {displayTablePlayers.length === 1 ? 'giocatore collegato' : 'giocatori collegati'})
                  </span>
                </h3>
                <p className="text-[10px] sm:text-[11px] text-emerald-300/80 m-0">
                  {displayTablePlayers.length > 1
                    ? 'Puoi chiedere l\'amicizia al volo ai compagni con cui stai giocando!'
                    : 'Invita i tuoi amici al tavolo condividendo il link del gioco'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs self-start sm:self-auto shrink-0">
              <span className="text-[11px] text-emerald-300/70 font-medium">Tavolo:</span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-950 text-amber-300 font-mono font-bold text-xs border border-emerald-700/60">
                {activeGame.id}
              </span>
              {_onShareGame && (
                <button
                  type="button"
                  onClick={_onShareGame}
                  className="px-2.5 py-1 rounded-lg gold-gradient text-emerald-950 font-black text-[11px] hover:brightness-110 active:scale-95 transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                  title="Condividi link tavolo con altri amici"
                >
                  <Users className="w-3 h-3 text-emerald-950" />
                  <span>Invita</span>
                </button>
              )}
            </div>
          </div>

          {/* Griglia Giocatori al Tavolo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
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
                  className={`p-2.5 rounded-xl border flex items-center justify-between gap-2.5 transition-all ${
                    isMe
                      ? 'bg-emerald-900/40 border-emerald-500/40'
                      : isFriend
                      ? 'bg-amber-950/20 border-amber-500/30'
                      : 'bg-emerald-950/70 border-emerald-700/40 hover:border-amber-400/50'
                  }`}
                >
                  {/* Avatar & Nome */}
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="relative shrink-0">
                      {player.photoURL ? (
                        <img
                          src={player.photoURL}
                          alt=""
                          className="w-8 h-8 rounded-full border border-amber-400/80 object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-amber-400 text-emerald-950 font-black text-xs flex items-center justify-center">
                          {(player.displayName || player.email || 'G').slice(0, 1).toUpperCase()}
                        </div>
                      )}
                      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-emerald-950" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-white truncate flex items-center gap-1">
                        <span className="truncate">{player.displayName || 'Giocatore'}</span>
                        {isMe && <span className="text-[10px] text-emerald-400 font-semibold">(Tu)</span>}
                        {isFriend && <span className="text-[10px] text-amber-400" title="Amico confermato">⭐</span>}
                      </div>
                      <div className="text-[10px] text-emerald-300/70 truncate">
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
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-900/80 text-emerald-300 border border-emerald-600/50">
                        Tu
                      </span>
                    ) : isFriend ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400/20 text-amber-300 border border-amber-400/40 flex items-center gap-1 shadow-sm">
                        <span>⭐</span>
                        <span>Amici</span>
                      </span>
                    ) : isSent ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/50 flex items-center gap-1 animate-in fade-in">
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>Inviata!</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={isSending || !player.email}
                        onClick={() => handleRequestFriendship(player)}
                        className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-emerald-950 font-black text-[11px] shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all disabled:opacity-50"
                        title={player.email ? `Chiedi l'amicizia a ${player.displayName || player.email}` : 'Email non disponibile per questo partecipante'}
                      >
                        <UserPlus className="w-3.5 h-3.5 text-emerald-950" />
                        <span>{isSending ? 'Invio...' : 'Chiedi Amicizia'}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CARDS PUNTEGGIO SQUADRE (TABELLONE PRINCIPALE) */}
      <div className={`grid grid-cols-1 ${isTrio ? 'sm:grid-cols-3' : 'md:grid-cols-2'} gap-2.5 sm:gap-3.5`}>
        
        {/* CARD SQUADRA 1 (TEMA ORO / AMBRA) */}
        <div className={`relative p-3.5 sm:p-4 rounded-2xl border border-t-4 border-t-amber-400 transition-all duration-300 ${
          leader === 'team1' 
            ? 'bg-gradient-to-br from-emerald-950/95 via-emerald-950/85 to-amber-950/30 border-amber-400/80 ring-1 ring-amber-400/30 shadow-xl shadow-amber-950/30' 
            : 'bg-emerald-950/75 border-emerald-600/30 hover:border-amber-500/40 shadow-md'
        }`}>
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="text-sm text-amber-300">♦</span> {activeGame.team1?.name || 'Squadra 1'}
                </span>
                {onOpenEditTeams && (
                  <button
                    type="button"
                    onClick={onOpenEditTeams}
                    className="p-1 rounded-md text-emerald-400/70 hover:text-amber-300 hover:bg-emerald-900/60 transition-colors cursor-pointer"
                    title="Modifica squadra e giocatori"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                )}
              </div>
              {activeGame.team1?.players && activeGame.team1.players.length > 0 && (
                <div className="text-xs text-emerald-300 font-medium mt-1 flex flex-wrap gap-1">
                  {activeGame.team1.players.map((p) => {
                    const tInfo = titlesMap[p];
                    return (
                      <span 
                        key={p} 
                        className="inline-flex items-center gap-1 bg-emerald-900/90 px-1.5 py-0.5 rounded-md border border-amber-500/25 text-[11px] shadow-sm"
                        title={tInfo ? `${tInfo.title} (${tInfo.rank})` : p}
                      >
                        {tInfo && <span>{tInfo.icon}</span>}
                        <span className="font-semibold text-emerald-100">{p}</span>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Badge Leader Integrato nella Card */}
            {leader === 'team1' && diff !== 0 && (
              <div className="px-2.5 py-1 rounded-full gold-gradient text-emerald-950 text-[10px] sm:text-[11px] font-black tracking-wide uppercase shadow-md flex items-center gap-1 border border-amber-200/50 shrink-0 animate-in fade-in">
                <span>👑</span>
                <span>In Vantaggio</span>
                <span className="bg-emerald-950/20 px-1.5 py-0.2 rounded-full font-black text-[9px] sm:text-[10px]">(+{diff} pt)</span>
              </div>
            )}
          </div>

          {/* Punteggio Gigante */}
          <div className="my-2 flex items-baseline justify-between">
            <div className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-white drop-shadow-md">
              {totalTeam1.toLocaleString('it-IT')}
              <span className="text-sm font-normal text-amber-300/80 ml-1.5">pt</span>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-emerald-400/80 block">Traguardo: {targetScore}</span>
              <span className="text-xs font-bold text-amber-300">
                {targetScore - totalTeam1 > 0 
                  ? `Mancano ${targetScore - totalTeam1} pt` 
                  : 'Raggiunto! 🎉'}
              </span>
            </div>
          </div>

          {/* Barra di Progresso */}
          <div className="w-full bg-emerald-950/90 rounded-full h-2.5 p-0.5 border border-emerald-700/60 overflow-hidden shadow-inner">
            <div 
              className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-200 h-full rounded-full transition-all duration-500 shadow-sm"
              style={{ width: `${t1Percent}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] sm:text-[11px] text-emerald-400/80 mt-1 font-medium">
            <span>Progresso vittoria</span>
            <span className="font-bold text-amber-300">{t1Percent}%</span>
          </div>
        </div>

        {/* CARD SQUADRA 2 (TEMA BLU NOTTE / ZAFFIRO) */}
        <div className={`relative p-3.5 sm:p-4 rounded-2xl border border-t-4 border-t-blue-400 transition-all duration-300 ${
          leader === 'team2' 
            ? 'bg-gradient-to-br from-emerald-950/95 via-emerald-950/85 to-blue-950/35 border-blue-400/80 ring-1 ring-blue-400/30 shadow-xl shadow-blue-950/30' 
            : 'bg-emerald-950/75 border-emerald-600/30 hover:border-blue-500/40 shadow-md'
        }`}>
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="text-sm text-blue-400">♠</span> {activeGame.team2?.name || 'Squadra 2'}
                </span>
                {onOpenEditTeams && (
                  <button
                    type="button"
                    onClick={onOpenEditTeams}
                    className="p-1 rounded-md text-emerald-400/70 hover:text-blue-300 hover:bg-emerald-900/60 transition-colors cursor-pointer"
                    title="Modifica squadra e giocatori"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                )}
              </div>
              {activeGame.team2?.players && activeGame.team2.players.length > 0 && (
                <div className="text-xs text-emerald-300 font-medium mt-1 flex flex-wrap gap-1">
                  {activeGame.team2.players.map((p) => {
                    const tInfo = titlesMap[p];
                    return (
                      <span 
                        key={p} 
                        className="inline-flex items-center gap-1 bg-emerald-900/90 px-1.5 py-0.5 rounded-md border border-blue-500/25 text-[11px] shadow-sm"
                        title={tInfo ? `${tInfo.title} (${tInfo.rank})` : p}
                      >
                        {tInfo && <span>{tInfo.icon}</span>}
                        <span className="font-semibold text-emerald-100">{p}</span>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Badge Leader Integrato nella Card */}
            {leader === 'team2' && diff !== 0 && (
              <div className="px-2.5 py-1 rounded-full bg-gradient-to-r from-blue-400 via-sky-400 to-indigo-400 text-slate-950 text-[10px] sm:text-[11px] font-black tracking-wide uppercase shadow-md flex items-center gap-1 border border-blue-200/50 shrink-0 animate-in fade-in">
                <span>👑</span>
                <span>In Vantaggio</span>
                <span className="bg-slate-950/20 px-1.5 py-0.2 rounded-full font-black text-[9px] sm:text-[10px]">(+{Math.abs(diff)} pt)</span>
              </div>
            )}
          </div>

          {/* Punteggio Gigante */}
          <div className="my-2 flex items-baseline justify-between">
            <div className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-white drop-shadow-md">
              {totalTeam2.toLocaleString('it-IT')}
              <span className="text-sm font-normal text-blue-300/80 ml-1.5">pt</span>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-emerald-400/80 block">Traguardo: {targetScore}</span>
              <span className="text-xs font-bold text-blue-300">
                {targetScore - totalTeam2 > 0 
                  ? `Mancano ${targetScore - totalTeam2} pt` 
                  : 'Raggiunto! 🎉'}
              </span>
            </div>
          </div>

          {/* Barra di Progresso */}
          <div className="w-full bg-emerald-950/90 rounded-full h-2.5 p-0.5 border border-emerald-700/60 overflow-hidden shadow-inner">
            <div 
              className="bg-gradient-to-r from-blue-500 via-sky-400 to-indigo-300 h-full rounded-full transition-all duration-500 shadow-sm"
              style={{ width: `${t2Percent}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] sm:text-[11px] text-emerald-400/80 mt-1 font-medium">
            <span>Progresso vittoria</span>
            <span className="font-bold text-blue-300">{t2Percent}%</span>
          </div>
        </div>

        {/* CARD SQUADRA 3 (TEMA RUBINO / ROSA - SOLO SE A 3) */}
        {isTrio && (
          <div className={`relative p-3.5 sm:p-4 rounded-2xl border border-t-4 border-t-rose-400 transition-all duration-300 ${
            leader === 'team3' 
              ? 'bg-gradient-to-br from-emerald-950/95 via-emerald-950/85 to-rose-950/35 border-rose-400/80 ring-1 ring-rose-400/30 shadow-xl shadow-rose-950/30' 
              : 'bg-emerald-950/75 border-emerald-600/30 hover:border-rose-500/40 shadow-md'
          }`}>
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="text-sm text-rose-400">♥</span> {activeGame.team3?.name || 'Giocatore 3'}
                  </span>
                  {onOpenEditTeams && (
                    <button
                      type="button"
                      onClick={onOpenEditTeams}
                      className="p-1 rounded-md text-emerald-400/70 hover:text-rose-300 hover:bg-emerald-900/60 transition-colors cursor-pointer"
                      title="Modifica squadra e giocatori"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
                {activeGame.team3?.players && activeGame.team3.players.length > 0 && (
                  <div className="text-xs text-emerald-300 font-medium mt-1 flex flex-wrap gap-1">
                    {activeGame.team3.players.map((p) => {
                      const tInfo = titlesMap[p];
                      return (
                        <span 
                          key={p} 
                          className="inline-flex items-center gap-1 bg-emerald-900/90 px-1.5 py-0.5 rounded-md border border-rose-500/25 text-[11px] shadow-sm"
                          title={tInfo ? `${tInfo.title} (${tInfo.rank})` : p}
                        >
                          {tInfo && <span>{tInfo.icon}</span>}
                          <span className="font-semibold text-emerald-100">{p}</span>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Badge Leader Integrato nella Card */}
              {leader === 'team3' && diff !== 0 && (
                <div className="px-2.5 py-1 rounded-full bg-gradient-to-r from-rose-400 via-pink-400 to-purple-400 text-slate-950 text-[10px] sm:text-[11px] font-black tracking-wide uppercase shadow-md flex items-center gap-1 border border-rose-200/50 shrink-0 animate-in fade-in">
                  <span>👑</span>
                  <span>In Vantaggio</span>
                  <span className="bg-slate-950/20 px-1.5 py-0.2 rounded-full font-black text-[9px] sm:text-[10px]">(+{Math.abs(diff)} pt)</span>
                </div>
              )}
            </div>

            {/* Punteggio Gigante */}
            <div className="my-2 flex items-baseline justify-between">
              <div className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-white drop-shadow-md">
                {totalTeam3.toLocaleString('it-IT')}
                <span className="text-sm font-normal text-rose-300/80 ml-1.5">pt</span>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-emerald-400/80 block">Traguardo: {targetScore}</span>
                <span className="text-xs font-bold text-rose-300">
                  {targetScore - totalTeam3 > 0 
                    ? `Mancano ${targetScore - totalTeam3} pt` 
                    : 'Raggiunto! 🎉'}
                </span>
              </div>
            </div>

            {/* Barra di Progresso */}
            <div className="w-full bg-emerald-950/90 rounded-full h-2.5 p-0.5 border border-emerald-700/60 overflow-hidden shadow-inner">
              <div 
                className="bg-gradient-to-r from-rose-500 via-pink-400 to-rose-300 h-full rounded-full transition-all duration-500 shadow-sm"
                style={{ width: `${t3Percent}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] sm:text-[11px] text-emerald-400/80 mt-1 font-medium">
              <span>Progresso vittoria</span>
              <span className="font-bold text-rose-300">{t3Percent}%</span>
            </div>
          </div>
        )}

      </div>

      {/* AZIONI VELOCI DELLA PARTITA */}
      <div className="py-2 px-3 rounded-xl bg-emerald-950/80 border border-emerald-800/40 backdrop-blur-md flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shadow-sm">
        
        {/* Info mano in corso & Schermo attivo */}
        <div className="flex items-center justify-between sm:justify-start gap-2">
          <div className="px-2.5 py-1 rounded-lg bg-emerald-900/60 text-xs font-semibold text-emerald-200 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
            <span>Mano in corso: <strong className="text-amber-300">#{activeGame.rounds.length + 1}</strong></span>
            <span className="text-emerald-600">•</span>
            <span className="text-emerald-400/80 font-normal">{activeGame.rounds.length} {activeGame.rounds.length === 1 ? 'registrata' : 'registrate'}</span>
          </div>

          {/* Indicatore & Controllo Rapido Blocco Schermo iPad */}
          <button
            type="button"
            onClick={() => wakeLock.toggle()}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
              wakeLockState.enabled
                ? 'bg-amber-400/15 text-amber-300 border-amber-400/35 hover:bg-amber-400/25 shadow-xs'
                : 'bg-emerald-900/40 text-emerald-400/60 border-emerald-800/40 hover:bg-emerald-900/70'
            }`}
            title="Tocca per attivare o disattivare il blocco spegnimento schermo"
          >
            <Sun className={`w-3.5 h-3.5 ${wakeLockState.enabled ? 'text-amber-400' : 'text-emerald-500/50'}`} />
            <span>
              {wakeLockState.enabled ? 'Schermo Attivo' : 'Standby Auto'}
            </span>
          </button>
        </div>

        {/* Pulsanti Azione (Termina, Annulla, + Aggiungi Mano) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {activeGame.rounds.length > 0 && (
            <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
              <button
                onClick={onEndGame}
                className="px-2.5 py-2 sm:py-1.5 rounded-lg bg-emerald-900/70 hover:bg-emerald-800 text-amber-300 border border-emerald-600/40 text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-all shadow-sm hover:brightness-110 active:scale-95"
                title="Concludi ora la partita e salvala nello storico"
              >
                <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Termina & Salva</span>
              </button>

              <button
                onClick={onDeleteLastRound}
                className="px-2.5 py-2 sm:py-1.5 rounded-lg bg-rose-950/50 hover:bg-rose-900/70 text-rose-300 border border-rose-800/40 text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer transition-all shadow-sm active:scale-95"
                title="Annulla ultima mano inserita"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>Annulla Mano</span>
              </button>
            </div>
          )}

          <button
            onClick={onAddRound}
            className="w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-xl gold-gradient hover:brightness-110 text-emerald-950 font-black text-xs sm:text-sm shadow-md shadow-amber-900/30 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 shrink-0"
          >
            <PlusCircle className="w-4 h-4 text-emerald-950 shrink-0" />
            <span>+ Aggiungi Mano (Smazzata)</span>
          </button>
        </div>
      </div>

      {/* TABELLONE STORICO MANI (FOGLIO SEGNAPUNTI) */}
      <div className="felt-card rounded-2xl border border-emerald-600/30 overflow-hidden shadow-xl">
        <div className="py-2.5 px-3 sm:px-4 bg-emerald-950/90 border-b border-emerald-700/50 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-amber-400 font-serif text-base sm:text-lg">♦ ♠</span>
            <h3 className="text-xs sm:text-sm font-bold text-white m-0">Foglio Segnapunti Mani</h3>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Selettore Vista Schede / Tabella */}
            {roundsWithProgressive.length > 0 && (
              <div className="flex items-center gap-0.5 bg-emerald-900/80 p-0.5 rounded-lg border border-emerald-700/50 shadow-inner">
                <button
                  type="button"
                  onClick={() => setViewMode('cards')}
                  className={`px-2 py-1 rounded-md text-[10px] sm:text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                    viewMode === 'cards'
                      ? 'bg-amber-400 text-emerald-950 shadow-xs'
                      : 'text-emerald-300/80 hover:text-white'
                  }`}
                  title="Visualizzazione a schede (intuitiva su smartphone)"
                >
                  <LayoutList className="w-3 h-3" />
                  <span>Schede</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`px-2 py-1 rounded-md text-[10px] sm:text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                    viewMode === 'table'
                      ? 'bg-amber-400 text-emerald-950 shadow-xs'
                      : 'text-emerald-300/80 hover:text-white'
                  }`}
                  title="Visualizzazione a tabella classica"
                >
                  <Table className="w-3 h-3" />
                  <span>Tabella</span>
                </button>
              </div>
            )}

            <span className="hidden sm:inline-block px-2 py-0.5 rounded-md bg-emerald-900/60 border border-emerald-700/40 text-[10px] sm:text-[11px] text-emerald-300/80">
              Traguardo: <strong className="text-amber-300">{targetScore} pt</strong>
            </span>
          </div>
        </div>

        {roundsWithProgressive.length === 0 ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-900/60 border border-emerald-700/50 flex items-center justify-center mx-auto text-emerald-300">
              ♣
            </div>
            <h4 className="text-sm font-bold text-white">Nessuna mano registrata</h4>
            <p className="text-xs text-emerald-300/80 max-w-sm mx-auto">
              Mescolate le carte e distribuite i due pozzetti! Quando la prima mano si conclude, clicca su "Aggiungi Mano" per registrare i punti.
            </p>
            <button
              onClick={onAddRound}
              className="mt-2 px-4 py-2 rounded-xl gold-gradient text-emerald-950 font-bold text-xs shadow-md cursor-pointer hover:brightness-110"
            >
              + Inserisci Prima Mano
            </button>
          </div>
        ) : viewMode === 'cards' ? (
          /* VISTA A SCHEDE (Mobile first, super intuitiva e leggibile) */
          <div className="p-2.5 sm:p-3 space-y-2.5">
            {roundsWithProgressive.map((r, index) => {
              const isLast = index === roundsWithProgressive.length - 1;
              const t1WonHand = isTrio
                ? (r.team1Score > r.team2Score && r.team1Score > (r.team3Score || 0))
                : (r.team1Score > r.team2Score);
              const t2WonHand = isTrio
                ? (r.team2Score > r.team1Score && r.team2Score > (r.team3Score || 0))
                : (r.team2Score > r.team1Score);
              const t3WonHand = isTrio && (r.team3Score > r.team1Score && r.team3Score > r.team2Score);

              return (
                <div 
                  key={r.roundNumber} 
                  className={`p-3 rounded-2xl border transition-all ${
                    isLast 
                      ? 'bg-emerald-950/90 border-amber-500/50 shadow-lg ring-1 ring-amber-400/20' 
                      : 'bg-emerald-950/60 border-emerald-800/40 shadow-xs'
                  }`}
                >
                  {/* Intestazione della singola mano */}
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-emerald-800/40">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-emerald-900/90 text-amber-300 font-black text-xs flex items-center justify-center border border-amber-500/30 shadow-xs">
                        #{r.roundNumber}
                      </span>
                      <span className="text-xs font-bold text-white">
                        Mano {r.roundNumber}
                      </span>
                      {isLast && (
                        <span className="text-[10px] px-2 py-0.2 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 font-black uppercase tracking-wider">
                          Ultima
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => onEditRound(r)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200 hover:text-white border border-emerald-700/50 text-[11px] font-semibold flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-xs"
                      title="Modifica punteggio di questa mano"
                    >
                      <Edit2 className="w-3 h-3 text-amber-300" />
                      <span>Modifica</span>
                    </button>
                  </div>

                  {/* Confronto Squadre affiancate */}
                  <div className={`grid grid-cols-1 ${isTrio ? 'sm:grid-cols-3' : 'grid-cols-2'} gap-2`}>
                    
                    {/* Squadra 1 */}
                    <div className={`p-2.5 rounded-xl border flex flex-col justify-between transition-all ${
                      t1WonHand
                        ? 'bg-gradient-to-b from-amber-500/10 to-emerald-950/40 border-amber-500/40 shadow-xs'
                        : 'bg-emerald-900/20 border-emerald-800/30'
                    }`}>
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-[11px] font-bold text-amber-300 truncate">
                            ♦ {activeGame.team1?.name || 'Squadra 1'}
                          </span>
                          {isTrio && r.lonePlayer === 'team1' && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-400/20 text-amber-300 font-extrabold border border-amber-400/30 shrink-0">
                              👤 Solitario
                            </span>
                          )}
                          {!isTrio && t1WonHand && r.team1Score - r.team2Score > 0 && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-400/20 text-amber-300 font-bold border border-amber-400/30 shrink-0">
                              +{r.team1Score - r.team2Score}
                            </span>
                          )}
                        </div>

                        {/* Punti guadagnati nella mano */}
                        <div className="my-0.5">
                          <div className="flex items-baseline gap-1">
                            <span className={`text-xl font-black tracking-tight ${
                              r.team1Score >= 0 ? 'text-white' : 'text-rose-300'
                            }`}>
                              {r.team1Score >= 0 ? `+${r.team1Score}` : r.team1Score}
                            </span>
                            <span className="text-[10px] text-emerald-300/70 font-medium">nella mano</span>
                          </div>
                        </div>

                        {/* Totale cumulativo dopo la mano */}
                        <div className="text-[11px] text-emerald-200/90 font-medium mt-1 pt-1 border-t border-emerald-800/30">
                          Totale: <strong className="text-white font-black">{Number(r.runningT1 || 0).toLocaleString('it-IT')} pt</strong>
                        </div>
                      </div>

                      {/* Eventi smazzata (Burrachi, Chiusura, Pozzetto) */}
                      {r.entryMode !== 'quick' && <RoundEventChips details={r.team1Details} />}
                    </div>

                    {/* Squadra 2 */}
                    <div className={`p-2.5 rounded-xl border flex flex-col justify-between transition-all ${
                      t2WonHand
                        ? 'bg-gradient-to-b from-blue-500/10 to-emerald-950/40 border-blue-400/40 shadow-xs'
                        : 'bg-emerald-900/20 border-emerald-800/30'
                    }`}>
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-[11px] font-bold text-blue-300 truncate">
                            ♠ {activeGame.team2?.name || 'Squadra 2'}
                          </span>
                          {isTrio && r.lonePlayer === 'team2' && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-blue-400/20 text-blue-300 font-extrabold border border-blue-400/30 shrink-0">
                              👤 Solitario
                            </span>
                          )}
                          {!isTrio && t2WonHand && r.team2Score - r.team1Score > 0 && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-blue-400/20 text-blue-300 font-bold border border-blue-400/30 shrink-0">
                              +{r.team2Score - r.team1Score}
                            </span>
                          )}
                        </div>

                        {/* Punti guadagnati nella mano */}
                        <div className="my-0.5">
                          <div className="flex items-baseline gap-1">
                            <span className={`text-xl font-black tracking-tight ${
                              r.team2Score >= 0 ? 'text-white' : 'text-rose-300'
                            }`}>
                              {r.team2Score >= 0 ? `+${r.team2Score}` : r.team2Score}
                            </span>
                            <span className="text-[10px] text-blue-300/70 font-medium">nella mano</span>
                          </div>
                        </div>

                        {/* Totale cumulativo dopo la mano */}
                        <div className="text-[11px] text-emerald-200/90 font-medium mt-1 pt-1 border-t border-emerald-800/30">
                          Totale: <strong className="text-white font-black">{r.runningT2.toLocaleString('it-IT')} pt</strong>
                        </div>
                      </div>

                      {/* Eventi smazzata (Burrachi, Chiusura, Pozzetto) */}
                      {r.entryMode !== 'quick' && <RoundEventChips details={r.team2Details} />}
                    </div>

                    {/* Squadra 3 (se a 3) */}
                    {isTrio && (
                      <div className={`p-2.5 rounded-xl border flex flex-col justify-between transition-all ${
                        t3WonHand
                          ? 'bg-gradient-to-b from-rose-500/10 to-emerald-950/40 border-rose-400/40 shadow-xs'
                          : 'bg-emerald-900/20 border-emerald-800/30'
                      }`}>
                        <div>
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="text-[11px] font-bold text-rose-300 truncate">
                              ♥ {activeGame.team3?.name || 'Giocatore 3'}
                            </span>
                            {r.lonePlayer === 'team3' && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-rose-400/20 text-rose-300 font-extrabold border border-rose-400/30 shrink-0">
                                👤 Solitario
                              </span>
                            )}
                          </div>

                          {/* Punti guadagnati nella mano */}
                          <div className="my-0.5">
                            <div className="flex items-baseline gap-1">
                              <span className={`text-xl font-black tracking-tight ${
                                (r.team3Score || 0) >= 0 ? 'text-white' : 'text-rose-300'
                              }`}>
                                {(r.team3Score || 0) >= 0 ? `+${r.team3Score || 0}` : r.team3Score}
                              </span>
                              <span className="text-[10px] text-rose-300/70 font-medium">nella mano</span>
                            </div>
                          </div>

                          {/* Totale cumulativo dopo la mano */}
                          <div className="text-[11px] text-emerald-200/90 font-medium mt-1 pt-1 border-t border-emerald-800/30">
                            Totale: <strong className="text-white font-black">{r.runningT3.toLocaleString('it-IT')} pt</strong>
                          </div>
                        </div>

                        {/* Eventi smazzata (Burrachi, Chiusura, Pozzetto) */}
                        {r.entryMode !== 'quick' && <RoundEventChips details={r.team3Details} />}
                      </div>
                    )}

                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* VISTA A TABELLA (Desktop e tablet, con dicitura chiara "mano" e "totale") */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-emerald-700/50 bg-emerald-950/60 text-[11px] font-bold uppercase tracking-wider text-emerald-300">
                  <th className="py-2.5 px-3 sm:px-4 text-center w-12 sm:w-16">Mano</th>
                  <th className="py-2.5 px-3 sm:px-4 text-amber-300">
                    ♦ {activeGame.team1?.name || 'Squadra 1'}
                  </th>
                  <th className="py-2.5 px-3 sm:px-4 text-blue-300">
                    ♠ {activeGame.team2?.name || 'Squadra 2'}
                  </th>
                  {isTrio && (
                    <th className="py-2.5 px-3 sm:px-4 text-rose-300">
                      ♥ {activeGame.team3?.name || 'Giocatore 3'}
                    </th>
                  )}
                  <th className="py-2.5 px-3 sm:px-4 text-right w-16">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-800/40 text-xs sm:text-sm">
                {roundsWithProgressive.map((r, index) => {
                  const isLast = index === roundsWithProgressive.length - 1;
                  return (
                    <tr 
                      key={r.roundNumber || index} 
                      className={`transition-colors border-b border-emerald-800/30 ${
                        isLast ? 'bg-emerald-900/35' : index % 2 === 0 ? 'bg-emerald-950/40' : 'bg-transparent'
                      } hover:bg-emerald-800/30`}
                    >
                      {/* Numero Mano */}
                      <td className="py-2.5 px-2.5 sm:px-4 text-center">
                        <span className="inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-emerald-900/80 text-emerald-300 font-black text-xs border border-emerald-700/50 shadow-inner">
                          #{r.roundNumber || index + 1}
                        </span>
                      </td>

                      {/* Squadra 1 */}
                      <td className="py-2.5 px-2.5 sm:px-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-black text-white text-sm sm:text-base tracking-tight">
                            {Number(r.runningT1 || 0).toLocaleString('it-IT')}
                            <span className="text-[10px] font-normal text-emerald-400/70 ml-1">tot</span>
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[11px] sm:text-xs font-bold ${
                            r.team1Score >= 0 
                              ? 'bg-amber-400/15 text-amber-300 border border-amber-400/30' 
                              : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                          }`}>
                            {r.team1Score >= 0 ? `+${r.team1Score}` : r.team1Score} mano
                          </span>
                          {isTrio && r.lonePlayer === 'team1' && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-400/20 text-amber-300 font-extrabold border border-amber-400/30">
                              👤 Solitario
                            </span>
                          )}
                        </div>
                        {r.entryMode !== 'quick' && <RoundEventChips details={r.team1Details} />}
                      </td>

                      {/* Squadra 2 */}
                      <td className="py-2.5 px-2.5 sm:px-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-black text-white text-sm sm:text-base tracking-tight">
                            {Number(r.runningT2 || 0).toLocaleString('it-IT')}
                            <span className="text-[10px] font-normal text-emerald-400/70 ml-1">tot</span>
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[11px] sm:text-xs font-bold ${
                            r.team2Score >= 0 
                              ? 'bg-blue-400/15 text-blue-300 border border-blue-400/30' 
                              : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                          }`}>
                            {r.team2Score >= 0 ? `+${r.team2Score}` : r.team2Score} mano
                          </span>
                          {isTrio && r.lonePlayer === 'team2' && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-400/20 text-blue-300 font-extrabold border border-blue-400/30">
                              👤 Solitario
                            </span>
                          )}
                        </div>
                        {r.entryMode !== 'quick' && <RoundEventChips details={r.team2Details} />}
                      </td>

                      {/* Squadra 3 (se a 3) */}
                      {isTrio && (
                        <td className="py-2.5 px-2.5 sm:px-4">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-black text-white text-sm sm:text-base tracking-tight">
                              {Number(r.runningT3 || 0).toLocaleString('it-IT')}
                              <span className="text-[10px] font-normal text-emerald-400/70 ml-1">tot</span>
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[11px] sm:text-xs font-bold ${
                              (r.team3Score || 0) >= 0 
                                ? 'bg-rose-400/15 text-rose-300 border border-rose-400/30' 
                                : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                            }`}>
                              {(r.team3Score || 0) >= 0 ? `+${r.team3Score || 0}` : r.team3Score} mano
                            </span>
                            {r.lonePlayer === 'team3' && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-400/20 text-rose-300 font-extrabold border border-rose-400/30">
                                👤 Solitario
                              </span>
                            )}
                          </div>
                          {r.entryMode !== 'quick' && <RoundEventChips details={r.team3Details} />}
                        </td>
                      )}

                      {/* Azioni riga */}
                      <td className="py-2.5 px-2.5 sm:px-4 text-right">
                        <button
                          onClick={() => onEditRound(r)}
                          className="p-1.5 rounded-lg hover:bg-emerald-800 text-emerald-300 hover:text-white transition-colors cursor-pointer"
                          title="Modifica punteggio di questa mano"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
