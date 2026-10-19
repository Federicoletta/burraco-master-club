import React, { useState, useRef } from 'react';
import { 
  X, 
  History, 
  Trophy, 
  Calendar, 
  ChevronRight, 
  Trash2, 
  ArrowLeft, 
  PlayCircle, 
  Download, 
  Upload, 
  Cloud, 
  RefreshCw, 
  Search,
  Edit2,
  PlusCircle
} from 'lucide-react';
import { exportBackupData, importBackupData, getGamesHistory, getHistoryKey } from '../utils/storage';
import { loadCloudGamesHistory } from '../services/firebase';

const formatDate = (dateVal) => {
  if (!dateVal) return 'Oggi';
  try {
    const d = dateVal?.toDate ? dateVal.toDate() : new Date(dateVal);
    return isNaN(d.getTime()) ? 'Data recente' : d.toLocaleDateString('it-IT');
  } catch {
    return 'Data recente';
  }
};

export default function HistoryModal({
  isOpen,
  onClose,
  gamesHistory = [],
  activeGame,
  currentUser = null,
  onEndGame,
  onResumeGame,
  onDeleteGame,
  onDataImported,
  onAddRound,
  onEditRound
}) {
  const [selectedGame, setSelectedGame] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncDone, setSyncDone] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const fileInputRef = useRef(null);

  // Unisci la partita attiva corrente (se ha mani giocate) per renderla sempre visibile
  const allDisplayGames = React.useMemo(() => {
    const list = Array.isArray(gamesHistory) ? [...gamesHistory] : [];
    if (activeGame && activeGame.rounds && activeGame.rounds.length > 0) {
      const idx = list.findIndex(g => g.id === activeGame.id);
      if (idx >= 0) {
        list[idx] = { ...activeGame };
      } else {
        list.unshift({ ...activeGame });
      }
    }
    return list;
  }, [gamesHistory, activeGame]);

  // Filtro ricerca per giocatore o nome squadra
  const filteredGames = React.useMemo(() => {
    return allDisplayGames.filter(game => {
      if (!game) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const hayStack = [
        ...(game.team1?.players || []),
        ...(game.team2?.players || []),
        ...(game.team3?.players || []),
        game.team1?.name || '',
        game.team2?.name || '',
        game.team3?.name || ''
      ].join(' ').toLowerCase();
      return hayStack.includes(q);
    });
  }, [allDisplayGames, searchQuery]);

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      const cloudGames = await loadCloudGamesHistory(currentUser);
      if (Array.isArray(cloudGames)) {
        const userKey = currentUser ? currentUser.uid : 'guest';
        const localGames = getGamesHistory(userKey);
        const map = new Map();
        localGames.forEach(g => { if (g && g.id) map.set(g.id, g); });
        cloudGames.forEach(g => { if (g && g.id) map.set(g.id, g); });
        const merged = Array.from(map.values()).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

        localStorage.setItem(getHistoryKey(userKey), JSON.stringify(merged));
        if (onDataImported) {
          onDataImported(merged);
        }
      }
      setSyncDone(true);
      setTimeout(() => setSyncDone(false), 2500);
    } catch (err) {
      console.warn('Errore sync:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const userKey = currentUser ? currentUser.uid : 'guest';
      const ok = importBackupData(event.target.result, userKey);
      if (ok) {
        alert('Dati ripristinati con successo!');
        if (onDataImported) onDataImported();
      } else {
        alert('Errore: formato file non valido.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Tutte le hook sono state eseguite: ora possiamo fare il return anticipato se modale chiusa
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl felt-card rounded-2xl border border-amber-500/40 p-4 sm:p-6 my-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Modal */}
        <div className="flex items-center justify-between pb-3 border-b border-emerald-700/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl gold-gradient flex items-center justify-center text-emerald-950 font-black shadow-md">
              <History className="w-5 h-5 text-emerald-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-white m-0">
                  {selectedGame ? 'Dettaglio Partita' : 'Archivio Partite Cloud'}
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-900/90 text-emerald-300 border border-emerald-600/40">
                  <Cloud className="w-3 h-3 text-emerald-400" />
                  <span>Sincronizzato Online</span>
                </span>
              </div>
              <p className="text-xs text-emerald-300/80 m-0">
                {selectedGame 
                  ? `Match del ${formatDate(selectedGame.createdAt)}` 
                  : `${allDisplayGames.length} partite salvate permanentemente sul database`}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-800/50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra di Ricerca per Giocatore (solo nella vista lista) */}
        {!selectedGame && allDisplayGames.length > 0 && (
          <div className="mt-3 relative">
            <Search className="w-4 h-4 text-emerald-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Cerca per giocatore o squadra (es: Marco)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-emerald-950/70 border border-emerald-700/50 text-white placeholder-emerald-400/50 text-xs focus:outline-none focus:border-amber-400"
            />
          </div>
        )}

        {/* CONTENUTO */}
        <div className="my-4 max-h-[55vh] overflow-y-auto pr-1">
          {selectedGame ? (
            /* DETTAGLIO PARTITA SINGOLA */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setSelectedGame(null)}
                  className="text-xs text-amber-300 hover:text-white flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Torna all'archivio</span>
                </button>

                <div className="flex items-center gap-2">
                  {onEndGame && !selectedGame.isFinished && (
                    <button
                      onClick={() => {
                        if (activeGame && activeGame.id === selectedGame.id) {
                          onEndGame();
                          onClose();
                        } else if (onResumeGame) {
                          onResumeGame(selectedGame);
                          setTimeout(() => onEndGame(), 100);
                          onClose();
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 border border-emerald-600/50 text-white font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-colors"
                      title="Assegna vittoria e archivia ufficialmente"
                    >
                      <span>🏁 Concludi Ora</span>
                    </button>
                  )}

                  {onResumeGame && (
                    <button
                      onClick={() => {
                        onResumeGame(selectedGame);
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-lg gold-gradient text-emerald-950 font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer hover:brightness-110"
                    >
                      <PlayCircle className="w-4 h-4 text-emerald-950" />
                      <span>{selectedGame.id === activeGame?.id ? 'Torna al Tabellone' : 'Riprendi sul Tabellone'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Banner Partita in corso / in sospeso */}
              {!selectedGame.isFinished && (
                <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    <span>Partita in corso ({selectedGame.rounds?.length || 0} mani registrate)</span>
                  </span>
                  <span className="text-[11px] text-emerald-300">Traguardo: {selectedGame.targetScore || 2505} pt</span>
                </div>
              )}

              {/* Box Vincitore & Risultato */}
              <div className="p-4 rounded-xl bg-emerald-950/80 border border-amber-500/30">
                {selectedGame?.mode === 'trio' ? (
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className={`p-2.5 rounded-lg ${selectedGame.winner === 'team1' ? 'bg-amber-500/20 border border-amber-400' : 'bg-emerald-900/40'}`}>
                      <span className="text-xs font-bold text-amber-300 block truncate">♦ {selectedGame.team1?.name || 'G1'}</span>
                      <span className="text-[10px] text-emerald-400 block mb-1 truncate">
                        {(selectedGame.team1?.players || []).join(' & ') || 'Giocatore'}
                      </span>
                      <span className="text-xl sm:text-2xl font-black text-white">
                        {(selectedGame.rounds || []).reduce((acc, r) => acc + (r.team1Score || 0), 0)} pt
                      </span>
                      {selectedGame.winner === 'team1' && (
                        <span className="mt-1 inline-block px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-400 text-emerald-950 uppercase">
                          Vincitore 🏆
                        </span>
                      )}
                    </div>

                    <div className={`p-2.5 rounded-lg ${selectedGame.winner === 'team2' ? 'bg-blue-500/20 border border-blue-400' : 'bg-emerald-900/40'}`}>
                      <span className="text-xs font-bold text-blue-300 block truncate">♠ {selectedGame.team2?.name || 'G2'}</span>
                      <span className="text-[10px] text-emerald-400 block mb-1 truncate">
                        {(selectedGame.team2?.players || []).join(' & ') || 'Giocatore'}
                      </span>
                      <span className="text-xl sm:text-2xl font-black text-white">
                        {(selectedGame.rounds || []).reduce((acc, r) => acc + (r.team2Score || 0), 0)} pt
                      </span>
                      {selectedGame.winner === 'team2' && (
                        <span className="mt-1 inline-block px-2 py-0.5 rounded-full text-[9px] font-black bg-blue-400 text-emerald-950 uppercase">
                          Vincitore 🏆
                        </span>
                      )}
                    </div>

                    <div className={`p-2.5 rounded-lg ${selectedGame.winner === 'team3' ? 'bg-rose-500/20 border border-rose-400' : 'bg-emerald-900/40'}`}>
                      <span className="text-xs font-bold text-rose-300 block truncate">♥ {selectedGame.team3?.name || 'G3'}</span>
                      <span className="text-[10px] text-emerald-400 block mb-1 truncate">
                        {(selectedGame.team3?.players || []).join(' & ') || 'Giocatore'}
                      </span>
                      <span className="text-xl sm:text-2xl font-black text-white">
                        {(selectedGame.rounds || []).reduce((acc, r) => acc + (r.team3Score || 0), 0)} pt
                      </span>
                      {selectedGame.winner === 'team3' && (
                        <span className="mt-1 inline-block px-2 py-0.5 rounded-full text-[9px] font-black bg-rose-400 text-slate-950 uppercase">
                          Vincitore 🏆
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className={`p-3 rounded-lg ${selectedGame.winner === 'team1' ? 'bg-amber-500/20 border border-amber-400' : 'bg-emerald-900/40'}`}>
                      <span className="text-xs font-bold text-amber-300 block">♦ {selectedGame.team1?.name || 'Squadra 1'}</span>
                      <span className="text-[11px] text-emerald-400 block mb-1">
                        {(selectedGame.team1?.players || []).join(' & ') || 'Giocatori'}
                      </span>
                      <span className="text-2xl font-black text-white">
                        {(selectedGame.rounds || []).reduce((acc, r) => acc + (r.team1Score || 0), 0)} pt
                      </span>
                      {selectedGame.winner === 'team1' && (
                        <span className="mt-1 inline-block px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-emerald-950 uppercase">
                          Vincitore 🏆
                        </span>
                      )}
                    </div>

                    <div className={`p-3 rounded-lg ${selectedGame.winner === 'team2' ? 'bg-blue-500/20 border border-blue-400' : 'bg-emerald-900/40'}`}>
                      <span className="text-xs font-bold text-blue-300 block">♠ {selectedGame.team2?.name || 'Squadra 2'}</span>
                      <span className="text-[11px] text-emerald-400 block mb-1">
                        {(selectedGame.team2?.players || []).join(' & ') || 'Giocatori'}
                      </span>
                      <span className="text-2xl font-black text-white">
                        {(selectedGame.rounds || []).reduce((acc, r) => acc + (r.team2Score || 0), 0)} pt
                      </span>
                      {selectedGame.winner === 'team2' && (
                        <span className="mt-1 inline-block px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-400 text-emerald-950 uppercase">
                          Vincitore 🏆
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Tabella Mani della partita */}
              <div className="rounded-xl border border-emerald-700/40 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-emerald-950 text-emerald-300 uppercase text-[10px]">
                    <tr>
                      <th className="p-2 text-center">Mano</th>
                      <th className="p-2 text-amber-300">{selectedGame.team1?.name || 'Squadra 1'}</th>
                      <th className="p-2 text-blue-300">{selectedGame.team2?.name || 'Squadra 2'}</th>
                      {selectedGame?.mode === 'trio' && (
                        <th className="p-2 text-rose-300">{selectedGame.team3?.name || 'Giocatore 3'}</th>
                      )}
                      {onEditRound && onResumeGame && (
                        <th className="p-2 text-center w-14">Azione</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-800/40">
                    {(selectedGame.rounds || []).map(r => (
                      <tr key={r.roundNumber} className="hover:bg-emerald-900/30">
                        <td className="p-2 text-center font-bold text-emerald-300">#{r.roundNumber}</td>
                        <td className="p-2 font-semibold text-white">
                          {r.team1Score >= 0 ? `+${r.team1Score}` : r.team1Score}
                        </td>
                        <td className="p-2 font-semibold text-white">
                          {r.team2Score >= 0 ? `+${r.team2Score}` : r.team2Score}
                        </td>
                        {selectedGame?.mode === 'trio' && (
                          <td className="p-2 font-semibold text-white">
                            {(r.team3Score || 0) >= 0 ? `+${r.team3Score || 0}` : r.team3Score}
                          </td>
                        )}
                        {onEditRound && onResumeGame && (
                          <td className="p-2 text-center">
                            <button
                              onClick={() => {
                                onResumeGame(selectedGame);
                                onEditRound(r);
                                onClose();
                              }}
                              className="p-1 rounded bg-emerald-800/60 hover:bg-emerald-700 text-amber-300 hover:text-amber-200 transition-colors cursor-pointer"
                              title={`Modifica mano #${r.roundNumber}`}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Azioni rapide per la partita selezionata (Aggiungi mano / Modifica) */}
              {onAddRound && onResumeGame && (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      onResumeGame(selectedGame);
                      onAddRound();
                      onClose();
                    }}
                    className="flex-1 py-2.5 rounded-xl gold-gradient text-emerald-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md hover:brightness-110 active:scale-98 cursor-pointer transition-all"
                  >
                    <PlusCircle className="w-4 h-4 text-emerald-950" />
                    <span>+ Aggiungi Mano a questa Partita</span>
                  </button>
                </div>
              )}

            </div>
          ) : (
            /* LISTA PARTITE */
            allDisplayGames.length === 0 ? (
              <div className="text-center py-10 text-emerald-300/70 text-xs">
                Nessuna partita trovata. Le partite con almeno una mano giocata appariranno automaticamente qui e saranno salvate nel Cloud.
              </div>
            ) : filteredGames.length === 0 ? (
              <div className="text-center py-8 text-emerald-400/80 text-xs">
                Nessuna partita trovata per "{searchQuery}".
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredGames.map(game => {
                  const isGameTrio = game?.mode === 'trio';
                  const t1Total = (game.rounds || []).reduce((acc, r) => acc + (r.team1Score || 0), 0);
                  const t2Total = (game.rounds || []).reduce((acc, r) => acc + (r.team2Score || 0), 0);
                  const t3Total = (game.rounds || []).reduce((acc, r) => acc + (r.team3Score || 0), 0);
                  const winnerName = game.winner === 'team1' 
                    ? (game.team1?.name || 'Squadra 1') 
                    : game.winner === 'team2' 
                    ? (game.team2?.name || 'Squadra 2') 
                    : game.winner === 'team3' 
                    ? (game.team3?.name || 'Giocatore 3') 
                    : null;
                  const isActiveNow = activeGame && activeGame.id === game.id;
                  const isOngoing = !game.isFinished;

                  return (
                    <div
                      key={game.id}
                      className={`p-3 sm:p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 cursor-pointer group ${
                        isActiveNow 
                          ? 'bg-emerald-950/90 border-amber-400/60 shadow-[0_0_15px_rgba(251,191,36,0.15)] ring-1 ring-amber-400/30' 
                          : 'bg-emerald-950/70 border-emerald-700/40 hover:border-amber-500/50'
                      }`}
                      onClick={() => setSelectedGame(game)}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                            {game.team1?.name || 'Squadra 1'} <span className="text-emerald-400 font-normal">vs</span> {game.team2?.name || 'Squadra 2'}
                            {isGameTrio && (
                              <>
                                {' '}<span className="text-emerald-400 font-normal">vs</span>{' '}
                                {game.team3?.name || 'Giocatore 3'}
                              </>
                            )}
                          </span>

                          {/* Badge Stato Partita */}
                          {isActiveNow ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              <span>Sul Tabellone</span>
                            </span>
                          ) : isOngoing ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                              <span>⏳ In Sospeso</span>
                            </span>
                          ) : winnerName ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center gap-1">
                              <Trophy className="w-3 h-3 text-amber-400" />
                              <span>{winnerName}</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-800/60 text-emerald-200 border border-emerald-600/40">
                              Conclusa
                            </span>
                          )}

                          <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-900/90 text-emerald-300 border border-emerald-700/50 flex items-center gap-0.5">
                            <Cloud className="w-2.5 h-2.5 text-emerald-400" />
                            <span>Cloud</span>
                          </span>
                        </div>
                        <div className="text-[11px] text-emerald-400/70 flex items-center gap-2">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(game.createdAt)}</span>
                          <span>•</span>
                          <span>{game.rounds?.length || 0} mani</span>
                          <span>•</span>
                          <span className="font-semibold text-emerald-200">
                            {isGameTrio ? `${t1Total} - ${t2Total} - ${t3Total} pt` : `${t1Total} - ${t2Total} pt`}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onDeleteGame(game.id)}
                          className="p-2 rounded-lg text-emerald-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                          title="Elimina dal Cloud e dallo Storico"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setSelectedGame(game)}
                          className="p-2 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-800 transition-colors cursor-pointer"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>

        {/* Footer Cloud Integrato (Zero necessità di file JSON manuali) */}
        <div className="mt-4 pt-3 border-t border-emerald-700/50 space-y-2">
          
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5">
            {/* Box Stato Cloud Automatico */}
            <div className="flex items-center gap-2 text-xs w-full sm:w-auto">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <div>
                <span className="text-white font-bold block">Archivio Cloud Permanente</span>
                <span className="text-[10px] text-emerald-300/80">Tutte le partite sono salvate online su Firestore</span>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={handleManualSync}
                disabled={isSyncing}
                className="px-3 py-1.5 rounded-lg bg-emerald-900/90 hover:bg-emerald-800 text-emerald-200 border border-emerald-600/40 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all"
                title="Ricarica le partite salvate sul cloud"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{syncDone ? 'Aggiornato!' : isSyncing ? 'Sincronizzazione...' : 'Sincronizza Cloud'}</span>
              </button>

              <button
                onClick={onClose}
                className="px-4 py-1.5 rounded-xl gold-gradient text-emerald-950 font-bold text-xs shadow-md transition-all cursor-pointer hover:brightness-110"
              >
                Chiudi
              </button>
            </div>
          </div>

          {/* Toggle Opzioni Avanzate Backup File (discreto, in secondo piano) */}
          <div className="pt-1 text-center">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-[10px] text-emerald-400/60 hover:text-emerald-300 underline cursor-pointer"
            >
              {showAdvanced ? 'Nascondi opzioni file offline' : 'Opzioni avanzate (Backup file JSON offline)'}
            </button>

            {showAdvanced && (
              <div className="mt-2 p-2 rounded-lg bg-emerald-950/50 border border-emerald-800/40 flex items-center justify-center gap-2 animate-in fade-in duration-150">
                <button
                  onClick={() => exportBackupData(currentUser ? currentUser.uid : 'guest')}
                  className="px-2.5 py-1 rounded bg-emerald-900/60 hover:bg-emerald-800 text-[11px] text-emerald-300 border border-emerald-700/50 flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3 h-3 text-amber-400" />
                  <span>Scarica File JSON</span>
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1 rounded bg-emerald-900/60 hover:bg-emerald-800 text-[11px] text-emerald-300 border border-emerald-700/50 flex items-center gap-1 cursor-pointer"
                >
                  <Upload className="w-3 h-3 text-amber-400" />
                  <span>Carica File JSON</span>
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  accept=".json" 
                  className="hidden" 
                />
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
