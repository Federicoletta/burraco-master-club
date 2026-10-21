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
    <div className="felt-card rounded-2xl border border-white/10 overflow-hidden shadow-xl">
      <div className="py-2.5 px-3 sm:px-4 bg-black/30 border-b border-white/10 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-amber-400 font-serif text-base sm:text-lg">♦ ♠</span>
          <h3 className="text-xs sm:text-sm font-bold text-white m-0">Foglio Segnapunti Mani</h3>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Selettore Vista Schede / Tabella */}
          {roundsWithProgressive.length > 0 && (
            <div className="flex items-center gap-0.5 bg-black/40 p-0.5 rounded-lg border border-white/15 shadow-inner">
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`px-2 py-1 rounded-md text-[10px] sm:text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  viewMode === 'cards'
                    ? 'bg-amber-400 text-emerald-950 shadow-xs'
                    : 'text-white/70 hover:text-white'
                }`}
                title="Visualizzazione a schede (intuitiva su smartphone)"
              >
                <LayoutList className="w-3 h-3" />
                <span>Schede</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-2 py-1 rounded-md text-[10px] sm:text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-amber-400 text-emerald-950 shadow-xs'
                    : 'text-white/70 hover:text-white'
                }`}
                title="Visualizzazione a tabella classica"
              >
                <Table className="w-3 h-3" />
                <span>Tabella</span>
              </button>
            </div>
          )}

          <span className="hidden sm:inline-block px-2 py-0.5 rounded-md bg-black/30 border border-white/15 text-[10px] sm:text-[11px] text-white/80">
            Traguardo: <strong className="text-amber-300">{targetScore} pt</strong>
          </span>
        </div>
      </div>

      {roundsWithProgressive.length === 0 ? (
        <div className="p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-white/10 border border-white/15 flex items-center justify-center mx-auto text-amber-300">
            ♣
          </div>
          <h4 className="text-sm font-bold text-white">Nessuna mano registrata</h4>
          <p className="text-xs text-white/70 max-w-sm mx-auto">
            Mescolate le carte e distribuite i due pozzetti! Quando la prima mano si conclude, clicca su "Aggiungi Mano" per registrare i punti.
          </p>
          {onAddRound && (
            <button
              onClick={onAddRound}
              className="mt-2 px-4 py-2 rounded-xl gold-gradient text-emerald-950 font-bold text-xs shadow-md cursor-pointer hover:brightness-110"
            >
              + Inserisci Prima Mano
            </button>
          )}
        </div>
      ) : viewMode === 'cards' ? (
        /* VISTA A SCHEDE (Mobile first, super intuitiva e leggibile) */
        <div className="p-2.5 sm:p-3 space-y-2.5">
          {roundsWithProgressive.map((r, index) => {
            const isLast = index === roundsWithProgressive.length - 1;
            const t1WonHand = isTrio
              ? (r.team1Score > r.team2Score && r.team1Score > (r.team3Score || 0))
              : (r.team1Score > r.team2Score);
            const t2WonHand = isTrio
              ? (r.team2Score > r.team1Score && r.team2Score > (r.team3Score || 0))
              : (r.team2Score > r.team1Score);
            const t3WonHand = isTrio && (r.team3Score > r.team1Score && r.team3Score > r.team2Score);

            return (
              <div 
                key={r.roundNumber || index} 
                className={`p-3 rounded-2xl border transition-all ${
                  isLast 
                    ? 'bg-black/40 border-amber-500/50 shadow-lg ring-1 ring-amber-400/20' 
                    : 'bg-black/25 border-white/10 shadow-xs'
                }`}
              >
                {/* Intestazione della singola mano */}
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-black/40 text-amber-300 font-black text-xs flex items-center justify-center border border-amber-500/30 shadow-xs">
                      #{r.roundNumber || index + 1}
                    </span>
                    <span className="text-xs font-bold text-white">
                      Mano {r.roundNumber || index + 1}
                    </span>
                    {isLast && (
                      <span className="text-[10px] px-2 py-0.2 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 font-black uppercase tracking-wider">
                        Ultima
                      </span>
                    )}
                    {r.recordedBy && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-950/60 text-emerald-300 border border-emerald-700/40 font-medium truncate max-w-[120px]" title={`Registrata da ${r.recordedBy}`}>
                        ✍️ {r.recordedBy}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {onEditRound && (
                      <button
                        type="button"
                        onClick={() => onEditRound(r)}
                        className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white/90 hover:text-white border border-white/15 text-[11px] font-semibold flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-xs"
                        title="Modifica punteggio di questa mano"
                      >
                        <Edit2 className="w-3 h-3 text-amber-300" />
                        <span>Modifica</span>
                      </button>
                    )}
                    {onDeleteRound && (
                      <button
                        type="button"
                        onClick={() => onDeleteRound(r.roundNumber || index + 1)}
                        className="px-2 py-1 rounded-lg bg-rose-950/40 hover:bg-rose-900/80 text-rose-300 hover:text-white border border-rose-700/50 text-[11px] font-semibold flex items-center gap-1 active:scale-95 transition-all cursor-pointer shadow-xs"
                        title={`Elimina Mano #${r.roundNumber || index + 1}`}
                      >
                        <Trash2 className="w-3 h-3 text-rose-400" />
                        <span className="hidden xs:inline">Elimina</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Confronto Squadre affiancate */}
                <div className={`grid grid-cols-1 ${isTrio ? 'sm:grid-cols-3' : 'grid-cols-2'} gap-2`}>
                  
                  {/* Squadra 1 */}
                  <div className={`p-2.5 rounded-xl border flex flex-col justify-between transition-all ${
                    t1WonHand
                      ? 'bg-gradient-to-b from-amber-500/10 to-black/30 border-amber-500/40 shadow-xs'
                      : 'bg-black/20 border-white/10'
                  }`}>
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[11px] font-bold text-amber-300 truncate">
                          ♦ {activeGame.team1?.name || 'Squadra 1'}
                        </span>
                        {isTrio && r.lonePlayer === 'team1' && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-400/20 text-amber-300 font-extrabold border border-amber-400/30 shrink-0">
                            👤 Solitario
                          </span>
                        )}
                        {!isTrio && t1WonHand && r.team1Score - r.team2Score > 0 && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-400/20 text-amber-300 font-bold border border-amber-400/30 shrink-0">
                            +{r.team1Score - r.team2Score}
                          </span>
                        )}
                      </div>

                      {/* Punti guadagnati nella mano */}
                      <div className="my-0.5">
                        <div className="flex items-baseline gap-1">
                          <span className={`text-xl font-black tracking-tight ${
                            r.team1Score >= 0 ? 'text-white' : 'text-rose-300'
                          }`}>
                            {r.team1Score >= 0 ? `+${r.team1Score}` : r.team1Score}
                          </span>
                          <span className="text-[10px] text-white/60 font-medium"> nella mano</span>
                        </div>
                      </div>

                      {/* Totale cumulativo dopo la mano */}
                      <div className="text-[11px] text-white/80 font-medium mt-1 pt-1 border-t border-white/10">
                        Totale: <strong className="text-white font-black">{Number(r.runningT1 || 0).toLocaleString('it-IT')} pt</strong>
                      </div>
                    </div>

                    {/* Eventi smazzata (Burrachi, Chiusura, Pozzetto) */}
                    {r.entryMode !== 'quick' && <RoundEventChips details={r.team1Details} />}
                  </div>

                  {/* Squadra 2 */}
                  <div className={`p-2.5 rounded-xl border flex flex-col justify-between transition-all ${
                    t2WonHand
                      ? 'bg-gradient-to-b from-blue-500/10 to-black/30 border-blue-400/40 shadow-xs'
                      : 'bg-black/20 border-white/10'
                  }`}>
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[11px] font-bold text-blue-300 truncate">
                          ♠ {activeGame.team2?.name || 'Squadra 2'}
                        </span>
                        {isTrio && r.lonePlayer === 'team2' && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-blue-400/20 text-blue-300 font-extrabold border border-blue-400/30 shrink-0">
                            👤 Solitario
                          </span>
                        )}
                        {!isTrio && t2WonHand && r.team2Score - r.team1Score > 0 && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-blue-400/20 text-blue-300 font-bold border border-blue-400/30 shrink-0">
                            +{r.team2Score - r.team1Score}
                          </span>
                        )}
                      </div>

                      {/* Punti guadagnati nella mano */}
                      <div className="my-0.5">
                        <div className="flex items-baseline gap-1">
                          <span className={`text-xl font-black tracking-tight ${
                            r.team2Score >= 0 ? 'text-white' : 'text-rose-300'
                          }`}>
                            {r.team2Score >= 0 ? `+${r.team2Score}` : r.team2Score}
                          </span>
                          <span className="text-[10px] text-blue-300/70 font-medium"> nella mano</span>
                        </div>
                      </div>

                      {/* Totale cumulativo dopo la mano */}
                      <div className="text-[11px] text-white/80 font-medium mt-1 pt-1 border-t border-white/10">
                        Totale: <strong className="text-white font-black">{Number(r.runningT2 || 0).toLocaleString('it-IT')} pt</strong>
                      </div>
                    </div>

                    {/* Eventi smazzata (Burrachi, Chiusura, Pozzetto) */}
                    {r.entryMode !== 'quick' && <RoundEventChips details={r.team2Details} />}
                  </div>

                  {/* Squadra 3 (se a 3) */}
                  {isTrio && (
                    <div className={`p-2.5 rounded-xl border flex flex-col justify-between transition-all ${
                      t3WonHand
                        ? 'bg-gradient-to-b from-rose-500/10 to-black/30 border-rose-400/40 shadow-xs'
                        : 'bg-black/20 border-white/10'
                    }`}>
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-[11px] font-bold text-rose-300 truncate">
                            ♥ {activeGame.team3?.name || 'Giocatore 3'}
                          </span>
                          {r.lonePlayer === 'team3' && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-rose-400/20 text-rose-300 font-extrabold border border-rose-400/30 shrink-0">
                              👤 Solitario
                            </span>
                          )}
                        </div>

                        {/* Punti guadagnati nella mano */}
                        <div className="my-0.5">
                          <div className="flex items-baseline gap-1">
                            <span className={`text-xl font-black tracking-tight ${
                              (r.team3Score || 0) >= 0 ? 'text-white' : 'text-rose-300'
                            }`}>
                              {(r.team3Score || 0) >= 0 ? `+${r.team3Score || 0}` : r.team3Score}
                            </span>
                            <span className="text-[10px] text-rose-300/70 font-medium"> nella mano</span>
                          </div>
                        </div>

                        {/* Totale cumulativo dopo la mano */}
                        <div className="text-[11px] text-white/80 font-medium mt-1 pt-1 border-t border-white/10">
                          Totale: <strong className="text-white font-black">{Number(r.runningT3 || 0).toLocaleString('it-IT')} pt</strong>
                        </div>
                      </div>

                      {/* Eventi smazzata (Burrachi, Chiusura, Pozzetto) */}
                      {r.entryMode !== 'quick' && <RoundEventChips details={r.team3Details} />}
                    </div>
                  )}

                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* VISTA A TABELLA (Desktop e tablet, con dicitura chiara "mano" e "totale") */
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/15 bg-black/40 text-[11px] font-bold uppercase tracking-wider text-amber-300">
                <th className="py-2.5 px-3 sm:px-4 text-center w-12 sm:w-16">Mano</th>
                <th className="py-2.5 px-3 sm:px-4 text-amber-300">
                  ♦ {activeGame.team1?.name || 'Squadra 1'}
                </th>
                <th className="py-2.5 px-3 sm:px-4 text-blue-300">
                  ♠ {activeGame.team2?.name || 'Squadra 2'}
                </th>
                {isTrio && (
                  <th className="py-2.5 px-3 sm:px-4 text-rose-300">
                    ♥ {activeGame.team3?.name || 'Giocatore 3'}
                  </th>
                )}
                <th className="py-2.5 px-3 sm:px-4 text-right w-16">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 text-xs sm:text-sm">
              {roundsWithProgressive.map((r, index) => {
                const isLast = index === roundsWithProgressive.length - 1;
                return (
                  <tr 
                    key={r.roundNumber || index} 
                    className={`transition-colors border-b border-white/10 ${
                      isLast ? 'bg-amber-400/10' : index % 2 === 0 ? 'bg-black/20' : 'bg-transparent'
                    } hover:bg-white/5`}
                  >
                    {/* Numero Mano */}
                    <td className="py-2.5 px-2.5 sm:px-4 text-center">
                      <div className="flex flex-col items-center">
                        <span className="inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-black/40 text-amber-300 font-black text-xs border border-white/15 shadow-inner">
                          #{r.roundNumber || index + 1}
                        </span>
                        {r.recordedBy && (
                          <span className="text-[9px] text-emerald-300/80 truncate max-w-[65px] font-medium" title={`Registrata da ${r.recordedBy}`}>
                            {r.recordedBy}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Squadra 1 */}
                    <td className="py-2.5 px-2.5 sm:px-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-white text-sm sm:text-base tracking-tight">
                          {Number(r.runningT1 || 0).toLocaleString('it-IT')}
                          <span className="text-[10px] font-normal text-white/50 ml-1">tot</span>
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[11px] sm:text-xs font-bold ${
                          r.team1Score >= 0 
                            ? 'bg-amber-400/15 text-amber-300 border border-amber-400/30' 
                            : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                        }`}>
                          {r.team1Score >= 0 ? `+${r.team1Score}` : r.team1Score} mano
                        </span>
                        {isTrio && r.lonePlayer === 'team1' && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-400/20 text-amber-300 font-extrabold border border-amber-400/30">
                            👤 Solitario
                          </span>
                        )}
                      </div>
                      {r.entryMode !== 'quick' && <RoundEventChips details={r.team1Details} />}
                    </td>

                    {/* Squadra 2 */}
                    <td className="py-2.5 px-2.5 sm:px-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-white text-sm sm:text-base tracking-tight">
                          {Number(r.runningT2 || 0).toLocaleString('it-IT')}
                          <span className="text-[10px] font-normal text-white/50 ml-1">tot</span>
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[11px] sm:text-xs font-bold ${
                          r.team2Score >= 0 
                            ? 'bg-blue-400/15 text-blue-300 border border-blue-400/30' 
                            : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                        }`}>
                          {r.team2Score >= 0 ? `+${r.team2Score}` : r.team2Score} mano
                        </span>
                        {isTrio && r.lonePlayer === 'team2' && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-400/20 text-blue-300 font-extrabold border border-blue-400/30">
                            👤 Solitario
                          </span>
                        )}
                      </div>
                      {r.entryMode !== 'quick' && <RoundEventChips details={r.team2Details} />}
                    </td>

                    {/* Squadra 3 (se a 3) */}
                    {isTrio && (
                      <td className="py-2.5 px-2.5 sm:px-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-black text-white text-sm sm:text-base tracking-tight">
                            {Number(r.runningT3 || 0).toLocaleString('it-IT')}
                            <span className="text-[10px] font-normal text-white/50 ml-1">tot</span>
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[11px] sm:text-xs font-bold ${
                            (r.team3Score || 0) >= 0 
                              ? 'bg-rose-400/15 text-rose-300 border border-rose-400/30' 
                              : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                          }`}>
                            {(r.team3Score || 0) >= 0 ? `+${r.team3Score || 0}` : r.team3Score} mano
                          </span>
                          {r.lonePlayer === 'team3' && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-400/20 text-rose-300 font-extrabold border border-rose-400/30">
                              👤 Solitario
                            </span>
                          )}
                        </div>
                        {r.entryMode !== 'quick' && <RoundEventChips details={r.team3Details} />}
                      </td>
                    )}

                    {/* Azioni riga */}
                    <td className="py-2.5 px-2.5 sm:px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {onEditRound && (
                          <button
                            type="button"
                            onClick={() => onEditRound(r)}
                            className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
                            title="Modifica punteggio di questa mano"
                          >
                            <Edit2 className="w-4 h-4 text-amber-300" />
                          </button>
                        )}
                        {onDeleteRound && (
                          <button
                            type="button"
                            onClick={() => onDeleteRound(r.roundNumber || index + 1)}
                            className="p-1.5 rounded-lg hover:bg-rose-950/60 text-rose-400/80 hover:text-rose-300 transition-colors cursor-pointer"
                            title={`Elimina Mano #${r.roundNumber || index + 1}`}
                          >
                            <Trash2 className="w-4 h-4 text-rose-400" />
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