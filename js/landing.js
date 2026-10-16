/* ============================
   LANDING.JS — Interactions
   ============================ */

// ── Navbar ────────────────────────────────────
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 60);
});

// ── Burger ────────────────────────────────────
const burger = document.getElementById('navBurger');
const navLinks = document.getElementById('navLinks');
burger?.addEventListener('click', () => {
  burger.classList.toggle('open');
  navLinks.classList.toggle('open');
});
document.querySelectorAll('.nav-link, .nav-cta').forEach(l =>
  l.addEventListener('click', () => { burger.classList.remove('open'); navLinks.classList.remove('open'); })
);

// ── Slider ────────────────────────────────────
let currentSlide = 0;
const totalSlides = 4;
let sliderTimer = null;

function goToSlide(index) {
  const slides = document.querySelectorAll('.slide');
  const dots = document.querySelectorAll('.slider-dot');
  slides[currentSlide].classList.remove('active');
  dots[currentSlide].classList.remove('active');
  currentSlide = (index + totalSlides) % totalSlides;
  slides[currentSlide].classList.add('active');
  dots[currentSlide].classList.add('active');
  const counter = document.getElementById('slideCurrentNum');
  if (counter) counter.textContent = currentSlide + 1;
  resetTimer();
}
window.goToSlide = goToSlide;

function changeSlide(dir) { goToSlide(currentSlide + dir); }
window.changeSlide = changeSlide;

function resetTimer() {
  clearInterval(sliderTimer);
  sliderTimer = setInterval(() => goToSlide(currentSlide + 1), 6000);
}

// Keyboard nav
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft') changeSlide(-1);
  if (e.key === 'ArrowRight') changeSlide(1);
});

// Touch swipe
let touchStartX = 0;
const slider = document.getElementById('heroSlider');
if (slider) {
  slider.addEventListener('touchstart', e => touchStartX = e.touches[0].clientX, { passive: true });
  slider.addEventListener('touchend', e => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) changeSlide(diff > 0 ? 1 : -1);
  });
}

// Start auto-play
resetTimer();

// ── FAQ ───────────────────────────────────────
function toggleFaq(btn) {
  const item = btn.closest('.faq-item');
  const isOpen = item.classList.contains('open');
  document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));
  if (!isOpen) item.classList.add('open');
}
window.toggleFaq = toggleFaq;

// ── Countdown ─────────────────────────────────
function updateCountdown() {
  const deadline = new Date('2026-09-30T23:59:59');
  const diff = deadline - new Date();
  const pad = n => String(Math.max(0, Math.floor(n))).padStart(2, '0');
  if (diff <= 0) { ['cd-days','cd-hours','cd-mins','cd-secs'].forEach(id => { const el = document.getElementById(id); if(el) el.textContent = '00'; }); return; }
  const el = (id, val) => { const e = document.getElementById(id); if(e) e.textContent = pad(val); };
  el('cd-days', diff / 86400000);
  el('cd-hours', (diff % 86400000) / 3600000);
  el('cd-mins', (diff % 3600000) / 60000);
  el('cd-secs', (diff % 60000) / 1000);
}
updateCountdown();
setInterval(updateCountdown, 1000);

// ── Smooth scroll ─────────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  });
});

// ── Init ──────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => { initScrollReveal(); });
