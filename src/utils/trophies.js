/**
 * Sistema di Trofei, Obiettivi e Titoli Onorifici per i giocatori di Burraco
 */

export const TROPHY_RARITY = {
  COMMON: { label: 'Comune', color: 'bg-emerald-900/60 text-emerald-300 border-emerald-600/40' },
  RARE: { label: 'Raro', color: 'bg-blue-900/60 text-blue-300 border-blue-500/40' },
  EPIC: { label: 'Epico', color: 'bg-purple-900/60 text-purple-300 border-purple-500/40' },
  LEGENDARY: { label: 'Leggendario', color: 'bg-amber-900/60 text-amber-300 border-amber-400/50' },
};

export const TROPHY_DEFINITIONS = [
  {
    id: 'first_win',
    title: 'Battesimo della Vittoria',
    icon: '🥇',
    rarity: 'COMMON',
    description: 'Vinci la tua prima partita completa.',
    check: (stats) => {
      const current = stats.gamesWon || 0;
      return {
        unlocked: current >= 1,
        progress: Math.min(1, current),
        max: 1,
        progressText: `${Math.min(1, current)} / 1 vittoria`,
      };
    },
  },
  {
    id: 'veteran',
    title: 'Veterano del Tavolo',
    icon: '♠',
    rarity: 'COMMON',
    description: 'Disputa almeno 5 partite registrate sul tabellone.',
    check: (stats) => {
      const current = stats.gamesPlayed || 0;
      return {
        unlocked: current >= 5,
        progress: Math.min(5, current),
        max: 5,
        progressText: `${Math.min(5, current)} / 5 partite`,
      };
    },
  },
  {
    id: 'dirty_artist',
    title: 'Amico del Jolly',
    icon: '🃏',
    rarity: 'COMMON',
    description: 'Realizza almeno 5 Burrachi Sporchi o Semipuliti in carriera.',
    check: (stats) => {
      const current = (stats.dirtyBurrachi || 0) + (stats.semiCleanBurrachi || 0);
      return {
        unlocked: current >= 5,
        progress: Math.min(5, current),
        max: 5,
        progressText: `${Math.min(5, current)} / 5 burrachi`,
      };
    },
  },
  {
    id: 'record_hand',
    title: 'Mano da Record',
    icon: '🌟',
    rarity: 'RARE',
    description: 'Totalizza più di 600 punti in una singola mano (smazzata).',
    check: (stats) => {
      const best = stats.bestHandScore || 0;
      return {
        unlocked: best >= 600,
        progress: Math.min(600, best),
        max: 600,
        progressText: `${best} / 600 pt`,
      };
    },
  },
  {
    id: 'sniper',
    title: 'Il Cecchino',
    icon: '🎯',
    rarity: 'RARE',
    description: 'Vinci una partita superando la soglia con un margine inferiore a 100 pt.',
    check: (stats, games) => {
      let found = false;
      games.forEach(g => {
        if (!g.isFinished) return;
        const isT1 = (g.team1?.players || []).includes(stats.name);
        const isT2 = (g.team2?.players || []).includes(stats.name);
        if (!isT1 && !isT2) return;

        const won = (isT1 && g.winner === 'team1') || (isT2 && g.winner === 'team2');
        if (won) {
          const target = g.targetScore || 2005;
          const t1Total = (g.rounds || []).reduce((acc, r) => acc + (r.team1Score || 0), 0);
          const t2Total = (g.rounds || []).reduce((acc, r) => acc + (r.team2Score || 0), 0);
          const winnerTotal = isT1 ? t1Total : t2Total;
          if (winnerTotal >= target && (winnerTotal - target) < 100) {
            found = true;
          }
        }
      });
      return {
        unlocked: found,
        progress: found ? 1 : 0,
        max: 1,
        progressText: found ? 'Conquistato!' : '0 / 1 vittoria precisa',
      };
    },
  },
  {
    id: 'pozzetto_shield',
    title: 'Pozzetto Express',
    icon: '⚡',
    rarity: 'RARE',
    description: 'Vinci una partita senza aver mai subito la penalità del pozzetto non preso.',
    check: (stats, games) => {
      let found = false;
      games.forEach(g => {
        if (!g.isFinished) return;
        const isT1 = (g.team1?.players || []).includes(stats.name);
        const isT2 = (g.team2?.players || []).includes(stats.name);
        if (!isT1 && !isT2) return;
        const won = (isT1 && g.winner === 'team1') || (isT2 && g.winner === 'team2');
        if (!won) return;

        // Verifica che in nessun round abbia avuto penalità pozzetto
        const teamKey = isT1 ? 'team1Details' : 'team2Details';
        const hadPenalty = (g.rounds || []).some(r => {
          const details = r[teamKey];
          return details && (details.pozzetto === 'non_preso' || details.pozzetto === 'preso_non_giocato');
        });

        if (!hadPenalty && (g.rounds || []).length > 0) {
          found = true;
        }
      });
      return {
        unlocked: found,
        progress: found ? 1 : 0,
        max: 1,
        progressText: found ? 'Conquistato!' : '0 / 1 partita pulita',
      };
    },
  },
  {
    id: 'clean_master',
    title: 'Maniaco del Pulito',
    icon: '💎',
    rarity: 'EPIC',
    description: 'Realizza almeno 10 Burrachi Puliti in carriera.',
    check: (stats) => {
      const current = stats.cleanBurrachi || 0;
      return {
        unlocked: current >= 10,
        progress: Math.min(10, current),
        max: 10,
        progressText: `${Math.min(10, current)} / 10 puliti`,
      };
    },
  },
  {
    id: 'closer_expert',
    title: 'Mastro di Chiusura',
    icon: '🔒',
    rarity: 'EPIC',
    description: 'Effettua almeno 5 chiusure di mano decisive.',
    check: (stats) => {
      const current = stats.closures || 0;
      return {
        unlocked: current >= 5,
        progress: Math.min(5, current),
        max: 5,
        progressText: `${Math.min(5, current)} / 5 chiusure`,
      };
    },
  },
  {
    id: 'point_millionaire',
    title: 'Collezionista di Punti',
    icon: '💰',
    rarity: 'EPIC',
    description: 'Raggiungi una somma totale di oltre 5.000 punti in carriera.',
    check: (stats) => {
      const current = stats.totalPoints || 0;
      return {
        unlocked: current >= 5000,
        progress: Math.min(5000, current),
        max: 5000,
        progressText: `${current.toLocaleString('it-IT')} / 5.000 pt`,
      };
    },
  },
  {
    id: 'win_streak',
    title: 'Inarrestabile',
    icon: '🔥',
    rarity: 'EPIC',
    description: 'Ottieni almeno 3 vittorie con una percentuale di vittoria >= 60%.',
    check: (stats) => {
      const won = stats.gamesWon || 0;
      const rate = stats.winRate || 0;
      const unlocked = won >= 3 && rate >= 60;
      return {
        unlocked,
        progress: Math.min(3, won),
        max: 3,
        progressText: `${won} vittorie (${rate}% win rate)`,
      };
    },
  },
  {
    id: 'table_king',
    title: 'Re del Burraco',
    icon: '👑',
    rarity: 'LEGENDARY',
    description: 'Vinci almeno 5 partite complete archiviate.',
    check: (stats) => {
      const current = stats.gamesWon || 0;
      return {
        unlocked: current >= 5,
        progress: Math.min(5, current),
        max: 5,
        progressText: `${Math.min(5, current)} / 5 vittorie`,
      };
    },
  },
  {
    id: 'comeback_hero',
    title: 'Rimonta Impossibile',
    icon: '🧗',
    rarity: 'LEGENDARY',
    description: 'Vinci una partita dopo essere stato in svantaggio di almeno 300 punti.',
    check: (stats, games) => {
      let found = false;
      games.forEach(g => {
        if (!g.isFinished) return;
        const isT1 = (g.team1?.players || []).includes(stats.name);
        const isT2 = (g.team2?.players || []).includes(stats.name);
        if (!isT1 && !isT2) return;
        const won = (isT1 && g.winner === 'team1') || (isT2 && g.winner === 'team2');
        if (!won) return;

        // Controlla se durante la partita è mai stato sotto di 300 pt
        let rT1 = 0;
        let rT2 = 0;
        let wasDeficit300 = false;
        (g.rounds || []).forEach(r => {
          rT1 += r.team1Score || 0;
          rT2 += r.team2Score || 0;
          const myScore = isT1 ? rT1 : rT2;
          const oppScore = isT1 ? rT2 : rT1;
          if (oppScore - myScore >= 300) {
            wasDeficit300 = true;
          }
        });
        if (wasDeficit300) {
          found = true;
        }
      });
      return {
        unlocked: found,
        progress: found ? 1 : 0,
        max: 1,
        progressText: found ? 'Conquistato!' : '0 / 1 rimonta storica',
      };
    },
  },
];

