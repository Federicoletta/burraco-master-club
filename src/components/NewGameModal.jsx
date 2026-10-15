import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Users, User, Trophy, Sparkles, Check } from 'lucide-react';
import { DEFAULT_TARGET_SCORES } from '../constants/burraco';

export default function NewGameModal({ 
  isOpen, 
  onClose, 
  onStartGame, 
  availablePlayers = [],
  friendsList = [],
  hasActiveGame
}) {
  const [mode, setMode] = useState('pairs'); // 'pairs' (2v2) | 'singles' (1v1) | 'trio' (A 3)
  const [team1Name, setTeam1Name] = useState('');
  const [team2Name, setTeam2Name] = useState('');
  
  // Nomi dei giocatori (iniziano completamente vuoti, nessun nome forzato)
  const [p1A, setP1A] = useState('');
  const [p1B, setP1B] = useState('');
  const [p2A, setP2A] = useState('');
  const [p2B, setP2B] = useState('');
  const [p3A, setP3A] = useState('');

  const [targetScore, setTargetScore] = useState(2505);
  const [customTarget, setCustomTarget] = useState('');
  const [allowSemipulito, setAllowSemipulito] = useState(true);

  // Resetta i campi ogni volta che si apre il modale
  useEffect(() => {
    if (isOpen) {
      setTeam1Name('');
      setTeam2Name('');
      setP1A('');
      setP1B('');
      setP2A('');
      setP2B('');
      setP3A('');
      setTargetScore(2505);
      setCustomTarget('');
    }
  }, [isOpen]);

  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;

  const handleStart = (e) => {
    e.preventDefault();
    const finalTarget = customTarget ? Number(customTarget) : Number(targetScore);

    // Raccoglie i giocatori inseriti (solo quelli non vuoti)
    const t1Players = mode === 'pairs'
      ? [p1A.trim(), p1B.trim()].filter(Boolean)
      : [p1A.trim()].filter(Boolean);

    const t2Players = mode === 'pairs'
      ? [p2A.trim(), p2B.trim()].filter(Boolean)
      : [p2A.trim()].filter(Boolean);

    const t3Players = mode === 'trio'
      ? [p3A.trim()].filter(Boolean)
      : [];

    // Se l'utente non ha specificato il nome squadra o giocatori, assegna etichette pulite
    const defaultT1Name = mode === 'pairs' ? 'Coppia 1' : 'Giocatore 1';
    const defaultT2Name = mode === 'pairs' ? 'Coppia 2' : 'Giocatore 2';
    const defaultT3Name = 'Giocatore 3';

    const finalTeam1Name = team1Name.trim() || (t1Players.length > 0 ? t1Players.join(' & ') : defaultT1Name);
    const finalTeam2Name = team2Name.trim() || (t2Players.length > 0 ? t2Players.join(' & ') : defaultT2Name);
    const finalTeam3Name = t3Players.length > 0 ? t3Players[0] : defaultT3Name;

    const newGame = {
      id: 'game_' + Date.now(),
      createdAt: new Date().toISOString(),
      mode,
      allowSemipulito,
      targetScore: finalTarget > 0 ? finalTarget : 2505,
      team1: {
        name: finalTeam1Name,
        players: t1Players.length > 0 ? t1Players : [finalTeam1Name],
      },
      team2: {
        name: finalTeam2Name,
        players: t2Players.length > 0 ? t2Players : [finalTeam2Name],
      },
      ...(mode === 'trio' ? {
        team3: {
          name: finalTeam3Name,
          players: t3Players.length > 0 ? t3Players : [finalTeam3Name],
        }
      } : {}),
      rounds: [],
      winner: null,
      isFinished: false,
    };

    onStartGame(newGame);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg felt-card rounded-2xl border border-amber-500/40 p-5 sm:p-6 my-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
        
        {/* Header Modal */}
        <div className="flex items-center justify-between pb-3.5 border-b border-emerald-700/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gold-gradient flex items-center justify-center text-emerald-950 font-black shadow-md">
              ♣
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white m-0">Nuova Partita di Burraco</h2>
              <p className="text-[11px] sm:text-xs text-emerald-300/80 m-0">Configura giocatori, coppie e obiettivo punti</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-800/50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {hasActiveGame && (
          <div className="my-3 p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Nota: Iniziando una nuova partita, quella in corso verrà archiviata automaticamente nello storico.</span>
          </div>
        )}

        <form onSubmit={handleStart} className="space-y-4 mt-3.5">
          
          {/* Selettore Modalità 2v2, A 3, o 1v1 */}
          <div>
            <label className="block text-xs font-semibold text-emerald-300 uppercase tracking-wider mb-2">
              Modalità di Gioco
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setMode('pairs')}
                className={`py-2 px-2 rounded-xl border flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  mode === 'pairs'
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-md'
                    : 'bg-emerald-950/40 border-emerald-700/40 text-emerald-300 hover:bg-emerald-900/40'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>A Coppie (2v2)</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('trio')}
                className={`py-2 px-2 rounded-xl border flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  mode === 'trio'
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-md ring-1 ring-amber-400/30'
                    : 'bg-emerald-950/40 border-emerald-700/40 text-emerald-300 hover:bg-emerald-900/40'
                }`}
              >
                <Users className="w-4 h-4 text-amber-400" />
                <span>A 3 (1 vs 2)</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('singles')}
                className={`py-2 px-2 rounded-xl border flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  mode === 'singles'
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-md'
                    : 'bg-emerald-950/40 border-emerald-700/40 text-emerald-300 hover:bg-emerald-900/40'
                }`}
              >
                <User className="w-4 h-4" />
                <span>Singolo (1v1)</span>
              </button>
            </div>
          </div>

          {/* Selezione Partecipanti */}
          <div className={`grid grid-cols-1 ${mode === 'trio' ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-3`}>
            
            {/* SQUADRA / GIOCATORE 1 */}
            <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-600/30 space-y-2">
              <div className="flex items-center justify-between mb-1">
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
                  className="w-full px-3 py-1.5 rounded-lg bg-emerald-900/50 border border-emerald-700/50 text-white text-xs placeholder-emerald-400/40 focus:outline-none focus:border-amber-400"
                />
              )}

              <div className="space-y-2">
                <div>
                  <label className="text-[11px] text-emerald-300/80 block mb-0.5">
                    {mode === 'pairs' ? 'Giocatore A' : 'Nome Partecipante'}
                  </label>
                  <input
                    type="text"
                    value={p1A}
                    onChange={(e) => setP1A(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-emerald-900/60 border border-emerald-700/60 text-white font-medium text-sm focus:outline-none focus:border-amber-400"
                    placeholder={mode === 'pairs' ? 'Nome Giocatore 1 (opzionale)' : 'Nome Giocatore (opzionale)'}
                  />
                </div>

                {mode === 'pairs' && (
                  <div>
                    <label className="text-[11px] text-emerald-300/80 block mb-0.5">Giocatore B</label>
                    <input
                      type="text"
                      value={p1B}
                      onChange={(e) => setP1B(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-emerald-900/60 border border-emerald-700/60 text-white font-medium text-sm focus:outline-none focus:border-amber-400"
                      placeholder="Nome Giocatore 2 (opzionale)"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* SQUADRA / GIOCATORE 2 */}
            <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-600/30 space-y-2">
              <div className="flex items-center justify-between mb-1">
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
                  className="w-full px-3 py-1.5 rounded-lg bg-emerald-900/50 border border-emerald-700/50 text-white text-xs placeholder-emerald-400/40 focus:outline-none focus:border-blue-400"
                />
              )}

              <div className="space-y-2">
                <div>
                  <label className="text-[11px] text-emerald-300/80 block mb-0.5">
                    {mode === 'pairs' ? 'Giocatore A' : 'Nome Partecipante'}
                  </label>
                  <input
                    type="text"
                    value={p2A}
                    onChange={(e) => setP2A(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-emerald-900/60 border border-emerald-700/60 text-white font-medium text-sm focus:outline-none focus:border-blue-400"
                    placeholder={mode === 'pairs' ? 'Nome Giocatore 1 (opzionale)' : 'Nome Giocatore (opzionale)'}
                  />
                </div>

                {mode === 'pairs' && (
                  <div>
                    <label className="text-[11px] text-emerald-300/80 block mb-0.5">Giocatore B</label>
                    <input
                      type="text"
                      value={p2B}
                      onChange={(e) => setP2B(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-emerald-900/60 border border-emerald-700/60 text-white font-medium text-sm focus:outline-none focus:border-blue-400"
                      placeholder="Nome Giocatore 2 (opzionale)"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* GIOCATORE 3 (Solo in modalità A 3) */}
            {mode === 'trio' && (
              <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-600/30 space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-rose-300 uppercase tracking-wider flex items-center gap-1">
                    <span>♥</span> Giocatore 3
                  </span>
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="text-[11px] text-emerald-300/80 block mb-0.5">
                      Nome Partecipante
                    </label>
                    <input
                      type="text"
                      value={p3A}
                      onChange={(e) => setP3A(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-emerald-900/60 border border-emerald-700/60 text-white font-medium text-sm focus:outline-none focus:border-rose-400"
                      placeholder="Nome Giocatore (opzionale)"
                    />
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Suggerimenti veloci Amici Registrati & Giocatori Locali */}
          <div className="space-y-2">
            {/* 1. Amici Burraco Club con Account Google */}
            {friendsList && friendsList.length > 0 && (
              <div className="text-xs">
                <span className="text-amber-300 font-bold mr-2 flex items-center gap-1 mb-1">
                  <span>⭐ Amici Burraco Club (Google):</span>
                </span>
                <div className="inline-flex flex-wrap gap-1.5">
                  {friendsList.map(f => {
                    const friendName = f.displayName || f.email;
                    return (
                      <button
                        key={f.uid || f.email}
                        type="button"
                        onClick={() => {
                          if (!p1A) setP1A(friendName);
                          else if (mode === 'pairs' && !p1B) setP1B(friendName);
                          else if (!p2A) setP2A(friendName);
                          else if (mode === 'pairs' && !p2B) setP2B(friendName);
                          else if (mode === 'trio' && !p3A) setP3A(friendName);
                          else setP1A(friendName);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-emerald-950/90 text-amber-200 border border-amber-400/50 text-[11px] font-semibold hover:border-amber-300 hover:brightness-110 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                      >
                        {f.photoURL ? (
                          <img src={f.photoURL} alt="" className="w-4 h-4 rounded-full border border-amber-400 object-cover" />
                        ) : (
                          <span className="w-4 h-4 rounded-full bg-amber-400 text-emerald-950 font-black text-[9px] flex items-center justify-center">
                            {friendName.slice(0, 1).toUpperCase()}
                          </span>
                        )}
                        <span>{friendName}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. Giocatori Locali (Ospiti) */}
            {availablePlayers && availablePlayers.length > 0 && (
              <div className="text-xs">
                <span className="text-emerald-300/70 mr-2 block mb-1">Giocatori Locali (Ospiti):</span>
                <div className="inline-flex flex-wrap gap-1.5">
                  {availablePlayers.slice(0, 12).map(name => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => {
                        if (!p1A) setP1A(name);
                        else if (mode === 'pairs' && !p1B) setP1B(name);
                        else if (!p2A) setP2A(name);
                        else if (mode === 'pairs' && !p2B) setP2B(name);
                        else if (mode === 'trio' && !p3A) setP3A(name);
                        else setP1A(name);
                      }}
                      className="px-2 py-0.5 rounded-md bg-emerald-900/80 text-emerald-200 border border-emerald-700/40 text-[11px] hover:border-amber-400 hover:text-white transition-colors cursor-pointer"
                    >
                      + {name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Punteggio Obiettivo */}
          <div>
            <label className="block text-xs font-semibold text-emerald-300 uppercase tracking-wider mb-2">
              Punteggio per la Vittoria
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {DEFAULT_TARGET_SCORES.map(item => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => {
                    setTargetScore(item.value);
                    setCustomTarget('');
                  }}
                  className={`py-2 px-1.5 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                    targetScore === item.value && !customTarget
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-sm ring-1 ring-amber-400/30'
                      : 'bg-emerald-950/40 border-emerald-700/40 text-emerald-300 hover:bg-emerald-900/40'
                  }`}
                >
                  <span className="text-xs sm:text-sm font-bold">{item.value} pt</span>
                  {item.desc && (
                    <span className="text-[10px] text-emerald-400/80 font-normal">
                      {item.desc}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Punteggio Personalizzato */}
            <div className="mt-2 flex items-center gap-2">
              <input
                type="number"
                placeholder="Altro punteggio personalizzato (es. 1500, 3000)"
                value={customTarget}
                onChange={(e) => setCustomTarget(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-emerald-900/50 border border-emerald-700/50 text-white text-xs placeholder-emerald-400/40 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Regola Burraco Semipulito */}
          <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-700/40 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-white block">Consenti Burraco Semipulito (150 pt)</span>
              <span className="text-[11px] text-emerald-400/80">Sequenza di 7+ carte con una pinella o jolly agli estremi</span>
            </div>
            <button
              type="button"
              onClick={() => setAllowSemipulito(!allowSemipulito)}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                allowSemipulito ? 'bg-amber-400' : 'bg-emerald-900 border border-emerald-700'
              }`}
            >
              <div 
                className={`w-4 h-4 rounded-full bg-emerald-950 transition-transform absolute top-1 ${
                  allowSemipulito ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Pulsanti Azione */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-emerald-700/50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-emerald-300 hover:bg-emerald-900/50 text-xs font-bold transition-colors cursor-pointer"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl gold-gradient text-emerald-950 font-black text-xs sm:text-sm shadow-md hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4 text-emerald-950" />
              <span>Inizia Partita</span>
            </button>
          </div>

        </form>

      </div>
    </div>,
    document.body
  );
}
