import React, { useState } from 'react';
import { LayoutList, Table, Edit2, Trash2 } from 'lucide-react';
import RoundEventChips from './RoundEventChips';

export default function RoundsHistoryList({
  activeGame,
  isTrio = false,
  roundsWithProgressive = [],
  targetScore = 2505,
  onAddRound,
  onEditRound,
  onDeleteRound,
}) {
  const [viewMode, setViewMode] = useState(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return 'cards';
    }
    return 'table';
  });

  return (
    <div className="club-card rounded-2xl overflow-hidden">
      <div className="py-3 px-4 border-b club-divider flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="club-text-gold text-sm">♦ ♠</span>
          <h3 className="text-sm font-bold text-white m-0">Foglio Segnapunti</h3>
        </div>

        <div className="flex items-center gap-2">
          {roundsWithProgressive.length > 0 && (
            <div className="flex items-center gap-0.5 club-tab-bar p-0.5 rounded-xl">
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`min-h-[32px] px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                  viewMode === 'cards'
                    ? 'gold-gradient'
                    : 'club-text-muted hover:text-white'
                }`}
              >
                <LayoutList className="w-3.5 h-3.5" />
                <span>Schede</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`min-h-[32px] px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'gold-gradient'
                    : 'club-text-muted hover:text-white'
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
          <h4 className="text-sm font-bold text-white">Nessuna mano registrata</h4>
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
                key={roundNum}
                className={`p-3 rounded-xl club-inset transition-all ${
                  isLast ? 'border-amber-400/55' : ''
                }`}
              >
                <div className="flex items-center justify-between gap-2 pb-2 mb-2.5 border-b club-divider">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono-num text-xs font-bold club-text-gold">
                      #{roundNum}
                    </span>
                    <span className="text-xs font-bold text-white">
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
                        className="min-h-[38px] min-w-[38px] px-2.5 rounded-lg hover:bg-white/5 text-white text-xs font-semibold flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
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
                        className="min-h-[38px] min-w-[38px] rounded-lg hover:bg-rose-500/15 text-rose-300 flex items-center justify-center active:scale-95 transition-all cursor-pointer"
                        aria-label={`Elimina Mano #${roundNum}`}
                        title={`Elimina Mano #${roundNum}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className={`grid ${isTrio ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-2'} gap-2`}>
                  {/* Squadra 1 */}
                  <div className={`p-2.5 rounded-xl border ${t1WonHand ? 'border-amber-400/45 bg-amber-400/5' : 'club-divider bg-black/15'}`}>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[11px] font-bold text-amber-300 truncate">
                        ♦ {activeGame.team1?.name || 'Squadra 1'}
                      </span>
                      {isTrio && r.lonePlayer === 'team1' && (
                        <span className="text-[10px] font-bold text-amber-300 shrink-0">Solitario</span>
                      )}
                    </div>

                    <div className={`font-mono-num text-lg font-bold tracking-tight ${
                      r.team1Score >= 0 ? 'text-white' : 'text-rose-300'
                    }`}>
                      {r.team1Score >= 0 ? `+${r.team1Score}` : r.team1Score}
                    </div>

                    <div className="text-[11px] club-text-subtle mt-1 pt-1 border-t club-divider font-mono-num">
                      Tot <strong className="text-white">{Number(r.runningT1 || 0).toLocaleString('it-IT')}</strong>
                    </div>
                    {r.entryMode !== 'quick' && <RoundEventChips details={r.team1Details} />}
                  </div>

                  {/* Squadra 2 */}
                  <div className={`p-2.5 rounded-xl border ${t2WonHand ? 'border-sky-400/45 bg-sky-400/5' : 'club-divider bg-black/15'}`}>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[11px] font-bold text-sky-300 truncate">
                        ♠ {activeGame.team2?.name || 'Squadra 2'}
                      </span>
                      {isTrio && r.lonePlayer === 'team2' && (
                        <span className="text-[10px] font-bold text-sky-300 shrink-0">Solitario</span>
                      )}
                    </div>

                    <div className={`font-mono-num text-lg font-bold tracking-tight ${
                      r.team2Score >= 0 ? 'text-white' : 'text-rose-300'
                    }`}>
                      {r.team2Score >= 0 ? `+${r.team2Score}` : r.team2Score}
                    </div>

                    <div className="text-[11px] club-text-subtle mt-1 pt-1 border-t club-divider font-mono-num">
                      Tot <strong className="text-white">{Number(r.runningT2 || 0).toLocaleString('it-IT')}</strong>
                    </div>
                    {r.entryMode !== 'quick' && <RoundEventChips details={r.team2Details} />}
                  </div>

                  {/* Squadra 3 */}
                  {isTrio && (
                    <div className={`p-2.5 rounded-xl border ${t3WonHand ? 'border-rose-400/45 bg-rose-400/5' : 'club-divider bg-black/15'}`}>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[11px] font-bold text-rose-300 truncate">
                          ♥ {activeGame.team3?.name || 'Giocatore 3'}
                        </span>
                        {r.lonePlayer === 'team3' && (
                          <span className="text-[10px] font-bold text-rose-300 shrink-0">Solitario</span>
                        )}
                      </div>

                      <div className={`font-mono-num text-lg font-bold tracking-tight ${
                        (r.team3Score || 0) >= 0 ? 'text-white' : 'text-rose-300'
                      }`}>
                        {(r.team3Score || 0) >= 0 ? `+${r.team3Score || 0}` : r.team3Score}
                      </div>

                      <div className="text-[11px] club-text-subtle mt-1 pt-1 border-t club-divider font-mono-num">
                        Tot <strong className="text-white">{Number(r.runningT3 || 0).toLocaleString('it-IT')}</strong>
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
              <tr className="border-b club-divider bg-black/20 text-[11px] font-bold uppercase tracking-wider club-text-gold">
                <th className="py-2.5 px-3 text-center w-14">Mano</th>
                <th className="py-2.5 px-3 text-amber-300">
                  ♦ {activeGame.team1?.name || 'Squadra 1'}
                </th>
                <th className="py-2.5 px-3 text-sky-300">
                  ♠ {activeGame.team2?.name || 'Squadra 2'}
                </th>
                {isTrio && (
                  <th className="py-2.5 px-3 text-rose-300">
                    ♥ {activeGame.team3?.name || 'Giocatore 3'}
                  </th>
                )}
                <th className="py-2.5 px-3 text-right w-20">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y club-divider text-xs sm:text-sm">
              {roundsWithProgressive.map((r, index) => {
                const isLast = index === roundsWithProgressive.length - 1;
                const roundNum = r.roundNumber || index + 1;
                return (
                  <tr
                    key={roundNum}
                    className={`${isLast ? 'bg-amber-400/10' : ''} hover:bg-white/5 transition-colors`}
                  >
                    <td className="py-2.5 px-3 text-center">
                      <span className="font-mono-num font-bold club-text-gold text-xs">
                        #{roundNum}
                      </span>
                    </td>

                    <td className="py-2.5 px-3">
                      <div className="flex items-baseline gap-2 flex-wrap font-mono-num">
                        <span className="font-bold text-white text-sm">
                          {Number(r.runningT1 || 0).toLocaleString('it-IT')}
                        </span>
                        <span className={`text-xs font-bold ${
                          r.team1Score >= 0 ? 'text-amber-300' : 'text-rose-300'
                        }`}>
                          ({r.team1Score >= 0 ? `+${r.team1Score}` : r.team1Score})
                        </span>
                      </div>
                      {r.entryMode !== 'quick' && <RoundEventChips details={r.team1Details} />}
                    </td>

                    <td className="py-2.5 px-3">
                      <div className="flex items-baseline gap-2 flex-wrap font-mono-num">
                        <span className="font-bold text-white text-sm">
                          {Number(r.runningT2 || 0).toLocaleString('it-IT')}
                        </span>
                        <span className={`text-xs font-bold ${
                          r.team2Score >= 0 ? 'text-sky-300' : 'text-rose-300'
                        }`}>
                          ({r.team2Score >= 0 ? `+${r.team2Score}` : r.team2Score})
                        </span>
                      </div>
                      {r.entryMode !== 'quick' && <RoundEventChips details={r.team2Details} />}
                    </td>

                    {isTrio && (
                      <td className="py-2.5 px-3">
                        <div className="flex items-baseline gap-2 flex-wrap font-mono-num">
                          <span className="font-bold text-white text-sm">
                            {Number(r.runningT3 || 0).toLocaleString('it-IT')}
                          </span>
                          <span className={`text-xs font-bold ${
                            (r.team3Score || 0) >= 0 ? 'text-rose-300' : 'text-rose-400'
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
                            className="p-2 rounded-lg hover:bg-white/10 club-text-gold cursor-pointer"
                            title="Modifica mano"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {onDeleteRound && (
                          <button
                            type="button"
                            onClick={() => onDeleteRound(roundNum)}
                            className="p-2 rounded-lg hover:bg-rose-500/15 text-rose-400 cursor-pointer"
                            title={`Elimina Mano #${roundNum}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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