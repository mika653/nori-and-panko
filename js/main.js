/**
 * Nori and Panko Home Service Veterinarian
 * Main JavaScript — Production-Ready, Vanilla JS
 *
 * Modules:
 *  1. Navigation (sticky, scroll detection, mobile menu)
 *  2. Intersection Observer (reveal animations, staggered children)
 *  3. Accordion / FAQ
 *  4. Testimonials Carousel (auto-advance, touch/swipe, dots)
 *  5. Tab Components (underline + pill styles)
 *  6. Counter Animation
 *  7. Form Validation
 *  8. Toast / Notification System
 *  9. Image Lazy Loading
 * 10. Utilities & Initialiser
 */

'use strict';

/* ============================================================
   UTILITY HELPERS
   ============================================================ */

/**
 * Shorthand query selectors
 * @param {string} selector
 * @param {Element|Document} [context=document]
 * @returns {Element|null}
 */
const $ = (selector, context = document) => context.querySelector(selector);

/**
 * @param {string} selector
 * @param {Element|Document} [context=document]
 * @returns {NodeList}
 */
const $$ = (selector, context = document) => context.querySelectorAll(selector);

/**
 * Add event listener with optional delegation support
 * @param {Element|string} target - element or CSS selector
 * @param {string} event
 * @param {Function} handler
 * @param {object} [options]
 */
function on(target, event, handler, options = {}) {
  const el = typeof target === 'string' ? $(target) : target;
  if (el) el.addEventListener(event, handler, options);
}

/**
 * Throttle a function to fire at most once per `limit` ms
 * @param {Function} fn
 * @param {number} limit
 * @returns {Function}
 */
function throttle(fn, limit) {
  let lastCall = 0;
  return function (...args) {
    const now = Date.now();
    if (now - lastCall >= limit) {
      lastCall = now;
      fn.apply(this, args);
    }
  };
}

/**
 * Debounce a function
 * @param {Function} fn
 * @param {number} delay
 * @returns {Function}
 */
function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * Trap focus within a given element (for accessibility)
 * @param {Element} container
 * @returns {Function} cleanup function
 */
function trapFocus(container) {
  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'textarea:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ');

  const focusable = Array.from($$(focusableSelectors, container));
  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  function handler(e) {
    if (e.key !== 'Tab') return;
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  container.addEventListener('keydown', handler);
  if (first) first.focus();

  return () => container.removeEventListener('keydown', handler);
}

/**
 * Get the current scroll position
 * @returns {number}
 */
function getScrollY() {
  return window.scrollY || window.pageYOffset;
}


/* ============================================================
   1. NAVIGATION
   ============================================================ */

