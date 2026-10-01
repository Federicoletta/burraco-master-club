import React, { useState } from 'react';
import { BarChart3, PieChart, TrendingUp, Award, Trophy, Sparkles, User, Target } from 'lucide-react';

export default function StatsCharts({ stats, selectedPlayerName, onSelectPlayer }) {
  const [metricTab, setMetricTab] = useState('points'); // 'points' | 'burrachi' | 'winrate' | 'trend'
  const [activePlayer, setActivePlayer] = useState(selectedPlayerName || stats[0]?.name || '');

  if (!stats || stats.length === 0) {
    return (
      <div className="p-6 text-center text-emerald-300/70 text-xs">
        Nessun dato statistico disponibile per generare i grafici.
      </div>
    );
  }

  // Trova massimo punti per la scala del grafico a barre
  const maxPoints = Math.max(...stats.map(s => s.totalPoints), 1);
  const maxBurrachi = Math.max(...stats.map(s => s.totalBurrachi), 1);
  const maxAvgPoints = Math.max(...stats.map(s => s.avgPointsPerGame), 1);

  const currentPlayerObj = stats.find(s => s.name === activePlayer) || stats[0];

  return (
    <div className="space-y-4">
      
      {/* Selettore tipologia grafico */}
      <div className="grid grid-cols-4 gap-1.5 p-1 rounded-xl bg-emerald-950/80 border border-emerald-800/60">
        <button
          type="button"
          onClick={() => setMetricTab('points')}
          className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            metricTab === 'points'
              ? 'bg-amber-400 text-emerald-950 shadow-md font-black'
              : 'text-emerald-300 hover:text-white'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Punti</span>
        </button>

        <button
          type="button"
          onClick={() => setMetricTab('burrachi')}
          className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            metricTab === 'burrachi'
              ? 'bg-amber-400 text-emerald-950 shadow-md font-black'
              : 'text-emerald-300 hover:text-white'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Burrachi</span>
        </button>

        <button
          type="button"
          onClick={() => setMetricTab('winrate')}
          className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            metricTab === 'winrate'
              ? 'bg-amber-400 text-emerald-950 shadow-md font-black'
              : 'text-emerald-300 hover:text-white'
          }`}
        >
          <Trophy className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Vittorie %</span>
        </button>

        <button
          type="button"
          onClick={() => setMetricTab('trend')}
          className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            metricTab === 'trend'
              ? 'bg-amber-400 text-emerald-950 shadow-md font-black'
              : 'text-emerald-300 hover:text-white'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Andamento</span>
        </button>
      </div>

      {/* 1. GRAFICO CONFRONTO PUNTI */}
      {metricTab === 'points' && (
        <div className="p-4 rounded-xl bg-emerald-950/70 border border-emerald-700/40 space-y-3">
          <div className="flex items-center justify-between text-xs text-emerald-300">
            <span className="font-bold text-white flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-amber-400" />
              <span>Confronto Punti Totali Accumulati</span>
            </span>
            <span>Scala: max {maxPoints.toLocaleString('it-IT')} pt</span>
          </div>

          <div className="space-y-3 pt-1">
            {stats.map((p, idx) => {
              const widthPct = Math.max(8, Math.round((p.totalPoints / maxPoints) * 100));
              return (
                <div key={p.name} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-white flex items-center gap-1.5">
                      <span className="text-[10px] text-amber-400 font-mono">#{idx + 1}</span>
                      <span>{p.name}</span>
                      {idx === 0 && p.totalPoints > 0 && <span className="text-amber-300">👑</span>}
                    </span>
                    <span className="font-bold text-amber-300">
                      {p.totalPoints.toLocaleString('it-IT')} pt
                      <span className="text-[10px] text-emerald-400/70 font-normal ml-1.5">
                        (med. {p.avgPointsPerHand} pt/mano)
                      </span>
                    </span>
                  </div>

                  <div className="h-5 w-full bg-emerald-900/60 rounded-lg p-0.5 border border-emerald-700/50 overflow-hidden">
                    <div
                      className={`h-full rounded-md transition-all duration-700 flex items-center justify-end pr-2 text-[10px] font-black ${
                        idx === 0 
                          ? 'bg-gradient-to-r from-amber-500 to-amber-300 text-emerald-950' 
                          : idx === 1 
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-emerald-950'
                          : 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white'
                      }`}
                      style={{ width: `${widthPct}%` }}
                    >
                      {widthPct > 25 && `${widthPct}%`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. GRAFICO DISTRIBUZIONE BURRACHI */}
      {metricTab === 'burrachi' && (
        <div className="p-4 rounded-xl bg-emerald-950/70 border border-emerald-700/40 space-y-3">
          <div className="flex items-center justify-between text-xs text-emerald-300">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Distribuzione Tipologie Burrachi</span>
            </span>
            <div className="flex items-center gap-3 text-[10px]">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" /> Puliti (+200)</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-cyan-400" /> Semi (+150)</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-400" /> Sporchi (+100)</span>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            {stats.map((p, idx) => {
              const totalB = Math.max(p.totalBurrachi, 1);
              const cleanPct = Math.round((p.cleanBurrachi / totalB) * 100);
              const semiPct = Math.round((p.semiCleanBurrachi / totalB) * 100);
              const dirtyPct = Math.round((p.dirtyBurrachi / totalB) * 100);

              return (
                <div key={p.name} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-white">
                      {p.name}
                      <span className="text-[11px] text-emerald-400/80 ml-2">
                        Totale: <strong>{p.totalBurrachi}</strong> burrachi
                      </span>
                    </span>
                    <span className="text-[11px] text-emerald-300 font-mono">
                      {p.cleanBurrachi} Puliti • {p.semiCleanBurrachi} Semi • {p.dirtyBurrachi} Sporchi
                    </span>
                  </div>

                  {p.totalBurrachi > 0 ? (
                    <div className="h-4 w-full bg-emerald-900/60 rounded-lg p-0.5 border border-emerald-700/50 flex overflow-hidden">
                      {p.cleanBurrachi > 0 && (
                        <div
                          style={{ width: `${cleanPct}%` }}
                          className="h-full bg-amber-400 rounded-l-sm"
                          title={`Puliti: ${p.cleanBurrachi}`}
                        />
                      )}
                      {p.semiCleanBurrachi > 0 && (
                        <div
                          style={{ width: `${semiPct}%` }}
                          className="h-full bg-cyan-400"
                          title={`Semipuliti: ${p.semiCleanBurrachi}`}
                        />
                      )}
                      {p.dirtyBurrachi > 0 && (
                        <div
                          style={{ width: `${dirtyPct}%` }}
                          className="h-full bg-orange-400 rounded-r-sm"
                          title={`Sporchi: ${p.dirtyBurrachi}`}
                        />
                      )}
                    </div>
                  ) : (
                    <div className="h-4 w-full bg-emerald-950 rounded-lg border border-emerald-800/40 flex items-center justify-center text-[10px] text-emerald-500">
                      Nessun burraco registrato finora
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. GRAFICO WIN RATE & VITTORIE */}
      {metricTab === 'winrate' && (
        <div className="p-4 rounded-xl bg-emerald-950/70 border border-emerald-700/40 space-y-3">
          <div className="flex items-center justify-between text-xs text-emerald-300">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Percentuale Vittorie su Partite Concluse</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {stats.map((p, idx) => (
              <div 
                key={p.name}
                className="p-3 rounded-lg bg-emerald-900/40 border border-emerald-700/50 flex items-center justify-between gap-3"
              >
                <div>
                  <h5 className="font-bold text-white text-sm m-0 flex items-center gap-1.5">
                    <span>{p.name}</span>
                    {idx === 0 && p.gamesWon > 0 && <span className="text-amber-300">🏆</span>}
                  </h5>
                  <div className="text-[11px] text-emerald-400/80 mt-0.5">
                    <span>{p.gamesWon} Vinte</span> / <span>{p.gamesLost} Perse</span>
                    <span className="text-emerald-500 ml-1">({p.gamesPlayed} tot.)</span>
                  </div>
                </div>

                <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-emerald-950 stroke-current"
                      strokeWidth="3.8"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className={p.winRate >= 50 ? 'text-amber-400 stroke-current' : 'text-emerald-500 stroke-current'}
                      strokeDasharray={`${p.winRate}, 100`}
                      strokeWidth="3.8"
                      strokeLinecap="round"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <span className="absolute text-[11px] font-black text-white">
                    {p.winRate}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. GRAFICO ANDAMENTO STORICO (TREND SVG PER GIOCATORE) */}
      {metricTab === 'trend' && (
        <div className="p-4 rounded-xl bg-emerald-950/70 border border-emerald-700/40 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <span className="font-bold text-white flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              <span>Andamento Punti per Mano ({currentPlayerObj.name})</span>
            </span>

            {/* Chips selettore giocatore */}
            <div className="flex flex-wrap gap-1">
              {stats.map(p => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => setActivePlayer(p.name)}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                    activePlayer === p.name
                      ? 'bg-amber-400 text-emerald-950 font-bold shadow-sm'
                      : 'bg-emerald-900/60 text-emerald-300 hover:text-white'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {currentPlayerObj.scoresHistory && currentPlayerObj.scoresHistory.length > 1 ? (
            <div>
              {/* Grafico SVG Responsivo con Curva Andamento */}
              <div className="h-44 w-full bg-emerald-950/90 rounded-xl p-3 border border-emerald-800/60 flex flex-col justify-between">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 300 120" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Linee guida orizzontali */}
                  <line x1="0" y1="20" x2="300" y2="20" stroke="#064e3b" strokeDasharray="3 3" />
                  <line x1="0" y1="60" x2="300" y2="60" stroke="#064e3b" strokeDasharray="3 3" />
                  <line x1="0" y1="100" x2="300" y2="100" stroke="#064e3b" strokeDasharray="3 3" />

                  {(() => {
                    const scores = currentPlayerObj.scoresHistory;
                    const min = Math.min(0, ...scores);
                    const max = Math.max(100, ...scores);
                    const range = max - min || 1;

                    const points = scores.map((val, i) => {
                      const x = (i / (scores.length - 1)) * 300;
                      const y = 110 - ((val - min) / range) * 90;
                      return { x, y, val };
                    });

                    const pathD = points.reduce((acc, p, i) => {
                      return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
                    }, '');

                    const areaD = `${pathD} L 300 115 L 0 115 Z`;

                    return (
                      <>
                        <path d={areaD} fill="url(#trendGrad)" />
                        <path d={pathD} fill="none" stroke="#fbbf24" strokeWidth="2.5" />
                        {points.map((p, i) => (
                          <g key={i}>
                            <circle cx={p.x} cy={p.y} r="3.5" fill="#f59e0b" stroke="#0b291e" strokeWidth="1.5" />
                            {i === points.length - 1 && (
                              <text x={p.x - 10} y={p.y - 8} fill="#fef08a" fontSize="9" fontWeight="bold">
                                {p.val} pt
                              </text>
                            )}
                          </g>
                        ))}
                      </>
                    );
                  })()}
                </svg>

                <div className="flex justify-between text-[10px] text-emerald-400/70 pt-2 border-t border-emerald-900/60 mt-1">
                  <span>Inizio partita / Prima mano</span>
                  <span>Ultime mani disputate ({currentPlayerObj.scoresHistory.length} totali)</span>
                </div>
              </div>

              {/* Statistiche veloci sotto al trend */}
              <div className="grid grid-cols-3 gap-2 mt-2 text-center text-xs">
                <div className="p-2 rounded-lg bg-emerald-900/50 border border-emerald-800">
                  <span className="text-[10px] text-emerald-400 block uppercase">Record Mano</span>
                  <span className="font-extrabold text-amber-300 text-sm">+{currentPlayerObj.bestHandScore} pt</span>
                </div>
                <div className="p-2 rounded-lg bg-emerald-900/50 border border-emerald-800">
                  <span className="text-[10px] text-emerald-400 block uppercase">Media / Mano</span>
                  <span className="font-extrabold text-white text-sm">{currentPlayerObj.avgPointsPerHand} pt</span>
                </div>
                <div className="p-2 rounded-lg bg-emerald-900/50 border border-emerald-800">
                  <span className="text-[10px] text-emerald-400 block uppercase">Chiusure</span>
                  <span className="font-extrabold text-emerald-300 text-sm">{currentPlayerObj.closures} volte</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-emerald-300/70 text-xs">
              Gioca almeno 2 mani con <strong>{currentPlayerObj.name}</strong> per visualizzare il grafico di andamento temporale!
            </div>
          )}
        </div>
      )}

    </div>
  );
}
