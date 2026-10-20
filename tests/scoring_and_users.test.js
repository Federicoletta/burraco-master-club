import { describe, it, expect } from 'vitest';
import {
  calculateCardsPoints,
  calculateTeamRoundScore,
  HONOR_POINTS,
  CARD_VALUES,
} from '../src/constants/burraco';
import {
  calculatePlayerStats,
  computeUserCareerStats,
} from '../src/utils/storage';
import { sanitizeForFirestore } from '../src/services/firebase';

describe('Motore di Calcolo Punteggi - Scoring Engine', () => {
  it('calcola correttamente i valori individuali di tutte le carte', () => {
    expect(calculateCardsPoints({ jolly: 1 })).toBe(CARD_VALUES.jolly.points);     // 30
    expect(calculateCardsPoints({ pinella: 1 })).toBe(CARD_VALUES.pinella.points); // 20
    expect(calculateCardsPoints({ asso: 1 })).toBe(CARD_VALUES.asso.points);       // 15
    expect(calculateCardsPoints({ alte: 1 })).toBe(CARD_VALUES.alte.points);       // 10
    expect(calculateCardsPoints({ basse: 1 })).toBe(CARD_VALUES.basse.points);     // 5
  });

  it('calcola combinazioni complesse di carte a terra e in mano', () => {
    const tableCounts = {
      jolly: 2,   // 60
      pinella: 3, // 60
      asso: 4,    // 60
      alte: 10,   // 100
      basse: 8,   // 40
    };
    expect(calculateCardsPoints(tableCounts)).toBe(320);

    const handCounts = {
      pinella: 1, // 20
      alte: 2,    // 20
      basse: 4,   // 20
    };
    expect(calculateCardsPoints(handCounts)).toBe(60);

    // Mano con onori + carte a terra - carte in mano
    const roundDetails = {
      burracoPulito: 1,      // +200
      burracoSemipulito: 1,  // +150
      burracoSporco: 1,      // +100
      chiusura: true,        // +100
      cardsOnTableCount: tableCounts, // +320
      cardsInHandCount: handCounts,   // -60
    };
    // 200 + 150 + 100 + 100 + 320 - 60 = 810
    expect(calculateTeamRoundScore(roundDetails)).toBe(810);
  });

  it('gestisce penalità pozzetto (non preso / preso non giocato)', () => {
    // Pozzetto non preso
    const detailsNonPreso = {
      burracoSporco: 1, // +100
      pozzetto: 'non_preso', // -100
      cardsOnTableDirect: 80,
      cardsInHandDirect: 30,
    };
    // 100 - 100 + 80 - 30 = 50
    expect(calculateTeamRoundScore(detailsNonPreso)).toBe(50);

    // Pozzetto preso non giocato
    const detailsPresoNonGiocato = {
      pozzetto: 'preso_non_giocato', // -100
      cardsOnTableDirect: 0,
      cardsInHandDirect: 100, // paga carte in mano
    };
    // -100 + 0 - 100 = -200
    expect(calculateTeamRoundScore(detailsPresoNonGiocato)).toBe(-200);
  });

  it('supporta inserimento manuale rapido sia positivo che negativo', () => {
    expect(calculateTeamRoundScore({ manualMode: true, manualScore: '540' })).toBe(540);
    expect(calculateTeamRoundScore({ manualMode: true, manualScore: '-150' })).toBe(-150);
    expect(calculateTeamRoundScore({ manualMode: true, manualScore: '0' })).toBe(0);
    expect(calculateTeamRoundScore({ manualMode: true, manualScore: '' })).toBe(0);
  });
});

