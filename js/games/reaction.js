const ReactionGame = {
  name: 'Reaction',
  instructions: 'Click/SPACE when the screen turns green! Test your reflexes.',

  canvas: null,
  ctx: null,
  animFrame: null,

  state: 'idle', // 'idle', 'waiting', 'ready', 'result', 'early'
  startTime: 0,
  reactionTime: 0,
  waitTimeout: null,
  times: [],
  bestTime: Infinity,
  round: 0,

  init(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.times = [];
    this.bestTime = Infinity;
    this.round = 0;
    this.state = 'idle';

    this._onClick = () => this.handleClick();
    this._onKey = (e) => { if (e.key === ' ') { e.preventDefault(); this.handleClick(); } };
    canvas.addEventListener('click', this._onClick);
    document.addEventListener('keydown', this._onKey);

    this.loop();
  },

  handleClick() {
    if (this.state === 'idle') {
      this.startRound();
    } else if (this.state === 'waiting') {
      // Clicked too early
      clearTimeout(this.waitTimeout);
      this.state = 'early';
    } else if (this.state === 'ready') {
      this.reactionTime = performance.now() - this.startTime;
      this.times.push(this.reactionTime);
      if (this.reactionTime < this.bestTime) this.bestTime = this.reactionTime;
      this.round++;
      this.state = 'result';
      this.updateScore();
    } else if (this.state === 'result' || this.state === 'early') {
      this.startRound();
    }
  },

  startRound() {
    this.state = 'waiting';
    const delay = 1500 + Math.random() * 3500;
    this.waitTimeout = setTimeout(() => {
      this.state = 'ready';
      this.startTime = performance.now();
    }, delay);
  },

  getAverage() {
    if (this.times.length === 0) return 0;
    return this.times.reduce((a, b) => a + b, 0) / this.times.length;
  },

  updateScore() {
    if (typeof this.onScore === 'function') {
      const avg = this.getAverage();
      this.onScore(`Avg: ${Math.round(avg)}ms | Best: ${Math.round(this.bestTime)}ms`);
    }
  },

  loop() {
    this.draw();
    this.animFrame = requestAnimationFrame(() => this.loop());
  },

  draw() {
    const { ctx, canvas } = this;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    if (this.state === 'idle') {
      ctx.fillStyle = '#0f0f23';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#48dbfb';
      ctx.font = 'bold 28px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('⚡ Reaction Test', cx, cy - 80);

      ctx.fillStyle = '#aaa';
      ctx.font = '15px system-ui';
      ctx.fillText('How fast can you react?', cx, cy - 45);

      // Animated circle
      const pulse = Math.sin(performance.now() / 500) * 5 + 40;
      ctx.strokeStyle = '#48dbfb';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy + 30, pulse, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#48dbfb';
      ctx.font = 'bold 18px system-ui';
      ctx.fillText('Click to Start', cx, cy + 36);

      if (this.times.length > 0) {
        ctx.fillStyle = '#555';
        ctx.font = '13px system-ui';
        ctx.fillText(`Previous avg: ${Math.round(this.getAverage())}ms`, cx, cy + 100);
      }

    } else if (this.state === 'waiting') {
      ctx.fillStyle = '#8b0000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.font = 'bold 26px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('Wait for green...', cx, cy - 10);

      // Pulsing dots
      for (let i = 0; i < 3; i++) {
        const dotAlpha = (Math.sin(performance.now() / 300 + i * 1.5) + 1) / 2;
        ctx.fillStyle = `rgba(255,255,255,${0.2 + dotAlpha * 0.5})`;
        ctx.beginPath();
        ctx.arc(cx - 30 + i * 30, cy + 30, 6, 0, Math.PI * 2);
        ctx.fill();
      }

    } else if (this.state === 'ready') {
      ctx.fillStyle = '#006b00';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 36px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('CLICK NOW!', cx, cy);

      // Expanding rings
      const elapsed = performance.now() - this.startTime;
      for (let i = 0; i < 3; i++) {
        const ringR = ((elapsed / 8 + i * 40) % 120);
        const alpha = 1 - ringR / 120;
        ctx.strokeStyle = `rgba(255,255,255,${alpha * 0.3})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
        ctx.stroke();
      }

    } else if (this.state === 'early') {
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#ff6b6b';
      ctx.font = 'bold 30px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('Too Early!', cx, cy - 20);

      ctx.fillStyle = '#aaa';
      ctx.font = '15px system-ui';
      ctx.fillText('Click to try again', cx, cy + 20);

    } else if (this.state === 'result') {
      ctx.fillStyle = '#0f0f23';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Rating
      let rating, ratingColor;
      if (this.reactionTime < 200) { rating = 'Insane!'; ratingColor = '#ff6b6b'; }
      else if (this.reactionTime < 250) { rating = 'Amazing!'; ratingColor = '#feca57'; }
      else if (this.reactionTime < 300) { rating = 'Great!'; ratingColor = '#48dbfb'; }
      else if (this.reactionTime < 400) { rating = 'Good'; ratingColor = '#2ecc71'; }
      else if (this.reactionTime < 500) { rating = 'Average'; ratingColor = '#aaa'; }
      else { rating = 'Slow'; ratingColor = '#888'; }

      ctx.fillStyle = ratingColor;
      ctx.font = 'bold 22px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(rating, cx, cy - 80);

      // Big time display
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 52px system-ui';
      ctx.fillText(`${Math.round(this.reactionTime)}`, cx, cy - 15);
      ctx.fillStyle = '#888';
      ctx.font = '18px system-ui';
      ctx.fillText('milliseconds', cx, cy + 15);

      // Stats
      ctx.fillStyle = '#555';
      ctx.font = '13px system-ui';
      const avg = this.getAverage();
      ctx.fillText(`Round ${this.round} | Avg: ${Math.round(avg)}ms | Best: ${Math.round(this.bestTime)}ms`, cx, cy + 60);

      // History bar chart
      const barW = 8;
      const maxBars = Math.min(this.times.length, 20);
      const startI = this.times.length - maxBars;
      const chartX = cx - (maxBars * (barW + 2)) / 2;
      const chartY = cy + 100;
      const maxH = 80;

      for (let i = 0; i < maxBars; i++) {
        const t = this.times[startI + i];
        const h = Math.min((t / 600) * maxH, maxH);
        let barColor;
        if (t < 250) barColor = '#feca57';
        else if (t < 350) barColor = '#48dbfb';
        else barColor = '#555';

        ctx.fillStyle = barColor;
        ctx.fillRect(chartX + i * (barW + 2), chartY - h, barW, h);
      }

      // Continue
      ctx.fillStyle = '#666';
      ctx.font = '13px system-ui';
      ctx.fillText('Click to go again', cx, canvas.height - 30);
    }
  },

  destroy() {
    cancelAnimationFrame(this.animFrame);
    clearTimeout(this.waitTimeout);
    this.canvas.removeEventListener('click', this._onClick);
    document.removeEventListener('keydown', this._onKey);
  },
};
