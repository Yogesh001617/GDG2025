// Client-side JS for booking flow and demo Stripe Checkout redirect.
// Replace SERVER_BASE with your server address where /create-checkout-session is implemented.
const SERVER_BASE = window.location.origin; // when running server and client together
document.getElementById('year').textContent = new Date().getFullYear();

// Mobile nav toggle
const navToggle = document.getElementById('navToggle');
const nav = document.querySelector('.nav');
navToggle?.addEventListener('click', () => {
  nav.classList.toggle('show');
});

// Open booking modal from various buttons
const bookingModal = document.getElementById('bookingModal');
const modalClose = document.getElementById('modalClose');
const modalServiceName = document.getElementById('modalServiceName');
const modalPrice = document.getElementById('modalPrice');
const serviceIdInput = document.getElementById('serviceId');

function openModalForService(cardEl){
  const id = cardEl.dataset.id;
  const name = cardEl.dataset.name;
  const price = cardEl.dataset.price;
  serviceIdInput.value = id;
  modalServiceName.textContent = name;
  modalPrice.textContent = `$${price}`;
  bookingModal.setAttribute('aria-hidden', 'false');
  // focus first input
  document.getElementById('customerName').focus();
}

document.querySelectorAll('.book-btn').forEach(btn=>{
  btn.addEventListener('click', (e)=>{
    const card = e.target.closest('.service-card');
    openModalForService(card);
  });
});

// header buttons open a generic booking modal (preselect first service)
document.getElementById('headerBookBtn')?.addEventListener('click', () => {
  const first = document.querySelector('.service-card');
  openModalForService(first);
});
document.getElementById('heroBookBtn')?.addEventListener('click', () => {
  const first = document.querySelector('.service-card');
  openModalForService(first);
});

modalClose?.addEventListener('click', () => bookingModal.setAttribute('aria-hidden', 'true'));
bookingModal.addEventListener('click', (e) => {
  if (e.target === bookingModal) bookingModal.setAttribute('aria-hidden', 'true');
});

// Contact form demo (no backend)
function submitContact(e){
  e.preventDefault();
  const f = e.target;
  const result = document.getElementById('contactResult');
  result.textContent = 'Thanks! We will get back to you shortly.';
  f.reset();
}

// Booking form submit -> call server to create Stripe Checkout session
const bookingForm = document.getElementById('bookingForm');
bookingForm?.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const resultEl = document.getElementById('bookingResult');
  resultEl.textContent = 'Preparing payment...';

  const payload = {
    serviceId: document.getElementById('serviceId').value,
    serviceName: document.getElementById('modalServiceName').textContent,
    price: (document.getElementById('modalPrice').textContent || '').replace('$',''),
    customerName: document.getElementById('customerName').value,
    email: document.getElementById('customerEmail').value,
    date: document.getElementById('appointmentDate').value,
    time: document.getElementById('appointmentTime').value
  };

  try {
    const res = await fetch(`${SERVER_BASE}/create-checkout-session`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(err || 'Server error');
    }
    const data = await res.json();
    if (data.url) {
      // Redirect to Stripe Checkout (session URL)
      window.location = data.url;
    } else {
      throw new Error('No checkout URL returned');
    }
  } catch (err) {
    console.error(err);
    resultEl.textContent = 'Error starting payment. See console for details.';
  }
});