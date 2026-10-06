'use strict';

const COLS = 10;
const ROWS = 20;
const BLOCK = 30;

const COLORS = [
  null,
  '#4dd0e1', // I - cyan
  '#ffd54f', // O - yellow
  '#ba68c8', // T - purple
  '#81c784', // S - green
  '#e57373', // Z - red
  '#90caf9', // J - pale blue
  '#ffb74d', // L - orange
  '#f06292', // + - pink
  '#a1887f', // U - brown
  '#4db6ac', // Y - teal
  '#ffd700', // single - gold
  '#78909c', // hollow 3x3 - blue gray
  '#ef5350', // bomba - red
  '#fff176', // rayo - light yellow
  '#ce93d8', // tinte - lilac
  '#a1887f', // gravedad - brown
  '#81d4fa', // congelar - ice blue
];

const PIECES = [
  null,
  [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]], // I
  [[2, 2], [2, 2]],                               // O
  [[0, 3, 0], [3, 3, 3], [0, 0, 0]],                  // T
  [[0, 4, 4], [4, 4, 0], [0, 0, 0]],                  // S
  [[5, 5, 0], [0, 5, 5], [0, 0, 0]],                  // Z
  [[6, 0, 0], [6, 6, 6], [0, 0, 0]],                  // J
  [[0, 0, 7], [7, 7, 7], [0, 0, 0]],                  // L
  [[0, 8, 0], [8, 8, 8], [0, 8, 0]],                  // + (pentomino)
  [[9, 0, 9], [9, 9, 9], [0, 0, 0]],                  // U (pentomino)
  [[0, 0, 0, 0], [10, 10, 10, 10], [0, 10, 0, 0], [0, 0, 0, 0]], // Y (pentomino)
  [[11]],                                      // single (recompensa tras Tetris)
  [[12, 12, 12], [12, 0, 12], [12, 12, 12]],          // 3x3 hueca (reto)
  [[13]],                                      // bomba (power-up)
  [[14]],                                      // rayo (power-up)
  [[15]],                                      // tinte (power-up)
  [[16]],                                      // gravedad (power-up)
  [[17]],                                      // congelar (power-up)
];

const STANDARD_COUNT = 7;
const PENTOMINOES = [8, 9, 10];
const SINGLE = 11;
const HOLLOW = 12;
const PENTOMINO_CHANCE = 0.10;
const HOLLOW_CHANCE = 0.03;

const BOMB = 13, LIGHTNING = 14, DYE = 15, GRAVITY = 16, FREEZE = 17;
const POWERUPS = [BOMB, LIGHTNING, DYE, GRAVITY, FREEZE];
const POWER_ICONS = { [BOMB]: '💣', [LIGHTNING]: '⚡', [DYE]: '🎨', [GRAVITY]: '⬇', [FREEZE]: '❄' };
const POWERUP_EVERY = 5;       // líneas entre power-ups
const FREEZE_MS = 5000;
const FLASH_MS = 300;
const POWER_CELL_SCORE = 10;   // puntos por bloque destruido

const LINE_SCORES = [0, 100, 300, 500, 800];

const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const nextCanvas = document.getElementById('next-canvas');
const nextCtx = nextCanvas.getContext('2d');
const scoreEl = document.getElementById('score');
const linesEl = document.getElementById('lines');
const levelEl = document.getElementById('level');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlayScore = document.getElementById('overlay-score');
const restartBtn = document.getElementById('restart-btn');
const themeToggle = document.getElementById('theme-toggle');

const THEME_KEY = 'tetris-theme';
let gridColor;

let board, current, next, score, lines, level, paused, gameOver, lastTime, dropAccum, dropInterval, animId, rewardPending;
let linesSincePower, powerPending, freezeLeft, flashCells, flashLeft;

function createBoard() {
  return Array.from({ length: ROWS }, () => new Array(COLS).fill(0));
}

function makePiece(type) {
  const shape = PIECES[type].map(row => [...row]);
  return { type, shape, x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2), y: 0 };
}

