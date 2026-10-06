# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Tetris in vanilla JavaScript + HTML5 Canvas. No dependencies, no build step, no package.json, no tests, no linter. README and UI text are in Spanish.

## Run

- `open index.html` (macOS), or serve locally, e.g. `python3 -m http.server 8000` then open `http://localhost:8000`.
- Verify changes by playing in the browser; there is no automated test suite.

## Architecture

Three files, loaded by `index.html` via a plain `<script src="game.js">` (no modules):

- `index.html`: fixed DOM IDs that `game.js` looks up at load (`board`, `next-canvas`, `score`, `lines`, `level`, `overlay`, `overlay-title`, `overlay-score`, `restart-btn`, `theme-toggle`). Renaming any of them breaks the game.
- `style.css`: layout and theme only.
- `game.js`: all logic, module-level mutable globals (`board`, `current`, `next`, `score`, `lines`, `level`, `paused`, `gameOver`, `dropInterval`, ...), reset by `init()`.

Game flow in `game.js`:

- `init()` resets state and starts the `requestAnimationFrame` `loop()`. The restart button calls it again, so it must stay idempotent (it cancels the previous frame).
- `loop()` accumulates `dt` and moves the piece down once `dropAccum >= dropInterval`. It also calls `draw()` every frame.
- Locking chain: `lockPiece()` → `merge()` → `clearLines()` → `spawn()`. `spawn()` promotes `next`, makes a new `next`, and calls `endGame()` if the new piece collides.
- `clearLines()` owns scoring and leveling: `LINE_SCORES[cleared] * level`, level = `floor(lines/10)+1`, `dropInterval = max(100, 1000 - (level-1)*90)`.
- Soft drop gives +1 per cell, hard drop +2 per cell (in `softDrop()` / `hardDrop()`). Hard drop uses `ghostY()`.
- Board cells and piece shapes store a color index (1–7) that maps to `COLORS` and `PIECES`. 0 means empty. Keep the three arrays aligned when adding pieces (and update `randomPiece()`, which hardcodes 7).
- `collide(shape, ox, oy)` is the single collision check (walls, floor, board). Rows with `ny < 0` are allowed. Rotation (`tryRotate()`) is clockwise only, with horizontal kicks `[0,-1,1,-2,2]` and no vertical kick.
- Pause: `togglePause()` cancels the animation frame and reuses the game-over overlay. Resuming resets `lastTime` to avoid a large `dt`.
- Theme: dark by default; colors are CSS variables in `style.css` (`:root` dark, `[data-theme="light"]`). `applyTheme()` sets `data-theme`, caches the `--grid` color in `gridColor` (used by `drawGrid()`), and redraws `draw()`/`drawNext()` since paused/game-over states have no loop. The choice persists in `localStorage` key `tetris-theme`.
- Input is one `keydown` listener: arrows, `X` (rotate), `Space` (hard drop), `P` (pause).
