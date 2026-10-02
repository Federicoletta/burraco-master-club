import React, { useState, useEffect } from 'react';
import { X, Calculator, Zap, Plus, Minus, Check, Sparkles, AlertCircle } from 'lucide-react';
import { CARD_VALUES, HONOR_POINTS, calculateTeamRoundScore, calculateCardsPoints } from '../constants/burraco';
import { sound } from '../utils/soundEffects';

export default function RoundCalculatorModal({
  isOpen,
  onClose,
  onSaveRound,
  activeGame,
  roundToEdit = null,
  roundNumber = 1
}) {
  const [entryMode, setEntryMode] = useState('guided'); // 'guided' | 'quick'
  const [activeTab, setActiveTab] = useState('team1'); // 'team1' | 'team2'

  // Stato per Squadra 1
  const [team1Data, setTeam1Data] = useState({
    chiusura: false,
    burracoPulito: 0,
    burracoSemipulito: 0,
    burracoSporco: 0,
    pozzetto: 'preso_giocato', // 'preso_giocato' | 'non_preso' | 'preso_non_giocato'
    cardsOnTableDirect: '',
    cardsInHandDirect: '',
    cardsOnTableCount: { jolly: 0, pinella: 0, asso: 0, alte: 0, basse: 0 },
    cardsInHandCount: { jolly: 0, pinella: 0, asso: 0, alte: 0, basse: 0 },
    showTableCardPad: false,
    showHandCardPad: false,
    manualScore: '',
  });

  // Stato per Squadra 2
  const [team2Data, setTeam2Data] = useState({
    chiusura: false,
    burracoPulito: 0,
    burracoSemipulito: 0,
    burracoSporco: 0,
    pozzetto: 'preso_giocato',
    cardsOnTableDirect: '',
    cardsInHandDirect: '',
    cardsOnTableCount: { jolly: 0, pinella: 0, asso: 0, alte: 0, basse: 0 },
    cardsInHandCount: { jolly: 0, pinella: 0, asso: 0, alte: 0, basse: 0 },
    showTableCardPad: false,
    showHandCardPad: false,
    manualScore: '',
  });

  // Caricamento in caso di modifica di una mano
  useEffect(() => {
    if (roundToEdit) {
      if (roundToEdit.entryMode === 'quick') {
        setEntryMode('quick');
        setTeam1Data(prev => ({ ...prev, manualScore: String(roundToEdit.team1Score || '') }));
        setTeam2Data(prev => ({ ...prev, manualScore: String(roundToEdit.team2Score || '') }));
      } else if (roundToEdit.team1Details && roundToEdit.team2Details) {
        setEntryMode('guided');
        setTeam1Data({ ...team1Data, ...roundToEdit.team1Details });
        setTeam2Data({ ...team2Data, ...roundToEdit.team2Details });
      }
    } else {
      // Reset defaults per nuova mano
      setTeam1Data({
        chiusura: false,
        burracoPulito: 0,
        burracoSemipulito: 0,
        burracoSporco: 0,
        pozzetto: 'preso_giocato',
        cardsOnTableDirect: '',
        cardsInHandDirect: '',
        cardsOnTableCount: { jolly: 0, pinella: 0, asso: 0, alte: 0, basse: 0 },
        cardsInHandCount: { jolly: 0, pinella: 0, asso: 0, alte: 0, basse: 0 },
        showTableCardPad: false,
        showHandCardPad: false,
        manualScore: '',
      });
      setTeam2Data({
        chiusura: false,
        burracoPulito: 0,
        burracoSemipulito: 0,
        burracoSporco: 0,
        pozzetto: 'preso_giocato',
        cardsOnTableDirect: '',
        cardsInHandDirect: '',
        cardsOnTableCount: { jolly: 0, pinella: 0, asso: 0, alte: 0, basse: 0 },
        cardsInHandCount: { jolly: 0, pinella: 0, asso: 0, alte: 0, basse: 0 },
        showTableCardPad: false,
        showHandCardPad: false,
        manualScore: '',
      });
    }
  }, [roundToEdit, isOpen]);

  if (!isOpen || !activeGame) return null;

  // Calcolo punti in tempo reale
  const team1Score = entryMode === 'quick' 
    ? Number(team1Data.manualScore) || 0 
    : calculateTeamRoundScore(team1Data);

  const team2Score = entryMode === 'quick' 
    ? Number(team2Data.manualScore) || 0 
    : calculateTeamRoundScore(team2Data);

  // Helper gestione chiusura esclusiva (solo una squadra può chiudere la smazzata)
  const handleChiusura = (teamKey) => {
    if (teamKey === 'team1') {
      const willClose = !team1Data.chiusura;
      setTeam1Data(prev => ({ ...prev, chiusura: willClose }));
      if (willClose) {
        sound.playBurracoChime();
        setTeam2Data(prev => ({ ...prev, chiusura: false }));
      } else {
        sound.playTap();
      }
    } else {
      const willClose = !team2Data.chiusura;
      setTeam2Data(prev => ({ ...prev, chiusura: willClose }));
      if (willClose) {
        sound.playBurracoChime();
        setTeam1Data(prev => ({ ...prev, chiusura: false }));
      } else {
        sound.playTap();
      }
    }
  };

  const handleSave = () => {
    sound.playCardDeal();
    const roundData = {
      roundNumber: roundToEdit ? roundToEdit.roundNumber : roundNumber,
      entryMode,
      team1Score,
      team2Score,
      team1Details: entryMode === 'guided' ? team1Data : { manualScore: team1Score },
      team2Details: entryMode === 'guided' ? team2Data : { manualScore: team2Score },
      timestamp: new Date().toISOString(),
    };

    onSaveRound(roundData);
    onClose();
  };

  const currentData = activeTab === 'team1' ? team1Data : team2Data;
  const setCurrentData = activeTab === 'team1' ? setTeam1Data : setTeam2Data;
  const currentTeamName = activeTab === 'team1' ? activeGame.team1.name : activeGame.team2.name;
  const currentTeamScore = activeTab === 'team1' ? team1Score : team2Score;

  // Calcoli parziali per il mini-scontrino trasparente
  const currentHonorsBurrachi = 
    (currentData.burracoPulito || 0) * HONOR_POINTS.BURRACO_PULITO +
    (currentData.burracoSemipulito || 0) * HONOR_POINTS.BURRACO_SEMIPULITO +
    (currentData.burracoSporco || 0) * HONOR_POINTS.BURRACO_SPORCO;

  const currentChiusuraPoints = currentData.chiusura ? HONOR_POINTS.CHIUSURA : 0;
  
  const currentPozzettoPoints = 
    currentData.pozzetto === 'non_preso' ? HONOR_POINTS.POZZETTO_NON_PRESO :
    currentData.pozzetto === 'preso_non_giocato' ? HONOR_POINTS.POZZETTO_PRESO_NON_GIOCATO : 0;

  const currentTablePoints = currentData.cardsOnTableDirect !== ''
    ? Math.max(0, Number(currentData.cardsOnTableDirect) || 0)
    : calculateCardsPoints(currentData.cardsOnTableCount);

  const currentHandPoints = currentData.cardsInHandDirect !== ''
    ? Math.max(0, Number(currentData.cardsInHandDirect) || 0)
    : calculateCardsPoints(currentData.cardsInHandCount);

  const handleSwitchTab = (targetTab) => {
    if (document.activeElement && typeof document.activeElement.blur === 'function') {
      document.activeElement.blur();
    }
    setActiveTab(targetTab);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      {/* Scheda allargata orizzontalmente: max-w-3xl */}
      <div className="relative w-full max-w-3xl felt-card rounded-2xl border border-amber-500/40 p-3.5 sm:p-5 my-3 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Modal */}
        <div className="flex items-center justify-between pb-2.5 border-b border-emerald-700/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-emerald-950 font-black shadow-md shrink-0">
              <Calculator className="w-4 h-4 text-emerald-950" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white m-0">
                {roundToEdit ? `Modifica Mano #${roundToEdit.roundNumber}` : `Punteggio Mano #${roundNumber}`}
              </h2>
              <p className="text-[11px] text-emerald-300/80 m-0">
                Calcolo onori, carte a terra e carte in mano
              </p>
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

        {/* Modalità di Inserimento (Guidato vs Rapido) */}
        <div className="mt-2.5 flex items-center justify-between gap-2 p-1 rounded-xl bg-emerald-950/70 border border-emerald-800/60">
          <button
            type="button"
            onClick={() => setEntryMode('guided')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              entryMode === 'guided'
                ? 'bg-amber-400 text-emerald-950 shadow-md font-black'
                : 'text-emerald-300 hover:text-white'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Calcolo Guidato (Ufficiale)</span>
          </button>
          <button
            type="button"
            onClick={() => setEntryMode('quick')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              entryMode === 'quick'
                ? 'bg-amber-400 text-emerald-950 shadow-md font-black'
                : 'text-emerald-300 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Inserimento Rapido Totali</span>
          </button>
        </div>

        {/* CONTENUTO INSERIMENTO RAPIDO */}
        {entryMode === 'quick' ? (
          <div className="my-5 space-y-4">
            <p className="text-xs text-emerald-300/90 text-center">
              Inserisci direttamente il punteggio netto calcolato per ciascuna squadra per questa smazzata.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              
              {/* SQUADRA 1 */}
              <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-amber-500/40">
                <span className="text-xs font-bold text-amber-300 uppercase tracking-wider block mb-0.5">
                  ♦ {activeGame.team1.name}
                </span>
                <span className="text-[11px] text-emerald-400 block mb-2">
                  {activeGame.team1.players.join(' & ')}
                </span>
                <div className="relative">
                  <input
                    type="number"
                    value={team1Data.manualScore}
                    onChange={(e) => setTeam1Data(p => ({ ...p, manualScore: e.target.value }))}
                    placeholder="0"
                    className="w-full text-center text-3xl font-black py-2.5 rounded-xl bg-emerald-900/80 border border-amber-400/50 text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                  <span className="text-[10px] text-emerald-400/70 block text-center mt-1">
                    Supporta anche valori negativi (es: -100)
                  </span>
                </div>
              </div>

              {/* SQUADRA 2 */}
              <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-blue-500/40">
                <span className="text-xs font-bold text-blue-300 uppercase tracking-wider block mb-0.5">
                  ♠ {activeGame.team2.name}
                </span>
                <span className="text-[11px] text-emerald-400 block mb-2">
                  {activeGame.team2.players.join(' & ')}
                </span>
                <div className="relative">
                  <input
                    type="number"
                    value={team2Data.manualScore}
                    onChange={(e) => setTeam2Data(p => ({ ...p, manualScore: e.target.value }))}
                    placeholder="0"
                    className="w-full text-center text-3xl font-black py-2.5 rounded-xl bg-emerald-900/80 border border-blue-400/50 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  <span className="text-[10px] text-emerald-400/70 block text-center mt-1">
                    Supporta anche valori negativi (es: -100)
                  </span>
                </div>
              </div>

            </div>
          </div>
        ) : (
          /* CONTENUTO CALCOLO GUIDATO (RIORGANIZZATO COMPATTO A GRIGLIA) */
          <div className="mt-3 space-y-3">
            
            {/* Selettore Squadra in Alto (Card Grandi e Chiare) */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onPointerDown={() => handleSwitchTab('team1')}
                onClick={() => handleSwitchTab('team1')}
                className={`p-2 sm:p-2.5 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden select-none ${
                  activeTab === 'team1'
                    ? 'bg-emerald-900/90 border-amber-400 ring-2 ring-amber-400/40 shadow-md'
                    : 'bg-emerald-950/60 border-emerald-800 text-emerald-300/70 hover:bg-emerald-900/40'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1 truncate">
                    <span>♦</span> {activeGame.team1.name}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-black shrink-0 ${
                    team1Score > 0 ? 'bg-amber-400/25 text-amber-300 border border-amber-400/40' : 'bg-emerald-950 text-emerald-300'
                  }`}>
                    {team1Score > 0 ? `+${team1Score}` : team1Score} pt
                  </span>
                </div>
                <div className="text-[11px] text-emerald-400/80 truncate mt-0.5">
                  {activeGame.team1.players.join(' & ')}
                </div>
              </button>

              <button
                type="button"
                onPointerDown={() => handleSwitchTab('team2')}
                onClick={() => handleSwitchTab('team2')}
                className={`p-2 sm:p-2.5 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden select-none ${
                  activeTab === 'team2'
                    ? 'bg-emerald-900/90 border-blue-400 ring-2 ring-blue-400/40 shadow-md'
                    : 'bg-emerald-950/60 border-emerald-800 text-emerald-300/70 hover:bg-emerald-900/40'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-black text-blue-300 uppercase tracking-wider flex items-center gap-1 truncate">
                    <span>♠</span> {activeGame.team2.name}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-black shrink-0 ${
                    team2Score > 0 ? 'bg-blue-400/25 text-blue-300 border border-blue-400/40' : 'bg-emerald-950 text-emerald-300'
                  }`}>
                    {team2Score > 0 ? `+${team2Score}` : team2Score} pt
                  </span>
                </div>
                <div className="text-[11px] text-emerald-400/80 truncate mt-0.5">
                  {activeGame.team2.players.join(' & ')}
                </div>
              </button>
            </div>

            {/* AREA COMPILAZIONE SQUADRA ATTIVA */}
            <div className="space-y-2.5 max-h-[55vh] overflow-y-auto pr-0.5">
              
              {/* RIGA 1: CHIUSURA (+100) & STATO POZZETTO (AFFIANCATI) */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                
                {/* Toggle Chiusura */}
                <div className="sm:col-span-4 p-2.5 rounded-xl bg-emerald-950/70 border border-emerald-700/40 flex items-center justify-between">
                  <div className="min-w-0 pr-1">
                    <span className="text-xs font-bold text-white block truncate">Chiusura</span>
                    <span className="text-[10px] text-emerald-400/80">+100 pt</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleChiusura(activeTab)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                      currentData.chiusura
                        ? 'gold-gradient text-emerald-950 shadow-md ring-2 ring-amber-300/50'
                        : 'bg-emerald-900/80 text-emerald-300 border border-emerald-700/60 hover:text-white'
                    }`}
                  >
                    <Check className={`w-3.5 h-3.5 stroke-[3] ${currentData.chiusura ? 'opacity-100' : 'opacity-0'}`} />
                    <span>{currentData.chiusura ? 'Chiuso (+100)' : 'No'}</span>
                  </button>
                </div>

                {/* Segmento Stato Pozzetto */}
                <div className="sm:col-span-8 p-2.5 rounded-xl bg-emerald-950/70 border border-emerald-700/40 flex flex-col justify-center">
                  <div className="flex items-center justify-between text-[11px] text-emerald-300 font-semibold mb-1">
                    <span>Stato Pozzetto:</span>
                    <span className="text-[10px] text-emerald-400/80 font-normal">
                      {currentData.pozzetto === 'preso_giocato' ? '0 pt' : '-100 pt'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 bg-emerald-900/60 p-0.5 rounded-lg border border-emerald-800/60 text-center">
                    <button
                      type="button"
                      onClick={() => setCurrentData(p => ({ ...p, pozzetto: 'preso_giocato' }))}
                      className={`py-1 px-1 rounded-md text-[11px] font-bold transition-all cursor-pointer truncate ${
                        currentData.pozzetto === 'preso_giocato'
                          ? 'bg-emerald-600 text-white shadow-xs font-extrabold'
                          : 'text-emerald-300 hover:text-white'
                      }`}
                    >
                      Preso & Giocato
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentData(p => ({ ...p, pozzetto: 'non_preso' }))}
                      className={`py-1 px-1 rounded-md text-[11px] font-bold transition-all cursor-pointer truncate ${
                        currentData.pozzetto === 'non_preso'
                          ? 'bg-rose-600 text-white shadow-xs font-extrabold'
                          : 'text-rose-300/80 hover:text-rose-200'
                      }`}
                    >
                      Non Preso (-100)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentData(p => ({ ...p, pozzetto: 'preso_non_giocato' }))}
                      className={`py-1 px-1 rounded-md text-[11px] font-bold transition-all cursor-pointer truncate ${
                        currentData.pozzetto === 'preso_non_giocato'
                          ? 'bg-rose-600 text-white shadow-xs font-extrabold'
                          : 'text-rose-300/80 hover:text-rose-200'
                      }`}
                    >
                      Non Giocato (-100)
                    </button>
                  </div>
                </div>

              </div>

              {/* RIGA 2: BURRACHI REALIZZATI (GRIGLIA ORIZZONTALE A 3 COLONNE) */}
              <div className="p-2.5 rounded-xl bg-emerald-950/70 border border-emerald-700/40">
                <div className="flex items-center justify-between text-xs text-amber-300 font-bold mb-2">
                  <span className="flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Burrachi Realizzati</span>
                  </span>
                  <span className="text-[11px] text-emerald-400/90 font-mono font-normal">
                    Totale Onori: +{currentHonorsBurrachi} pt
                  </span>
                </div>

                <div className={`grid ${activeGame.allowSemipulito ? 'grid-cols-3' : 'grid-cols-2'} gap-2`}>
                  
                  {/* Burraco Pulito */}
                  <div className="p-2 rounded-lg bg-emerald-900/50 border border-emerald-700/40 flex flex-col items-center justify-between text-center">
                    <div>
                      <span className="text-xs font-bold text-amber-300 block">💎 Pulito</span>
                      <span className="text-[10px] text-emerald-400/80 block">+200 pt cad.</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          sound.playTap();
                          setCurrentData(p => ({ ...p, burracoPulito: Math.max(0, p.burracoPulito - 1) }));
                        }}
                        className="w-6 h-6 rounded-md bg-emerald-800 text-white flex items-center justify-center hover:bg-emerald-700 active:scale-95 cursor-pointer font-bold"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-5 text-center font-black text-sm text-white">{currentData.burracoPulito}</span>
                      <button
                        type="button"
                        onClick={() => {
                          sound.playBurracoChime();
                          setCurrentData(p => ({ ...p, burracoPulito: p.burracoPulito + 1 }));
                        }}
                        className="w-6 h-6 rounded-md bg-amber-500 hover:bg-amber-400 text-emerald-950 flex items-center justify-center active:scale-95 cursor-pointer font-black"
                      >
                        <Plus className="w-3 h-3 text-emerald-950 stroke-[3]" />
                      </button>
                    </div>
                  </div>

                  {/* Burraco Semipulito (se attivo) */}
                  {activeGame.allowSemipulito && (
                    <div className="p-2 rounded-lg bg-emerald-900/50 border border-emerald-700/40 flex flex-col items-center justify-between text-center">
                      <div>
                        <span className="text-xs font-bold text-cyan-300 block">🃏 Semipulito</span>
                        <span className="text-[10px] text-emerald-400/80 block">+150 pt cad.</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            sound.playTap();
                            setCurrentData(p => ({ ...p, burracoSemipulito: Math.max(0, p.burracoSemipulito - 1) }));
                          }}
                          className="w-6 h-6 rounded-md bg-emerald-800 text-white flex items-center justify-center hover:bg-emerald-700 active:scale-95 cursor-pointer font-bold"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-5 text-center font-black text-sm text-white">{currentData.burracoSemipulito}</span>
                        <button
                          type="button"
                          onClick={() => {
                            sound.playBurracoChime();
                            setCurrentData(p => ({ ...p, burracoSemipulito: p.burracoSemipulito + 1 }));
                          }}
                          className="w-6 h-6 rounded-md bg-cyan-500 hover:bg-cyan-400 text-emerald-950 flex items-center justify-center active:scale-95 cursor-pointer font-black"
                        >
                          <Plus className="w-3 h-3 text-emerald-950 stroke-[3]" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Burraco Sporco */}
                  <div className="p-2 rounded-lg bg-emerald-900/50 border border-emerald-700/40 flex flex-col items-center justify-between text-center">
                    <div>
                      <span className="text-xs font-bold text-orange-300 block">♠ Sporco</span>
                      <span className="text-[10px] text-emerald-400/80 block">+100 pt cad.</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          sound.playTap();
                          setCurrentData(p => ({ ...p, burracoSporco: Math.max(0, p.burracoSporco - 1) }));
                        }}
                        className="w-6 h-6 rounded-md bg-emerald-800 text-white flex items-center justify-center hover:bg-emerald-700 active:scale-95 cursor-pointer font-bold"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-5 text-center font-black text-sm text-white">{currentData.burracoSporco}</span>
                      <button
                        type="button"
                        onClick={() => {
                          sound.playBurracoChime();
                          setCurrentData(p => ({ ...p, burracoSporco: p.burracoSporco + 1 }));
                        }}
                        className="w-6 h-6 rounded-md bg-orange-400 hover:bg-orange-300 text-emerald-950 flex items-center justify-center active:scale-95 cursor-pointer font-black"
                      >
                        <Plus className="w-3 h-3 text-emerald-950 stroke-[3]" />
                      </button>
                    </div>
                  </div>

                </div>
              </div>

              {/* RIGA 3: CARTE A TERRA (+) E CARTE IN MANO (-) (AFFIANCATE) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                
                {/* Colonna Sinistra: Carte a Terra (Punti Positivi) */}
                <div className="p-2.5 rounded-xl bg-emerald-950/70 border border-emerald-700/40 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-emerald-300 uppercase tracking-wider text-[11px]">
                      Carte a Terra (+)
                    </span>
                    <button
                      type="button"
                      onClick={() => setCurrentData(p => ({ ...p, showTableCardPad: !p.showTableCardPad }))}
                      className="text-[10px] text-emerald-400 hover:text-emerald-200 underline cursor-pointer"
                    >
                      {currentData.showTableCardPad ? 'Chiudi tastierino' : 'Usa tastierino'}
                    </button>
                  </div>

                  {!currentData.showTableCardPad ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        placeholder="Es: 135"
                        value={currentData.cardsOnTableDirect}
                        onChange={(e) => setCurrentData(p => ({ ...p, cardsOnTableDirect: e.target.value }))}
                        onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
                        className="w-full text-center text-lg sm:text-xl font-black py-1.5 rounded-xl bg-emerald-900/60 border border-emerald-500/50 text-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                      />
                      <span className="text-xs text-emerald-300 font-bold shrink-0">pt calati</span>
                    </div>
                  ) : (
                    /* Tastierino espanso a scomparsa per calcolo carte a terra */
                    <div className="space-y-1 mt-1 pt-1.5 border-t border-emerald-800/40">
                      {Object.entries(CARD_VALUES).map(([key, val]) => (
                        <div key={key} className="flex items-center justify-between text-xs py-0.5">
                          <div>
                            <span className={`font-semibold ${val.color} text-[11px]`}>{val.label}</span>
                            <span className="text-[10px] text-emerald-400/70 ml-1">(+{val.points} pt)</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setCurrentData(p => ({
                                ...p,
                                cardsOnTableDirect: '',
                                cardsOnTableCount: {
                                  ...p.cardsOnTableCount,
                                  [key]: Math.max(0, (p.cardsOnTableCount[key] || 0) - 1)
                                }
                              }))}
                              className="w-5 h-5 rounded bg-emerald-800 text-white flex items-center justify-center hover:bg-emerald-700 cursor-pointer font-bold text-xs"
                            >
                              -
                            </button>
                            <span className="w-5 text-center font-bold text-xs text-white">
                              {currentData.cardsOnTableCount[key] || 0}
                            </span>
                            <button
                              type="button"
                              onClick={() => setCurrentData(p => ({
                                ...p,
                                cardsOnTableDirect: '',
                                cardsOnTableCount: {
                                  ...p.cardsOnTableCount,
                                  [key]: (p.cardsOnTableCount[key] || 0) + 1
                                }
                              }))}
                              className="w-5 h-5 rounded bg-emerald-800 text-white flex items-center justify-center hover:bg-emerald-700 cursor-pointer font-bold text-xs"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      ))}
                      <div className="text-right text-[11px] text-emerald-300 font-bold pt-1 border-t border-emerald-800/50">
                        Totale carte: +{currentTablePoints} pt
                      </div>
                    </div>
                  )}
                </div>

                {/* Colonna Destra: Carte in Mano (Punti da Sottrarre) */}
                <div className="p-2.5 rounded-xl bg-emerald-950/70 border border-emerald-700/40 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-rose-300 uppercase tracking-wider text-[11px]">
                      Carte in Mano (-)
                    </span>
                    <button
                      type="button"
                      onClick={() => setCurrentData(p => ({ ...p, showHandCardPad: !p.showHandCardPad }))}
                      className="text-[10px] text-rose-300/80 hover:text-rose-200 underline cursor-pointer"
                    >
                      {currentData.showHandCardPad ? 'Chiudi tastierino' : 'Usa tastierino'}
                    </button>
                  </div>

                  {!currentData.showHandCardPad ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        placeholder="Es: 40"
                        value={currentData.cardsInHandDirect}
                        onChange={(e) => setCurrentData(p => ({ ...p, cardsInHandDirect: e.target.value }))}
                        onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
                        className="w-full text-center text-lg sm:text-xl font-black py-1.5 rounded-xl bg-emerald-900/60 border border-rose-500/50 text-rose-200 focus:outline-none focus:ring-2 focus:ring-rose-400"
                      />
                      <span className="text-xs text-rose-300 font-bold shrink-0">pt da togliere</span>
                    </div>
                  ) : (
                    /* Tastierino espanso a scomparsa per calcolo carte in mano */
                    <div className="space-y-1 mt-1 pt-1.5 border-t border-emerald-800/40">
                      {Object.entries(CARD_VALUES).map(([key, val]) => (
                        <div key={key} className="flex items-center justify-between text-xs py-0.5">
                          <div>
                            <span className={`font-semibold ${val.color} text-[11px]`}>{val.label}</span>
                            <span className="text-[10px] text-rose-400/80 ml-1">(-{val.points} pt)</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setCurrentData(p => ({
                                ...p,
                                cardsInHandDirect: '',
                                cardsInHandCount: {
                                  ...p.cardsInHandCount,
                                  [key]: Math.max(0, (p.cardsInHandCount[key] || 0) - 1)
                                }
                              }))}
                              className="w-5 h-5 rounded bg-emerald-800 text-white flex items-center justify-center hover:bg-emerald-700 cursor-pointer font-bold text-xs"
                            >
                              -
                            </button>
                            <span className="w-5 text-center font-bold text-xs text-white">
                              {currentData.cardsInHandCount[key] || 0}
                            </span>
                            <button
                              type="button"
                              onClick={() => setCurrentData(p => ({
                                ...p,
                                cardsInHandDirect: '',
                                cardsInHandCount: {
                                  ...p.cardsInHandCount,
                                  [key]: (p.cardsInHandCount[key] || 0) + 1
                                }
                              }))}
                              className="w-5 h-5 rounded bg-emerald-800 text-white flex items-center justify-center hover:bg-emerald-700 cursor-pointer font-bold text-xs"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      ))}
                      <div className="text-right text-[11px] text-rose-300 font-bold pt-1 border-t border-emerald-800/50">
                        Totale carte in mano: -{currentHandPoints} pt
                      </div>
                    </div>
                  )}
                </div>

              </div>

              {/* RIGA 4: MINI-SCONTRINO DI RIEPILOGO TRASPARENTE IN TEMPO REALE */}
              <div className="p-2 rounded-xl bg-emerald-950/90 border border-emerald-800/80 flex flex-wrap items-center justify-between gap-1 text-[11px]">
                <div className="flex flex-wrap items-center gap-1.5 text-emerald-300/90">
                  <span className="font-semibold text-white">{currentTeamName}:</span>
                  {currentChiusuraPoints > 0 && <span>Chiusura (+{currentChiusuraPoints})</span>}
                  {currentHonorsBurrachi > 0 && <span>• Burrachi (+{currentHonorsBurrachi})</span>}
                  {currentPozzettoPoints !== 0 && <span className="text-rose-400">• Pozzetto ({currentPozzettoPoints})</span>}
                  <span>• Carte ({currentTablePoints} - {currentHandPoints} = {currentTablePoints - currentHandPoints >= 0 ? `+${currentTablePoints - currentHandPoints}` : currentTablePoints - currentHandPoints})</span>
                </div>
                <div className="font-black text-amber-300 ml-auto">
                  TOTALE: {currentTeamScore >= 0 ? `+${currentTeamScore}` : currentTeamScore} pt
                </div>
              </div>

            </div>
          </div>
        )}

        {/* BARRA INFERIORE DI RIEPILOGO E SALVATAGGIO */}
        <div className="mt-3.5 pt-2.5 border-t border-emerald-700/50">
          <div className="flex items-center justify-between mb-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-emerald-300/80 text-[11px]">Riepilogo Mano:</span>
              <span className="font-bold text-amber-300 text-xs">
                ♦ {activeGame.team1.name}: {team1Score >= 0 ? `+${team1Score}` : team1Score} pt
              </span>
              <span className="text-emerald-600 font-bold">•</span>
              <span className="font-bold text-blue-300 text-xs">
                ♠ {activeGame.team2.name}: {team2Score >= 0 ? `+${team2Score}` : team2Score} pt
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-xl bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200 font-semibold text-xs border border-emerald-700/50 transition-colors cursor-pointer"
            >
              Annulla
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex-[2] py-2 rounded-xl gold-gradient hover:brightness-110 text-emerald-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-900/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <Check className="w-4 h-4 text-emerald-950 stroke-[3]" />
              <span>{roundToEdit ? 'Aggiorna Mano' : 'Conferma e Salva Mano'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
