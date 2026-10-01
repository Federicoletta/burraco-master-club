import React, { useState } from 'react';
import { X, Users, UserPlus, Trophy, Award, Flame, Trash2, TrendingUp, BarChart3, Sparkles, Crown } from 'lucide-react';
import { calculatePlayerStats } from '../utils/storage';
import { getPlayerTitle, calculatePlayerTrophies } from '../utils/trophies';
import StatsCharts from './StatsCharts';
import TrophiesShowcase from './TrophiesShowcase';

export default function PlayersStatsModal({
  isOpen,
  onClose,
  playersList,
  onAddPlayer,
  onDeletePlayer,
  gamesHistory,
  activeGame
}) {
  const [newPlayerName, setNewPlayerName] = useState('');
  const [activeTab, setActiveTab] = useState('charts'); // 'charts' | 'players' | 'trophies'
  const [selectedPlayerForTrend, setSelectedPlayerForTrend] = useState(null);
  const [selectedPlayerForTrophies, setSelectedPlayerForTrophies] = useState(null);

  if (!isOpen) return null;

  const stats = calculatePlayerStats(playersList, gamesHistory, activeGame);

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;
    onAddPlayer(newPlayerName.trim());
    setNewPlayerName('');
  };

  const handleViewPlayerTrend = (playerName) => {
    setSelectedPlayerForTrend(playerName);
    setActiveTab('charts');
  };

  const handleViewPlayerTrophies = (playerName) => {
    setSelectedPlayerForTrophies(playerName);
    setActiveTab('trophies');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl felt-card rounded-2xl border border-amber-500/40 p-4 sm:p-6 my-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Modal */}
        <div className="flex items-center justify-between pb-3 border-b border-emerald-700/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl gold-gradient flex items-center justify-center text-emerald-950 font-black shadow-md">
              <Users className="w-5 h-5 text-emerald-950" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white m-0">Partecipanti, Statistiche & Trofei</h2>
              <p className="text-xs text-emerald-300/80 m-0">Classifiche, obiettivi sbloccati e titoli onorifici</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-800/50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab di navigazione interna a 3 vie: Grafici vs Partecipanti vs Trofei */}
        <div className="mt-3 grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-emerald-950/70 border border-emerald-800/60">
          <button
            type="button"
            onClick={() => setActiveTab('charts')}
            className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'charts'
                ? 'bg-amber-400 text-emerald-950 shadow-md font-black'
                : 'text-emerald-300 hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span className="truncate">Grafici</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('players')}
            className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'players'
                ? 'bg-amber-400 text-emerald-950 shadow-md font-black'
                : 'text-emerald-300 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span className="truncate">Partecipanti ({stats.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('trophies')}
            className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'trophies'
                ? 'bg-amber-400 text-emerald-950 shadow-md font-black'
                : 'text-emerald-300 hover:text-white'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span className="truncate">Trofei & Titoli</span>
          </button>
        </div>

        {/* CONTENUTO PRINCIPALE */}
        <div className="my-4 max-h-[60vh] overflow-y-auto pr-1">
          {activeTab === 'charts' ? (
            /* SEZIONE GRAFICI */
            <StatsCharts
              stats={stats}
              selectedPlayerName={selectedPlayerForTrend}
              onSelectPlayer={setSelectedPlayerForTrend}
            />
          ) : activeTab === 'trophies' ? (
            /* SEZIONE BACHECA TROFEI & TITOLI */
            <TrophiesShowcase
              stats={stats}
              gamesHistory={gamesHistory}
              activeGame={activeGame}
              initialPlayerName={selectedPlayerForTrophies}
            />
          ) : (
            /* SEZIONE SCHEDE GIOCATORI */
            <div className="space-y-3">
              
              {/* Form Aggiungi Nuovo Giocatore */}
              <form onSubmit={handleAdd} className="flex gap-2 mb-3">
                <input
                  type="text"
                  placeholder="Aggiungi nuovo partecipante..."
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl bg-emerald-900/60 border border-emerald-700/60 text-white placeholder-emerald-400/50 text-xs sm:text-sm focus:outline-none focus:border-amber-400"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl gold-gradient hover:brightness-110 text-emerald-950 font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-md cursor-pointer shrink-0"
                >
                  <UserPlus className="w-4 h-4 text-emerald-950" />
                  <span>Aggiungi</span>
                </button>
              </form>

              {stats.length === 0 ? (
                <div className="text-center py-8 text-emerald-300/70 text-xs">
                  Nessun partecipante registrato. Aggiungi il primo giocatore sopra!
                </div>
              ) : (
                stats.map((p, index) => {
                  const titleInfo = getPlayerTitle(p);
                  return (
                    <div 
                      key={p.name}
                      className="p-3 sm:p-4 rounded-xl bg-emerald-950/70 border border-emerald-700/40 hover:border-amber-500/40 transition-all space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {/* Rank Badge */}
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm shrink-0 ${
                            index === 0 
                              ? 'gold-gradient text-emerald-950 shadow-md' 
                              : index === 1 
                              ? 'bg-slate-300 text-slate-900' 
                              : index === 2 
                              ? 'bg-amber-700 text-amber-100' 
                              : 'bg-emerald-900 text-emerald-300'
                          }`}>
                            {index === 0 ? <Trophy className="w-4 h-4" /> : `#${index + 1}`}
                          </div>

                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-base font-bold text-white m-0">{p.name}</h4>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-900/80 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                                <span>{titleInfo.icon}</span>
                                <span>{titleInfo.title}</span>
                              </span>
                              {index === 0 && p.gamesWon > 0 && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400/20 text-amber-300 border border-amber-400/40">
                                  Leader
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-emerald-300/80 flex items-center gap-2 mt-0.5">
                              <span>{p.gamesPlayed} partite ({p.gamesWon}V / {p.gamesLost}P)</span>
                              <span>•</span>
                              <span className="text-amber-300 font-semibold">{p.winRate}% vittorie</span>
                            </div>
                          </div>
                        </div>

                        {/* Azioni Giocatore */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleViewPlayerTrophies(p.name)}
                            className="px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                            title="Vedi bacheca trofei"
                          >
                            <Trophy className="w-3 h-3 text-amber-400" />
                            <span className="hidden sm:inline">Trofei</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleViewPlayerTrend(p.name)}
                            className="px-2 py-1 rounded-lg bg-emerald-900/80 hover:bg-emerald-800 text-emerald-300 border border-emerald-700/50 text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                            title="Vedi grafico andamento"
                          >
                            <TrendingUp className="w-3 h-3" />
                            <span className="hidden sm:inline">Grafico</span>
                          </button>
                          <button
                            onClick={() => onDeletePlayer(p.name)}
                            className="p-1.5 rounded-lg text-emerald-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                            title="Rimuovi giocatore dalla lista"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                    {/* Griglia Metriche Dettagliate */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-emerald-800/40 text-xs text-center">
                      <div className="p-1.5 rounded-lg bg-emerald-900/30">
                        <span className="text-[10px] text-emerald-400/80 block uppercase">Punti Totali</span>
                        <span className="font-extrabold text-white text-sm">
                          {p.totalPoints.toLocaleString('it-IT')}
                        </span>
                      </div>

                      <div className="p-1.5 rounded-lg bg-emerald-900/30">
                        <span className="text-[10px] text-emerald-400/80 block uppercase">Media / Mano</span>
                        <span className="font-extrabold text-amber-300 text-sm">
                          {p.avgPointsPerHand} pt
                        </span>
                      </div>

                      <div className="p-1.5 rounded-lg bg-emerald-900/30">
                        <span className="text-[10px] text-emerald-400/80 block uppercase">Record Mano</span>
                        <span className="font-extrabold text-amber-300 text-sm">
                          +{p.bestHandScore} pt
                        </span>
                      </div>

                      <div className="p-1.5 rounded-lg bg-emerald-900/30">
                        <span className="text-[10px] text-emerald-400/80 block uppercase">Burrachi Totali</span>
                        <span className="font-bold text-white text-xs">
                          {p.totalBurrachi} <span className="text-[10px] text-emerald-400 font-normal">({p.cleanBurrachi}P / {p.semiCleanBurrachi}S / {p.dirtyBurrachi}Imp)</span>
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-emerald-700/50 flex items-center justify-between text-xs">
          <span className="text-emerald-400/80">
            {stats.length} giocatori registrati
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl gold-gradient text-emerald-950 font-bold text-xs shadow-md transition-all cursor-pointer hover:brightness-110"
          >
            Chiudi
          </button>
        </div>

      </div>
    </div>
  );
}
