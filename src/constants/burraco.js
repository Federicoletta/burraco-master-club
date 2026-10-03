// Costanti e regole di gioco del Burraco

export const CARD_VALUES = {
  jolly: { label: 'Jolly', points: 30, color: 'text-purple-400' },
  pinella: { label: 'Pinelle (2)', points: 20, color: 'text-amber-400' },
  asso: { label: 'Assi (A)', points: 15, color: 'text-blue-400' },
  alte: { label: 'Figure & 8-K', points: 10, desc: '8, 9, 10, J, Q, K', color: 'text-emerald-400' },
  basse: { label: 'Carte 3-7', points: 5, desc: '3, 4, 5, 6, 7', color: 'text-slate-300' },
};

export const HONOR_POINTS = {
  BURRACO_PULITO: 200,
  BURRACO_SEMIPULITO: 150,
  BURRACO_SPORCO: 100,
  CHIUSURA: 100,
  POZZETTO_NON_PRESO: -100,
  POZZETTO_PRESO_NON_GIOCATO: -100,
};

export const DEFAULT_TARGET_SCORES = [
  { label: '1005 Punti (Veloce)', desc: 'Veloce', value: 1005 },
  { label: '1505 Punti (Media)', desc: 'Media', value: 1505 },
  { label: '2005 Punti (Classica)', desc: 'Classica', value: 2005 },
  { label: '2505 Punti (Predefinito)', desc: 'Predefinito', value: 2505 },
  { label: '3005 Punti (Lunga)', desc: 'Lunga', value: 3005 },
];

/**
 * Calcola il punteggio netto delle carte da un conteggio per tipo
 */
export function calculateCardsPoints(cardCounts) {
  if (!cardCounts) return 0;
  return (
    (cardCounts.jolly || 0) * CARD_VALUES.jolly.points +
    (cardCounts.pinella || 0) * CARD_VALUES.pinella.points +
    (cardCounts.asso || 0) * CARD_VALUES.asso.points +
    (cardCounts.alte || 0) * CARD_VALUES.alte.points +
    (cardCounts.basse || 0) * CARD_VALUES.basse.points
  );
}

/**
 * Calcola il punteggio totale della squadra per una mano
 */
export function calculateTeamRoundScore(details) {
  if (!details) return 0;
  if (details.manualMode) {
    return Number(details.manualScore) || 0;
  }

  // 1. Onori
  let honors = 0;
  honors += (details.burracoPulito || 0) * HONOR_POINTS.BURRACO_PULITO;
  honors += (details.burracoSemipulito || 0) * HONOR_POINTS.BURRACO_SEMIPULITO;
  honors += (details.burracoSporco || 0) * HONOR_POINTS.BURRACO_SPORCO;

  if (details.chiusura) {
    honors += HONOR_POINTS.CHIUSURA;
  }

  if (details.pozzetto === 'non_preso') {
    honors += HONOR_POINTS.POZZETTO_NON_PRESO;
  } else if (details.pozzetto === 'preso_non_giocato') {
    honors += HONOR_POINTS.POZZETTO_PRESO_NON_GIOCATO;
  }

  // 2. Carte a terra (positive)
  const terra = details.cardsOnTableDirect !== undefined && details.cardsOnTableDirect !== ''
    ? Math.max(0, Number(details.cardsOnTableDirect) || 0)
    : calculateCardsPoints(details.cardsOnTableCount);

  // 3. Carte in mano (negative da sottrarre)
  const mano = details.cardsInHandDirect !== undefined && details.cardsInHandDirect !== ''
    ? Math.max(0, Number(details.cardsInHandDirect) || 0)
    : calculateCardsPoints(details.cardsInHandCount);

  return honors + terra - mano;
}
