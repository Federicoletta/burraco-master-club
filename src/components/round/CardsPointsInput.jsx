import React from 'react';
import { sound } from '../../utils/soundEffects';
import CardCounterPad from './CardCounterPad';
import { RotateCcw } from 'lucide-react';

export default function CardsPointsInput({
  isHand = false,
  directValue = '',
  onChangeDirect,
  onAddAmount,
  onClear,
  showPad = false,
  onTogglePad,
  cardCounts,
  onChangeCount,
  totalPoints = 0
}) {
  const quickValues = [5, 10, 20, 50, 100];

  return (
    <div className={`min-w-0 p-3.5 rounded-2xl border space-y-2.5 ${
      isHand
        ? 'club-danger-inset'
        : 'club-inset'
    }`}>
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className={`font-bold uppercase tracking-wider text-[11px] ${
          isHand ? 'club-danger-text' : 'club-success-text'
        }`}>
          {isHand ? 'Carte in Mano (-)' : 'Carte a Terra (+)'}
        </span>

        <button
          type="button"
          onClick={onTogglePad}
          className={`min-h-[36px] px-3 rounded-lg border text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
            isHand
              ? 'border-rose-500/40 club-danger-text hover:bg-rose-500/15'
              : 'club-border club-text-gold club-hover-soft'
          }`}
        >
          {showPad ? 'Tastierino Rapido' : 'Conta Carte'}
        </button>
      </div>

      {!showPad ? (
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <div className={`flex-1 min-w-0 rounded-xl border flex items-center justify-center px-3 min-h-[52px] ${
              isHand
                ? 'club-danger-inset club-danger-text'
                : 'club-card club-success-text'
            }`}>
              <span className={`text-xl font-bold mr-1 shrink-0 ${isHand ? 'club-danger-text' : 'club-success-text'}`}>
                {isHand ? '-' : '+'}
              </span>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="0"
                value={directValue}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  onChangeDirect(val);
                }}
                onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
                className="flex-1 min-w-0 w-0 text-center text-2xl sm:text-3xl font-mono-num font-bold club-text-primary bg-transparent focus:outline-none"
              />
              <span className="text-xs font-semibold club-text-subtle ml-1 shrink-0">pt</span>
            </div>

            {directValue !== '' && directValue !== '0' && (
              <button
                type="button"
                onClick={() => {
                  sound.playTap();
                  onClear();
                }}
                className="min-w-[46px] min-h-[46px] rounded-xl club-danger-inset hover:bg-rose-500/20 club-danger-text border flex items-center justify-center active:scale-95 cursor-pointer shrink-0"
                aria-label="Azzera punteggio"
                title="Azzera"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-5 gap-1.5">
            {quickValues.map(val => (
              <button
                key={val}
                type="button"
                onClick={() => {
                  sound.playTap();
                  onAddAmount(val);
                }}
                className={`min-h-[44px] rounded-xl active:scale-95 text-xs sm:text-sm font-mono-num font-bold transition-all cursor-pointer text-center border ${
                  isHand
                    ? 'club-danger-inset hover:bg-rose-500/20 club-danger-text'
                    : 'club-btn-secondary club-text-primary'
                }`}
              >
                +{val}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <CardCounterPad
          cardCounts={cardCounts}
          onChangeCount={onChangeCount}
          isHand={isHand}
          totalPoints={totalPoints}
        />
      )}
    </div>
  );
}
