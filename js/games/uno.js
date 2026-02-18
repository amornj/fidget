const UnoGame = {
  name: 'UNO',
  instructions: 'Click cards to play. Match color or number. First to empty hand wins!',

  canvas: null,
  ctx: null,
  animFrame: null,
  state: 'menu',
  onScore: null,

  // Constants
  CARD_W: 50,
  CARD_H: 72,
  COLORS: ['red', 'blue', 'green', 'yellow'],
  COLOR_HEX: { red: '#e74c3c', blue: '#3498db', green: '#2ecc71', yellow: '#f1c40f', wild: '#9b59b6' },
  COLOR_DARK: { red: '#c0392b', blue: '#2980b9', green: '#27ae60', yellow: '#d4ac0f', wild: '#8e44ad' },

  // Card type enums
  CARD_TYPES: {
    NUMBER: 'number', SKIP: 'skip', REVERSE: 'reverse', DRAW2: 'draw2',
    WILD: 'wild', WILD4: 'wild4', DRAW10: 'draw10', SWAP: 'swap',
    BOMB: 'bomb', DEFUSE: 'defuse', NOPE: 'nope', SEE_FUTURE: 'seefuture', ATTACK: 'attack'
  },

  // Variant definitions
  variants: [
    {
      id: 'standard', name: 'UNO', icon: '🃏', desc: 'Classic rules',
      color: '#e74c3c',
      extraWilds: 0, extraWild4s: 0, draw10s: 0, swapCards: 0,
      maxHandSize: 999, cardsPerTurn: 1, stackDraws: false,
      hasBombs: false, bombCount: 0, defuseCount: 0, defusePerPlayer: 0,
      matchRule: 'color-or-value', skipAmount: 1, chaosMode: false
    },
    {
      id: 'wild', name: 'UNO Wild!', icon: '🌈', desc: '2x wildcards',
      color: '#9b59b6',
      extraWilds: 4, extraWild4s: 4, draw10s: 0, swapCards: 0,
      maxHandSize: 999, cardsPerTurn: 1, stackDraws: false,
      hasBombs: false, bombCount: 0, defuseCount: 0, defusePerPlayer: 0,
      matchRule: 'color-or-value', skipAmount: 1, chaosMode: false
    },
    {
      id: 'roulette', name: 'UNO Roulette', icon: '💣', desc: 'Bombs & defuses',
      color: '#e67e22',
      extraWilds: 0, extraWild4s: 0, draw10s: 0, swapCards: 0,
      maxHandSize: 999, cardsPerTurn: 1, stackDraws: false,
      hasBombs: true, bombCount: 4, defuseCount: 6, defusePerPlayer: 1,
      matchRule: 'color-or-value', skipAmount: 1, chaosMode: false
    },
    {
      id: 'dos', name: 'DOS', icon: '2️⃣', desc: 'Play pairs that add up',
      color: '#3498db',
      extraWilds: 0, extraWild4s: 0, draw10s: 0, swapCards: 0,
      maxHandSize: 999, cardsPerTurn: 2, stackDraws: false,
      hasBombs: false, bombCount: 0, defuseCount: 0, defusePerPlayer: 0,
      matchRule: 'value-add', skipAmount: 1, chaosMode: false
    },
    {
      id: 'tres', name: 'TRES', icon: '3️⃣', desc: 'Play up to 3 cards',
      color: '#2ecc71',
      extraWilds: 0, extraWild4s: 0, draw10s: 0, swapCards: 0,
      maxHandSize: 999, cardsPerTurn: 3, stackDraws: false,
      hasBombs: false, bombCount: 0, defuseCount: 0, defusePerPlayer: 0,
      matchRule: 'color-or-value', skipAmount: 1, chaosMode: false
    },
    {
      id: 'quadro', name: 'QUADRO', icon: '4️⃣', desc: 'Play up to 4 cards',
      color: '#1abc9c',
      extraWilds: 2, extraWild4s: 2, draw10s: 0, swapCards: 0,
      maxHandSize: 999, cardsPerTurn: 4, stackDraws: false,
      hasBombs: false, bombCount: 0, defuseCount: 0, defusePerPlayer: 0,
      matchRule: 'color-or-value', skipAmount: 1, chaosMode: true
    },
    {
      id: 'nomercy', name: 'No Mercy', icon: '😈', desc: 'Draw-10, lose at 25 cards',
      color: '#e74c3c',
      extraWilds: 0, extraWild4s: 0, draw10s: 4, swapCards: 0,
      maxHandSize: 25, cardsPerTurn: 1, stackDraws: true,
      hasBombs: false, bombCount: 0, defuseCount: 0, defusePerPlayer: 0,
      matchRule: 'color-or-value', skipAmount: 1, chaosMode: false
    },
    {
      id: 'hell', name: 'UNO Hell', icon: '🔥', desc: 'Max chaos, swap hands',
      color: '#c0392b',
      extraWilds: 4, extraWild4s: 4, draw10s: 8, swapCards: 4,
      maxHandSize: 25, cardsPerTurn: 1, stackDraws: true,
      hasBombs: false, bombCount: 0, defuseCount: 0, defusePerPlayer: 0,
      matchRule: 'color-or-value', skipAmount: 2, chaosMode: true
    },
    {
      id: 'exploding', name: 'Exploding UNO', icon: '💥', desc: 'Exploding Kittens hybrid',
      color: '#d35400',
      extraWilds: 0, extraWild4s: 0, draw10s: 0, swapCards: 0,
      maxHandSize: 999, cardsPerTurn: 1, stackDraws: false,
      hasBombs: true, bombCount: 3, defuseCount: 6, defusePerPlayer: 1,
      matchRule: 'color-or-value', skipAmount: 1, chaosMode: false,
      hasNope: true, hasSeeFuture: true, hasAttack: true,
      nopeCount: 5, seeFutureCount: 5, attackCount: 4
    }
  ],

  // Player count options
  PLAYER_MODES: [
    { label: '1 v 1', count: 2, icon: '👤', desc: 'Head to head' },
    { label: '2 v 2', count: 4, icon: '👥', desc: '4 player free-for-all' },
    { label: '3 v 3', count: 6, icon: '👪', desc: '6 player chaos' }
  ],

  // Game state
  variant: null,
  playerCount: 4,
  localPlay: false,
  selectedVariantIndex: -1,
  playerSelectHover: -1,
  deck: [],
  discard: [],
  hands: [],
  currentPlayer: 0,
  direction: 1, // 1=clockwise, -1=counter
  currentColor: null,
  currentValue: null,
  mustDraw: 0, // stacked draw amount
  selectedCards: [], // indices of selected cards in player hand
  hoverCard: -1,
  calledUno: [],
  showUnoButton: false,
  unoTimer: 0,
  eliminated: [],
  bombPlaceIndex: 0,
  turnActive: false,
  aiTimeout: null,
  message: '',
  messageTimer: 0,
  menuHover: -1,
  colorPickCallback: null,
  animations: [],
  drawPileCount: 0,
  seeFutureCards: null,
  seeFutureTimer: 0,
  nopeWindow: false,
  nopeTimer: 0,
  lastPlayedCard: null,
  attackExtra: 0,

  // Bound handlers
  _onClick: null,
  _onMove: null,

  init(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.state = 'menu';
    this.menuHover = -1;
    this.animations = [];

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
    if (this.messageTimer > 0) this.messageTimer--;
    if (this.seeFutureTimer > 0) {
      this.seeFutureTimer--;
      if (this.seeFutureTimer <= 0) this.seeFutureCards = null;
    }

    // Update animations
    for (let i = this.animations.length - 1; i >= 0; i--) {
      const a = this.animations[i];
      a.t += 0.05;
      if (a.t >= 1) this.animations.splice(i, 1);
    }

    // UNO callout timer
    if (this.showUnoButton) {
      this.unoTimer--;
      if (this.unoTimer <= 0) {
        this.showUnoButton = false;
        // Penalty: player didn't call UNO
        const unoP = this.currentPlayer;
        if (this.hands[unoP].length === 1 && !this.calledUno[unoP]) {
          this.drawCards(unoP, 2);
          this.setMessage('Forgot UNO! +2 cards');
        }
      }
    }
  },

  // ==================== DECK BUILDING ====================

  buildDeck() {
    const v = this.variant;
    const deck = [];
    const T = this.CARD_TYPES;

    // Standard cards: each color gets one 0, two of 1-9, two Skip, two Reverse, two Draw2
    for (const color of this.COLORS) {
      deck.push({ type: T.NUMBER, color, value: 0 });
      for (let n = 1; n <= 9; n++) {
        deck.push({ type: T.NUMBER, color, value: n });
        deck.push({ type: T.NUMBER, color, value: n });
      }
      deck.push({ type: T.SKIP, color, value: 'S' });
      deck.push({ type: T.SKIP, color, value: 'S' });
      deck.push({ type: T.REVERSE, color, value: 'R' });
      deck.push({ type: T.REVERSE, color, value: 'R' });
      deck.push({ type: T.DRAW2, color, value: '+2' });
      deck.push({ type: T.DRAW2, color, value: '+2' });
    }

    // Wildcards: 4 Wild + 4 Wild Draw 4
    for (let i = 0; i < 4 + v.extraWilds; i++) deck.push({ type: T.WILD, color: 'wild', value: 'W' });
    for (let i = 0; i < 4 + v.extraWild4s; i++) deck.push({ type: T.WILD4, color: 'wild', value: '+4' });

    // Draw-10 wilds
    for (let i = 0; i < v.draw10s; i++) deck.push({ type: T.DRAW10, color: 'wild', value: '+10' });

    // Swap Hand wilds
    for (let i = 0; i < v.swapCards; i++) deck.push({ type: T.SWAP, color: 'wild', value: 'SW' });

    // Exploding UNO special cards
    if (v.id === 'exploding') {
      for (let i = 0; i < (v.nopeCount || 5); i++) deck.push({ type: T.NOPE, color: 'wild', value: 'NO' });
      for (let i = 0; i < (v.seeFutureCount || 5); i++) deck.push({ type: T.SEE_FUTURE, color: 'wild', value: '👁' });
      for (let i = 0; i < (v.attackCount || 4); i++) deck.push({ type: T.ATTACK, color: 'wild', value: 'ATK' });
    }

    this.shuffle(deck);

    // For bomb variants, insert bombs AFTER dealing (so no one starts with one)
    // Defuses go into the deck / dealt to players
    if (v.hasBombs) {
      // Remove bombs from deck temporarily (shouldn't be any yet, but safe)
      // Add defuse cards to deal
      for (let i = 0; i < v.defuseCount; i++) {
        deck.push({ type: T.DEFUSE, color: 'wild', value: 'DF' });
      }
      this.shuffle(deck);
    }

    return deck;
  },

  shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  },

  // ==================== GAME LIFECYCLE ====================

  startGame(variantIndex) {
    this.variant = this.variants[variantIndex];
    const n = this.playerCount;
    this.state = 'playing';
    this.direction = 1;
    this.currentPlayer = 0;
    this.mustDraw = 0;
    this.selectedCards = [];
    this.hoverCard = -1;
    this.calledUno = new Array(n).fill(false);
    this.showUnoButton = false;
    this.eliminated = new Array(n).fill(false);
    this.turnActive = false;
    this.message = '';
    this.messageTimer = 0;
    this.animations = [];
    this.lastPlayedCard = null;
    this.attackExtra = 0;
    this.seeFutureCards = null;
    this.seeFutureTimer = 0;

    // Build deck (add extra deck for 6 players)
    this.deck = this.buildDeck();
    if (n >= 6) {
      // Merge a second standard deck for enough cards
      this.deck = this.deck.concat(this.buildDeck());
      this.shuffle(this.deck);
    }
    this.discard = [];
    this.hands = [];
    for (let p = 0; p < n; p++) this.hands.push([]);

    const dealCount = 7;
    for (let i = 0; i < dealCount; i++) {
      for (let p = 0; p < n; p++) {
        this.hands[p].push(this.deck.pop());
      }
    }

    // For bomb variants, give each player a defuse card if configured
    if (this.variant.hasBombs && this.variant.defusePerPlayer > 0) {
      for (let p = 0; p < n; p++) {
        for (let d = 0; d < this.variant.defusePerPlayer; d++) {
          const idx = this.deck.findIndex(c => c.type === this.CARD_TYPES.DEFUSE);
          if (idx !== -1) {
            this.hands[p].push(this.deck.splice(idx, 1)[0]);
          }
        }
      }
    }

    // Insert bombs into deck after dealing (scale with player count)
    if (this.variant.hasBombs) {
      const bombCount = this.variant.bombCount + (n > 4 ? 2 : 0);
      for (let i = 0; i < bombCount; i++) {
        this.deck.push({ type: this.CARD_TYPES.BOMB, color: 'wild', value: '💣' });
      }
      this.shuffle(this.deck);
    }

    // Flip first card (skip wilds/action cards for first discard)
    let firstCard = this.deck.pop();
    let attempts = 0;
    while ((firstCard.color === 'wild' || firstCard.type !== this.CARD_TYPES.NUMBER) && attempts < 20) {
      this.deck.unshift(firstCard);
      firstCard = this.deck.pop();
      attempts++;
    }
    this.discard.push(firstCard);
    this.currentColor = firstCard.color;
    this.currentValue = firstCard.value;
    this.drawPileCount = this.deck.length;

    if (this.onScore) this.onScore('Cards: ' + this.hands[0].length);

    this.turnActive = true;
    this._skipPassScreen = true;
    this.startTurn();
  },

  startTurn() {
    const n = this.playerCount;
    // Skip eliminated players
    while (this.eliminated[this.currentPlayer]) {
      this.currentPlayer = (this.currentPlayer + this.direction + n) % n;
    }

    // Check if only one player remains (roulette/exploding)
    const alive = this.eliminated.filter(e => !e).length;
    if (alive <= 1) {
      this.endGame(!this.eliminated[0]);
      return;
    }

    this.turnActive = true;
    this.selectedCards = [];

    const cp = this.currentPlayer;
    const isHuman = cp === 0 || this.localPlay;

    if (isHuman) {
      // Show pass screen between local players
      if (this.localPlay && !this._skipPassScreen) {
        this.state = 'passturn';
        return;
      }
      this._skipPassScreen = false;
      // Human turn - check if must draw from stacking
      if (this.mustDraw > 0 && this.variant.stackDraws) {
        const canStack = this.hands[cp].some(c =>
          c.type === this.CARD_TYPES.DRAW2 || c.type === this.CARD_TYPES.WILD4 || c.type === this.CARD_TYPES.DRAW10
        );
        if (!canStack) {
          this.drawCards(cp, this.mustDraw);
          this.setMessage('Drew ' + this.mustDraw + ' cards!');
          this.mustDraw = 0;
          this.endTurn();
        }
      }
    } else {
      // AI turn
      this.aiTimeout = setTimeout(() => this.aiPlay(this.currentPlayer), 800 + Math.random() * 700);
    }
  },

  endTurn() {
    this.turnActive = false;
    const n = this.playerCount;

    // Check win condition
    const cp = this.currentPlayer;
    if (this.hands[cp].length === 0) {
      this.endGame(cp === 0);
      return;
    }

    // Check max hand size bust (No Mercy / Hell)
    if (this.variant.maxHandSize < 999) {
      for (let p = 0; p < n; p++) {
        if (!this.eliminated[p] && this.hands[p].length >= this.variant.maxHandSize) {
          this.eliminated[p] = true;
          this.setMessage(this.playerName(p) + ' busted! (' + this.hands[p].length + ' cards)');
          if (p === 0) {
            this.endGame(false);
            return;
          }
        }
      }
    }

    // UNO callout check
    const isHumanTurn = cp === 0 || this.localPlay;
    if (isHumanTurn && this.hands[cp].length === 1) {
      this.showUnoButton = true;
      this.unoTimer = 120; // 2 seconds at 60fps
    }

    // AI UNO callout
    if (!isHumanTurn && this.hands[cp].length === 1) {
      if (Math.random() < 0.85) {
        this.calledUno[cp] = true;
        this.setMessage(this.playerName(cp) + ' calls UNO!');
      }
    }

    // Handle attack extra turns
    if (this.attackExtra > 0) {
      this.attackExtra--;
      this.startTurn();
      return;
    }

    // Advance to next player
    this.currentPlayer = (this.currentPlayer + this.direction + n) % n;
    if (this.onScore) this.onScore('Cards: ' + this.hands[0].length);

    this.startTurn();
  },

  endGame(playerWon) {
    this.state = 'gameover';
    this.turnActive = false;
    if (this.aiTimeout) clearTimeout(this.aiTimeout);
    if (this.localPlay) {
      const winner = this.hands.findIndex(h => h.length === 0);
      this.message = winner >= 0 ? this.playerName(winner) + ' Wins!' : 'Game Over!';
      SFX.collect();
      if (this.onScore) this.onScore(this.message);
    } else {
      this.message = playerWon ? 'You Win!' : 'You Lose!';
      if (playerWon) {
        SFX.collect();
        if (this.onScore) this.onScore('WIN!');
      } else {
        SFX.hit();
        if (this.onScore) this.onScore('LOSE');
      }
    }
  },

  playerName(p) {
    if (this.localPlay) return 'P' + (p + 1);
    return p === 0 ? 'You' : 'CPU ' + p;
  },

  setMessage(msg) {
    this.message = msg;
    this.messageTimer = 120;
  },

  // ==================== CARD DRAWING ====================

  drawCards(player, count) {
    for (let i = 0; i < count; i++) {
      if (this.deck.length === 0) this.reshuffleDeck();
      if (this.deck.length === 0) break;

      const card = this.deck.pop();

      // Bomb drawn!
      if (card.type === this.CARD_TYPES.BOMB) {
        const defuseIdx = this.hands[player].findIndex(c => c.type === this.CARD_TYPES.DEFUSE);
        if (defuseIdx !== -1) {
          // Defuse it
          this.hands[player].splice(defuseIdx, 1);
          this.setMessage(this.playerName(player) + ' defused a bomb!');
          SFX.hit();
          if (player === 0) {
            // Player chooses where to put bomb back
            this.bombCard = card;
            this.state = 'bombplace';
            this.bombPlaceIndex = Math.floor(this.deck.length / 2);
            return;
          } else {
            // AI puts bomb at random position
            const pos = Math.floor(Math.random() * this.deck.length);
            this.deck.splice(pos, 0, card);
          }
        } else {
          // Eliminated!
          this.eliminated[player] = true;
          this.setMessage(this.playerName(player) + ' exploded! 💥');
          SFX.hit();
          if (player === 0) {
            this.endGame(false);
            return;
          }
        }
        continue;
      }

      this.hands[player].push(card);
    }
    this.drawPileCount = this.deck.length;
    this.calledUno[player] = false;
  },

  reshuffleDeck() {
    if (this.discard.length <= 1) return;
    const top = this.discard.pop();
    this.deck = this.shuffle([...this.discard]);
    this.discard = [top];
    // Re-strip color from wilds in deck
    for (const c of this.deck) {
      if (c.type === this.CARD_TYPES.WILD || c.type === this.CARD_TYPES.WILD4 ||
          c.type === this.CARD_TYPES.DRAW10 || c.type === this.CARD_TYPES.SWAP) {
        c.color = 'wild';
      }
    }
    this.drawPileCount = this.deck.length;
    this.setMessage('Deck reshuffled!');
  },

  // ==================== PLAY VALIDATION ====================

  canPlayCard(card) {
    const T = this.CARD_TYPES;

    // Wilds can always be played
    if (card.type === T.WILD || card.type === T.WILD4 || card.type === T.DRAW10 ||
        card.type === T.SWAP || card.type === T.NOPE || card.type === T.SEE_FUTURE ||
        card.type === T.ATTACK) {
      return true;
    }

    // Defuse/Bomb can't be played normally
    if (card.type === T.DEFUSE || card.type === T.BOMB) return false;

    // Match color or value
    if (card.color === this.currentColor) return true;
    if (card.type === T.NUMBER && card.value === this.currentValue) return true;
    if (card.type === T.SKIP && this.currentValue === 'S') return true;
    if (card.type === T.REVERSE && this.currentValue === 'R') return true;
    if (card.type === T.DRAW2 && this.currentValue === '+2') return true;

    return false;
  },

  canPlayCombo(cards) {
    if (cards.length === 0) return false;
    if (cards.length === 1) return this.canPlayCard(cards[0]);

    const v = this.variant;
    if (cards.length > v.cardsPerTurn) return false;

    const T = this.CARD_TYPES;
    const topValue = this.currentValue;

    // DOS mode: two number cards that add up to the discard value
    if (v.matchRule === 'value-add') {
      const numCards = cards.filter(c => c.type === T.NUMBER);
      if (numCards.length === cards.length && numCards.length === 2) {
        const sum = numCards[0].value + numCards[1].value;
        if (typeof topValue === 'number' && sum === topValue) return true;
      }
      // Single card still works normally
      if (cards.length === 1) return this.canPlayCard(cards[0]);
      return false;
    }

    // TRES/QUADRO: multiple same-value or same-color cards
    // At least one card must be playable, rest must match each other
    const allSameValue = cards.every(c => c.value === cards[0].value && c.type === T.NUMBER);
    const allSameColor = cards.every(c => c.color === cards[0].color && c.color !== 'wild');

    if (allSameValue || allSameColor) {
      return cards.some(c => this.canPlayCard(c));
    }

    return false;
  },

  getPlayableIndices(player) {
    const p = player != null ? player : 0;
    const playable = [];
    for (let i = 0; i < this.hands[p].length; i++) {
      if (this.canPlayCard(this.hands[p][i])) playable.push(i);
    }
    return playable;
  },

  // ==================== PLAY CARD ====================

  playCards(player, cardIndices) {
    const cards = cardIndices.map(i => this.hands[player][i]);
    const T = this.CARD_TYPES;

    // Remove cards from hand (in reverse order to preserve indices)
    const sorted = [...cardIndices].sort((a, b) => b - a);
    for (const idx of sorted) {
      this.hands[player].splice(idx, 1);
    }

    // Play each card to discard
    for (const card of cards) {
      this.discard.push(card);
      this.lastPlayedCard = card;

      // Add play animation
      this.animations.push({
        type: 'play',
        card: card,
        fromPlayer: player,
        t: 0
      });
    }

    SFX.hit();

    // Apply effects from the last card played (or primary card)
    const primary = cards[cards.length - 1];
    this.applyCardEffect(player, primary, cards.length);
  },

  applyCardEffect(player, card, comboSize) {
    const T = this.CARD_TYPES;
    const v = this.variant;
    const n = this.playerCount;

    switch (card.type) {
      case T.NUMBER:
        this.currentColor = card.color;
        this.currentValue = card.value;
        this.endTurn();
        break;

      case T.SKIP:
        this.currentColor = card.color;
        this.currentValue = 'S';
        for (let i = 0; i < v.skipAmount; i++) {
          this.currentPlayer = (this.currentPlayer + this.direction + n) % n;
        }
        this.setMessage('Skip!');
        this.endTurn();
        break;

      case T.REVERSE:
        this.currentColor = card.color;
        this.currentValue = 'R';
        this.direction *= -1;
        // In 1v1, reverse acts as skip
        if (n === 2) {
          this.currentPlayer = (this.currentPlayer + this.direction + n) % n;
        }
        this.setMessage('Reverse!');
        this.endTurn();
        break;

      case T.DRAW2:
        this.currentColor = card.color;
        this.currentValue = '+2';
        if (v.stackDraws) {
          this.mustDraw += 2;
        } else {
          const next = (this.currentPlayer + this.direction + n) % n;
          this.drawCards(next, 2);
          this.currentPlayer = (this.currentPlayer + this.direction + n) % n;
          this.setMessage(this.playerName(next) + (next === 0 ? ' draw' : ' draws') + ' 2!');
        }
        this.endTurn();
        break;

      case T.WILD:
        this.currentValue = 'W';
        this.pickColor(player, () => this.endTurn());
        break;

      case T.WILD4:
        this.currentValue = '+4';
        this.pickColor(player, () => {
          if (v.stackDraws) {
            this.mustDraw += 4;
          } else {
            const next = (this.currentPlayer + this.direction + n) % n;
            this.drawCards(next, 4);
            this.currentPlayer = (this.currentPlayer + this.direction + n) % n;
            this.setMessage(this.playerName(next) + (next === 0 ? ' draw' : ' draws') + ' 4!');
          }
          this.endTurn();
        });
        break;

      case T.DRAW10:
        this.currentValue = '+10';
        this.pickColor(player, () => {
          if (v.stackDraws) {
            this.mustDraw += 10;
          } else {
            const next = (this.currentPlayer + this.direction + n) % n;
            this.drawCards(next, 10);
            this.currentPlayer = (this.currentPlayer + this.direction + n) % n;
            this.setMessage(this.playerName(next) + (next === 0 ? ' draw' : ' draws') + ' 10!');
          }
          this.endTurn();
        });
        break;

      case T.SWAP:
        this.currentValue = 'SW';
        if (player === 0) {
          let target = 1;
          for (let i = 1; i < n; i++) {
            if (!this.eliminated[i] && this.hands[i].length > this.hands[target].length) target = i;
          }
          this.pickColor(player, () => {
            const temp = this.hands[0];
            this.hands[0] = this.hands[target];
            this.hands[target] = temp;
            this.setMessage('Swapped hands with ' + this.playerName(target) + '!');
            this.endTurn();
          });
        } else {
          let target = 0;
          for (let i = 0; i < n; i++) {
            if (i !== player && !this.eliminated[i] && this.hands[i].length < this.hands[target].length) target = i;
          }
          this.currentColor = this.COLORS[Math.floor(Math.random() * 4)];
          const temp = this.hands[player];
          this.hands[player] = this.hands[target];
          this.hands[target] = temp;
          this.setMessage(this.playerName(player) + ' swapped with ' + (target === 0 ? 'you' : this.playerName(target)) + '!');
          this.endTurn();
        }
        break;

      case T.NOPE:
        this.currentColor = card.color === 'wild' ? this.currentColor : card.color;
        this.setMessage('Nope!');
        this.endTurn();
        break;

      case T.SEE_FUTURE:
        this.seeFutureCards = this.deck.slice(-3).reverse();
        this.seeFutureTimer = 120;
        this.setMessage(this.playerName(player) + (player === 0 ? ' peek' : ' peeks') + ' at the deck...');
        this.endTurn();
        break;

      case T.ATTACK:
        this.currentColor = card.color === 'wild' ? this.currentColor : card.color;
        this.currentValue = 'ATK';
        this.attackExtra = 1;
        this.setMessage('Attack! Next player takes 2 turns!');
        this.endTurn();
        break;

      default:
        this.endTurn();
    }
  },

  pickColor(player, callback) {
    if (player === 0) {
      this.state = 'colorpick';
      this.colorPickCallback = callback;
    } else {
      // AI picks most common color in hand
      const counts = { red: 0, blue: 0, green: 0, yellow: 0 };
      for (const c of this.hands[player]) {
        if (c.color !== 'wild') counts[c.color]++;
      }
      let best = 'red', bestCount = 0;
      for (const [color, count] of Object.entries(counts)) {
        if (count > bestCount) { best = color; bestCount = count; }
      }
      this.currentColor = best;
      callback();
    }
  },

  // ==================== AI LOGIC ====================

  aiPlay(player) {
    if (this.state !== 'playing' || this.eliminated[player]) {
      this.endTurn();
      return;
    }

    const hand = this.hands[player];
    const T = this.CARD_TYPES;
    const v = this.variant;

    // Handle stacked draws
    if (this.mustDraw > 0 && v.stackDraws) {
      const stackIdx = hand.findIndex(c =>
        c.type === T.DRAW2 || c.type === T.WILD4 || c.type === T.DRAW10
      );
      if (stackIdx !== -1) {
        this.playCards(player, [stackIdx]);
        return;
      } else {
        this.drawCards(player, this.mustDraw);
        this.setMessage(this.playerName(player) + ' draws ' + this.mustDraw + '!');
        this.mustDraw = 0;
        this.endTurn();
        return;
      }
    }

    // Multi-card modes
    if (v.cardsPerTurn > 1) {
      const combo = this.aiFindCombo(player);
      if (combo && combo.length > 0) {
        this.playCards(player, combo);
        return;
      }
    }

    // Single card play - priority: action > color match > value match > wild > wild4
    let bestIdx = -1;
    let bestPriority = -1;

    for (let i = 0; i < hand.length; i++) {
      const c = hand[i];
      if (!this.canPlayCard(c)) continue;

      let priority = 0;
      if (c.type === T.SKIP || c.type === T.REVERSE || c.type === T.DRAW2) priority = 5;
      else if (c.type === T.NUMBER && c.color === this.currentColor) priority = 4;
      else if (c.type === T.NUMBER) priority = 3;
      else if (c.type === T.DRAW10) priority = 2.5;
      else if (c.type === T.WILD) priority = 2;
      else if (c.type === T.WILD4) priority = 1;
      else if (c.type === T.SWAP) priority = 0.5;
      else if (c.type === T.SEE_FUTURE) priority = 6;
      else if (c.type === T.ATTACK) priority = 4.5;
      else if (c.type === T.NOPE) priority = 0.2;

      if (priority > bestPriority) {
        bestPriority = priority;
        bestIdx = i;
      }
    }

    if (bestIdx !== -1) {
      this.playCards(player, [bestIdx]);
    } else {
      // Must draw
      this.drawCards(player, 1);
      // Check if drawn card can be played
      const drawnCard = this.hands[player][this.hands[player].length - 1];
      if (drawnCard && this.canPlayCard(drawnCard)) {
        this.aiTimeout = setTimeout(() => {
          if (this.state === 'playing') {
            this.playCards(player, [this.hands[player].length - 1]);
          }
        }, 500);
        return;
      }
      this.setMessage(this.playerName(player) + ' draws');
      this.endTurn();
    }
  },

  aiFindCombo(player) {
    const hand = this.hands[player];
    const v = this.variant;
    const T = this.CARD_TYPES;

    // DOS: find two numbers that add to current value
    if (v.matchRule === 'value-add' && typeof this.currentValue === 'number') {
      for (let i = 0; i < hand.length; i++) {
        for (let j = i + 1; j < hand.length; j++) {
          if (hand[i].type === T.NUMBER && hand[j].type === T.NUMBER) {
            if (hand[i].value + hand[j].value === this.currentValue) {
              return [i, j];
            }
          }
        }
      }
    }

    // TRES/QUADRO: find same-value or same-color sets
    if (v.cardsPerTurn >= 3) {
      // Try to play maximum cards
      for (let size = v.cardsPerTurn; size >= 2; size--) {
        // Same value groups
        const byValue = {};
        for (let i = 0; i < hand.length; i++) {
          if (hand[i].type === T.NUMBER) {
            const key = hand[i].value;
            if (!byValue[key]) byValue[key] = [];
            byValue[key].push(i);
          }
        }
        for (const indices of Object.values(byValue)) {
          if (indices.length >= size) {
            const combo = indices.slice(0, size);
            const cards = combo.map(i => hand[i]);
            if (this.canPlayCombo(cards)) return combo;
          }
        }

        // Same color groups
        const byColor = {};
        for (let i = 0; i < hand.length; i++) {
          if (hand[i].color !== 'wild') {
            if (!byColor[hand[i].color]) byColor[hand[i].color] = [];
            byColor[hand[i].color].push(i);
          }
        }
        for (const indices of Object.values(byColor)) {
          if (indices.length >= size) {
            const combo = indices.slice(0, size);
            const cards = combo.map(i => hand[i]);
            if (this.canPlayCombo(cards)) return combo;
          }
        }
      }
    }

    // Fallback: single playable card
    for (let i = 0; i < hand.length; i++) {
      if (this.canPlayCard(hand[i])) return [i];
    }

    return null;
  },

  // ==================== INPUT HANDLING ====================

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
    } else if (this.state === 'playerselect') {
      this.handlePlayerSelectClick(pos);
    } else if (this.state === 'passturn') {
      this.handlePassTurnClick(pos);
    } else if (this.state === 'playing') {
      this.handleGameClick(pos);
    } else if (this.state === 'colorpick') {
      this.handleColorPickClick(pos);
    } else if (this.state === 'bombplace') {
      this.handleBombPlaceClick(pos);
    } else if (this.state === 'gameover') {
      this.handleGameOverClick(pos);
    }
  },

  handleMove(e) {
    const pos = this.getMousePos(e);

    if (this.state === 'menu') {
      this.handleMenuMove(pos);
    } else if (this.state === 'playerselect') {
      this.handlePlayerSelectMove(pos);
    } else if (this.state === 'playing') {
      this.handleGameMove(pos);
    }
  },

  handleMenuClick(pos) {
    for (let i = 0; i < this.variants.length; i++) {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const x = 20 + col * 127;
      const y = 60 + row * 127;
      if (pos.x >= x && pos.x <= x + 120 && pos.y >= y && pos.y <= y + 120) {
        SFX.collect();
        this.selectedVariantIndex = i;
        this.state = 'playerselect';
        this.playerSelectHover = -1;
        return;
      }
    }
  },

  handleMenuMove(pos) {
    this.menuHover = -1;
    for (let i = 0; i < this.variants.length; i++) {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const x = 20 + col * 127;
      const y = 60 + row * 127;
      if (pos.x >= x && pos.x <= x + 120 && pos.y >= y && pos.y <= y + 120) {
        this.menuHover = i;
        break;
      }
    }
  },

  handlePlayerSelectClick(pos) {
    // Back button
    if (pos.x >= 10 && pos.x <= 80 && pos.y >= 10 && pos.y <= 35) {
      this.state = 'menu';
      return;
    }

    // Local/AI toggle
    if (pos.x >= 140 && pos.x <= 260 && pos.y >= 145 && pos.y <= 170) {
      this.localPlay = !this.localPlay;
      SFX.hit();
      return;
    }

    const modes = this.PLAYER_MODES;
    const cardW = 110;
    const gap = 15;
    const totalW = modes.length * cardW + (modes.length - 1) * gap;
    const sx = (400 - totalW) / 2;
    const cy = 200;

    for (let i = 0; i < modes.length; i++) {
      const x = sx + i * (cardW + gap);
      const y = cy;
      if (pos.x >= x && pos.x <= x + cardW && pos.y >= y && pos.y <= y + 140) {
        SFX.collect();
        this.playerCount = modes[i].count;
        this.startGame(this.selectedVariantIndex);
        return;
      }
    }
  },

  handlePlayerSelectMove(pos) {
    this.playerSelectHover = -1;
    const modes = this.PLAYER_MODES;
    const cardW = 110;
    const gap = 15;
    const totalW = modes.length * cardW + (modes.length - 1) * gap;
    const sx = (400 - totalW) / 2;
    const cy = 200;

    for (let i = 0; i < modes.length; i++) {
      const x = sx + i * (cardW + gap);
      if (pos.x >= x && pos.x <= x + cardW && pos.y >= cy && pos.y <= cy + 140) {
        this.playerSelectHover = i;
        break;
      }
    }
  },

  handleGameClick(pos) {
    const cp = this.currentPlayer;
    if (!this.localPlay && cp !== 0) return;
    if (!this.turnActive) return;

    const hand = this.hands[cp];
    const v = this.variant;

    // UNO button
    if (this.showUnoButton) {
      if (pos.x >= 310 && pos.x <= 390 && pos.y >= 250 && pos.y <= 278) {
        this.calledUno[cp] = true;
        this.showUnoButton = false;
        this.setMessage('UNO!');
        SFX.collect();
        return;
      }
    }

    // Draw button area (draw pile click)
    if (pos.x >= 50 && pos.x <= 110 && pos.y >= 145 && pos.y <= 225) {
      if (this.mustDraw > 0 && v.stackDraws) {
        this.drawCards(cp, this.mustDraw);
        this.setMessage('Drew ' + this.mustDraw + ' cards!');
        this.mustDraw = 0;
      } else {
        this.drawCards(cp, 1);
        const drawnCard = this.hands[cp][this.hands[cp].length - 1];
        if (drawnCard && this.canPlayCard(drawnCard)) {
          this.setMessage('Drew a playable card!');
          this.selectedCards = [this.hands[cp].length - 1];
          return;
        }
        this.setMessage('Drew a card');
      }
      this.endTurn();
      return;
    }

    // Multi-card play button
    if (v.cardsPerTurn > 1 && this.selectedCards.length > 0) {
      if (pos.x >= 140 && pos.x <= 260 && pos.y >= 250 && pos.y <= 278) {
        const cards = this.selectedCards.map(i => hand[i]);
        if (this.canPlayCombo(cards)) {
          this.playCards(cp, [...this.selectedCards]);
          this.selectedCards = [];
          return;
        } else {
          this.setMessage('Invalid combo!');
          return;
        }
      }
    }

    // Card clicking in hand
    const cardY = 340;
    const handLen = hand.length;
    if (handLen === 0) return;

    const spacing = Math.min(45, (380 - this.CARD_W) / Math.max(handLen - 1, 1));
    const startX = Math.max(10, (400 - (spacing * (handLen - 1) + this.CARD_W)) / 2);

    for (let i = handLen - 1; i >= 0; i--) {
      const cx = startX + i * spacing;
      const cy = cardY + (this.hoverCard === i ? -10 : 0);

      if (pos.x >= cx && pos.x <= cx + this.CARD_W && pos.y >= cy && pos.y <= cy + this.CARD_H) {
        if (v.cardsPerTurn > 1) {
          const selIdx = this.selectedCards.indexOf(i);
          if (selIdx !== -1) {
            this.selectedCards.splice(selIdx, 1);
          } else {
            if (this.selectedCards.length < v.cardsPerTurn) {
              this.selectedCards.push(i);
            }
          }
          SFX.hit();
        } else {
          if (this.canPlayCard(hand[i])) {
            this.playCards(cp, [i]);
          } else {
            this.setMessage("Can't play that card");
          }
        }
        return;
      }
    }
  },

  handleGameMove(pos) {
    const cp = this.localPlay ? this.currentPlayer : 0;
    const hand = this.hands[cp];
    const handLen = hand.length;
    this.hoverCard = -1;
    if (handLen === 0) return;

    const cardY = 340;
    const spacing = Math.min(45, (380 - this.CARD_W) / Math.max(handLen - 1, 1));
    const startX = Math.max(10, (400 - (spacing * (handLen - 1) + this.CARD_W)) / 2);

    for (let i = handLen - 1; i >= 0; i--) {
      const cx = startX + i * spacing;
      if (pos.x >= cx && pos.x <= cx + this.CARD_W && pos.y >= cardY - 10 && pos.y <= cardY + this.CARD_H) {
        this.hoverCard = i;
        break;
      }
    }
  },

  handleColorPickClick(pos) {
    const colors = this.COLORS;
    const size = 70;
    const gap = 15;
    const totalW = size * 2 + gap;
    const sx = (400 - totalW) / 2;
    const sy = 170;

    for (let i = 0; i < 4; i++) {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = sx + col * (size + gap);
      const y = sy + row * (size + gap);
      if (pos.x >= x && pos.x <= x + size && pos.y >= y && pos.y <= y + size) {
        this.currentColor = colors[i];
        this.state = 'playing';
        SFX.hit();
        if (this.colorPickCallback) {
          this.colorPickCallback();
          this.colorPickCallback = null;
        }
        return;
      }
    }
  },

  handleBombPlaceClick(pos) {
    // Slider for bomb placement
    const sliderX = 50;
    const sliderW = 300;
    const sliderY = 240;

    if (pos.y >= sliderY - 20 && pos.y <= sliderY + 20) {
      this.bombPlaceIndex = Math.floor(((pos.x - sliderX) / sliderW) * this.deck.length);
      this.bombPlaceIndex = Math.max(0, Math.min(this.deck.length, this.bombPlaceIndex));
    }

    // Confirm button
    if (pos.x >= 150 && pos.x <= 250 && pos.y >= 280 && pos.y <= 310) {
      this.deck.splice(this.bombPlaceIndex, 0, this.bombCard);
      this.bombCard = null;
      this.state = 'playing';
      this.drawPileCount = this.deck.length;
      SFX.collect();
      // Continue drawing remaining cards if needed, or end turn
      this.endTurn();
    }
  },

  handlePassTurnClick(pos) {
    // Click anywhere to reveal hand and continue turn
    this.state = 'playing';
    this._skipPassScreen = true;
    this.startTurn();
    SFX.hit();
  },

  handleGameOverClick(pos) {
    // Play Again button
    if (pos.x >= 120 && pos.x <= 280 && pos.y >= 280 && pos.y <= 320) {
      this.state = 'menu';
      return;
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
    } else if (this.state === 'playerselect') {
      this.drawPlayerSelect();
    } else if (this.state === 'passturn') {
      this.drawPassScreen();
    } else if (this.state === 'playing') {
      this.drawGame();
    } else if (this.state === 'colorpick') {
      this.drawGame();
      this.drawColorPicker();
    } else if (this.state === 'bombplace') {
      this.drawGame();
      this.drawBombPlacer();
    } else if (this.state === 'gameover') {
      this.drawGame();
      this.drawGameOver();
    }
  },

  // ==================== MENU RENDERING ====================

  drawMenu() {
    const ctx = this.ctx;

    // Title
    ctx.fillStyle = '#48dbfb';
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Choose a Variant', 200, 40);

    // Variant grid (3x3)
    for (let i = 0; i < this.variants.length; i++) {
      const v = this.variants[i];
      const col = i % 3;
      const row = Math.floor(i / 3);
      const x = 20 + col * 127;
      const y = 60 + row * 127;
      const hover = this.menuHover === i;

      // Card background
      ctx.fillStyle = hover ? v.color : this.darkenColor(v.color, 0.6);
      ctx.strokeStyle = hover ? '#fff' : v.color;
      ctx.lineWidth = hover ? 2 : 1;
      this.roundRect(ctx, x, y, 120, 120, 8);
      ctx.fill();
      ctx.stroke();

      // Icon
      ctx.font = '28px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fff';
      ctx.fillText(v.icon, x + 60, y + 42);

      // Name
      ctx.font = 'bold 13px monospace';
      ctx.fillStyle = '#fff';
      ctx.fillText(v.name, x + 60, y + 68);

      // Description (truncate to fit card width)
      ctx.font = '10px monospace';
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillText(this.fitText(ctx, v.desc, 110), x + 60, y + 85);

      // Number badge
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.beginPath();
      ctx.arc(x + 105, y + 15, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = '10px monospace';
      ctx.fillStyle = '#fff';
      ctx.fillText(i + 1, x + 105, y + 19);
    }

    ctx.textAlign = 'left';
  },

  // ==================== PLAYER SELECT RENDERING ====================

  drawPlayerSelect() {
    const ctx = this.ctx;
    const v = this.variants[this.selectedVariantIndex];

    // Back button
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    this.roundRect(ctx, 10, 10, 70, 25, 5);
    ctx.fill();
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#aaa';
    ctx.fillText('← Back', 45, 27);

    // Title
    ctx.fillStyle = '#48dbfb';
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Players', 200, 80);

    // Variant subtitle
    ctx.font = '13px monospace';
    ctx.fillStyle = v.color;
    ctx.fillText(v.icon + ' ' + v.name, 200, 105);

    // Local/AI toggle
    ctx.fillStyle = this.localPlay ? 'rgba(72,219,251,0.25)' : 'rgba(255,255,255,0.06)';
    ctx.strokeStyle = this.localPlay ? '#48dbfb' : '#666';
    ctx.lineWidth = 1;
    this.roundRect(ctx, 140, 145, 120, 25, 5);
    ctx.fill();
    ctx.stroke();
    ctx.font = 'bold 11px monospace';
    ctx.fillStyle = this.localPlay ? '#48dbfb' : '#888';
    ctx.fillText(this.localPlay ? '🎮 Local' : '🤖 vs AI', 200, 162);

    // Subtitle
    ctx.font = '11px monospace';
    ctx.fillStyle = '#888';
    ctx.fillText('How many players?', 200, 190);

    // Player count cards
    const modes = this.PLAYER_MODES;
    const cardW = 110;
    const cardH = 140;
    const gap = 15;
    const totalW = modes.length * cardW + (modes.length - 1) * gap;
    const sx = (400 - totalW) / 2;
    const cy = 200;

    for (let i = 0; i < modes.length; i++) {
      const m = modes[i];
      const x = sx + i * (cardW + gap);
      const y = cy;
      const hover = this.playerSelectHover === i;

      // Card background
      ctx.fillStyle = hover ? 'rgba(72,219,251,0.25)' : 'rgba(255,255,255,0.06)';
      ctx.strokeStyle = hover ? '#48dbfb' : '#444';
      ctx.lineWidth = hover ? 2 : 1;
      this.roundRect(ctx, x, y, cardW, cardH, 10);
      ctx.fill();
      ctx.stroke();

      // Icon
      ctx.font = '32px sans-serif';
      ctx.fillStyle = '#fff';
      ctx.fillText(m.icon, x + cardW / 2, y + 45);

      // Label
      ctx.font = 'bold 18px monospace';
      ctx.fillStyle = hover ? '#48dbfb' : '#fff';
      ctx.fillText(m.label, x + cardW / 2, y + 78);

      // Description
      ctx.font = '10px monospace';
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.fillText(m.desc, x + cardW / 2, y + 100);

      // Player count detail
      ctx.font = '9px monospace';
      ctx.fillStyle = '#666';
      ctx.fillText(m.count + ' players total', x + cardW / 2, y + 120);
    }

    ctx.textAlign = 'left';
  },

  drawPassScreen() {
    const ctx = this.ctx;

    ctx.fillStyle = '#0f0f23';
    ctx.fillRect(0, 0, 400, 460);

    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#48dbfb';
    ctx.fillText('Pass to ' + this.playerName(this.currentPlayer), 200, 180);

    ctx.font = '14px monospace';
    ctx.fillStyle = '#888';
    ctx.fillText(this.hands[this.currentPlayer].length + ' cards in hand', 200, 220);

    ctx.font = 'bold 16px monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText('Click to reveal hand', 200, 280);

    ctx.textAlign = 'left';
  },

  // ==================== GAME RENDERING ====================

  drawGame() {
    const ctx = this.ctx;
    const v = this.variant;

    // Status bar
    this.drawStatusBar();

    // Opponents
    this.drawOpponents();

    // Draw pile
    this.drawDrawPile();

    // Discard pile
    this.drawDiscardPile();

    // Action buttons
    this.drawActionButtons();

    // Player hand
    this.drawPlayerHand();

    // See Future overlay
    if (this.seeFutureCards && this.seeFutureTimer > 0) {
      this.drawSeeFuture();
    }

    // Message
    if (this.messageTimer > 0) {
      this.drawMessage();
    }

    // Animations
    this.drawAnimations();
  },

  drawStatusBar() {
    const ctx = this.ctx;

    // Background
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.fillRect(0, 0, 400, 28);

    // Turn indicator
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'left';
    const turnText = this.currentPlayer === 0 ? 'Your Turn' : this.playerName(this.currentPlayer) + "'s Turn";
    ctx.fillStyle = this.currentPlayer === 0 ? '#48dbfb' : '#aaa';
    ctx.fillText(turnText, 10, 18);

    // Direction arrow
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#48dbfb';
    ctx.fillText(this.direction === 1 ? '↻' : '↺', 200, 19);

    // Current color indicator
    ctx.textAlign = 'right';
    if (this.currentColor && this.currentColor !== 'wild') {
      ctx.fillStyle = this.COLOR_HEX[this.currentColor];
      ctx.beginPath();
      ctx.arc(375, 14, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Stacked draw indicator
    if (this.mustDraw > 0) {
      ctx.font = 'bold 12px monospace';
      ctx.fillStyle = '#ff6b6b';
      ctx.textAlign = 'right';
      ctx.fillText('+' + this.mustDraw + ' stacked', 355, 18);
    }

    ctx.textAlign = 'left';
  },

  getOpponentPositions() {
    const n = this.playerCount;
    const opponents = n - 1;
    // Distribute opponents evenly across the top area
    if (opponents === 1) {
      return [{ x: 170, y: 38 }];
    } else if (opponents === 2) {
      return [{ x: 80, y: 38 }, { x: 250, y: 38 }];
    } else if (opponents === 3) {
      return [{ x: 30, y: 40 }, { x: 170, y: 35 }, { x: 310, y: 40 }];
    } else if (opponents === 4) {
      return [{ x: 10, y: 40 }, { x: 110, y: 35 }, { x: 210, y: 35 }, { x: 310, y: 40 }];
    } else {
      // 5 opponents
      return [
        { x: 5, y: 40 }, { x: 85, y: 35 }, { x: 165, y: 35 },
        { x: 245, y: 35 }, { x: 325, y: 40 }
      ];
    }
  },

  drawOpponents() {
    const ctx = this.ctx;
    const n = this.playerCount;
    const positions = this.getOpponentPositions();
    const boxW = n <= 4 ? 80 : 68;
    const viewPlayer = this.localPlay ? this.currentPlayer : 0;

    for (let idx = 0; idx < n - 1; idx++) {
      const p = ((viewPlayer + 1 + idx) % n); // skip viewPlayer
      const pos = positions[idx];
      const count = this.hands[p].length;
      const elim = this.eliminated[p];

      // Background
      ctx.fillStyle = this.currentPlayer === p ? 'rgba(72,219,251,0.15)' : 'rgba(255,255,255,0.05)';
      this.roundRect(ctx, pos.x - 5, pos.y - 2, boxW, 50, 6);
      ctx.fill();

      // Name
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      const cx = pos.x + boxW / 2 - 5;
      ctx.fillStyle = elim ? '#ff6b6b' : (this.currentPlayer === p ? '#48dbfb' : '#aaa');
      ctx.fillText(this.playerName(p), cx, pos.y + 12);

      if (elim) {
        ctx.fillText('💀', cx, pos.y + 35);
      } else {
        // Card count - draw mini card backs
        const miniW = 10;
        const miniH = 14;
        const shown = Math.min(count, 5);
        const startMX = cx - (shown * 6) / 2;
        for (let i = 0; i < shown; i++) {
          ctx.fillStyle = '#1a1a3a';
          ctx.strokeStyle = '#48dbfb';
          ctx.lineWidth = 0.5;
          this.roundRect(ctx, startMX + i * 6, pos.y + 20, miniW, miniH, 2);
          ctx.fill();
          ctx.stroke();
        }
        ctx.font = 'bold 10px monospace';
        ctx.fillStyle = '#fff';
        ctx.fillText(count, cx, pos.y + 48);
      }
    }

    ctx.textAlign = 'left';
  },

  drawDrawPile() {
    const ctx = this.ctx;
    const x = 65, y = 150;

    // Stack effect
    for (let i = 2; i >= 0; i--) {
      ctx.fillStyle = '#1a1a3a';
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1;
      this.roundRect(ctx, x - i * 2, y - i * 2, this.CARD_W, this.CARD_H, 5);
      ctx.fill();
      ctx.stroke();
    }

    // Top card back
    ctx.fillStyle = '#1a1a3a';
    ctx.strokeStyle = '#48dbfb';
    ctx.lineWidth = 1.5;
    this.roundRect(ctx, x, y, this.CARD_W, this.CARD_H, 5);
    ctx.fill();
    ctx.stroke();

    // UNO text on back
    ctx.save();
    ctx.translate(x + this.CARD_W / 2, y + this.CARD_H / 2);
    ctx.rotate(-0.2);
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#48dbfb';
    ctx.fillText('UNO', 0, 5);
    ctx.restore();

    // Card count
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#888';
    ctx.fillText(this.drawPileCount, x + this.CARD_W / 2, y + this.CARD_H + 14);
    ctx.textAlign = 'left';
  },

  drawDiscardPile() {
    const ctx = this.ctx;
    const x = 210, y = 150;

    if (this.discard.length > 0) {
      const top = this.discard[this.discard.length - 1];
      this.drawCard(ctx, top, x, y, false);

      // Current color ring
      if (this.currentColor && this.currentColor !== 'wild') {
        ctx.strokeStyle = this.COLOR_HEX[this.currentColor];
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x + this.CARD_W / 2, y + this.CARD_H / 2, this.CARD_W / 2 + 8, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  },

  drawActionButtons() {
    const ctx = this.ctx;
    const v = this.variant;
    const cp = this.localPlay ? this.currentPlayer : 0;
    const isPlayerTurn = (this.localPlay || this.currentPlayer === 0) && this.turnActive;

    // DRAW label under draw pile
    if (isPlayerTurn) {
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#48dbfb';
      ctx.fillText('DRAW', 90, 245);
    }

    // Multi-card PLAY button
    if (v.cardsPerTurn > 1 && this.selectedCards.length > 0 && isPlayerTurn) {
      const cards = this.selectedCards.map(i => this.hands[cp][i]);
      const valid = this.canPlayCombo(cards);
      ctx.fillStyle = valid ? 'rgba(72,219,251,0.3)' : 'rgba(255,107,107,0.2)';
      ctx.strokeStyle = valid ? '#48dbfb' : '#ff6b6b';
      ctx.lineWidth = 1.5;
      this.roundRect(ctx, 140, 250, 120, 28, 6);
      ctx.fill();
      ctx.stroke();

      ctx.font = 'bold 12px monospace';
      ctx.fillStyle = valid ? '#48dbfb' : '#ff6b6b';
      ctx.fillText('PLAY (' + this.selectedCards.length + ')', 200, 269);
    }

    // UNO button
    if (this.showUnoButton) {
      ctx.fillStyle = 'rgba(255,107,107,0.4)';
      ctx.strokeStyle = '#ff6b6b';
      ctx.lineWidth = 2;
      this.roundRect(ctx, 310, 250, 80, 28, 6);
      ctx.fill();
      ctx.stroke();

      ctx.font = 'bold 14px monospace';
      ctx.fillStyle = '#ff6b6b';
      ctx.fillText('UNO!', 350, 269);
    }

    // Variant info
    ctx.font = '9px monospace';
    ctx.fillStyle = '#555';
    ctx.textAlign = 'left';
    const modeLabel = this.playerCount === 2 ? '1v1' : this.playerCount === 4 ? '2v2' : '3v3';
    ctx.fillText(v.name + ' ' + modeLabel + (v.cardsPerTurn > 1 ? ' | Play up to ' + v.cardsPerTurn : ''), 10, 295);

    // Stacking indicator
    if (this.mustDraw > 0) {
      ctx.font = 'bold 11px monospace';
      ctx.fillStyle = '#ff6b6b';
      ctx.textAlign = 'center';
      ctx.fillText('⚠ Draw ' + this.mustDraw + ' or stack!', 200, 285);
    }

    ctx.textAlign = 'left';
  },

  drawPlayerHand() {
    const ctx = this.ctx;
    const cp = this.localPlay ? this.currentPlayer : 0;
    const hand = this.hands[cp];
    const handLen = hand.length;
    if (handLen === 0) return;

    const cardY = 340;
    const spacing = Math.min(45, (380 - this.CARD_W) / Math.max(handLen - 1, 1));
    const startX = Math.max(10, (400 - (spacing * (handLen - 1) + this.CARD_W)) / 2);

    // Determine playable cards
    const playable = new Set(this.getPlayableIndices(cp));
    const isPlayerTurn = (this.localPlay || this.currentPlayer === 0) && this.turnActive;

    for (let i = 0; i < handLen; i++) {
      const cx = startX + i * spacing;
      const isHover = this.hoverCard === i;
      const isSelected = this.selectedCards.includes(i);
      const cy = cardY + (isHover ? -12 : 0) + (isSelected ? -8 : 0);

      // Dim unplayable cards
      if (isPlayerTurn && !playable.has(i) && this.variant.cardsPerTurn === 1) {
        ctx.globalAlpha = 0.5;
      }

      this.drawCard(ctx, hand[i], cx, cy, false);
      ctx.globalAlpha = 1;

      // Selection highlight
      if (isSelected) {
        ctx.strokeStyle = '#48dbfb';
        ctx.lineWidth = 2;
        this.roundRect(ctx, cx - 1, cy - 1, this.CARD_W + 2, this.CARD_H + 2, 6);
        ctx.stroke();
      }
    }

    // Hand count
    ctx.font = '10px monospace';
    ctx.fillStyle = '#888';
    ctx.textAlign = 'center';
    ctx.fillText('Hand: ' + handLen, 200, 455);
    ctx.textAlign = 'left';
  },

  drawCard(ctx, card, x, y, faceDown) {
    const T = this.CARD_TYPES;

    if (faceDown) {
      ctx.fillStyle = '#1a1a3a';
      ctx.strokeStyle = '#48dbfb';
      ctx.lineWidth = 1;
      this.roundRect(ctx, x, y, this.CARD_W, this.CARD_H, 5);
      ctx.fill();
      ctx.stroke();
      return;
    }

    // Card background
    const bgColor = card.color === 'wild' ? '#2d2d4a' : this.COLOR_HEX[card.color];
    ctx.fillStyle = bgColor;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    this.roundRect(ctx, x, y, this.CARD_W, this.CARD_H, 5);
    ctx.fill();
    ctx.stroke();

    // Inner oval
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.beginPath();
    ctx.ellipse(x + this.CARD_W / 2, y + this.CARD_H / 2, 18, 28, -0.3, 0, Math.PI * 2);
    ctx.fill();

    // Card value/symbol
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';

    let displayValue = '';
    let fontSize = 'bold 18px monospace';

    switch (card.type) {
      case T.NUMBER:
        displayValue = '' + card.value;
        fontSize = 'bold 22px monospace';
        break;
      case T.SKIP:
        displayValue = '⊘';
        fontSize = 'bold 20px monospace';
        break;
      case T.REVERSE:
        displayValue = '⟲';
        fontSize = 'bold 22px monospace';
        break;
      case T.DRAW2:
        displayValue = '+2';
        fontSize = 'bold 16px monospace';
        break;
      case T.WILD:
        displayValue = 'W';
        fontSize = 'bold 18px monospace';
        this.drawWildDiamond(ctx, x + this.CARD_W / 2, y + 18, 7);
        break;
      case T.WILD4:
        displayValue = '+4';
        fontSize = 'bold 16px monospace';
        this.drawWildDiamond(ctx, x + this.CARD_W / 2, y + 18, 7);
        break;
      case T.DRAW10:
        displayValue = '+10';
        fontSize = 'bold 14px monospace';
        ctx.fillStyle = '#ff6b6b';
        this.drawWildDiamond(ctx, x + this.CARD_W / 2, y + 18, 7);
        ctx.fillStyle = '#fff';
        break;
      case T.SWAP:
        displayValue = '⇄';
        fontSize = 'bold 20px monospace';
        this.drawWildDiamond(ctx, x + this.CARD_W / 2, y + 18, 7);
        break;
      case T.BOMB:
        displayValue = '💣';
        fontSize = '22px sans-serif';
        break;
      case T.DEFUSE:
        displayValue = '🔧';
        fontSize = '18px sans-serif';
        break;
      case T.NOPE:
        displayValue = '🚫';
        fontSize = '18px sans-serif';
        break;
      case T.SEE_FUTURE:
        displayValue = '👁';
        fontSize = '18px sans-serif';
        break;
      case T.ATTACK:
        displayValue = '⚔';
        fontSize = 'bold 20px monospace';
        break;
    }

    ctx.font = fontSize;
    ctx.fillText(displayValue, x + this.CARD_W / 2, y + this.CARD_H / 2 + 6);

    // Corner values
    ctx.font = '9px monospace';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'left';
    const cornerVal = card.type === T.NUMBER ? '' + card.value :
                      card.type === T.SKIP ? 'S' :
                      card.type === T.REVERSE ? 'R' :
                      card.type === T.DRAW2 ? '+2' :
                      card.type === T.WILD ? 'W' :
                      card.type === T.WILD4 ? '+4' :
                      card.type === T.DRAW10 ? '+10' :
                      card.type === T.SWAP ? 'SW' :
                      card.type === T.BOMB ? 'B' :
                      card.type === T.DEFUSE ? 'D' :
                      card.type === T.NOPE ? 'N' :
                      card.type === T.SEE_FUTURE ? 'SF' :
                      card.type === T.ATTACK ? 'A' : '';
    ctx.fillText(cornerVal, x + 3, y + 12);
    ctx.textAlign = 'right';
    ctx.fillText(cornerVal, x + this.CARD_W - 3, y + this.CARD_H - 4);

    ctx.textAlign = 'left';
  },

  drawWildDiamond(ctx, cx, cy, r) {
    const colors = [this.COLOR_HEX.red, this.COLOR_HEX.blue, this.COLOR_HEX.green, this.COLOR_HEX.yellow];
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = colors[i];
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      const a1 = (i * Math.PI / 2) - Math.PI / 2;
      const a2 = a1 + Math.PI / 2;
      ctx.arc(cx, cy, r, a1, a2);
      ctx.closePath();
      ctx.fill();
    }
  },

  drawColorPicker() {
    const ctx = this.ctx;

    // Overlay
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(0, 0, 400, 460);

    // Title
    ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#48dbfb';
    ctx.fillText('Pick a Color', 200, 155);

    const size = 70;
    const gap = 15;
    const totalW = size * 2 + gap;
    const sx = (400 - totalW) / 2;
    const sy = 170;

    for (let i = 0; i < 4; i++) {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = sx + col * (size + gap);
      const y = sy + row * (size + gap);

      ctx.fillStyle = this.COLOR_HEX[this.COLORS[i]];
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      this.roundRect(ctx, x, y, size, size, 10);
      ctx.fill();
      ctx.stroke();

      ctx.font = 'bold 14px monospace';
      ctx.fillStyle = '#fff';
      ctx.fillText(this.COLORS[i].toUpperCase(), x + size / 2, y + size / 2 + 5);
    }

    ctx.textAlign = 'left';
  },

  drawBombPlacer() {
    const ctx = this.ctx;

    // Overlay
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(0, 0, 400, 460);

    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff6b6b';
    ctx.fillText('Place the Bomb back in the deck', 200, 200);

    // Slider
    const sliderX = 50;
    const sliderW = 300;
    const sliderY = 240;

    ctx.strokeStyle = '#666';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(sliderX, sliderY);
    ctx.lineTo(sliderX + sliderW, sliderY);
    ctx.stroke();

    // Position indicator
    const posX = sliderX + (this.bombPlaceIndex / Math.max(this.deck.length, 1)) * sliderW;
    ctx.fillStyle = '#ff6b6b';
    ctx.beginPath();
    ctx.arc(posX, sliderY, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = '11px monospace';
    ctx.fillStyle = '#aaa';
    ctx.fillText('Top', sliderX, sliderY + 25);
    ctx.fillText('Bottom', sliderX + sliderW, sliderY + 25);

    // Confirm button
    ctx.fillStyle = 'rgba(72,219,251,0.3)';
    ctx.strokeStyle = '#48dbfb';
    ctx.lineWidth = 1.5;
    this.roundRect(ctx, 150, 280, 100, 30, 6);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 12px monospace';
    ctx.fillStyle = '#48dbfb';
    ctx.fillText('Confirm', 200, 300);

    ctx.textAlign = 'left';
  },

  drawSeeFuture() {
    const ctx = this.ctx;

    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    this.roundRect(ctx, 100, 100, 200, 100, 8);
    ctx.fill();

    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#48dbfb';
    ctx.fillText('Next cards:', 200, 118);

    for (let i = 0; i < this.seeFutureCards.length; i++) {
      this.drawCard(ctx, this.seeFutureCards[i], 115 + i * 60, 125, false);
    }

    ctx.textAlign = 'left';
  },

  drawGameOver() {
    const ctx = this.ctx;

    // Overlay
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(0, 0, 400, 460);

    // Result text
    ctx.font = 'bold 32px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = this.message === 'You Win!' ? '#48dbfb' : '#ff6b6b';
    ctx.fillText(this.message, 200, 220);

    // Variant name + mode
    const modeLabel = this.playerCount === 2 ? '1v1' : this.playerCount === 4 ? '2v2' : '3v3';
    ctx.font = '14px monospace';
    ctx.fillStyle = '#888';
    ctx.fillText(this.variant.name + ' (' + modeLabel + ')', 200, 250);

    // Play Again button
    ctx.fillStyle = 'rgba(72,219,251,0.3)';
    ctx.strokeStyle = '#48dbfb';
    ctx.lineWidth = 1.5;
    this.roundRect(ctx, 120, 280, 160, 40, 8);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 14px monospace';
    ctx.fillStyle = '#48dbfb';
    ctx.fillText('Play Again', 200, 306);

    ctx.textAlign = 'left';
  },

  drawMessage() {
    const ctx = this.ctx;
    const alpha = Math.min(1, this.messageTimer / 30);

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    this.roundRect(ctx, 80, 120, 240, 30, 6);
    ctx.fill();

    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.fillText(this.message, 200, 140);
    ctx.textAlign = 'left';
    ctx.restore();
  },

  drawAnimations() {
    const ctx = this.ctx;
    const positions = this.getOpponentPositions();
    for (const a of this.animations) {
      if (a.type === 'play') {
        const t = a.t;
        const alpha = 1 - t;
        ctx.save();
        ctx.globalAlpha = alpha;
        let ox = 0, oy = 100; // default: from player (bottom)
        if (a.fromPlayer > 0 && a.fromPlayer <= positions.length) {
          const opp = positions[a.fromPlayer - 1];
          ox = opp.x - 200;
          oy = -60;
        }
        const sx = 200 + (1 - t) * ox;
        const sy = 200 + (1 - t) * oy;
        this.drawCard(ctx, a.card, sx, sy, false);
        ctx.restore();
      }
    }
  },

  // ==================== UTILITY ====================

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
  },

  fitText(ctx, text, maxWidth) {
    if (ctx.measureText(text).width <= maxWidth) return text;
    let t = text;
    while (t.length > 0 && ctx.measureText(t + '...').width > maxWidth) {
      t = t.slice(0, -1);
    }
    return t + '...';
  },

  darkenColor(hex, amount) {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.floor((num >> 16) * amount);
    const g = Math.floor(((num >> 8) & 0xff) * amount);
    const b = Math.floor((num & 0xff) * amount);
    return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
  }
};
