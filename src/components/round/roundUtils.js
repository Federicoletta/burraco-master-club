import { calculateTeamRoundScore, calculateTrioPairSplitScore } from '../../constants/burraco';

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
  return {
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
    timestamp: new Date().toISOString(),
  };
}
