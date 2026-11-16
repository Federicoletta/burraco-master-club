import React from 'react';
import { Shuffle, ArrowLeftRight, X, Plus, Trash2 } from 'lucide-react';
import { sound } from '../../utils/soundEffects';

export default function BurracoTableFormation({
  mode = 'pairs',
  p1A,
  setP1A,
  p1B,
  setP1B,
  p2A,
  setP2A,
  p2B,
  setP2B,
  p3A,
  setP3A,
  team1Name,
  setTeam1Name,
  team2Name,
  setTeam2Name,
  currentUser,
  onSelectSlot,
  activeSlot
}) {
  const isPairs = mode === 'pairs';
  const isTrio = mode === 'trio';
  const isSingles = mode === 'singles';

  const hasAnyPlayer = Boolean(p1A || p1B || p2A || p2B || p3A);
  const occupiedCount = [p1A, p1B, p2A, p2B, p3A].filter(Boolean).length;

  const handleSwapPartners = () => {
    try { sound.playTap(); } catch {}
    const temp = p1B;
    setP1B(p2A);
    setP2A(temp);
  };

  const handleSwapTeams = () => {
    try { sound.playTap(); } catch {}
    const tA = p1A;
    const tB = p1B;
    const tName = team1Name;
    setP1A(p2A);
    setP1B(p2B);
    setTeam1Name(team2Name);
    setP2A(tA);
    setP2B(tB);
    setTeam2Name(tName);
  };

  const handleShuffle = () => {
    try { sound.playCardDeal(); } catch {}
    const all = [p1A, p1B, p2A, p2B, p3A].filter(Boolean);
    if (all.length < 2) return;
    for (let i = all.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [all[i], all[j]] = [all[j], all[i]];
    }
    if (isPairs) {
      setP1A(all[0] || '');
      setP1B(all[1] || '');
      setP2A(all[2] || '');
      setP2B(all[3] || '');
    } else if (isTrio) {
      setP1A(all[0] || '');
      setP2A(all[1] || '');
      setP3A(all[2] || '');
    } else {
      setP1A(all[0] || '');
      setP2A(all[1] || '');
    }
  };

  const handleClearAll = () => {
    try { sound.playTap(); } catch {}
    setP1A('');
    setP1B('');
    setP2A('');
    setP2B('');
    setP3A('');
  };

  const renderSeat = (slotKey, playerName, setPlayerName, teamLabel, positionLabel, teamType) => {
    const isOccupied = Boolean(playerName?.trim());
    const isMe = currentUser && playerName && (
      playerName.toLowerCase() === (currentUser.displayName || '').toLowerCase() ||
      playerName.toLowerCase() === (currentUser.email?.split('@')[0] || '').toLowerCase()
    );
    const isSelected = activeSlot === slotKey;

    let cardClasses = 'bg-black/25 border-[var(--border-subtle)] text-white';
    let badgeTextClass = 'club-text-gold';
    let avatarClass = 'bg-black/35 club-text-muted border club-divider';

    if (teamType === 'team1') {
      badgeTextClass = 'club-text-gold';
      cardClasses = isOccupied
        ? 'club-card border-[var(--accent-gold)] text-white'
        : 'bg-black/20 border-dashed border-[var(--accent-gold)]/55 text-white hover:bg-black/30';
      avatarClass = isOccupied ? 'gold-gradient font-bold' : 'bg-black/30 club-text-gold border border-[var(--accent-gold)]/45';
    } else if (teamType === 'team2') {
      badgeTextClass = 'text-sky-300';
      cardClasses = isOccupied
        ? 'club-card border-sky-400/75 text-white'
        : 'bg-black/20 border-dashed border-sky-400/50 text-white hover:bg-black/30';
      avatarClass = isOccupied ? 'bg-sky-400 text-slate-950 font-bold' : 'bg-black/30 text-sky-300 border border-sky-400/45';
    } else if (teamType === 'team3') {
      badgeTextClass = 'text-rose-300';
      cardClasses = isOccupied
        ? 'club-card border-rose-400/75 text-white'
        : 'bg-black/20 border-dashed border-rose-400/50 text-white hover:bg-black/30';
      avatarClass = isOccupied ? 'bg-rose-400 text-slate-950 font-bold' : 'bg-black/30 text-rose-300 border border-rose-400/45';
    }

    if (isSelected) {
      cardClasses += ' ring-2 ring-[var(--accent-gold)] ring-offset-2 ring-offset-black/40 shadow-lg';
    }

    return (
      <div
        role="button"
        tabIndex={0}
        onClick={() => {
          try { sound.playTap(); } catch {}
          if (onSelectSlot) onSelectSlot(slotKey);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (onSelectSlot) onSelectSlot(slotKey);
          }
        }}
        className={`p-3 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between active:scale-[0.98] min-h-[84px] ${cardClasses}`}
      >
        <div className="flex items-center justify-between gap-1 mb-1.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className={`text-[11px] font-extrabold uppercase tracking-wider truncate ${badgeTextClass}`}>
              {teamLabel}
            </span>
            <span className="text-[11px] club-text-subtle truncate hidden sm:inline">
              · {positionLabel}
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {isSelected && (
              <span className="px-1.5 py-0.5 rounded bg-[var(--accent-gold)] text-[var(--accent-gold-ink)] font-black text-[9px] uppercase tracking-wider">
                Attivo
              </span>
            )}
            {isOccupied && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  try { sound.playTap(); } catch {}
                  setPlayerName('');
                }}
                className="w-7 h-7 rounded-full hover:bg-rose-500/20 text-white/60 hover:text-rose-300 flex items-center justify-center transition-colors cursor-pointer"
                title="Libera questo posto"
                aria-label="Libera posto"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 ${avatarClass}`}>
            {isOccupied ? playerName.slice(0, 1).toUpperCase() : <Plus className="w-4 h-4" />}
          </div>

          <div className="min-w-0 flex-1">
            {isOccupied ? (
              <div className="font-bold text-sm text-white truncate flex items-center gap-1.5">
                <span className="truncate">{playerName}</span>
                {isMe && (
                  <span className="text-[10px] club-text-gold font-extrabold shrink-0">(Tu)</span>
                )}
              </div>
            ) : (
              <div className="text-left">
                <span className="text-xs font-semibold text-white/85 block truncate">
                  Assegna posto
                </span>
                <span className="text-[10px] club-text-subtle block truncate">
                  {positionLabel}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-2.5">
      {/* TAVOLO VIRTUALE ADATTIVO AI 4 TEMI DEL PANNO */}
      <div
        className="p-3.5 sm:p-5 rounded-3xl border-2 border-[var(--accent-gold)]/60 shadow-xl relative overflow-hidden"
        style={{
          backgroundColor: 'var(--surface-canvas)',
          backgroundImage: 'var(--surface-radial)'
        }}
      >
        <div className="absolute inset-2.5 sm:inset-3 border border-[var(--border-hairline)] rounded-2xl pointer-events-none" />

        {/* 1. A COPPIE */}
        {isPairs && (
          <div className="relative z-10 space-y-2.5 sm:space-y-3">
            <div className="max-w-xs sm:max-w-sm mx-auto w-full">
              {renderSeat('p1B', p1B, setP1B, 'Coppia 1', 'Nord · Compagno', 'team1')}
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex-1 min-w-0">
                {renderSeat('p2A', p2A, setP2A, 'Coppia 2', 'Ovest', 'team2')}
              </div>

              <div className="w-12 sm:w-16 shrink-0 flex flex-col items-center justify-center gap-2 py-1">
                <div className="w-8 h-8 rounded-full club-inset border club-border flex items-center justify-center club-text-gold font-display font-bold text-xs select-none">
                  ♣
                </div>

                <button
                  type="button"
                  onClick={handleShuffle}
                  disabled={occupiedCount < 2}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-95 ${
                    occupiedCount >= 2
                      ? 'gold-gradient cursor-pointer'
                      : 'club-inset club-text-subtle opacity-45 cursor-not-allowed'
                  }`}
                  title="Sorteggia casualmente i posti"
                  aria-label="Sorteggia posti"
                >
                  <Shuffle className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={handleSwapPartners}
                  className="w-10 h-10 rounded-xl club-btn-secondary flex items-center justify-center active:scale-95 cursor-pointer"
                  title="Scambia i partner tra le coppie"
                  aria-label="Scambia partner"
                >
                  <ArrowLeftRight className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 min-w-0">
                {renderSeat('p2B', p2B, setP2B, 'Coppia 2', 'Est', 'team2')}
              </div>
            </div>

            <div className="max-w-xs sm:max-w-sm mx-auto w-full">
              {renderSeat('p1A', p1A, setP1A, 'Coppia 1', 'Sud · Caposquadra', 'team1')}
            </div>

            <div className="flex items-center justify-center gap-2 pt-1 flex-wrap">
              <button
                type="button"
                onClick={handleSwapTeams}
                className="min-h-[40px] px-3.5 rounded-xl club-btn-secondary text-xs font-bold flex items-center gap-1.5 active:scale-95 cursor-pointer"
              >
                <ArrowLeftRight className="w-3.5 h-3.5 club-text-gold" />
                <span>Inverti Coppie</span>
              </button>

              {hasAnyPlayer && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="min-h-[40px] px-3.5 rounded-xl club-btn-secondary club-text-subtle hover:text-rose-300 text-xs font-semibold flex items-center gap-1.5 active:scale-95 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Svuota</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* 2. SINGOLO */}
        {isSingles && (
          <div className="relative z-10 space-y-3 max-w-sm mx-auto">
            {renderSeat('p2A', p2A, setP2A, 'Giocatore 2', 'Nord · Avversario', 'team2')}

            <div className="flex items-center justify-center gap-2 py-0.5">
              <button
                type="button"
                onClick={handleSwapTeams}
                className="min-h-[42px] px-4 rounded-xl gold-gradient flex items-center gap-1.5 text-xs font-bold cursor-pointer active:scale-95"
              >
                <ArrowLeftRight className="w-4 h-4" />
                <span>Inverti Ordine</span>
              </button>

              {hasAnyPlayer && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="w-[42px] h-[42px] rounded-xl club-btn-secondary club-text-subtle hover:text-rose-300 flex items-center justify-center cursor-pointer"
                  title="Svuota posti"
                  aria-label="Svuota posti"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {renderSeat('p1A', p1A, setP1A, 'Giocatore 1', 'Sud · Tu / Primo', 'team1')}
          </div>
        )}

        {/* 3. A TRE */}
        {isTrio && (
          <div className="relative z-10 space-y-3 max-w-md mx-auto">
            <div className="max-w-xs mx-auto">
              {renderSeat('p1A', p1A, setP1A, 'Giocatore 1', 'Nord · Capotavola', 'team1')}
            </div>

            <div className="flex items-center justify-center gap-2 py-0.5">
              <button
                type="button"
                onClick={handleShuffle}
                disabled={occupiedCount < 2}
                className="min-h-[42px] px-4 rounded-xl gold-gradient flex items-center gap-1.5 text-xs font-bold cursor-pointer active:scale-95 disabled:opacity-45"
              >
                <Shuffle className="w-4 h-4" />
                <span>Sorteggia Ordine</span>
              </button>
              {hasAnyPlayer && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="w-[42px] h-[42px] rounded-xl club-btn-secondary club-text-subtle hover:text-rose-300 flex items-center justify-center cursor-pointer"
                  title="Svuota posti"
                  aria-label="Svuota posti"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {renderSeat('p2A', p2A, setP2A, 'Giocatore 2', 'Sinistra', 'team2')}
              {renderSeat('p3A', p3A, setP3A, 'Giocatore 3', 'Destra', 'team3')}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
