// main.js — YHY Trade Hub Premium JavaScript
// Features: Mobile Menu, Back to Top, FAQ, Scroll Animations, Parallax, Header Effects

document.addEventListener('DOMContentLoaded', function() {
    initHeader();
    initMobileMenu();
    initBackToTop();
    initFAQ();
    initScrollReveal();
    initParallax();
});

// === Header — Transparent to Solid on Scroll ===
function initHeader() {
    const header = document.getElementById('site-header');
    if (!header) return;
    
    function handleScroll() {
        if (window.scrollY > 100) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    }
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
}

// === Mobile Menu ===
function initMobileMenu() {
    const btn = document.getElementById('mobile-menu-btn');
    const menu = document.getElementById('mobile-menu');
    if (!btn || !menu) return;
    
    function closeMenu() {
        menu.classList.remove('active');
        btn.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    function openMenu() {
        menu.classList.add('active');
        btn.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    btn.addEventListener('click', function() {
        if (menu.classList.contains('active')) {
            closeMenu();
        } else {
            openMenu();
        }
    });
    
    // Close menu on link click
    menu.querySelectorAll('a').forEach(function(a) {
        a.addEventListener('click', closeMenu);
    });
    
    // Close menu on escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && menu.classList.contains('active')) {
            closeMenu();
        }
    });
    
    // Close menu on window resize (if desktop)
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768 && menu.classList.contains('active')) {
            closeMenu();
        }
    });
}

// === Back to Top ===
function initBackToTop() {
    const btn = document.getElementById('back-to-top');
    if (!btn) return;
    
    window.addEventListener('scroll', function() {
        if (window.scrollY > 500) {
            btn.classList.add('visible');
        } else {
            btn.classList.remove('visible');
        }
    }, { passive: true });
}

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// === FAQ Accordion ===
function initFAQ() {
    document.querySelectorAll('.faq-question').forEach(function(q) {
        q.addEventListener('click', function() {
            var item = q.parentElement;
            var wasActive = item.classList.contains('active');
            
            // Close all
            document.querySelectorAll('.faq-item').forEach(function(i) {
                i.classList.remove('active');
            });
            
            // Toggle current
            if (!wasActive) {
                item.classList.add('active');
            }
        });
    });
}

// === Scroll Reveal Animations ===
function initScrollReveal() {
    var reveals = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale');
    if (!reveals.length) return;
    
    // Disable animations on low-end devices
    var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    var observerOptions = {
        root: null,
        rootMargin: '0px 0px -50px 0px',
        threshold: 0.1
    };
    
    if (prefersReduced) {
        // Show everything immediately
        reveals.forEach(function(el) { el.classList.add('active'); });
        return;
    }
    
    var observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, observerOptions);
    
    reveals.forEach(function(el) { observer.observe(el); });
    
    // Stagger children
    var staggerContainers = document.querySelectorAll('.stagger-children');
    staggerContainers.forEach(function(container) {
        var childObserver = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                    childObserver.unobserve(entry.target);
                }
            });
        }, { rootMargin: '0px', threshold: 0.1 });
        
        childObserver.observe(container);
    });
}

// === Parallax Effect (desktop only) ===
function initParallax() {
    var hero = document.querySelector('.hero-bg');
    if (!hero) return;
    
    // Disable parallax on mobile/tablet for performance
    if (window.innerWidth <= 1024) return;
    
    // Also check for reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    
    var ticking = false;
    
    function updateParallax() {
        var scrolled = window.scrollY;
        var heroHeight = hero.parentElement.offsetHeight;
        
        if (scrolled <= heroHeight) {
            var parallaxOffset = scrolled * 0.4;
            hero.style.transform = 'scale(1.1) translateY(' + parallaxOffset + 'px)';
        }
        
        ticking = false;
    }
    
    window.addEventListener('scroll', function() {
        if (!ticking) {
            requestAnimationFrame(updateParallax);
            ticking = true;
        }
    }, { passive: true });
    
    // Re-check on resize
    window.addEventListener('resize', function() {
        if (window.innerWidth <= 1024) {
            hero.style.transform = '';
        }
    });
}
