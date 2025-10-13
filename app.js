// --- User Auth State (frontend simulation for now) ---
function isLoggedIn() {
    return localStorage.getItem('tm_logged_in') === 'true';
}
function setLoggedIn(val) {
    localStorage.setItem('tm_logged_in', val ? 'true' : 'false');
}

// --- Book Appointment Button Logic ---
document.getElementById('book-appointment-btn').addEventListener('click', function() {
    if (isLoggedIn()) {
        document.querySelector('.hero').style.display = 'none';
        document.querySelector('.features').style.display = 'none';
        document.getElementById('video-chat').style.display = 'block';
        window.scrollTo({top: 0, behavior: 'smooth'});
    } else {
        document.getElementById('loginModal').style.display = 'block';
    }
});

// --- Video Chat Buttons ---
document.getElementById('startCallBtn').addEventListener('click', () => {
    alert("WebRTC video call will start here (to be implemented)!");
});

document.getElementById('endCallBtn').addEventListener('click', () => {
    document.getElementById('video-chat').style.display = 'none';
    document.querySelector('.hero').style.display = '';
    document.querySelector('.features').style.display = '';
    window.scrollTo({top: 0, behavior: 'smooth'});
});

// --- Scroll-triggered animations ---
function handleScrollAnimations() {
    const elements = document.querySelectorAll('.animate-on-scroll');
    const triggerBottom = window.innerHeight * 0.92;

    elements.forEach(el => {
        const rect = el.getBoundingClientRect();
        if(rect.top < triggerBottom) {
            el.classList.add('in-view');
        } else {
            el.classList.remove('in-view');
        }
    });
}

window.addEventListener('scroll', handleScrollAnimations);
window.addEventListener('resize', handleScrollAnimations);
window.addEventListener('DOMContentLoaded', () => {
    handleScrollAnimations();
    updateAuthUI();
});

// --- Modal logic ---
const loginModal = document.getElementById('loginModal');
const registerModal = document.getElementById('registerModal');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');

loginBtn.onclick = () => { loginModal.style.display = 'block'; };
logoutBtn.onclick = () => {
    setLoggedIn(false);
    updateAuthUI();
    alert('Logged out!');
    document.getElementById('video-chat').style.display = 'none';
    document.querySelector('.hero').style.display = '';
    document.querySelector('.features').style.display = '';
};

document.getElementById('closeLogin').onclick = () => { loginModal.style.display = 'none'; };
document.getElementById('closeRegister').onclick = () => { registerModal.style.display = 'none'; };
document.getElementById('showRegister').onclick = (e) => {
    e.preventDefault();
    loginModal.style.display = 'none';
    registerModal.style.display = 'block';
};
document.getElementById('showLogin').onclick = (e) => {
    e.preventDefault();
    registerModal.style.display = 'none';
    loginModal.style.display = 'block';
};
window.onclick = (event) => {
    if(event.target === loginModal) loginModal.style.display = 'none';
    if(event.target === registerModal) registerModal.style.display = 'none';
};

// --- Login/Register Handlers (simulate login) ---
document.getElementById('loginForm').onsubmit = (e) => {
    e.preventDefault();
    setLoggedIn(true);
    updateAuthUI();
    alert('Login successful!');
    loginModal.style.display = 'none';
};
document.getElementById('registerForm').onsubmit = (e) => {
    e.preventDefault();
    setLoggedIn(true);
    updateAuthUI();
    alert('Registration successful!');
    registerModal.style.display = 'none';
};

// --- Show/hide login/logout based on auth state ---
function updateAuthUI() {
    if (isLoggedIn()) {
        loginBtn.style.display = 'none';
        logoutBtn.style.display = '';
    } else {
        loginBtn.style.display = '';
        logoutBtn.style.display = 'none';
    }
}