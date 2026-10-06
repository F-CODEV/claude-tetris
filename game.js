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
  '#757575', // basura - gray
  '#9e9d24', // piedra - olive
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
  [[18]],                                      // basura (nunca es pieza, solo celda del tablero)
  [[19]],                                      // piedra (nunca es pieza, solo celda del tablero)
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
const TSPIN_SCORES = [400, 800, 1200, 1600];       // 0–3 líneas
const PERFECT_SCORES = [0, 800, 1200, 1800, 2000]; // por líneas limpiadas, x nivel
const B2B_MULT = 1.5;
const COMBO_MAX = 10;
const POPUP_MS = 1200;
const MUTE_KEY = 'tetris-muted';
const RECORDS_KEY = 'tetris-records';
const RECORDS_MAX = 5;         // tamaño del top
const NAME_MAX = 12;           // longitud máxima del nombre
const DEFAULT_NAME = 'ANÓNIMO';

const GARBAGE = 18, STONE = 19;
const SPRINT_LINES = 40;
const SPRINT_MS = 120000;
const GARBAGE_EVERY_MS = 10000;
const SURVIVE_MS = 120000;
const STONE_ROWS = 8;
const STONE_DENSITY = 0.6;
const INVISIBLE_LINES = 20;
const REVERSE_FROM_LEVEL = 3;
const REVERSE_TARGET_LEVEL = 5;
const FADE_MS = 500;

const QUEUE_MIN = 6;           // piezas generadas por adelantado
const ENERGY_MAX = 100;
const ENERGY_PER_LINE = 20;
const PREVIEW_COUNT = 5;
const SLOW_MS = 10000;
const SLOW_FACTOR = 3;         // la caída tarda 3× más mientras dura
const SWAP_OPTIONS = 3;
const PIECE_NAMES = [null, 'I', 'O', 'T', 'S', 'Z', 'J', 'L'];

const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const nextCanvas = document.getElementById('next-canvas');
const nextCtx = nextCanvas.getContext('2d');
const scoreEl = document.getElementById('score');
const linesEl = document.getElementById('lines');
const levelEl = document.getElementById('level');
const comboEl = document.getElementById('combo');
const goalEl = document.getElementById('goal');
const goalSection = document.getElementById('goal-section');
const modeList = document.getElementById('mode-list');
const overlayActions = document.getElementById('overlay-actions');
const menuBtn = document.getElementById('menu-btn');
const abilityList = document.getElementById('ability-list');
const energySection = document.getElementById('energy-section');
const energyBar = document.getElementById('energy-bar');
const energyFill = document.getElementById('energy-fill');
const holdCanvas = document.getElementById('hold-canvas');
const holdCtx = holdCanvas.getContext('2d');
const previewSection = document.getElementById('preview-section');
const previewCanvas = document.getElementById('preview-canvas');
const previewCtx = previewCanvas.getContext('2d');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlayScore = document.getElementById('overlay-score');
const restartBtn = document.getElementById('restart-btn');
const recordsSection = document.getElementById('records-section');
const recordsList = document.getElementById('records-list');
const recordsStats = document.getElementById('records-stats');
const nameEntry = document.getElementById('name-entry');
const nameInput = document.getElementById('name-input');
const nameSaveBtn = document.getElementById('name-save-btn');
const resetRecordsBtn = document.getElementById('reset-records-btn');
const themeToggle = document.getElementById('theme-toggle');

const THEME_KEY = 'tetris-theme';
let gridColor;

let board, current, next, score, lines, level, paused, gameOver, lastTime, dropAccum, dropInterval, animId, rewardPending;
let linesSincePower, powerPending, freezeLeft, flashCells, flashLeft;
let combo, maxCombo, b2bActive, lastMoveRotate, popups = [];
let mode = 'classic', elapsed, garbageAccum, fadeCells, lastGoalText;
let queue = [], energy, holdType, holdUsed, previewLeft, slowLeft, undoSnapshot, abilityOptions;
let audioCtx, muted = false;
let records = { scores: [], maxCombo: 0, maxLines: 0 }, pendingRecord = null;

// ---- Desafíos ----
const fmtTime = ms => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};
const countStones = () => board.reduce((n, row) => n + row.filter(v => v === STONE).length, 0);

