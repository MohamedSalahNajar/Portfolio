/* ============================================================
   HabitFlow — app.js
   Real-time delete (no reload), no emoji picker
   ============================================================ */

// ── Storage ──────────────────────────────────────────────────
const store = {
  get: (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
};

// ── Date helpers ─────────────────────────────────────────────
const todayStr = () => new Date().toISOString().split('T')[0];

function daysBack(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

function fmtDate(str) {
  return new Date(str + 'T12:00:00').toLocaleDateString('en-US',
    { weekday: 'short', month: 'short', day: 'numeric' });
}

// ── State ────────────────────────────────────────────────────
let habits = store.get('habitflow_habits', []);
let filter = 'all';

function save() { store.set('habitflow_habits', habits); }

// ── Boot ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  setupTheme();
  setupNavScroll();
  setupAddForm();
  setupFilterTabs();
  setTodayLabel();
  render();
});

// ── Theme ────────────────────────────────────────────────────
function setupTheme() {
  const html = document.documentElement;
  const btn  = document.getElementById('theme-toggle');
  const icon = btn.querySelector('.theme-icon');
  const saved = store.get('habitflow_theme', 'dark');
  html.setAttribute('data-theme', saved);
  icon.textContent = saved === 'dark' ? '🌙' : '☀️';
  btn.addEventListener('click', () => {
    const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    icon.textContent = next === 'dark' ? '🌙' : '☀️';
    store.set('habitflow_theme', next);
  });
}

// ── Navbar scroll ─────────────────────────────────────────────
function setupNavScroll() {
  const nav = document.getElementById('navbar');
  window.addEventListener('scroll', () => nav.classList.toggle('scrolled', window.scrollY > 40));
}

// ── Add form ──────────────────────────────────────────────────
function setupAddForm() {
  const input = document.getElementById('habit-input');
  document.getElementById('add-btn').addEventListener('click', addHabit);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') addHabit(); });
}

function addHabit() {
  const input    = document.getElementById('habit-input');
  const category = document.getElementById('habit-category').value;
  const goal     = parseInt(document.getElementById('habit-goal').value);
  const name     = input.value.trim();

  if (!name) {
    input.style.borderColor = 'var(--danger)';
    input.focus();
    setTimeout(() => input.style.borderColor = '', 1000);
    return;
  }

  const habit = {
    id:      Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
    name,
    category,
    goal,
    done:    {},
    created: todayStr(),
  };

  habits.push(habit);
  save();
  input.value = '';
  input.focus();

  // insert into today list immediately
  appendTodayItem(habit);
  appendTableRow(habit);
  updateStats();
  updateHeatmap();
  updateRing();
  updateTopStreak();
}

// ── Filter tabs ───────────────────────────────────────────────
function setupFilterTabs() {
  document.getElementById('filter-tabs').addEventListener('click', e => {
    const tab = e.target.closest('.ftab');
    if (!tab) return;
    filter = tab.dataset.filter;
    document.querySelectorAll('.ftab').forEach(t => t.classList.toggle('active', t === tab));
    renderTable();
  });
}

