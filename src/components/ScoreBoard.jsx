import React, { useMemo, memo } from 'react';
import { Trophy } from 'lucide-react';
import { getGamesHistory, calculatePlayerStats } from '../utils/storage';
import { getPlayerTitle } from '../utils/trophies';

// Sotto-componenti modulari del tabellone segnapunti
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
  onDeleteLastRound,
  onEndGame,
  onShareGame,
  onOpenEditTeams,
}) {
  const isTrio = activeGame?.mode === 'trio';

  // Calcola titoli dei giocatori della partita
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

      {/* 1. Barra Giocatori Live & Amicizia */}
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

      {/* 2. Schede Punteggio Squadre */}
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

      {/* 3. Toolbar Azioni Rapide Partita */}
      <ScoreBoardToolbar
        roundsCount={activeGame.rounds?.length || 0}
        onEndGame={onEndGame}
        onDeleteLastRound={onDeleteLastRound}
        onAddRound={onAddRound}
      />

      {/* 4. Tabellone Storico Mani (Foglio Segnapunti) */}
      <RoundsHistoryList
        activeGame={activeGame}
        isTrio={isTrio}
        roundsWithProgressive={roundsWithProgressive}
        targetScore={targetScore}
        onAddRound={onAddRound}
        onEditRound={onEditRound}
      />

    </div>
  );
}

export default memo(ScoreBoard);