// check() devuelve 'win', un mensaje de derrota o null. Solo se evalúa en partida.
const CHALLENGES = {
  classic: {
    name: 'Clásico',
    desc: 'El juego de siempre, con piezas especiales, power-ups y combos.',
    goal: () => '',
    check: () => null,
  },
  sprint: {
    name: 'Sprint 40',
    desc: 'Limpia 40 líneas en 2 minutos.',
    goal: () => `${Math.min(lines, SPRINT_LINES)}/${SPRINT_LINES} · ${fmtTime(SPRINT_MS - elapsed)}`,
    check: () => lines >= SPRINT_LINES ? 'win' : (elapsed >= SPRINT_MS ? 'TIEMPO AGOTADO' : null),
  },
  garbage: {
    name: 'Marea de basura',
    desc: 'Sobrevive 2 minutos: sube una fila de basura cada 10 s.',
    goal: () => `${fmtTime(SURVIVE_MS - elapsed)} · basura ${Math.ceil((GARBAGE_EVERY_MS - garbageAccum) / 1000)}s`,
    check: () => elapsed >= SURVIVE_MS ? 'win' : null,
  },
  fixed: {
    name: 'Bloques fijos',
    desc: 'Elimina todas las piedras pre-colocadas completando sus filas.',
    goal: () => `Piedras: ${countStones()}`,
    check: () => countStones() === 0 ? 'win' : null,
  },
  invisible: {
    name: 'Invisible',
    desc: 'Las piezas se vuelven invisibles al tocar suelo. Limpia 20 líneas.',
    goal: () => `${Math.min(lines, INVISIBLE_LINES)}/${INVISIBLE_LINES}`,
    check: () => lines >= INVISIBLE_LINES ? 'win' : null,
  },
  reverse: {
    name: 'Rotación inversa',
    desc: 'Desde el nivel 3 la rotación gira al revés. Llega al nivel 5.',
    goal: () => `Nivel ${level}/${REVERSE_TARGET_LEVEL} ${level >= REVERSE_FROM_LEVEL ? '↺' : '↻'}`,
    check: () => level >= REVERSE_TARGET_LEVEL ? 'win' : null,
  },
};

// Piezas especiales, power-ups y recompensas solo en el modo clásico.
const extrasOn = () => mode === 'classic';

function updateGoal() {
  const text = CHALLENGES[mode].goal();
  if (text === lastGoalText) return;
  lastGoalText = text;
  goalEl.textContent = text;
}

function checkGoal() {
  if (gameOver) return;
  const result = CHALLENGES[mode].check();
  if (result) endGame(result);
}

function placeStones() {
  for (let r = ROWS - STONE_ROWS; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) board[r][c] = Math.random() < STONE_DENSITY ? STONE : 0;
    if (board[r].every(v => v)) board[r][Math.floor(Math.random() * COLS)] = 0;
  }
}

function addGarbageRow() {
  if (board[0].some(v => v)) { endGame('LA BASURA TE ENTERRÓ'); return; }
  board.shift();
  const hole = Math.floor(Math.random() * COLS);
  board.push(Array.from({ length: COLS }, (_, c) => c === hole ? 0 : GARBAGE));
  if (collide(current.shape, current.x, current.y)) {
    current.y--;
    if (collide(current.shape, current.x, current.y)) { endGame('LA BASURA TE ENTERRÓ'); return; }
  }
  addPopup('¡BASURA!', '#bdbdbd');
  playTone(110, 200, 'sawtooth');
}

function fadePiece() {
  for (let r = 0; r < current.shape.length; r++)
    for (let c = 0; c < current.shape[r].length; c++)
      if (current.shape[r][c])
        fadeCells.push({ r: current.y + r, c: current.x + c, color: current.shape[r][c], life: FADE_MS });
}

function updateChallenge(dt) {
  if (gameOver) return;
  const cdt = Math.min(dt, 250); // una pestaña en segundo plano no debe saltar el reloj
  elapsed += cdt;
  if (mode === 'garbage') {
    garbageAccum += cdt;
    while (garbageAccum >= GARBAGE_EVERY_MS && !gameOver) {
      garbageAccum -= GARBAGE_EVERY_MS;
      addGarbageRow();
    }
  }
  for (const f of fadeCells) f.life -= cdt;
  fadeCells = fadeCells.filter(f => f.life > 0);
  checkGoal();
  updateGoal();
}

// ---- Sonido (Web Audio, sin archivos) ----
function initAudio() {
  try {
    const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (AC && !audioCtx) audioCtx = new AC();
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  } catch (e) { /* audio no disponible */ }
}

function playTone(freq, ms, type = 'square', delay = 0) {
  if (muted || !audioCtx) return;
  try {
    const t = audioCtx.currentTime + delay / 1000;
    const end = t + ms / 1000;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.08, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(t);
    osc.stop(end + 0.02);
  } catch (e) { /* ignorar */ }
}

function playArpeggio(freqs) {
  freqs.forEach((f, i) => playTone(f, 140, 'triangle', i * 90));
}

