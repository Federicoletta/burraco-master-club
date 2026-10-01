import React, { useState, useEffect } from 'react';
import { X, Calculator, Zap, Plus, Minus, Check, ArrowRight, Layers, HelpCircle } from 'lucide-react';
import { CARD_VALUES, HONOR_POINTS, calculateTeamRoundScore } from '../constants/burraco';
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

  // Helper gestione chiusura esclusiva (solo una squadra può chiudere)
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

  const handleSwitchTab = (targetTab) => {
    if (document.activeElement && typeof document.activeElement.blur === 'function') {
      document.activeElement.blur();
    }
    setActiveTab(targetTab);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl felt-card rounded-2xl border border-amber-500/40 p-4 sm:p-6 my-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Modal */}
        <div className="flex items-center justify-between pb-3 border-b border-emerald-700/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-emerald-950 font-black shadow-md">
              <Calculator className="w-5 h-5 text-emerald-950" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white m-0">
                {roundToEdit ? `Modifica Mano #${roundToEdit.roundNumber}` : `Punteggio Mano #${roundNumber}`}
              </h2>
              <p className="text-xs text-emerald-300/80 m-0">
                Calcolo accurato onori, carte a terra e carte in mano
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-800/50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modalità di Inserimento (Guidato vs Rapido) */}
        <div className="mt-3 flex items-center justify-between gap-2 p-1.5 rounded-xl bg-emerald-950/70 border border-emerald-800/60">
          <button
            type="button"
            onClick={() => setEntryMode('guided')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              entryMode === 'guided'
                ? 'bg-amber-500 text-emerald-950 shadow-md'
                : 'text-emerald-300 hover:text-white'
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span>Calcolo Guidato (Ufficiale)</span>
          </button>
          <button
            type="button"
            onClick={() => setEntryMode('quick')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              entryMode === 'quick'
                ? 'bg-amber-500 text-emerald-950 shadow-md'
                : 'text-emerald-300 hover:text-white'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Inserimento Rapido Totali</span>
          </button>
        </div>

        {/* CONTENUTO INSERIMENTO RAPIDO */}
        {entryMode === 'quick' ? (
          <div className="my-6 space-y-4">
            <p className="text-xs text-emerald-300/90 text-center">
              Inserisci direttamente il totale punti calcolato per ciascuna squadra per questa mano.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* SQUADRA 1 */}
              <div className="p-4 rounded-xl bg-emerald-950/60 border border-amber-500/30">
                <span className="text-xs font-bold text-amber-300 uppercase tracking-wider block mb-1">
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
                    className="w-full text-center text-3xl font-black py-3 rounded-xl bg-emerald-900/80 border border-amber-400/50 text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                  <span className="text-[10px] text-emerald-400/60 block text-center mt-1">
                    Supporta anche valori negativi (es: -100)
                  </span>
                </div>
              </div>

              {/* SQUADRA 2 */}
              <div className="p-4 rounded-xl bg-emerald-950/60 border border-blue-500/30">
                <span className="text-xs font-bold text-blue-300 uppercase tracking-wider block mb-1">
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
                    className="w-full text-center text-3xl font-black py-3 rounded-xl bg-emerald-900/80 border border-blue-400/50 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  <span className="text-[10px] text-emerald-400/60 block text-center mt-1">
                    Supporta anche valori negativi (es: -100)
                  </span>
                </div>
              </div>

            </div>
          </div>
        ) : (
          /* CONTENUTO CALCOLO GUIDATO */
          <div className="mt-4">
            
            {/* Selettore Squadra Tab */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <button
                type="button"
                onPointerDown={() => handleSwitchTab('team1')}
                onClick={() => handleSwitchTab('team1')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden select-none ${
                  activeTab === 'team1'
                    ? 'bg-emerald-900/90 border-amber-400 ring-2 ring-amber-400/30'
                    : 'bg-emerald-950/50 border-emerald-800 text-emerald-300/70 hover:bg-emerald-900/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1 truncate">
                    <span>♦</span> {activeGame.team1.name}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-black bg-amber-400/20 text-amber-200 border border-amber-400/30">
                    {team1Score > 0 ? `+${team1Score}` : team1Score} pt
                  </span>
                </div>
                <div className="text-[11px] text-emerald-400/80 truncate">
                  {activeGame.team1.players.join(' & ')}
                </div>
              </button>

              <button
                type="button"
                onPointerDown={() => handleSwitchTab('team2')}
                onClick={() => handleSwitchTab('team2')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden select-none ${
                  activeTab === 'team2'
                    ? 'bg-emerald-900/90 border-blue-400 ring-2 ring-blue-400/30'
                    : 'bg-emerald-950/50 border-emerald-800 text-emerald-300/70 hover:bg-emerald-900/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-300 uppercase tracking-wider flex items-center gap-1 truncate">
                    <span>♠</span> {activeGame.team2.name}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-black bg-blue-400/20 text-blue-200 border border-blue-400/30">
                    {team2Score > 0 ? `+${team2Score}` : team2Score} pt
                  </span>
                </div>
                <div className="text-[11px] text-emerald-400/80 truncate">
                  {activeGame.team2.players.join(' & ')}
                </div>
              </button>
            </div>

            {/* SEZIONE COMPILAZIONE PER LA SQUADRA SELEZIONATA */}
            <div className="space-y-4 max-h-[52vh] overflow-y-auto pr-1">
              
              {/* 1. CHIUSURA DELLA MANO */}
              <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-700/40 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">Chiusura della Smazzata (+100 pt)</span>
                  <span className="text-[11px] text-emerald-300/70 block">
                    {currentTeamName} ha scartato l'ultima carta dopo aver preso il pozzetto?
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleChiusura(activeTab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    currentData.chiusura
                      ? 'bg-amber-400 text-emerald-950 font-black shadow-md'
                      : 'bg-emerald-900/80 text-emerald-300 border border-emerald-700/60 hover:text-white'
                  }`}
                >
                  <Check className={`w-3.5 h-3.5 ${currentData.chiusura ? 'opacity-100' : 'opacity-0'}`} />
                  <span>{currentData.chiusura ? 'Chiuso (+100)' : 'No'}</span>
                </button>
              </div>

              {/* 2. ONORI & BURRACHI */}
              <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-700/40">
                <span className="text-xs font-bold text-amber-300 uppercase tracking-wider block mb-2">
                  Burrachi Realizzati
                </span>

                <div className="space-y-2.5">
                  {/* Burraco Pulito */}
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs sm:text-sm font-semibold text-emerald-100 block">Burraco Pulito (+200 pt)</span>
                      <span className="text-[11px] text-emerald-400/80">7 o più carte dello stesso seme senza Jolly/Pinelle</span>
                    </div>
                    <div className="flex items-center gap-2 bg-emerald-900/80 rounded-lg p-1 border border-emerald-700/50">
                      <button
                        type="button"
                        onClick={() => {
                          sound.playTap();
                          setCurrentData(p => ({ ...p, burracoPulito: Math.max(0, p.burracoPulito - 1) }));
                        }}
                        className="w-7 h-7 rounded-md bg-emerald-800 text-white flex items-center justify-center hover:bg-emerald-700 active:scale-95 cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-6 text-center font-bold text-sm text-white">{currentData.burracoPulito}</span>
                      <button
                        type="button"
                        onClick={() => {
                          sound.playBurracoChime();
                          setCurrentData(p => ({ ...p, burracoPulito: p.burracoPulito + 1 }));
                        }}
                        className="w-7 h-7 rounded-md bg-emerald-800 text-white flex items-center justify-center hover:bg-emerald-700 active:scale-95 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Burraco Semipulito (se abilitato) */}
                  {activeGame.allowSemipulito && (
                    <div className="flex items-center justify-between pt-2 border-t border-emerald-800/40">
                      <div>
                        <span className="text-xs sm:text-sm font-semibold text-emerald-100 block">Burraco Semipulito (+150 pt)</span>
                        <span className="text-[11px] text-emerald-400/80">8 carte con 7 lisce consecutive o sequenza spezzata</span>
                      </div>
                      <div className="flex items-center gap-2 bg-emerald-900/80 rounded-lg p-1 border border-emerald-700/50">
                        <button
                          type="button"
                          onClick={() => {
                            sound.playTap();
                            setCurrentData(p => ({ ...p, burracoSemipulito: Math.max(0, p.burracoSemipulito - 1) }));
                          }}
                          className="w-7 h-7 rounded-md bg-emerald-800 text-white flex items-center justify-center hover:bg-emerald-700 active:scale-95 cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-6 text-center font-bold text-sm text-white">{currentData.burracoSemipulito}</span>
                        <button
                          type="button"
                          onClick={() => {
                            sound.playBurracoChime();
                            setCurrentData(p => ({ ...p, burracoSemipulito: p.burracoSemipulito + 1 }));
                          }}
                          className="w-7 h-7 rounded-md bg-emerald-800 text-white flex items-center justify-center hover:bg-emerald-700 active:scale-95 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Burraco Sporco */}
                  <div className="flex items-center justify-between pt-2 border-t border-emerald-800/40">
                    <div>
                      <span className="text-xs sm:text-sm font-semibold text-emerald-100 block">Burraco Sporco (+100 pt)</span>
                      <span className="text-[11px] text-emerald-400/80">7 o più carte contenenti un Jolly o una Pinella</span>
                    </div>
                    <div className="flex items-center gap-2 bg-emerald-900/80 rounded-lg p-1 border border-emerald-700/50">
                      <button
                        type="button"
                        onClick={() => {
                          sound.playTap();
                          setCurrentData(p => ({ ...p, burracoSporco: Math.max(0, p.burracoSporco - 1) }));
                        }}
                        className="w-7 h-7 rounded-md bg-emerald-800 text-white flex items-center justify-center hover:bg-emerald-700 active:scale-95 cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-6 text-center font-bold text-sm text-white">{currentData.burracoSporco}</span>
                      <button
                        type="button"
                        onClick={() => {
                          sound.playBurracoChime();
                          setCurrentData(p => ({ ...p, burracoSporco: p.burracoSporco + 1 }));
                        }}
                        className="w-7 h-7 rounded-md bg-emerald-800 text-white flex items-center justify-center hover:bg-emerald-700 active:scale-95 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. POZZETTO */}
              <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-700/40">
                <span className="text-xs font-bold text-amber-300 uppercase tracking-wider block mb-2">
                  Stato Pozzetto
                </span>
                <div className="grid grid-cols-3 gap-1.5 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      sound.playTap();
                      setCurrentData(p => ({ ...p, pozzetto: 'preso_giocato' }));
                    }}
                    className={`py-2 px-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                      currentData.pozzetto === 'preso_giocato'
                        ? 'bg-emerald-800 border-emerald-400 text-white'
                        : 'bg-emerald-900/40 border-emerald-800 text-emerald-400 hover:text-white'
                    }`}
                  >
                    <div>Preso & Giocato</div>
                    <div className="text-[10px] text-emerald-300">0 pt</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      sound.playTap();
                      setCurrentData(p => ({ ...p, pozzetto: 'non_preso' }));
                    }}
                    className={`py-2 px-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                      currentData.pozzetto === 'non_preso'
                        ? 'bg-rose-900/90 border-rose-500 text-rose-200'
                        : 'bg-emerald-900/40 border-emerald-800 text-emerald-400 hover:text-rose-300'
                    }`}
                  >
                    <div>Non Preso</div>
                    <div className="text-[10px] text-rose-400 font-bold">-100 pt</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      sound.playTap();
                      setCurrentData(p => ({ ...p, pozzetto: 'preso_non_giocato' }));
                    }}
                    className={`py-2 px-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                      currentData.pozzetto === 'preso_non_giocato'
                        ? 'bg-rose-900/90 border-rose-500 text-rose-200'
                        : 'bg-emerald-900/40 border-emerald-800 text-emerald-400 hover:text-rose-300'
                    }`}
                  >
                    <div>Preso non giocato</div>
                    <div className="text-[10px] text-rose-400 font-bold">-100 pt</div>
                  </button>
                </div>
              </div>

              {/* 4. CARTE A TERRA (Punti Positivi) */}
              <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-700/40">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-xs font-bold text-emerald-200 uppercase tracking-wider block">
                      Carte a Terra (Punti Positivi)
                    </span>
                    <span className="text-[11px] text-emerald-400/80">
                      Inserisci il valore calcolato o usa il conteggio guidato
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentData(p => ({ ...p, showTableCardPad: !p.showTableCardPad }))}
                    className="text-xs text-amber-300 hover:text-amber-200 underline font-medium cursor-pointer"
                  >
                    {currentData.showTableCardPad ? 'Nascondi tastierino' : 'Usa tastierino carte'}
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
                      className="w-full px-3 py-2 rounded-lg bg-emerald-900/60 border border-emerald-700/60 text-white font-bold text-base focus:outline-none focus:border-amber-400"
                    />
                    <span className="text-xs text-emerald-300 font-bold">punti</span>
                  </div>
                ) : (
                  /* Tastierino carte a terra */
                  <div className="space-y-2 mt-2 pt-2 border-t border-emerald-800/40">
                    {Object.entries(CARD_VALUES).map(([key, val]) => (
                      <div key={key} className="flex items-center justify-between text-xs py-1">
                        <div>
                          <span className={`font-semibold ${val.color}`}>{val.label}</span>
                          <span className="text-[10px] text-emerald-400/70 ml-1.5">({val.points} pt cad.)</span>
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
                            className="w-6 h-6 rounded bg-emerald-800 text-white flex items-center justify-center hover:bg-emerald-700 cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center font-bold text-white">
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
                            className="w-6 h-6 rounded bg-emerald-800 text-white flex items-center justify-center hover:bg-emerald-700 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 5. CARTE IN MANO (Punti Negativi da Detrarre) */}
              <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-700/40">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-xs font-bold text-rose-300 uppercase tracking-wider block">
                      Carte rimaste in Mano (Punti da Sottrarre)
                    </span>
                    <span className="text-[11px] text-rose-400/80">
                      Carte non calate rimaste in mano al momento della chiusura
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentData(p => ({ ...p, showHandCardPad: !p.showHandCardPad }))}
                    className="text-xs text-rose-300 hover:text-rose-200 underline font-medium cursor-pointer"
                  >
                    {currentData.showHandCardPad ? 'Nascondi tastierino' : 'Usa tastierino carte'}
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
                      className="w-full px-3 py-2 rounded-lg bg-emerald-900/60 border border-rose-500/40 text-white font-bold text-base focus:outline-none focus:border-rose-400"
                    />
                    <span className="text-xs text-rose-300 font-bold">punti da sottrarre</span>
                  </div>
                ) : (
                  /* Tastierino carte in mano */
                  <div className="space-y-2 mt-2 pt-2 border-t border-emerald-800/40">
                    {Object.entries(CARD_VALUES).map(([key, val]) => (
                      <div key={key} className="flex items-center justify-between text-xs py-1">
                        <div>
                          <span className={`font-semibold ${val.color}`}>{val.label}</span>
                          <span className="text-[10px] text-rose-400/80 ml-1.5">(-{val.points} pt cad.)</span>
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
                            className="w-6 h-6 rounded bg-emerald-800 text-white flex items-center justify-center hover:bg-emerald-700 cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center font-bold text-white">
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
                            className="w-6 h-6 rounded bg-emerald-800 text-white flex items-center justify-center hover:bg-emerald-700 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* BARRA INFERIORE DI RIEPILOGO E SALVATAGGIO */}
        <div className="mt-4 pt-3 border-t border-emerald-700/50">
          <div className="flex items-center justify-between mb-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-emerald-300">Riepilogo Mano:</span>
              <span className="font-bold text-amber-300">
                {activeGame.team1.name}: {team1Score >= 0 ? `+${team1Score}` : team1Score} pt
              </span>
              <span className="text-emerald-500">•</span>
              <span className="font-bold text-blue-300">
                {activeGame.team2.name}: {team2Score >= 0 ? `+${team2Score}` : team2Score} pt
              </span>
            </div>

            {entryMode === 'guided' && (
              <button
                type="button"
                onPointerDown={() => handleSwitchTab(activeTab === 'team1' ? 'team2' : 'team1')}
                onClick={() => handleSwitchTab(activeTab === 'team1' ? 'team2' : 'team1')}
                className="text-emerald-300 hover:text-white flex items-center gap-1 font-semibold cursor-pointer select-none"
              >
                <span>Passa a {activeTab === 'team1' ? activeGame.team2.name : activeGame.team1.name}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200 font-semibold text-xs sm:text-sm border border-emerald-700/50 transition-colors cursor-pointer"
            >
              Annulla
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex-[2] py-2.5 rounded-xl gold-gradient hover:brightness-110 text-emerald-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-900/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <Check className="w-4 h-4 text-emerald-950" />
              <span>{roundToEdit ? 'Aggiorna Mano' : 'Conferma e Salva Mano'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
