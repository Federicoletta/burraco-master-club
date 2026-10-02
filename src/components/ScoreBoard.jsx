import React, { useMemo } from 'react';
import { PlusCircle, Trophy, Edit2, Trash2, Share2, AlertCircle, Info, ChevronDown, BookOpen } from 'lucide-react';
import { getGamesHistory, calculatePlayerStats } from '../utils/storage';
import { getPlayerTitle } from '../utils/trophies';

// Componente per renderizzare le pillole/chip degli eventi di gioco (Burrachi, Chiusura, Pozzetto)
function RoundEventChips({ details }) {
  if (!details) return null;
  const chips = [];

  if (details.chiusura) {
    chips.push(
      <span key="chiusura" className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400/20 text-amber-300 border border-amber-400/35 shadow-sm">
        <span>🌟</span> Chiusura
      </span>
    );
  }

  if (details.burracoPulito > 0) {
    chips.push(
      <span key="pulito" className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/35 shadow-sm">
        <span>💎</span> {details.burracoPulito} {details.burracoPulito === 1 ? 'Pulito' : 'Puliti'}
      </span>
    );
  }

  if (details.burracoSemipulito > 0) {
    chips.push(
      <span key="semipulito" className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-400/20 text-purple-300 border border-purple-400/35 shadow-sm">
        <span>🃏</span> {details.burracoSemipulito} {details.burracoSemipulito === 1 ? 'Semipulito' : 'Semipuliti'}
      </span>
    );
  }

  if (details.burracoSporco > 0) {
    chips.push(
      <span key="sporco" className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-700/60 text-slate-300 border border-slate-600/40 shadow-sm">
        <span>♠</span> {details.burracoSporco} {details.burracoSporco === 1 ? 'Sporco' : 'Sporchi'}
      </span>
    );
  }

  if (details.pozzetto === 'non_preso') {
    chips.push(
      <span key="nopozzetto" className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/35 shadow-sm">
        <span>⚠️</span> No Pozzetto
      </span>
    );
  } else if (details.pozzetto === 'preso_non_giocato') {
    chips.push(
      <span key="pozzettong" className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/35 shadow-sm">
        <span>⚠️</span> Pozzetto non giocato
      </span>
    );
  }

  if (chips.length === 0) return null;
  return <div className="flex flex-wrap gap-1.5 mt-1.5">{chips}</div>;
}

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
    <div className="space-y-2.5 sm:space-y-3 pb-12">
      
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3.5">
        
        {/* CARD SQUADRA 1 (TEMA ORO / AMBRA) */}
        <div className={`relative p-3.5 sm:p-4 rounded-2xl border border-t-4 border-t-amber-400 transition-all duration-300 ${
          leader === 'team1' 
            ? 'bg-gradient-to-br from-emerald-950/95 via-emerald-950/85 to-amber-950/30 border-amber-400/80 ring-1 ring-amber-400/30 shadow-xl shadow-amber-950/30' 
            : 'bg-emerald-950/75 border-emerald-600/30 hover:border-amber-500/40 shadow-md'
        }`}>
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <div>
              <span className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <span className="text-sm text-amber-300">♦</span> {activeGame.team1.name}
              </span>
              <div className="text-xs text-emerald-300 font-medium mt-1 flex flex-wrap gap-1">
                {activeGame.team1.players.map((p) => {
                  const tInfo = titlesMap[p];
                  return (
                    <span 
                      key={p} 
                      className="inline-flex items-center gap-1 bg-emerald-900/90 px-1.5 py-0.5 rounded-md border border-amber-500/25 text-[11px] shadow-sm"
                      title={tInfo ? `${tInfo.title} (${tInfo.rank})` : p}
                    >
                      {tInfo && <span>{tInfo.icon}</span>}
                      <span className="font-semibold text-emerald-100">{p}</span>
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Badge Leader Integrato nella Card */}
            {leader === 'team1' && diff !== 0 && (
              <div className="px-2.5 py-1 rounded-full gold-gradient text-emerald-950 text-[10px] sm:text-[11px] font-black tracking-wide uppercase shadow-md flex items-center gap-1 border border-amber-200/50 shrink-0 animate-in fade-in">
                <span>👑</span>
                <span>In Vantaggio</span>
                <span className="bg-emerald-950/20 px-1.5 py-0.2 rounded-full font-black text-[9px] sm:text-[10px]">(+{diff} pt)</span>
              </div>
            )}
          </div>

          {/* Punteggio Gigante */}
          <div className="my-2 flex items-baseline justify-between">
            <div className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-white drop-shadow-md">
              {totalTeam1.toLocaleString('it-IT')}
              <span className="text-sm font-normal text-amber-300/80 ml-1.5">pt</span>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-emerald-400/80 block">Traguardo: {targetScore}</span>
              <span className="text-xs font-bold text-amber-300">
                {targetScore - totalTeam1 > 0 
                  ? `Mancano ${targetScore - totalTeam1} pt` 
                  : 'Raggiunto! 🎉'}
              </span>
            </div>
          </div>

          {/* Barra di Progresso */}
          <div className="w-full bg-emerald-950/90 rounded-full h-2.5 p-0.5 border border-emerald-700/60 overflow-hidden shadow-inner">
            <div 
              className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-200 h-full rounded-full transition-all duration-500 shadow-sm"
              style={{ width: `${t1Percent}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] sm:text-[11px] text-emerald-400/80 mt-1 font-medium">
            <span>Progresso vittoria</span>
            <span className="font-bold text-amber-300">{t1Percent}%</span>
          </div>
        </div>

        {/* CARD SQUADRA 2 (TEMA BLU NOTTE / ZAFFIRO) */}
        <div className={`relative p-3.5 sm:p-4 rounded-2xl border border-t-4 border-t-blue-400 transition-all duration-300 ${
          leader === 'team2' 
            ? 'bg-gradient-to-br from-emerald-950/95 via-emerald-950/85 to-blue-950/35 border-blue-400/80 ring-1 ring-blue-400/30 shadow-xl shadow-blue-950/30' 
            : 'bg-emerald-950/75 border-emerald-600/30 hover:border-blue-500/40 shadow-md'
        }`}>
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <div>
              <span className="text-xs font-black text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
                <span className="text-sm text-blue-400">♠</span> {activeGame.team2.name}
              </span>
              <div className="text-xs text-emerald-300 font-medium mt-1 flex flex-wrap gap-1">
                {activeGame.team2.players.map((p) => {
                  const tInfo = titlesMap[p];
                  return (
                    <span 
                      key={p} 
                      className="inline-flex items-center gap-1 bg-emerald-900/90 px-1.5 py-0.5 rounded-md border border-blue-500/25 text-[11px] shadow-sm"
                      title={tInfo ? `${tInfo.title} (${tInfo.rank})` : p}
                    >
                      {tInfo && <span>{tInfo.icon}</span>}
                      <span className="font-semibold text-emerald-100">{p}</span>
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Badge Leader Integrato nella Card */}
            {leader === 'team2' && diff !== 0 && (
              <div className="px-2.5 py-1 rounded-full bg-gradient-to-r from-blue-400 via-sky-400 to-indigo-400 text-slate-950 text-[10px] sm:text-[11px] font-black tracking-wide uppercase shadow-md flex items-center gap-1 border border-blue-200/50 shrink-0 animate-in fade-in">
                <span>👑</span>
                <span>In Vantaggio</span>
                <span className="bg-slate-950/20 px-1.5 py-0.2 rounded-full font-black text-[9px] sm:text-[10px]">(+{Math.abs(diff)} pt)</span>
              </div>
            )}
          </div>

          {/* Punteggio Gigante */}
          <div className="my-2 flex items-baseline justify-between">
            <div className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-white drop-shadow-md">
              {totalTeam2.toLocaleString('it-IT')}
              <span className="text-sm font-normal text-blue-300/80 ml-1.5">pt</span>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-emerald-400/80 block">Traguardo: {targetScore}</span>
              <span className="text-xs font-bold text-blue-300">
                {targetScore - totalTeam2 > 0 
                  ? `Mancano ${targetScore - totalTeam2} pt` 
                  : 'Raggiunto! 🎉'}
              </span>
            </div>
          </div>

          {/* Barra di Progresso */}
          <div className="w-full bg-emerald-950/90 rounded-full h-2.5 p-0.5 border border-emerald-700/60 overflow-hidden shadow-inner">
            <div 
              className="bg-gradient-to-r from-blue-500 via-sky-400 to-indigo-300 h-full rounded-full transition-all duration-500 shadow-sm"
              style={{ width: `${t2Percent}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] sm:text-[11px] text-emerald-400/80 mt-1 font-medium">
            <span>Progresso vittoria</span>
            <span className="font-bold text-blue-300">{t2Percent}%</span>
          </div>
        </div>

      </div>

      {/* AZIONI VELOCI DELLA PARTITA */}
      <div className="py-1.5 sm:py-2 px-3 rounded-xl bg-emerald-950/75 border border-emerald-800/40 backdrop-blur-md flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="px-2.5 py-1 rounded-lg bg-emerald-900/60 text-xs font-semibold text-emerald-200 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
            <span>Mano in corso: <strong className="text-amber-300">#{activeGame.rounds.length + 1}</strong></span>
            <span className="text-emerald-600">•</span>
            <span className="text-emerald-400/80 font-normal">{activeGame.rounds.length} {activeGame.rounds.length === 1 ? 'registrata' : 'registrate'}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap justify-end">
          {activeGame.rounds.length > 0 && (
            <>
              <button
                onClick={onEndGame}
                className="px-2.5 py-1.5 rounded-lg bg-emerald-900/70 hover:bg-emerald-800 text-amber-300 border border-emerald-600/40 text-xs font-bold flex items-center gap-1 cursor-pointer transition-all shadow-sm hover:brightness-110 active:scale-95"
                title="Concludi ora la partita e salvala nello storico"
              >
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>Termina & Salva</span>
              </button>

              <button
                onClick={onDeleteLastRound}
                className="px-2.5 py-1.5 rounded-lg bg-rose-950/50 hover:bg-rose-900/70 text-rose-300 border border-rose-800/40 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all shadow-sm active:scale-95"
                title="Annulla ultima mano inserita"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Annulla Mano</span>
              </button>
            </>
          )}

          <button
            onClick={onAddRound}
            className="px-4 py-2 rounded-xl gold-gradient hover:brightness-110 text-emerald-950 font-black text-xs sm:text-sm shadow-md shadow-amber-900/30 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shrink-0"
          >
            <PlusCircle className="w-4 h-4 text-emerald-950" />
            <span>+ Aggiungi Mano (Smazzata)</span>
          </button>
        </div>
      </div>

      {/* TABELLONE STORICO MANI (FOGLIO SEGNAPUNTI) */}
      <div className="felt-card rounded-2xl border border-emerald-600/30 overflow-hidden shadow-xl">
        <div className="py-2.5 px-3 sm:px-4 bg-emerald-950/90 border-b border-emerald-700/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-amber-400 font-serif text-base sm:text-lg">♦ ♠</span>
            <h3 className="text-xs sm:text-sm font-bold text-white m-0">Foglio Segnapunti Mani</h3>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded-md bg-emerald-900/60 border border-emerald-700/40 text-[10px] sm:text-[11px] text-emerald-300 font-medium">
              Traguardo: <strong className="text-amber-300">{targetScore} pt</strong>
            </span>
            <span className="hidden sm:inline-block px-2 py-0.5 rounded-md bg-emerald-900/60 border border-emerald-700/40 text-[10px] sm:text-[11px] text-emerald-300/80">
              {activeGame.allowSemipulito ? 'Semipulito Attivo (150)' : 'Classico'}
            </span>
          </div>
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
                      className={`transition-colors border-b border-emerald-800/30 ${
                        isLast ? 'bg-emerald-900/35' : index % 2 === 0 ? 'bg-emerald-950/40' : 'bg-transparent'
                      } hover:bg-emerald-800/30`}
                    >
                      {/* Numero Mano */}
                      <td className="py-2 sm:py-2.5 px-2.5 sm:px-4 text-center">
                        <span className="inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-emerald-900/80 text-emerald-300 font-black text-xs border border-emerald-700/50 shadow-inner">
                          #{r.roundNumber}
                        </span>
                      </td>

                      {/* Squadra 1 */}
                      <td className="py-2 sm:py-2.5 px-2.5 sm:px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-white text-sm sm:text-base tracking-tight">
                            {r.runningT1.toLocaleString('it-IT')}
                            <span className="text-[10px] font-normal text-emerald-400/70 ml-1">pt</span>
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[11px] sm:text-xs font-bold ${
                            r.team1Score >= 0 
                              ? 'bg-amber-400/15 text-amber-300 border border-amber-400/30' 
                              : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                          }`}>
                            {r.team1Score >= 0 ? `+${r.team1Score}` : r.team1Score}
                          </span>
                        </div>
                        {r.entryMode !== 'quick' && <RoundEventChips details={r.team1Details} />}
                      </td>

                      {/* Squadra 2 */}
                      <td className="py-2 sm:py-2.5 px-2.5 sm:px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-white text-sm sm:text-base tracking-tight">
                            {r.runningT2.toLocaleString('it-IT')}
                            <span className="text-[10px] font-normal text-emerald-400/70 ml-1">pt</span>
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[11px] sm:text-xs font-bold ${
                            r.team2Score >= 0 
                              ? 'bg-blue-400/15 text-blue-300 border border-blue-400/30' 
                              : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                          }`}>
                            {r.team2Score >= 0 ? `+${r.team2Score}` : r.team2Score}
                          </span>
                        </div>
                        {r.entryMode !== 'quick' && <RoundEventChips details={r.team2Details} />}
                      </td>

                      {/* Azioni riga */}
                      <td className="py-2 sm:py-2.5 px-2.5 sm:px-4 text-right">
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
