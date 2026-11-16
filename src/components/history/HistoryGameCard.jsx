import React from 'react';
import {
  Trophy,
  Calendar,
  ChevronRight,
  Trash2
} from 'lucide-react';

export default function HistoryGameCard({
  game,
  isActiveNow,
  formatDate,
  onSelect,
  onDelete
}) {
  const isGameTrio = game?.mode === 'trio';
  const t1Total = (game.rounds || []).reduce((acc, r) => acc + (r.team1Score || 0), 0);
  const t2Total = (game.rounds || []).reduce((acc, r) => acc + (r.team2Score || 0), 0);
  const t3Total = (game.rounds || []).reduce((acc, r) => acc + (r.team3Score || 0), 0);
  const winnerName = game.winner === 'team1'
    ? (game.team1?.name || 'Squadra 1')
    : game.winner === 'team2'
    ? (game.team2?.name || 'Squadra 2')
    : game.winner === 'team3'
    ? (game.team3?.name || 'Giocatore 3')
    : null;
  const isOngoing = !game.isFinished;

  return (
    <div
      className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer group ${
        isActiveNow
          ? 'club-card border-[var(--accent-gold)] ring-1 ring-[var(--accent-ring)]'
          : 'club-inset border-[var(--border-subtle)] hover:border-[var(--border-hairline)]'
      }`}
      onClick={() => onSelect(game)}
    >
      <div className="min-w-0 flex-1 space-y-1.5">
        {/* Titolo match & Stato */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="text-sm font-bold text-white group-hover:text-[var(--accent-gold-bright)] transition-colors truncate">
            {game.team1?.name || 'Squadra 1'} <span className="club-text-subtle font-normal">vs</span> {game.team2?.name || 'Squadra 2'}
            {isGameTrio && (
              <>
                {' '}<span className="club-text-subtle font-normal">vs</span>{' '}
                {game.team3?.name || 'Giocatore 3'}
              </>
            )}
          </span>

          {isActiveNow ? (
            <span className="text-[11px] font-bold text-emerald-300 flex items-center gap-1.5 shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Sul Tabellone</span>
            </span>
          ) : isOngoing ? (
            <span className="text-[11px] font-bold club-text-gold shrink-0">
              In Sospeso
            </span>
          ) : winnerName ? (
            <span className="text-[11px] font-bold club-text-gold flex items-center gap-1 shrink-0">
              <Trophy className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate max-w-[120px]">{winnerName}</span>
            </span>
          ) : (
            <span className="text-[11px] font-semibold club-text-muted shrink-0">
              Conclusa
            </span>
          )}
        </div>

        {/* Metadata & Punteggio Finale Tabellare */}
        <div className="text-xs club-text-subtle flex items-center flex-wrap gap-x-2.5 gap-y-1">
          <span className="inline-flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>{formatDate(game.createdAt)}</span>
          </span>
          <span>•</span>
          <span>{game.rounds?.length || 0} mani</span>
          <span>•</span>
          <span className="font-mono-num font-bold text-white">
            {isGameTrio ? `${t1Total} - ${t2Total} - ${t3Total} pt` : `${t1Total} - ${t2Total} pt`}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={() => onDelete(game)}
          className="w-10 h-10 rounded-xl club-btn-secondary club-text-subtle hover:text-rose-300 flex items-center justify-center cursor-pointer"
          title="Elimina partita"
          aria-label="Elimina partita"
        >
          <Trash2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => onSelect(game)}
          className="w-10 h-10 rounded-xl club-btn-secondary flex items-center justify-center cursor-pointer"
          aria-label="Apri dettaglio partita"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
