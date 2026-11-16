import React from 'react';
import { HONOR_POINTS, calculateCardsPoints } from '../../constants/burraco';
import BurracoToggles from './BurracoToggles';
import CardsPointsInput from './CardsPointsInput';
import RoundReceiptSummary from './RoundReceiptSummary';

export default function RoundTeamSection({
  data,
  setData,
  teamName,
  teamScore,
  allowSemipulito,
  onToggleChiusura
}) {
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
    <div className="space-y-3 min-w-0">
      <div className="hidden lg:flex items-center justify-between gap-2 pb-2 border-b club-divider">
        <h3 className="font-bold text-white text-sm sm:text-base truncate">{teamName}</h3>
        <span className="font-mono-num font-bold club-text-gold text-sm shrink-0">
          {teamScore >= 0 ? `+${teamScore}` : teamScore} pt
        </span>
      </div>

      <BurracoToggles
        currentData={data}
        setCurrentData={setData}
        onToggleChiusura={onToggleChiusura}
        allowSemipulito={allowSemipulito}
        currentHonorsBurrachi={currentHonorsBurrachi}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5">
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
}