function loadMuted() {
  try { return localStorage.getItem(MUTE_KEY) === '1'; } catch (e) { return false; }
}

function toggleMute() {
  muted = !muted;
  try { localStorage.setItem(MUTE_KEY, muted ? '1' : '0'); } catch (e) { /* almacenamiento no disponible */ }
  addPopup(muted ? 'SONIDO OFF' : 'SONIDO ON', '#b0bec5');
}

function addPopup(text, color) {
  popups.push({ text, color, life: POPUP_MS, max: POPUP_MS });
}

// ---- Habilidades cargables (solo modo clásico) ----
const abilitiesOn = () => mode === 'classic';

function fillQueue() {
  while (queue.length < QUEUE_MIN) queue.push(randomPiece());
}

function syncNext() {
  next = queue[0];
}

function addEnergy(cleared) {
  if (!abilitiesOn()) return;
  const was = energy;
  energy = Math.min(ENERGY_MAX, energy + cleared * ENERGY_PER_LINE);
  if (was < ENERGY_MAX && energy >= ENERGY_MAX) {
    addPopup('¡ENERGÍA LISTA! (E)', '#4dd0e1');
    playArpeggio([523, 784]);
  }
}

// Foto del estado justo antes de fijar una pieza, para "Deshacer".
function saveUndo() {
  undoSnapshot = {
    board: board.map(row => [...row]),
    currentType: current.type,
    queueTypes: queue.map(p => p.type),
    score, lines, level, dropInterval, combo, b2bActive,
    linesSincePower, rewardPending, powerPending, previewLeft,
  };
}

function afterAbility(text, tones) {
  syncNext();
  drawPanels();
  updateHUD();
  addPopup(text, '#4dd0e1');
  playArpeggio(tones);
}

function noFit() {
  addPopup('NO CABE', '#ef5350');
  return false;
}

function doPeek() {
  previewLeft = PREVIEW_COUNT;
  afterAbility('PRÓXIMAS 5', [659, 784]);
  return true;
}

function doSlow() {
  slowLeft = SLOW_MS;
  afterAbility('TIEMPO LENTO', [392, 330, 262]);
  return true;
}

function doUndo() {
  const s = undoSnapshot;
  if (!s) return false;
  board = s.board.map(row => [...row]);
  ({ score, lines, level, dropInterval, combo, b2bActive,
     linesSincePower, rewardPending, powerPending, previewLeft } = s);
  queue = s.queueTypes.map(t => makePiece(t));
  current = makePiece(s.currentType);
  undoSnapshot = null;
  holdUsed = false; // la pieza fijada vuelve como pieza nueva
  lastMoveRotate = false;
  dropAccum = 0;
  afterAbility('DESHECHO', [523, 440, 349]);
  return true;
}

// Hold (C / Shift), en todos los modos. Una vez por pieza: holdUsed lo bloquea
// hasta que spawn() saca la siguiente. Con el slot vacío guarda la actual y toma
// la primera de la cola; si no, intercambia con la reservada.
function holdPiece() {
  if (holdUsed) return;
  const fromQueue = holdType === null;
  const incoming = fromQueue ? queue[0] : makePiece(holdType);
  if (collide(incoming.shape, incoming.x, incoming.y)) { noFit(); return; }
  if (fromQueue) {
    queue.shift();
    fillQueue();
    if (previewLeft > 0) previewLeft--;
  }
  holdType = current.type;
  current = incoming;
  holdUsed = true;
  undoSnapshot = null; // el hold cambia qué pieza es cuál: no se puede deshacer más atrás
  lastMoveRotate = false;
  dropAccum = 0;
  syncNext();
  drawPanels();
  playTone(523, 80, 'triangle');
}

function doSwap(type) {
  const p = makePiece(type);
  if (collide(p.shape, p.x, p.y)) {
    p.x = current.x;
    p.y = current.y;
    if (collide(p.shape, p.x, p.y)) return noFit();
  }
  current = p;
  lastMoveRotate = false;
  afterAbility(`PIEZA ${PIECE_NAMES[type]}`, [587, 740]);
  return true;
}

function openSwapChoices() {
  const types = Array.from({ length: STANDARD_COUNT }, (_, i) => i + 1)
    .sort(() => Math.random() - 0.5)
    .slice(0, SWAP_OPTIONS);
  showOverlay('ELIGE PIEZA', 'Esc cancela', { abilities: true });
  renderOptions(types.map(t => ({
    name: PIECE_NAMES[t],
    desc: 'Sustituye la pieza actual',
    color: COLORS[t],
    run: () => doSwap(t),
  })));
  return 'menu';
}

