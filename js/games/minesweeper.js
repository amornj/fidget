const MinesweeperGame = {
  name: 'Minesweeper',
  instructions: 'Click to reveal. Right-click or Shift+click to flag.',

  canvas: null, ctx: null, animFrame: null, state: 'menu',
  cols: 9, rows: 9, mineCount: 10,
  cellSize: 42, gridOffsetX: 0, gridOffsetY: 40,
  grid: [], revealedCount: 0, flaggedCount: 0,
  firstClick: true, won: false,
  timer: 0, timerInterval: null,
  flagMode: false, totalWins: 0, hoverCell: null,

  difficulties: [
    { name: 'Easy', cols: 9, rows: 9, mines: 10 },
    { name: 'Medium', cols: 12, rows: 12, mines: 25 },
    { name: 'Hard', cols: 16, rows: 16, mines: 40 },
  ],

  numColors: ['#48dbfb','#2ecc71','#ff6b6b','#a855f7','#b91c1c','#14b8a6','#e0e0e0','#888'],

  init: function(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.state = 'menu';
    this.totalWins = 0;
    this.hoverCell = null;
    this._onClick = function(e) { MinesweeperGame.handleClick(e); };
    this._onContext = function(e) { e.preventDefault(); MinesweeperGame.handleRightClick(e); };
    this._onMove = function(e) { MinesweeperGame.handleMouseMove(e); };
    canvas.addEventListener('click', this._onClick);
    canvas.addEventListener('contextmenu', this._onContext);
    canvas.addEventListener('mousemove', this._onMove);
    this.loop();
  },

  destroy: function() {
    cancelAnimationFrame(this.animFrame);
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.canvas.removeEventListener('click', this._onClick);
    this.canvas.removeEventListener('contextmenu', this._onContext);
    this.canvas.removeEventListener('mousemove', this._onMove);
  },

  getPos: function(e) {
    var r = this.canvas.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) * (this.canvas.width / r.width),
      y: (e.clientY - r.top) * (this.canvas.height / r.height),
    };
  },

  startGame: function(di) {
    var d = this.difficulties[di];
    this.cols = d.cols;
    this.rows = d.rows;
    this.mineCount = d.mines;
    this.cellSize = Math.floor(Math.min(396 / this.cols, 416 / this.rows));
    this.gridOffsetX = Math.floor((400 - this.cols * this.cellSize) / 2);
    this.gridOffsetY = 40;
    this.grid = [];
    for (var r = 0; r < this.rows; r++) {
      this.grid[r] = [];
      for (var c = 0; c < this.cols; c++) {
        this.grid[r][c] = { mine: false, revealed: false, flagged: false, adj: 0 };
      }
    }
    this.revealedCount = 0;
    this.flaggedCount = 0;
    this.firstClick = true;
    this.won = false;
    this.timer = 0;
    this.flagMode = false;
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = null;
    this.state = 'playing';
    this.updateScore();
  },

  placeMines: function(sr, sc) {
    var placed = 0;
    while (placed < this.mineCount) {
      var r = Math.floor(Math.random() * this.rows);
      var c = Math.floor(Math.random() * this.cols);
      if (this.grid[r][c].mine) continue;
      if (Math.abs(r - sr) <= 1 && Math.abs(c - sc) <= 1) continue;
      this.grid[r][c].mine = true;
      placed++;
    }
    for (var r = 0; r < this.rows; r++) {
      for (var c = 0; c < this.cols; c++) {
        if (this.grid[r][c].mine) continue;
        var n = 0;
        for (var dr = -1; dr <= 1; dr++)
          for (var dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            var nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols && this.grid[nr][nc].mine) n++;
          }
        this.grid[r][c].adj = n;
      }
    }
  },

  reveal: function(startR, startC) {
    var stack = [[startR, startC]];
    while (stack.length > 0) {
      var p = stack.pop();
      var r = p[0], c = p[1];
      if (r < 0 || r >= this.rows || c < 0 || c >= this.cols) continue;
      var cell = this.grid[r][c];
      if (cell.revealed || cell.flagged) continue;
      cell.revealed = true;
      this.revealedCount++;
      if (cell.mine) {
        this.won = false;
        this.state = 'gameover';
        if (this.timerInterval) clearInterval(this.timerInterval);
        for (var rr = 0; rr < this.rows; rr++)
          for (var cc = 0; cc < this.cols; cc++)
            if (this.grid[rr][cc].mine) this.grid[rr][cc].revealed = true;
        if (typeof SFX !== 'undefined') SFX.hit();
        return;
      }
      if (cell.adj === 0) {
        for (var dr = -1; dr <= 1; dr++)
          for (var dc = -1; dc <= 1; dc++)
            if (dr !== 0 || dc !== 0) stack.push([r + dr, c + dc]);
      }
    }
    if (this.revealedCount === this.rows * this.cols - this.mineCount) {
      this.won = true;
      this.state = 'gameover';
      if (this.timerInterval) clearInterval(this.timerInterval);
      for (var r = 0; r < this.rows; r++)
        for (var c = 0; c < this.cols; c++)
          if (this.grid[r][c].mine && !this.grid[r][c].flagged) {
            this.grid[r][c].flagged = true;
            this.flaggedCount++;
          }
      this.totalWins++;
      this.updateScore();
      if (typeof SFX !== 'undefined') SFX.collect();
    }
  },

  getCell: function(pos) {
    var cx = pos.x - this.gridOffsetX;
    var cy = pos.y - this.gridOffsetY;
    if (cx < 0 || cy < 0) return null;
    var c = Math.floor(cx / this.cellSize);
    var r = Math.floor(cy / this.cellSize);
    if (r < 0 || r >= this.rows || c < 0 || c >= this.cols) return null;
    return { r: r, c: c };
  },

  toggleFlag: function(r, c) {
    var g = this.grid[r][c];
    if (g.revealed) return;
    g.flagged = !g.flagged;
    this.flaggedCount += g.flagged ? 1 : -1;
  },

  handleClick: function(e) {
    var pos = this.getPos(e);
    if (this.state === 'menu') {
      for (var i = 0; i < 3; i++) {
        var by = 220 + i * 55;
        if (pos.x >= 100 && pos.x <= 300 && pos.y >= by && pos.y <= by + 40) {
          this.startGame(i);
          return;
        }
      }
      return;
    }
    if (this.state === 'gameover') {
      if (pos.x >= 110 && pos.x <= 290 && pos.y >= 280 && pos.y <= 320) {
        this.state = 'menu';
      }
      return;
    }
    if (this.state !== 'playing') return;

    // Flag mode toggle button
    if (pos.y >= 5 && pos.y <= 33 && pos.x >= 165 && pos.x <= 235) {
      this.flagMode = !this.flagMode;
      return;
    }

    var cell = this.getCell(pos);
    if (!cell) return;
    var g = this.grid[cell.r][cell.c];

    // Shift+click or flag mode -> flag
    if (e.shiftKey || this.flagMode) {
      this.toggleFlag(cell.r, cell.c);
      return;
    }

    // Chord click on revealed number
    if (g.revealed && g.adj > 0) {
      var af = 0;
      for (var dr = -1; dr <= 1; dr++)
        for (var dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          var nr = cell.r + dr, nc = cell.c + dc;
          if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols && this.grid[nr][nc].flagged) af++;
        }
      if (af === g.adj) {
        for (var dr = -1; dr <= 1; dr++)
          for (var dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            var nr = cell.r + dr, nc = cell.c + dc;
            if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols) {
              if (!this.grid[nr][nc].flagged && !this.grid[nr][nc].revealed) {
                this.reveal(nr, nc);
                if (this.state === 'gameover') return;
              }
            }
          }
      }
      return;
    }

    if (g.revealed || g.flagged) return;

    if (this.firstClick) {
      this.firstClick = false;
      this.placeMines(cell.r, cell.c);
      this.timerInterval = setInterval(function() {
        MinesweeperGame.timer = Math.min(999, MinesweeperGame.timer + 1);
      }, 1000);
    }
    this.reveal(cell.r, cell.c);
  },

  handleRightClick: function(e) {
    if (this.state !== 'playing') return;
    var pos = this.getPos(e);
    var cell = this.getCell(pos);
    if (!cell) return;
    this.toggleFlag(cell.r, cell.c);
  },

  handleMouseMove: function(e) {
    this.hoverCell = this.getCell(this.getPos(e));
  },

  updateScore: function() {
    if (typeof this.onScore === 'function') {
      this.onScore('Wins: ' + this.totalWins);
    }
  },

  loop: function() {
    this.draw();
    this.animFrame = requestAnimationFrame(function() { MinesweeperGame.loop(); });
  },

  draw: function() {
    var ctx = this.ctx;
    ctx.fillStyle = '#0f0f23';
    ctx.fillRect(0, 0, 400, 460);
    if (this.state === 'menu') { this.drawMenu(ctx); return; }
    this.drawInfoBar(ctx);
    this.drawGrid(ctx);
    if (this.state === 'gameover') this.drawGameOver(ctx);
  },

  drawMenu: function(ctx) {
    ctx.textAlign = 'center';
    ctx.fillStyle = '#48dbfb';
    ctx.font = 'bold 32px system-ui';
    ctx.fillText('\uD83D\uDCA3 Minesweeper', 200, 100);
    ctx.fillStyle = '#aaa';
    ctx.font = '13px system-ui';
    ctx.fillText('Clear the field without hitting mines!', 200, 140);
    ctx.fillText('Left-click: reveal \u00B7 Right-click: flag', 200, 162);
    ctx.fillText('Click a number to chord-reveal neighbors', 200, 182);
    var colors = ['#2ecc71', '#feca57', '#ff6b6b'];
    for (var i = 0; i < 3; i++) {
      var d = this.difficulties[i];
      var by = 220 + i * 55;
      ctx.fillStyle = colors[i];
      ctx.beginPath();
      ctx.roundRect(100, by, 200, 40, 8);
      ctx.fill();
      ctx.fillStyle = '#0f0f23';
      ctx.font = 'bold 16px system-ui';
      ctx.fillText(d.name, 200, by + 18);
      ctx.font = '11px system-ui';
      ctx.fillText(d.cols + '\u00D7' + d.rows + ' \u00B7 ' + d.mines + ' mines', 200, by + 33);
    }
  },

  drawInfoBar: function(ctx) {
    ctx.fillStyle = '#1a1a3a';
    ctx.beginPath(); ctx.roundRect(10, 5, 75, 28, 4); ctx.fill();
    ctx.fillStyle = '#ff6b6b';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('\uD83D\uDCA3' + (this.mineCount - this.flaggedCount), 47, 24);

    // Flag mode toggle
    ctx.fillStyle = this.flagMode ? 'rgba(255,107,107,0.3)' : '#1a1a3a';
    ctx.beginPath(); ctx.roundRect(165, 5, 70, 28, 4); ctx.fill();
    ctx.strokeStyle = this.flagMode ? '#ff6b6b' : 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = this.flagMode ? '#ff6b6b' : '#666';
    ctx.font = '13px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(this.flagMode ? '\uD83D\uDEA9 Flag' : '\uD83D\uDC46 Dig', 200, 24);

    // Timer
    ctx.fillStyle = '#1a1a3a';
    ctx.beginPath(); ctx.roundRect(315, 5, 75, 28, 4); ctx.fill();
    ctx.fillStyle = '#48dbfb';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    var t = this.timer, m = Math.floor(t / 60), s = t % 60;
    ctx.fillText('\u23F1' + (m > 0 ? m + ':' + (s < 10 ? '0' : '') + s : s), 352, 24);
  },

  drawGrid: function(ctx) {
    var cs = this.cellSize, ox = this.gridOffsetX, oy = this.gridOffsetY;
    var isOver = this.state === 'gameover';
    for (var r = 0; r < this.rows; r++) {
      for (var c = 0; c < this.cols; c++) {
        var cell = this.grid[r][c];
        var x = ox + c * cs, y = oy + r * cs;
        var hover = this.hoverCell && this.hoverCell.r === r && this.hoverCell.c === c && !isOver;

        if (cell.revealed) {
          ctx.fillStyle = cell.mine ? '#3a1520' : '#12122a';
          ctx.fillRect(x + 0.5, y + 0.5, cs - 1, cs - 1);
          if (cell.mine) {
            ctx.font = Math.floor(cs * 0.5) + 'px system-ui';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#ff6b6b';
            ctx.fillText('\uD83D\uDCA3', x + cs / 2, y + cs * 0.65);
          } else if (cell.adj > 0) {
            ctx.fillStyle = this.numColors[cell.adj - 1];
            ctx.font = 'bold ' + Math.floor(cs * 0.55) + 'px system-ui';
            ctx.textAlign = 'center';
            ctx.fillText(cell.adj, x + cs / 2, y + cs * 0.68);
          }
        } else {
          ctx.fillStyle = hover ? '#282848' : '#1e1e3a';
          ctx.fillRect(x + 0.5, y + 0.5, cs - 1, cs - 1);
          // 3D raised effect
          ctx.fillStyle = 'rgba(255,255,255,0.07)';
          ctx.fillRect(x + 1, y + 1, cs - 2, 2);
          ctx.fillRect(x + 1, y + 1, 2, cs - 2);
          ctx.fillStyle = 'rgba(0,0,0,0.15)';
          ctx.fillRect(x + cs - 3, y + 1, 2, cs - 2);
          ctx.fillRect(x + 1, y + cs - 3, cs - 2, 2);

          if (cell.flagged) {
            ctx.font = Math.floor(cs * 0.45) + 'px system-ui';
            ctx.textAlign = 'center';
            ctx.fillText('\uD83D\uDEA9', x + cs / 2, y + cs * 0.63);
            if (isOver && !cell.mine) {
              ctx.strokeStyle = '#ff0000';
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.moveTo(x + 4, y + 4);
              ctx.lineTo(x + cs - 4, y + cs - 4);
              ctx.moveTo(x + cs - 4, y + 4);
              ctx.lineTo(x + 4, y + cs - 4);
              ctx.stroke();
            }
          }
        }
        ctx.strokeStyle = 'rgba(255,255,255,0.04)';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(x + 0.5, y + 0.5, cs - 1, cs - 1);
      }
    }
  },

  drawGameOver: function(ctx) {
    ctx.fillStyle = 'rgba(15, 15, 35, 0.85)';
    ctx.fillRect(30, 150, 340, 180);
    ctx.strokeStyle = this.won ? '#2ecc71' : '#ff6b6b';
    ctx.lineWidth = 2;
    ctx.strokeRect(30, 150, 340, 180);
    ctx.textAlign = 'center';
    if (this.won) {
      ctx.fillStyle = '#2ecc71';
      ctx.font = 'bold 28px system-ui';
      ctx.fillText('\uD83C\uDF89 You Win!', 200, 200);
      ctx.fillStyle = '#ccc';
      ctx.font = '15px system-ui';
      ctx.fillText('Cleared in ' + this.timer + 's', 200, 230);
    } else {
      ctx.fillStyle = '#ff6b6b';
      ctx.font = 'bold 28px system-ui';
      ctx.fillText('\uD83D\uDCA5 Game Over', 200, 200);
      ctx.fillStyle = '#ccc';
      ctx.font = '15px system-ui';
      ctx.fillText('You hit a mine!', 200, 230);
    }
    ctx.fillStyle = '#48dbfb';
    ctx.beginPath();
    ctx.roundRect(110, 280, 180, 38, 8);
    ctx.fill();
    ctx.fillStyle = '#0f0f23';
    ctx.font = 'bold 14px system-ui';
    ctx.fillText('PLAY AGAIN', 200, 304);
  },
};
