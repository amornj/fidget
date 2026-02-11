const ClickerGame = {
  name: 'Clicker',
  instructions: 'Click the button to earn points! Buy upgrades to earn faster.',

  canvas: null,
  ctx: null,
  animFrame: null,

  points: 0,
  totalPoints: 0,
  pointsPerClick: 1,
  pointsPerSecond: 0,
  lastTick: 0,

  // Particles
  particles: [],

  // Button
  button: { x: 200, y: 180, r: 65, scale: 1, hovered: false },

  // Upgrades
  upgrades: [
    { name: 'Better Clicks', desc: '+1 per click', baseCost: 10, cost: 10, count: 0, type: 'click', value: 1 },
    { name: 'Auto Clicker', desc: '+1 per second', baseCost: 50, cost: 50, count: 0, type: 'auto', value: 1 },
    { name: 'Double Clicks', desc: '+5 per click', baseCost: 200, cost: 200, count: 0, type: 'click', value: 5 },
    { name: 'Click Farm', desc: '+10 per second', baseCost: 500, cost: 500, count: 0, type: 'auto', value: 10 },
    { name: 'Golden Touch', desc: '+50 per click', baseCost: 2000, cost: 2000, count: 0, type: 'click', value: 50 },
    { name: 'Factory', desc: '+100 per second', baseCost: 5000, cost: 5000, count: 0, type: 'auto', value: 100 },
  ],

  // Scroll
  scrollY: 0,

  mousePos: { x: 0, y: 0 },

  init(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.points = 0;
    this.totalPoints = 0;
    this.pointsPerClick = 1;
    this.pointsPerSecond = 0;
    this.particles = [];
    this.lastTick = performance.now();
    this.upgrades.forEach(u => { u.count = 0; u.cost = u.baseCost; });

    this._onClick = (e) => this.handleClick(e);
    this._onMove = (e) => this.handleMove(e);
    canvas.addEventListener('click', this._onClick);
    canvas.addEventListener('mousemove', this._onMove);

    this.loop();
  },

  getCanvasPos(e) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (this.canvas.width / rect.width),
      y: (e.clientY - rect.top) * (this.canvas.height / rect.height),
    };
  },

  handleMove(e) {
    this.mousePos = this.getCanvasPos(e);
    const dx = this.mousePos.x - this.button.x;
    const dy = this.mousePos.y - this.button.y;
    this.button.hovered = Math.sqrt(dx * dx + dy * dy) < this.button.r;
  },

  handleClick(e) {
    const pos = this.getCanvasPos(e);

    // Check button click
    const dx = pos.x - this.button.x;
    const dy = pos.y - this.button.y;
    if (Math.sqrt(dx * dx + dy * dy) < this.button.r) {
      this.points += this.pointsPerClick;
      this.totalPoints += this.pointsPerClick;
      this.button.scale = 0.9;
      setTimeout(() => { this.button.scale = 1; }, 80);

      // Spawn particles
      for (let i = 0; i < 5; i++) {
        this.particles.push({
          x: this.button.x + (Math.random() - 0.5) * 40,
          y: this.button.y - 20,
          vx: (Math.random() - 0.5) * 3,
          vy: -2 - Math.random() * 2,
          text: `+${this.pointsPerClick}`,
          life: 40,
        });
      }

      this.updateScore();
      return;
    }

    // Check upgrade clicks
    const upgradeStartY = 300;
    const upgradeH = 52;
    this.upgrades.forEach((u, i) => {
      const uy = upgradeStartY + i * upgradeH;
      if (pos.x > 20 && pos.x < this.canvas.width - 20 &&
          pos.y > uy && pos.y < uy + upgradeH - 4) {
        if (this.points >= u.cost) {
          this.points -= u.cost;
          u.count++;
          u.cost = Math.floor(u.baseCost * Math.pow(1.4, u.count));
          if (u.type === 'click') {
            this.pointsPerClick += u.value;
          } else {
            this.pointsPerSecond += u.value;
          }
          this.updateScore();
        }
      }
    });
  },

  updateScore() {
    if (typeof this.onScore === 'function') {
      this.onScore(this.formatNum(this.points));
    }
  },

  formatNum(n) {
    if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
    if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
    return Math.floor(n).toString();
  },

  loop() {
    const now = performance.now();
    const dt = (now - this.lastTick) / 1000;
    this.lastTick = now;

    // Auto points
    if (this.pointsPerSecond > 0) {
      this.points += this.pointsPerSecond * dt;
      this.totalPoints += this.pointsPerSecond * dt;
      this.updateScore();
    }

    // Particles
    this.particles = this.particles.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      return p.life > 0;
    });

    this.draw();
    this.animFrame = requestAnimationFrame(() => this.loop());
  },

  draw() {
    const { ctx, canvas } = this;
    ctx.fillStyle = '#0f0f23';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Points display
    ctx.fillStyle = '#feca57';
    ctx.font = 'bold 32px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(this.formatNum(this.points), canvas.width / 2, 40);

    ctx.fillStyle = '#666';
    ctx.font = '12px system-ui';
    ctx.fillText(`${this.formatNum(this.pointsPerClick)}/click | ${this.formatNum(this.pointsPerSecond)}/sec`, canvas.width / 2, 60);

    // Main button
    const b = this.button;
    const glow = b.hovered ? 15 : 8;

    // Outer ring
    ctx.shadowColor = '#48dbfb';
    ctx.shadowBlur = glow;
    ctx.strokeStyle = '#48dbfb';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r * b.scale, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Button fill
    const grad = ctx.createRadialGradient(b.x, b.y - 10, 0, b.x, b.y, b.r);
    grad.addColorStop(0, '#2a4a6a');
    grad.addColorStop(1, '#16213e');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(b.x, b.y, (b.r - 3) * b.scale, 0, Math.PI * 2);
    ctx.fill();

    // Button text
    ctx.fillStyle = '#48dbfb';
    ctx.font = 'bold 18px system-ui';
    ctx.fillText('CLICK!', b.x, b.y - 5);
    ctx.fillStyle = '#feca57';
    ctx.font = '14px system-ui';
    ctx.fillText(`+${this.formatNum(this.pointsPerClick)}`, b.x, b.y + 18);

    // Particles
    this.particles.forEach(p => {
      const alpha = p.life / 40;
      ctx.fillStyle = `rgba(254, 202, 87, ${alpha})`;
      ctx.font = 'bold 14px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(p.text, p.x, p.y);
    });

    // Divider
    ctx.fillStyle = '#2a2a4a';
    ctx.fillRect(20, 270, canvas.width - 40, 1);
    ctx.fillStyle = '#888';
    ctx.font = 'bold 12px system-ui';
    ctx.textAlign = 'left';
    ctx.fillText('UPGRADES', 20, 290);

    // Upgrades list
    const upgradeStartY = 300;
    const upgradeH = 52;

    this.upgrades.forEach((u, i) => {
      const y = upgradeStartY + i * upgradeH;
      const canBuy = this.points >= u.cost;

      // Check if mouse hovering
      const hovered = this.mousePos.x > 20 && this.mousePos.x < canvas.width - 20 &&
                       this.mousePos.y > y && this.mousePos.y < y + upgradeH - 4;

      // Background
      ctx.fillStyle = hovered && canBuy ? '#1e2d50' : '#16213e';
      ctx.beginPath();
      ctx.roundRect(20, y, canvas.width - 40, upgradeH - 4, 8);
      ctx.fill();

      if (canBuy) {
        ctx.strokeStyle = '#2a4a4a';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Name
      ctx.fillStyle = canBuy ? '#eee' : '#555';
      ctx.font = 'bold 13px system-ui';
      ctx.textAlign = 'left';
      ctx.fillText(`${u.name} (${u.count})`, 30, y + 18);

      // Description
      ctx.fillStyle = canBuy ? '#888' : '#444';
      ctx.font = '11px system-ui';
      ctx.fillText(u.desc, 30, y + 34);

      // Cost
      ctx.fillStyle = canBuy ? '#feca57' : '#553';
      ctx.font = 'bold 13px system-ui';
      ctx.textAlign = 'right';
      ctx.fillText(this.formatNum(u.cost), canvas.width - 30, y + 26);
    });

    ctx.textAlign = 'left';
  },

  destroy() {
    cancelAnimationFrame(this.animFrame);
    this.canvas.removeEventListener('click', this._onClick);
    this.canvas.removeEventListener('mousemove', this._onMove);
  },
};
