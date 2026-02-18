# CLAUDE.md

## Project Overview
Fidget! is a Chrome extension (Manifest V3) containing a collection of mini-games. It runs entirely in a browser popup (420x540px) with no build step, no dependencies, and no backend.

## Architecture
- **popup.html** - Entry point. Loads all scripts directly via `<script>` tags (no bundler).
- **js/popup.js** - Menu/navigation controller. Maps game keys to game objects, handles init/destroy lifecycle.
- **js/sfx.js** - Shared sound effects engine using Web Audio API. Global `SFX` object.
- **js/games/*.js** - Each game is a standalone object literal (e.g., `const SnakeGame = { ... }`) with a consistent interface.
- **css/style.css** - Single stylesheet for menu and game container chrome.
- **manifest.json** - Chrome extension manifest. Version lives here.

## Game Interface Contract
Every game object must expose:
- `name` (string) - Display name
- `instructions` (string) - Shown below canvas
- `init(canvas)` - Setup; receives the shared `<canvas>` (400x460)
- `destroy()` - Cleanup all listeners and intervals/animation frames
- `onScore(score)` - Callback set by popup.js to update score display

Games manage their own state, rendering, and input. Canvas is shared — each game gets it fresh on init.

## Key Conventions
- No build tools, no npm, no TypeScript — plain vanilla JS
- All rendering uses Canvas 2D API
- Games use `state` property for FSM ('menu' | 'playing' | 'gameover')
- Event listeners must be cleaned up in `destroy()` to prevent leaks
- Sound via `SFX.hit()`, `SFX.collect()`, etc. — never create AudioContext directly in games
- Colors follow the dark theme: background `#0f0f23`, accent `#48dbfb`, warning `#ff6b6b`

## Adding a New Game
1. Create `js/games/yourgame.js` with the game object following the interface above
2. Add a `<script>` tag in `popup.html` (before `popup.js`)
3. Add a `<button class="game-card" data-game="yourgame">` to the menu grid in `popup.html`
4. Register in `js/popup.js`: add entry to `games` object

## Current Games (18)
Snake, Slime Volley, Mini Golf, Baseball, Clicker, Breakout, Flappy, Pong, Reaction, Powergolf, Barista, Bartender, Minesweeper, UNO, Connect Four, Tic Tac Toe, Blackjack, Poker
