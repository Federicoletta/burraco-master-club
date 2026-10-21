/**
 * Stateless Game / Paracadute d'Emergenza
 * 
 * Permette di serializzare l'intera partita in un token compatto Base64 UTF-8
 * incorporabile direttamente nel frammento hash dell'URL (#backup=...).
 * 
 * In questo modo una partita può essere salvata in un messaggio WhatsApp,
 * inviata via email o salvata nei segnalibri, e ripristinata al 100%
 * senza dipendere da cookie, cache locale o connessione al database.
 */

/**
 * Codifica una partita in un token compatto
 */
export function encodeGameToUrlToken(game) {
  if (!game || !game.id) return null;
  
  const payload = {
    v: 1,
    id: game.id,
    m: game.mode || 'pairs',
    s: Boolean(game.allowSemipulito),
    t: Number(game.targetScore) || 2005,
    t1: {
      n: game.team1?.name || 'Coppia 1',
      p: game.team1?.players || []
    },
    t2: {
      n: game.team2?.name || 'Coppia 2',
      p: game.team2?.players || []
    },
    t3: game.team3 ? {
      n: game.team3?.name || 'Giocatore 3',
      p: game.team3?.players || []
    } : null,
    r: (game.rounds || []).map(r => ({
      rn: r.roundNumber,
      s1: r.team1Score || 0,
      s2: r.team2Score || 0,
      s3: r.team3Score || 0,
      t1p: r.team1Points || 0,
      t2p: r.team2Points || 0,
      t3p: r.team3Points || 0,
      lp: r.lonePlayer || null,
      em: r.entryMode || 'detailed',
      d1: r.team1Details || null,
      d2: r.team2Details || null,
      d3: r.team3Details || null,
      by: r.recordedBy || null
    })),
    w: game.winner || null,
    fin: Boolean(game.isFinished),
    lh: game.ledgerLastHash || null,
    ts: game.createdAt || new Date().toISOString()
  };

  try {
    const jsonStr = JSON.stringify(payload);
    // Codifica UTF-8 sicura per Base64 compatibile sia con browser che con Node/Vitest
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(jsonStr, 'utf-8').toString('base64');
    }
    const utf8Bytes = encodeURIComponent(jsonStr).replace(/%([0-9A-F]{2})/g, (_, p1) =>
      String.fromCharCode('0x' + p1)
    );
    return btoa(utf8Bytes);
  } catch (err) {
    console.warn('[statelessGame] Errore codifica token:', err);
    return null;
  }
}

/**
 * Decodifica una partita da un token compatto
 */
export function decodeGameFromUrlToken(token) {
  if (!token || typeof token !== 'string') return null;
  try {
    const cleanToken = token.trim().replace(/^#backup=/, '').replace(/^backup=/, '');
    let jsonStr = '';

    if (typeof Buffer !== 'undefined') {
      jsonStr = Buffer.from(cleanToken, 'base64').toString('utf-8');
    } else {
      const binaryStr = atob(cleanToken);
      jsonStr = decodeURIComponent(
        Array.from(binaryStr)
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
    }

    const data = JSON.parse(jsonStr);
    if (!data || !data.id || !data.t1 || !data.t2) return null;

    const game = {
      id: data.id,
      createdAt: data.ts || new Date().toISOString(),
      mode: data.m || 'pairs',
      allowSemipulito: Boolean(data.s),
      targetScore: Number(data.t) || 2005,
      team1: {
        name: data.t1.n || 'Coppia 1',
        players: Array.isArray(data.t1.p) ? data.t1.p : []
      },
      team2: {
        name: data.t2.n || 'Coppia 2',
        players: Array.isArray(data.t2.p) ? data.t2.p : []
      },
      team3: data.t3 ? {
        name: data.t3.n || 'Giocatore 3',
        players: Array.isArray(data.t3.p) ? data.t3.p : []
      } : null,
      rounds: (data.r || []).map(r => ({
        roundNumber: r.rn,
        team1Score: r.s1,
        team2Score: r.s2,
        team3Score: r.s3,
        team1Points: r.t1p,
        team2Points: r.t2p,
        team3Points: r.t3p,
        lonePlayer: r.lp,
        entryMode: r.em,
        team1Details: r.d1,
        team2Details: r.d2,
        team3Details: r.d3,
        recordedBy: r.by
      })),
      winner: data.w || null,
      isFinished: Boolean(data.fin),
      ledgerLastHash: data.lh || null
    };

    return game;
  } catch (err) {
    console.warn('[statelessGame] Errore decodifica token:', err);
    return null;
  }
}

/**
 * Genera il link completo contenente il token di backup
 */
export function generateStatelessGameShareUrl(game, baseUrl = '') {
  const token = encodeGameToUrlToken(game);
  if (!token) return '';
  const origin = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
  return `${origin}#backup=${token}`;
}
