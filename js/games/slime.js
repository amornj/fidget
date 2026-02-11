const SlimeGame = {
  name: 'Slime Volley',
  instructions: 'A/D to move, W to jump. First to 7 wins!',

  canvas: null,
  ctx: null,
  animFrame: null,
  lastTime: 0,

  // Physics
  gravity: 0.4,
  groundY: 0,
  netX: 0,
  netH: 60,
  netW: 6,

  player: null,
  ai: null,
  ball: null,
  pScore: 0,
  aiScore: 0,
  winScore: 7,
  serving: true,
  winner: null,
  keys: {},

  init(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.groundY = canvas.height - 30;
    this.netX = canvas.width / 2;
    this.pScore = 0;
    this.aiScore = 0;
    this.winner = null;
    this.keys = {};
    this.resetRound('player');

    this._onKeyDown = (e) => { this.keys[e.key.toLowerCase()] = true; e.preventDefault(); };
    this._onKeyUp = (e) => { this.keys[e.key.toLowerCase()] = false; };
    document.addEventListener('keydown', this._onKeyDown);
    document.addEventListener('keyup', this._onKeyUp);

    this.lastTime = performance.now();
    this.loop();
  },

  resetRound(server) {
    this.player = { x: 100, y: this.groundY, vy: 0, r: 30, speed: 4 };
    this.ai = { x: this.canvas.width - 100, y: this.groundY, vy: 0, r: 30, speed: 3.5 };

    const bx = server === 'player' ? 100 : this.canvas.width - 100;
    this.ball = { x: bx, y: 100, vx: 0, vy: 0, r: 10 };
    this.serving = true;
  },

  loop() {
    const now = performance.now();
    const dt = Math.min((now - this.lastTime) / 16.67, 2);
    this.lastTime = now;
    this.update(dt);
    this.draw();
    this.animFrame = requestAnimationFrame(() => this.loop());
  },

  update(dt) {
    if (this.winner) {
      if (this.keys[' ']) {
        this.pScore = 0;
        this.aiScore = 0;
        this.winner = null;
        this.resetRound('player');
      }
      return;
    }

    const p = this.player;
    const a = this.ai;
    const b = this.ball;

    // Player movement
    if (this.keys['a'] || this.keys['arrowleft']) p.x -= p.speed * dt;
    if (this.keys['d'] || this.keys['arrowright']) p.x += p.speed * dt;
    if ((this.keys['w'] || this.keys['arrowup']) && p.y >= this.groundY) p.vy = -9;

    p.vy += this.gravity * dt;
    p.y += p.vy * dt;
    if (p.y > this.groundY) { p.y = this.groundY; p.vy = 0; }
    p.x = Math.max(p.r, Math.min(this.netX - this.netW / 2 - p.r, p.x));

    // AI movement
    const targetX = b.x > this.netX ? b.x + b.vx * 10 : this.canvas.width - 100;
    if (a.x < targetX - 10) a.x += a.speed * dt;
    else if (a.x > targetX + 10) a.x -= a.speed * dt;

    const ballApproaching = b.x > this.netX && b.y < this.groundY - 80;
    const ballClose = Math.abs(b.x - a.x) < 60;
    if (ballClose && b.y < a.y - 20 && a.y >= this.groundY) {
      a.vy = -8;
    }

    a.vy += this.gravity * dt;
    a.y += a.vy * dt;
    if (a.y > this.groundY) { a.y = this.groundY; a.vy = 0; }
    a.x = Math.max(this.netX + this.netW / 2 + a.r, Math.min(this.canvas.width - a.r, a.x));

    // Ball physics
    if (this.serving) {
      if (this.keys[' '] || this.keys['w'] || this.keys['arrowup']) {
        b.vy = -7;
        b.vx = 2;
        this.serving = false;
      }
      return;
    }

    b.vy += this.gravity * dt;
    b.x += b.vx * dt;
    b.y += b.vy * dt;

    // Wall bounces
    if (b.x - b.r < 0) { b.x = b.r; b.vx *= -0.8; }
    if (b.x + b.r > this.canvas.width) { b.x = this.canvas.width - b.r; b.vx *= -0.8; }
    if (b.y - b.r < 0) { b.y = b.r; b.vy *= -0.8; }

    // Net collision
    if (b.y + b.r > this.groundY - this.netH &&
        b.y < this.groundY &&
        Math.abs(b.x - this.netX) < this.netW / 2 + b.r) {
      b.vx *= -1;
      b.x = b.x < this.netX ? this.netX - this.netW / 2 - b.r : this.netX + this.netW / 2 + b.r;
    }

    // Top of net collision
    if (Math.abs(b.x - this.netX) < this.netW / 2 + b.r &&
        Math.abs(b.y - (this.groundY - this.netH)) < b.r) {
      b.vy = -Math.abs(b.vy) * 0.8;
      b.y = this.groundY - this.netH - b.r;
    }

    // Slime-ball collision
    [p, a].forEach(slime => {
      const dx = b.x - slime.x;
      const dy = b.y - slime.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < slime.r + b.r) {
        const angle = Math.atan2(dy, dx);
        const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
        const newSpeed = Math.max(speed, 6);
        b.vx = Math.cos(angle) * newSpeed;
        b.vy = Math.sin(angle) * newSpeed;
        b.x = slime.x + Math.cos(angle) * (slime.r + b.r + 1);
        b.y = slime.y + Math.sin(angle) * (slime.r + b.r + 1);
      }
    });

    // Ball hits ground - score
    if (b.y + b.r >= this.groundY) {
      if (b.x < this.netX) {
        this.aiScore++;
        if (typeof this.onScore === 'function') this.onScore(`You: ${this.pScore} | AI: ${this.aiScore}`);
        if (this.aiScore >= this.winScore) { this.winner = 'AI'; return; }
        this.resetRound('ai');
      } else {
        this.pScore++;
        if (typeof this.onScore === 'function') this.onScore(`You: ${this.pScore} | AI: ${this.aiScore}`);
        if (this.pScore >= this.winScore) { this.winner = 'Player'; return; }
        this.resetRound('player');
      }
    }
  },

  draw() {
    const { ctx, canvas } = this;
    ctx.fillStyle = '#0f0f23';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Ground
    ctx.fillStyle = '#1e3a1e';
    ctx.fillRect(0, this.groundY, canvas.width, canvas.height - this.groundY);

    // Net
    ctx.fillStyle = '#aaa';
    ctx.fillRect(this.netX - this.netW / 2, this.groundY - this.netH, this.netW, this.netH);

    // Player slime (blue)
    const p = this.player;
    ctx.fillStyle = '#48dbfb';
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, Math.PI, 0);
    ctx.fill();
    // Eye
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(p.x + 10, p.y - 12, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0f0f23';
    ctx.beginPath();
    ctx.arc(p.x + 12, p.y - 12, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // AI slime (red)
    const a = this.ai;
    ctx.fillStyle = '#ff6b6b';
    ctx.beginPath();
    ctx.arc(a.x, a.y, a.r, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(a.x - 10, a.y - 12, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0f0f23';
    ctx.beginPath();
    ctx.arc(a.x - 12, a.y - 12, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Ball
    const b = this.ball;
    ctx.fillStyle = '#feca57';
    ctx.shadowColor = '#feca57';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Score display
    ctx.fillStyle = '#48dbfb';
    ctx.font = 'bold 24px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(this.pScore, this.netX / 2, 35);
    ctx.fillStyle = '#ff6b6b';
    ctx.fillText(this.aiScore, this.netX + this.netX / 2, 35);

    if (this.serving) {
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = '14px system-ui';
      ctx.fillText('Press W or SPACE to serve', canvas.width / 2, 70);
    }

    if (this.winner) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = this.winner === 'Player' ? '#48dbfb' : '#ff6b6b';
      ctx.font = 'bold 30px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(`${this.winner} Wins!`, canvas.width / 2, canvas.height / 2 - 15);
      ctx.fillStyle = '#666';
      ctx.font = '13px system-ui';
      ctx.fillText('Press SPACE to play again', canvas.width / 2, canvas.height / 2 + 25);
    }
  },

  destroy() {
    cancelAnimationFrame(this.animFrame);
    document.removeEventListener('keydown', this._onKeyDown);
    document.removeEventListener('keyup', this._onKeyUp);
  },
};
