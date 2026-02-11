const PongGame = {
  name: 'Pong',
  instructions: 'Move mouse up/down to control paddle. First to 7 wins!',

  canvas: null,
  ctx: null,
  animFrame: null,

  player: null,
  ai: null,
  ball: null,
  pScore: 0,
  aiScore: 0,
  winScore: 7,
  winner: null,
  particles: [],
  rallyCount: 0,

  paddleW: 10,
  paddleH: 60,
  ballR: 7,

  init(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.pScore = 0;
    this.aiScore = 0;
    this.winner = null;
    this.rallyCount = 0;
    this.particles = [];

    this.player = { x: 15, y: canvas.height / 2 - this.paddleH / 2 };
    this.ai = { x: canvas.width - 15 - this.paddleW, y: canvas.height / 2 - this.paddleH / 2 };
    this.resetBall(1);

    this._onMove = (e) => this.handleMove(e);
    this._onClick = () => { if (this.winner) this.restart(); };
    canvas.addEventListener('mousemove', this._onMove);
    canvas.addEventListener('click', this._onClick);

    this.loop();
  },

  resetBall(dir) {
    this.ball = {
      x: this.canvas.width / 2,
      y: this.canvas.height / 2,
      vx: 4 * (dir || 1),
      vy: (Math.random() - 0.5) * 4,
    };
    this.rallyCount = 0;
  },

  restart() {
    this.pScore = 0;
    this.aiScore = 0;
    this.winner = null;
    this.particles = [];
    this.resetBall(1);
    this.updateScore();
  },

  getCanvasPos(e) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (this.canvas.width / rect.width),
      y: (e.clientY - rect.top) * (this.canvas.height / rect.height),
    };
  },

  handleMove(e) {
    const pos = this.getCanvasPos(e);
    this.player.y = Math.max(0, Math.min(this.canvas.height - this.paddleH, pos.y - this.paddleH / 2));
  },

  loop() {
    this.update();
    this.draw();
    this.animFrame = requestAnimationFrame(() => this.loop());
  },

  update() {
    if (this.winner) return;

    const b = this.ball;
    const p = this.player;
    const a = this.ai;

    // AI tracks ball with some imperfection
    const aiCenter = a.y + this.paddleH / 2;
    const targetY = b.x > this.canvas.width * 0.3 ? b.y + b.vy * 8 : this.canvas.height / 2;
    const aiSpeed = 3.5 + Math.min(this.rallyCount * 0.1, 1.5);
    if (aiCenter < targetY - 8) a.y += aiSpeed;
    else if (aiCenter > targetY + 8) a.y -= aiSpeed;
    a.y = Math.max(0, Math.min(this.canvas.height - this.paddleH, a.y));

    // Move ball
    b.x += b.vx;
    b.y += b.vy;

    // Top/bottom walls
    if (b.y - this.ballR < 0) { b.y = this.ballR; b.vy = Math.abs(b.vy); }
    if (b.y + this.ballR > this.canvas.height) { b.y = this.canvas.height - this.ballR; b.vy = -Math.abs(b.vy); }

    // Player paddle hit
    if (b.vx < 0 &&
        b.x - this.ballR <= p.x + this.paddleW &&
        b.x - this.ballR >= p.x &&
        b.y >= p.y && b.y <= p.y + this.paddleH) {
      const hit = (b.y - (p.y + this.paddleH / 2)) / (this.paddleH / 2);
      const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
      const newSpeed = Math.min(speed + 0.15, 10);
      b.vx = Math.abs(Math.cos(hit * 0.7) * newSpeed);
      b.vy = Math.sin(hit * 0.7) * newSpeed;
      b.x = p.x + this.paddleW + this.ballR;
      this.rallyCount++;
      this.spawnHitParticles(b.x, b.y, '#48dbfb');
    }

    // AI paddle hit
    if (b.vx > 0 &&
        b.x + this.ballR >= a.x &&
        b.x + this.ballR <= a.x + this.paddleW &&
        b.y >= a.y && b.y <= a.y + this.paddleH) {
      const hit = (b.y - (a.y + this.paddleH / 2)) / (this.paddleH / 2);
      const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
      const newSpeed = Math.min(speed + 0.15, 10);
      b.vx = -Math.abs(Math.cos(hit * 0.7) * newSpeed);
      b.vy = Math.sin(hit * 0.7) * newSpeed;
      b.x = a.x - this.ballR;
      this.rallyCount++;
      this.spawnHitParticles(b.x, b.y, '#ff6b6b');
    }

    // Scoring
    if (b.x < -20) {
      this.aiScore++;
      this.updateScore();
      if (this.aiScore >= this.winScore) { this.winner = 'AI'; return; }
      this.resetBall(1);
    }
    if (b.x > this.canvas.width + 20) {
      this.pScore++;
      this.updateScore();
      if (this.pScore >= this.winScore) { this.winner = 'Player'; return; }
      this.resetBall(-1);
    }

    // Particles
    this.particles = this.particles.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      return p.life > 0;
    });
  },

  spawnHitParticles(x, y, color) {
    for (let i = 0; i < 8; i++) {
      this.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 5,
        vy: (Math.random() - 0.5) * 5,
        color,
        life: 15,
      });
    }
  },

  updateScore() {
    if (typeof this.onScore === 'function') {
      this.onScore(`You: ${this.pScore} | AI: ${this.aiScore}`);
    }
  },

  draw() {
    const { ctx, canvas } = this;

    ctx.fillStyle = '#0f0f23';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Center line
    ctx.setLineDash([8, 8]);
    ctx.strokeStyle = '#1a2a4a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);

    // Scores
    ctx.fillStyle = 'rgba(72,219,251,0.2)';
    ctx.font = 'bold 60px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(this.pScore, canvas.width * 0.25, 70);
    ctx.fillStyle = 'rgba(255,107,107,0.2)';
    ctx.fillText(this.aiScore, canvas.width * 0.75, 70);

    // Player paddle
    ctx.fillStyle = '#48dbfb';
    ctx.shadowColor = '#48dbfb';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.roundRect(this.player.x, this.player.y, this.paddleW, this.paddleH, 4);
    ctx.fill();

    // AI paddle
    ctx.fillStyle = '#ff6b6b';
    ctx.shadowColor = '#ff6b6b';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.roundRect(this.ai.x, this.ai.y, this.paddleW, this.paddleH, 4);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Ball
    const b = this.ball;
    ctx.fillStyle = '#fff';
    ctx.shadowColor = '#fff';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(b.x, b.y, this.ballR, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Ball trail
    const trailLen = 5;
    for (let i = 1; i <= trailLen; i++) {
      ctx.fillStyle = `rgba(255,255,255,${0.15 - i * 0.025})`;
      ctx.beginPath();
      ctx.arc(b.x - b.vx * i * 0.8, b.y - b.vy * i * 0.8, this.ballR - i * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Particles
    this.particles.forEach(p => {
      ctx.globalAlpha = p.life / 15;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
    });
    ctx.globalAlpha = 1;

    // Rally counter
    if (this.rallyCount > 3) {
      ctx.fillStyle = `rgba(254,202,87,${Math.min(1, (this.rallyCount - 3) * 0.15)})`;
      ctx.font = 'bold 14px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(`Rally: ${this.rallyCount}`, canvas.width / 2, canvas.height - 12);
    }

    // Winner overlay
    if (this.winner) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = this.winner === 'Player' ? '#48dbfb' : '#ff6b6b';
      ctx.font = 'bold 30px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(`${this.winner} Wins!`, canvas.width / 2, canvas.height / 2 - 15);
      ctx.fillStyle = '#666';
      ctx.font = '13px system-ui';
      ctx.fillText('Click to play again', canvas.width / 2, canvas.height / 2 + 25);
    }
  },

  destroy() {
    cancelAnimationFrame(this.animFrame);
    this.canvas.removeEventListener('mousemove', this._onMove);
    this.canvas.removeEventListener('click', this._onClick);
  },
};
