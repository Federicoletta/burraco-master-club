import React from 'react';
import { User, Users, Shuffle, ArrowLeftRight, X, Plus, Sparkles, Trash2 } from 'lucide-react';
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

  // Scambia i compagni delle due coppie (P1B <-> P2A)
  const handleSwapPartners = () => {
    try {
      sound.playTap();
    } catch {}
    const temp = p1B;
    setP1B(p2A);
    setP2A(temp);
  };

  // Inverti le due squadre (Squadra 1 <-> Squadra 2)
  const handleSwapTeams = () => {
    try {
      sound.playTap();
    } catch {}
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

  // Sorteggia posti a caso tra i giocatori inseriti
  const handleShuffle = () => {
    try {
      sound.playCardDeal();
    } catch {}
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

  // Svuota tutti i posti del tavolo
  const handleClearAll = () => {
    try {
      sound.playTap();
    } catch {}
    setP1A('');
    setP1B('');
    setP2A('');
    setP2B('');
    setP3A('');
  };

  // Helper per renderizzare un singolo posto a sedere (Poltrona)
  const renderSeat = (slotKey, playerName, setPlayerName, label, positionLabel, teamType) => {
    const isOccupied = Boolean(playerName?.trim());
    const isMe = currentUser && playerName && (
      playerName.toLowerCase() === (currentUser.displayName || '').toLowerCase() ||
      playerName.toLowerCase() === (currentUser.email?.split('@')[0] || '').toLowerCase()
    );
    const isSelected = activeSlot === slotKey;

    let borderClass = 'border-emerald-600/50 bg-emerald-950/80 text-white';
    let teamBadgeClass = 'bg-emerald-900/80 text-emerald-300';
    let avatarBgClass = 'bg-emerald-900/60 text-emerald-300 border-emerald-700/60';

    if (teamType === 'team1') {
      borderClass = isOccupied 
        ? 'border-amber-400/80 bg-gradient-to-b from-emerald-950 via-[#182315] to-amber-950/40 text-white shadow-amber-500/10' 
        : 'border-dashed border-amber-400/50 bg-amber-950/20 text-amber-200/80 hover:border-amber-400 hover:bg-amber-950/30';
      teamBadgeClass = 'bg-amber-400/20 text-amber-300 border border-amber-400/40';
      avatarBgClass = isOccupied ? 'gold-gradient text-emerald-950 shadow-md' : 'bg-amber-950/40 text-amber-300 border-amber-500/40';
    } else if (teamType === 'team2') {
      borderClass = isOccupied 
        ? 'border-blue-400/80 bg-gradient-to-b from-emerald-950 via-[#0e1f2b] to-blue-950/40 text-white shadow-blue-500/10' 
        : 'border-dashed border-blue-400/50 bg-blue-950/20 text-blue-200/80 hover:border-blue-400 hover:bg-blue-950/30';
      teamBadgeClass = 'bg-blue-400/20 text-blue-300 border border-blue-400/40';
      avatarBgClass = isOccupied ? 'bg-blue-600 text-white shadow-md' : 'bg-blue-950/40 text-blue-300 border-blue-500/40';
    } else if (teamType === 'team3') {
      borderClass = isOccupied 
        ? 'border-rose-400/80 bg-gradient-to-b from-emerald-950 to-rose-950/40 text-white shadow-rose-500/10' 
        : 'border-dashed border-rose-400/50 bg-rose-950/20 text-rose-200/80 hover:border-rose-400 hover:bg-rose-950/30';
      teamBadgeClass = 'bg-rose-400/20 text-rose-300 border border-rose-400/40';
      avatarBgClass = isOccupied ? 'bg-rose-600 text-white shadow-md' : 'bg-rose-950/40 text-rose-300 border-rose-500/40';
    }

    if (isSelected) {
      borderClass += ' ring-2 ring-amber-400 ring-offset-2 ring-offset-emerald-950 shadow-[0_0_15px_rgba(251,191,36,0.35)] scale-[1.02]';
    }

    return (
      <div 
        onClick={() => {
          try { sound.playTap(); } catch {}
          onSelectSlot && onSelectSlot(slotKey);
        }}
        className={`p-2.5 sm:p-3 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between shadow-md active:scale-95 touch-manipulation min-h-[76px] sm:min-h-[84px] ${borderClass}`}
      >
        {/* Intestazione Posto */}
        <div className="flex items-center justify-between gap-1 mb-1">
          <div className="flex items-center gap-1 min-w-0">
            <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full truncate ${teamBadgeClass}`}>
              {label}
            </span>
            {positionLabel && (
              <span className="text-[10px] text-emerald-300/70 font-semibold hidden sm:inline">
                • {positionLabel}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {isSelected && (
              <span className="flex h-2 w-2 relative" title="Posto attivo per inserimento">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
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
                className="text-white/60 hover:text-rose-300 hover:bg-rose-500/20 rounded-full p-1 transition-colors cursor-pointer"
                title="Libera questo posto"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Contenuto Posto: Avatar + Nome */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-black text-xs sm:text-sm shrink-0 ${avatarBgClass}`}>
            {isOccupied ? (
              playerName.slice(0, 1).toUpperCase()
            ) : (
              <Plus className="w-4 h-4 text-emerald-300" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            {isOccupied ? (
              <div className="font-black text-xs sm:text-sm text-white truncate flex items-center gap-1.5">
                <span className="truncate">{playerName}</span>
                {isMe && (
                  <span className="text-[10px] text-amber-300 font-extrabold px-1.5 py-0.2 rounded bg-amber-400/20 border border-amber-400/40 shrink-0">
                    Tu
                  </span>
                )}
              </div>
            ) : (
              <div className="text-left">
                <span className="text-xs font-semibold text-emerald-300/80 block truncate">
                  + Assegna Posto
                </span>
                <span className="text-[10px] text-emerald-400/50 block truncate">
                  Tocca o scegli in basso
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
      
      {/* TAVOLO VERDE VISIVO DALL'ALTO */}
      <div className="p-3 sm:p-5 rounded-3xl bg-gradient-to-b from-[#0a2318] via-emerald-950 to-[#071a12] border-2 border-amber-500/40 shadow-2xl relative overflow-hidden">
        
        {/* Glow e filigrana feltro centrale */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-64 h-64 bg-amber-400/5 rounded-full blur-3xl" />
          <div className="text-emerald-500/10 text-7xl sm:text-8xl font-serif select-none tracking-widest">
            ♠ ♥ ♦ ♣
          </div>
        </div>

        {/* 1. MODALITÀ A COPPIE (2 vs 2 - 4 GIOCATORI): TAVOLO COMPLETO */}
        {isPairs && (
          <div className="relative z-10 space-y-2 sm:space-y-3">
            
            {/* POSTO NORD (In alto: Compagno Coppia 1) */}
            <div className="max-w-xs mx-auto">
              {renderSeat('p1B', p1B, setP1B, 'Coppia 1', 'Compagno di Fronte (Nord)', 'team1')}
            </div>

            {/* ZONA CENTRALE: OVEST vs COMANDI TATTICI vs EST */}
            <div className="grid grid-cols-12 gap-2 sm:gap-3 items-center">
              {/* Posto Ovest (Avversario 1) */}
              <div className="col-span-12 sm:col-span-5">
                {renderSeat('p2A', p2A, setP2A, 'Coppia 2', 'Avversario Sinistra (Ovest)', 'team2')}
              </div>

              {/* Centro Tavolo: Comandi Rapidi di Sorteggio & Scambio */}
              <div className="col-span-12 sm:col-span-2 flex sm:flex-col items-center justify-center gap-1.5 py-1">
                <button
                  type="button"
                  onClick={handleShuffle}
                  disabled={occupiedCount < 2}
                  className={`p-2 rounded-xl bg-emerald-950/90 border border-amber-400/40 text-amber-300 shadow-md transition-all active:scale-90 ${
                    occupiedCount >= 2 
                      ? 'hover:bg-amber-500/20 hover:border-amber-400 cursor-pointer' 
                      : 'opacity-40 cursor-not-allowed'
                  }`}
                  title="Sorteggia casualmente i posti tra i giocatori presenti"
                >
                  <Shuffle className="w-4 h-4 text-amber-400" />
                </button>
                
                <button
                  type="button"
                  onClick={handleSwapPartners}
                  className="p-2 rounded-xl bg-emerald-950/90 hover:bg-emerald-800 text-emerald-200 border border-emerald-700/60 shadow-md active:scale-90 transition-all cursor-pointer"
                  title="Scambia i compagni delle due coppie (Nord <-> Ovest)"
                >
                  <ArrowLeftRight className="w-4 h-4 text-emerald-300" />
                </button>

                {hasAnyPlayer && (
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="p-2 rounded-xl bg-emerald-950/80 hover:bg-rose-950/60 text-white/50 hover:text-rose-300 border border-emerald-800/50 shadow-xs active:scale-90 transition-all cursor-pointer"
                    title="Libera tutti i posti al tavolo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Posto Est (Avversario 2) */}
              <div className="col-span-12 sm:col-span-5">
                {renderSeat('p2B', p2B, setP2B, 'Coppia 2', 'Avversario Destra (Est)', 'team2')}
              </div>
            </div>

            {/* POSTO SUD (In basso: Tu / Caposquadra Coppia 1) */}
            <div className="max-w-xs mx-auto">
              {renderSeat('p1A', p1A, setP1A, 'Coppia 1', 'Tu / Caposquadra (Sud)', 'team1')}
            </div>

            {/* Barra Scambio Squadre Veloce */}
            <div className="flex items-center justify-center pt-1">
              <button
                type="button"
                onClick={handleSwapTeams}
                className="px-3 py-1 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 text-[11px] font-bold flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-xs"
              >
                <ArrowLeftRight className="w-3 h-3 text-amber-400" />
                <span>Inverti Coppia 1 ⇄ Coppia 2</span>
              </button>
            </div>
          </div>
        )}

        {/* 2. MODALITÀ SINGOLO (1 vs 1) */}
        {isSingles && (
          <div className="relative z-10 space-y-3 max-w-sm mx-auto">
            {renderSeat('p2A', p2A, setP2A, 'Giocatore 2', 'Avversario di Fronte', 'team2')}
            
            <div className="flex items-center justify-center gap-2 py-1">
              <button
                type="button"
                onClick={handleSwapTeams}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-950 text-amber-300 border border-amber-400/40 shadow-md flex items-center gap-1.5 text-xs font-bold cursor-pointer active:scale-95 hover:bg-emerald-900"
              >
                <ArrowLeftRight className="w-3.5 h-3.5 text-amber-400" />
                <span>Inverti Ordine Gioco</span>
              </button>
              {hasAnyPlayer && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="p-1.5 rounded-xl bg-emerald-950/80 hover:bg-rose-950/60 text-white/50 hover:text-rose-300 border border-emerald-800/50 shadow-xs cursor-pointer"
                  title="Svuota posti"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {renderSeat('p1A', p1A, setP1A, 'Giocatore 1', 'Tu / Primo a Giocare', 'team1')}
          </div>
        )}

        {/* 3. MODALITÀ A TRE (TRIO) */}
        {isTrio && (
          <div className="relative z-10 space-y-3 max-w-md mx-auto">
            <div className="max-w-xs mx-auto">
              {renderSeat('p1A', p1A, setP1A, 'Giocatore 1', 'In Alto', 'team1')}
            </div>

            <div className="flex items-center justify-center gap-2 py-0.5">
              <button
                type="button"
                onClick={handleShuffle}
                disabled={occupiedCount < 2}
                className="px-3 py-1 rounded-xl bg-emerald-950 text-amber-300 border border-amber-400/40 shadow-xs flex items-center gap-1.5 text-xs font-bold cursor-pointer active:scale-95"
              >
                <Shuffle className="w-3.5 h-3.5 text-amber-400" />
                <span>Sorteggia Ordine</span>
              </button>
              {hasAnyPlayer && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="p-1.5 rounded-xl bg-emerald-950/80 hover:bg-rose-950/60 text-white/50 hover:text-rose-300 border border-emerald-800/50 shadow-xs cursor-pointer"
                  title="Svuota posti"
                >
                  <Trash2 className="w-3.5 h-3.5" />
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
