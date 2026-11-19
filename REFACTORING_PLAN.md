# Piano di Audit e Ristrutturazione — Burraco Master Club

> **Stato documento**: Analisi tecnica e progettazione completata con vincoli operativi integrati (nessun file di codice modificato).  
> **Obiettivo**: Evolvere l'architettura, l'affidabilità dei dati, le performance, l'ergonomia mobile, l'accessibilità e la conformità PWA di **Burraco Master Club**, preservando l'identità visiva da circolo elegante (feltro, tipografia *Playfair Display* / *Plus Jakarta Sans* / *JetBrains Mono*, layout mobile-first).

---

## Decisioni Architetturali, di Prodotto e Vincoli Operativi Confermati

| Area | Decisione / Vincolo Confermato | Motivazione |
| :--- | :--- | :--- |
| **Sincronizzazione / CRDT** | **Semplifica con sync per-mano via `roundId` stabile** | Elimina la catena hash `ledgerChain` (e il relativo bug di troncamento a 200 blocchi / replay su eliminazioni intermedie) a favore di una riconciliazione deterministica per-mano (`roundId` + `updatedAt` + `deletedRoundIds` tombstone) molto più robusta e leggera su Firestore. |
| **Retrocompatibilità & Firestore Rules** | **Supporto nativo documenti legacy + avviso esplicito deploy rules** | Gestione zero-errori di documenti preesistenti privi di `roundId`, `deletedRoundIds` o `suspendedAt` e con `ledgerChain` ancora presente. Segnalazione chiara e immediata del comando `firebase deploy --only firestore:rules` al termine della Fase 2 (oltre al deploy automatico su progetto AI Studio se previsto). |
| **Partita incompleta su nuova partita** | **Sospendi in archivio come "In corso" riprendibile** | Avviare una nuova partita (o un match di torneo) mentre un'altra è aperta con `rounds.length > 0` salva la precedente come sospesa (`isFinished: false, tableClosed: true, suspendedAt`), riprendibile dallo Storico senza falsare vittorie/sconfitte nelle statistiche carriera. |
| **Cloud, Banda & Audio MP3** | **`preload="none"` su MP3 + cleanup rigoroso listener Firestore** | Gli MP3 (~42 MB in `public/audio/`) non vengono mai scaricati finché l'utente non avvia la musica (`audio.preload = 'none'`); audit e cleanup garantito di tutti gli `onSnapshot` su logout, cambio tavolo e unmount. |
| **Login Google su iOS PWA** | **Popup primario + fallback `signInWithRedirect` in standalone iOS** | Mantiene `signInWithPopup` come flusso principale (necessario su desktop e preview iframe) e attiva il fallback affidabile `signInWithRedirect` + `getRedirectResult()` su iPhone/iPad PWA standalone quando WebKit blocca i popup OAuth. |
| **5° Tema Chiaro (Diurno/Esterno)** | **Circolo Diurno — Avorio & Verde Bosco** | Canvas caldo avorio pergamenato (`#F5F1E6`), card bianche nitide, inchiostro verde bosco scuro (`#0D281E`) e accenti oro antico scuro ad alto contrasto (WCAG AAA) per uso all'aperto sotto luce solare. **Vincolo**: `text-white` NON viene mai rimosso da pulsanti pieni, badge, avatar o toast. |
| **Guard-rail Calcolatore Guidato** | **Avvisi non bloccanti con correzione rapida 1-tap** | Segnala anomalie regolamentari in tempo reale (chiusura con carte in mano > 0, 0 burrachi o penalità pozzetto, nessuna chiusura, valori non multipli di 5) con pulsante 1-tap, lasciando sempre libero il salvataggio. |
| **Ergonomia Mobile Universale** | **16px input, `inputMode="numeric"`, zero overflow 360px, overscroll contain** | Previene auto-zoom su iOS Safari (`font-size >= 16px` su tutti gli input), forza tastierino numerico con `inputMode="numeric"`, garantisce 0 overflow orizzontale su viewport da `360px` e `overscroll-behavior-y: contain` nelle modali. |
| **Aggiornamento PWA** | **Banner/avviso esplicito di nuova versione con reload pulito** | Quando viene deployata una nuova versione dell'app (rilevata dal Service Worker e/o `/version.json`), mostra un avviso chiaro e non invasivo con pulsante 1-tap per ricaricare pulitamente la sessione. |

---

## 1. Architettura & Modularità

### 1.1 Scomposizione di `src/hooks/useBurracoGame.js` (~973 righe)

**Diagnosi attuale**  
`src/hooks/useBurracoGame.js` concentra 10 responsabilità eterogenee in un unico monolite da 973 righe con 8 `useRef` di sincronizzazione manuale (`currentUserRef`, `friendsListRef`, `activeTournamentRef`, `allTournamentsRef`, `handleUpdateTournamentRef`, `updateTournamentByIdRef`, `onCelebrateRef`, `activeGameRef`) e un `useMemo` finale con 24 dipendenze. Inoltre duplica il codice di sincronizzazione dei match di torneo tra `handleSaveRound` (righe 275–312) e `handleEndGame` (righe 498–532), dimenticando di riallineare il match di torneo quando si annulla una mano (`handleDeleteLastRound` / `handleDeleteRound`).

**Architettura proposta (4 moduli coesi + facade snella)**

