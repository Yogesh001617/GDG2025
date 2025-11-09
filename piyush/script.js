

// script.js (updated branding -> CURE GLAMS; localStorage key -> 'cureglams_bookings')
// Professional front-end demo: booking flow (localStorage) + interactive 3D tilt + bookings export page support.

// Utility: short selector helpers
const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));

// Set footer year
document.getElementById('year')?.textContent = new Date().getFullYear();

/* -------------------------
   UI: mobile nav toggle
   -------------------------*/
const navToggle = $('#navToggle');
const nav = $('.nav');
navToggle?.addEventListener('click', () => {
  nav?.classList.toggle('show');
});

/* -------------------------
   Booking modal and behaviour
   -------------------------*/
const bookingModal = $('#bookingModal');
const modalClose = $('#modalClose');
const modalServiceName = $('#modalServiceName');
const modalPrice = $('#modalPrice');
const modalDuration = $('#modalDuration');
const serviceIdInput = $('#serviceId');
const bookingForm = $('#bookingForm');
const bookingResultEl = $('#bookingResult');

function formatPriceForDisplay(price) {
  if (!price) return '₹0';
  const raw = String(price).trim();
  if (raw.includes('-')) {
    const parts = raw.split('-').map(p => p.trim());
    return parts.map(p => `₹${p}`).join(' – ');
  }
  return `₹${raw}`;
}

function formatDurationDisplay(duration) {
  if (!duration) return '';
  if (String(duration).includes('-')) {
    const parts = String(duration).split('-').map(p => p.trim());
    return `${parts[0]}–${parts[1]} mins`;
  }
  return `${duration} mins`;
}

function openModalForService(cardEl) {
  if (!cardEl) return;
  const id = cardEl.dataset.id || '';
  const name = cardEl.dataset.name || '';
  const price = cardEl.dataset.price || '0';
  const duration = cardEl.dataset.duration || '';
  serviceIdInput.value = id;
  modalServiceName.textContent = name;
  modalPrice.textContent = formatPriceForDisplay(price);
  modalDuration.textContent = duration ? `· ${formatDurationDisplay(duration)}` : '';
  bookingModal?.setAttribute('aria-hidden', 'false');

  // set date min to today
  const dateInput = $('#appointmentDate');
  if (dateInput) {
    const today = new Date().toISOString().slice(0,10);
    dateInput.min = today;
    dateInput.value = today;
  }

  // focus name
  setTimeout(()=> $('#customerName')?.focus(), 80);
}

function closeModal() {
  bookingModal?.setAttribute('aria-hidden', 'true');
  bookingResultEl && (bookingResultEl.textContent = '');
  bookingForm?.reset();
  modalDuration.textContent = '';
}

// Attach book buttons (delegated)
function attachBookButtons() {
  $$('.book-btn').forEach(btn => {
    btn.removeEventListener('click', bookBtnHandler);
    btn.addEventListener('click', bookBtnHandler);
  });
}
function bookBtnHandler(e) {
  const card = e.target.closest('.service-card');
  openModalForService(card);
}
attachBookButtons();

// header and hero book buttons: open first available service
$('#headerBookBtn')?.addEventListener('click', () => openModalForService($('.service-card')));
$('#heroBookBtn')?.addEventListener('click', () => openModalForService($('.service-card')));

