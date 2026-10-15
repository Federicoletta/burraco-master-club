import React from 'react';
import { X, LogIn, LogOut, User, Trophy, Flame, Award, Calendar, Mail, ShieldCheck } from 'lucide-react';

export default function UserProfileModal({
  isOpen,
  onClose,
  currentUser,
  onLogin,
  onLogout,
  gamesHistory = [],
  activeGame
}) {
  if (!isOpen) return null;

  // Calcola statistiche collegate a questo utente autenticato
  const userDisplayName = currentUser?.displayName || 'Giocatore Burraco';
  const userPhoto = currentUser?.photoURL;
  const userEmail = currentUser?.email;

  // Cerca partite in cui compare il nome dell'utente
  const userGames = gamesHistory.filter(game => {
    if (!game) return false;
    const t1 = game.team1?.players || [];
    const t2 = game.team2?.players || [];
    const t3 = game.team3?.players || [];
    const all = [...t1, ...t2, ...t3];
    return all.some(p => p.toLowerCase() === userDisplayName.toLowerCase());
  });

  const gamesCount = userGames.length;
  let wonCount = 0;
  let totalScore = 0;

  userGames.forEach(game => {
    const isT1 = (game.team1?.players || []).some(p => p.toLowerCase() === userDisplayName.toLowerCase());
    const isT2 = (game.team2?.players || []).some(p => p.toLowerCase() === userDisplayName.toLowerCase());
    const isT3 = (game.team3?.players || []).some(p => p.toLowerCase() === userDisplayName.toLowerCase());

    const t1Score = (game.rounds || []).reduce((acc, r) => acc + (r.team1Score || 0), 0);
    const t2Score = (game.rounds || []).reduce((acc, r) => acc + (r.team2Score || 0), 0);
    const t3Score = (game.rounds || []).reduce((acc, r) => acc + (r.team3Score || 0), 0);

    if (isT1) totalScore += t1Score;
    if (isT2) totalScore += t2Score;
    if (isT3) totalScore += t3Score;

    if (game.winner === 'team1' && isT1) wonCount++;
    else if (game.winner === 'team2' && isT2) wonCount++;
    else if (game.winner === 'team3' && isT3) wonCount++;
  });

  const winRate = gamesCount > 0 ? Math.round((wonCount / gamesCount) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-md felt-card rounded-2xl border border-amber-500/40 p-5 shadow-2xl space-y-4">
        
        {/* Intestazione */}
        <div className="flex items-center justify-between pb-3 border-b border-emerald-700/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gold-gradient flex items-center justify-center text-emerald-950 font-black shadow-md">
              <User className="w-4 h-4 text-emerald-950" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white m-0">Profilo Burraco Club</h2>
              <p className="text-[11px] text-emerald-300/80 m-0">Il tuo account e carriera personale</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-800/50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stato Utente: Loggato vs Non Loggato */}
        {currentUser ? (
          <div className="space-y-4">
            
            {/* Scheda Utente con Avatar Google */}
            <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-600/40 flex items-center gap-3.5 shadow-md">
              {userPhoto ? (
                <img 
                  src={userPhoto} 
                  alt={userDisplayName} 
                  className="w-14 h-14 rounded-full border-2 border-amber-400 shadow-md shrink-0 object-cover"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-emerald-900 border-2 border-amber-400 flex items-center justify-center text-amber-300 font-bold text-xl shrink-0 shadow-md">
                  {userDisplayName.slice(0, 1).toUpperCase()}
                </div>
              )}
              
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-base font-black text-white m-0 truncate">
                    {userDisplayName}
                  </h3>
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" title="Account Google Verificato" />
                </div>
                <p className="text-xs text-emerald-300/80 truncate flex items-center gap-1 mt-0.5">
                  <Mail className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span className="truncate">{userEmail}</span>
                </p>
                <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400/20 text-amber-300 border border-amber-400/40 mt-1.5">
                  Membro Ufficiale Club
                </span>
              </div>
            </div>

            {/* Statistiche Personali Rapide */}
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2.5 rounded-xl bg-emerald-950/70 border border-emerald-800/50 text-center">
                <span className="text-[10px] uppercase font-bold text-emerald-400/80 block">Partite</span>
                <span className="text-lg font-black text-white">{gamesCount}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-950/70 border border-emerald-800/50 text-center">
                <span className="text-[10px] uppercase font-bold text-emerald-400/80 block">Vittorie</span>
                <span className="text-lg font-black text-amber-300">{wonCount} <small className="text-xs font-normal">({winRate}%)</small></span>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-950/70 border border-emerald-800/50 text-center">
                <span className="text-[10px] uppercase font-bold text-emerald-400/80 block">Punti Totali</span>
                <span className="text-lg font-black text-emerald-200">{totalScore.toLocaleString('it-IT')}</span>
              </div>
            </div>

            {/* Informazioni su sincronizzazione amici */}
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 space-y-1">
              <span className="font-bold block flex items-center gap-1.5 text-amber-300">
                <span>⭐</span> Profilo sincronizzato su tutti i tuoi dispositivi
              </span>
              <p className="text-[11px] text-amber-200/80 m-0">
                Quando inizi una partita e inserisci il tuo nome (<strong>{userDisplayName}</strong>), i tuoi risultati rimarranno salvati nel tuo profilo personale per sempre!
              </p>
            </div>

            {/* Pulsante Logout */}
            <div className="pt-2 flex justify-between items-center border-t border-emerald-700/50">
              <button
                type="button"
                onClick={onLogout}
                className="px-3.5 py-2 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800/60 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Esci dall'Account</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200 text-xs font-semibold cursor-pointer"
              >
                Chiudi
              </button>
            </div>

          </div>
        ) : (
          /* Stato Utente Non Autenticato: Promozione Accesso Google */
          <div className="text-center py-4 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-900/80 border-2 border-amber-400/60 flex items-center justify-center mx-auto text-amber-300 shadow-xl">
              <User className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-base sm:text-lg font-black text-white mb-1">
                Collega il tuo Account Google
              </h3>
              <p className="text-xs text-emerald-300/80 max-w-xs mx-auto leading-relaxed">
                Accedi con un tocco per salvare la tua carriera personale a vita, sincronizzare le partite tra iPad e iPhone, e farti invitare ai tavoli degli amici.
              </p>
            </div>

            <button
              type="button"
              onClick={onLogin}
              className="w-full py-3 px-4 rounded-xl bg-white hover:bg-gray-100 text-zinc-900 font-bold text-sm shadow-xl flex items-center justify-center gap-3 cursor-pointer transition-all active:scale-98"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Continua con Google</span>
            </button>

            <p className="text-[11px] text-emerald-400/60 m-0">
              Nessuna password da ricordare • 100% gratuito e sicuro
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
