import React from 'react';
import { User, Users, Shuffle, ArrowLeftRight, X, Plus, Sparkles, Trash2, Award } from 'lucide-react';
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
    try { sound.playTap(); } catch {}
    const temp = p1B;
    setP1B(p2A);
    setP2A(temp);
  };

  // Inverti le due squadre (Squadra 1 <-> Squadra 2)
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

  // Sorteggia posti a caso tra i giocatori inseriti
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

  // Svuota tutti i posti del tavolo
  const handleClearAll = () => {
    try { sound.playTap(); } catch {}
    setP1A('');
    setP1B('');
    setP2A('');
    setP2B('');
    setP3A('');
  };

  // Helper per renderizzare un singolo posto a sedere (Poltrona)
  const renderSeat = (slotKey, playerName, setPlayerName, teamLabel, positionLabel, teamType) => {
    const isOccupied = Boolean(playerName?.trim());
    const isMe = currentUser && playerName && (
      playerName.toLowerCase() === (currentUser.displayName || '').toLowerCase() ||
      playerName.toLowerCase() === (currentUser.email?.split('@')[0] || '').toLowerCase()
    );
    const isSelected = activeSlot === slotKey;

    // Palette colori differenziata per Coppia 1 (Oro/Ambra) e Coppia 2 (Sky/Azzurro)
    let cardBg = 'bg-[#082216]/95 border-emerald-600/50 text-white';
    let teamBadgeClass = 'bg-emerald-800 text-emerald-200 border border-emerald-600';
    let avatarClass = 'bg-emerald-900/80 text-emerald-300 border border-emerald-700';

    if (teamType === 'team1') {
      teamBadgeClass = 'bg-amber-400 text-emerald-950 font-black border border-amber-300 shadow-xs';
      if (isOccupied) {
        cardBg = 'bg-gradient-to-br from-[#1b2b18] to-[#122313] border-amber-400/80 text-white shadow-amber-500/10 shadow-lg';
        avatarClass = 'gold-gradient text-emerald-950 shadow-md font-black';
      } else {
        cardBg = 'bg-[#102417]/90 border-dashed border-amber-400/60 text-amber-200 hover:border-amber-400 hover:bg-[#162f1e]';
        avatarClass = 'bg-amber-950/60 text-amber-300 border border-amber-500/50';
      }
    } else if (teamType === 'team2') {
      teamBadgeClass = 'bg-sky-400 text-slate-950 font-black border border-sky-300 shadow-xs';
      if (isOccupied) {
        cardBg = 'bg-gradient-to-br from-[#10293a] to-[#0c1e2b] border-sky-400/80 text-white shadow-sky-500/10 shadow-lg';
        avatarClass = 'bg-sky-500 text-slate-950 shadow-md font-black';
      } else {
        cardBg = 'bg-[#0d2230]/90 border-dashed border-sky-400/60 text-sky-200 hover:border-sky-400 hover:bg-[#122e42]';
        avatarClass = 'bg-sky-950/60 text-sky-300 border border-sky-500/50';
      }
    } else if (teamType === 'team3') {
      teamBadgeClass = 'bg-rose-400 text-slate-950 font-black border border-rose-300 shadow-xs';
      if (isOccupied) {
        cardBg = 'bg-gradient-to-br from-[#2a131b] to-[#1e0d13] border-rose-400/80 text-white shadow-rose-500/10 shadow-lg';
        avatarClass = 'bg-rose-500 text-slate-950 shadow-md font-black';
      } else {
        cardBg = 'bg-[#220d15]/90 border-dashed border-rose-400/60 text-rose-200 hover:border-rose-400';
        avatarClass = 'bg-rose-950/60 text-rose-300 border border-rose-500/50';
      }
    }

    if (isSelected) {
      cardBg += ' ring-4 ring-amber-300 ring-offset-2 ring-offset-emerald-950 shadow-[0_0_25px_rgba(251,191,36,0.6)] scale-[1.02] border-amber-300';
    }

    return (
      <div 
        onClick={() => {
          try { sound.playTap(); } catch {}
          onSelectSlot && onSelectSlot(slotKey);
        }}
        className={`p-2.5 sm:p-3 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between shadow-md active:scale-95 touch-manipulation min-h-[82px] sm:min-h-[88px] ${cardBg}`}
      >
        {/* Intestazione Posto (Badge Squadra + Posizione) */}
        <div className="flex items-center justify-between gap-1 mb-1.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className={`text-[10px] sm:text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-lg whitespace-nowrap shrink-0 ${teamBadgeClass}`}>
              {teamLabel}
            </span>
            <span className="text-[11px] font-bold text-white/90 truncate">
              {positionLabel}
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {isSelected && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-400 text-emerald-950 font-black text-[9px] uppercase tracking-wider animate-pulse">
                ★ Attivo
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

        {/* Contenuto Posto: Avatar + Nome Giocatore */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shrink-0 ${avatarClass}`}>
            {isOccupied ? (
              playerName.slice(0, 1).toUpperCase()
            ) : (
              <Plus className="w-4 h-4 text-emerald-300" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            {isOccupied ? (
              <div className="font-black text-sm sm:text-base text-white truncate flex items-center gap-1.5">
                <span className="truncate">{playerName}</span>
                {isMe && (
                  <span className="text-[10px] text-amber-300 font-extrabold px-1.5 py-0.2 rounded bg-amber-400/20 border border-amber-400/50 shrink-0">
                    Tu
                  </span>
                )}
              </div>
            ) : (
              <div className="text-left">
                <span className="text-xs font-bold text-emerald-200 block truncate">
                  + Assegna Posto
                </span>
                <span className="text-[10px] text-emerald-400/80 block truncate">
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
      
      {/* TAVOLO DA BURRACO IN PANNO VERDE CON BORDO IN LEGNO E CUCITURE DORATE */}
      <div className="p-3 sm:p-5 rounded-[32px] sm:rounded-[36px] bg-gradient-to-b from-[#134e32] via-[#0d3b25] to-[#072517] border-4 border-amber-500/70 shadow-[0_15px_40px_rgba(0,0,0,0.8),inset_0_0_35px_rgba(0,0,0,0.6)] relative overflow-hidden">
        
        {/* Bordo interno di feltro cucito (stile tavolo reale da casinò/club) */}
        <div className="absolute inset-2 sm:inset-3 border border-emerald-400/25 rounded-[24px] sm:rounded-[28px] pointer-events-none" />

        {/* Glow luminoso soffuso centrale tipo lampada da tavolo */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl" />
        </div>

        {/* 1. MODALITÀ A COPPIE (2 vs 2 - 4 GIOCATORI): TAVOLO COMPLETO */}
        {isPairs && (
          <div className="relative z-10 space-y-2.5 sm:space-y-3">
            
            {/* POSTO NORD (In alto: Compagno Coppia 1) */}
            <div className="max-w-xs sm:max-w-sm mx-auto w-full">
              {renderSeat('p1B', p1B, setP1B, 'Coppia 1', 'Nord • Compagno', 'team1')}
            </div>

            {/* ZONA CENTRALE: OVEST vs HUB CENTRALE vs EST */}
            <div className="flex items-center gap-2 sm:gap-3">
              
              {/* Posto Ovest (Avversario Sinistra) */}
              <div className="flex-1 min-w-0">
                {renderSeat('p2A', p2A, setP2A, 'Coppia 2', 'Ovest • Avversario', 'team2')}
              </div>

              {/* Centro Tavolo: Medaglione Club & Pulsanti Rapidi */}
              <div className="w-16 sm:w-20 shrink-0 flex flex-col items-center justify-center gap-1.5 py-1">
                
                {/* Stemmino Medaglione Centro Feltro */}
                <div className="w-8 h-8 rounded-full bg-emerald-950 border border-amber-400/50 shadow-md flex items-center justify-center text-amber-300 font-serif font-black text-xs select-none">
                  ♣
                </div>

                {/* Tasto Sorteggia */}
                <button
                  type="button"
                  onClick={handleShuffle}
                  disabled={occupiedCount < 2}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90 shadow-md ${
                    occupiedCount >= 2
                      ? 'gold-gradient text-emerald-950 cursor-pointer hover:brightness-110'
                      : 'bg-emerald-950/80 text-emerald-500/40 border border-emerald-800/40 cursor-not-allowed'
                  }`}
                  title="Sorteggia casualmente i posti tra i giocatori presenti"
                >
                  <Shuffle className="w-4 h-4" />
                </button>

                {/* Tasto Scambia Partner */}
                <button
                  type="button"
                  onClick={handleSwapPartners}
                  className="w-9 h-9 rounded-xl bg-emerald-950/90 hover:bg-emerald-900 border border-emerald-600/60 text-emerald-200 flex items-center justify-center active:scale-90 transition-all cursor-pointer shadow-md"
                  title="Scambia i partner tra le due coppie"
                >
                  <ArrowLeftRight className="w-4 h-4 text-emerald-300" />
                </button>

              </div>

              {/* Posto Est (Avversario Destra) */}
              <div className="flex-1 min-w-0">
                {renderSeat('p2B', p2B, setP2B, 'Coppia 2', 'Est • Avversario', 'team2')}
              </div>

            </div>

            {/* POSTO SUD (In basso: Tu / Caposquadra Coppia 1) */}
            <div className="max-w-xs sm:max-w-sm mx-auto w-full">
              {renderSeat('p1A', p1A, setP1A, 'Coppia 1', 'Sud • Tu / Caposquadra', 'team1')}
            </div>

            {/* Barra Azioni Veloci Sotto il Tavolo */}
            <div className="flex items-center justify-center gap-2 pt-1 flex-wrap">
              <button
                type="button"
                onClick={handleSwapTeams}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-950/90 hover:bg-emerald-900 border border-emerald-600/60 text-emerald-200 text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-sm"
              >
                <ArrowLeftRight className="w-3.5 h-3.5 text-amber-400" />
                <span>Inverti Coppia 1 ⇄ Coppia 2</span>
              </button>

              {hasAnyPlayer && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="px-3 py-1.5 rounded-xl bg-emerald-950/80 hover:bg-rose-950/70 border border-emerald-800/60 text-emerald-400/80 hover:text-rose-300 text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-xs"
                  title="Svuota tutti i posti"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Svuota Tavolo</span>
                </button>
              )}
            </div>

          </div>
        )}

        {/* 2. MODALITÀ SINGOLO (1 vs 1) */}
        {isSingles && (
          <div className="relative z-10 space-y-3 max-w-sm mx-auto">
            {renderSeat('p2A', p2A, setP2A, 'Giocatore 2', 'Nord • Avversario', 'team2')}
            
            <div className="flex items-center justify-center gap-2 py-1">
              <button
                type="button"
                onClick={handleSwapTeams}
                className="px-4 py-1.5 rounded-xl gold-gradient text-emerald-950 shadow-md flex items-center gap-1.5 text-xs font-black cursor-pointer active:scale-95 hover:brightness-110"
              >
                <ArrowLeftRight className="w-3.5 h-3.5 text-emerald-950" />
                <span>Inverti Ordine Gioco</span>
              </button>

              {hasAnyPlayer && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="p-1.5 rounded-xl bg-emerald-950/80 hover:bg-rose-950/70 text-emerald-400 hover:text-rose-300 border border-emerald-800/60 shadow-xs cursor-pointer"
                  title="Svuota posti"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {renderSeat('p1A', p1A, setP1A, 'Giocatore 1', 'Sud • Tu / Primo a Giocare', 'team1')}
          </div>
        )}

        {/* 3. MODALITÀ A TRE (TRIO) */}
        {isTrio && (
          <div className="relative z-10 space-y-3 max-w-md mx-auto">
            <div className="max-w-xs mx-auto">
              {renderSeat('p1A', p1A, setP1A, 'Giocatore 1', 'Nord • Capotavola', 'team1')}
            </div>

            <div className="flex items-center justify-center gap-2 py-0.5">
              <button
                type="button"
                onClick={handleShuffle}
                disabled={occupiedCount < 2}
                className="px-3.5 py-1.5 rounded-xl gold-gradient text-emerald-950 shadow-xs flex items-center gap-1.5 text-xs font-black cursor-pointer active:scale-95"
              >
                <Shuffle className="w-3.5 h-3.5 text-emerald-950" />
                <span>Sorteggia Ordine</span>
              </button>
              {hasAnyPlayer && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="p-1.5 rounded-xl bg-emerald-950/80 hover:bg-rose-950/70 text-emerald-400 hover:text-rose-300 border border-emerald-800/60 shadow-xs cursor-pointer"
                  title="Svuota posti"
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