describe('Assegnazione Statistiche Giocatori per Modalità di Gioco', () => {
  it('modalità Singoli (1 vs 1): attribuisce correttamente punti e vittorie a ciascun giocatore', () => {
    const players = ['Marco', 'Matteo'];
    const game = {
      id: 'game_singles_1',
      mode: 'singles',
      isFinished: true,
      winner: 'team1',
      team1: { name: 'Marco', players: ['Marco'] },
      team2: { name: 'Matteo', players: ['Matteo'] },
      rounds: [
        {
          team1Score: 400,
          team2Score: 150,
          team1Details: { burracoPulito: 1, chiusura: true },
          team2Details: { burracoSporco: 1 },
        },
        {
          team1Score: 650,
          team2Score: 200,
          team1Details: { burracoPulito: 2, burracoSemipulito: 1 },
          team2Details: { chiusura: true },
        },
      ],
    };

    const stats = calculatePlayerStats(players, [game]);
    const marco = stats.find(p => p.name === 'Marco');
    const matteo = stats.find(p => p.name === 'Matteo');

    expect(marco).toBeDefined();
    expect(marco.gamesPlayed).toBe(1);
    expect(marco.gamesWon).toBe(1);
    expect(marco.gamesLost).toBe(0);
    expect(marco.totalPoints).toBe(1050); // 400 + 650
    expect(marco.winRate).toBe(100);
    expect(marco.cleanBurrachi).toBe(3);
    expect(marco.semiCleanBurrachi).toBe(1);
    expect(marco.closures).toBe(1);
    expect(marco.bestHandScore).toBe(650);

    expect(matteo).toBeDefined();
    expect(matteo.gamesPlayed).toBe(1);
    expect(matteo.gamesWon).toBe(0);
    expect(matteo.gamesLost).toBe(1);
    expect(matteo.totalPoints).toBe(350); // 150 + 200
    expect(matteo.winRate).toBe(0);
    expect(matteo.dirtyBurrachi).toBe(1);
    expect(matteo.closures).toBe(1);
  });

  it('modalità Coppie (2 vs 2): assegna i punti ed i burrachi a entrambi i membri della coppia', () => {
    const players = ['Alice', 'Bob', 'Carlo', 'Diana'];
    const game = {
      id: 'game_pairs_1',
      mode: 'pairs',
      isFinished: true,
      winner: 'team1',
      team1: { name: 'Coppia A', players: ['Alice', 'Bob'] },
      team2: { name: 'Coppia B', players: ['Carlo', 'Diana'] },
      rounds: [
        {
          team1Score: 500,
          team2Score: 300,
          team1Details: { burracoPulito: 1, burracoSporco: 2, chiusura: true },
          team2Details: { burracoSemipulito: 1 },
        },
      ],
    };

    const stats = calculatePlayerStats(players, [game]);
    const alice = stats.find(p => p.name === 'Alice');
    const bob = stats.find(p => p.name === 'Bob');
    const carlo = stats.find(p => p.name === 'Carlo');
    const diana = stats.find(p => p.name === 'Diana');

    // Entrambi i membri della coppia 1 ricevono 500 pt e la vittoria
    expect(alice.totalPoints).toBe(500);
    expect(bob.totalPoints).toBe(500);
    expect(alice.gamesWon).toBe(1);
    expect(bob.gamesWon).toBe(1);
    expect(alice.cleanBurrachi).toBe(1);
    expect(bob.cleanBurrachi).toBe(1);
    expect(alice.dirtyBurrachi).toBe(2);
    expect(bob.dirtyBurrachi).toBe(2);

    // Entrambi i membri della coppia 2 ricevono 300 pt e la sconfitta
    expect(carlo.totalPoints).toBe(300);
    expect(diana.totalPoints).toBe(300);
    expect(carlo.gamesLost).toBe(1);
    expect(diana.gamesLost).toBe(1);
    expect(carlo.semiCleanBurrachi).toBe(1);
    expect(diana.semiCleanBurrachi).toBe(1);
  });

  it('modalità Trio (3 giocatori): assegna punti individuali a tutte e 3 le rotazioni', () => {
    const players = ['Giocatore A', 'Giocatore B', 'Giocatore C'];
    const game = {
      id: 'game_trio_1',
      mode: 'trio',
      isFinished: true,
      winner: 'team3', // Vince Giocatore C
      team1: { name: 'Giocatore A', players: ['Giocatore A'] },
      team2: { name: 'Giocatore B', players: ['Giocatore B'] },
      team3: { name: 'Giocatore C', players: ['Giocatore C'] },
      rounds: [
        // Smazzata 1: A è solitario (team1), fa 400. B e C coppia, fanno 200 ciascuno
        {
          team1Score: 400,
          team2Score: 200,
          team3Score: 200,
          team1Details: { burracoPulito: 1, chiusura: true },
          team2Details: { burracoSporco: 1 },
          team3Details: { burracoSporco: 1 },
        },
        // Smazzata 2: C è solitario (team3), fa 850. A e B coppia, fanno 100 ciascuno
        {
          team1Score: 100,
          team2Score: 100,
          team3Score: 850,
          team1Details: {},
          team2Details: {},
          team3Details: { burracoPulito: 2, chiusura: true },
        },
      ],
    };

    const stats = calculatePlayerStats(players, [game]);
    const a = stats.find(p => p.name === 'Giocatore A');
    const b = stats.find(p => p.name === 'Giocatore B');
    const c = stats.find(p => p.name === 'Giocatore C');

    // Totale A: 400 + 100 = 500
    expect(a.totalPoints).toBe(500);
    expect(a.gamesLost).toBe(1);
    expect(a.cleanBurrachi).toBe(1);
    expect(a.closures).toBe(1);

    // Totale B: 200 + 100 = 300
    expect(b.totalPoints).toBe(300);
    expect(b.gamesLost).toBe(1);
    expect(b.dirtyBurrachi).toBe(1);

    // Totale C: 200 + 850 = 1050 (Vincitore del trio)
    expect(c.totalPoints).toBe(1050);
    expect(c.gamesWon).toBe(1);
    expect(c.gamesLost).toBe(0);
    expect(c.cleanBurrachi).toBe(2);
    expect(c.dirtyBurrachi).toBe(1);
    expect(c.bestHandScore).toBe(850);
  });
});