```text
src/hooks/
├── useBurracoGame.js              (~140 righe — facade di composizione + stato condiviso)
├── useLatestRef.js                (~12 righe — helper sincronizzazione ref senza boilerplate)
└── game/
    ├── useGameLifecycle.js        (~230 righe — start, suspend/archive, rematch, resume, close, leave, end, challenge)
    ├── useRoundMutations.js       (~190 righe — saveRound, deleteLastRound, deleteRound, updateTeams + roundId/tombstone)
    ├── useTournamentSyncBridge.js (~110 righe — helper unico sync match torneo su save/delete/end + playTournamentMatch)
    └── useGameHistoryAndShare.js  (~120 righe — deleteHistory, dataImported, manualSave, shareGame, recentPlayers)
```

- **Contratto retrocompatibile**: `useBurracoGame()` continua a esporre la stessa API esterna, consentendo una migrazione incrementale a zero rotture per `GameContext` e i test esistenti.
- **Unificazione sync torneo**: `syncGameToTournamentMatch(game, totals, statusOverride)` gestisce in un solo punto l'aggiornamento di `team1Score`, `team2Score`, `status` (`in_progress` / `completed`) e `winnerId` su `saveRound`, `deleteLastRound`, `deleteRound` e `endGame`.

| Campo | Dettaglio |
| :--- | :--- |
| **File coinvolti** | `src/hooks/useBurracoGame.js`, nuovi `src/hooks/useLatestRef.js`, `src/hooks/game/useGameLifecycle.js`, `src/hooks/game/useRoundMutations.js`, `src/hooks/game/useTournamentSyncBridge.js`, `src/hooks/game/useGameHistoryAndShare.js`, `src/utils/gameHelpers.js` |
| **Rischio di regressione** | **Medio** — tocca tutti i flussi core della partita, mitigabile mantenendo l'interfaccia pubblica di `useBurracoGame` invariata e spostando un sub-hook per volta. |
| **Test Vitest** | Aggiungere `tests/game_mutations.test.js` (test isolati per `useRoundMutations` + sincronizzazione torneo su aggiunta, modifica ed eliminazione mano) e aggiornare `tests/lifecycle.test.js`. |

---

### 1.2 Pulizia Codice Morto, Duplicazioni e Asset Residui

**Diagnosi attuale**
1. **`public/assets/aistudio/` (17 screenshot PNG — 6,3 MB)**: residui di allegati di chat mai referenziati dal codice sorgente. `vite.config.js` li elimina solo a fine build (`closeBundle`), ma appesantiscono repository, dev server e rischio precache SW.
2. **Chiave fantasma `sessionStorage('burraco_table_closed_explicitly')`**: scritta in `useBurracoGame.js` (righe 657, 691) e `useGameCloudListeners.js` (riga 164), rimossa in `useBurracoGame.js` (righe 140, 743), **mai letta da nessuna parte** nell'intera codebase.
3. **Stato morto `isTournamentOpen` / `setIsTournamentOpen`**: dichiarato ed esposto in `src/hooks/useTournament.js` (righe 42, 410, 426), mai consumato da quando Torneo è una vista tab della bottom-nav.
4. **Duplicazione `computeTeamTotalsAndWinner` vs `checkGameCompletion`**: la logica di calcolo totali/target/vincitore è duplicata tra `src/utils/gameHelpers.js` e `src/utils/ledger.js` (che viene dismesso in §1.3).
5. **Duplicazione shell modali (17 dialoghi `role="dialog"`)**: backdrop, click-outside, handle bottom-sheet, Escape, `overscroll-behavior-y: contain` e focus-trap sono replicati in 17 componenti diversi. Introdurre un componente base `src/components/ui/ModalShell.jsx` (e hook `useModalDialog`) riduce ~300 righe duplicate e centralizza accessibilità e animazioni.
6. **Pulizia `vite.config.js`**: rimuovere il workaround `rmSync('dist/assets/aistudio')` una volta svuotata la directory `public/assets/aistudio/`.
7. **Audit audio MP3 non referenziati**: in `public/audio/` sono presenti 7 file MP3 (~42 MB), di cui 2 (`lounge-vibes.mp3` 6,2 MB e `soft-piano.mp3` 7,4 MB) non figurano in `MUSIC_TRACKS` (`src/utils/backgroundMusic.js`); verranno segnalati/puliti in coordinamento con l'ottimizzazione `preload="none"` in §2.3.

| Campo | Dettaglio |
| :--- | :--- |
| **File coinvolti** | `public/assets/aistudio/*` (rimozione), `vite.config.js`, `src/hooks/useBurracoGame.js`, `src/hooks/useGameCloudListeners.js`, `src/hooks/useTournament.js`, nuovo `src/components/ui/ModalShell.jsx` |
| **Rischio di regressione** | **Basso** — rimozione di codice/asset non referenziati e deduplicazione strutturale. |
| **Test Vitest** | Verificare `tests/tournament.test.js`, `tests/lifecycle.test.js`; aggiungere controllo in `tests/storage.test.js` che nessun residuo `sessionStorage` sia richiesto per la chiusura tavolo. |

---

### 1.3 Sostituzione del Ledger CRDT (`ledger.js`) con Riconciliazione Per-Mano (`roundId`) & Retrocompatibilità Legacy

**Diagnosi attuale**
1. **Bug strutturale di troncamento**: `gamesCloudService.js` (riga 161) salva `ledgerChain.slice(-200)` per rispettare il limite `size() <= 200` in `firestore.rules`. Oltre 200 eventi, il blocco Genesis (`index: 0`) viene troncato, `verifyChainIntegrity()` fallisce e `reconstructGameStateFromChain()` può corrompere la partita.
2. **Bug di replay su cancellazione mano intermedia**: `handleDeleteRound` rinumera le mani locali (`roundNumber: newIdx + 1`), ma registra nel ledger `{ type: 'ROUND_REVERTED', roundNumber }`. Il replay non rinumera e genera collisioni/duplicazioni di mani in multi-device.
3. **Sovraccarico payload e CPU**: serializzazione di 200 blocchi ridondanti in aggiunta all'array `rounds`.

