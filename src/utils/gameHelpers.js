import {
  getGamesHistory,
  getHistoryKey,
  computeUserCareerStats,
  safeSetItem
} from '../utils/storage';
import { updateUserCareerStats } from '../services/firebase';
import {
  appendBlock,
  migrateLegacyGameToLedger
} from '../utils/ledger';

export function computeTeamTotalsAndWinner(rounds, mode, targetScore = 2505, forceWinner = false) {
  const isTrio = mode === 'trio';
  let t1Total = 0;
  let t2Total = 0;
  let t3Total = 0;

  (rounds || []).forEach(r => {
    t1Total += Number(r?.team1Score) || 0;
    t2Total += Number(r?.team2Score) || 0;
    t3Total += Number(r?.team3Score) || 0;
  });

  const target = Number(targetScore) || 2505;
  const isTargetReached = isTrio
    ? (t1Total >= target || t2Total >= target || t3Total >= target)
    : (t1Total >= target || t2Total >= target);

  let winner = null;
  if (isTargetReached || forceWinner) {
    if (isTrio) {
      if (t1Total >= t2Total && t1Total >= t3Total) winner = 'team1';
      else if (t2Total >= t1Total && t2Total >= t3Total) winner = 'team2';
      else winner = 'team3';
    } else {
      winner = t1Total >= t2Total ? 'team1' : 'team2';
    }
  }

  return { t1Total, t2Total, t3Total, isTargetReached, winner };
}

export function appendLedgerEvent(game, eventType, payload, author) {
  let chain = null;
  try {
    chain = migrateLegacyGameToLedger(game, author);
    if (chain) {
      chain = appendBlock(chain, eventType, payload, author);
    }
  } catch (chainErr) {
    console.warn(`Avviso registrazione blocco ledger (${eventType}):`, chainErr);
  }
  return {
    ledgerChain: chain || game?.ledgerChain || null,
    ledgerLastHash: chain && chain.length > 0 ? chain[chain.length - 1].hash : (game?.ledgerLastHash || null),
  };
}

export function upsertHistoryGame(userKey, game, setGamesHistory) {
  try {
    const history = getGamesHistory(userKey);
    const hIndex = history.findIndex(g => g?.id === game.id);
    if (hIndex >= 0) {
      const newHistory = [...history];
      newHistory[hIndex] = game;
      safeSetItem(getHistoryKey(userKey), JSON.stringify(newHistory));
      setGamesHistory(newHistory);
      return newHistory;
    }
  } catch (histErr) {
    console.warn('Errore salvataggio storico locale:', histErr);
  }
  return null;
}

export function updateCareerStatsInBackground(user, updatedHistory, targetGame) {
  if (!user?.uid) return;
  const stats = computeUserCareerStats(user, updatedHistory, targetGame);
  if (stats) {
    updateUserCareerStats(user.uid, stats).catch(err => {
      console.warn('Avviso aggiornamento careerStats cloud:', err);
    });
  }
}
