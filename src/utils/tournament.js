// Gestione logica, calcoli e archivio per la modalità Torneo di Burraco

export const TOURNAMENT_STORAGE_KEYS = {
  ACTIVE: 'burraco_active_tournament_v1',
  HISTORY: 'burraco_tournaments_history_v1',
};

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
 * Calcola la classifica del torneo in base alle squadre e agli incontri completati
 * Regole:
 * - Vittoria: 3 pt
 * - Pareggio: 1 pt
 * - Sconfitta: 0 pt
 * Ordinamento:
 * 1. Punti Torneo (DESC)
 * 2. Differenza Punti Burraco (PF - PS DESC)
 * 3. Punti Burraco realizzati (PF DESC)
 * 4. Vittorie (V DESC)
 */
export function calculateTournamentStandings(teams = [], matches = []) {
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

    if (s1 > s2) {
      t1.won += 1;
      t1.tournamentPoints += 3;
      t2.lost += 1;
    } else if (s2 > s1) {
      t2.won += 1;
      t2.tournamentPoints += 3;
      t1.lost += 1;
    } else {
      // Pareggio: 1 punto ciascuna
      t1.drawn += 1;
      t2.drawn += 1;
      t1.tournamentPoints += 1;
      t2.tournamentPoints += 1;
    }
  });

  // Calcola differenza punti e ordina
  const list = Object.values(standingsMap).map(item => ({
    ...item,
    pointDifference: item.pointsFor - item.pointsAgainst,
  }));

  list.sort((a, b) => {
    // 1. Punti torneo
    if (b.tournamentPoints !== a.tournamentPoints) {
      return b.tournamentPoints - a.tournamentPoints;
    }
    // 2. Differenza punti Burraco
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
