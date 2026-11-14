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
  const displayVal = directValue !== '' ? directValue : (totalPoints > 0 ? String(totalPoints) : '0');

  return (
    <div className={`p-3 sm:p-4 rounded-2xl border shadow-inner space-y-2.5 transition-all ${
      isHand
        ? 'bg-rose-950/40 border-rose-500/40'
        : 'bg-emerald-950/70 border-emerald-500/40'
    }`}>
      
      {/* Header Sezione Carte */}
      <div className="flex items-center justify-between text-xs">
        <span className={`font-black uppercase tracking-wider text-xs flex items-center gap-1.5 ${
          isHand ? 'text-rose-300' : 'text-emerald-300'
        }`}>
          <span>{isHand ? '🃏 Carte in Mano (Penalità -)' : '🌿 Carte Calate a Terra (+)'}</span>
        </span>
        
        <button
          type="button"
          onClick={onTogglePad}
          className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border transition-all cursor-pointer touch-manipulation ${
            isHand 
              ? 'text-rose-300 border-rose-500/40 hover:bg-rose-900/40' 
              : 'text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/40'
          }`}
        >
          {showPad ? '🔢 Tasti Rapidi' : '🃏 Conta Carte'}
        </button>
      </div>

      {!showPad ? (
        <div className="space-y-2.5">
          {/* Display Punti Grande con Input numerico integrato */}
          <div className="flex items-center gap-2">
            <div className={`relative flex-1 rounded-2xl border flex items-center justify-center p-2 shadow-inner ${
              isHand
                ? 'bg-rose-950/60 border-rose-500/50 text-rose-200'
                : 'bg-emerald-900/60 border-emerald-500/50 text-emerald-200'
            }`}>
              <span className={`text-xl sm:text-2xl font-black mr-1 ${isHand ? 'text-rose-400' : 'text-emerald-400'}`}>
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
                className="w-28 text-center text-2xl sm:text-3xl font-black bg-transparent focus:outline-none"
              />
              <span className="text-xs font-bold opacity-70 ml-1">pt</span>
            </div>

            {/* Tasto Cancella / Azzera Rapido */}
            {directValue !== '' && directValue !== '0' && (
              <button
                type="button"
                onClick={() => {
                  sound.playTap();
                  onClear();
                }}
                className="p-2.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-700/60 active:scale-95 cursor-pointer touch-manipulation transition-all shrink-0"
                title="Azzera punteggio carte"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Tastierino Tattile Incrementale (Tasti comodi a grandezza pollice) */}
          <div className="grid grid-cols-5 gap-1.5 pt-1">
            {quickValues.map(val => (
              <button
                key={val}
                type="button"
                onClick={() => {
                  sound.playTap();
                  onAddAmount(val);
                }}
                className={`py-2 px-1 rounded-xl active:scale-95 text-xs sm:text-sm font-black transition-all shadow-sm cursor-pointer touch-manipulation text-center ${
                  isHand
                    ? 'bg-rose-900/80 hover:bg-rose-800 text-rose-100 border border-rose-600/50'
                    : 'bg-emerald-900/90 hover:bg-emerald-800 text-emerald-100 border border-emerald-600/50'
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
