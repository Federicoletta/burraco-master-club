// Gestione logica, calcoli e archivio per la modalità Torneo di Burraco

export const TOURNAMENT_STORAGE_KEYS = {
  ACTIVE: 'burraco_active_tournament_v1',
  HISTORY: 'burraco_tournaments_history_v1',
};

/**
 * Tabella Ufficiale Federale FIBUR per conversione scarto punti in Victory Points (VP).
 * Punteggio su scala 20 - 0 (somma dei VP al tavolo = 20).
 * Fonte: Regolamento Tecnico Nazionale FIBUR per Tornei Federali.
 */
export const FIBUR_VICTORY_POINTS_TABLE = [
  { maxDiff: 50, winnerVp: 10, loserVp: 10 },
  { maxDiff: 150, winnerVp: 11, loserVp: 9 },
  { maxDiff: 300, winnerVp: 12, loserVp: 8 },
  { maxDiff: 500, winnerVp: 13, loserVp: 7 },
  { maxDiff: 750, winnerVp: 14, loserVp: 6 },
  { maxDiff: 1050, winnerVp: 15, loserVp: 5 },
  { maxDiff: 1400, winnerVp: 16, loserVp: 4 },
  { maxDiff: 1800, winnerVp: 17, loserVp: 3 },
  { maxDiff: 2250, winnerVp: 18, loserVp: 2 },
  { maxDiff: 2750, winnerVp: 19, loserVp: 1 },
  { maxDiff: Infinity, winnerVp: 20, loserVp: 0 },
];

/**
 * Converte il risultato di un incontro in Victory Points (VP) secondo la tabella FIBUR
 * @param {number} score1 - Punti Burraco realizzati squadra 1
 * @param {number} score2 - Punti Burraco realizzati squadra 2
 * @returns {{ team1Vp: number, team2Vp: number, diff: number }}
 */
export function calculateFiburVictoryPoints(score1, score2) {
  const s1 = Number(score1) || 0;
  const s2 = Number(score2) || 0;
  const diff = Math.abs(s1 - s2);

  const bracket = FIBUR_VICTORY_POINTS_TABLE.find(b => diff <= b.maxDiff) || FIBUR_VICTORY_POINTS_TABLE[FIBUR_VICTORY_POINTS_TABLE.length - 1];

  if (s1 > s2) {
    return { team1Vp: bracket.winnerVp, team2Vp: bracket.loserVp, diff: s1 - s2 };
  } else if (s2 > s1) {
    return { team1Vp: bracket.loserVp, team2Vp: bracket.winnerVp, diff: s1 - s2 };
  } else {
    return { team1Vp: 10, team2Vp: 10, diff: 0 };
  }
}

/**
 * Genera il calendario Round-Robin (Tutti contro tutti) per N squadre
 * Se il numero di squadre è dispari, aggiunge una squadra fittizia 'RIPOSO'
 */
export function generateRoundRobinSchedule(teams) {
  if (!Array.isArray(teams) || teams.length < 2) return [];

  const teamList = [...teams];
  const hasGhost = teamList.length % 2 !== 0;
  if (hasGhost) {
    teamList.push({ id: '__bye__', name: 'RIPOSO', players: [] });
  }

  const numTeams = teamList.length;
  const numRounds = numTeams - 1;
  const matchesPerRound = numTeams / 2;
  const rounds = [];

  let currentRotation = [...teamList];

  for (let roundIdx = 0; roundIdx < numRounds; roundIdx++) {
    const matches = [];

    for (let matchIdx = 0; matchIdx < matchesPerRound; matchIdx++) {
      const home = currentRotation[matchIdx];
      const away = currentRotation[numTeams - 1 - matchIdx];

      // Ignora i match contro la squadra fittizia di riposo
      if (home.id !== '__bye__' && away.id !== '__bye__') {
        matches.push({
          id: `match_${roundIdx + 1}_${home.id}_${away.id}_${Date.now().toString(36)}_${matchIdx}`,
          roundNumber: roundIdx + 1,
          tableNumber: matchIdx + 1,
          team1Id: home.id,
          team2Id: away.id,
          team1Name: home.name,
          team2Name: away.name,
          team1Players: home.players || [],
          team2Players: away.players || [],
          team1Score: null,
          team2Score: null,
          team1Vp: null,
          team2Vp: null,
          status: 'pending', // 'pending' | 'in_progress' | 'completed'
          gameId: null, // id della partita attiva collegata nel segnapunti
          winnerId: null, // teamId | 'tie' | null
          completedAt: null,
        });
      }
    }

    if (matches.length > 0) {
      rounds.push({
        roundNumber: roundIdx + 1,
        title: `Giornata ${roundIdx + 1}`,
        matches,
      });
    }

    // Rotazione Round-Robin: fissa il primo elemento e ruota gli altri in senso orario
    const fixed = currentRotation[0];
    const rotating = currentRotation.slice(1);
    const last = rotating.pop();
    rotating.unshift(last);
    currentRotation = [fixed, ...rotating];
  }

  return rounds;
}

