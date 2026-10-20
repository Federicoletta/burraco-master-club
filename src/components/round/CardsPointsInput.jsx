import React from 'react';
import { sound } from '../../utils/soundEffects';
import CardCounterPad from './CardCounterPad';

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
  const quickValues = [5, 10, 15, 20, 50, 100];

  return (
    <div className="p-2.5 rounded-xl bg-emerald-950/70 border border-emerald-700/40 space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className={`font-bold uppercase tracking-wider text-[11px] ${
          isHand ? 'text-rose-300' : 'text-emerald-300'
        }`}>
          {isHand ? 'Carte in Mano (-)' : 'Carte a Terra (+)'}
        </span>
        <button
          type="button"
          onClick={onTogglePad}
          className={`text-[10px] underline cursor-pointer ${
            isHand ? 'text-rose-300/80 hover:text-rose-200' : 'text-emerald-400 hover:text-emerald-200'
          }`}
        >
          {showPad ? 'Chiudi tastierino' : 'Usa tastierino'}
        </button>
      </div>

      {!showPad ? (
        <div>
          <div className="flex items-center gap-2">
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
              className={`w-full text-center text-lg sm:text-xl font-black py-1.5 rounded-xl bg-emerald-900/60 focus:outline-none focus:ring-2 ${
                isHand
                  ? 'border border-rose-500/50 text-rose-200 focus:ring-rose-400'
                  : 'border border-emerald-500/50 text-emerald-200 focus:ring-emerald-400'
              }`}
            />
            <span className={`text-xs font-bold shrink-0 ${isHand ? 'text-rose-300' : 'text-emerald-300'}`}>
              {isHand ? 'pt da togliere' : 'pt calati'}
            </span>
          </div>

          {/* Tasti Rapidi Somma Punti */}
          <div className="flex flex-wrap items-center justify-center gap-1 mt-1.5 pt-1.5 border-t border-emerald-800/40">
            {quickValues.map(val => (
              <button
                key={val}
                type="button"
                onClick={() => {
                  sound.playTap();
                  onAddAmount(val);
                }}
                className={`px-2 py-1 rounded-lg active:scale-95 text-[11px] font-bold transition-all shadow-xs cursor-pointer touch-manipulation ${
                  isHand
                    ? 'bg-rose-950/60 hover:bg-rose-900 text-rose-200 hover:text-white border border-rose-700/50'
                    : 'bg-emerald-900/90 hover:bg-emerald-800 text-emerald-200 hover:text-white border border-emerald-600/50'
                }`}
              >
                +{val}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                sound.playTap();
                onClear();
              }}
              className="px-2 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-900 active:scale-95 text-rose-300 border border-rose-800/50 text-[11px] font-bold transition-all cursor-pointer touch-manipulation"
              title={isHand ? 'Azzera carte in mano' : 'Azzera punti a terra'}
            >
              C
            </button>
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
