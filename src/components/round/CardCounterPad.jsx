import React from 'react';
import { Minus, Plus } from 'lucide-react';
import { CARD_VALUES } from '../../constants/burraco';

export default function CardCounterPad({
  cardCounts,
  onChangeCount,
  isHand = false,
  totalPoints = 0
}) {
  return (
    <div className="space-y-1.5 pt-2 border-t club-divider">
      {Object.entries(CARD_VALUES).map(([key, val]) => (
        <div key={key} className="flex items-center justify-between gap-2 py-0.5">
          <div className="min-w-0">
            <span className={`font-semibold text-xs ${val.color}`}>{val.label}</span>
            <span className={`text-[11px] font-mono-num ml-1.5 ${isHand ? 'text-rose-300/80' : 'club-text-subtle'}`}>
              {isHand ? `-${val.points}` : `+${val.points}`} pt
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onChangeCount(key, -1)}
              className="w-10 h-10 rounded-xl club-btn-secondary flex items-center justify-center active:scale-90 cursor-pointer"
              aria-label={`Rimuovi ${val.label}`}
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-7 text-center font-mono-num font-bold text-sm text-white">
              {cardCounts[key] || 0}
            </span>
            <button
              type="button"
              onClick={() => onChangeCount(key, 1)}
              className="w-10 h-10 rounded-xl gold-gradient flex items-center justify-center active:scale-90 cursor-pointer"
              aria-label={`Aggiungi ${val.label}`}
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>
      ))}
      <div className={`text-right text-xs font-mono-num font-bold pt-2 border-t club-divider ${
        isHand ? 'text-rose-300' : 'text-emerald-300'
      }`}>
        {isHand ? `Totale carte in mano: -${totalPoints} pt` : `Totale carte: +${totalPoints} pt`}
      </div>
    </div>
  );
}
