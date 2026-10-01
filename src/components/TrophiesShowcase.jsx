import React, { useState } from 'react';
import { Trophy, Award, Sparkles, CheckCircle2, Lock, Star, Flame, Crown, Shield } from 'lucide-react';
import { calculatePlayerTrophies } from '../utils/trophies';

export default function TrophiesShowcase({
  stats = [],
  gamesHistory = [],
  activeGame = null,
  initialPlayerName = null,
}) {
  const [selectedPlayer, setSelectedPlayer] = useState(
    initialPlayerName || (stats.length > 0 ? stats[0].name : '')
  );
  const [filter, setFilter] = useState('all'); // 'all' | 'unlocked' | 'locked'

  // Combina tutte le partite per il calcolo delle rimonte / condizioni speciali
  const allGames = [...gamesHistory];
  if (activeGame && activeGame.rounds && activeGame.rounds.length > 0) {
    if (!allGames.some(g => g.id === activeGame.id)) {
      allGames.push(activeGame);
    }
  }

  // Trova le statistiche del giocatore selezionato
  const currentPlayerStats = stats.find(s => s.name === selectedPlayer) || stats[0];

  if (!currentPlayerStats) {
    return (
      <div className="text-center py-12 text-emerald-300/70 text-xs">
        Nessun giocatore disponibile. Aggiungi i primi partecipanti per vedere i trofei!
      </div>
    );
  }

  const { list, unlockedCount, totalCount, percentTotal, titleInfo } = calculatePlayerTrophies(
    currentPlayerStats,
    allGames
  );

  const filteredList = list.filter(t => {
    if (filter === 'unlocked') return t.unlocked;
    if (filter === 'locked') return !t.unlocked;
    return true;
  });

  return (
    <div className="space-y-4">
      
      {/* Selettore Giocatore Orizzontale */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {stats.map(p => {
          const isSelected = p.name === currentPlayerStats.name;
          const pTrophies = calculatePlayerTrophies(p, allGames);
          return (
            <button
              key={p.name}
              type="button"
              onClick={() => setSelectedPlayer(p.name)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                isSelected
                  ? 'bg-amber-400 text-emerald-950 shadow-md font-black scale-102'
                  : 'bg-emerald-950/70 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800/60'
              }`}
            >
              <span>{pTrophies.titleInfo.icon}</span>
              <span>{p.name}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                isSelected ? 'bg-emerald-950 text-amber-300' : 'bg-emerald-800/80 text-emerald-200'
              }`}>
                {pTrophies.unlockedCount}/{pTrophies.totalCount}
              </span>
            </button>
          );
        })}
      </div>

      {/* Scheda Profilo & Titolo Onorifico del Giocatore */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950 via-emerald-900/70 to-emerald-950 border border-amber-500/40 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl gold-gradient flex items-center justify-center text-emerald-950 font-black text-2xl shadow-lg shrink-0">
              {titleInfo.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white m-0">{currentPlayerStats.name}</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  {titleInfo.rank}
                </span>
              </div>
              <p className="text-xs font-semibold text-amber-300/90 mt-0.5 flex items-center gap-1">
                <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Titolo: <strong>{titleInfo.title}</strong></span>
              </p>
            </div>
          </div>

          {/* Badge Progresso Totale */}
          <div className="w-full sm:w-auto bg-emerald-950/80 p-2.5 rounded-xl border border-emerald-700/50 flex flex-col items-end">
            <div className="flex items-center justify-between sm:justify-end gap-2 w-full text-xs">
              <span className="text-emerald-300">Bacheca Trofei:</span>
              <strong className="text-amber-300 font-black text-sm">{unlockedCount} / {totalCount}</strong>
            </div>
            <div className="w-full sm:w-36 bg-emerald-900 rounded-full h-2 mt-1.5 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-amber-500 to-amber-300 h-full rounded-full transition-all duration-500"
                style={{ width: `${percentTotal}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Filtri Trofei (Tutti, Sbloccati, Da Sbloccare) */}
      <div className="flex items-center justify-between gap-2 pt-1 text-xs">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
              filter === 'all'
                ? 'bg-emerald-800 text-white border border-emerald-600'
                : 'text-emerald-400 hover:text-white'
            }`}
          >
            Tutti ({totalCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter('unlocked')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
              filter === 'unlocked'
                ? 'bg-amber-400 text-emerald-950 font-black'
                : 'text-emerald-400 hover:text-white'
            }`}
          >
            Sbloccati ({unlockedCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter('locked')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
              filter === 'locked'
                ? 'bg-emerald-900/80 text-emerald-200 border border-emerald-700'
                : 'text-emerald-400 hover:text-white'
            }`}
          >
            Da Sbloccare ({totalCount - unlockedCount})
          </button>
        </div>

        <span className="text-[11px] text-emerald-400/80 hidden sm:inline">
          {percentTotal}% Completato
        </span>
      </div>

      {/* Griglia dei Trofei */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {filteredList.map(t => (
          <div
            key={t.id}
            className={`p-3.5 rounded-xl border transition-all relative overflow-hidden flex items-start gap-3 ${
              t.unlocked
                ? 'bg-gradient-to-br from-emerald-950 via-emerald-900/60 to-emerald-950 border-amber-400/60 shadow-lg shadow-amber-950/20'
                : 'bg-emerald-950/40 border-emerald-800/40 opacity-75 hover:opacity-100'
            }`}
          >
            {/* Icona Trofeo */}
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 border ${
              t.unlocked
                ? 'bg-gradient-to-br from-amber-400/20 to-amber-600/30 border-amber-400/50 shadow-inner'
                : 'bg-emerald-900/30 border-emerald-800/40 grayscale'
            }`}>
              {t.icon}
            </div>

            {/* Dettagli Trofeo */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1.5 mb-1">
                <h4 className={`text-xs font-black truncate m-0 ${t.unlocked ? 'text-amber-300' : 'text-emerald-200'}`}>
                  {t.title}
                </h4>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-black uppercase tracking-wider border shrink-0 ${t.rarityInfo.color}`}>
                  {t.rarityInfo.label}
                </span>
              </div>

              <p className="text-[11px] text-emerald-300/80 leading-snug m-0">
                {t.description}
              </p>

              {/* Barra di Avanzamento o Spunta Sbloccato */}
              <div className="mt-2 pt-1.5 border-t border-emerald-800/40 flex items-center justify-between text-[11px]">
                {t.unlocked ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Conquistato!</span>
                  </span>
                ) : (
                  <div className="w-full space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-emerald-400/80">
                      <span className="flex items-center gap-1">
                        <Lock className="w-3 h-3 text-emerald-500" />
                        <span>Progresso</span>
                      </span>
                      <span className="font-semibold">{t.progressText}</span>
                    </div>
                    <div className="w-full bg-emerald-950 rounded-full h-1.5 overflow-hidden border border-emerald-800/40">
                      <div 
                        className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${t.percent}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
