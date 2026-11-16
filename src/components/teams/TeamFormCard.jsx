import React from 'react';
import { Wand2 } from 'lucide-react';
import PlayerAutocompleteInput from '../PlayerAutocompleteInput';

const COLOR_VARIANTS = {
  amber: {
    border: 'border-[var(--accent-gold)]/45',
    headerText: 'club-text-gold',
    activeTag: 'club-text-gold',
    activeInput: 'border-2 border-[var(--accent-gold)] ring-2 ring-[var(--accent-ring)]',
    idleInput: '',
  },
  blue: {
    border: 'border-sky-400/45',
    headerText: 'text-sky-300',
    activeTag: 'text-sky-300',
    activeInput: 'border-2 border-sky-400 ring-2 ring-sky-400/35',
    idleInput: '',
  },
  rose: {
    border: 'border-rose-400/45',
    headerText: 'text-rose-300',
    activeTag: 'text-rose-300',
    activeInput: 'border-2 border-rose-400 ring-2 ring-rose-400/35',
    idleInput: '',
  },
};

export default function TeamFormCard({
  variant = 'amber',
  symbol = '♦',
  headerTitle,
  nameLabel,
  namePlaceholder,
  teamName,
  onTeamNameChange,
  onAutoName,
  autoTitle,
  isPairs = false,
  p1Value,
  onP1Change,
  p1FieldKey,
  p1AlreadySelected = [],
  p2Value = '',
  onP2Change,
  p2FieldKey,
  p2AlreadySelected = [],
  activeTargetField,
  onSelectField,
  currentUser,
  friendsList,
}) {
  const styles = COLOR_VARIANTS[variant] || COLOR_VARIANTS.amber;

  return (
    <div className={`p-3.5 rounded-2xl club-inset border ${styles.border} space-y-2.5`}>
      <div className="flex items-center justify-between pb-1.5 border-b club-divider">
        <span className={`text-xs font-extrabold ${styles.headerText} uppercase tracking-wider flex items-center gap-1.5`}>
          <span className="text-sm">{symbol}</span> {headerTitle}
        </span>
        <button
          type="button"
          onClick={onAutoName}
          className="min-h-[30px] px-2 rounded-lg club-btn-secondary text-[11px] club-text-muted flex items-center gap-1 cursor-pointer font-semibold"
          title={autoTitle}
        >
          <Wand2 className="w-3 h-3 club-text-gold" />
          <span>Auto</span>
        </button>
      </div>

      <div>
        <label className="text-[11px] font-semibold club-text-subtle block mb-1">
          {nameLabel}
        </label>
        <input
          type="text"
          value={teamName}
          onChange={(e) => onTeamNameChange(e.target.value)}
          placeholder={namePlaceholder}
          className="w-full min-h-[40px] px-3 rounded-xl club-input font-medium text-sm"
        />
      </div>

      <div className="space-y-2 pt-0.5">
        <div>
          <label className="text-[11px] font-semibold club-text-subtle flex items-center justify-between mb-1">
            <span>{isPairs ? 'Giocatore 1' : 'Giocatore Singolo'}</span>
            {activeTargetField === p1FieldKey && (
              <span className={`text-[10px] ${styles.activeTag} font-bold`}>● Attivo</span>
            )}
          </label>
          <PlayerAutocompleteInput
            value={p1Value}
            onChange={onP1Change}
            onFocus={() => onSelectField(p1FieldKey)}
            onClick={() => onSelectField(p1FieldKey)}
            currentUser={currentUser}
            friendsList={friendsList}
            alreadySelected={p1AlreadySelected}
            placeholder="Nome giocatore..."
            className={`w-full min-h-[40px] px-3 rounded-xl club-input font-medium text-sm transition-all ${
              activeTargetField === p1FieldKey ? styles.activeInput : styles.idleInput
            }`}
          />
        </div>

        {isPairs && p2FieldKey && (
          <div>
            <label className="text-[11px] font-semibold club-text-subtle flex items-center justify-between mb-1">
              <span>Giocatore 2</span>
              {activeTargetField === p2FieldKey && (
                <span className={`text-[10px] ${styles.activeTag} font-bold`}>● Attivo</span>
              )}
            </label>
            <PlayerAutocompleteInput
              value={p2Value}
              onChange={onP2Change}
              onFocus={() => onSelectField(p2FieldKey)}
              onClick={() => onSelectField(p2FieldKey)}
              currentUser={currentUser}
              friendsList={friendsList}
              alreadySelected={p2AlreadySelected}
              placeholder="Nome compagno..."
              className={`w-full min-h-[40px] px-3 rounded-xl club-input font-medium text-sm transition-all ${
                activeTargetField === p2FieldKey ? styles.activeInput : styles.idleInput
              }`}
            />
          </div>
        )}
      </div>
    </div>
  );
}
