const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const W = canvas.width, H = canvas.height;

const PAD_W = 72, PAD_H = 10, BALL_R = 6;
const BRICK_ROWS = 5, BRICK_COLS = 10;
const BRICK_GAP = 4;
const BRICK_W = (W - BRICK_GAP * (BRICK_COLS + 1)) / BRICK_COLS;
const BRICK_H = 14;
const BRICK_TOP = 44;

const ROW_COLORS = [
  ['#6366f1','rgba(99,102,241,0.6)'],
  ['#8b5cf6','rgba(139,92,246,0.6)'],
  ['#ec4899','rgba(236,72,153,0.6)'],
  ['#f59e0b','rgba(245,158,11,0.6)'],
  ['#10b981','rgba(16,185,129,0.6)'],
];

let pad, ball, bricks, score, lives, level, best, alive, started, paused;
best = parseInt(localStorage.getItem('breakout_best') || '0');

function initLevel() {
  bricks = [];
  for (let r = 0; r < BRICK_ROWS; r++)
    for (let c = 0; c < BRICK_COLS; c++)
      bricks.push({
        x: BRICK_GAP + c * (BRICK_W + BRICK_GAP),
        y: BRICK_TOP + r * (BRICK_H + BRICK_GAP),
        alive: true,
        color: ROW_COLORS[r][0],
        glow: ROW_COLORS[r][1],
        pts: BRICK_ROWS - r
      });
}

function resetBall() {
  const spd = 3.5 + level * 0.3;
  const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.6;
  ball = {
    x: pad.x + PAD_W / 2,
    y: pad.y - BALL_R - 2,
    vx: Math.cos(angle) * spd,
    vy: Math.sin(angle) * spd,
    launched: false
  };
}

function init() {
  pad = { x: W / 2 - PAD_W / 2, y: H - 32 };
  resetBall();
  initLevel();
}

function reset() {
  score = 0; lives = 3; level = 1; alive = true; paused = false;
  updateHUD();
  init();
  showOverlay('BREAKOUT', 'Press SPACE or tap to start');
  draw();
}

function updateHUD() {
  document.getElementById('score').textContent = score;
  document.getElementById('best').textContent = best;
  document.getElementById('lives').textContent = lives;
  document.getElementById('level').textContent = level;
}

const keys = {};
document.addEventListener('keydown', e => {
  keys[e.key] = true;
  if (e.key === ' ') { e.preventDefault(); handleSpace(); }
  if (['ArrowLeft','ArrowRight'].includes(e.key)) e.preventDefault();
});
document.addEventListener('keyup', e => { keys[e.key] = false; });

canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  pad.x = e.clientX - rect.left - PAD_W / 2;
  clampPad();
});

canvas.addEventListener('touchmove', e => {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  pad.x = e.touches[0].clientX - rect.left - PAD_W / 2;
  clampPad();
}, { passive: false });

canvas.addEventListener('click', handleSpace);

function clampPad() { pad.x = Math.max(0, Math.min(W - PAD_W, pad.x)); }

function movePadLeft()  { pad.x = Math.max(0, pad.x - 20); }
function movePadRight() { pad.x = Math.min(W - PAD_W, pad.x + 20); }

function handleSpace() {
  if (!started) {
    started = true; hideOverlay();
    ball.launched = true;
    requestAnimationFrame(loop);
  } else if (!alive) {
    hideOverlay(); reset();
    started = true;
    ball.launched = true;
    requestAnimationFrame(loop);
  } else if (!ball.launched) {
    ball.launched = true;
  } else {
    paused = !paused;
    if (paused) showOverlay('PAUSED', 'Press SPACE to resume');
    else { hideOverlay(); requestAnimationFrame(loop); }
  }
}

function loop() {
  if (!alive || paused) return;
  update(); draw();
  requestAnimationFrame(loop);
}

