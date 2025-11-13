// UI + Accessibility improvements, intersection-observer animations, modal focus handling, theme toggle
(function(){
  // --- Helpers ---
  const $ = (sel, ctx=document) => ctx.querySelector(sel);
  const $$ = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));

  // --- Auth (simple frontend simulation) ---
  function isLoggedIn(){ return localStorage.getItem('tm_logged_in') === 'true'; }
  function setLoggedIn(val){ localStorage.setItem('tm_logged_in', val ? 'true' : 'false'); }

  // --- Theme ---
  const THEME_KEY = 'tm_theme';
  const themeToggle = $('#themeToggle');
  function applyTheme(theme){ document.documentElement.setAttribute('data-theme', theme); localStorage.setItem(THEME_KEY, theme); themeToggle && themeToggle.setAttribute('aria-pressed', theme === 'dark'); }
  function initTheme(){ const saved = localStorage.getItem(THEME_KEY) || 'light'; applyTheme(saved); }

  // --- Modal utilities ---
  function openModal(modal){ if(!modal) return; modal.setAttribute('aria-hidden','false'); modal.style.display = 'flex'; document.body.style.overflow = 'hidden'; // lock scroll
    // put focus on first input or close button
    const focusable = modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    focusable && focusable.focus();
  }
  function closeModal(modal){ if(!modal) return; modal.setAttribute('aria-hidden','true'); modal.style.display = 'none'; document.body.style.overflow = ''; }

  // --- Elements ---
  const bookBtn = $('#book-appointment-btn');
  const loginModal = $('#loginModal');
  const registerModal = $('#registerModal');
  const loginBtn = $('#loginBtn');
  const logoutBtn = $('#logoutBtn');
  const closeLogin = $('#closeLogin');
  const closeRegister = $('#closeRegister');
  const showRegister = $('#showRegister');
  const showLogin = $('#showLogin');
  const loginForm = $('#loginForm');
  const registerForm = $('#registerForm');
  const videoSection = $('#video-chat');
  const heroSection = document.querySelector('.hero');
  const featuresSection = document.querySelector('.features');
  const startCallBtn = $('#startCallBtn');
  const endCallBtn = $('#endCallBtn');
  const navToggle = $('#navToggle');
  const primaryNav = $('#primaryNav');

  // --- Update auth UI ---
  function updateAuthUI(){ if(isLoggedIn()){ loginBtn.style.display='none'; logoutBtn.style.display='inline-flex'; } else { loginBtn.style.display='inline-flex'; logoutBtn.style.display='none'; } }

  // --- Book appointment handler ---
  bookBtn && bookBtn.addEventListener('click', () => {
    if(isLoggedIn()){
      heroSection && (heroSection.style.display = 'none');
      featuresSection && (featuresSection.style.display = 'none');
      videoSection && (videoSection.style.display = 'block');
      window.scrollTo({top:0, behavior:'smooth'});
    } else {
      openModal(loginModal);
    }
  });

  // --- Video buttons ---
  startCallBtn && startCallBtn.addEventListener('click', () => { alert('WebRTC video call will start here (to be implemented)!'); });
  endCallBtn && endCallBtn.addEventListener('click', () => { if(videoSection) videoSection.style.display='none'; heroSection && (heroSection.style.display=''); featuresSection && (featuresSection.style.display=''); window.scrollTo({top:0, behavior:'smooth'}); });

  // --- Modal open/close ---
  loginBtn && loginBtn.addEventListener('click', (e)=>{ e.preventDefault(); openModal(loginModal); });
  logoutBtn && logoutBtn.addEventListener('click', (e)=>{ e.preventDefault(); setLoggedIn(false); updateAuthUI(); alert('Logged out'); if(videoSection) videoSection.style.display='none'; heroSection && (heroSection.style.display=''); featuresSection && (featuresSection.style.display=''); });

  closeLogin && closeLogin.addEventListener('click', ()=> closeModal(loginModal));
  closeRegister && closeRegister.addEventListener('click', ()=> closeModal(registerModal));

  showRegister && showRegister.addEventListener('click', (e)=>{ e.preventDefault(); closeModal(loginModal); openModal(registerModal); });
  showLogin && showLogin.addEventListener('click', (e)=>{ e.preventDefault(); closeModal(registerModal); openModal(loginModal); });

  window.addEventListener('click', (e)=>{ if(e.target === loginModal) closeModal(loginModal); if(e.target === registerModal) closeModal(registerModal); });

  // Close modals with Escape
  window.addEventListener('keydown', (e)=>{ if(e.key === 'Escape'){ if(loginModal && loginModal.getAttribute('aria-hidden') === 'false') closeModal(loginModal); if(registerModal && registerModal.getAttribute('aria-hidden') === 'false') closeModal(registerModal); } });

  // --- Forms (simulate) ---
  loginForm && loginForm.addEventListener('submit', (e)=>{ e.preventDefault(); setLoggedIn(true); updateAuthUI(); closeModal(loginModal); alert('Login successful!'); });

  registerForm && registerForm.addEventListener('submit', (e)=>{ e.preventDefault(); setLoggedIn(true); updateAuthUI(); closeModal(registerModal); alert('Registration successful!'); });

  // --- Intersection Observer for animations (better performance than scroll handlers) ---
  const observerOpts = { root: null, rootMargin: '0px', threshold: 0.08 };
  const io = ('IntersectionObserver' in window) ? new IntersectionObserver((entries)=>{ entries.forEach(entry=>{ if(entry.isIntersecting){ entry.target.classList.add('in-view'); } else { entry.target.classList.remove('in-view'); } }); }, observerOpts) : null;
  $$('animate-on-scroll').forEach(el => { if(io) io.observe(el); else el.classList.add('in-view'); });

  // --- Smooth scroll for nav links with data-scroll ---
  $$('[data-scroll]').forEach(a => { a.addEventListener('click', (e)=>{ e.preventDefault(); const href = a.getAttribute('href') || '#'; if(href.startsWith('#')){ const target = document.querySelector(href); if(target) target.scrollIntoView({behavior:'smooth', block:'start'}); } }); });

  // --- Mobile nav toggle ---
  if(navToggle && primaryNav){ navToggle.addEventListener('click', ()=>{ const expanded = navToggle.getAttribute('aria-expanded') === 'true'; navToggle.setAttribute('aria-expanded', String(!expanded)); primaryNav.style.display = expanded ? '' : 'flex'; }); }

  // --- Theme toggle ---
  if(themeToggle){ themeToggle.addEventListener('click', ()=>{ const cur = localStorage.getItem(THEME_KEY) || 'light'; const next = cur === 'light' ? 'dark' : 'light'; applyTheme(next); }); }

  // --- Init on DOM ready ---
  document.addEventListener('DOMContentLoaded', ()=>{ initTheme(); updateAuthUI(); // ensure initial visibility for nav on small screens
    if(primaryNav && window.innerWidth <= 1100) primaryNav.style.display = 'none';
  });

})();