const Navigation = (() => {
  let nav = null;
  let toggle = null;
  let mobileMenu = null;
  let isMenuOpen = false;
  let releaseFocus = null;

  /**
   * Handle scroll: add/remove .scrolled class on nav
   */
  function onScroll() {
    if (!nav) return;
    if (getScrollY() > 20) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  }

  /**
   * Open the mobile menu
   */
  function openMenu() {
    if (!mobileMenu || !toggle) return;
    isMenuOpen = true;
    mobileMenu.classList.add('open');
    toggle.classList.add('open');
    toggle.setAttribute('aria-expanded', 'true');
    mobileMenu.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    releaseFocus = trapFocus(mobileMenu);
  }

  /**
   * Close the mobile menu
   */
  function closeMenu() {
    if (!mobileMenu || !toggle) return;
    isMenuOpen = false;
    mobileMenu.classList.remove('open');
    toggle.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    mobileMenu.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (releaseFocus) {
      releaseFocus();
      releaseFocus = null;
    }
    toggle.focus();
  }

  /**
   * Toggle mobile menu
   */
  function toggleMenu() {
    if (isMenuOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  }

  /**
   * Highlight active nav link based on current page URL
   */
  function setActiveLink() {
    const currentPath = window.location.pathname;
    const filename = currentPath.split('/').pop() || 'index.html';

    $$('.nav-links a, .nav-mobile-links a').forEach((link) => {
      const href = link.getAttribute('href');
      if (!href) return;

      const linkFile = href.split('/').pop();
      const isActive =
        href === currentPath ||
        linkFile === filename ||
        (filename === '' && (href === '/' || href === 'index.html')) ||
        (filename === 'index.html' && (href === '/' || href === 'index.html'));

      if (isActive) {
        link.closest('li')?.classList.add('active');
        link.setAttribute('aria-current', 'page');
      } else {
        link.closest('li')?.classList.remove('active');
        link.removeAttribute('aria-current');
      }
    });
  }

  /**
   * Smooth scroll for anchor links within the page
   * @param {Event} e
   */
  function handleAnchorClick(e) {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;

    const targetId = link.getAttribute('href');
    if (targetId === '#') return;

    const targetEl = $(targetId);
    if (!targetEl) return;

    e.preventDefault();

    if (isMenuOpen) closeMenu();

    const navHeight = nav ? nav.offsetHeight : 0;
    const targetTop = targetEl.getBoundingClientRect().top + getScrollY() - navHeight - 8;

    window.scrollTo({ top: targetTop, behavior: 'smooth' });

    targetEl.setAttribute('tabindex', '-1');
    targetEl.focus({ preventScroll: true });
    targetEl.addEventListener('blur', () => targetEl.removeAttribute('tabindex'), { once: true });
  }

  /**
   * Initialise Navigation module
   */
  function init() {
    nav = $('.nav');
    toggle = $('.nav-toggle');
    mobileMenu = $('.nav-mobile-menu');

    if (!nav) return;

    window.addEventListener('scroll', throttle(onScroll, 80), { passive: true });
    onScroll();

    if (toggle) {
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-controls', 'nav-mobile-menu');
      if (mobileMenu) mobileMenu.id = mobileMenu.id || 'nav-mobile-menu';
      toggle.addEventListener('click', toggleMenu);
    }

    if (mobileMenu) {
      mobileMenu.setAttribute('aria-hidden', 'true');
      on(mobileMenu, 'click', (e) => {
        if (e.target.closest('a')) closeMenu();
      });
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isMenuOpen) closeMenu();
    });

    document.addEventListener('click', (e) => {
      if (
        isMenuOpen &&
        mobileMenu &&
        !mobileMenu.contains(e.target) &&
        toggle &&
        !toggle.contains(e.target)
      ) {
        closeMenu();
      }
    });

    document.addEventListener('click', handleAnchorClick);
    setActiveLink();
  }

  return { init, openMenu, closeMenu, toggleMenu };
})();


/* ============================================================
   2. INTERSECTION OBSERVER — REVEAL ANIMATIONS
   ============================================================ */

const RevealObserver = (() => {
  let observer = null;

  function init() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      $$('.reveal, .reveal-left, .reveal-right').forEach((el) => {
        el.classList.add('visible');
      });
      return;
    }

    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          const el = entry.target;
          const delay = el.dataset.delay ? parseFloat(el.dataset.delay) : 0;

          setTimeout(() => {
            el.classList.add('visible');
          }, delay);

          const staggerChildren = el.dataset.stagger;
          if (staggerChildren) {
            const children = $$(staggerChildren, el);
            children.forEach((child, index) => {
              const childDelay = delay + index * (parseInt(el.dataset.staggerDelay, 10) || 100);
              setTimeout(() => {
                child.classList.add('visible');
              }, childDelay);
            });
          }

          observer.unobserve(el);
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    $$('.reveal, .reveal-left, .reveal-right').forEach((el) => {
      observer.observe(el);
    });
  }

  function observe(el) {
    if (observer) observer.observe(el);
  }

  return { init, observe };
})();


/* ============================================================
   3. ACCORDION / FAQ
   ============================================================ */

