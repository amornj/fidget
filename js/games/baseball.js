const BaseballGame = {
  name: 'Baseball',
  instructions: 'SPACE to swing, then Arrow keys to balance the skill check!',

  canvas: null,
  ctx: null,
  animFrame: null,
  keys: {},

  // Game phases: 'idle' | 'pitching' | 'swinging' | 'skillcheck' | 'result' | 'gameover'
  phase: 'idle',

  // Ball
  ball: { x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, visible: false },

  // Bat swing
  bat: { angle: 0 },
  swingHit: false,

  // Skill check
  skill: {
    x: 0,        // cursor position (-1 to 1)
    vx: 0,       // cursor velocity
    target: 0,   // where to aim
    wobble: 0,   // random perturbation
    wobbleT: 0,
    timer: 0,    // frames left
    maxTime: 90, // 1.5 sec at 60fps
    accuracy: 0, // final accuracy 0-100
  },

  // Hit animation
  hitBall: null,

  // Result
  result: '',
  resultTimer: 0,

  // Bases: [1st, 2nd, 3rd] — true if runner on base
  bases: [false, false, false],

  // Scoring
  runs: 0,
  inning: 1,
  halfInning: 'top', // just cosmetic
  outs: 0,
  maxOuts: 3,
  maxInnings: 9,

  // Lineup
  lineup: [
    { name: 'Slugger', power: 0.9, contact: 0.7, color: '#ff6b6b' },
    { name: 'Speedy', power: 0.5, contact: 0.9, color: '#48dbfb' },
    { name: 'Clutch', power: 0.7, contact: 0.8, color: '#feca57' },
    { name: 'Tank', power: 1.0, contact: 0.5, color: '#ff9f43' },
    { name: 'Rookie', power: 0.4, contact: 0.6, color: '#a29bfe' },
    { name: 'Vet', power: 0.6, contact: 0.85, color: '#2ecc71' },
    { name: 'Switch', power: 0.65, contact: 0.75, color: '#ff9ff3' },
    { name: 'Ace', power: 0.8, contact: 0.7, color: '#48dbfb' },
    { name: 'Wild Card', power: 0.55, contact: 0.65, color: '#fd79a8' },
  ],
  batterIndex: 0,
  strikes: 0,

  // Pitch delay
  pitchDelay: 0,

  // Runner animation
  runnerAnim: [],

  init(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.keys = {};
    this.runs = 0;
    this.inning = 1;
    this.outs = 0;
    this.strikes = 0;
    this.bases = [false, false, false];
    this.batterIndex = 0;
    this.phase = 'idle';
    this.result = 'SPACE to pitch!';
    this.resultTimer = 999;
    this.pitchDelay = 30;
    this.hitBall = null;
    this.runnerAnim = [];

    this._onKeyDown = (e) => { this.keys[e.key] = true; this.handleKey(e); };
    this._onKeyUp = (e) => { this.keys[e.key] = false; };
    document.addEventListener('keydown', this._onKeyDown);
    document.addEventListener('keyup', this._onKeyUp);

    this.loop();
  },

  get batter() {
    return this.lineup[this.batterIndex % this.lineup.length];
  },

  handleKey(e) {
    if (e.key === ' ') {
      e.preventDefault();
      if (this.phase === 'idle' && this.pitchDelay <= 0) {
        this.throwPitch();
      } else if (this.phase === 'pitching' && this.ball.visible) {
        this.attemptSwing();
      } else if (this.phase === 'gameover') {
        this.restartGame();
      }
    }
  },

  restartGame() {
    this.runs = 0;
    this.inning = 1;
    this.outs = 0;
    this.strikes = 0;
    this.bases = [false, false, false];
    this.batterIndex = 0;
    this.phase = 'idle';
    this.result = 'SPACE to pitch!';
    this.resultTimer = 999;
    this.pitchDelay = 30;
    this.hitBall = null;
    this.runnerAnim = [];
    this.updateScore();
  },

  throwPitch() {
    this.phase = 'pitching';
    this.ball.visible = true;
    this.ball.x = 200 + (Math.random() - 0.5) * 30;
    this.ball.y = 200;
    this.ball.z = 1;
    this.ball.vz = -0.018 - Math.random() * 0.007;
    this.ball.vx = (Math.random() - 0.5) * 0.2;
    this.ball.vy = (Math.random() - 0.5) * 0.15;
    this.result = '';
    this.resultTimer = 0;
    this.swingHit = false;
    this.bat.angle = 0;
  },

  attemptSwing() {
    // Check timing
    const z = this.ball.z;
    if (z < 0.3 && z > -0.05) {
      // Good timing — enter skill check
      this.swingHit = true;
      this.ball.visible = false;
      this.startSkillCheck();
    } else {
      // Bad timing — swing and miss
      this.phase = 'result';
      this.ball.visible = false;
      this.strikes++;
      if (this.strikes >= 3) {
        this.recordOut();
        this.result = 'Strikeout!';
      } else {
        this.result = `Whiff! Strike ${this.strikes}`;
        this.phase = 'idle';
        this.pitchDelay = 40;
      }
      this.resultTimer = 60;
      this.updateScore();
    }
  },

  startSkillCheck() {
    this.phase = 'skillcheck';
    const batter = this.batter;
    this.skill.x = 0;
    this.skill.vx = 0;
    this.skill.target = 0;
    this.skill.timer = this.skill.maxTime;
    // Wobble difficulty: lower contact = more wobble
    this.skill.wobble = 0.15 + (1 - batter.contact) * 0.25;
    this.skill.wobbleT = Math.random() * 100;
  },

  resolveSkillCheck() {
    const acc = this.skill.accuracy;
    const batter = this.batter;
    const power = batter.power;

    this.phase = 'result';
    this.resultTimer = 80;
    this.pitchDelay = 50;

    if (acc >= 95) {
      // HOME RUN
      this.result = 'HOME RUN!';
      this.hitBall = { x: 200, y: 300, vx: (Math.random() - 0.5) * 3, vy: -9, timer: 90 };
      // All runners + batter score
      let scored = 1; // batter scores
      for (let i = 2; i >= 0; i--) {
        if (this.bases[i]) { scored++; this.bases[i] = false; }
      }
      this.runs += scored;
      this.result = `HOME RUN! +${scored}`;
    } else if (acc >= 75) {
      // Triple
      const scored = this.advanceRunners(3);
      this.result = scored > 0 ? `Triple! +${scored}` : 'Triple!';
      this.hitBall = { x: 200, y: 300, vx: (Math.random() - 0.5) * 5, vy: -7, timer: 70 };
    } else if (acc >= 55) {
      // Double
      const scored = this.advanceRunners(2);
      this.result = scored > 0 ? `Double! +${scored}` : 'Double!';
      this.hitBall = { x: 200, y: 300, vx: (Math.random() - 0.5) * 6, vy: -5, timer: 60 };
    } else if (acc >= 35) {
      // Single
      const scored = this.advanceRunners(1);
      this.result = scored > 0 ? `Single! +${scored}` : 'Single!';
      this.hitBall = { x: 200, y: 300, vx: (Math.random() - 0.5) * 4, vy: -4, timer: 50 };
    } else if (acc >= 15) {
      // Foul ball — counts as strike if < 2 strikes
      if (this.strikes < 2) this.strikes++;
      this.result = `Foul Ball (Strike ${this.strikes})`;
      this.hitBall = { x: 200, y: 300, vx: (Math.random() > 0.5 ? 5 : -5), vy: -3, timer: 40 };
      if (this.strikes < 3) {
        this.phase = 'idle';
      }
    } else {
      // Weak grounder — out
      this.result = 'Ground Out!';
      this.hitBall = { x: 200, y: 300, vx: (Math.random() - 0.5) * 2, vy: -2, timer: 40 };
      this.recordOut();
    }

    this.strikes = 0;
    this.batterIndex++;
    this.updateScore();
  },

  advanceRunners(numBases) {
    let scored = 0;
    // Move existing runners
    for (let i = 2; i >= 0; i--) {
      if (this.bases[i]) {
        this.bases[i] = false;
        const newBase = i + numBases;
        if (newBase >= 3) {
          scored++;
        } else {
          this.bases[newBase] = true;
        }
      }
    }
    // Place batter
    if (numBases >= 4) {
      scored++; // home run handled separately
    } else {
      this.bases[numBases - 1] = true;
    }
    this.runs += scored;
    return scored;
  },

  recordOut() {
    this.outs++;
    this.strikes = 0;
    this.batterIndex++;
    if (this.outs >= this.maxOuts) {
      this.outs = 0;
      this.bases = [false, false, false];
      this.inning++;
      if (this.inning > this.maxInnings) {
        this.phase = 'gameover';
        this.result = `Game Over! Final: ${this.runs} runs`;
        this.resultTimer = 999;
        this.updateScore();
        return;
      }
    }
    this.phase = 'idle';
    this.pitchDelay = 50;
  },

  updateScore() {
    if (typeof this.onScore === 'function') {
      this.onScore(`${this.runs} R | Inn ${this.inning} | ${this.outs} Out`);
    }
  },

  loop() {
    this.update();
    this.draw();
    this.animFrame = requestAnimationFrame(() => this.loop());
  },

  update() {
    if (this.pitchDelay > 0) this.pitchDelay--;
    if (this.resultTimer > 0) this.resultTimer--;

    // Pitching phase
    if (this.phase === 'pitching' && this.ball.visible) {
      this.ball.z += this.ball.vz;
      this.ball.x += this.ball.vx;
      this.ball.y += this.ball.vy;

      if (this.ball.z <= 0) {
        // Ball reached plate — didn't swing
        this.ball.visible = false;
        this.strikes++;
        if (this.strikes >= 3) {
          this.recordOut();
          this.result = 'Strikeout looking!';
        } else {
          this.result = `Strike ${this.strikes}!`;
          this.phase = 'idle';
          this.pitchDelay = 40;
        }
        this.resultTimer = 60;
        this.updateScore();
      }
    }

    // Skill check phase
    if (this.phase === 'skillcheck') {
      const s = this.skill;
      s.timer--;
      s.wobbleT += 0.08;

      // Wobble pushes cursor randomly
      const wobbleForce = Math.sin(s.wobbleT * 2.3) * s.wobble +
                          Math.sin(s.wobbleT * 5.1) * s.wobble * 0.4;
      s.vx += wobbleForce * 0.02;

      // Player input
      if (this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A']) s.vx -= 0.025;
      if (this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']) s.vx += 0.025;

      // Friction
      s.vx *= 0.88;
      s.x += s.vx;

      // Clamp
      if (s.x < -1) { s.x = -1; s.vx = 0; }
      if (s.x > 1) { s.x = 1; s.vx = 0; }

      // Calculate accuracy (distance from center)
      s.accuracy = Math.max(0, (1 - Math.abs(s.x - s.target)) * 100);

      if (s.timer <= 0) {
        this.resolveSkillCheck();
      }
    }

    // Hit ball animation
    if (this.hitBall) {
      this.hitBall.x += this.hitBall.vx;
      this.hitBall.y += this.hitBall.vy;
      this.hitBall.vy += 0.08;
      this.hitBall.timer--;
      if (this.hitBall.timer <= 0) this.hitBall = null;
    }

    // Result phase auto-transition
    if (this.phase === 'result' && this.resultTimer <= 0 && !this.hitBall) {
      if (this.phase !== 'gameover') {
        this.phase = 'idle';
      }
    }
  },

  draw() {
    const { ctx, canvas } = this;
    const W = canvas.width;
    const H = canvas.height;

    // Sky
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#1a1a3e');
    grad.addColorStop(0.5, '#1a2a1e');
    grad.addColorStop(1, '#2a1a0e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Field
    ctx.fillStyle = '#1e3a1e';
    ctx.beginPath();
    ctx.moveTo(0, H);
    ctx.lineTo(W, H);
    ctx.lineTo(W * 0.75, H * 0.3);
    ctx.lineTo(W * 0.25, H * 0.3);
    ctx.closePath();
    ctx.fill();

    // Diamond
    const homeX = 200, homeY = H - 40;
    const firstX = 300, firstY = H - 170;
    const secondX = 200, secondY = H - 250;
    const thirdX = 100, thirdY = H - 170;

    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(homeX, homeY);
    ctx.lineTo(thirdX, thirdY);
    ctx.lineTo(secondX, secondY);
    ctx.lineTo(firstX, firstY);
    ctx.closePath();
    ctx.stroke();

    // Bases (squares)
    const basePositions = [
      { x: firstX, y: firstY },
      { x: secondX, y: secondY },
      { x: thirdX, y: thirdY },
    ];
    basePositions.forEach((bp, i) => {
      const occupied = this.bases[i];
      ctx.save();
      ctx.translate(bp.x, bp.y);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = occupied ? '#feca57' : '#555';
      ctx.shadowColor = occupied ? '#feca57' : 'transparent';
      ctx.shadowBlur = occupied ? 10 : 0;
      ctx.fillRect(-7, -7, 14, 14);
      ctx.restore();
    });
    ctx.shadowBlur = 0;

    // Runners on bases
    basePositions.forEach((bp, i) => {
      if (this.bases[i]) {
        this.drawStickFigure(ctx, bp.x + 12, bp.y - 5, '#feca57', 0.6);
      }
    });

    // Mound
    ctx.fillStyle = '#3a2a1a';
    ctx.beginPath();
    ctx.ellipse(200, H - 258, 15, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Pitcher
    this.drawStickFigure(ctx, 200, H - 268, '#eee', 0.8);

    // Home plate
    ctx.fillStyle = '#ddd';
    ctx.beginPath();
    ctx.moveTo(192, H - 36);
    ctx.lineTo(200, H - 42);
    ctx.lineTo(208, H - 36);
    ctx.lineTo(208, H - 30);
    ctx.lineTo(192, H - 30);
    ctx.closePath();
    ctx.fill();

    // Batter
    const batter = this.batter;
    this.drawStickFigure(ctx, 230, H - 55, batter.color, 0.9);

    // Bat
    const batBaseX = 240;
    const batBaseY = H - 55;
    const batLen = 50;
    let batAngle = -1.2;
    if (this.phase === 'skillcheck' || this.swingHit) {
      batAngle = 0.5;
    }
    ctx.strokeStyle = '#c8a050';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(batBaseX, batBaseY);
    ctx.lineTo(batBaseX + Math.cos(batAngle) * batLen, batBaseY + Math.sin(batAngle) * batLen);
    ctx.stroke();

    // Pitched ball
    if (this.ball.visible) {
      const z = this.ball.z;
      const scale = 1 - z;
      const screenX = 200 + (this.ball.x - 200) * scale;
      const screenY = (H - 260) + ((H - 60) - (H - 260)) * scale;
      const r = 4 + scale * 10;

      ctx.fillStyle = '#fff';
      ctx.shadowColor = '#fff';
      ctx.shadowBlur = 4;
      ctx.beginPath();
      ctx.arc(screenX, screenY, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Seams
      ctx.strokeStyle = '#ff4444';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(screenX - r * 0.3, screenY, r * 0.5, -0.5, 0.5);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(screenX + r * 0.3, screenY, r * 0.5, 2.6, 3.6);
      ctx.stroke();
    }

    // Hit ball flying
    if (this.hitBall) {
      const hb = this.hitBall;
      const alpha = hb.timer / 90;
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.shadowColor = '#fff';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(hb.x, hb.y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // ─── SKILL CHECK OVERLAY ───
    if (this.phase === 'skillcheck') {
      this.drawSkillCheck(ctx, W, H);
    }

    // ─── HUD ───
    // Top bar
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, W, 30);

    // Inning & Outs
    ctx.fillStyle = '#aaa';
    ctx.font = 'bold 12px system-ui';
    ctx.textAlign = 'left';
    ctx.fillText(`Inn ${this.inning}/${this.maxInnings}`, 8, 18);

    // Outs as dots
    ctx.textAlign = 'center';
    for (let i = 0; i < this.maxOuts; i++) {
      ctx.fillStyle = i < this.outs ? '#ff6b6b' : '#333';
      ctx.beginPath();
      ctx.arc(170 + i * 16, 15, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#777';
    ctx.font = '10px system-ui';
    ctx.fillText('OUTS', 186, 27);

    // Runs
    ctx.fillStyle = '#feca57';
    ctx.font = 'bold 14px system-ui';
    ctx.textAlign = 'right';
    ctx.fillText(`${this.runs} RUNS`, W - 8, 18);

    // Strikes
    ctx.textAlign = 'left';
    ctx.fillStyle = '#777';
    ctx.font = '10px system-ui';
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = i < this.strikes ? '#feca57' : '#333';
      ctx.beginPath();
      ctx.arc(85 + i * 12, 15, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#777';
    ctx.font = '10px system-ui';
    ctx.fillText('K', 85 + 3 * 12, 18);

    // Batter name
    ctx.fillStyle = batter.color;
    ctx.font = 'bold 11px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(`⚾ ${batter.name}`, W / 2, H - 8);

    // Batter stats
    ctx.fillStyle = '#555';
    ctx.font = '9px system-ui';
    ctx.fillText(`PWR ${Math.round(batter.power * 100)} | CON ${Math.round(batter.contact * 100)}`, W / 2, H);

    // Result text
    if (this.resultTimer > 0 && this.result) {
      const alpha = Math.min(1, this.resultTimer / 20);
      ctx.globalAlpha = alpha;

      let color = '#feca57';
      if (this.result.includes('HOME')) color = '#ff6b6b';
      else if (this.result.includes('Strikeout') || this.result.includes('Whiff') || this.result.includes('Ground Out')) color = '#ff4444';
      else if (this.result.includes('Triple')) color = '#ff9ff3';
      else if (this.result.includes('Double')) color = '#48dbfb';
      else if (this.result.includes('Single')) color = '#2ecc71';

      ctx.fillStyle = color;
      ctx.font = 'bold 24px system-ui';
      ctx.textAlign = 'center';

      const resultY = this.phase === 'gameover' ? H / 2 - 10 : 60;
      ctx.fillText(this.result, W / 2, resultY);

      if (this.phase === 'gameover') {
        ctx.fillStyle = '#666';
        ctx.font = '14px system-ui';
        ctx.fillText('Press SPACE to play again', W / 2, H / 2 + 25);
      }

      ctx.globalAlpha = 1;
    }

    // Idle prompt
    if (this.phase === 'idle' && this.pitchDelay <= 0 && this.resultTimer <= 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.font = '13px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('Press SPACE to pitch', W / 2, H * 0.45);
    }

    ctx.textAlign = 'left';
  },

  drawSkillCheck(ctx, W, H) {
    const s = this.skill;
    const barW = 300;
    const barH = 28;
    const barX = (W - barW) / 2;
    const barY = H * 0.42;

    // Darken background
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, barY - 50, W, barH + 100);

    // Label
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('BALANCE IT!', W / 2, barY - 18);

    // Arrow key hints
    ctx.fillStyle = '#666';
    ctx.font = '11px system-ui';
    ctx.fillText('← →', W / 2, barY - 5);

    // Bar background
    ctx.fillStyle = '#1a1a2e';
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW, barH, 6);
    ctx.fill();
    ctx.strokeStyle = '#2a2a4a';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Color zones
    const zones = [
      { min: -1, max: -0.65, color: 'rgba(255,50,50,0.3)' },
      { min: -0.65, max: -0.35, color: 'rgba(255,150,50,0.2)' },
      { min: -0.35, max: -0.05, color: 'rgba(255,255,50,0.15)' },
      { min: -0.05, max: 0.05, color: 'rgba(72,219,251,0.4)' },
      { min: 0.05, max: 0.35, color: 'rgba(255,255,50,0.15)' },
      { min: 0.35, max: 0.65, color: 'rgba(255,150,50,0.2)' },
      { min: 0.65, max: 1, color: 'rgba(255,50,50,0.3)' },
    ];

    zones.forEach(z => {
      const x1 = barX + ((z.min + 1) / 2) * barW;
      const x2 = barX + ((z.max + 1) / 2) * barW;
      ctx.fillStyle = z.color;
      ctx.fillRect(x1, barY + 1, x2 - x1, barH - 2);
    });

    // Center sweet spot
    const sweetX = barX + ((s.target + 1) / 2) * barW;
    ctx.fillStyle = '#48dbfb';
    ctx.shadowColor = '#48dbfb';
    ctx.shadowBlur = 6;
    ctx.fillRect(sweetX - 2, barY, 4, barH);
    ctx.shadowBlur = 0;

    // Cursor
    const cursorX = barX + ((s.x + 1) / 2) * barW;
    const acc = s.accuracy;
    let cursorColor;
    if (acc >= 95) cursorColor = '#48dbfb';
    else if (acc >= 55) cursorColor = '#2ecc71';
    else if (acc >= 35) cursorColor = '#feca57';
    else cursorColor = '#ff6b6b';

    ctx.fillStyle = cursorColor;
    ctx.shadowColor = cursorColor;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(cursorX, barY - 4);
    ctx.lineTo(cursorX - 6, barY - 12);
    ctx.lineTo(cursorX + 6, barY - 12);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cursorX, barY + barH + 4);
    ctx.lineTo(cursorX - 6, barY + barH + 12);
    ctx.lineTo(cursorX + 6, barY + barH + 12);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;

    // Accuracy display
    ctx.fillStyle = cursorColor;
    ctx.font = 'bold 18px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.round(acc)}%`, W / 2, barY + barH + 35);

    // Timer bar
    const timerFrac = s.timer / s.maxTime;
    ctx.fillStyle = '#2a2a4a';
    ctx.beginPath();
    ctx.roundRect(barX + 40, barY + barH + 42, barW - 80, 4, 2);
    ctx.fill();
    ctx.fillStyle = timerFrac > 0.3 ? '#48dbfb' : '#ff6b6b';
    ctx.beginPath();
    ctx.roundRect(barX + 40, barY + barH + 42, (barW - 80) * timerFrac, 4, 2);
    ctx.fill();
  },

  drawStickFigure(ctx, x, y, color, scale) {
    const s = scale || 1;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y - 18 * s, 5 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2 * s;
    ctx.beginPath();
    ctx.moveTo(x, y - 13 * s);
    ctx.lineTo(x, y + 2 * s);
    ctx.moveTo(x, y - 7 * s);
    ctx.lineTo(x - 7 * s, y - 1 * s);
    ctx.moveTo(x, y - 7 * s);
    ctx.lineTo(x + 7 * s, y - 1 * s);
    ctx.moveTo(x, y + 2 * s);
    ctx.lineTo(x - 5 * s, y + 12 * s);
    ctx.moveTo(x, y + 2 * s);
    ctx.lineTo(x + 5 * s, y + 12 * s);
    ctx.stroke();
  },

  destroy() {
    cancelAnimationFrame(this.animFrame);
    document.removeEventListener('keydown', this._onKeyDown);
    document.removeEventListener('keyup', this._onKeyUp);
  },
};
