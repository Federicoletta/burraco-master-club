import { calculatePlayerTrophies } from './trophies';

/**
 * Calcola statistiche dettagliate e complete divise per singolo partecipante
 * Include sia lo storico partite che la partita in corso
 */
export function calculatePlayerStats(playersList = [], gamesHistory = [], activeGame = null) {
  const allGames = [...gamesHistory];
  if (activeGame && activeGame.rounds && activeGame.rounds.length > 0) {
    if (!allGames.some(g => g.id === activeGame.id)) {
      allGames.push(activeGame);
    }
  }

  const statsMap = {};

  const createEmptyPlayerStats = (name) => ({
    name,
    gamesPlayed: 0,
    gamesWon: 0,
    gamesLost: 0,
    winRate: 0,
    totalPoints: 0,
    totalHands: 0,
    avgPointsPerGame: 0,
    avgPointsPerHand: 0,
    cleanBurrachi: 0,
    semiCleanBurrachi: 0,
    dirtyBurrachi: 0,
    totalBurrachi: 0,
    closures: 0,
    bestHandScore: 0,
    scoresHistory: [],
    matchScores: [],
  });

  playersList.forEach(player => {
    statsMap[player] = createEmptyPlayerStats(player);
  });

  allGames.filter(Boolean).forEach(game => {
    if (!game || typeof game !== 'object') return;
    const isFinished = Boolean(game.isFinished);
    const isTeam1Winner = game.winner === 'team1';
    const isTeam2Winner = game.winner === 'team2';
    const isTeam3Winner = game.winner === 'team3';

    const t1Players = Array.isArray(game.team1?.players) ? game.team1.players : [];
    const t2Players = Array.isArray(game.team2?.players) ? game.team2.players : [];
    const t3Players = Array.isArray(game.team3?.players) ? game.team3.players : [];

    let t1Total = 0, t2Total = 0, t3Total = 0;
    let t1Clean = 0, t2Clean = 0, t3Clean = 0;
    let t1Semi = 0, t2Semi = 0, t3Semi = 0;
    let t1Dirty = 0, t2Dirty = 0, t3Dirty = 0;
    let t1Closures = 0, t2Closures = 0, t3Closures = 0;

    const t1HandScores = [];
    const t2HandScores = [];
    const t3HandScores = [];

    (game.rounds || []).filter(Boolean).forEach(r => {
      if (!r || typeof r !== 'object') return;
      const s1 = Number(r.team1Score) || 0;
      const s2 = Number(r.team2Score) || 0;
      const s3 = Number(r.team3Score) || 0;
      t1Total += s1;
      t2Total += s2;
      t3Total += s3;
      t1HandScores.push(s1);
      t2HandScores.push(s2);
      t3HandScores.push(s3);

      if (r.team1Details) {
        t1Clean += r.team1Details.burracoPulito || 0;
        t1Semi += r.team1Details.burracoSemipulito || 0;
        t1Dirty += r.team1Details.burracoSporco || 0;
        if (r.team1Details.chiusura) t1Closures += 1;
      }
      if (r.team2Details) {
        t2Clean += r.team2Details.burracoPulito || 0;
        t2Semi += r.team2Details.burracoSemipulito || 0;
        t2Dirty += r.team2Details.burracoSporco || 0;
        if (r.team2Details.chiusura) t2Closures += 1;
      }
      if (r.team3Details) {
        t3Clean += r.team3Details.burracoPulito || 0;
        t3Semi += r.team3Details.burracoSemipulito || 0;
        t3Dirty += r.team3Details.burracoSporco || 0;
        if (r.team3Details.chiusura) t3Closures += 1;
      }
    });

    const roundsCount = (game.rounds || []).length;

    const updatePlayersStats = (players, totalScore, clean, semi, dirty, closures, handScores, isWinner) => {
      (players || []).filter(Boolean).forEach(rawP => {
        const p = typeof rawP === 'string' ? rawP : rawP?.name || String(rawP);
        if (!p) return;
        if (!statsMap[p]) {
          statsMap[p] = createEmptyPlayerStats(p);
        }

        if (isFinished) {
          statsMap[p].gamesPlayed += 1;
          if (isWinner) {
            statsMap[p].gamesWon += 1;
          } else if (isTeam1Winner || isTeam2Winner || isTeam3Winner) {
            statsMap[p].gamesLost += 1;
          }
        }

        statsMap[p].totalPoints += totalScore;
        statsMap[p].totalHands += roundsCount;
        statsMap[p].cleanBurrachi += clean;
        statsMap[p].semiCleanBurrachi += semi;
        statsMap[p].dirtyBurrachi += dirty;
        statsMap[p].closures += closures;
        statsMap[p].scoresHistory.push(...handScores);
        if (roundsCount > 0) {
          statsMap[p].matchScores.push(totalScore);
        }

        handScores.forEach(score => {
          if (score > statsMap[p].bestHandScore) {
            statsMap[p].bestHandScore = score;
          }
        });
      });
    };

    updatePlayersStats(t1Players, t1Total, t1Clean, t1Semi, t1Dirty, t1Closures, t1HandScores, isTeam1Winner);
    updatePlayersStats(t2Players, t2Total, t2Clean, t2Semi, t2Dirty, t2Closures, t2HandScores, isTeam2Winner);
    if (t3Players.length > 0) {
      updatePlayersStats(t3Players, t3Total, t3Clean, t3Semi, t3Dirty, t3Closures, t3HandScores, isTeam3Winner);
    }
  });

  Object.values(statsMap).forEach(p => {
    p.totalBurrachi = p.cleanBurrachi + p.semiCleanBurrachi + p.dirtyBurrachi;
    p.winRate = p.gamesPlayed > 0 ? Math.round((p.gamesWon / p.gamesPlayed) * 100) : 0;
    p.avgPointsPerGame = p.gamesPlayed > 0 ? Math.round(p.totalPoints / p.gamesPlayed) : p.totalPoints;
    p.avgPointsPerHand = p.totalHands > 0 ? Math.round(p.totalPoints / p.totalHands) : 0;
  });

  return Object.values(statsMap).sort((a, b) => {
    if (b.gamesWon !== a.gamesWon) return b.gamesWon - a.gamesWon;
    return b.totalPoints - a.totalPoints;
  });
}