// modal closing
modalClose?.addEventListener('click', closeModal);
bookingModal?.addEventListener('click', (e) => { if (e.target === bookingModal) closeModal(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

/* -------------------------
   Contact form (demo)
   -------------------------*/
function submitContact(e) {
  e.preventDefault();
  const f = e.target;
  const result = $('#contactResult');
  result.textContent = 'Thanks! We will get back to you shortly.';
  f.reset();
}

/* -------------------------
   Bookings persistence (localStorage demo)
   Key updated: 'cureglams_bookings'
   -------------------------*/
function generateBookingRef() {
  return 'CG-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2,8).toUpperCase();
}
function loadBookings() {
  try { return JSON.parse(localStorage.getItem('cureglams_bookings') || '[]'); } catch { return []; }
}
function saveBooking(b) {
  const items = loadBookings();
  items.push(b);
  localStorage.setItem('cureglams_bookings', JSON.stringify(items));
}

bookingForm?.addEventListener('submit', (e) => {
  e.preventDefault();
  const resultEl = bookingResultEl || document.createElement('p');
  resultEl.textContent = 'Saving booking...';

  const modalPriceText = (modalPrice?.textContent || '');
  const cleanedPrice = modalPriceText.replace(/[^\d\-–]/g, '').replace('–', '-');

  const payload = {
    id: generateBookingRef(),
    serviceId: serviceIdInput?.value || '',
    serviceName: modalServiceName?.textContent || '',
    price: cleanedPrice || '',
    customerName: $('#customerName')?.value || '',
    email: $('#customerEmail')?.value || '',
    phone: $('#customerPhone')?.value || '',
    date: $('#appointmentDate')?.value || '',
    time: $('#appointmentTime')?.value || '',
    notes: $('#notes')?.value || '',
    createdAt: new Date().toISOString()
  };

  // Basic validation
  if (!payload.customerName || !payload.email || !payload.date || !payload.time) {
    resultEl.textContent = 'Please fill out all required fields.';
    return;
  }

  try {
    saveBooking(payload);
    resultEl.textContent = `Booking confirmed! Reference: ${payload.id}`;
    setTimeout(()=> { closeModal(); }, 1200);
  } catch (err) {
    console.error(err);
    resultEl.textContent = 'Failed to save booking. See console for details.';
  }
});

/* -------------------------
   3D cursor-follow tilt (per-card)
   - uses pointer events and rAF for smoothness
   - respects prefers-reduced-motion and disables under mobile width
   -------------------------*/
(function enable3DTilt() {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const MIN_DESKTOP_WIDTH = 700;
  if (window.innerWidth < MIN_DESKTOP_WIDTH) return;
  const cards = $$('.service-card');
  if (!cards.length) return;

  cards.forEach(card => {
    // ensure shine exists
    if (!card.querySelector('.shine')) {
      const s = document.createElement('div');
      s.className = 'shine';
      card.appendChild(s);
    }
    let rafId = null;
    let latestEvent = null;
    const MAX_ROTATE_Y = 10;
    const MAX_ROTATE_X = 7;
    const MAX_TRANSLATE_Z = 26;
    const SCALE_ON_HOVER = 1.02;

    function updateFromEvent(ev) {
      latestEvent = ev;
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        if (!latestEvent) return;
        if (latestEvent.pointerType === 'touch') return;

        const rect = card.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const px = ('clientX' in latestEvent) ? latestEvent.clientX : latestEvent.pageX - window.scrollX;
        const py = ('clientY' in latestEvent) ? latestEvent.clientY : latestEvent.pageY - window.scrollY;
        const dx = px - cx, dy = py - cy;
        const nx = Math.max(-1, Math.min(1, dx / (rect.width / 2)));
        const ny = Math.max(-1, Math.min(1, dy / (rect.height / 2)));
        const rotateY = nx * MAX_ROTATE_Y;
        const rotateX = -ny * MAX_ROTATE_X;
        const translateZ = (1 - Math.max(Math.abs(nx), Math.abs(ny))) * MAX_TRANSLATE_Z;
        const transform = `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(${translateZ}px) scale(${SCALE_ON_HOVER})`;
        card.style.transform = transform;

        const shine = card.querySelector('.shine');
        if (shine) {
          const sx = ((dx / rect.width) * 100).toFixed(2);
          const sy = ((dy / rect.height) * 100).toFixed(2);
          shine.style.transform = `translate(${sx}%, ${sy}%) translateZ(${translateZ + 20}px) rotate(25deg)`;
          shine.style.opacity = `${Math.max(0.14, 1 - Math.max(Math.abs(nx), Math.abs(ny)) )}`;
        }
      });
    }

    function reset() {
      if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
      latestEvent = null;
      card.style.transform = '';
      const shine = card.querySelector('.shine');
      if (shine) { shine.style.transform = ''; shine.style.opacity = ''; }
    }

    const onMove = (e) => updateFromEvent(e);
    const onEnter = (e) => {
      if (e.pointerType === 'touch') return;
      card.style.transition = 'transform 420ms cubic-bezier(.16,.84,.36,1), box-shadow 420ms';
      updateFromEvent(e);
    };
    const onLeave = () => {
      card.style.transition = 'transform 520ms cubic-bezier(.16,.84,.36,1), box-shadow 520ms';
      reset();
    };

    card.addEventListener('pointermove', onMove, {passive:true});
    card.addEventListener('pointerenter', onEnter);
    card.addEventListener('pointerleave', onLeave);

    // On resize disable if small
    let resizeT = null;
    window.addEventListener('resize', () => {
      clearTimeout(resizeT);
      resizeT = setTimeout(()=> {
        if (window.innerWidth < MIN_DESKTOP_WIDTH) {
          card.removeEventListener('pointermove', onMove);
          card.removeEventListener('pointerenter', onEnter);
          card.removeEventListener('pointerleave', onLeave);
          reset();
        }
      }, 150);
    });
  });
})();

/* -------------------------
   Small progressive enhancements
   -------------------------*/
// Re-run attach book buttons in case of dynamic changes
window.addEventListener('load', attachBookButtons);