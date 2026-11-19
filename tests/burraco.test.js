import { describe, it, expect } from 'vitest';
import {
  calculateCardsPoints,
  calculateTeamRoundScore,
  calculateTrioPairSplitScore,
  MIN_TARGET_SCORE,
  MAX_TARGET_SCORE,
  DEFAULT_TARGET_SCORE,
  DEFAULT_TARGET_SCORES,
  validateTargetScore,
} from '../src/constants/burraco';
import { computeRoundDisplayScores, DEFAULT_ENTITY } from '../src/components/round/roundUtils';
import { computeTeamTotalsAndWinner } from '../src/utils/gameHelpers';

describe('Burraco Engine - calculateCardsPoints', () => {
  it('returns 0 for null, undefined or empty counts', () => {
    expect(calculateCardsPoints(null)).toBe(0);
    expect(calculateCardsPoints(undefined)).toBe(0);
    expect(calculateCardsPoints({})).toBe(0);
  });

  it('correctly calculates single card types', () => {
    expect(calculateCardsPoints({ jolly: 1 })).toBe(30);
    expect(calculateCardsPoints({ pinella: 1 })).toBe(20);
    expect(calculateCardsPoints({ asso: 1 })).toBe(15);
    expect(calculateCardsPoints({ alte: 1 })).toBe(10);
    expect(calculateCardsPoints({ basse: 1 })).toBe(5);
  });

  it('correctly calculates mixed hand of cards', () => {
    const counts = {
      jolly: 2,   // 2 * 30 = 60
      pinella: 1, // 1 * 20 = 20
      asso: 2,    // 2 * 15 = 30
      alte: 4,    // 4 * 10 = 40
      basse: 5,   // 5 * 5  = 25
    };
    expect(calculateCardsPoints(counts)).toBe(175);
  });
});

describe('Burraco Engine - calculateTeamRoundScore', () => {
  it('returns 0 for null or undefined details', () => {
    expect(calculateTeamRoundScore(null)).toBe(0);
    expect(calculateTeamRoundScore(undefined)).toBe(0);
  });

  it('handles manual score entry correctly', () => {
    expect(calculateTeamRoundScore({ manualMode: true, manualScore: '350' })).toBe(350);
    expect(calculateTeamRoundScore({ manualMode: true, manualScore: '-120' })).toBe(-120);
    expect(calculateTeamRoundScore({ manualMode: true, manualScore: '' })).toBe(0);
  });

  it('calculates honors correctly (burrachi and chiusura)', () => {
    const details = {
      burracoPulito: 1,      // +200
      burracoSemipulito: 1,  // +150
      burracoSporco: 2,      // +200
      chiusura: true,        // +100
      pozzetto: 'preso_giocato',
      cardsOnTableDirect: '0',
      cardsInHandDirect: '0',
    };
    expect(calculateTeamRoundScore(details)).toBe(650);
  });

  it('applies pozzetto penalties properly', () => {
    const nonPreso = {
      burracoPulito: 0,
      burracoSporco: 0,
      chiusura: false,
      pozzetto: 'non_preso', // -100
      cardsOnTableDirect: '50',
      cardsInHandDirect: '0',
    };
    expect(calculateTeamRoundScore(nonPreso)).toBe(-50); // -100 + 50

    const nonGiocato = {
      ...nonPreso,
      pozzetto: 'preso_non_giocato', // -100
    };
    expect(calculateTeamRoundScore(nonGiocato)).toBe(-50);
  });

  it('calculates full realistic hand with direct card inputs', () => {
    const round = {
      burracoPulito: 1,        // +200
      burracoSporco: 1,        // +100
      chiusura: true,          // +100
      pozzetto: 'preso_giocato', // 0
      cardsOnTableDirect: '185', // +185
      cardsInHandDirect: '0',    // -0 (chiusura)
    };
    // 200 + 100 + 100 + 185 = 585
    expect(calculateTeamRoundScore(round)).toBe(585);
  });

  it('subtracts cards in hand when opponent closes', () => {
    const opponentRound = {
      burracoPulito: 0,
      burracoSporco: 1,        // +100
      chiusura: false,         // 0
      pozzetto: 'preso_giocato', // 0
      cardsOnTableDirect: '140', // +140
      cardsInHandDirect: '95',   // -95
    };
    // 100 + 140 - 95 = 145
    expect(calculateTeamRoundScore(opponentRound)).toBe(145);
  });

  it('works with cardCounts when direct value is not set', () => {
    const countRound = {
      burracoPulito: 0,
      burracoSporco: 0,
      chiusura: false,
      pozzetto: 'preso_giocato',
      cardsOnTableDirect: '',
      cardsInHandDirect: '',
      cardsOnTableCount: { jolly: 1, asso: 1 }, // 30 + 15 = 45
      cardsInHandCount: { alte: 2, basse: 1 },   // 20 + 5  = 25
    };
    // 45 - 25 = 20
    expect(calculateTeamRoundScore(countRound)).toBe(20);
  });

  it('rounds pair split score in Trio FIBUR mode to a multiple of 5', () => {
    expect(calculateTrioPairSplitScore(375)).toBe(190); // 187.5 -> 190 (mult. 5)
    expect(calculateTrioPairSplitScore(370)).toBe(185); // exact mult. 5
    expect(calculateTrioPairSplitScore(385)).toBe(195); // 192.5 -> 195
    expect(calculateTrioPairSplitScore(0)).toBe(0);
    expect(calculateTrioPairSplitScore(-125)).toBe(-60); // -62.5 -> -60 (mult. 5)

    for (const raw of [-205, -125, -55, 0, 15, 365, 370, 375, 385, 515]) {
      expect(Math.abs(calculateTrioPairSplitScore(raw) % 5)).toBe(0);
    }

    const display = computeRoundDisplayScores({
      entryMode: 'guided',
      isTrio: true,
      lonePlayer: 'team1',
      team1Data: DEFAULT_ENTITY,
      team2Data: DEFAULT_ENTITY,
      team3Data: DEFAULT_ENTITY,
      loneData: { ...DEFAULT_ENTITY, cardsOnTableDirect: '200' },
      pairData: { ...DEFAULT_ENTITY, cardsOnTableDirect: '375' },
    });
    expect(display.team1Score).toBe(200);
    expect(display.pairRawScore).toBe(375);
    expect(display.pairSplitScore).toBe(190);
    expect(display.team2Score).toBe(190);
    expect(display.team3Score).toBe(190);
  });

  it('correctly re-sequences rounds when an intermediate round is deleted', () => {
    const initialRounds = [
      { roundNumber: 1, team1Score: 350, team2Score: 180 },
      { roundNumber: 2, team1Score: -120, team2Score: 400 },
      { roundNumber: 3, team1Score: 250, team2Score: 100 },
    ];
    // Elimina Mano #2 (index 1)
    const remaining = initialRounds
      .filter((_, idx) => idx !== 1)
      .map((r, newIdx) => ({
        ...r,
        roundNumber: newIdx + 1,
      }));

    expect(remaining).toHaveLength(2);
    expect(remaining[0].roundNumber).toBe(1);
    expect(remaining[0].team1Score).toBe(350);
    expect(remaining[1].roundNumber).toBe(2);
    expect(remaining[1].team1Score).toBe(250); // ex mano 3 è diventata mano 2
  });
});