**Architettura sostitutiva confermata: Riconciliazione Per-Mano Deterministica (`src/utils/roundSync.js`)**
- Ogni smazzata riceve un identificativo univoco immutabile alla creazione:
  ```js
  {
    roundId: 'rnd_<timestamp>_<random4>', // immutabile anche su rinumerazione
    roundNumber: 1,                       // derivato dall'ordine sequenziale
    createdAt: '2026-11-19T...',
    updatedAt: '2026-11-19T...',          // timestamp LWW per-mano
    ...scoresAndDetails
  }
  ```
- **Eliminazioni sicure (Tombstones)**: la partita mantiene `deletedRoundIds: string[]` (max 100 voci). Quando un dispositivo elimina una mano intermedia, aggiunge il suo `roundId` a `deletedRoundIds` e rinumera le mani rimanenti (`roundNumber = index + 1`).
- **Retrocompatibilità rigorosa su documenti legacy**:
  - Funzione pura `normalizeLegacyGame(game)`: gestisce in modo completamente trasparente e privo di errori qualsiasi documento storico (locale o Firestore) privo di `roundId`, `deletedRoundIds`, `suspendedAt` o `stateUpdatedAt`, e che contiene ancora `ledgerChain` / `ledgerLastHash` / `ledgerChainLength`.
  - Alle mani legacy prive di `roundId` viene assegnato un ID deterministico `legacy_r${round.roundNumber || idx + 1}_${round.timestamp || '0'}` così che due dispositivi che aprono lo stesso documento legacy convergano sugli stessi ID senza duplicare le mani!
  - `deletedRoundIds` assente viene normalizzato a `[]`; `suspendedAt` assente viene trattato come `null`; eventuali campi `ledgerChain` residui in lettura vengono ignorati senza errori e rimossi in modo sicuro dai nuovi salvataggi client.
- **Funzione pura `reconcileGames(localGame, remoteGame)`**:
  1. Normalizza entrambi i documenti via `normalizeLegacyGame()`.
  2. Unisce `deletedRoundIds = union(local.deletedRoundIds, remote.deletedRoundIds)`.
  3. Per ogni `roundId` presente in `local.rounds` o `remote.rounds`: scarta se in `deletedRoundIds`; se presente su entrambi i lati mantiene la versione con `updatedAt` maggiore (LWW deterministico).
  4. Ordina per `(createdAt, roundNumber, roundId)` e ricalcola `roundNumber = idx + 1`.
  5. Ricalcola totali, spareggio, `isFinished` e `winner` tramite l'unica fonte di verità `computeTeamTotalsAndWinner()`.
  6. `syncGameToCloud()` riconcilia col documento remoto prima di scrivere invece del fragile blocco `remoteRounds.length > localRounds.length` (che oggi impediva la propagazione di cancellazioni legittime di mani).
