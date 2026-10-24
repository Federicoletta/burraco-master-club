import { describe, it, expect } from 'vitest';

/**
 * Funzione di utilità per costruire il roster unificato dei giocatori
 * (speculare alla logica in HomeLobby.jsx)
 */
function buildAvailableRoster(currentUser, friendsList, storedPlayers) {
  const list = [];
  const seenNames = new Set();

  if (currentUser) {
    const myName = currentUser.displayName || currentUser.email?.split('@')[0] || 'Tu';
    list.push({
      id: currentUser.uid,
      name: myName,
      email: currentUser.email,
      photoURL: currentUser.photoURL,
      isCurrentUser: true,
      isFriend: false,
      isCloseFriend: false,
    });
    seenNames.add(myName.toLowerCase());
    if (currentUser.email) seenNames.add(currentUser.email.toLowerCase());
  }

  (friendsList || []).forEach(f => {
    const name = f.displayName || f.email?.split('@')[0] || 'Amico';
    const keyName = name.toLowerCase();
    const keyEmail = (f.email || '').toLowerCase();
    if (!seenNames.has(keyName) && (!keyEmail || !seenNames.has(keyEmail))) {
      seenNames.add(keyName);
      if (keyEmail) seenNames.add(keyEmail);
      list.push({
        id: f.uid || f.id || `friend_${name}`,
        name,
        email: f.email,
        photoURL: f.photoURL,
        isCurrentUser: false,
        isFriend: true,
        isCloseFriend: Boolean(f.isCloseFriend),
        winRate: f.careerStats?.winRate
      });
    }
  });

  (storedPlayers || []).forEach((name, idx) => {
    const cleanName = String(name).trim();
    if (cleanName && !seenNames.has(cleanName.toLowerCase())) {
      seenNames.add(cleanName.toLowerCase());
      list.push({
        id: `stored_${idx}_${cleanName}`,
        name: cleanName,
        isCurrentUser: false,
        isFriend: false,
        isCloseFriend: false,
      });
    }
  });

  return list;
}

/**
 * Funzione di generazione partita rapida dalla lobby
 */
function createQuickGameFromLobby(selectedPlayers) {
  const count = selectedPlayers.length;
  if (count < 2) return null;

  let mode = 'pairs';
  let team1 = { name: 'Coppia 1', players: [] };
  let team2 = { name: 'Coppia 2', players: [] };
  let team3 = null;

  if (count === 2) {
    mode = 'singles';
    team1 = { name: selectedPlayers[0].name, players: [selectedPlayers[0].name] };
    team2 = { name: selectedPlayers[1].name, players: [selectedPlayers[1].name] };
  } else if (count === 3) {
    mode = 'trio';
    team1 = { name: selectedPlayers[0].name, players: [selectedPlayers[0].name] };
    team2 = { name: selectedPlayers[1].name, players: [selectedPlayers[1].name] };
    team3 = { name: selectedPlayers[2].name, players: [selectedPlayers[2].name] };
  } else {
    mode = 'pairs';
    const t1p1 = selectedPlayers[0].name;
    const t1p2 = selectedPlayers[1].name;
    const t2p1 = selectedPlayers[2].name;
    const t2p2 = selectedPlayers[3].name;

    team1 = { 
      name: `${t1p1} & ${t1p2}`, 
      players: [t1p1, t1p2] 
    };
    team2 = { 
      name: `${t2p1} & ${t2p2}`, 
      players: [t2p1, t2p2] 
    };
  }

  return {
    id: 'game_' + Date.now(),
    createdAt: new Date().toISOString(),
    mode,
    allowSemipulito: true,
    targetScore: 2005,
    team1,
    team2,
    ...(team3 ? { team3 } : {}),
    rounds: [],
    winner: null,
    isFinished: false,
  };
}

