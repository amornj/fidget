const BlackjackGame = {
  name: 'Blackjack',
  instructions: 'Beat the dealer! Get close to 21 without going over.',

  canvas: null,
  ctx: null,
  animFrame: null,
  state: 'betting',
  onScore: null,

  SUITS: ['\u2660', '\u2665', '\u2666', '\u2663'],
  SUIT_COLORS: { '\u2660': '#fff', '\u2665': '#e74c3c', '\u2666': '#48dbfb', '\u2663': '#2ecc71' },
  VALUES: ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'],
  BETS: [10, 25, 50, 100],

  // Game state
  money: 1000,
  bet: 0,
  deck: [],
  playerHand: [],
  dealerHand: [],
  dealerRevealed: false,
  message: '',
  hoverBtn: -1,
  doubledDown: false,
  resultTimer: 0,

  // Card animations
  cardAnims: [], // { x, y, targetX, targetY, card, faceDown, speed }
  dealQueue: [], // cards waiting to be dealt
  dealing: false,

  _onClick: null,
  _onMove: null,

  init(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.state = 'betting';
    this.money = 1000;
    this.bet = 0;
    this.message = '';
    this.hoverBtn = -1;
    this.cardAnims = [];
    this._onClick = (e) => this.handleClick(e);
    this._onMove = (e) => this.handleMove(e);
    canvas.addEventListener('click', this._onClick);
    canvas.addEventListener('mousemove', this._onMove);
    this.gameLoop();
  },

  destroy() {
    if (this.animFrame) cancelAnimationFrame(this.animFrame);
    this.animFrame = null;
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
    if (this.resultTimer > 0) {
      this.resultTimer--;
      if (this.resultTimer <= 0) {
        if (this.money <= 0) {
          this.state = 'gameover';
        } else {
          this.state = 'betting';
        }
      }
    }

    // Animate cards sliding in
    for (let i = this.cardAnims.length - 1; i >= 0; i--) {
      const a = this.cardAnims[i];
      a.x += (a.targetX - a.x) * 0.2;
      a.y += (a.targetY - a.y) * 0.2;
      if (Math.abs(a.x - a.targetX) < 1 && Math.abs(a.y - a.targetY) < 1) {
        a.x = a.targetX;
        a.y = a.targetY;
        a.done = true;
      }
    }
  },

  buildDeck() {
    const deck = [];
    for (let d = 0; d < 6; d++) {
      for (const suit of this.SUITS) {
        for (const val of this.VALUES) {
          deck.push({ suit, value: val });
        }
      }
    }
    this.shuffle(deck);
    return deck;
  },

  shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  },

  drawCard() {
    if (this.deck.length < 20) this.deck = this.buildDeck();
    return this.deck.pop();
  },

  handValue(hand) {
    let total = 0;
    let aces = 0;
    for (const c of hand) {
      if (c.value === 'A') { aces++; total += 11; }
      else if (['J', 'Q', 'K'].includes(c.value)) total += 10;
      else total += parseInt(c.value);
    }
    while (total > 21 && aces > 0) {
      total -= 10;
      aces--;
    }
    return total;
  },

  isBlackjack(hand) {
    return hand.length === 2 && this.handValue(hand) === 21;
  },

  // Get target position for a card in a hand
  getCardPos(isDealer, index, handLen) {
    const cardW = 55;
    const y = isDealer ? 50 : 230;
    const spacing = Math.min(60, (350 - cardW) / Math.max(handLen - 1, 1));
    const startX = Math.max(20, (400 - (spacing * (handLen - 1) + cardW)) / 2);
    return { x: startX + index * spacing, y: y };
  },

  addCardAnim(card, isDealer, index, handLen, faceDown) {
    const target = this.getCardPos(isDealer, index, handLen);
    this.cardAnims.push({
      x: 380, y: -80, // start off-screen top-right
      targetX: target.x, targetY: target.y,
      card: card,
      faceDown: faceDown || false,
      done: false
    });
  },

  placeBet(amount) {
    if (amount > this.money) amount = this.money;
    if (amount <= 0) return;
    this.bet = amount;
    this.deck = this.buildDeck();
    this.playerHand = [];
    this.dealerHand = [];
    this.dealerRevealed = false;
    this.doubledDown = false;
    this.message = '';
    this.cardAnims = [];

    // Deal with animations
    const c1 = this.drawCard();
    const c2 = this.drawCard();
    const c3 = this.drawCard();
    const c4 = this.drawCard();

    this.playerHand.push(c1);
    this.dealerHand.push(c2);
    this.playerHand.push(c3);
    this.dealerHand.push(c4);

    this.addCardAnim(c1, false, 0, 2, false);
    this.addCardAnim(c2, true, 0, 2, false);
    this.addCardAnim(c3, false, 1, 2, false);
    this.addCardAnim(c4, true, 1, 2, true); // dealer's second card face-down

    SFX.hit();

    // Check for blackjack
    if (this.isBlackjack(this.playerHand)) {
      this.dealerRevealed = true;
      if (this.isBlackjack(this.dealerHand)) {
        this.endRound('push');
      } else {
        this.endRound('blackjack');
      }
      return;
    }

    if (this.isBlackjack(this.dealerHand)) {
      this.dealerRevealed = true;
      this.endRound('lose');
      return;
    }

    this.state = 'playing';
    if (this.onScore) this.onScore('$' + this.money);
  },

  hit() {
    const card = this.drawCard();
    this.playerHand.push(card);
    this.addCardAnim(card, false, this.playerHand.length - 1, this.playerHand.length, false);
    // Update positions of existing player cards
    this.updateHandPositions(false);
    SFX.hit();
    const val = this.handValue(this.playerHand);
    if (val > 21) {
      this.dealerRevealed = true;
      this.endRound('bust');
    } else if (val === 21) {
      this.stand();
    }
  },

  updateHandPositions(isDealer) {
    const hand = isDealer ? this.dealerHand : this.playerHand;
    for (let i = 0; i < this.cardAnims.length; i++) {
      const a = this.cardAnims[i];
      const matchIdx = hand.indexOf(a.card);
      if (matchIdx !== -1) {
        const isDealerCard = this.dealerHand.includes(a.card);
        if (isDealerCard === isDealer) {
          const pos = this.getCardPos(isDealer, matchIdx, hand.length);
          a.targetX = pos.x;
          a.targetY = pos.y;
        }
      }
    }
  },

  stand() {
    this.dealerRevealed = true;
    // Reveal dealer's hidden card
    for (const a of this.cardAnims) {
      if (a.faceDown) a.faceDown = false;
    }
    this.state = 'dealer';
    this.dealerPlay();
  },

  doubleDown() {
    if (this.playerHand.length !== 2) return;
    const addBet = Math.min(this.bet, this.money - this.bet);
    if (addBet <= 0) return;
    this.bet += addBet;
    this.doubledDown = true;
    const card = this.drawCard();
    this.playerHand.push(card);
    this.addCardAnim(card, false, this.playerHand.length - 1, this.playerHand.length, false);
    this.updateHandPositions(false);
    SFX.hit();
    const val = this.handValue(this.playerHand);
    if (val > 21) {
      this.dealerRevealed = true;
      this.endRound('bust');
    } else {
      this.stand();
    }
  },

  dealerPlay() {
    const play = () => {
      const val = this.handValue(this.dealerHand);
      if (val < 17) {
        const card = this.drawCard();
        this.dealerHand.push(card);
        this.addCardAnim(card, true, this.dealerHand.length - 1, this.dealerHand.length, false);
        this.updateHandPositions(true);
        SFX.hit();
        setTimeout(play, 600);
      } else {
        this.resolveHands();
      }
    };
    setTimeout(play, 500);
  },

  resolveHands() {
    const pv = this.handValue(this.playerHand);
    const dv = this.handValue(this.dealerHand);

    if (dv > 21) {
      this.endRound('win');
    } else if (pv > dv) {
      this.endRound('win');
    } else if (pv < dv) {
      this.endRound('lose');
    } else {
      this.endRound('push');
    }
  },

  endRound(result) {
    this.state = 'result';
    this.resultTimer = 150;

    switch (result) {
      case 'blackjack':
        this.money += Math.floor(this.bet * 1.5);
        this.message = 'Blackjack! +$' + Math.floor(this.bet * 1.5);
        SFX.collect();
        break;
      case 'win':
        this.money += this.bet;
        this.message = 'You win! +$' + this.bet;
        SFX.collect();
        break;
      case 'lose':
        this.money -= this.bet;
        this.message = 'Dealer wins! -$' + this.bet;
        SFX.hit();
        break;
      case 'bust':
        this.money -= this.bet;
        this.message = 'Bust! -$' + this.bet;
        SFX.hit();
        break;
      case 'push':
        this.message = 'Push! Bet returned.';
        break;
    }

    if (this.onScore) this.onScore('$' + this.money);
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

    if (this.state === 'betting') {
      const bets = this.BETS;
      const btnW = 75;
      const gap = 10;
      const totalW = bets.length * btnW + (bets.length - 1) * gap;
      const sx = (400 - totalW) / 2;
      const by = 280;

      for (let i = 0; i < bets.length; i++) {
        const x = sx + i * (btnW + gap);
        if (pos.x >= x && pos.x <= x + btnW && pos.y >= by && pos.y <= by + 40) {
          this.placeBet(bets[i]);
          return;
        }
      }

      if (pos.x >= 150 && pos.x <= 250 && pos.y >= 340 && pos.y <= 375) {
        this.placeBet(this.money);
        return;
      }
    } else if (this.state === 'playing') {
      if (pos.x >= 40 && pos.x <= 140 && pos.y >= 390 && pos.y <= 430) {
        this.hit();
        return;
      }
      if (pos.x >= 160 && pos.x <= 260 && pos.y >= 390 && pos.y <= 430) {
        this.stand();
        return;
      }
      if (this.playerHand.length === 2 && this.money >= this.bet * 2) {
        if (pos.x >= 280 && pos.x <= 380 && pos.y >= 390 && pos.y <= 430) {
          this.doubleDown();
          return;
        }
      }
    } else if (this.state === 'result') {
      this.resultTimer = 1;
    } else if (this.state === 'gameover') {
      if (pos.x >= 120 && pos.x <= 280 && pos.y >= 300 && pos.y <= 340) {
        this.money = 1000;
        this.state = 'betting';
        if (this.onScore) this.onScore('$' + this.money);
      }
    }
  },

  handleMove(e) {
    const pos = this.getMousePos(e);
    this.hoverBtn = -1;

    if (this.state === 'betting') {
      const bets = this.BETS;
      const btnW = 75;
      const gap = 10;
      const totalW = bets.length * btnW + (bets.length - 1) * gap;
      const sx = (400 - totalW) / 2;
      for (let i = 0; i < bets.length; i++) {
        const x = sx + i * (btnW + gap);
        if (pos.x >= x && pos.x <= x + btnW && pos.y >= 280 && pos.y <= 320) {
          this.hoverBtn = i;
          break;
        }
      }
      if (pos.x >= 150 && pos.x <= 250 && pos.y >= 340 && pos.y <= 375) {
        this.hoverBtn = 10;
      }
    }
  },

  // ==================== RENDERING ====================

  render() {
    const ctx = this.ctx;
    if (!ctx) return;

    ctx.fillStyle = '#0f0f23';
    ctx.fillRect(0, 0, 400, 460);

    if (this.state === 'betting') {
      this.drawBetting();
    } else if (this.state === 'playing' || this.state === 'dealer' || this.state === 'result') {
      this.drawTable();
    } else if (this.state === 'gameover') {
      this.drawGameOver();
    }
  },

  drawBetting() {
    const ctx = this.ctx;

    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#48dbfb';
    ctx.fillText('Blackjack', 200, 60);

    ctx.font = 'bold 32px monospace';
    ctx.fillStyle = '#2ecc71';
    ctx.fillText('$' + this.money, 200, 140);

    ctx.font = '14px monospace';
    ctx.fillStyle = '#888';
    ctx.fillText('Place your bet', 200, 180);

    const bets = this.BETS;
    const btnW = 75;
    const gap = 10;
    const totalW = bets.length * btnW + (bets.length - 1) * gap;
    const sx = (400 - totalW) / 2;
    const by = 280;

    for (let i = 0; i < bets.length; i++) {
      const b = bets[i];
      const x = sx + i * (btnW + gap);
      const canAfford = b <= this.money;
      const hover = this.hoverBtn === i;

      ctx.fillStyle = !canAfford ? 'rgba(255,255,255,0.03)' :
                      hover ? 'rgba(72,219,251,0.3)' : 'rgba(255,255,255,0.08)';
      ctx.strokeStyle = !canAfford ? '#333' : hover ? '#48dbfb' : '#555';
      ctx.lineWidth = hover ? 2 : 1;
      this.roundRect(ctx, x, by, btnW, 40, 8);
      ctx.fill();
      ctx.stroke();

      ctx.font = 'bold 16px monospace';
      ctx.fillStyle = !canAfford ? '#444' : hover ? '#48dbfb' : '#fff';
      ctx.fillText('$' + b, x + btnW / 2, by + 26);
    }

    const allHover = this.hoverBtn === 10;
    ctx.fillStyle = allHover ? 'rgba(255,107,107,0.3)' : 'rgba(255,107,107,0.1)';
    ctx.strokeStyle = allHover ? '#ff6b6b' : '#ff6b6b55';
    ctx.lineWidth = allHover ? 2 : 1;
    this.roundRect(ctx, 150, 340, 100, 35, 8);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 14px monospace';
    ctx.fillStyle = allHover ? '#ff6b6b' : '#ff6b6b88';
    ctx.fillText('ALL IN', 200, 362);

    ctx.font = '60px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    ctx.fillText('\u2660 \u2665', 200, 250);

    ctx.textAlign = 'left';
  },

  drawTable() {
    const ctx = this.ctx;

    // Dealer label
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#888';
    ctx.fillText('DEALER', 20, 25);

    const dv = this.dealerRevealed ? this.handValue(this.dealerHand) : '?';
    ctx.textAlign = 'right';
    ctx.fillStyle = '#fff';
    ctx.fillText('' + dv, 380, 25);

    // Divider
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(20, 170);
    ctx.lineTo(380, 170);
    ctx.stroke();

    // Bet display
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f1c40f';
    ctx.fillText('Bet: $' + this.bet + (this.doubledDown ? ' (DD)' : ''), 200, 190);

    // Player label
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#888';
    ctx.fillText('YOU', 20, 215);

    const pv = this.handValue(this.playerHand);
    ctx.textAlign = 'right';
    ctx.fillStyle = pv > 21 ? '#ff6b6b' : '#fff';
    ctx.fillText('' + pv, 380, 215);

    // Draw animated cards
    const cardW = 55;
    const cardH = 80;
    for (const a of this.cardAnims) {
      if (a.faceDown) {
        ctx.fillStyle = '#1a1a3a';
        ctx.strokeStyle = '#48dbfb';
        ctx.lineWidth = 1;
        this.roundRect(ctx, a.x, a.y, cardW, cardH, 5);
        ctx.fill();
        ctx.stroke();
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#48dbfb';
        ctx.fillText('?', a.x + cardW / 2, a.y + cardH / 2 + 4);
      } else {
        this.drawPlayingCard(a.x, a.y, cardW, cardH, a.card);
      }
    }

    // Action buttons
    if (this.state === 'playing') {
      this.drawButton(40, 390, 100, 40, 'HIT', '#48dbfb');
      this.drawButton(160, 390, 100, 40, 'STAND', '#f1c40f');
      if (this.playerHand.length === 2 && this.money >= this.bet * 2) {
        this.drawButton(280, 390, 100, 40, 'DOUBLE', '#2ecc71');
      }
    }

    // Message
    if (this.message && this.state === 'result') {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      this.roundRect(ctx, 50, 340, 300, 50, 8);
      ctx.fill();

      ctx.font = 'bold 18px monospace';
      ctx.textAlign = 'center';
      const isWin = this.message.includes('win') || this.message.includes('Blackjack');
      ctx.fillStyle = isWin ? '#2ecc71' : this.message.includes('Push') ? '#f1c40f' : '#ff6b6b';
      ctx.fillText(this.message, 200, 372);

      ctx.font = '11px monospace';
      ctx.fillStyle = '#888';
      ctx.fillText('Click to continue', 200, 400);
    }

    // Money display
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'right';
    ctx.fillStyle = '#2ecc71';
    ctx.fillText('$' + this.money, 380, 455);

    ctx.textAlign = 'left';
  },

  drawPlayingCard(x, y, w, h, card) {
    const ctx = this.ctx;
    const color = this.SUIT_COLORS[card.suit];

    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#999';
    ctx.lineWidth = 1;
    this.roundRect(ctx, x, y, w, h, 5);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'left';
    ctx.fillStyle = color === '#fff' ? '#333' : color;
    ctx.fillText(card.value, x + 4, y + 16);

    ctx.font = '12px sans-serif';
    ctx.fillText(card.suit, x + 4, y + 30);

    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(card.suit, x + w / 2, y + h / 2 + 8);

    ctx.textAlign = 'left';
  },

  drawButton(x, y, w, h, text, color) {
    const ctx = this.ctx;
    ctx.fillStyle = color + '33';
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    this.roundRect(ctx, x, y, w, h, 8);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = color;
    ctx.fillText(text, x + w / 2, y + h / 2 + 5);
    ctx.textAlign = 'left';
  },

  drawGameOver() {
    const ctx = this.ctx;

    ctx.font = 'bold 28px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff6b6b';
    ctx.fillText('Broke!', 200, 180);

    ctx.font = '14px monospace';
    ctx.fillStyle = '#888';
    ctx.fillText('You ran out of money.', 200, 220);

    ctx.fillStyle = 'rgba(72,219,251,0.3)';
    ctx.strokeStyle = '#48dbfb';
    ctx.lineWidth = 1.5;
    this.roundRect(ctx, 120, 300, 160, 40, 8);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 14px monospace';
    ctx.fillStyle = '#48dbfb';
    ctx.fillText('Try Again ($1000)', 200, 326);

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
