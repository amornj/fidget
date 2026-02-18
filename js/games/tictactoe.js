const TicTacToeGame = {
  name: 'Tic Tac Toe',
  instructions: 'Click a cell to place your mark. Get X or O in a row to win!',

  canvas: null,
  ctx: null,
  animFrame: null,
  state: 'menu',
  onScore: null,

  MARKS: ['X', 'O'],
  MARK_COLORS: ['#48dbfb', '#ff6b6b'],
  TEAM_NAMES: ['X Team', 'O Team'],

  // Game state
  boardSize: 3,
  winLength: 3,
  board: [],
  currentPlayer: 0,
  playerCount: 2,
  players: [],
  teams: [],
  winner: null,
  winCells: [],
  menuHover: -1,
  vsAI: false,
  aiTimeout: null,

  // Mark animation
  markAnims: [], // { row, col, team, scale, growing }

  MODES: [
    { label: '1 v 1', count: 2, size: 3, win: 3, desc: '3x3 board' },
    { label: '2 v 2', count: 4, size: 5, win: 4, desc: '5x5 board' },
    { label: '3 v 3', count: 6, size: 7, win: 4, desc: '7x7 board' }
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
    // Animate marks growing
    for (const a of this.markAnims) {
      if (a.scale < 1) {
        a.scale = Math.min(1, a.scale + 0.12);
      }
    }
  },

  startGame(modeIndex) {
    const mode = this.MODES[modeIndex];
    this.playerCount = mode.count;
    this.boardSize = mode.size;
    this.winLength = mode.win;
    this.board = [];
    for (let r = 0; r < this.boardSize; r++) {
      this.board.push(new Array(this.boardSize).fill(-1));
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
    this.markAnims = [];
    this.state = 'playing';
    if (this.onScore) this.onScore(this.playerName(0) + ' (X)');
  },

  getTeam(player) {
    return this.teams[player];
  },

  playerName(p) {
    if (this.vsAI && p >= 1) return 'CPU ' + p;
    return 'P' + (p + 1);
  },

  placeMark(row, col) {
    const team = this.getTeam(this.currentPlayer);
    this.board[row][col] = team;
    this.markAnims.push({ row, col, team, scale: 0 });
    SFX.hit();

    if (this.checkWin(row, col, team)) {
      this.winner = team;
      this.state = 'gameover';
      SFX.collect();
      if (this.onScore) this.onScore(this.TEAM_NAMES[team] + ' Wins!');
      return;
    }

    if (this.isBoardFull()) {
      this.winner = -1;
      this.state = 'gameover';
      if (this.onScore) this.onScore('Draw!');
      return;
    }

    this.currentPlayer = (this.currentPlayer + 1) % this.playerCount;
    const nextTeam = this.getTeam(this.currentPlayer);
    if (this.onScore) this.onScore(this.playerName(this.currentPlayer) + ' (' + this.MARKS[nextTeam] + ')');

    if (this.vsAI && this.currentPlayer >= 1) {
      this.aiTimeout = setTimeout(() => this.aiPlay(), 400 + Math.random() * 400);
    } else if (this.playerCount > 2 && !this.vsAI) {
      this.state = 'passturn';
    }
  },

  // ==================== AI ====================

  aiPlay() {
    const team = this.getTeam(this.currentPlayer);
    const otherTeam = 1 - team;

    // For 3x3 use minimax, for larger boards use heuristic
    if (this.boardSize === 3) {
      const move = this.minimaxBest(team);
      if (move) { this.placeMark(move.row, move.col); return; }
    }

    // 1. Win if possible
    for (let r = 0; r < this.boardSize; r++) {
      for (let c = 0; c < this.boardSize; c++) {
        if (this.board[r][c] !== -1) continue;
        this.board[r][c] = team;
        if (this.checkWin(r, c, team)) { this.board[r][c] = -1; this.placeMark(r, c); return; }
        this.board[r][c] = -1;
      }
    }

    // 2. Block opponent win
    for (let r = 0; r < this.boardSize; r++) {
      for (let c = 0; c < this.boardSize; c++) {
        if (this.board[r][c] !== -1) continue;
        this.board[r][c] = otherTeam;
        if (this.checkWin(r, c, otherTeam)) { this.board[r][c] = -1; this.placeMark(r, c); return; }
        this.board[r][c] = -1;
      }
    }

    // 3. Center, then heuristic
    const center = Math.floor(this.boardSize / 2);
    if (this.board[center][center] === -1) { this.placeMark(center, center); return; }

    // Score each empty cell
    let bestScore = -Infinity;
    let bestMoves = [];
    for (let r = 0; r < this.boardSize; r++) {
      for (let c = 0; c < this.boardSize; c++) {
        if (this.board[r][c] !== -1) continue;
        let score = -Math.abs(r - center) - Math.abs(c - center); // prefer center
        // Count adjacent same-team
        const dirs = [[0,1],[1,0],[1,1],[1,-1]];
        for (const [dr, dc] of dirs) {
          let count = 0;
          for (let d = -1; d <= 1; d += 2) {
            for (let i = 1; i < this.winLength; i++) {
              const nr = r + dr * i * d;
              const nc = c + dc * i * d;
              if (nr < 0 || nr >= this.boardSize || nc < 0 || nc >= this.boardSize) break;
              if (this.board[nr][nc] === team) count++;
              else break;
            }
          }
          score += count * 3;
        }
        if (score > bestScore) { bestScore = score; bestMoves = [{r, c}]; }
        else if (score === bestScore) bestMoves.push({r, c});
      }
    }

    if (bestMoves.length > 0) {
      const m = bestMoves[Math.floor(Math.random() * bestMoves.length)];
      this.placeMark(m.r, m.c);
    }
  },

  minimaxBest(team) {
    let bestScore = -Infinity;
    let bestMove = null;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        if (this.board[r][c] !== -1) continue;
        this.board[r][c] = team;
        const score = this.minimax(1 - team, team, false, 0);
        this.board[r][c] = -1;
        if (score > bestScore) { bestScore = score; bestMove = { row: r, col: c }; }
      }
    }
    return bestMove;
  },

  minimax(currentTeam, aiTeam, isMax, depth) {
    // Check terminal states
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        if (this.board[r][c] !== -1 && this.checkWin(r, c, this.board[r][c])) {
          return this.board[r][c] === aiTeam ? 10 - depth : depth - 10;
        }
      }
    }
    if (this.isBoardFull()) return 0;

    if (isMax) {
      let best = -Infinity;
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          if (this.board[r][c] !== -1) continue;
          this.board[r][c] = currentTeam;
          best = Math.max(best, this.minimax(1 - currentTeam, aiTeam, false, depth + 1));
          this.board[r][c] = -1;
        }
      }
      return best;
    } else {
      let best = Infinity;
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          if (this.board[r][c] !== -1) continue;
          this.board[r][c] = currentTeam;
          best = Math.min(best, this.minimax(1 - currentTeam, aiTeam, true, depth + 1));
          this.board[r][c] = -1;
        }
      }
      return best;
    }
  },

  isBoardFull() {
    for (let r = 0; r < this.boardSize; r++) {
      for (let c = 0; c < this.boardSize; c++) {
        if (this.board[r][c] === -1) return false;
      }
    }
    return true;
  },

  checkWin(row, col, team) {
    const dirs = [[0,1],[1,0],[1,1],[1,-1]];
    for (const [dr, dc] of dirs) {
      let count = 1;
      const cells = [[row, col]];
      for (let d = -1; d <= 1; d += 2) {
        for (let i = 1; i < this.winLength; i++) {
          const r = row + dr * i * d;
          const c = col + dc * i * d;
          if (r < 0 || r >= this.boardSize || c < 0 || c >= this.boardSize) break;
          if (this.board[r][c] !== team) break;
          count++;
          cells.push([r, c]);
        }
      }
      if (count >= this.winLength) {
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

  getCellSize() {
    return Math.min(Math.floor(360 / this.boardSize), 60);
  },

  getBoardOrigin() {
    const cellSize = this.getCellSize();
    const boardW = this.boardSize * cellSize;
    const boardH = this.boardSize * cellSize;
    return {
      x: (400 - boardW) / 2,
      y: (460 - boardH) / 2 + 10
    };
  },

  handleClick(e) {
    const pos = this.getMousePos(e);

    if (this.state === 'menu') {
      // AI toggle
      if (pos.x >= 140 && pos.x <= 260 && pos.y >= 155 && pos.y <= 180) {
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
        if (pos.x >= x && pos.x <= x + cardW && pos.y >= 210 && pos.y <= 350) {
          SFX.collect();
          this.startGame(i);
          return;
        }
      }
    } else if (this.state === 'passturn') {
      this.state = 'playing';
      SFX.hit();
    } else if (this.state === 'playing') {
      if (this.vsAI && this.currentPlayer >= 1) return;
      const cellSize = this.getCellSize();
      const origin = this.getBoardOrigin();
      const col = Math.floor((pos.x - origin.x) / cellSize);
      const row = Math.floor((pos.y - origin.y) / cellSize);
      if (row >= 0 && row < this.boardSize && col >= 0 && col < this.boardSize) {
        if (this.board[row][col] === -1) {
          this.placeMark(row, col);
        }
      }
    } else if (this.state === 'gameover') {
      if (pos.x >= 120 && pos.x <= 280 && pos.y >= 400 && pos.y <= 440) {
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
        if (pos.x >= x && pos.x <= x + cardW && pos.y >= 210 && pos.y <= 350) {
          this.menuHover = i;
          break;
        }
      }
    }
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
    ctx.fillText('Tic Tac Toe', 200, 70);

    ctx.font = '13px monospace';
    ctx.fillStyle = '#888';
    ctx.fillText('Choose player count', 200, 100);

    ctx.font = '11px monospace';
    ctx.fillStyle = '#666';
    ctx.fillText('Bigger boards for more players!', 200, 125);

    // AI toggle
    ctx.fillStyle = this.vsAI ? 'rgba(72,219,251,0.25)' : 'rgba(255,255,255,0.06)';
    ctx.strokeStyle = this.vsAI ? '#48dbfb' : '#666';
    ctx.lineWidth = 1;
    this.roundRect(ctx, 140, 155, 120, 25, 5);
    ctx.fill();
    ctx.stroke();
    ctx.font = 'bold 11px monospace';
    ctx.fillStyle = this.vsAI ? '#48dbfb' : '#888';
    ctx.fillText(this.vsAI ? '\uD83E\uDD16 vs CPU' : '\uD83C\uDFAE Local', 200, 172);

    const modes = this.MODES;
    const cardW = 110;
    const cardH = 140;
    const gap = 15;
    const totalW = modes.length * cardW + (modes.length - 1) * gap;
    const sx = (400 - totalW) / 2;

    for (let i = 0; i < modes.length; i++) {
      const m = modes[i];
      const x = sx + i * (cardW + gap);
      const y = 210;
      const hover = this.menuHover === i;

      ctx.fillStyle = hover ? 'rgba(72,219,251,0.25)' : 'rgba(255,255,255,0.06)';
      ctx.strokeStyle = hover ? '#48dbfb' : '#444';
      ctx.lineWidth = hover ? 2 : 1;
      this.roundRect(ctx, x, y, cardW, cardH, 10);
      ctx.fill();
      ctx.stroke();

      ctx.font = 'bold 22px monospace';
      ctx.fillStyle = '#48dbfb';
      ctx.fillText('X', x + 35, y + 45);
      ctx.fillStyle = '#ff6b6b';
      ctx.fillText('O', x + 75, y + 45);

      ctx.font = 'bold 18px monospace';
      ctx.fillStyle = hover ? '#48dbfb' : '#fff';
      ctx.fillText(m.label, x + cardW / 2, y + 80);

      ctx.font = '10px monospace';
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.fillText(m.desc, x + cardW / 2, y + 105);

      ctx.font = '9px monospace';
      ctx.fillStyle = '#666';
      ctx.fillText(m.win + ' in a row to win', x + cardW / 2, y + 125);
    }

    ctx.textAlign = 'left';
  },

  drawPassScreen() {
    const ctx = this.ctx;
    const team = this.getTeam(this.currentPlayer);

    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = this.MARK_COLORS[team];
    ctx.fillText('Pass to ' + this.playerName(this.currentPlayer), 200, 180);

    ctx.font = '14px monospace';
    ctx.fillStyle = '#888';
    ctx.fillText(this.TEAM_NAMES[team], 200, 220);

    ctx.font = 'bold 16px monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText('Click to continue', 200, 280);

    ctx.textAlign = 'left';
  },

  drawBoard() {
    const ctx = this.ctx;
    const cellSize = this.getCellSize();
    const origin = this.getBoardOrigin();
    const boardW = this.boardSize * cellSize;
    const boardH = this.boardSize * cellSize;

    // Turn indicator
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    const team = this.getTeam(this.currentPlayer);
    ctx.fillStyle = this.MARK_COLORS[team];
    ctx.fillText(this.playerName(this.currentPlayer) + ' (' + this.MARKS[team] + ')', 200, 25);

    if (this.playerCount > 2) {
      ctx.font = '10px monospace';
      ctx.fillStyle = '#888';
      const pList = this.players.map(p => this.playerName(p) + ':' + this.MARKS[this.getTeam(p)]).join('  ');
      ctx.fillText(pList, 200, 45);
    }

    // Grid lines
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 2;
    for (let i = 1; i < this.boardSize; i++) {
      ctx.beginPath();
      ctx.moveTo(origin.x + i * cellSize, origin.y);
      ctx.lineTo(origin.x + i * cellSize, origin.y + boardH);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(origin.x, origin.y + i * cellSize);
      ctx.lineTo(origin.x + boardW, origin.y + i * cellSize);
      ctx.stroke();
    }

    // Marks with animation
    for (let r = 0; r < this.boardSize; r++) {
      for (let c = 0; c < this.boardSize; c++) {
        const val = this.board[r][c];
        if (val === -1) continue;
        const cx = origin.x + c * cellSize + cellSize / 2;
        const cy = origin.y + r * cellSize + cellSize / 2;
        const isWin = this.winCells.some(([wr, wc]) => wr === r && wc === c);

        // Find animation scale
        const anim = this.markAnims.find(a => a.row === r && a.col === c);
        const scale = anim ? anim.scale : 1;
        const s = cellSize * 0.3 * scale;

        if (s <= 0) continue;

        if (val === 0) {
          ctx.strokeStyle = isWin ? '#fff' : this.MARK_COLORS[0];
          ctx.lineWidth = isWin ? 4 : 3;
          ctx.beginPath();
          ctx.moveTo(cx - s, cy - s);
          ctx.lineTo(cx + s, cy + s);
          ctx.moveTo(cx + s, cy - s);
          ctx.lineTo(cx - s, cy + s);
          ctx.stroke();
        } else {
          ctx.strokeStyle = isWin ? '#fff' : this.MARK_COLORS[1];
          ctx.lineWidth = isWin ? 4 : 3;
          ctx.beginPath();
          ctx.arc(cx, cy, s, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    }

    // Board info
    ctx.font = '9px monospace';
    ctx.fillStyle = '#555';
    ctx.textAlign = 'center';
    ctx.fillText(this.boardSize + 'x' + this.boardSize + ' | ' + this.winLength + ' in a row to win', 200, origin.y + boardH + 20);

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
      ctx.fillText('Draw!', 200, 360);
    } else {
      ctx.fillStyle = this.MARK_COLORS[this.winner];
      ctx.fillText(this.TEAM_NAMES[this.winner] + ' Wins!', 200, 360);
    }

    ctx.fillStyle = 'rgba(72,219,251,0.3)';
    ctx.strokeStyle = '#48dbfb';
    ctx.lineWidth = 1.5;
    this.roundRect(ctx, 120, 400, 160, 40, 8);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 14px monospace';
    ctx.fillStyle = '#48dbfb';
    ctx.fillText('Play Again', 200, 426);

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
