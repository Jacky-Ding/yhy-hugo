// main.js — Carousel, Mobile Menu, Back to Top, FAQ

document.addEventListener('DOMContentLoaded', function() {
    initCarousel();
    initMobileMenu();
    initBackToTop();
    initFAQ();
});

// === Carousel ===
function initCarousel() {
    const slides = document.querySelectorAll('.carousel-slide');
    const dots = document.querySelectorAll('.carousel-dot');
    if (!slides.length) return;
    
    let current = 0;
    const total = slides.length;
    const interval = 5000;
    
    function showSlide(n) {
        slides.forEach(s => s.classList.remove('active'));
        dots.forEach(d => d.classList.remove('active'));
        slides[n].classList.add('active');
        if (dots[n]) dots[n].classList.add('active');
    }
    
    function nextSlide() {
        current = (current + 1) % total;
        showSlide(current);
    }
    
    dots.forEach((dot, i) => {
        dot.addEventListener('click', () => {
            current = i;
            showSlide(current);
            resetTimer();
        });
    });
    
    let timer = setInterval(nextSlide, interval);
    
    function resetTimer() {
        clearInterval(timer);
        timer = setInterval(nextSlide, interval);
    }
}

// === Mobile Menu ===
function initMobileMenu() {
    const btn = document.getElementById('mobile-menu-btn');
    const menu = document.getElementById('mobile-menu');
    if (!btn || !menu) return;
    
    btn.addEventListener('click', () => {
        menu.classList.toggle('active');
        btn.classList.toggle('active');
    });
    
    menu.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', () => {
            menu.classList.remove('active');
            btn.classList.remove('active');
        });
    });
}

// === Back to Top ===
function initBackToTop() {
    const btn = document.getElementById('back-to-top');
    if (!btn) return;
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 500) {
            btn.classList.add('visible');
        } else {
            btn.classList.remove('visible');
        }
    });
}

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// === FAQ Accordion ===
function initFAQ() {
    document.querySelectorAll('.faq-question').forEach(q => {
        q.addEventListener('click', () => {
            const item = q.parentElement;
            const wasActive = item.classList.contains('active');
            
            document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('active'));
            
            if (!wasActive) {
                item.classList.add('active');
            }
        });
    });
}