- **Aggiornamento `firestore.rules` & `firebase-blueprint.json`**:
  - Aggiungere in `isValidGame()` i campi opzionali:
    - `deletedRoundIds` (`list`, `size() <= 100`, primo elemento `string` se non vuota),
    - `stateUpdatedAt` (`string | timestamp | null`),
    - `suspendedAt` (`string | timestamp | null`).
  - Mantenere ammessi in `allowedFields` i campi opzionali legacy (`ledgerChain`, `ledgerLastHash`, `ledgerChainLength`) per garantire zero `PERMISSION_DENIED` durante la lettura/aggiornamento di documenti legacy da client non ancora aggiornati.
  - **Procedura operativa esplicita (Vincolo #1)**: al termine della Fase 2 verrà verificato il ruleset con lint/red-team check e **verrà segnalato chiaramente in chat il momento esatto in cui eseguire `firebase deploy --only firestore:rules`** sull'ambiente di produzione `burraco-score-fedec`.

| Campo | Dettaglio |
| :--- | :--- |
| **File coinvolti** | Nuovo `src/utils/roundSync.js`, `src/components/round/roundUtils.js`, `src/services/gamesCloudService.js`, `src/hooks/useGameCloudListeners.js`, `src/hooks/game/useRoundMutations.js`, `src/utils/gameHelpers.js`, `firestore.rules`, `firebase-blueprint.json`, rimozione `src/utils/ledger.js` |
| **Rischio di regressione** | **Alto** — modifica il cuore della sincronizzazione multi-dispositivo e lo schema `firestore.rules` (richiede deploy regole `firebase deploy --only firestore:rules` prima del rollout client). |
| **Test Vitest** | Sostituire `tests/ledger.test.js` con `tests/round_sync.test.js` coprendo: merge concorrente 2 dispositivi offline, modifica concorrente stessa mano (LWW), eliminazione mano intermedia + rinumerazione senza duplicati né resurrezioni, retrocompatibilità completa su documenti legacy privi di `roundId` / `deletedRoundIds` / `suspendedAt` e con `ledgerChain` presente, partite > 200 modifiche senza perdita dati. Aggiornare `tests/chaos_resilience.test.js`. |

---

## 2. Affidabilità Dati, Banda & Performance

### 2.1 Persistenza Partita a 0 Mani al Reload & Sospensione Pulita Partite Incomplete

**Diagnosi attuale**
1. **Bug partita a 0 mani cancellata al reload**: `src/hooks/useBurracoGame.js` (righe 48–53) scarta qualunque partita con `rounds.length === 0` e chiama `saveActiveGame(null)`. Un ricaricamento prima della Mano #1 distrugge il tavolo appena configurato.
2. **Bug chiusura forzata `isFinished: true` su nuova partita**: `archiveCurrentGame()` (`src/utils/storageCore.js:274–285`) imposta **sempre** `isFinished: true` e `completedAt`. Invocata da `handleStartGame` (riga 148), `handlePlayTournamentMatch` (riga 841) e `handleRematch` (riga 546), forza come concluse partite ancora in corso, rendendole non riprendibili e falsando le statistiche carriera.

**Soluzione progettata**
1. **Ripristino tavolo a 0 mani**: nell'inizializzatore di `activeGame`, ripristinare qualsiasi partita valida con `!current.tableClosed && !current.isFinished` (anche con `rounds.length === 0`), purché abbia `id`, `team1` e `team2` validi.
2. **Separazione `suspendGameToHistory` vs `archiveCurrentGame`** in `src/utils/storageCore.js`:
   - `suspendGameToHistory(game, userKey)`: salva nello storico con `isFinished: false, tableClosed: true, suspendedAt: new Date().toISOString()` (senza `completedAt` né `winner` forzato). La partita appare nell'Archivio come *"In corso — Riprendi"* ed è esclusa dal conteggio vittorie/sconfitte in `playerStats.js`.
   - `handleStartGame` e `handlePlayTournamentMatch`: se la partita precedente ha `rounds.length > 0` e `!isFinished`, la sospende con `suspendGameToHistory()`; se è già `isFinished: true`, la archivia normalmente.
   - Ripresa da Archivio (`handleResumeGame`): reimposta `tableClosed: false` e `suspendedAt: null`.

| Campo | Dettaglio |
| :--- | :--- |
| **File coinvolti** | `src/utils/storageCore.js`, `src/utils/storage.js`, `src/hooks/game/useGameLifecycle.js`, `src/hooks/game/useTournamentSyncBridge.js`, `src/components/history/HistoryGameCard.jsx`, `firestore.rules` (`suspendedAt` opzionale) |
| **Rischio di regressione** | **Basso** — logica ben delimitata, retrocompatibile con documenti storici privi di `suspendedAt`. |
| **Test Vitest** | Aggiornare `tests/lifecycle.test.js` e `tests/storage.test.js` con: (a) reload con partita attiva a 0 mani preservata, (b) avvio nuova partita su precedente incompleta → salvata con `isFinished: false, tableClosed: true, suspendedAt` e non conteggiata nelle vittorie/sconfitte carriera, (c) ripresa dallo storico riapre `tableClosed: false`. |

---

### 2.2 Audit Re-Render dei Context Annidati & Ottimizzazione Bundle

**Diagnosi attuale — Context Re-Render Cascade**
1. `SocialContext` emette 26 valori in un solo oggetto (mescolando `currentUser` stabile con `notifications`, `toastNotification`, `liveFriendProfiles`, `clubUsers`, `isProfileOpen`). Ogni aggiornamento presenza o notifica fa ri-renderizzare `TournamentProvider`, `GameProvider` e l'intero `BurracoAppContent`.
2. `GameContext.jsx:24` passa `onCelebrate: () => setIsVictoryOpen(true)` (funzione inline instabile).
3. `App.jsx` (righe 45–118) dichiara `useCallback(..., [game])`, `[social]`, `[tournament]` dipendendo dagli interi oggetti context, invalidando i callback ad ogni singolo cambio stato.

**Piano di ottimizzazione Context**
1. **Split `AuthContext` (stabile) + `SocialContext` (dinamico)**: `AuthProvider` espone `{ currentUser, handleLogin, handleLogout }`; `TournamentProvider` consuma **solo** `useAuth()`.
2. **Stabilizzazione callback**: `handleCelebrate` memoizzato in `GameContext.jsx`; destrutturazione delle singole funzioni stabili nelle dipendenze di `useCallback` in `App.jsx`; `React.memo` su `Header`, `BottomNavBar` e `RoundsHistoryList`.

**Diagnosi attuale — Analisi Bundle (`dist/assets/`)**
- `vendor-firebase-core-*.js`: **1.001,8 KB** (assorbe `@firebase/firestore` per il matching `manualChunks` sotto Vite 8/Rolldown).
- `index-*.js`: **840,1 KB**.
- `vendor-firebase-auth-*.js`: **333,2 KB**.
- **Bug critico di lazy-loading in `src/components/AppModals.jsx` (righe 41–145)**: tutti i **9 modali `React.lazy`** (~315 KB totali, inclusi `qrcode` e `canvas-confetti`) sono montati **sempre** con `isOpen={false}`, vanificando il code-splitting al primo caricamento! Stesso problema per `AudioSettingsModal` (15,9 KB) in `Header.jsx`.

**Piano di ottimizzazione Bundle**
1. **Montaggio condizionale** (`{isNewGameOpen && <NewGameModal ... />}`) per tutti i 9 modali in `AppModals.jsx` e per `AudioSettingsModal` in `Header.jsx`: **~330 KB** risparmiati sul primo caricamento.
2. **Splitting `vendor-react` e fix `vendor-firebase-firestore`** in `vite.config.js` (percorsi normalizzati compatibili con Vite 8 Rolldown) portando `index-*.js` sotto i 250 KB.
3. **Import dinamico di `canvas-confetti`** solo al momento della celebrazione in `VictoryModal.jsx` + rimozione `ledger.js`.

| Campo | Dettaglio |
| :--- | :--- |
| **File coinvolti** | Nuovo `src/context/AuthContext.jsx`, `src/context/SocialContext.jsx`, `src/context/TournamentContext.jsx`, `src/context/GameContext.jsx`, `src/App.jsx`, `src/components/AppModals.jsx`, `src/components/Header.jsx`, `src/components/navigation/BottomNavBar.jsx`, `src/components/scoreboard/RoundsHistoryList.jsx`, `src/components/VictoryModal.jsx`, `vite.config.js` |
| **Rischio di regressione** | **Medio** — verificare il reset stato interno dei modali con montaggio condizionale. |
| **Test Vitest** | Aggiungere `tests/context_isolation.test.js` (isolamento `AuthContext` da aggiornamenti notifiche/presenza e montaggio condizionale modali); verifica post-build chunk size. |

---

### 2.3 Cloud, Banda Audio (`preload="none"`), Cleanup Listener Firestore & Login Google su iOS PWA

**Diagnosi attuale**
1. **Banda Audio MP3 (~42 MB)**: in `src/utils/backgroundMusic.js` (riga 124), `this.audio.preload = 'auto'` avvia il buffering dell'intero file MP3 appena l'elemento audio viene creato; inoltre `public/audio/` contiene 2 file MP3 orfani (`lounge-vibes.mp3` 6,2 MB e `soft-piano.mp3` 7,4 MB) non presenti in `MUSIC_TRACKS`.
2. **Audit Cleanup Listener Firestore (`onSnapshot`)**:
   - Verificare e blindare il ciclo di vita di tutti i listener in `useGameCloudListeners.js`, `useSocialClub.js`, `useTournament.js`, `gamesCloudService.js` (`subscribeToCloudGamesHistory`, `subscribeToCloudGame`), `social.js` (`subscribeToMyNotifications`, `subscribeToMyFriends`, `subscribeToFriendsPresence`, `subscribeToClubUsers`, `subscribeToMyProfile`) e `tournamentsCloudService.js` (`subscribeToCloudTournament`).
   - In particolare, verificare che su **logout**, cambio `activeGameId`, chiusura profilo (`isProfileOpen: false`) e unmount tutti gli `unsub()` vengano invocati senza leak (anche nel caso di race condition asincrone di `subscribeWithOrderFallback`).
3. **Login Google su iOS Safari PWA Standalone (`src/services/authService.js`)**:
   - Attualmente `loginWithGoogle()` chiama esclusivamente `signInWithPopup(auth, googleProvider)`. Su iPhone/iPad quando l'app è installata sulla Home Screen (`display-mode: standalone` / `navigator.standalone === true`), WebKit blocca o chiude i popup OAuth (`auth/popup-blocked`, `auth/operation-not-supported-in-this-environment`, `auth/cancelled-popup-request`).
   - **Soluzione progettata**:
     - Rilevamento sicuro del contesto: `isStandaloneIOS()` (`iPhone|iPad|iPod` + `standalone`) e `isInsideIframe()` (`window.self !== window.top`).
     - In desktop / Android / preview iframe: mantiene `signInWithPopup` come primario.
     - Se in iOS standalone (o se `signInWithPopup` fallisce con `auth/popup-blocked` / `auth/operation-not-supported-in-this-environment` fuori da iframe): fallback automatico a `signInWithRedirect(auth, googleProvider)` con risoluzione tramite `resolvePendingRedirectLogin()` (`getRedirectResult(auth)`) al bootstrap di `AuthContext`, eseguendo `syncUserProfiles()` e flag `isFirstLogin` identicamente al flusso popup.
     - Messaggio diagnostico chiaro se l'utente ha cookie/storage di terze parti bloccati in Safari.

| Campo | Dettaglio |
| :--- | :--- |
| **File coinvolti** | `src/utils/backgroundMusic.js`, `src/services/authService.js`, `src/services/firebase.js`, `src/services/firebaseClient.js`, `src/context/AuthContext.jsx`, `src/hooks/useGameCloudListeners.js`, `src/hooks/useSocialClub.js`, `src/hooks/useTournament.js`, verifica/rimozione `public/audio/lounge-vibes.mp3` e `public/audio/soft-piano.mp3` |
| **Rischio di regressione** | **Medio** — attenzione al flusso OAuth in iframe preview (dove deve restare `signInWithPopup`) rispetto a standalone iOS (dove entra il fallback redirect). |
| **Test Vitest** | Aggiungere test in `tests/storage.test.js` (o `tests/auth_and_audio.test.js`) per: (a) `bgMusic` usa `preload === 'none'` e non imposta `src` finché `play()` non viene chiamato, (b) `loginWithGoogle` usa `signInWithPopup` in ambiente standard/iframe e attiva il fallback `signInWithRedirect` su errore `auth/popup-blocked` in contesto top-level/iOS standalone, (c) `subscribeWithOrderFallback` invoca sempre l'unsubscribe del listener fallback anche se `unsubscribe()` arriva durante la transizione. |

---

## 3. Rifinitura UI/UX (Evoluzione del Design Attuale)

> Principio guida: preservare integralmente lo stile **Club Italiano Elegante** introducendo evoluzioni mirate ad alto impatto d'uso reale al tavolo.

### 3.1 5° Tema Chiaro ad Alto Contrasto: **"Circolo Diurno — Avorio & Verde Bosco"**

**Diagnosi attuale**  
I 4 temi esistenti sono tutti scuri, e nei componenti sono presenti 254 occorrenze di `text-white` (molte su testo di contenuto su card, ma anche su pulsanti pieni colorati, badge, avatar e toast).

**Regola critica di migrazione (Vincolo #4)**
- **NON usare hack CSS con `!important`**.
- **NON rimuovere `text-white` dai testi posizionati su sfondi solidi scuri o colorati** (pulsanti pieni rossi/verdi/blu, badge di notifica, avatar con iniziali, toast di notifica, overlay su sfondo scuro).
- Migrare **esclusivamente** i testi di contenuto su superfici del tema (`.club-card`, `.club-inset`, `.club-card-solid`, tabelle, titoli pagina) alla classe semantica `.club-text-primary` (`color: var(--text-primary)`), e le superfici/hover hardcoded (`bg-black/15`, `hover:bg-white/5`, `text-amber-300`, `text-sky-300`, `text-rose-300`) a token CSS dedicati (`.club-row-bg`, `.club-hover-soft`, `.club-team1`, `.club-team2`, `.club-team3`, `.club-danger-text`).

**Palette & Token Semantici (`[data-theme="daylight"]`)**
- `--surface-canvas`: `#F5F1E6` (avorio pergamenato anti-abbagliamento al sole)
- `--surface-card`: `rgba(255, 255, 255, 0.96)` / `--surface-card-solid`: `#FFFFFF`
- `--surface-inset`: `#ECE6D6` / `--surface-hover`: `#E2DAC5` / `--surface-dock`: `rgba(255, 253, 248, 0.96)`
- `--border-hairline`: `rgba(15, 61, 46, 0.22)` / `--border-subtle`: `rgba(15, 61, 46, 0.13)`
- `--text-primary`: `#0D281E` (verde bosco scuro — contrasto **14.2:1** su bianco, WCAG AAA)
- `--text-muted`: `#2D4F41` (8.1:1) / `--text-subtle`: `#446556` (5.7:1, WCAG AA+)
- `--accent-gold`: `#94630B` (oro antico brunito — contrasto 4.9:1 su bianco) / `--accent-gold-ink`: `#0D281E`
- Squadre ad alto contrasto solare: `--team1-ink: #9A5B06`, `--team2-ink: #035388`, `--team3-ink: #A61B3B`, `--danger-ink: #B42318`.
- Filigrana `.felt-bg` dedicata in verde bosco e oro antico a opacità `0.06` + aggiornamento script anti-FOUC in `index.html`.

| Campo | Dettaglio |
| :--- | :--- |
| **File coinvolti** | `src/utils/theme.js`, `src/index.css`, `index.html`, `src/components/ThemeSelectorModal.jsx`, migrazione mirata token nei componenti (`ScoreBoard.jsx`, `HomeLobby.jsx`, `Header.jsx`, `BottomNavBar.jsx`, `RoundCalculatorModal.jsx`, `RoundsHistoryList.jsx`, `HistoryModal.jsx`, `TournamentModal.jsx`, `UserProfileModal.jsx`, `NewGameModal.jsx` — lasciando intatto `text-white` su pulsanti pieni/badge/avatar/toast) |
| **Rischio di regressione** | **Medio** — alto numero di file toccati; mitigato da CSS custom properties identiche sui 4 temi scuri e audit visivo su bottoni pieni/badge/toast. |
| **Test Vitest** | Aggiornare `tests/theme.test.js` verificando `daylight` in `THEMES`, `applyTheme('daylight')`, `meta[name="theme-color"] === '#f5f1e6'` e persistenza `localStorage`. |

---

### 3.2 Guard-Rail Intelligenti nel Calcolatore Guidato (`RoundCalculatorModal.jsx`)

**Design confermato (non bloccante + correzione 1-tap)**
- Funzione pura `analyzeRoundConsistency(...)` in `src/components/round/roundUtils.js` che rileva 5 anomalie da tavolo in modalità `Calcolo Guidato`:
  1. `chiusura_with_hand_cards`: squadra con chiusura (+100) ma carte in mano > 0 → 1-tap **`Azzera carte in mano`**.
  2. `chiusura_with_pozzetto_penalty`: squadra con chiusura (+100) ma pozzetto in penalità (-100) → 1-tap **`Imposta pozzetto giocato`**.
  3. `chiusura_without_burraco`: squadra con chiusura (+100) e 0 burrachi → 1-tap **`+1 Burraco Sporco`**.
  4. `missing_chiusura`: punteggi inseriti ma nessuna chiusura selezionata → promemoria informativo (non bloccante).
  5. `non_multiple_of_five`: punti carte a terra o in mano non multipli di 5 → 1-tap **`Arrotonda a mult. 5`**.
- Banner `RoundGuardrailsBanner.jsx` sopra il footer fisso del calcolatore con icona + testo chiaro + pulsante azione 1-tap; il pulsante **Salva Smazzata** resta sempre attivo.

| Campo | Dettaglio |
| :--- | :--- |
| **File coinvolti** | `src/components/round/roundUtils.js`, `src/components/RoundCalculatorModal.jsx`, nuovo `src/components/round/RoundGuardrailsBanner.jsx` |
| **Rischio di regressione** | **Basso** — logica additiva e non bloccante, zero modifiche alle formule di punteggio. |
| **Test Vitest** | Aggiungere `tests/round_guardrails.test.js` testando tutti i 5 controlli e le relative azioni 1-tap sia in modalità `pairs`/`singles` che `trio`. |

---

### 3.3 Rotazione Schermo Dinamica (`RoundsHistoryList.jsx`) & Ergonomia Mobile Universale

**Interventi progettati (incluso Vincolo #4)**
1. **Rotazione schermo dinamica in `RoundsHistoryList.jsx`**: listener `window.matchMedia('(min-width: 768px)')` con stato `userOverride` (`null | 'cards' | 'table'`) così da commutare automaticamente *Schede ↔ Tabella* al cambio orientamento finché l'utente non forza manualmente una vista.
2. **Prevenzione auto-zoom iOS Safari (`font-size >= 16px` su tutti gli input)**: regola base in `src/index.css` su `input, select, textarea` (`font-size: 16px` su viewport mobile `< 640px`, rimuovendo eventuali `text-xs` / `text-sm` sugli `<input>` che causano zoom involontario su iPhone/iPad).
3. **`inputMode="numeric"` (e `pattern="[0-9-]*"` dove servono negativi)** su tutti i campi numerici (`CardsPointsInput.jsx`, `QuickEntryPad.jsx`, `TargetScoreSelector.jsx`, `MatchScoreEditModal.jsx`, ingresso PIN in `HomeLobby.jsx` / `CloudSyncModal.jsx`).
4. **Zero overflow orizzontale su schermi da `360px`**: audit di tutti i contenitori flex/grid principali (`min-w-0`, `overflow-x-clip` sul wrapper root, wrapping pulito di toolbar, header bar, score cards e tabelle dentro contenitori `overflow-x-auto`).
5. **`overscroll-behavior-y: contain`** su tutti i body scorrevoli delle modali (centralizzato in `ModalShell.jsx` e applicato anche a `RoundCalculatorModal.jsx`) per evitare il pull-to-refresh o lo scroll involontario della pagina sottostante su iOS/Android.
6. **Target touch ≥ 44×44px** su tutti i bottoni di azione in `RoundsHistoryList.jsx` e nelle toolbar mobili + compattazione verticale in landscape (`@media (max-height: 500px) and (orientation: landscape)`).

| Campo | Dettaglio |
| :--- | :--- |
| **File coinvolti** | `src/components/scoreboard/RoundsHistoryList.jsx`, `src/components/ui/ModalShell.jsx`, `src/components/RoundCalculatorModal.jsx`, `src/components/round/CardsPointsInput.jsx`, `src/components/round/QuickEntryPad.jsx`, `src/components/newgame/TargetScoreSelector.jsx`, `src/components/tournament/MatchScoreEditModal.jsx`, `src/components/HomeLobby.jsx`, `src/components/CloudSyncModal.jsx`, `src/index.css` |
| **Rischio di regressione** | **Basso** — interventi CSS/HTML mirati e verificabili su viewport 360px e landscape. |
| **Test Vitest** | Aggiungere test in `tests/responsive_and_a11y.test.js` per auto-switch `matchMedia` + `userOverride` di `RoundsHistoryList`. |

---

### 3.4 Accessibilità: Focus-Trap, Ripristino Focus, `prefers-reduced-motion` e Contrasto

1. **Hook `useModalDialog` (evoluzione retrocompatibile di `useModalEscape`) + `ModalShell.jsx`**:
   - Focus-trap tastiera (`Tab` / `Shift+Tab`), chiusura `Escape` LIFO con stack modali (per `ConfirmModal` sopra altri modali), blocco scroll `body` ref-counted e ripristino focus all'elemento trigger alla chiusura.
2. **`prefers-reduced-motion`**:
   - Media query `@media (prefers-reduced-motion: reduce)` in `src/index.css` che disattiva animazioni/transizioni superflue.
   - Controllo `matchMedia('(prefers-reduced-motion: reduce)').matches` prima di lanciare `canvas-confetti` in `VictoryModal.jsx`.
3. **Contrasto `club-text-subtle`, placeholder e `:focus-visible`**:
   - Alzare `--text-subtle` sui 4 temi scuri ad opacità ≥ `0.84` (≥ 5.2:1) e rimuovere `opacity: 0.7` doppia su `.club-input::placeholder` (che scendeva a ~3.1:1).
   - Focus ring visibile globale (`:focus-visible`) coerente con `--accent-gold`.

| Campo | Dettaglio |
| :--- | :--- |
| **File coinvolti** | `src/hooks/useModalEscape.js` (e nuovo `src/hooks/useModalDialog.js`), `src/components/ui/ModalShell.jsx`, tutti i 17 modali `role="dialog"`, `src/components/VictoryModal.jsx`, `src/index.css` |
| **Rischio di regressione** | **Basso** — verificare stack LIFO quando `ConfirmModal` si apre sopra un altro modale. |
| **Test Vitest** | `tests/responsive_and_a11y.test.js`: test focus-trap wrap, stack LIFO su Escape, ripristino focus e soppressione confetti con `prefers-reduced-motion: reduce`. |

---

## 4. PWA, Aggiornamenti & Condivisione Social

### 4.1 Icone PNG Reali (Apple + Android Standard & Maskable), Manifest & Install Prompt

1. **Asset PNG generati in `public/`**:
   - `public/apple-touch-icon.png` (**180×180**, fondo pieno verde smeraldo `#08291c` per iOS Safari).
   - `public/pwa-192x192.png` (**192×192**, `purpose: "any"`).
   - `public/pwa-512x512.png` (**512×512**, `purpose: "any"`).
   - `public/pwa-maskable-512x512.png` (**512×512**, `purpose: "maskable"`, safe-zone centrale 80% con margine pieno 12–15%).
   - Mantenere `public/favicon.svg` per le tab desktop.
2. **Manifest completo**: `id: "/"`, `scope: "/"`, `start_url: "/"`, `short_name: "Burraco Club"` (12 caratteri), `display: "standalone"`, separazione netta tra icone `purpose: "any"` e `purpose: "maskable"`.
3. **In-App Install Prompt**: hook `usePWAInstall` + `PWAInstallButton` nel menu/header (supporto `beforeinstallprompt` su Android/Desktop, nascosto in `standalone`, mini-guida 2-step su iOS Safari).

### 4.2 Meta Tag Open Graph, Twitter Card & JSON-LD

1. Immagine social `public/og-card.png` (**1200×630**).
2. Completamento `<head>` in `index.html`: `apple-touch-icon` PNG 180×180, `canonical`, `og:type`, `og:site_name`, `og:locale`, `og:url`, `og:image` (+ `width`/`height`), `twitter:card` (`summary_large_image`), `twitter:title`, `twitter:description`, `twitter:image`, e JSON-LD `WebApplication`.

### 4.3 Service Worker Definitivo (`vite-plugin-pwa`) & Banner Aggiornamento Nuova Versione (Vincolo #5)

- **Strategia SW**: `vite-plugin-pwa` (Workbox) con `registerType: 'prompt'` (in modo da **non interrompere mai bruscamente una mano in corso** ma notificare l'utente!), `cleanupOutdatedCaches: true`, `workbox.globIgnores: ['audio/**', 'assets/aistudio/**']`, `navigateFallback: '/index.html'`, `navigateFallbackDenylist: [/^\/version\.json/, /^\/audio\//]`, e `runtimeCaching` `CacheFirst` per Google Fonts (`fonts.googleapis.com` / `fonts.gstatic.com`).
  - *Piano B compatibilità Vite 8*: qualora `vite-plugin-pwa` presentasse incompatibilità peer con Vite 8.3 (`rolldown`), il plugin custom in `vite.config.js` inietterà automaticamente il precache manifest generato da `generateBundle()` nel Service Worker con lo stesso comportamento `prompt` + `skipWaiting` su conferma utente.
- **Avviso Aggiornamento Pulito (Vincolo #5)**:
  - Nuovo componente non invasivo `src/components/AppUpdateBanner.jsx` (connesso sia all'evento `needRefresh` del Service Worker sia al controllo `/version.json` di `src/utils/versionCheck.js` al ritorno in foreground `visibilitychange`).
  - Quando è disponibile una nuova versione deployata, mostra un banner chiaro in alto/sopra la dock: *"È disponibile una nuova versione di Burraco Master Club"* con pulsante **`Aggiorna ora`** (invia `SKIP_WAITING` al SW in attesa / pulisce vecchie cache / ricarica pulitamente senza perdere la partita attiva salvata in `localStorage`) e **`Più tardi`**.

| Campo | Dettaglio |
| :--- | :--- |
| **File coinvolti** | `vite.config.js`, `package.json`, `index.html`, `src/main.jsx`, `src/utils/versionCheck.js`, `src/App.jsx`, nuovi `src/hooks/usePWAInstall.js`, `src/components/PWAInstallButton.jsx`, `src/components/AppUpdateBanner.jsx`, `public/apple-touch-icon.png`, `public/pwa-192x192.png`, `public/pwa-512x512.png`, `public/pwa-maskable-512x512.png`, `public/og-card.png`, `public/manifest.json` |
| **Rischio di regressione** | **Medio** — verificare pulizia vecchie cache `burraco-cache-v*`, esclusione assoluta `/audio/*.mp3` dal precache e ricaricamento pulito senza loop infinito su `controllerchange`. |
| **Test Vitest** | Aggiornare `tests/sw_and_scoreboard.test.js` verificando: manifest (`id`, `scope`, `short_name <= 12`, PNG `192`/`512`, `any` separato da `maskable`), meta tag OG/Twitter/Apple/JSON-LD in `index.html`, esclusione `/audio/` e `/version.json` dal navigation fallback, logica hook `usePWAInstall` e trigger `AppUpdateBanner`. |

---

## Roadmap di Esecuzione Consigliata (5 Fasi Incrementali)

1. **Fase 1 — Pulizia, Banda Audio & Affidabilità Core** *(Rischio Basso)*  
   Rimozione `public/assets/aistudio/` e chiavi/stati morti → `preload="none"` su `backgroundMusic.js` → fix partita a 0 mani al reload → `suspendGameToHistory()` per partite incomplete.
2. **Fase 2 — Sync Per-Mano (`roundId`), Retrocompatibilità Legacy & Scomposizione `useBurracoGame`** *(Rischio Medio-Alto)*  
   `roundSync.js` (`normalizeLegacyGame` + `reconcileGames`) → aggiornamento `firestore.rules` & `firebase-blueprint.json` + **segnalazione esplicita `firebase deploy --only firestore:rules`** → rimozione `ledger.js` → estrazione dei 4 sub-hook da `useBurracoGame.js`.
3. **Fase 3 — Performance Context, Cleanup Listener, Login iOS PWA & Bundle Splitting** *(Rischio Medio)*  
   Split `AuthContext` / `SocialContext` → audit & hardening cleanup di tutti i listener Firestore → fallback `signInWithRedirect` + `getRedirectResult` su iOS PWA standalone → montaggio condizionale dei 9 modali lazy + fix `manualChunks` in `vite.config.js`.
4. **Fase 4 — Rifinitura UI/UX, Ergonomia 360px/iOS, Guard-rail, Accessibilità & 5° Tema Chiaro** *(Rischio Medio)*  
   `ModalShell.jsx` (`overscroll-behavior-y: contain`, focus-trap, focus restore, Escape LIFO) → `font-size >= 16px` input mobile + `inputMode="numeric"` + audit overflow 360px → `prefers-reduced-motion` + contrasto `club-text-subtle` → rotazione dinamica `RoundsHistoryList.jsx` + touch target 44px → guard-rail non bloccanti 1-tap → migrazione token (preservando `text-white` su bottoni pieni/badge/avatar/toast) + 5° tema **"Circolo Diurno (Avorio & Verde Bosco)"**.
5. **Fase 5 — PWA Compliance, Icone PNG, Open Graph, Service Worker & Banner Aggiornamento** *(Rischio Medio)*  
   Generazione icone PNG (`180`, `192`, `512`, `maskable`, `og-card`) → meta tag OG/Twitter/JSON-LD in `index.html` → Service Worker definitivo + `PWAInstallButton` + `AppUpdateBanner` con reload pulito → verifica finale completa (`npm test`, `oxlint`, `vite build`).
