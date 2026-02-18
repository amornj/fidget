const GolfGame = {
  name: 'Mini Golf',
  instructions: 'Drag to aim & shoot. Q/Tab to switch clubs. Click tab on left for club panel.',

  canvas: null,
  ctx: null,
  animFrame: null,

  ball: null,
  hole: null,
  walls: [],
  rocks: [],
  water: [],
  dragging: false,
  dragStart: null,
  dragEnd: null,
  strokes: 0,
  level: 0,
  sunk: false,
  sunkTimer: 0,
  totalStrokes: 0,
  message: '',
  messageTimer: 0,
  frameCount: 0,
  lastDryPos: null,
  inWater: false,
  lobActive: false,

  // Club selection
  clubs: [
    { id: 'driver', name: 'Driver',  icon: '\u{1F3CC}\u{FE0F}', power: 1.5,  accuracy: 0.12, friction: 0.988, color: '#e74c3c' },
    { id: '3wood',  name: '3-Wood',  icon: '\u{1FAB5}',  power: 1.25, accuracy: 0.06, friction: 0.987, color: '#e67e22' },
    { id: 'iron',   name: 'Iron',    icon: '\u{2699}\u{FE0F}',  power: 1.0,  accuracy: 0.03, friction: 0.985, color: '#95a5a6' },
    { id: 'wedge',  name: 'Wedge',   icon: '\u{1F53A}',  power: 0.7,  accuracy: 0.015,friction: 0.975, color: '#f39c12' },
    { id: 'putter', name: 'Putter',  icon: '\u{1F3AF}',  power: 0.4,  accuracy: 0,    friction: 0.96,  color: '#2ecc71' },
    { id: 'sandw',  name: 'Sand W.', icon: '\u{23F3}',   power: 0.9,  accuracy: 0.04, friction: 0.978, color: '#d4a574', lob: true },
  ],
  selectedClub: 2,
  clubPanelOpen: false,

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
    // Level 6 - Rocky Road
    {
      ball: { x: 70, y: 400 },
      hole: { x: 340, y: 70 },
      walls: [
        { x: 30, y: 30, w: 360, h: 10 },
        { x: 30, y: 430, w: 360, h: 10 },
        { x: 30, y: 30, w: 10, h: 410 },
        { x: 380, y: 30, w: 10, h: 410 },
      ],
      rocks: [
        { x: 150, y: 150, r: 15 },
        { x: 250, y: 200, r: 12 },
        { x: 120, y: 300, r: 18 },
        { x: 300, y: 350, r: 14 },
        { x: 200, y: 250, r: 10 },
      ],
    },
    // Level 7 - Water Crossing
    {
      ball: { x: 70, y: 230 },
      hole: { x: 340, y: 230 },
      walls: [
        { x: 30, y: 30, w: 360, h: 10 },
        { x: 30, y: 430, w: 360, h: 10 },
        { x: 30, y: 30, w: 10, h: 410 },
        { x: 380, y: 30, w: 10, h: 410 },
        { x: 200, y: 100, w: 10, h: 120 },
        { x: 200, y: 280, w: 10, h: 120 },
      ],
      water: [
        { x: 160, y: 220, w: 50, h: 60 },
      ],
    },
    // Level 8 - Moving Platforms
    {
      ball: { x: 70, y: 400 },
      hole: { x: 340, y: 60 },
      walls: [
        { x: 30, y: 30, w: 360, h: 10 },
        { x: 30, y: 430, w: 360, h: 10 },
        { x: 30, y: 30, w: 10, h: 410 },
        { x: 380, y: 30, w: 10, h: 410 },
        { x: 120, y: 320, w: 80, h: 10, moveX: true, moveRange: 60, moveSpeed: 0.02 },
        { x: 220, y: 200, w: 80, h: 10, moveX: true, moveRange: 50, moveSpeed: 0.025 },
        { x: 100, y: 120, w: 80, h: 10, moveX: true, moveRange: 70, moveSpeed: 0.018 },
      ],
    },
    // Level 9 - Mixed Challenge
    {
      ball: { x: 60, y: 410 },
      hole: { x: 350, y: 60 },
      walls: [
        { x: 30, y: 30, w: 360, h: 10 },
        { x: 30, y: 430, w: 360, h: 10 },
        { x: 30, y: 30, w: 10, h: 410 },
        { x: 380, y: 30, w: 10, h: 410 },
        { x: 150, y: 150, w: 10, h: 150 },
        { x: 250, y: 180, w: 10, h: 150, moveY: true, moveRange: 40, moveSpeed: 0.02 },
      ],
      rocks: [
        { x: 100, y: 200, r: 14 },
        { x: 300, y: 300, r: 16 },
      ],
      water: [
        { x: 200, y: 350, w: 80, h: 50 },
        { x: 280, y: 100, w: 60, h: 60 },
      ],
    },
    // Level 10 - Gauntlet
    {
      ball: { x: 60, y: 60 },
      hole: { x: 350, y: 400 },
      walls: [
        { x: 30, y: 30, w: 360, h: 10 },
        { x: 30, y: 430, w: 360, h: 10 },
        { x: 30, y: 30, w: 10, h: 410 },
        { x: 380, y: 30, w: 10, h: 410 },
        { x: 100, y: 30, w: 10, h: 130 },
        { x: 200, y: 100, w: 10, h: 130 },
        { x: 300, y: 30, w: 10, h: 130 },
        { x: 100, y: 220, w: 10, h: 130, moveX: true, moveRange: 40, moveSpeed: 0.02 },
        { x: 250, y: 280, w: 10, h: 130, moveX: true, moveRange: 50, moveSpeed: 0.025 },
      ],
      rocks: [
        { x: 150, y: 200, r: 12 },
        { x: 300, y: 250, r: 14 },
        { x: 200, y: 380, r: 10 },
      ],
      water: [
        { x: 50, y: 300, w: 60, h: 50 },
        { x: 300, y: 350, w: 50, h: 40 },
      ],
    },
  ],

  init(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.level = 0;
    this.totalStrokes = 0;
    this.frameCount = 0;
    this.selectedClub = 2;
    this.clubPanelOpen = false;
    this.loadLevel();

    this._onMouseDown = (e) => this.mouseDown(e);
    this._onMouseMove = (e) => this.mouseMove(e);
    this._onMouseUp = (e) => this.mouseUp(e);
    this._onKeyDown = (e) => this.handleKey(e);
    canvas.addEventListener('mousedown', this._onMouseDown);
    canvas.addEventListener('mousemove', this._onMouseMove);
    canvas.addEventListener('mouseup', this._onMouseUp);
    window.addEventListener('keydown', this._onKeyDown);

    this.loop();
  },

  loadLevel() {
    const lvl = this.levels[this.level % this.levels.length];
    this.ball = { ...lvl.ball, vx: 0, vy: 0, r: 8 };
    this.hole = { ...lvl.hole, r: 12 };
    this.walls = lvl.walls.map(w => ({
      ...w,
      origX: w.x,
      origY: w.y,
    }));
    this.rocks = (lvl.rocks || []).map(r => ({ ...r }));
    this.water = (lvl.water || []).map(w => ({ ...w }));
    this.strokes = 0;
    this.sunk = false;
    this.lobActive = false;
    this.inWater = false;
    this.lastDryPos = { x: this.ball.x, y: this.ball.y };
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

  handleKey(e) {
    if (e.key === 'q' || e.key === 'Q' || e.key === 'Tab') {
      e.preventDefault();
      this.selectedClub = (this.selectedClub + 1) % this.clubs.length;
      var cl = this.clubs[this.selectedClub];
      this.message = cl.icon + ' ' + cl.name;
      this.messageTimer = 40;
      if (typeof SFX !== 'undefined') SFX.click();
    }
  },

  mouseDown(e) {
    const pos = this.getCanvasPos(e);

    // Club panel handling
    if (this.clubPanelOpen) {
      if (pos.x >= 0 && pos.x <= 120 && pos.y >= 80 && pos.y <= 80 + 20 + this.clubs.length * 38) {
        var rowIdx = Math.floor((pos.y - 100) / 38);
        if (rowIdx >= 0 && rowIdx < this.clubs.length) {
          this.selectedClub = rowIdx;
          this.clubPanelOpen = false;
          if (typeof SFX !== 'undefined') SFX.click();
          return;
        }
      }
      this.clubPanelOpen = false;
      return;
    }
    // Club tab (closed)
    if (pos.x >= 0 && pos.x <= 24 && pos.y >= 160 && pos.y <= 220) {
      this.clubPanelOpen = true;
      if (typeof SFX !== 'undefined') SFX.click();
      return;
    }

    if (this.sunk || this.ballMoving()) return;
    const dx = pos.x - this.ball.x;
    const dy = pos.y - this.ball.y;
    if (Math.sqrt(dx * dx + dy * dy) < 30) {
      this.dragging = true;
      this.dragStart = pos;
      this.dragEnd = pos;
    }
  },

  mouseMove(e) {
    if (this.dragging) {
      this.dragEnd = this.getCanvasPos(e);
    }
  },

  mouseUp(e) {
    if (!this.dragging) return;
    this.dragging = false;
    const end = this.getCanvasPos(e);
    let dx = end.x - this.dragStart.x;
    let dy = end.y - this.dragStart.y;
    const club = this.clubs[this.selectedClub];
    const power = Math.min(Math.sqrt(dx * dx + dy * dy), 150) * club.power;
    let angle = Math.atan2(dy, dx);
    angle += (Math.random() * 2 - 1) * club.accuracy;
    this.ball.vx = Math.cos(angle) * power * 0.08;
    this.ball.vy = Math.sin(angle) * power * 0.08;
    this.lobActive = !!club.lob;
    if (this.lobActive) {
      this.ball.r = 12;
    } else {
      this.ball.r = 8;
    }
    this.lastDryPos = { x: this.ball.x, y: this.ball.y };
    this.strokes++;
    this.totalStrokes++;
    if (typeof SFX !== 'undefined') SFX.hit();
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
    this.frameCount++;
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

    // Move moving walls
    for (const w of this.walls) {
      if (w.moveX && w.moveRange) {
        w.x = w.origX + Math.sin(this.frameCount * (w.moveSpeed || 0.02)) * w.moveRange;
      }
      if (w.moveY && w.moveRange) {
        w.y = w.origY + Math.sin(this.frameCount * (w.moveSpeed || 0.02)) * w.moveRange;
      }
    }

    const b = this.ball;
    const friction = this.clubs[this.selectedClub].friction;
    b.vx *= friction;
    b.vy *= friction;
    if (Math.abs(b.vx) < 0.1) b.vx = 0;
    if (Math.abs(b.vy) < 0.1) b.vy = 0;

    // Reset lob state and ball size when stopped
    if (!this.ballMoving() && this.lobActive) {
      this.lobActive = false;
      b.r = 8;
    }

    // Track dry position
    if (this.ballMoving() && !this.isInWater(b.x, b.y)) {
      this.lastDryPos = { x: b.x, y: b.y };
    }

    // Sub-step movement to prevent skipping over the hole
    var speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
    var subSteps = speed > 4 ? Math.ceil(speed / 3) : 1;
    var svx = b.vx / subSteps;
    var svy = b.vy / subSteps;
    for (var ss = 0; ss < subSteps; ss++) {
      b.x += svx;
      b.y += svy;
      // Pull toward hole when close
      var pullDx = this.hole.x - b.x;
      var pullDy = this.hole.y - b.y;
      var pullDist = Math.sqrt(pullDx * pullDx + pullDy * pullDy);
      if (pullDist < this.hole.r * 3 && pullDist > 0) {
        var pullStr = 0.15 * (1 - pullDist / (this.hole.r * 3));
        b.vx += (pullDx / pullDist) * pullStr;
        b.vy += (pullDy / pullDist) * pullStr;
        svx = b.vx / subSteps;
        svy = b.vy / subSteps;
      }
    }

    // Water check
    if (this.isInWater(b.x, b.y)) {
      if (!this.inWater) {
        this.inWater = true;
        if (typeof SFX !== 'undefined') SFX.splash();
      }
      b.vx *= 0.92;
      b.vy *= 0.92;

      // If stopped in water, reset
      if (!this.ballMoving() && this.inWater) {
        b.x = this.lastDryPos.x;
        b.y = this.lastDryPos.y;
        b.vx = 0;
        b.vy = 0;
        this.inWater = false;
        this.message = 'Splash! Reset.';
        this.messageTimer = 50;
      }
    } else {
      this.inWater = false;
    }

    // Lob shots bounce off canvas edges instead of walls
    if (this.lobActive) {
      if (b.x < b.r) { b.x = b.r; b.vx = Math.abs(b.vx) * 0.85; }
      if (b.x > 400 - b.r) { b.x = 400 - b.r; b.vx = -Math.abs(b.vx) * 0.85; }
      if (b.y < b.r) { b.y = b.r; b.vy = Math.abs(b.vy) * 0.85; }
      if (b.y > 460 - b.r) { b.y = 460 - b.r; b.vy = -Math.abs(b.vy) * 0.85; }
    }

    // Wall collisions (skipped during lob — ball flies over walls)
    if (!this.lobActive) {
      for (const w of this.walls) {
        const closestX = Math.max(w.x, Math.min(b.x, w.x + w.w));
        const closestY = Math.max(w.y, Math.min(b.y, w.y + w.h));
        const dx = b.x - closestX;
        const dy = b.y - closestY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < b.r) {
          if (typeof SFX !== 'undefined') SFX.bounce();
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
    }

    // Rock collisions
    for (const rock of this.rocks) {
      const dx = b.x - rock.x;
      const dy = b.y - rock.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < b.r + rock.r) {
        if (typeof SFX !== 'undefined') SFX.bounce();
        const nx = dx / dist;
        const ny = dy / dist;
        const overlap = (b.r + rock.r) - dist;
        b.x += nx * overlap;
        b.y += ny * overlap;
        const dot = b.vx * nx + b.vy * ny;
        b.vx -= 2 * dot * nx;
        b.vy -= 2 * dot * ny;
        // Bumper boost
        b.vx *= 1.2;
        b.vy *= 1.2;
      }
    }

    // Hole check
    const hdx = b.x - this.hole.x;
    const hdy = b.y - this.hole.y;
    const hdist = Math.sqrt(hdx * hdx + hdy * hdy);
    const holeSpeed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);

    if (hdist < this.hole.r - 2 && holeSpeed < 8) {
      this.sunk = true;
      this.sunkTimer = 60;
      b.vx = 0;
      b.vy = 0;
      b.x = this.hole.x;
      b.y = this.hole.y;
      if (typeof SFX !== 'undefined') SFX.sink();
      const par = 3;
      const diff = this.strokes - par;
      if (this.strokes === 1) this.message = 'HOLE IN ONE!';
      else if (diff <= -2) this.message = 'Eagle!';
      else if (diff === -1) this.message = 'Birdie!';
      else if (diff === 0) this.message = 'Par!';
      else if (diff === 1) this.message = 'Bogey';
      else this.message = `+${diff}`;
      this.messageTimer = 60;
    }
  },

  isInWater(x, y) {
    for (const w of this.water) {
      if (x > w.x && x < w.x + w.w && y > w.y && y < w.y + w.h) return true;
    }
    return false;
  },

  draw() {
    const { ctx, canvas } = this;
    ctx.fillStyle = '#1a472a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Water
    for (const w of this.water) {
      ctx.fillStyle = 'rgba(30,100,200,0.3)';
      ctx.fillRect(w.x, w.y, w.w, w.h);
      // Wave lines
      ctx.strokeStyle = 'rgba(100,180,255,0.3)';
      ctx.lineWidth = 1;
      for (let wy = w.y + 8; wy < w.y + w.h; wy += 12) {
        ctx.beginPath();
        for (let wx = w.x; wx <= w.x + w.w; wx += 2) {
          const wave = Math.sin((wx + this.frameCount * 2) * 0.08) * 2;
          if (wx === w.x) ctx.moveTo(wx, wy + wave);
          else ctx.lineTo(wx, wy + wave);
        }
        ctx.stroke();
      }
      // Border
      ctx.strokeStyle = 'rgba(60,140,220,0.5)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(w.x, w.y, w.w, w.h);
    }

    // Walls
    for (const w of this.walls) {
      const isMoving = w.moveX || w.moveY;
      ctx.fillStyle = isMoving ? '#4a2a10' : '#5a3a1a';
      ctx.fillRect(w.x, w.y, w.w, w.h);
      ctx.fillStyle = isMoving ? '#6a4a20' : '#7a5a2a';
      ctx.fillRect(w.x, w.y, w.w, 2);
      // Moving indicator arrows
      if (isMoving) {
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.font = '8px system-ui';
        ctx.textAlign = 'center';
        if (w.moveX) ctx.fillText('↔', w.x + w.w / 2, w.y + w.h / 2 + 3);
        if (w.moveY) ctx.fillText('↕', w.x + w.w / 2, w.y + w.h / 2 + 3);
      }
    }

    // Rocks
    for (const rock of this.rocks) {
      const grad = ctx.createRadialGradient(rock.x - 3, rock.y - 3, 0, rock.x, rock.y, rock.r);
      grad.addColorStop(0, '#999');
      grad.addColorStop(0.7, '#666');
      grad.addColorStop(1, '#444');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(rock.x, rock.y, rock.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      // Highlight
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.beginPath();
      ctx.arc(rock.x - rock.r * 0.25, rock.y - rock.r * 0.25, rock.r * 0.4, 0, Math.PI * 2);
      ctx.fill();
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
      // Lob shadow on ground
      if (this.lobActive && this.ballMoving()) {
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(b.x + 4, b.y + 6, b.r * 0.8, b.r * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#fff';
      ctx.shadowColor = 'rgba(0,0,0,0.3)';
      ctx.shadowBlur = this.lobActive ? 8 : 4;
      ctx.shadowOffsetX = this.lobActive ? 4 : 2;
      ctx.shadowOffsetY = this.lobActive ? 4 : 2;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.beginPath();
      ctx.arc(b.x - 2, b.y - 2, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Drag indicator
    if (this.dragging && this.dragEnd) {
      const dx = this.dragEnd.x - this.dragStart.x;
      const dy = this.dragEnd.y - this.dragStart.y;
      const rawPower = Math.min(Math.sqrt(dx * dx + dy * dy), 150);
      const displayPower = rawPower * this.clubs[this.selectedClub].power;
      const angle = Math.atan2(dy, dx);

      ctx.strokeStyle = `rgba(255, ${Math.round(255 - displayPower * 1.1)}, 50, 0.8)`;
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(this.ball.x, this.ball.y);
      ctx.lineTo(
        this.ball.x + Math.cos(angle) * displayPower * 0.5,
        this.ball.y + Math.sin(angle) * displayPower * 0.5
      );
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#feca57';
      ctx.font = '12px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(`${Math.round(displayPower)}%`, this.ball.x, this.ball.y - 20);
    }

    // Club indicator (top-right badge)
    var selClub = this.clubs[this.selectedClub];
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.roundRect(canvas.width - 90, 4, 86, 20, 4);
    ctx.fill();
    ctx.fillStyle = selClub.color;
    ctx.font = 'bold 10px system-ui';
    ctx.textAlign = 'right';
    ctx.fillText(selClub.icon + ' ' + selClub.name, canvas.width - 8, 18);

    // Club tab (left edge)
    if (!this.clubPanelOpen) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.beginPath();
      ctx.roundRect(0, 160, 24, 60, [0, 6, 6, 0]);
      ctx.fill();
      ctx.fillStyle = selClub.color;
      ctx.fillRect(0, 160, 3, 60);
      ctx.font = '14px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(selClub.icon, 12, 186);
      ctx.fillStyle = '#aaa';
      ctx.font = '10px system-ui';
      ctx.fillText('\u{25B6}', 12, 210);
    }

    // Club panel (when open)
    if (this.clubPanelOpen) {
      var panelH = 20 + this.clubs.length * 38;
      ctx.fillStyle = 'rgba(0,0,0,0.85)';
      ctx.beginPath();
      ctx.roundRect(0, 80, 120, panelH, [0, 8, 8, 0]);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(0, 80, 120, panelH, [0, 8, 8, 0]);
      ctx.stroke();
      ctx.fillStyle = '#aaa';
      ctx.font = 'bold 10px system-ui';
      ctx.textAlign = 'left';
      ctx.fillText('SELECT CLUB', 8, 97);
      for (var ci = 0; ci < this.clubs.length; ci++) {
        var cl = this.clubs[ci];
        var rowY = 100 + ci * 38;
        var isSelected = (ci === this.selectedClub);
        if (isSelected) {
          ctx.fillStyle = 'rgba(255,255,255,0.1)';
          ctx.fillRect(0, rowY, 120, 38);
          ctx.fillStyle = cl.color;
          ctx.fillRect(0, rowY, 3, 38);
        }
        ctx.font = '14px system-ui';
        ctx.textAlign = 'left';
        ctx.fillText(cl.icon, 8, rowY + 18);
        ctx.fillStyle = isSelected ? '#fff' : '#bbb';
        ctx.font = 'bold 11px system-ui';
        ctx.fillText(cl.name, 28, rowY + 17);
        ctx.fillStyle = '#333';
        ctx.fillRect(28, rowY + 24, 60, 4);
        ctx.fillStyle = cl.color;
        ctx.fillRect(28, rowY + 24, 60 * (cl.power / 1.5), 4);
        ctx.fillStyle = '#888';
        ctx.font = '8px system-ui';
        ctx.textAlign = 'right';
        if (cl.accuracy === 0) ctx.fillText('Perfect', 115, rowY + 29);
        else ctx.fillText('\u{00B1}' + (cl.accuracy * 180 / Math.PI).toFixed(1) + '\u{00B0}', 115, rowY + 29);
      }
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
    window.removeEventListener('keydown', this._onKeyDown);
  },
};
