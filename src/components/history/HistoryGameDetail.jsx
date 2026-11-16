import React from 'react';
import {
  ArrowLeft,
  PlayCircle,
  Trash2,
  Edit2,
  PlusCircle,
  Flag,
  Trophy
} from 'lucide-react';

export default function HistoryGameDetail({
  selectedGame,
  activeGame,
  onBack,
  onClose,
  onEndGame,
  onResumeGame,
  onDeleteGameWithConfirm,
  onEditRound,
  onAddRound
}) {
  const isTrio = selectedGame?.mode === 'trio';
  const t1Total = (selectedGame.rounds || []).reduce((acc, r) => acc + (r.team1Score || 0), 0);
  const t2Total = (selectedGame.rounds || []).reduce((acc, r) => acc + (r.team2Score || 0), 0);
  const t3Total = (selectedGame.rounds || []).reduce((acc, r) => acc + (r.team3Score || 0), 0);

  return (
    <div className="space-y-4">
      {/* Barra Navigazione & Azioni */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <button
          type="button"
          onClick={onBack}
          className="min-h-[42px] px-3 rounded-xl club-btn-secondary text-xs club-text-gold font-bold flex items-center gap-1.5 cursor-pointer self-start"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Torna all'archivio</span>
        </button>

        <div className="flex items-center gap-2 flex-wrap">
          {onEndGame && !selectedGame.isFinished && (
            <button
              type="button"
              onClick={async () => {
                try {
                  if (activeGame && activeGame.id === selectedGame.id) {
                    onEndGame();
                  } else if (onResumeGame) {
                    const resumed = await onResumeGame(selectedGame);
                    onEndGame(resumed || selectedGame);
                  }
                } finally {
                  if (typeof onClose === 'function') onClose();
                }
              }}
              className="min-h-[42px] px-3.5 rounded-xl club-btn-secondary text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              title="Assegna vittoria e archivia ufficialmente"
            >
              <Flag className="w-4 h-4 club-text-gold" />
              <span>Concludi</span>
            </button>
          )}

          {onResumeGame && (
            <button
              type="button"
              onClick={async () => {
                try {
                  await onResumeGame(selectedGame);
                } finally {
                  if (typeof onClose === 'function') onClose();
                }
              }}
              className="min-h-[42px] px-4 rounded-xl gold-gradient font-bold text-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <PlayCircle className="w-4 h-4" />
              <span>{selectedGame.id === activeGame?.id ? 'Al Tabellone' : 'Riprendi'}</span>
            </button>
          )}

          {onDeleteGameWithConfirm && (
            <button
              type="button"
              onClick={() => onDeleteGameWithConfirm(selectedGame)}
              className="w-[42px] h-[42px] rounded-xl bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-500/40 flex items-center justify-center cursor-pointer"
              title="Elimina definitivamente questa partita"
              aria-label="Elimina partita"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Stato Partita in sospeso */}
      {!selectedGame.isFinished && (
        <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl club-inset border border-[var(--accent-gold)] text-xs font-semibold">
          <span className="flex items-center gap-2 club-text-gold">
            <span className="w-2 h-2 rounded-full bg-[var(--accent-gold)]" />
            <span>Partita in corso ({selectedGame.rounds?.length || 0} mani)</span>
          </span>
          <span className="font-mono-num club-text-muted">
            Traguardo: {selectedGame.targetScore || 2505} pt
          </span>
        </div>
      )}

      {/* Riepilogo Squadre */}
      <div className="p-3.5 rounded-2xl club-inset border club-border">
        <div className={`grid ${isTrio ? 'grid-cols-3' : 'grid-cols-2'} gap-2.5 text-center`}>
          <div
            className={`p-3 rounded-xl border ${
              selectedGame.winner === 'team1'
                ? 'club-card border-[var(--accent-gold)]'
                : 'bg-black/20 border-[var(--border-subtle)]'
            }`}
          >
            <span className="text-xs font-bold club-text-gold block truncate">
              ♦ {selectedGame.team1?.name || 'Sq. 1'}
            </span>
            <span className="text-[11px] club-text-subtle block mb-1 truncate">
              {(selectedGame.team1?.players || []).join(' & ') || 'Giocatori'}
            </span>
            <span className="font-mono-num text-xl sm:text-2xl font-bold text-white block">
              {t1Total} <small className="text-xs font-normal club-text-subtle">pt</small>
            </span>
            {selectedGame.winner === 'team1' && (
              <span className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-black club-text-gold uppercase tracking-wider">
                <Trophy className="w-3 h-3" /> Vincitore
              </span>
            )}
          </div>

          <div
            className={`p-3 rounded-xl border ${
              selectedGame.winner === 'team2'
                ? 'club-card border-sky-400'
                : 'bg-black/20 border-[var(--border-subtle)]'
            }`}
          >
            <span className="text-xs font-bold text-sky-300 block truncate">
              ♠ {selectedGame.team2?.name || 'Sq. 2'}
            </span>
            <span className="text-[11px] club-text-subtle block mb-1 truncate">
              {(selectedGame.team2?.players || []).join(' & ') || 'Giocatori'}
            </span>
            <span className="font-mono-num text-xl sm:text-2xl font-bold text-white block">
              {t2Total} <small className="text-xs font-normal club-text-subtle">pt</small>
            </span>
            {selectedGame.winner === 'team2' && (
              <span className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-black text-sky-300 uppercase tracking-wider">
                <Trophy className="w-3 h-3" /> Vincitore
              </span>
            )}
          </div>

          {isTrio && (
            <div
              className={`p-3 rounded-xl border ${
                selectedGame.winner === 'team3'
                  ? 'club-card border-rose-400'
                  : 'bg-black/20 border-[var(--border-subtle)]'
              }`}
            >
              <span className="text-xs font-bold text-rose-300 block truncate">
                ♥ {selectedGame.team3?.name || 'G3'}
              </span>
              <span className="text-[11px] club-text-subtle block mb-1 truncate">
                {(selectedGame.team3?.players || []).join(' & ') || 'Giocatore'}
              </span>
              <span className="font-mono-num text-xl sm:text-2xl font-bold text-white block">
                {t3Total} <small className="text-xs font-normal club-text-subtle">pt</small>
              </span>
              {selectedGame.winner === 'team3' && (
                <span className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-black text-rose-300 uppercase tracking-wider">
                  <Trophy className="w-3 h-3" /> Vincitore
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tabella Mani della partita */}
      <div className="rounded-2xl club-inset border club-divider overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b club-divider club-text-subtle uppercase text-[10px] tracking-wider">
            <tr>
              <th className="p-2.5 text-center w-12">Mano</th>
              <th className="p-2.5 club-text-gold truncate max-w-[110px]">{selectedGame.team1?.name || 'Sq. 1'}</th>
              <th className="p-2.5 text-sky-300 truncate max-w-[110px]">{selectedGame.team2?.name || 'Sq. 2'}</th>
              {isTrio && (
                <th className="p-2.5 text-rose-300 truncate max-w-[100px]">{selectedGame.team3?.name || 'G3'}</th>
              )}
              {onEditRound && onResumeGame && (
                <th className="p-2.5 text-center w-14">Mod.</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)]">
            {(selectedGame.rounds || []).map(r => (
              <tr key={r.roundNumber} className="hover:bg-white/5">
                <td className="p-2.5 text-center font-mono-num font-bold club-text-muted">#{r.roundNumber}</td>
                <td className="p-2.5 font-mono-num font-bold text-white">
                  {r.team1Score >= 0 ? `+${r.team1Score}` : r.team1Score}
                </td>
                <td className="p-2.5 font-mono-num font-bold text-white">
                  {r.team2Score >= 0 ? `+${r.team2Score}` : r.team2Score}
                </td>
                {isTrio && (
                  <td className="p-2.5 font-mono-num font-bold text-white">
                    {(r.team3Score || 0) >= 0 ? `+${r.team3Score || 0}` : r.team3Score}
                  </td>
                )}
                {onEditRound && onResumeGame && (
                  <td className="p-1.5 text-center">
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await onResumeGame(selectedGame);
                          onEditRound(r);
                        } finally {
                          if (typeof onClose === 'function') onClose();
                        }
                      }}
                      className="w-9 h-9 rounded-lg club-btn-secondary club-text-gold inline-flex items-center justify-center cursor-pointer"
                      title={`Modifica mano #${r.roundNumber}`}
                      aria-label={`Modifica mano ${r.roundNumber}`}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Aggiungi Mano */}
      {onAddRound && onResumeGame && (
        <button
          type="button"
          onClick={async () => {
            try {
              await onResumeGame(selectedGame);
              onAddRound();
            } finally {
              if (typeof onClose === 'function') onClose();
            }
          }}
          className="w-full min-h-[48px] rounded-xl gold-gradient font-bold text-sm flex items-center justify-center gap-2 active:scale-95 cursor-pointer transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Aggiungi Mano a questa Partita</span>
        </button>
      )}
    </div>
  );
}
