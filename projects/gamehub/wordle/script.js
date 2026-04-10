const WORDS = ["crane","slate","audio","pilot","ghost","plank","river","storm","night","brave","cloud","sword","flame","pride","ocean","quest","vivid","abbey","blaze","crisp","delta","ember","flair","gloom","havoc","infer","joust","knack","lunar","manor","nymph","optic","pixel","quart","relic","shrug","thorn","vapor","wrath","yacht","about","black","cheap","drift","force","groan","heart","ivory","jaded","karma","lemon","magic","nerve","oxide","paper","quote","radar","scary","twist","unity","vault","watch","extra","youth","zebra","ample","boxer","civic","daisy","ensue","fudge","gripe","hound","index","judge","kiosk","lapel","mirth","notch","olive","piano","quirk","repay","swamp","taboo","uncle","vicar","waltz","yearn","zesty","frown","bland","crush","droop","flute","grime","harsh","jerky","kneel","latch","moist","nudge","ought","perch","query","ranch","scoff","thump","unzip","voter","wring","expel","youth","zonal","brisk","chant","dizzy","elite","froze","gusto","helix","irony","jumpy","kitty","lusty","mauve","ninety","opaque","prone","quill","rugby","stomp","trove","upset","verge","wider","yacht","zippy"];

let secret, guesses, currentRow, currentCol, gameOver;
let streak = parseInt(localStorage.getItem('wordle_streak') || '0');
let bestStreak = parseInt(localStorage.getItem('wordle_best_streak') || '0');

function initGame() {
  secret = WORDS[Math.floor(Math.random() * WORDS.length)];
  guesses = Array.from({ length: 6 }, () => Array(5).fill(''));
  currentRow = 0; currentCol = 0; gameOver = false;
  document.getElementById('streak').textContent = streak;
  document.getElementById('best-streak').textContent = bestStreak;
  document.getElementById('message').textContent = '';
  document.getElementById('btn-new').style.display = 'none';
  buildGrid();
  buildKeyboard();
}

function buildGrid() {
  const g = document.getElementById('grid');
  g.innerHTML = '';
  for (let r = 0; r < 6; r++) {
    const row = document.createElement('div');
    row.className = 'row';
    for (let c = 0; c < 5; c++) {
      const tile = document.createElement('div');
      tile.className = 'tile';
      tile.id = `t${r}${c}`;
      row.appendChild(tile);
    }
    g.appendChild(row);
  }
}

const KB_ROWS = [
  ['Q','W','E','R','T','Y','U','I','O','P'],
  ['A','S','D','F','G','H','J','K','L'],
  ['ENTER','Z','X','C','V','B','N','M','⌫']
];

function buildKeyboard() {
  const kb = document.getElementById('keyboard');
  kb.innerHTML = '';
  KB_ROWS.forEach(row => {
    const rowEl = document.createElement('div');
    rowEl.className = 'kb-row';
    row.forEach(k => {
      const btn = document.createElement('button');
      btn.className = 'key' + (k === 'ENTER' || k === '⌫' ? ' wide' : '');
      btn.textContent = k;
      btn.dataset.key = k;
      btn.addEventListener('click', () => handleKey(k));
      rowEl.appendChild(btn);
    });
    kb.appendChild(rowEl);
  });
}

function handleKey(k) {
  if (gameOver) return;
  if (k === '⌫' || k === 'Backspace') {
    if (currentCol > 0) {
      currentCol--;
      guesses[currentRow][currentCol] = '';
      setTile(currentRow, currentCol, '', '');
    }
  } else if (k === 'ENTER' || k === 'Enter') {
    submitGuess();
  } else if (/^[a-zA-Z]$/.test(k) && currentCol < 5) {
    const l = k.toLowerCase();
    guesses[currentRow][currentCol] = l;
    setTile(currentRow, currentCol, l.toUpperCase(), 'filled');
    currentCol++;
  }
}

function setTile(r, c, letter, cls) {
  const t = document.getElementById(`t${r}${c}`);
  t.textContent = letter;
  t.className = 'tile' + (cls ? ' ' + cls : '');
}

function submitGuess() {
  if (currentCol < 5) { shakeRow(currentRow); showMsg('Not enough letters'); return; }
  const word = guesses[currentRow].join('');
  if (!WORDS.includes(word)) { shakeRow(currentRow); showMsg('Not in word list'); return; }

  const result = evaluate(word, secret);
  const keyMap = {};

  result.forEach((cls, i) => {
    setTimeout(() => {
      const t = document.getElementById(`t${currentRow}${i}`);
      t.classList.add('flip');
      setTimeout(() => { t.className = `tile ${cls}`; }, 250);
      const k = guesses[currentRow][i].toUpperCase();
      if (cls === 'correct') keyMap[k] = 'correct';
      else if (cls === 'present' && keyMap[k] !== 'correct') keyMap[k] = 'present';
      else if (!keyMap[k]) keyMap[k] = 'absent';
    }, i * 120);
  });

  const delay = 5 * 120 + 320;
  setTimeout(() => {
    Object.entries(keyMap).forEach(([k, cls]) => {
      const btn = document.querySelector(`[data-key="${k}"]`);
      if (!btn) return;
      const cur = btn.classList.contains('correct') ? 'correct' : btn.classList.contains('present') ? 'present' : null;
      if (cur === 'correct') return;
      if (cur === 'present' && cls === 'absent') return;
      btn.className = `key${k.length > 1 ? ' wide' : ''} ${cls}`;
    });

    if (word === secret) {
      streak++;
      if (streak > bestStreak) bestStreak = streak;
      localStorage.setItem('wordle_streak', streak);
      localStorage.setItem('wordle_best_streak', bestStreak);
      document.getElementById('streak').textContent = streak;
      document.getElementById('best-streak').textContent = bestStreak;
      showMsg(['🎉 Brilliant!','🧠 Genius!','✨ Magnificent!','👏 Impressive!','😊 Splendid!','😅 Phew!'][currentRow]);
      gameOver = true;
      document.getElementById('btn-new').style.display = 'inline-flex';
    } else {
      currentRow++; currentCol = 0;
      if (currentRow === 6) {
        streak = 0;
        localStorage.setItem('wordle_streak', 0);
        document.getElementById('streak').textContent = 0;
        showMsg(secret.toUpperCase());
        gameOver = true;
        document.getElementById('btn-new').style.display = 'inline-flex';
      }
    }
  }, delay);
}

function evaluate(guess, answer) {
  const res = Array(5).fill('absent');
  const pool = answer.split('');
  for (let i = 0; i < 5; i++) {
    if (guess[i] === answer[i]) { res[i] = 'correct'; pool[i] = null; }
  }
  for (let i = 0; i < 5; i++) {
    if (res[i] === 'correct') continue;
    const idx = pool.indexOf(guess[i]);
    if (idx !== -1) { res[i] = 'present'; pool[idx] = null; }
  }
  return res;
}

function shakeRow(r) {
  for (let c = 0; c < 5; c++) {
    const t = document.getElementById(`t${r}${c}`);
    t.classList.add('shake');
    t.addEventListener('animationend', () => t.classList.remove('shake'), { once: true });
  }
}

let msgTimer;
function showMsg(txt) {
  const m = document.getElementById('message');
  m.textContent = txt;
  clearTimeout(msgTimer);
  if (!gameOver) msgTimer = setTimeout(() => m.textContent = '', 1800);
}

document.addEventListener('keydown', e => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  handleKey(e.key);
});

initGame();