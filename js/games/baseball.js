const BaseballGame = {
  name: 'Baseball',
  instructions: 'Press SPACE to swing! Time it right to hit the ball.',

  canvas: null,
  ctx: null,
  animFrame: null,

  // State
  pitching: false,
  swinging: false,
  ballInPlay: false,
  result: '',
  resultTimer: 0,

  // Ball
  ball: { x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, visible: false },

  // Bat
  bat: { angle: -0.5, swingAngle: 0, swinging: false, swingSpeed: 0 },

  // Scoring
  hits: 0,
  misses: 0,
  streak: 0,
  bestStreak: 0,
  pitchCount: 0,
  pitchDelay: 0,

  // Hit animation
  hitBall: null,

  init(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.hits = 0;
    this.misses = 0;
    this.streak = 0;
    this.bestStreak = 0;
    this.pitchCount = 0;
    this.result = 'Press SPACE to start!';
    this.resultTimer = 999;
    this.pitchDelay = 60;
    this.hitBall = null;

    this._onKey = (e) => this.handleKey(e);
    document.addEventListener('keydown', this._onKey);

    this.loop();
  },

  handleKey(e) {
    if (e.key === ' ') {
      e.preventDefault();
      if (!this.ball.visible && !this.swinging && this.pitchDelay <= 0) {
        this.throwPitch();
      } else if (this.ball.visible && !this.swinging) {
        this.swing();
      }
    }
  },

  throwPitch() {
    this.pitching = true;
    this.ball.visible = true;
    // Ball starts far away (high z = far)
    this.ball.x = 200 + (Math.random() - 0.5) * 40;
    this.ball.y = 200;
    this.ball.z = 1; // 0=plate, 1=mound
    this.ball.vz = -0.018 - Math.random() * 0.008; // Speed variation
    this.ball.vx = (Math.random() - 0.5) * 0.3;
    this.ball.vy = (Math.random() - 0.5) * 0.2;
    this.pitchCount++;
    this.result = '';
    this.resultTimer = 0;
  },

  swing() {
    this.swinging = true;
    this.bat.swingAngle = 0;
    this.bat.swingSpeed = 0.15;
  },

  loop() {
    this.update();
    this.draw();
    this.animFrame = requestAnimationFrame(() => this.loop());
  },

  update() {
    if (this.pitchDelay > 0) {
      this.pitchDelay--;
    }

    if (this.resultTimer > 0) this.resultTimer--;

    // Ball movement
    if (this.ball.visible) {
      this.ball.z += this.ball.vz;
      this.ball.x += this.ball.vx;
      this.ball.y += this.ball.vy;

      // Ball reached plate without swing
      if (this.ball.z <= 0 && !this.swinging) {
        this.ball.visible = false;
        this.pitching = false;
        this.misses++;
        this.streak = 0;
        this.result = 'Strike!';
        this.resultTimer = 60;
        this.pitchDelay = 40;
        this.updateScore();
      }
    }

    // Swing animation
    if (this.swinging) {
      this.bat.swingAngle += this.bat.swingSpeed;

      // Check for hit at the right moment
      if (this.bat.swingAngle > 0.4 && this.bat.swingAngle < 0.7 && this.ball.visible) {
        const hitZone = this.ball.z;
        if (hitZone < 0.25 && hitZone > -0.05) {
          // HIT!
          this.ball.visible = false;
          const quality = 1 - Math.abs(hitZone - 0.1) * 5;
          const centerOff = Math.abs(this.ball.x - 200);

          let hitResult;
          if (quality > 0.7 && centerOff < 20) {
            hitResult = 'HOME RUN!';
            this.hitBall = { x: 200, y: 300, vx: (Math.random() - 0.5) * 4, vy: -8, timer: 80 };
          } else if (quality > 0.4) {
            hitResult = Math.random() > 0.5 ? 'Line Drive!' : 'Fly Ball!';
            this.hitBall = { x: 200, y: 300, vx: (Math.random() - 0.5) * 6, vy: -5, timer: 60 };
          } else {
            hitResult = 'Foul Ball';
            this.hitBall = { x: 200, y: 300, vx: (Math.random() > 0.5 ? 5 : -5), vy: -3, timer: 50 };
          }

          this.hits++;
          this.streak++;
          if (this.streak > this.bestStreak) this.bestStreak = this.streak;
          this.result = hitResult;
          this.resultTimer = 70;
          this.updateScore();
        }
      }

      if (this.bat.swingAngle > 1.2) {
        this.swinging = false;
        this.bat.swingAngle = 0;

        if (this.ball.visible) {
          // Swung and missed
          this.ball.visible = false;
          this.pitching = false;
          this.misses++;
          this.streak = 0;
          this.result = 'Whiff!';
          this.resultTimer = 60;
          this.updateScore();
        }
        this.pitchDelay = 30;
      }
    }

    // Hit ball animation
    if (this.hitBall) {
      this.hitBall.x += this.hitBall.vx;
      this.hitBall.y += this.hitBall.vy;
      this.hitBall.vy += 0.1;
      this.hitBall.timer--;
      if (this.hitBall.timer <= 0) {
        this.hitBall = null;
        this.pitchDelay = 30;
      }
    }
  },

  updateScore() {
    if (typeof this.onScore === 'function') {
      this.onScore(`${this.hits}/${this.pitchCount} | Streak: ${this.streak}`);
    }
  },

  draw() {
    const { ctx, canvas } = this;

    // Sky gradient
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#1a1a3e');
    grad.addColorStop(0.5, '#1a2a1e');
    grad.addColorStop(1, '#2a1a0e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Field (perspective)
    ctx.fillStyle = '#1e3a1e';
    ctx.beginPath();
    ctx.moveTo(0, canvas.height);
    ctx.lineTo(canvas.width, canvas.height);
    ctx.lineTo(canvas.width * 0.75, canvas.height * 0.35);
    ctx.lineTo(canvas.width * 0.25, canvas.height * 0.35);
    ctx.closePath();
    ctx.fill();

    // Diamond lines
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(200, canvas.height - 40); // home
    ctx.lineTo(100, canvas.height - 180); // 3rd
    ctx.lineTo(200, canvas.height - 260); // 2nd
    ctx.lineTo(300, canvas.height - 180); // 1st
    ctx.closePath();
    ctx.stroke();

    // Mound
    ctx.fillStyle = '#3a2a1a';
    ctx.beginPath();
    ctx.ellipse(200, canvas.height - 260, 15, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Pitcher (simple stick figure)
    const py = canvas.height - 268;
    ctx.fillStyle = '#eee';
    ctx.beginPath();
    ctx.arc(200, py - 20, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#eee';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(200, py - 14);
    ctx.lineTo(200, py + 5);
    ctx.moveTo(200, py - 8);
    ctx.lineTo(192, py);
    ctx.moveTo(200, py - 8);
    ctx.lineTo(208, py);
    ctx.moveTo(200, py + 5);
    ctx.lineTo(194, py + 15);
    ctx.moveTo(200, py + 5);
    ctx.lineTo(206, py + 15);
    ctx.stroke();

    // Home plate
    ctx.fillStyle = '#ddd';
    ctx.beginPath();
    ctx.moveTo(192, canvas.height - 36);
    ctx.lineTo(200, canvas.height - 42);
    ctx.lineTo(208, canvas.height - 36);
    ctx.lineTo(208, canvas.height - 30);
    ctx.lineTo(192, canvas.height - 30);
    ctx.closePath();
    ctx.fill();

    // Strike zone (subtle guide)
    if (this.ball.visible) {
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 1;
      ctx.strokeRect(175, canvas.height - 100, 50, 60);
    }

    // Pitched ball (grows as it approaches)
    if (this.ball.visible) {
      const z = this.ball.z; // 1=far, 0=close
      const scale = 1 - z;
      const screenX = 200 + (this.ball.x - 200) * scale;
      const screenY = (canvas.height - 260) + ((canvas.height - 60) - (canvas.height - 260)) * scale;
      const r = 4 + scale * 10;

      ctx.fillStyle = '#fff';
      ctx.shadowColor = '#fff';
      ctx.shadowBlur = 4;
      ctx.beginPath();
      ctx.arc(screenX, screenY, r, 0, Math.PI * 2);
      ctx.fill();

      // Seams
      ctx.strokeStyle = '#ff4444';
      ctx.lineWidth = 1;
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(screenX - r * 0.3, screenY, r * 0.5, -0.5, 0.5);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(screenX + r * 0.3, screenY, r * 0.5, 2.6, 3.6);
      ctx.stroke();
    }

    // Bat
    const batBaseX = 240;
    const batBaseY = canvas.height - 55;
    const batLen = 55;
    let angle = -1.2;

    if (this.swinging) {
      angle = -1.2 + this.bat.swingAngle * 3;
    }

    ctx.strokeStyle = '#c8a050';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(batBaseX, batBaseY);
    ctx.lineTo(
      batBaseX + Math.cos(angle) * batLen,
      batBaseY + Math.sin(angle) * batLen
    );
    ctx.stroke();

    // Bat knob
    ctx.fillStyle = '#a08040';
    ctx.beginPath();
    ctx.arc(batBaseX, batBaseY, 5, 0, Math.PI * 2);
    ctx.fill();

    // Batter (simple)
    const bx = 235;
    const by = canvas.height - 60;
    ctx.fillStyle = '#eee';
    ctx.beginPath();
    ctx.arc(bx, by - 35, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#eee';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(bx, by - 28);
    ctx.lineTo(bx, by - 8);
    ctx.moveTo(bx, by - 8);
    ctx.lineTo(bx - 7, by + 5);
    ctx.moveTo(bx, by - 8);
    ctx.lineTo(bx + 7, by + 5);
    ctx.stroke();

    // Hit ball flying
    if (this.hitBall) {
      const hb = this.hitBall;
      const alpha = hb.timer / 80;
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.shadowColor = '#fff';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(hb.x, hb.y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Result text
    if (this.resultTimer > 0 && this.result) {
      const alpha = Math.min(1, this.resultTimer / 20);
      ctx.globalAlpha = alpha;

      let color = '#feca57';
      if (this.result.includes('HOME')) color = '#ff6b6b';
      else if (this.result.includes('Strike') || this.result.includes('Whiff')) color = '#ff4444';
      else if (this.result.includes('Line') || this.result.includes('Fly')) color = '#48dbfb';

      ctx.fillStyle = color;
      ctx.font = 'bold 28px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(this.result, canvas.width / 2, 60);
      ctx.globalAlpha = 1;
    }

    // Stats bar at top
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, canvas.width, 28);
    ctx.fillStyle = '#aaa';
    ctx.font = '12px system-ui';
    ctx.textAlign = 'left';
    ctx.fillText(`Hits: ${this.hits}`, 10, 18);
    ctx.textAlign = 'center';
    ctx.fillText(`Pitches: ${this.pitchCount}`, canvas.width / 2, 18);
    ctx.textAlign = 'right';
    ctx.fillText(`Best Streak: ${this.bestStreak}`, canvas.width - 10, 18);
    ctx.textAlign = 'left';
  },

  destroy() {
    cancelAnimationFrame(this.animFrame);
    document.removeEventListener('keydown', this._onKey);
  },
};
