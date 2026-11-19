import React, { useEffect, useState } from 'react';
import { Trophy, RotateCcw, Home, Share2, X, Calendar } from 'lucide-react';
import { sound } from '../utils/soundEffects';
import { calculateFiburVictoryPoints } from '../utils/tournament';
import { useModalEscape } from '../hooks/useModalEscape';

export default function VictoryModal({
  isOpen,
  onClose,
  activeGame,
  activeTournament = null,
  onRematch,
  onArchiveAndNew,
  onOpenTournament = () => {},
}) {
  const [copiedToast, setCopiedToast] = useState(false);
  useModalEscape(isOpen, onClose);
  useEffect(() => {
    if (!isOpen) return undefined;
    let cancelled = false;
    sound.playVictoryFanfare();

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!prefersReducedMotion) {
      import('canvas-confetti')
        .then((mod) => {
          if (cancelled) return;
          const confetti = mod?.default || mod;
          if (typeof confetti !== 'function') return;
          const count = 200;
          const defaults = { origin: { y: 0.7 } };

          const fire = (particleRatio, opts) => {
            confetti({
              ...defaults,
              ...opts,
              particleCount: Math.floor(count * particleRatio)
            });
          };

          fire(0.25, { spread: 26, startVelocity: 55 });
          fire(0.2, { spread: 60 });
          fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
          fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
          fire(0.1, { spread: 120, startVelocity: 45 });
        })
        .catch((err) => {
          console.error('Confetti error', err);
        });
    }

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  if (!isOpen || !activeGame) return null;

  const isTrio = activeGame?.mode === 'trio';
  const t1Total = (activeGame.rounds || []).reduce((acc, r) => acc + (r.team1Score || 0), 0);
  const t2Total = (activeGame.rounds || []).reduce((acc, r) => acc + (r.team2Score || 0), 0);
  const t3Total = (activeGame.rounds || []).reduce((acc, r) => acc + (r.team3Score || 0), 0);

  let winnerTeam;
  let winnerScore;
  let rankedTeams = [];

  if (isTrio) {
    rankedTeams = [
      { team: activeGame.team1, score: t1Total, icon: '♦', color: 'club-team1' },
      { team: activeGame.team2, score: t2Total, icon: '♠', color: 'club-team2' },
      { team: activeGame.team3, score: t3Total, icon: '♥', color: 'club-team3' },
    ].sort((a, b) => b.score - a.score);
    winnerTeam = rankedTeams[0].team;
    winnerScore = rankedTeams[0].score;
  } else {
    const isT1Winner = t1Total >= t2Total;
    winnerTeam = isT1Winner ? activeGame.team1 : activeGame.team2;
    winnerScore = isT1Winner ? t1Total : t2Total;
    const loserTeam = isT1Winner ? activeGame.team2 : activeGame.team1;
    const loserScore = isT1Winner ? t2Total : t1Total;
    rankedTeams = [
      { team: winnerTeam, score: winnerScore, icon: isT1Winner ? '♦' : '♠', color: isT1Winner ? 'club-team1' : 'club-team2' },
      { team: loserTeam, score: loserScore, icon: isT1Winner ? '♠' : '♦', color: 'club-text-muted' },
    ];
  }

  const isTournamentMatch = Boolean(activeGame.tournamentMatchId);
  const isFibur = activeTournament?.scoringSystem !== 'classic';
  const fiburVp = (isTournamentMatch && !isTrio && isFibur)
    ? calculateFiburVictoryPoints(t1Total, t2Total)
    : null;

  const handleShare = () => {
    let text;
    if (isTournamentMatch) {
      const isFiburScoring = activeTournament?.scoringSystem !== 'classic';
      const vpInfo = (isFiburScoring && fiburVp)
        ? ` (${winnerTeam === activeGame.team1 ? fiburVp.team1Vp : fiburVp.team2Vp} a ${winnerTeam === activeGame.team1 ? fiburVp.team2Vp : fiburVp.team1Vp} VP FIBUR)`
        : '';
      text = `🏆 Torneo ${activeGame.tournamentName || 'Burraco'} - Giornata ${activeGame.tournamentRoundNumber || 1} (Tavolo ${activeGame.tournamentTableNumber || 1}):\n` +
             `Vittoria di ${winnerTeam.name} (${(winnerTeam.players || []).join(' & ')}) con ${winnerScore} pt!\n` +
             `Risultato finale: ${activeGame.team1?.name} ${t1Total} vs ${t2Total} ${activeGame.team2?.name}${vpInfo} in ${activeGame.rounds.length} mani! ♠️♥️♣️♦️\n` +
             `https://burraco-score-fedec.web.app`;
    } else if (isTrio) {
      text = `🏆 Burraco a 3: Vittoria di ${winnerTeam.name} (${(winnerTeam.players || []).join(' & ')}) con ${winnerScore} pt! Classifica: 1° ${rankedTeams[0].team.name} (${rankedTeams[0].score} pt), 2° ${rankedTeams[1].team.name} (${rankedTeams[1].score} pt), 3° ${rankedTeams[2].team.name} (${rankedTeams[2].score} pt) in ${activeGame.rounds.length} mani! ♠️♥️♣️♦️`;
    } else {
      const loserTeam = rankedTeams[1].team;
      const loserScore = rankedTeams[1].score;
      text = `🏆 Burraco: Vittoria di ${winnerTeam.name} (${(winnerTeam.players || []).join(' & ')}) con ${winnerScore} pt contro ${loserTeam.name} (${loserScore} pt) in ${activeGame.rounds.length} mani! ♠️♥️♣️♦️`;
    }
    if (navigator.share) {
      navigator.share({ title: isTournamentMatch ? 'Risultato Incontro Torneo!' : 'Vittoria a Burraco!', text });
    } else {
      navigator.clipboard.writeText(text);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 3000);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md overflow-hidden"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Partita conclusa"
    >
      <div
        className="relative w-full max-w-md club-card-solid rounded-t-3xl sm:rounded-3xl border-2 border-[var(--accent-gold)] p-6 text-center max-h-[92dvh] overflow-y-auto club-sheet-enter"
        onClick={(e) => e.stopPropagation()}
      >
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 rounded-xl club-btn-secondary flex items-center justify-center cursor-pointer"
            title="Chiudi e torna al tabellone"
            aria-label="Chiudi vittoria"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="w-16 h-16 rounded-2xl gold-gradient flex items-center justify-center mx-auto my-2 shadow-xl">
          <Trophy className="w-9 h-9" />
        </div>

        {isTournamentMatch && (
          <div className="mb-2 px-3 py-1.5 rounded-xl club-inset border border-[var(--accent-gold)]/45 club-text-gold text-xs font-bold inline-flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">
              {activeGame.tournamentName || 'Torneo'} · Giornata {activeGame.tournamentRoundNumber || 1} · Tav. {activeGame.tournamentTableNumber || 1}
            </span>
          </div>
        )}

        <span className="text-[11px] font-bold uppercase tracking-widest club-text-gold block mt-1">
          Partita Conclusa
        </span>
        <h2 className="font-display text-2xl sm:text-3xl font-bold club-text-primary mt-1 mb-0">
          Vittoria per {winnerTeam.name}
        </h2>

        <p className="my-2 text-sm club-text-muted">
          Complimenti a <strong className="club-text-gold">{(winnerTeam.players || []).join(' & ')}</strong>
        </p>

        {/* Punteggio Finale */}
        <div className="my-4 p-4 rounded-2xl club-inset border club-border">
          {isTrio ? (
            <div className="grid grid-cols-3 gap-2 text-center">
              {rankedTeams.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-xl border ${
                    idx === 0 ? 'club-card border-[var(--accent-gold)]' : 'club-row-bg border-[var(--border-subtle)]'
                  }`}
                >
                  <span className={`text-xs font-bold ${item.color} block truncate`}>
                    {item.icon} {item.team.name}
                  </span>
                  <span className="font-mono-num text-xl sm:text-2xl font-bold club-text-primary block my-0.5">
                    {item.score.toLocaleString('it-IT')}
                  </span>
                  <span className={`text-[10px] font-bold block uppercase ${idx === 0 ? 'club-text-gold' : 'club-text-subtle'}`}>
                    {idx === 0 ? '1° Posto' : `${idx + 1}° Posto`}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center gap-5 text-center">
              <div>
                <span className="text-xs font-bold club-text-gold block">{winnerTeam.name}</span>
                <span className="font-mono-num text-3xl font-bold club-text-primary block">
                  {winnerScore.toLocaleString('it-IT')}
                </span>
                {fiburVp && (
                  <span className="font-mono-num text-xs font-bold club-text-gold block mt-0.5">
                    {winnerTeam === activeGame.team1 ? fiburVp.team1Vp : fiburVp.team2Vp} VP
                  </span>
                )}
                <span className="text-[10px] club-text-gold font-bold uppercase tracking-wider block mt-1">
                  Vincitore
                </span>
              </div>
              <div className="club-text-subtle font-display text-xl">-</div>
              <div>
                <span className="text-xs font-bold club-text-muted block">{rankedTeams[1].team.name}</span>
                <span className="font-mono-num text-3xl font-bold club-text-muted block">
                  {rankedTeams[1].score.toLocaleString('it-IT')}
                </span>
                {fiburVp && (
                  <span className="font-mono-num text-xs font-bold club-text-subtle block mt-0.5">
                    {rankedTeams[1].team === activeGame.team1 ? fiburVp.team1Vp : fiburVp.team2Vp} VP
                  </span>
                )}
                <span className="font-mono-num text-[10px] club-text-subtle block mt-1">
                  -{winnerScore - rankedTeams[1].score} pt
                </span>
              </div>
            </div>
          )}
          <div className="mt-3 pt-2.5 border-t club-divider text-xs club-text-subtle font-mono-num">
            Obiettivo {activeGame.targetScore} pt · {activeGame.rounds.length} mani
          </div>
        </div>

        {/* Azioni */}
        <div className="space-y-2.5">
          {isTournamentMatch ? (
            <>
              <button
                type="button"
                onClick={() => onOpenTournament('schedule', activeGame.tournamentRoundNumber)}
                className="w-full min-h-[48px] rounded-xl gold-gradient font-bold text-sm flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Calendar className="w-4 h-4" />
                <span>Calendario & Classifica Torneo</span>
              </button>

              <button
                type="button"
                onClick={handleShare}
                className="w-full min-h-[44px] rounded-xl club-btn-secondary font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <Share2 className="w-4 h-4 club-text-gold" />
                <span>{copiedToast ? 'Resoconto Copiato!' : 'Condividi Risultato'}</span>
              </button>

              <button
                type="button"
                onClick={onArchiveAndNew}
                className="w-full min-h-[44px] rounded-xl club-btn-secondary club-text-muted font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Home className="w-4 h-4" />
                <span>Esci dal Tavolo</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onRematch}
                className="w-full min-h-[48px] rounded-xl gold-gradient font-bold text-sm flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Rivincita (Stessi Giocatori)</span>
              </button>

              <button
                type="button"
                onClick={handleShare}
                className="w-full min-h-[44px] rounded-xl club-btn-secondary font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <Share2 className="w-4 h-4 club-text-gold" />
                <span>{copiedToast ? 'Resoconto Copiato!' : 'Condividi Vittoria'}</span>
              </button>

              <button
                type="button"
                onClick={onArchiveAndNew}
                className="w-full min-h-[44px] rounded-xl club-btn-secondary club-text-muted font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Home className="w-4 h-4" />
                <span>Archivia & Nuova Partita</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
