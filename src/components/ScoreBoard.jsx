import React, { useMemo, memo } from 'react';
import { Trophy, Plus, RotateCcw, Scale } from 'lucide-react';
import { getGamesHistory, calculatePlayerStats } from '../utils/storage';
import { getPlayerTitle } from '../utils/trophies';
import { computeGameShortPin } from '../services/firebase';
import { DEFAULT_TARGET_SCORE } from '../constants/burraco';
import { computeTeamTotalsAndWinner } from '../utils/gameHelpers';

import TablePlayersBar from './scoreboard/TablePlayersBar';
import TeamScoreCards from './scoreboard/TeamScoreCards';
import ScoreBoardToolbar from './scoreboard/ScoreBoardToolbar';
import RoundsHistoryList from './scoreboard/RoundsHistoryList';

function ScoreBoard({
  activeGame,
  gamesHistory = [],
  currentUser = null,
  tablePlayers = [],
  friendsList = [],
  isCloudJoined = false,
  onLeaveCloudTable = null,
  onSendFriendRequest,
  onOpenLogin,
  onAddRound,
  onEditRound,
  onDeleteRound,
  onDeleteLastRound,
  onCloseTable = null,
  onSaveGame = null,
  onEndGame,
  onShareGame,
  onOpenEditTeams,
  onResumeGame = null,
  syncStatus = 'synced',
}) {
  const isTrio = activeGame?.mode === 'trio';

  const titlesMap = useMemo(() => {
    if (!activeGame) return {};
    const allPlayersInGame = [
      ...(activeGame.team1?.players || []),
      ...(activeGame.team2?.players || []),
      ...(activeGame.team3?.players || [])
    ].filter(Boolean);
    const userKey = currentUser ? currentUser.uid : 'guest';
    const history = gamesHistory.length > 0 ? gamesHistory : getGamesHistory(userKey);
    const stats = calculatePlayerStats(allPlayersInGame, history, activeGame);
    const map = {};
    stats.forEach(s => {
      map[s.name] = getPlayerTitle(s);
    });
    return map;
  }, [activeGame, gamesHistory, currentUser]);

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

  const pendingGame = useMemo(() => {
    if (!activeGame || (activeGame.rounds && activeGame.rounds.length > 0)) return null;
    return (gamesHistory || []).find(
      g => g && g.id !== activeGame?.id && !g.isFinished && Array.isArray(g.rounds) && g.rounds.length > 0
    ) || null;
  }, [activeGame, gamesHistory]);

  if (!activeGame) return null;

  const targetScore = activeGame.targetScore || DEFAULT_TARGET_SCORE;
  const tablePin = activeGame.pin || computeGameShortPin(activeGame.id);

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

  const { isTargetReached, isTieAtTarget, winner: computedWinner } = computeTeamTotalsAndWinner(
    activeGame.rounds,
    activeGame.mode,
    targetScore
  );

  const winningTeam = computedWinner === 'team1'
    ? activeGame.team1
    : computedWinner === 'team2'
      ? activeGame.team2
      : computedWinner === 'team3'
        ? activeGame.team3
        : null;
  const winningScore = isTrio
    ? Math.max(totalTeam1, totalTeam2, totalTeam3)
    : Math.max(totalTeam1, totalTeam2);

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* AVVISO PARITÀ AL TRAGUARDO (SPAREGGIO OBBLIGATORIO) */}
      {isTargetReached && isTieAtTarget && !activeGame.isFinished && (
        <div
          role="status"
          className="p-4 rounded-2xl club-card border-[var(--accent-gold)]/75 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl gold-gradient flex items-center justify-center shrink-0">
              <Scale className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-sm sm:text-base font-bold club-text-primary">
                Parità al traguardo ({winningScore.toLocaleString('it-IT')} pt) — Spareggio!
              </h3>
              <p className="text-xs club-text-gold font-medium">
                Nessun vincitore decretato: giocate una smazzata di spareggio per rompere la parità.
              </p>
            </div>
          </div>
          {onAddRound && (
            <button
              type="button"
              onClick={onAddRound}
              className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl gold-gradient font-bold text-sm cursor-pointer active:scale-[0.98]"
            >
              Registra Smazzata di Spareggio
            </button>
          )}
        </div>
      )}

      {/* AVVISO TRAGUARDO RAGGIUNTO */}
      {isTargetReached && !isTieAtTarget && !activeGame.isFinished && (
        <div className="p-4 rounded-2xl club-card border-[var(--accent-gold)]/75 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl gold-gradient flex items-center justify-center shrink-0">
              <Trophy className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-sm sm:text-base font-bold club-text-primary">
                Traguardo di {targetScore} pt raggiunto
              </h3>
              <p className="text-xs club-text-gold font-medium">
                {winningTeam?.name} conduce con {winningScore.toLocaleString('it-IT')} punti
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onEndGame}
            className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl gold-gradient font-bold text-sm cursor-pointer active:scale-[0.98]"
          >
            Festeggia e Termina
          </button>
        </div>
      )}

      {/* BANNER RIPRESA PARTITA IN SOSPESO */}
      {pendingGame && onResumeGame && (
        <div className="p-3.5 sm:p-4 rounded-2xl club-card border-[var(--accent-gold)]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-10 h-10 rounded-xl club-inset club-text-gold flex items-center justify-center shrink-0">
              <RotateCcw className="w-4 h-4" />
            </span>
            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-bold club-text-primary truncate">
                Partita in sospeso: {pendingGame.team1?.name} vs {pendingGame.team2?.name}
              </div>
              <div className="text-xs club-text-muted mt-0.5 tabular-nums-club">
                {pendingGame.rounds?.length || 0} {pendingGame.rounds?.length === 1 ? 'mano' : 'mani'} · {(pendingGame.rounds || []).reduce((a, r) => a + (r.team1Score || 0), 0)} a {(pendingGame.rounds || []).reduce((a, r) => a + (r.team2Score || 0), 0)} pt
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onResumeGame(pendingGame)}
            className="w-full sm:w-auto min-h-[44px] px-4 py-2 rounded-xl gold-gradient font-bold text-xs sm:text-sm active:scale-95 cursor-pointer shrink-0"
          >
            Riprendi Partita
          </button>
        </div>
      )}

      {/* INTESTAZIONE COMPATTA DEL TAVOLO */}
      <div className="px-3.5 py-2.5 rounded-2xl club-card flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              syncStatus === 'syncing'
                ? 'bg-amber-500 animate-pulse'
                : syncStatus === 'offline'
                  ? 'bg-rose-500'
                  : 'bg-emerald-500'
            }`}
          />
          <span className="font-semibold club-text-primary">Tavolo Live</span>
          {tablePin && (
            <>
              <span className="club-text-subtle">·</span>
              <span className="font-mono-num font-bold club-text-gold">
                PIN {tablePin}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2.5 text-xs">
          <span className="club-text-muted">
            Obiettivo <strong className="font-mono-num club-text-primary">{targetScore} pt</strong>
          </span>
          <span className="club-text-subtle">·</span>
          <span className={`font-semibold ${
            syncStatus === 'syncing'
              ? 'club-text-gold'
              : syncStatus === 'offline'
                ? 'club-danger-text'
                : 'club-success-text'
          }`}>
            {syncStatus === 'syncing' ? 'Sync Cloud...' : syncStatus === 'offline' ? 'Offline' : 'Sincronizzato'}
          </span>
        </div>
      </div>

      {/* GRIGLIA TAVOLO: TABLET/DESKTOP SPLIT VIEW, MOBILE VERTICALE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
        {/* COLONNA PRINCIPALE: PUNTEGGI + AZIONI */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-3">
          <TeamScoreCards
            activeGame={activeGame}
            isTrio={isTrio}
            totalTeam1={totalTeam1}
            totalTeam2={totalTeam2}
            totalTeam3={totalTeam3}
            targetScore={targetScore}
            leader={leader}
            diff={diff}
            t1Percent={t1Percent}
            t2Percent={t2Percent}
            t3Percent={t3Percent}
            titlesMap={titlesMap}
            onOpenEditTeams={onOpenEditTeams}
          />

          {/* Pulsante Desktop inline */}
          {onAddRound && (
            <button
              type="button"
              onClick={onAddRound}
              className="hidden lg:flex w-full min-h-[52px] py-3.5 px-6 rounded-2xl gold-gradient font-bold text-base cursor-pointer active:scale-[0.99] transition-transform items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5 stroke-[2.5px]" />
              <span>Registra Nuova Smazzata</span>
            </button>
          )}

          <ScoreBoardToolbar
            roundsCount={activeGame.rounds?.length || 0}
            syncStatus={syncStatus}
            onEndGame={onEndGame}
            onDeleteLastRound={onDeleteLastRound}
            onCloseTable={onCloseTable}
            onSaveGame={onSaveGame}
          />

          <TablePlayersBar
            activeGame={activeGame}
            tablePlayers={tablePlayers}
            currentUser={currentUser}
            friendsList={friendsList}
            isCloudJoined={isCloudJoined}
            onShareGame={onShareGame}
            onLeaveCloudTable={onLeaveCloudTable}
            onSendFriendRequest={onSendFriendRequest}
            onOpenLogin={onOpenLogin}
          />
        </div>

        {/* COLONNA DESTRA: FOGLIO SEGNAPUNTI MANI */}
        <div className="lg:col-span-5 xl:col-span-4">
          <RoundsHistoryList
            activeGame={activeGame}
            isTrio={isTrio}
            roundsWithProgressive={roundsWithProgressive}
            targetScore={targetScore}
            onAddRound={onAddRound}
            onEditRound={onEditRound}
            onDeleteRound={onDeleteRound}
          />
        </div>
      </div>

      {/* ZONA POLLICE MOBILE (< lg): CTA "+ Registra Smazzata" ancorata sopra la BottomNavBar */}
      {onAddRound && (
        <div
          className="lg:hidden fixed left-1/2 -translate-x-1/2 z-30 w-[calc(100%-1.25rem)] max-w-md pointer-events-none"
          style={{
            bottom: 'calc(env(safe-area-inset-bottom, 0px) + 5.25rem)',
          }}
        >
          <button
            type="button"
            onClick={onAddRound}
            className="pointer-events-auto w-full min-h-[50px] py-3 px-5 rounded-2xl gold-gradient font-bold text-[15px] shadow-2xl cursor-pointer active:scale-[0.98] transition-transform flex items-center justify-center gap-2 border border-amber-200/40"
          >
            <Plus className="w-5 h-5 stroke-[2.5px]" />
            <span>Registra Smazzata</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default memo(ScoreBoard);
