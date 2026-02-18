const BaristaGame = {
  name: 'Barista',
  instructions: 'Click & hold bottles to pour. Mix & serve drinks!',

  canvas: null,
  ctx: null,
  animFrame: null,
  state: 'menu',
  frameCount: 0,

  // Ingredients
  ingredients: [
    { id: 'coffee',    name: 'Coffee',    color: '#4a2c0a', icon: '\u2615' },
    { id: 'espresso',  name: 'Espresso',  color: '#2c1a06', icon: '\u2615' },
    { id: 'milk',      name: 'Milk',      color: '#f0ead6', icon: '\u{1F95B}' },
    { id: 'cream',     name: 'Cream',     color: '#fffdd0', icon: '\u{1F95B}' },
    { id: 'chocolate', name: 'Chocolate', color: '#5c3317', icon: '\u{1F36B}' },
    { id: 'vanilla',   name: 'Vanilla',   color: '#f3e5ab', icon: '\u{1F9C1}' },
    { id: 'caramel',   name: 'Caramel',   color: '#c68e17', icon: '\u{1F36F}' },
    { id: 'sugar',     name: 'Sugar',     color: '#ffffff', icon: '\u{1F9C2}' },
    { id: 'cinnamon',  name: 'Cinnamon',  color: '#d2691e', icon: '\u{1F33F}' },
    { id: 'matcha',    name: 'Matcha',    color: '#7caa2d', icon: '\u{1F375}' },
    { id: 'honey',     name: 'Honey',     color: '#daa520', icon: '\u{1F36F}' },
  ],

  // Recipes (amounts in ml, varied ingredient counts)
  allRecipes: [
    { name: 'Latte',             ingredients: { espresso: 60, milk: 120, sugar: 10 }, complexity: 3 },
    { name: 'Cappuccino',        ingredients: { espresso: 70, milk: 90, cream: 30 }, complexity: 3 },
    { name: 'Americano',         ingredients: { espresso: 80, coffee: 100, sugar: 10 }, complexity: 3 },
    { name: 'Mocha',             ingredients: { espresso: 50, milk: 70, chocolate: 50, sugar: 15 }, complexity: 4 },
    { name: 'Vanilla Latte',     ingredients: { espresso: 50, milk: 90, vanilla: 30, sugar: 10 }, complexity: 4 },
    { name: 'Hot Chocolate',     ingredients: { chocolate: 60, milk: 90, cream: 25, sugar: 15 }, complexity: 4 },
    { name: 'Honey Matcha',      ingredients: { matcha: 40, milk: 100, honey: 30, cream: 20 }, complexity: 4 },
    { name: 'Caramel Macchiato', ingredients: { espresso: 40, milk: 70, caramel: 35, vanilla: 20, cream: 20 }, complexity: 5 },
    { name: 'Matcha Latte',      ingredients: { matcha: 35, milk: 80, sugar: 15, vanilla: 15, honey: 15 }, complexity: 5 },
    { name: 'Cinnamon Mocha',    ingredients: { espresso: 40, milk: 55, chocolate: 35, cinnamon: 20, cream: 15, sugar: 10 }, complexity: 6 },
    { name: 'Dirty Chai',        ingredients: { espresso: 35, milk: 55, cinnamon: 30, vanilla: 20, cream: 20, honey: 15 }, complexity: 6 },
    { name: 'Unicorn Frappe',    ingredients: { milk: 45, cream: 30, vanilla: 25, caramel: 25, matcha: 20, chocolate: 15, sugar: 15 }, complexity: 7 },
    { name: 'Barista Special',   ingredients: { espresso: 30, milk: 40, chocolate: 25, caramel: 20, cinnamon: 15, cream: 15, vanilla: 15, honey: 10 }, complexity: 8 },
  ],

  // Round state
  round: 0,
  totalRounds: 8,
  totalScore: 0,
  roundScore: 0,
  currentRecipe: null,
  glass: [],       // [{id, amount}] filled ingredients
  glassTotal: 0,
  maxCapacity: 200,
  mixed: false,
  mixedColor: null,
  pourStream: [],

  // Pouring (momentum system)
  pouring: false,
  pouringIngredient: null,
  pourVelocity: 0,
  pourAccel: 0.008,
  pourDecel: 0.02,
  pourMax: 0.25,

  // Shaking
  shaking: false,
  shakeTimer: 0,
  shakeOffset: 0,

  // Scoring display
  scoring: false,
  scoreBreakdown: [],
  scoreDisplayTimer: 0,

  // Available bottles for this round
  bottles: [],

  // Tolerance (in ml)
  tolerance: 25,

  init(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.state = 'menu';
    this.round = 0;
    this.totalScore = 0;
    this.frameCount = 0;

    this._onMouseDown = (e) => this.mouseDown(e);
    this._onMouseUp = (e) => this.mouseUp(e);
    this._onMouseMove = (e) => this.mouseMove(e);
    this._onClick = (e) => this.click(e);
    canvas.addEventListener('mousedown', this._onMouseDown);
    canvas.addEventListener('mouseup', this._onMouseUp);
    canvas.addEventListener('mousemove', this._onMouseMove);
    canvas.addEventListener('click', this._onClick);

    this.loop();
  },

  getCanvasPos(e) {
    var rect = this.canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (this.canvas.width / rect.width),
      y: (e.clientY - rect.top) * (this.canvas.height / rect.height),
    };
  },

  startRound() {
    // Pick recipe based on round difficulty
    var pool;
    if (this.round < 2) {
      pool = this.allRecipes.filter(function(r) { return r.complexity <= 3; });
      this.tolerance = 25;
    } else if (this.round < 4) {
      pool = this.allRecipes.filter(function(r) { return r.complexity >= 4 && r.complexity <= 5; });
      this.tolerance = 20;
    } else if (this.round < 6) {
      pool = this.allRecipes.filter(function(r) { return r.complexity >= 5 && r.complexity <= 6; });
      this.tolerance = 15;
    } else {
      pool = this.allRecipes.filter(function(r) { return r.complexity >= 6; });
      this.tolerance = 10;
    }
    if (pool.length === 0) pool = this.allRecipes;
    this.currentRecipe = pool[Math.floor(Math.random() * pool.length)];

    this.glass = [];
    this.glassTotal = 0;
    this.mixed = false;
    this.mixedColor = null;
    this.pouring = false;
    this.pouringIngredient = null;
    this.pourVelocity = 0;
    this.pourStream = [];
    this.shaking = false;
    this.shakeTimer = 0;
    this.scoring = false;
    this.scoreBreakdown = [];
    this.scoreDisplayTimer = 0;
    this.roundScore = 0;

    // Set up bottles: recipe ingredients + distractors
    var recipeIds = Object.keys(this.currentRecipe.ingredients);
    var bottleIds = recipeIds.slice();
    // Add distractors for later rounds
    var distractorCount = this.round >= 6 ? 2 : (this.round >= 4 ? 1 : 0);
    var available = this.ingredients.filter(function(ing) { return recipeIds.indexOf(ing.id) === -1; });
    for (var di = 0; di < distractorCount && available.length > 0; di++) {
      var idx = Math.floor(Math.random() * available.length);
      bottleIds.push(available[idx].id);
      available.splice(idx, 1);
    }
    // Shuffle
    for (var si = bottleIds.length - 1; si > 0; si--) {
      var sj = Math.floor(Math.random() * (si + 1));
      var tmp = bottleIds[si]; bottleIds[si] = bottleIds[sj]; bottleIds[sj] = tmp;
    }
    var self = this;
    this.bottles = bottleIds.map(function(id) {
      return self.ingredients.find(function(ing) { return ing.id === id; });
    });

    this.state = 'playing';
    this.updateScore();
  },

  mouseDown(e) {
    if (this.state !== 'playing' || this.shaking || this.scoring) return;
    var pos = this.getCanvasPos(e);
    // Check if clicking a bottle
    var bottleY = 385;
    var bottleW = 30;
    var gap = 5;
    var totalW = this.bottles.length * bottleW + (this.bottles.length - 1) * gap;
    var startX = (400 - totalW) / 2;
    for (var bi = 0; bi < this.bottles.length; bi++) {
      var bx = startX + bi * (bottleW + gap);
      if (pos.x >= bx && pos.x <= bx + bottleW && pos.y >= bottleY && pos.y <= bottleY + 55) {
        if (this.glassTotal < this.maxCapacity && !this.mixed) {
          this.pouring = true;
          this.pouringIngredient = this.bottles[bi];
          this.pouringBottleIdx = bi;
        }
        return;
      }
    }
  },

  mouseUp(e) {
    this.pouring = false;
    // Don't clear pouringIngredient — momentum taper needs it
    // It gets cleared when pourVelocity reaches 0 in update()
  },

  mouseMove(e) {
    // Track position for hover effects if needed
  },

  click(e) {
    var pos = this.getCanvasPos(e);

    if (this.state === 'menu') {
      // Start button
      if (pos.x >= 125 && pos.x <= 275 && pos.y >= 280 && pos.y <= 330) {
        this.round = 0;
        this.totalScore = 0;
        this.startRound();
      }
      return;
    }

    if (this.state === 'gameover') {
      // Play again
      if (pos.x >= 125 && pos.x <= 275 && pos.y >= 340 && pos.y <= 380) {
        this.state = 'menu';
      }
      return;
    }

    if (this.state === 'scoring') {
      // Next round / finish
      if (pos.x >= 125 && pos.x <= 275 && pos.y >= 400 && pos.y <= 440) {
        this.round++;
        if (this.round >= this.totalRounds) {
          this.state = 'gameover';
        } else {
          this.startRound();
        }
      }
      return;
    }

    if (this.state !== 'playing' || this.shaking) return;

    // Action buttons: SHAKE, SERVE, RESET (y: 335-365)
    var btnY = 335;
    var btnH = 28;
    // SHAKE
    if (pos.x >= 30 && pos.x <= 130 && pos.y >= btnY && pos.y <= btnY + btnH) {
      if (this.glassTotal > 0 && !this.mixed) {
        this.shaking = true;
        this.shakeTimer = 40;
        if (typeof SFX !== 'undefined') SFX.whoosh();
      }
      return;
    }
    // SERVE
    if (pos.x >= 150 && pos.x <= 250 && pos.y >= btnY && pos.y <= btnY + btnH) {
      if (this.glassTotal > 0) {
        this.serveDrink();
      }
      return;
    }
    // RESET
    if (pos.x >= 270 && pos.x <= 370 && pos.y >= btnY && pos.y <= btnY + btnH) {
      this.glass = [];
      this.glassTotal = 0;
      this.mixed = false;
      this.mixedColor = null;
      this.pourStream = [];
      return;
    }
  },

  serveDrink() {
    // Calculate score using raw ml amounts
    var recipe = this.currentRecipe;
    var recipeKeys = Object.keys(recipe.ingredients);
    var totalPenalty = 0;
    var breakdown = [];

    // Calculate actual ml amounts per ingredient
    var actualAmounts = {};
    for (var gi = 0; gi < this.glass.length; gi++) {
      var g = this.glass[gi];
      if (!actualAmounts[g.id]) actualAmounts[g.id] = 0;
      actualAmounts[g.id] += g.amount;
    }

    // Score each recipe ingredient
    for (var ri = 0; ri < recipeKeys.length; ri++) {
      var rk = recipeKeys[ri];
      var target = recipe.ingredients[rk];
      var actual = actualAmounts[rk] || 0;
      var diff = Math.abs(actual - target);
      var ing = this.ingredients.find(function(i) { return i.id === rk; });
      breakdown.push({
        name: ing ? ing.name : rk,
        target: target,
        actual: Math.round(actual),
        diff: Math.round(diff),
      });
      totalPenalty += diff;
    }

    // Penalty for wrong ingredients
    for (var ak in actualAmounts) {
      if (!recipe.ingredients[ak]) {
        var wrongIng = this.ingredients.find(function(i) { return i.id === ak; });
        breakdown.push({
          name: wrongIng ? wrongIng.name : ak,
          target: 0,
          actual: Math.round(actualAmounts[ak]),
          diff: Math.round(actualAmounts[ak]),
          wrong: true,
        });
        totalPenalty += actualAmounts[ak] * 1.5;
      }
    }

    // Scale penalty (divide by 2 since ml amounts are larger than old percentages)
    this.roundScore = Math.max(0, Math.round(100 - totalPenalty / 2));
    // Bonus for >90
    if (this.roundScore >= 90) this.roundScore += 10;
    this.totalScore += this.roundScore;
    this.scoreBreakdown = breakdown;
    this.state = 'scoring';
    this.scoreDisplayTimer = 0;

    if (this.roundScore >= 70) {
      if (typeof SFX !== 'undefined') SFX.collect();
    } else {
      if (typeof SFX !== 'undefined') SFX.error();
    }
    this.updateScore();
  },

  hexToRgb(hex) {
    var r = parseInt(hex.slice(1, 3), 16);
    var g = parseInt(hex.slice(3, 5), 16);
    var b = parseInt(hex.slice(5, 7), 16);
    return { r: r, g: g, b: b };
  },

  rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(function(c) {
      var h = Math.round(Math.max(0, Math.min(255, c))).toString(16);
      return h.length === 1 ? '0' + h : h;
    }).join('');
  },

  blendColors() {
    if (this.glass.length === 0) return '#000';
    var tr = 0, tg = 0, tb = 0, tw = 0;
    for (var i = 0; i < this.glass.length; i++) {
      var g = this.glass[i];
      var ing = this.ingredients.find(function(ig) { return ig.id === g.id; });
      if (!ing) continue;
      var rgb = this.hexToRgb(ing.color);
      tr += rgb.r * g.amount;
      tg += rgb.g * g.amount;
      tb += rgb.b * g.amount;
      tw += g.amount;
    }
    if (tw === 0) return '#000';
    return this.rgbToHex(tr / tw, tg / tw, tb / tw);
  },

  updateScore() {
    if (typeof this.onScore === 'function') {
      this.onScore('Round ' + (this.round + 1) + '/' + this.totalRounds + ' | Score: ' + this.totalScore);
    }
  },

  loop() {
    this.update();
    this.draw();
    this.animFrame = requestAnimationFrame(function() { BaristaGame.loop(); });
  },

  update() {
    this.frameCount++;

    // Pour momentum logic
    if (this.state === 'playing' && !this.mixed) {
      if (this.pouring && this.pouringIngredient) {
        this.pourVelocity = Math.min(this.pourVelocity + this.pourAccel, this.pourMax);
      } else if (this.pourVelocity > 0) {
        this.pourVelocity = Math.max(this.pourVelocity - this.pourDecel, 0);
        if (this.pourVelocity === 0) {
          this.pouringIngredient = null;
        }
      }

      if (this.pourVelocity > 0 && this.pouringIngredient && this.glassTotal < this.maxCapacity) {
        var pourAmt = Math.min(this.pourVelocity, this.maxCapacity - this.glassTotal);
        // Find existing entry or create new
        var found = false;
        for (var gi = 0; gi < this.glass.length; gi++) {
          if (this.glass[gi].id === this.pouringIngredient.id) {
            this.glass[gi].amount += pourAmt;
            found = true;
            break;
          }
        }
        if (!found) {
          this.glass.push({ id: this.pouringIngredient.id, amount: pourAmt });
        }
        this.glassTotal += pourAmt;

        // Splash droplets at glass surface
        var spawnChance = this.pourVelocity / this.pourMax;
        if (Math.random() < spawnChance * 0.6) {
          var bottleW = 30;
          var gap = 5;
          var totalBW = this.bottles.length * bottleW + (this.bottles.length - 1) * gap;
          var startBX = (400 - totalBW) / 2;
          var bx = startBX + this.pouringBottleIdx * (bottleW + gap) + bottleW / 2;
          // Splash at glass fill surface
          var glassTopY = 135 + 160 - 2 - (this.glassTotal / this.maxCapacity) * 156;
          this.pourStream.push({
            x: bx + (Math.random() - 0.5) * 6,
            y: glassTopY,
            vx: (Math.random() - 0.5) * 3,
            vy: -(1 + Math.random() * 2),
            color: this.pouringIngredient.color,
            life: 12 + Math.random() * 8,
            size: 1.5 + Math.random() * 1.5,
          });
          if (typeof SFX !== 'undefined' && this.frameCount % 9 === 0) SFX.pour();
        }
      }
    }

    // Splash droplet update
    var newStream = [];
    for (var psi = 0; psi < this.pourStream.length; psi++) {
      var ps = this.pourStream[psi];
      ps.x += ps.vx;
      ps.y += ps.vy;
      ps.vy += 0.15; // gravity
      ps.life--;
      if (ps.life > 0) newStream.push(ps);
    }
    this.pourStream = newStream;

    // Shake
    if (this.shaking) {
      this.shakeTimer--;
      this.shakeOffset = (Math.random() - 0.5) * 8;
      if (this.shakeTimer <= 0) {
        this.shaking = false;
        this.shakeOffset = 0;
        this.mixed = true;
        this.mixedColor = this.blendColors();
      }
    }
  },

  draw() {
    var ctx = this.ctx;
    var canvas = this.canvas;

    ctx.fillStyle = '#0f0f23';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (this.state === 'menu') {
      this.drawMenu(ctx, canvas);
      return;
    }

    if (this.state === 'gameover') {
      this.drawGameOver(ctx, canvas);
      return;
    }

    if (this.state === 'scoring') {
      this.drawScoring(ctx, canvas);
      return;
    }

    // Playing state
    this.drawRecipeCard(ctx);
    this.drawGlass(ctx);
    this.drawButtons(ctx);
    this.drawBottles(ctx);
    this.drawPourStream(ctx);
  },

  drawMenu(ctx, canvas) {
    ctx.fillStyle = '#48dbfb';
    ctx.font = 'bold 36px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('\u2615 Barista', canvas.width / 2, 120);

    ctx.fillStyle = '#aaa';
    ctx.font = '14px system-ui';
    ctx.fillText('Pour, mix & serve drinks!', canvas.width / 2, 160);
    ctx.fillText('8 rounds of increasing difficulty', canvas.width / 2, 185);
    ctx.fillText('Match the recipe as closely as possible', canvas.width / 2, 210);

    // Decorative cups
    ctx.font = '40px system-ui';
    ctx.fillText('\u{1F9CB} \u{1F375} \u2615', canvas.width / 2, 260);

    // Start button
    ctx.fillStyle = '#48dbfb';
    ctx.beginPath();
    ctx.roundRect(125, 280, 150, 50, 8);
    ctx.fill();
    ctx.fillStyle = '#0f0f23';
    ctx.font = 'bold 18px system-ui';
    ctx.fillText('START', canvas.width / 2, 312);
  },

  drawGameOver(ctx, canvas) {
    ctx.fillStyle = '#feca57';
    ctx.font = 'bold 30px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('Shift Over!', canvas.width / 2, 100);

    ctx.font = '20px system-ui';
    ctx.fillStyle = '#fff';
    ctx.fillText('Final Score', canvas.width / 2, 160);

    ctx.font = 'bold 48px system-ui';
    ctx.fillStyle = '#48dbfb';
    ctx.fillText(this.totalScore, canvas.width / 2, 220);

    var avgScore = Math.round(this.totalScore / this.totalRounds);
    ctx.font = '14px system-ui';
    ctx.fillStyle = '#aaa';
    ctx.fillText('Average: ' + avgScore + ' per drink', canvas.width / 2, 260);

    // Rating
    var rating;
    if (avgScore >= 90) rating = '\u{2B50} Master Barista!';
    else if (avgScore >= 70) rating = '\u{1F44D} Great barista!';
    else if (avgScore >= 50) rating = '\u{1F937} Not bad...';
    else rating = '\u{1F625} Needs practice';
    ctx.font = '18px system-ui';
    ctx.fillStyle = '#feca57';
    ctx.fillText(rating, canvas.width / 2, 300);

    // Play again
    ctx.fillStyle = '#48dbfb';
    ctx.beginPath();
    ctx.roundRect(125, 340, 150, 40, 8);
    ctx.fill();
    ctx.fillStyle = '#0f0f23';
    ctx.font = 'bold 14px system-ui';
    ctx.fillText('PLAY AGAIN', canvas.width / 2, 366);
  },

  drawScoring(ctx, canvas) {
    this.scoreDisplayTimer++;

    ctx.fillStyle = '#feca57';
    ctx.font = 'bold 22px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(this.currentRecipe.name, canvas.width / 2, 40);

    // Score
    var scoreColor = this.roundScore >= 90 ? '#2ecc71' : (this.roundScore >= 70 ? '#48dbfb' : (this.roundScore >= 50 ? '#feca57' : '#ff6b6b'));
    ctx.fillStyle = scoreColor;
    ctx.font = 'bold 40px system-ui';
    ctx.fillText(this.roundScore + ' pts', canvas.width / 2, 90);

    if (this.roundScore >= 90) {
      ctx.font = '16px system-ui';
      ctx.fillText('\u{2B50} Perfect bonus! +10', canvas.width / 2, 115);
    }

    // Breakdown
    ctx.font = '12px system-ui';
    ctx.textAlign = 'left';
    var by = 140;
    for (var bi = 0; bi < this.scoreBreakdown.length; bi++) {
      var b = this.scoreBreakdown[bi];
      if (bi * 25 > this.scoreDisplayTimer * 8) break;
      var bColor = b.wrong ? '#ff6b6b' : (b.diff <= this.tolerance ? '#2ecc71' : '#feca57');
      ctx.fillStyle = bColor;
      ctx.fillText(b.name, 50, by);
      ctx.textAlign = 'right';
      ctx.fillText('Target: ' + b.target + 'ml  Actual: ' + b.actual + 'ml  (' + (b.diff <= this.tolerance ? '\u2713' : '\u0394' + b.diff + 'ml') + ')', 350, by);
      ctx.textAlign = 'left';
      by += 25;
    }

    // Total
    ctx.textAlign = 'center';
    ctx.fillStyle = '#aaa';
    ctx.font = '14px system-ui';
    ctx.fillText('Total score: ' + this.totalScore, canvas.width / 2, 380);

    // Next button
    ctx.fillStyle = '#48dbfb';
    ctx.beginPath();
    ctx.roundRect(125, 400, 150, 40, 8);
    ctx.fill();
    ctx.fillStyle = '#0f0f23';
    ctx.font = 'bold 14px system-ui';
    var nextText = (this.round + 1 >= this.totalRounds) ? 'FINISH' : 'NEXT ROUND';
    ctx.fillText(nextText, canvas.width / 2, 425);
  },

  drawRecipeCard(ctx) {
    // Recipe card background
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.beginPath();
    ctx.roundRect(15, 8, 370, 100, 8);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Drink name
    ctx.fillStyle = '#feca57';
    ctx.font = 'bold 16px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('\u{1F4CB} ' + this.currentRecipe.name, 200, 30);

    // Ingredient list (3 columns)
    ctx.font = '10px system-ui';
    ctx.textAlign = 'left';
    var recipe = this.currentRecipe;
    var keys = Object.keys(recipe.ingredients);
    var col = 0;
    var row = 0;
    for (var ki = 0; ki < keys.length; ki++) {
      var k = keys[ki];
      var ing = this.ingredients.find(function(i) { return i.id === k; });
      var tx = 25 + col * 123;
      var ty = 48 + row * 16;
      ctx.fillStyle = ing ? ing.color : '#fff';
      ctx.fillRect(tx, ty - 7, 8, 8);
      ctx.fillStyle = '#ccc';
      ctx.fillText((ing ? ing.name : k) + ': ' + recipe.ingredients[k] + 'ml', tx + 12, ty);
      col++;
      if (col >= 3) { col = 0; row++; }
    }

    // Tolerance
    ctx.fillStyle = '#666';
    ctx.font = '9px system-ui';
    ctx.textAlign = 'right';
    ctx.fillText('Tolerance: \u00B1' + this.tolerance + 'ml', 375, 105);
  },

  drawGlass(ctx) {
    var gx = 160;
    var gy = 135;
    var gw = 80;
    var gh = 160;
    var shakeX = this.shaking ? this.shakeOffset : 0;

    // Glass outline (trapezoid)
    ctx.save();
    ctx.translate(shakeX, 0);

    // Glass shadow
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.moveTo(gx - 5, gy);
    ctx.lineTo(gx - 12, gy + gh + 5);
    ctx.lineTo(gx + gw + 12, gy + gh + 5);
    ctx.lineTo(gx + gw + 5, gy);
    ctx.closePath();
    ctx.fill();

    // Glass body
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(gx, gy);
    ctx.lineTo(gx - 8, gy + gh);
    ctx.lineTo(gx + gw + 8, gy + gh);
    ctx.lineTo(gx + gw, gy);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Fill layers
    if (this.glassTotal > 0) {
      var fillH = (this.glassTotal / this.maxCapacity) * (gh - 4);
      var fillY = gy + gh - 2 - fillH;

      if (this.mixed && this.mixedColor) {
        // Single blended color
        ctx.fillStyle = this.mixedColor;
        var topW = gw + 8 * (1 - (fillY - gy) / gh);
        var botW = gw + 8;
        var topX = gx - (topW - gw) / 2;
        var botX = gx - 4;
        ctx.beginPath();
        ctx.moveTo(topX, fillY);
        ctx.lineTo(botX, gy + gh - 2);
        ctx.lineTo(botX + botW, gy + gh - 2);
        ctx.lineTo(topX + topW, fillY);
        ctx.closePath();
        ctx.fill();
      } else {
        // Layered colors (bottom-up)
        var layerY = gy + gh - 2;
        for (var li = 0; li < this.glass.length; li++) {
          var layer = this.glass[li];
          var ing = this.ingredients.find(function(i) { return i.id === layer.id; });
          if (!ing) continue;
          var layerH = (layer.amount / this.maxCapacity) * (gh - 4);
          var layerTop = layerY - layerH;
          // Trapezoid interpolation
          var fracBot = (layerY - gy) / gh;
          var fracTop = (layerTop - gy) / gh;
          var wBot = gw + 8 * fracBot;
          var wTop = gw + 8 * fracTop;
          var xBot = gx + (gw / 2) - wBot / 2;
          var xTop = gx + (gw / 2) - wTop / 2;
          ctx.fillStyle = ing.color;
          ctx.beginPath();
          ctx.moveTo(xTop, layerTop);
          ctx.lineTo(xBot, layerY);
          ctx.lineTo(xBot + wBot, layerY);
          ctx.lineTo(xTop + wTop, layerTop);
          ctx.closePath();
          ctx.fill();
          layerY = layerTop;
        }
      }
    }

    // Glass shine
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.beginPath();
    ctx.moveTo(gx + 5, gy + 5);
    ctx.lineTo(gx + 2, gy + gh - 10);
    ctx.lineTo(gx + 15, gy + gh - 10);
    ctx.lineTo(gx + 18, gy + 5);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    // Fill percentage
    ctx.fillStyle = '#aaa';
    ctx.font = '11px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(Math.round(this.glassTotal) + '/' + this.maxCapacity + ' ml', gx + gw / 2, gy + gh + 18);

    // Mix status
    if (this.mixed) {
      ctx.fillStyle = '#2ecc71';
      ctx.font = '10px system-ui';
      ctx.fillText('MIXED', gx + gw / 2, gy + gh + 30);
    }
  },

  drawButtons(ctx) {
    var btnY = 335;
    var btnH = 28;
    var buttons = [
      { x: 30, w: 100, label: 'SHAKE', color: '#48dbfb', enabled: this.glassTotal > 0 && !this.mixed },
      { x: 150, w: 100, label: 'SERVE', color: '#2ecc71', enabled: this.glassTotal > 0 },
      { x: 270, w: 100, label: 'RESET', color: '#ff6b6b', enabled: this.glassTotal > 0 },
    ];

    for (var bi = 0; bi < buttons.length; bi++) {
      var btn = buttons[bi];
      ctx.fillStyle = btn.enabled ? btn.color : 'rgba(100,100,100,0.3)';
      ctx.beginPath();
      ctx.roundRect(btn.x, btnY, btn.w, btnH, 6);
      ctx.fill();
      ctx.fillStyle = btn.enabled ? '#0f0f23' : '#555';
      ctx.font = 'bold 12px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(btn.label, btn.x + btn.w / 2, btnY + 19);
    }
  },

  drawBottles(ctx) {
    var bottleY = 385;
    var bottleW = 30;
    var bottleH = 55;
    var gap = 5;
    var totalW = this.bottles.length * bottleW + (this.bottles.length - 1) * gap;
    var startX = (400 - totalW) / 2;

    // Label
    ctx.fillStyle = '#666';
    ctx.font = '9px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('INGREDIENTS', 200, 378);

    for (var bi = 0; bi < this.bottles.length; bi++) {
      var bottle = this.bottles[bi];
      var bx = startX + bi * (bottleW + gap);
      var isPouringThis = this.pouringIngredient && this.pouringIngredient.id === bottle.id && this.pourVelocity > 0;

      // Bottle body
      ctx.fillStyle = isPouringThis ? bottle.color : 'rgba(255,255,255,0.08)';
      ctx.beginPath();
      ctx.roundRect(bx, bottleY, bottleW, bottleH, 4);
      ctx.fill();
      ctx.strokeStyle = bottle.color;
      ctx.lineWidth = isPouringThis ? 2 : 1;
      ctx.stroke();

      // Bottle fill
      ctx.fillStyle = bottle.color;
      ctx.globalAlpha = 0.4;
      ctx.beginPath();
      ctx.roundRect(bx + 3, bottleY + 15, bottleW - 6, bottleH - 18, 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      // Cap
      ctx.fillStyle = bottle.color;
      ctx.fillRect(bx + 8, bottleY - 5, 14, 8);

      // Icon
      ctx.font = '12px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(bottle.icon, bx + bottleW / 2, bottleY + 30);

      // Name
      ctx.fillStyle = '#ccc';
      ctx.font = '6px system-ui';
      ctx.fillText(bottle.name.substr(0, 6), bx + bottleW / 2, bottleY + 48);
    }
  },

  drawPourStream(ctx) {
    // Draw continuous liquid stream from bottle to glass
    if (this.pourVelocity > 0 && this.pouringIngredient) {
      var bottleW = 30;
      var gap = 5;
      var totalBW = this.bottles.length * bottleW + (this.bottles.length - 1) * gap;
      var startBX = (400 - totalBW) / 2;
      var bx = startBX + this.pouringBottleIdx * (bottleW + gap) + bottleW / 2;

      var streamTop = 385; // bottle nozzle
      var fillLevel = this.glassTotal / this.maxCapacity;
      var streamBot = 135 + 160 - 2 - fillLevel * 156; // glass fill surface

      var velFrac = this.pourVelocity / this.pourMax;
      var streamWidth = 2 + velFrac * 4; // thicker at higher velocity

      ctx.fillStyle = this.pouringIngredient.color;
      ctx.globalAlpha = 0.7 + velFrac * 0.3;

      // Draw stream as a wobbly filled shape
      var steps = 12;
      var stepH = (streamBot - streamTop) / steps;
      ctx.beginPath();
      // Left edge going down
      for (var si = 0; si <= steps; si++) {
        var t = si / steps;
        var y = streamTop + si * stepH;
        // Stream narrows as it falls (accelerates), then widens slightly at bottom splash
        var widthAtT = streamWidth * (1 - t * 0.4 + (t > 0.85 ? (t - 0.85) * 3 : 0));
        // Wobble: sine wave that shifts over time
        var wobble = Math.sin(this.frameCount * 0.15 + t * 6) * velFrac * 1.5;
        var x = bx + wobble - widthAtT / 2;
        if (si === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      // Right edge going back up
      for (var si = steps; si >= 0; si--) {
        var t = si / steps;
        var y = streamTop + si * stepH;
        var widthAtT = streamWidth * (1 - t * 0.4 + (t > 0.85 ? (t - 0.85) * 3 : 0));
        var wobble = Math.sin(this.frameCount * 0.15 + t * 6) * velFrac * 1.5;
        var x = bx + wobble + widthAtT / 2;
        ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();

      // Bright center highlight for gloss
      ctx.globalAlpha = 0.3 * velFrac;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      for (var si = 0; si <= steps; si++) {
        var t = si / steps;
        var y = streamTop + si * stepH;
        var wobble = Math.sin(this.frameCount * 0.15 + t * 6) * velFrac * 1.5;
        var x = bx + wobble - 0.5;
        if (si === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      for (var si = steps; si >= 0; si--) {
        var t = si / steps;
        var y = streamTop + si * stepH;
        var wobble = Math.sin(this.frameCount * 0.15 + t * 6) * velFrac * 1.5;
        var x = bx + wobble + 0.5;
        ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // Splash droplets
    for (var psi = 0; psi < this.pourStream.length; psi++) {
      var ps = this.pourStream[psi];
      ctx.globalAlpha = (ps.life / 20) * 0.7;
      ctx.fillStyle = ps.color;
      ctx.beginPath();
      ctx.arc(ps.x, ps.y, ps.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  },

  destroy() {
    cancelAnimationFrame(this.animFrame);
    this.canvas.removeEventListener('mousedown', this._onMouseDown);
    this.canvas.removeEventListener('mouseup', this._onMouseUp);
    this.canvas.removeEventListener('mousemove', this._onMouseMove);
    this.canvas.removeEventListener('click', this._onClick);
  },
};
