// Gestore Musica di Sottofondo Procedurale ad Alta Fedeltà (Web Audio API)
// 100% Offline, Zero buffering, Transizioni morbide, Ottimizzato per iPad e Smartphone
import { getSharedAudioContext } from './soundEffects';

const MUSIC_ENABLED_KEY = 'burraco_music_enabled';
const MUSIC_VOLUME_KEY = 'burraco_music_volume';
const MUSIC_TRACK_KEY = 'burraco_music_track';

export const MUSIC_TRACKS = [
  {
    id: 'lounge',
    name: 'Jazz Lounge Club',
    subtitle: 'Rhodes, walking bass & swing',
    icon: '🎷',
    bpm: 68,
    color: 'from-amber-500 to-amber-700'
  },
  {
    id: 'piano',
    name: 'Soft Piano Bar',
    subtitle: 'Pianoforte a coda & arpeggi intimi',
    icon: '🎹',
    bpm: 56,
    color: 'from-emerald-500 to-teal-700'
  },
  {
    id: 'bossa',
    name: 'Cafè Bossa',
    subtitle: 'Chitarra acustica & ritmo morbido',
    icon: '☕',
    bpm: 76,
    color: 'from-orange-500 to-amber-700'
  }
];

// Helper per convertire numero nota MIDI in frequenza Hertz
function midiToFreq(m) {
  return 440 * Math.pow(2, (m - 69) / 12);
}

class BackgroundMusicManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.filterNode = null;
    this.isPlaying = false;
    this.trackId = this.loadTrack();
    this.volume = this.loadVolume();
    this.enabled = this.loadEnabled();
    this.timerId = null;
    this.measure = 0;
    this.step = 0;
    this.nextNoteTime = 0;
    this.listeners = new Set();

    // Auto-resume se l'utente aveva la musica attiva nell'ultima sessione
    if (typeof window !== 'undefined') {
      const handleFirstInteraction = () => {
        if (this.enabled && !this.isPlaying) {
          this.play();
        }
      };
      window.addEventListener('pointerdown', handleFirstInteraction, { once: true, passive: true });
      window.addEventListener('touchstart', handleFirstInteraction, { once: true, passive: true });
    }
  }

  loadEnabled() {
    if (typeof localStorage === 'undefined') return false;
    const saved = localStorage.getItem(MUSIC_ENABLED_KEY);
    return saved === 'true';
  }

  loadVolume() {
    if (typeof localStorage === 'undefined') return 0.5;
    const saved = localStorage.getItem(MUSIC_VOLUME_KEY);
    return saved !== null ? Math.max(0, Math.min(1, parseFloat(saved))) : 0.5;
  }

  loadTrack() {
    if (typeof localStorage === 'undefined') return 'lounge';
    const saved = localStorage.getItem(MUSIC_TRACK_KEY);
    return MUSIC_TRACKS.some(t => t.id === saved) ? saved : 'lounge';
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notify() {
    const state = {
      isPlaying: this.isPlaying,
      volume: this.volume,
      trackId: this.trackId,
      enabled: this.enabled
    };
    for (const listener of this.listeners) {
      try {
        listener(state);
      } catch (err) {
        console.error('Error in music listener:', err);
      }
    }
  }

  initAudio() {
    if (!this.ctx) {
      this.ctx = getSharedAudioContext();
    }
    if (this.ctx && !this.masterGain) {
      // Filtro caldo vintage a 1800Hz per togliere asprezze e dare calore da lounge bar
      this.filterNode = this.ctx.createBiquadFilter();
      this.filterNode.type = 'lowpass';
      this.filterNode.frequency.setValueAtTime(1900, this.ctx.currentTime);
      this.filterNode.Q.setValueAtTime(0.7, this.ctx.currentTime);

      this.masterGain = this.ctx.createGain();
      const initialGain = this.isPlaying && this.enabled ? this.volume * 0.35 : 0;
      this.masterGain.gain.setValueAtTime(initialGain, this.ctx.currentTime);

      this.filterNode.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setVolume(newVol) {
    const val = Math.max(0, Math.min(1, parseFloat(newVol)));
    this.volume = val;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(MUSIC_VOLUME_KEY, String(val));
    }

    if (this.ctx && this.masterGain) {
      const now = this.ctx.currentTime;
      const target = (this.isPlaying && this.enabled) ? val * 0.35 : 0;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.linearRampToValueAtTime(target, now + 0.1);
    }

    this.notify();
  }

  setTrack(trackId) {
    if (!MUSIC_TRACKS.some(t => t.id === trackId)) return;
    this.trackId = trackId;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(MUSIC_TRACK_KEY, trackId);
    }
    this.measure = 0;
    this.step = 0;
    this.notify();
  }

  play() {
    try {
      this.initAudio();
      if (!this.ctx || !this.masterGain) return;

      this.isPlaying = true;
      this.enabled = true;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(MUSIC_ENABLED_KEY, 'true');
      }

      // Fade in morbido per un ingresso soffuso senza scatti
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(0, now);
      this.masterGain.gain.linearRampToValueAtTime(this.volume * 0.35, now + 0.6);

      this.nextNoteTime = this.ctx.currentTime + 0.05;
      this.startScheduler();
      this.notify();
    } catch (err) {
      console.warn('Could not start music playback:', err);
    }
  }

  pause() {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    this.enabled = false;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(MUSIC_ENABLED_KEY, 'false');
    }

    if (this.ctx && this.masterGain) {
      // Fade out morbido in 0.4s
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.linearRampToValueAtTime(0, now + 0.4);
    }

    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }

    this.notify();
  }

  toggle() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  startScheduler() {
    if (this.timerId) clearInterval(this.timerId);
    this.timerId = setInterval(() => {
      this.scheduleLoop();
    }, 40);
  }

  scheduleLoop() {
    if (!this.isPlaying || !this.ctx) return;
    const lookahead = 0.15; // 150ms anticipo di programmazione note
    while (this.nextNoteTime < this.ctx.currentTime + lookahead) {
      this.scheduleStep(this.nextNoteTime);
      this.advanceStep();
    }
  }

  advanceStep() {
    const currentTrackObj = MUSIC_TRACKS.find(t => t.id === this.trackId) || MUSIC_TRACKS[0];
    const secondsPerBeat = 60.0 / currentTrackObj.bpm;
    const stepDuration = secondsPerBeat / 2; // suddivisione a ottavi (eighth notes)

    this.nextNoteTime += stepDuration;
    this.step += 1;
    if (this.step >= 8) {
      this.step = 0;
      this.measure += 1;
    }
  }

  scheduleStep(time) {
    switch (this.trackId) {
      case 'piano':
        this.renderPianoStep(time);
        break;
      case 'bossa':
        this.renderBossaStep(time);
        break;
      case 'lounge':
      default:
        this.renderLoungeStep(time);
        break;
    }
  }

  // --- 1. JAZZ LOUNGE CLUB (Rhodes morbido, walking bass & brushed hi-hat) ---
  renderLoungeStep(time) {
    // Progressione armonica Jazz Lounge in 8 misure:
    // 0: Dm9, 1: G13, 2: Cmaj9, 3: Am9, 4: Dm7, 5: G7b9, 6: Em7b5, 7: A7alt
    const chords = [
      { bass: 38, keys: [53, 57, 60, 64] },       // Dm9 (D2 | F3, A3, C4, E4)
      { bass: 43, keys: [53, 59, 64, 69] },       // G13 (G2 | F3, B3, E4, A4)
      { bass: 36, keys: [52, 55, 59, 62] },       // Cmaj9 (C2 | E3, G3, B3, D4)
      { bass: 45, keys: [55, 60, 64, 71] },       // Am9 (A2 | G3, C4, E4, B4)
      { bass: 38, keys: [53, 57, 60, 65] },       // Dm7 (D2 | F3, A3, C4, F4)
      { bass: 43, keys: [53, 56, 59, 63] },       // G7b9 (G2 | F3, Ab3, B3, Eb4)
      { bass: 40, keys: [55, 58, 62, 67] },       // Em7b5 (E2 | G3, Bb3, D4, G4)
      { bass: 45, keys: [55, 61, 65, 70] },       // A7alt (A2 | G3, C#4, F4, Bb4)
    ];

    const currentChord = chords[this.measure % chords.length];
    const s = this.step;

    // Batteria spazzolata leggera (card club ambience)
    if (s % 2 === 0) {
      this.playBrushedHat(time, s === 4 ? 0.04 : 0.025);
    }

    // Walking Bass contrabbasso acustico
    if (s === 0) {
      this.playUprightBass(time, currentChord.bass, 1.4, 0.45);
    } else if (s === 2) {
      this.playUprightBass(time, currentChord.bass + 7, 0.9, 0.35); // 5a al basso
    } else if (s === 4) {
      this.playUprightBass(time, currentChord.bass + 12, 1.1, 0.4); // Ottava
    } else if (s === 6) {
      // Nota di passaggio verso il prossimo accordo
      const nextChord = chords[(this.measure + 1) % chords.length];
      const passing = nextChord.bass > currentChord.bass ? nextChord.bass - 1 : nextChord.bass + 1;
      this.playUprightBass(time, passing, 0.8, 0.35);
    }

    // Piano Rhodes
    if (s === 0) {
      this.playRhodesChord(time, currentChord.keys, 1.8, 0.38);
    } else if (s === 3) {
      // Rintocco swing leggero
      this.playRhodesChord(time, currentChord.keys, 1.0, 0.22);
    } else if (s === 5) {
      // Nota melodica superiore Rhodes
      const topNote = currentChord.keys[currentChord.keys.length - 1];
      this.playRhodesNote(time, topNote + 2, 1.2, 0.26);
    }
  }

  // --- 2. SOFT PIANO BAR (Pianoforte a coda, arpeggi romantici) ---
  renderPianoStep(time) {
    // Progressione Ballad intima:
    // 0: Fmaj7, 1: Am7, 2: Bbmaj9, 3: C7sus4, 4: Dm9, 5: Gm7, 6: Bbmaj7, 7: Csus4
    const chords = [
      { bass: 41, arpeggio: [53, 57, 60, 64, 69] }, // F
      { bass: 45, arpeggio: [52, 55, 60, 64, 67] }, // Am
      { bass: 46, arpeggio: [53, 57, 62, 65, 69] }, // Bb
      { bass: 36, arpeggio: [55, 58, 60, 65, 67] }, // C7sus4
      { bass: 38, arpeggio: [53, 57, 60, 64, 69] }, // Dm9
      { bass: 43, arpeggio: [55, 58, 62, 65, 70] }, // Gm7
      { bass: 46, arpeggio: [50, 53, 57, 62, 65] }, // Bbmaj7
      { bass: 36, arpeggio: [55, 60, 65, 67, 72] }  // Csus4
    ];

    const currentChord = chords[this.measure % chords.length];
    const s = this.step;

    // Basso pianoforte a coda profondo su battere
    if (s === 0) {
      this.playPianoNote(time, currentChord.bass, 2.8, 0.45);
    } else if (s === 4) {
      this.playPianoNote(time, currentChord.bass + 7, 2.0, 0.3);
    }

    // Arpeggio fluido a due mani
    const noteIndex = s % currentChord.arpeggio.length;
    const midi = currentChord.arpeggio[noteIndex];
    const vel = (s === 0 || s === 4) ? 0.32 : 0.22;
    this.playPianoNote(time, midi, 1.8, vel);
  }

  // --- 3. CAFÈ BOSSA (Chitarra jazz soffusa & ritmo sincopato) ---
  renderBossaStep(time) {
    const chords = [
      { bass: 36, keys: [52, 55, 59, 62] }, // Cmaj7
      { bass: 45, keys: [52, 55, 60, 64] }, // Am7
      { bass: 38, keys: [53, 57, 60, 64] }, // Dm9
      { bass: 43, keys: [53, 59, 64, 67] }, // G13
      { bass: 40, keys: [55, 59, 62, 67] }, // Em7
      { bass: 45, keys: [55, 61, 65, 69] }, // A7b9
      { bass: 38, keys: [53, 57, 60, 65] }, // Dm7
      { bass: 43, keys: [53, 59, 62, 67] }  // G7
    ];

    const currentChord = chords[this.measure % chords.length];
    const s = this.step;

    // Shaker percussivo leggerissimo
    this.playBrushedHat(time, s % 2 === 1 ? 0.035 : 0.015);

    // Basso Bossa Nova (1 e 3)
    if (s === 0) {
      this.playUprightBass(time, currentChord.bass, 1.0, 0.4);
    } else if (s === 4) {
      this.playUprightBass(time, currentChord.bass + 7, 1.0, 0.35);
    }

    // Ritmo chitarra comping bossa (0, 2, 5, 7)
    if (s === 1 || s === 3 || s === 6) {
      this.playAcousticGuitarChord(time, currentChord.keys, 0.7, 0.26);
    }
  }

  // === GENERATORI DI TIMBRO STRUMENTALE PROCEDURALE ===

  // 1. Rhodes Electric Piano: Suono morbido campanellato jazz
  playRhodesChord(time, keys, duration, vel) {
    keys.forEach((k, idx) => {
      // Piccolo sfasamento naturale di tocco tra le dita (strumming)
      this.playRhodesNote(time + idx * 0.012, k, duration, vel);
    });
  }

  playRhodesNote(time, midi, duration, vel) {
    if (!this.ctx || !this.filterNode) return;
    const freq = midiToFreq(midi);

    // Tono fondamentale morbido (sinusoidale)
    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, time);

    // Tine chime (armonica 2x o 3x a decadimento rapido, classico del Rhodes)
    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2, time);

    const gain1 = this.ctx.createGain();
    const gain2 = this.ctx.createGain();

    // Inviluppo corpo principale
    gain1.gain.setValueAtTime(0.001, time);
    gain1.gain.exponentialRampToValueAtTime(vel, time + 0.015);
    gain1.gain.exponentialRampToValueAtTime(vel * 0.3, time + 0.5);
    gain1.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    // Inviluppo campanella metallica
    gain2.gain.setValueAtTime(0.001, time);
    gain2.gain.exponentialRampToValueAtTime(vel * 0.45, time + 0.008);
    gain2.gain.exponentialRampToValueAtTime(0.0001, time + 0.3);

    osc1.connect(gain1);
    osc2.connect(gain2);

    gain1.connect(this.filterNode);
    gain2.connect(this.filterNode);

    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + duration + 0.05);
    osc2.stop(time + 0.35);
  }

  // 2. Grand Piano: Caldo, risonante con overtones realistici
  playPianoNote(time, midi, duration, vel) {
    if (!this.ctx || !this.filterNode) return;
    const freq = midiToFreq(midi);

    const osc = this.ctx.createOscillator();
    osc.type = 'triangle'; // Il triangolo dà quel calore pieno dei martelletti in feltro
    osc.frequency.setValueAtTime(freq, time);

    // Armonica morbida per brillantezza naturale
    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2, time);

    const gain = this.ctx.createGain();
    const gain2 = this.ctx.createGain();

    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(vel, time + 0.012);
    gain.gain.exponentialRampToValueAtTime(vel * 0.4, time + 0.6);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    gain2.gain.setValueAtTime(0.0001, time);
    gain2.gain.exponentialRampToValueAtTime(vel * 0.25, time + 0.01);
    gain2.gain.exponentialRampToValueAtTime(0.0001, time + 0.4);

    osc.connect(gain);
    osc2.connect(gain2);

    gain.connect(this.filterNode);
    gain2.connect(this.filterNode);

    osc.start(time);
    osc2.start(time);
    osc.stop(time + duration + 0.05);
    osc2.stop(time + 0.45);
  }

  // 3. Upright Bass: Pizzicato caldo e profondo
  playUprightBass(time, midi, duration, vel) {
    if (!this.ctx || !this.filterNode) return;
    const freq = midiToFreq(midi);

    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);
    // Lieve pitch drop iniziale per simulare la corda di budello pizzicata
    osc.frequency.exponentialRampToValueAtTime(freq, time + 0.05);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, time);
    gain.gain.exponentialRampToValueAtTime(vel, time + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    osc.connect(gain);
    gain.connect(this.filterNode);

    osc.start(time);
    osc.stop(time + duration + 0.05);
  }

  // 4. Chitarra Jazz/Bossa: Corde in nylon calde
  playAcousticGuitarChord(time, keys, duration, vel) {
    keys.forEach((k, idx) => {
      this.playPianoNote(time + idx * 0.015, k + 12, duration, vel * 0.8);
    });
  }

  // 5. Hi-hat con spazzole / Shaker delicato
  playBrushedHat(time, vel) {
    if (!this.ctx || !this.filterNode) return;
    try {
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.05);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      const bandpass = this.ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(7000, time);
      bandpass.Q.setValueAtTime(1.5, time);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(vel, time);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.045);

      whiteNoise.connect(bandpass);
      bandpass.connect(gain);
      gain.connect(this.filterNode);

      whiteNoise.start(time);
      whiteNoise.stop(time + 0.05);
    } catch {
      // Ignora silente
    }
  }
}

// Istanza singleton condivisa in tutta l'applicazione
export const bgMusic = new BackgroundMusicManager();