function randomPiece() {
  const roll = Math.random();
  if (roll < HOLLOW_CHANCE) return makePiece(HOLLOW);
  if (roll < HOLLOW_CHANCE + PENTOMINO_CHANCE)
    return makePiece(PENTOMINOES[Math.floor(Math.random() * PENTOMINOES.length)]);
  return makePiece(Math.floor(Math.random() * STANDARD_COUNT) + 1);
}

function collide(shape, ox, oy) {
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) continue;
      const nx = ox + c;
      const ny = oy + r;
      if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
      if (ny >= 0 && board[ny][nx]) return true;
    }
  }
  return false;
}

function rotateCW(shape) {
  const rows = shape.length, cols = shape[0].length;
  const result = Array.from({ length: cols }, () => new Array(rows).fill(0));
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      result[c][rows - 1 - r] = shape[r][c];
  return result;
}

function tryRotate() {
  const rotated = rotateCW(current.shape);
  const kicks = [0, -1, 1, -2, 2];
  for (const kick of kicks) {
    if (!collide(rotated, current.x + kick, current.y)) {
      current.shape = rotated;
      current.x += kick;
      return;
    }
  }
}

function merge() {
  for (let r = 0; r < current.shape.length; r++)
    for (let c = 0; c < current.shape[r].length; c++)
      if (current.shape[r][c])
        board[current.y + r][current.x + c] = current.shape[r][c];
}

function clearLines() {
  let cleared = 0;
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[r].every(v => v !== 0)) {
      board.splice(r, 1);
      board.unshift(new Array(COLS).fill(0));
      cleared++;
      r++;
    }
  }
  if (cleared === 4) rewardPending = true;
  if (cleared) {
    linesSincePower += cleared;
    if (linesSincePower >= POWERUP_EVERY) {
      linesSincePower -= POWERUP_EVERY;
      powerPending = true;
    }
    lines += cleared;
    score += (LINE_SCORES[cleared] || 0) * level;
    level = Math.floor(lines / 10) + 1;
    dropInterval = Math.max(100, 1000 - (level - 1) * 90);
    updateHUD();
  }
}

function ghostY() {
  let gy = current.y;
  while (!collide(current.shape, current.x, gy + 1)) gy++;
  return gy;
}

function hardDrop() {
  const gy = ghostY();
  score += (gy - current.y) * 2;
  current.y = gy;
  lockPiece();
}

function softDrop() {
  if (!collide(current.shape, current.x, current.y + 1)) {
    current.y++;
    score += 1;
    updateHUD();
  } else {
    lockPiece();
  }
}

// Pone a 0 las celdas [r, c] dadas (ignora las que caen fuera o ya están vacías)
// y las marca para el destello.
function destroyCells(cells) {
  flashCells = [];
  for (const [r, c] of cells) {
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS || !board[r][c]) continue;
    board[r][c] = 0;
    score += POWER_CELL_SCORE;
    flashCells.push([r, c]);
  }
  flashLeft = FLASH_MS;
}

function applyPowerUp(type, x, y) {
  const cells = [];
  switch (type) {
    case BOMB:
      for (let r = y - 1; r <= y + 1; r++)
        for (let c = x - 1; c <= x + 1; c++) cells.push([r, c]);
      destroyCells(cells);
      break;
    case LIGHTNING:
      for (let c = 0; c < COLS; c++) cells.push([y, c]);
      for (let r = 0; r < ROWS; r++) cells.push([r, x]);
      destroyCells(cells);
      break;
    case DYE: {
      // color del bloque sobre el que cae; si no hay, uno al azar de los presentes
      let target = y + 1 < ROWS ? board[y + 1][x] : 0;
      if (!target) {
        const present = [...new Set(board.flat().filter(v => v))];
        if (!present.length) break;
        target = present[Math.floor(Math.random() * present.length)];
      }
      for (let r = 0; r < ROWS; r++)
        for (let c = 0; c < COLS; c++)
          if (board[r][c] === target) cells.push([r, c]);
      destroyCells(cells);
      break;
    }
    case GRAVITY:
      for (let c = 0; c < COLS; c++) {
        let write = ROWS - 1;
        for (let r = ROWS - 1; r >= 0; r--) {
          if (board[r][c]) {
            const v = board[r][c];
            board[r][c] = 0;
            board[write--][c] = v;
          }
        }
      }
      break;
    case FREEZE:
      freezeLeft = FREEZE_MS;
      break;
  }
  updateHUD();
}

