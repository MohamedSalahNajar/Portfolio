const EMOJIS = ['🚀','🎮','🌊','⚡','🔥','🎯','💎','🌙'];
let cards, flipped, matched, flips, startTime, timerInterval, locked;
let best = parseInt(localStorage.getItem('memory_best') || '0') || null;

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function newGame() {
  clearInterval(timerInterval);
  startTime = null;
  flipped = []; matched = new Set(); flips = 0; locked = false;
  document.getElementById('flips').textContent = 0;
  document.getElementById('pairs').textContent = 0;
  document.getElementById('timer').textContent = '0:00';
  document.getElementById('best').textContent = best ? `${best}f` : '—';
  cards = shuffle([...EMOJIS, ...EMOJIS]);
  render();
}

function render() {
  const board = document.getElementById('board');
  board.innerHTML = '';
  cards.forEach((emoji, i) => {
    const card = document.createElement('div');
    card.className = 'card'
      + (matched.has(i) ? ' matched' : '')
      + (flipped.includes(i) ? ' flipped' : '');
    card.innerHTML = `
      <div class="card-inner">
        <div class="card-front">?</div>
        <div class="card-back">${emoji}</div>
      </div>`;
    card.addEventListener('click', () => flip(i));
    board.appendChild(card);
  });
}

function flip(i) {
  if (locked || flipped.includes(i) || matched.has(i)) return;
  if (!startTime) {
    startTime = Date.now();
    timerInterval = setInterval(updateTimer, 500);
  }
  flipped.push(i);
  flips++;
  document.getElementById('flips').textContent = flips;
  render();

  if (flipped.length === 2) {
    locked = true;
    const [a, b] = flipped;
    if (cards[a] === cards[b]) {
      matched.add(a); matched.add(b);
      flipped = []; locked = false;
      document.getElementById('pairs').textContent = matched.size / 2;
      render();
      if (matched.size === cards.length) {
        clearInterval(timerInterval);
        if (!best || flips < best) {
          best = flips;
          localStorage.setItem('memory_best', best);
        }
        const s = Math.floor((Date.now() - startTime) / 1000);
        document.getElementById('win-stat').textContent =
          `${flips} flips · ${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;
        setTimeout(() => document.getElementById('win-modal').classList.add('show'), 400);
      }
    } else {
      setTimeout(() => { flipped = []; locked = false; render(); }, 950);
    }
  }
}

function updateTimer() {
  const s = Math.floor((Date.now() - startTime) / 1000);
  document.getElementById('timer').textContent = `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;
}

newGame();