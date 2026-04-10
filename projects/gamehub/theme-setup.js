/* ============================================================
   Theme Setup — Shared across all games
   ============================================================ */

function setupTheme() {
  const html = document.documentElement;
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;
  
  const icon = btn.querySelector('.theme-icon');
  const savedTheme = localStorage.getItem('arcadia_theme') || 'dark';
  
  html.setAttribute('data-theme', savedTheme);
  icon.textContent = savedTheme === 'dark' ? '🌙' : '☀️';
  
  btn.addEventListener('click', () => {
    const current = html.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    icon.textContent = next === 'dark' ? '🌙' : '☀️';
    localStorage.setItem('arcadia_theme', next);
  });
}

// Run on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupTheme);
} else {
  setupTheme();
}

// Setup navbar scroll effect
function setupNavbarScroll() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;
  
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupNavbarScroll);
} else {
  setupNavbarScroll();
}
