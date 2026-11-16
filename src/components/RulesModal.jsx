import React, { useState } from 'react';
import { X, BookOpen, Award, CheckCircle2, Sparkles } from 'lucide-react';
import { useModalEscape } from '../hooks/useModalEscape';

export default function RulesModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('scores'); // 'scores' | 'basics' | 'faq'
  useModalEscape(isOpen, onClose);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Regolamento ufficiale del Burraco"
    >
      <div
        className="relative w-full max-w-2xl felt-card rounded-2xl border border-amber-500/40 p-4 sm:p-6 my-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header Modal */}
        <div className="flex items-center justify-between pb-3 border-b border-emerald-700/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl gold-gradient flex items-center justify-center text-emerald-950 font-black shadow-md">
              <BookOpen className="w-5 h-5 text-emerald-950" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white m-0">Regolamento Ufficiale del Burraco</h2>
              <p className="text-xs text-emerald-300/80 m-0">Punteggi delle carte, tipi di burraco e regole al tavolo</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-800/50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selettori */}
        <div className="mt-3 flex items-center gap-1 p-1 rounded-xl bg-emerald-950/70 border border-emerald-800/60 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('scores')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'scores'
                ? 'bg-amber-400 text-emerald-950 shadow-md font-black'
                : 'text-emerald-300 hover:text-white'
            }`}
          >
            Valori Carte
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('trio')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'trio'
                ? 'bg-amber-400 text-emerald-950 shadow-md font-black'
                : 'text-emerald-300 hover:text-white'
            }`}
          >
            Burraco a 3 (FIBUR)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('basics')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'basics'
                ? 'bg-amber-400 text-emerald-950 shadow-md font-black'
                : 'text-emerald-300 hover:text-white'
            }`}
          >
            Regole Base
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('faq')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'faq'
                ? 'bg-amber-400 text-emerald-950 shadow-md font-black'
                : 'text-emerald-300 hover:text-white'
            }`}
          >
            FAQ
          </button>
        </div>

        {/* CONTENUTO */}
        <div className="my-4 max-h-[60vh] overflow-y-auto pr-1 space-y-4 text-xs sm:text-sm">
          
          {/* TAB 1: VALORE CARTE & BURRACHI */}
          {activeTab === 'scores' && (
            <div className="space-y-4">
              
              {/* Tabella Punti Onori / Burrachi */}
              <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-700/40 space-y-2.5">
                <span className="text-xs font-bold text-amber-300 uppercase tracking-wider block">
                  Onori & Punti Smazzata
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-emerald-900/50 border border-emerald-700/50 flex justify-between items-center">
                    <div>
                      <span className="font-bold text-white block">Burraco Pulito (Puro)</span>
                      <span className="text-[11px] text-emerald-400">7+ carte senza Jolly né Pinelle</span>
                    </div>
                    <span className="text-base font-black text-amber-300 shrink-0">+200 pt</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-emerald-900/50 border border-emerald-700/50 flex justify-between items-center">
                    <div>
                      <span className="font-bold text-white block">Burraco Semipulito</span>
                      <span className="text-[11px] text-emerald-400">8+ carte con 7 pure o matta in mezzo</span>
                    </div>
                    <span className="text-base font-black text-cyan-300 shrink-0">+150 pt</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-emerald-900/50 border border-emerald-700/50 flex justify-between items-center">
                    <div>
                      <span className="font-bold text-white block">Burraco Sporco (Impuro)</span>
                      <span className="text-[11px] text-emerald-400">7+ carte contenente un Jolly o Pinella</span>
                    </div>
                    <span className="text-base font-black text-orange-300 shrink-0">+100 pt</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-emerald-900/50 border border-emerald-700/50 flex justify-between items-center">
                    <div>
                      <span className="font-bold text-white block">Chiusura della Smazzata</span>
                      <span className="text-[11px] text-emerald-400">Scarto finale dopo il pozzetto</span>
                    </div>
                    <span className="text-base font-black text-amber-300 shrink-0">+100 pt</span>
                  </div>
                </div>

                {/* Penalità Pozzetto */}
                <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-800/40 text-xs text-rose-200 space-y-1">
                  <div className="flex justify-between items-center font-bold">
                    <span>Penalità Pozzetto non preso:</span>
                    <span className="text-sm font-black text-rose-400">-100 pt</span>
                  </div>
                  <div className="flex justify-between items-center font-bold">
                    <span>Penalità Pozzetto preso ma non giocato:</span>
                    <span className="text-sm font-black text-rose-400">-100 pt</span>
                  </div>
                </div>
              </div>

              {/* Valore Singole Carte */}
              <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-700/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-200 uppercase tracking-wider block">
                    Valore delle Singole Carte
                  </span>
                  <span className="text-[11px] text-emerald-400/80">
                    + se calate a terra • - se rimaste in mano
                  </span>
                </div>

                <div className="divide-y divide-emerald-800/40 text-xs">
                  <div className="py-2 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded bg-purple-900/80 text-purple-300 font-bold flex items-center justify-center text-xs">🃏</span>
                      <span className="font-semibold text-white">Jolly</span>
                    </div>
                    <span className="font-black text-purple-300 text-sm">30 punti</span>
                  </div>

                  <div className="py-2 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded bg-amber-900/80 text-amber-300 font-bold flex items-center justify-center text-xs">2</span>
                      <span className="font-semibold text-white">Pinelle (2 di qualsiasi seme)</span>
                    </div>
                    <span className="font-black text-amber-300 text-sm">20 punti</span>
                  </div>

                  <div className="py-2 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded bg-blue-900/80 text-blue-300 font-bold flex items-center justify-center text-xs">A</span>
                      <span className="font-semibold text-white">Assi (A)</span>
                    </div>
                    <span className="font-black text-blue-300 text-sm">15 punti</span>
                  </div>

                  <div className="py-2 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded bg-emerald-900/80 text-emerald-300 font-bold flex items-center justify-center text-xs">K</span>
                      <span className="font-semibold text-white">Figure & Carte Alte (8, 9, 10, J, Q, K)</span>
                    </div>
                    <span className="font-black text-emerald-300 text-sm">10 punti cad.</span>
                  </div>

                  <div className="py-2 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded bg-slate-800 text-slate-300 font-bold flex items-center justify-center text-xs">5</span>
                      <span className="font-semibold text-white">Carte Basse (3, 4, 5, 6, 7)</span>
                    </div>
                    <span className="font-black text-slate-300 text-sm">5 punti cad.</span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: BURRACO A 3 (FIBUR) */}
          {activeTab === 'trio' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-600/40 space-y-2">
                <h4 className="font-bold text-amber-300 text-xs sm:text-sm m-0 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Regolamento Ufficiale FIBUR (1 contro 2)</span>
                </h4>
                <p className="text-xs text-amber-100/90 leading-relaxed m-0">
                  Nel Burraco a 3 ciascuno compete per la classifica individuale, ma in ogni mano la dinamica è un <strong>1 contro 2</strong> decisa da chi va per primo a pozzetto.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-700/40 space-y-2">
                <h4 className="font-bold text-amber-300 text-xs sm:text-sm m-0 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  <span>1. I Due Pozzetti (18 e 11 Carte)</span>
                </h4>
                <ul className="list-disc pl-4 space-y-1.5 text-xs text-emerald-100">
                  <li>Si preparano <strong>due pozzetti disuguali</strong>: uno composto da <strong>18 carte</strong> e uno da <strong>11 carte</strong>.</li>
                  <li>Il pozzetto da 18 carte viene posizionato <strong>sopra</strong> quello da 11.</li>
                  <li>Ciascun giocatore inizia con la consueta mano di <strong>11 carte</strong>.</li>
                </ul>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-700/40 space-y-2">
                <h4 className="font-bold text-amber-300 text-xs sm:text-sm m-0 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  <span>2. Assegnazione Ruoli: Solitario vs Coppia</span>
                </h4>
                <ul className="list-disc pl-4 space-y-1.5 text-xs text-emerald-100">
                  <li><strong>Il primo giocatore</strong> che esaurisce le proprie carte prende il <strong>pozzetto da 18 carte</strong> e diventa il <strong>Solitario (18c)</strong>. Giocherà da solo per tutta la smazzata.</li>
                  <li><strong>Gli altri due giocatori</strong> diventano automaticamente <strong>compagni di Coppia</strong> per quella mano: mettono in comune i giochi a terra, legano le carte reciprocamente e prenderanno insieme l'altro pozzetto da <strong>11 carte</strong>.</li>
                </ul>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-700/40 space-y-2">
                <h4 className="font-bold text-amber-300 text-xs sm:text-sm m-0 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>3. Conteggio dei Punti a Fine Mano</span>
                </h4>
                <ul className="list-disc pl-4 space-y-1.5 text-xs text-emerald-100">
                  <li><strong>Punti Solitario</strong>: Il Solitario calcola e incassa il <strong>100% dei propri punti</strong> (burrachi, carte a terra, eventuale chiusura, meno carte in mano o mancato pozzetto).</li>
                  <li><strong>Punti Coppia (Divisi al 50%)</strong>: I punti realizzati sul tavolo della Coppia vengono conteggiati insieme (meno le carte rimaste in mano a ciascuno). Il totale complessivo viene <strong>diviso esattamente a metà (50%)</strong> e accreditato a ciascuno dei due compagni!</li>
                </ul>
                <div className="p-2 rounded-lg bg-emerald-900/60 border border-emerald-700/50 text-[11px] text-emerald-300">
                  💡 <em>L'app calcola e divide automaticamente i punti della coppia al centesimo con la modalità guidata!</em>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-700/40 space-y-2">
                <h4 className="font-bold text-amber-300 text-xs sm:text-sm m-0 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  <span>4. Traguardo di Vittoria</span>
                </h4>
                <p className="text-xs text-emerald-100 leading-relaxed m-0">
                  Secondo le regole federali FIBUR, la partita termina al raggiungimento dei <strong>2505 punti</strong> (impostati come predefiniti). In alternativa si può giocare a 1505 o 2005 punti. Vince chi totalizza il punteggio più alto.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: REGOLE DI GIOCO & CHIUSURA */}
          {activeTab === 'basics' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-700/40 space-y-2">
                <h4 className="font-bold text-amber-300 text-xs sm:text-sm m-0 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  <span>Distribuzione & Svolgimento</span>
                </h4>
                <ul className="list-disc pl-4 space-y-1.5 text-xs text-emerald-100">
                  <li>Si usano <strong>2 mazzi di carte francesi</strong> da 54 carte (compresi 4 Jolly).</li>
                  <li>Il mazziere distribuisce <strong>11 carte a ciascun giocatore</strong>.</li>
                  <li>L'altro giocatore prepara i <strong>due pozzetti</strong> da 11 carte ciascuno, mettendoli a croce uno sopra l'altro.</li>
                  <li>Le carte rimanenti formano il <strong>tallone</strong> (mazzo di pesca); la prima carta viene girata a faccia in su per iniziare il <strong>monte degli scarti</strong>.</li>
                </ul>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-700/40 space-y-2">
                <h4 className="font-bold text-amber-300 text-xs sm:text-sm m-0 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  <span>Combinazioni Valide & Matte</span>
                </h4>
                <ul className="list-disc pl-4 space-y-1.5 text-xs text-emerald-100">
                  <li><strong>Scale</strong>: sequenze di carte dello stesso seme in ordine crescente (es. 4-5-6 di Cuori). L'Asso può stare prima del 2 o dopo il Re.</li>
                  <li><strong>Combinazioni</strong>: 3 o più carte dello stesso valore ma di semi diversi (es. tre Re o quattro 7).</li>
                  <li><strong>Matte (Jolly e Pinelle)</strong>: in ogni combinazione o scala può essere presente al massimo <strong>1 sola matta</strong> (un Jolly o una Pinella).</li>
                  <li>Se la Pinella (2) è dello stesso seme della scala e si trova al suo posto naturale, conta come <strong>carta naturale</strong> e permette di aggiungere un'altra matta!</li>
                </ul>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-700/40 space-y-2">
                <h4 className="font-bold text-amber-300 text-xs sm:text-sm m-0 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  <span>I 4 Requisiti Indispensabili per Chiudere</span>
                </h4>
                <ol className="list-decimal pl-4 space-y-1 text-xs text-emerald-100">
                  <li>Aver preso il <strong>pozzetto</strong>.</li>
                  <li>Aver realizzato almeno <strong>un Burraco</strong> (almeno 7 carte).</li>
                  <li>Aver calato o legato tutte le carte che si hanno in mano.</li>
                  <li>Effettuare lo <strong>scarto finale</strong>: non è possibile chiudere senza scartare e <strong>lo scarto finale non può essere un Jolly o una Pinella</strong>.</li>
                </ol>
              </div>
            </div>
          )}

          {/* TAB 3: FAQ / DUBBI FREQUENTI */}
          {activeTab === 'faq' && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-700/40 space-y-1">
                <span className="font-bold text-amber-300 text-xs block">
                  D: Si può pescare solo una carta dal monte degli scarti?
                </span>
                <p className="text-xs text-emerald-200 m-0">
                  No, quando si decide di pescare dal monte degli scarti (il pozzetto aperto a terra) <strong>si è obbligati a prendere tutte le carte</strong> presenti nel monte.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-700/40 space-y-1">
                <span className="font-bold text-amber-300 text-xs block">
                  D: Differenza tra pozzetto "con scarto" e pozzetto "al volo / in diretta"?
                </span>
                <p className="text-xs text-emerald-200 m-0">
                  Se finisci le carte scartando l'ultima carta sul monte, prendi il pozzetto ma lo giocherai al tuo turno successivo. Se finisci le carte calandole tutte senza scarto, prendi il pozzetto <strong>in diretta</strong> e continui a giocare immediatamente nello stesso turno!
                </p>
              </div>

              <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-700/40 space-y-1">
                <span className="font-bold text-amber-300 text-xs block">
                  D: Si possono spostare o sostituire i Jolly o le Pinelle a terra?
                </span>
                <p className="text-xs text-emerald-200 m-0">
                  La matta non può mai essere ripresa in mano. Tuttavia, in una scala, se si possiede la carta naturale che la matta sostituisce, è possibile calare la carta naturale: la matta scivolerà all'estremità della scala.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-700/40 space-y-1">
                <span className="font-bold text-amber-300 text-xs block">
                  D: Cosa succede se finisce il mazzo di pesca (tallone)?
                </span>
                <p className="text-xs text-emerald-200 m-0">
                  Quando rimangono solo 2 carte nel tallone, la mano termina automaticamente. Nessuna squadra riceve il bonus chiusura (+100) e si procede al conteggio dei punti a terra detraendo le carte rimaste in mano.
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-emerald-700/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl gold-gradient text-emerald-950 font-bold text-xs shadow-md transition-all cursor-pointer hover:brightness-110"
          >
            Chiudi Regolamento
          </button>
        </div>

      </div>
    </div>
  );
}
