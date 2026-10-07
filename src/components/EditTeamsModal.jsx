import React, { useState, useEffect } from 'react';
import { X, Users, ArrowLeftRight, Check, AlertCircle, Sparkles } from 'lucide-react';

export default function EditTeamsModal({
  isOpen,
  onClose,
  activeGame,
  playersList = [],
  onSave
}) {
  const isTrio = activeGame?.mode === 'trio';
  const isPairs = !isTrio && (activeGame?.mode === 'pairs' || ((activeGame?.team1?.players?.length || 0) > 1));

  const [t1Name, setT1Name] = useState('');
  const [t1P1, setT1P1] = useState('');
  const [t1P2, setT1P2] = useState('');

  const [t2Name, setT2Name] = useState('');
  const [t2P1, setT2P1] = useState('');
  const [t2P2, setT2P2] = useState('');

  const [t3Name, setT3Name] = useState('');
  const [t3P1, setT3P1] = useState('');

  const [focusedField, setFocusedField] = useState(null); // 't1P1' | 't1P2' | 't2P1' | 't2P2' | 't3P1' | null

  // Sincronizza lo stato ogni volta che il modale si apre o activeGame cambia
  useEffect(() => {
    if (activeGame) {
      setT1Name(activeGame.team1?.name || (isTrio ? 'Giocatore 1' : 'Coppia 1'));
      setT1P1(activeGame.team1?.players?.[0] || '');
      setT1P2(activeGame.team1?.players?.[1] || '');

      setT2Name(activeGame.team2?.name || (isTrio ? 'Giocatore 2' : 'Coppia 2'));
      setT2P1(activeGame.team2?.players?.[0] || '');
      setT2P2(activeGame.team2?.players?.[1] || '');

      if (isTrio) {
        setT3Name(activeGame.team3?.name || 'Giocatore 3');
        setT3P1(activeGame.team3?.players?.[0] || '');
      }
    }
  }, [activeGame, isOpen, isTrio]);

  if (!isOpen || !activeGame) return null;

  // Inverte le due formazioni complete (Squadra 1 <-> Squadra 2)
  const handleSwapTeams = () => {
    setT1Name(t2Name);
    setT2Name(t1Name);
    setT1P1(t2P1);
    setT2P1(t1P1);
    setT1P2(t2P2);
    setT2P2(t1P2);
  };

  // Scambia i compagni (Giocatore 2 di Squadra 1 con Giocatore 2 di Squadra 2)
  const handleSwapPartners = () => {
    const temp = t1P2;
    setT1P2(t2P2);
    setT2P2(temp);
  };

  // Ruota i 3 giocatori (1 -> 2 -> 3 -> 1)
  const handleRotateTrio = () => {
    const n1 = t1Name, p1 = t1P1;
    setT1Name(t3Name); setT1P1(t3P1);
    setT3Name(t2Name); setT3P1(t2P1);
    setT2Name(n1); setT2P1(p1);
  };

  // Seleziona un giocatore salvato nel campo attualmente attivo
  const handleSelectSuggestedPlayer = (playerName) => {
    if (focusedField === 't1P1') setT1P1(playerName);
    else if (focusedField === 't1P2') setT1P2(playerName);
    else if (focusedField === 't2P1') setT2P1(playerName);
    else if (focusedField === 't2P2') setT2P2(playerName);
    else if (focusedField === 't3P1') setT3P1(playerName);
    else {
      // Se nessun campo ha il focus, riempi il primo vuoto disponibile
      if (!t1P1.trim()) setT1P1(playerName);
      else if (isPairs && !t1P2.trim()) setT1P2(playerName);
      else if (!t2P1.trim()) setT2P1(playerName);
      else if (isPairs && !t2P2.trim()) setT2P2(playerName);
      else if (isTrio && !t3P1.trim()) setT3P1(playerName);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const p1 = [t1P1.trim(), isPairs ? t1P2.trim() : null].filter(Boolean);
    const p2 = [t2P1.trim(), isPairs ? t2P2.trim() : null].filter(Boolean);
    const p3 = isTrio ? [t3P1.trim()].filter(Boolean) : [];

    if (p1.length === 0 || p2.length === 0 || (isTrio && p3.length === 0)) {
      alert('Inserisci almeno un giocatore per ciascuna postazione.');
      return;
    }

    const updatedTeam1 = {
      ...activeGame.team1,
      name: t1Name.trim() || (isPairs ? `${p1.join(' & ')}` : p1[0]),
      players: p1,
    };

    const updatedTeam2 = {
      ...activeGame.team2,
      name: t2Name.trim() || (isPairs ? `${p2.join(' & ')}` : p2[0]),
      players: p2,
    };

    const updatedTeam3 = isTrio ? {
      ...(activeGame.team3 || {}),
      name: t3Name.trim() || p3[0],
      players: p3,
    } : undefined;

    onSave(updatedTeam1, updatedTeam2, updatedTeam3);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl felt-card rounded-2xl border border-amber-500/40 p-4 sm:p-6 my-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Modale */}
        <div className="flex items-center justify-between pb-3 border-b border-emerald-700/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl gold-gradient flex items-center justify-center text-emerald-950 font-black shadow-md shrink-0">
              <Users className="w-5 h-5 text-emerald-950" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white m-0">Modifica Squadre & Giocatori</h2>
              <p className="text-xs text-emerald-300/80 m-0">Aggiorna nomi o partecipanti senza perdere i punteggi già segnati</p>
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

        {/* Form Modifica */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          
          <div className={`grid grid-cols-1 ${isTrio ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-3.5`}>
            
            {/* SCHEDA SQUADRA 1 (♦ TEMA ORO) */}
            <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-amber-500/40 shadow-sm space-y-2.5">
              <div className="flex items-center justify-between pb-1.5 border-b border-emerald-800/60">
                <span className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="text-sm">♦</span> {isTrio ? 'Giocatore 1' : 'Squadra 1 (Tema Oro)'}
                </span>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-emerald-300/80 block mb-1">
                  {isTrio ? 'Nome Visualizzato' : 'Nome Squadra'}
                </label>
                <input
                  type="text"
                  value={t1Name}
                  onChange={(e) => setT1Name(e.target.value)}
                  placeholder="Es. I Gladiatori / Coppia 1"
                  className="w-full px-3 py-1.5 rounded-lg bg-emerald-900/60 border border-emerald-700/60 text-white font-medium text-xs sm:text-sm focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-2 pt-1">
                <div>
                  <label className="text-[11px] font-semibold text-emerald-300/80 block mb-1">
                    {isPairs ? 'Giocatore 1' : 'Giocatore Singolo'}
                  </label>
                  <input
                    type="text"
                    required
                    value={t1P1}
                    onFocus={() => setFocusedField('t1P1')}
                    onChange={(e) => setT1P1(e.target.value)}
                    placeholder="Nome giocatore..."
                    className="w-full px-3 py-1.5 rounded-lg bg-emerald-900/60 border border-emerald-700/60 text-white font-medium text-xs sm:text-sm focus:outline-none focus:border-amber-400"
                  />
                </div>

                {isPairs && (
                  <div>
                    <label className="text-[11px] font-semibold text-emerald-300/80 block mb-1">
                      Giocatore 2 (Compagno)
                    </label>
                    <input
                      type="text"
                      required
                      value={t1P2}
                      onFocus={() => setFocusedField('t1P2')}
                      onChange={(e) => setT1P2(e.target.value)}
                      placeholder="Nome compagno..."
                      className="w-full px-3 py-1.5 rounded-lg bg-emerald-900/60 border border-emerald-700/60 text-white font-medium text-xs sm:text-sm focus:outline-none focus:border-amber-400"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* SCHEDA SQUADRA 2 (♠ TEMA BLU) */}
            <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-blue-500/40 shadow-sm space-y-2.5">
              <div className="flex items-center justify-between pb-1.5 border-b border-emerald-800/60">
                <span className="text-xs font-black text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="text-sm">♠</span> {isTrio ? 'Giocatore 2' : 'Squadra 2 (Tema Blu)'}
                </span>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-emerald-300/80 block mb-1">
                  {isTrio ? 'Nome Visualizzato' : 'Nome Squadra'}
                </label>
                <input
                  type="text"
                  value={t2Name}
                  onChange={(e) => setT2Name(e.target.value)}
                  placeholder="Es. I Fenici / Coppia 2"
                  className="w-full px-3 py-1.5 rounded-lg bg-emerald-900/60 border border-emerald-700/60 text-white font-medium text-xs sm:text-sm focus:outline-none focus:border-blue-400"
                />
              </div>

              <div className="space-y-2 pt-1">
                <div>
                  <label className="text-[11px] font-semibold text-emerald-300/80 block mb-1">
                    {isPairs ? 'Giocatore 1' : 'Giocatore Singolo'}
                  </label>
                  <input
                    type="text"
                    required
                    value={t2P1}
                    onFocus={() => setFocusedField('t2P1')}
                    onChange={(e) => setT2P1(e.target.value)}
                    placeholder="Nome giocatore..."
                    className="w-full px-3 py-1.5 rounded-lg bg-emerald-900/60 border border-emerald-700/60 text-white font-medium text-xs sm:text-sm focus:outline-none focus:border-blue-400"
                  />
                </div>

                {isPairs && (
                  <div>
                    <label className="text-[11px] font-semibold text-emerald-300/80 block mb-1">
                      Giocatore 2 (Compagno)
                    </label>
                    <input
                      type="text"
                      required
                      value={t2P2}
                      onFocus={() => setFocusedField('t2P2')}
                      onChange={(e) => setT2P2(e.target.value)}
                      placeholder="Nome compagno..."
                      className="w-full px-3 py-1.5 rounded-lg bg-emerald-900/60 border border-emerald-700/60 text-white font-medium text-xs sm:text-sm focus:outline-none focus:border-blue-400"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* SCHEDA SQUADRA 3 (♥ TEMA RUBINO - SOLO SE A 3) */}
            {isTrio && (
              <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-rose-500/40 shadow-sm space-y-2.5">
                <div className="flex items-center justify-between pb-1.5 border-b border-emerald-800/60">
                  <span className="text-xs font-black text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="text-sm">♥</span> Giocatore 3 (Tema Rubino)
                  </span>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-emerald-300/80 block mb-1">
                    Nome Visualizzato
                  </label>
                  <input
                    type="text"
                    value={t3Name}
                    onChange={(e) => setT3Name(e.target.value)}
                    placeholder="Es. Giocatore 3"
                    className="w-full px-3 py-1.5 rounded-lg bg-emerald-900/60 border border-emerald-700/60 text-white font-medium text-xs sm:text-sm focus:outline-none focus:border-rose-400"
                  />
                </div>

                <div className="space-y-2 pt-1">
                  <div>
                    <label className="text-[11px] font-semibold text-emerald-300/80 block mb-1">
                      Giocatore Singolo
                    </label>
                    <input
                      type="text"
                      required
                      value={t3P1}
                      onFocus={() => setFocusedField('t3P1')}
                      onChange={(e) => setT3P1(e.target.value)}
                      placeholder="Nome giocatore..."
                      className="w-full px-3 py-1.5 rounded-lg bg-emerald-900/60 border border-emerald-700/60 text-white font-medium text-xs sm:text-sm focus:outline-none focus:border-rose-400"
                    />
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Tasti Rapidi di Scambio */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            {isTrio ? (
              <button
                type="button"
                onClick={handleRotateTrio}
                className="px-3 py-1.5 rounded-xl bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200 border border-emerald-700/60 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
                title="Ruota i 3 giocatori"
              >
                <ArrowLeftRight className="w-3.5 h-3.5 text-amber-400" />
                <span>Ruota Giocatori (1 ➔ 2 ➔ 3 ➔ 1)</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleSwapTeams}
                  className="px-3 py-1.5 rounded-xl bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200 border border-emerald-700/60 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
                  title="Scambia le due squadre per intero"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5 text-amber-400" />
                  <span>Inverti Squadre (♦ ⇄ ♠)</span>
                </button>

                {isPairs && (
                  <button
                    type="button"
                    onClick={handleSwapPartners}
                    className="px-3 py-1.5 rounded-xl bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200 border border-emerald-700/60 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
                    title="Scambia i secondi giocatori delle due squadre"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5 text-teal-400" />
                    <span>Scambia Compagni 2</span>
                  </button>
                )}
              </>
            )}
          </div>

          {/* Suggerimenti veloci dai giocatori salvati */}
          {playersList && playersList.length > 0 && (
            <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 text-emerald-400/90 font-semibold text-[11px]">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Tocca un partecipante salvato per inserirlo:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {playersList.map(name => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => handleSelectSuggestedPlayer(name)}
                    className="px-2.5 py-1 rounded-lg bg-emerald-900/70 hover:bg-emerald-800 text-emerald-200 border border-emerald-700/50 text-[11px] font-medium transition-colors cursor-pointer"
                  >
                    + {name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Badge informativo di sicurezza */}
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200/90 text-xs">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              I punti e lo storico delle <strong>{activeGame.rounds?.length || 0} mani</strong> già registrate rimarranno invariati.
            </span>
          </div>

          {/* Tasti Azione Footer */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-emerald-700/50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-emerald-900/70 hover:bg-emerald-800 text-emerald-300 font-semibold text-xs transition-colors cursor-pointer"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl gold-gradient hover:brightness-110 text-emerald-950 font-black text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
            >
              <Check className="w-4 h-4 text-emerald-950 stroke-[3]" />
              <span>Salva Modifiche</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
