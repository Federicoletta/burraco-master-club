import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Sparkles, RotateCcw, Home, Share2 } from 'lucide-react';
import { sound } from '../utils/soundEffects';

export default function VictoryModal({
  isOpen,
  onClose,
  activeGame,
  onRematch,
  onArchiveAndNew
}) {
  useEffect(() => {
    if (isOpen) {
      sound.playVictoryFanfare();
      // Spara i coriandoli!
      try {
        const count = 200;
        const defaults = {
          origin: { y: 0.7 }
        };

        function fire(particleRatio, opts) {
          confetti({
            ...defaults,
            ...opts,
            particleCount: Math.floor(count * particleRatio)
          });
        }

        fire(0.25, {
          spread: 26,
          startVelocity: 55,
        });
        fire(0.2, {
          spread: 60,
        });
        fire(0.35, {
          spread: 100,
          decay: 0.91,
          scalar: 0.8
        });
        fire(0.1, {
          spread: 120,
          startVelocity: 25,
          decay: 0.92,
          scalar: 1.2
        });
        fire(0.1, {
          spread: 120,
          startVelocity: 45,
        });
      } catch (err) {
        console.error('Confetti error', err);
      }
    }
  }, [isOpen]);

  if (!isOpen || !activeGame) return null;

  const t1Total = (activeGame.rounds || []).reduce((acc, r) => acc + (r.team1Score || 0), 0);
  const t2Total = (activeGame.rounds || []).reduce((acc, r) => acc + (r.team2Score || 0), 0);

  const isT1Winner = t1Total >= t2Total;
  const winnerTeam = isT1Winner ? activeGame.team1 : activeGame.team2;
  const loserTeam = isT1Winner ? activeGame.team2 : activeGame.team1;
  const winnerScore = isT1Winner ? t1Total : t2Total;
  const loserScore = isT1Winner ? t2Total : t1Total;
  const diff = winnerScore - loserScore;

  const handleShare = () => {
    const text = `🏆 Burraco: Vittoria di ${winnerTeam.name} (${winnerTeam.players.join(' & ')}) con ${winnerScore} pt contro ${loserTeam.name} (${loserScore} pt) in ${activeGame.rounds.length} mani! ♠️♥️♣️♦️`;
    if (navigator.share) {
      navigator.share({ title: 'Vittoria a Burraco!', text });
    } else {
      navigator.clipboard.writeText(text);
      alert('Resoconto vittoria copiato negli appunti!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-md felt-card rounded-3xl border-2 border-amber-400 p-6 my-4 shadow-2xl text-center animate-in zoom-in-90 duration-300">
        
        {/* Trofeo Fluttuante */}
        <div className="relative inline-block my-2">
          <div className="w-20 h-20 rounded-3xl gold-gradient flex items-center justify-center mx-auto shadow-2xl shadow-amber-500/50">
            <Trophy className="w-10 h-10 text-emerald-950" />
          </div>
          <Sparkles className="w-6 h-6 text-amber-300 absolute -top-2 -right-2 animate-pulse" />
        </div>

        <span className="text-xs font-black uppercase tracking-widest text-amber-400 block mt-2">
          Partita Conclusa!
        </span>
        <h2 className="text-2xl sm:text-3xl font-black text-white mt-1 mb-0">
          Vittoria per {winnerTeam.name}!
        </h2>

        <div className="my-2 text-sm text-emerald-200 font-medium">
          Complimenti a <strong className="text-amber-300">{winnerTeam.players.join(' & ')}</strong>
        </div>

        {/* Box Punteggio Finale */}
        <div className="my-4 p-4 rounded-2xl bg-emerald-950/90 border border-amber-400/40 shadow-inner">
          <div className="flex items-center justify-center gap-4 text-center">
            <div>
              <span className="text-xs font-bold text-amber-300 block">{winnerTeam.name}</span>
              <span className="text-3xl font-black text-white">{winnerScore.toLocaleString('it-IT')}</span>
              <span className="text-[10px] text-amber-400 font-bold block">VINCITORE</span>
            </div>
            <div className="text-emerald-500 font-bold text-xl">-</div>
            <div>
              <span className="text-xs font-bold text-slate-300 block">{loserTeam.name}</span>
              <span className="text-3xl font-black text-slate-300">{loserScore.toLocaleString('it-IT')}</span>
              <span className="text-[10px] text-slate-400 block">Distacco: -{diff} pt</span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-emerald-800/50 text-xs text-emerald-400/80">
            Obiettivo {activeGame.targetScore} pt raggiunto in {activeGame.rounds.length} mani
          </div>
        </div>

        {/* Azioni */}
        <div className="space-y-2.5">
          <button
            onClick={onRematch}
            className="w-full py-3 rounded-xl gold-gradient hover:brightness-110 text-emerald-950 font-black text-sm shadow-lg shadow-amber-900/40 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
          >
            <RotateCcw className="w-4 h-4 text-emerald-950" />
            <span>Rivincita (Stessi Giocatori)</span>
          </button>

          <button
            onClick={handleShare}
            className="w-full py-2.5 rounded-xl bg-emerald-800/80 hover:bg-emerald-700/80 text-emerald-100 font-bold text-xs sm:text-sm border border-emerald-600/40 flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <Share2 className="w-4 h-4 text-emerald-300" />
            <span>Condividi Vittoria</span>
          </button>

          <button
            onClick={onArchiveAndNew}
            className="w-full py-2.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 font-semibold text-xs border border-emerald-700/50 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>Archivia & Nuova Partita</span>
          </button>
        </div>

      </div>
    </div>
  );
}