const Accordion = (() => {
  function openItem(item) {
    const body = item.querySelector('.accordion-body');
    if (!body) return;

    item.classList.add('open');
    body.style.display = 'block';

    const height = body.scrollHeight;
    body.style.maxHeight = '0';
    body.style.overflow = 'hidden';
    body.style.transition = 'max-height 300ms cubic-bezier(0.4, 0, 0.2, 1)';

    body.offsetHeight; // eslint-disable-line no-unused-expressions
    body.style.maxHeight = height + 'px';

    const header = item.querySelector('.accordion-header');
    if (header) header.setAttribute('aria-expanded', 'true');

    body.addEventListener(
      'transitionend',
      () => {
        body.style.maxHeight = '';
        body.style.overflow = '';
        body.style.transition = '';
      },
      { once: true }
    );
  }

  function closeItem(item) {
    const body = item.querySelector('.accordion-body');
    if (!body) return;

    const height = body.scrollHeight;
    body.style.maxHeight = height + 'px';
    body.style.overflow = 'hidden';
    body.style.transition = 'max-height 300ms cubic-bezier(0.4, 0, 0.2, 1)';

    body.offsetHeight; // eslint-disable-line no-unused-expressions
    body.style.maxHeight = '0';

    const header = item.querySelector('.accordion-header');
    if (header) header.setAttribute('aria-expanded', 'false');

    body.addEventListener(
      'transitionend',
      () => {
        item.classList.remove('open');
        body.style.display = 'none';
        body.style.maxHeight = '';
        body.style.overflow = '';
        body.style.transition = '';
      },
      { once: true }
    );
  }

  function handleClick(e, accordion) {
    const header = e.target.closest('.accordion-header');
    if (!header) return;

    const item = header.closest('.accordion-item');
    if (!item) return;

    const isExclusive = accordion.dataset.exclusive !== undefined;
    const isOpen = item.classList.contains('open');

    if (isExclusive && !isOpen) {
      $$('.accordion-item.open', accordion).forEach((openItem) => {
        if (openItem !== item) closeItem(openItem);
      });
    }

    if (isOpen) {
      closeItem(item);
    } else {
      openItem(item);
    }
  }

  function init() {
    $$('.accordion').forEach((accordion) => {
      $$('.accordion-item', accordion).forEach((item) => {
        const header = item.querySelector('.accordion-header');
        const body = item.querySelector('.accordion-body');
        const isOpen = item.classList.contains('open');

        if (header) {
          header.setAttribute('aria-expanded', isOpen ? 'true' : 'false');

          if (body) {
            const bodyId = body.id || `accordion-body-${Math.random().toString(36).slice(2, 7)}`;
            body.id = bodyId;
            header.setAttribute('aria-controls', bodyId);
          }
        }

        if (!isOpen && body) {
          body.style.display = 'none';
        }
      });

      accordion.addEventListener('keydown', (e) => {
        const header = e.target.closest('.accordion-header');
        if (!header) return;

        const items = Array.from($$('.accordion-item', accordion));
        const headers = items.map((i) => i.querySelector('.accordion-header')).filter(Boolean);
        const currentIndex = headers.indexOf(header);

        if (e.key === 'ArrowDown') {
          e.preventDefault();
          const next = headers[(currentIndex + 1) % headers.length];
          if (next) next.focus();
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          const prev = headers[(currentIndex - 1 + headers.length) % headers.length];
          if (prev) prev.focus();
        } else if (e.key === 'Home') {
          e.preventDefault();
          if (headers[0]) headers[0].focus();
        } else if (e.key === 'End') {
          e.preventDefault();
          if (headers[headers.length - 1]) headers[headers.length - 1].focus();
        }
      });

      accordion.addEventListener('click', (e) => handleClick(e, accordion));
    });
  }

  return { init, openItem, closeItem };
})();


/* ============================================================
   4. TESTIMONIALS CAROUSEL
   ============================================================ */