// run() devuelve true (usada), false (no se pudo, no gasta) o 'menu' (submenú).
const ABILITIES = [
  { name: 'Ver 5 siguientes', desc: 'Muestra las próximas 5 piezas.', run: doPeek },
  { name: 'Intercambiar pieza', desc: 'Cambia la actual por una de 3 opciones.', run: openSwapChoices },
  { name: 'Ralentizar 10 s', desc: 'La caída va 3× más lenta.', run: doSlow },
  { name: 'Deshacer colocación', desc: 'Devuelve la última pieza fijada.', available: () => !!undoSnapshot, run: doUndo },
];

function renderOptions(options) {
  abilityOptions = options;
  abilityList.textContent = '';
  options.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'mode-btn';
    btn.disabled = !!opt.available && !opt.available();
    const name = document.createElement('strong');
    name.textContent = `${i + 1}. ${opt.name}`;
    if (opt.color) name.style.color = opt.color;
    const desc = document.createElement('span');
    desc.textContent = opt.desc;
    btn.append(name, desc);
    btn.addEventListener('click', () => chooseOption(i));
    abilityList.appendChild(btn);
  });
}

function openAbilityMenu() {
  if (!abilitiesOn()) return;
  if (energy < ENERGY_MAX) {
    addPopup(`ENERGÍA ${energy}/${ENERGY_MAX}`, '#b0bec5');
    return;
  }
  paused = true;
  cancelAnimationFrame(animId);
  showOverlay('HABILIDAD', `Elige 1–${ABILITIES.length} · Esc cancela`, { abilities: true });
  renderOptions(ABILITIES);
}

function chooseOption(i) {
  const opt = abilityOptions && abilityOptions[i];
  if (!opt || (opt.available && !opt.available())) return;
  const result = opt.run();
  if (result === 'menu') return;
  closeAbilityMenu(result === true);
}

function closeAbilityMenu(consumed) {
  abilityOptions = null;
  if (consumed) {
    energy = 0;
    updateHUD();
  }
  resume();
}

function handleAbilityKey(e) {
  if (e.repeat) return;
  if (e.code === 'Escape' || e.code === 'KeyE') { closeAbilityMenu(false); return; }
  const m = /^(?:Digit|Numpad)([1-9])$/.exec(e.code);
  if (m) chooseOption(Number(m[1]) - 1);
}

function createBoard() {
  return Array.from({ length: ROWS }, () => new Array(COLS).fill(0));
}

function makePiece(type) {
  const shape = PIECES[type].map(row => [...row]);
  return { type, shape, x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2), y: 0 };
}

