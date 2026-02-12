const SFX = {
  ctx: null,
  enabled: true,

  getCtx() {
    if (!this.ctx) {
      try {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {
        this.enabled = false;
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  },

  tone(freq, duration, type, vol, ramp) {
    if (!this.enabled) return;
    const c = this.getCtx();
    if (!c) return;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type || 'square';
    o.frequency.setValueAtTime(freq, c.currentTime);
    if (ramp) o.frequency.linearRampToValueAtTime(ramp, c.currentTime + duration);
    g.gain.setValueAtTime(vol || 0.15, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
    o.connect(g);
    g.connect(c.destination);
    o.start(c.currentTime);
    o.stop(c.currentTime + duration);
  },

  noise(duration, vol) {
    if (!this.enabled) return;
    const c = this.getCtx();
    if (!c) return;
    const buf = c.createBuffer(1, c.sampleRate * duration, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1);
    const src = c.createBufferSource();
    src.buffer = buf;
    const g = c.createGain();
    g.gain.setValueAtTime(vol || 0.12, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
    src.connect(g);
    g.connect(c.destination);
    src.start(c.currentTime);
  },

  hit()      { this.tone(400, 0.08, 'square', 0.12); },
  bounce()   { this.tone(300, 0.06, 'square', 0.08); },
  collect()  { this.tone(600, 0.1, 'sine', 0.12, 900); },
  sink()     { this.tone(500, 0.15, 'sine', 0.15, 800); setTimeout(() => this.tone(800, 0.2, 'sine', 0.12, 1200), 150); },
  explode()  { this.noise(0.3, 0.2); this.tone(100, 0.3, 'sawtooth', 0.1, 30); },
  splash()   { this.noise(0.15, 0.08); this.tone(200, 0.15, 'sine', 0.06, 80); },
  whoosh()   { this.noise(0.08, 0.06); this.tone(250, 0.08, 'sine', 0.04, 400); },
  shatter()  { this.noise(0.4, 0.25); this.tone(150, 0.4, 'sawtooth', 0.12, 40); },
  teleport() { this.tone(200, 0.15, 'sine', 0.1, 1000); this.tone(800, 0.15, 'sine', 0.08, 200); },
  powerup()  { this.tone(400, 0.08, 'sine', 0.1, 600); setTimeout(() => this.tone(600, 0.1, 'sine', 0.1, 800), 80); },
  click()    { this.tone(800, 0.03, 'square', 0.06); },
  error()    { this.tone(200, 0.15, 'square', 0.1, 100); },
  swing()    { this.tone(150, 0.1, 'sawtooth', 0.06, 300); },
  pour()     { this.noise(0.05, 0.04); this.tone(900, 0.06, 'sine', 0.03, 1200); },
};