const Carousel = (() => {
  function initCarousel(carousel) {
    const track = carousel.querySelector('.carousel-track');
    const slides = carousel.querySelectorAll('.carousel-slide');
    const prevBtn = carousel.querySelector('.carousel-btn-prev');
    const nextBtn = carousel.querySelector('.carousel-btn-next');
    const dotsContainer = carousel.querySelector('.carousel-dots');

    if (!track || slides.length === 0) return;

    let currentIndex = 0;
    let autoAdvanceTimer = null;
    let isHovered = false;
    let touchStartX = 0;
    let touchStartY = 0;
    let isDragging = false;

    const totalSlides = slides.length;
    const autoDelay = parseInt(carousel.dataset.delay, 10) || 5000;
    const isAutoplay = carousel.dataset.autoplay !== 'false';

    const dots = [];
    if (dotsContainer) {
      dotsContainer.innerHTML = '';
      slides.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.className = 'carousel-dot';
        dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
        dot.addEventListener('click', () => goTo(i));
        dotsContainer.appendChild(dot);
        dots.push(dot);
      });
    }

    function goTo(index) {
      let next = index;
      if (next < 0) next = totalSlides - 1;
      if (next >= totalSlides) next = 0;

      currentIndex = next;
      track.style.transform = `translateX(-${currentIndex * 100}%)`;

      dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === currentIndex);
        dot.setAttribute('aria-pressed', i === currentIndex ? 'true' : 'false');
      });

      slides.forEach((slide, i) => {
        slide.setAttribute('aria-hidden', i !== currentIndex ? 'true' : 'false');
      });

      if (prevBtn) prevBtn.disabled = false;
      if (nextBtn) nextBtn.disabled = false;
    }

    function goNext() { goTo(currentIndex + 1); }
    function goPrev() { goTo(currentIndex - 1); }

    function startAutoAdvance() {
      if (!isAutoplay) return;
      clearInterval(autoAdvanceTimer);
      autoAdvanceTimer = setInterval(() => {
        if (!isHovered) goNext();
      }, autoDelay);
    }

    function stopAutoAdvance() { clearInterval(autoAdvanceTimer); }

    if (nextBtn) nextBtn.addEventListener('click', () => { goNext(); startAutoAdvance(); });
    if (prevBtn) prevBtn.addEventListener('click', () => { goPrev(); startAutoAdvance(); });

    carousel.addEventListener('mouseenter', () => { isHovered = true; });
    carousel.addEventListener('mouseleave', () => { isHovered = false; });

    carousel.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].clientX;
      touchStartY = e.changedTouches[0].clientY;
      isDragging = false;
    }, { passive: true });

    carousel.addEventListener('touchmove', (e) => {
      const dx = Math.abs(e.changedTouches[0].clientX - touchStartX);
      const dy = Math.abs(e.changedTouches[0].clientY - touchStartY);
      if (dx > dy && dx > 8) { isDragging = true; }
    }, { passive: true });

    carousel.addEventListener('touchend', (e) => {
      if (!isDragging) return;
      const dx = e.changedTouches[0].clientX - touchStartX;
      const threshold = 50;
      if (dx < -threshold) { goNext(); }
      else if (dx > threshold) { goPrev(); }
      startAutoAdvance();
    }, { passive: true });

    carousel.setAttribute('tabindex', '0');
    carousel.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') { goPrev(); startAutoAdvance(); }
      if (e.key === 'ArrowRight') { goNext(); startAutoAdvance(); }
    });

    const visibilityObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) { startAutoAdvance(); }
          else { stopAutoAdvance(); }
        });
      },
      { threshold: 0.3 }
    );
    visibilityObserver.observe(carousel);

    goTo(0);
    startAutoAdvance();
  }

  function init() {
    $$('.carousel').forEach(initCarousel);
  }

  return { init, initCarousel };
})();


/* ============================================================
   5. TAB COMPONENTS
   ============================================================ */

const Tabs = (() => {
  function initTabGroup(tabContainer) {
    const buttons = Array.from($$('.tab-btn', tabContainer));
    const panels = Array.from($$('.tab-panel', tabContainer));

    if (!buttons.length || !panels.length) return;

    function activate(index) {
      buttons.forEach((btn, i) => {
        const isActive = i === index;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
        btn.setAttribute('tabindex', isActive ? '0' : '-1');
      });

      panels.forEach((panel, i) => {
        const isActive = i === index;
        panel.classList.toggle('active', isActive);
        panel.setAttribute('aria-hidden', isActive ? 'false' : 'true');
      });
    }

    buttons.forEach((btn, i) => {
      const panelId = panels[i]?.id || `tab-panel-${Math.random().toString(36).slice(2, 7)}`;
      const btnId = btn.id || `tab-btn-${Math.random().toString(36).slice(2, 7)}`;

      if (panels[i]) panels[i].id = panelId;
      btn.id = btnId;
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-controls', panelId);
      if (panels[i]) {
        panels[i].setAttribute('role', 'tabpanel');
        panels[i].setAttribute('aria-labelledby', btnId);
      }

      btn.addEventListener('click', () => activate(i));
    });

    const tabList = tabContainer.querySelector('.tab-list, .tab-list-pill');
    if (tabList) tabList.setAttribute('role', 'tablist');

    tabContainer.addEventListener('keydown', (e) => {
      const focused = document.activeElement;
      const idx = buttons.indexOf(focused);
      if (idx === -1) return;

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        const next = (idx + 1) % buttons.length;
        buttons[next].focus();
        activate(next);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const prev = (idx - 1 + buttons.length) % buttons.length;
        buttons[prev].focus();
        activate(prev);
      } else if (e.key === 'Home') {
        e.preventDefault();
        buttons[0].focus();
        activate(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        buttons[buttons.length - 1].focus();
        activate(buttons.length - 1);
      }
    });

    const preActiveIndex = buttons.findIndex((btn) => btn.classList.contains('active'));
    activate(preActiveIndex >= 0 ? preActiveIndex : 0);
  }

  function initFilterTabs(filterContainer) {
    const buttons = Array.from($$('.tab-btn', filterContainer));
    const targetSelector = filterContainer.dataset.filterTarget;
    if (!targetSelector) return;

    const allItems = Array.from($$(targetSelector));

    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        buttons.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');

        const filter = btn.dataset.filter || 'all';

        allItems.forEach((item) => {
          if (filter === 'all' || item.dataset.category === filter) {
            item.style.display = '';
            item.classList.add('animate-fade-in');
          } else {
            item.style.display = 'none';
          }
        });
      });
    });
  }

  function init() {
    $$('.tabs:not([data-filter])').forEach(initTabGroup);
    $$('.tabs[data-filter]').forEach(initFilterTabs);
  }

  return { init, initTabGroup, initFilterTabs };
})();