function lockPiece() {
  if (POWERUPS.includes(current.type)) applyPowerUp(current.type, current.x, current.y);
  else merge();
  clearLines();
  spawn();
}

function spawn() {
  current = next;
  if (rewardPending) {
    next = makePiece(SINGLE);
    rewardPending = false;
  } else if (powerPending) {
    next = makePiece(POWERUPS[Math.floor(Math.random() * POWERUPS.length)]);
    powerPending = false;
  } else {
    next = randomPiece();
  }
  if (collide(current.shape, current.x, current.y)) {
    endGame();
  }
  drawNext();
}

function updateHUD() {
  scoreEl.textContent = score.toLocaleString();
  linesEl.textContent = lines;
  levelEl.textContent = level;
}

function drawBlock(context, x, y, colorIndex, size, alpha) {
  if (!colorIndex) return;
  const color = COLORS[colorIndex];
  context.globalAlpha = alpha ?? 1;
  context.fillStyle = color;
  context.fillRect(x * size + 1, y * size + 1, size - 2, size - 2);
  // highlight
  context.fillStyle = 'rgba(255,255,255,0.12)';
  context.fillRect(x * size + 1, y * size + 1, size - 2, 4);
  const icon = POWER_ICONS[colorIndex];
  if (icon) {
    context.globalAlpha = alpha ?? 1;
    context.fillStyle = '#fff'; // para iconos de texto como ⬇ (los emoji ignoran el color)
    context.font = `${Math.round(size * 0.6)}px sans-serif`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(icon, x * size + size / 2, y * size + size / 2 + 1);
  }
  context.globalAlpha = 1;
}

