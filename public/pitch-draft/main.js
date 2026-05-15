/* ============================================================
   DAVE'S CONTRACTING — SHARED JS
   ============================================================ */

/* ---- 1. GSAP Plugin Registration ---- */
gsap.registerPlugin(ScrollTrigger);

/* ---- 2. Lenis Smooth Scroll ---- */
const lenis = new Lenis({
  duration: 1.25,
  easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smoothTouch: false,
  touchMultiplier: 1.8,
});

lenis.on('scroll', ScrollTrigger.update);

gsap.ticker.add(time => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);

/* ---- 3. Custom Cursor ---- */
const cursorEl = document.getElementById('cursor');
const cursorDot = cursorEl && cursorEl.querySelector('.cursor__dot');
const cursorRing = cursorEl && cursorEl.querySelector('.cursor__ring');

let mX = window.innerWidth / 2, mY = window.innerHeight / 2;
let dX = mX, dY = mY, rX = mX, rY = mY;

document.addEventListener('mousemove', e => { mX = e.clientX; mY = e.clientY; });

(function tickCursor() {
  dX += (mX - dX) * 0.92;
  dY += (mY - dY) * 0.92;
  rX += (mX - rX) * 0.1;
  rY += (mY - rY) * 0.1;
  if (cursorDot)  cursorDot.style.transform  = `translate(calc(${dX}px - 50%), calc(${dY}px - 50%))`;
  if (cursorRing) cursorRing.style.transform = `translate(calc(${rX}px - 50%), calc(${rY}px - 50%))`;
  requestAnimationFrame(tickCursor);
})();

function cursorState(add, remove) {
  document.body.classList.add(add);
  remove.forEach(c => document.body.classList.remove(c));
}
function clearCursorState() {
  ['c--link','c--text','c--drag','c--img'].forEach(c => document.body.classList.remove(c));
}

document.addEventListener('mouseover', e => {
  const t = e.target;
  if (t.closest('a, button, [role="button"], .btn, .filter-chip'))       cursorState('c--link', ['c--text','c--drag','c--img']);
  else if (t.closest('input, textarea, select'))                         cursorState('c--text', ['c--link','c--drag','c--img']);
  else if (t.closest('.t-slider, .ba, .testimonials-slider'))            cursorState('c--drag', ['c--link','c--text','c--img']);
  else if (t.closest('.img-ph, .featured-card, .port-card, .service-img-slot')) cursorState('c--img', ['c--link','c--text','c--drag']);
  else clearCursorState();
});

/* ---- 4. Navigation ---- */
const navEl = document.getElementById('nav');

window.addEventListener('scroll', () => {
  navEl && navEl.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

/* ---- 5. Active Nav Link ---- */
const currentHref = window.location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.nav__links a, .mob-nav__links a').forEach(a => {
  if (a.getAttribute('href') === currentHref) a.classList.add('active');
});

/* ---- 6. Hamburger / Mobile Menu ---- */
const burger = document.getElementById('burger');
const mobMenu = document.getElementById('mobMenu');

burger && burger.addEventListener('click', () => {
  const open = burger.classList.toggle('open');
  mobMenu && mobMenu.classList.toggle('open', open);
  document.body.style.overflow = open ? 'hidden' : '';
  burger.setAttribute('aria-expanded', open);
});

/* ---- 7. Page Transitions ---- */
const ptEl = document.getElementById('pt');

window.addEventListener('DOMContentLoaded', () => {
  /* Panel stays above the viewport — no entry animation needed */
  initPageAnimations();
  initCountUp();
  initTestimonialSlider();
  initBeforeAfter();
  initFooterWordmark();
  initMagneticBtns();
  lucide && lucide.createIcons();
});

document.querySelectorAll('[data-trans]').forEach(link => {
  link.addEventListener('click', e => {
    const href = link.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('mailto') || href.startsWith('tel')) return;
    e.preventDefault();
    burger && burger.classList.remove('open');
    mobMenu && mobMenu.classList.remove('open');
    document.body.style.overflow = '';
    if (!ptEl) { window.location.href = href; return; }
    /* Panel slides DOWN from above to cover screen, then navigates */
    gsap.fromTo(ptEl,
      { yPercent: -100 },
      { yPercent: 0, duration: 0.65, ease: 'expo.inOut',
        onComplete: () => { window.location.href = href; }
      }
    );
  });
});

/* ---- 8. Magnetic Buttons ---- */
function initMagneticBtns() {
  document.querySelectorAll('.magnetic').forEach(btn => {
    btn.addEventListener('mousemove', e => {
      const r = btn.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2;
      const y = e.clientY - r.top - r.height / 2;
      gsap.to(btn, { x: x * 0.38, y: y * 0.38, duration: 0.4, ease: 'power2.out' });
    });
    btn.addEventListener('mouseleave', () => {
      gsap.to(btn, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.4)' });
    });
  });
}

