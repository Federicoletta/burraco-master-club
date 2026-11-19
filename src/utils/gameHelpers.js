import {
  getGamesHistory,
  getHistoryKey,
  computeUserCareerStats,
  safeSetItem
} from '../utils/storage';
import { updateUserCareerStats } from '../services/firebase';
import { DEFAULT_TARGET_SCORE } from '../constants/burraco';

export function computeTeamTotalsAndWinner(rounds, mode, targetScore = DEFAULT_TARGET_SCORE, forceWinner = false) {
  const isTrio = mode === 'trio';
  let t1Total = 0;
  let t2Total = 0;
  let t3Total = 0;

  (rounds || []).forEach(r => {
    t1Total += Number(r?.team1Score) || 0;
    t2Total += Number(r?.team2Score) || 0;
    t3Total += Number(r?.team3Score) || 0;
  });

  const target = Number(targetScore) || DEFAULT_TARGET_SCORE;
  const isTargetReached = isTrio
    ? (t1Total >= target || t2Total >= target || t3Total >= target)
    : (t1Total >= target || t2Total >= target);

  let isTieAtTop = false;
  let leader = null;

  if (isTrio) {
    const maxScore = Math.max(t1Total, t2Total, t3Total);
    const leaders = [];
    if (t1Total === maxScore) leaders.push('team1');
    if (t2Total === maxScore) leaders.push('team2');
    if (t3Total === maxScore) leaders.push('team3');
    if (leaders.length === 1) {
      leader = leaders[0];
    } else {
      isTieAtTop = true;
    }
  } else {
    if (t1Total > t2Total) {
      leader = 'team1';
    } else if (t2Total > t1Total) {
      leader = 'team2';
    } else {
      isTieAtTop = true;
    }
  }

  const isTieAtTarget = isTargetReached && isTieAtTop;
  let winner = null;
  if ((isTargetReached && !isTieAtTarget) || (forceWinner && !isTieAtTop)) {
    winner = leader;
  }

  const isFinished = Boolean(isTargetReached && !isTieAtTarget && winner);

  return { t1Total, t2Total, t3Total, isTargetReached, isTieAtTarget, isFinished, winner };
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