/**
 * Calcola la classifica del torneo in base alle squadre e agli incontri completati.
 * Supporta due sistemi di punteggio:
 * - 'fibur' (Default): Sistema ufficiale Victory Points (10-10, 11-9, ..., 20-0 in base allo scarto smazzata)
 * - 'classic': Sistema calcistico classico (Vittoria: 3 pt, Pareggio: 1 pt, Sconfitta: 0 pt)
 * 
 * Ordinamento:
 * 1. Punti Torneo / Victory Points (DESC)
 * 2. Differenza Punti Burraco Match Points (PF - PS DESC)
 * 3. Punti Burraco realizzati (PF DESC)
 * 4. Vittorie (V DESC)
 * 5. Nome Alfabetico
 */
export function calculateTournamentStandings(teams = [], matches = [], scoringSystem = 'classic') {
  const isFibur = scoringSystem === 'fibur';
  const standingsMap = {};

  // Inizializza tutte le squadre iscritte
  (teams || []).forEach(team => {
    standingsMap[team.id] = {
      id: team.id,
      name: team.name,
      players: team.players || [],
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      tournamentPoints: 0,
      victoryPoints: 0,
      classicPoints: 0,
      pointsFor: 0,
      pointsAgainst: 0,
      pointDifference: 0,
    };
  });

  // Aggrega i risultati dei match completati o con punteggio
  (matches || []).forEach(match => {
    if (!match || match.status !== 'completed' || match.team1Score === null || match.team2Score === null) {
      return;
    }

    const t1 = standingsMap[match.team1Id];
    const t2 = standingsMap[match.team2Id];
    if (!t1 || !t2) return;

    const s1 = Number(match.team1Score) || 0;
    const s2 = Number(match.team2Score) || 0;

    t1.played += 1;
    t2.played += 1;
    t1.pointsFor += s1;
    t1.pointsAgainst += s2;
    t2.pointsFor += s2;
    t2.pointsAgainst += s1;

    // 1. Calcolo Victory Points FIBUR (su 20)
    const { team1Vp, team2Vp } = calculateFiburVictoryPoints(s1, s2);
    t1.victoryPoints += team1Vp;
    t2.victoryPoints += team2Vp;

    // 2. Calcolo Punti Classici (3-1-0)
    if (s1 > s2) {
      t1.won += 1;
      t1.classicPoints += 3;
      t2.lost += 1;
    } else if (s2 > s1) {
      t2.won += 1;
      t2.classicPoints += 3;
      t1.lost += 1;
    } else {
      t1.drawn += 1;
      t2.drawn += 1;
      t1.classicPoints += 1;
      t2.classicPoints += 1;
    }

    // Punti primari del torneo a seconda del sistema selezionato
    t1.tournamentPoints = isFibur ? t1.victoryPoints : t1.classicPoints;
    t2.tournamentPoints = isFibur ? t2.victoryPoints : t2.classicPoints;
  });

  // Calcola differenza punti e ordina
  const list = Object.values(standingsMap).map(item => ({
    ...item,
    pointDifference: item.pointsFor - item.pointsAgainst,
  }));

  list.sort((a, b) => {
    // 1. Punti torneo primari (VP o Classici)
    if (b.tournamentPoints !== a.tournamentPoints) {
      return b.tournamentPoints - a.tournamentPoints;
    }
    // 2. Differenza punti Burraco (Match Points)
    if (b.pointDifference !== a.pointDifference) {
      return b.pointDifference - a.pointDifference;
    }
    // 3. Punti fatti totali
    if (b.pointsFor !== a.pointsFor) {
      return b.pointsFor - a.pointsFor;
    }
    // 4. Numero vittorie
    if (b.won !== a.won) {
      return b.won - a.won;
    }
    // Alfabetico
    return a.name.localeCompare(b.name);
  });

  return list;
}

