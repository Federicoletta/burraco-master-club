import React from 'react';
import { Trophy, Plus } from 'lucide-react';

export default function TournamentManageTab({
  teams = [],
  onFinishAndCelebrate,
  onStartNewTournament
}) {
  return (
    <div className="space-y-4">
      {/* SCHEDA SQUADRE ISCRITTE */}
      <div className="p-4 rounded-2xl bg-emerald-950/70 border border-emerald-700/40 space-y-3">
        <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider m-0">
          Coppie Iscritte al Torneo ({teams.length})
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {teams.map((team, idx) => (
            <div key={team.id} className="p-2.5 rounded-xl bg-emerald-900/40 border border-emerald-700/40 flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-white block">#{idx + 1} {team.name}</span>
                <span className="text-[11px] text-emerald-300/80">{(team.players || []).join(' & ')}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AZIONI CONCLUSIONE O NUOVO TORNEO */}
      <div className="p-4 rounded-2xl bg-emerald-950/70 border border-amber-500/40 space-y-3">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider m-0">
          Conclusione e Premiazione
        </h3>
        <p className="text-xs text-emerald-300/80 m-0">
          Quando tutti gli incontri sono terminati, puoi dichiarare il torneo concluso. Verrà incoronata la coppia campione e il torneo verrà archiviato.
        </p>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            type="button"
            onClick={onFinishAndCelebrate}
            className="px-4 py-2.5 rounded-xl gold-gradient text-emerald-950 font-black text-xs sm:text-sm shadow-md hover:brightness-110 active:scale-95 cursor-pointer flex items-center gap-2"
          >
            <Trophy className="w-4 h-4 text-emerald-950" />
            <span>Concludi Torneo & Premiazione 🎊</span>
          </button>

          <button
            type="button"
            onClick={onStartNewTournament}
            className="px-3.5 py-2 rounded-xl bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200 border border-emerald-600/40 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Crea un Altro Torneo</span>
          </button>
        </div>
      </div>
    </div>
  );
}