/* ============================================================
   6. COUNTER ANIMATION
   ============================================================ */

const CounterAnimation = (() => {
  function animateCounter(el) {
    const target = parseFloat(el.dataset.target);
    const duration = parseInt(el.dataset.duration, 10) || 2000;
    const suffix = el.dataset.suffix || '';
    const prefix = el.dataset.prefix || '';
    const decimals = el.dataset.decimals ? parseInt(el.dataset.decimals, 10) : 0;

    if (isNaN(target)) return;

    const start = performance.now();

    function easeOutCubic(t) {
      return 1 - Math.pow(1 - t, 3);
    }

    function step(timestamp) {
      const elapsed = timestamp - start;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutCubic(progress);
      const current = easedProgress * target;

      el.textContent = prefix + current.toFixed(decimals) + suffix;

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = prefix + target.toFixed(decimals) + suffix;
      }
    }

    requestAnimationFrame(step);
  }

  function init() {
    const counters = $$('[data-target]');
    if (!counters.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );

    counters.forEach((counter) => observer.observe(counter));
  }

  return { init, animateCounter };
})();


/* ============================================================
   7. FORM VALIDATION
   ============================================================ */

const FormValidation = (() => {
  const rules = {
    required: (value) => value.trim() !== '',
    email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()),
    phone: (value) => {
      const cleaned = value.replace(/[\s\-().+]/g, '');
      return /^(\+?63|0)9\d{9}$|^\+?[\d]{7,15}$/.test(cleaned);
    },
    minLength: (value, min) => value.trim().length >= parseInt(min, 10),
    maxLength: (value, max) => value.trim().length <= parseInt(max, 10),
    pattern: (value, pattern) => new RegExp(pattern).test(value.trim()),
  };

  const messages = {
    required: 'This field is required.',
    email: 'Please enter a valid email address.',
    phone: 'Please enter a valid phone number.',
    minLength: (min) => `Must be at least ${min} characters.`,
    maxLength: (max) => `Must not exceed ${max} characters.`,
    pattern: 'Please match the required format.',
  };

  function getErrorEl(field) {
    const formGroup = field.closest('.form-group');
    return formGroup ? formGroup.querySelector('.form-error') : null;
  }

  function showError(field, message) {
    field.classList.add('is-error');
    field.classList.remove('is-success');
    field.setAttribute('aria-invalid', 'true');

    const errorEl = getErrorEl(field);
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.classList.add('visible');
      const errorId = errorEl.id || `error-${Math.random().toString(36).slice(2, 7)}`;
      errorEl.id = errorId;
      field.setAttribute('aria-describedby', errorId);
    }
  }

  function clearError(field) {
    field.classList.remove('is-error');
    field.setAttribute('aria-invalid', 'false');

    const errorEl = getErrorEl(field);
    if (errorEl) {
      errorEl.textContent = '';
      errorEl.classList.remove('visible');
    }
  }

  function showSuccess(field) {
    field.classList.remove('is-error');
    field.classList.add('is-success');
    field.setAttribute('aria-invalid', 'false');
    clearError(field);
  }

  function validateField(field) {
    const value = field.value;
    const type = field.type;

    if (field.required || field.dataset.required) {
      if (!rules.required(value)) {
        showError(field, field.dataset.errorRequired || messages.required);
        return false;
      }
    }

    if (value.trim() === '') {
      clearError(field);
      return true;
    }

    if (type === 'email' || field.dataset.validate === 'email') {
      if (!rules.email(value)) {
        showError(field, field.dataset.errorEmail || messages.email);
        return false;
      }
    }

    if (type === 'tel' || field.dataset.validate === 'phone') {
      if (!rules.phone(value)) {
        showError(field, field.dataset.errorPhone || messages.phone);
        return false;
      }
    }

    if (field.dataset.minLength) {
      const min = field.dataset.minLength;
      if (!rules.minLength(value, min)) {
        showError(field, field.dataset.errorMinLength || messages.minLength(min));
        return false;
      }
    }

    if (field.dataset.maxLength) {
      const max = field.dataset.maxLength;
      if (!rules.maxLength(value, max)) {
        showError(field, field.dataset.errorMaxLength || messages.maxLength(max));
        return false;
      }
    }

    if (field.dataset.pattern) {
      if (!rules.pattern(value, field.dataset.pattern)) {
        showError(field, field.dataset.errorPattern || messages.pattern);
        return false;
      }
    }

    showSuccess(field);
    return true;
  }

  function validateForm(form) {
    const fields = Array.from($$('.form-control', form)).filter(
      (f) => f.type !== 'hidden' && !f.disabled
    );
    let isFormValid = true;
    let firstInvalidField = null;

    fields.forEach((field) => {
      const isValid = validateField(field);
      if (!isValid) {
        isFormValid = false;
        if (!firstInvalidField) firstInvalidField = field;
      }
    });

    if (firstInvalidField) firstInvalidField.focus();
    return isFormValid;
  }

  function init() {
    $$('form[data-validate]').forEach((form) => {
      $$('.form-control', form).forEach((field) => {
        field.addEventListener('blur', () => validateField(field));
        field.addEventListener('input', debounce(() => {
          if (field.classList.contains('is-error')) validateField(field);
        }, 300));
      });

      form.addEventListener('submit', (e) => {
        if (!validateForm(form)) {
          e.preventDefault();
        }
      });
    });
  }

  return { init, validateField, validateForm, showError, clearError, showSuccess };
})();


