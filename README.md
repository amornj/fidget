# 🎮 Fidget!

A Chrome extension packed with 11 mini-games — perfect for quick breaks.

## Games

| Game | Controls | Description |
|------|----------|-------------|
| 🐍 **Snake** | WASD / Arrows | Classic snake with speed & wall settings |
| 🏐 **Slime Volley** | A/D + W | 1v1 volleyball against AI |
| ⛳ **Mini Golf** | Click & drag | 5 holes with obstacles and par scoring |
| ⚾ **Baseball** | SPACE | Time your swing to hit pitches |
| 👆 **Clicker** | Mouse | Idle clicker with 6 upgrade tiers |
| 🧱 **Breakout** | Mouse | Brick breaker with levels and lives |
| 🐤 **Flappy** | Click / SPACE | Dodge pipes, beat your high score |
| 🏓 **Pong** | Mouse | Classic pong vs AI with rally tracking |
| ⚡ **Reaction** | Click / SPACE | Reaction time tester with stats |
| 🔥 **Powergolf** | Click & drag, 1-3 / right-click | 15-hole golf with 13 powerup abilities |
| ☕ **Barista** | Mouse | Pour, mix & serve drinks across 8 rounds |

## Install

1. Go to `chrome://extensions`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked**
4. Select the `fidget/` folder

## Structure

```
fidget/
├── manifest.json
├── popup.html
├── css/style.css
├── icons/
└── js/
    ├── popup.js
    ├── sfx.js
    └── games/
        ├── snake.js
        ├── slime.js
        ├── golf.js
        ├── baseball.js
        ├── clicker.js
        ├── breakout.js
        ├── flappy.js
        ├── pong.js
        ├── reaction.js
        ├── powergolf.js
        └── barista.js
```

## License

MIT
