/** Tiny WebAudio synthesizer: every sound effect and music loop is code, no files. Unlocked on the first touch (iOS). */

export interface Track { bpm: number; melody: number[]; bass: number[]; drums: string; melVoice?: OscillatorType; }

const midi = (n: number) => 440 * Math.pow(2, (n - 69) / 12);

/** World 1 – Der Boulevard: bouncy, C major, 124 bpm. One entry per eighth note (0 = rest). */
export const TRACK_BOULEVARD: Track = {
  bpm: 124,
  melody: [72, 76, 79, 76, 72, 76, 79, 81, 79, 76, 72, 74, 76, 74, 72, 0, 74, 77, 81, 77, 74, 77, 81, 83, 81, 79, 76, 74, 72, 0, 79, 0,
           76, 79, 84, 79, 76, 79, 84, 86, 84, 81, 79, 76, 77, 76, 74, 0, 72, 76, 79, 76, 81, 79, 76, 74, 72, 0, 67, 0, 72, 0, 0, 0],
  bass:   [48, 0, 52, 0, 48, 0, 55, 0, 53, 0, 52, 0, 48, 0, 55, 0, 50, 0, 53, 0, 50, 0, 57, 0, 53, 0, 52, 0, 48, 0, 55, 0,
           52, 0, 55, 0, 52, 0, 59, 0, 57, 0, 55, 0, 53, 0, 52, 0, 48, 0, 52, 0, 53, 0, 55, 0, 48, 0, 43, 0, 48, 0, 48, 0],
  drums: 'k.s.k.sHk.s.k.sHk.s.k.sHk.s.kHsHk.s.k.sHk.s.k.sHk.s.k.sHk.sHkHsH',
  melVoice: 'square',
};

/** Title theme: slower, dreamy triangle lead. */
export const TRACK_TITLE: Track = {
  bpm: 92,
  melody: [72, 0, 76, 0, 79, 0, 76, 0, 74, 0, 77, 0, 81, 0, 79, 0, 76, 0, 79, 0, 84, 0, 81, 0, 79, 0, 76, 0, 72, 0, 0, 0],
  bass:   [48, 0, 0, 0, 55, 0, 0, 0, 50, 0, 0, 0, 57, 0, 0, 0, 52, 0, 0, 0, 59, 0, 0, 0, 55, 0, 0, 0, 48, 0, 0, 0],
  drums:  'k...H...k...H...k...H...k...H...',
  melVoice: 'triangle',
};

class Synth {
  private ctx?: AudioContext;
  private master?: GainNode;
  private sfxBus?: GainNode;
  private musicBus?: GainNode;
  private noiseBuf?: AudioBuffer;
  sound = true;
  music = true;
  private track?: Track;
  private step = 0;
  private nextTime = 0;
  private timer?: number;