describe('Statistiche di Carriera Utente Autenticato - computeUserCareerStats', () => {
  it('riconosce l\'utente autenticato per nome completo, email, UID o alias "Tu"', () => {
    const user = {
      uid: 'auth_usr_999',
      displayName: 'Federico Coletta',
      email: 'fedecoletta@gmail.com',
    };

    // Partita 1: utente inserito con nome "Federico"
    const game1 = {
      id: 'g1',
      isFinished: true,
      winner: 'team1',
      team1: { name: 'Federico', players: ['Federico'] },
      team2: { name: 'Avversario', players: ['Avversario'] },
      rounds: [{ team1Score: 500, team2Score: 200, team1Details: { burracoPulito: 1, chiusura: true } }],
    };

    // Partita 2: utente inserito con alias di default "Tu"
    const game2 = {
      id: 'g2',
      isFinished: true,
      winner: 'team1',
      team1: { name: 'Tu & Partner', players: ['Tu', 'Partner'] },
      team2: { name: 'Loro', players: ['Loro1', 'Loro2'] },
      rounds: [{ team1Score: 600, team2Score: 100, team1Details: { burracoSporco: 2 } }],
    };

    // Partita 3: utente inserito con oggetto completo contenente email o UID
    const game3 = {
      id: 'g3',
      isFinished: true,
      winner: 'team2', // Persa da team 1
      team1: { name: 'Noi', players: [{ uid: 'auth_usr_999', name: 'Fede' }] },
      team2: { name: 'Vincitori', players: ['Vincitore'] },
      rounds: [{ team1Score: 300, team2Score: 700 }],
    };

    const stats = computeUserCareerStats(user, [game1, game2, game3]);
    expect(stats).toBeDefined();
    expect(stats.gamesPlayed).toBe(3);
    expect(stats.gamesWon).toBe(2);
    expect(stats.gamesLost).toBe(1);
    expect(stats.winRate).toBe(67); // Math.round(2/3 * 100) = 67%
    expect(stats.totalPoints).toBe(1400); // 500 + 600 + 300 = 1400
    expect(stats.cleanBurrachi).toBe(1);
    expect(stats.dirtyBurrachi).toBe(2);
    expect(stats.closures).toBe(1);
    expect(stats.bestHandScore).toBe(600);
  });

  it('ordina gli Amici Stretti ⭐ in cima rispetto agli amici normali', () => {
    const rawFriends = [
      { uid: 'u1', displayName: 'Zaira', email: 'zaira@test.com' },
      { uid: 'u2', displayName: 'Alessandro', email: 'alessandro@test.com' },
      { uid: 'u3', displayName: 'Marco', email: 'marco@test.com' },
    ];
    const closeFriendsUids = ['u3']; // Marco è amico stretto

    const sorted = rawFriends.map(f => ({
      ...f,
      isCloseFriend: closeFriendsUids.includes(f.uid)
    })).sort((a, b) => {
      if (a.isCloseFriend && !b.isCloseFriend) return -1;
      if (!a.isCloseFriend && b.isCloseFriend) return 1;
      return (a.displayName || a.email || '').localeCompare(b.displayName || b.email || '');
    });

    expect(sorted[0].displayName).toBe('Marco');
    expect(sorted[0].isCloseFriend).toBe(true);
    expect(sorted[1].displayName).toBe('Alessandro');
    expect(sorted[1].isCloseFriend).toBe(false);
    expect(sorted[2].displayName).toBe('Zaira');
    expect(sorted[2].isCloseFriend).toBe(false);
  });

  it('inserisce direttamente gli Amici Stretti in playerUids e invia inviti solo agli amici normali', () => {
    const currentUser = { uid: 'host_123', email: 'host@test.com', displayName: 'Fede' };
    const friendsList = [
      { uid: 'close_1', displayName: 'Moglie', email: 'moglie@test.com', isCloseFriend: true },
      { uid: 'norm_2', displayName: 'Collega', email: 'collega@test.com', isCloseFriend: false },
    ];
    const allPlayersInGame = ['Moglie', 'Collega'];

    const registeredPlayerUids = [currentUser.uid];
    const pendingInviteFriends = [];

    friendsList.forEach(friend => {
      const friendName = friend.displayName || friend.email;
      const isInGame = allPlayersInGame.some(p => p.toLowerCase() === friendName.toLowerCase());
      if (isInGame) {
        if (friend.isCloseFriend) {
          registeredPlayerUids.push(friend.uid);
        } else {
          pendingInviteFriends.push(friend);
        }
      }
    });

    // Amico Stretto entra subito
    expect(registeredPlayerUids).toContain('close_1');
    // Amico Normale NON entra subito ma richiede invito
    expect(registeredPlayerUids).not.toContain('norm_2');
    expect(pendingInviteFriends.length).toBe(1);
    expect(pendingInviteFriends[0].uid).toBe('norm_2');
  });
});
