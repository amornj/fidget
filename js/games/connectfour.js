const ConnectFourGame = {
  name: 'Connect Four',
  instructions: 'Drop pieces to connect 4 in a row! Click a column to drop.',

  canvas: null,
  ctx: null,
  animFrame: null,
  state: 'menu',
  onScore: null,

  COLS: 7,
  ROWS: 6,
  COLORS: ['#e74c3c', '#f1c40f'],
  TEAM_NAMES: ['Red', 'Yellow'],

  // Game state
  board: [],
  currentPlayer: 0,
  playerCount: 2,
  players: [],
  teams: [],
  hoverCol: -1,
  winner: null,
  winCells: [],
  menuHover: -1,
  vsAI: false,
  aiTimeout: null,
  locked: false,

  // Drop animation
  dropAnim: null, // { col, targetRow, currentY, team, speed }

  MODES: [
    { label: '1 v 1', count: 2, desc: '2 players' },
    { label: '2 v 2', count: 4, desc: '4 players, teams' },
    { label: '3 v 3', count: 6, desc: '6 players, teams' }
  ],

  _onClick: null,
  _onMove: null,

  init(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.state = 'menu';
    this.menuHover = -1;
    this.vsAI = false;
    this._onClick = (e) => this.handleClick(e);
    this._onMove = (e) => this.handleMove(e);
    canvas.addEventListener('click', this._onClick);
    canvas.addEventListener('mousemove', this._onMove);
    this.gameLoop();
  },

  destroy() {
    if (this.animFrame) cancelAnimationFrame(this.animFrame);
    this.animFrame = null;
    if (this.aiTimeout) clearTimeout(this.aiTimeout);
    this.aiTimeout = null;
    if (this.canvas) {
      this.canvas.removeEventListener('click', this._onClick);
      this.canvas.removeEventListener('mousemove', this._onMove);
    }
  },

  gameLoop() {
    this.update();
    this.render();
    this.animFrame = requestAnimationFrame(() => this.gameLoop());
  },

  update() {
    // Animate dropping piece
    if (this.dropAnim) {
      const a = this.dropAnim;
      a.speed += 0.8; // gravity
      a.currentY += a.speed;
      const cellSize = this.getCellSize();
      const boardY = 60;
      const targetY = boardY + a.targetRow * cellSize + cellSize / 2;
      if (a.currentY >= targetY) {
        a.currentY = targetY;
        // Place piece
        this.board[a.targetRow][a.col] = a.team;
        SFX.hit();
        this.dropAnim = null;
        this.locked = false;

        if (this.checkWin(a.targetRow, a.col, a.team)) {
          this.winner = a.team;
          this.state = 'gameover';
          SFX.collect();
          if (this.onScore) this.onScore(this.TEAM_NAMES[a.team] + ' Wins!');
          return;
        }
        if (this.isBoardFull()) {
          this.winner = -1;
          this.state = 'gameover';
          if (this.onScore) this.onScore('Draw!');
          return;
        }
        this.nextTurn();
      }
    }
  },

  startGame(modeIndex) {
    const mode = this.MODES[modeIndex];
    this.playerCount = mode.count;
    this.board = [];
    for (let r = 0; r < this.ROWS; r++) {
      this.board.push(new Array(this.COLS).fill(-1));
    }
    this.players = [];
    this.teams = [];
    for (let i = 0; i < this.playerCount; i++) {
      this.players.push(i);
      this.teams.push(i % 2);
    }
    this.currentPlayer = 0;
    this.winner = null;
    this.winCells = [];
    this.dropAnim = null;
    this.hoverCol = -1;
    this.locked = false;
    this.state = 'playing';
    if (this.onScore) this.onScore(this.playerName(0) + ' (Red)');
  },

  getTeam(player) {
    return this.teams[player];
  },

  playerName(p) {
    if (this.vsAI && p >= 1) return 'CPU ' + p;
    return 'P' + (p + 1);
  },

  teamColor(team) {
    return this.COLORS[team];
  },

  dropPiece(col) {
    if (this.locked) return;
    for (let r = this.ROWS - 1; r >= 0; r--) {
      if (this.board[r][col] === -1) {
        const team = this.getTeam(this.currentPlayer);
        this.locked = true;
        const cellSize = this.getCellSize();
        this.dropAnim = {
          col: col,
          targetRow: r,
          currentY: 60 - cellSize / 2, // start above board
          team: team,
          speed: 0
        };
        return;
      }
    }
  },

  nextTurn() {
    this.currentPlayer = (this.currentPlayer + 1) % this.playerCount;
    const team = this.getTeam(this.currentPlayer);
    if (this.onScore) this.onScore(this.playerName(this.currentPlayer) + ' (' + this.TEAM_NAMES[team] + ')');

    if (this.vsAI && this.currentPlayer >= 1) {
      this.locked = true;
      this.aiTimeout = setTimeout(() => this.aiPlay(), 400 + Math.random() * 400);
    } else if (this.playerCount > 2 && !this.vsAI) {
      this.state = 'passturn';
    }
  },

  // ==================== AI ====================

  aiPlay() {
    const team = this.getTeam(this.currentPlayer);
    const otherTeam = 1 - team;

    // 1. Check for winning move
    for (let c = 0; c < this.COLS; c++) {
      const r = this.getDropRow(c);
      if (r === -1) continue;
      this.board[r][c] = team;
      const wins = this.checkWin(r, c, team);
      this.board[r][c] = -1;
      if (wins) { this.locked = false; this.dropPiece(c); return; }
    }

    // 2. Block opponent winning move
    for (let c = 0; c < this.COLS; c++) {
      const r = this.getDropRow(c);
      if (r === -1) continue;
      this.board[r][c] = otherTeam;
      const wins = this.checkWin(r, c, otherTeam);
      this.board[r][c] = -1;
      if (wins) { this.locked = false; this.dropPiece(c); return; }
    }

    // 3. Prefer center columns, avoid giving opponent a win above
    const scores = [];
    for (let c = 0; c < this.COLS; c++) {
      const r = this.getDropRow(c);
      if (r === -1) { scores.push(-1000); continue; }
      let score = 10 - Math.abs(c - 3) * 2; // center preference

      // Penalize if placing here gives opponent a win above
      if (r > 0) {
        this.board[r - 1][c] = otherTeam;
        if (this.checkWin(r - 1, c, otherTeam)) score -= 50;
        this.board[r - 1][c] = -1;
      }

      // Bonus for adjacent same-team pieces
      const dirs = [[0,1],[1,0],[1,1],[1,-1]];
      for (const [dr, dc] of dirs) {
        let count = 0;
        for (let d = -1; d <= 1; d += 2) {
          for (let i = 1; i <= 3; i++) {
            const nr = r + dr * i * d;
            const nc = c + dc * i * d;
            if (nr < 0 || nr >= this.ROWS || nc < 0 || nc >= this.COLS) break;
            if (this.board[nr][nc] === team) count++;
            else break;
          }
        }
        score += count * 3;
      }

      scores.push(score);
    }

    let bestScore = -Infinity;
    let bestCols = [];
    for (let c = 0; c < this.COLS; c++) {
      if (scores[c] > bestScore) { bestScore = scores[c]; bestCols = [c]; }
      else if (scores[c] === bestScore) bestCols.push(c);
    }

    const col = bestCols[Math.floor(Math.random() * bestCols.length)];
    this.locked = false;
    this.dropPiece(col);
  },

  getDropRow(col) {
    for (let r = this.ROWS - 1; r >= 0; r--) {
      if (this.board[r][col] === -1) return r;
    }
    return -1;
  },

  isBoardFull() {
    return this.board[0].every(c => c !== -1);
  },

  checkWin(row, col, team) {
    const dirs = [[0,1],[1,0],[1,1],[1,-1]];
    for (const [dr, dc] of dirs) {
      let count = 1;
      const cells = [[row, col]];
      for (let d = -1; d <= 1; d += 2) {
        for (let i = 1; i < 4; i++) {
          const r = row + dr * i * d;
          const c = col + dc * i * d;
          if (r < 0 || r >= this.ROWS || c < 0 || c >= this.COLS) break;
          if (this.board[r][c] !== team) break;
          count++;
          cells.push([r, c]);
        }
      }
      if (count >= 4) {
        this.winCells = cells;
        return true;
      }
    }
    return false;
  },

  // ==================== INPUT ====================

  getMousePos(e) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (this.canvas.width / rect.width),
      y: (e.clientY - rect.top) * (this.canvas.height / rect.height)
    };
  },

  handleClick(e) {
    const pos = this.getMousePos(e);

    if (this.state === 'menu') {
      // AI toggle
      if (pos.x >= 140 && pos.x <= 260 && pos.y >= 140 && pos.y <= 165) {
        this.vsAI = !this.vsAI;
        SFX.hit();
        return;
      }
      const modes = this.MODES;
      const cardW = 110;
      const gap = 15;
      const totalW = modes.length * cardW + (modes.length - 1) * gap;
      const sx = (400 - totalW) / 2;
      for (let i = 0; i < modes.length; i++) {
        const x = sx + i * (cardW + gap);
        if (pos.x >= x && pos.x <= x + cardW && pos.y >= 200 && pos.y <= 340) {
          SFX.collect();
          this.startGame(i);
          return;
        }
      }
    } else if (this.state === 'passturn') {
      this.state = 'playing';
      SFX.hit();
    } else if (this.state === 'playing') {
      if (this.locked) return;
      if (this.vsAI && this.currentPlayer >= 1) return;
      const cellSize = this.getCellSize();
      const boardX = (400 - this.COLS * cellSize) / 2;
      const col = Math.floor((pos.x - boardX) / cellSize);
      if (col >= 0 && col < this.COLS && this.board[0][col] === -1) {
        this.dropPiece(col);
      }
    } else if (this.state === 'gameover') {
      if (pos.x >= 120 && pos.x <= 280 && pos.y >= 380 && pos.y <= 420) {
        this.state = 'menu';
      }
    }
  },

  handleMove(e) {
    const pos = this.getMousePos(e);

    if (this.state === 'menu') {
      this.menuHover = -1;
      const modes = this.MODES;
      const cardW = 110;
      const gap = 15;
      const totalW = modes.length * cardW + (modes.length - 1) * gap;
      const sx = (400 - totalW) / 2;
      for (let i = 0; i < modes.length; i++) {
        const x = sx + i * (cardW + gap);
        if (pos.x >= x && pos.x <= x + cardW && pos.y >= 200 && pos.y <= 340) {
          this.menuHover = i;
          break;
        }
      }
    } else if (this.state === 'playing') {
      const cellSize = this.getCellSize();
      const boardX = (400 - this.COLS * cellSize) / 2;
      this.hoverCol = Math.floor((pos.x - boardX) / cellSize);
      if (this.hoverCol < 0 || this.hoverCol >= this.COLS) this.hoverCol = -1;
    }
  },

  getCellSize() {
    return Math.min(50, Math.floor(380 / this.COLS));
  },

  // ==================== RENDERING ====================

  render() {
    const ctx = this.ctx;
    if (!ctx) return;

    ctx.fillStyle = '#0f0f23';
    ctx.fillRect(0, 0, 400, 460);

    if (this.state === 'menu') {
      this.drawMenu();
    } else if (this.state === 'passturn') {
      this.drawPassScreen();
    } else if (this.state === 'playing' || this.state === 'gameover') {
      this.drawBoard();
      if (this.state === 'gameover') this.drawGameOver();
    }
  },

  drawMenu() {
    const ctx = this.ctx;

    ctx.fillStyle = '#48dbfb';
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Connect Four', 200, 80);

    ctx.font = '13px monospace';
    ctx.fillStyle = '#888';
    ctx.fillText('Choose player count', 200, 110);

    // AI toggle
    ctx.fillStyle = this.vsAI ? 'rgba(72,219,251,0.25)' : 'rgba(255,255,255,0.06)';
    ctx.strokeStyle = this.vsAI ? '#48dbfb' : '#666';
    ctx.lineWidth = 1;
    this.roundRect(ctx, 140, 140, 120, 25, 5);
    ctx.fill();
    ctx.stroke();
    ctx.font = 'bold 11px monospace';
    ctx.fillStyle = this.vsAI ? '#48dbfb' : '#888';
    ctx.fillText(this.vsAI ? '\uD83E\uDD16 vs CPU' : '\uD83C\uDFAE Local', 200, 157);

    const modes = this.MODES;
    const cardW = 110;
    const cardH = 140;
    const gap = 15;
    const totalW = modes.length * cardW + (modes.length - 1) * gap;
    const sx = (400 - totalW) / 2;

    for (let i = 0; i < modes.length; i++) {
      const m = modes[i];
      const x = sx + i * (cardW + gap);
      const y = 200;
      const hover = this.menuHover === i;

      ctx.fillStyle = hover ? 'rgba(72,219,251,0.25)' : 'rgba(255,255,255,0.06)';
      ctx.strokeStyle = hover ? '#48dbfb' : '#444';
      ctx.lineWidth = hover ? 2 : 1;
      this.roundRect(ctx, x, y, cardW, cardH, 10);
      ctx.fill();
      ctx.stroke();

      ctx.font = 'bold 28px monospace';
      ctx.fillStyle = '#e74c3c';
      ctx.fillText('\u25CF', x + 35, y + 50);
      ctx.fillStyle = '#f1c40f';
      ctx.fillText('\u25CF', x + 75, y + 50);

      ctx.font = 'bold 18px monospace';
      ctx.fillStyle = hover ? '#48dbfb' : '#fff';
      ctx.fillText(m.label, x + cardW / 2, y + 85);

      ctx.font = '10px monospace';
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.fillText(this.vsAI && i === 0 ? 'vs CPU' : m.desc, x + cardW / 2, y + 110);
    }

    ctx.textAlign = 'left';
  },

  drawPassScreen() {
    const ctx = this.ctx;
    const team = this.getTeam(this.currentPlayer);

    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = this.teamColor(team);
    ctx.fillText('Pass to ' + this.playerName(this.currentPlayer), 200, 180);

    ctx.font = '14px monospace';
    ctx.fillStyle = '#888';
    ctx.fillText('Team ' + this.TEAM_NAMES[team], 200, 220);

    ctx.font = 'bold 16px monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText('Click to continue', 200, 280);

    ctx.textAlign = 'left';
  },

  drawBoard() {
    const ctx = this.ctx;
    const cellSize = this.getCellSize();
    const boardW = this.COLS * cellSize;
    const boardH = this.ROWS * cellSize;
    const boardX = (400 - boardW) / 2;
    const boardY = 60;
    const radius = cellSize / 2 - 4;

    // Turn indicator
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    const team = this.getTeam(this.currentPlayer);
    ctx.fillStyle = this.teamColor(team);
    ctx.fillText(this.playerName(this.currentPlayer) + ' (' + this.TEAM_NAMES[team] + ')', 200, 30);

    // Player list
    ctx.font = '10px monospace';
    ctx.fillStyle = '#888';
    const pList = this.players.map(p => this.playerName(p) + ':' + this.TEAM_NAMES[this.getTeam(p)]).join('  ');
    ctx.fillText(pList, 200, 50);

    // Hover preview above board (only for human player)
    const showHover = this.state === 'playing' && this.hoverCol >= 0 && this.hoverCol < this.COLS && !this.locked;
    if (showHover && !(this.vsAI && this.currentPlayer >= 1)) {
      const px = boardX + this.hoverCol * cellSize + cellSize / 2;
      ctx.globalAlpha = 0.4;
      ctx.fillStyle = this.teamColor(team);
      ctx.beginPath();
      ctx.arc(px, boardY - cellSize / 2 + 5, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // Layer 1: Draw placed pieces BEHIND the board
    for (let r = 0; r < this.ROWS; r++) {
      for (let c = 0; c < this.COLS; c++) {
        const val = this.board[r][c];
        if (val !== -1) {
          const cx = boardX + c * cellSize + cellSize / 2;
          const cy = boardY + r * cellSize + cellSize / 2;
          ctx.fillStyle = this.COLORS[val];
          ctx.beginPath();
          ctx.arc(cx, cy, radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // Layer 1b: Draw dropping animation piece (also behind the board)
    if (this.dropAnim) {
      const a = this.dropAnim;
      const cx = boardX + a.col * cellSize + cellSize / 2;
      ctx.fillStyle = this.COLORS[a.team];
      ctx.beginPath();
      ctx.arc(cx, a.currentY, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Layer 2: Draw board overlay with circular holes (even-odd fill)
    ctx.beginPath();
    // Outer rectangle (clockwise)
    const bx = boardX - 5, by = boardY - 5, bw = boardW + 10, bh = boardH + 10;
    ctx.moveTo(bx, by);
    ctx.lineTo(bx + bw, by);
    ctx.lineTo(bx + bw, by + bh);
    ctx.lineTo(bx, by + bh);
    ctx.closePath();
    // Cut circular holes (counter-clockwise via arc(..., true))
    for (let r = 0; r < this.ROWS; r++) {
      for (let c = 0; c < this.COLS; c++) {
        const cx = boardX + c * cellSize + cellSize / 2;
        const cy = boardY + r * cellSize + cellSize / 2;
        ctx.moveTo(cx + radius, cy);
        ctx.arc(cx, cy, radius, 0, Math.PI * 2, true);
      }
    }
    ctx.fillStyle = '#1a3a6a';
    ctx.fill('evenodd');

    // Win highlight rings (on top of board)
    for (const [wr, wc] of this.winCells) {
      const cx = boardX + wc * cellSize + cellSize / 2;
      const cy = boardY + wr * cellSize + cellSize / 2;
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy, radius + 2, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.textAlign = 'left';
  },

  drawGameOver() {
    const ctx = this.ctx;

    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, 400, 460);

    ctx.font = 'bold 28px monospace';
    ctx.textAlign = 'center';
    if (this.winner === -1) {
      ctx.fillStyle = '#888';
      ctx.fillText('Draw!', 200, 340);
    } else {
      ctx.fillStyle = this.COLORS[this.winner];
      ctx.fillText(this.TEAM_NAMES[this.winner] + ' Wins!', 200, 340);
    }

    ctx.fillStyle = 'rgba(72,219,251,0.3)';
    ctx.strokeStyle = '#48dbfb';
    ctx.lineWidth = 1.5;
    this.roundRect(ctx, 120, 380, 160, 40, 8);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 14px monospace';
    ctx.fillStyle = '#48dbfb';
    ctx.fillText('Play Again', 200, 406);

    ctx.textAlign = 'left';
  },

  roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
};
