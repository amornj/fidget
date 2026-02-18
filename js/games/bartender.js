const BartenderGame = {
  name: 'Bartender',
  instructions: 'Click & hold bottles to pour. Mix creative drinks!',

  canvas: null,
  ctx: null,
  animFrame: null,
  state: 'menu',
  frameCount: 0,

  // Categories
  categories: [
    { id: 'spirit', label: 'Spirit' },
    { id: 'liqueur', label: 'Liqueur' },
    { id: 'mixer', label: 'Mixer' },
    { id: 'juice', label: 'Juice' },
    { id: 'dairy', label: 'Dairy' },
    { id: 'extra', label: 'Extra' },
    { id: 'specialty', label: 'Spcl' },
  ],
  selectedCategory: 0,

  // 50 drinks with flavor profiles: sweet,sour,bitter,boozy,creamy,fruity,spicy,fizzy,herbal,smoky
  drinks: [
    // Spirits (8)
    { id: 'vodka', name: 'Vodka', icon: '\u{1F943}', color: '#e8e8e8', type: 'spirit', flavor: [0,0,1,9,0,0,0,0,0,0] },
    { id: 'gin', name: 'Gin', icon: '\u{1F943}', color: '#d4eadc', type: 'spirit', flavor: [0,0,3,8,0,0,0,0,7,0] },
    { id: 'rum', name: 'Rum', icon: '\u{1F943}', color: '#c68e17', type: 'spirit', flavor: [4,0,0,8,0,1,0,0,0,0] },
    { id: 'tequila', name: 'Tequila', icon: '\u{1F943}', color: '#f0e68c', type: 'spirit', flavor: [0,1,1,9,0,0,2,0,1,0] },
    { id: 'whiskey', name: 'Whiskey', icon: '\u{1F943}', color: '#b5651d', type: 'spirit', flavor: [1,0,3,9,0,0,1,0,0,6] },
    { id: 'bourbon', name: 'Bourbon', icon: '\u{1F943}', color: '#a0522d', type: 'spirit', flavor: [3,0,2,9,0,0,1,0,0,5] },
    { id: 'brandy', name: 'Brandy', icon: '\u{1F943}', color: '#8b4513', type: 'spirit', flavor: [2,0,1,8,0,3,0,0,0,3] },
    { id: 'absinthe', name: 'Absinthe', icon: '\u{1F943}', color: '#7ccd7c', type: 'spirit', flavor: [0,0,6,10,0,0,0,0,9,0] },
    // Liqueurs (8)
    { id: 'kahlua', name: 'Kahlua', icon: '\u{1F36B}', color: '#3c1f0a', type: 'liqueur', flavor: [7,0,3,4,1,0,0,0,0,1] },
    { id: 'baileys', name: 'Baileys', icon: '\u{1F95B}', color: '#c4a882', type: 'liqueur', flavor: [6,0,0,3,7,0,0,0,0,0] },
    { id: 'amaretto', name: 'Amaretto', icon: '\u{1F36F}', color: '#d4913a', type: 'liqueur', flavor: [8,0,2,4,0,0,0,0,0,0] },
    { id: 'triplesec', name: 'Triple Sec', icon: '\u{1F34A}', color: '#ffa500', type: 'liqueur', flavor: [5,1,1,4,0,6,0,0,0,0] },
    { id: 'midori', name: 'Midori', icon: '\u{1F348}', color: '#00ff7f', type: 'liqueur', flavor: [8,0,0,3,0,5,0,0,0,0] },
    { id: 'chambord', name: 'Chambord', icon: '\u{1F347}', color: '#722f37', type: 'liqueur', flavor: [7,1,0,3,0,8,0,0,0,0] },
    { id: 'bluecuracao', name: 'Blue Curacao', icon: '\u{1F499}', color: '#0080ff', type: 'liqueur', flavor: [5,0,2,4,0,4,0,0,0,0] },
    { id: 'chartreuse', name: 'Chartreuse', icon: '\u{1F33F}', color: '#7fff00', type: 'liqueur', flavor: [3,0,3,5,0,0,1,0,9,0] },
    // Mixers (8)
    { id: 'cola', name: 'Cola', icon: '\u{1F964}', color: '#3b1e08', type: 'mixer', flavor: [6,1,1,0,0,0,1,7,0,0] },
    { id: 'tonic', name: 'Tonic', icon: '\u{1F964}', color: '#e8f4f0', type: 'mixer', flavor: [2,0,5,0,0,0,0,8,1,0] },
    { id: 'sodawater', name: 'Soda Water', icon: '\u{1F964}', color: '#f0f8ff', type: 'mixer', flavor: [0,0,0,0,0,0,0,10,0,0] },
    { id: 'gingerbeer', name: 'Ginger Beer', icon: '\u{1F37A}', color: '#deb887', type: 'mixer', flavor: [3,0,1,0,0,0,5,8,0,0] },
    { id: 'grenadine', name: 'Grenadine', icon: '\u{1F352}', color: '#dc143c', type: 'mixer', flavor: [9,0,0,0,0,5,0,0,0,0] },
    { id: 'simplesyrup', name: 'Simple Syrup', icon: '\u{1F36F}', color: '#fff8dc', type: 'mixer', flavor: [10,0,0,0,0,0,0,0,0,0] },
    { id: 'bitters', name: 'Bitters', icon: '\u{1F48A}', color: '#8b0000', type: 'mixer', flavor: [0,0,9,0,0,0,3,0,5,0] },
    { id: 'coconutcream', name: 'Coconut Cream', icon: '\u{1F965}', color: '#fffdd0', type: 'mixer', flavor: [4,0,0,0,8,2,0,0,0,0] },
    // Juices (8)
    { id: 'orange', name: 'Orange', icon: '\u{1F34A}', color: '#ff8c00', type: 'juice', flavor: [5,3,0,0,0,8,0,0,0,0] },
    { id: 'lime', name: 'Lime', icon: '\u{1F34B}', color: '#32cd32', type: 'juice', flavor: [0,9,1,0,0,4,0,0,0,0] },
    { id: 'lemon', name: 'Lemon', icon: '\u{1F34B}', color: '#fff44f', type: 'juice', flavor: [1,8,1,0,0,4,0,0,0,0] },
    { id: 'cranberry', name: 'Cranberry', icon: '\u{1F352}', color: '#b22222', type: 'juice', flavor: [2,5,2,0,0,7,0,0,0,0] },
    { id: 'pineapple', name: 'Pineapple', icon: '\u{1F34D}', color: '#ffd700', type: 'juice', flavor: [6,3,0,0,0,9,0,0,0,0] },
    { id: 'tomato', name: 'Tomato', icon: '\u{1F345}', color: '#ff6347', type: 'juice', flavor: [1,2,0,0,0,3,1,0,1,0] },
    { id: 'grapefruit', name: 'Grapefruit', icon: '\u{1F34A}', color: '#ff7f7f', type: 'juice', flavor: [2,5,4,0,0,6,0,0,0,0] },
    { id: 'passionfruit', name: 'Passion Fruit', icon: '\u{1F353}', color: '#ff69b4', type: 'juice', flavor: [5,4,0,0,0,9,0,0,0,0] },
    // Dairy (6)
    { id: 'milk', name: 'Milk', icon: '\u{1F95B}', color: '#f5f5f5', type: 'dairy', flavor: [1,0,0,0,8,0,0,0,0,0] },
    { id: 'heavycream', name: 'Heavy Cream', icon: '\u{1F95B}', color: '#fffdd0', type: 'dairy', flavor: [1,0,0,0,10,0,0,0,0,0] },
    { id: 'eggwhite', name: 'Egg White', icon: '\u{1F95A}', color: '#fafad2', type: 'dairy', flavor: [0,0,0,0,5,0,0,0,0,0] },
    { id: 'chocolatesyrup', name: 'Choc Syrup', icon: '\u{1F36B}', color: '#5c3317', type: 'dairy', flavor: [8,0,2,0,3,0,0,0,0,0] },
    { id: 'vanillasyrup', name: 'Vanilla Syrup', icon: '\u{1F9C1}', color: '#f3e5ab', type: 'dairy', flavor: [8,0,0,0,2,0,0,0,1,0] },
    { id: 'honey', name: 'Honey', icon: '\u{1F36F}', color: '#daa520', type: 'dairy', flavor: [9,0,0,0,1,1,0,0,1,0] },
    // Extras (6)
    { id: 'mint', name: 'Mint', icon: '\u{1F33F}', color: '#98fb98', type: 'extra', flavor: [0,0,0,0,0,0,0,1,8,0] },
    { id: 'cinnamon', name: 'Cinnamon', icon: '\u{1F33F}', color: '#d2691e', type: 'extra', flavor: [2,0,0,0,0,0,5,0,3,1] },
    { id: 'tabasco', name: 'Tabasco', icon: '\u{1F336}', color: '#ff2400', type: 'extra', flavor: [0,1,0,0,0,0,10,0,0,0] },
    { id: 'worcestershire', name: 'Worcestershire', icon: '\u{1F9C8}', color: '#4a3728', type: 'extra', flavor: [1,2,1,0,0,0,2,0,0,4] },
    { id: 'olivebrine', name: 'Olive Brine', icon: '\u{1FAD2}', color: '#9acd32', type: 'extra', flavor: [0,2,2,0,0,0,0,0,1,0] },
    { id: 'espresso', name: 'Espresso', icon: '\u2615', color: '#2c1a06', type: 'extra', flavor: [0,0,7,0,1,0,0,0,0,3] },
    // Specialty (6)
    { id: 'champagne', name: 'Champagne', icon: '\u{1F37E}', color: '#faebd7', type: 'specialty', flavor: [1,1,1,5,0,2,0,8,0,0] },
    { id: 'redwine', name: 'Red Wine', icon: '\u{1F377}', color: '#722f37', type: 'specialty', flavor: [1,1,3,5,0,4,0,0,1,1] },
    { id: 'sake', name: 'Sake', icon: '\u{1F376}', color: '#f5f5dc', type: 'specialty', flavor: [2,0,1,6,0,1,0,0,1,0] },
    { id: 'kombucha', name: 'Kombucha', icon: '\u{1F9CB}', color: '#deb887', type: 'specialty', flavor: [2,4,1,0,0,2,0,5,2,0] },
    { id: 'energydrink', name: 'Energy Drink', icon: '\u26A1', color: '#7fff00', type: 'specialty', flavor: [7,2,1,0,0,1,0,6,0,0] },
    { id: 'coldbrew', name: 'Cold Brew', icon: '\u2615', color: '#1a0f00', type: 'specialty', flavor: [1,0,6,0,1,0,0,0,0,4] },
  ],

  flavorNames: ['sweet','sour','bitter','boozy','creamy','fruity','spicy','fizzy','herbal','smoky'],

  // Special combos (classic cocktails)
  specialCombos: [
    { name: 'Screwdriver', needs: ['vodka','orange'], icon: '\u{1F34A}' },
    { name: 'Moscow Mule', needs: ['vodka','gingerbeer','lime'], icon: '\u{1F37A}' },
    { name: 'Cuba Libre', needs: ['rum','cola','lime'], icon: '\u{1F1E8}\u{1F1FA}' },
    { name: 'Daiquiri', needs: ['rum','lime','simplesyrup'], icon: '\u{1F379}' },
    { name: 'Pi\u00F1a Colada', needs: ['rum','pineapple','coconutcream'], icon: '\u{1F34D}' },
    { name: 'Gin & Tonic', needs: ['gin','tonic'], icon: '\u{1F378}' },
    { name: 'Margarita', needs: ['tequila','lime','triplesec'], icon: '\u{1F378}' },
    { name: 'Tequila Sunrise', needs: ['tequila','orange','grenadine'], icon: '\u{1F305}' },
    { name: 'Old Fashioned', needs: ['bourbon','simplesyrup','bitters'], icon: '\u{1F943}' },
    { name: 'Whiskey Sour', needs: ['whiskey','lemon','simplesyrup'], icon: '\u{1F34B}' },
    { name: 'Mint Julep', needs: ['bourbon','simplesyrup','mint'], icon: '\u{1F33F}' },
    { name: 'White Russian', needs: ['vodka','kahlua','heavycream'], icon: '\u{1F95B}' },
    { name: 'Black Russian', needs: ['vodka','kahlua'], icon: '\u{1F36B}' },
    { name: 'Bloody Mary', needs: ['vodka','tomato','tabasco','worcestershire'], icon: '\u{1F345}' },
    { name: 'Mimosa', needs: ['champagne','orange'], icon: '\u{1F37E}' },
    { name: 'Espresso Martini', needs: ['vodka','kahlua','espresso'], icon: '\u2615' },
    { name: 'Sidecar', needs: ['brandy','triplesec','lemon'], icon: '\u{1F378}' },
    { name: 'Mojito', needs: ['rum','lime','simplesyrup','mint','sodawater'], icon: '\u{1F33F}' },
    { name: 'Cosmopolitan', needs: ['vodka','triplesec','cranberry','lime'], icon: '\u{1F378}' },
    { name: 'Long Island', needs: ['vodka','gin','rum','tequila','cola'], icon: '\u{1F964}' },
    { name: 'Amaretto Sour', needs: ['amaretto','lemon','simplesyrup'], icon: '\u{1F34B}' },
    { name: 'Irish Coffee', needs: ['whiskey','espresso','heavycream'], icon: '\u2615' },
    { name: 'Sake Bomb', needs: ['sake','energydrink'], icon: '\u{1F4A5}' },
    { name: 'Midori Sour', needs: ['midori','lemon','lime'], icon: '\u{1F348}' },
    { name: 'Paloma', needs: ['tequila','grapefruit','sodawater'], icon: '\u{1F34A}' },
  ],

  // Name generation pools
  adjectives: {
    sweet: ['Velvet','Sugar','Candy','Honeyed','Mellow'],
    sour: ['Tart','Zesty','Sharp','Citrus','Tangy'],
    bitter: ['Bold','Dark','Intense','Robust','Deep'],
    boozy: ['Strong','Stiff','Potent','Fiery','Mighty'],
    creamy: ['Silky','Smooth','Lush','Velvety','Dreamy'],
    fruity: ['Tropical','Sunny','Fresh','Orchard','Ripe'],
    spicy: ['Blazing','Fiery','Sizzling','Hot','Smoldering'],
    fizzy: ['Sparkling','Bubbly','Effervescent','Electric','Fizzy'],
    herbal: ['Botanical','Garden','Verdant','Aromatic','Herbal'],
    smoky: ['Smoky','Charred','Toasted','Ember','Campfire'],
  },
  nouns: {
    sweet: ['Kiss','Dream','Cloud','Bliss','Treat'],
    sour: ['Sting','Twist','Punch','Splash','Bite'],
    bitter: ['Shadow','Night','Storm','Edge','Depth'],
    boozy: ['Hammer','Thunder','Blaze','Fury','Kick'],
    creamy: ['Cloud','Pillow','Cascade','Drift','Wave'],
    fruity: ['Breeze','Burst','Splash','Sun','Bloom'],
    spicy: ['Flame','Inferno','Flash','Spark','Blaze'],
    fizzy: ['Pop','Fizz','Rush','Tingle','Burst'],
    herbal: ['Garden','Meadow','Mist','Leaf','Dew'],
    smoky: ['Ember','Trail','Haze','Wisp','Forge'],
  },

  // Description templates
  openers: {
    balanced: ['A well-rounded drink with an easy charm.','This one greets you with a balanced handshake.','A harmonious blend that hits all the right notes.'],
    strong: ['This drink means business.','Not for the faint of heart.','A bold pour that demands attention.'],
    sweet: ['Sweet and inviting from the first sip.','Like liquid dessert in a glass.','A sugar-kissed concoction.'],
    sour: ['A bright, puckering start.','The citrus hits you right away.','Tart and lively on the tongue.'],
    mild: ['Gentle and understated.','A light, easygoing sipper.','Subtle flavors at play here.'],
  },
  closers: {
    great: ['An instant classic.','The bartender nods approvingly.','You might have found something special.'],
    good: ['Solid work behind the bar.','A respectable pour.','Not bad at all.'],
    ok: ['It works, mostly.','An interesting experiment.','Points for creativity.'],
    bad: ['Maybe try a different ratio.','The flavors are fighting each other.','Back to the drawing board.'],
    awful: ['This might be a health hazard.','Even the glass looks offended.','Let\'s pretend this didn\'t happen.'],
  },
  flavorNotes: {
    sweet: ['Sweetness wraps around everything','A sugary backbone holds it together','Honey-like richness lingers'],
    sour: ['Citrus cuts through cleanly','A sour edge keeps things interesting','Tartness dances on the tongue'],
    bitter: ['Bitter undertones add complexity','A dark, brooding bitterness emerges','The bitter finish is unmistakable'],
    boozy: ['The alcohol is front and center','A warming boozy glow spreads','Spirit-forward and unapologetic'],
    creamy: ['Cream smooths out every edge','A velvety mouthfeel takes over','Rich and luxuriously creamy'],
    fruity: ['Fruit flavors burst through','A juicy, fruity heart shines','Fresh fruit vibes dominate'],
    spicy: ['Heat builds with each sip','A spicy kick sneaks up on you','Warmth radiates from the spice'],
    fizzy: ['Bubbles lift the whole experience','Effervescence tickles the palate','The fizz adds a playful energy'],
    herbal: ['Herbal notes weave throughout','A garden-fresh aroma rises','Botanical complexity unfolds'],
    smoky: ['Smoke curls through the flavor','A toasty, smoky depth appears','Charred warmth rounds out the sip'],
  },

  // Vibe checklist (first match wins)
  vibeChecks: [
    { check: function(p) { return p.boozy >= 7 && p.spicy >= 4; }, label: 'Playing With Fire', emoji: '\u{1F525}' },
    { check: function(p) { return p.sweet >= 7 && p.creamy >= 5; }, label: 'Dessert in a Glass', emoji: '\u{1F370}' },
    { check: function(p) { return p.boozy >= 8; }, label: 'Liquid Courage', emoji: '\u{1F4AA}' },
    { check: function(p) { return p.fruity >= 6 && p.fizzy >= 4; }, label: 'Pool Party', emoji: '\u{1F3D6}' },
    { check: function(p) { return p.bitter >= 5 && p.herbal >= 5; }, label: 'Apothecary Chic', emoji: '\u{1F33F}' },
    { check: function(p) { return p.smoky >= 5 && p.boozy >= 5; }, label: 'Speakeasy Vibes', emoji: '\u{1F3B7}' },
    { check: function(p) { return p.sour >= 6 && p.fruity >= 4; }, label: 'Pucker Up', emoji: '\u{1F48B}' },
    { check: function(p) { return p.fizzy >= 7; }, label: 'Bubble Trouble', emoji: '\u{1FAE7}' },
    { check: function(p) { return p.creamy >= 6; }, label: 'Smooth Operator', emoji: '\u{1F60E}' },
    { check: function(p) { return p.herbal >= 6; }, label: 'Garden Party', emoji: '\u{1F33B}' },
    { check: function(p) { return p.spicy >= 5; }, label: 'Spice Route', emoji: '\u{1F336}' },
    { check: function(p) { return p.fruity >= 6; }, label: 'Tropical Escape', emoji: '\u{1F334}' },
    { check: function(p) { return p.sweet >= 6; }, label: 'Sweet Tooth', emoji: '\u{1F36D}' },
    { check: function(p) { return p.bitter >= 5; }, label: 'Acquired Taste', emoji: '\u{1F9D0}' },
    { check: function(p) { return p.smoky >= 4; }, label: 'Fireside Chat', emoji: '\u{1FAB5}' },
  ],

  // Synergy/conflict pairs for rating
  synergies: [
    ['sweet','sour',0.4], ['boozy','sweet',0.3], ['fruity','fizzy',0.3],
    ['creamy','sweet',0.3], ['herbal','bitter',0.3], ['smoky','boozy',0.3],
    ['sour','fizzy',0.2], ['fruity','sweet',0.2], ['spicy','sour',0.2],
  ],
  conflicts: [
    ['sweet','bitter',0.4], ['creamy','fizzy',0.4], ['spicy','creamy',0.3],
    ['smoky','fruity',0.3], ['herbal','sweet',0.2],
  ],

  // Glass state
  glass: [],
  glassTotal: 0,
  maxCapacity: 300,
  maxSlots: 50,
  mixed: false,
  mixedColor: null,
  pourStream: [],

  // Pouring (momentum)
  pouring: false,
  pouringDrink: null,
  pouringBottleIdx: 0,
  pourVelocity: 0,
  pourAccel: 0.012,
  pourDecel: 0.025,
  pourMax: 0.35,

  // Shaking
  shaking: false,
  shakeTimer: 0,
  shakeOffset: 0,

  // Score tracking
  drinkCount: 0,
  bestRating: 0,

  // Tasting result
  tastingResult: null,

  // Ice
  hasIce: false,
  iceCubes: [],

  // Hover tracking
  hoverPos: { x: 0, y: 0 },

  // --- FLAVOR ENGINE ---

  simpleHash: function(ids) {
    var h = 0;
    var s = ids.sort().join(',');
    for (var i = 0; i < s.length; i++) {
      h = ((h << 5) - h + s.charCodeAt(i)) | 0;
    }
    return Math.abs(h);
  },

  blendFlavors: function() {
    var profile = [0,0,0,0,0,0,0,0,0,0];
    if (this.glass.length === 0) return profile;
    var totalVol = 0;
    for (var i = 0; i < this.glass.length; i++) {
      totalVol += this.glass[i].amount;
    }
    if (totalVol === 0) return profile;
    for (var i = 0; i < this.glass.length; i++) {
      var g = this.glass[i];
      var drink = this.drinks.find(function(d) { return d.id === g.id; });
      if (!drink) continue;
      var w = g.amount / totalVol;
      for (var f = 0; f < 10; f++) {
        profile[f] += drink.flavor[f] * w;
      }
    }
    return profile;
  },

  profileToObj: function(profile) {
    var obj = {};
    for (var i = 0; i < this.flavorNames.length; i++) {
      obj[this.flavorNames[i]] = profile[i];
    }
    return obj;
  },

  detectSpecialCombo: function() {
    var ids = [];
    for (var i = 0; i < this.glass.length; i++) {
      ids.push(this.glass[i].id);
    }
    for (var ci = 0; ci < this.specialCombos.length; ci++) {
      var combo = this.specialCombos[ci];
      var hasAll = true;
      for (var ni = 0; ni < combo.needs.length; ni++) {
        if (ids.indexOf(combo.needs[ni]) === -1) { hasAll = false; break; }
      }
      if (hasAll && ids.length <= combo.needs.length + 1) {
        return combo;
      }
    }
    return null;
  },

  generateName: function(profile, ids) {
    var combo = this.detectSpecialCombo();
    if (combo) return combo.name;

    var h = this.simpleHash(ids);
    // Find top two dimensions
    var sorted = [];
    for (var i = 0; i < profile.length; i++) {
      sorted.push({ idx: i, val: profile[i] });
    }
    sorted.sort(function(a, b) { return b.val - a.val; });
    var topName = this.flavorNames[sorted[0].idx];
    var secName = this.flavorNames[sorted[1].idx];

    var adjs = this.adjectives[topName];
    var nns = this.nouns[secName];
    var adj = adjs[h % adjs.length];
    var noun = nns[(h >> 4) % nns.length];
    return 'The ' + adj + ' ' + noun;
  },

  generateDescription: function(profile, rating, ids) {
    var pObj = this.profileToObj(profile);
    var h = this.simpleHash(ids);
    var lines = [];

    // Opener based on character
    var maxVal = 0; var maxDim = 'balanced';
    for (var i = 0; i < profile.length; i++) {
      if (profile[i] > maxVal) { maxVal = profile[i]; maxDim = this.flavorNames[i]; }
    }
    var openerKey = 'balanced';
    if (maxVal >= 7 && maxDim === 'boozy') openerKey = 'strong';
    else if (maxVal >= 6 && maxDim === 'sweet') openerKey = 'sweet';
    else if (maxVal >= 6 && maxDim === 'sour') openerKey = 'sour';
    else if (maxVal < 4) openerKey = 'mild';
    var ops = this.openers[openerKey];
    lines.push(ops[h % ops.length]);

    // Flavor notes for top dims > 3.5
    var notesAdded = 0;
    for (var i = 0; i < profile.length && notesAdded < 3; i++) {
      var sorted2 = [];
      for (var j = 0; j < profile.length; j++) sorted2.push({ idx: j, val: profile[j] });
      sorted2.sort(function(a, b) { return b.val - a.val; });
      var dim = sorted2[i];
      if (dim.val > 3.5) {
        var fn = this.flavorNames[dim.idx];
        var notes = this.flavorNotes[fn];
        lines.push(notes[(h + notesAdded) % notes.length] + '.');
        notesAdded++;
      }
    }

    // Closer based on rating
    var closerKey = rating >= 4.0 ? 'great' : (rating >= 3.0 ? 'good' : (rating >= 2.0 ? 'ok' : (rating >= 1.5 ? 'bad' : 'awful')));
    var cls = this.closers[closerKey];
    lines.push(cls[(h >> 3) % cls.length]);

    return lines.join(' ');
  },

  calculateRating: function(profile) {
    var pObj = this.profileToObj(profile);

    // Harmony: synergies minus conflicts
    var harmony = 0;
    for (var si = 0; si < this.synergies.length; si++) {
      var s = this.synergies[si];
      if (pObj[s[0]] >= 3 && pObj[s[1]] >= 3) {
        harmony += s[2] * (Math.min(pObj[s[0]], pObj[s[1]]) / 10);
      }
    }
    for (var ci = 0; ci < this.conflicts.length; ci++) {
      var c = this.conflicts[ci];
      if (pObj[c[0]] >= 3 && pObj[c[1]] >= 3) {
        harmony -= c[2] * (Math.min(pObj[c[0]], pObj[c[1]]) / 10);
      }
    }
    harmony = Math.max(0, Math.min(2, harmony + 1));

    // Balance: 3-6 active dimensions is sweet spot
    var active = 0;
    for (var i = 0; i < profile.length; i++) {
      if (profile[i] >= 2) active++;
    }
    var balance;
    if (active >= 3 && active <= 6) balance = 1.5;
    else if (active === 2 || active === 7) balance = 1.0;
    else if (active === 1) balance = 0.5;
    else balance = 0.3;

    // Creativity: variety of types + ingredient count
    var types = {};
    for (var i = 0; i < this.glass.length; i++) {
      var d = this.drinks.find(function(dr) { return dr.id === this.glass[i].id; }.bind(this));
      if (d) types[d.type] = true;
    }
    var typeCount = Object.keys(types).length;
    var creativity = Math.min(1.5, (typeCount * 0.3) + (Math.min(this.glass.length, 4) * 0.15));

    var raw = harmony + balance + creativity;
    // Clamp to 1-5
    var rating = Math.max(1, Math.min(5, raw));
    // Special combo bonus
    if (this.detectSpecialCombo()) rating = Math.min(5, rating + 0.5);
    if (this.hasIce) rating = Math.min(5, rating + 0.15);
    return Math.round(rating * 10) / 10;
  },

  assessVibe: function(profile) {
    var pObj = this.profileToObj(profile);
    for (var vi = 0; vi < this.vibeChecks.length; vi++) {
      var v = this.vibeChecks[vi];
      if (v.check(pObj)) return { label: v.label, emoji: v.emoji };
    }
    return { label: 'Experimental', emoji: '\u{1F9EA}' };
  },

  // --- COLOR UTILITIES ---

  hexToRgb: function(hex) {
    var r = parseInt(hex.slice(1, 3), 16);
    var g = parseInt(hex.slice(3, 5), 16);
    var b = parseInt(hex.slice(5, 7), 16);
    return { r: r, g: g, b: b };
  },

  rgbToHex: function(r, g, b) {
    return '#' + [r, g, b].map(function(c) {
      var h = Math.round(Math.max(0, Math.min(255, c))).toString(16);
      return h.length === 1 ? '0' + h : h;
    }).join('');
  },

  blendGlassColors: function() {
    if (this.glass.length === 0) return '#000';
    var tr = 0, tg = 0, tb = 0, tw = 0;
    for (var i = 0; i < this.glass.length; i++) {
      var g = this.glass[i];
      var drink = this.drinks.find(function(d) { return d.id === g.id; });
      if (!drink) continue;
      var rgb = this.hexToRgb(drink.color);
      tr += rgb.r * g.amount;
      tg += rgb.g * g.amount;
      tb += rgb.b * g.amount;
      tw += g.amount;
    }
    if (tw === 0) return '#000';
    return this.rgbToHex(tr / tw, tg / tw, tb / tw);
  },

  wrapText: function(ctx, text, x, y, maxWidth, lineHeight) {
    var words = text.split(' ');
    var line = '';
    var lines = [];
    for (var n = 0; n < words.length; n++) {
      var testLine = line + words[n] + ' ';
      var metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        lines.push(line.trim());
        line = words[n] + ' ';
      } else {
        line = testLine;
      }
    }
    lines.push(line.trim());
    for (var i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], x, y + i * lineHeight);
    }
    return lines.length;
  },

  // --- INIT / DESTROY ---

  init: function(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.state = 'menu';
    this.frameCount = 0;
    this.drinkCount = 0;
    this.bestRating = 0;
    this.selectedCategory = 0;

    this._onMouseDown = function(e) { BartenderGame.mouseDown(e); };
    this._onMouseUp = function(e) { BartenderGame.mouseUp(e); };
    this._onMouseMove = function(e) { BartenderGame.mouseMove(e); };
    this._onClick = function(e) { BartenderGame.click(e); };
    canvas.addEventListener('mousedown', this._onMouseDown);
    canvas.addEventListener('mouseup', this._onMouseUp);
    canvas.addEventListener('mousemove', this._onMouseMove);
    canvas.addEventListener('click', this._onClick);

    this.loop();
  },

  destroy: function() {
    cancelAnimationFrame(this.animFrame);
    this.canvas.removeEventListener('mousedown', this._onMouseDown);
    this.canvas.removeEventListener('mouseup', this._onMouseUp);
    this.canvas.removeEventListener('mousemove', this._onMouseMove);
    this.canvas.removeEventListener('click', this._onClick);
  },

  getCanvasPos: function(e) {
    var rect = this.canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (this.canvas.width / rect.width),
      y: (e.clientY - rect.top) * (this.canvas.height / rect.height),
    };
  },

  // --- GAME ACTIONS ---

  startMixing: function() {
    this.glass = [];
    this.glassTotal = 0;
    this.mixed = false;
    this.mixedColor = null;
    this.pouring = false;
    this.pouringDrink = null;
    this.pourVelocity = 0;
    this.pourStream = [];
    this.shaking = false;
    this.shakeTimer = 0;
    this.tastingResult = null;
    this.hasIce = false;
    this.iceCubes = [];
    this.selectedCategory = 0;
    this.state = 'mixing';
    this.updateScore();
  },

  toggleIce: function() {
    this.hasIce = !this.hasIce;
    if (this.hasIce) {
      this.iceCubes = [];
      for (var i = 0; i < 4; i++) {
        this.iceCubes.push({
          x: 0.25 + Math.random() * 0.5,
          y: 0.1 + Math.random() * 0.5,
          rot: Math.random() * Math.PI * 2,
          size: 0.6 + Math.random() * 0.4,
          bobPhase: Math.random() * Math.PI * 2,
        });
      }
      if (typeof SFX !== 'undefined') SFX.hit();
    } else {
      this.iceCubes = [];
    }
  },

  tasteDrink: function() {
    if (this.glassTotal <= 0) return;
    var profile = this.blendFlavors();
    var ids = [];
    for (var i = 0; i < this.glass.length; i++) ids.push(this.glass[i].id);
    var rating = this.calculateRating(profile);
    var name = this.generateName(profile, ids);
    var desc = this.generateDescription(profile, rating, ids);
    var vibe = this.assessVibe(profile);
    var combo = this.detectSpecialCombo();

    this.tastingResult = {
      name: name,
      rating: rating,
      description: desc,
      vibe: vibe,
      combo: combo,
      color: this.mixed ? this.mixedColor : this.blendGlassColors(),
      profile: profile,
      iced: this.hasIce,
    };

    this.drinkCount++;
    if (rating > this.bestRating) this.bestRating = rating;
    this.updateScore();

    if (rating >= 3.5) {
      if (typeof SFX !== 'undefined') SFX.collect();
    } else {
      if (typeof SFX !== 'undefined') SFX.hit();
    }

    this.state = 'tasting';
  },

  updateScore: function() {
    if (typeof this.onScore === 'function') {
      this.onScore('Drinks: ' + this.drinkCount + ' | Best: ' + this.bestRating.toFixed(1) + '\u2605');
    }
  },

  // --- INPUT HANDLERS ---

  mouseDown: function(e) {
    if (this.state !== 'mixing' || this.shaking) return;
    var pos = this.getCanvasPos(e);

    // Check bottle grid (y=28-92)
    var bottles = this.getCategoryDrinks();
    var cols = Math.min(bottles.length, 4);
    var rows = Math.ceil(bottles.length / 4);
    var bw = 88, bh = 28, gapX = 6, gapY = 4;
    var totalW = cols * bw + (cols - 1) * gapX;
    var startX = (400 - totalW) / 2;
    var startY = 30;

    for (var i = 0; i < bottles.length; i++) {
      var row = Math.floor(i / 4);
      var col = i % 4;
      var bx = startX + col * (bw + gapX);
      var by = startY + row * (bh + gapY);
      if (pos.x >= bx && pos.x <= bx + bw && pos.y >= by && pos.y <= by + bh) {
        if (this.glassTotal < this.maxCapacity && !this.mixed) {
          this.pouring = true;
          this.pouringDrink = bottles[i];
          this.pouringBottleIdx = i;
        }
        return;
      }
    }
  },

  mouseUp: function(e) {
    this.pouring = false;
  },

  mouseMove: function(e) {
    this.hoverPos = this.getCanvasPos(e);
  },

  click: function(e) {
    var pos = this.getCanvasPos(e);

    if (this.state === 'menu') {
      // START MIXING button (centered, y=300-345)
      if (pos.x >= 115 && pos.x <= 285 && pos.y >= 300 && pos.y <= 345) {
        this.startMixing();
      }
      return;
    }

    if (this.state === 'tasting') {
      // MIX ANOTHER (y=405-440)
      if (pos.x >= 30 && pos.x <= 190 && pos.y >= 405 && pos.y <= 440) {
        this.startMixing();
        return;
      }
      // MENU (y=405-440)
      if (pos.x >= 210 && pos.x <= 370 && pos.y >= 405 && pos.y <= 440) {
        this.state = 'menu';
        return;
      }
      return;
    }

    if (this.state !== 'mixing' || this.shaking) return;

    // Category tabs (y=0-25)
    var tabW = Math.floor(400 / this.categories.length);
    for (var ti = 0; ti < this.categories.length; ti++) {
      var tx = ti * tabW;
      if (pos.x >= tx && pos.x <= tx + tabW && pos.y >= 0 && pos.y <= 25) {
        this.selectedCategory = ti;
        return;
      }
    }

    // Buttons (y=315-340)
    var btnY = 315, btnH = 25;
    // ICE
    if (pos.x >= 10 && pos.x <= 95 && pos.y >= btnY && pos.y <= btnY + btnH) {
      this.toggleIce();
      return;
    }
    // TASTE
    if (pos.x >= 105 && pos.x <= 190 && pos.y >= btnY && pos.y <= btnY + btnH) {
      if (this.glassTotal > 0) this.tasteDrink();
      return;
    }
    // MIX
    if (pos.x >= 200 && pos.x <= 285 && pos.y >= btnY && pos.y <= btnY + btnH) {
      if (this.glassTotal > 0 && !this.mixed) {
        this.shaking = true;
        this.shakeTimer = 40;
        if (typeof SFX !== 'undefined') SFX.whoosh();
      }
      return;
    }
    // RESET
    if (pos.x >= 295 && pos.x <= 380 && pos.y >= btnY && pos.y <= btnY + btnH) {
      this.glass = [];
      this.glassTotal = 0;
      this.mixed = false;
      this.mixedColor = null;
      this.pourStream = [];
      this.hasIce = false;
      this.iceCubes = [];
      return;
    }
  },

  getCategoryDrinks: function() {
    var catId = this.categories[this.selectedCategory].id;
    return this.drinks.filter(function(d) { return d.type === catId; });
  },

  // --- UPDATE LOOP ---

  loop: function() {
    this.update();
    this.draw();
    this.animFrame = requestAnimationFrame(function() { BartenderGame.loop(); });
  },

  update: function() {
    this.frameCount++;

    // Pour momentum
    if (this.state === 'mixing' && !this.mixed) {
      if (this.pouring && this.pouringDrink) {
        this.pourVelocity = Math.min(this.pourVelocity + this.pourAccel, this.pourMax);
      } else if (this.pourVelocity > 0) {
        this.pourVelocity = Math.max(this.pourVelocity - this.pourDecel, 0);
        if (this.pourVelocity === 0) {
          this.pouringDrink = null;
        }
      }

      if (this.pourVelocity > 0 && this.pouringDrink && this.glassTotal < this.maxCapacity) {
        var pourAmt = Math.min(this.pourVelocity, this.maxCapacity - this.glassTotal);
        var found = false;
        for (var gi = 0; gi < this.glass.length; gi++) {
          if (this.glass[gi].id === this.pouringDrink.id) {
            this.glass[gi].amount += pourAmt;
            found = true;
            break;
          }
        }
        if (!found) {
          this.glass.push({ id: this.pouringDrink.id, amount: pourAmt });
        }
        this.glassTotal += pourAmt;

        // Splash droplets
        var spawnChance = this.pourVelocity / this.pourMax;
        if (Math.random() < spawnChance * 0.6) {
          var gx = 140, gy = 110, gw = 120, gh = 180;
          var fillLevel = this.glassTotal / this.maxCapacity;
          var surfaceY = gy + gh - 2 - fillLevel * (gh - 4);
          this.pourStream.push({
            x: gx + gw / 2 + (Math.random() - 0.5) * 10,
            y: surfaceY,
            vx: (Math.random() - 0.5) * 3,
            vy: -(1 + Math.random() * 2),
            color: this.pouringDrink.color,
            life: 12 + Math.random() * 8,
            size: 1.5 + Math.random() * 1.5,
          });
          if (typeof SFX !== 'undefined' && this.frameCount % 9 === 0) SFX.pour();
        }
      }
    }

    // Splash particles
    var newStream = [];
    for (var psi = 0; psi < this.pourStream.length; psi++) {
      var ps = this.pourStream[psi];
      ps.x += ps.vx;
      ps.y += ps.vy;
      ps.vy += 0.15;
      ps.life--;
      if (ps.life > 0) newStream.push(ps);
    }
    this.pourStream = newStream;

    // Shake animation
    if (this.shaking) {
      this.shakeTimer--;
      this.shakeOffset = (Math.random() - 0.5) * 8;
      if (this.shakeTimer <= 0) {
        this.shaking = false;
        this.shakeOffset = 0;
        this.mixed = true;
        this.mixedColor = this.blendGlassColors();
      }
    }
  },

  // --- DRAWING ---

  draw: function() {
    var ctx = this.ctx;
    var W = this.canvas.width;
    var H = this.canvas.height;

    ctx.fillStyle = '#0f0f23';
    ctx.fillRect(0, 0, W, H);

    if (this.state === 'menu') { this.drawMenu(ctx, W, H); return; }
    if (this.state === 'tasting') { this.drawTasting(ctx, W, H); return; }

    // Mixing state
    this.drawCategoryTabs(ctx, W);
    this.drawBottleGrid(ctx, W);
    this.drawGlass(ctx, W);
    this.drawMixButtons(ctx, W);
    this.drawContents(ctx, W);
    this.drawHint(ctx, W);
    this.drawPourStream(ctx);
  },

  drawMenu: function(ctx, W, H) {
    ctx.textAlign = 'center';

    // Title
    ctx.fillStyle = '#48dbfb';
    ctx.font = 'bold 34px system-ui';
    ctx.fillText('\u{1F378} Bartender', W / 2, 120);

    ctx.fillStyle = '#aaa';
    ctx.font = '14px system-ui';
    ctx.fillText('Mix creative drinks from 50 ingredients!', W / 2, 160);
    ctx.fillText('Get a taste evaluation for each creation', W / 2, 185);
    ctx.fillText('Discover classic cocktail recipes', W / 2, 210);

    // Decorative
    ctx.font = '40px system-ui';
    ctx.fillText('\u{1F379} \u{1F943} \u{1F37E}', W / 2, 270);

    // Start button
    ctx.fillStyle = '#48dbfb';
    ctx.beginPath();
    ctx.roundRect(115, 300, 170, 45, 8);
    ctx.fill();
    ctx.fillStyle = '#0f0f23';
    ctx.font = 'bold 18px system-ui';
    ctx.fillText('START MIXING', W / 2, 329);
  },

  drawCategoryTabs: function(ctx, W) {
    var tabW = Math.floor(W / this.categories.length);
    for (var i = 0; i < this.categories.length; i++) {
      var tx = i * tabW;
      var selected = (i === this.selectedCategory);
      ctx.fillStyle = selected ? '#48dbfb' : 'rgba(255,255,255,0.06)';
      ctx.fillRect(tx, 0, tabW - 1, 24);
      ctx.fillStyle = selected ? '#0f0f23' : '#888';
      ctx.font = (selected ? 'bold ' : '') + '10px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(this.categories[i].label, tx + tabW / 2, 16);
    }
  },

  drawBottleGrid: function(ctx, W) {
    var bottles = this.getCategoryDrinks();
    var cols = Math.min(bottles.length, 4);
    var rows = Math.ceil(bottles.length / 4);
    var bw = 88, bh = 28, gapX = 6, gapY = 4;
    var totalW = cols * bw + (cols - 1) * gapX;
    var startX = (W - totalW) / 2;
    var startY = 30;

    for (var i = 0; i < bottles.length; i++) {
      var b = bottles[i];
      var row = Math.floor(i / 4);
      var col = i % 4;
      var bx = startX + col * (bw + gapX);
      var by = startY + row * (bh + gapY);
      var isPouringThis = this.pouringDrink && this.pouringDrink.id === b.id && this.pourVelocity > 0;

      // Background
      ctx.fillStyle = isPouringThis ? b.color : 'rgba(255,255,255,0.06)';
      ctx.beginPath();
      ctx.roundRect(bx, by, bw, bh, 4);
      ctx.fill();
      ctx.strokeStyle = b.color;
      ctx.lineWidth = isPouringThis ? 2 : 1;
      ctx.stroke();

      // Icon + name
      ctx.fillStyle = isPouringThis ? '#0f0f23' : '#ccc';
      ctx.font = '10px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(b.icon + ' ' + b.name, bx + bw / 2, by + 18);
    }
  },

  drawGlass: function(ctx, W) {
    var gx = 140, gy = 110, gw = 120, gh = 180;
    var shakeX = this.shaking ? this.shakeOffset : 0;

    ctx.save();
    ctx.translate(shakeX, 0);

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.moveTo(gx - 5, gy);
    ctx.lineTo(gx - 15, gy + gh + 5);
    ctx.lineTo(gx + gw + 15, gy + gh + 5);
    ctx.lineTo(gx + gw + 5, gy);
    ctx.closePath();
    ctx.fill();

    // Glass body (trapezoid)
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(gx, gy);
    ctx.lineTo(gx - 10, gy + gh);
    ctx.lineTo(gx + gw + 10, gy + gh);
    ctx.lineTo(gx + gw, gy);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Fill layers
    if (this.glassTotal > 0) {
      var fillH = (this.glassTotal / this.maxCapacity) * (gh - 4);
      var fillY = gy + gh - 2 - fillH;

      if (this.mixed && this.mixedColor) {
        ctx.fillStyle = this.mixedColor;
        var topW = gw + 10 * (1 - (fillY - gy) / gh);
        var botW = gw + 10;
        var topX = gx + gw / 2 - topW / 2;
        var botX = gx - 5;
        ctx.beginPath();
        ctx.moveTo(topX, fillY);
        ctx.lineTo(botX, gy + gh - 2);
        ctx.lineTo(botX + botW, gy + gh - 2);
        ctx.lineTo(topX + topW, fillY);
        ctx.closePath();
        ctx.fill();
      } else {
        var layerY = gy + gh - 2;
        for (var li = 0; li < this.glass.length; li++) {
          var layer = this.glass[li];
          var drink = this.drinks.find(function(d) { return d.id === layer.id; });
          if (!drink) continue;
          var layerH = (layer.amount / this.maxCapacity) * (gh - 4);
          var layerTop = layerY - layerH;
          var fracBot = (layerY - gy) / gh;
          var fracTop = (layerTop - gy) / gh;
          var wBot = gw + 10 * fracBot;
          var wTop = gw + 10 * fracTop;
          var xBot = gx + gw / 2 - wBot / 2;
          var xTop = gx + gw / 2 - wTop / 2;
          ctx.fillStyle = drink.color;
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

    // Ice cubes
    if (this.hasIce && this.iceCubes.length > 0) {
      var iceBaseH = Math.max(30, (this.glassTotal / this.maxCapacity) * (gh - 4));
      var iceBaseTop = gy + gh - 2 - iceBaseH;
      for (var ci = 0; ci < this.iceCubes.length; ci++) {
        var cube = this.iceCubes[ci];
        var bob = Math.sin(this.frameCount * 0.03 + cube.bobPhase) * 2;
        var cubeX = gx + 15 + cube.x * (gw - 30);
        var cubeY = iceBaseTop + 5 + cube.y * iceBaseH * 0.5 + bob;
        var s = 7 * cube.size;
        ctx.save();
        ctx.translate(cubeX, cubeY);
        ctx.rotate(cube.rot + Math.sin(this.frameCount * 0.02 + cube.bobPhase) * 0.08);
        ctx.fillStyle = 'rgba(200, 235, 255, 0.5)';
        ctx.fillRect(-s, -s, s * 2, s * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(-s, -s, s * 0.8, s * 0.8);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(-s, -s, s * 2, s * 2);
        ctx.restore();
      }
    }

    // Glass shine
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.beginPath();
    ctx.moveTo(gx + 5, gy + 5);
    ctx.lineTo(gx + 0, gy + gh - 10);
    ctx.lineTo(gx + 18, gy + gh - 10);
    ctx.lineTo(gx + 22, gy + 5);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    // Fill label
    ctx.fillStyle = '#aaa';
    ctx.font = '11px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(Math.round(this.glassTotal) + '/' + this.maxCapacity + ' ml', gx + gw / 2, gy + gh + 16);

    if (this.mixed) {
      ctx.fillStyle = '#2ecc71';
      ctx.font = '10px system-ui';
      ctx.fillText('MIXED', gx + gw / 2, gy + gh + 28);
    }

    // Slots indicator
    ctx.fillStyle = '#666';
    ctx.font = '9px system-ui';
    ctx.fillText(this.glass.length + ' ingredients', gx + gw / 2, gy - 8);
  },

  drawMixButtons: function(ctx, W) {
    var btnY = 315, btnH = 25;
    var buttons = [
      { x: 10, w: 85, label: '\u{1F9CA} ICE', color: this.hasIce ? '#00d4ff' : '#445', enabled: true },
      { x: 105, w: 85, label: '\u{1F445} TASTE', color: '#feca57', enabled: this.glassTotal > 0 },
      { x: 200, w: 85, label: '\u{1F943} MIX', color: '#48dbfb', enabled: this.glassTotal > 0 && !this.mixed },
      { x: 295, w: 85, label: '\u{1F5D1} RESET', color: '#ff6b6b', enabled: this.glassTotal > 0 },
    ];

    for (var i = 0; i < buttons.length; i++) {
      var btn = buttons[i];
      ctx.fillStyle = btn.enabled ? btn.color : 'rgba(100,100,100,0.3)';
      ctx.beginPath();
      ctx.roundRect(btn.x, btnY, btn.w, btnH, 6);
      ctx.fill();
      ctx.fillStyle = btn.enabled ? '#0f0f23' : '#555';
      ctx.font = 'bold 11px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(btn.label, btn.x + btn.w / 2, btnY + 17);
    }
  },

  drawContents: function(ctx, W) {
    if (this.glass.length === 0) return;
    ctx.fillStyle = '#888';
    ctx.font = '9px system-ui';
    ctx.textAlign = 'left';
    var x = 15, y = 355;
    var parts = [];
    for (var i = 0; i < this.glass.length; i++) {
      var g = this.glass[i];
      var drink = this.drinks.find(function(d) { return d.id === g.id; });
      if (drink) parts.push(drink.name + ' ' + Math.round(g.amount) + 'ml');
    }
    var str = parts.join(' + ');
    // Truncate if too long
    if (ctx.measureText(str).width > 370) {
      while (ctx.measureText(str + '...').width > 370 && str.length > 0) {
        str = str.slice(0, -1);
      }
      str += '...';
    }
    ctx.fillText(str, x, y);

    // Second line if needed (slot usage)
    ctx.fillStyle = '#555';
    ctx.fillText(this.glass.length + ' ingredients used', x, y + 14);
  },

  drawHint: function(ctx, W) {
    ctx.fillStyle = '#444';
    ctx.font = '10px system-ui';
    ctx.textAlign = 'center';
    var hint;
    if (this.glassTotal === 0) {
      hint = 'Click & hold a bottle to pour. Mix up to 6 ingredients!';
    } else if (!this.mixed && this.glass.length >= 2) {
      hint = 'MIX to blend colors, or TASTE to get your evaluation!';
    } else if (this.mixed) {
      hint = 'Ready! Hit TASTE to see what you made.';
    } else {
      hint = 'Add more ingredients or TASTE what you have!';
    }
    ctx.fillText(hint, W / 2, 395);
  },

  drawPourStream: function(ctx) {
    if (this.pourVelocity > 0 && this.pouringDrink) {
      // Calculate bottle position
      var bottles = this.getCategoryDrinks();
      var cols = Math.min(bottles.length, 4);
      var bw = 88, gapX = 6;
      var totalW = cols * bw + (cols - 1) * gapX;
      var startX = (400 - totalW) / 2;
      var row = Math.floor(this.pouringBottleIdx / 4);
      var col = this.pouringBottleIdx % 4;
      var bx = startX + col * (bw + gapX) + bw / 2;
      var streamTop = 30 + row * 32 + 28;

      // Glass target
      var gx = 140, gy = 110, gh = 180;
      var fillLevel = this.glassTotal / this.maxCapacity;
      var streamBot = gy + gh - 2 - fillLevel * (gh - 4);

      var velFrac = this.pourVelocity / this.pourMax;
      var streamWidth = 2 + velFrac * 4;

      ctx.fillStyle = this.pouringDrink.color;
      ctx.globalAlpha = 0.7 + velFrac * 0.3;

      var steps = 14;
      var stepH = (streamBot - streamTop) / steps;
      // Target X is glass center
      var targetX = 200;

      ctx.beginPath();
      for (var si = 0; si <= steps; si++) {
        var t = si / steps;
        var y = streamTop + si * stepH;
        var x = bx + (targetX - bx) * (t * t); // parabolic path
        var widthAtT = streamWidth * (1 - t * 0.3 + (t > 0.85 ? (t - 0.85) * 3 : 0));
        var wobble = Math.sin(this.frameCount * 0.15 + t * 6) * velFrac * 1.5;
        if (si === 0) ctx.moveTo(x + wobble - widthAtT / 2, y);
        else ctx.lineTo(x + wobble - widthAtT / 2, y);
      }
      for (var si = steps; si >= 0; si--) {
        var t = si / steps;
        var y = streamTop + si * stepH;
        var x = bx + (targetX - bx) * (t * t);
        var widthAtT = streamWidth * (1 - t * 0.3 + (t > 0.85 ? (t - 0.85) * 3 : 0));
        var wobble = Math.sin(this.frameCount * 0.15 + t * 6) * velFrac * 1.5;
        ctx.lineTo(x + wobble + widthAtT / 2, y);
      }
      ctx.closePath();
      ctx.fill();

      // Highlight
      ctx.globalAlpha = 0.3 * velFrac;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      for (var si = 0; si <= steps; si++) {
        var t = si / steps;
        var y = streamTop + si * stepH;
        var x = bx + (targetX - bx) * (t * t);
        var wobble = Math.sin(this.frameCount * 0.15 + t * 6) * velFrac * 1.5;
        if (si === 0) ctx.moveTo(x + wobble - 0.5, y);
        else ctx.lineTo(x + wobble - 0.5, y);
      }
      for (var si = steps; si >= 0; si--) {
        var t = si / steps;
        var y = streamTop + si * stepH;
        var x = bx + (targetX - bx) * (t * t);
        var wobble = Math.sin(this.frameCount * 0.15 + t * 6) * velFrac * 1.5;
        ctx.lineTo(x + wobble + 0.5, y);
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

  drawTasting: function(ctx, W, H) {
    var r = this.tastingResult;
    if (!r) return;
    ctx.textAlign = 'center';

    // Drink name
    ctx.fillStyle = '#feca57';
    ctx.font = 'bold 26px system-ui';
    ctx.fillText(r.name, W / 2, 40);

    // Special combo badge
    var badgeY = 60;
    if (r.combo) {
      ctx.fillStyle = '#2ecc71';
      ctx.font = '12px system-ui';
      ctx.fillText(r.combo.icon + ' Classic Cocktail Detected!', W / 2, badgeY);
      badgeY += 16;
    }
    if (r.iced) {
      ctx.fillStyle = '#00d4ff';
      ctx.font = '12px system-ui';
      ctx.fillText('\u{1F9CA} On the Rocks', W / 2, badgeY);
      badgeY += 16;
    }

    // Stars
    var starY = badgeY + 12;
    ctx.font = '28px system-ui';
    var fullStars = Math.floor(r.rating);
    var halfStar = (r.rating % 1) >= 0.5;
    var starStr = '';
    for (var s = 0; s < fullStars; s++) starStr += '\u2605';
    if (halfStar) starStr += '\u00BD';
    ctx.fillStyle = '#feca57';
    ctx.fillText(starStr, W / 2 - 15, starY);
    ctx.font = 'bold 18px system-ui';
    ctx.fillStyle = '#fff';
    ctx.fillText(r.rating.toFixed(1), W / 2 + 50, starY - 2);

    // Mini glass preview
    var mgx = W / 2 - 25, mgy = starY + 15, mgw = 50, mgh = 70;
    ctx.fillStyle = r.color;
    ctx.beginPath();
    ctx.moveTo(mgx, mgy);
    ctx.lineTo(mgx - 4, mgy + mgh);
    ctx.lineTo(mgx + mgw + 4, mgy + mgh);
    ctx.lineTo(mgx + mgw, mgy);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Description (word-wrapped)
    ctx.fillStyle = '#ccc';
    ctx.font = '12px system-ui';
    ctx.textAlign = 'center';
    var descY = starY + mgh + 30;
    var linesUsed = this.wrapText(ctx, r.description, W / 2, descY, 340, 18);

    // Vibe badge
    var vibeY = descY + linesUsed * 18 + 15;
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.beginPath();
    ctx.roundRect(W / 2 - 90, vibeY - 14, 180, 30, 8);
    ctx.fill();
    ctx.fillStyle = '#48dbfb';
    ctx.font = 'bold 13px system-ui';
    ctx.fillText(r.vibe.emoji + ' ' + r.vibe.label, W / 2, vibeY + 5);

    // Flavor radar (small)
    var radarY = vibeY + 40;
    var radarR = 35;
    var cx = W / 2, cy = radarY + radarR;
    // Background circles
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 0.5;
    for (var ring = 1; ring <= 3; ring++) {
      ctx.beginPath();
      ctx.arc(cx, cy, radarR * ring / 3, 0, Math.PI * 2);
      ctx.stroke();
    }
    // Flavor polygon
    ctx.beginPath();
    for (var fi = 0; fi < 10; fi++) {
      var angle = (fi / 10) * Math.PI * 2 - Math.PI / 2;
      var val = r.profile[fi] / 10;
      var px = cx + Math.cos(angle) * radarR * val;
      var py = cy + Math.sin(angle) * radarR * val;
      if (fi === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(72, 219, 251, 0.2)';
    ctx.fill();
    ctx.strokeStyle = '#48dbfb';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // Labels
    ctx.font = '7px system-ui';
    ctx.fillStyle = '#777';
    for (var fi = 0; fi < 10; fi++) {
      var angle = (fi / 10) * Math.PI * 2 - Math.PI / 2;
      var lx = cx + Math.cos(angle) * (radarR + 14);
      var ly = cy + Math.sin(angle) * (radarR + 14);
      ctx.fillText(this.flavorNames[fi].charAt(0).toUpperCase() + this.flavorNames[fi].slice(1, 3), lx, ly + 3);
    }

    // Buttons
    var btnY = 405;
    ctx.fillStyle = '#48dbfb';
    ctx.beginPath();
    ctx.roundRect(30, btnY, 160, 35, 8);
    ctx.fill();
    ctx.fillStyle = '#0f0f23';
    ctx.font = 'bold 13px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('MIX ANOTHER', 110, btnY + 23);

    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.beginPath();
    ctx.roundRect(210, btnY, 160, 35, 8);
    ctx.fill();
    ctx.fillStyle = '#aaa';
    ctx.fillText('MENU', 290, btnY + 23);
  },
};
