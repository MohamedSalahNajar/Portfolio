const N = 4;
let tiles, empty, moves, best, startTime, timerInterval, won;
best = parseInt(localStorage.getItem('puzzle_best') || '0') || null;

function newGame() {
  tiles = Array.from({ length: N * N }, (_, i) => i);
  for (let i = tiles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
  }
  while (!isSolvable(tiles)) { [tiles[0], tiles[1]] = [tiles[1], tiles[0]]; }
  empty = tiles.indexOf(0);
  moves = 0; won = false;
  document.getElementById('moves').textContent = 0;
  document.getElementById('message').textContent = '';
  document.getElementById('best').textContent = best || '—';
  clearInterval(timerInterval);
  startTime = null;
  document.getElementById('timer').textContent = '0:00';
  render();
}

function isSolvable(arr) {
  let inv = 0;
  const flat = arr.filter(x => x !== 0);
  for (let i = 0; i < flat.length; i++)
    for (let j = i + 1; j < flat.length; j++)
      if (flat[i] > flat[j]) inv++;
  const rowFromBottom = N - Math.floor(arr.indexOf(0) / N);
  if (N % 2 === 1) return inv % 2 === 0;
  return rowFromBottom % 2 === 0 ? inv % 2 === 1 : inv % 2 === 0;
}

function getMovable() {
  const er = Math.floor(empty / N), ec = empty % N;
  return tiles.map((_, i) => {
    const r = Math.floor(i / N), c = i % N;
    return Math.abs(r - er) + Math.abs(c - ec) === 1 ? i : -1;
  }).filter(i => i !== -1);
}

function render() {
  const board = document.getElementById('board');
  board.innerHTML = '';
  const movable = getMovable();
  tiles.forEach((val, idx) => {
    const tile = document.createElement('div');
    tile.className = 'tile'
      + (val === 0 ? ' empty' : '')
      + (movable.includes(idx) ? ' movable' : '')
      + (val !== 0 && val === idx + 1 ? ' correct' : '');
    if (val !== 0) tile.textContent = val;
    if (val !== 0) tile.addEventListener('click', () => tryMove(idx));
    board.appendChild(tile);
  });
}

function tryMove(idx) {
  if (won) return;
  if (!getMovable().includes(idx)) return;
  if (!startTime) {
    startTime = Date.now();
    timerInterval = setInterval(updateTimer, 500);
  }
  [tiles[idx], tiles[empty]] = [tiles[empty], tiles[idx]];
  empty = idx;
  moves++;
  document.getElementById('moves').textContent = moves;
  render();
  checkWin();
}

function updateTimer() {
  if (!startTime) return;
  const s = Math.floor((Date.now() - startTime) / 1000);
  document.getElementById('timer').textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function checkWin() {
  if (tiles.every((v, i) => i === N * N - 1 ? v === 0 : v === i + 1)) {
    won = true;
    clearInterval(timerInterval);
    if (!best || moves < best) {
      best = moves;
      localStorage.setItem('puzzle_best', best);
      document.getElementById('best').textContent = best;
    }
    document.getElementById('win-stat').textContent = `${moves} moves`;
    setTimeout(() => document.getElementById('win-modal').classList.add('show'), 400);
  }
}

function solveHint() {
  const movable = getMovable();
  if (!movable.length) return;
  let bestIdx = null, bestScore = Infinity;
  movable.forEach(idx => {
    const val = tiles[idx];
    const target = val - 1;
    const er = Math.floor(empty / N), ec = empty % N;
    const tr = Math.floor(target / N), tc = target % N;
    const before = Math.abs(Math.floor(idx/N)-tr)+Math.abs(idx%N-tc);
    const after = Math.abs(er-tr)+Math.abs(ec-tc);
    if (after < before && after < bestScore) { bestScore = after; bestIdx = idx; }
  });
  const hint = bestIdx !== null ? bestIdx : movable[0];
  const el = document.getElementById('board').children[hint];
  el.style.outline = '2px solid #ec4899';
  el.style.outlineOffset = '-2px';
  setTimeout(() => { el.style.outline = ''; el.style.outlineOffset = ''; }, 900);
}

document.addEventListener('keydown', e => {
  const er = Math.floor(empty / N), ec = empty % N;
  const dirs = { ArrowUp: [er+1,ec], ArrowDown: [er-1,ec], ArrowLeft: [er,ec+1], ArrowRight: [er,ec-1] };
  if (dirs[e.key]) {
    e.preventDefault();
    const [r, c] = dirs[e.key];
    if (r >= 0 && r < N && c >= 0 && c < N) tryMove(r * N + c);
  }
});

newGame();