/**
 * Calcola le statistiche di carriera aggregate di un singolo utente autenticato
 */
export function computeUserCareerStats(user, gamesHistory = [], activeGame = null) {
  if (!user) return null;
  const myName = (user.displayName || user.email?.split('@')[0] || '').trim();
  const myEmail = (user.email || '').trim().toLowerCase();

  const aliases = new Set([myName.toLowerCase(), myEmail, 'tu']);
  if (user.uid) aliases.add(String(user.uid).toLowerCase());
  if (user.displayName) {
    const full = user.displayName.trim().toLowerCase();
    aliases.add(full);
    const parts = user.displayName.trim().split(/\s+/);
    parts.forEach(pt => {
      if (pt.length >= 2) aliases.add(pt.toLowerCase());
    });
  }

  const allGames = [...(gamesHistory || [])];
  if (activeGame && activeGame.rounds && activeGame.rounds.length > 0) {
    if (!allGames.some(g => g.id === activeGame.id)) {
      allGames.push(activeGame);
    }
  }

  let gamesPlayed = 0;
  let gamesWon = 0;
  let gamesLost = 0;
  let totalPoints = 0;
  let totalHands = 0;
  let cleanBurrachi = 0;
  let semiCleanBurrachi = 0;
  let dirtyBurrachi = 0;
  let closures = 0;
  let bestHandScore = 0;
  const scoresHistory = [];
  const matchScores = [];

  const checkMatch = (players) => {
    return (players || []).some(p => {
      if (!p) return false;
      if (typeof p === 'string') {
        return aliases.has(p.trim().toLowerCase());
      }
      if (typeof p === 'object') {
        const n = (p.name || p.displayName || '').trim().toLowerCase();
        const em = (p.email || '').trim().toLowerCase();
        const id = (p.uid || '').trim().toLowerCase();
        return (n && aliases.has(n)) || (em && aliases.has(em)) || (id && aliases.has(id));
      }
      return false;
    });
  };

  allGames.filter(Boolean).forEach(game => {
    if (!game || typeof game !== 'object') return;
    const isFinished = Boolean(game.isFinished);
    const isTeam1Winner = game.winner === 'team1';
    const isTeam2Winner = game.winner === 'team2';
    const isTeam3Winner = game.winner === 'team3';

    const t1Match = checkMatch(game.team1?.players);
    const t2Match = checkMatch(game.team2?.players);
    const t3Match = checkMatch(game.team3?.players);

    if (!t1Match && !t2Match && !t3Match) {
      if (game.ownerUid !== user.uid) return;
    }

    const teamKey = t1Match ? 'team1' : t2Match ? 'team2' : t3Match ? 'team3' : 'team1';
    const isWinner = (teamKey === 'team1' && isTeam1Winner) || (teamKey === 'team2' && isTeam2Winner) || (teamKey === 'team3' && isTeam3Winner);
    const detailsKey = `${teamKey}Details`;
    const scoreKey = `${teamKey}Score`;

    const roundsCount = (game.rounds || []).length;
    totalHands += roundsCount;

    let gamePlayerScore = 0;
    (game.rounds || []).filter(Boolean).forEach(r => {
      const s = Number(r[scoreKey]) || 0;
      totalPoints += s;
      gamePlayerScore += s;
      scoresHistory.push(s);
      if (s > bestHandScore) bestHandScore = s;

      const d = r[detailsKey];
      if (d) {
        cleanBurrachi += Number(d.burracoPulito) || 0;
        semiCleanBurrachi += Number(d.burracoSemipulito) || 0;
        dirtyBurrachi += Number(d.burracoSporco) || 0;
        if (d.chiusura) closures += 1;
      }
    });

    if (roundsCount > 0) {
      matchScores.push(gamePlayerScore);
    }

    if (isFinished) {
      gamesPlayed += 1;
      if (isWinner) {
        gamesWon += 1;
      } else if (isTeam1Winner || isTeam2Winner || isTeam3Winner) {
        gamesLost += 1;
      }
    }
  });

  const winRate = gamesPlayed > 0 ? Math.round((gamesWon / gamesPlayed) * 100) : 0;
  const totalBurrachi = cleanBurrachi + semiCleanBurrachi + dirtyBurrachi;
  const avgPointsPerHand = totalHands > 0 ? Math.round(totalPoints / totalHands) : 0;
  const avgPointsPerGame = gamesPlayed > 0 ? Math.round(totalPoints / gamesPlayed) : totalPoints;

  const baseStats = {
    name: myName || user.displayName || 'Giocatore',
    displayName: user.displayName || myName || '',
    email: user.email || '',
    uid: user.uid || '',
    aliases: Array.from(aliases),
    totalPoints,
    gamesPlayed,
    gamesWon,
    gamesLost,
    winRate,
    cleanBurrachi,
    semiCleanBurrachi,
    dirtyBurrachi,
    totalBurrachi,
    closures,
    bestHandScore,
    avgPointsPerHand,
    avgPointsPerGame,
    scoresHistory,
    matchScores,
  };

  const trophiesResult = calculatePlayerTrophies(baseStats, allGames);

  return {
    ...baseStats,
    trophiesCount: trophiesResult?.unlockedCount || 0,
  };
}