  unlock() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {}); return; }
    try {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AC();
      this.master = this.ctx.createGain(); this.master.gain.value = 0.9; this.master.connect(this.ctx.destination);
      this.sfxBus = this.ctx.createGain(); this.sfxBus.gain.value = 0.34; this.sfxBus.connect(this.master);
      this.musicBus = this.ctx.createGain(); this.musicBus.gain.value = 0.16; this.musicBus.connect(this.master);
      const len = this.ctx.sampleRate * 0.5;
      this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      if (this.track) this.startScheduler();
    } catch { /* no audio */ }
  }

  get ready() { return !!this.ctx; }

  setSound(on: boolean) { this.sound = on; }
  setMusic(on: boolean) { this.music = on; if (this.musicBus) this.musicBus.gain.value = on ? 0.16 : 0; }

  // ------------------------------------------------------------------ voices
  private tone(type: OscillatorType, f0: number, f1: number, dur: number, vol = 0.5, delay = 0, bus?: GainNode, when?: number) {
    if (!this.ctx) return;
    const out = bus ?? this.sfxBus;
    if (!out) return;
    const t = (when ?? this.ctx.currentTime) + delay;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(out);
    o.start(t); o.stop(t + dur + 0.03);
  }

  private noise(dur: number, vol = 0.3, hp = 600, delay = 0, bus?: GainNode, when?: number) {
    if (!this.ctx || !this.noiseBuf) return;
    const out = bus ?? this.sfxBus;
    if (!out) return;
    const t = (when ?? this.ctx.currentTime) + delay;
    const s = this.ctx.createBufferSource();
    s.buffer = this.noiseBuf;
    const f = this.ctx.createBiquadFilter();
    f.type = 'highpass'; f.frequency.value = hp;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(out);
    s.start(t); s.stop(t + dur + 0.02);
  }

  private sfx(fn: () => void) { if (this.sound) fn(); }

  // ------------------------------------------------------------------ sound effects
  jump() { this.sfx(() => this.tone('square', 320, 640, 0.12, 0.35)); }
  land() { this.sfx(() => this.noise(0.05, 0.18, 300)); }
  card(combo: number) {
    this.sfx(() => {
      const f = 780 * Math.pow(1.05946, Math.min(combo, 14));
      this.tone('square', f, f * 1.25, 0.08, 0.3);
      this.tone('triangle', f * 2, f * 2, 0.05, 0.15, 0.04);
    });
  }
  royal() { this.sfx(() => [660, 880, 1100, 1320].forEach((f, i) => this.tone('square', f, f, 0.09, 0.3, i * 0.06))); }
  stomp() { this.sfx(() => { this.tone('square', 240, 90, 0.13, 0.45); this.noise(0.07, 0.25, 250); }); }
  hurt() { this.sfx(() => { this.tone('sawtooth', 320, 80, 0.3, 0.4); this.noise(0.12, 0.2, 900); }); }
  throw() { this.sfx(() => this.tone('triangle', 520, 980, 0.07, 0.3)); }
  splash() { this.sfx(() => this.noise(0.08, 0.2, 1500)); }
  bump() { this.sfx(() => this.tone('square', 250, 400, 0.08, 0.4)); }
  checkpoint() { this.sfx(() => [523, 659, 784].forEach((f, i) => this.tone('square', f, f, 0.1, 0.3, i * 0.08))); }
  clear() { this.sfx(() => [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone('square', f, f, 0.16, 0.32, i * 0.1))); }
  die() { this.sfx(() => this.tone('square', 420, 55, 0.55, 0.4)); }
  gameover() { this.sfx(() => [392, 330, 262, 196].forEach((f, i) => this.tone('square', f, f * 0.9, 0.28, 0.35, i * 0.24))); }
  powerup() { this.sfx(() => [440, 554, 659, 880, 1109].forEach((f, i) => this.tone('triangle', f, f * 1.15, 0.09, 0.35, i * 0.055))); }
  downgrade() { this.sfx(() => this.tone('square', 600, 200, 0.22, 0.3)); }
  shout() { this.sfx(() => { this.tone('sawtooth', 180, 330, 0.28, 0.35); this.noise(0.22, 0.18, 1200); }); }
  notice() { this.sfx(() => this.tone('square', 880, 1320, 0.06, 0.25)); }
  click() { this.sfx(() => this.tone('square', 900, 700, 0.05, 0.2)); }
  pause() { this.sfx(() => [660, 440].forEach((f, i) => this.tone('square', f, f, 0.08, 0.25, i * 0.09))); }

  // ------------------------------------------------------------------ music sequencer
  play(track: Track) {
    if (this.track === track && this.timer) return;
    this.stop();
    this.track = track;
    this.step = 0;
    if (this.ctx) this.startScheduler();
  }

  stop() {
    if (this.timer) { window.clearInterval(this.timer); this.timer = undefined; }
    this.track = undefined;
  }

  private startScheduler() {
    if (!this.ctx || !this.track) return;
    this.nextTime = this.ctx.currentTime + 0.1;
    this.anchor = this.nextTime;
    this.timer = window.setInterval(() => this.schedule(), 90);
  }

  private anchor = 0;

  /** Seconds to the nearest eighth-note beat of the running track (Infinity without music). */
  beatOffset() {
    if (!this.ctx || !this.track || !this.timer) return Infinity;
    const eighth = 60 / this.track.bpm / 2;
    const phase = ((this.ctx.currentTime - this.anchor) % eighth + eighth) % eighth;
    return Math.min(phase, eighth - phase);
  }

  chord() { this.sfx(() => { [110, 165, 220, 330].forEach((f) => this.tone('sawtooth', f, f * 0.98, 0.55, 0.22)); this.noise(0.1, 0.2, 800); }); }
  punch() { this.sfx(() => { this.tone('square', 200, 120, 0.09, 0.4); this.noise(0.05, 0.2, 500); }); }
  spray() { this.sfx(() => this.noise(0.25, 0.22, 2500)); }
  djwave(perfect: boolean) { this.sfx(() => this.tone('sine', perfect ? 660 : 440, perfect ? 1320 : 660, 0.18, 0.4)); }
  khusra() { this.sfx(() => { this.tone('sawtooth', 120, 480, 0.6, 0.5); this.tone('square', 240, 960, 0.5, 0.3, 0.05); this.noise(0.5, 0.35, 400); }); }
  special() { this.sfx(() => [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => this.tone('triangle', f, f, 0.12, 0.35, i * 0.05))); }
  meterFull() { this.sfx(() => [880, 1109, 1319].forEach((f, i) => this.tone('square', f, f, 0.1, 0.3, i * 0.07))); }

  private schedule() {
    if (!this.ctx || !this.track || !this.musicBus) return;
    const tr = this.track;
    const eighth = 60 / tr.bpm / 2;
    while (this.nextTime < this.ctx.currentTime + 0.3) {
      const i = this.step % tr.melody.length;
      const m = tr.melody[i], b = tr.bass[i % tr.bass.length], d = tr.drums[i % tr.drums.length];
      const t = this.nextTime;
      if (m) this.tone(tr.melVoice ?? 'square', midi(m), midi(m), eighth * 0.9, 0.22, 0, this.musicBus, t);
      if (b) this.tone('triangle', midi(b), midi(b), eighth * 1.6, 0.35, 0, this.musicBus, t);
      if (d === 'k') this.tone('sine', 150, 40, 0.12, 0.6, 0, this.musicBus, t);
      if (d === 's') this.noise(0.09, 0.28, 1800, 0, this.musicBus, t);
      if (d === 'H' || d === 'h') this.noise(0.03, 0.12, 6000, 0, this.musicBus, t);
      this.nextTime += eighth;
      this.step++;
    }
  }
}

export const audio = new Synth();
