import React from 'react';
import { CARD_VALUES } from '../../constants/burraco';

export default function CardCounterPad({
  cardCounts,
  onChangeCount,
  isHand = false,
  totalPoints = 0
}) {
  return (
    <div className="space-y-1 mt-1 pt-1.5 border-t border-emerald-800/40">
      {Object.entries(CARD_VALUES).map(([key, val]) => (
        <div key={key} className="flex items-center justify-between text-xs py-0.5">
          <div>
            <span className={`font-semibold ${val.color} text-[11px]`}>{val.label}</span>
            <span className={`text-[10px] ml-1 ${isHand ? 'text-rose-400/80' : 'text-emerald-400/70'}`}>
              ({isHand ? `-${val.points}` : `+${val.points}`} pt)
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onChangeCount(key, -1)}
              className="w-5 h-5 rounded bg-emerald-800 text-white flex items-center justify-center hover:bg-emerald-700 cursor-pointer font-bold text-xs"
            >
              -
            </button>
            <span className="w-5 text-center font-bold text-xs text-white">
              {cardCounts[key] || 0}
            </span>
            <button
              type="button"
              onClick={() => onChangeCount(key, 1)}
              className="w-5 h-5 rounded bg-emerald-800 text-white flex items-center justify-center hover:bg-emerald-700 cursor-pointer font-bold text-xs"
            >
              +
            </button>
          </div>
        </div>
      ))}
      <div className={`text-right text-[11px] font-bold pt-1 border-t border-emerald-800/50 ${
        isHand ? 'text-rose-300' : 'text-emerald-300'
      }`}>
        {isHand ? `Totale carte in mano: -${totalPoints} pt` : `Totale carte: +${totalPoints} pt`}
      </div>
    </div>
  );
}