function drawGrid() {
  ctx.strokeStyle = gridColor;
  ctx.lineWidth = 0.5;
  for (let c = 1; c < COLS; c++) {
    ctx.beginPath();
    ctx.moveTo(c * BLOCK, 0);
    ctx.lineTo(c * BLOCK, ROWS * BLOCK);
    ctx.stroke();
  }
  for (let r = 1; r < ROWS; r++) {
    ctx.beginPath();
    ctx.moveTo(0, r * BLOCK);
    ctx.lineTo(COLS * BLOCK, r * BLOCK);
    ctx.stroke();
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawGrid();

  // board
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      drawBlock(ctx, c, r, board[r][c], BLOCK);

  // ghost
  const gy = ghostY();
  for (let r = 0; r < current.shape.length; r++)
    for (let c = 0; c < current.shape[r].length; c++)
      if (current.shape[r][c])
        drawBlock(ctx, current.x + c, gy + r, current.shape[r][c], BLOCK, 0.2);

  // current piece
  for (let r = 0; r < current.shape.length; r++)
    for (let c = 0; c < current.shape[r].length; c++)
      drawBlock(ctx, current.x + c, current.y + r, current.shape[r][c], BLOCK);

  // destello de bloques destruidos por un power-up
  if (flashLeft > 0) {
    ctx.fillStyle = `rgba(255,255,255,${0.8 * flashLeft / FLASH_MS})`;
    for (const [r, c] of flashCells)
      ctx.fillRect(c * BLOCK + 1, r * BLOCK + 1, BLOCK - 2, BLOCK - 2);
  }

  // congelado: capa azul + cuenta atrás
  if (freezeLeft > 0) {
    ctx.fillStyle = 'rgba(129,212,250,0.18)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#81d4fa';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(`❄ ${Math.ceil(freezeLeft / 1000)}s`, canvas.width / 2, 6);
  }
}

function drawNext() {
  const NB = 30;
  nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
  const shape = next.shape;
  const offX = Math.floor((4 - shape[0].length) / 2);
  const offY = Math.floor((4 - shape.length) / 2);
  for (let r = 0; r < shape.length; r++)
    for (let c = 0; c < shape[r].length; c++)
      drawBlock(nextCtx, offX + c, offY + r, shape[r][c], NB);
}

function endGame() {
  gameOver = true;
  cancelAnimationFrame(animId);
  overlayTitle.textContent = 'GAME OVER';
  overlayScore.textContent = `Puntuación: ${score.toLocaleString()}`;
  overlay.classList.remove('hidden');
}

function togglePause() {
  if (gameOver) return;
  paused = !paused;
  if (!paused) {
    lastTime = performance.now();
    loop(lastTime);
  } else {
    cancelAnimationFrame(animId);
    overlayTitle.textContent = 'PAUSA';
    overlayScore.textContent = '';
    overlay.classList.remove('hidden');
  }
}

function loop(ts) {
  const dt = ts - lastTime;
  lastTime = ts;
  flashLeft = Math.max(0, flashLeft - dt);
  if (freezeLeft > 0) freezeLeft = Math.max(0, freezeLeft - dt);
  else dropAccum += dt;
  if (dropAccum >= dropInterval) {
    dropAccum = 0;
    if (!collide(current.shape, current.x, current.y + 1)) {
      current.y++;
    } else {
      lockPiece();
    }
  }
  draw();
  // endGame() puede ejecutarse dentro de este frame (caída por gravedad):
  // su cancelAnimationFrame no cancela el frame en curso, así que no reprogramar.
  if (gameOver) return;
  animId = requestAnimationFrame(loop);
}

function init() {
  board = createBoard();
  score = 0;
  lines = 0;
  level = 1;
  paused = false;
  gameOver = false;
  dropInterval = 1000;
  dropAccum = 0;
  rewardPending = false;
  linesSincePower = 0;
  powerPending = false;
  freezeLeft = 0;
  flashCells = [];
  flashLeft = 0;
  lastTime = performance.now();
  next = randomPiece();
  spawn();
  updateHUD();
  overlay.classList.add('hidden');
  cancelAnimationFrame(animId);
  animId = requestAnimationFrame(loop);
}

document.addEventListener('keydown', e => {
  if (e.code === 'KeyP') { togglePause(); return; }
  if (paused || gameOver) return;
  switch (e.code) {
    case 'ArrowLeft':
      if (!collide(current.shape, current.x - 1, current.y)) current.x--;
      break;
    case 'ArrowRight':
      if (!collide(current.shape, current.x + 1, current.y)) current.x++;
      break;
    case 'ArrowDown':
      softDrop();
      break;
    case 'ArrowUp':
    case 'KeyX':
      tryRotate();
      break;
    case 'Space':
      e.preventDefault();
      hardDrop();
      break;
  }
  updateHUD();
});

restartBtn.addEventListener('click', init);

function applyTheme(theme) {
  const isLight = theme === 'light';
  document.documentElement.dataset.theme = theme;
  themeToggle.textContent = isLight ? '☾' : '☀';
  themeToggle.setAttribute('aria-pressed', String(isLight));
  themeToggle.setAttribute('aria-label', isLight ? 'Cambiar a tema oscuro' : 'Cambiar a tema claro');
  gridColor = getComputedStyle(document.documentElement).getPropertyValue('--grid').trim();
  // en pausa o game over no hay loop: redibujar a mano
  if (current) {
    draw();
    drawNext();
  }
}

function loadTheme() {
  try {
    return localStorage.getItem(THEME_KEY) === 'light' ? 'light' : 'dark';
  } catch (e) {
    return 'dark';
  }
}

themeToggle.addEventListener('click', () => {
  const theme = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
  applyTheme(theme);
  try { localStorage.setItem(THEME_KEY, theme); } catch (e) { /* almacenamiento no disponible */ }
  themeToggle.blur(); // evita que Space active el botón en lugar de la caída
});

applyTheme(loadTheme());
init();
