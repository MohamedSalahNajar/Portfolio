const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const COLS = 20, ROWS = 20, CELL = 20;

let snake, dir, nextDir, food, score, best, alive, started, paused, intervalId, level;
best = parseInt(localStorage.getItem('snake_best') || '0');
document.getElementById('best').textContent = best;

function init() {
  snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
  dir = { x: 1, y: 0 };
  nextDir = { x: 1, y: 0 };
  score = 0; level = 1;
  alive = true; paused = false;
  spawnFood();
  updateHUD();
  draw();
}

function spawnFood() {
  let pos;
  do { pos = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) }; }
  while (snake.some(s => s.x === pos.x && s.y === pos.y));
  food = pos;
}

function setDir(x, y) {
  if (!started || !alive) return;
  if ((x !== 0 && dir.x === 0) || (y !== 0 && dir.y === 0)) nextDir = { x, y };
}

function tick() {
  if (!alive || paused) return;
  dir = nextDir;
  const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

  if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS || snake.some(s => s.x === head.x && s.y === head.y)) {
    alive = false;
    clearInterval(intervalId);
    if (score > best) { best = score; localStorage.setItem('snake_best', best); }
    showOverlay('GAME OVER', 'Tap or SPACE to retry', score);
    draw(); return;
  }

  snake.unshift(head);
  if (head.x === food.x && head.y === food.y) {
    score++;
    level = 1 + Math.floor(score / 5);
    spawnFood();
    clearInterval(intervalId);
    intervalId = setInterval(tick, Math.max(60, 200 - level * 15));
  } else {
    snake.pop();
  }
  updateHUD();
  draw();
}

function draw() {
  // background
  ctx.fillStyle = '#020617';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // grid
  ctx.strokeStyle = 'rgba(99,102,241,0.06)';
  ctx.lineWidth = 0.5;
  for (let x = 0; x <= COLS; x++) {
    ctx.beginPath(); ctx.moveTo(x * CELL, 0); ctx.lineTo(x * CELL, canvas.height); ctx.stroke();
  }
  for (let y = 0; y <= ROWS; y++) {
    ctx.beginPath(); ctx.moveTo(0, y * CELL); ctx.lineTo(canvas.width, y * CELL); ctx.stroke();
  }

  // food — glowing dot
  const gf = ctx.createRadialGradient(
    food.x * CELL + CELL / 2, food.y * CELL + CELL / 2, 1,
    food.x * CELL + CELL / 2, food.y * CELL + CELL / 2, CELL / 2 - 1
  );
  gf.addColorStop(0, '#ec4899');
  gf.addColorStop(1, 'rgba(236,72,153,0.3)');
  ctx.shadowBlur = 12; ctx.shadowColor = '#ec4899';
  ctx.fillStyle = gf;
  ctx.beginPath();
  ctx.arc(food.x * CELL + CELL / 2, food.y * CELL + CELL / 2, CELL / 2 - 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // snake
  snake.forEach((seg, i) => {
    const t = 1 - (i / snake.length) * 0.55;
    ctx.shadowBlur = i === 0 ? 16 : 0;
    ctx.shadowColor = 'rgba(99,102,241,0.8)';
    const r = 3;
    ctx.fillStyle = i === 0
      ? '#6366f1'
      : `rgba(99,102,241,${t})`;
    ctx.beginPath();
    ctx.roundRect(seg.x * CELL + 1, seg.y * CELL + 1, CELL - 2, CELL - 2, r);
    ctx.fill();
  });
  ctx.shadowBlur = 0;

  if (!alive && started) {
    ctx.fillStyle = 'rgba(239,68,68,0.06)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

function updateHUD() {
  document.getElementById('score').textContent = score;
  document.getElementById('best').textContent = best;
  document.getElementById('level').textContent = level;
}

function showOverlay(title, sub, sc) {
  document.getElementById('overlay-title').textContent = title;
  document.getElementById('overlay-sub').textContent = sub;
  const el = document.getElementById('overlay-score');
  if (sc !== undefined) { el.textContent = sc; el.style.display = 'block'; }
  else el.style.display = 'none';
  document.getElementById('overlay').classList.add('show');
}

function hideOverlay() {
  document.getElementById('overlay').classList.remove('show');
}

function handleSpace() {
  if (!started) {
    started = true; hideOverlay();
    init();
    intervalId = setInterval(tick, 200);
  } else if (!alive) {
    hideOverlay(); init();
    intervalId = setInterval(tick, 200);
  } else {
    paused = !paused;
    if (paused) showOverlay('PAUSED', 'Press SPACE to resume');
    else hideOverlay();
  }
}

document.addEventListener('keydown', e => {
  if (e.key === ' ') { e.preventDefault(); handleSpace(); return; }
  const map = { ArrowUp:[0,-1], ArrowDown:[0,1], ArrowLeft:[-1,0], ArrowRight:[1,0], w:[0,-1], s:[0,1], a:[-1,0], d:[1,0] };
  if (map[e.key]) { e.preventDefault(); setDir(...map[e.key]); }
});
canvas.addEventListener('click', handleSpace);

init();