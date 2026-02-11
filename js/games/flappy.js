const FlappyGame = {
  name: 'Flappy',
  instructions: 'Click or press SPACE to flap. Avoid the pipes!',

  canvas: null,
  ctx: null,
  animFrame: null,

  bird: null,
  pipes: [],
  score: 0,
  bestScore: 0,
  state: 'ready', // 'ready', 'playing', 'dead'
  ground: 0,
  pipeTimer: 0,
  pipeInterval: 90,
  pipeGap: 130,
  pipeW: 45,
  pipeSpeed: 2.2,
  gravity: 0.35,
  flapStrength: -6.5,
  frameCount: 0,

  init(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ground = canvas.height - 40;
    this.score = 0;
    this.pipes = [];
    this.pipeTimer = 0;
    this.frameCount = 0;
    this.state = 'ready';
    this.resetBird();

    this._onClick = () => this.flap();
    this._onKey = (e) => { if (e.key === ' ') { e.preventDefault(); this.flap(); } };
    canvas.addEventListener('click', this._onClick);
    document.addEventListener('keydown', this._onKey);

    this.loop();
  },

  resetBird() {
    this.bird = {
      x: 80,
      y: this.canvas ? this.canvas.height / 2 - 30 : 200,
      vy: 0,
      r: 14,
      rotation: 0,
      flapFrame: 0,
    };
  },

  flap() {
    if (this.state === 'ready') {
      this.state = 'playing';
      this.bird.vy = this.flapStrength;
      this.bird.flapFrame = 8;
    } else if (this.state === 'playing') {
      this.bird.vy = this.flapStrength;
      this.bird.flapFrame = 8;
    } else if (this.state === 'dead') {
      this.score = 0;
      this.pipes = [];
      this.pipeTimer = 0;
      this.frameCount = 0;
      this.resetBird();
      this.state = 'ready';
      this.updateScore();
    }
  },

  loop() {
    this.update();
    this.draw();
    this.animFrame = requestAnimationFrame(() => this.loop());
  },

  update() {
    this.frameCount++;

    if (this.state !== 'playing') return;

    const b = this.bird;
    b.vy += this.gravity;
    b.y += b.vy;
    b.rotation = Math.min(b.vy * 0.08, 1.2);
    if (b.flapFrame > 0) b.flapFrame--;

    // Ground collision
    if (b.y + b.r > this.ground) {
      b.y = this.ground - b.r;
      this.die();
      return;
    }
    // Ceiling
    if (b.y - b.r < 0) {
      b.y = b.r;
      b.vy = 0;
    }

    // Spawn pipes
    this.pipeTimer++;
    if (this.pipeTimer >= this.pipeInterval) {
      this.pipeTimer = 0;
      const gapY = 80 + Math.random() * (this.ground - 80 - this.pipeGap - 40);
      this.pipes.push({
        x: this.canvas.width,
        gapY: gapY,
        scored: false,
      });
    }

    // Move pipes
    for (let i = this.pipes.length - 1; i >= 0; i--) {
      const p = this.pipes[i];
      p.x -= this.pipeSpeed;

      // Score
      if (!p.scored && p.x + this.pipeW < b.x) {
        p.scored = true;
        this.score++;
        this.updateScore();
      }

      // Remove offscreen
      if (p.x + this.pipeW < -10) {
        this.pipes.splice(i, 1);
      }

      // Collision
      if (b.x + b.r > p.x && b.x - b.r < p.x + this.pipeW) {
        if (b.y - b.r < p.gapY || b.y + b.r > p.gapY + this.pipeGap) {
          this.die();
          return;
        }
      }
    }
  },

  die() {
    this.state = 'dead';
    if (this.score > this.bestScore) this.bestScore = this.score;
  },

  updateScore() {
    if (typeof this.onScore === 'function') {
      this.onScore(`Score: ${this.score} | Best: ${this.bestScore}`);
    }
  },

  draw() {
    const { ctx, canvas } = this;

    // Sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, this.ground);
    skyGrad.addColorStop(0, '#1a1a3e');
    skyGrad.addColorStop(1, '#0f2027');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, canvas.width, this.ground);

    // Stars
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    for (let i = 0; i < 30; i++) {
      const sx = (i * 137 + 50) % canvas.width;
      const sy = (i * 97 + 20) % (this.ground - 40);
      ctx.fillRect(sx, sy, 1.5, 1.5);
    }

    // Ground
    ctx.fillStyle = '#1e3a1e';
    ctx.fillRect(0, this.ground, canvas.width, canvas.height - this.ground);
    ctx.fillStyle = '#2a5a2a';
    ctx.fillRect(0, this.ground, canvas.width, 3);

    // Pipes
    for (const p of this.pipes) {
      // Top pipe
      const topH = p.gapY;
      const pipeGrad = ctx.createLinearGradient(p.x, 0, p.x + this.pipeW, 0);
      pipeGrad.addColorStop(0, '#2a8a4a');
      pipeGrad.addColorStop(0.5, '#3aba6a');
      pipeGrad.addColorStop(1, '#2a8a4a');

      ctx.fillStyle = pipeGrad;
      ctx.fillRect(p.x, 0, this.pipeW, topH);
      // Lip
      ctx.fillRect(p.x - 3, topH - 18, this.pipeW + 6, 18);

      // Bottom pipe
      const botY = p.gapY + this.pipeGap;
      ctx.fillStyle = pipeGrad;
      ctx.fillRect(p.x, botY, this.pipeW, this.ground - botY);
      ctx.fillRect(p.x - 3, botY, this.pipeW + 6, 18);

      // Pipe highlights
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      ctx.fillRect(p.x + 4, 0, 6, topH - 18);
      ctx.fillRect(p.x + 4, botY + 18, 6, this.ground - botY - 18);
    }

    // Bird
    const b = this.bird;
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(b.rotation);

    // Body
    ctx.fillStyle = '#feca57';
    ctx.beginPath();
    ctx.ellipse(0, 0, b.r, b.r - 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wing
    ctx.fillStyle = '#f0b429';
    const wingY = b.flapFrame > 0 ? -6 : 2;
    ctx.beginPath();
    ctx.ellipse(-4, wingY, 8, 5, -0.3, 0, Math.PI * 2);
    ctx.fill();

    // Eye
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(6, -4, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(7.5, -3.5, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Beak
    ctx.fillStyle = '#ff6b6b';
    ctx.beginPath();
    ctx.moveTo(b.r - 2, -2);
    ctx.lineTo(b.r + 7, 1);
    ctx.lineTo(b.r - 2, 4);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    // Score (big, center)
    if (this.state === 'playing') {
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.font = 'bold 40px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(this.score, canvas.width / 2, 50);
    }

    // Ready screen
    if (this.state === 'ready') {
      ctx.fillStyle = '#feca57';
      ctx.font = 'bold 28px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('Flappy', canvas.width / 2, canvas.height / 2 - 60);

      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = '15px system-ui';
      ctx.fillText('Click or SPACE to flap', canvas.width / 2, canvas.height / 2 - 25);

      if (this.bestScore > 0) {
        ctx.fillStyle = '#48dbfb';
        ctx.font = '13px system-ui';
        ctx.fillText(`Best: ${this.bestScore}`, canvas.width / 2, canvas.height / 2 + 5);
      }
    }

    // Dead screen
    if (this.state === 'dead') {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#ff6b6b';
      ctx.font = 'bold 30px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 40);

      ctx.fillStyle = '#feca57';
      ctx.font = 'bold 22px system-ui';
      ctx.fillText(`${this.score}`, canvas.width / 2, canvas.height / 2);

      if (this.score >= this.bestScore && this.score > 0) {
        ctx.fillStyle = '#48dbfb';
        ctx.font = '14px system-ui';
        ctx.fillText('New Best!', canvas.width / 2, canvas.height / 2 + 25);
      }

      ctx.fillStyle = '#666';
      ctx.font = '13px system-ui';
      ctx.fillText('Click or SPACE to retry', canvas.width / 2, canvas.height / 2 + 55);
    }
  },

  destroy() {
    cancelAnimationFrame(this.animFrame);
    this.canvas.removeEventListener('click', this._onClick);
    document.removeEventListener('keydown', this._onKey);
  },
};
