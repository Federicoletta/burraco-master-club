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

    // Auto-unlock automatico per Safari, iOS e Android al primo tocco sullo schermo
    if (typeof window !== 'undefined') {
      const unlockAudio = () => {
        this.initContext();
        if (this.ctx && this.ctx.state === 'suspended') {
          this.ctx.resume().catch(() => {});
        }
      };
      window.addEventListener('click', unlockAudio, { passive: true });
      window.addEventListener('pointerdown', unlockAudio, { passive: true });
      window.addEventListener('touchstart', unlockAudio, { passive: true });
      window.addEventListener('touchend', unlockAudio, { passive: true });
    }
  }

  loadPreference() {
    try {
      if (typeof localStorage === 'undefined') return true;
      const saved = localStorage.getItem(SOUND_PREF_KEY);
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  }

  loadVolume() {
    try {
      if (typeof localStorage === 'undefined') return 0.85;
      const saved = localStorage.getItem(SOUND_VOLUME_KEY);
      // Default 85% per un volume corposo e nitido
      return saved !== null ? Math.max(0, Math.min(1, parseFloat(saved))) : 0.85;
    } catch {
      return 0.85;
    }
  }

  setSoundEnabled(val) {
    this.enabled = Boolean(val);
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(SOUND_PREF_KEY, String(this.enabled));
      }
    } catch {
      // ignore storage errors
    }
    this.updateMasterGain();
  }

  setVolume(val) {
    const num = Math.max(0, Math.min(1, parseFloat(val)));
    this.volume = num;
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(SOUND_VOLUME_KEY, String(num));
      }
    } catch {
      // ignore storage errors
    }
    if (num > 0 && !this.enabled) {
      this.enabled = true;
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(SOUND_PREF_KEY, 'true');
        }
      } catch {
        // ignore storage errors
      }
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
      this.ctx.resume().catch(() => {});
    }
  }

  /**
   * Helper sicuro per eseguire qualsiasi suono:
   * Se il contesto audio è 'suspended' (politica browser mobile), esegue resume() prima di lanciare la sintesi
   */
  _playSound(fn) {
    if (!this.enabled || this.volume <= 0) return;
    try {
      this.initContext();
      if (!this.ctx || !this.masterGain) return;

      if (this.ctx.state === 'suspended') {
        this.ctx.resume().then(() => {
          try {
            fn(this.ctx, this.masterGain);
          } catch (e) {
            console.warn('Errore sintesi sonora:', e);
          }
        }).catch(() => {});
      } else {
        fn(this.ctx, this.masterGain);
      }
    } catch {
      // Ignora silente
    }
  }

  // Click chiaro (tap su pulsanti, bottoni e contatori)
  playTap() {
    this._playSound((ctx, masterGain) => {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(750, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.06);

      // Volume potenziato a 0.45
      gain.gain.setValueAtTime(0.45, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc.connect(gain);
      gain.connect(masterGain);

      osc.start(now);
      osc.stop(now + 0.06);
    });
  }

  // Suono carte scivolate sul panno verde (fruscio + tocco panno)
  playCardDeal() {
    this._playSound((ctx, masterGain) => {
      const now = ctx.currentTime;

      // 1. Fruscio carta (rumore bianco filtrato)
      const bufferSize = Math.floor(ctx.sampleRate * 0.16);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1600, now);
      filter.frequency.exponentialRampToValueAtTime(450, now + 0.16);
      filter.Q.setValueAtTime(1.8, now);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.55, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

      whiteNoise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(masterGain);

      whiteNoise.start(now);

      // 2. Tocco morbido sul panno da gioco (basso profondo)
      const thud = ctx.createOscillator();
      const thudGain = ctx.createGain();
      thud.type = 'triangle';
      thud.frequency.setValueAtTime(140, now);
      thud.frequency.exponentialRampToValueAtTime(40, now + 0.12);

      thudGain.gain.setValueAtTime(0.4, now);
      thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      thud.connect(thudGain);
      thudGain.connect(masterGain);

      thud.start(now);
      thud.stop(now + 0.12);
    });
  }

  // Rintocco dorato brillante (quando si aggiunge un Burraco o si chiude la mano)
  playBurracoChime() {
    this._playSound((ctx, masterGain) => {
      const now = ctx.currentTime;
      // Accordo brillante C5, E5, G5, C6 (Do, Mi, Sol, Do alto)
      const notes = [523.25, 659.25, 783.99, 1046.50];

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        // Onde triangolari ricche di armoniche
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.045);

        // Volume potenziato a 0.65 con decadimento naturale
        gain.gain.setValueAtTime(0.65, now + idx * 0.045);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.045 + 0.55);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(now + idx * 0.045);
        osc.stop(now + idx * 0.045 + 0.55);
      });
    });
  }

  // Fanfara trionfale di vittoria (quando una squadra vince la partita)
  playVictoryFanfare() {
    this._playSound((ctx, masterGain) => {
      const now = ctx.currentTime;
      const melody = [
        { freq: 392.00, time: 0.0, dur: 0.18 }, // Sol 4
        { freq: 523.25, time: 0.19, dur: 0.18 }, // Do 5
        { freq: 659.25, time: 0.38, dur: 0.18 }, // Mi 5
        { freq: 783.99, time: 0.57, dur: 0.4 },  // Sol 5
        { freq: 659.25, time: 1.0, dur: 0.16 },  // Mi 5
        { freq: 1046.50, time: 1.18, dur: 1.0 }, // Do 6 trionfale prolungato
      ];

      melody.forEach(note => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(note.freq, now + note.time);

        // Filtro passa-basso per timbro caldo di tromba/ottoni
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2400, now + note.time);

        // Volume potenziato a 0.75
        gain.gain.setValueAtTime(0.75, now + note.time);
        gain.gain.exponentialRampToValueAtTime(0.001, now + note.time + note.dur);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);

        osc.start(now + note.time);
        osc.stop(now + note.time + note.dur);
      });
    });
  }

  // Fanfara trofeo / invito inviato / richiesta amicizia completata
  playTrophy() {
    this._playSound((ctx, masterGain) => {
      const now = ctx.currentTime;
      const notes = [
        { freq: 739.99, time: 0.0, dur: 0.12 },
        { freq: 932.33, time: 0.09, dur: 0.12 },
        { freq: 1108.73, time: 0.18, dur: 0.16 },
        { freq: 1479.98, time: 0.28, dur: 0.55 },
      ];

      notes.forEach(n => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(n.freq, now + n.time);

        gain.gain.setValueAtTime(0.65, now + n.time);
        gain.gain.exponentialRampToValueAtTime(0.001, now + n.time + n.dur);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(now + n.time);
        osc.stop(now + n.time + n.dur);
      });
    });
  }

  // Rintocco funebre solenne / campana a lutto tenebrosa (quando un giocatore muore)
  playDeathBell() {
    this._playSound((ctx, masterGain) => {
      const now = ctx.currentTime;
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
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(h.freq, now);

        // Attacco istantaneo per il colpo del battaglio e lungo riverbero
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(h.gain * 0.85, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + h.decay);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(now);
        osc.stop(now + h.decay);
      });
    });
  }

  // Chime melodico cristallino per notifica in arrivo (invito partita o richiesta amicizia)
  playNotification() {
    this._playSound((ctx, masterGain) => {
      const now = ctx.currentTime;
      // Due note armoniche scintillanti: Mi 5 (659.25 Hz) -> Sol# 5 (830.61 Hz)
      const notes = [
        { freq: 659.25, time: 0.0, dur: 0.28 },
        { freq: 830.61, time: 0.1, dur: 0.45 },
      ];

      notes.forEach(n => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(n.freq, now + n.time);

        gain.gain.setValueAtTime(0.55, now + n.time);
        gain.gain.exponentialRampToValueAtTime(0.001, now + n.time + n.dur);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(now + n.time);
        osc.stop(now + n.time + n.dur);
      });
    });
  }
}

export const sound = new SoundManager();

export function getSharedAudioContext() {
  sound.initContext();
  return sound.ctx;
}
