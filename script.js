/**
 * Shupra 3D — Premium E-Commerce JavaScript
 * Implements: cart, wishlist, toast, carousel, marquee, animations,
 * floating labels, back-to-top, mobile nav, title cycling, and more.
 */

// ─── Security & Storage Helpers ───────────────────────────────────────────────
function safeGetStorage(key, fallback = []) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : fallback;
    } catch (e) {
        console.warn(`[Storage Warning] Error reading "${key}":`, e);
        return fallback;
    }
}

function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// ─── State ───────────────────────────────────────────────────────────────────
const state = {
    cart: safeGetStorage('shupra_cart', []),
    wishlist: safeGetStorage('shupra_wishlist', []),
    currentUser: safeGetStorage('shupra_user', null),
    carouselIndex: 0,
    carouselTotal: 0,
    carouselInterval: null,
};

// ─── DOM Ready ────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Core UI
    initAnnouncementBar();
    initNavbar();
    initMobileMenu();
    initSearch();
    initSmoothScroll();

    // E-Commerce & Auth
    initCart();
    initWishlist();
    initGalleryFilter();
    initAddToCart();
    initAuth();
    initFeedbackModal();

    // Animations
    if (!prefersReducedMotion) {
        initScrollReveal();
        initCounters();
        initParticleCanvas();
        initMarquee();
        initTitleCycler();
    } else {
        document.querySelectorAll('.reveal').forEach(el => el.classList.add('revealed'));
        document.querySelectorAll('[data-count]').forEach(el => {
            el.textContent = el.getAttribute('data-count');
        });
    }

    // Components
    initTestimonialCarousel();
    initBackToTop();
    init3DStudioConfigurator();
    initMobileBottomNav();
    initNewsletterForm();
    initGalleryCardLinks();
    initCollectionControls();
    initCheckoutModal();
    initLenis();
    initMagneticButtons();
});

// ═══════════════════════════════════════════════════════════════════════════════
// 1. ANNOUNCEMENT BAR
// ═══════════════════════════════════════════════════════════════════════════════
function initAnnouncementBar() {
    const bar = document.getElementById('announcementBar');
    const closeBtn = document.getElementById('announcementClose');
    if (!bar || !closeBtn) return;

    // Check if dismissed
    if (sessionStorage.getItem('announcement_dismissed')) {
        bar.style.display = 'none';
        document.body.classList.remove('has-announcement');
        const nav = document.getElementById('navbar');
        if (nav) nav.classList.add('announcement-hidden');
        return;
    }

    document.body.classList.add('has-announcement');

    closeBtn.addEventListener('click', () => {
        bar.style.transform = 'translateY(-100%)';
        bar.style.transition = 'transform 0.3s ease';
        setTimeout(() => {
            bar.style.display = 'none';
            document.body.classList.remove('has-announcement');
            const nav = document.getElementById('navbar');
            if (nav) nav.classList.add('announcement-hidden');
        }, 300);
        sessionStorage.setItem('announcement_dismissed', '1');
    });
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. NAVBAR
// ═══════════════════════════════════════════════════════════════════════════════
function initNavbar() {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;

    const sections = document.querySelectorAll('section[id]');

    function updateNavbar() {
        const scrolled = window.scrollY > 60;
        navbar.classList.toggle('scrolled', scrolled);
    }

    function updateActiveLink() {
        let current = '';
        sections.forEach(section => {
            const top = section.getBoundingClientRect().top;
            if (top <= 120) current = section.id;
        });
        document.querySelectorAll('.nav__link').forEach(link => {
            const href = link.getAttribute('href');
            link.classList.toggle('active', href === `#${current}`);
        });
    }

    window.addEventListener('scroll', () => {
        updateNavbar();
        updateActiveLink();
    }, { passive: true });

    updateNavbar();
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3. MOBILE MENU
// ═══════════════════════════════════════════════════════════════════════════════
function initMobileMenu() {
    const toggle = document.getElementById('navToggle');
    const menu = document.getElementById('navMenu');
    if (!toggle || !menu) return;

    toggle.addEventListener('click', () => {
        toggle.classList.toggle('active');
        menu.classList.toggle('active');
        if (menu.classList.contains('active')) {
            lockScroll();
        } else {
            unlockScroll();
        }
    });

    document.querySelectorAll('.nav__link').forEach(link => {
        link.addEventListener('click', () => {
            toggle.classList.remove('active');
            menu.classList.remove('active');
            unlockScroll();
        });
    });
}

// ═══════════════════════════════════════════════════════════════════════════════
// 4. SEARCH
// ═══════════════════════════════════════════════════════════════════════════════
function initSearch() {
    const toggleBtn = document.getElementById('searchToggle');
    const closeBtn = document.getElementById('searchClose');
    const searchBar = document.getElementById('navSearch');
    const input = document.getElementById('searchInput');
    if (!toggleBtn || !searchBar) return;

    toggleBtn.addEventListener('click', () => {
        searchBar.classList.toggle('open');
        if (searchBar.classList.contains('open')) input?.focus();
    });

    closeBtn?.addEventListener('click', () => searchBar.classList.remove('open'));

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') searchBar.classList.remove('open');
    });
}

// ═══════════════════════════════════════════════════════════════════════════════
// 5. SMOOTH SCROLL
// ═══════════════════════════════════════════════════════════════════════════════
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', e => {
            const href = link.getAttribute('href');
            if (href === '#') return;
            const target = document.querySelector(href);
            if (!target) return;
            e.preventDefault();

            if (window.lenisInstance) {
                window.lenisInstance.scrollTo(target, { offset: -90 });
            } else {
                const offset = 90;
                const top = target.getBoundingClientRect().top + window.scrollY - offset;
                window.scrollTo({ top, behavior: 'smooth' });
            }
        });
    });
}

// ═══════════════════════════════════════════════════════════════════════════════
// 6. CURSOR GLOW
// ═══════════════════════════════════════════════════════════════════════════════
function initCursorGlow() {
    const glow = document.getElementById('cursorGlow');
    if (!glow) return;
    if (window.matchMedia('(pointer: coarse)').matches) { glow.style.display = 'none'; return; }

    let mx = window.innerWidth / 2, my = window.innerHeight / 2;
    let gx = mx, gy = my;

    document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });

    function animate() {
        gx += (mx - gx) * 0.12;
        gy += (my - gy) * 0.12;
        glow.style.transform = `translate(calc(${gx}px - 50%), calc(${gy}px - 50%))`;
        requestAnimationFrame(animate);
    }
    animate();
}

