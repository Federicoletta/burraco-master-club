import React, { useState } from 'react';
import { X, Users, User, Trophy, Sparkles, Check } from 'lucide-react';
import { DEFAULT_TARGET_SCORES } from '../constants/burraco';

export default function NewGameModal({ 
  isOpen, 
  onClose, 
  onStartGame, 
  availablePlayers,
  hasActiveGame
}) {
  const [mode, setMode] = useState('pairs'); // 'pairs' (2v2) | 'singles' (1v1)
  const [team1Name, setTeam1Name] = useState('Coppia 1');
  const [team2Name, setTeam2Name] = useState('Coppia 2');
  
  // Players
  const [p1A, setP1A] = useState(availablePlayers[0] || 'Marco');
  const [p1B, setP1B] = useState(availablePlayers[1] || 'Anna');
  const [p2A, setP2A] = useState(availablePlayers[2] || 'Luca');
  const [p2B, setP2B] = useState(availablePlayers[3] || 'Sofia');

  const [targetScore, setTargetScore] = useState(2005);
  const [customTarget, setCustomTarget] = useState('');
  const [allowSemipulito, setAllowSemipulito] = useState(true);

  if (!isOpen) return null;

  const handleStart = (e) => {
    e.preventDefault();
    const finalTarget = customTarget ? Number(customTarget) : Number(targetScore);

    const newGame = {
      id: 'game_' + Date.now(),
      createdAt: new Date().toISOString(),
      mode,
      allowSemipulito,
      targetScore: finalTarget > 0 ? finalTarget : 2005,
      team1: {
        name: mode === 'pairs' ? (team1Name.trim() || `${p1A} & ${p1B}`) : p1A.trim(),
        players: mode === 'pairs' ? [p1A.trim(), p1B.trim()].filter(Boolean) : [p1A.trim()],
      },
      team2: {
        name: mode === 'pairs' ? (team2Name.trim() || `${p2A} & ${p2B}`) : p2A.trim(),
        players: mode === 'pairs' ? [p2A.trim(), p2B.trim()].filter(Boolean) : [p2A.trim()],
      },
      rounds: [],
      winner: null,
      isFinished: false,
    };

    onStartGame(newGame);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg felt-card rounded-2xl border border-amber-500/30 p-5 sm:p-6 my-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Modal */}
        <div className="flex items-center justify-between pb-4 border-b border-emerald-700/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gold-gradient flex items-center justify-center text-emerald-950 font-black">
              ♣
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white m-0">Nuova Partita di Burraco</h2>
              <p className="text-xs text-emerald-300/80 m-0">Configura giocatori, coppie e obiettivo punti</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-800/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {hasActiveGame && (
          <div className="my-3 p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Nota: C'è già una partita attiva. Iniziandone una nuova, la precedente verrà archiviata automaticamente.</span>
          </div>
        )}

        <form onSubmit={handleStart} className="space-y-4 mt-4">
          
          {/* Selettore Modalità 2v2 o 1v1 */}
          <div>
            <label className="block text-xs font-semibold text-emerald-300 uppercase tracking-wider mb-2">
              Modalità di Gioco
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setMode('pairs');
                  setTeam1Name('Coppia 1');
                  setTeam2Name('Coppia 2');
                }}
                className={`py-2.5 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  mode === 'pairs'
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-md'
                    : 'bg-emerald-950/40 border-emerald-700/40 text-emerald-300 hover:bg-emerald-900/40'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>A Coppie (2 vs 2)</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('singles')}
                className={`py-2.5 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  mode === 'singles'
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-md'
                    : 'bg-emerald-950/40 border-emerald-700/40 text-emerald-300 hover:bg-emerald-900/40'
                }`}
              >
                <User className="w-4 h-4" />
                <span>Singolo (1 vs 1)</span>
              </button>
            </div>
          </div>

          {/* Selezione Partecipanti */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* SQUADRA 1 */}
            <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-600/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                  <span>♦</span> {mode === 'pairs' ? 'Squadra / Coppia 1' : 'Giocatore 1'}
                </span>
              </div>

              {mode === 'pairs' && (
                <input
                  type="text"
                  placeholder="Nome Squadra 1 (opzionale)"
                  value={team1Name}
                  onChange={(e) => setTeam1Name(e.target.value)}
                  className="w-full mb-2 px-3 py-1.5 rounded-lg bg-emerald-900/50 border border-emerald-700/50 text-white text-xs placeholder-emerald-400/40 focus:outline-none focus:border-amber-400"
                />
              )}

              <div className="space-y-2">
                <div>
                  <label className="text-[11px] text-emerald-300/80 block mb-0.5">
                    {mode === 'pairs' ? 'Giocatore A' : 'Nome Partecipante'}
                  </label>
                  <input
                    type="text"
                    required
                    value={p1A}
                    onChange={(e) => setP1A(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-emerald-900/60 border border-emerald-700/60 text-white font-medium text-sm focus:outline-none focus:border-amber-400"
                    placeholder="Es. Marco"
                  />
                </div>

                {mode === 'pairs' && (
                  <div>
                    <label className="text-[11px] text-emerald-300/80 block mb-0.5">Giocatore B</label>
                    <input
                      type="text"
                      required
                      value={p1B}
                      onChange={(e) => setP1B(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-emerald-900/60 border border-emerald-700/60 text-white font-medium text-sm focus:outline-none focus:border-amber-400"
                      placeholder="Es. Anna"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* SQUADRA 2 */}
            <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-600/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-blue-300 uppercase tracking-wider flex items-center gap-1">
                  <span>♠</span> {mode === 'pairs' ? 'Squadra / Coppia 2' : 'Giocatore 2'}
                </span>
              </div>

              {mode === 'pairs' && (
                <input
                  type="text"
                  placeholder="Nome Squadra 2 (opzionale)"
                  value={team2Name}
                  onChange={(e) => setTeam2Name(e.target.value)}
                  className="w-full mb-2 px-3 py-1.5 rounded-lg bg-emerald-900/50 border border-emerald-700/50 text-white text-xs placeholder-emerald-400/40 focus:outline-none focus:border-blue-400"
                />
              )}

              <div className="space-y-2">
                <div>
                  <label className="text-[11px] text-emerald-300/80 block mb-0.5">
                    {mode === 'pairs' ? 'Giocatore A' : 'Nome Partecipante'}
                  </label>
                  <input
                    type="text"
                    required
                    value={p2A}
                    onChange={(e) => setP2A(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-emerald-900/60 border border-emerald-700/60 text-white font-medium text-sm focus:outline-none focus:border-blue-400"
                    placeholder="Es. Luca"
                  />
                </div>

                {mode === 'pairs' && (
                  <div>
                    <label className="text-[11px] text-emerald-300/80 block mb-0.5">Giocatore B</label>
                    <input
                      type="text"
                      required
                      value={p2B}
                      onChange={(e) => setP2B(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-emerald-900/60 border border-emerald-700/60 text-white font-medium text-sm focus:outline-none focus:border-blue-400"
                      placeholder="Es. Sofia"
                    />
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Suggerimenti veloci dai giocatori salvati */}
          {availablePlayers && availablePlayers.length > 0 && (
            <div className="text-xs">
              <span className="text-emerald-300/70 mr-2">Giocatori frequenti:</span>
              <div className="inline-flex flex-wrap gap-1.5 mt-1">
                {availablePlayers.slice(0, 8).map(name => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => {
                      if (!p1A) setP1A(name);
                      else if (mode === 'pairs' && !p1B) setP1B(name);
                      else if (!p2A) setP2A(name);
                      else if (mode === 'pairs' && !p2B) setP2B(name);
                      else setP1A(name);
                    }}
                    className="px-2 py-0.5 rounded-md bg-emerald-900/80 text-emerald-200 border border-emerald-700/40 text-[11px] hover:border-amber-400 hover:text-white transition-colors"
                  >
                    + {name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Obiettivo Punti */}
          <div>
            <label className="block text-xs font-semibold text-emerald-300 uppercase tracking-wider mb-1.5">
              Obiettivo Punti per Vincere
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {DEFAULT_TARGET_SCORES.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => {
                    setTargetScore(item.value);
                    setCustomTarget('');
                  }}
                  className={`py-2 px-2 rounded-xl border text-center transition-all cursor-pointer ${
                    targetScore === item.value && !customTarget
                      ? 'bg-amber-500/25 border-amber-400 text-amber-200 font-bold'
                      : 'bg-emerald-950/40 border-emerald-700/40 text-emerald-300 hover:bg-emerald-900/40'
                  }`}
                >
                  <div className="text-sm font-black">{item.value}</div>
                  <div className="text-[10px] text-emerald-400/80">{item.value === 2005 ? 'Classico' : item.value === 1005 ? 'Rapido' : 'Punti'}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Regole & Opzioni */}
          <div className="pt-2 border-t border-emerald-800/40 flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-emerald-200">
              <input
                type="checkbox"
                checked={allowSemipulito}
                onChange={(e) => setAllowSemipulito(e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 bg-emerald-900 border-emerald-700"
              />
              <span>Includi Burraco Semipulito (150 punti)</span>
            </label>
          </div>

          {/* Submit */}
          <div className="pt-3">
            <button
              type="submit"
              className="w-full py-3 rounded-xl gold-gradient hover:brightness-110 text-emerald-950 font-black text-sm sm:text-base shadow-lg shadow-amber-900/40 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <Trophy className="w-5 h-5 text-emerald-950" />
              <span>Inizia la Partita</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
