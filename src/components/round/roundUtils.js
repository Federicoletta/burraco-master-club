import { calculateTeamRoundScore, calculateTrioPairSplitScore, calculateCardsPoints } from '../../constants/burraco';
import { generateRoundId } from '../../utils/roundSync';

export const DEFAULT_ENTITY = {
  chiusura: false,
  burracoPulito: 0,
  burracoSemipulito: 0,
  burracoSporco: 0,
  pozzetto: 'preso_giocato', // 'preso_giocato' | 'non_preso' | 'preso_non_giocato'
  cardsOnTableDirect: '',
  cardsInHandDirect: '',
  cardsOnTableCount: { jolly: 0, pinella: 0, asso: 0, alte: 0, basse: 0 },
  cardsInHandCount: { jolly: 0, pinella: 0, asso: 0, alte: 0, basse: 0 },
  showTableCardPad: false,
  showHandCardPad: false,
  manualScore: '',
};

export function getInitialRoundState(activeGame, roundToEdit, roundNumber) {
  const isTrio = activeGame?.mode === 'trio';
  const expectedLone = ((roundNumber - 1) % 3 === 0)
    ? 'team1'
    : ((roundNumber - 1) % 3 === 1)
    ? 'team2'
    : 'team3';

  if (!roundToEdit) {
    return {
      entryMode: 'guided',
      activeTab: isTrio ? 'lone' : 'team1',
      lonePlayer: expectedLone,
      team1Data: { ...DEFAULT_ENTITY },
      team2Data: { ...DEFAULT_ENTITY },
      team3Data: { ...DEFAULT_ENTITY },
      loneData: { ...DEFAULT_ENTITY },
      pairData: { ...DEFAULT_ENTITY },
    };
  }

  const entryMode = roundToEdit.entryMode === 'quick' ? 'quick' : 'guided';
  const lonePlayer = roundToEdit.lonePlayer || expectedLone;
  let team1Data = { ...DEFAULT_ENTITY };
  let team2Data = { ...DEFAULT_ENTITY };
  let team3Data = { ...DEFAULT_ENTITY };
  let loneData = { ...DEFAULT_ENTITY };
  let pairData = { ...DEFAULT_ENTITY };

  if (entryMode === 'quick') {
    team1Data = { ...DEFAULT_ENTITY, manualScore: String(roundToEdit.team1Score ?? '') };
    team2Data = { ...DEFAULT_ENTITY, manualScore: String(roundToEdit.team2Score ?? '') };
    team3Data = { ...DEFAULT_ENTITY, manualScore: String(roundToEdit.team3Score ?? '') };
  } else if (isTrio) {
    if (roundToEdit.loneDetails && roundToEdit.pairDetails) {
      loneData = { ...DEFAULT_ENTITY, ...roundToEdit.loneDetails };
      pairData = { ...DEFAULT_ENTITY, ...roundToEdit.pairDetails };
    } else {
      const loneDet = lonePlayer === 'team1'
        ? roundToEdit.team1Details
        : lonePlayer === 'team2'
        ? roundToEdit.team2Details
        : roundToEdit.team3Details;
      const pairDet = lonePlayer === 'team1' ? roundToEdit.team2Details : roundToEdit.team1Details;
      if (loneDet) loneData = { ...DEFAULT_ENTITY, ...loneDet };
      if (pairDet) pairData = { ...DEFAULT_ENTITY, ...pairDet };
    }
  } else {
    if (roundToEdit.team1Details) team1Data = { ...DEFAULT_ENTITY, ...roundToEdit.team1Details };
    if (roundToEdit.team2Details) team2Data = { ...DEFAULT_ENTITY, ...roundToEdit.team2Details };
  }

  return {
    entryMode,
    activeTab: isTrio ? 'lone' : 'team1',
    lonePlayer,
    team1Data,
    team2Data,
    team3Data,
    loneData,
    pairData,
  };
}

