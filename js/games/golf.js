const GolfGame = {
  name: 'Mini Golf',
  instructions: 'Click & drag from the ball to aim and set power. Release to shoot!',

  canvas: null,
  ctx: null,
  animFrame: null,

  ball: null,
  hole: null,
  walls: [],
  dragging: false,
  dragStart: null,
  strokes: 0,
  level: 0,
  sunk: false,
  sunkTimer: 0,
  totalStrokes: 0,
  message: '',
  messageTimer: 0,

  levels: [
    // Level 1 - straight shot
    {
      ball: { x: 80, y: 380 },
      hole: { x: 320, y: 80 },
      walls: [
        { x: 30, y: 30, w: 360, h: 10 },
        { x: 30, y: 430, w: 360, h: 10 },
        { x: 30, y: 30, w: 10, h: 410 },
        { x: 380, y: 30, w: 10, h: 410 },
      ],
    },
    // Level 2 - L shape
    {
      ball: { x: 80, y: 380 },
      hole: { x: 340, y: 100 },
      walls: [
        { x: 30, y: 30, w: 360, h: 10 },
        { x: 30, y: 430, w: 360, h: 10 },
        { x: 30, y: 30, w: 10, h: 410 },
        { x: 380, y: 30, w: 10, h: 410 },
        { x: 160, y: 130, w: 10, h: 250 },
      ],
    },
    // Level 3 - zigzag
    {
      ball: { x: 70, y: 400 },
      hole: { x: 350, y: 60 },
      walls: [
        { x: 30, y: 30, w: 360, h: 10 },
        { x: 30, y: 430, w: 360, h: 10 },
        { x: 30, y: 30, w: 10, h: 410 },
        { x: 380, y: 30, w: 10, h: 410 },
        { x: 130, y: 30, w: 10, h: 280 },
        { x: 260, y: 160, w: 10, h: 280 },
      ],
    },
    // Level 4 - obstacles
    {
      ball: { x: 70, y: 230 },
      hole: { x: 350, y: 230 },
      walls: [
        { x: 30, y: 30, w: 360, h: 10 },
        { x: 30, y: 430, w: 360, h: 10 },
        { x: 30, y: 30, w: 10, h: 410 },
        { x: 380, y: 30, w: 10, h: 410 },
        { x: 150, y: 120, w: 10, h: 100 },
        { x: 150, y: 270, w: 10, h: 100 },
        { x: 260, y: 160, w: 10, h: 60 },
        { x: 260, y: 270, w: 10, h: 60 },
      ],
    },
    // Level 5 - tight squeeze
    {
      ball: { x: 200, y: 400 },
      hole: { x: 200, y: 60 },
      walls: [
        { x: 30, y: 30, w: 360, h: 10 },
        { x: 30, y: 430, w: 360, h: 10 },
        { x: 30, y: 30, w: 10, h: 410 },
        { x: 380, y: 30, w: 10, h: 410 },
        { x: 100, y: 130, w: 120, h: 10 },
        { x: 200, y: 130, w: 120, h: 10 },
        { x: 80, y: 250, w: 130, h: 10 },
        { x: 220, y: 250, w: 130, h: 10 },
        { x: 140, y: 340, w: 10, h: 80 },
        { x: 260, y: 340, w: 10, h: 80 },
      ],
    },
  ],

  init(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.level = 0;
    this.totalStrokes = 0;
    this.loadLevel();

    this._onMouseDown = (e) => this.mouseDown(e);
    this._onMouseMove = (e) => this.mouseMove(e);
    this._onMouseUp = (e) => this.mouseUp(e);
    canvas.addEventListener('mousedown', this._onMouseDown);
    canvas.addEventListener('mousemove', this._onMouseMove);
    canvas.addEventListener('mouseup', this._onMouseUp);

    this.loop();
  },

  loadLevel() {
    const lvl = this.levels[this.level % this.levels.length];
    this.ball = { ...lvl.ball, vx: 0, vy: 0, r: 8 };
    this.hole = { ...lvl.hole, r: 12 };
    this.walls = lvl.walls.map(w => ({ ...w }));
    this.strokes = 0;
    this.sunk = false;
    this.message = `Hole ${this.level + 1}`;
    this.messageTimer = 90;
    if (typeof this.onScore === 'function') {
      this.onScore(`Hole ${this.level + 1} | Total: ${this.totalStrokes}`);
    }
  },

  getCanvasPos(e) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (this.canvas.width / rect.width),
      y: (e.clientY - rect.top) * (this.canvas.height / rect.height),
    };
  },

  mouseDown(e) {
    if (this.sunk || this.ballMoving()) return;
    const pos = this.getCanvasPos(e);
    const dx = pos.x - this.ball.x;
    const dy = pos.y - this.ball.y;
    if (Math.sqrt(dx * dx + dy * dy) < 30) {
      this.dragging = true;
      this.dragStart = pos;
    }
  },

  mouseMove(e) {
    if (this.dragging) {
      this.dragEnd = this.getCanvasPos(e);
      this.draw();
    }
  },

  mouseUp(e) {
    if (!this.dragging) return;
    this.dragging = false;
    const end = this.getCanvasPos(e);
    let dx = this.dragStart.x - end.x;
    let dy = this.dragStart.y - end.y;
    const power = Math.min(Math.sqrt(dx * dx + dy * dy), 150);
    const angle = Math.atan2(dy, dx);
    this.ball.vx = Math.cos(angle) * power * 0.08;
    this.ball.vy = Math.sin(angle) * power * 0.08;
    this.strokes++;
    this.totalStrokes++;
    if (typeof this.onScore === 'function') {
      this.onScore(`Hole ${this.level + 1} | Strokes: ${this.strokes} | Total: ${this.totalStrokes}`);
    }
  },

  ballMoving() {
    return Math.abs(this.ball.vx) > 0.1 || Math.abs(this.ball.vy) > 0.1;
  },

  loop() {
    this.update();
    this.draw();
    this.animFrame = requestAnimationFrame(() => this.loop());
  },

  update() {
    if (this.messageTimer > 0) this.messageTimer--;

    if (this.sunk) {
      this.sunkTimer--;
      if (this.sunkTimer <= 0) {
        this.level++;
        if (this.level >= this.levels.length) {
          this.message = `All done! Total: ${this.totalStrokes} strokes`;
          this.messageTimer = 999999;
          this.level = 0;
          this.totalStrokes = 0;
          setTimeout(() => this.loadLevel(), 3000);
        } else {
          this.loadLevel();
        }
      }
      return;
    }

    const b = this.ball;
    const friction = 0.985;
    b.vx *= friction;
    b.vy *= friction;
    if (Math.abs(b.vx) < 0.1) b.vx = 0;
    if (Math.abs(b.vy) < 0.1) b.vy = 0;

    b.x += b.vx;
    b.y += b.vy;

    // Wall collisions
    for (const w of this.walls) {
      const closestX = Math.max(w.x, Math.min(b.x, w.x + w.w));
      const closestY = Math.max(w.y, Math.min(b.y, w.y + w.h));
      const dx = b.x - closestX;
      const dy = b.y - closestY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < b.r) {
        // Push out
        if (dist === 0) {
          b.x = w.x - b.r;
          b.vx = -Math.abs(b.vx) * 0.7;
        } else {
          const overlap = b.r - dist;
          const nx = dx / dist;
          const ny = dy / dist;
          b.x += nx * overlap;
          b.y += ny * overlap;

          const dot = b.vx * nx + b.vy * ny;
          b.vx -= 2 * dot * nx;
          b.vy -= 2 * dot * ny;
          b.vx *= 0.7;
          b.vy *= 0.7;
        }
      }
    }

    // Hole check
    const hdx = b.x - this.hole.x;
    const hdy = b.y - this.hole.y;
    const hdist = Math.sqrt(hdx * hdx + hdy * hdy);
    const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);

    if (hdist < this.hole.r - 2 && speed < 8) {
      this.sunk = true;
      this.sunkTimer = 60;
      b.vx = 0;
      b.vy = 0;
      b.x = this.hole.x;
      b.y = this.hole.y;
      const par = 3;
      const diff = this.strokes - par;
      if (diff <= -2) this.message = 'Eagle!';
      else if (diff === -1) this.message = 'Birdie!';
      else if (diff === 0) this.message = 'Par!';
      else if (diff === 1) this.message = 'Bogey';
      else this.message = `+${diff}`;
      this.messageTimer = 60;
    }
  },

  draw() {
    const { ctx, canvas } = this;
    ctx.fillStyle = '#1a472a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Walls
    ctx.fillStyle = '#5a3a1a';
    for (const w of this.walls) {
      ctx.fillRect(w.x, w.y, w.w, w.h);
      // Highlight
      ctx.fillStyle = '#7a5a2a';
      ctx.fillRect(w.x, w.y, w.w, 2);
      ctx.fillStyle = '#5a3a1a';
    }

    // Hole
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(this.hole.x, this.hole.y, this.hole.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Flag
    ctx.fillStyle = '#ff6b6b';
    ctx.fillRect(this.hole.x, this.hole.y - 35, 1.5, 35);
    ctx.beginPath();
    ctx.moveTo(this.hole.x + 1.5, this.hole.y - 35);
    ctx.lineTo(this.hole.x + 18, this.hole.y - 28);
    ctx.lineTo(this.hole.x + 1.5, this.hole.y - 21);
    ctx.fillStyle = '#ff6b6b';
    ctx.fill();

    // Ball
    if (!this.sunk) {
      const b = this.ball;
      ctx.fillStyle = '#fff';
      ctx.shadowColor = 'rgba(0,0,0,0.3)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      // Ball shine
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.beginPath();
      ctx.arc(b.x - 2, b.y - 2, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Drag indicator
    if (this.dragging && this.dragEnd) {
      const dx = this.dragStart.x - this.dragEnd.x;
      const dy = this.dragStart.y - this.dragEnd.y;
      const power = Math.min(Math.sqrt(dx * dx + dy * dy), 150);
      const angle = Math.atan2(dy, dx);

      // Power line
      ctx.strokeStyle = `rgba(255, ${Math.round(255 - power * 1.5)}, 50, 0.8)`;
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(this.ball.x, this.ball.y);
      ctx.lineTo(
        this.ball.x + Math.cos(angle) * power * 0.5,
        this.ball.y + Math.sin(angle) * power * 0.5
      );
      ctx.stroke();
      ctx.setLineDash([]);

      // Power indicator
      ctx.fillStyle = '#feca57';
      ctx.font = '12px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(`${Math.round(power)}%`, this.ball.x, this.ball.y - 20);
    }

    // Message
    if (this.messageTimer > 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.font = 'bold 24px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(this.message, canvas.width / 2, canvas.height / 2);
    }
  },

  destroy() {
    cancelAnimationFrame(this.animFrame);
    this.canvas.removeEventListener('mousedown', this._onMouseDown);
    this.canvas.removeEventListener('mousemove', this._onMouseMove);
    this.canvas.removeEventListener('mouseup', this._onMouseUp);
  },
};