/**
 * Genera il testo formattato della classifica per condivisione WhatsApp o Appunti
 */
export function formatStandingsForSharing(tournament, standings = []) {
  if (!tournament || !Array.isArray(standings)) return '';
  const isFibur = tournament.scoringSystem !== 'classic';
  const unit = isFibur ? 'VP' : 'PT';

  const allMatches = (tournament.rounds || []).flatMap(r => r.matches || []);
  const completedMatches = allMatches.filter(m => m.status === 'completed').length;
  const totalMatches = allMatches.length;

  let text = `🏆 *CLASSIFICA TORNEO: ${tournament.name.toUpperCase()}*\n`;
  text += `📊 Incontri: ${completedMatches}/${totalMatches} conclusi • Formula: ${isFibur ? 'FIBUR (Victory Points)' : 'Classico (3-1-0)'}\n`;
  text += `🎯 Traguardo partite: ${tournament.targetScore || 2505} pt\n\n`;

  standings.forEach((team, idx) => {
    const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}°`;
    const diffSign = team.pointDifference > 0 ? `+${team.pointDifference.toLocaleString('it-IT')}` : `${team.pointDifference.toLocaleString('it-IT')}`;
    text += `${medal} *${team.name}*: *${team.tournamentPoints} ${unit}*\n`;
    if (team.players && team.players.length > 0) {
      text += `   👥 ${team.players.join(' & ')}\n`;
    }
    text += `   G:${team.played} (V:${team.won} N:${team.drawn} P:${team.lost}) | Diff: ${diffSign} pt (${team.pointsFor.toLocaleString('it-IT')} - ${team.pointsAgainst.toLocaleString('it-IT')})\n\n`;
  });

  text += `🃏 Generato con Burraco Score Tracker\nhttps://burraco-score-fedec.web.app`;
  return text;
}

/**
 * Genera il testo formattato del calendario e dei tavoli del torneo
 */
export function formatScheduleForSharing(tournament, roundNumber = null) {
  if (!tournament || !tournament.rounds) return '';
  const rounds = roundNumber 
    ? tournament.rounds.filter(r => r.roundNumber === Number(roundNumber))
    : tournament.rounds;

  let text = `🃏 *CALENDARIO TORNEO: ${tournament.name.toUpperCase()}*\n`;
  rounds.forEach(r => {
    text += `\n📍 *${r.title.toUpperCase()}*\n`;
    (r.matches || []).forEach(m => {
      const isCompleted = m.status === 'completed';
      const statusIcon = isCompleted ? '✅' : '⏳';
      const scoreText = isCompleted ? `[${m.team1Score} - ${m.team2Score}]` : 'vs';
      text += `• Tavolo ${m.tableNumber}: ${m.team1Name} ${scoreText} ${m.team2Name} ${statusIcon}\n`;
    });
  });
  text += `\nBurraco Score Tracker: https://burraco-score-fedec.web.app`;
  return text;
}

// ---------------- LOCAL STORAGE MANAGEMENT ----------------

export function getActiveTournament() {
  try {
    const raw = localStorage.getItem(TOURNAMENT_STORAGE_KEYS.ACTIVE);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveActiveTournament(tournament) {
  if (!tournament) {
    localStorage.removeItem(TOURNAMENT_STORAGE_KEYS.ACTIVE);
  } else {
    localStorage.setItem(TOURNAMENT_STORAGE_KEYS.ACTIVE, JSON.stringify(tournament));
  }
}

export function getTournamentsHistory() {
  try {
    const raw = localStorage.getItem(TOURNAMENT_STORAGE_KEYS.HISTORY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function archiveTournament(tournament) {
  if (!tournament) return [];
  const history = getTournamentsHistory();
  const completed = {
    ...tournament,
    status: 'completed',
    completedAt: new Date().toISOString(),
  };
  const updated = [completed, ...history.filter(t => t.id !== tournament.id)];
  localStorage.setItem(TOURNAMENT_STORAGE_KEYS.HISTORY, JSON.stringify(updated));
  return updated;
}

export function deleteTournamentFromHistory(tournamentId) {
  const history = getTournamentsHistory().filter(t => t.id !== tournamentId);
  localStorage.setItem(TOURNAMENT_STORAGE_KEYS.HISTORY, JSON.stringify(history));
  return history;
}
