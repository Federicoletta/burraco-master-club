import React, { memo, useEffect, useState } from 'react';
import { LayoutList, Table, Edit2, Trash2 } from 'lucide-react';
import RoundEventChips from './RoundEventChips';

const WIDE_MEDIA_QUERY = '(min-width: 768px)';

function getInitialWideState() {
  if (typeof window === 'undefined') return true;
  if (typeof window.matchMedia === 'function') {
    return window.matchMedia(WIDE_MEDIA_QUERY).matches;
  }
  return window.innerWidth >= 768;
}

function RoundsHistoryList({
  activeGame,
  isTrio = false,
  roundsWithProgressive = [],
  targetScore = 2505,
  onAddRound,
  onEditRound,
  onDeleteRound,
}) {
  const [isWideViewport, setIsWideViewport] = useState(getInitialWideState);
  const [userOverride, setUserOverride] = useState(null); // null | 'cards' | 'table'

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined;
    const mql = window.matchMedia(WIDE_MEDIA_QUERY);
    const handleChange = (event) => {
      setIsWideViewport(Boolean(event.matches));
    };

    if (typeof mql.addEventListener === 'function') {
      mql.addEventListener('change', handleChange);
      return () => mql.removeEventListener('change', handleChange);
    }
    if (typeof mql.addListener === 'function') {
      mql.addListener(handleChange);
      return () => mql.removeListener(handleChange);
    }
    return undefined;
  }, []);

  const viewMode = userOverride ?? (isWideViewport ? 'table' : 'cards');

  return (
    <div className="club-card rounded-2xl overflow-hidden">
      <div className="py-3 px-4 border-b club-divider flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="club-text-gold text-sm">♦ ♠</span>
          <h3 className="text-sm font-bold club-text-primary m-0">Foglio Segnapunti</h3>
        </div>

        <div className="flex items-center gap-2">
          {roundsWithProgressive.length > 0 && (
            <div className="flex items-center gap-0.5 club-tab-bar p-0.5 rounded-xl">
              <button
                type="button"
                onClick={() => setUserOverride('cards')}
                aria-pressed={viewMode === 'cards'}
                className={`min-h-[36px] px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                  viewMode === 'cards'
                    ? 'gold-gradient'
                    : 'club-text-muted'
                }`}
              >
                <LayoutList className="w-3.5 h-3.5" />
                <span>Schede</span>
              </button>
              <button
                type="button"
                onClick={() => setUserOverride('table')}
                aria-pressed={viewMode === 'table'}
                className={`min-h-[36px] px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'gold-gradient'
                    : 'club-text-muted'
                }`}
              >
                <Table className="w-3.5 h-3.5" />
                <span>Tabella</span>
              </button>
            </div>
          )}

          <span className="hidden sm:inline-block text-xs club-text-subtle">
            Obiettivo <strong className="font-mono-num club-text-gold">{targetScore}</strong>
          </span>
        </div>
      </div>

      {roundsWithProgressive.length === 0 ? (
        <div className="p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl club-inset flex items-center justify-center mx-auto club-text-gold text-lg">
            ♣
          </div>
          <h4 className="text-sm font-bold club-text-primary">Nessuna mano registrata</h4>
          <p className="text-xs club-text-muted max-w-xs mx-auto leading-relaxed">
            Mescolate le carte e distribuite i due pozzetti. Al termine della mano toccate &ldquo;Registra Smazzata&rdquo;.
          </p>
          {onAddRound && (
            <button
              type="button"
              onClick={onAddRound}
              className="mt-1 min-h-[44px] px-4 py-2 rounded-xl gold-gradient font-bold text-xs cursor-pointer"
            >
              + Inserisci Prima Mano
            </button>
          )}
        </div>
      ) : viewMode === 'cards' ? (
        <div className="p-3 space-y-2.5">
          {roundsWithProgressive.map((r, index) => {
            const isLast = index === roundsWithProgressive.length - 1;
            const roundNum = r.roundNumber || index + 1;
            const t1WonHand = isTrio
              ? (r.team1Score > r.team2Score && r.team1Score > (r.team3Score || 0))
              : (r.team1Score > r.team2Score);
            const t2WonHand = isTrio
              ? (r.team2Score > r.team1Score && r.team2Score > (r.team3Score || 0))
              : (r.team2Score > r.team1Score);
            const t3WonHand = isTrio && (r.team3Score > r.team1Score && r.team3Score > r.team2Score);

            return (
              <div
                key={r.roundId || roundNum}
                className={`p-3 rounded-xl club-inset transition-all ${
                  isLast ? 'border-[var(--accent-gold)]/60' : ''
                }`}
              >
                <div className="flex items-center justify-between gap-2 pb-2 mb-2.5 border-b club-divider">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono-num text-xs font-bold club-text-gold">
                      #{roundNum}
                    </span>
                    <span className="text-xs font-bold club-text-primary">
                      Mano {roundNum}
                    </span>
                    {r.recordedBy && (
                      <span className="text-[11px] club-text-subtle truncate max-w-[120px]">
                        · {r.recordedBy}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {onEditRound && (
                      <button
                        type="button"
                        onClick={() => onEditRound(r)}
                        className="min-h-[44px] min-w-[44px] px-2.5 rounded-lg club-hover-soft club-text-primary text-xs font-semibold flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer"
                        title="Modifica punteggio mano"
                      >
                        <Edit2 className="w-3.5 h-3.5 club-text-gold" />
                        <span>Modifica</span>
                      </button>
                    )}
                    {onDeleteRound && (
                      <button
                        type="button"
                        onClick={() => onDeleteRound(roundNum)}
                        className="min-h-[44px] min-w-[44px] rounded-lg hover:bg-rose-500/15 club-danger-text flex items-center justify-center active:scale-95 transition-all cursor-pointer"
                        aria-label={`Elimina Mano #${roundNum}`}
                        title={`Elimina Mano #${roundNum}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className={`grid ${isTrio ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-2'} gap-2`}>
                  {/* Squadra 1 */}
                  <div className={`p-2.5 rounded-xl border ${t1WonHand ? 'border-[var(--accent-gold)]/45 bg-amber-400/10' : 'club-divider club-row-bg'}`}>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[11px] font-bold club-team1 truncate">
                        ♦ {activeGame.team1?.name || 'Squadra 1'}
                      </span>
                      {isTrio && r.lonePlayer === 'team1' && (
                        <span className="text-[10px] font-bold club-team1 shrink-0">Solitario</span>
                      )}
                    </div>

                    <div className={`font-mono-num text-lg font-bold tracking-tight ${
                      r.team1Score >= 0 ? 'club-text-primary' : 'club-danger-text'
                    }`}>
                      {r.team1Score >= 0 ? `+${r.team1Score}` : r.team1Score}
                    </div>

                    <div className="text-[11px] club-text-subtle mt-1 pt-1 border-t club-divider font-mono-num">
                      Tot <strong className="club-text-primary">{Number(r.runningT1 || 0).toLocaleString('it-IT')}</strong>
                    </div>
                    {r.entryMode !== 'quick' && <RoundEventChips details={r.team1Details} />}
                  </div>

                  {/* Squadra 2 */}
                  <div className={`p-2.5 rounded-xl border ${t2WonHand ? 'border-sky-500/45 bg-sky-500/10' : 'club-divider club-row-bg'}`}>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[11px] font-bold club-team2 truncate">
                        ♠ {activeGame.team2?.name || 'Squadra 2'}
                      </span>
                      {isTrio && r.lonePlayer === 'team2' && (
                        <span className="text-[10px] font-bold club-team2 shrink-0">Solitario</span>
                      )}
                    </div>

                    <div className={`font-mono-num text-lg font-bold tracking-tight ${
                      r.team2Score >= 0 ? 'club-text-primary' : 'club-danger-text'
                    }`}>
                      {r.team2Score >= 0 ? `+${r.team2Score}` : r.team2Score}
                    </div>

                    <div className="text-[11px] club-text-subtle mt-1 pt-1 border-t club-divider font-mono-num">
                      Tot <strong className="club-text-primary">{Number(r.runningT2 || 0).toLocaleString('it-IT')}</strong>
                    </div>
                    {r.entryMode !== 'quick' && <RoundEventChips details={r.team2Details} />}
                  </div>

                  {/* Squadra 3 */}
                  {isTrio && (
                    <div className={`p-2.5 rounded-xl border ${t3WonHand ? 'border-rose-500/45 bg-rose-500/10' : 'club-divider club-row-bg'}`}>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[11px] font-bold club-team3 truncate">
                          ♥ {activeGame.team3?.name || 'Giocatore 3'}
                        </span>
                        {r.lonePlayer === 'team3' && (
                          <span className="text-[10px] font-bold club-team3 shrink-0">Solitario</span>
                        )}
                      </div>

                      <div className={`font-mono-num text-lg font-bold tracking-tight ${
                        (r.team3Score || 0) >= 0 ? 'club-text-primary' : 'club-danger-text'
                      }`}>
                        {(r.team3Score || 0) >= 0 ? `+${r.team3Score || 0}` : r.team3Score}
                      </div>

                      <div className="text-[11px] club-text-subtle mt-1 pt-1 border-t club-divider font-mono-num">
                        Tot <strong className="club-text-primary">{Number(r.runningT3 || 0).toLocaleString('it-IT')}</strong>
                      </div>
                      {r.entryMode !== 'quick' && <RoundEventChips details={r.team3Details} />}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b club-divider club-table-head text-[11px] font-bold uppercase tracking-wider club-text-gold">
                <th className="py-2.5 px-3 text-center w-14">Mano</th>
                <th className="py-2.5 px-3 club-team1">
                  ♦ {activeGame.team1?.name || 'Squadra 1'}
                </th>
                <th className="py-2.5 px-3 club-team2">
                  ♠ {activeGame.team2?.name || 'Squadra 2'}
                </th>
                {isTrio && (
                  <th className="py-2.5 px-3 club-team3">
                    ♥ {activeGame.team3?.name || 'Giocatore 3'}
                  </th>
                )}
                <th className="py-2.5 px-3 text-right w-24">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y club-divider text-xs sm:text-sm">
              {roundsWithProgressive.map((r, index) => {
                const isLast = index === roundsWithProgressive.length - 1;
                const roundNum = r.roundNumber || index + 1;
                return (
                  <tr
                    key={r.roundId || roundNum}
                    className={`${isLast ? 'bg-amber-400/10' : ''} club-hover-soft transition-colors`}
                  >
                    <td className="py-2.5 px-3 text-center">
                      <span className="font-mono-num font-bold club-text-gold text-xs">
                        #{roundNum}
                      </span>
                    </td>

                    <td className="py-2.5 px-3">
                      <div className="flex items-baseline gap-2 flex-wrap font-mono-num">
                        <span className="font-bold club-text-primary text-sm">
                          {Number(r.runningT1 || 0).toLocaleString('it-IT')}
                        </span>
                        <span className={`text-xs font-bold ${
                          r.team1Score >= 0 ? 'club-team1' : 'club-danger-text'
                        }`}>
                          ({r.team1Score >= 0 ? `+${r.team1Score}` : r.team1Score})
                        </span>
                      </div>
                      {r.entryMode !== 'quick' && <RoundEventChips details={r.team1Details} />}
                    </td>

                    <td className="py-2.5 px-3">
                      <div className="flex items-baseline gap-2 flex-wrap font-mono-num">
                        <span className="font-bold club-text-primary text-sm">
                          {Number(r.runningT2 || 0).toLocaleString('it-IT')}
                        </span>
                        <span className={`text-xs font-bold ${
                          r.team2Score >= 0 ? 'club-team2' : 'club-danger-text'
                        }`}>
                          ({r.team2Score >= 0 ? `+${r.team2Score}` : r.team2Score})
                        </span>
                      </div>
                      {r.entryMode !== 'quick' && <RoundEventChips details={r.team2Details} />}
                    </td>

                    {isTrio && (
                      <td className="py-2.5 px-3">
                        <div className="flex items-baseline gap-2 flex-wrap font-mono-num">
                          <span className="font-bold club-text-primary text-sm">
                            {Number(r.runningT3 || 0).toLocaleString('it-IT')}
                          </span>
                          <span className={`text-xs font-bold ${
                            (r.team3Score || 0) >= 0 ? 'club-team3' : 'club-danger-text'
                          }`}>
                            ({(r.team3Score || 0) >= 0 ? `+${r.team3Score || 0}` : r.team3Score})
                          </span>
                        </div>
                        {r.entryMode !== 'quick' && <RoundEventChips details={r.team3Details} />}
                      </td>
                    )}

                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {onEditRound && (
                          <button
                            type="button"
                            onClick={() => onEditRound(r)}
                            className="min-w-[44px] min-h-[44px] rounded-lg club-hover-soft club-text-gold flex items-center justify-center cursor-pointer"
                            aria-label={`Modifica Mano #${roundNum}`}
                            title="Modifica mano"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        {onDeleteRound && (
                          <button
                            type="button"
                            onClick={() => onDeleteRound(roundNum)}
                            className="min-w-[44px] min-h-[44px] rounded-lg hover:bg-rose-500/15 club-danger-text flex items-center justify-center cursor-pointer"
                            aria-label={`Elimina Mano #${roundNum}`}
                            title={`Elimina Mano #${roundNum}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default memo(RoundsHistoryList);