function update() {
  if (keys['ArrowLeft'])  { pad.x -= 5; clampPad(); }
  if (keys['ArrowRight']) { pad.x += 5; clampPad(); }

  if (!ball.launched) { ball.x = pad.x + PAD_W / 2; return; }

  ball.x += ball.vx;
  ball.y += ball.vy;

  if (ball.x - BALL_R < 0) { ball.x = BALL_R; ball.vx = Math.abs(ball.vx); }
  if (ball.x + BALL_R > W) { ball.x = W - BALL_R; ball.vx = -Math.abs(ball.vx); }
  if (ball.y - BALL_R < 0) { ball.y = BALL_R; ball.vy = Math.abs(ball.vy); }

  // paddle
  if (ball.vy > 0 &&
      ball.y + BALL_R >= pad.y &&
      ball.y + BALL_R <= pad.y + PAD_H + 5 &&
      ball.x >= pad.x - 2 &&
      ball.x <= pad.x + PAD_W + 2) {
    const rel = (ball.x - pad.x) / PAD_W - 0.5;
    const spd = Math.sqrt(ball.vx ** 2 + ball.vy ** 2);
    const angle = rel * Math.PI * 0.65 - Math.PI / 2;
    ball.vx = Math.cos(angle) * spd;
    ball.vy = Math.sin(angle) * spd;
    ball.y = pad.y - BALL_R;
  }

  // bottom
  if (ball.y - BALL_R > H) {
    lives--;
    updateHUD();
    if (lives <= 0) {
      alive = false;
      if (score > best) { best = score; localStorage.setItem('breakout_best', best); updateHUD(); }
      showOverlay('GAME OVER', 'Tap or SPACE to retry', score);
      return;
    }
    pad.x = W / 2 - PAD_W / 2;
    resetBall();
  }

  // bricks
  for (const b of bricks) {
    if (!b.alive) continue;
    if (ball.x + BALL_R > b.x && ball.x - BALL_R < b.x + BRICK_W &&
        ball.y + BALL_R > b.y && ball.y - BALL_R < b.y + BRICK_H) {
      b.alive = false;
      score += b.pts;
      updateHUD();
      const ol = ball.x + BALL_R - b.x;
      const or2 = b.x + BRICK_W - (ball.x - BALL_R);
      const ot = ball.y + BALL_R - b.y;
      const ob = b.y + BRICK_H - (ball.y - BALL_R);
      if (Math.min(ol, or2) < Math.min(ot, ob)) ball.vx *= -1;
      else ball.vy *= -1;
      break;
    }
  }

  // cleared
  if (bricks.every(b => !b.alive)) {
    level++; updateHUD(); init();
    ball.launched = true;
    const spd = 3.5 + level * 0.3;
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.4;
    ball.vx = Math.cos(angle) * spd;
    ball.vy = Math.sin(angle) * spd;
  }
}

function draw() {
  ctx.fillStyle = '#020617';
  ctx.fillRect(0, 0, W, H);

  // subtle grid
  ctx.strokeStyle = 'rgba(99,102,241,0.04)';
  ctx.lineWidth = 0.5;
  for (let x = 0; x < W; x += 20) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
  for (let y = 0; y < H; y += 20) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

  // bricks
  bricks.forEach(b => {
    if (!b.alive) return;
    ctx.shadowBlur = 8; ctx.shadowColor = b.glow;
    ctx.fillStyle = b.color;
    ctx.beginPath(); ctx.roundRect(b.x, b.y, BRICK_W, BRICK_H, 3); ctx.fill();
    // shine
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.beginPath(); ctx.roundRect(b.x + 1, b.y + 1, BRICK_W - 2, 4, [2,2,0,0]); ctx.fill();
  });
  ctx.shadowBlur = 0;

  // paddle — gradient
  const pg = ctx.createLinearGradient(pad.x, 0, pad.x + PAD_W, 0);
  pg.addColorStop(0, '#6366f1');
  pg.addColorStop(1, '#ec4899');
  ctx.shadowBlur = 12; ctx.shadowColor = 'rgba(99,102,241,0.7)';
  ctx.fillStyle = pg;
  ctx.beginPath(); ctx.roundRect(pad.x, pad.y, PAD_W, PAD_H, 5); ctx.fill();
  ctx.shadowBlur = 0;

  // ball
  const bg = ctx.createRadialGradient(ball.x - 1, ball.y - 1, 1, ball.x, ball.y, BALL_R);
  bg.addColorStop(0, '#fff');
  bg.addColorStop(1, 'rgba(139,92,246,0.8)');
  ctx.shadowBlur = 14; ctx.shadowColor = 'rgba(139,92,246,0.9)';
  ctx.fillStyle = bg;
  ctx.beginPath(); ctx.arc(ball.x, ball.y, BALL_R, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;
}

function showOverlay(t, s, sc) {
  document.getElementById('overlay-title').textContent = t;
  document.getElementById('overlay-sub').textContent = s || '';
  const el = document.getElementById('overlay-score');
  if (sc !== undefined) { el.textContent = sc; el.style.display = 'block'; }
  else el.style.display = 'none';
  document.getElementById('overlay').classList.add('show');
}
function hideOverlay() { document.getElementById('overlay').classList.remove('show'); }

reset();