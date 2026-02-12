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
  water: [],
  rocks: [],
  extraHoles: [],
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
  frameCount: 0,

  // Abilities
  abilities: [],
  maxAbilities: 3,
  activeAbility: null,

  // Trail effect
  trail: [],

  // Particles
  particles: [],

  // Special state for new powerups
  teleportMode: false,
  atomizerMode: false,
  phantomActive: false,
  clampTimer: 0,
  clampOrigR: 12,
  invertTimer: 0,
  foresightPaths: null,
  foresightTimer: 0,
  revolverFail: false,
  revolverTimer: 0,
  revolverSavePos: null,
  shards: [],
  lastDryPos: null,
  inWater: false,

  // Ability animations
  clubAnim: null,
  superShotActive: false,
  fireParticles: [],
  wrenchAnim: null,
  shovelAnim: null,
  shovelDigParticles: [],
  revolverGunAnim: null,
  atomizerGunPos: null,
  wallDissolve: [],
  foresightEyeAnim: null,

  // All 13 powerup types
  powerupTypes: [
    { id: 'supershot', name: 'Super Shot', icon: '\u{1F4A5}', color: '#ff6b6b', desc: '2x power on next shot' },
    { id: 'ghost', name: 'Ghost Ball', icon: '\u{1F47B}', color: '#a29bfe', desc: 'Pass through 1 wall' },
    { id: 'magnet', name: 'Magnet', icon: '\u{1F9F2}', color: '#48dbfb', desc: 'Ball pulls toward hole' },
    { id: 'freeze', name: 'Freeze', icon: '\u{2744}\u{FE0F}', color: '#74b9ff', desc: 'Stop ball instantly' },
    { id: 'multiball', name: 'Bomb Shot', icon: '\u{1F4A3}', color: '#ff9f43', desc: 'Blast through walls' },
    { id: 'curve', name: 'Curve Ball', icon: '\u{1F300}', color: '#ff9ff3', desc: 'Ball curves toward hole' },
    { id: 'teleport', name: 'Teleporter', icon: '\u{1F300}', color: '#00d2d3', desc: 'Click to teleport ball' },
    { id: 'shovel', name: 'Shovel', icon: '\u{1F573}\u{FE0F}', color: '#8b6914', desc: 'Spawn a second hole' },
    { id: 'clamp', name: 'Reverse Clamp', icon: '\u{1F512}', color: '#00cec9', desc: 'Enlarge hole for 8s' },
    { id: 'phantom', name: 'Phantom Shot', icon: '\u{1F441}\u{FE0F}', color: '#6c5ce7', desc: 'Preview trajectory' },
    { id: 'foresight', name: 'Foresight', icon: '\u{1F52E}', color: '#e056fd', desc: 'See all possible paths' },
    { id: 'atomizer', name: 'Atomizer', icon: '\u{269B}\u{FE0F}', color: '#fd79a8', desc: 'Click to delete a wall' },
    { id: 'revolver', name: 'Revolver', icon: '\u{1F52B}', color: '#636e72', desc: 'Sink or shatter' },
  ],

  levels: [
    // Level 1 - straight shot
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
    // Level 2 - L shape
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
    // Level 3 - zigzag
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
    // Level 4 - obstacles
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
    // Level 5 - tight squeeze
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
    // Level 6 - winding path
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
    // Level 7 - Water Hazard
    {
      ball: { x: 70, y: 400 },
      hole: { x: 340, y: 70 },
      walls: [
        { x: 30, y: 30, w: 360, h: 10 },
        { x: 30, y: 430, w: 360, h: 10 },
        { x: 30, y: 30, w: 10, h: 410 },
        { x: 380, y: 30, w: 10, h: 410 },
        { x: 180, y: 150, w: 10, h: 120, moveX: 1, moveRange: 60, moveSpeed: 0.02 },
        { x: 120, y: 320, w: 150, h: 10 },
      ],
      water: [
        { x: 100, y: 200, w: 220, h: 60 },
        { x: 250, y: 100, w: 80, h: 50 },
      ],
      pickups: [{ x: 70, y: 200 }, { x: 330, y: 300 }, { x: 200, y: 100 }],
    },
    // Level 8 - Shifting Maze
    {
      ball: { x: 60, y: 400 },
      hole: { x: 350, y: 60 },
      walls: [
        { x: 30, y: 30, w: 360, h: 10 },
        { x: 30, y: 430, w: 360, h: 10 },
        { x: 30, y: 30, w: 10, h: 410 },
        { x: 380, y: 30, w: 10, h: 410 },
        { x: 120, y: 80, w: 10, h: 100, moveY: 1, moveRange: 50, moveSpeed: 0.015 },
        { x: 200, y: 180, w: 10, h: 100, moveY: 1, moveRange: 40, moveSpeed: 0.025 },
        { x: 280, y: 80, w: 10, h: 120, moveY: 1, moveRange: 60, moveSpeed: 0.018 },
        { x: 160, y: 300, w: 10, h: 80, moveY: 1, moveRange: 30, moveSpeed: 0.03 },
        { x: 320, y: 250, w: 10, h: 100, moveY: 1, moveRange: 50, moveSpeed: 0.02 },
      ],
      pickups: [{ x: 80, y: 250 }, { x: 240, y: 130 }, { x: 350, y: 350 }, { x: 160, y: 380 }],
    },
    // Level 9 - Rock Garden
    {
      ball: { x: 200, y: 400 },
      hole: { x: 200, y: 80 },
      walls: [
        { x: 30, y: 30, w: 360, h: 10 },
        { x: 30, y: 430, w: 360, h: 10 },
        { x: 30, y: 30, w: 10, h: 410 },
        { x: 380, y: 30, w: 10, h: 410 },
        { x: 150, y: 200, w: 100, h: 10 },
      ],
      water: [
        { x: 40, y: 40, w: 50, h: 390 },
        { x: 330, y: 40, w: 50, h: 390 },
      ],
      rocks: [
        { x: 140, y: 150, r: 18 },
        { x: 260, y: 150, r: 18 },
        { x: 200, y: 250, r: 22 },
        { x: 130, y: 320, r: 15 },
        { x: 270, y: 320, r: 15 },
        { x: 200, y: 380, r: 12 },
      ],
      pickups: [{ x: 110, y: 100 }, { x: 290, y: 100 }, { x: 200, y: 300 }],
    },
    // Level 10 - Gauntlet
    {
      ball: { x: 60, y: 410 },
      hole: { x: 350, y: 60 },
      walls: [
        { x: 30, y: 30, w: 360, h: 10 },
        { x: 30, y: 430, w: 360, h: 10 },
        { x: 30, y: 30, w: 10, h: 410 },
        { x: 380, y: 30, w: 10, h: 410 },
        // Narrow corridors
        { x: 100, y: 350, w: 10, h: 90 },
        { x: 100, y: 250, w: 10, h: 60 },
        { x: 160, y: 300, w: 10, h: 100, moveY: 1, moveRange: 30, moveSpeed: 0.025 },
        { x: 220, y: 200, w: 10, h: 120, moveY: 1, moveRange: 40, moveSpeed: 0.02 },
        { x: 280, y: 100, w: 10, h: 150 },
        { x: 280, y: 300, w: 10, h: 80, moveY: 1, moveRange: 25, moveSpeed: 0.03 },
        { x: 340, y: 150, w: 10, h: 80, moveY: 1, moveRange: 35, moveSpeed: 0.022 },
        { x: 140, y: 150, w: 80, h: 10, moveX: 1, moveRange: 30, moveSpeed: 0.02 },
      ],
      water: [
        { x: 110, y: 350, w: 45, h: 40 },
        { x: 230, y: 120, w: 45, h: 50 },
      ],
      rocks: [
        { x: 180, y: 380, r: 14 },
        { x: 320, y: 250, r: 16 },
        { x: 130, y: 200, r: 12 },
      ],
      pickups: [
        { x: 60, y: 300 },
        { x: 140, y: 400 },
        { x: 200, y: 260 },
        { x: 310, y: 180 },
        { x: 350, y: 350 },
      ],
    },
    // Level 11 - The Funnel
    {
      ball: { x: 60, y: 60 },
      hole: { x: 350, y: 400 },
      walls: [
        { x: 30, y: 30, w: 360, h: 10 },
        { x: 30, y: 430, w: 360, h: 10 },
        { x: 30, y: 30, w: 10, h: 410 },
        { x: 380, y: 30, w: 10, h: 410 },
        // Diagonal corridor walls narrowing to bottleneck
        { x: 80, y: 100, w: 120, h: 10 },
        { x: 220, y: 80, w: 10, h: 80 },
        { x: 140, y: 200, w: 10, h: 100, moveX: 1, moveRange: 35, moveSpeed: 0.02 },
        { x: 260, y: 180, w: 10, h: 120, moveX: 1, moveRange: 30, moveSpeed: 0.025 },
        { x: 180, y: 340, w: 10, h: 60, moveY: 1, moveRange: 20, moveSpeed: 0.03 },
        { x: 240, y: 320, w: 10, h: 80 },
      ],
      water: [
        { x: 40, y: 120, w: 80, h: 50 },
      ],
      rocks: [
        { x: 170, y: 150, r: 14 },
        { x: 300, y: 250, r: 16 },
        { x: 210, y: 380, r: 12 },
      ],
      pickups: [{ x: 120, y: 60 }, { x: 300, y: 120 }, { x: 200, y: 270 }, { x: 330, y: 360 }],
    },
    // Level 12 - Pinball Alley
    {
      ball: { x: 200, y: 410 },
      hole: { x: 200, y: 60 },
      walls: [
        { x: 30, y: 30, w: 360, h: 10 },
        { x: 30, y: 430, w: 360, h: 10 },
        { x: 30, y: 30, w: 10, h: 410 },
        { x: 380, y: 30, w: 10, h: 410 },
        // Flipper walls
        { x: 80, y: 360, w: 60, h: 10, moveX: 1, moveRange: 25, moveSpeed: 0.035 },
        { x: 270, y: 360, w: 60, h: 10, moveX: 1, moveRange: 25, moveSpeed: 0.035 },
        { x: 160, y: 180, w: 80, h: 10, moveY: 1, moveRange: 20, moveSpeed: 0.02 },
      ],
      water: [
        { x: 40, y: 150, w: 30, h: 200 },
        { x: 345, y: 150, w: 30, h: 200 },
      ],
      rocks: [
        { x: 120, y: 120, r: 14 },
        { x: 280, y: 120, r: 14 },
        { x: 200, y: 160, r: 16 },
        { x: 140, y: 240, r: 12 },
        { x: 260, y: 240, r: 12 },
        { x: 200, y: 300, r: 15 },
        { x: 100, y: 300, r: 13 },
        { x: 300, y: 300, r: 13 },
      ],
      pickups: [{ x: 80, y: 80 }, { x: 320, y: 80 }, { x: 200, y: 220 }, { x: 120, y: 380 }, { x: 280, y: 380 }],
    },
    // Level 13 - The Maze Runner
    {
      ball: { x: 60, y: 410 },
      hole: { x: 350, y: 60 },
      walls: [
        { x: 30, y: 30, w: 360, h: 10 },
        { x: 30, y: 430, w: 360, h: 10 },
        { x: 30, y: 30, w: 10, h: 410 },
        { x: 380, y: 30, w: 10, h: 410 },
        // Dense shifting maze
        { x: 100, y: 30, w: 10, h: 120, moveY: 1, moveRange: 30, moveSpeed: 0.02 },
        { x: 180, y: 100, w: 10, h: 100, moveY: 1, moveRange: 25, moveSpeed: 0.028 },
        { x: 100, y: 200, w: 120, h: 10, moveX: 1, moveRange: 40, moveSpeed: 0.018 },
        { x: 260, y: 80, w: 10, h: 130, moveY: 1, moveRange: 35, moveSpeed: 0.022 },
        { x: 160, y: 280, w: 10, h: 100, moveY: 1, moveRange: 20, moveSpeed: 0.03 },
        { x: 300, y: 250, w: 10, h: 80, moveY: 1, moveRange: 30, moveSpeed: 0.025 },
        { x: 220, y: 330, w: 10, h: 100 },
        { x: 80, y: 340, w: 80, h: 10, moveX: 1, moveRange: 25, moveSpeed: 0.02 },
        { x: 300, y: 370, w: 80, h: 10 },
      ],
      water: [
        { x: 110, y: 150, w: 60, h: 40 },
        { x: 270, y: 340, w: 50, h: 40 },
        { x: 50, y: 270, w: 40, h: 50 },
      ],
      pickups: [{ x: 60, y: 120 }, { x: 230, y: 60 }, { x: 140, y: 250 }, { x: 340, y: 200 }, { x: 300, y: 410 }],
    },
    // Level 14 - Whirlpool
    {
      ball: { x: 60, y: 400 },
      hole: { x: 200, y: 230 },
      walls: [
        { x: 30, y: 30, w: 360, h: 10 },
        { x: 30, y: 430, w: 360, h: 10 },
        { x: 30, y: 30, w: 10, h: 410 },
        { x: 380, y: 30, w: 10, h: 410 },
        // Circular perimeter of moving walls
        { x: 100, y: 80, w: 10, h: 80, moveY: 1, moveRange: 30, moveSpeed: 0.025 },
        { x: 300, y: 80, w: 10, h: 80, moveY: 1, moveRange: 30, moveSpeed: 0.025 },
        { x: 140, y: 60, w: 120, h: 10, moveX: 1, moveRange: 20, moveSpeed: 0.02 },
        { x: 100, y: 320, w: 10, h: 80, moveY: 1, moveRange: 25, moveSpeed: 0.03 },
        { x: 300, y: 320, w: 10, h: 80, moveY: 1, moveRange: 25, moveSpeed: 0.03 },
        { x: 140, y: 390, w: 120, h: 10, moveX: 1, moveRange: 20, moveSpeed: 0.02 },
        { x: 60, y: 180, w: 10, h: 100, moveY: 1, moveRange: 35, moveSpeed: 0.018 },
        { x: 340, y: 180, w: 10, h: 100, moveY: 1, moveRange: 35, moveSpeed: 0.018 },
      ],
      water: [
        // Central water ring around hole
        { x: 150, y: 180, w: 100, h: 20 },
        { x: 150, y: 260, w: 100, h: 20 },
        { x: 145, y: 200, w: 20, h: 60 },
        { x: 240, y: 200, w: 20, h: 60 },
      ],
      rocks: [
        { x: 130, y: 140, r: 14 },
        { x: 270, y: 140, r: 14 },
        { x: 130, y: 320, r: 14 },
        { x: 270, y: 320, r: 14 },
      ],
      pickups: [{ x: 60, y: 80 }, { x: 350, y: 80 }, { x: 200, y: 140 }, { x: 60, y: 300 }, { x: 350, y: 400 }],
    },
    // Level 15 - Nightmare
    {
      ball: { x: 60, y: 410 },
      hole: { x: 350, y: 60 },
      walls: [
        { x: 30, y: 30, w: 360, h: 10 },
        { x: 30, y: 430, w: 360, h: 10 },
        { x: 30, y: 30, w: 10, h: 410 },
        { x: 380, y: 30, w: 10, h: 410 },
        // Dense moving wall maze
        { x: 90, y: 60, w: 10, h: 100, moveY: 1, moveRange: 40, moveSpeed: 0.03 },
        { x: 170, y: 40, w: 10, h: 80, moveY: 1, moveRange: 30, moveSpeed: 0.025 },
        { x: 250, y: 60, w: 10, h: 120, moveY: 1, moveRange: 35, moveSpeed: 0.028 },
        { x: 330, y: 100, w: 10, h: 60, moveY: 1, moveRange: 25, moveSpeed: 0.035 },
        { x: 120, y: 200, w: 80, h: 10, moveX: 1, moveRange: 40, moveSpeed: 0.022 },
        { x: 230, y: 220, w: 10, h: 100, moveY: 1, moveRange: 30, moveSpeed: 0.03 },
        { x: 300, y: 250, w: 10, h: 80, moveY: 1, moveRange: 35, moveSpeed: 0.02 },
        { x: 80, y: 300, w: 10, h: 90, moveY: 1, moveRange: 30, moveSpeed: 0.028 },
        { x: 160, y: 330, w: 80, h: 10, moveX: 1, moveRange: 30, moveSpeed: 0.025 },
        { x: 280, y: 370, w: 10, h: 60, moveY: 1, moveRange: 20, moveSpeed: 0.035 },
        { x: 60, y: 160, w: 60, h: 10, moveX: 1, moveRange: 25, moveSpeed: 0.02 },
        { x: 340, y: 340, w: 40, h: 10, moveX: 1, moveRange: 15, moveSpeed: 0.04 },
      ],
      water: [
        { x: 100, y: 120, w: 60, h: 40 },
        { x: 260, y: 160, w: 50, h: 40 },
        { x: 50, y: 350, w: 60, h: 40 },
        { x: 310, y: 300, w: 60, h: 35 },
      ],
      rocks: [
        { x: 140, y: 100, r: 12 },
        { x: 210, y: 160, r: 14 },
        { x: 310, y: 180, r: 12 },
        { x: 120, y: 270, r: 15 },
        { x: 270, y: 290, r: 13 },
        { x: 180, y: 380, r: 14 },
        { x: 350, y: 400, r: 11 },
      ],
      pickups: [
        { x: 60, y: 100 },
        { x: 200, y: 100 },
        { x: 340, y: 150 },
        { x: 150, y: 250 },
        { x: 340, y: 280 },
        { x: 200, y: 400 },
      ],
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
    this.teleportMode = false;
    this.atomizerMode = false;
    this.phantomActive = false;
    this.clampTimer = 0;
    this.invertTimer = 0;
    this.foresightPaths = null;
    this.foresightTimer = 0;
    this.revolverFail = false;
    this.revolverTimer = 0;
    this.revolverSavePos = null;
    this.shards = [];
    this.extraHoles = [];
    this.lastDryPos = null;
    this.inWater = false;
    this.frameCount = 0;
    this.clubAnim = null;
    this.superShotActive = false;
    this.fireParticles = [];
    this.wrenchAnim = null;
    this.shovelAnim = null;
    this.shovelDigParticles = [];
    this.revolverGunAnim = null;
    this.atomizerGunPos = null;
    this.wallDissolve = [];
    this.foresightEyeAnim = null;
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
    this.ball = { ...lvl.ball, vx: 0, vy: 0, r: 8, ghost: false, ghostHits: 0, bomb: false, magnet: false, curve: false, revolver: false };
    this.hole = { ...lvl.hole, r: 12 };
    this.clampOrigR = 12;
    this.clampTimer = 0;
    this.walls = lvl.walls.map(function(w) {
      var obj = { x: w.x, y: w.y, w: w.w, h: w.h, destroyed: false };
      if (w.moveX) {
        obj.moveX = w.moveX;
        obj.origX = w.x;
        obj.moveRange = w.moveRange || 0;
        obj.moveSpeed = w.moveSpeed || 0.02;
      }
      if (w.moveY) {
        obj.moveY = w.moveY;
        obj.origY = w.y;
        obj.moveRange = w.moveRange || 0;
        obj.moveSpeed = w.moveSpeed || 0.02;
      }
      return obj;
    });
    this.water = (lvl.water || []).map(function(wt) {
      return { x: wt.x, y: wt.y, w: wt.w, h: wt.h };
    });
    this.rocks = (lvl.rocks || []).map(function(rk) {
      return { x: rk.x, y: rk.y, r: rk.r };
    });
    this.strokes = 0;
    this.sunk = false;
    this.trail = [];
    this.activeAbility = null;
    this.teleportMode = false;
    this.atomizerMode = false;
    this.phantomActive = false;
    this.extraHoles = [];
    this.revolverFail = false;
    this.revolverTimer = 0;
    this.revolverSavePos = null;
    this.shards = [];
    this.lastDryPos = { x: this.ball.x, y: this.ball.y };
    this.inWater = false;
    this.foresightPaths = null;
    this.foresightTimer = 0;
    this.invertTimer = 0;
    this.clubAnim = null;
    this.superShotActive = false;
    this.fireParticles = [];
    this.wrenchAnim = null;
    this.shovelAnim = null;
    this.shovelDigParticles = [];
    this.revolverGunAnim = null;
    this.atomizerGunPos = null;
    this.wallDissolve = [];
    this.foresightEyeAnim = null;

    // Spawn pickups with random types
    this.pickups = (lvl.pickups || []).map(function(p) {
      return {
        x: p.x,
        y: p.y,
        type: PowerGolfGame.powerupTypes[Math.floor(Math.random() * PowerGolfGame.powerupTypes.length)],
        collected: false,
        bobPhase: Math.random() * Math.PI * 2,
      };
    });

    this.message = 'Hole ' + (this.level + 1);
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
    var ability = this.abilities[index];
    if (typeof SFX !== 'undefined') SFX.powerup();

    if (ability.id === 'freeze' && this.ballMoving()) {
      this.ball.vx = 0;
      this.ball.vy = 0;
      this.spawnParticles(this.ball.x, this.ball.y, ability.color, 15);
      this.abilities.splice(index, 1);
      this.message = 'Freeze!';
      this.messageTimer = 40;
      return;
    }

    if (ability.id === 'teleport') {
      this.teleportMode = true;
      this.atomizerMode = false;
      this.activeAbility = { id: ability.id, name: ability.name, icon: ability.icon, color: ability.color, fromIndex: index };
      this.message = 'Click to teleport!';
      this.messageTimer = 60;
      return;
    }

    if (ability.id === 'atomizer') {
      this.atomizerMode = true;
      this.teleportMode = false;
      this.activeAbility = { id: ability.id, name: ability.name, icon: ability.icon, color: ability.color, fromIndex: index };
      this.message = 'Click a wall to destroy!';
      this.messageTimer = 60;
      return;
    }

    if (ability.id === 'shovel') {
      // Spawn a second hole near the ball
      var angle = Math.random() * Math.PI * 2;
      var nx = this.ball.x + Math.cos(angle) * 30;
      var ny = this.ball.y + Math.sin(angle) * 30;
      // Exclusion: cannot spawn within 60px of real hole
      var dhx = nx - this.hole.x;
      var dhy = ny - this.hole.y;
      if (Math.sqrt(dhx * dhx + dhy * dhy) < 60) {
        // Push it away from the hole
        var awayAngle = Math.atan2(ny - this.hole.y, nx - this.hole.x);
        nx = this.hole.x + Math.cos(awayAngle) * 65;
        ny = this.hole.y + Math.sin(awayAngle) * 65;
      }
      // Keep within bounds
      nx = Math.max(50, Math.min(360, nx));
      ny = Math.max(50, Math.min(420, ny));
      this.extraHoles.push({ x: nx, y: ny, r: 10 });
      this.spawnParticles(nx, ny, '#8b6914', 12);
      this.shovelAnim = { timer: 30, x: nx, y: ny };
      // Spawn dirt particles biased upward
      for (var di = 0; di < 15; di++) {
        this.shovelDigParticles.push({
          x: nx, y: ny,
          vx: (Math.random() - 0.5) * 4,
          vy: -Math.random() * 5 - 1,
          life: 20 + Math.random() * 10,
          color: ['#8b6914', '#a0822a', '#6b4f10'][Math.floor(Math.random() * 3)],
        });
      }
      this.abilities.splice(index, 1);
      this.message = 'Extra hole dug!';
      this.messageTimer = 40;
      return;
    }

    if (ability.id === 'clamp') {
      this.clampTimer = 480;
      this.hole.r = this.clampOrigR * 2.5;
      this.spawnParticles(this.hole.x, this.hole.y, '#00cec9', 15);
      this.wrenchAnim = { timer: 40, x: this.hole.x, y: this.hole.y, rotation: 0 };
      this.abilities.splice(index, 1);
      this.message = 'Hole enlarged!';
      this.messageTimer = 40;
      return;
    }

    if (ability.id === 'phantom') {
      this.phantomActive = true;
      this.abilities.splice(index, 1);
      this.message = 'Phantom preview active!';
      this.messageTimer = 40;
      return;
    }

    if (ability.id === 'foresight') {
      // Flash invert
      this.invertTimer = 10;
      // Compute paths for all angles
      this.foresightPaths = [];
      for (var deg = 0; deg < 360; deg += 2) {
        var rad = deg * Math.PI / 180;
        var speed = 6;
        var path = this.simulatePath(this.ball.x, this.ball.y, Math.cos(rad) * speed, Math.sin(rad) * speed, 80);
        // Compute min distance to hole for glow brightness
        var minHoleDist = 99999;
        for (var pi = 0; pi < path.length; pi++) {
          var pdx = path[pi].x - this.hole.x;
          var pdy = path[pi].y - this.hole.y;
          var pd = Math.sqrt(pdx * pdx + pdy * pdy);
          if (pd < minHoleDist) minHoleDist = pd;
        }
        path.minHoleDist = minHoleDist;
        path.angle = rad;
        this.foresightPaths.push(path);
      }
      // Find the best path (closest to hole)
      this.foresightBestIdx = 0;
      var bestDist = 99999;
      for (var bi = 0; bi < this.foresightPaths.length; bi++) {
        if (this.foresightPaths[bi].minHoleDist < bestDist) {
          bestDist = this.foresightPaths[bi].minHoleDist;
          this.foresightBestIdx = bi;
        }
      }
      this.foresightTimer = 480; // 8 seconds total (best path uses full duration)
      this.spawnParticles(this.ball.x, this.ball.y, '#e056fd', 20);
      this.foresightEyeAnim = { timer: 30, x: this.ball.x, y: this.ball.y, scale: 0 };
      this.abilities.splice(index, 1);
      this.message = 'Foresight!';
      this.messageTimer = 40;
      return;
    }

    if (ability.id === 'revolver') {
      this.activeAbility = { id: ability.id, name: ability.name, icon: ability.icon, color: ability.color, fromIndex: index };
      this.message = 'Sink or shatter!';
      this.messageTimer = 60;
      return;
    }

    // Default: supershot, ghost, multiball, magnet, curve
    this.activeAbility = { id: ability.id, name: ability.name, icon: ability.icon, color: ability.color, fromIndex: index };
    this.message = ability.name + ' ready!';
    this.messageTimer = 40;
  },

  consumeActiveAbility() {
    if (this.activeAbility) {
      var idx = this.activeAbility.fromIndex;
      if (idx < this.abilities.length) {
        this.abilities.splice(idx, 1);
      }
      var consumed = this.activeAbility;
      this.activeAbility = null;
      return consumed;
    }
    return null;
  },

  simulatePath(sx, sy, svx, svy, steps) {
    var path = [];
    var bx = sx;
    var by = sy;
    var vx = svx;
    var vy = svy;
    var friction = 0.985;
    for (var s = 0; s < steps; s++) {
      vx *= friction;
      vy *= friction;
      if (Math.abs(vx) < 0.1) vx = 0;
      if (Math.abs(vy) < 0.1) vy = 0;
      bx += vx;
      by += vy;
      // Wall collisions for simulation
      for (var wi = 0; wi < this.walls.length; wi++) {
        var w = this.walls[wi];
        if (w.destroyed) continue;
        var closestX = Math.max(w.x, Math.min(bx, w.x + w.w));
        var closestY = Math.max(w.y, Math.min(by, w.y + w.h));
        var dx = bx - closestX;
        var dy = by - closestY;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 8) {
          if (dist === 0) {
            bx = w.x - 8;
            vx = -Math.abs(vx) * 0.7;
          } else {
            var overlap = 8 - dist;
            var nx = dx / dist;
            var ny = dy / dist;
            bx += nx * overlap;
            by += ny * overlap;
            var dot = vx * nx + vy * ny;
            vx -= 2 * dot * nx;
            vy -= 2 * dot * ny;
            vx *= 0.7;
            vy *= 0.7;
          }
        }
      }
      // Rock collisions for simulation
      for (var ri = 0; ri < this.rocks.length; ri++) {
        var rk = this.rocks[ri];
        var rdx = bx - rk.x;
        var rdy = by - rk.y;
        var rdist = Math.sqrt(rdx * rdx + rdy * rdy);
        if (rdist < rk.r + 8) {
          if (rdist > 0) {
            var rnx = rdx / rdist;
            var rny = rdy / rdist;
            bx = rk.x + rnx * (rk.r + 8);
            by = rk.y + rny * (rk.r + 8);
            var rdot = vx * rnx + vy * rny;
            vx -= 2 * rdot * rnx;
            vy -= 2 * rdot * rny;
            vx *= 1.2;
            vy *= 1.2;
          }
        }
      }
      path.push({ x: bx, y: by });
      if (Math.abs(vx) < 0.1 && Math.abs(vy) < 0.1) break;
    }
    return path;
  },

  getCanvasPos(e) {
    var rect = this.canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (this.canvas.width / rect.width),
      y: (e.clientY - rect.top) * (this.canvas.height / rect.height),
    };
  },

  mouseDown(e) {
    if (e.button !== 0) return;
    if (this.revolverFail) return;
    var pos = this.getCanvasPos(e);

    // Atomizer mode: click on a wall to destroy it
    if (this.atomizerMode) {
      for (var i = 0; i < this.walls.length; i++) {
        var w = this.walls[i];
        if (w.destroyed || w.dissolving) continue;
        if (pos.x >= w.x && pos.x <= w.x + w.w && pos.y >= w.y && pos.y <= w.y + w.h) {
          // Start dissolve animation instead of instant destroy
          w.dissolving = true;
          this.wallDissolve.push({ wallIdx: i, timer: 30, maxTimer: 30 });
          // Spawn dust particles
          var wcx = w.x + w.w / 2;
          var wcy = w.y + w.h / 2;
          for (var dp = 0; dp < 20; dp++) {
            this.particles.push({
              x: wcx + (Math.random() - 0.5) * w.w,
              y: wcy + (Math.random() - 0.5) * w.h,
              vx: (Math.random() - 0.5) * 3,
              vy: (Math.random() - 0.5) * 3,
              color: ['#fd79a8', '#999', '#ddd'][Math.floor(Math.random() * 3)],
              life: 20 + Math.random() * 10,
            });
          }
          if (typeof SFX !== 'undefined') SFX.explode();
          this.message = 'Wall dissolving!';
          this.messageTimer = 40;
          this.atomizerMode = false;
          this.atomizerGunPos = null;
          this.consumeActiveAbility();
          return;
        }
      }
      // Clicked but missed a wall - do nothing, stay in atomizer mode
      return;
    }

    // Teleport mode: click anywhere to teleport
    if (this.teleportMode) {
      // Exclusion: cannot teleport within 50px of hole
      var thx = pos.x - this.hole.x;
      var thy = pos.y - this.hole.y;
      if (Math.sqrt(thx * thx + thy * thy) < 50) {
        this.message = 'Too close to hole!';
        this.messageTimer = 30;
        return;
      }
      // Keep within bounds
      var tx = Math.max(50, Math.min(360, pos.x));
      var ty = Math.max(50, Math.min(420, pos.y));
      this.spawnParticles(this.ball.x, this.ball.y, '#00d2d3', 15);
      this.ball.x = tx;
      this.ball.y = ty;
      this.ball.vx = 0;
      this.ball.vy = 0;
      this.spawnParticles(tx, ty, '#00d2d3', 15);
      if (typeof SFX !== 'undefined') SFX.teleport();
      this.teleportMode = false;
      this.consumeActiveAbility();
      this.message = 'Teleported!';
      this.messageTimer = 30;
      this.lastDryPos = { x: tx, y: ty };
      return;
    }

    if (this.sunk || this.ballMoving()) return;
    var dx = pos.x - this.ball.x;
    var dy = pos.y - this.ball.y;
    if (Math.sqrt(dx * dx + dy * dy) < 30) {
      this.dragging = true;
      this.dragStart = pos;
      this.dragEnd = pos;
      this.clubAnim = { phase: 'windup', timer: 0, angle: 0 };
    }
  },

  foresightSnappedIdx: -1,

  mouseMove(e) {
    var pos = this.getCanvasPos(e);
    if (this.atomizerMode) {
      this.atomizerGunPos = pos;
    }
    if (this.dragging) {
      this.dragEnd = pos;
      // Snap to nearest foresight path if available
      this.foresightSnappedIdx = -1;
      if (this.foresightPaths && this.foresightTimer > 0) {
        var dx = this.dragEnd.x - this.dragStart.x;
        var dy = this.dragEnd.y - this.dragStart.y;
        if (Math.sqrt(dx * dx + dy * dy) > 10) {
          var dragAngle = Math.atan2(dy, dx);
          var bestDist = 99999;
          var bestIdx = -1;
          for (var si = 0; si < this.foresightPaths.length; si++) {
            var fp = this.foresightPaths[si];
            var angleDiff = Math.abs(dragAngle - fp.angle);
            // Normalize to [-PI, PI]
            if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;
            if (angleDiff < bestDist) {
              bestDist = angleDiff;
              bestIdx = si;
            }
          }
          // Snap if within ~5 degrees
          if (bestDist < 0.09 && bestIdx >= 0) {
            this.foresightSnappedIdx = bestIdx;
          }
        }
      }
    }
  },

  mouseUp(e) {
    if (e.button !== 0 || !this.dragging) return;
    this.dragging = false;
    var end = this.getCanvasPos(e);
    var dx = end.x - this.dragStart.x;
    var dy = end.y - this.dragStart.y;
    var power = Math.min(Math.sqrt(dx * dx + dy * dy), 150);
    var angle = Math.atan2(dy, dx);

    // Snap to foresight path if one is highlighted
    if (this.foresightSnappedIdx >= 0 && this.foresightPaths && this.foresightTimer > 0) {
      angle = this.foresightPaths[this.foresightSnappedIdx].angle;
      this.foresightSnappedIdx = -1;
    }

    // Club strike animation
    this.clubAnim = { phase: 'strike', timer: 12, angle: angle };
    if (typeof SFX !== 'undefined') SFX.swing();

    // Apply abilities on shot
    var usedAbility = null;
    if (this.activeAbility && this.activeAbility.id === 'supershot') {
      power *= 2;
      usedAbility = this.consumeActiveAbility();
      this.spawnParticles(this.ball.x, this.ball.y, '#ff6b6b', 20);
      this.superShotActive = true;
      if (typeof SFX !== 'undefined') SFX.whoosh();
    } else if (this.activeAbility && this.activeAbility.id === 'revolver') {
      usedAbility = this.consumeActiveAbility();
      this.ball.revolver = true;
      this.revolverSavePos = { x: this.ball.x, y: this.ball.y };
      this.revolverGunAnim = { timer: 20, x: this.ball.x, y: this.ball.y, angle: angle };
      if (typeof SFX !== 'undefined') SFX.explode();
    } else if (this.activeAbility && ['ghost', 'multiball', 'magnet', 'curve'].indexOf(this.activeAbility.id) !== -1) {
      usedAbility = this.consumeActiveAbility();
    }

    // Consume phantom preview
    if (this.phantomActive) {
      this.phantomActive = false;
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

    // Store dry position before shot
    this.lastDryPos = { x: this.ball.x, y: this.ball.y };
    this.inWater = false;

    if (typeof SFX !== 'undefined') SFX.hit();
    this.updateScore();
  },

  ballMoving() {
    return Math.abs(this.ball.vx) > 0.1 || Math.abs(this.ball.vy) > 0.1;
  },

  spawnParticles(x, y, color, count) {
    for (var i = 0; i < count; i++) {
      this.particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 5,
        vy: (Math.random() - 0.5) * 5,
        color: color,
        life: 20 + Math.random() * 15,
      });
    }
  },

  updateScore() {
    if (typeof this.onScore === 'function') {
      this.onScore('Hole ' + (this.level + 1) + ' | Strokes: ' + this.strokes + ' | Total: ' + this.totalStrokes);
    }
  },

  loop() {
    this.update();
    this.draw();
    this.animFrame = requestAnimationFrame(function() { PowerGolfGame.loop(); });
  },

  update() {
    this.frameCount++;
    if (this.messageTimer > 0) this.messageTimer--;
    if (this.invertTimer > 0) this.invertTimer--;
    if (this.foresightTimer > 0) this.foresightTimer--;

    // Clamp timer
    if (this.clampTimer > 0) {
      this.clampTimer--;
      if (this.clampTimer <= 0) {
        this.hole.r = this.clampOrigR;
      }
    }

    // Particles
    var newParticles = [];
    for (var pi = 0; pi < this.particles.length; pi++) {
      var p = this.particles[pi];
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.96;
      p.vy *= 0.96;
      p.life--;
      if (p.life > 0) newParticles.push(p);
    }
    this.particles = newParticles;

    // Shards update
    var newShards = [];
    for (var si = 0; si < this.shards.length; si++) {
      var sh = this.shards[si];
      sh.x += sh.vx;
      sh.y += sh.vy;
      sh.vy += 0.15;
      sh.rot += sh.vrot;
      sh.life--;
      if (sh.life > 0) newShards.push(sh);
    }
    this.shards = newShards;

    // Club animation update
    if (this.clubAnim) {
      if (this.clubAnim.phase === 'windup') {
        this.clubAnim.timer++;
      } else if (this.clubAnim.phase === 'strike') {
        this.clubAnim.timer--;
        if (this.clubAnim.timer <= 0) this.clubAnim = null;
      }
    }

    // Super shot fire trail
    if (this.superShotActive && this.ballMoving()) {
      for (var fpi = 0; fpi < 3; fpi++) {
        this.fireParticles.push({
          x: this.ball.x + (Math.random() - 0.5) * 6,
          y: this.ball.y + (Math.random() - 0.5) * 6,
          vx: -this.ball.vx * 0.3 + (Math.random() - 0.5) * 2,
          vy: -this.ball.vy * 0.3 + (Math.random() - 0.5) * 2,
          life: 12 + Math.random() * 8,
          color: ['#ff6b6b', '#ff9f43', '#feca57'][Math.floor(Math.random() * 3)],
        });
      }
    }
    if (!this.ballMoving() && this.superShotActive) {
      this.superShotActive = false;
    }
    var newFire = [];
    for (var ffi = 0; ffi < this.fireParticles.length; ffi++) {
      var fp = this.fireParticles[ffi];
      fp.x += fp.vx;
      fp.y += fp.vy;
      fp.vx *= 0.92;
      fp.vy *= 0.92;
      fp.life--;
      if (fp.life > 0) newFire.push(fp);
    }
    this.fireParticles = newFire;

    // Wrench animation
    if (this.wrenchAnim) {
      this.wrenchAnim.timer--;
      this.wrenchAnim.rotation += 0.15;
      if (this.wrenchAnim.timer <= 0) this.wrenchAnim = null;
    }

    // Shovel animation + dig particles
    if (this.shovelAnim) {
      this.shovelAnim.timer--;
      if (this.shovelAnim.timer <= 0) this.shovelAnim = null;
    }
    var newDigP = [];
    for (var dpi = 0; dpi < this.shovelDigParticles.length; dpi++) {
      var dp = this.shovelDigParticles[dpi];
      dp.x += dp.vx;
      dp.y += dp.vy;
      dp.vy += 0.2;
      dp.life--;
      if (dp.life > 0) newDigP.push(dp);
    }
    this.shovelDigParticles = newDigP;

    // Revolver gun animation
    if (this.revolverGunAnim) {
      this.revolverGunAnim.timer--;
      if (this.revolverGunAnim.timer <= 0) this.revolverGunAnim = null;
    }

    // Wall dissolve
    var newDissolve = [];
    for (var wdi = 0; wdi < this.wallDissolve.length; wdi++) {
      var wd = this.wallDissolve[wdi];
      wd.timer--;
      if (wd.timer <= 0) {
        this.walls[wd.wallIdx].destroyed = true;
        this.walls[wd.wallIdx].dissolving = false;
      } else {
        newDissolve.push(wd);
      }
    }
    this.wallDissolve = newDissolve;

    // Foresight eye animation
    if (this.foresightEyeAnim) {
      this.foresightEyeAnim.timer--;
      if (this.foresightEyeAnim.timer > 15) {
        this.foresightEyeAnim.scale = (30 - this.foresightEyeAnim.timer) / 15 * 2.0;
      }
      if (this.foresightEyeAnim.timer <= 0) this.foresightEyeAnim = null;
    }

    // Revolver fail sequence
    if (this.revolverFail) {
      this.revolverTimer--;
      if (this.revolverTimer <= 0 && this.shards.length === 0) {
        // First trigger: spawn shards
        if (!this.revolverShattered) {
          this.revolverShattered = true;
          this.revolverTimer = 60;
          if (typeof SFX !== 'undefined') SFX.shatter();
          // Create polygon shards
          var shardCount = 7 + Math.floor(Math.random() * 4);
          for (var sci = 0; sci < shardCount; sci++) {
            var shardAngle = (sci / shardCount) * Math.PI * 2;
            var vertCount = 5 + Math.floor(Math.random() * 3);
            var pts = [];
            for (var vi = 0; vi < vertCount; vi++) {
              var va = (vi / vertCount) * Math.PI * 2;
              var vr = 3 + Math.random() * 5;
              pts.push({ x: Math.cos(va) * vr, y: Math.sin(va) * vr });
            }
            this.shards.push({
              x: this.ball.x,
              y: this.ball.y,
              points: pts,
              vx: Math.cos(shardAngle) * (2 + Math.random() * 4),
              vy: Math.sin(shardAngle) * (2 + Math.random() * 4) - 2,
              rot: 0,
              vrot: (Math.random() - 0.5) * 0.3,
              life: 50 + Math.floor(Math.random() * 20),
              color: '#ccc',
            });
          }
          return;
        }
        // After shard timer expired
        if (this.revolverTimer <= 0) {
          this.revolverFail = false;
          this.revolverShattered = false;
          if (this.revolverSavePos) {
            this.ball.x = this.revolverSavePos.x;
            this.ball.y = this.revolverSavePos.y;
          }
          this.ball.vx = 0;
          this.ball.vy = 0;
          this.ball.revolver = false;
          this.revolverSavePos = null;
        }
      }
      return;
    }

    if (this.sunk) {
      this.sunkTimer--;
      if (this.sunkTimer <= 0) {
        this.level++;
        if (this.level >= this.levels.length) {
          this.message = 'All done! Total: ' + this.totalStrokes + ' strokes';
          this.messageTimer = 999999;
          this.level = 0;
          this.totalStrokes = 0;
          this.abilities = [];
          var self = this;
          setTimeout(function() { self.loadLevel(); }, 3000);
        } else {
          this.loadLevel();
        }
      }
      return;
    }

    // Moving walls
    for (var mwi = 0; mwi < this.walls.length; mwi++) {
      var mw = this.walls[mwi];
      if (mw.destroyed) continue;
      if (mw.moveX && mw.origX !== undefined) {
        mw.x = mw.origX + Math.sin(this.frameCount * mw.moveSpeed) * mw.moveRange;
      }
      if (mw.moveY && mw.origY !== undefined) {
        mw.y = mw.origY + Math.sin(this.frameCount * mw.moveSpeed) * mw.moveRange;
      }
    }

    var b = this.ball;
    var friction = 0.985;
    b.vx *= friction;
    b.vy *= friction;
    if (Math.abs(b.vx) < 0.1) b.vx = 0;
    if (Math.abs(b.vy) < 0.1) b.vy = 0;

    // Magnet effect
    if (b.magnet && this.ballMoving()) {
      var mdx = this.hole.x - b.x;
      var mdy = this.hole.y - b.y;
      var mdist = Math.sqrt(mdx * mdx + mdy * mdy);
      if (mdist > 5) {
        b.vx += (mdx / mdist) * 0.08;
        b.vy += (mdy / mdist) * 0.08;
      }
    }

    // Curve effect
    if (b.curve && this.ballMoving()) {
      var cdx = this.hole.x - b.x;
      var cdy = this.hole.y - b.y;
      var cdist = Math.sqrt(cdx * cdx + cdy * cdy);
      if (cdist > 10) {
        b.vx += (cdx / cdist) * 0.03;
        b.vy += (cdy / cdist) * 0.03;
      }
    }

    // Sub-step movement to prevent skipping over the hole
    var speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
    var subSteps = speed > 4 ? Math.ceil(speed / 3) : 1;
    var svx = b.vx / subSteps;
    var svy = b.vy / subSteps;
    for (var ss = 0; ss < subSteps; ss++) {
      b.x += svx;
      b.y += svy;
      // Check hole proximity during each substep — pull toward hole when close
      var pullDx = this.hole.x - b.x;
      var pullDy = this.hole.y - b.y;
      var pullDist = Math.sqrt(pullDx * pullDx + pullDy * pullDy);
      var holeR = this.hole.r;
      if (pullDist < holeR * 3 && pullDist > 0) {
        var pullStrength = 0.15 * (1 - pullDist / (holeR * 3));
        b.vx += (pullDx / pullDist) * pullStrength;
        b.vy += (pullDy / pullDist) * pullStrength;
        svx = b.vx / subSteps;
        svy = b.vy / subSteps;
      }
      // Early hole check during substeps
      if (pullDist < holeR - 2) {
        var subSpeed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
        if (subSpeed < 10) {
          this.sinkBall();
          return;
        }
      }
    }
    // Also check extra holes during substeps
    for (var ehi2 = 0; ehi2 < this.extraHoles.length; ehi2++) {
      var eh2 = this.extraHoles[ehi2];
      var ehd = Math.sqrt((b.x - eh2.x) * (b.x - eh2.x) + (b.y - eh2.y) * (b.y - eh2.y));
      if (ehd < eh2.r - 1 && Math.sqrt(b.vx * b.vx + b.vy * b.vy) < 10) {
        this.sinkBall();
        return;
      }
    }

    // Water hazards
    var currentlyInWater = false;
    for (var wti = 0; wti < this.water.length; wti++) {
      var wt = this.water[wti];
      if (b.x > wt.x && b.x < wt.x + wt.w && b.y > wt.y && b.y < wt.y + wt.h) {
        currentlyInWater = true;
        break;
      }
    }

    if (currentlyInWater) {
      if (!this.inWater) {
        // Just entered water
        this.inWater = true;
        if (typeof SFX !== 'undefined') SFX.splash();
        this.spawnParticles(b.x, b.y, '#1e90ff', 10);
      }
      // Slow ball dramatically
      b.vx *= 0.5;
      b.vy *= 0.5;
      // If ball stops in water, reset
      if (!this.ballMoving() && this.inWater) {
        if (this.lastDryPos) {
          b.x = this.lastDryPos.x;
          b.y = this.lastDryPos.y;
          b.vx = 0;
          b.vy = 0;
          this.spawnParticles(b.x, b.y, '#1e90ff', 8);
          this.message = 'Water! Reset.';
          this.messageTimer = 40;
        }
        this.inWater = false;
      }
    } else {
      if (this.inWater) {
        this.inWater = false;
      }
      // Store last dry position when ball is moving and not in water
      if (this.ballMoving()) {
        this.lastDryPos = { x: b.x, y: b.y };
      }
    }

    // Trail
    if (this.ballMoving()) {
      this.trail.push({ x: b.x, y: b.y, life: 15 });
      if (this.trail.length > 30) this.trail.shift();
    }
    var newTrail = [];
    for (var ti = 0; ti < this.trail.length; ti++) {
      this.trail[ti].life--;
      if (this.trail[ti].life > 0) newTrail.push(this.trail[ti]);
    }
    this.trail = newTrail;

    // Wall collisions
    for (var wi = 0; wi < this.walls.length; wi++) {
      var w = this.walls[wi];
      if (w.destroyed) continue;

      var closestX = Math.max(w.x, Math.min(b.x, w.x + w.w));
      var closestY = Math.max(w.y, Math.min(b.y, w.y + w.h));
      var wdx = b.x - closestX;
      var wdy = b.y - closestY;
      var wdist = Math.sqrt(wdx * wdx + wdy * wdy);

      if (wdist < b.r) {
        // Bomb - destroy wall
        if (b.bomb) {
          w.destroyed = true;
          b.bomb = false;
          // Push ball past the wall so it doesn't vanish
          b.x += b.vx * 2;
          b.y += b.vy * 2;
          this.spawnParticles(closestX, closestY, '#ff9f43', 25);
          if (typeof SFX !== 'undefined') SFX.explode();
          this.message = 'BOOM!';
          this.messageTimer = 30;
          continue;
        }

        // Ghost - pass through once
        if (b.ghost && b.ghostHits > 0) {
          b.ghostHits--;
          if (b.ghostHits <= 0) b.ghost = false;
          this.spawnParticles(closestX, closestY, '#a29bfe', 10);
          continue;
        }

        // Normal bounce
        if (wdist === 0) {
          b.x = w.x - b.r;
          b.vx = -Math.abs(b.vx) * 0.7;
        } else {
          var woverlap = b.r - wdist;
          var wnx = wdx / wdist;
          var wny = wdy / wdist;
          b.x += wnx * woverlap;
          b.y += wny * woverlap;

          var wdot = b.vx * wnx + b.vy * wny;
          b.vx -= 2 * wdot * wnx;
          b.vy -= 2 * wdot * wny;
          b.vx *= 0.7;
          b.vy *= 0.7;
        }
        if (typeof SFX !== 'undefined') SFX.bounce();
      }
    }

    // Rock collisions
    for (var ri = 0; ri < this.rocks.length; ri++) {
      var rk = this.rocks[ri];
      var rdx = b.x - rk.x;
      var rdy = b.y - rk.y;
      var rdist = Math.sqrt(rdx * rdx + rdy * rdy);
      if (rdist < rk.r + b.r) {
        if (rdist > 0) {
          var rnx = rdx / rdist;
          var rny = rdy / rdist;
          b.x = rk.x + rnx * (rk.r + b.r);
          b.y = rk.y + rny * (rk.r + b.r);
          var rdot = b.vx * rnx + b.vy * rny;
          b.vx -= 2 * rdot * rnx;
          b.vy -= 2 * rdot * rny;
          // 1.2x bumper force
          b.vx *= 1.2;
          b.vy *= 1.2;
          this.spawnParticles(rk.x + rnx * rk.r, rk.y + rny * rk.r, '#999', 5);
          if (typeof SFX !== 'undefined') SFX.bounce();
        }
      }
    }

    // Pickup collisions
    for (var pki = 0; pki < this.pickups.length; pki++) {
      var pk = this.pickups[pki];
      if (pk.collected) continue;
      var pkdx = b.x - pk.x;
      var pkdy = b.y - pk.y;
      if (Math.sqrt(pkdx * pkdx + pkdy * pkdy) < 18) {
        pk.collected = true;
        if (this.abilities.length < this.maxAbilities) {
          this.abilities.push({ id: pk.type.id, name: pk.type.name, icon: pk.type.icon, color: pk.type.color, desc: pk.type.desc });
          this.message = 'Got ' + pk.type.icon + ' ' + pk.type.name + '!';
          if (typeof SFX !== 'undefined') SFX.collect();
        } else {
          this.message = 'Inventory full!';
        }
        this.messageTimer = 50;
        this.spawnParticles(pk.x, pk.y, pk.type.color, 12);
      }
    }

    // Hole check (main hole)
    var hdx = b.x - this.hole.x;
    var hdy = b.y - this.hole.y;
    var hdist = Math.sqrt(hdx * hdx + hdy * hdy);
    var speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);

    if (hdist < this.hole.r - 2 && speed < 8) {
      this.sinkBall();
      return;
    }

    // Extra holes check (from shovel)
    for (var ehi = 0; ehi < this.extraHoles.length; ehi++) {
      var eh = this.extraHoles[ehi];
      var ehdx = b.x - eh.x;
      var ehdy = b.y - eh.y;
      var ehdist = Math.sqrt(ehdx * ehdx + ehdy * ehdy);
      if (ehdist < eh.r - 1 && speed < 8) {
        this.sinkBall();
        return;
      }
    }

    // Revolver check: ball stopped without sinking
    if (b.revolver && !this.ballMoving() && !this.sunk) {
      this.revolverFail = true;
      this.revolverTimer = 60;
      this.revolverShattered = false;
      b.vx = 0;
      b.vy = 0;
      this.message = '...';
      this.messageTimer = 120;
    }
  },

  sinkBall() {
    var b = this.ball;
    this.sunk = true;
    this.sunkTimer = 70;
    b.vx = 0;
    b.vy = 0;
    b.x = this.hole.x;
    b.y = this.hole.y;
    b.revolver = false;
    this.spawnParticles(this.hole.x, this.hole.y, '#feca57', 20);
    if (typeof SFX !== 'undefined') SFX.sink();
    var par = 3;
    var diff = this.strokes - par;
    if (this.strokes === 1) this.message = 'HOLE IN ONE!';
    else if (diff <= -2) this.message = 'Eagle!';
    else if (diff === -1) this.message = 'Birdie!';
    else if (diff === 0) this.message = 'Par!';
    else if (diff === 1) this.message = 'Bogey';
    else this.message = '+' + diff;
    this.messageTimer = 70;
  },

  draw() {
    var ctx = this.ctx;
    var canvas = this.canvas;

    // Invert flash for foresight
    if (this.invertTimer > 0) {
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'rgba(0,0,0,0.8)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      return;
    }

    // Revolver grayscale overlay
    var doGrayscale = this.revolverFail;

    ctx.fillStyle = '#1a472a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Checkerboard pattern
    ctx.fillStyle = 'rgba(0,0,0,0.05)';
    for (var i = 0; i < canvas.width; i += 20) {
      for (var j = (i % 40 === 0 ? 0 : 10); j < canvas.height; j += 20) {
        ctx.fillRect(i, j, 10, 10);
      }
    }

    // Water hazards
    for (var wti = 0; wti < this.water.length; wti++) {
      var wt = this.water[wti];
      ctx.fillStyle = 'rgba(30,100,200,0.3)';
      ctx.fillRect(wt.x, wt.y, wt.w, wt.h);
      // Animated wave lines
      ctx.strokeStyle = 'rgba(100,180,255,0.4)';
      ctx.lineWidth = 1.5;
      for (var wl = 0; wl < 3; wl++) {
        ctx.beginPath();
        var waveY = wt.y + (wl + 1) * (wt.h / 4);
        for (var wx = wt.x; wx < wt.x + wt.w; wx += 2) {
          var wy = waveY + Math.sin((wx + this.frameCount * 2 + wl * 30) * 0.05) * 3;
          if (wx === wt.x) ctx.moveTo(wx, wy);
          else ctx.lineTo(wx, wy);
        }
        ctx.stroke();
      }
    }

    // Walls
    for (var wi = 0; wi < this.walls.length; wi++) {
      var w = this.walls[wi];
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
      // Dissolving wall — fade out with decreasing opacity
      if (w.dissolving) {
        var dissolveInfo = null;
        for (var dsi = 0; dsi < this.wallDissolve.length; dsi++) {
          if (this.wallDissolve[dsi].wallIdx === wi) { dissolveInfo = this.wallDissolve[dsi]; break; }
        }
        if (dissolveInfo) {
          var dissolveAlpha = dissolveInfo.timer / dissolveInfo.maxTimer;
          ctx.save();
          ctx.globalAlpha = dissolveAlpha;
          ctx.fillStyle = '#fd79a8';
          ctx.fillRect(w.x, w.y, w.w, w.h);
          ctx.globalAlpha = 1;
          ctx.restore();
          continue;
        }
      }
      // Moving walls get a different color
      var isMoving = (w.moveX || w.moveY);
      ctx.fillStyle = isMoving ? '#4a2a10' : '#5a3a1a';
      ctx.fillRect(w.x, w.y, w.w, w.h);
      ctx.fillStyle = isMoving ? '#6a4a20' : '#7a5a2a';
      ctx.fillRect(w.x, w.y, w.w, 2);
      // Draw direction arrows on moving walls
      if (isMoving) {
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.font = '8px system-ui';
        ctx.textAlign = 'center';
        var wcx = w.x + w.w / 2;
        var wcy = w.y + w.h / 2;
        if (w.moveX) {
          ctx.fillText('\u2194', wcx, wcy + 3);
        }
        if (w.moveY) {
          ctx.fillText('\u2195', wcx, wcy + 3);
        }
      }
    }

    // Rocks
    for (var ri = 0; ri < this.rocks.length; ri++) {
      var rk = this.rocks[ri];
      var grad = ctx.createRadialGradient(rk.x - rk.r * 0.3, rk.y - rk.r * 0.3, rk.r * 0.1, rk.x, rk.y, rk.r);
      grad.addColorStop(0, '#aaa');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(rk.x, rk.y, rk.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Extra holes (from shovel)
    for (var ehi = 0; ehi < this.extraHoles.length; ehi++) {
      var eh = this.extraHoles[ehi];
      ctx.fillStyle = '#111';
      ctx.beginPath();
      ctx.arc(eh.x, eh.y, eh.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Hole
    // Clamp pulsing glow
    if (this.clampTimer > 0) {
      var pulse = 0.5 + 0.5 * Math.sin(this.frameCount * 0.1);
      ctx.shadowColor = '#00cec9';
      ctx.shadowBlur = 10 + pulse * 10;
    }
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(this.hole.x, this.hole.y, this.hole.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Flag
    ctx.fillStyle = '#ff6b6b';
    ctx.fillRect(this.hole.x, this.hole.y - 35, 1.5, 35);
    ctx.beginPath();
    ctx.moveTo(this.hole.x + 1.5, this.hole.y - 35);
    ctx.lineTo(this.hole.x + 18, this.hole.y - 28);
    ctx.lineTo(this.hole.x + 1.5, this.hole.y - 21);
    ctx.fill();

    // Foresight paths — glow brighter near hole, highlight snapped path
    // Best path persists 8 sec (bright white), others decay in 3 sec
    if (this.foresightPaths && this.foresightTimer > 0) {
      var snappedIdx = this.foresightSnappedIdx;
      var bestIdx = this.foresightBestIdx || 0;
      for (var fi = 0; fi < this.foresightPaths.length; fi++) {
        var fp = this.foresightPaths[fi];
        if (fp.length < 2) continue;
        var isBest = (fi === bestIdx);
        // Best path fades over full 480 frames (8s), others fade in first 3s (timer 480→300)
        var fadeBase;
        if (isBest) {
          fadeBase = this.foresightTimer / 480;
        } else {
          fadeBase = (this.foresightTimer - 300) / 180;
          if (fadeBase <= 0) continue;
          fadeBase = Math.min(1, fadeBase);
        }

        if (isBest) {
          // Best path: bright white (or gold when snapped), thick line with glow
          var bestSnapped = (fi === snappedIdx);
          var bestAlpha = fadeBase * 0.9;
          ctx.save();
          if (bestSnapped) {
            ctx.shadowColor = 'rgba(255,255,100,0.8)';
            ctx.shadowBlur = 16;
            ctx.strokeStyle = 'rgba(255, 255, 100, ' + bestAlpha + ')';
            ctx.lineWidth = 5;
          } else {
            ctx.shadowColor = 'rgba(255,255,255,0.6)';
            ctx.shadowBlur = 8;
            ctx.strokeStyle = 'rgba(255, 255, 255, ' + bestAlpha + ')';
            ctx.lineWidth = 3.5;
          }
          ctx.beginPath();
          ctx.moveTo(fp[0].x, fp[0].y);
          for (var fpi = 1; fpi < fp.length; fpi++) {
            ctx.lineTo(fp[fpi].x, fp[fpi].y);
          }
          ctx.stroke();
          ctx.restore();
          // Bright endpoint glow
          if (fp.length > 0) {
            ctx.save();
            ctx.shadowColor = bestSnapped ? '#ffff64' : '#fff';
            ctx.shadowBlur = bestSnapped ? 16 : 12;
            ctx.fillStyle = bestSnapped
              ? 'rgba(255, 255, 100, ' + (fadeBase * 0.9) + ')'
              : 'rgba(255, 255, 255, ' + (fadeBase * 0.7) + ')';
            ctx.beginPath();
            ctx.arc(fp[fp.length - 1].x, fp[fp.length - 1].y, bestSnapped ? 7 : 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
        } else {
          // Non-best paths: colored by angle, glow by closeness
          var hue = (fi / this.foresightPaths.length) * 360;
          var closeness = Math.max(0, 1 - (fp.minHoleDist || 999) / 300);
          var baseAlpha = 0.03 + closeness * 0.35;
          var lw = 0.8 + closeness * 2.5;
          if (fi === snappedIdx) {
            baseAlpha = 0.8;
            lw = 3;
          }
          var fAlpha = fadeBase * baseAlpha;
          ctx.strokeStyle = 'hsla(' + hue + ', 80%, ' + (50 + closeness * 30) + '%, ' + fAlpha + ')';
          ctx.lineWidth = lw;
          ctx.beginPath();
          ctx.moveTo(fp[0].x, fp[0].y);
          for (var fpi = 1; fpi < fp.length; fpi++) {
            ctx.lineTo(fp[fpi].x, fp[fpi].y);
          }
          ctx.stroke();
          // Glow endpoint for close paths
          if (closeness > 0.5 && fp.length > 0) {
            ctx.fillStyle = 'hsla(' + hue + ', 80%, 70%, ' + (fadeBase * closeness * 0.5) + ')';
            ctx.beginPath();
            ctx.arc(fp[fp.length - 1].x, fp[fp.length - 1].y, 3 + closeness * 3, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    }

    // Pickups
    for (var pki = 0; pki < this.pickups.length; pki++) {
      var pk = this.pickups[pki];
      if (pk.collected) continue;
      pk.bobPhase += 0.04;
      var bobY = Math.sin(pk.bobPhase) * 3;

      ctx.shadowColor = pk.type.color;
      ctx.shadowBlur = 12;
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.arc(pk.x, pk.y + bobY, 13, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = pk.type.color;
      ctx.globalAlpha = 0.25;
      ctx.beginPath();
      ctx.arc(pk.x, pk.y + bobY, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      ctx.font = '16px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(pk.type.icon, pk.x, pk.y + bobY + 6);
      ctx.shadowBlur = 0;
    }

    // Trail
    for (var tri = 0; tri < this.trail.length; tri++) {
      var t = this.trail[tri];
      var alpha = t.life / 15;
      var trailColor = 'rgba(255,255,255,';
      if (this.ball.ghost) trailColor = 'rgba(162,155,254,';
      else if (this.ball.magnet) trailColor = 'rgba(72,219,251,';
      else if (this.ball.curve) trailColor = 'rgba(255,159,243,';
      else if (this.ball.bomb) trailColor = 'rgba(255,159,67,';
      else if (this.ball.revolver) trailColor = 'rgba(99,110,114,';
      ctx.fillStyle = trailColor + (alpha * 0.3) + ')';
      ctx.beginPath();
      ctx.arc(t.x, t.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Ball
    if (!this.sunk && !this.revolverFail) {
      var b = this.ball;

      // Ball glow for active effects
      if (b.ghost || b.magnet || b.bomb || b.curve || b.revolver) {
        var glowColor = '#fff';
        if (b.ghost) glowColor = '#a29bfe';
        if (b.magnet) glowColor = '#48dbfb';
        if (b.bomb) glowColor = '#ff9f43';
        if (b.curve) glowColor = '#ff9ff3';
        if (b.revolver) glowColor = '#636e72';
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 12;
      }

      // Super shot pulsing glow
      if (this.superShotActive) {
        ctx.shadowColor = '#ff6b6b';
        ctx.shadowBlur = 20 + Math.sin(this.frameCount * 0.3) * 8;
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

    // Fire trail particles (super shot)
    for (var ftri = 0; ftri < this.fireParticles.length; ftri++) {
      var ftp = this.fireParticles[ftri];
      ctx.globalAlpha = ftp.life / 20;
      ctx.fillStyle = ftp.color;
      ctx.beginPath();
      ctx.arc(ftp.x, ftp.y, 2 + (ftp.life / 20) * 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Club animation
    if (this.clubAnim && !this.sunk) {
      ctx.save();
      ctx.translate(this.ball.x, this.ball.y);
      var cAngle;
      if (this.clubAnim.phase === 'windup' && this.dragging && this.dragEnd) {
        cAngle = Math.atan2(this.dragEnd.y - this.dragStart.y, this.dragEnd.x - this.dragStart.x);
        cAngle += Math.PI + Math.sin(this.clubAnim.timer * 0.15) * 0.2;
        this.clubAnim.angle = cAngle;
      } else {
        cAngle = this.clubAnim.angle;
      }
      ctx.rotate(cAngle);
      var clubAlpha = this.clubAnim.phase === 'strike' ? this.clubAnim.timer / 12 : 1;
      ctx.globalAlpha = clubAlpha;
      // Shaft
      ctx.fillStyle = '#8B6914';
      ctx.fillRect(10, -2, 35, 4);
      // Head
      ctx.fillStyle = '#ccc';
      ctx.fillRect(45, -5, 10, 10);
      ctx.globalAlpha = 1;
      ctx.restore();
    }

    // Wrench animation (clamp)
    if (this.wrenchAnim) {
      ctx.save();
      ctx.globalAlpha = this.wrenchAnim.timer / 40;
      ctx.translate(this.wrenchAnim.x, this.wrenchAnim.y - 20 - Math.sin(this.wrenchAnim.rotation * 2) * 5);
      ctx.rotate(Math.sin(this.wrenchAnim.rotation) * 0.4);
      ctx.font = '22px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('\u{1F527}', 0, 0);
      ctx.restore();
    }

    // Shovel animation
    if (this.shovelAnim) {
      ctx.save();
      var shovelBounce = Math.sin((30 - this.shovelAnim.timer) * 0.3) * 8;
      ctx.globalAlpha = this.shovelAnim.timer / 30;
      ctx.font = '20px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('\u{26CF}\u{FE0F}', this.shovelAnim.x, this.shovelAnim.y - 15 - shovelBounce);
      ctx.restore();
    }
    // Shovel dig particles
    for (var sdpi = 0; sdpi < this.shovelDigParticles.length; sdpi++) {
      var sdp = this.shovelDigParticles[sdpi];
      ctx.globalAlpha = sdp.life / 30;
      ctx.fillStyle = sdp.color;
      ctx.beginPath();
      ctx.arc(sdp.x, sdp.y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Revolver gun animation
    if (this.revolverGunAnim) {
      ctx.save();
      ctx.translate(this.revolverGunAnim.x, this.revolverGunAnim.y);
      ctx.rotate(this.revolverGunAnim.angle);
      ctx.globalAlpha = this.revolverGunAnim.timer / 20;
      // Gun barrel
      ctx.fillStyle = '#636e72';
      ctx.fillRect(8, -3, 25, 6);
      ctx.fillRect(0, -5, 12, 10);
      // Muzzle flash (first 5 frames)
      if (this.revolverGunAnim.timer > 15) {
        ctx.fillStyle = '#feca57';
        ctx.beginPath();
        ctx.arc(35, 0, 8 + Math.random() * 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(35, 0, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.restore();
    }

    // Atomizer cursor (dashed line + icon)
    if (this.atomizerMode && this.atomizerGunPos) {
      ctx.save();
      ctx.strokeStyle = 'rgba(253,121,168,0.5)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(this.ball.x, this.ball.y);
      ctx.lineTo(this.atomizerGunPos.x, this.atomizerGunPos.y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.font = '18px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('\u{269B}\u{FE0F}', this.atomizerGunPos.x, this.atomizerGunPos.y + 6);
      ctx.restore();
    }

    // Foresight eye animation
    if (this.foresightEyeAnim) {
      ctx.save();
      var eyeScale = this.foresightEyeAnim.scale || 0;
      ctx.globalAlpha = this.foresightEyeAnim.timer / 30;
      ctx.translate(this.foresightEyeAnim.x, this.foresightEyeAnim.y - 25);
      ctx.scale(eyeScale, eyeScale);
      ctx.font = '24px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('\u{1F52E}', 0, 0);
      ctx.restore();
    }

    // Phantom path preview (while dragging)
    if (this.phantomActive && this.dragging && this.dragEnd) {
      var pdx = this.dragEnd.x - this.dragStart.x;
      var pdy = this.dragEnd.y - this.dragStart.y;
      var ppower = Math.min(Math.sqrt(pdx * pdx + pdy * pdy), 150);
      var pangle = Math.atan2(pdy, pdx);
      var pvx = Math.cos(pangle) * ppower * 0.08;
      var pvy = Math.sin(pangle) * ppower * 0.08;
      var phantomPath = this.simulatePath(this.ball.x, this.ball.y, pvx, pvy, 200);

      ctx.strokeStyle = 'rgba(0,255,255,0.6)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 6]);
      if (phantomPath.length > 1) {
        ctx.beginPath();
        ctx.moveTo(this.ball.x, this.ball.y);
        for (var phi = 0; phi < phantomPath.length; phi++) {
          ctx.lineTo(phantomPath[phi].x, phantomPath[phi].y);
        }
        ctx.stroke();
      }
      ctx.setLineDash([]);
    }

    // Drag indicator
    if (this.dragging && this.dragEnd) {
      var ddx = this.dragEnd.x - this.dragStart.x;
      var ddy = this.dragEnd.y - this.dragStart.y;
      var dpower = Math.min(Math.sqrt(ddx * ddx + ddy * ddy), 150);
      var dangle = Math.atan2(ddy, ddx);
      var displayPower = this.activeAbility && this.activeAbility.id === 'supershot' ? dpower * 2 : dpower;

      ctx.strokeStyle = 'rgba(255, ' + Math.round(255 - displayPower * 1.2) + ', 50, 0.8)';
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(this.ball.x, this.ball.y);
      ctx.lineTo(
        this.ball.x + Math.cos(dangle) * dpower * 0.5,
        this.ball.y + Math.sin(dangle) * dpower * 0.5
      );
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#feca57';
      ctx.font = '12px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(Math.round(displayPower) + '%', this.ball.x, this.ball.y - 20);
    }

    // Particles
    for (var ppi = 0; ppi < this.particles.length; ppi++) {
      var pp = this.particles[ppi];
      ctx.globalAlpha = pp.life / 35;
      ctx.fillStyle = pp.color;
      ctx.beginPath();
      ctx.arc(pp.x, pp.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Shards (revolver fail)
    for (var shi = 0; shi < this.shards.length; shi++) {
      var sh = this.shards[shi];
      ctx.save();
      ctx.translate(sh.x, sh.y);
      ctx.rotate(sh.rot);
      ctx.globalAlpha = sh.life / 70;
      ctx.fillStyle = sh.color;
      ctx.beginPath();
      if (sh.points.length > 0) {
        ctx.moveTo(sh.points[0].x, sh.points[0].y);
        for (var spi = 1; spi < sh.points.length; spi++) {
          ctx.lineTo(sh.points[spi].x, sh.points[spi].y);
        }
        ctx.closePath();
      }
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.restore();
    }

    // Grayscale overlay for revolver fail
    if (doGrayscale) {
      ctx.save();
      ctx.globalCompositeOperation = 'saturation';
      ctx.fillStyle = 'hsl(0, 0%, 50%)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = 'source-over';
      ctx.restore();
    }

    // Ability bar (bottom)
    var barY = canvas.height - 42;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, barY, canvas.width, 42);

    ctx.fillStyle = '#777';
    ctx.font = '10px system-ui';
    ctx.textAlign = 'left';
    ctx.fillText('ABILITIES (1-3 or right-click)', 8, barY + 12);

    for (var ai = 0; ai < this.maxAbilities; ai++) {
      var slotX = 10 + ai * 130;
      var slotY = barY + 17;

      ctx.fillStyle = '#1a1a2e';
      ctx.strokeStyle = '#2a2a4a';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(slotX, slotY, 122, 22, 4);
      ctx.fill();
      ctx.stroke();

      if (ai < this.abilities.length) {
        var ab = this.abilities[ai];
        var isActive = this.activeAbility && this.activeAbility.fromIndex === ai;

        if (isActive) {
          ctx.strokeStyle = ab.color;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(slotX, slotY, 122, 22, 4);
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
        ctx.fillText('[' + (ai + 1) + ']', slotX + 105, slotY + 11);
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
      ctx.fillText(this.activeAbility.icon + ' ' + this.activeAbility.name + ' ACTIVE', canvas.width / 2, barY - 5);
    }

    // Teleport mode indicator
    if (this.teleportMode) {
      ctx.fillStyle = 'rgba(0,210,211,0.15)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#00d2d3';
      ctx.font = 'bold 14px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('CLICK TO TELEPORT', canvas.width / 2, 25);
    }

    // Atomizer mode indicator
    if (this.atomizerMode) {
      ctx.fillStyle = 'rgba(253,121,168,0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fd79a8';
      ctx.font = 'bold 14px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('CLICK A WALL TO DESTROY', canvas.width / 2, 25);
    }

    // Phantom active indicator
    if (this.phantomActive && !this.dragging) {
      ctx.fillStyle = '#6c5ce7';
      ctx.font = 'bold 11px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('PHANTOM: Drag to see trajectory', canvas.width / 2, 25);
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