/* ---- 9. Scroll Reveals ---- */
function initPageAnimations() {
  gsap.utils.toArray('[data-reveal="clip"]').forEach(el => {
    gsap.fromTo(el,
      { clipPath: 'inset(0 0 100% 0)', opacity: 0 },
      { clipPath: 'inset(0 0 0% 0)', opacity: 1,
        duration: 1.05, ease: 'expo.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true }
      }
    );
  });

  gsap.utils.toArray('[data-reveal="up"]').forEach((el, i) => {
    const delay = parseFloat(el.dataset.delay || 0);
    gsap.fromTo(el,
      { opacity: 0, y: 55 },
      { opacity: 1, y: 0,
        duration: 0.9, ease: 'expo.out', delay,
        scrollTrigger: { trigger: el, start: 'top 90%', once: true }
      }
    );
  });

  gsap.utils.toArray('[data-reveal="line"]').forEach(el => {
    gsap.fromTo(el,
      { scaleX: 0, transformOrigin: 'left center' },
      { scaleX: 1, duration: 1, ease: 'expo.out',
        scrollTrigger: { trigger: el, start: 'top 90%', once: true }
      }
    );
  });

  // Stagger groups
  document.querySelectorAll('[data-stagger]').forEach(container => {
    const items = container.querySelectorAll('[data-stagger-item]');
    gsap.fromTo(items,
      { opacity: 0, y: 45 },
      { opacity: 1, y: 0,
        stagger: 0.1, duration: 0.85, ease: 'expo.out',
        scrollTrigger: { trigger: container, start: 'top 87%', once: true }
      }
    );
  });
}

/* ---- 10. Count-Up ---- */
function initCountUp() {
  document.querySelectorAll('[data-count]').forEach(el => {
    const target  = parseInt(el.dataset.count, 10);
    const suffix  = el.dataset.suffix || '';
    const prefix  = el.dataset.prefix || '';
    ScrollTrigger.create({
      trigger: el, start: 'top 82%', once: true,
      onEnter: () => {
        gsap.to({ v: 0 }, {
          v: target, duration: 2.2, ease: 'power2.out',
          onUpdate() { el.textContent = prefix + Math.round(this.targets()[0].v) + suffix; }
        });
      }
    });
  });
}

/* ---- 11. Testimonial Drag Slider ---- */
function initTestimonialSlider() {
  document.querySelectorAll('.t-slider').forEach(slider => {
    let isDown = false, startX = 0, scrollL = 0;
    slider.addEventListener('mousedown', e => {
      isDown = true; startX = e.pageX - slider.offsetLeft; scrollL = slider.scrollLeft;
    });
    slider.addEventListener('mouseleave', () => { isDown = false; slider.classList.remove('dragging'); });
    slider.addEventListener('mouseup', () => { isDown = false; slider.classList.remove('dragging'); });
    slider.addEventListener('mousemove', e => {
      if (!isDown) return;
      e.preventDefault(); slider.classList.add('dragging');
      slider.scrollLeft = scrollL - (e.pageX - slider.offsetLeft - startX) * 1.8;
    });
  });
}

/* ---- 12. Before / After Slider ---- */
function initBeforeAfter() {
  document.querySelectorAll('.ba').forEach(ba => {
    const after  = ba.querySelector('.ba__after');
    const handle = ba.querySelector('.ba__handle');
    if (!after || !handle) return;
    let active = false;

    function setPos(x) {
      const r = ba.getBoundingClientRect();
      const p = Math.min(98, Math.max(2, ((x - r.left) / r.width) * 100));
      after.style.clipPath   = `inset(0 ${100 - p}% 0 0)`;
      handle.style.left      = p + '%';
    }

    ba.addEventListener('mousedown', e => { active = true; setPos(e.clientX); });
    window.addEventListener('mousemove', e => { if (active) setPos(e.clientX); });
    window.addEventListener('mouseup', () => { active = false; });
    ba.addEventListener('touchstart', e => { active = true; setPos(e.touches[0].clientX); }, { passive: true });
    window.addEventListener('touchmove', e => { if (active) setPos(e.touches[0].clientX); }, { passive: true });
    window.addEventListener('touchend', () => { active = false; });
  });
}

/* ---- 13. Footer Wordmark Fill ---- */
function initFooterWordmark() {
  const wm = document.querySelector('.footer__wm');
  if (!wm) return;
  ScrollTrigger.create({
    trigger: wm, start: 'top 82%', once: true,
    onEnter: () => wm.classList.add('filled'),
  });
}
