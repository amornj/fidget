const games = {
  snake: SnakeGame,
  slime: SlimeGame,
  golf: GolfGame,
  baseball: BaseballGame,
  clicker: ClickerGame,
  breakout: BreakoutGame,
  flappy: FlappyGame,
  pong: PongGame,
  reaction: ReactionGame,
};

let currentGame = null;

const menu = document.getElementById('menu');
const gameContainer = document.getElementById('game-container');
const gameCanvas = document.getElementById('game-canvas');
const gameTitle = document.getElementById('game-title');
const gameScore = document.getElementById('game-score');
const gameInstructions = document.getElementById('game-instructions');
const backBtn = document.getElementById('back-btn');

// Game card clicks
document.querySelectorAll('.game-card').forEach(card => {
  card.addEventListener('click', () => {
    const gameKey = card.dataset.game;
    startGame(gameKey);
  });
});

// Back button
backBtn.addEventListener('click', () => {
  stopGame();
});

function startGame(key) {
  const game = games[key];
  if (!game) return;

  menu.style.display = 'none';
  gameContainer.style.display = 'flex';
  gameTitle.textContent = game.name;
  gameScore.textContent = '';
  gameInstructions.textContent = game.instructions;

  // Resize canvas to fit
  gameCanvas.width = 400;
  gameCanvas.height = 460;

  currentGame = game;
  game.onScore = (score) => {
    gameScore.textContent = score;
  };
  game.init(gameCanvas);
  gameCanvas.focus();
}

function stopGame() {
  if (currentGame) {
    currentGame.destroy();
    currentGame = null;
  }
  gameContainer.style.display = 'none';
  menu.style.display = 'flex';
}

// ESC to go back
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && currentGame) {
    stopGame();
  }
});
