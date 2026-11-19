/**
 * Telemetria e Diagnostica Silenziosa
 * 
 * Raccoglie metriche d'uso anonime e statistiche oggettive sull'esperienza di gioco
 * per permettere analisi diagnostiche e miglioramenti mirati dell'architettura e della UI.
 */

/**
 * Rileva informazioni tecniche sul dispositivo e runtime in modo sicuro
 */
export function getClientPlatformInfo() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return { platform: 'unknown', isMobile: false, os: 'desktop', browser: 'other' };
  }

  const ua = navigator.userAgent || '';
  const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  const isAndroid = /Android/i.test(ua);
  const isSafari = /Safari/i.test(ua) && !/Chrome|CriOS/i.test(ua);
  const isChrome = /Chrome|CriOS/i.test(ua);

  return {
    isMobile,
    os: isIOS ? 'ios' : isAndroid ? 'android' : 'desktop',
    browser: isSafari ? 'safari' : isChrome ? 'chrome' : 'other',
    screenWidth: window.innerWidth || 0,
    screenHeight: window.innerHeight || 0,
    devicePixelRatio: window.devicePixelRatio || 1,
  };
}

/**
 * Calcola le metriche di telemetria della partita al termine o alla chiusura del tavolo
 */
export function computeGameTelemetry(game, sessionStats = {}) {
  if (!game) return null;

  try {
    const rounds = Array.isArray(game.rounds) ? game.rounds : [];
    const deletedIds = Array.isArray(game.deletedRoundIds) ? game.deletedRoundIds : null;
    const legacyChain = Array.isArray(game.ledgerChain) ? game.ledgerChain : [];

    // Conteggio stili di inserimento
    let guidedHandsCount = 0;
    let quickHandsCount = 0;
    rounds.forEach(r => {
      if (r.entryMode === 'quick') {
        quickHandsCount++;
      } else {
        guidedHandsCount++;
      }
    });

    // Conteggio correzioni/annullamenti da deletedRoundIds (o ledgerChain legacy)
    const revertsCount = deletedIds
      ? deletedIds.length
      : legacyChain.filter(b => b.type === 'ROUND_REVERTED').length;

    // Durata approssimativa in minuti
    let durationMinutes = 0;
    if (game.createdAt) {
      const start = new Date(game.createdAt).getTime();
      const end = game.completedAt ? new Date(game.completedAt).getTime() : Date.now();
      durationMinutes = Math.max(0, Math.round((end - start) / 60000));
    }

    const platform = getClientPlatformInfo();

    return {
      durationMinutes,
      handsCount: rounds.length,
      guidedHandsCount,
      quickHandsCount,
      revertsCount,
      targetScore: Number(game.targetScore) || 2005,
      mode: game.mode || 'pairs',
      isFinished: Boolean(game.isFinished),
      tableClosed: Boolean(game.tableClosed),
      offlineEventsCount: Number(sessionStats.offlineEventsCount) || 0,
      os: platform.os,
      browser: platform.browser,
      isMobile: platform.isMobile,
      generatedAt: new Date().toISOString()
    };
  } catch (err) {
    console.warn('[Telemetry] Errore calcolo metriche:', err);
    return null;
  }
}