function randomPiece() {
  if (!extrasOn()) return makePiece(Math.floor(Math.random() * STANDARD_COUNT) + 1);
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
  let rotated = rotateCW(current.shape);
  // modo "reverse" desde cierto nivel: antihorario (tres giros horarios)
  if (mode === 'reverse' && level >= REVERSE_FROM_LEVEL) rotated = rotateCW(rotateCW(rotated));
  const kicks = [0, -1, 1, -2, 2];
  for (const kick of kicks) {
    if (!collide(rotated, current.x + kick, current.y)) {
      current.shape = rotated;
      current.x += kick;
      lastMoveRotate = true;
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

// T-spin de 3 esquinas: pieza T, último movimiento fue una rotación y al menos
// 3 de las 4 esquinas de su cuadro 3×3 están ocupadas o fuera del tablero.
// Debe llamarse antes de merge().
function isTSpin() {
  if (current.type !== 3 || !lastMoveRotate) return false;
  let filled = 0;
  for (const [dr, dc] of [[0, 0], [0, 2], [2, 0], [2, 2]]) {
    const r = current.y + dr, c = current.x + dc;
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS || board[r][c]) filled++;
  }
  return filled >= 3;
}

// Puntuación del turno: combo, T-spin, B2B y Perfect Clear. Usa `level` previo
// a la subida de nivel de este turno.
function scoreTurn(cleared, tspin) {
  if (!cleared) {
    combo = 0;
    if (tspin) {
      const pts = TSPIN_SCORES[0] * level;
      score += pts;
      addPopup('T-SPIN', '#ba68c8');
      addPopup(`+${pts.toLocaleString()}`, '#ffffff');
      playArpeggio([523, 659, 784]);
    }
    updateHUD();
    return;
  }

  combo++;
  if (combo > maxCombo) maxCombo = combo;
  const mult = Math.min(combo, COMBO_MAX);
  const hard = cleared === 4 || tspin;
  const b2b = hard && b2bActive;
  b2bActive = hard;

  const base = tspin ? (TSPIN_SCORES[cleared] || 0) : (LINE_SCORES[cleared] || 0);
  let pts = Math.floor(base * level * (b2b ? B2B_MULT : 1)) * mult;

  const perfect = board.every(row => row.every(v => v === 0));
  if (perfect) pts += (PERFECT_SCORES[cleared] || 0) * level;
  score += pts;

  const name = tspin ? `T-SPIN ${['', 'SINGLE', 'DOUBLE', 'TRIPLE'][cleared] || ''}`.trim() : (cleared === 4 ? 'TETRIS' : '');
  if (name) addPopup((b2b ? 'B2B ' : '') + name, tspin ? '#ba68c8' : '#4dd0e1');
  if (mult > 1) addPopup(`COMBO x${mult}`, '#ffb74d');
  if (perfect) {
    addPopup('PERFECT CLEAR!', '#ffd700');
    flashCells = [];
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) flashCells.push([r, c]);
    flashLeft = FLASH_MS * 2;
  }
  addPopup(`+${pts.toLocaleString()}`, '#ffffff');

  if (perfect) playArpeggio([523, 659, 784, 1047, 1319]);
  else if (hard) playArpeggio([523, 659, 784]);
  else playTone(440 * Math.pow(2, mult / 12), 160);
  updateHUD();
}

function clearLines(tspin = false) {
  let cleared = 0;
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[r].every(v => v !== 0)) {
      board.splice(r, 1);
      board.unshift(new Array(COLS).fill(0));
      cleared++;
      r++;
    }
  }
  if (cleared === 4 && extrasOn()) rewardPending = true;
  if (cleared) {
    linesSincePower += cleared;
    if (linesSincePower >= POWERUP_EVERY) {
      linesSincePower -= POWERUP_EVERY;
      if (extrasOn()) powerPending = true;
    }
    scoreTurn(cleared, tspin);
    addEnergy(cleared);
    lines += cleared;
    const prevLevel = level;
    level = Math.floor(lines / 10) + 1;
    if (mode === 'reverse' && prevLevel < REVERSE_FROM_LEVEL && level >= REVERSE_FROM_LEVEL)
      addPopup('¡ROTACIÓN INVERSA!', '#ef5350');
    dropInterval = Math.max(100, 1000 - (level - 1) * 90);
    updateHUD();
  } else {
    scoreTurn(0, tspin);
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
  if (gy > current.y) lastMoveRotate = false;
  current.y = gy;
  lockPiece();
}

