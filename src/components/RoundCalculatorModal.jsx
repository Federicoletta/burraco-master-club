import React, { useState } from 'react';
import { X, Calculator, Zap, Check, ArrowRight, ArrowLeft } from 'lucide-react';
import { sound } from '../utils/soundEffects';
import { useModalEscape } from '../hooks/useModalEscape';
import TrioLoneSelector from './round/TrioLoneSelector';
import QuickEntryPad from './round/QuickEntryPad';
import RoundTeamSection from './round/RoundTeamSection';
import {
  getInitialRoundState,
  computeRoundDisplayScores,
  buildRoundPayload
} from './round/roundUtils';

function RoundCalculatorModalContent({
  onClose,
  onSaveRound,
  activeGame,
  roundToEdit = null,
  roundNumber = 1
}) {
  const isTrio = activeGame?.mode === 'trio';
  const [initialState] = useState(() => getInitialRoundState(activeGame, roundToEdit, roundNumber));
  const [entryMode, setEntryMode] = useState(initialState.entryMode);
  const [activeTab, setActiveTab] = useState(initialState.activeTab);
  const [lonePlayer, setLonePlayer] = useState(initialState.lonePlayer);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [team1Data, setTeam1Data] = useState(initialState.team1Data);
  const [team2Data, setTeam2Data] = useState(initialState.team2Data);
  const [team3Data, setTeam3Data] = useState(initialState.team3Data);
  const [loneData, setLoneData] = useState(initialState.loneData);
  const [pairData, setPairData] = useState(initialState.pairData);

  const {
    team1Score,
    team2Score,
    team3Score,
    loneScore,
    pairRawScore,
    pairSplitScore,
  } = computeRoundDisplayScores({
    entryMode,
    isTrio,
    lonePlayer,
    team1Data,
    team2Data,
    team3Data,
    loneData,
    pairData,
  });

  const handleChiusura = (tabKey) => {
    const toggleExclusive = (currentVal, setPrimary, setOther) => {
      const willClose = !currentVal;
      setPrimary(prev => ({ ...prev, chiusura: willClose }));
      if (willClose) {
        sound.playBurracoChime();
        setOther(prev => ({ ...prev, chiusura: false }));
      } else {
        sound.playTap();
      }
    };

    if (isTrio) {
      if (tabKey === 'lone') {
        toggleExclusive(loneData.chiusura, setLoneData, setPairData);
      } else {
        toggleExclusive(pairData.chiusura, setPairData, setLoneData);
      }
      return;
    }

    if (tabKey === 'team1') {
      toggleExclusive(team1Data.chiusura, setTeam1Data, setTeam2Data);
    } else {
      toggleExclusive(team2Data.chiusura, setTeam2Data, setTeam1Data);
    }
  };

  const handleSave = () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      sound.playCardDeal();
      const roundData = buildRoundPayload({
        roundToEdit,
        roundNumber,
        entryMode,
        isTrio,
        lonePlayer,
        team1Score,
        team2Score,
        team3Score,
        team1Data,
        team2Data,
        loneData,
        pairData,
      });

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

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/75 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Calcolatore punteggio smazzata"
    >
      <div
        className="relative w-full max-w-5xl club-card-solid rounded-t-3xl sm:rounded-3xl p-4 sm:p-6 flex flex-col max-h-[93dvh] overflow-hidden club-sheet-enter"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-3 sm:hidden shrink-0" />

        {/* HEADER */}
        <div className="flex items-center justify-between gap-3 pb-3 border-b club-divider shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl gold-gradient flex items-center justify-center shrink-0">
              <Calculator className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="font-display text-lg sm:text-xl font-bold text-white truncate">
                {roundToEdit ? `Modifica Smazzata #${roundToEdit.roundNumber}` : `Smazzata #${roundNumber}`}
              </h2>
              <p className="text-xs club-text-muted truncate">
                Chiusura, pozzetti, burrachi e punti carte
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] rounded-xl club-inset club-text-muted hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
            aria-label="Chiudi calcolatore"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SELETTORE MODALITÀ (Guidato vs Rapido) */}
        <div className="my-3 grid grid-cols-2 gap-1 p-1 rounded-xl club-tab-bar shrink-0">
          <button
            type="button"
            onClick={() => setEntryMode('guided')}
            className={`min-h-[42px] px-3 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              entryMode === 'guided'
                ? 'gold-gradient'
                : 'club-text-muted hover:text-white'
            }`}
          >
            <Calculator className="w-4 h-4 shrink-0" />
            <span>Calcolo Guidato</span>
          </button>

          <button
            type="button"
            onClick={() => setEntryMode('quick')}
            className={`min-h-[42px] px-3 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              entryMode === 'quick'
                ? 'gold-gradient'
                : 'club-text-muted hover:text-white'
            }`}
          >
            <Zap className="w-4 h-4 shrink-0" />
            <span>Totali Rapidi</span>
          </button>
        </div>

        {/* CORPO SCORREVOLE */}
        <div className="flex-1 min-h-0 overflow-y-auto pr-0.5 space-y-3">
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

              {/* SWITCHER SQUADRE MOBILE (< lg) O TRIO */}
              <div className={`${isTrio ? 'grid grid-cols-2' : 'grid grid-cols-2 lg:hidden'} gap-2`}>
                {isTrio ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setActiveTab('lone')}
                      className={`min-h-[54px] p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                        activeTab === 'lone'
                          ? 'club-card border-amber-400/75 ring-1 ring-amber-400/30'
                          : 'club-inset club-text-muted hover:text-white'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] uppercase font-bold club-text-gold block">Solitario</span>
                        <span className="text-xs font-bold text-white truncate block">{lonePlayerName}</span>
                      </div>
                      <span className="text-sm font-mono-num font-bold club-text-gold shrink-0">
                        {loneScore >= 0 ? `+${loneScore}` : loneScore}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('pair')}
                      className={`min-h-[54px] p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                        activeTab === 'pair'
                          ? 'club-card border-sky-400/75 ring-1 ring-sky-400/30'
                          : 'club-inset club-text-muted hover:text-white'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] uppercase font-bold text-sky-300 block">Coppia</span>
                        <span className="text-xs font-bold text-white truncate block">{pairNames}</span>
                      </div>
                      <span className="text-sm font-mono-num font-bold text-sky-300 shrink-0">
                        {pairSplitScore >= 0 ? `+${pairSplitScore}` : pairSplitScore}
                      </span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setActiveTab('team1')}
                      className={`min-h-[54px] p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                        activeTab === 'team1'
                          ? 'club-card border-amber-400/75 ring-1 ring-amber-400/30'
                          : 'club-inset club-text-muted hover:text-white'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] uppercase font-bold text-amber-300 block">♦ Squadra 1</span>
                        <span className="text-xs font-bold text-white truncate block">{activeGame.team1.name}</span>
                      </div>
                      <span className="text-sm font-mono-num font-bold text-amber-300 shrink-0">
                        {team1Score >= 0 ? `+${team1Score}` : team1Score}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('team2')}
                      className={`min-h-[54px] p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                        activeTab === 'team2'
                          ? 'club-card border-sky-400/75 ring-1 ring-sky-400/30'
                          : 'club-inset club-text-muted hover:text-white'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] uppercase font-bold text-sky-300 block">♠ Squadra 2</span>
                        <span className="text-xs font-bold text-white truncate block">{activeGame.team2.name}</span>
                      </div>
                      <span className="text-sm font-mono-num font-bold text-sky-300 shrink-0">
                        {team2Score >= 0 ? `+${team2Score}` : team2Score}
                      </span>
                    </button>
                  </>
                )}
              </div>

              {!isTrio ? (
                <>
                  {/* Desktop Side-by-Side */}
                  <div className="hidden lg:grid lg:grid-cols-2 gap-4 items-start">
                    <RoundTeamSection
                      data={team1Data}
                      setData={setTeam1Data}
                      teamName={activeGame.team1.name}
                      teamScore={team1Score}
                      allowSemipulito={activeGame.allowSemipulito}
                      onToggleChiusura={() => handleChiusura('team1')}
                    />
                    <RoundTeamSection
                      data={team2Data}
                      setData={setTeam2Data}
                      teamName={activeGame.team2.name}
                      teamScore={team2Score}
                      allowSemipulito={activeGame.allowSemipulito}
                      onToggleChiusura={() => handleChiusura('team2')}
                    />
                  </div>

                  {/* Mobile Scheda Attiva */}
                  <div className="lg:hidden">
                    {activeTab === 'team1' ? (
                      <div className="space-y-3">
                        <RoundTeamSection
                          data={team1Data}
                          setData={setTeam1Data}
                          teamName={activeGame.team1.name}
                          teamScore={team1Score}
                          allowSemipulito={activeGame.allowSemipulito}
                          onToggleChiusura={() => handleChiusura('team1')}
                        />
                        <button
                          type="button"
                          onClick={() => setActiveTab('team2')}
                          className="w-full min-h-[46px] px-4 rounded-xl club-btn-secondary club-text-gold font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                        >
                          <span>Passa a {activeGame.team2.name}</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <RoundTeamSection
                          data={team2Data}
                          setData={setTeam2Data}
                          teamName={activeGame.team2.name}
                          teamScore={team2Score}
                          allowSemipulito={activeGame.allowSemipulito}
                          onToggleChiusura={() => handleChiusura('team2')}
                        />
                        <button
                          type="button"
                          onClick={() => setActiveTab('team1')}
                          className="w-full min-h-[46px] px-4 rounded-xl club-btn-secondary club-text-muted font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                        >
                          <ArrowLeft className="w-4 h-4" />
                          <span>Torna a {activeGame.team1.name}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div>
                  {activeTab === 'lone' ? (
                    <div className="space-y-3">
                      <RoundTeamSection
                        data={loneData}
                        setData={setLoneData}
                        teamName={`${lonePlayerName} (Solitario)`}
                        teamScore={loneScore}
                        allowSemipulito={activeGame.allowSemipulito}
                        onToggleChiusura={() => handleChiusura('lone')}
                      />
                      <button
                        type="button"
                        onClick={() => setActiveTab('pair')}
                        className="w-full min-h-[46px] px-4 rounded-xl club-btn-secondary club-text-gold font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                      >
                        <span>Passa a Coppia ({pairNames})</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <RoundTeamSection
                        data={pairData}
                        setData={setPairData}
                        teamName={`Coppia (${pairNames})`}
                        teamScore={pairRawScore}
                        allowSemipulito={activeGame.allowSemipulito}
                        onToggleChiusura={() => handleChiusura('pair')}
                      />
                      <button
                        type="button"
                        onClick={() => setActiveTab('lone')}
                        className="w-full min-h-[46px] px-4 rounded-xl club-btn-secondary club-text-muted font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Torna a Solitario ({lonePlayerName})</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* FOOTER FISSO RAGGIUNGIBILE DAL POLLICE */}
        <div
          className="mt-3 pt-3 border-t club-divider shrink-0 space-y-2.5"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="club-text-subtle font-semibold">Parziale mano:</span>
            <div className="flex flex-wrap items-center gap-2 font-mono-num">
              <span className="text-amber-300 font-bold">
                {activeGame.team1.name}: {team1Score >= 0 ? `+${team1Score}` : team1Score}
              </span>
              <span className="club-text-subtle">·</span>
              <span className="text-sky-300 font-bold">
                {activeGame.team2.name}: {team2Score >= 0 ? `+${team2Score}` : team2Score}
              </span>
              {isTrio && (
                <>
                  <span className="club-text-subtle">·</span>
                  <span className="text-rose-300 font-bold">
                    {activeGame.team3?.name || 'P3'}: {team3Score >= 0 ? `+${team3Score}` : team3Score}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[46px] px-4 rounded-xl club-btn-secondary club-text-muted text-sm font-semibold cursor-pointer active:scale-95"
            >
              Annulla
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSubmitting}
              className={`flex-1 sm:flex-initial min-h-[48px] px-6 rounded-xl gold-gradient font-bold text-sm sm:text-base active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer ${
                isSubmitting ? 'opacity-65 cursor-not-allowed' : ''
              }`}
            >
              <Check className="w-4 h-4 stroke-[2.75]" />
              <span>{isSubmitting ? 'Salvataggio...' : roundToEdit ? 'Aggiorna Smazzata' : 'Salva Smazzata'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RoundCalculatorModal(props) {
  useModalEscape(props.isOpen, props.onClose);

  if (!props.isOpen || !props.activeGame) return null;

  const modalKey = props.roundToEdit
    ? `edit_${props.roundToEdit.roundNumber}_${props.activeGame.id}`
    : `new_${props.roundNumber}_${props.activeGame.id}`;

  return <RoundCalculatorModalContent key={modalKey} {...props} />;
}