export function computeRoundDisplayScores({
  entryMode,
  isTrio,
  lonePlayer,
  team1Data,
  team2Data,
  team3Data,
  loneData,
  pairData,
}) {
  const team1ScoreNormal = entryMode === 'quick'
    ? Number(team1Data.manualScore) || 0
    : calculateTeamRoundScore(team1Data);

  const team2ScoreNormal = entryMode === 'quick'
    ? Number(team2Data.manualScore) || 0
    : calculateTeamRoundScore(team2Data);

  const loneScore = calculateTeamRoundScore(loneData);
  const pairRawScore = calculateTeamRoundScore(pairData);
  const pairSplitScore = calculateTrioPairSplitScore(pairRawScore);

  if (!isTrio) {
    return {
      team1Score: team1ScoreNormal,
      team2Score: team2ScoreNormal,
      team3Score: 0,
      loneScore,
      pairRawScore,
      pairSplitScore,
    };
  }

  if (entryMode === 'quick') {
    return {
      team1Score: Number(team1Data.manualScore) || 0,
      team2Score: Number(team2Data.manualScore) || 0,
      team3Score: Number(team3Data.manualScore) || 0,
      loneScore,
      pairRawScore,
      pairSplitScore,
    };
  }

  if (lonePlayer === 'team1') {
    return { team1Score: loneScore, team2Score: pairSplitScore, team3Score: pairSplitScore, loneScore, pairRawScore, pairSplitScore };
  }
  if (lonePlayer === 'team2') {
    return { team1Score: pairSplitScore, team2Score: loneScore, team3Score: pairSplitScore, loneScore, pairRawScore, pairSplitScore };
  }
  return { team1Score: pairSplitScore, team2Score: pairSplitScore, team3Score: loneScore, loneScore, pairRawScore, pairSplitScore };
}

export function buildRoundPayload({
  roundToEdit,
  roundNumber,
  entryMode,
  isTrio,
  lonePlayer,
  team1Score,
  team2Score,
  team3Score,
  team1Data,
  team2Data,
  loneData,
  pairData,
}) {
  const nowIso = new Date().toISOString();
  return {
    roundId: roundToEdit?.roundId || generateRoundId(),
    roundNumber: roundToEdit ? roundToEdit.roundNumber : roundNumber,
    entryMode,
    team1Score,
    team2Score,
    ...(isTrio ? {
      team3Score,
      lonePlayer,
      loneDetails: entryMode === 'guided' ? loneData : null,
      pairDetails: entryMode === 'guided' ? pairData : null,
      team1Details: entryMode === 'guided'
        ? (lonePlayer === 'team1' ? loneData : pairData)
        : { manualScore: team1Score },
      team2Details: entryMode === 'guided'
        ? (lonePlayer === 'team2' ? loneData : pairData)
        : { manualScore: team2Score },
      team3Details: entryMode === 'guided'
        ? (lonePlayer === 'team3' ? loneData : pairData)
        : { manualScore: team3Score },
    } : {
      team1Details: entryMode === 'guided' ? team1Data : { manualScore: team1Score },
      team2Details: entryMode === 'guided' ? team2Data : { manualScore: team2Score },
    }),
    createdAt: roundToEdit?.createdAt || roundToEdit?.timestamp || nowIso,
    updatedAt: nowIso,
    timestamp: nowIso,
  };
}

function getEffectiveCardPoints(entity) {
  if (!entity) return { tablePoints: 0, handPoints: 0 };
  const tablePoints = entity.showTableCardPad
    ? calculateCardsPoints(entity.cardsOnTableCount)
    : Number(entity.cardsOnTableDirect) || 0;
  const handPoints = entity.showHandCardPad
    ? calculateCardsPoints(entity.cardsInHandCount)
    : Number(entity.cardsInHandDirect) || 0;
  return { tablePoints, handPoints };
}

function hasAnyEnteredData(entity) {
  if (!entity) return false;
  const { tablePoints, handPoints } = getEffectiveCardPoints(entity);
  const burrachi = (Number(entity.burracoPulito) || 0)
    + (Number(entity.burracoSemipulito) || 0)
    + (Number(entity.burracoSporco) || 0);
  return Boolean(
    entity.chiusura
    || burrachi > 0
    || tablePoints > 0
    || handPoints > 0
    || (entity.pozzetto && entity.pozzetto !== 'preso_giocato')
  );
}

/**
 * Analizza la coerenza regolamentare FIBUR della smazzata guidata.
 * Restituisce avvisi NON bloccanti, ciascuno con eventuale azione rapida 1-tap.
 */