function softDrop() {
  if (!collide(current.shape, current.x, current.y + 1)) {
    current.y++;
    lastMoveRotate = false;
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
  if (abilitiesOn()) saveUndo();
  const tspin = isTSpin();
  if (mode === 'invisible') fadePiece();
  if (POWERUPS.includes(current.type)) applyPowerUp(current.type, current.x, current.y);
  else merge();
  clearLines(tspin);
  lastMoveRotate = false;
  checkGoal();
  if (!gameOver) spawn();
}

function spawn() {
  current = queue.shift();
  holdUsed = false; // pieza nueva: el hold vuelve a estar disponible
  fillQueue();
  // recompensas y power-ups van al frente de la cola (no reemplazan lo ya visto)
  if (rewardPending) {
    queue.unshift(makePiece(SINGLE));
    rewardPending = false;
  } else if (powerPending) {
    queue.unshift(makePiece(POWERUPS[Math.floor(Math.random() * POWERUPS.length)]));
    powerPending = false;
  }
  if (previewLeft > 0) previewLeft--;
  syncNext();
  if (collide(current.shape, current.x, current.y)) {
    endGame();
  }
  drawPanels();
}

function updateHUD() {
  scoreEl.textContent = score.toLocaleString();
  linesEl.textContent = lines;
  levelEl.textContent = level;
  comboEl.textContent = combo > 1 ? `x${Math.min(combo, COMBO_MAX)}` : '—';
  energyFill.style.width = `${energy}%`;
  energyBar.classList.toggle('ready', energy >= ENERGY_MAX);
}

function drawBlock(context, x, y, colorIndex, size, alpha) {
  if (!colorIndex) return;
  const color = COLORS[colorIndex];
  context.globalAlpha = alpha ?? 1;
  context.fillStyle = color;
  context.fillRect(x * size + 1, y * size + 1, size - 2, size - 2);
  // highlight
  context.fillStyle = 'rgba(255,255,255,0.12)';
  context.fillRect(x * size + 1, y * size + 1, size - 2, Math.min(4, Math.round(size / 5)));
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

  // modo invisible: el tablero y el ghost se ocultan (se revela al terminar)
  const hidden = mode === 'invisible' && !gameOver;

  // board
  if (hidden) {
    for (const f of fadeCells) drawBlock(ctx, f.c, f.r, f.color, BLOCK, f.life / FADE_MS);
  } else {
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++)
        drawBlock(ctx, c, r, board[r][c], BLOCK);
  }

  // ghost
  if (!hidden) {
    const gy = ghostY();
    for (let r = 0; r < current.shape.length; r++)
      for (let c = 0; c < current.shape[r].length; c++)
        if (current.shape[r][c])
          drawBlock(ctx, current.x + c, gy + r, current.shape[r][c], BLOCK, 0.2);
  }

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

  // ralentizado: capa violeta + cuenta atrás
  if (slowLeft > 0) {
    ctx.fillStyle = 'rgba(149,117,205,0.15)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#b39ddb';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(`🐢 ${Math.ceil(slowLeft / 1000)}s`, canvas.width / 2, freezeLeft > 0 ? 28 : 6);
  }

  // popups de combo / bonus: apilados, suben y se desvanecen
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 4;
  ctx.strokeStyle = 'rgba(0,0,0,0.6)';
  popups.forEach((p, i) => {
    const t = 1 - p.life / p.max;
    const y = canvas.height / 2 + i * 28 - t * 30;
    ctx.globalAlpha = Math.min(1, p.life / (p.max * 0.4));
    ctx.fillStyle = p.color;
    ctx.strokeText(p.text, canvas.width / 2, y);
    ctx.fillText(p.text, canvas.width / 2, y);
  });
  ctx.globalAlpha = 1;
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

// Dibuja una pieza en una caja de 4×4 celdas con origen en (cellX, cellY).
function drawMini(context, type, cellX, cellY, size) {
  const shape = PIECES[type];
  const offX = (4 - shape[0].length) / 2;
  const offY = (4 - shape.length) / 2;
  for (let r = 0; r < shape.length; r++)
    for (let c = 0; c < shape[r].length; c++)
      drawBlock(context, cellX + offX + c, cellY + offY + r, shape[r][c], size);
}

function drawHold() {
  holdCtx.clearRect(0, 0, holdCanvas.width, holdCanvas.height);
  holdCanvas.classList.toggle('locked', holdUsed); // atenuado hasta que se asiente la pieza
  if (holdType !== null) drawMini(holdCtx, holdType, 0, 0, 20);
}

function drawPreview() {
  const show = previewLeft > 0;
  previewSection.classList.toggle('hidden', !show);
  previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
  if (!show) return;
  queue.slice(0, previewLeft).forEach((p, i) => drawMini(previewCtx, p.type, i * 4, 0, 8));
}

function drawPanels() {
  drawNext();
  drawHold();
  drawPreview();
}

// ---- Records ----
// Valida lo leído de localStorage: ignora entradas corruptas y recorta a RECORDS_MAX.
function sanitizeRecords(raw) {
  const out = { scores: [], maxCombo: 0, maxLines: 0 };
  if (!raw || typeof raw !== 'object') return out;
  const num = v => (Number.isFinite(v) && v >= 0 ? Math.floor(v) : 0);
  out.maxCombo = num(raw.maxCombo);
  out.maxLines = num(raw.maxLines);
  if (Array.isArray(raw.scores)) {
    for (const e of raw.scores) {
      if (!e || typeof e !== 'object' || !Number.isFinite(e.score) || e.score <= 0) continue;
      out.scores.push({
        name: (typeof e.name === 'string' ? e.name.trim().slice(0, NAME_MAX) : '') || DEFAULT_NAME,
        score: num(e.score),
        lines: num(e.lines),
        combo: num(e.combo),
        mode: typeof e.mode === 'string' ? e.mode : 'classic',
        date: typeof e.date === 'string' ? e.date.slice(0, 40) : ''
      });
    }
  }
  out.scores.sort((a, b) => b.score - a.score);
  out.scores.length = Math.min(out.scores.length, RECORDS_MAX);
  return out;
}

function loadRecords() {
  try { return sanitizeRecords(JSON.parse(localStorage.getItem(RECORDS_KEY))); } catch (e) { return sanitizeRecords(null); }
}

function saveRecords() {
  try { localStorage.setItem(RECORDS_KEY, JSON.stringify(records)); } catch (e) { /* almacenamiento no disponible */ }
}

// ¿Entra `pts` en el top? (empates con el último puesto no desplazan)
function qualifiesForTop(pts) {
  if (pts <= 0) return false;
  return records.scores.length < RECORDS_MAX || pts > records.scores[records.scores.length - 1].score;
}

// Al terminar la partida: actualiza máximos históricos y prepara la entrada pendiente de nombre.
function registerRecord() {
  records.maxCombo = Math.max(records.maxCombo, maxCombo);
  records.maxLines = Math.max(records.maxLines, lines);
  saveRecords();
  pendingRecord = null;
  if (qualifiesForTop(score)) {
    pendingRecord = { name: '', score, lines, combo: maxCombo, mode, date: new Date().toISOString() };
  }
  nameEntry.classList.toggle('hidden', !pendingRecord);
  nameInput.value = '';
}

// Guarda la entrada pendiente con el nombre dado (o el de por defecto) y re-renderiza.
function commitPending(name = nameInput.value) {
  if (!pendingRecord) return;
  pendingRecord.name = name.trim().slice(0, NAME_MAX) || DEFAULT_NAME;
  const entry = pendingRecord;
  pendingRecord = null;
  records.scores.push(entry);
  records.scores.sort((a, b) => b.score - a.score);
  records.scores.length = Math.min(records.scores.length, RECORDS_MAX);
  saveRecords();
  nameEntry.classList.add('hidden');
  renderRecords(entry);
}

function resetRecords() {
  records = sanitizeRecords(null);
  pendingRecord = null;
  nameEntry.classList.add('hidden');
  saveRecords();
  renderRecords();
}

function modeLabel(id) {
  return id === 'classic' ? 'Clásico' : (CHALLENGES[id] ? CHALLENGES[id].name : id);
}

// Pinta la tabla con textContent (nunca innerHTML). `highlight` es la entrada recién guardada;
// si hay una entrada pendiente de nombre se muestra resaltada en su puesto.
function renderRecords(highlight = null) {
  const rows = records.scores.slice();
  if (pendingRecord) {
    highlight = pendingRecord;
    rows.push(pendingRecord);
    rows.sort((a, b) => b.score - a.score);
    rows.length = Math.min(rows.length, RECORDS_MAX);
  }
  recordsList.replaceChildren();
  if (!rows.length) {
    const li = document.createElement('li');
    li.className = 'empty';
    li.textContent = 'Sin records todavía';
    recordsList.appendChild(li);
  }
  rows.forEach((e, i) => {
    const li = document.createElement('li');
    if (e === highlight) li.classList.add('new');
    li.title = `${modeLabel(e.mode)} · ${e.lines} líneas · combo x${e.combo}`;
    const rank = document.createElement('span');
    rank.className = 'rec-rank';
    rank.textContent = `${i + 1}.`;
    const name = document.createElement('span');
    name.className = 'rec-name';
    name.textContent = e.name || '…';
    const pts = document.createElement('span');
    pts.className = 'rec-score';
    pts.textContent = e.score.toLocaleString();
    li.append(rank, name, pts);
    recordsList.appendChild(li);
  });
  recordsStats.textContent = `Mejor combo x${records.maxCombo} · Máx. líneas ${records.maxLines}`;
  resetRecordsBtn.classList.toggle('hidden', !records.scores.length && !records.maxCombo && !records.maxLines);
}

// menu: lista de modos; abilities: opciones de habilidad; si no, Reiniciar / Menú.
// records: muestra la tabla de records (menú y fin de partida).
function showOverlay(title, scoreText, { menu = false, win = false, abilities = false, records: showRecords = false } = {}) {
  overlayTitle.textContent = title;
  overlayTitle.classList.toggle('win', win);
  overlayScore.textContent = scoreText;
  modeList.classList.toggle('hidden', !menu);
  abilityList.classList.toggle('hidden', !abilities);
  overlayActions.classList.toggle('hidden', menu || abilities);
  recordsSection.classList.toggle('hidden', !showRecords);
  if (showRecords) renderRecords();
  overlay.classList.remove('hidden');
}

// result: 'win', un mensaje de derrota, o nada (GAME OVER por bloqueo arriba).
function endGame(result) {
  gameOver = true;
  cancelAnimationFrame(animId);
  const win = result === 'win';
  let text = `Puntuación: ${score.toLocaleString()}`;
  if (mode !== 'classic') text += ` · Tiempo ${fmtTime(elapsed)}`;
  registerRecord();
  showOverlay(win ? '¡OBJETIVO CUMPLIDO!' : (result || 'GAME OVER'), text, { win, records: true });
  // foco con retardo: evita que teclas aún pulsadas (Espacio, flechas) acaben en el input
  if (pendingRecord) setTimeout(() => { if (pendingRecord) nameInput.focus(); }, 600);
}

function showMenu() {
  cancelAnimationFrame(animId);
  abilityOptions = null;
  paused = false;
  gameOver = true;
  commitPending();
  showOverlay('ELIGE MODO', '', { menu: true, records: true });
}

function buildModeList() {
  for (const [id, ch] of Object.entries(CHALLENGES)) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'mode-btn';
    const name = document.createElement('strong');
    name.textContent = ch.name;
    const desc = document.createElement('span');
    desc.textContent = ch.desc;
    btn.append(name, desc);
    btn.addEventListener('click', () => init(id));
    modeList.appendChild(btn);
  }
}

