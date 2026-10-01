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
  Check, 
  Search,
  Sparkles
} from 'lucide-react';
import { exportBackupData, importBackupData } from '../utils/storage';
import { loadCloudGamesHistory } from '../services/firebase';

export default function HistoryModal({
  isOpen,
  onClose,
  gamesHistory,
  onResumeGame,
  onDeleteGame,
  onDataImported
}) {
  const [selectedGame, setSelectedGame] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncDone, setSyncDone] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      const cloudGames = await loadCloudGamesHistory();
      if (cloudGames && onDataImported) {
        onDataImported();
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
      const ok = importBackupData(event.target.result);
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

  // Filtro ricerca per giocatore o nome squadra
  const filteredGames = gamesHistory.filter(game => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const hayStack = [
      ...(game.team1?.players || []),
      ...(game.team2?.players || []),
      game.team1?.name || '',
      game.team2?.name || ''
    ].join(' ').toLowerCase();
    return hayStack.includes(q);
  });

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
                  ? `Match del ${new Date(selectedGame.createdAt).toLocaleDateString('it-IT')}` 
                  : `${gamesHistory.length} partite salvate permanentemente sul database`}
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
        {!selectedGame && gamesHistory.length > 0 && (
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

                {onResumeGame && (
                  <button
                    onClick={() => {
                      onResumeGame(selectedGame);
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-lg gold-gradient text-emerald-950 font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer hover:brightness-110"
                  >
                    <PlayCircle className="w-4 h-4 text-emerald-950" />
                    <span>Riprendi sul Tabellone</span>
                  </button>
                )}
              </div>

              {/* Box Vincitore & Risultato */}
              <div className="p-4 rounded-xl bg-emerald-950/80 border border-amber-500/30">
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className={`p-3 rounded-lg ${selectedGame.winner === 'team1' ? 'bg-amber-500/20 border border-amber-400' : 'bg-emerald-900/40'}`}>
                    <span className="text-xs font-bold text-amber-300 block">♦ {selectedGame.team1.name}</span>
                    <span className="text-[11px] text-emerald-400 block mb-1">
                      {selectedGame.team1.players.join(' & ')}
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
                    <span className="text-xs font-bold text-blue-300 block">♠ {selectedGame.team2.name}</span>
                    <span className="text-[11px] text-emerald-400 block mb-1">
                      {selectedGame.team2.players.join(' & ')}
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
              </div>

              {/* Tabella Mani della partita */}
              <div className="rounded-xl border border-emerald-700/40 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-emerald-950 text-emerald-300 uppercase text-[10px]">
                    <tr>
                      <th className="p-2 text-center">Mano</th>
                      <th className="p-2 text-amber-300">{selectedGame.team1.name}</th>
                      <th className="p-2 text-blue-300">{selectedGame.team2.name}</th>
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          ) : (
            /* LISTA PARTITE ARCHIVIATE */
            gamesHistory.length === 0 ? (
              <div className="text-center py-10 text-emerald-300/70 text-xs">
                Nessuna partita archiviata. Le partite completate appariranno automaticamente qui e saranno salvate nel Cloud.
              </div>
            ) : filteredGames.length === 0 ? (
              <div className="text-center py-8 text-emerald-400/80 text-xs">
                Nessuna partita trovata per "{searchQuery}".
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredGames.map(game => {
                  const t1Total = (game.rounds || []).reduce((acc, r) => acc + (r.team1Score || 0), 0);
                  const t2Total = (game.rounds || []).reduce((acc, r) => acc + (r.team2Score || 0), 0);
                  const winnerName = game.winner === 'team1' ? game.team1.name : game.winner === 'team2' ? game.team2.name : null;

                  return (
                    <div
                      key={game.id}
                      className="p-3 sm:p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-700/40 hover:border-amber-500/50 transition-all flex items-center justify-between gap-3 cursor-pointer group"
                      onClick={() => setSelectedGame(game)}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                            {game.team1.name} <span className="text-emerald-400 font-normal">vs</span> {game.team2.name}
                          </span>
                          {winnerName && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center gap-1">
                              <Trophy className="w-3 h-3 text-amber-400" />
                              <span>{winnerName}</span>
                            </span>
                          )}
                          <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-900/90 text-emerald-300 border border-emerald-700/50 flex items-center gap-0.5">
                            <Cloud className="w-2.5 h-2.5 text-emerald-400" />
                            <span>Cloud</span>
                          </span>
                        </div>
                        <div className="text-[11px] text-emerald-400/70 flex items-center gap-2">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(game.createdAt).toLocaleDateString('it-IT')}</span>
                          <span>•</span>
                          <span>{game.rounds?.length || 0} mani</span>
                          <span>•</span>
                          <span className="font-semibold text-emerald-200">{t1Total} - {t2Total} pt</span>
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
                  onClick={exportBackupData}
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
