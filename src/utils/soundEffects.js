// Effetti sonori procedurali tramite Web Audio API
// Nessun file esterno necessario, funzionano al 100% offline, istantanei e senza caricamenti di rete!

const SOUND_PREF_KEY = 'burraco_sound_enabled';

class SoundManager {
  constructor() {
    this.ctx = null;
    this.enabled = this.loadPreference();
  }

  loadPreference() {
    const saved = localStorage.getItem(SOUND_PREF_KEY);
    return saved !== null ? saved === 'true' : true;
  }

  setSoundEnabled(val) {
    this.enabled = Boolean(val);
    localStorage.setItem(SOUND_PREF_KEY, String(this.enabled));
  }

  initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Click leggero (tap su pulsanti e contatori)
  playTap() {
    if (!this.enabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch {
      // Ignora silente
    }
  }

  // Suono carte scivolate sul panno (fruscio)
  playCardDeal() {
    if (!this.enabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      // Genera un breve fruscio filtrato (effetto carta)
      const bufferSize = this.ctx.sampleRate * 0.12;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1200, this.ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.12);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      whiteNoise.start();
    } catch {
      // Ignora silente
    }
  }

  // Rintocco dorato (quando si aggiunge un Burraco o si chiude la mano)
  playBurracoChime() {
    if (!this.enabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 (accordo brillante)

      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.04);

        gain.gain.setValueAtTime(0.15, now + idx * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.4);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + idx * 0.04);
        osc.stop(now + idx * 0.04 + 0.4);
      });
    } catch {
      // Ignora silente
    }
  }

  // Fanfara trionfale di vittoria (quando una squadra vince la partita)
  playVictoryFanfare() {
    if (!this.enabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      // Melodia trionfale: Sol, Do, Mi, Sol, Do alto
      const melody = [
        { freq: 392.00, time: 0.0, dur: 0.15 }, // G4
        { freq: 523.25, time: 0.16, dur: 0.15 }, // C5
        { freq: 659.25, time: 0.32, dur: 0.15 }, // E5
        { freq: 783.99, time: 0.48, dur: 0.35 }, // G5
        { freq: 659.25, time: 0.85, dur: 0.12 }, // E5
        { freq: 1046.50, time: 1.0, dur: 0.8 },  // C6 trionfale prolungato
      ];

      melody.forEach(note => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(note.freq, now + note.time);

        // Filtro per rendere il suono simile a ottoni/tromba
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1800, now + note.time);

        gain.gain.setValueAtTime(0.18, now + note.time);
        gain.gain.exponentialRampToValueAtTime(0.001, now + note.time + note.dur);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + note.time);
        osc.stop(now + note.time + note.dur);
      });
    } catch {
      // Ignora silente
    }
  }
}

export const sound = new SoundManager();