/* ============================================================
   8. TOAST / NOTIFICATION SYSTEM
   ============================================================ */

const Toast = (() => {
  let container = null;

  function getContainer() {
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      container.setAttribute('aria-live', 'polite');
      container.setAttribute('aria-atomic', 'false');
      document.body.appendChild(container);
    }
    return container;
  }

  function show(message, type = 'info', duration = 4000) {
    const icons = { success: '✓', error: '✕', warning: '!', info: 'i' };
    const c = getContainer();

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
      <span class="toast-icon">${icons[type] || icons.info}</span>
      <span class="toast-message">${message}</span>
      <button class="toast-close" aria-label="Close notification">&times;</button>
    `;

    c.appendChild(toast);
    toast.offsetHeight; // force reflow
    toast.classList.add('show');

    const close = () => {
      toast.classList.remove('show');
      toast.addEventListener('transitionend', () => toast.remove(), { once: true });
    };

    toast.querySelector('.toast-close').addEventListener('click', close);
    if (duration > 0) setTimeout(close, duration);

    return { close };
  }

  const success = (msg, duration) => show(msg, 'success', duration);
  const error   = (msg, duration) => show(msg, 'error', duration);
  const warning = (msg, duration) => show(msg, 'warning', duration);
  const info    = (msg, duration) => show(msg, 'info', duration);

  return { show, success, error, warning, info };
})();


/* ============================================================
   9. IMAGE LAZY LOADING
   ============================================================ */

const LazyImages = (() => {
  function init() {
    if (!('IntersectionObserver' in window)) {
      $$('img[data-src]').forEach((img) => {
        img.src = img.dataset.src;
        img.classList.add('loaded');
      });
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const img = entry.target;
          img.src = img.dataset.src;
          img.addEventListener('load', () => img.classList.add('loaded'), { once: true });
          observer.unobserve(img);
        });
      },
      { rootMargin: '200px 0px' }
    );

    $$('img[data-src]').forEach((img) => observer.observe(img));
  }

  return { init };
})();


/* ============================================================
   10. INITIALISER
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  Navigation.init();
  RevealObserver.init();
  Accordion.init();
  Carousel.init();
  Tabs.init();
  CounterAnimation.init();
  FormValidation.init();
  LazyImages.init();
});

// Expose modules for page-specific scripts
window.NoriAndPanko = {
  Navigation,
  RevealObserver,
  Accordion,
  Carousel,
  Tabs,
  CounterAnimation,
  FormValidation,
  Toast,
  LazyImages,
  $,
  $$,
};