describe('HomeLobby & Quick Matchmaking Logic', () => {
  it('combina amici e giocatori salvati senza duplicazioni e posiziona l utente in cima', () => {
    const currentUser = { uid: 'u123', displayName: 'Federico', email: 'fede@test.com' };
    const friendsList = [
      { uid: 'f1', displayName: 'Marco', email: 'marco@test.com', isCloseFriend: true },
      { uid: 'f2', displayName: 'Anna', email: 'anna@test.com', isCloseFriend: false },
    ];
    const storedPlayers = ['Marco', 'Luca', 'Federico', 'Sofia']; // Marco e Federico sono già presenti

    const roster = buildAvailableRoster(currentUser, friendsList, storedPlayers);

    // Deve contenere: Federico (currentUser), Marco, Anna, Luca, Sofia (5 unici, no duplicati)
    expect(roster).toHaveLength(5);
    expect(roster[0].name).toBe('Federico');
    expect(roster[0].isCurrentUser).toBe(true);
    expect(roster.some(p => p.name === 'Marco' && p.isCloseFriend)).toBe(true);
    expect(roster.some(p => p.name === 'Luca')).toBe(true);
    expect(roster.some(p => p.name === 'Sofia')).toBe(true);
  });

  it('compone correttamente una partita a coppie (2 vs 2) con 4 giocatori', () => {
    const selected = [
      { name: 'Io' },
      { name: 'Marco' },
      { name: 'Anna' },
      { name: 'Luca' },
    ];

    const game = createQuickGameFromLobby(selected);
    expect(game).not.toBeNull();
    expect(game.mode).toBe('pairs');
    expect(game.team1.players).toEqual(['Io', 'Marco']);
    expect(game.team1.name).toBe('Io & Marco');
    expect(game.team2.players).toEqual(['Anna', 'Luca']);
    expect(game.team2.name).toBe('Anna & Luca');
    expect(game.targetScore).toBe(2005);
    expect(game.rounds).toHaveLength(0);
  });

  it('supporta lo scambio dei compagni di squadra (Inverti Coppie)', () => {
    const selected = [
      { name: 'P1' },
      { name: 'P2' },
      { name: 'P3' },
      { name: 'P4' },
    ];

    // Scambio slot 1 con slot 2 (P2 con P3)
    const swapped = [selected[0], selected[2], selected[1], selected[3]];

    const game = createQuickGameFromLobby(swapped);
    expect(game.team1.players).toEqual(['P1', 'P3']);
    expect(game.team2.players).toEqual(['P2', 'P4']);
  });

  it('compone automaticamente una sfida Singolo (1 vs 1) con 2 giocatori', () => {
    const selected = [{ name: 'Campione' }, { name: 'Sfidante' }];
    const game = createQuickGameFromLobby(selected);

    expect(game.mode).toBe('singles');
    expect(game.team1.players).toEqual(['Campione']);
    expect(game.team2.players).toEqual(['Sfidante']);
    expect(game.team3).toBeUndefined();
  });

  it('compone automaticamente una partita Burraco a Tre (Trio) con 3 giocatori', () => {
    const selected = [{ name: 'P1' }, { name: 'P2' }, { name: 'P3' }];
    const game = createQuickGameFromLobby(selected);

    expect(game.mode).toBe('trio');
    expect(game.team1.players).toEqual(['P1']);
    expect(game.team2.players).toEqual(['P2']);
    expect(game.team3).toBeDefined();
    expect(game.team3.players).toEqual(['P3']);
  });

  it('rifiuta la creazione se ci sono meno di 2 giocatori selezionati', () => {
    expect(createQuickGameFromLobby([])).toBeNull();
    expect(createQuickGameFromLobby([{ name: 'Solo Io' }])).toBeNull();
  });

  it('filtra correttamente il roster dei giocatori per ricerca testuale', () => {
    const roster = [
      { id: '1', name: 'Federico' },
      { id: '2', name: 'Francesca' },
      { id: '3', name: 'Marco' },
      { id: '4', name: 'Anna' }
    ];

    const filterRoster = (query) => {
      if (!query.trim()) return roster;
      const q = query.toLowerCase().trim();
      return roster.filter(p => p.name.toLowerCase().includes(q));
    };

    expect(filterRoster('f')).toHaveLength(2);
    expect(filterRoster('fra')).toHaveLength(1);
    expect(filterRoster('MARCO')).toHaveLength(1);
    expect(filterRoster('MARCO')[0].name).toBe('Marco');
    expect(filterRoster('inesistente')).toHaveLength(0);
    expect(filterRoster('')).toHaveLength(4);
  });

  it('consente la rimozione diretta di un giocatore per indice dello slot', () => {
    const selected = [
      { name: 'G1' },
      { name: 'G2' },
      { name: 'G3' },
      { name: 'G4' }
    ];

    const removeByIndex = (arr, index) => arr.filter((_, idx) => idx !== index);

    // Rimozione compagno (indice 1)
    const after1 = removeByIndex(selected, 1);
    expect(after1.map(p => p.name)).toEqual(['G1', 'G3', 'G4']);

    // Rimozione primo giocatore (indice 0)
    const after0 = removeByIndex(after1, 0);
    expect(after0.map(p => p.name)).toEqual(['G3', 'G4']);
  });
});