export function analyzeRoundConsistency({
  entryMode = 'guided',
  isTrio = false,
  team1Data,
  team2Data,
  loneData,
  pairData,
  team1Name = 'Squadra 1',
  team2Name = 'Squadra 2',
  loneName = 'Solitario',
  pairName = 'Coppia',
} = {}) {
  if (entryMode !== 'guided') return [];

  const sides = isTrio
    ? [
        { target: 'lone', name: loneName, data: loneData || DEFAULT_ENTITY },
        { target: 'pair', name: pairName, data: pairData || DEFAULT_ENTITY },
      ]
    : [
        { target: 'team1', name: team1Name, data: team1Data || DEFAULT_ENTITY },
        { target: 'team2', name: team2Name, data: team2Data || DEFAULT_ENTITY },
      ];

  const warnings = [];

  for (const side of sides) {
    const d = side.data;
    const { tablePoints, handPoints } = getEffectiveCardPoints(d);
    const totalBurrachi = (Number(d.burracoPulito) || 0)
      + (Number(d.burracoSemipulito) || 0)
      + (Number(d.burracoSporco) || 0);

    if (d.chiusura && handPoints > 0) {
      warnings.push({
        id: `chiusura_with_hand_cards_${side.target}`,
        code: 'chiusura_with_hand_cards',
        target: side.target,
        severity: 'warning',
        message: `${side.name} ha chiuso la mano ma ha ancora -${handPoints} pt di carte in mano.`,
        fixLabel: 'Azzera carte in mano',
        fixAction: { type: 'clear_hand_cards', target: side.target },
      });
    }

    if (d.chiusura && d.pozzetto && d.pozzetto !== 'preso_giocato') {
      warnings.push({
        id: `chiusura_with_pozzetto_penalty_${side.target}`,
        code: 'chiusura_with_pozzetto_penalty',
        target: side.target,
        severity: 'warning',
        message: `${side.name} ha chiuso ma il pozzetto risulta non preso/non giocato (-100 pt).`,
        fixLabel: 'Imposta pozzetto giocato',
        fixAction: { type: 'set_pozzetto_played', target: side.target },
      });
    }

    if (d.chiusura && totalBurrachi === 0) {
      warnings.push({
        id: `chiusura_without_burraco_${side.target}`,
        code: 'chiusura_without_burraco',
        target: side.target,
        severity: 'warning',
        message: `${side.name} ha chiuso senza alcun Burraco registrato (regola FIBUR: serve almeno 1 Burraco).`,
        fixLabel: '+1 Burraco Sporco',
        fixAction: { type: 'add_burraco_sporco', target: side.target },
      });
    }

    if (tablePoints % 5 !== 0 || handPoints % 5 !== 0) {
      warnings.push({
        id: `non_multiple_of_five_${side.target}`,
        code: 'non_multiple_of_five',
        target: side.target,
        severity: 'info',
        message: `${side.name}: i punti carte nel Burraco sono sempre multipli di 5.`,
        fixLabel: 'Arrotonda a mult. 5',
        fixAction: { type: 'round_cards_to_5', target: side.target },
      });
    }
  }

  const anyClosed = sides.some((s) => Boolean(s.data?.chiusura));
  const anyInput = sides.some((s) => hasAnyEnteredData(s.data));
  if (!anyClosed && anyInput) {
    warnings.push({
      id: 'missing_chiusura',
      code: 'missing_chiusura',
      target: null,
      severity: 'info',
      message: 'Nessuna squadra ha segnato la chiusura (+100 pt). Verifica se è una mano a mazzo esaurito.',
      fixLabel: null,
      fixAction: null,
    });
  }

  return warnings;
}

/**
 * Applica una correzione rapida 1-tap prodotta da analyzeRoundConsistency a un'entità squadra.
 */
export function applyRoundGuardrailFix(entity, fixType) {
  const prev = entity || DEFAULT_ENTITY;
  switch (fixType) {
    case 'clear_hand_cards':
      return {
        ...prev,
        cardsInHandDirect: '',
        cardsInHandCount: { jolly: 0, pinella: 0, asso: 0, alte: 0, basse: 0 },
      };
    case 'set_pozzetto_played':
      return {
        ...prev,
        pozzetto: 'preso_giocato',
      };
    case 'add_burraco_sporco':
      return {
        ...prev,
        burracoSporco: (Number(prev.burracoSporco) || 0) + 1,
      };
    case 'round_cards_to_5': {
      const roundTo5 = (val) => {
        const n = Number(val) || 0;
        if (n === 0) return '';
        return String(Math.round(n / 5) * 5);
      };
      return {
        ...prev,
        ...(prev.showTableCardPad ? {} : { cardsOnTableDirect: roundTo5(prev.cardsOnTableDirect) }),
        ...(prev.showHandCardPad ? {} : { cardsInHandDirect: roundTo5(prev.cardsInHandDirect) }),
      };
    }
    default:
      return prev;
  }
}