// ── Today label ───────────────────────────────────────────────
function setTodayLabel() {
  const el = document.getElementById('today-date');
  if (el) el.textContent = new Date().toLocaleDateString('en-US',
    { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

// ── Toggle done ───────────────────────────────────────────────
function toggleDone(id) {
  const h = habits.find(h => h.id === id);
  if (!h) return;
  const today = todayStr();
  if (h.done[today]) delete h.done[today];
  else h.done[today] = true;
  save();

  // update today item in-place
  const item = document.querySelector(`.habit-item[data-id="${id}"]`);
  if (item) {
    const isDone = !!h.done[today];
    item.classList.toggle('done', isDone);
    item.querySelector('.check-circle').textContent = isDone ? '✓' : '';
    const s = currentStreak(h);
    const badge = item.querySelector('.habit-streak');
    badge.textContent = s > 0 ? `🔥 ${s}d` : '—';
    badge.className = 'habit-streak' + (s === 0 ? ' cold' : '');
  }

  // update table row streak dots
  const row = document.querySelector(`.ht-row[data-id="${id}"]`);
  if (row) updateRowDots(row, h);

  updateRing();
  updateStats();
  updateHeatmap();
  updateTopStreak();
}

// ── Delete (REAL-TIME, no reload) ─────────────────────────────
function deleteHabit(id) {
  // animate out both the today item and the table row
  const todayItem = document.querySelector(`.habit-item[data-id="${id}"]`);
  const tableRow  = document.querySelector(`.ht-row[data-id="${id}"]`);

  function afterRemove() {
    habits = habits.filter(h => h.id !== id);
    save();
    // remove DOM nodes after animation
    todayItem?.remove();
    tableRow?.remove();
    // show empty state if needed
    if (habits.length === 0) {
      document.getElementById('habits-list').innerHTML =
        `<div class="empty-state"><span class="empty-icon">🌱</span><p>No habits yet. Add your first one below!</p></div>`;
      document.getElementById('habits-table').innerHTML =
        `<div class="empty-state"><span class="empty-icon">🔍</span><p>No habits yet.</p></div>`;
    }
    updateRing();
    updateStats();
    updateHeatmap();
    updateTopStreak();
  }

  if (todayItem) {
    todayItem.classList.add('removing');
    todayItem.addEventListener('animationend', afterRemove, { once: true });
  } else if (tableRow) {
    tableRow.classList.add('removing');
    tableRow.addEventListener('animationend', afterRemove, { once: true });
  } else {
    afterRemove();
  }

  if (tableRow && tableRow !== todayItem) tableRow.classList.add('removing');
}

// ── Streak helpers ────────────────────────────────────────────
function currentStreak(h) {
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today); d.setDate(today.getDate() - i);
    const key = d.toISOString().split('T')[0];
    if (h.done[key]) streak++;
    else if (i > 0) break;
  }
  return streak;
}

function longestStreak(h) {
  const dates = Object.keys(h.done).filter(k => h.done[k]).sort();
  let max = 0, cur = 0, prev = null;
  dates.forEach(d => {
    if (prev) {
      const diff = (new Date(d) - new Date(prev)) / 86400000;
      cur = diff === 1 ? cur + 1 : 1;
    } else cur = 1;
    if (cur > max) max = cur;
    prev = d;
  });
  return max;
}

// ── Full render (initial load) ────────────────────────────────
function render() {
  renderTodayList();
  renderTable();
  updateStats();
  updateHeatmap();
  updateRing();
  updateTopStreak();
}

// ── Today list ────────────────────────────────────────────────
function renderTodayList() {
  const list = document.getElementById('habits-list');
  list.innerHTML = '';
  if (!habits.length) {
    list.innerHTML = `<div class="empty-state"><span class="empty-icon">🌱</span><p>No habits yet. Add your first one below!</p></div>`;
    return;
  }
  habits.forEach(h => appendTodayItem(h, list));
}

function appendTodayItem(h, container) {
  const list   = container || document.getElementById('habits-list');
  const empty  = list.querySelector('.empty-state');
  if (empty) empty.remove();

  const today  = todayStr();
  const isDone = !!h.done[today];
  const streak = currentStreak(h);

  const item = document.createElement('div');
  item.className = 'habit-item' + (isDone ? ' done' : '');
  item.dataset.id = h.id;
  item.innerHTML = `
    <div class="check-circle">${isDone ? '✓' : ''}</div>
    <span class="habit-name">${h.name}</span>
    <span class="habit-streak ${streak === 0 ? 'cold' : ''}">${streak > 0 ? `🔥 ${streak}d` : '—'}</span>
    <button class="habit-del" title="Delete habit">✕</button>
  `;

  // toggle done on row click (not delete btn)
  item.addEventListener('click', e => {
    if (e.target.closest('.habit-del')) return;
    toggleDone(h.id);
  });

  item.querySelector('.habit-del').addEventListener('click', e => {
    e.stopPropagation();
    deleteHabit(h.id);
  });

  list.appendChild(item);
}

// ── Table ─────────────────────────────────────────────────────
function renderTable() {
  const wrap = document.getElementById('habits-table');
  wrap.innerHTML = '';
  const visible = filter === 'all' ? habits : habits.filter(h => h.category === filter);
  if (!visible.length) {
    wrap.innerHTML = `<div class="empty-state"><span class="empty-icon">🔍</span><p>No habits in this category.</p></div>`;
    return;
  }
  visible.forEach((h, i) => appendTableRow(h, i));
}

function appendTableRow(h, idx) {
  const wrap  = document.getElementById('habits-table');
  const empty = wrap.querySelector('.empty-state');
  if (empty) empty.remove();

  // skip if already in table
  if (wrap.querySelector(`.ht-row[data-id="${h.id}"]`)) return;

  const streak = currentStreak(h);
  const dots   = Array.from({ length: 7 }, (_, i) => {
    const d = daysBack(6 - i);
    return `<div class="ht-day ${h.done[d] ? 'done' : ''}"></div>`;
  }).join('');

  const row = document.createElement('div');
  row.className = 'ht-row';
  row.dataset.id = h.id;
  if (idx !== undefined) row.style.animationDelay = `${idx * 0.04}s`;
  row.innerHTML = `
    <div style="flex:1;min-width:0">
      <div class="ht-name">${h.name}</div>
      <div class="ht-cat">${catLabel(h.category)} · goal: ${h.goal === 7 ? 'daily' : `${h.goal}×/wk`}</div>
    </div>
    <div class="ht-streak-bar">${dots}</div>
    <div class="ht-streak-label">${streak > 0 ? `🔥 ${streak}d` : '—'}</div>
    <button class="ht-del" title="Delete">✕</button>
  `;

  row.querySelector('.ht-del').addEventListener('click', () => deleteHabit(h.id));
  wrap.appendChild(row);
}

function updateRowDots(row, h) {
  const bar = row.querySelector('.ht-streak-bar');
  if (!bar) return;
  bar.innerHTML = Array.from({ length: 7 }, (_, i) => {
    const d = daysBack(6 - i);
    return `<div class="ht-day ${h.done[d] ? 'done' : ''}"></div>`;
  }).join('');
  const s = currentStreak(h);
  const label = row.querySelector('.ht-streak-label');
  if (label) label.textContent = s > 0 ? `🔥 ${s}d` : '—';
}

// ── Ring ──────────────────────────────────────────────────────
function updateRing() {
  const today = todayStr();
  const done  = habits.filter(h => h.done[today]).length;
  const total = habits.length;
  const p     = total === 0 ? 0 : done / total;
  const circ  = 2 * Math.PI * 22;
  document.getElementById('ring-fill').style.strokeDashoffset = circ * (1 - p);
  document.getElementById('progress-pct').textContent = total === 0 ? '0%' : Math.round(p * 100) + '%';
}

// ── Stats ─────────────────────────────────────────────────────
function updateStats() {
  const best  = habits.length ? Math.max(0, ...habits.map(h => longestStreak(h))) : 0;
  const total = habits.reduce((s, h) => s + Object.values(h.done).filter(Boolean).length, 0);
  const rate  = calcRate7();
  document.getElementById('stat-streak').textContent = best;
  document.getElementById('stat-total').textContent  = total;
  document.getElementById('stat-habits').textContent = habits.length;
  document.getElementById('stat-rate').textContent   = rate + '%';
}

function calcRate7() {
  if (!habits.length) return 0;
  let possible = 0, done = 0;
  for (let i = 0; i < 7; i++) {
    const d = daysBack(i);
    possible += habits.length;
    done += habits.filter(h => h.done[d]).length;
  }
  return possible === 0 ? 0 : Math.round((done / possible) * 100);
}

// ── Top streak (navbar) ───────────────────────────────────────
function updateTopStreak() {
  const top = habits.length ? Math.max(0, ...habits.map(h => currentStreak(h))) : 0;
  document.getElementById('top-streak').textContent = top;
}

// ── Heatmap ───────────────────────────────────────────────────
function updateHeatmap() {
  const wrap = document.getElementById('heatmap');
  wrap.innerHTML = '';
  const max = habits.length || 1;
  for (let i = 29; i >= 0; i--) {
    const d   = daysBack(i);
    const n   = habits.filter(h => h.done[d]).length;
    const lvl = n === 0 ? 0 : n <= max * 0.33 ? 1 : n <= max * 0.66 ? 2 : 3;
    const cell = document.createElement('div');
    cell.className = 'hm-cell' + (lvl ? ` hm-l${lvl}` : '');
    cell.title = `${fmtDate(d)}: ${n} habit${n !== 1 ? 's' : ''}`;
    wrap.appendChild(cell);
  }
}

// ── Helpers ───────────────────────────────────────────────────
function catLabel(c) {
  return { health:'🏃 Health', mind:'🧠 Mind', skill:'🎯 Skill', social:'👥 Social', other:'✨ Other' }[c] || c;
}