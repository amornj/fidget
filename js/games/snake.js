const SnakeGame = {
  name: 'Snake',
  instructions: 'Arrow keys or WASD to move. Eat food to grow!',

  canvas: null,
  ctx: null,
  snake: [],
  food: null,
  dir: { x: 1, y: 0 },
  nextDir: { x: 1, y: 0 },
  score: 0,
  gridSize: 20,
  cols: 0,
  rows: 0,
  interval: null,
  gameOver: false,

  init(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.cols = Math.floor(canvas.width / this.gridSize);
    this.rows = Math.floor(canvas.height / this.gridSize);
    this.reset();
    this._onKey = (e) => this.handleKey(e);
    document.addEventListener('keydown', this._onKey);
    this.interval = setInterval(() => this.update(), 100);
  },

  reset() {
    const cx = Math.floor(this.cols / 2);
    const cy = Math.floor(this.rows / 2);
    this.snake = [
      { x: cx, y: cy },
      { x: cx - 1, y: cy },
      { x: cx - 2, y: cy },
    ];
    this.dir = { x: 1, y: 0 };
    this.nextDir = { x: 1, y: 0 };
    this.score = 0;
    this.gameOver = false;
    this.spawnFood();
  },

  spawnFood() {
    let pos;
    do {
      pos = {
        x: Math.floor(Math.random() * this.cols),
        y: Math.floor(Math.random() * this.rows),
      };
    } while (this.snake.some(s => s.x === pos.x && s.y === pos.y));
    this.food = pos;
  },

  handleKey(e) {
    const map = {
      ArrowUp: { x: 0, y: -1 }, w: { x: 0, y: -1 }, W: { x: 0, y: -1 },
      ArrowDown: { x: 0, y: 1 }, s: { x: 0, y: 1 }, S: { x: 0, y: 1 },
      ArrowLeft: { x: -1, y: 0 }, a: { x: -1, y: 0 }, A: { x: -1, y: 0 },
      ArrowRight: { x: 1, y: 0 }, d: { x: 1, y: 0 }, D: { x: 1, y: 0 },
    };
    const nd = map[e.key];
    if (nd && (nd.x + this.dir.x !== 0 || nd.y + this.dir.y !== 0)) {
      this.nextDir = nd;
      e.preventDefault();
    }
    if (this.gameOver && e.key === ' ') {
      this.reset();
    }
  },

  update() {
    if (this.gameOver) return;

    this.dir = { ...this.nextDir };
    const head = {
      x: this.snake[0].x + this.dir.x,
      y: this.snake[0].y + this.dir.y,
    };

    // Wall collision
    if (head.x < 0 || head.x >= this.cols || head.y < 0 || head.y >= this.rows) {
      this.gameOver = true;
      this.draw();
      return;
    }

    // Self collision
    if (this.snake.some(s => s.x === head.x && s.y === head.y)) {
      this.gameOver = true;
      this.draw();
      return;
    }

    this.snake.unshift(head);

    if (head.x === this.food.x && head.y === this.food.y) {
      this.score += 10;
      this.spawnFood();
      if (typeof this.onScore === 'function') this.onScore(this.score);
    } else {
      this.snake.pop();
    }

    this.draw();
  },

  draw() {
    const { ctx, canvas, gridSize: g } = this;
    ctx.fillStyle = '#0f0f23';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid lines (subtle)
    ctx.strokeStyle = '#1a1a35';
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= canvas.width; x += g) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = 0; y <= canvas.height; y += g) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }

    // Food
    ctx.fillStyle = '#ff6b6b';
    ctx.shadowColor = '#ff6b6b';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(this.food.x * g + g / 2, this.food.y * g + g / 2, g / 2 - 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Snake
    this.snake.forEach((seg, i) => {
      const ratio = 1 - i / this.snake.length;
      const r = Math.round(72 + ratio * 30);
      const gr = Math.round(219 - ratio * 50);
      const b = Math.round(251 - ratio * 100);
      ctx.fillStyle = `rgb(${r},${gr},${b})`;
      ctx.beginPath();
      ctx.roundRect(seg.x * g + 1, seg.y * g + 1, g - 2, g - 2, 4);
      ctx.fill();
    });

    // Head eyes
    const head = this.snake[0];
    ctx.fillStyle = '#0f0f23';
    const ex = head.x * g + g / 2 + this.dir.x * 3;
    const ey = head.y * g + g / 2 + this.dir.y * 3;
    ctx.beginPath();
    ctx.arc(ex - 3, ey - 1, 2, 0, Math.PI * 2);
    ctx.arc(ex + 3, ey - 1, 2, 0, Math.PI * 2);
    ctx.fill();

    if (this.gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ff6b6b';
      ctx.font = 'bold 32px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over!', canvas.width / 2, canvas.height / 2 - 20);
      ctx.fillStyle = '#eee';
      ctx.font = '16px system-ui';
      ctx.fillText(`Score: ${this.score}`, canvas.width / 2, canvas.height / 2 + 15);
      ctx.fillStyle = '#666';
      ctx.font = '13px system-ui';
      ctx.fillText('Press SPACE to restart', canvas.width / 2, canvas.height / 2 + 45);
    }
  },

  destroy() {
    clearInterval(this.interval);
    document.removeEventListener('keydown', this._onKey);
  },
};
