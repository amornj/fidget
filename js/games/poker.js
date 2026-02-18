const PokerGame = {
  name: 'Poker',
  instructions: 'Texas Hold\'em! Best 5-card hand wins.',

  canvas: null,
  ctx: null,
  animFrame: null,
  state: 'menu',
  onScore: null,

  SUITS: ['\u2660', '\u2665', '\u2666', '\u2663'],
  SUIT_COLORS: { '\u2660': '#fff', '\u2665': '#e74c3c', '\u2666': '#48dbfb', '\u2663': '#2ecc71' },
  VALUES: ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'],
  VALUE_RANK: { '2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,'10':10,'J':11,'Q':12,'K':13,'A':14 },

  HAND_NAMES: [
    'High Card', 'One Pair', 'Two Pair', 'Three of a Kind',
    'Straight', 'Flush', 'Full House', 'Four of a Kind',
    'Straight Flush', 'Royal Flush'
  ],

  // Game state
  playerCount: 2,
  humanCount: 1, // how many humans (player 0 is always human)
  players: [],
  deck: [],
  community: [],
  pot: 0,
  currentBet: 0,
  roundBets: [],
  currentPlayer: 0,
  dealerBtn: 0,
  phase: '',
  folded: [],
  allIn: [],
  lastRaiser: -1,
  actedThisRound: [],
  menuHover: -1,
  hoverBtn: -1,
  raiseAmount: 0,
  smallBlind: 5,
  bigBlind: 10,
  winner: -1,
  winHand: '',
  showdownReveal: false,
  aiTimeout: null,
  phaseTimer: 0,
  lastAction: '',

  // Card animations
  cardAnims: [], // { x, y, targetX, targetY, card, faceDown, done }

  _onClick: null,
  _onMove: null,

  init(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.state = 'menu';
    this.menuHover = -1;
    this.humanCount = 1;
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
    // Animate cards
    for (const a of this.cardAnims) {
      if (!a.done) {
        a.x += (a.targetX - a.x) * 0.2;
        a.y += (a.targetY - a.y) * 0.2;
        if (Math.abs(a.x - a.targetX) < 1 && Math.abs(a.y - a.targetY) < 1) {
          a.x = a.targetX;
          a.y = a.targetY;
          a.done = true;
        }
      }
    }

    // Phase dealing pause - wait before starting next betting round
    if (this.state === 'dealing' && Date.now() - this.phaseTimer > 1500) {
      const canAct = [];
      for (let i = 0; i < this.playerCount; i++) {
        if (!this.folded[i] && !this.allIn[i] && this.players[i].money > 0) canAct.push(i);
      }
      if (canAct.length <= 1) {
        // All-in runout: deal next phase with pause, or showdown after river
        this.nextPhase();
      } else {
        // Post-flop: first to act is after dealer. Preflop: already set in startHand
        if (this.phase !== 'preflop') {
          this.currentPlayer = this.nextActive((this.dealerBtn + 1) % this.playerCount);
        }
        this.startPlayerTurn();
      }
    }
  },

  // ==================== GAME SETUP ====================

  isHuman(p) {
    return p < this.humanCount;
  },

  playerName(p) {
    if (this.isHuman(p)) return this.humanCount > 1 ? 'P' + (p + 1) : 'You';
    return 'CPU ' + (p + 1 - this.humanCount);
  },

  startGame(count, humans) {
    this.playerCount = count;
    this.humanCount = humans;
    this.players = [];
    for (let i = 0; i < count; i++) {
      this.players.push({ money: 1000, hand: [], bet: 0 });
    }
    this.dealerBtn = 0;
    this.startHand();
  },

  startHand() {
    const alive = this.players.filter(p => p.money > 0);
    if (alive.length <= 1) {
      this.state = 'gameover';
      this.winner = this.players.findIndex(p => p.money > 0);
      if (this.onScore) this.onScore(this.playerName(this.winner) + ' Wins!');
      return;
    }

    this.deck = this.buildDeck();
    this.community = [];
    this.pot = 0;
    this.folded = new Array(this.playerCount).fill(false);
    this.allIn = new Array(this.playerCount).fill(false);
    this.roundBets = new Array(this.playerCount).fill(0);
    this.actedThisRound = new Array(this.playerCount).fill(false);
    this.showdownReveal = false;
    this.winHand = '';
    this.cardAnims = [];

    for (let i = 0; i < this.playerCount; i++) {
      this.players[i].hand = [];
      this.players[i].bet = 0;
      if (this.players[i].money <= 0) this.folded[i] = true;
    }

    // Deal 2 cards each with animation
    for (let c = 0; c < 2; c++) {
      for (let i = 0; i < this.playerCount; i++) {
        if (!this.folded[i]) {
          const card = this.deck.pop();
          this.players[i].hand.push(card);
          // Cards fly in from top
          const isVisible = this.isHuman(i) && this.humanCount === 1;
          this.cardAnims.push({
            x: 200, y: -50,
            targetX: 140 + c * 60, targetY: 170,
            card: card,
            owner: i,
            faceDown: !isVisible,
            done: false
          });
        }
      }
    }

    // Post blinds
    const sb = this.nextActive((this.dealerBtn + 1) % this.playerCount);
    const bb = this.nextActive((sb + 1) % this.playerCount);

    this.postBet(sb, Math.min(this.smallBlind, this.players[sb].money));
    this.postBet(bb, Math.min(this.bigBlind, this.players[bb].money));
    this.currentBet = this.bigBlind;

    this.currentPlayer = this.nextActive((bb + 1) % this.playerCount);
    this.lastRaiser = bb;
    this.phase = 'preflop';

    if (this.onScore) this.onScore('Pot: $' + this.pot);
    this.state = 'dealing';
    this.phaseTimer = Date.now();
    this.lastAction = '';
  },

  startPlayerTurn() {
    if (this.isHuman(this.currentPlayer)) {
      if (this.humanCount > 1) {
        this.state = 'passturn';
      } else {
        this.state = 'betting';
      }
    } else {
      // AI turn
      this.state = 'aithinking';
      this.aiTimeout = setTimeout(() => this.aiPlay(this.currentPlayer), 600 + Math.random() * 600);
    }
  },

  buildDeck() {
    const deck = [];
    for (const suit of this.SUITS) {
      for (const val of this.VALUES) {
        deck.push({ suit, value: val });
      }
    }
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  },

  nextActive(from) {
    let p = from;
    for (let i = 0; i < this.playerCount; i++) {
      if (!this.folded[p] && !this.allIn[p] && this.players[p].money > 0) return p;
      p = (p + 1) % this.playerCount;
    }
    return from;
  },

  postBet(player, amount) {
    amount = Math.min(amount, this.players[player].money);
    this.players[player].money -= amount;
    this.players[player].bet += amount;
    this.roundBets[player] += amount;
    this.pot += amount;
    if (this.players[player].money <= 0) this.allIn[player] = true;
  },

  // ==================== AI LOGIC ====================

  aiPlay(p) {
    const player = this.players[p];
    const toCall = this.currentBet - this.roundBets[p];
    const hand = player.hand;

    // Evaluate hand strength
    let strength = 0; // 0-1 scale

    if (this.community.length === 0) {
      // Pre-flop: rate by hole cards
      const r1 = this.VALUE_RANK[hand[0].value];
      const r2 = this.VALUE_RANK[hand[1].value];
      const highCard = Math.max(r1, r2);
      const isPair = r1 === r2;
      const isSuited = hand[0].suit === hand[1].suit;

      if (isPair) strength = 0.5 + (highCard / 14) * 0.4;
      else if (highCard >= 12) strength = 0.35 + (isSuited ? 0.1 : 0);
      else if (highCard >= 10) strength = 0.25 + (isSuited ? 0.08 : 0);
      else strength = 0.1 + (highCard / 14) * 0.15;
    } else {
      // Post-flop: evaluate actual hand
      const result = this.evaluateHand([...hand, ...this.community]);
      if (result) {
        strength = (result.rank / 9) * 0.7 + 0.3;
        // Adjust by kickers
        if (result.kickers && result.kickers[0]) {
          strength += (result.kickers[0] / 14) * 0.1;
        }
      }
    }

    // Add randomness
    strength += (Math.random() - 0.5) * 0.2;
    strength = Math.max(0, Math.min(1, strength));

    // Decision based on strength
    if (toCall > 0) {
      // Need to call or fold
      if (strength < 0.2) {
        this.doAction('fold');
      } else if (strength > 0.7 && player.money > toCall * 3) {
        this.raiseAmount = Math.min(this.currentBet + this.bigBlind * (strength > 0.85 ? 5 : 2), player.money + this.roundBets[p]);
        if (this.raiseAmount > this.currentBet) {
          this.doAction('raise');
        } else {
          this.doAction('call');
        }
      } else if (strength > 0.95 && Math.random() < 0.1) {
        this.doAction('allin');
      } else {
        this.doAction('call');
      }
    } else {
      // Can check for free
      if (strength > 0.65 && player.money > this.bigBlind * 4) {
        this.raiseAmount = Math.min(this.currentBet + this.bigBlind * (strength > 0.8 ? 4 : 2), player.money + this.roundBets[p]);
        if (this.raiseAmount > this.currentBet) {
          this.doAction('raise');
        } else {
          this.doAction('check');
        }
      } else {
        this.doAction('check');
      }
    }
  },

  // ==================== ACTIONS ====================

  doAction(action) {
    const p = this.currentPlayer;
    const player = this.players[p];

    if (action === 'fold') {
      this.folded[p] = true;
      this.lastAction = this.playerName(p) + ' folds';
      SFX.hit();
    } else if (action === 'check') {
      this.lastAction = this.playerName(p) + ' checks';
      SFX.hit();
    } else if (action === 'call') {
      const toCall = Math.min(this.currentBet - this.roundBets[p], player.money);
      this.lastAction = this.playerName(p) + ' calls $' + toCall;
      this.postBet(p, toCall);
      SFX.hit();
    } else if (action === 'raise') {
      const total = this.raiseAmount;
      const toAdd = total - this.roundBets[p];
      this.postBet(p, Math.min(toAdd, player.money));
      this.currentBet = total;
      this.lastRaiser = p;
      this.actedThisRound = new Array(this.playerCount).fill(false);
      this.actedThisRound[p] = true;
      this.lastAction = this.playerName(p) + ' raises to $' + total;
      SFX.collect();
    } else if (action === 'allin') {
      const allAmount = player.money;
      this.lastAction = this.playerName(p) + ' ALL IN $' + allAmount;
      this.postBet(p, allAmount);
      if (this.roundBets[p] > this.currentBet) {
        this.currentBet = this.roundBets[p];
        this.lastRaiser = p;
        this.actedThisRound = new Array(this.playerCount).fill(false);
      }
      this.actedThisRound[p] = true;
      SFX.collect();
    }

    this.actedThisRound[p] = true;
    if (this.onScore) this.onScore('Pot: $' + this.pot);

    const activePlayers = this.folded.filter(f => !f).length;
    if (activePlayers <= 1) {
      const w = this.folded.findIndex(f => !f);
      this.winner = w;
      this.players[w].money += this.pot;
      this.winHand = 'Last player standing';
      this.state = 'showdown';
      if (this.onScore) this.onScore(this.playerName(w) + ' wins $' + this.pot);
      return;
    }

    this.advanceTurn();
  },

  advanceTurn() {
    let next = (this.currentPlayer + 1) % this.playerCount;
    let checked = 0;

    while (checked < this.playerCount) {
      if (!this.folded[next] && !this.allIn[next] && this.players[next].money > 0) {
        if (!this.actedThisRound[next] || this.roundBets[next] < this.currentBet) {
          this.currentPlayer = next;
          this.startPlayerTurn();
          return;
        }
      }
      next = (next + 1) % this.playerCount;
      checked++;
    }

    this.nextPhase();
  },

  nextPhase() {
    this.roundBets = new Array(this.playerCount).fill(0);
    this.actedThisRound = new Array(this.playerCount).fill(false);
    this.currentBet = 0;
    this.raiseAmount = 0;

    if (this.phase === 'preflop') {
      this.phase = 'flop';
      for (let i = 0; i < 3; i++) {
        const card = this.deck.pop();
        this.community.push(card);
        this.cardAnims.push({
          x: 200, y: -50,
          targetX: (400 - 5 * 50) / 2 + this.community.indexOf(card) * 50,
          targetY: 75,
          card: card, faceDown: false, done: false
        });
      }
    } else if (this.phase === 'flop') {
      this.phase = 'turn';
      const card = this.deck.pop();
      this.community.push(card);
      this.cardAnims.push({
        x: 200, y: -50,
        targetX: (400 - 5 * 50) / 2 + 3 * 50,
        targetY: 75,
        card: card, faceDown: false, done: false
      });
    } else if (this.phase === 'turn') {
      this.phase = 'river';
      const card = this.deck.pop();
      this.community.push(card);
      this.cardAnims.push({
        x: 200, y: -50,
        targetX: (400 - 5 * 50) / 2 + 4 * 50,
        targetY: 75,
        card: card, faceDown: false, done: false
      });
    } else if (this.phase === 'river') {
      this.doShowdown();
      return;
    }

    SFX.hit();
    this.state = 'dealing';
    this.phaseTimer = Date.now();
  },

  doShowdown() {
    this.showdownReveal = true;
    this.phase = 'showdown';

    let bestRank = -1;
    let bestPlayer = -1;

    for (let i = 0; i < this.playerCount; i++) {
      if (this.folded[i]) continue;
      const allCards = [...this.players[i].hand, ...this.community];
      const result = this.evaluateHand(allCards);
      if (this.compareHands(result, bestRank === -1 ? null : bestRank) > 0) {
        bestRank = result;
        bestPlayer = i;
      }
    }

    this.winner = bestPlayer;
    this.players[bestPlayer].money += this.pot;
    this.winHand = bestRank ? this.HAND_NAMES[bestRank.rank] : '';
    this.state = 'showdown';

    // Reveal all card anims
    for (const a of this.cardAnims) {
      a.faceDown = false;
    }

    SFX.collect();
    if (this.onScore) this.onScore(this.playerName(bestPlayer) + ' wins $' + this.pot);
  },

  // ==================== HAND EVALUATION ====================

  evaluateHand(cards) {
    const combos = this.combinations(cards, 5);
    let best = null;
    for (const combo of combos) {
      const result = this.rankHand(combo);
      if (!best || this.compareHands(result, best) > 0) {
        best = result;
      }
    }
    return best;
  },

  combinations(arr, k) {
    const results = [];
    const combo = [];
    const combine = (start) => {
      if (combo.length === k) { results.push([...combo]); return; }
      for (let i = start; i < arr.length; i++) {
        combo.push(arr[i]);
        combine(i + 1);
        combo.pop();
      }
    };
    combine(0);
    return results;
  },

  rankHand(cards) {
    const ranks = cards.map(c => this.VALUE_RANK[c.value]).sort((a, b) => b - a);
    const suits = cards.map(c => c.suit);

    const isFlush = suits.every(s => s === suits[0]);
    const isStraight = this.checkStraight(ranks);

    const counts = {};
    for (const r of ranks) counts[r] = (counts[r] || 0) + 1;
    const groups = Object.entries(counts).map(([r, c]) => ({ rank: parseInt(r), count: c }))
      .sort((a, b) => b.count - a.count || b.rank - a.rank);

    if (isFlush && isStraight && ranks[0] === 14 && ranks[4] === 10) return { rank: 9, kickers: ranks };
    if (isFlush && isStraight) return { rank: 8, kickers: ranks };
    if (groups[0].count === 4) return { rank: 7, kickers: [groups[0].rank, groups[1].rank] };
    if (groups[0].count === 3 && groups[1].count === 2) return { rank: 6, kickers: [groups[0].rank, groups[1].rank] };
    if (isFlush) return { rank: 5, kickers: ranks };
    if (isStraight) return { rank: 4, kickers: ranks };
    if (groups[0].count === 3) return { rank: 3, kickers: [groups[0].rank, ...ranks.filter(r => r !== groups[0].rank)] };
    if (groups[0].count === 2 && groups[1].count === 2) {
      const pairs = [groups[0].rank, groups[1].rank].sort((a, b) => b - a);
      return { rank: 2, kickers: [...pairs, ranks.find(r => r !== pairs[0] && r !== pairs[1])] };
    }
    if (groups[0].count === 2) return { rank: 1, kickers: [groups[0].rank, ...ranks.filter(r => r !== groups[0].rank)] };
    return { rank: 0, kickers: ranks };
  },

  checkStraight(ranks) {
    const unique = [...new Set(ranks)].sort((a, b) => b - a);
    if (unique.length < 5) return false;
    if (unique[0] - unique[4] === 4) return true;
    if (unique[0] === 14 && unique[1] === 5 && unique[2] === 4 && unique[3] === 3 && unique[4] === 2) return true;
    return false;
  },

  compareHands(a, b) {
    if (!b) return 1;
    if (!a) return -1;
    if (a.rank !== b.rank) return a.rank - b.rank;
    for (let i = 0; i < Math.min(a.kickers.length, b.kickers.length); i++) {
      if (a.kickers[i] !== b.kickers[i]) return a.kickers[i] - b.kickers[i];
    }
    return 0;
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
      this.handleMenuClick(pos);
    } else if (this.state === 'passturn') {
      // Update card visibility for this human
      for (const a of this.cardAnims) {
        if (a.owner === this.currentPlayer) a.faceDown = false;
        else if (a.owner !== undefined) a.faceDown = true;
      }
      this.state = 'betting';
      SFX.hit();
    } else if (this.state === 'betting') {
      this.handleBettingClick(pos);
    } else if (this.state === 'showdown') {
      this.dealerBtn = (this.dealerBtn + 1) % this.playerCount;
      while (this.players[this.dealerBtn].money <= 0) {
        this.dealerBtn = (this.dealerBtn + 1) % this.playerCount;
      }
      this.startHand();
    } else if (this.state === 'gameover') {
      if (pos.x >= 120 && pos.x <= 280 && pos.y >= 360 && pos.y <= 400) {
        this.state = 'menu';
      }
    }
  },

  handleMenuClick(pos) {
    // Mode toggle (vs CPU / Local)
    if (pos.x >= 140 && pos.x <= 260 && pos.y >= 100 && pos.y <= 125) {
      this.humanCount = this.humanCount === 1 ? 99 : 1; // 99 = all human
      SFX.hit();
      return;
    }

    for (let i = 0; i < 5; i++) {
      const count = i + 2;
      const x = 60 + (i % 3) * 100;
      const y = 200 + Math.floor(i / 3) * 80;
      if (pos.x >= x && pos.x <= x + 85 && pos.y >= y && pos.y <= y + 65) {
        SFX.collect();
        const humans = this.humanCount === 1 ? 1 : count;
        this.startGame(count, humans);
        return;
      }
    }
  },

  handleBettingClick(pos) {
    const p = this.currentPlayer;
    const player = this.players[p];
    const toCall = this.currentBet - this.roundBets[p];
    const btnY = 400;
    const btnH = 35;
    let btnX = 10;
    const btnW = 72;
    const gap = 5;

    if (pos.x >= btnX && pos.x <= btnX + btnW && pos.y >= btnY && pos.y <= btnY + btnH) {
      this.doAction('fold'); return;
    }
    btnX += btnW + gap;

    if (pos.x >= btnX && pos.x <= btnX + btnW && pos.y >= btnY && pos.y <= btnY + btnH) {
      if (toCall <= 0) this.doAction('check');
      else this.doAction('call');
      return;
    }
    btnX += btnW + gap;

    if (pos.x >= btnX && pos.x <= btnX + btnW && pos.y >= btnY && pos.y <= btnY + btnH) {
      this.raiseAmount = Math.min(this.currentBet + this.bigBlind * 2, player.money + this.roundBets[p]);
      if (this.raiseAmount > this.currentBet) this.doAction('raise');
      return;
    }
    btnX += btnW + gap;

    if (pos.x >= btnX && pos.x <= btnX + btnW && pos.y >= btnY && pos.y <= btnY + btnH) {
      this.raiseAmount = Math.min(this.currentBet + this.bigBlind * 5, player.money + this.roundBets[p]);
      if (this.raiseAmount > this.currentBet) this.doAction('raise');
      return;
    }
    btnX += btnW + gap;

    if (pos.x >= btnX && pos.x <= btnX + btnW - 10 && pos.y >= btnY && pos.y <= btnY + btnH) {
      this.doAction('allin');
      return;
    }
  },

  handleMove(e) {
    const pos = this.getMousePos(e);
    this.hoverBtn = -1;

    if (this.state === 'menu') {
      this.menuHover = -1;
      for (let i = 0; i < 5; i++) {
        const x = 60 + (i % 3) * 100;
        const y = 200 + Math.floor(i / 3) * 80;
        if (pos.x >= x && pos.x <= x + 85 && pos.y >= y && pos.y <= y + 65) {
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
    } else if (this.state === 'betting' || this.state === 'aithinking' || this.state === 'dealing') {
      this.drawTable();
      if (this.state === 'betting') this.drawBettingUI();
      else if (this.state === 'aithinking') this.drawAIThinking();
    } else if (this.state === 'showdown') {
      this.drawTable();
      this.drawShowdown();
    } else if (this.state === 'gameover') {
      this.drawGameOverScreen();
    }
  },

  drawMenu() {
    const ctx = this.ctx;

    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#48dbfb';
    ctx.fillText('Texas Hold\'em', 200, 55);

    ctx.font = '12px monospace';
    ctx.fillStyle = '#888';
    ctx.fillText('Poker', 200, 78);

    // Mode toggle
    const isVsCPU = this.humanCount === 1;
    ctx.fillStyle = isVsCPU ? 'rgba(72,219,251,0.25)' : 'rgba(255,255,255,0.06)';
    ctx.strokeStyle = isVsCPU ? '#48dbfb' : '#666';
    ctx.lineWidth = 1;
    this.roundRect(ctx, 140, 100, 120, 25, 5);
    ctx.fill();
    ctx.stroke();
    ctx.font = 'bold 11px monospace';
    ctx.fillStyle = isVsCPU ? '#48dbfb' : '#888';
    ctx.fillText(isVsCPU ? '\uD83E\uDD16 vs CPU' : '\uD83C\uDFAE Local', 200, 117);

    ctx.font = '11px monospace';
    ctx.fillStyle = '#666';
    ctx.fillText('Choose number of players', 200, 170);

    for (let i = 0; i < 5; i++) {
      const count = i + 2;
      const x = 60 + (i % 3) * 100;
      const y = 200 + Math.floor(i / 3) * 80;
      const hover = this.menuHover === i;

      ctx.fillStyle = hover ? 'rgba(72,219,251,0.25)' : 'rgba(255,255,255,0.06)';
      ctx.strokeStyle = hover ? '#48dbfb' : '#444';
      ctx.lineWidth = hover ? 2 : 1;
      this.roundRect(ctx, x, y, 85, 65, 8);
      ctx.fill();
      ctx.stroke();

      ctx.font = 'bold 22px monospace';
      ctx.fillStyle = hover ? '#48dbfb' : '#fff';
      ctx.fillText(count, x + 42, y + 30);

      ctx.font = '10px monospace';
      ctx.fillStyle = '#888';
      ctx.fillText(isVsCPU ? '1P + ' + (count - 1) + ' CPU' : count + ' local', x + 42, y + 50);
    }

    ctx.font = '10px monospace';
    ctx.fillStyle = '#555';
    ctx.fillText('Blinds: $5/$10 | Start: $1000 each', 200, 400);

    ctx.textAlign = 'left';
  },

  drawPassScreen() {
    const ctx = this.ctx;

    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#48dbfb';
    ctx.fillText('Pass to ' + this.playerName(this.currentPlayer), 200, 160);

    ctx.font = '14px monospace';
    ctx.fillStyle = '#888';
    ctx.fillText('$' + this.players[this.currentPlayer].money, 200, 200);

    ctx.font = '12px monospace';
    ctx.fillStyle = '#666';
    const phaseLabel = this.phase === 'preflop' ? 'Pre-Flop' : this.phase.charAt(0).toUpperCase() + this.phase.slice(1);
    ctx.fillText(phaseLabel + ' | Pot: $' + this.pot, 200, 230);

    ctx.font = 'bold 16px monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText('Click to see your cards', 200, 290);

    ctx.textAlign = 'left';
  },

  drawTable() {
    const ctx = this.ctx;

    // Phase label
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    const phaseLabel = this.phase === 'preflop' ? 'Pre-Flop' : this.phase.charAt(0).toUpperCase() + this.phase.slice(1);
    ctx.fillStyle = '#888';
    ctx.fillText(phaseLabel, 200, 18);

    // Player chips display
    ctx.font = '10px monospace';
    const chipY = 32;
    for (let i = 0; i < this.playerCount; i++) {
      const px = 10 + i * Math.floor(380 / this.playerCount);
      const isCurrent = i === this.currentPlayer;
      const isFolded = this.folded[i];
      ctx.fillStyle = isFolded ? '#555' : isCurrent ? '#48dbfb' : '#aaa';
      const label = this.playerName(i) + ':$' + this.players[i].money;
      ctx.textAlign = 'left';
      ctx.fillText(label, px, chipY);
      if (this.allIn[i] && !isFolded) {
        ctx.fillStyle = '#ff6b6b';
        ctx.fillText('[ALL IN]', px + ctx.measureText(label).width + 3, chipY);
      }
    }

    // Pot
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f1c40f';
    ctx.fillText('Pot: $' + this.pot, 200, 60);

    // Community cards (animated)
    const cardW = 45;
    const cardH = 65;
    const commX = (400 - 5 * (cardW + 5)) / 2;
    const commY = 75;

    // Draw empty slots
    for (let i = 0; i < 5; i++) {
      const x = commX + i * (cardW + 5);
      ctx.fillStyle = 'rgba(255,255,255,0.03)';
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1;
      this.roundRect(ctx, x, commY, cardW, cardH, 4);
      ctx.fill();
      ctx.stroke();
    }

    // Draw all animated cards
    for (const a of this.cardAnims) {
      if (a.owner !== undefined && !this.showdownReveal) {
        // Only render the viewing player's hole cards (skip all others)
        const cp = this.state === 'showdown' ? this.winner : (this.humanCount === 1 ? 0 : this.currentPlayer);
        if (a.owner !== cp) continue;
      }

      if (a.faceDown) {
        ctx.fillStyle = '#1a1a3a';
        ctx.strokeStyle = '#48dbfb';
        ctx.lineWidth = 1;
        const w = a.owner !== undefined ? 50 : cardW;
        const h = a.owner !== undefined ? 72 : cardH;
        this.roundRect(ctx, a.x, a.y, w, h, 4);
        ctx.fill();
        ctx.stroke();
      } else {
        const w = a.owner !== undefined ? 50 : cardW;
        const h = a.owner !== undefined ? 72 : cardH;
        this.drawPlayingCard(a.x, a.y, w, h, a.card);
      }
    }

    // Current player's hole cards label
    const cp = this.state === 'showdown' ? this.winner : (this.humanCount === 1 ? 0 : this.currentPlayer);
    if (this.players[cp].hand.length === 2) {
      ctx.font = 'bold 11px monospace';
      ctx.fillStyle = '#48dbfb';
      ctx.textAlign = 'center';
      const nameLabel = this.playerName(cp) === 'You' ? 'Your cards' : this.playerName(cp) + '\'s cards';
      ctx.fillText(nameLabel, 200, 165);
    }

    // Show last action
    if (this.lastAction && !this.showdownReveal) {
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#f1c40f';
      ctx.fillText(this.lastAction, 200, 260);
    }

    // Show all hands in showdown
    if (this.showdownReveal) {
      ctx.font = '9px monospace';
      let sy = 260;
      for (let i = 0; i < this.playerCount; i++) {
        if (this.folded[i]) continue;
        const h = this.players[i].hand;
        if (h.length < 2) continue;
        ctx.fillStyle = i === this.winner ? '#48dbfb' : '#888';
        ctx.textAlign = 'left';
        ctx.fillText(this.playerName(i) + ':', 10, sy + 12);
        this.drawPlayingCard(60, sy, 30, 42, h[0]);
        this.drawPlayingCard(93, sy, 30, 42, h[1]);

        const result = this.evaluateHand([...h, ...this.community]);
        ctx.fillStyle = i === this.winner ? '#f1c40f' : '#888';
        ctx.fillText(result ? this.HAND_NAMES[result.rank] : '', 130, sy + 25);
        sy += 48;
      }
    }

    ctx.textAlign = 'left';
  },

  drawAIThinking() {
    const ctx = this.ctx;
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#888';
    ctx.fillText(this.playerName(this.currentPlayer) + ' is thinking...', 200, 395);
    ctx.textAlign = 'left';
  },

  drawBettingUI() {
    const ctx = this.ctx;
    const p = this.currentPlayer;
    const player = this.players[p];
    const toCall = this.currentBet - this.roundBets[p];

    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#48dbfb';
    ctx.fillText(this.playerName(p) + ' - $' + player.money + ' | To call: $' + Math.max(0, toCall), 200, 385);

    const btnY = 400;
    const btnH = 35;
    const btnW = 72;
    const gap = 5;
    let btnX = 10;

    this.drawBtn(btnX, btnY, btnW, btnH, 'Fold', '#ff6b6b');
    btnX += btnW + gap;

    const callLabel = toCall <= 0 ? 'Check' : 'Call $' + toCall;
    this.drawBtn(btnX, btnY, btnW, btnH, callLabel, '#2ecc71');
    btnX += btnW + gap;

    this.drawBtn(btnX, btnY, btnW, btnH, 'Raise', '#f1c40f');
    btnX += btnW + gap;

    this.drawBtn(btnX, btnY, btnW, btnH, 'Raise+', '#e67e22');
    btnX += btnW + gap;

    this.drawBtn(btnX, btnY, btnW - 10, btnH, 'All In', '#9b59b6');

    ctx.textAlign = 'left';
  },

  drawShowdown() {
    const ctx = this.ctx;

    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    this.roundRect(ctx, 20, 350, 360, 70, 8);
    ctx.fill();

    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#48dbfb';
    ctx.fillText(this.playerName(this.winner) + ' wins $' + this.pot + '!', 200, 375);

    ctx.font = '12px monospace';
    ctx.fillStyle = '#f1c40f';
    ctx.fillText(this.winHand, 200, 395);

    ctx.font = '10px monospace';
    ctx.fillStyle = '#888';
    ctx.fillText('Click to continue', 200, 415);

    ctx.textAlign = 'left';
  },

  drawGameOverScreen() {
    const ctx = this.ctx;

    ctx.font = 'bold 28px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#48dbfb';
    ctx.fillText(this.playerName(this.winner) + ' Wins!', 200, 180);

    ctx.font = '14px monospace';
    ctx.fillStyle = '#888';
    ctx.fillText('Everyone else is broke.', 200, 220);

    const sorted = this.players.map((p, i) => ({ i, money: p.money }))
      .sort((a, b) => b.money - a.money);

    ctx.font = '12px monospace';
    let sy = 250;
    for (const s of sorted) {
      ctx.fillStyle = s.i === this.winner ? '#48dbfb' : '#888';
      ctx.fillText(this.playerName(s.i) + ': $' + s.money, 200, sy);
      sy += 20;
    }

    ctx.fillStyle = 'rgba(72,219,251,0.3)';
    ctx.strokeStyle = '#48dbfb';
    ctx.lineWidth = 1.5;
    this.roundRect(ctx, 120, 360, 160, 40, 8);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 14px monospace';
    ctx.fillStyle = '#48dbfb';
    ctx.fillText('Play Again', 200, 386);

    ctx.textAlign = 'left';
  },

  drawPlayingCard(x, y, w, h, card) {
    const ctx = this.ctx;
    const color = this.SUIT_COLORS[card.suit];

    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#999';
    ctx.lineWidth = 1;
    this.roundRect(ctx, x, y, w, h, 4);
    ctx.fill();
    ctx.stroke();

    const textColor = color === '#fff' ? '#333' : color;
    const fontSize = w < 40 ? 10 : 14;
    const suitSize = w < 40 ? 10 : 18;

    ctx.font = 'bold ' + fontSize + 'px monospace';
    ctx.textAlign = 'left';
    ctx.fillStyle = textColor;
    ctx.fillText(card.value, x + 2, y + fontSize + 1);

    ctx.font = suitSize + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(card.suit, x + w / 2, y + h / 2 + suitSize / 3);

    ctx.textAlign = 'left';
  },

  drawBtn(x, y, w, h, text, color) {
    const ctx = this.ctx;
    ctx.fillStyle = color + '33';
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    this.roundRect(ctx, x, y, w, h, 6);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = color;
    ctx.fillText(text, x + w / 2, y + h / 2 + 4);
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
