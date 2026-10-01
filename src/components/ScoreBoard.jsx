import React, { useMemo } from 'react';
import { PlusCircle, Trophy, Edit2, Trash2, Share2, AlertCircle, Info, ChevronDown, BookOpen } from 'lucide-react';
import { getGamesHistory, calculatePlayerStats } from '../utils/storage';
import { getPlayerTitle } from '../utils/trophies';

export default function ScoreBoard({
  activeGame,
  gamesHistory = [],
  onAddRound,
  onEditRound,
  onDeleteLastRound,
  onEndGame,
  onShareGame,
  onOpenRules,
}) {
  if (!activeGame) return null;

  const targetScore = activeGame.targetScore || 2005;

  // Calcola titoli dei giocatori della partita
  const titlesMap = useMemo(() => {
    const allPlayersInGame = [
      ...(activeGame.team1?.players || []),
      ...(activeGame.team2?.players || [])
    ].filter(Boolean);
    const history = gamesHistory.length > 0 ? gamesHistory : getGamesHistory();
    const stats = calculatePlayerStats(allPlayersInGame, history, activeGame);
    const map = {};
    stats.forEach(s => {
      map[s.name] = getPlayerTitle(s);
    });
    return map;
  }, [activeGame, gamesHistory]);


  // Calcola totali progressivi
  let runningT1 = 0;
  let runningT2 = 0;
  const roundsWithProgressive = (activeGame.rounds || []).map((r) => {
    runningT1 += r.team1Score || 0;
    runningT2 += r.team2Score || 0;
    return {
      ...r,
      runningT1,
      runningT2,
    };
  });

  const totalTeam1 = runningT1;
  const totalTeam2 = runningT2;

  const diff = totalTeam1 - totalTeam2;
  const leader = diff > 0 ? 'team1' : diff < 0 ? 'team2' : 'tie';

  const t1Percent = Math.min(100, Math.max(0, Math.round((totalTeam1 / targetScore) * 100)));
  const t2Percent = Math.min(100, Math.max(0, Math.round((totalTeam2 / targetScore) * 100)));

  const isTargetReached = totalTeam1 >= targetScore || totalTeam2 >= targetScore;

  return (
    <div className="space-y-4 pb-20">
      
      {/* AVVISO VITTORIA O TRAGUARDO RAGGIUNTO */}
      {isTargetReached && !activeGame.isFinished && (
        <div className="p-4 rounded-2xl bg-amber-500/20 border-2 border-amber-400 text-amber-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl animate-bounce-subtle">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <Trophy className="w-8 h-8 text-amber-400 shrink-0" />
            <div>
              <h3 className="text-base font-bold text-white m-0">
                Traguardo di {targetScore} punti raggiunto!
              </h3>
              <p className="text-xs text-amber-300/90 m-0">
                {totalTeam1 > totalTeam2 
                  ? `${activeGame.team1.name} ha vinto la partita con ${totalTeam1} punti!` 
                  : `${activeGame.team2.name} ha vinto la partita con ${totalTeam2} punti!`}
              </p>
            </div>
          </div>
          <button
            onClick={onEndGame}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl gold-gradient text-emerald-950 font-black text-xs sm:text-sm shadow-md cursor-pointer hover:brightness-110 active:scale-95"
          >
            Festeggia & Termina Partita
          </button>
        </div>
      )}

      {/* CARDS PUNTEGGIO SQUADRE (TABELLONE PRINCIPALE) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        
        {/* CARD SQUADRA 1 */}
        <div className={`relative p-4 sm:p-5 rounded-2xl felt-card border transition-all ${
          leader === 'team1' ? 'border-amber-400/70 shadow-amber-900/30' : 'border-emerald-600/30'
        }`}>
          {leader === 'team1' && diff !== 0 && (
            <div className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full bg-amber-400 text-emerald-950 text-[11px] font-black tracking-wider uppercase shadow-md flex items-center gap-1">
              <span>👑 In Vantaggio</span>
              <span>(+{diff} pt)</span>
            </div>
          )}

          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <span className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1">
                <span>♦</span> {activeGame.team1.name}
              </span>
              <div className="text-xs text-emerald-300 font-medium mt-0.5">
                {activeGame.team1.players.map((p) => {
                  const tInfo = titlesMap[p];
                  return (
                    <span 
                      key={p} 
                      className="inline-flex items-center gap-1 bg-emerald-900/80 px-2 py-0.5 rounded-md mr-1 border border-emerald-700/40"
                      title={tInfo ? `${tInfo.title} (${tInfo.rank})` : p}
                    >
                      {tInfo && <span className="text-xs">{tInfo.icon}</span>}
                      <span>{p}</span>
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Punteggio Gigante */}
          <div className="my-3 flex items-baseline justify-between">
            <div className="text-4xl sm:text-5xl font-black tracking-tight text-white">
              {totalTeam1.toLocaleString('it-IT')}
              <span className="text-sm font-normal text-emerald-300/70 ml-1.5">pt</span>
            </div>
            <div className="text-right">
              <span className="text-xs text-emerald-400/80 block">Traguardo: {targetScore}</span>
              <span className="text-xs font-semibold text-amber-300">
                {targetScore - totalTeam1 > 0 
                  ? `Mancano ${targetScore - totalTeam1} pt` 
                  : 'Raggiunto! 🎉'}
              </span>
            </div>
          </div>

          {/* Barra di Progresso */}
          <div className="w-full bg-emerald-950/80 rounded-full h-3 p-0.5 border border-emerald-700/50 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-amber-500 to-amber-300 h-full rounded-full transition-all duration-500"
              style={{ width: `${t1Percent}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-emerald-400/70 mt-1">
            <span>Progresso</span>
            <span>{t1Percent}%</span>
          </div>
        </div>

        {/* CARD SQUADRA 2 */}
        <div className={`relative p-4 sm:p-5 rounded-2xl felt-card border transition-all ${
          leader === 'team2' ? 'border-blue-400/70 shadow-blue-900/30' : 'border-emerald-600/30'
        }`}>
          {leader === 'team2' && diff !== 0 && (
            <div className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full bg-blue-400 text-emerald-950 text-[11px] font-black tracking-wider uppercase shadow-md flex items-center gap-1">
              <span>👑 In Vantaggio</span>
              <span>(+{Math.abs(diff)} pt)</span>
            </div>
          )}

          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <span className="text-xs font-black text-blue-300 uppercase tracking-wider flex items-center gap-1">
                <span>♠</span> {activeGame.team2.name}
              </span>
              <div className="text-xs text-emerald-300 font-medium mt-0.5">
                {activeGame.team2.players.map((p) => {
                  const tInfo = titlesMap[p];
                  return (
                    <span 
                      key={p} 
                      className="inline-flex items-center gap-1 bg-emerald-900/80 px-2 py-0.5 rounded-md mr-1 border border-emerald-700/40"
                      title={tInfo ? `${tInfo.title} (${tInfo.rank})` : p}
                    >
                      {tInfo && <span className="text-xs">{tInfo.icon}</span>}
                      <span>{p}</span>
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Punteggio Gigante */}
          <div className="my-3 flex items-baseline justify-between">
            <div className="text-4xl sm:text-5xl font-black tracking-tight text-white">
              {totalTeam2.toLocaleString('it-IT')}
              <span className="text-sm font-normal text-emerald-300/70 ml-1.5">pt</span>
            </div>
            <div className="text-right">
              <span className="text-xs text-emerald-400/80 block">Traguardo: {targetScore}</span>
              <span className="text-xs font-semibold text-blue-300">
                {targetScore - totalTeam2 > 0 
                  ? `Mancano ${targetScore - totalTeam2} pt` 
                  : 'Raggiunto! 🎉'}
              </span>
            </div>
          </div>

          {/* Barra di Progresso */}
          <div className="w-full bg-emerald-950/80 rounded-full h-3 p-0.5 border border-emerald-700/50 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-blue-500 to-blue-300 h-full rounded-full transition-all duration-500"
              style={{ width: `${t2Percent}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-emerald-400/70 mt-1">
            <span>Progresso</span>
            <span>{t2Percent}%</span>
          </div>
        </div>

      </div>

      {/* AZIONI VELOCI DELLA PARTITA */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <div className="text-xs text-emerald-300/80 font-medium">
          Mani giocate: <strong className="text-white">{activeGame.rounds.length}</strong>
        </div>
        <div className="flex items-center gap-2">
          {activeGame.rounds.length > 0 && (
            <>
              <button
                onClick={onEndGame}
                className="px-2.5 py-1.5 rounded-lg bg-emerald-900/60 hover:bg-emerald-800 text-amber-300 border border-emerald-600/40 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Concludi ora la partita e salvala nello storico"
              >
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Termina & Salva</span>
              </button>

              <button
                onClick={onDeleteLastRound}
                className="px-2.5 py-1.5 rounded-lg bg-rose-950/50 hover:bg-rose-900/70 text-rose-300 border border-rose-800/40 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Annulla ultima mano inserita"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden sm:inline">Annulla Ultima Mano</span>
              </button>
            </>
          )}

          <button
            onClick={onAddRound}
            className="px-4 py-2 rounded-xl gold-gradient hover:brightness-110 text-emerald-950 font-black text-xs sm:text-sm shadow-md flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <PlusCircle className="w-4 h-4 text-emerald-950" />
            <span>Aggiungi Mano (Smazzata)</span>
          </button>
        </div>
      </div>

      {/* TABELLONE STORICO MANI (FOGLIO SEGNAPUNTI) */}
      <div className="felt-card rounded-2xl border border-emerald-600/30 overflow-hidden shadow-xl">
        <div className="p-3 sm:p-4 bg-emerald-950/80 border-b border-emerald-700/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-amber-400 font-serif text-lg">♦ ♠</span>
            <h3 className="text-sm sm:text-base font-bold text-white m-0">Foglio Segnapunti Mani</h3>
          </div>
          {onOpenRules ? (
            <button
              onClick={onOpenRules}
              className="px-2.5 py-1 rounded-lg bg-emerald-900/90 hover:bg-emerald-800 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
              title="Apri il regolamento completo e la tabella punti"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>Regole & Punti Carte</span>
            </button>
          ) : (
            <span className="text-xs text-emerald-400/80">
              Regola: Burraco {activeGame.allowSemipulito ? 'con Semipulito (150)' : 'Classico'}
            </span>
          )}
        </div>

        {roundsWithProgressive.length === 0 ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-900/60 border border-emerald-700/50 flex items-center justify-center mx-auto text-emerald-300">
              ♣
            </div>
            <h4 className="text-sm font-bold text-white">Nessuna mano registrata</h4>
            <p className="text-xs text-emerald-300/80 max-w-sm mx-auto">
              Mescolate le carte e distribuite i due pozzetti! Quando la prima mano si conclude, clicca su "Aggiungi Mano" per registrare i punti.
            </p>
            <button
              onClick={onAddRound}
              className="mt-2 px-4 py-2 rounded-xl gold-gradient text-emerald-950 font-bold text-xs shadow-md cursor-pointer hover:brightness-110"
            >
              + Inserisci Prima Mano
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-emerald-700/50 bg-emerald-950/60 text-[11px] font-bold uppercase tracking-wider text-emerald-300">
                  <th className="py-2.5 px-3 sm:px-4 text-center w-12 sm:w-16">Mano</th>
                  <th className="py-2.5 px-3 sm:px-4 text-amber-300">
                    ♦ {activeGame.team1.name}
                  </th>
                  <th className="py-2.5 px-3 sm:px-4 text-blue-300">
                    ♠ {activeGame.team2.name}
                  </th>
                  <th className="py-2.5 px-3 sm:px-4 text-right w-16">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-800/40 text-xs sm:text-sm">
                {roundsWithProgressive.map((r, index) => {
                  const isLast = index === roundsWithProgressive.length - 1;
                  return (
                    <tr 
                      key={r.roundNumber} 
                      className={`hover:bg-emerald-900/30 transition-colors ${
                        isLast ? 'bg-emerald-900/20' : ''
                      }`}
                    >
                      {/* Numero Mano */}
                      <td className="py-3 px-3 sm:px-4 text-center font-bold text-emerald-300">
                        #{r.roundNumber}
                      </td>

                      {/* Squadra 1 */}
                      <td className="py-3 px-3 sm:px-4">
                        <div className="flex items-baseline gap-2">
                          <span className="font-extrabold text-white text-base">
                            {r.runningT1.toLocaleString('it-IT')}
                          </span>
                          <span className={`text-xs font-semibold ${
                            r.team1Score >= 0 ? 'text-amber-400' : 'text-rose-400'
                          }`}>
                            ({r.team1Score >= 0 ? `+${r.team1Score}` : r.team1Score})
                          </span>
                        </div>
                        {/* Dettagli sintetici se calcolati con guidato */}
                        {r.team1Details && r.entryMode !== 'quick' && (
                          <div className="text-[11px] text-emerald-400/70 mt-0.5 space-x-1">
                            {r.team1Details.chiusura && <span className="text-amber-300 font-semibold">Chiuso •</span>}
                            {r.team1Details.burracoPulito > 0 && <span>{r.team1Details.burracoPulito} Pulito •</span>}
                            {r.team1Details.burracoSporco > 0 && <span>{r.team1Details.burracoSporco} Sporco •</span>}
                            {r.team1Details.pozzetto === 'non_preso' && <span className="text-rose-400">No Pozzetto •</span>}
                          </div>
                        )}
                      </td>

                      {/* Squadra 2 */}
                      <td className="py-3 px-3 sm:px-4">
                        <div className="flex items-baseline gap-2">
                          <span className="font-extrabold text-white text-base">
                            {r.runningT2.toLocaleString('it-IT')}
                          </span>
                          <span className={`text-xs font-semibold ${
                            r.team2Score >= 0 ? 'text-blue-400' : 'text-rose-400'
                          }`}>
                            ({r.team2Score >= 0 ? `+${r.team2Score}` : r.team2Score})
                          </span>
                        </div>
                        {/* Dettagli sintetici se calcolati con guidato */}
                        {r.team2Details && r.entryMode !== 'quick' && (
                          <div className="text-[11px] text-emerald-400/70 mt-0.5 space-x-1">
                            {r.team2Details.chiusura && <span className="text-blue-300 font-semibold">Chiuso •</span>}
                            {r.team2Details.burracoPulito > 0 && <span>{r.team2Details.burracoPulito} Pulito •</span>}
                            {r.team2Details.burracoSporco > 0 && <span>{r.team2Details.burracoSporco} Sporco •</span>}
                            {r.team2Details.pozzetto === 'non_preso' && <span className="text-rose-400">No Pozzetto •</span>}
                          </div>
                        )}
                      </td>

                      {/* Azioni riga */}
                      <td className="py-3 px-3 sm:px-4 text-right">
                        <button
                          onClick={() => onEditRound(r)}
                          className="p-1.5 rounded-lg hover:bg-emerald-800 text-emerald-300 hover:text-white transition-colors cursor-pointer"
                          title="Modifica punteggio di questa mano"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