/**
 * Calcola il titolo onorifico del giocatore in base alle sue statistiche e trofei sbloccati
 */
export function getPlayerTitle(stats, unlockedTrophiesCount = 0) {
  if (!stats) return { title: 'Giocatore di Burraco', icon: '♠', rank: 'Principiante' };

  if (unlockedTrophiesCount >= 8 || stats.gamesWon >= 8) {
    return { title: 'Leggenda Vivente del Tavolo', icon: '👑', rank: 'Leggendario' };
  }
  if (stats.cleanBurrachi >= 15) {
    return { title: 'Signore del Burraco Pulito', icon: '💎', rank: 'Maestro' };
  }
  if (stats.winRate >= 70 && stats.gamesPlayed >= 3) {
    return { title: 'Il Castigatore', icon: '⚔️', rank: 'Campione' };
  }
  if (stats.closures >= 8) {
    return { title: 'Re della Chiusura', icon: '🔒', rank: 'Specialista' };
  }
  if (stats.bestHandScore >= 700) {
    return { title: 'Mano d\'Oro', icon: '✨', rank: 'Fuoriclasse' };
  }
  if ((stats.semiCleanBurrachi || 0) >= 6) {
    return { title: 'Mastro della Pinella', icon: '🃏', rank: 'Esperto' };
  }
  if (stats.gamesPlayed >= 6) {
    return { title: 'Veterano del Club', icon: '🎖️', rank: 'Veterano' };
  }
  if (stats.gamesWon >= 2) {
    return { title: 'Stratega del Pozzetto', icon: '⚡', rank: 'Affermato' };
  }
  if (stats.gamesPlayed >= 1) {
    return { title: 'Promessa del Burraco', icon: '🌱', rank: 'In Ascesa' };
  }

  return { title: 'Debuttante al Tavolo', icon: '🃏', rank: 'Nuovo' };
}

/**
 * Calcola tutti i trofei sbloccati e in corso per un singolo giocatore
 */
export function calculatePlayerTrophies(playerStats, allGames = []) {
  if (!playerStats) return { list: [], unlockedCount: 0, totalCount: TROPHY_DEFINITIONS.length, title: {} };

  const evaluated = TROPHY_DEFINITIONS.map(def => {
    const result = def.check(playerStats, allGames);
    return {
      ...def,
      rarityInfo: TROPHY_RARITY[def.rarity] || TROPHY_RARITY.COMMON,
      unlocked: result.unlocked,
      progress: result.progress,
      max: result.max,
      progressText: result.progressText,
      percent: Math.min(100, Math.round((result.progress / result.max) * 100)),
    };
  });

  const unlockedCount = evaluated.filter(t => t.unlocked).length;
  const titleInfo = getPlayerTitle(playerStats, unlockedCount);

  return {
    list: evaluated,
    unlockedCount,
    totalCount: evaluated.length,
    percentTotal: Math.round((unlockedCount / evaluated.length) * 100),
    titleInfo,
  };
}
