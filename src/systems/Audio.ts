/** Tiny WebAudio synthesizer: every sound effect is code, no files. Unlocked on the first touch (iOS). */
class Synth {
  private ctx?: AudioContext;
  private master?: GainNode;
  private noiseBuf?: AudioBuffer;
  muted = false;

  unlock() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {}); return; }
    try {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.32;
      this.master.connect(this.ctx.destination);
      const len = this.ctx.sampleRate * 0.5;
      this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    } catch { /* no audio */ }
  }

  private tone(type: OscillatorType, f0: number, f1: number, dur: number, vol = 0.5, delay = 0) {
    if (!this.ctx || !this.master || this.muted) return;
    const t = this.ctx.currentTime + delay;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(this.master);
    o.start(t); o.stop(t + dur + 0.03);
  }

  private noise(dur: number, vol = 0.3, hp = 600, delay = 0) {
    if (!this.ctx || !this.master || !this.noiseBuf || this.muted) return;
    const t = this.ctx.currentTime + delay;
    const s = this.ctx.createBufferSource();
    s.buffer = this.noiseBuf;
    const f = this.ctx.createBiquadFilter();
    f.type = 'highpass'; f.frequency.value = hp;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(this.master);
    s.start(t); s.stop(t + dur + 0.02);
  }

  jump() { this.tone('square', 320, 640, 0.12, 0.35); }
  land() { this.noise(0.05, 0.18, 300); }
  card(combo: number) {
    const f = 780 * Math.pow(1.05946, Math.min(combo, 14));
    this.tone('square', f, f * 1.25, 0.08, 0.3);
    this.tone('triangle', f * 2, f * 2, 0.05, 0.15, 0.04);
  }
  royal() { [660, 880, 1100, 1320].forEach((f, i) => this.tone('square', f, f, 0.09, 0.3, i * 0.06)); }
  stomp() { this.tone('square', 240, 90, 0.13, 0.45); this.noise(0.07, 0.25, 250); }
  hurt() { this.tone('sawtooth', 320, 80, 0.3, 0.4); this.noise(0.12, 0.2, 900); }
  throw() { this.tone('triangle', 520, 980, 0.07, 0.3); }
  splash() { this.noise(0.08, 0.2, 1500); }
  bump() { this.tone('square', 250, 400, 0.08, 0.4); }
  checkpoint() { [523, 659, 784].forEach((f, i) => this.tone('square', f, f, 0.1, 0.3, i * 0.08)); }
  clear() { [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone('square', f, f, 0.16, 0.32, i * 0.1)); }
  die() { this.tone('square', 420, 55, 0.55, 0.4); }
  gameover() { [392, 330, 262, 196].forEach((f, i) => this.tone('square', f, f * 0.9, 0.28, 0.35, i * 0.24)); }
  powerup() { [440, 554, 659, 880, 1109].forEach((f, i) => this.tone('triangle', f, f * 1.15, 0.09, 0.35, i * 0.055)); }
  downgrade() { this.tone('square', 600, 200, 0.22, 0.3); }
  shout() { this.tone('sawtooth', 180, 330, 0.28, 0.35); this.noise(0.22, 0.18, 1200); }
  notice() { this.tone('square', 880, 1320, 0.06, 0.25); }
}

export const audio = new Synth();
