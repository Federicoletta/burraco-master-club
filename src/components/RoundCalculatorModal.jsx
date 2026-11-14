import React, { useState, useEffect } from 'react';
import { X, Calculator, Zap, Check, ArrowRight, ArrowLeft } from 'lucide-react';
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

  // Stato Squadra 1
  const [team1Data, setTeam1Data] = useState({ ...DEFAULT_ENTITY });

  // Stato Squadra 2
  const [team2Data, setTeam2Data] = useState({ ...DEFAULT_ENTITY });

  // Stato Giocatore 3 (Quick mode a 3)
  const [team3Data, setTeam3Data] = useState({ ...DEFAULT_ENTITY });

  // Stato Burraco a 3 (FIBUR Guidato)
  const [loneData, setLoneData] = useState({ ...DEFAULT_ENTITY });
  const [pairData, setPairData] = useState({ ...DEFAULT_ENTITY });

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

  // Calcolo punteggi netti in tempo reale
  const team1ScoreNormal = entryMode === 'quick' 
    ? Number(team1Data.manualScore) || 0 
    : calculateTeamRoundScore(team1Data);

  const team2ScoreNormal = entryMode === 'quick' 
    ? Number(team2Data.manualScore) || 0 
    : calculateTeamRoundScore(team2Data);

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

  // Chiusura esclusiva
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

  // Funzione per renderizzare i controlli di compilazione di una singola squadra
  const renderTeamSection = (teamKey, data, setData, teamName, teamScore) => {
    const currentHonorsBurrachi = 
      (data.burracoPulito || 0) * HONOR_POINTS.BURRACO_PULITO +
      (data.burracoSemipulito || 0) * HONOR_POINTS.BURRACO_SEMIPULITO +
      (data.burracoSporco || 0) * HONOR_POINTS.BURRACO_SPORCO;

    const currentChiusuraPoints = data.chiusura ? HONOR_POINTS.CHIUSURA : 0;
    
    const currentPozzettoPoints = 
      data.pozzetto === 'non_preso' ? HONOR_POINTS.POZZETTO_NON_PRESO :
      data.pozzetto === 'preso_non_giocato' ? HONOR_POINTS.POZZETTO_PRESO_NON_GIOCATO : 0;

    const currentTablePoints = data.cardsOnTableDirect !== ''
      ? Math.max(0, Number(data.cardsOnTableDirect) || 0)
      : calculateCardsPoints(data.cardsOnTableCount);

    const currentHandPoints = data.cardsInHandDirect !== ''
      ? Math.max(0, Number(data.cardsInHandDirect) || 0)
      : calculateCardsPoints(data.cardsInHandCount);

    const handleTableCountChange = (key, delta) => {
      setData(p => ({
        ...p,
        cardsOnTableDirect: '',
        cardsOnTableCount: {
          ...p.cardsOnTableCount,
          [key]: Math.max(0, (p.cardsOnTableCount[key] || 0) + delta)
        }
      }));
    };

    const handleHandCountChange = (key, delta) => {
      setData(p => ({
        ...p,
        cardsInHandDirect: '',
        cardsInHandCount: {
          ...p.cardsInHandCount,
          [key]: Math.max(0, (p.cardsInHandCount[key] || 0) + delta)
        }
      }));
    };

    return (
      <div className="space-y-3">
        {/* Intestazione Squadra se Side-by-Side su tablet */}
        <div className="hidden lg:flex items-center justify-between pb-2 border-b border-emerald-700/50">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <h3 className="font-black text-white text-sm sm:text-base">{teamName}</h3>
          </div>
          <span className="font-black text-amber-300 text-sm px-2.5 py-0.5 rounded-lg bg-emerald-900 border border-amber-400/40">
            {teamScore >= 0 ? `+${teamScore}` : teamScore} pt
          </span>
        </div>

        {/* Toggles Chiusura, Pozzetto e Burrachi */}
        <BurracoToggles
          currentData={data}
          setCurrentData={setData}
          onToggleChiusura={() => handleChiusura(teamKey)}
          allowSemipulito={activeGame.allowSemipulito}
          currentHonorsBurrachi={currentHonorsBurrachi}
        />

        {/* Inserimento Carte a Terra (+) e Carte in Mano (-) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <CardsPointsInput
            isHand={false}
            directValue={data.cardsOnTableDirect}
            onChangeDirect={(val) => setData(p => ({ ...p, cardsOnTableDirect: val }))}
            onAddAmount={(val) => setData(p => {
              const current = Number(p.cardsOnTableDirect) || 0;
              return { ...p, cardsOnTableDirect: String(current + val) };
            })}
            onClear={() => setData(p => ({ ...p, cardsOnTableDirect: '' }))}
            showPad={data.showTableCardPad}
            onTogglePad={() => setData(p => ({ ...p, showTableCardPad: !p.showTableCardPad }))}
            cardCounts={data.cardsOnTableCount}
            onChangeCount={handleTableCountChange}
            totalPoints={currentTablePoints}
          />

          <CardsPointsInput
            isHand={true}
            directValue={data.cardsInHandDirect}
            onChangeDirect={(val) => setData(p => ({ ...p, cardsInHandDirect: val }))}
            onAddAmount={(val) => setData(p => {
              const current = Number(p.cardsInHandDirect) || 0;
              return { ...p, cardsInHandDirect: String(current + val) };
            })}
            onClear={() => setData(p => ({ ...p, cardsInHandDirect: '' }))}
            showPad={data.showHandCardPad}
            onTogglePad={() => setData(p => ({ ...p, showHandCardPad: !p.showHandCardPad }))}
            cardCounts={data.cardsInHandCount}
            onChangeCount={handleHandCountChange}
            totalPoints={currentHandPoints}
          />
        </div>

        {/* Scontrino Riassuntivo Trasparente */}
        <RoundReceiptSummary
          currentTeamName={teamName}
          currentChiusuraPoints={currentChiusuraPoints}
          currentHonorsBurrachi={currentHonorsBurrachi}
          currentPozzettoPoints={currentPozzettoPoints}
          currentTablePoints={currentTablePoints}
          currentHandPoints={currentHandPoints}
          currentTeamScore={teamScore}
        />
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl felt-card rounded-3xl border border-amber-500/40 p-4 sm:p-6 my-auto shadow-2xl animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[94vh]">
        
        {/* HEADER MODAL */}
        <div className="flex items-center justify-between pb-3 border-b border-emerald-700/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl gold-gradient flex items-center justify-center text-emerald-950 font-black shadow-md shrink-0">
              <Calculator className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-950" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white m-0">
                {roundToEdit ? `Modifica Smazzata #${roundToEdit.roundNumber}` : `Registra Smazzata #${roundNumber}`}
              </h2>
              <p className="text-[11px] text-emerald-300/80 m-0">
                Inserisci i burrachi, la chiusura e i punti carte delle due squadre
              </p>
            </div>
          </div>

          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-800/50 transition-colors cursor-pointer shrink-0"
            title="Chiudi"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TOGGLE MODALITÀ (Guidato vs Rapido) */}
        <div className="my-3 flex items-center justify-between gap-2 p-1 rounded-xl bg-emerald-950/70 border border-emerald-800/60 shrink-0">
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
            <span>Calcolo Dettagliato Guidato</span>
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
            <span>Inserimento Totali Rapido</span>
          </button>
        </div>

        {/* BODY SCORREVOLE */}
        <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-3">
          
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
            <div className="space-y-3">
              
              {/* SELETTORE TRIO (se modalità a 3) */}
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

              {/* SELETTORE SQUADRE SU SMARTPHONE (Nascosto su Tablet se affiancato) */}
              <div className={`${isTrio ? 'grid grid-cols-2' : 'grid grid-cols-2 lg:hidden'} gap-2`}>
                {isTrio ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setActiveTab('lone')}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                        activeTab === 'lone'
                          ? 'bg-emerald-900 border-amber-400 ring-2 ring-amber-400/40 shadow-md'
                          : 'bg-emerald-950/70 border-emerald-800 text-emerald-300/80 hover:bg-emerald-900/50'
                      }`}
                    >
                      <div className="truncate">
                        <span className="text-[10px] uppercase font-bold text-amber-300 block">Solitario</span>
                        <span className="text-xs font-black text-white truncate block">{lonePlayerName}</span>
                      </div>
                      <span className="text-xs font-black text-amber-300 ml-2">
                        {loneScore >= 0 ? `+${loneScore}` : loneScore} pt
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('pair')}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                        activeTab === 'pair'
                          ? 'bg-emerald-900 border-amber-400 ring-2 ring-amber-400/40 shadow-md'
                          : 'bg-emerald-950/70 border-emerald-800 text-emerald-300/80 hover:bg-emerald-900/50'
                      }`}
                    >
                      <div className="truncate">
                        <span className="text-[10px] uppercase font-bold text-emerald-300 block">Coppia</span>
                        <span className="text-xs font-black text-white truncate block">{pairNames}</span>
                      </div>
                      <span className="text-xs font-black text-emerald-300 ml-2">
                        {pairSplitScore >= 0 ? `+${pairSplitScore}` : pairSplitScore} pt cad.
                      </span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setActiveTab('team1')}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                        activeTab === 'team1'
                          ? 'bg-emerald-900 border-amber-400 ring-2 ring-amber-400/40 shadow-md'
                          : 'bg-emerald-950/70 border-emerald-800 text-emerald-300/80 hover:bg-emerald-900/50'
                      }`}
                    >
                      <div className="truncate">
                        <span className="text-[10px] uppercase font-bold text-amber-300 block">Squadra 1</span>
                        <span className="text-xs font-black text-white truncate block">{activeGame.team1.name}</span>
                      </div>
                      <span className="text-xs font-black text-amber-300 ml-2">
                        {team1Score >= 0 ? `+${team1Score}` : team1Score} pt
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('team2')}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                        activeTab === 'team2'
                          ? 'bg-emerald-900 border-amber-400 ring-2 ring-amber-400/40 shadow-md'
                          : 'bg-emerald-950/70 border-emerald-800 text-emerald-300/80 hover:bg-emerald-900/50'
                      }`}
                    >
                      <div className="truncate">
                        <span className="text-[10px] uppercase font-bold text-emerald-300 block">Squadra 2</span>
                        <span className="text-xs font-black text-white truncate block">{activeGame.team2.name}</span>
                      </div>
                      <span className="text-xs font-black text-emerald-300 ml-2">
                        {team2Score >= 0 ? `+${team2Score}` : team2Score} pt
                      </span>
                    </button>
                  </>
                )}
              </div>

              {/* VISTA CONTENUTI: AFFIANCATA SU IPAD/TABLET (quando 2 squadre) OPPURE A TAB SU SMARTPHONE */}
              {!isTrio ? (
                <>
                  {/* Vista Affiancata Tablet/iPad Desktop (lg:) */}
                  <div className="hidden lg:grid lg:grid-cols-2 gap-4 items-start">
                    {renderTeamSection('team1', team1Data, setTeam1Data, activeGame.team1.name, team1Score)}
                    {renderTeamSection('team2', team2Data, setTeam2Data, activeGame.team2.name, team2Score)}
                  </div>

                  {/* Vista Singola Mobile (lg:hidden) */}
                  <div className="lg:hidden">
                    {activeTab === 'team1' ? (
                      <div className="space-y-3">
                        {renderTeamSection('team1', team1Data, setTeam1Data, activeGame.team1.name, team1Score)}
                        <button
                          type="button"
                          onClick={() => setActiveTab('team2')}
                          className="w-full py-2.5 px-4 rounded-xl bg-emerald-900/80 hover:bg-emerald-800 text-amber-300 font-bold text-xs border border-amber-400/40 shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
                        >
                          <span>Compila Punteggio {activeGame.team2.name}</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {renderTeamSection('team2', team2Data, setTeam2Data, activeGame.team2.name, team2Score)}
                        <button
                          type="button"
                          onClick={() => setActiveTab('team1')}
                          className="w-full py-2 px-4 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 font-bold text-xs border border-emerald-700/60 shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
                        >
                          <ArrowLeft className="w-4 h-4" />
                          <span>Rivedi {activeGame.team1.name}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                /* Modalità Trio */
                <div>
                  {activeTab === 'lone' ? (
                    <div className="space-y-3">
                      {renderTeamSection('lone', loneData, setLoneData, `👤 ${lonePlayerName} (Solitario)`, loneScore)}
                      <button
                        type="button"
                        onClick={() => setActiveTab('pair')}
                        className="w-full py-2.5 px-4 rounded-xl bg-emerald-900/80 hover:bg-emerald-800 text-amber-300 font-bold text-xs border border-amber-400/40 shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
                      >
                        <span>Compila Coppia ({pairNames})</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {renderTeamSection('pair', pairData, setPairData, `👥 Coppia (${pairNames})`, pairRawScore)}
                      <button
                        type="button"
                        onClick={() => setActiveTab('lone')}
                        className="w-full py-2 px-4 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 font-bold text-xs border border-emerald-700/60 shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Rivedi Solitario ({lonePlayerName})</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

            </div>
          )}

        </div>

        {/* FOOTER BAR: RIEPILOGO NETTO & TASTO SALVATAGGIO DORATO */}
        <div className="mt-3.5 pt-3 border-t border-emerald-700/50 shrink-0">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            
            {/* Riepilogo sintetico dei due totali */}
            <div className="flex items-center gap-2.5 text-xs text-white w-full sm:w-auto justify-between sm:justify-start">
              <span className="text-[11px] text-emerald-300/80 font-medium">Totale Mano:</span>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-xl bg-emerald-950 border border-emerald-600/50 font-black text-amber-300 text-xs">
                  {activeGame.team1.name}: {team1Score >= 0 ? `+${team1Score}` : team1Score} pt
                </span>
                <span className="text-emerald-500 font-black">•</span>
                <span className="px-2.5 py-1 rounded-xl bg-emerald-950 border border-emerald-600/50 font-black text-emerald-200 text-xs">
                  {activeGame.team2.name}: {team2Score >= 0 ? `+${team2Score}` : team2Score} pt
                </span>
                {isTrio && (
                  <>
                    <span className="text-emerald-500 font-black">•</span>
                    <span className="px-2.5 py-1 rounded-xl bg-emerald-950 border border-emerald-600/50 font-black text-rose-300 text-xs">
                      {activeGame.team3?.name || 'P3'}: {team3Score >= 0 ? `+${team3Score}` : team3Score} pt
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Pulsanti Annulla e Conferma */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-4 rounded-xl bg-emerald-900/60 hover:bg-emerald-800 text-emerald-300 text-xs font-semibold cursor-pointer transition-colors"
              >
                Annulla
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={isSubmitting}
                className={`py-3 px-6 rounded-2xl gold-gradient text-emerald-950 font-black text-xs sm:text-sm shadow-xl hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>{isSubmitting ? 'Salvataggio...' : roundToEdit ? 'Aggiorna Smazzata' : 'Salva Smazzata 🃏'}</span>
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