// Reanuda tras una pausa o un menú de habilidades: oculta el overlay y rearranca el loop.
function resume() {
  paused = false;
  overlay.classList.add('hidden');
  lastTime = performance.now();
  loop(lastTime);
}

function togglePause() {
  if (gameOver) return;
  paused = !paused;
  if (!paused) {
    resume();
  } else {
    cancelAnimationFrame(animId);
    showOverlay('PAUSA', '');
  }
}

function loop(ts) {
  const dt = ts - lastTime;
  lastTime = ts;
  flashLeft = Math.max(0, flashLeft - dt);
  for (const p of popups) p.life -= dt;
  popups = popups.filter(p => p.life > 0);
  if (slowLeft > 0) slowLeft = Math.max(0, slowLeft - dt);
  if (freezeLeft > 0) freezeLeft = Math.max(0, freezeLeft - dt);
  else dropAccum += dt;
  if (dropAccum >= dropInterval * (slowLeft > 0 ? SLOW_FACTOR : 1)) {
    dropAccum = 0;
    if (!collide(current.shape, current.x, current.y + 1)) {
      current.y++;
      lastMoveRotate = false;
    } else {
      lockPiece();
    }
  }
  updateChallenge(dt);
  draw();
  // endGame() puede ejecutarse dentro de este frame (caída por gravedad):
  // su cancelAnimationFrame no cancela el frame en curso, así que no reprogramar.
  if (gameOver) return;
  animId = requestAnimationFrame(loop);
}