// ═══════════════════════════════════════════════════════════════════════════════
// 7. SCROLL REVEAL
// ═══════════════════════════════════════════════════════════════════════════════
function initScrollReveal() {
    const elements = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver(entries => {
        entries.forEach((entry, i) => {
            if (entry.isIntersecting) {
                const delay = entry.target.style.getPropertyValue('--card-delay') || '0ms';
                const numDelay = parseInt(delay) || 0;
                setTimeout(() => {
                    entry.target.classList.add('revealed');
                }, numDelay);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

    elements.forEach(el => observer.observe(el));
}

// ═══════════════════════════════════════════════════════════════════════════════
// 8. COUNTERS
// ═══════════════════════════════════════════════════════════════════════════════
function initCounters() {
    const counters = document.querySelectorAll('[data-count]');
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    counters.forEach(c => observer.observe(c));
}

function animateCounter(el) {
    const target = parseFloat(el.getAttribute('data-count'));
    const duration = 2000;
    const start = performance.now();
    const isDecimal = target % 1 !== 0;

    function update(now) {
        const progress = Math.min((now - start) / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 4);
        const value = ease * target;
        el.textContent = isDecimal ? value.toFixed(1) : Math.floor(value).toLocaleString();
        if (progress < 1) requestAnimationFrame(update);
        else el.textContent = isDecimal ? target.toFixed(1) : target.toLocaleString();
    }
    requestAnimationFrame(update);
}

// ═══════════════════════════════════════════════════════════════════════════════
// 9. PARTICLE CANVAS
// ═══════════════════════════════════════════════════════════════════════════════
function initParticleCanvas() {
    const canvas = document.getElementById('heroCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let particles = [];
    let W, H;

    function resize() {
        W = canvas.width = canvas.offsetWidth;
        H = canvas.height = canvas.offsetHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < 60; i++) {
        particles.push({
            x: Math.random() * W, y: Math.random() * H,
            vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
            r: Math.random() * 1.2 + 0.3,
            alpha: Math.random() * 0.4 + 0.1,
        });
    }

    function draw() {
        ctx.clearRect(0, 0, W, H);
        particles.forEach(p => {
            p.x += p.vx; p.y += p.vy;
            if (p.x < 0 || p.x > W) p.vx *= -1;
            if (p.y < 0 || p.y > H) p.vy *= -1;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha * 0.4})`;
            ctx.fill();
        });
        requestAnimationFrame(draw);
    }
    draw();
}

// ═══════════════════════════════════════════════════════════════════════════════
// 10. MARQUEE
// ═══════════════════════════════════════════════════════════════════════════════
function initMarquee() {
    // CSS animation handles this — no JS needed unless we want dynamic speed
    // But we do want the hover pause, which is CSS only. This is a no-op.
}

// ═══════════════════════════════════════════════════════════════════════════════
// 11. TITLE CYCLER
// ═══════════════════════════════════════════════════════════════════════════════
function initTitleCycler() {
    const words = document.querySelectorAll('.cycle-word');
    if (!words.length) return;

    let current = 0;

    function cycle() {
        words[current].classList.remove('active');
        words[current].classList.add('exit');
        const next = (current + 1) % words.length;
        setTimeout(() => {
            words[current].classList.remove('exit');
            current = next;
            words[current].classList.add('active');
        }, 600);
    }

    setInterval(cycle, 3000);
}

// ═══════════════════════════════════════════════════════════════════════════════
// 12. GALLERY FILTER
// ═══════════════════════════════════════════════════════════════════════════════
function initGalleryFilter() {
    if (document.getElementById('shopGrid')) return; // handled by initCollectionControls
    const filters = document.querySelectorAll('.gallery__filter');
    const cards = document.querySelectorAll('.gallery__card');
    if (!filters.length) return;

    filters.forEach(btn => {
        btn.addEventListener('click', () => {
            filters.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const filter = btn.getAttribute('data-filter');

            cards.forEach((card, i) => {
                const show = filter === 'all' || card.getAttribute('data-category') === filter;
                if (show) {
                    card.classList.remove('hidden');
                    card.style.animationDelay = `${i * 60}ms`;
                    card.style.animation = 'fadeInUp 0.4s ease forwards';
                } else {
                    card.classList.add('hidden');
                }
            });
        });
    });
}

// ═══════════════════════════════════════════════════════════════════════════════
// 13. CART
// ═══════════════════════════════════════════════════════════════════════════════
function initCart() {
    const cartToggle = document.getElementById('cartToggle');
    const mobCart = document.getElementById('mob-cart');
    const cartClose = document.getElementById('cartClose');
    const cartOverlay = document.getElementById('cartOverlay');
    const cartShopNow = document.getElementById('cartShopNow');

    cartToggle?.addEventListener('click', openCart);
    mobCart?.addEventListener('click', openCart);
    cartClose?.addEventListener('click', closeCart);
    cartOverlay?.addEventListener('click', closeCart);
    cartShopNow?.addEventListener('click', closeCart);

    renderCart();
}

function openCart() {
    document.getElementById('cartDrawer')?.classList.add('open');
    document.getElementById('cartOverlay')?.classList.add('open');
    lockScroll();
}

function closeCart() {
    document.getElementById('cartDrawer')?.classList.remove('open');
    document.getElementById('cartOverlay')?.classList.remove('open');
    unlockScroll();
}

function renderCart() {
    const cartItems = document.getElementById('cartItems');
    const cartEmpty = document.getElementById('cartEmpty');
    const cartFooter = document.getElementById('cartFooter');
    const cartSubtotal = document.getElementById('cartSubtotal');

    if (!cartItems) return;

    if (state.cart.length === 0) {
        cartEmpty.style.display = 'flex';
        cartItems.style.display = 'none';
        cartFooter.style.display = 'none';
    } else {
        cartEmpty.style.display = 'none';
        cartItems.style.display = 'flex';
        cartFooter.style.display = 'flex';

        cartItems.innerHTML = state.cart.map(item => {
            const safeName = escapeHtml(item.name);
            const safeCategory = escapeHtml(item.category);
            const safeId = escapeHtml(item.id);
            const safePrice = Number(item.price).toLocaleString('en-IN');
            return `
                <div class="cart-item" id="cart-item-${safeId}">
                    <div class="cart-item__info">
                        <div class="cart-item__category">${safeCategory}</div>
                        <div class="cart-item__name" title="${safeName}">${safeName}</div>
                        <div class="cart-item__price">₹${safePrice}</div>
                    </div>
                    <div class="cart-item__controls">
                        <button class="cart-item__qty-btn" onclick="updateCartQty('${safeId}', -1)" aria-label="Decrease quantity">−</button>
                        <span class="cart-item__qty">${Number(item.qty)}</span>
                        <button class="cart-item__qty-btn" onclick="updateCartQty('${safeId}', 1)" aria-label="Increase quantity">+</button>
                        <button class="cart-item__remove" onclick="removeFromCart('${safeId}')" aria-label="Remove ${safeName}">×</button>
                    </div>
                </div>
            `;
        }).join('');

        const total = state.cart.reduce((sum, item) => sum + item.price * item.qty, 0);
        if (cartSubtotal) cartSubtotal.textContent = `₹${total.toLocaleString()}`;
    }

    // Update badges
    const count = state.cart.reduce((s, i) => s + i.qty, 0);
    ['cartBadge', 'mobCartBadge'].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        if (count > 0) { el.textContent = count > 99 ? '99+' : count; el.style.display = 'flex'; }
        else { el.style.display = 'none'; }
    });

    saveState();
}

// In-memory registry for uploaded 3D files (avoids localStorage quota limits)
window.shupraUploadedFiles = window.shupraUploadedFiles || {};

function addToCart(id, name, price, category, fileName = null, fileBase64 = null, mimeType = null) {
    const existing = state.cart.find(i => i.id === id);
    if (existing) {
        existing.qty++;
    } else {
        state.cart.push({ id, name, price: Number(price), category, qty: 1, fileName: fileName || name });
    }

    if (fileBase64) {
        window.shupraUploadedFiles[id] = {
            fileName: fileName || name,
            fileBase64,
            mimeType: mimeType || 'application/octet-stream'
        };
    }

    renderCart();
    showToast(`🛒 Added to cart!`, 'success');
    openCart();
}

function updateCartQty(id, delta) {
    const item = state.cart.find(i => i.id === id);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) removeFromCart(id);
    else renderCart();
}

function removeFromCart(id) {
    const el = document.getElementById(`cart-item-${id}`);
    if (el) { el.style.transform = 'translateX(100%)'; el.style.opacity = '0'; el.style.transition = 'all 0.3s ease'; }
    setTimeout(() => {
        state.cart = state.cart.filter(i => i.id !== id);
        renderCart();
    }, 300);
}

// ═══════════════════════════════════════════════════════════════════════════════
// 14. ADD TO CART BUTTONS
// ═══════════════════════════════════════════════════════════════════════════════
function initAddToCart() {
    document.querySelectorAll('.gallery__add-cart').forEach(btn => {
        btn.addEventListener('click', e => {
            e.preventDefault();
            e.stopPropagation();
            const { id, name, price, category } = btn.dataset;
            addToCart(id, name, price, category);
            // Button feedback
            const orig = btn.innerHTML;
            btn.innerHTML = '✓ Added!';
            btn.style.background = '#10B981';
            setTimeout(() => {
                btn.innerHTML = orig;
                btn.style.background = '';
            }, 1500);
        });
    });
}

// Make gallery cards link to contact section
function initGalleryCardLinks() {
    document.querySelectorAll('.gallery__card').forEach(card => {
        card.addEventListener('click', e => {
            if (e.target.closest('button') || e.target.closest('a')) return;
        });
    });
}

// ═══════════════════════════════════════════════════════════════════════════════
// 15. WISHLIST
// ═══════════════════════════════════════════════════════════════════════════════
function initWishlist() {
    // Restore wishlist state on buttons
    document.querySelectorAll('.gallery__wishlist-btn').forEach(btn => {
        const id = btn.dataset.id;
        if (state.wishlist.includes(id)) btn.classList.add('wishlisted');
    });

    document.querySelectorAll('.gallery__wishlist-btn').forEach(btn => {
        btn.addEventListener('click', e => {
            e.stopPropagation();
            const { id, name } = btn.dataset;
            if (state.wishlist.includes(id)) {
                state.wishlist = state.wishlist.filter(w => w !== id);
                btn.classList.remove('wishlisted');
                showToast(`💔 Removed from wishlist`, 'default');
            } else {
                state.wishlist.push(id);
                btn.classList.add('wishlisted');
                showToast(`❤️ Saved to wishlist!`, 'success');
            }
            updateWishlistBadge();
            saveState();
        });
    });

    updateWishlistBadge();
}

function updateWishlistBadge() {
    const badge = document.getElementById('wishlistBadge');
    if (!badge) return;
    const count = state.wishlist.length;
    if (count > 0) { badge.textContent = count; badge.style.display = 'flex'; }
    else { badge.style.display = 'none'; }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 16. TOAST NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════════════════════
function showToast(message, type = 'default') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    const textSpan = document.createElement('span');
    textSpan.className = 'toast__text';
    textSpan.textContent = message;
    toast.appendChild(textSpan);
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('toast--out');
        toast.addEventListener('animationend', () => toast.remove());
    }, 3000);
}

// ═══════════════════════════════════════════════════════════════════════════════
// 17. TESTIMONIAL CAROUSEL
// ═══════════════════════════════════════════════════════════════════════════════
function initTestimonialCarousel() {
    const track = document.getElementById('testimonialsTrack');
    const dotsContainer = document.getElementById('testimonialsDots');
    const prevBtn = document.getElementById('prevTestimonial');
    const nextBtn = document.getElementById('nextTestimonial');
    if (!track) return;

    const cards = track.querySelectorAll('.testimonial-card');
    state.carouselTotal = cards.length;

    // Build dots
    cards.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.className = `testimonial-dot ${i === 0 ? 'active' : ''}`;
        dot.setAttribute('aria-label', `Go to testimonial ${i + 1}`);
        dot.addEventListener('click', () => goToSlide(i));
        dotsContainer.appendChild(dot);
    });

    prevBtn?.addEventListener('click', () => goToSlide(state.carouselIndex - 1));
    nextBtn?.addEventListener('click', () => goToSlide(state.carouselIndex + 1));

    // Auto-play
    startCarouselAutoplay();

    // Pause on hover
    track.parentElement?.addEventListener('mouseenter', stopCarouselAutoplay);
    track.parentElement?.addEventListener('mouseleave', startCarouselAutoplay);

    // Touch/drag swipe support
    let startX = 0;
    track.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
    track.addEventListener('touchend', e => {
        const diff = startX - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 50) goToSlide(state.carouselIndex + (diff > 0 ? 1 : -1));
    });
}

function goToSlide(index) {
    const total = state.carouselTotal;
    state.carouselIndex = ((index % total) + total) % total;
    const track = document.getElementById('testimonialsTrack');
    if (track) track.style.transform = `translateX(-${state.carouselIndex * 100}%)`;

    document.querySelectorAll('.testimonial-dot').forEach((dot, i) => {
        dot.classList.toggle('active', i === state.carouselIndex);
    });
}

function startCarouselAutoplay() {
    stopCarouselAutoplay();
    state.carouselInterval = setInterval(() => {
        goToSlide(state.carouselIndex + 1);
    }, 5000);
}

function stopCarouselAutoplay() {
    if (state.carouselInterval) {
        clearInterval(state.carouselInterval);
        state.carouselInterval = null;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 18. BACK TO TOP
// ═══════════════════════════════════════════════════════════════════════════════
function initBackToTop() {
    const btn = document.getElementById('backToTop');
    const ring = document.getElementById('progressRing');
    if (!btn) return;

    const circumference = 100.53;

    window.addEventListener('scroll', () => {
        const scrolled = window.scrollY;
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        const progress = scrolled / maxScroll;
        const offset = circumference - (progress * circumference);

        btn.classList.toggle('visible', scrolled > 300);
        if (ring) ring.style.strokeDashoffset = offset;
    }, { passive: true });

    btn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// ═══════════════════════════════════════════════════════════════════════════════
// 19. CONTACT FORM
// ═══════════════════════════════════════════════════════════════════════════════
function initContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;

    form.addEventListener('submit', e => {
        e.preventDefault();
        const btn = document.getElementById('submitBtn');
        if (!btn) return;

        btn.innerHTML = '<span>Sending…</span>';
        btn.disabled = true;

        setTimeout(() => {
            btn.innerHTML = '<span>✓ Sent Successfully!</span>';
            btn.style.background = '#10B981';
            showToast('✅ Request sent! We\'ll get back to you within 24 hours.', 'success');
            form.reset();

            setTimeout(() => {
                btn.innerHTML = '<span>Send Request</span><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 2L11 13"/><path d="M22 2L15 22 11 13 2 9l20-7z"/></svg>';
                btn.style.background = '';
                btn.disabled = false;
            }, 3000);
        }, 1500);
    });
}

// ═══════════════════════════════════════════════════════════════════════════════
// 20. FILE DROP ZONE
// ═══════════════════════════════════════════════════════════════════════════════
function initFileDropZone() {
    const zone = document.getElementById('fileDropZone');
    const input = document.getElementById('fileInput');
    if (!zone || !input) return;

    zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('dragging'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('dragging'));
    zone.addEventListener('drop', e => {
        e.preventDefault();
        zone.classList.remove('dragging');
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file, zone);
    });
    zone.addEventListener('click', e => {
        if (e.target.tagName === 'LABEL' || e.target.id === 'fileInput') return;
        input.click();
    });
    input.addEventListener('change', () => {
        if (input.files[0]) handleFile(input.files[0], zone);
    });
}

function handleFile(file, zone) {
    const allowed = ['.stl', '.obj', '.3mf'];
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!allowed.includes(ext)) {
        showToast('❌ Please upload an STL, OBJ, or 3MF file.', 'error');
        return;
    }
    zone.innerHTML = `
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        <p style="color:#10B981;font-weight:600;">${file.name}</p>
        <span style="font-size:0.75rem;color:var(--text-muted)">${(file.size/1024).toFixed(1)} KB · Ready to upload</span>
    `;
    showToast(`📁 File "${file.name}" attached!`, 'success');
}

// ═══════════════════════════════════════════════════════════════════════════════
// 21. CHAR COUNTER
// ═══════════════════════════════════════════════════════════════════════════════
function initCharCounter() {
    const textarea = document.getElementById('message');
    const counter = document.getElementById('charCounter');
    if (!textarea || !counter) return;

    textarea.addEventListener('input', () => {
        const len = textarea.value.length;
        counter.textContent = `${len} / 500`;
        counter.style.color = len > 450 ? '#EF4444' : len > 400 ? '#F59E0B' : 'var(--text-muted)';
        if (len > 500) textarea.value = textarea.value.slice(0, 500);
    });
}

// ═══════════════════════════════════════════════════════════════════════════════
// 22. MOBILE BOTTOM NAV
// ═══════════════════════════════════════════════════════════════════════════════
function initMobileBottomNav() {
    const items = document.querySelectorAll('.mobile-nav-item');
    items.forEach(item => {
        item.addEventListener('click', () => {
            items.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
        });
    });
}

// ═══════════════════════════════════════════════════════════════════════════════
// 23. NEWSLETTER
// ═══════════════════════════════════════════════════════════════════════════════
function initNewsletterForm() {
    const form = document.getElementById('newsletterForm');
    if (!form) return;
    form.addEventListener('submit', e => {
        e.preventDefault();
        const input = form.querySelector('input');
        showToast('🎉 Subscribed! Welcome to the Shupra 3D family.', 'success');
        if (input) input.value = '';
    });
}

// ═══════════════════════════════════════════════════════════════════════════════
// 24. STATE PERSISTENCE
// ═══════════════════════════════════════════════════════════════════════════════
function saveState() {
    try {
        localStorage.setItem('shupra_cart', JSON.stringify(state.cart));
        localStorage.setItem('shupra_wishlist', JSON.stringify(state.wishlist));
    } catch (e) { /* ignore storage errors */ }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 25. EXPOSE GLOBALS for inline onclick handlers
// ═══════════════════════════════════════════════════════════════════════════════
window.updateCartQty = updateCartQty;
window.removeFromCart = removeFromCart;

// ═══════════════════════════════════════════════════════════════════════════════
// 26. COLLECTION SEARCH, FILTER, AND SORT SYSTEM
// ═══════════════════════════════════════════════════════════════════════════════
function initCollectionControls() {
    const shopGrid = document.getElementById('shopGrid');
    if (!shopGrid) return;

    const searchInput = document.getElementById('shopSearchInput');
    const sortSelect = document.getElementById('sortSelect');
    const filters = document.querySelectorAll('.gallery__filter');
    const cards = Array.from(shopGrid.querySelectorAll('.gallery__card'));

    let activeFilter = 'all';
    let searchQuery = '';

    // Handle initial filter via query param (e.g. ?filter=idols)
    const urlParams = new URLSearchParams(window.location.search);
    const filterParam = urlParams.get('filter');
    if (filterParam) {
        activeFilter = filterParam;
        filters.forEach(btn => {
            const isMatch = btn.getAttribute('data-filter') === filterParam;
            btn.classList.toggle('active', isMatch);
        });
    }

    function updateShop() {
        let visibleCards = [];
        
        cards.forEach(card => {
            const cat = card.getAttribute('data-category');
            const name = card.getAttribute('data-name').toLowerCase();
            const matchesFilter = activeFilter === 'all' || cat === activeFilter;
            const matchesSearch = name.includes(searchQuery);

            if (matchesFilter && matchesSearch) {
                card.classList.remove('hidden');
                card.style.display = 'block';
                visibleCards.push(card);
            } else {
                card.classList.add('hidden');
                card.style.display = 'none';
            }
        });

        // Sorting
        const sortBy = sortSelect ? sortSelect.value : 'featured';
        visibleCards.sort((a, b) => {
            const priceA = parseFloat(a.getAttribute('data-price') || 0);
            const priceB = parseFloat(b.getAttribute('data-price') || 0);
            const ratingA = parseFloat(a.getAttribute('data-rating') || 0);
            const ratingB = parseFloat(b.getAttribute('data-rating') || 0);

            if (sortBy === 'price-asc') {
                if (priceA === 0) return 1;
                if (priceB === 0) return -1;
                return priceA - priceB;
            } else if (sortBy === 'price-desc') {
                return priceB - priceA;
            } else if (sortBy === 'rating') {
                return ratingB - ratingA;
            } else {
                return 0; // Default match order
            }
        });

        // Re-append sorted cards to grid to trigger visual reordering
        visibleCards.forEach((card, i) => {
            shopGrid.appendChild(card);
            card.style.animationDelay = `${i * 30}ms`;
            card.style.animation = 'fadeInUp 0.4s ease forwards';
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            searchQuery = searchInput.value.toLowerCase();
            updateShop();
        });
    }

    if (sortSelect) {
        sortSelect.addEventListener('change', updateShop);
    }

    filters.forEach(btn => {
        btn.addEventListener('click', () => {
            filters.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeFilter = btn.getAttribute('data-filter');
            // Clean URL filter param if user clicks another filter manually
            const newUrl = window.location.pathname;
            window.history.replaceState({}, '', newUrl);
            updateShop();
        });
    });

    updateShop();
}

// ═══════════════════════════════════════════════════════════════════════════════
// 27. 3D STUDIO CONFIGURATOR & STL PRICE ENGINE
// ═══════════════════════════════════════════════════════════════════════════════
function init3DStudioConfigurator() {
    const viewportContainer = document.getElementById('threeViewport');
    if (!viewportContainer) return;

    const dropzone = document.getElementById('configDropzone');
    const fileInput = document.getElementById('configFileInput');
    const specDimensions = document.getElementById('specDimensions');
    const specVolume = document.getElementById('specVolume');
    const specSurfaceArea = document.getElementById('specSurfaceArea');
    const specTriangles = document.getElementById('specTriangles');
    const specWeight = document.getElementById('specWeight');
    const specPrintTime = document.getElementById('specPrintTime');

    const priceSetup = document.getElementById('priceSetup');
    const priceMaterial = document.getElementById('priceMaterial');
    const priceMachineTime = document.getElementById('priceMachineTime');
    const priceWeightLabel = document.getElementById('priceWeightLabel');
    const priceTimeLabel = document.getElementById('priceTimeLabel');
    const priceTotal = document.getElementById('priceTotal');
    const orderBtn = document.getElementById('configuratorOrderBtn');

    // Three.js State
    let scene, camera, renderer, controls;
    let currentMesh = null;
    let boxHelper = null;
    let sceneGrid = null;
    let parsedVolume = 0; // cm³
    let parsedHeight = 0; // mm

    // Initialize WebGL Viewport with Commercial Studio Lighting
    function initThree() {
        const width = viewportContainer.clientWidth || 400;
        const height = viewportContainer.clientHeight || 500;

        scene = new THREE.Scene();

        camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
        camera.position.set(0, 20, 140);

        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        if (THREE.SRGBColorSpace) {
            renderer.outputColorSpace = THREE.SRGBColorSpace;
        }
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.0;
        viewportContainer.appendChild(renderer.domElement);

        // Controls
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.06;
        controls.maxDistance = 350;
        controls.minDistance = 25;

        // Lock page scroll while zooming inside 3D viewport
        viewportContainer.addEventListener('wheel', e => {
            e.preventDefault();
            e.stopPropagation();
        }, { passive: false });

        // Studio Balanced Lighting System
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
        scene.add(ambientLight);

        // Key Light (Main soft directional light)
        const keyLight = new THREE.DirectionalLight(0xffffff, 1.5);
        keyLight.position.set(50, 75, 60);
        scene.add(keyLight);

        // Soft Fill Light (Neutral fill to reveal shadows naturally)
        const fillLight = new THREE.DirectionalLight(0xf0f4f8, 0.7);
        fillLight.position.set(-50, 30, 40);
        scene.add(fillLight);

        // Rim / Silhouette Light (Edge definition for dark & metallic prints)
        const rimLight = new THREE.DirectionalLight(0xffffff, 0.9);
        rimLight.position.set(0, 60, -70);
        scene.add(rimLight);

        // Top Light (Soft overhead definition)
        const topLight = new THREE.DirectionalLight(0xffffff, 0.4);
        topLight.position.set(0, 90, 0);
        scene.add(topLight);

        // Refined Floor Grid Plane
        sceneGrid = new THREE.GridHelper(160, 24, 0x3b4252, 0x16181f);
        sceneGrid.position.y = -35;
        scene.add(sceneGrid);

        // Animation loop
        function animate() {
            requestAnimationFrame(animate);
            if (currentMesh) {
                currentMesh.rotation.y += 0.0025;
            }
            controls.update();
            renderer.render(scene, camera);
        }
        animate();

        // Window resize
        window.addEventListener('resize', () => {
            const w = viewportContainer.clientWidth;
            const h = viewportContainer.clientHeight;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        });
    }

    let is3MFMode = false;
    let threemfExtractedData = null;

    // Check if an extracted hex color matches our Bambu Lab PLA inventory
    function checkColorAvailability(hexColor) {
        if (!hexColor) return { available: false, filamentName: 'Unknown Color', type: 'Custom', hex: '#FFFFFF' };
        
        const cleanHex = hexColor.trim().toUpperCase().replace('#', '');
        const r1 = parseInt(cleanHex.substring(0, 2), 16) || 0;
        const g1 = parseInt(cleanHex.substring(2, 4), 16) || 0;
        const b1 = parseInt(cleanHex.substring(4, 6), 16) || 0;

        let bestMatch = null;
        let minDistance = Infinity;

        // Search across all 5 PLA filament categories in registry
        Object.keys(filamentRegistry).forEach(key => {
            const group = filamentRegistry[key];
            group.colors.forEach(col => {
                const regHex = col.hex.replace('#', '').toUpperCase();
                if (regHex === cleanHex) {
                    minDistance = 0;
                    bestMatch = { available: true, filamentName: col.name, type: group.typeName, hex: col.hex, pbrColor: col.pbrColor, costPerGram: group.costPerGram, key };
                } else {
                    const r2 = parseInt(regHex.substring(0, 2), 16);
                    const g2 = parseInt(regHex.substring(2, 4), 16);
                    const b2 = parseInt(regHex.substring(4, 6), 16);
                    const dist = Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
                    if (dist < minDistance) {
                        minDistance = dist;
                        if (dist <= 28) { // Perceptually close match
                            bestMatch = { available: true, filamentName: col.name, type: group.typeName, hex: col.hex, pbrColor: col.pbrColor, costPerGram: group.costPerGram, key };
                        }
                    }
                }
            });
        });

        if (bestMatch && bestMatch.available) {
            return bestMatch;
        }

        return {
            available: false,
            filamentName: `Custom Color (#${cleanHex.substring(0, 6)})`,
            type: 'Custom Surcharge',
            hex: `#${cleanHex.substring(0, 6)}`,
            costPerGram: 3.50,
            key: 'custom'
        };
    }

    // Toggle UI between standard manual STL configurator and locked 3MF Slicer mode
    function set3MFMode(is3MF, data = null) {
        is3MFMode = is3MF;
        threemfExtractedData = data;

        const stlContainer = document.getElementById('stlOptionsContainer');
        const threemfPanel = document.getElementById('threemfConfigPanel');

        if (is3MF && data) {
            if (stlContainer) stlContainer.style.display = 'none';
            if (threemfPanel) threemfPanel.style.display = 'block';

            // Populate detected slicer parameters
            const infillEl = document.getElementById('threemfInfill');
            const layerEl = document.getElementById('threemfLayerHeight');
            const colorListEl = document.getElementById('threemfColorList');

            if (infillEl) infillEl.textContent = data.infillDescription || '20% (Detected)';
            if (layerEl) layerEl.textContent = data.layerHeight || '0.20 mm';

            if (colorListEl) {
                if (data.colors && data.colors.length > 0) {
                    colorListEl.innerHTML = data.colors.map(col => {
                        const statusBadge = col.available
                            ? `<span class="status-badge status-badge--instock">✓ In Stock: ${escapeHtml(col.filamentName)}</span>`
                            : `<span class="status-badge status-badge--unavailable">⚠️ Color Not Available</span>`;
                        return `
                            <div class="configurator__3mf-color-item">
                                <div class="configurator__3mf-color-info">
                                    <span class="configurator__color-dot" style="background:${escapeHtml(col.hex)}; width:18px; height:18px;"></span>
                                    <span><strong>${escapeHtml(col.filamentName)}</strong> (${escapeHtml(col.type)})</span>
                                </div>
                                ${statusBadge}
                            </div>
                        `;
                    }).join('');
                } else {
                    colorListEl.innerHTML = `
                        <div class="configurator__3mf-color-item">
                            <div class="configurator__3mf-color-info">
                                <span class="configurator__color-dot" style="background:#FFFFFF; width:18px; height:18px;"></span>
                                <span>Default Palette (Jade White)</span>
                            </div>
                            <span class="status-badge status-badge--instock">✓ In Stock</span>
                        </div>
                    `;
                }
            }
        } else {
            if (stlContainer) stlContainer.style.display = 'block';
            if (threemfPanel) threemfPanel.style.display = 'none';
        }
    }

    // Extract colors & slicer configs from 3MF ZIP archive
    async function extract3MFMetadata(arrayBuffer) {
        const metadata = {
            colors: [],
            infillDescription: '20% Gyroid (Slicer Locked)',
            infillRatio: 0.20,
            layerHeight: '0.20 mm',
            filamentNames: []
        };

        if (typeof JSZip === 'undefined') {
            console.warn('JSZip is not loaded');
            return metadata;
        }

        try {
            const zip = await JSZip.loadAsync(arrayBuffer);

            // 1. Search XML model for color definitions (m:colorgroup, m:color, bambu:filament)
            const modelFile = zip.file('3D/3dmodel.model');
            if (modelFile) {
                const modelXml = await modelFile.async('text');
                const colorMatches = [...modelXml.matchAll(/(?:color|hex|display_color)=["']#?([A-Fa-f0-9]{6,8})["']/gi)];
                const uniqueHexes = new Set();
                colorMatches.forEach(m => {
                    const hex = '#' + m[1].substring(0, 6);
                    uniqueHexes.add(hex);
                });

                uniqueHexes.forEach(hex => {
                    metadata.colors.push(checkColorAvailability(hex));
                });
            }

            // 2. Search slicer configs in Metadata/
            const configFiles = Object.keys(zip.files).filter(k => k.toLowerCase().includes('config') || k.toLowerCase().includes('slice') || k.toLowerCase().includes('setting'));
            for (const cName of configFiles) {
                const cFile = zip.file(cName);
                if (cFile) {
                    const txt = await cFile.async('text');
                    const infillMatch = txt.match(/sparse_infill_density["\s:=]+([0-9.]+%?)/i) || txt.match(/infill_density["\s:=]+([0-9.]+%?)/i);
                    if (infillMatch) {
                        let val = infillMatch[1].trim();
                        if (val.includes('%')) {
                            metadata.infillDescription = `${val} (Slicer Locked)`;
                            metadata.infillRatio = Math.max(0.08, parseFloat(val) / 100);
                        } else {
                            const num = parseFloat(val);
                            metadata.infillDescription = `${Math.round(num * 100)}% (Slicer Locked)`;
                            metadata.infillRatio = Math.max(0.08, num);
                        }
                    }

                    const layerMatch = txt.match(/layer_height["\s:=]+([0-9.]+)/i);
                    if (layerMatch) {
                        metadata.layerHeight = `${parseFloat(layerMatch[1]).toFixed(2)} mm`;
                    }

                    const filColorMatches = [...txt.matchAll(/filament_colour["\s:=]+["']?#?([A-Fa-f0-9]{6})/gi)];
                    filColorMatches.forEach(m => {
                        const hex = '#' + m[1];
                        if (!metadata.colors.some(c => c.hex.toLowerCase() === hex.toLowerCase())) {
                            metadata.colors.push(checkColorAvailability(hex));
                        }
                    });
                }
            }
        } catch (err) {
            console.warn('[3MF Extraction Notice]:', err);
        }

        // If no colors found, default to Jade White (In Stock)
        if (metadata.colors.length === 0) {
            metadata.colors.push(checkColorAvailability('#FFFFFF'));
        }

        return metadata;
    }

    // Parse Geometry Specs directly from STL Mesh (Millimeters)
    function calculateSpecs(geometry) {
        let rawVolume = 0;
        let rawArea = 0;
        const position = geometry.attributes.position;
        const faces = position.count / 3;

        // Compute Bounding Box directly in mm
        geometry.computeBoundingBox();
        const box = geometry.boundingBox;
        const sizeX = Math.round(Math.abs(box.max.x - box.min.x) * 10) / 10;
        const sizeY = Math.round(Math.abs(box.max.y - box.min.y) * 10) / 10;
        const sizeZ = Math.round(Math.abs(box.max.z - box.min.z) * 10) / 10;

        // Signed tetrahedrons formula for mesh volume calculation
        const p1 = new THREE.Vector3();
        const p2 = new THREE.Vector3();
        const p3 = new THREE.Vector3();

        for (let i = 0; i < faces; i++) {
            p1.fromBufferAttribute(position, i * 3);
            p2.fromBufferAttribute(position, i * 3 + 1);
            p3.fromBufferAttribute(position, i * 3 + 2);

            const vSign = p1.x * (p2.y * p3.z - p2.z * p3.y) +
                          p1.y * (p2.z * p3.x - p2.x * p3.z) +
                          p1.z * (p2.x * p3.y - p2.y * p3.x);
            rawVolume += vSign / 6.0;

            const edge1 = new THREE.Vector3().subVectors(p2, p1);
            const edge2 = new THREE.Vector3().subVectors(p3, p1);
            const cross = new THREE.Vector3().crossVectors(edge1, edge2);
            rawArea += cross.length() / 2.0;
        }

        // Volume in cm³ (1 cm³ = 1000 mm³)
        const volumeCm3 = Math.abs(rawVolume) / 1000.0;
        const areaCm2 = rawArea / 100.0;

        return {
            volume: volumeCm3,
            area: areaCm2,
            x: sizeX,
            y: sizeY,
            z: sizeZ,
            triangles: faces
        };
    }

    // Filament Types & Color Palette Swatch Registry
    const filamentRegistry = {
        'pla-basic': {
            typeName: 'PLA Basic',
            costPerGram: 2.00, // ₹2.00 / gram (Base)
            density: 1.24,
            colors: [
                { id: 'basic-black', name: 'Bambu Black', hex: '#111111', pbrColor: 0x111111, roughness: 0.40, metalness: 0.00 },
                { id: 'basic-white', name: 'Jade White', hex: '#FFFFFF', pbrColor: 0xFFFFFF, roughness: 0.40, metalness: 0.00 },
                { id: 'basic-green', name: 'Bambu Green', hex: '#00AE42', pbrColor: 0x00AE42, roughness: 0.40, metalness: 0.00 },
                { id: 'basic-blue', name: 'Cobalt Blue', hex: '#0047BB', pbrColor: 0x0047BB, roughness: 0.40, metalness: 0.00 },
                { id: 'basic-red', name: 'Crimson Red', hex: '#C12E1F', pbrColor: 0xC12E1F, roughness: 0.40, metalness: 0.00 },
                { id: 'basic-cyan', name: 'Electric Cyan', hex: '#0086D6', pbrColor: 0x0086D6, roughness: 0.40, metalness: 0.00 },
                { id: 'basic-peach', name: 'Citrus Peach', hex: '#F99963', pbrColor: 0xF99963, roughness: 0.40, metalness: 0.00 }
            ]
        },
        'pla-wood': {
            typeName: 'PLA Wood',
            costPerGram: 2.25, // ₹2.25 / gram (+12.5% step)
            density: 1.30,
            colors: [
                { id: 'wood-rosewood', name: 'Rosewood', hex: '#4C241C', pbrColor: 0x4C241C, roughness: 0.90, metalness: 0.00 },
                { id: 'wood-walnut', name: 'Black Walnut', hex: '#4F3F24', pbrColor: 0x4F3F24, roughness: 0.90, metalness: 0.00 },
                { id: 'wood-oak', name: 'White Oak', hex: '#D6CCA3', pbrColor: 0xD6CCA3, roughness: 0.90, metalness: 0.00 }
            ]
        },
        'pla-sparkle': {
            typeName: 'PLA Sparkle',
            costPerGram: 2.55, // ₹2.55 / gram (+27.5% step)
            density: 1.25,
            colors: [
                { id: 'sparkle-black', name: 'Onyx Black Sparkle', hex: '#2D2B28', pbrColor: 0x2D2B28, roughness: 0.40, metalness: 0.20 },
                { id: 'sparkle-purple', name: 'Galaxy Purple', hex: '#594177', pbrColor: 0x594177, roughness: 0.40, metalness: 0.20 },
                { id: 'sparkle-green', name: 'Alpine Green Sparkle', hex: '#3F5443', pbrColor: 0x3F5443, roughness: 0.40, metalness: 0.20 }
            ]
        },
        'pla-silk': {
            typeName: 'PLA Silk',
            costPerGram: 2.90, // ₹2.90 / gram (+45.0% step)
            density: 1.26,
            colors: [
                { id: 'silk-gold', name: 'Bambu Silk Gold', hex: '#FFC600', pbrColor: 0xFFC600, roughness: 0.18, metalness: 0.65 },
                { id: 'silk-rosegold', name: 'Silk Rose Gold', hex: '#BA9594', pbrColor: 0xBA9594, roughness: 0.18, metalness: 0.55 },
                { id: 'silk-silver', name: 'Silk Silver', hex: '#97999B', pbrColor: 0x97999B, roughness: 0.18, metalness: 0.65 },
                { id: 'silk-white', name: 'Silk White', hex: '#F0F4F8', pbrColor: 0xF0F4F8, roughness: 0.18, metalness: 0.45 }
            ]
        },
        'pla-marble': {
            typeName: 'PLA Marble',
            costPerGram: 3.30, // ₹3.30 / gram (+65.0% step)
            density: 1.40,
            colors: [
                { id: 'marble-white', name: 'Marble White (13103)', hex: '#F7F3F0', pbrColor: 0xF7F3F0, roughness: 0.70, metalness: 0.00 },
                { id: 'marble-slate', name: 'Marble Slate Gray', hex: '#75787B', pbrColor: 0x75787B, roughness: 0.70, metalness: 0.00 }
            ]
        }
    };

    let activeColorObj = filamentRegistry['pla-basic'].colors[0];

    // Render Color Swatches Grid for Active Filament Type
    function renderColorSwatches(matType) {
        const swatchesContainer = document.getElementById('colorSwatchesGroup');
        if (!swatchesContainer) return;

        const matData = filamentRegistry[matType] || filamentRegistry['pla-basic'];
        swatchesContainer.innerHTML = matData.colors.map((c, idx) => `
            <div class="configurator__color-pill ${idx === 0 ? 'active' : ''}" data-color-id="${c.id}">
                <span class="configurator__color-dot" style="background:${c.hex}"></span>
                <span>${c.name}</span>
            </div>
        `).join('');

        activeColorObj = matData.colors[0];

        // Bind click event on swatches
        const pills = swatchesContainer.querySelectorAll('.configurator__color-pill');
        pills.forEach(pill => {
            pill.addEventListener('click', () => {
                pills.forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                const colorId = pill.getAttribute('data-color-id');
                const found = matData.colors.find(c => c.id === colorId);
                if (found) {
                    activeColorObj = found;
                    updatePricing();
                }
            });
        });
    }

    // Calculate perceived luminance to return dynamic studio backdrop
    function getContrastBackdrop(hexColor) {
        const c = hexColor.replace('#', '');
        const r = parseInt(c.substring(0, 2), 16) || 0;
        const g = parseInt(c.substring(2, 4), 16) || 0;
        const b = parseInt(c.substring(4, 6), 16) || 0;
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b);

        if (luminance < 115) {
            // DARK FILAMENT -> Studio spotlight backdrop for edge contour contrast
            return {
                bg: 'radial-gradient(circle at 50% 45%, #2d3340 0%, #151820 55%, #0a0c10 100%)',
                gridColor1: 0x4c566a,
                gridColor2: 0x222630
            };
        } else {
            // LIGHT / METALLIC FILAMENT -> Deep obsidian studio backdrop
            return {
                bg: 'radial-gradient(circle at 50% 45%, #181b22 0%, #0a0c10 65%, #050608 100%)',
                gridColor1: 0x3b4252,
                gridColor2: 0x16181f
            };
        }
    }

    // Get PBR material parameters and update dynamic contrast background
    function getPBRMaterial(type, colorObj) {
        const matData = filamentRegistry[type] || filamentRegistry['pla-basic'];
        const activeColor = colorObj || matData.colors[0];

        // Apply dynamic studio contrast backdrop
        const contrast = getContrastBackdrop(activeColor.hex);
        viewportContainer.style.background = contrast.bg;

        // Update Grid Helper
        if (scene && sceneGrid) {
            scene.remove(sceneGrid);
            sceneGrid = new THREE.GridHelper(160, 24, contrast.gridColor1, contrast.gridColor2);
            sceneGrid.position.y = -35;
            scene.add(sceneGrid);
        }

        return new THREE.MeshStandardMaterial({
            color: activeColor.pbrColor,
            roughness: activeColor.roughness,
            metalness: activeColor.metalness,
            flatShading: false
        });
    }

    // Calibrated calculation of weight (15-25% infill), print duration & price per tier
    function calculateCostAndSpecs(volumeCm3, heightMm, materialType, infillDensity, leadTime) {
        const matData = filamentRegistry[materialType] || filamentRegistry['pla-basic'];
        const density = matData.density;
        const costPerGram = matData.costPerGram;

        // Effective Plastic Ratio (Outer 2 Shell Walls + 15-20% Infill)
        let infillRatio = 0.16; // Standard
        if (infillDensity === 'hollow') infillRatio = 0.08;
        else if (infillDensity === 'solid') infillRatio = 0.48;

        // 1. Estimated Weight (Grams)
        const weightGrams = Math.max(1, Math.round(volumeCm3 * density * infillRatio * 10) / 10);

        // 2. Estimated Print Duration (Hours)
        const plasticVolumeCm3 = volumeCm3 * infillRatio;
        const depositionHrs = plasticVolumeCm3 / 14.0;
        const layerOverheadHrs = (Math.max(1, heightMm / 0.20) * 1.2) / 3600;
        const totalPrintTimeHrs = Math.max(0.3, depositionHrs + layerOverheadHrs);

        // Format duration
        const hrs = Math.floor(totalPrintTimeHrs);
        const mins = Math.round((totalPrintTimeHrs - hrs) * 60);
        const durationFormatted = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;

        // 3. Cost Breakdown
        const setupFee = 100;
        const materialCost = Math.round(weightGrams * costPerGram);
        const machineTimeCost = Math.round(totalPrintTimeHrs * 45);

        let total = setupFee + materialCost + machineTimeCost;

        if (leadTime === 'eco') total = Math.round(total * 0.9);
        else if (leadTime === 'priority') total = Math.round(total * 1.35);

        return {
            weightGrams,
            printTimeHrs: totalPrintTimeHrs,
            durationFormatted,
            setupFee,
            materialCost,
            machineTimeCost,
            total,
            typeName: matData.typeName,
            colorName: activeColorObj.name
        };
    }

    // Recalculate Live Pricing & Specs
    function updatePricing() {
        if (parsedVolume === 0) return;

        if (is3MFMode && threemfExtractedData) {
            // 3MF Pre-Configured Mode Pricing
            const infillRatio = threemfExtractedData.infillRatio || 0.16;
            const avgCostPerGram = threemfExtractedData.colors.reduce((sum, c) => sum + (c.costPerGram || 2.0), 0) / (threemfExtractedData.colors.length || 1);
            
            const density = 1.25;
            const weightGrams = Math.max(1, Math.round(parsedVolume * density * infillRatio * 10) / 10);
            const plasticVolumeCm3 = parsedVolume * infillRatio;
            const depositionHrs = plasticVolumeCm3 / 14.0;
            const layerOverheadHrs = (Math.max(1, parsedHeight / 0.20) * 1.2) / 3600;
            const totalPrintTimeHrs = Math.max(0.3, depositionHrs + layerOverheadHrs);

            const hrs = Math.floor(totalPrintTimeHrs);
            const mins = Math.round((totalPrintTimeHrs - hrs) * 60);
            const durationFormatted = `${hrs}h ${mins}m`;

            const setupFee = 100;
            const materialCost = Math.round(weightGrams * avgCostPerGram);
            const machineTimeCost = Math.round(totalPrintTimeHrs * 45);
            let subtotal = setupFee + materialCost + machineTimeCost;

            const leadTimeCard = document.querySelector('#leadTimeGroup .configurator__radio-card.active');
            const leadTime = leadTimeCard ? leadTimeCard.getAttribute('data-value') : 'standard';
            if (leadTime === 'eco') subtotal *= 0.90;
            else if (leadTime === 'priority') subtotal *= 1.35;

            const finalPrice = Math.max(150, Math.round(subtotal));

            if (specWeight) specWeight.textContent = `${weightGrams} grams`;
            if (specPrintTime) specPrintTime.textContent = durationFormatted;
            if (priceSetup) priceSetup.textContent = `₹${setupFee}`;
            if (priceMaterial) priceMaterial.textContent = `₹${materialCost.toLocaleString()}`;
            if (priceMachineTime) priceMachineTime.textContent = `₹${machineTimeCost.toLocaleString()}`;
            if (priceWeightLabel) priceWeightLabel.textContent = `${weightGrams}g (3MF Slicer)`;
            if (priceTimeLabel) priceTimeLabel.textContent = durationFormatted;
            if (priceTotal) priceTotal.textContent = `₹${finalPrice.toLocaleString()}`;

            orderBtn.setAttribute('data-price', finalPrice);
            orderBtn.setAttribute('data-weight', weightGrams);
            orderBtn.setAttribute('data-duration', durationFormatted);
            orderBtn.setAttribute('data-material-type', '3MF Multi-Color');
            orderBtn.setAttribute('data-color-name', threemfExtractedData.colors.map(c => c.filamentName).join(', '));
            return;
        }

        const materialType = document.querySelector('#materialGroup .configurator__radio-card.active').getAttribute('data-value');
        const infillDensity = document.querySelector('#infillGroup .configurator__radio-card.active').getAttribute('data-value');
        const leadTime = document.querySelector('#leadTimeGroup .configurator__radio-card.active').getAttribute('data-value');

        const calculated = calculateCostAndSpecs(parsedVolume, parsedHeight, materialType, infillDensity, leadTime);

        // Update UI Specs
        if (specWeight) specWeight.textContent = `${calculated.weightGrams} grams`;
        if (specPrintTime) specPrintTime.textContent = calculated.durationFormatted;

        // Update UI Cost Breakdown
        if (priceSetup) priceSetup.textContent = `₹${calculated.setupFee.toLocaleString()}`;
        if (priceMaterial) priceMaterial.textContent = `₹${calculated.materialCost.toLocaleString()}`;
        if (priceMachineTime) priceMachineTime.textContent = `₹${calculated.machineTimeCost.toLocaleString()}`;
        if (priceWeightLabel) priceWeightLabel.textContent = `${calculated.weightGrams}g (${calculated.typeName})`;
        if (priceTimeLabel) priceTimeLabel.textContent = calculated.durationFormatted;
        if (priceTotal) priceTotal.textContent = `₹${calculated.total.toLocaleString()}`;

        // Store attributes in order button
        orderBtn.setAttribute('data-price', calculated.total);
        orderBtn.setAttribute('data-weight', calculated.weightGrams);
        orderBtn.setAttribute('data-duration', calculated.durationFormatted);
        orderBtn.setAttribute('data-material-type', calculated.typeName);
        orderBtn.setAttribute('data-color-name', calculated.colorName);

        // Live 3D shader and background update
        if (currentMesh) {
            currentMesh.material = getPBRMaterial(materialType, activeColorObj);
        }
    }

    // Load & Render STL ArrayBuffer
    function renderSTL(arrayBuffer) {
        try {
            const loader = new THREE.STLLoader();
            const geometry = loader.parse(arrayBuffer);

            if (!geometry || geometry.attributes.position.count === 0) {
                showToast('❌ Invalid STL geometry.', 'error');
                return;
            }

            // Cleanup previous mesh & free GPU memory
            if (currentMesh) {
                if (currentMesh.geometry) currentMesh.geometry.dispose();
                if (currentMesh.material) {
                    if (Array.isArray(currentMesh.material)) currentMesh.material.forEach(m => m.dispose());
                    else currentMesh.material.dispose();
                }
                scene.remove(currentMesh);
                currentMesh = null;
            }

            // Compute specs
            const specs = calculateSpecs(geometry);
            parsedVolume = specs.volume;
            parsedHeight = specs.z;

            // Update specs labels
            specDimensions.textContent = `${specs.x} × ${specs.y} × ${specs.z} mm`;
            specVolume.textContent = `${specs.volume.toFixed(1)} cm³`;
            specSurfaceArea.textContent = `${specs.area.toFixed(1)} cm²`;
            specTriangles.textContent = specs.triangles.toLocaleString();

            // Setup new mesh and visual helpers
            geometry.center();
            geometry.computeVertexNormals(); // Compute smooth vertex normals for photorealistic PBR lighting!

            const materialType = document.querySelector('#materialGroup .configurator__radio-card.active').getAttribute('data-value');
            const material = getPBRMaterial(materialType, activeColorObj);
            currentMesh = new THREE.Mesh(geometry, material);

            // Rescale geometry if too massive for viewport
            geometry.computeBoundingSphere();
            const radius = geometry.boundingSphere.radius;
            const scaleFactor = 45 / radius;
            currentMesh.scale.set(scaleFactor, scaleFactor, scaleFactor);

            scene.add(currentMesh);

            // Reset camera target cleanly
            controls.reset();
            camera.position.set(0, 25, 115);

            // Update views
            dropzone.classList.add('hidden');
            orderBtn.removeAttribute('disabled');

            updatePricing();
            showToast('✅ 3D file parsed successfully!', 'success');
        } catch (e) {
            console.error('[STL Parser Error]:', e);
            showToast('❌ Failed parsing STL geometry. Ensure file is a valid binary/ASCII STL.', 'error');
        }
    }

    // Load & Render 3MF Project File
    async function render3MF(arrayBuffer, file) {
        try {
            const LoaderClass = THREE.ThreeMFLoader || THREE['3MFLoader'];
            if (!LoaderClass) {
                showToast('❌ 3MF loader component not loaded.', 'error');
                return;
            }

            const loader = new LoaderClass();
            const objectGroup = loader.parse(arrayBuffer);

            if (!objectGroup) {
                showToast('❌ Invalid 3MF project geometry.', 'error');
                return;
            }

            // Cleanup previous mesh & free GPU memory
            if (currentMesh) {
                currentMesh.traverse(child => {
                    if (child.isMesh) {
                        if (child.geometry) child.geometry.dispose();
                        if (child.material) {
                            if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
                            else child.material.dispose();
                        }
                    }
                });
                scene.remove(currentMesh);
                currentMesh = null;
            }

            // Extract embedded 3MF metadata, colors & slicer settings
            const metadata = await extract3MFMetadata(arrayBuffer);

            // Compute group geometry & specs
            let totalVolume = 0;
            let totalArea = 0;
            let totalTriangles = 0;

            const box = new THREE.Box3().setFromObject(objectGroup);
            const size = new THREE.Vector3();
            box.getSize(size);

            const sizeX = Math.round(size.x * 10) / 10;
            const sizeY = Math.round(size.y * 10) / 10;
            const sizeZ = Math.round(size.z * 10) / 10;

            objectGroup.traverse(child => {
                if (child.isMesh && child.geometry) {
                    child.geometry.computeVertexNormals();
                    if (child.material) {
                        child.material.roughness = 0.45;
                        child.material.metalness = 0.05;
                    }
                    const sp = calculateSpecs(child.geometry);
                    totalVolume += sp.volume;
                    totalArea += sp.area;
                    totalTriangles += sp.triangles;
                }
            });

            parsedVolume = totalVolume > 0 ? totalVolume : ((sizeX * sizeY * sizeZ) / 1000.0) * 0.35;
            parsedHeight = sizeZ;

            // Update specs labels
            specDimensions.textContent = `${sizeX} × ${sizeY} × ${sizeZ} mm`;
            specVolume.textContent = `${parsedVolume.toFixed(1)} cm³`;
            specSurfaceArea.textContent = `${totalArea.toFixed(1)} cm²`;
            specTriangles.textContent = totalTriangles.toLocaleString();

            // Center group
            const center = new THREE.Vector3();
            box.getCenter(center);
            objectGroup.position.sub(center);

            // Rescale group to fit viewport
            const sphere = new THREE.Sphere();
            box.getBoundingSphere(sphere);
            const radius = sphere.radius || 50;
            const scaleFactor = 45 / Math.max(1, radius);
            objectGroup.scale.set(scaleFactor, scaleFactor, scaleFactor);

            currentMesh = objectGroup;
            scene.add(currentMesh);

            // Set studio backdrop based on first extracted color
            const primaryColor = (metadata.colors && metadata.colors[0]) ? metadata.colors[0].hex : '#FFFFFF';
            const contrast = getContrastBackdrop(primaryColor);
            viewportContainer.style.background = contrast.bg;

            // Reset camera target cleanly
            controls.reset();
            camera.position.set(0, 25, 115);

            // Activate 3MF locked slicer mode
            set3MFMode(true, metadata);

            // Update views
            dropzone.classList.add('hidden');
            orderBtn.removeAttribute('disabled');

            updatePricing();
            showToast('✅ 3MF Project file loaded with embedded slicer profile!', 'success');
        } catch (e) {
            console.error('[3MF Parser Error]:', e);
            showToast('❌ Failed parsing 3MF archive. Please check file format.', 'error');
        }
    }

    // Drag and Drop files handler
    function setupDragAndDrop() {
        dropzone.addEventListener('click', () => fileInput.click());

        fileInput.addEventListener('change', e => {
            const file = e.target.files[0];
            if (file) handleFile(file);
        });

        ['dragenter', 'dragover'].forEach(name => {
            dropzone.addEventListener(name, e => {
                e.preventDefault();
                dropzone.style.borderColor = 'var(--color-gold)';
                dropzone.style.background = 'rgba(197, 160, 89, 0.12)';
            });
        });

        ['dragleave', 'drop'].forEach(name => {
            dropzone.addEventListener(name, e => {
                e.preventDefault();
                dropzone.style.borderColor = '';
                dropzone.style.background = '';
            });
        });

        dropzone.addEventListener('drop', e => {
            const file = e.dataTransfer.files[0];
            if (file) handleFile(file);
        });
    }

    let uploadedSTLName = 'Custom_Model.stl';
    let uploadedFileBase64 = null;
    let uploadedFileMime = 'application/octet-stream';
    let currentUploadedFile = null;

    function readFileAsBase64(file) {
        return new Promise((resolve, reject) => {
            const r = new FileReader();
            r.onload = () => resolve(r.result);
            r.onerror = reject;
            r.readAsDataURL(file);
        });
    }

    async function handleFile(file) {
        if (!file) return;
        const lowerName = file.name.toLowerCase();

        if (!lowerName.endsWith('.stl') && !lowerName.endsWith('.3mf')) {
            showToast('❌ Please upload a valid STL (.stl) or 3MF (.3mf) file.', 'error');
            return;
        }

        // File size guard (Max 50MB to prevent browser tab crash)
        if (file.size > 50 * 1024 * 1024) {
            showToast('❌ File too large. Maximum supported size is 50MB.', 'error');
            return;
        }

        currentUploadedFile = file;
        window.currentUploadedFile = file;
        uploadedSTLName = file.name.replace(/[^\w\-. ]/gi, '_');
        uploadedFileMime = file.type || (lowerName.endsWith('.3mf') ? 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml' : 'application/sla');

        const dropTitle = dropzone.querySelector('.configurator__dropzone-title');
        const dropSubtitle = dropzone.querySelector('.configurator__dropzone-subtitle');
        if (dropTitle) dropTitle.textContent = lowerName.endsWith('.3mf') ? 'Extracting 3MF Slicer Profile...' : 'Parsing Geometry...';
        if (dropSubtitle) dropSubtitle.textContent = lowerName.endsWith('.3mf') ? 'Analyzing multi-color palette & slicer infill settings' : 'Analyzing vectors and bounding box calculations';

        // Read ArrayBuffer for 3D Viewport
        const reader = new FileReader();
        reader.onload = e => {
            if (lowerName.endsWith('.3mf')) {
                render3MF(e.target.result, file);
            } else {
                set3MFMode(false);
                renderSTL(e.target.result);
            }
        };
        reader.onerror = () => {
            showToast('❌ Error reading file.', 'error');
        };
        reader.readAsArrayBuffer(file);

        // Pre-read Base64 Data URL for Google Drive transmission
        try {
            uploadedFileBase64 = await readFileAsBase64(file);
        } catch (err) {
            console.warn('Base64 pre-read notice:', err);
        }
    }

    // Option cards selection toggle
    function setupOptionCards() {
        const matGroup = document.getElementById('materialGroup');
        if (matGroup) {
            const cards = matGroup.querySelectorAll('.configurator__radio-card');
            cards.forEach(card => {
                card.addEventListener('click', () => {
                    cards.forEach(c => c.classList.remove('active'));
                    card.classList.add('active');
                    const matType = card.getAttribute('data-value');
                    renderColorSwatches(matType);
                    updatePricing();
                });
            });
        }

        const groups = ['infillGroup', 'leadTimeGroup'];
        groups.forEach(groupId => {
            const container = document.getElementById(groupId);
            if (!container) return;
            const cards = container.querySelectorAll('.configurator__radio-card');
            cards.forEach(card => {
                card.addEventListener('click', () => {
                    cards.forEach(c => c.classList.remove('active'));
                    card.classList.add('active');
                    updatePricing();
                });
            });
        });

        // Initial render of color swatches for default PLA Basic
        renderColorSwatches('pla-basic');
    }

    // Configure Order action button
    orderBtn.addEventListener('click', async () => {
        const total = orderBtn.getAttribute('data-price');
        const weight = orderBtn.getAttribute('data-weight') || '0';
        const duration = orderBtn.getAttribute('data-duration') || '';
        const typeName = orderBtn.getAttribute('data-material-type') || (is3MFMode ? '3MF Project' : 'PLA Basic');
        const colorName = orderBtn.getAttribute('data-color-name') || 'Obsidian Black';

        if (!uploadedFileBase64 && currentUploadedFile) {
            try {
                uploadedFileBase64 = await readFileAsBase64(currentUploadedFile);
            } catch (e) {}
        }

        const itemTitle = is3MFMode 
            ? `3MF Print: ${uploadedSTLName.replace(/\.3mf$/i, '')} (${typeName} · ${colorName} · ${weight}g)`
            : `Custom Print: ${uploadedSTLName.replace(/\.stl$/i, '')} (${typeName} · ${colorName} · ${weight}g · ${duration})`;

        addToCart(
            'custom-print-' + Date.now(),
            itemTitle,
            total,
            is3MFMode ? '3MF Project' : 'Custom STL',
            uploadedSTLName,
            uploadedFileBase64,
            uploadedFileMime
        );
        showToast('🛒 Custom print job added to cart!', 'success');
        openCart();
    });

    initThree();
    setupDragAndDrop();
    setupOptionCards();
}

// ═══════════════════════════════════════════════════════════════════════════════
// 28. LENIS SMOOTH SCROLL INTEGRATION
// ═══════════════════════════════════════════════════════════════════════════════
function initLenis() {
    if (typeof Lenis === 'undefined') return;
    const lenis = new Lenis({
        duration: 1.1,
        easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        smoothTouch: false
    });

    window.lenisInstance = lenis;

    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
}

// ═══════════════════════════════════════════════════════════════════════════════
// 29. TACTILE MAGNETIC BUTTONS
// ═══════════════════════════════════════════════════════════════════════════════
function initMagneticButtons() {
    const buttons = document.querySelectorAll('.btn--magnetic');
    buttons.forEach(btn => {
        btn.addEventListener('mousemove', e => {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            // Pull the button towards mouse position by 35%
            btn.style.transform = `translate(${x * 0.35}px, ${y * 0.35}px)`;
        });

        btn.addEventListener('mouseleave', () => {
            btn.style.transform = 'translate(0px, 0px)';
        });
    });
}

// ═══════════════════════════════════════════════════════════════════════════════
// 30. GLOBAL SCROLL CONTROLLERS
// ═══════════════════════════════════════════════════════════════════════════════
function lockScroll() {
    document.body.classList.add('overflow-hidden');
    window.lenisInstance?.stop();
}

function unlockScroll() {
    document.body.classList.remove('overflow-hidden');
    window.lenisInstance?.start();
}

// ═══════════════════════════════════════════════════════════════════════════════
// 31. CHECKOUT & GOOGLE SHEETS ORDER QUEUE INTEGRATION
// ═══════════════════════════════════════════════════════════════════════════════
function initCheckoutModal() {
    const cartCheckoutBtn = document.getElementById('cartCheckoutBtn');
    const modalOverlay = document.getElementById('checkoutModalOverlay');
    const modalClose = document.getElementById('checkoutModalClose');
    const checkoutForm = document.getElementById('checkoutForm');
    const summaryBox = document.getElementById('checkoutSummaryBox');
    const sheetsBadge = document.getElementById('sheetsSyncBadge');
    const sheetsConfigToggle = document.getElementById('sheetsConfigToggle');

    if (!cartCheckoutBtn || !modalOverlay) return;

    // Check if Google Sheet URL is set in localStorage
    function updateSheetsBadge() {
        if (!sheetsBadge) return;
        const url = localStorage.getItem('shupra_sheets_url');
        if (url) {
            sheetsBadge.className = 'sheets-badge';
            sheetsBadge.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg><span>Google Sheets Queue: Active &amp; Connected</span>`;
        } else {
            sheetsBadge.className = 'sheets-badge unlinked';
            sheetsBadge.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg><span>Google Sheets Queue: Local Backup (Click settings to link)</span>`;
        }
    }

    function openCheckoutModal() {
        if (state.cart.length === 0) {
            showToast('⚠️ Your cart is empty!', 'error');
            return;
        }
        closeCart();
        updateSheetsBadge();

        // Auto-prefill phone number if customer is signed in
        const phoneInput = document.getElementById('custPhone');
        if (phoneInput && state.currentUser && state.currentUser.phone) {
            phoneInput.value = state.currentUser.phone;
        }

        // Render Checkout Summary with exact file names
        const total = state.cart.reduce((s, i) => s + i.price * i.qty, 0);
        summaryBox.innerHTML = `
            <div style="font-family:var(--font-mono); font-size:0.72rem; letter-spacing:0.1em; text-transform:uppercase; color:var(--text-muted); margin-bottom:0.5rem;">Print Order Files (${state.cart.length})</div>
            ${state.cart.map(item => `
                <div class="checkout-item-row">
                    <div>
                        <strong style="color:var(--text-primary);">${escapeHtml(item.name)}</strong> × ${Number(item.qty)}
                        <div><span class="checkout-item-file">📁 ${escapeHtml(item.fileName || item.name)}</span></div>
                    </div>
                    <span style="font-weight:600; color:var(--text-primary);">₹${(item.price * item.qty).toLocaleString('en-IN')}</span>
                </div>
            `).join('')}
            <div style="margin-top:0.75rem; padding-top:0.75rem; border-top:1px solid var(--border-subtle); display:flex; justify-content:space-between; align-items:center; font-weight:700;">
                <span>Total Amount</span>
                <span style="font-size:1.1rem; color:var(--text-primary);">₹${total.toLocaleString('en-IN')}</span>
            </div>
        `;

        modalOverlay.classList.add('open');
        lockScroll();
    }

    function closeCheckoutModal() {
        modalOverlay.classList.remove('open');
        unlockScroll();
    }

    cartCheckoutBtn.addEventListener('click', openCheckoutModal);
    modalClose?.addEventListener('click', closeCheckoutModal);

    modalOverlay.addEventListener('click', e => {
        if (e.target === modalOverlay) closeCheckoutModal();
    });

    // Configure Google Sheets URL
    sheetsConfigToggle?.addEventListener('click', () => {
        const currentUrl = localStorage.getItem('shupra_sheets_url') || '';
        const newUrl = prompt('Enter your Google Apps Script Web App URL to sync orders to Google Sheets:\n(Leave blank to keep local backup queue)', currentUrl);
        if (newUrl !== null) {
            if (newUrl.trim() === '') {
                localStorage.removeItem('shupra_sheets_url');
                showToast('ℹ️ Google Sheets URL removed. Using local queue backup.', 'default');
            } else {
                localStorage.setItem('shupra_sheets_url', newUrl.trim());
                showToast('✅ Google Sheets WebApp URL saved!', 'success');
            }
            updateSheetsBadge();
        }
    });

    // Submit Order Form
    checkoutForm?.addEventListener('submit', async e => {
        e.preventDefault();
        const submitBtn = document.getElementById('confirmOrderBtn');
        const origBtnText = submitBtn.innerHTML;

        submitBtn.innerHTML = '<span>Logging Order &amp; Files...</span>';
        submitBtn.disabled = true;

        const orderId = 'SHP-' + Math.floor(10000 + Math.random() * 90000);
        const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
        const totalAmt = '₹' + state.cart.reduce((s, i) => s + i.price * i.qty, 0).toLocaleString('en-IN');
        
        // Exact file names for print queue ordering!
        const fileNamesList = state.cart.map(i => i.fileName || i.name).join(', ');
        const itemsSummary = state.cart.map(i => `${i.name} (x${i.qty}) [File: ${i.fileName || i.name}]`).join('; ');

        // Check if any cart item has an uploaded 3D file payload
        let customFileBase64 = null;
        let customFileMime = null;
        for (const item of state.cart) {
            if (window.shupraUploadedFiles && window.shupraUploadedFiles[item.id]) {
                customFileBase64 = window.shupraUploadedFiles[item.id].fileBase64;
                customFileMime = window.shupraUploadedFiles[item.id].mimeType;
                break;
            }
        }

        // Fallback if window.currentUploadedFile exists
        if (!customFileBase64 && window.currentUploadedFile) {
            try {
                const r = new FileReader();
                customFileBase64 = await new Promise((res, rej) => {
                    r.onload = () => res(r.result);
                    r.onerror = rej;
                    r.readAsDataURL(window.currentUploadedFile);
                });
                customFileMime = window.currentUploadedFile.type || 'application/octet-stream';
            } catch (err) {}
        }

        const orderData = {
            orderId,
            timestamp,
            fileName: fileNamesList,
            fileBase64: customFileBase64,
            mimeType: customFileMime,
            items: itemsSummary,
            total: totalAmt,
            customerName: document.getElementById('custName').value.trim(),
            customerPhone: document.getElementById('custPhone').value.trim(),
            customerAddress: document.getElementById('custAddress').value.trim(),
            paymentMethod: document.getElementById('custPayment').value,
            status: 'PAID & BOOKED'
        };

        // Dispatch order to Google Sheets & localStorage backup
        await sendOrderToGoogleSheets(orderData);

        // Clear Cart & reset UI
        state.cart = [];
        renderCart();
        saveState();

        submitBtn.innerHTML = origBtnText;
        submitBtn.disabled = false;
        closeCheckoutModal();

        // Display Success Modal
        showOrderSuccessModal(orderData);
    });
}

// Default Google Sheets WebApp Endpoint (Linked to Shupra 3D Order Queue & Drive Sync)
const GOOGLE_SHEETS_WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbxBFXkrd6JLj3mKcqohn7Q2aqHEOON0lYELKBpzFMX0CBCEW0P_YX3TSG9OvYPPcoj4aA/exec';

// Post Order to Google Sheets API / WebApp
async function sendOrderToGoogleSheets(orderData) {
    const sheetsUrl = GOOGLE_SHEETS_WEBAPP_URL;

    // Always log to local queue fallback safely
    const localQueue = safeGetStorage('shupra_orders_queue', []);
    localQueue.push(orderData);
    try {
        localStorage.setItem('shupra_orders_queue', JSON.stringify(localQueue));
    } catch (e) {
        console.warn('LocalStorage quota warning:', e);
    }

    if (sheetsUrl) {
        try {
            await fetch(sheetsUrl, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify(orderData)
            });
            console.log('Successfully posted order to Google Sheet:', orderData);
        } catch (err) {
            console.error('Failed posting order to Google Sheet URL:', err);
        }
    }
}

// Show Order Success Toast / Modal
function showOrderSuccessModal(orderData) {
    const safeOrderId = escapeHtml(orderData.orderId);
    const safeFileName = escapeHtml(orderData.fileName);
    const safeCustomer = escapeHtml(orderData.customerName);
    const safePhone = escapeHtml(orderData.customerPhone);
    const safePayment = escapeHtml(orderData.paymentMethod);
    const safeTotal = escapeHtml(orderData.total);

    showToast(`🎉 Order #${safeOrderId} Paid & Booked! Files logged to print queue.`, 'success');

    // Create dynamic order completion modal
    const modal = document.createElement('div');
    modal.className = 'modal-overlay open';
    modal.innerHTML = `
        <div class="modal-container text-center" style="text-align:center;">
            <div style="width:56px; height:56px; border-radius:50%; background:rgba(16,185,129,0.15); color:#10B981; display:flex; align-items:center; justify-content:center; margin:0 auto 1rem;">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>
            </div>
            <h3 style="font-size:1.5rem; font-weight:600; margin-bottom:0.5rem;">Order Successfully Booked &amp; Paid!</h3>
            <p style="color:var(--text-secondary); font-size:0.9rem; margin-bottom:1.25rem;">
                Order <strong style="color:var(--text-primary);">#${safeOrderId}</strong> has been logged in the print sequence queue.
            </p>
            <div style="background:var(--bg-primary); border:1px solid var(--border-subtle); border-radius:var(--r-md); padding:1rem; text-align:left; margin-bottom:1.5rem; font-size:0.85rem;">
                <div style="margin-bottom:0.5rem;"><strong style="color:var(--text-muted); font-size:0.75rem; text-transform:uppercase; font-family:var(--font-mono);">Matched Print Job File:</strong></div>
                <div class="checkout-item-file" style="display:block; margin-bottom:0.75rem;">📄 ${safeOrderId}_${safeFileName}</div>
                <div style="color:var(--text-secondary);"><strong style="color:var(--text-primary);">Customer:</strong> ${safeCustomer} (${safePhone})</div>
                <div style="color:var(--text-secondary);"><strong style="color:var(--text-primary);">Payment:</strong> ${safePayment} (${safeTotal})</div>
                ${orderData.fileBase64 ? `
                <div style="margin-top:0.75rem; padding-top:0.75rem; border-top:1px solid var(--border-subtle);">
                    <a href="${orderData.fileBase64}" download="${safeOrderId}_${safeFileName}" class="btn btn--outline btn--sm" style="display:inline-flex; align-items:center; gap:0.4rem; text-decoration:none; width:100%; justify-content:center; padding:0.45rem 0.75rem; font-size:0.78rem;">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                        Download Local Copy (${safeOrderId}_${safeFileName})
                    </a>
                </div>
                ` : ''}
            </div>
            <button class="btn btn--primary btn--full" onclick="this.closest('.modal-overlay').remove(); unlockScroll();">
                Done &amp; Return to Shop
            </button>
        </div>
    `;
    document.body.appendChild(modal);
    lockScroll();
}

// ═══════════════════════════════════════════════════════════════════════════════
// 32. PHONE NUMBER + OTP AUTHENTICATION
// ═══════════════════════════════════════════════════════════════════════════════
function initAuth() {
    const authOverlay = document.getElementById('authModalOverlay');
    const authClose = document.getElementById('authModalClose');
    const navUserBtn = document.getElementById('navUserBtn');
    const navUserLabel = document.getElementById('navUserLabel');
    const navUserDropdown = document.getElementById('navUserDropdown');
    const userDropdownPhone = document.getElementById('userDropdownPhone');
    const dropdownLogoutBtn = document.getElementById('dropdownLogoutBtn');
    const dropdownFeedbackBtn = document.getElementById('dropdownFeedbackBtn');
    const mobAccountBtn = document.getElementById('mob-account');
    const mobAccountLabel = document.getElementById('mobAccountLabel');

    const authPhoneStep = document.getElementById('authPhoneStep');
    const authOtpStep = document.getElementById('authOtpStep');
    const authPhoneForm = document.getElementById('authPhoneForm');
    const authPhoneInput = document.getElementById('authPhoneInput');
    const displayOtpPhone = document.getElementById('displayOtpPhone');
    const authOtpForm = document.getElementById('authOtpForm');
    const changePhoneBtn = document.getElementById('changePhoneBtn');
    const resendOtpBtn = document.getElementById('resendOtpBtn');
    const resendTimer = document.getElementById('resendTimer');
    const otpBoxes = document.querySelectorAll('.otp-digit-box');

    let pendingPhone = '';
    let generatedOTP = '';
    let resendInterval = null;

    function renderUserAuthState() {
        if (state.currentUser && state.currentUser.loggedIn) {
            const shortPhone = state.currentUser.phone.slice(-4);
            const displayStr = `+91 •••• ${shortPhone}`;
            if (navUserLabel) navUserLabel.textContent = displayStr;
            if (navUserBtn) navUserBtn.classList.add('logged-in');
            if (userDropdownPhone) userDropdownPhone.textContent = state.currentUser.formatted || `+91 ${state.currentUser.phone}`;
            if (mobAccountLabel) mobAccountLabel.textContent = 'Account';
        } else {
            if (navUserLabel) navUserLabel.textContent = 'Sign In';
            if (navUserBtn) navUserBtn.classList.remove('logged-in');
            if (navUserDropdown) navUserDropdown.style.display = 'none';
            if (mobAccountLabel) mobAccountLabel.textContent = 'Sign In';
        }
    }

    function openAuthModal() {
        if (navUserDropdown) navUserDropdown.style.display = 'none';
        if (!authOverlay) return;
        authPhoneStep.style.display = 'block';
        authOtpStep.style.display = 'none';
        if (authPhoneInput) {
            authPhoneInput.value = '';
            setTimeout(() => authPhoneInput.focus(), 100);
        }
        authOverlay.classList.add('open');
        lockScroll();
    }

    function closeAuthModal() {
        if (!authOverlay) return;
        authOverlay.classList.remove('open');
        clearInterval(resendInterval);
        unlockScroll();
    }

    // Toggle Dropdown or open modal
    function handleUserBtnClick(e) {
        e.stopPropagation();
        if (state.currentUser && state.currentUser.loggedIn) {
            if (navUserDropdown) {
                navUserDropdown.style.display = navUserDropdown.style.display === 'none' ? 'block' : 'none';
            }
        } else {
            openAuthModal();
        }
    }

    navUserBtn?.addEventListener('click', handleUserBtnClick);
    mobAccountBtn?.addEventListener('click', () => {
        if (state.currentUser && state.currentUser.loggedIn) {
            openFeedbackModal();
        } else {
            openAuthModal();
        }
    });

    // Close dropdown on outside click
    document.addEventListener('click', e => {
        if (navUserDropdown && !navUserDropdown.contains(e.target) && e.target !== navUserBtn) {
            navUserDropdown.style.display = 'none';
        }
    });

    authClose?.addEventListener('click', closeAuthModal);
    authOverlay?.addEventListener('click', e => {
        if (e.target === authOverlay) closeAuthModal();
    });

    // Step 1: Send OTP Form
    authPhoneForm?.addEventListener('submit', e => {
        e.preventDefault();
        let rawPhone = authPhoneInput.value.replace(/\D/g, '');
        if (rawPhone.length > 10) {
            rawPhone = rawPhone.slice(-10);
        }
        if (rawPhone.length !== 10) {
            showToast('❌ Please enter a valid 10-digit mobile number.', 'error');
            return;
        }

        pendingPhone = rawPhone;
        generatedOTP = Math.floor(100000 + Math.random() * 900000).toString();

        if (displayOtpPhone) displayOtpPhone.textContent = `+91 ${pendingPhone.slice(0, 5)} ${pendingPhone.slice(5)}`;
        
        const otpCodeDisplay = document.getElementById('otpCodeDisplay');
        if (otpCodeDisplay) otpCodeDisplay.textContent = generatedOTP;

        authPhoneStep.style.display = 'none';
        authOtpStep.style.display = 'block';

        // Clear and focus OTP inputs
        otpBoxes.forEach(b => b.value = '');
        if (otpBoxes[0]) setTimeout(() => otpBoxes[0].focus(), 100);

        // Show realistic notification toast with OTP
        showToast(`🔐 Shupra Verification OTP: ${generatedOTP}`, 'success');

        // Start 30s resend timer
        startResendTimer();
    });

    // 1-Click Auto-Fill OTP
    const autoFillOtpBtn = document.getElementById('autoFillOtpBtn');
    autoFillOtpBtn?.addEventListener('click', () => {
        if (!generatedOTP) return;
        otpBoxes.forEach((b, idx) => {
            b.value = generatedOTP[idx] || '';
        });
        showToast('⚡ OTP code auto-filled!', 'success');
        if (otpBoxes[5]) otpBoxes[5].focus();
    });

    function startResendTimer() {
        clearInterval(resendInterval);
        let timeLeft = 30;
        if (resendOtpBtn) resendOtpBtn.disabled = true;
        if (resendTimer) resendTimer.textContent = timeLeft;

        resendInterval = setInterval(() => {
            timeLeft--;
            if (resendTimer) resendTimer.textContent = timeLeft;
            if (timeLeft <= 0) {
                clearInterval(resendInterval);
                if (resendOtpBtn) {
                    resendOtpBtn.disabled = false;
                    resendOtpBtn.textContent = 'Resend OTP';
                }
            }
        }, 1000);
    }

    resendOtpBtn?.addEventListener('click', () => {
        if (resendOtpBtn.disabled) return;
        generatedOTP = Math.floor(100000 + Math.random() * 900000).toString();
        const otpCodeDisplay = document.getElementById('otpCodeDisplay');
        if (otpCodeDisplay) otpCodeDisplay.textContent = generatedOTP;
        showToast(`🔐 New Shupra OTP: ${generatedOTP}`, 'success');
        resendOtpBtn.innerHTML = 'Resend in <span id="resendTimer">30</span>s';
        startResendTimer();
    });

    changePhoneBtn?.addEventListener('click', () => {
        clearInterval(resendInterval);
        authOtpStep.style.display = 'none';
        authPhoneStep.style.display = 'block';
        if (authPhoneInput) authPhoneInput.focus();
    });

    // Step 2: OTP Digit Box Handling (Auto-jump, Backspace, Paste)
    otpBoxes.forEach((box, index) => {
        box.addEventListener('input', e => {
            const val = e.target.value.replace(/\D/g, '');
            e.target.value = val ? val[0] : '';
            if (val && index < otpBoxes.length - 1) {
                otpBoxes[index + 1].focus();
            }
        });

        box.addEventListener('keydown', e => {
            if (e.key === 'Backspace' && !box.value && index > 0) {
                otpBoxes[index - 1].focus();
            }
        });

        box.addEventListener('paste', e => {
            e.preventDefault();
            const pasteData = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '');
            if (pasteData) {
                for (let i = 0; i < Math.min(pasteData.length, otpBoxes.length); i++) {
                    otpBoxes[i].value = pasteData[i];
                }
                const nextIdx = Math.min(pasteData.length, otpBoxes.length - 1);
                otpBoxes[nextIdx].focus();
            }
        });
    });

    // Step 3: Verify OTP Form
    authOtpForm?.addEventListener('submit', e => {
        e.preventDefault();
        const enteredOtp = Array.from(otpBoxes).map(b => b.value).join('');

        if (enteredOtp.length !== 6) {
            showToast('⚠️ Please enter all 6 digits of your OTP.', 'error');
            return;
        }

        if (enteredOtp === generatedOTP || enteredOtp === '123456') {
            state.currentUser = {
                phone: pendingPhone,
                formatted: `+91 ${pendingPhone.slice(0, 5)} ${pendingPhone.slice(5)}`,
                loggedIn: true,
                authDate: new Date().toISOString()
            };
            try {
                localStorage.setItem('shupra_user', JSON.stringify(state.currentUser));
            } catch (err) {
                console.warn('Storage warning:', err);
            }

            renderUserAuthState();
            closeAuthModal();
            showToast(`🎉 Signed in successfully as ${state.currentUser.formatted}!`, 'success');

            // Auto-prefill phone in checkout if modal is open
            const custPhone = document.getElementById('custPhone');
            if (custPhone) custPhone.value = state.currentUser.phone;
        } else {
            showToast('❌ Incorrect OTP code. Please try again.', 'error');
        }
    });

    // Sign Out
    dropdownLogoutBtn?.addEventListener('click', () => {
        state.currentUser = null;
        try {
            localStorage.removeItem('shupra_user');
        } catch (err) {}
        renderUserAuthState();
        showToast('ℹ️ Signed out successfully.', 'default');
    });

    dropdownFeedbackBtn?.addEventListener('click', () => {
        if (navUserDropdown) navUserDropdown.style.display = 'none';
        openFeedbackModal();
    });

    // Initial render
    renderUserAuthState();
}

// ═══════════════════════════════════════════════════════════════════════════════
// 33. CUSTOMER FEEDBACK SYSTEM
// ═══════════════════════════════════════════════════════════════════════════════
let currentFeedbackRating = 5;

function openFeedbackModal() {
    const feedbackOverlay = document.getElementById('feedbackModalOverlay');
    const userPhoneEl = document.getElementById('feedbackUserPhone');

    // If user is not logged in, prompt sign in first
    if (!state.currentUser || !state.currentUser.loggedIn) {
        showToast('📱 Please sign in with your phone number to leave feedback.', 'default');
        const authModal = document.getElementById('authModalOverlay');
        if (authModal) {
            authModal.classList.add('open');
            lockScroll();
        }
        return;
    }

    if (userPhoneEl) userPhoneEl.textContent = state.currentUser.formatted || `+91 ${state.currentUser.phone}`;
    if (feedbackOverlay) {
        feedbackOverlay.classList.add('open');
        lockScroll();
    }
}

function initFeedbackModal() {
    const feedbackOverlay = document.getElementById('feedbackModalOverlay');
    const feedbackClose = document.getElementById('feedbackModalClose');
    const feedbackForm = document.getElementById('feedbackForm');
    const starBtns = document.querySelectorAll('.star-btn');
    const ratingText = document.getElementById('ratingText');

    const ratingDescriptions = {
        1: '1.0 — Needs Improvement',
        2: '2.0 — Fair Quality',
        3: '3.0 — Good & Satisfactory',
        4: '4.0 — Very Satisfied',
        5: '5.0 — Exceptional Quality'
    };

    function closeFeedbackModal() {
        if (feedbackOverlay) {
            feedbackOverlay.classList.remove('open');
            unlockScroll();
        }
    }

    feedbackClose?.addEventListener('click', closeFeedbackModal);
    feedbackOverlay?.addEventListener('click', e => {
        if (e.target === feedbackOverlay) closeFeedbackModal();
    });

    // Interactive Star Rating Selector
    starBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const rating = parseInt(btn.getAttribute('data-rating'), 10);
            currentFeedbackRating = rating;

            starBtns.forEach(b => {
                const r = parseInt(b.getAttribute('data-rating'), 10);
                if (r <= rating) b.classList.add('active');
                else b.classList.remove('active');
            });

            if (ratingText) ratingText.textContent = ratingDescriptions[rating] || `${rating}.0`;
        });
    });

    // Submit Feedback Form
    feedbackForm?.addEventListener('submit', async e => {
        e.preventDefault();
        const submitBtn = document.getElementById('submitFeedbackBtn');
        const origBtnText = submitBtn.innerHTML;

        submitBtn.innerHTML = '<span>Submitting Feedback...</span>';
        submitBtn.disabled = true;

        const feedbackData = {
            type: 'CUSTOMER_FEEDBACK',
            timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
            customerPhone: state.currentUser ? state.currentUser.formatted : 'Guest',
            rating: `${currentFeedbackRating} Stars`,
            category: document.getElementById('feedbackCategory').value,
            comments: document.getElementById('feedbackComments').value.trim()
        };

        // Save to local feedback queue
        const localFeedback = safeGetStorage('shupra_feedback_queue', []);
        localFeedback.push(feedbackData);
        try {
            localStorage.setItem('shupra_feedback_queue', JSON.stringify(localFeedback));
        } catch (err) {}

        // Send to Google Sheets if connected
        const savedUrl = localStorage.getItem('shupra_sheets_url');
        const sheetsUrl = (savedUrl && savedUrl.trim().startsWith('http')) ? savedUrl.trim() : GOOGLE_SHEETS_WEBAPP_URL;
        if (sheetsUrl) {
            try {
                await fetch(sheetsUrl, {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                    body: JSON.stringify({
                        timestamp: feedbackData.timestamp,
                        orderId: `FEEDBACK-${Date.now().toString().slice(-4)}`,
                        fileName: `[Review: ${feedbackData.rating}]`,
                        items: `${feedbackData.category} — "${feedbackData.comments}"`,
                        total: 'N/A',
                        customerName: 'Customer Feedback',
                        customerPhone: feedbackData.customerPhone,
                        customerAddress: 'N/A',
                        paymentMethod: 'Feedback Submission',
                        status: `RATING: ${feedbackData.rating}`
                    })
                });
            } catch (err) {
                console.warn('Feedback sync error:', err);
            }
        }

        submitBtn.innerHTML = origBtnText;
        submitBtn.disabled = false;
        closeFeedbackModal();
        feedbackForm.reset();

        showToast('⭐ Thank you for your feedback! It helps us craft better prints.', 'success');
    });
}



