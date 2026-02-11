const BreakoutGame = {
  name: 'Breakout',
  instructions: 'Move mouse to control paddle. Break all the bricks!',

  canvas: null,
  ctx: null,
  animFrame: null,

  paddle: null,
  ball: null,
  bricks: [],
  score: 0,
  lives: 3,
  level: 1,
  state: 'ready', // 'ready', 'playing', 'win', 'lose'
  particles: [],

  brickRows: 6,
  brickCols: 8,
  brickW: 0,
  brickH: 18,
  brickPad: 3,
  brickTop: 50,

  init(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.particles = [];

    this.brickW = (canvas.width - (this.brickCols + 1) * this.brickPad) / this.brickCols;

    this.resetBall();
    this.buildBricks();
    this.state = 'ready';

    this._onMove = (e) => this.handleMove(e);
    this._onClick = (e) => this.handleClick(e);
    canvas.addEventListener('mousemove', this._onMove);
    canvas.addEventListener('click', this._onClick);

    this.loop();
  },

  resetBall() {
    this.paddle = { x: this.canvas ? this.canvas.width / 2 : 200, y: this.canvas ? this.canvas.height - 30 : 430, w: 70, h: 10 };
    this.ball = {
      x: this.paddle.x,
      y: this.paddle.y - 12,
      r: 6,
      vx: 3 * (Math.random() > 0.5 ? 1 : -1),
      vy: -4,
    };
  },

  buildBricks() {
    this.bricks = [];
    const colors = ['#ff6b6b', '#ff9f43', '#feca57', '#48dbfb', '#a29bfe', '#ff9ff3'];
    for (let r = 0; r < this.brickRows; r++) {
      for (let c = 0; c < this.brickCols; c++) {
        this.bricks.push({
          x: this.brickPad + c * (this.brickW + this.brickPad),
          y: this.brickTop + r * (this.brickH + this.brickPad),
          w: this.brickW,
          h: this.brickH,
          alive: true,
          color: colors[r % colors.length],
          points: (this.brickRows - r) * 10,
        });
      }
    }
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
    this.paddle.x = Math.max(this.paddle.w / 2, Math.min(this.canvas.width - this.paddle.w / 2, pos.x));
    if (this.state === 'ready') {
      this.ball.x = this.paddle.x;
    }
  },

  handleClick(e) {
    if (this.state === 'ready') {
      this.state = 'playing';
    } else if (this.state === 'win' || this.state === 'lose') {
      this.score = 0;
      this.lives = 3;
      this.level = 1;
      this.resetBall();
      this.buildBricks();
      this.state = 'ready';
    }
  },

  loop() {
    this.update();
    this.draw();
    this.animFrame = requestAnimationFrame(() => this.loop());
  },

  update() {
    // Particles
    this.particles = this.particles.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.1;
      p.life--;
      return p.life > 0;
    });

    if (this.state !== 'playing') return;

    const b = this.ball;
    b.x += b.vx;
    b.y += b.vy;

    // Wall bounce
    if (b.x - b.r < 0) { b.x = b.r; b.vx = Math.abs(b.vx); }
    if (b.x + b.r > this.canvas.width) { b.x = this.canvas.width - b.r; b.vx = -Math.abs(b.vx); }
    if (b.y - b.r < 0) { b.y = b.r; b.vy = Math.abs(b.vy); }

    // Paddle bounce
    const p = this.paddle;
    if (b.vy > 0 &&
        b.y + b.r >= p.y &&
        b.y + b.r <= p.y + p.h + 6 &&
        b.x > p.x - p.w / 2 &&
        b.x < p.x + p.w / 2) {
      const hit = (b.x - p.x) / (p.w / 2); // -1 to 1
      const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
      const newSpeed = Math.min(speed + 0.02, 7);
      b.vx = hit * newSpeed * 0.8;
      b.vy = -Math.abs(b.vy);
      b.y = p.y - b.r;
    }

    // Ball lost
    if (b.y - b.r > this.canvas.height) {
      this.lives--;
      if (this.lives <= 0) {
        this.state = 'lose';
      } else {
        this.resetBall();
        this.state = 'ready';
      }
      this.updateScore();
      return;
    }

    // Brick collision
    for (const brick of this.bricks) {
      if (!brick.alive) continue;
      if (b.x + b.r > brick.x && b.x - b.r < brick.x + brick.w &&
          b.y + b.r > brick.y && b.y - b.r < brick.y + brick.h) {
        brick.alive = false;
        this.score += brick.points;

        // Determine bounce direction
        const overlapL = b.x + b.r - brick.x;
        const overlapR = brick.x + brick.w - (b.x - b.r);
        const overlapT = b.y + b.r - brick.y;
        const overlapB = brick.y + brick.h - (b.y - b.r);
        const minOverlap = Math.min(overlapL, overlapR, overlapT, overlapB);
        if (minOverlap === overlapT || minOverlap === overlapB) b.vy *= -1;
        else b.vx *= -1;

        // Particles
        for (let i = 0; i < 6; i++) {
          this.particles.push({
            x: brick.x + brick.w / 2,
            y: brick.y + brick.h / 2,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            color: brick.color,
            life: 25,
          });
        }

        this.updateScore();
        break;
      }
    }

    // Check win
    if (this.bricks.every(b => !b.alive)) {
      this.level++;
      this.buildBricks();
      this.resetBall();
      this.state = 'ready';
    }
  },

  updateScore() {
    if (typeof this.onScore === 'function') {
      this.onScore(`Score: ${this.score} | Lives: ${'❤️'.repeat(this.lives)}`);
    }
  },

  draw() {
    const { ctx, canvas } = this;
    ctx.fillStyle = '#0f0f23';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Bricks
    for (const brick of this.bricks) {
      if (!brick.alive) continue;
      ctx.fillStyle = brick.color;
      ctx.beginPath();
      ctx.roundRect(brick.x, brick.y, brick.w, brick.h, 3);
      ctx.fill();
      // Highlight
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.fillRect(brick.x + 2, brick.y + 1, brick.w - 4, brick.h / 2 - 1);
    }

    // Paddle
    ctx.fillStyle = '#48dbfb';
    ctx.shadowColor = '#48dbfb';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.roundRect(this.paddle.x - this.paddle.w / 2, this.paddle.y, this.paddle.w, this.paddle.h, 5);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Ball
    ctx.fillStyle = '#fff';
    ctx.shadowColor = '#fff';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(this.ball.x, this.ball.y, this.ball.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Particles
    this.particles.forEach(p => {
      ctx.globalAlpha = p.life / 25;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
    });
    ctx.globalAlpha = 1;

    // Lives & Level
    ctx.fillStyle = '#555';
    ctx.font = '11px system-ui';
    ctx.textAlign = 'left';
    ctx.fillText(`Level ${this.level}`, 8, 15);
    ctx.textAlign = 'right';
    ctx.fillText(`${'❤️'.repeat(this.lives)}`, canvas.width - 8, 16);
    ctx.textAlign = 'center';

    // State overlays
    if (this.state === 'ready') {
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = '15px system-ui';
      ctx.fillText('Click to launch', canvas.width / 2, canvas.height - 60);
    }

    if (this.state === 'win') {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#feca57';
      ctx.font = 'bold 30px system-ui';
      ctx.fillText('You Win!', canvas.width / 2, canvas.height / 2 - 15);
      ctx.fillStyle = '#eee';
      ctx.font = '15px system-ui';
      ctx.fillText(`Score: ${this.score}`, canvas.width / 2, canvas.height / 2 + 15);
      ctx.fillStyle = '#666';
      ctx.font = '13px system-ui';
      ctx.fillText('Click to play again', canvas.width / 2, canvas.height / 2 + 45);
    }

    if (this.state === 'lose') {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ff6b6b';
      ctx.font = 'bold 30px system-ui';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 15);
      ctx.fillStyle = '#eee';
      ctx.font = '15px system-ui';
      ctx.fillText(`Score: ${this.score}`, canvas.width / 2, canvas.height / 2 + 15);
      ctx.fillStyle = '#666';
      ctx.font = '13px system-ui';
      ctx.fillText('Click to play again', canvas.width / 2, canvas.height / 2 + 45);
    }
  },

  destroy() {
    cancelAnimationFrame(this.animFrame);
    this.canvas.removeEventListener('mousemove', this._onMove);
    this.canvas.removeEventListener('click', this._onClick);
  },
};