function init(modeId = mode) {
  commitPending();
  mode = modeId;
  board = createBoard();
  if (mode === 'fixed') placeStones();
  elapsed = 0;
  garbageAccum = 0;
  fadeCells = [];
  lastGoalText = null;
  goalSection.classList.toggle('hidden', mode === 'classic');
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
  combo = 0;
  maxCombo = 0;
  b2bActive = false;
  lastMoveRotate = false;
  popups = [];
  energy = 0;
  holdType = null;
  previewLeft = 0;
  slowLeft = 0;
  undoSnapshot = null;
  abilityOptions = null;
  energySection.classList.toggle('hidden', !abilitiesOn());
  holdUsed = false;
  lastTime = performance.now();
  queue = [];
  fillQueue();
  spawn();
  updateHUD();
  updateGoal();
  overlayTitle.classList.remove('win');
  overlay.classList.add('hidden');
  cancelAnimationFrame(animId);
  animId = requestAnimationFrame(loop);
}

document.addEventListener('keydown', e => {
  // escribiendo el nombre del record: el juego no intercepta ninguna tecla
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
  initAudio(); // el navegador exige un gesto del usuario para crear el AudioContext
  if (e.code === 'KeyM') { toggleMute(); return; }
  if (abilityOptions) { handleAbilityKey(e); return; }
  if (e.code === 'KeyP') { togglePause(); return; }
  if (paused || gameOver) return;
  switch (e.code) {
    case 'ArrowLeft':
      if (!collide(current.shape, current.x - 1, current.y)) { current.x--; lastMoveRotate = false; }
      break;
    case 'ArrowRight':
      if (!collide(current.shape, current.x + 1, current.y)) { current.x++; lastMoveRotate = false; }
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
    case 'KeyE':
      if (!e.repeat) openAbilityMenu();
      break;
    case 'KeyC':
    case 'ShiftLeft':
    case 'ShiftRight':
      if (!e.repeat) holdPiece();
      break;
  }
  updateHUD();
});

restartBtn.addEventListener('click', () => init(mode));
nameSaveBtn.addEventListener('click', () => { commitPending(nameInput.value); nameSaveBtn.blur(); });
nameInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') { e.preventDefault(); commitPending(nameInput.value); nameInput.blur(); }
});
resetRecordsBtn.addEventListener('click', () => {
  if (confirm('¿Borrar todos los records?')) resetRecords();
  resetRecordsBtn.blur();
});
menuBtn.addEventListener('click', showMenu);

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
    drawPanels();
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

muted = loadMuted();
records = loadRecords();
applyTheme(loadTheme());
buildModeList();
showMenu();
