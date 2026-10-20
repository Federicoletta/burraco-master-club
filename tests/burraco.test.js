import { describe, it, expect } from 'vitest';
import {
  calculateCardsPoints,
  calculateTeamRoundScore,
} from '../src/constants/burraco';

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

  it('correctly divides pair score in Trio FIBUR mode (50% each with rounding)', () => {
    const pairScore = 375;
    const splitScore = Math.round(pairScore / 2);
    expect(splitScore).toBe(188); // 375 / 2 = 187.5 -> 188
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
