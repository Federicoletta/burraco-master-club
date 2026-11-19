import { describe, it, expect } from 'vitest';
import {
  DEFAULT_ENTITY,
  analyzeRoundConsistency,
  applyRoundGuardrailFix,
} from '../src/components/round/roundUtils';

describe('Round Calculator Guard-Rails (FIBUR non-blocking consistency)', () => {
  it('returns no warnings in quick entry mode', () => {
    const warnings = analyzeRoundConsistency({
      entryMode: 'quick',
      team1Data: { ...DEFAULT_ENTITY, chiusura: true, cardsInHandDirect: '45' },
      team2Data: { ...DEFAULT_ENTITY },
    });
    expect(warnings).toEqual([]);
  });

  it('returns no warnings for a clean valid guided round', () => {
    const warnings = analyzeRoundConsistency({
      entryMode: 'guided',
      team1Data: {
        ...DEFAULT_ENTITY,
        chiusura: true,
        pozzetto: 'preso_giocato',
        burracoPulito: 1,
        cardsOnTableDirect: '235',
        cardsInHandDirect: '',
      },
      team2Data: {
        ...DEFAULT_ENTITY,
        chiusura: false,
        pozzetto: 'preso_giocato',
        burracoSporco: 1,
        cardsOnTableDirect: '140',
        cardsInHandDirect: '35',
      },
    });
    expect(warnings).toEqual([]);
  });

  it('detects chiusura with cards still in hand and fixes via clear_hand_cards', () => {
    const team1 = {
      ...DEFAULT_ENTITY,
      chiusura: true,
      burracoSporco: 1,
      cardsInHandDirect: '50',
    };
    const warnings = analyzeRoundConsistency({
      entryMode: 'guided',
      team1Data: team1,
      team2Data: DEFAULT_ENTITY,
      team1Name: 'Noi',
    });
    const w = warnings.find((item) => item.code === 'chiusura_with_hand_cards');
    expect(w).toBeDefined();
    expect(w.target).toBe('team1');
    expect(w.fixAction).toEqual({ type: 'clear_hand_cards', target: 'team1' });

    const fixed = applyRoundGuardrailFix(team1, w.fixAction.type);
    expect(fixed.cardsInHandDirect).toBe('');
    expect(fixed.cardsInHandCount).toEqual({ jolly: 0, pinella: 0, asso: 0, alte: 0, basse: 0 });
  });

  it('detects chiusura with pozzetto penalty and fixes via set_pozzetto_played', () => {
    const team2 = {
      ...DEFAULT_ENTITY,
      chiusura: true,
      pozzetto: 'non_preso',
      burracoPulito: 1,
    };
    const warnings = analyzeRoundConsistency({
      entryMode: 'guided',
      team1Data: DEFAULT_ENTITY,
      team2Data: team2,
    });
    const w = warnings.find((item) => item.code === 'chiusura_with_pozzetto_penalty');
    expect(w).toBeDefined();
    expect(w.target).toBe('team2');

    const fixed = applyRoundGuardrailFix(team2, 'set_pozzetto_played');
    expect(fixed.pozzetto).toBe('preso_giocato');
  });

  it('detects chiusura without any burraco and fixes via add_burraco_sporco', () => {
    const team1 = {
      ...DEFAULT_ENTITY,
      chiusura: true,
      pozzetto: 'preso_giocato',
    };
    const warnings = analyzeRoundConsistency({
      entryMode: 'guided',
      team1Data: team1,
      team2Data: DEFAULT_ENTITY,
    });
    const w = warnings.find((item) => item.code === 'chiusura_without_burraco');
    expect(w).toBeDefined();
    expect(w.fixAction).toEqual({ type: 'add_burraco_sporco', target: 'team1' });

    const fixed = applyRoundGuardrailFix(team1, 'add_burraco_sporco');
    expect(fixed.burracoSporco).toBe(1);
  });

  it('detects card points not multiple of 5 and fixes via round_cards_to_5', () => {
    const team1 = {
      ...DEFAULT_ENTITY,
      chiusura: true,
      burracoSporco: 1,
      cardsOnTableDirect: '123',
      cardsInHandDirect: '',
    };
    const team2 = {
      ...DEFAULT_ENTITY,
      cardsOnTableDirect: '80',
      cardsInHandDirect: '42',
    };
    const warnings = analyzeRoundConsistency({
      entryMode: 'guided',
      team1Data: team1,
      team2Data: team2,
    });
    const w1 = warnings.find((item) => item.id === 'non_multiple_of_five_team1');
    const w2 = warnings.find((item) => item.id === 'non_multiple_of_five_team2');
    expect(w1).toBeDefined();
    expect(w2).toBeDefined();

    expect(applyRoundGuardrailFix(team1, 'round_cards_to_5').cardsOnTableDirect).toBe('125');
    expect(applyRoundGuardrailFix(team2, 'round_cards_to_5').cardsInHandDirect).toBe('40');
  });

  it('warns when points were entered but neither side marked chiusura', () => {
    const warnings = analyzeRoundConsistency({
      entryMode: 'guided',
      team1Data: { ...DEFAULT_ENTITY, cardsOnTableDirect: '150' },
      team2Data: { ...DEFAULT_ENTITY, cardsOnTableDirect: '90' },
    });
    const w = warnings.find((item) => item.code === 'missing_chiusura');
    expect(w).toBeDefined();
    expect(w.fixAction).toBeNull();
  });

  it('supports Trio 1vs2 mode targeting lone and pair entities', () => {
    const warnings = analyzeRoundConsistency({
      entryMode: 'guided',
      isTrio: true,
      loneData: { ...DEFAULT_ENTITY, chiusura: true, burracoPulito: 0 },
      pairData: { ...DEFAULT_ENTITY, cardsInHandDirect: '17' },
      loneName: 'Marco',
      pairName: 'Anna & Luca',
    });
    expect(warnings.some((w) => w.id === 'chiusura_without_burraco_lone')).toBe(true);
    expect(warnings.some((w) => w.id === 'non_multiple_of_five_pair')).toBe(true);
  });

  it('evaluates card-pad counts when showHandCardPad is enabled', () => {
    const warnings = analyzeRoundConsistency({
      entryMode: 'guided',
      team1Data: {
        ...DEFAULT_ENTITY,
        chiusura: true,
        burracoPulito: 1,
        showHandCardPad: true,
        cardsInHandCount: { jolly: 1, pinella: 0, asso: 0, alte: 0, basse: 0 },
      },
      team2Data: DEFAULT_ENTITY,
    });
    const w = warnings.find((item) => item.code === 'chiusura_with_hand_cards');
    expect(w).toBeDefined();
    expect(w.message).toContain('-30 pt');
  });
});
