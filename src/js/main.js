/* ============================================
   CONOR McARDLE — Portfolio
   Interactions & Animations
   ============================================ */

(function () {
  'use strict';

  // ── Theme Toggle ──

  const THEME_KEY = 'cm-theme';

  function getPreferredTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }

  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
  }

  // Apply theme immediately to prevent flash
  setTheme(getPreferredTheme());

  document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.querySelector('.theme-toggle');
    if (toggle) {
      toggle.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        setTheme(current === 'dark' ? 'light' : 'dark');
      });
    }

    // Listen for system preference changes
    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
      if (!localStorage.getItem(THEME_KEY)) {
        setTheme(e.matches ? 'light' : 'dark');
      }
    });
  });

  // ── Mobile Navigation ──

  document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.querySelector('.nav__toggle');
    const overlay = document.querySelector('.nav__overlay');

    if (toggle && overlay) {
      toggle.addEventListener('click', () => {
        const isOpen = toggle.classList.toggle('is-active');
        overlay.classList.toggle('is-open', isOpen);
        document.body.style.overflow = isOpen ? 'hidden' : '';
      });

      // Close on link click
      overlay.querySelectorAll('.nav__link').forEach(link => {
        link.addEventListener('click', () => {
          toggle.classList.remove('is-active');
          overlay.classList.remove('is-open');
          document.body.style.overflow = '';
        });
      });
    }
  });

  // ── Scroll Animations ──

  document.addEventListener('DOMContentLoaded', () => {
    const animated = document.querySelectorAll('[data-animate]');
    if (!animated.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -40px 0px'
    });

    animated.forEach(el => observer.observe(el));
  });

  // ── Typing Effect ──

  document.addEventListener('DOMContentLoaded', () => {
    const el = document.querySelector('[data-typed]');
    if (!el) return;

    const text = el.getAttribute('data-typed');
    el.textContent = '';

    let i = 0;
    const speed = 35;
    const startDelay = 600;

    function type() {
      if (i < text.length) {
        el.textContent += text.charAt(i);
        i++;
        setTimeout(type, speed + Math.random() * 20);
      }
    }

    setTimeout(type, startDelay);
  });

  // ── Status Bar Scroll Progress ──

  document.addEventListener('DOMContentLoaded', () => {
    const fill = document.querySelector('.status-bar__progress-fill');
    const pct = document.querySelector('[data-scroll-pct]');
    if (!fill) return;

    let ticking = false;

    function updateProgress() {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? Math.min((scrollTop / docHeight) * 100, 100) : 0;
      fill.style.width = progress + '%';
      if (pct) pct.textContent = Math.round(progress) + '%';
      ticking = false;
    }

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(updateProgress);
        ticking = true;
      }
    }, { passive: true });

    updateProgress();
  });

  // ── Smooth Page Transitions (fallback for non-VT browsers) ──

  document.addEventListener('DOMContentLoaded', () => {
    // Only apply if View Transitions API is NOT supported
    if (document.startViewTransition) return;

    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 200ms ease';
    requestAnimationFrame(() => {
      document.body.style.opacity = '1';
    });

    document.querySelectorAll('a[href]').forEach(link => {
      const href = link.getAttribute('href');
      // Only handle local navigation
      if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto:')) return;

      link.addEventListener('click', (e) => {
        e.preventDefault();
        document.body.style.opacity = '0';
        setTimeout(() => {
          window.location.href = href;
        }, 200);
      });
    });
  });

})();
