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

  // Menu state
  state: 'menu', // 'menu', 'playing', 'gameover'
  speed: 100,     // ms per tick
  walls: true,    // die on wall hit
  selectedOption: 0,
  menuOptions: ['speed', 'walls', 'play'],

  init(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.cols = Math.floor(canvas.width / this.gridSize);
    this.rows = Math.floor(canvas.height / this.gridSize);
    this.state = 'menu';
    this.selectedOption = 0;
    this.speed = 100;
    this.walls = true;
    this.score = 0;
    this.gameOver = false;
    this._onClick = (e) => this.handleClick(e);
    this._onKey = (e) => this.handleKey(e);
    canvas.addEventListener('click', this._onClick);
    document.addEventListener('keydown', this._onKey);
    this.drawMenu();
  },

  getCanvasPos(e) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (this.canvas.width / rect.width),
      y: (e.clientY - rect.top) * (this.canvas.height / rect.height),
    };
  },

  handleClick(e) {
    const pos = this.getCanvasPos(e);
    const cx = this.canvas.width / 2;

    if (this.state === 'menu') {
      // Speed buttons
      if (pos.y > 175 && pos.y < 215) {
        if (pos.x > cx - 100 && pos.x < cx - 30) { this.speed = 120; this.drawMenu(); }
        else if (pos.x > cx - 25 && pos.x < cx + 45) { this.speed = 100; this.drawMenu(); }
        else if (pos.x > cx + 50 && pos.x < cx + 110) { this.speed = 60; this.drawMenu(); }
      }
      // Walls toggle
      if (pos.y > 235 && pos.y < 275) {
        if (pos.x > cx - 60 && pos.x < cx + 60) {
          this.walls = !this.walls;
          this.drawMenu();
        }
      }
      // Play button
      if (pos.y > 300 && pos.y < 360 && pos.x > cx - 80 && pos.x < cx + 80) {
        this.startGame();
      }
    }
  },

  handleKey(e) {
    if (this.state === 'menu') {
      if (e.key === ' ' || e.key === 'Enter') {
        this.startGame();
        e.preventDefault();
      }
      return;
    }

    if (this.state === 'gameover') {
      if (e.key === ' ') {
        this.state = 'menu';
        this.drawMenu();
      }
      return;
    }

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
  },

  startGame() {
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
    this.state = 'playing';
    this.spawnFood();
    if (this.interval) clearInterval(this.interval);
    this.interval = setInterval(() => this.update(), this.speed);
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

  update() {
    if (this.state !== 'playing') return;

    this.dir = { ...this.nextDir };
    const head = {
      x: this.snake[0].x + this.dir.x,
      y: this.snake[0].y + this.dir.y,
    };

    // Wall collision
    if (this.walls) {
      if (head.x < 0 || head.x >= this.cols || head.y < 0 || head.y >= this.rows) {
        this.endGame();
        return;
      }
    } else {
      // Wrap around
      if (head.x < 0) head.x = this.cols - 1;
      if (head.x >= this.cols) head.x = 0;
      if (head.y < 0) head.y = this.rows - 1;
      if (head.y >= this.rows) head.y = 0;
    }

    // Self collision
    if (this.snake.some(s => s.x === head.x && s.y === head.y)) {
      this.endGame();
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

  endGame() {
    this.state = 'gameover';
    clearInterval(this.interval);
    this.interval = null;
    this.draw();
  },

  drawMenu() {
    const { ctx, canvas } = this;
    const cx = canvas.width / 2;

    ctx.fillStyle = '#0f0f23';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid lines (subtle background)
    ctx.strokeStyle = '#1a1a35';
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= canvas.width; x += this.gridSize) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = 0; y <= canvas.height; y += this.gridSize) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }

    // Decorative snake
    const deco = [
      { x: 5, y: 5 }, { x: 6, y: 5 }, { x: 7, y: 5 }, { x: 8, y: 5 },
      { x: 9, y: 5 }, { x: 9, y: 6 }, { x: 9, y: 7 }, { x: 8, y: 7 },
      { x: 7, y: 7 }, { x: 6, y: 7 }, { x: 5, y: 7 }, { x: 5, y: 8 },
      { x: 5, y: 9 }, { x: 6, y: 9 }, { x: 7, y: 9 },
    ];
    deco.forEach((seg, i) => {
      const ratio = 1 - i / deco.length;
      ctx.fillStyle = `rgba(72, 219, 251, ${0.15 + ratio * 0.15})`;
      ctx.beginPath();
      ctx.roundRect(seg.x * this.gridSize + 1, seg.y * this.gridSize + 1, this.gridSize - 2, this.gridSize - 2, 4);
      ctx.fill();
    });

    // Title
    ctx.fillStyle = '#48dbfb';
    ctx.font = 'bold 36px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('🐍 Snake', cx, 80);

    // Subtitle
    ctx.fillStyle = '#666';
    ctx.font = '13px system-ui';
    ctx.fillText('Eat food. Grow. Don\'t crash.', cx, 110);

    // Speed setting
    ctx.fillStyle = '#aaa';
    ctx.font = 'bold 14px system-ui';
    ctx.fillText('SPEED', cx, 165);

    const speeds = [
      { label: 'Slow', val: 120, x: cx - 65 },
      { label: 'Normal', val: 100, x: cx + 10 },
      { label: 'Fast', val: 60, x: cx + 80 },
    ];
    speeds.forEach(s => {
      const active = this.speed === s.val;
      ctx.fillStyle = active ? '#48dbfb' : '#2a2a4a';
      ctx.beginPath();
      ctx.roundRect(s.x - 32, 178, 64, 32, 8);
      ctx.fill();
      if (active) {
        ctx.strokeStyle = '#48dbfb';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      ctx.fillStyle = active ? '#0f0f23' : '#666';
      ctx.font = active ? 'bold 13px system-ui' : '13px system-ui';
      ctx.fillText(s.label, s.x, 199);
    });

    // Walls toggle
    ctx.fillStyle = '#aaa';
    ctx.font = 'bold 14px system-ui';
    ctx.fillText('WALLS', cx, 235);

    ctx.fillStyle = this.walls ? '#48dbfb' : '#2a2a4a';
    ctx.beginPath();
    ctx.roundRect(cx - 50, 245, 100, 32, 8);
    ctx.fill();
    ctx.fillStyle = this.walls ? '#0f0f23' : '#666';
    ctx.font = '13px system-ui';
    ctx.fillText(this.walls ? 'On (die on walls)' : 'Off (wrap around)', cx, 266);

    // Play button
    ctx.shadowColor = '#48dbfb';
    ctx.shadowBlur = 15;
    ctx.fillStyle = '#48dbfb';
    ctx.beginPath();
    ctx.roundRect(cx - 70, 310, 140, 50, 12);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#0f0f23';
    ctx.font = 'bold 20px system-ui';
    ctx.fillText('▶  PLAY', cx, 342);

    // Hint
    ctx.fillStyle = '#555';
    ctx.font = '12px system-ui';
    ctx.fillText('or press SPACE / ENTER', cx, 390);

    // Controls reminder
    ctx.fillStyle = '#444';
    ctx.font = '11px system-ui';
    ctx.fillText('Controls: Arrow keys or WASD', cx, 430);
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

    if (this.state === 'gameover') {
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
      ctx.fillText('Press SPACE for menu', canvas.width / 2, canvas.height / 2 + 45);
    }
  },

  destroy() {
    clearInterval(this.interval);
    this.canvas.removeEventListener('click', this._onClick);
    document.removeEventListener('keydown', this._onKey);
  },
};
