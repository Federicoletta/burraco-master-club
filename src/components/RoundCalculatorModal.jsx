import React, { useState, useEffect } from 'react';
import { X, Calculator, Zap, Check } from 'lucide-react';
import { HONOR_POINTS, calculateTeamRoundScore, calculateCardsPoints } from '../constants/burraco';
import { sound } from '../utils/soundEffects';
import TrioLoneSelector from './round/TrioLoneSelector';
import QuickEntryPad from './round/QuickEntryPad';
import BurracoToggles from './round/BurracoToggles';
import CardsPointsInput from './round/CardsPointsInput';
import RoundReceiptSummary from './round/RoundReceiptSummary';

const DEFAULT_ENTITY = {
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
};

export default function RoundCalculatorModal({
  isOpen,
  onClose,
  onSaveRound,
  activeGame,
  roundToEdit = null,
  roundNumber = 1
}) {
  const isTrio = activeGame?.mode === 'trio';
  const [entryMode, setEntryMode] = useState('guided'); // 'guided' | 'quick'
  const [activeTab, setActiveTab] = useState(isTrio ? 'lone' : 'team1'); // 'team1' | 'team2' | 'lone' | 'pair'
  const [lonePlayer, setLonePlayer] = useState('team1'); // 'team1' | 'team2' | 'team3'
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Stato per Squadra 1
  const [team1Data, setTeam1Data] = useState({ ...DEFAULT_ENTITY });

  // Stato per Squadra 2
  const [team2Data, setTeam2Data] = useState({ ...DEFAULT_ENTITY });

  // Stato per Giocatore 3 (Quick mode a 3)
  const [team3Data, setTeam3Data] = useState({ ...DEFAULT_ENTITY });

  // Stato per Burraco a 3 (Modalità Guidata FIBUR: Solitario vs Coppia)
  const [loneData, setLoneData] = useState({ ...DEFAULT_ENTITY });
  const [pairData, setPairData] = useState({ ...DEFAULT_ENTITY });

  // Caricamento in caso di modifica di una mano
  useEffect(() => {
    if (roundToEdit) {
      if (roundToEdit.lonePlayer) {
        setLonePlayer(roundToEdit.lonePlayer);
      }
      if (roundToEdit.entryMode === 'quick') {
        setEntryMode('quick');
        setTeam1Data(prev => ({ ...prev, manualScore: String(roundToEdit.team1Score ?? '') }));
        setTeam2Data(prev => ({ ...prev, manualScore: String(roundToEdit.team2Score ?? '') }));
        setTeam3Data(prev => ({ ...prev, manualScore: String(roundToEdit.team3Score ?? '') }));
      } else {
        setEntryMode('guided');
        if (isTrio) {
          if (roundToEdit.loneDetails && roundToEdit.pairDetails) {
            setLoneData({ ...DEFAULT_ENTITY, ...roundToEdit.loneDetails });
            setPairData({ ...DEFAULT_ENTITY, ...roundToEdit.pairDetails });
          } else {
            const lp = roundToEdit.lonePlayer || 'team1';
            const loneDet = lp === 'team1' ? roundToEdit.team1Details : lp === 'team2' ? roundToEdit.team2Details : roundToEdit.team3Details;
            const pairDet = lp === 'team1' ? roundToEdit.team2Details : roundToEdit.team1Details;
            if (loneDet) setLoneData({ ...DEFAULT_ENTITY, ...loneDet });
            if (pairDet) setPairData({ ...DEFAULT_ENTITY, ...pairDet });
          }
        } else {
          if (roundToEdit.team1Details) setTeam1Data({ ...DEFAULT_ENTITY, ...roundToEdit.team1Details });
          if (roundToEdit.team2Details) setTeam2Data({ ...DEFAULT_ENTITY, ...roundToEdit.team2Details });
        }
      }
    } else {
      // Reset defaults per nuova mano con rotazione automatica ufficiale FIBUR
      setTeam1Data({ ...DEFAULT_ENTITY });
      setTeam2Data({ ...DEFAULT_ENTITY });
      setTeam3Data({ ...DEFAULT_ENTITY });
      setLoneData({ ...DEFAULT_ENTITY });
      setPairData({ ...DEFAULT_ENTITY });
      const expectedLone = ((roundNumber - 1) % 3 === 0) 
        ? 'team1' 
        : ((roundNumber - 1) % 3 === 1) 
        ? 'team2' 
        : 'team3';
      setLonePlayer(expectedLone);
      setActiveTab(isTrio ? 'lone' : 'team1');
    }
    setIsSubmitting(false);
  }, [roundToEdit, isOpen, isTrio, roundNumber]);

  if (!isOpen || !activeGame) return null;

  // Calcolo punti in tempo reale
  const team1ScoreNormal = entryMode === 'quick' 
    ? Number(team1Data.manualScore) || 0 
    : calculateTeamRoundScore(team1Data);

  const team2ScoreNormal = entryMode === 'quick' 
    ? Number(team2Data.manualScore) || 0 
    : calculateTeamRoundScore(team2Data);

  // Calcolo punti per modalità a 3
  const loneScore = calculateTeamRoundScore(loneData);
  const pairRawScore = calculateTeamRoundScore(pairData);
  const pairSplitScore = Math.round(pairRawScore / 2);

  const t1Quick = Number(team1Data.manualScore) || 0;
  const t2Quick = Number(team2Data.manualScore) || 0;
  const t3Quick = Number(team3Data.manualScore) || 0;

  let team1Score = team1ScoreNormal;
  let team2Score = team2ScoreNormal;
  let team3Score = 0;

  if (isTrio) {
    if (entryMode === 'quick') {
      team1Score = t1Quick;
      team2Score = t2Quick;
      team3Score = t3Quick;
    } else {
      if (lonePlayer === 'team1') {
        team1Score = loneScore;
        team2Score = pairSplitScore;
        team3Score = pairSplitScore;
      } else if (lonePlayer === 'team2') {
        team1Score = pairSplitScore;
        team2Score = loneScore;
        team3Score = pairSplitScore;
      } else {
        team1Score = pairSplitScore;
        team2Score = pairSplitScore;
        team3Score = loneScore;
      }
    }
  }

  // Helper gestione chiusura esclusiva (solo una squadra o entità può chiudere la smazzata)
  const handleChiusura = (tabKey) => {
    if (isTrio) {
      if (tabKey === 'lone') {
        const willClose = !loneData.chiusura;
        setLoneData(prev => ({ ...prev, chiusura: willClose }));
        if (willClose) {
          sound.playBurracoChime();
          setPairData(prev => ({ ...prev, chiusura: false }));
        } else {
          sound.playTap();
        }
      } else {
        const willClose = !pairData.chiusura;
        setPairData(prev => ({ ...prev, chiusura: willClose }));
        if (willClose) {
          sound.playBurracoChime();
          setLoneData(prev => ({ ...prev, chiusura: false }));
        } else {
          sound.playTap();
        }
      }
      return;
    }

    if (tabKey === 'team1') {
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
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      sound.playCardDeal();
      const roundData = {
        roundNumber: roundToEdit ? roundToEdit.roundNumber : roundNumber,
        entryMode,
        team1Score,
        team2Score,
        ...(isTrio ? {
          team3Score,
          lonePlayer,
          loneDetails: entryMode === 'guided' ? loneData : null,
          pairDetails: entryMode === 'guided' ? pairData : null,
          team1Details: entryMode === 'guided' 
            ? (lonePlayer === 'team1' ? loneData : pairData)
            : { manualScore: team1Score },
          team2Details: entryMode === 'guided' 
            ? (lonePlayer === 'team2' ? loneData : pairData)
            : { manualScore: team2Score },
          team3Details: entryMode === 'guided' 
            ? (lonePlayer === 'team3' ? loneData : pairData)
            : { manualScore: team3Score },
        } : {
          team1Details: entryMode === 'guided' ? team1Data : { manualScore: team1Score },
          team2Details: entryMode === 'guided' ? team2Data : { manualScore: team2Score },
        }),
        timestamp: new Date().toISOString(),
      };

      if (typeof onSaveRound === 'function') {
        onSaveRound(roundData);
      }
    } catch (err) {
      console.error('Errore durante il salvataggio della mano:', err);
    } finally {
      if (typeof onClose === 'function') {
        onClose();
      }
      setIsSubmitting(false);
    }
  };

  const lonePlayerName = activeGame[lonePlayer]?.name || (lonePlayer === 'team1' ? 'Giocatore 1' : lonePlayer === 'team2' ? 'Giocatore 2' : 'Giocatore 3');
  const pairKeys = ['team1', 'team2', 'team3'].filter(k => k !== lonePlayer);
  const pairNames = pairKeys.map(k => activeGame[k]?.name).filter(Boolean).join(' & ');

  let currentData;
  let setCurrentData;
  let currentTeamName;
  let currentTeamScore;

  if (isTrio) {
    if (activeTab === 'lone') {
      currentData = loneData;
      setCurrentData = setLoneData;
      currentTeamName = `👤 ${lonePlayerName} (Solitario)`;
      currentTeamScore = loneScore;
    } else {
      currentData = pairData;
      setCurrentData = setPairData;
      currentTeamName = `👥 Coppia (${pairNames})`;
      currentTeamScore = pairRawScore;
    }
  } else {
    if (activeTab === 'team1') {
      currentData = team1Data;
      setCurrentData = setTeam1Data;
      currentTeamName = activeGame.team1.name;
      currentTeamScore = team1Score;
    } else {
      currentData = team2Data;
      setCurrentData = setTeam2Data;
      currentTeamName = activeGame.team2.name;
      currentTeamScore = team2Score;
    }
  }

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

  const handleTableCountChange = (key, delta) => {
    setCurrentData(p => ({
      ...p,
      cardsOnTableDirect: '',
      cardsOnTableCount: {
        ...p.cardsOnTableCount,
        [key]: Math.max(0, (p.cardsOnTableCount[key] || 0) + delta)
      }
    }));
  };

  const handleHandCountChange = (key, delta) => {
    setCurrentData(p => ({
      ...p,
      cardsInHandDirect: '',
      cardsInHandCount: {
        ...p.cardsInHandCount,
        [key]: Math.max(0, (p.cardsInHandCount[key] || 0) + delta)
      }
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      {/* Scheda allargata orizzontalmente: max-w-3xl */}
      <div className="relative w-full max-w-3xl felt-card rounded-3xl border border-amber-500/40 p-4 sm:p-5 my-3 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
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
          <QuickEntryPad
            isTrio={isTrio}
            activeGame={activeGame}
            team1Data={team1Data}
            setTeam1Data={setTeam1Data}
            team2Data={team2Data}
            setTeam2Data={setTeam2Data}
            team3Data={team3Data}
            setTeam3Data={setTeam3Data}
          />
        ) : (
          /* CONTENUTO CALCOLO GUIDATO */
          <div className="mt-3 space-y-3">
            
            {/* SE MODALITÀ A 3: SELETTORE CHI È IL SOLITARIO (18 CARTE) */}
            {isTrio && (
              <TrioLoneSelector
                lonePlayer={lonePlayer}
                setLonePlayer={setLonePlayer}
                activeGame={activeGame}
                pairNames={pairNames}
                pairRawScore={pairRawScore}
                pairSplitScore={pairSplitScore}
              />
            )}

            {/* SELETTORE TAB GUIDATO */}
            {isTrio ? (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onPointerDown={() => handleSwitchTab('lone')}
                  onClick={() => handleSwitchTab('lone')}
                  className={`p-2 sm:p-2.5 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden select-none ${
                    activeTab === 'lone'
                      ? 'bg-emerald-900/90 border-amber-400 ring-2 ring-amber-400/40 shadow-md'
                      : 'bg-emerald-950/60 border-emerald-800 text-emerald-300/70 hover:bg-emerald-900/40'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1 truncate">
                      <span>👤</span> Solitario: {lonePlayerName}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-black shrink-0 ${
                      loneScore > 0 ? 'bg-amber-400/25 text-amber-300 border border-amber-400/40' : 'bg-emerald-950 text-emerald-300'
                    }`}>
                      {loneScore > 0 ? `+${loneScore}` : loneScore} pt
                    </span>
                  </div>
                  <div className="text-[10px] text-emerald-400/80 truncate mt-0.5">
                    100% punti assegnati a {lonePlayerName}
                  </div>
                </button>

                <button
                  type="button"
                  onPointerDown={() => handleSwitchTab('pair')}
                  onClick={() => handleSwitchTab('pair')}
                  className={`p-2 sm:p-2.5 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden select-none ${
                    activeTab === 'pair'
                      ? 'bg-emerald-900/90 border-blue-400 ring-2 ring-blue-400/40 shadow-md'
                      : 'bg-emerald-950/60 border-emerald-800 text-emerald-300/70 hover:bg-emerald-900/40'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-black text-blue-300 uppercase tracking-wider flex items-center gap-1 truncate">
                      <span>👥</span> Coppia: {pairNames}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-black shrink-0 ${
                      pairSplitScore > 0 ? 'bg-blue-400/25 text-blue-300 border border-blue-400/40' : 'bg-emerald-950 text-emerald-300'
                    }`}>
                      {pairSplitScore > 0 ? `+${pairSplitScore}` : pairSplitScore} pt cad.
                    </span>
                  </div>
                  <div className="text-[10px] text-emerald-400/80 truncate mt-0.5">
                    Totale tavolo: {pairRawScore} pt (÷2 per ciascun compagno)
                  </div>
                </button>
              </div>
            ) : (
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
            )}

            {/* AREA COMPILAZIONE SQUADRA ATTIVA */}
            <div className="space-y-2.5 max-h-[55vh] overflow-y-auto pr-0.5">
              
              {/* TOGGLES: Chiusura, Pozzetto e Burrachi */}
              <BurracoToggles
                currentData={currentData}
                setCurrentData={setCurrentData}
                onToggleChiusura={() => handleChiusura(activeTab)}
                allowSemipulito={activeGame.allowSemipulito}
                currentHonorsBurrachi={currentHonorsBurrachi}
              />

              {/* RIGA CARTE: A TERRA (+) E IN MANO (-) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                
                {/* Colonna Sinistra: Carte a Terra */}
                <CardsPointsInput
                  isHand={false}
                  directValue={currentData.cardsOnTableDirect}
                  onChangeDirect={(val) => setCurrentData(p => ({ ...p, cardsOnTableDirect: val }))}
                  onAddAmount={(val) => setCurrentData(p => {
                    const current = Number(p.cardsOnTableDirect) || 0;
                    return { ...p, cardsOnTableDirect: String(current + val) };
                  })}
                  onClear={() => setCurrentData(p => ({ ...p, cardsOnTableDirect: '' }))}
                  showPad={currentData.showTableCardPad}
                  onTogglePad={() => setCurrentData(p => ({ ...p, showTableCardPad: !p.showTableCardPad }))}
                  cardCounts={currentData.cardsOnTableCount}
                  onChangeCount={handleTableCountChange}
                  totalPoints={currentTablePoints}
                />

                {/* Colonna Destra: Carte in Mano */}
                <CardsPointsInput
                  isHand={true}
                  directValue={currentData.cardsInHandDirect}
                  onChangeDirect={(val) => setCurrentData(p => ({ ...p, cardsInHandDirect: val }))}
                  onAddAmount={(val) => setCurrentData(p => {
                    const current = Number(p.cardsInHandDirect) || 0;
                    return { ...p, cardsInHandDirect: String(current + val) };
                  })}
                  onClear={() => setCurrentData(p => ({ ...p, cardsInHandDirect: '' }))}
                  showPad={currentData.showHandCardPad}
                  onTogglePad={() => setCurrentData(p => ({ ...p, showHandCardPad: !p.showHandCardPad }))}
                  cardCounts={currentData.cardsInHandCount}
                  onChangeCount={handleHandCountChange}
                  totalPoints={currentHandPoints}
                />

              </div>

              {/* MINI-SCONTRINO DI RIEPILOGO TRASPARENTE IN TEMPO REALE */}
              <RoundReceiptSummary
                currentTeamName={currentTeamName}
                currentChiusuraPoints={currentChiusuraPoints}
                currentHonorsBurrachi={currentHonorsBurrachi}
                currentPozzettoPoints={currentPozzettoPoints}
                currentTablePoints={currentTablePoints}
                currentHandPoints={currentHandPoints}
                currentTeamScore={currentTeamScore}
              />

            </div>
          </div>
        )}

        {/* BARRA INFERIORE DI RIEPILOGO E SALVATAGGIO */}
        <div className="mt-3.5 pt-2.5 border-t border-emerald-700/50">
          <div className="flex items-center justify-between mb-2 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-emerald-300/80 text-[11px]">Riepilogo Mano:</span>
              <span className="font-bold text-amber-300 text-xs">
                ♦ {activeGame.team1.name}: {team1Score >= 0 ? `+${team1Score}` : team1Score} pt
              </span>
              <span className="text-emerald-600 font-bold">•</span>
              <span className="font-bold text-blue-300 text-xs">
                ♠ {activeGame.team2.name}: {team2Score >= 0 ? `+${team2Score}` : team2Score} pt
              </span>
              {isTrio && (
                <>
                  <span className="text-emerald-600 font-bold">•</span>
                  <span className="font-bold text-rose-300 text-xs">
                    ♥ {activeGame.team3?.name || 'Giocatore 3'}: {team3Score >= 0 ? `+${team3Score}` : team3Score} pt
                  </span>
                </>
              )}
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
              disabled={isSubmitting}
              className={`flex-[2] py-2 rounded-xl gold-gradient hover:brightness-110 text-emerald-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-900/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 ${
                isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              <Check className="w-4 h-4 text-emerald-950 stroke-[3]" />
              <span>{isSubmitting ? 'Salvataggio...' : roundToEdit ? 'Aggiorna Mano' : 'Conferma e Salva Mano'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
