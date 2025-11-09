// script.js (fixed) - CURE GLAMS
// - Ensures Book buttons work by using event delegation and running after DOM is ready
// - Avoids book buttons acting like form submit by recommending type="button" on buttons
// - No payment integration; bookings saved to localStorage (demo)

(() => {
  // helper selectors
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => Array.from((root || document).querySelectorAll(s));

  // run after DOM ready
  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(() => {
    // set footer year if present
    const yearEl = $('#year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    /* Elements (selected after DOM ready) */
    const servicesGrid = $('#servicesGrid') || document;
    const bookingModal = $('#bookingModal');
    const modalClose = $('#modalClose');
    const modalServiceName = $('#modalServiceName');
    const modalPrice = $('#modalPrice');
    const modalDuration = $('#modalDuration');
    const serviceIdInput = $('#serviceId');
    const bookingForm = $('#bookingForm');
    const bookingResultEl = $('#bookingResult');

    /* Utility formatters */
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

    /* Open/close modal */
    function openModalForService(cardEl) {
      if (!cardEl) return;
      const id = cardEl.dataset.id || '';
      const name = cardEl.dataset.name || '';
      const price = cardEl.dataset.price || '0';
      const duration = cardEl.dataset.duration || '';
      if (serviceIdInput) serviceIdInput.value = id;
      if (modalServiceName) modalServiceName.textContent = name;
      if (modalPrice) modalPrice.textContent = formatPriceForDisplay(price);
      if (modalDuration) modalDuration.textContent = duration ? `· ${formatDurationDisplay(duration)}` : '';
      if (bookingModal) bookingModal.setAttribute('aria-hidden', 'false');

      // set date min to today if date input exists
      const dateInput = $('#appointmentDate');
      if (dateInput) {
        const today = new Date().toISOString().slice(0, 10);
        dateInput.min = today;
        if (!dateInput.value) dateInput.value = today;
      }

      // focus name input
      setTimeout(() => $('#customerName')?.focus(), 80);
    }
    function closeModal() {
      if (bookingModal) bookingModal.setAttribute('aria-hidden', 'true');
      if (bookingResultEl) bookingResultEl.textContent = '';
      bookingForm?.reset();
      if (modalDuration) modalDuration.textContent = '';
    }

    /* Fix: event delegation for Book buttons
       - Works for all existing and dynamically added .book-btn elements
       - Ensures button clicks do not submit any enclosing form (use type="button" in HTML) */
    servicesGrid.addEventListener('click', (e) => {
      const btn = e.target.closest('.book-btn');
      if (!btn) return;
      // If the button is inside a form and is missing type="button", prevent default to avoid submit.
      e.preventDefault();

      const card = btn.closest('.service-card');
      if (!card) {
        console.warn('Book button clicked but no .service-card ancestor found.');
        return;
      }
      openModalForService(card);
    });

    // keep header/hero book buttons behavior
    $('#headerBookBtn')?.addEventListener('click', (e) => {
      e.preventDefault();
      openModalForService($('.service-card'));
    });
    $('#heroBookBtn')?.addEventListener('click', (e) => {
      e.preventDefault();
      openModalForService($('.service-card'));
    });

    // modal closing handlers
    modalClose?.addEventListener('click', closeModal);
    bookingModal?.addEventListener('click', (e) => {
      if (e.target === bookingModal) closeModal();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModal();
    });

    /* Bookings persistence (localStorage demo, no payments) */
    function generateBookingRef() {
      return 'CG-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8).toUpperCase();
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
        setTimeout(() => { closeModal(); }, 1200);
      } catch (err) {
        console.error(err);
        resultEl.textContent = 'Failed to save booking. See console for details.';
      }
    });

    /* 3D tilt: leave as-is (optional) */
    // (tilt initialization code remains unchanged if present elsewhere)
  }); // ready
})(); 