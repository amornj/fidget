const PowerGolfGame = {
  name: 'Powergolf',
  instructions: 'Drag to aim. Collect powerups! Right-click or press 1-3 to use abilities.',

  canvas: null,
  ctx: null,
  animFrame: null,

  ball: null,
  hole: null,
  walls: [],
  pickups: [],
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

  // Abilities
  abilities: [],
  maxAbilities: 3,
  activeAbility: null, // currently active effect

  // Trail effect
  trail: [],

  // Particles
  particles: [],

  // All possible powerup types
  powerupTypes: [
    { id: 'supershot', name: 'Super Shot', icon: '💥', color: '#ff6b6b', desc: '2x power on next shot' },
    { id: 'ghost', name: 'Ghost Ball', icon: '👻', color: '#a29bfe', desc: 'Pass through 1 wall' },
    { id: 'magnet', name: 'Magnet', icon: '🧲', color: '#48dbfb', desc: 'Ball pulls toward hole' },
    { id: 'freeze', name: 'Freeze', icon: '❄️', color: '#74b9ff', desc: 'Stop ball instantly' },
    { id: 'multiball', name: 'Bomb Shot', icon: '💣', color: '#ff9f43', desc: 'Blast through walls' },
    { id: 'curve', name: 'Curve Ball', icon: '🌀', color: '#ff9ff3', desc: 'Ball curves toward hole' },
  ],

  levels: [
    {
      ball: { x: 80, y: 380 },
      hole: { x: 320, y: 80 },
      walls: [
        { x: 30, y: 30, w: 360, h: 10 },
        { x: 30, y: 430, w: 360, h: 10 },
        { x: 30, y: 30, w: 10, h: 410 },
        { x: 380, y: 30, w: 10, h: 410 },
      ],
      pickups: [{ x: 200, y: 230 }],
    },
    {
      ball: { x: 80, y: 400 },
      hole: { x: 340, y: 80 },
      walls: [
        { x: 30, y: 30, w: 360, h: 10 },
        { x: 30, y: 430, w: 360, h: 10 },
        { x: 30, y: 30, w: 10, h: 410 },
        { x: 380, y: 30, w: 10, h: 410 },
        { x: 160, y: 100, w: 10, h: 280 },
      ],
      pickups: [{ x: 90, y: 200 }, { x: 280, y: 300 }],
    },
    {
      ball: { x: 60, y: 410 },
      hole: { x: 350, y: 60 },
      walls: [
        { x: 30, y: 30, w: 360, h: 10 },
        { x: 30, y: 430, w: 360, h: 10 },
        { x: 30, y: 30, w: 10, h: 410 },
        { x: 380, y: 30, w: 10, h: 410 },
        { x: 120, y: 30, w: 10, h: 250 },
        { x: 250, y: 180, w: 10, h: 260 },
      ],
      pickups: [{ x: 70, y: 150 }, { x: 185, y: 350 }, { x: 320, y: 300 }],
    },
    {
      ball: { x: 70, y: 230 },
      hole: { x: 340, y: 230 },
      walls: [
        { x: 30, y: 30, w: 360, h: 10 },
        { x: 30, y: 430, w: 360, h: 10 },
        { x: 30, y: 30, w: 10, h: 410 },
        { x: 380, y: 30, w: 10, h: 410 },
        { x: 150, y: 100, w: 10, h: 120 },
        { x: 150, y: 260, w: 10, h: 120 },
        { x: 250, y: 140, w: 10, h: 80 },
        { x: 250, y: 260, w: 10, h: 80 },
        { x: 200, y: 180, w: 10, h: 100 },
      ],
      pickups: [{ x: 110, y: 130 }, { x: 110, y: 340 }, { x: 300, y: 230 }],
    },
    {
      ball: { x: 200, y: 410 },
      hole: { x: 200, y: 60 },
      walls: [
        { x: 30, y: 30, w: 360, h: 10 },
        { x: 30, y: 430, w: 360, h: 10 },
        { x: 30, y: 30, w: 10, h: 410 },
        { x: 380, y: 30, w: 10, h: 410 },
        { x: 80, y: 120, w: 100, h: 10 },
        { x: 220, y: 120, w: 100, h: 10 },
        { x: 120, y: 220, w: 160, h: 10 },
        { x: 80, y: 320, w: 100, h: 10 },
        { x: 220, y: 320, w: 100, h: 10 },
      ],
      pickups: [{ x: 200, y: 170 }, { x: 70, y: 270 }, { x: 330, y: 270 }],
    },
    {
      ball: { x: 60, y: 60 },
      hole: { x: 350, y: 400 },
      walls: [
        { x: 30, y: 30, w: 360, h: 10 },
        { x: 30, y: 430, w: 360, h: 10 },
        { x: 30, y: 30, w: 10, h: 410 },
        { x: 380, y: 30, w: 10, h: 410 },
        { x: 100, y: 30, w: 10, h: 150 },
        { x: 200, y: 130, w: 10, h: 180 },
        { x: 100, y: 260, w: 10, h: 180 },
        { x: 300, y: 100, w: 10, h: 200 },
        { x: 300, y: 350, w: 10, h: 90 },
      ],
      pickups: [{ x: 55, y: 200 }, { x: 155, y: 130 }, { x: 250, y: 280 }, { x: 340, y: 200 }],
    },
  ],

  init(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.level = 0;
    this.totalStrokes = 0;
    this.abilities = [];
    this.trail = [];
    this.particles = [];
    this.activeAbility = null;
    this.loadLevel();

    this._onMouseDown = (e) => this.mouseDown(e);
    this._onMouseMove = (e) => this.mouseMove(e);
    this._onMouseUp = (e) => this.mouseUp(e);
    this._onContext = (e) => { e.preventDefault(); this.useNextAbility(); };
    this._onKey = (e) => this.handleKey(e);
    canvas.addEventListener('mousedown', this._onMouseDown);
    canvas.addEventListener('mousemove', this._onMouseMove);
    canvas.addEventListener('mouseup', this._onMouseUp);
    canvas.addEventListener('contextmenu', this._onContext);
    document.addEventListener('keydown', this._onKey);

    this.loop();
  },

  loadLevel() {
    const lvl = this.levels[this.level % this.levels.length];
    this.ball = { ...lvl.ball, vx: 0, vy: 0, r: 8 };
    this.hole = { ...lvl.hole, r: 12 };
    this.walls = lvl.walls.map(w => ({ ...w, destroyed: false }));
    this.strokes = 0;
    this.sunk = false;
    this.trail = [];
    this.activeAbility = null;

    // Spawn pickups with random types
    this.pickups = (lvl.pickups || []).map(p => ({
      x: p.x,
      y: p.y,
      type: this.powerupTypes[Math.floor(Math.random() * this.powerupTypes.length)],
      collected: false,
      bobPhase: Math.random() * Math.PI * 2,
    }));

    this.message = `Hole ${this.level + 1}`;
    this.messageTimer = 90;
    this.updateScore();
  },

  handleKey(e) {
    if (e.key === '1' && this.abilities.length >= 1) this.useAbility(0);
    else if (e.key === '2' && this.abilities.length >= 2) this.useAbility(1);
    else if (e.key === '3' && this.abilities.length >= 3) this.useAbility(2);
  },

  useNextAbility() {
    if (this.abilities.length > 0) this.useAbility(0);
  },

  useAbility(index) {
    if (index >= this.abilities.length) return;
    const ability = this.abilities[index];

    if (ability.id === 'freeze' && this.ballMoving()) {
      this.ball.vx = 0;
      this.ball.vy = 0;
      this.spawnParticles(this.ball.x, this.ball.y, ability.color, 15);
      this.abilities.splice(index, 1);
      this.message = 'Freeze!';
      this.messageTimer = 40;
    } else if (ability.id === 'supershot') {
      this.activeAbility = { ...ability, fromIndex: index };
      this.message = 'Super Shot ready!';
      this.messageTimer = 40;
    } else if (ability.id === 'ghost') {
      this.activeAbility = { ...ability, fromIndex: index };
      this.message = 'Ghost Ball ready!';
      this.messageTimer = 40;
    } else if (ability.id === 'multiball') {
      this.activeAbility = { ...ability, fromIndex: index };
      this.message = 'Bomb Shot ready!';
      this.messageTimer = 40;
    } else if (ability.id === 'magnet') {
      this.activeAbility = { ...ability, fromIndex: index };
      this.message = 'Magnet ready!';
      this.messageTimer = 40;
    } else if (ability.id === 'curve') {
      this.activeAbility = { ...ability, fromIndex: index };
      this.message = 'Curve Ball ready!';
      this.messageTimer = 40;
    }
  },

  consumeActiveAbility() {
    if (this.activeAbility) {
      const idx = this.activeAbility.fromIndex;
      if (idx < this.abilities.length) {
        this.abilities.splice(idx, 1);
      }
      const consumed = this.activeAbility;
      this.activeAbility = null;
      return consumed;
    }
    return null;
  },

  getCanvasPos(e) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (this.canvas.width / rect.width),
      y: (e.clientY - rect.top) * (this.canvas.height / rect.height),
    };
  },

  mouseDown(e) {
    if (e.button !== 0) return;
    if (this.sunk || this.ballMoving()) return;
    const pos = this.getCanvasPos(e);
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
    if (e.button !== 0 || !this.dragging) return;
    this.dragging = false;
    const end = this.getCanvasPos(e);
    let dx = end.x - this.dragStart.x;
    let dy = end.y - this.dragStart.y;
    let power = Math.min(Math.sqrt(dx * dx + dy * dy), 150);
    const angle = Math.atan2(dy, dx);

    // Apply super shot
    let usedAbility = null;
    if (this.activeAbility && this.activeAbility.id === 'supershot') {
      power *= 2;
      usedAbility = this.consumeActiveAbility();
      this.spawnParticles(this.ball.x, this.ball.y, '#ff6b6b', 20);
    } else if (this.activeAbility && ['ghost', 'multiball', 'magnet', 'curve'].includes(this.activeAbility.id)) {
      usedAbility = this.consumeActiveAbility();
    }

    this.ball.vx = Math.cos(angle) * power * 0.08;
    this.ball.vy = Math.sin(angle) * power * 0.08;

    // Tag ball with active effects
    this.ball.ghost = usedAbility && usedAbility.id === 'ghost';
    this.ball.ghostHits = 1;
    this.ball.bomb = usedAbility && usedAbility.id === 'multiball';
    this.ball.magnet = usedAbility && usedAbility.id === 'magnet';
    this.ball.curve = usedAbility && usedAbility.id === 'curve';

    this.strokes++;
    this.totalStrokes++;
    this.updateScore();
  },

  ballMoving() {
    return Math.abs(this.ball.vx) > 0.1 || Math.abs(this.ball.vy) > 0.1;
  },

  spawnParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 5,
        vy: (Math.random() - 0.5) * 5,
        color,
        life: 20 + Math.random() * 15,
      });
    }
  },

  updateScore() {
    if (typeof this.onScore === 'function') {
      this.onScore(`Hole ${this.level + 1} | Strokes: ${this.strokes} | Total: ${this.totalStrokes}`);
    }
  },

  loop() {
    this.update();
    this.draw();
    this.animFrame = requestAnimationFrame(() => this.loop());
  },

  update() {
    if (this.messageTimer > 0) this.messageTimer--;

    // Particles
    this.particles = this.particles.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.96;
      p.vy *= 0.96;
      p.life--;
      return p.life > 0;
    });

    if (this.sunk) {
      this.sunkTimer--;
      if (this.sunkTimer <= 0) {
        this.level++;
        if (this.level >= this.levels.length) {
          this.message = `All done! Total: ${this.totalStrokes} strokes`;
          this.messageTimer = 999999;
          this.level = 0;
          this.totalStrokes = 0;
          this.abilities = [];
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

    // Magnet effect — pull toward hole
    if (b.magnet && this.ballMoving()) {
      const dx = this.hole.x - b.x;
      const dy = this.hole.y - b.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 5) {
        b.vx += (dx / dist) * 0.08;
        b.vy += (dy / dist) * 0.08;
      }
    }

    // Curve effect — gentle curve toward hole
    if (b.curve && this.ballMoving()) {
      const dx = this.hole.x - b.x;
      const dy = this.hole.y - b.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 10) {
        b.vx += (dx / dist) * 0.03;
        b.vy += (dy / dist) * 0.03;
      }
    }

    b.x += b.vx;
    b.y += b.vy;

    // Trail
    if (this.ballMoving()) {
      this.trail.push({ x: b.x, y: b.y, life: 15 });
      if (this.trail.length > 30) this.trail.shift();
    }
    this.trail = this.trail.filter(t => { t.life--; return t.life > 0; });

    // Wall collisions
    for (const w of this.walls) {
      if (w.destroyed) continue;

      const closestX = Math.max(w.x, Math.min(b.x, w.x + w.w));
      const closestY = Math.max(w.y, Math.min(b.y, w.y + w.h));
      const dx = b.x - closestX;
      const dy = b.y - closestY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < b.r) {
        // Bomb — destroy wall
        if (b.bomb) {
          w.destroyed = true;
          b.bomb = false;
          this.spawnParticles(closestX, closestY, '#ff9f43', 25);
          this.message = 'BOOM!';
          this.messageTimer = 30;
          continue;
        }

        // Ghost — pass through once
        if (b.ghost && b.ghostHits > 0) {
          b.ghostHits--;
          if (b.ghostHits <= 0) b.ghost = false;
          this.spawnParticles(closestX, closestY, '#a29bfe', 10);
          continue;
        }

        // Normal bounce
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

    // Pickup collisions
    for (const p of this.pickups) {
      if (p.collected) continue;
      const dx = b.x - p.x;
      const dy = b.y - p.y;
      if (Math.sqrt(dx * dx + dy * dy) < 18) {
        p.collected = true;
        if (this.abilities.length < this.maxAbilities) {
          this.abilities.push({ ...p.type });
          this.message = `Got ${p.type.icon} ${p.type.name}!`;
        } else {
          this.message = 'Inventory full!';
        }
        this.messageTimer = 50;
        this.spawnParticles(p.x, p.y, p.type.color, 12);
      }
    }

    // Hole check
    const hdx = b.x - this.hole.x;
    const hdy = b.y - this.hole.y;
    const hdist = Math.sqrt(hdx * hdx + hdy * hdy);
    const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);

    if (hdist < this.hole.r - 2 && speed < 8) {
      this.sunk = true;
      this.sunkTimer = 70;
      b.vx = 0;
      b.vy = 0;
      b.x = this.hole.x;
      b.y = this.hole.y;
      this.spawnParticles(this.hole.x, this.hole.y, '#feca57', 20);
      const par = 3;
      const diff = this.strokes - par;
      if (this.strokes === 1) this.message = 'HOLE IN ONE!';
      else if (diff <= -2) this.message = 'Eagle!';
      else if (diff === -1) this.message = 'Birdie!';
      else if (diff === 0) this.message = 'Par!';
      else if (diff === 1) this.message = 'Bogey';
      else this.message = `+${diff}`;
      this.messageTimer = 70;
    }
  },

  draw() {
    const { ctx, canvas } = this;
    ctx.fillStyle = '#1a472a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle grass pattern
    ctx.fillStyle = 'rgba(0,0,0,0.05)';
    for (let i = 0; i < canvas.width; i += 20) {
      for (let j = (i % 40 === 0 ? 0 : 10); j < canvas.height; j += 20) {
        ctx.fillRect(i, j, 10, 10);
      }
    }

    // Walls
    for (const w of this.walls) {
      if (w.destroyed) {
        ctx.fillStyle = 'rgba(90,58,26,0.2)';
        ctx.setLineDash([3, 3]);
        ctx.strokeStyle = 'rgba(90,58,26,0.3)';
        ctx.lineWidth = 1;
        ctx.fillRect(w.x, w.y, w.w, w.h);
        ctx.strokeRect(w.x, w.y, w.w, w.h);
        ctx.setLineDash([]);
        continue;
      }
      ctx.fillStyle = '#5a3a1a';
      ctx.fillRect(w.x, w.y, w.w, w.h);
      ctx.fillStyle = '#7a5a2a';
      ctx.fillRect(w.x, w.y, w.w, 2);
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
    ctx.fill();

    // Pickups
    for (const p of this.pickups) {
      if (p.collected) continue;
      p.bobPhase += 0.04;
      const bobY = Math.sin(p.bobPhase) * 3;

      // Glow
      ctx.shadowColor = p.type.color;
      ctx.shadowBlur = 12;
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.arc(p.x, p.y + bobY, 13, 0, Math.PI * 2);
      ctx.fill();

      // Circle
      ctx.fillStyle = p.type.color;
      ctx.globalAlpha = 0.25;
      ctx.beginPath();
      ctx.arc(p.x, p.y + bobY, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      // Icon
      ctx.font = '16px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(p.type.icon, p.x, p.y + bobY + 6);
      ctx.shadowBlur = 0;
    }

    // Trail
    this.trail.forEach(t => {
      const alpha = t.life / 15;
      let trailColor = 'rgba(255,255,255,';
      if (this.ball.ghost) trailColor = 'rgba(162,155,254,';
      else if (this.ball.magnet) trailColor = 'rgba(72,219,251,';
      else if (this.ball.curve) trailColor = 'rgba(255,159,243,';
      else if (this.ball.bomb) trailColor = 'rgba(255,159,67,';
      ctx.fillStyle = trailColor + (alpha * 0.3) + ')';
      ctx.beginPath();
      ctx.arc(t.x, t.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    // Ball
    if (!this.sunk) {
      const b = this.ball;

      // Ball glow for active effects
      if (b.ghost || b.magnet || b.bomb || b.curve) {
        let glowColor = '#fff';
        if (b.ghost) glowColor = '#a29bfe';
        if (b.magnet) glowColor = '#48dbfb';
        if (b.bomb) glowColor = '#ff9f43';
        if (b.curve) glowColor = '#ff9ff3';
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 12;
      }

      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Shine
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.beginPath();
      ctx.arc(b.x - 2, b.y - 2, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Drag indicator
    if (this.dragging && this.dragEnd) {
      const dx = this.dragEnd.x - this.dragStart.x;
      const dy = this.dragEnd.y - this.dragStart.y;
      const power = Math.min(Math.sqrt(dx * dx + dy * dy), 150);
      const angle = Math.atan2(dy, dx);
      const displayPower = this.activeAbility && this.activeAbility.id === 'supershot' ? power * 2 : power;

      ctx.strokeStyle = `rgba(255, ${Math.round(255 - displayPower * 1.2)}, 50, 0.8)`;
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

      ctx.fillStyle = '#feca57';
      ctx.font = '12px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(`${Math.round(displayPower)}%`, this.ball.x, this.ball.y - 20);
    }

    // Particles
    this.particles.forEach(p => {
      ctx.globalAlpha = p.life / 35;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Ability bar (bottom)
    const barY = canvas.height - 42;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, barY, canvas.width, 42);

    ctx.fillStyle = '#777';
    ctx.font = '10px system-ui';
    ctx.textAlign = 'left';
    ctx.fillText('ABILITIES (1-3 or right-click)', 8, barY + 12);

    for (let i = 0; i < this.maxAbilities; i++) {
      const slotX = 10 + i * 130;
      const slotY = barY + 17;

      ctx.fillStyle = '#1a1a2e';
      ctx.strokeStyle = '#2a2a4a';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(slotX, slotY, 122, 22, 4);
      ctx.fill();
      ctx.stroke();

      if (i < this.abilities.length) {
        const ab = this.abilities[i];
        const isActive = this.activeAbility && this.activeAbility.fromIndex === i;

        if (isActive) {
          ctx.strokeStyle = ab.color;
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        ctx.font = '13px system-ui';
        ctx.textAlign = 'left';
        ctx.fillText(ab.icon, slotX + 4, slotY + 16);
        ctx.fillStyle = ab.color;
        ctx.font = 'bold 10px system-ui';
        ctx.fillText(ab.name, slotX + 22, slotY + 11);
        ctx.fillStyle = '#666';
        ctx.font = '8px system-ui';
        ctx.fillText(`[${i + 1}]`, slotX + 105, slotY + 11);
      } else {
        ctx.fillStyle = '#333';
        ctx.font = '10px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText('empty', slotX + 61, slotY + 15);
      }
    }

    // Active ability indicator
    if (this.activeAbility) {
      ctx.fillStyle = this.activeAbility.color;
      ctx.font = 'bold 11px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(`${this.activeAbility.icon} ${this.activeAbility.name} ACTIVE`, canvas.width / 2, barY - 5);
    }

    // Message
    if (this.messageTimer > 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.font = 'bold 22px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(this.message, canvas.width / 2, canvas.height / 2 - 30);
    }
  },

  destroy() {
    cancelAnimationFrame(this.animFrame);
    this.canvas.removeEventListener('mousedown', this._onMouseDown);
    this.canvas.removeEventListener('mousemove', this._onMouseMove);
    this.canvas.removeEventListener('mouseup', this._onMouseUp);
    this.canvas.removeEventListener('contextmenu', this._onContext);
    document.removeEventListener('keydown', this._onKey);
  },
};