describe('Target Score Constants & Validation (aligned with firestore.rules)', () => {
  it('uses 2005 as consistent default target score and labels 2505 as Federale', () => {
    expect(MIN_TARGET_SCORE).toBe(100);
    expect(MAX_TARGET_SCORE).toBe(10000);
    expect(DEFAULT_TARGET_SCORE).toBe(2005);
    const defaultOpt = DEFAULT_TARGET_SCORES.find((o) => o.value === 2005);
    const federalOpt = DEFAULT_TARGET_SCORES.find((o) => o.value === 2505);
    expect(defaultOpt?.desc).toBe('Predefinito');
    expect(federalOpt?.desc).toBe('Federale');
  });

  it('validates custom targetScore against Firestore bounds (100..10000 integer)', () => {
    expect(validateTargetScore(100)).toEqual({ valid: true, value: 100, error: null });
    expect(validateTargetScore('2005')).toEqual({ valid: true, value: 2005, error: null });
    expect(validateTargetScore(10000)).toEqual({ valid: true, value: 10000, error: null });

    expect(validateTargetScore(99).valid).toBe(false);
    expect(validateTargetScore(10001).valid).toBe(false);
    expect(validateTargetScore(1500.5).valid).toBe(false);
    expect(validateTargetScore('').valid).toBe(false);
    expect(validateTargetScore('abc').valid).toBe(false);
  });
});

describe('Match Completion & Tiebreaker Logic - computeTeamTotalsAndWinner', () => {
  it('keeps match open (isTieAtTarget=true, winner=null) on exact tie at targetScore in pairs/singles', () => {
    const tiedRounds = [
      { team1Score: 1050, team2Score: 950 },
      { team1Score: 1000, team2Score: 1100 }, // 2050 vs 2050 (>= 2005)
    ];
    const tiedRes = computeTeamTotalsAndWinner(tiedRounds, 'pairs', 2005);
    expect(tiedRes.t1Total).toBe(2050);
    expect(tiedRes.t2Total).toBe(2050);
    expect(tiedRes.isTargetReached).toBe(true);
    expect(tiedRes.isTieAtTarget).toBe(true);
    expect(tiedRes.isFinished).toBe(false);
    expect(tiedRes.winner).toBeNull();

    // Tiebreaker round resolves the match
    const afterTiebreak = computeTeamTotalsAndWinner(
      [...tiedRounds, { team1Score: 150, team2Score: 250 }],
      'pairs',
      2005
    );
    expect(afterTiebreak.isTieAtTarget).toBe(false);
    expect(afterTiebreak.isFinished).toBe(true);
    expect(afterTiebreak.winner).toBe('team2');
  });

  it('keeps Trio match open when top two players tie at/above targetScore', () => {
    const trioTied = [
      { team1Score: 2100, team2Score: 2100, team3Score: 1500 },
    ];
    const res = computeTeamTotalsAndWinner(trioTied, 'trio', 2005);
    expect(res.isTargetReached).toBe(true);
    expect(res.isTieAtTarget).toBe(true);
    expect(res.isFinished).toBe(false);
    expect(res.winner).toBeNull();

    const resolved = computeTeamTotalsAndWinner(
      [...trioTied, { team1Score: 100, team2Score: 50, team3Score: 50 }],
      'trio',
      2005
    );
    expect(resolved.isTieAtTarget).toBe(false);
    expect(resolved.isFinished).toBe(true);
    expect(resolved.winner).toBe('team1');
  });
});
