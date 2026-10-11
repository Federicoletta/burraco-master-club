// Effetti sonori procedurali tramite Web Audio API ad alta fedeltà
// Funzionano al 100% offline, istantanei, senza caricamenti di rete e ottimizzati per altoparlanti iPad/mobile!

const SOUND_PREF_KEY = 'burraco_sound_enabled';
const SOUND_VOLUME_KEY = 'burraco_sound_volume';

class SoundManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.enabled = this.loadPreference();
    this.volume = this.loadVolume();

    // Auto-unlock automatico per Safari e iPadOS al primo tocco sullo schermo
    if (typeof window !== 'undefined') {
      const unlockAudio = () => {
        this.initContext();
      };
      window.addEventListener('pointerdown', unlockAudio, { once: true, passive: true });
      window.addEventListener('touchstart', unlockAudio, { once: true, passive: true });
    }
  }

  loadPreference() {
    const saved = localStorage.getItem(SOUND_PREF_KEY);
    return saved !== null ? saved === 'true' : true;
  }

  loadVolume() {
    const saved = localStorage.getItem(SOUND_VOLUME_KEY);
    // Default 85% per un volume corposo e nitido
    return saved !== null ? Math.max(0, Math.min(1, parseFloat(saved))) : 0.85;
  }

  setSoundEnabled(val) {
    this.enabled = Boolean(val);
    localStorage.setItem(SOUND_PREF_KEY, String(this.enabled));
    this.updateMasterGain();
  }

  setVolume(val) {
    const num = Math.max(0, Math.min(1, parseFloat(val)));
    this.volume = num;
    localStorage.setItem(SOUND_VOLUME_KEY, String(num));
    if (num > 0 && !this.enabled) {
      this.enabled = true;
      localStorage.setItem(SOUND_PREF_KEY, 'true');
    }
    this.updateMasterGain();
  }

  updateMasterGain() {
    if (this.ctx && this.masterGain) {
      const targetGain = this.enabled ? this.volume : 0;
      this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.masterGain.gain.setValueAtTime(targetGain, this.ctx.currentTime);
    }
  }

  initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        const initialGain = this.enabled ? this.volume : 0;
        this.masterGain.gain.setValueAtTime(initialGain, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Click chiaro (tap su pulsanti, bottoni e contatori)
  playTap() {
    if (!this.enabled || this.volume <= 0) return;
    try {
      this.initContext();
      if (!this.ctx || !this.masterGain) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(750, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.06);

      // Volume potenziato a 0.45
      gain.gain.setValueAtTime(0.45, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.06);
    } catch {
      // Ignora silente
    }
  }

  // Suono carte scivolate sul panno verde (fruscio + tocco panno)
  playCardDeal() {
    if (!this.enabled || this.volume <= 0) return;
    try {
      this.initContext();
      if (!this.ctx || !this.masterGain) return;

      const now = this.ctx.currentTime;

      // 1. Fruscio carta (rumore bianco filtrato)
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.16);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1600, now);
      filter.frequency.exponentialRampToValueAtTime(450, now + 0.16);
      filter.Q.setValueAtTime(1.8, now);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.55, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

      whiteNoise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.masterGain);

      whiteNoise.start(now);

      // 2. Tocco morbido sul panno da gioco (basso profondo)
      const thud = this.ctx.createOscillator();
      const thudGain = this.ctx.createGain();
      thud.type = 'triangle';
      thud.frequency.setValueAtTime(140, now);
      thud.frequency.exponentialRampToValueAtTime(40, now + 0.12);

      thudGain.gain.setValueAtTime(0.4, now);
      thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      thud.connect(thudGain);
      thudGain.connect(this.masterGain);

      thud.start(now);
      thud.stop(now + 0.12);
    } catch {
      // Ignora silente
    }
  }

  // Rintocco dorato brillante (quando si aggiunge un Burraco o si chiude la mano)
  playBurracoChime() {
    if (!this.enabled || this.volume <= 0) return;
    try {
      this.initContext();
      if (!this.ctx || !this.masterGain) return;

      const now = this.ctx.currentTime;
      // Accordo brillante C5, E5, G5, C6 (Do, Mi, Sol, Do alto)
      const notes = [523.25, 659.25, 783.99, 1046.50];

      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        // Onde triangolari ricche di armoniche
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.045);

        // Volume potenziato a 0.65 con decadimento naturale
        gain.gain.setValueAtTime(0.65, now + idx * 0.045);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.045 + 0.55);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now + idx * 0.045);
        osc.stop(now + idx * 0.045 + 0.55);
      });
    } catch {
      // Ignora silente
    }
  }

  // Fanfara trionfale di vittoria (quando una squadra vince la partita)
  playVictoryFanfare() {
    if (!this.enabled || this.volume <= 0) return;
    try {
      this.initContext();
      if (!this.ctx || !this.masterGain) return;

      const now = this.ctx.currentTime;
      const melody = [
        { freq: 392.00, time: 0.0, dur: 0.18 }, // Sol 4
        { freq: 523.25, time: 0.19, dur: 0.18 }, // Do 5
        { freq: 659.25, time: 0.38, dur: 0.18 }, // Mi 5
        { freq: 783.99, time: 0.57, dur: 0.4 },  // Sol 5
        { freq: 659.25, time: 1.0, dur: 0.16 },  // Mi 5
        { freq: 1046.50, time: 1.18, dur: 1.0 }, // Do 6 trionfale prolungato
      ];

      melody.forEach(note => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(note.freq, now + note.time);

        // Filtro passa-basso per timbro caldo di tromba/ottoni
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2400, now + note.time);

        // Volume potenziato a 0.75
        gain.gain.setValueAtTime(0.75, now + note.time);
        gain.gain.exponentialRampToValueAtTime(0.001, now + note.time + note.dur);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now + note.time);
        osc.stop(now + note.time + note.dur);
      });
    } catch {
      // Ignora silente
    }
  }

  // Rintocco funebre solenne / campana a lutto tenebrosa (quando un giocatore muore)
  playDeathBell() {
    if (!this.enabled || this.volume <= 0) return;
    try {
      this.initContext();
      if (!this.ctx || !this.masterGain) return;

      const now = this.ctx.currentTime;
      // Frequenze per simulare una pesante campana metallica in bronzo (fondamentale bassa + parziali inarmoniche)
      const harmonics = [
        { freq: 110.0, gain: 0.6, decay: 4.8 },   // La 2 (profondo rintocco di campana)
        { freq: 220.0, gain: 0.35, decay: 3.8 },  // La 3
        { freq: 277.18, gain: 0.25, decay: 3.2 }, // Terza maggiore
        { freq: 440.0, gain: 0.2, decay: 2.5 },   // Ottava
        { freq: 659.25, gain: 0.12, decay: 1.8 }, // Quinta acuta
        { freq: 880.0, gain: 0.08, decay: 1.2 }   // Tintinnio metallico iniziale
      ];

      harmonics.forEach(h => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(h.freq, now);

        // Attacco istantaneo per il colpo del battaglio e lungo riverbero
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(h.gain * 0.85, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + h.decay);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + h.decay);
      });
    } catch {
      // Ignora silente
    }
  }
}

export const sound = new SoundManager();

export function getSharedAudioContext() {
  sound.initContext();
  return sound.ctx;
}
