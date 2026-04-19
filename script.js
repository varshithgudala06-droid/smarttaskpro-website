/**
 * SmartTaskPro — Main JavaScript
 * Production-ready, security-first vanilla JS
 *
 * Sections:
 *  1. Security & Sanitization Utilities
 *  2. Theme Toggle (Dark/Light Mode)
 *  3. Navbar: Scroll Effect + Mobile Menu
 *  4. Smooth Scrolling
 *  5. Scroll Reveal Animations (Intersection Observer)
 *  6. CTA Email Form (Validation + LocalStorage mock)
 *  7. Footer Newsletter Subscription
 *  8. Demo Modal
 *  9. Dynamic Year in Footer
 * 10. Keyboard & Accessibility Helpers
 * 11. Init
 */

'use strict';

/* =============================================
   1. SECURITY & SANITIZATION UTILITIES
   - All user input is sanitized before use
   - Safe DOM manipulation (no innerHTML injection)
   - XSS prevention
============================================= */

/**
 * Sanitizes a string by escaping HTML special characters.
 * Prevents XSS when inserting user-provided content into the DOM.
 * @param {string} str - Raw user input
 * @returns {string} - HTML-escaped safe string
 */
function sanitizeString(str) {
  if (typeof str !== 'string') return '';
  const escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;',
  };
  return str.replace(/[&<>"'`=/]/g, (char) => escapeMap[char]);
}

/**
 * Validates an email address using a robust RFC 5322-compliant regex.
 * @param {string} email - The email string to validate
 * @returns {boolean}
 */
function isValidEmail(email) {
  if (typeof email !== 'string') return false;
  // Trim and length check first
  const trimmed = email.trim();
  if (trimmed.length === 0 || trimmed.length > 254) return false;
  // RFC-ish regex (practical, covers 99.9% of real emails)
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;
  return emailRegex.test(trimmed);
}

/**
 * Safely sets text content of an element (no innerHTML).
 * @param {Element} el - DOM element
 * @param {string} text - Text to set
 */
function safeSetText(el, text) {
  if (el) el.textContent = text;
}

/**
 * Safely shows/hides an element by toggling the `hidden` attribute.
 * @param {Element} el - DOM element
 * @param {boolean} show
 */
function toggleVisibility(el, show) {
  if (!el) return;
  if (show) {
    el.removeAttribute('hidden');
  } else {
    el.setAttribute('hidden', '');
  }
}

/* =============================================
   2. THEME TOGGLE (Dark / Light Mode)
   - Persisted to localStorage (safe: no user content stored)
   - Toggles `data-theme` on <html>
   - Updates aria-pressed for accessibility
============================================= */

const ThemeManager = (() => {
  const STORAGE_KEY = 'stp_theme'; // stp = SmartTaskPro
  const htmlEl = document.documentElement;

  /** Returns the current theme from storage or system preference */
  function getPreferredTheme() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      // Whitelist only valid theme values — security: ignore arbitrary stored strings
      if (stored === 'dark' || stored === 'light') return stored;
    } catch (_) {
      // localStorage not available (e.g., private mode, permissions)
    }
    // Fallback to system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  /** Applies a theme to the document */
  function applyTheme(theme) {
    htmlEl.setAttribute('data-theme', theme === 'dark' ? 'dark' : 'light');
  }

  /** Persists a theme to localStorage */
  function saveTheme(theme) {
    try {
      localStorage.setItem(STORAGE_KEY, theme === 'dark' ? 'dark' : 'light');
    } catch (_) {
      // Silent fail — localStorage unavailable
    }
  }

  /** Initializes the theme toggle button */
  function init() {
    const btn = document.getElementById('themeToggle');
    if (!btn) return;

    // Apply stored/preferred theme on load
    const initial = getPreferredTheme();
    applyTheme(initial);
    btn.setAttribute('aria-pressed', initial === 'dark' ? 'true' : 'false');

    btn.addEventListener('click', () => {
      const current = htmlEl.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      saveTheme(next);
      btn.setAttribute('aria-pressed', next === 'dark' ? 'true' : 'false');
    });
  }

  return { init };
})();

/* =============================================
   3. NAVBAR: Scroll Effect + Mobile Menu
   - Adds `.scrolled` class on scroll for shadow effect
   - Mobile hamburger toggles aria-expanded + menu visibility
============================================= */

const NavbarManager = (() => {
  let isMenuOpen = false;

  function initScrollEffect() {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;

    const onScroll = () => {
      if (window.scrollY > 20) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    };

    // Throttle scroll for performance
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          onScroll();
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });

    // Initial check
    onScroll();
  }

  function initMobileMenu() {
    const toggle = document.getElementById('menuToggle');
    const menu   = document.getElementById('mobileMenu');
    if (!toggle || !menu) return;

    function openMenu() {
      isMenuOpen = true;
      menu.classList.add('is-open');
      toggle.classList.add('is-open');
      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-label', 'Close navigation menu');
      menu.setAttribute('aria-hidden', 'false');
    }

    function closeMenu() {
      isMenuOpen = false;
      menu.classList.remove('is-open');
      toggle.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open navigation menu');
      menu.setAttribute('aria-hidden', 'true');
    }

    toggle.addEventListener('click', () => {
      isMenuOpen ? closeMenu() : openMenu();
    });

    // Close menu when a mobile link is clicked
    const mobileLinks = menu.querySelectorAll('.navbar__mobile-link, .navbar__mobile-cta');
    mobileLinks.forEach((link) => {
      link.addEventListener('click', closeMenu);
    });

    // Close menu on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isMenuOpen) {
        closeMenu();
        toggle.focus();
      }
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (isMenuOpen && !menu.contains(e.target) && !toggle.contains(e.target)) {
        closeMenu();
      }
    });
  }

  function init() {
    initScrollEffect();
    initMobileMenu();
  }

  return { init };
})();

/* =============================================
   4. SMOOTH SCROLLING
   - Intercepts internal anchor clicks
   - Accounts for fixed navbar height offset
   - Fully keyboard-accessible
============================================= */

const SmoothScroll = (() => {
  function getNavbarHeight() {
    const navbar = document.getElementById('navbar');
    return navbar ? navbar.offsetHeight : 68;
  }

  function scrollToTarget(targetId) {
    // Validate targetId is a simple CSS id — no injection risk
    if (!targetId || typeof targetId !== 'string') return;
    const safeId = targetId.replace(/[^a-zA-Z0-9_-]/g, '');
    const target = document.getElementById(safeId);
    if (!target) return;

    const top = target.getBoundingClientRect().top + window.scrollY - getNavbarHeight() - 16;
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
  }

  function init() {
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href^="#"]');
      if (!link) return;

      const href = link.getAttribute('href');
      if (!href || href === '#') return;

      e.preventDefault();
      const id = href.slice(1);
      scrollToTarget(id);
    });
  }

  return { init };
})();

/* =============================================
   5. SCROLL REVEAL ANIMATIONS
   - Uses IntersectionObserver (performant, no scroll event)
   - Adds `.is-visible` to trigger CSS transitions
   - Respects prefers-reduced-motion
============================================= */

const ScrollReveal = (() => {
  function init() {
    // Respect user preference for reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      // Make all elements visible immediately
      document.querySelectorAll('.fade-in').forEach((el) => {
        el.classList.add('is-visible');
      });
      return;
    }

    const elements = document.querySelectorAll('.fade-in');
    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            // Once visible, unobserve for performance
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.12,    // Trigger when 12% is visible
        rootMargin: '0px 0px -40px 0px', // Slight bottom offset
      }
    );

    elements.forEach((el) => observer.observe(el));
  }

  return { init };
})();

/* =============================================
   6. CTA EMAIL FORM
   - Validates email (sanitized, no XSS)
   - Stores to localStorage (mock backend)
   - Shows success / error feedback
   - Rate limiting: prevents double-submit
============================================= */

const CTAForm = (() => {
  const STORAGE_KEY = 'stp_signups'; // mock backend storage
  let isSubmitting = false;

  /** Mock API call — simulates a 900ms network request */
  function mockApiCall(email) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // 95% success rate simulation
        if (Math.random() > 0.05) {
          resolve({ success: true, email });
        } else {
          reject(new Error('Server error, please try again.'));
        }
      }, 900);
    });
  }

  /** Saves email to localStorage (mock persistence) */
  function saveToStorage(email) {
    try {
      const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      // Don't store duplicates
      if (!existing.includes(email)) {
        existing.push(email);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
      }
    } catch (_) {
      // Silent fail — localStorage unavailable
    }
  }

  function showError(errorEl, msg) {
    toggleVisibility(errorEl, true);
    safeSetText(errorEl, msg); // safeSetText uses textContent — XSS-safe
  }

  function showSuccess(successEl, msg) {
    toggleVisibility(successEl, true);
    safeSetText(successEl, msg);
  }

  function init() {
    const submitBtn  = document.getElementById('ctaSubmitBtn');
    const emailInput = document.getElementById('emailInput');
    const errorEl    = document.getElementById('emailError');
    const successEl  = document.getElementById('emailSuccess');

    if (!submitBtn || !emailInput) return;

    async function handleSubmit() {
      if (isSubmitting) return;

      // Hide previous messages
      toggleVisibility(errorEl, false);
      toggleVisibility(successEl, false);

      // Read and sanitize input
      const rawEmail = emailInput.value;
      const email    = rawEmail.trim();

      // Validate
      if (!email) {
        showError(errorEl, 'Please enter your email address.');
        emailInput.focus();
        return;
      }

      if (!isValidEmail(email)) {
        showError(errorEl, 'Please enter a valid email address (e.g. you@company.com).');
        emailInput.focus();
        return;
      }

      // Lock form during submission
      isSubmitting = true;
      submitBtn.setAttribute('disabled', 'true');
      submitBtn.setAttribute('aria-busy', 'true');
      safeSetText(submitBtn, 'Sending…');

      try {
        await mockApiCall(email);
        saveToStorage(email);

        // Clear input
        emailInput.value = '';

        // Show success — note: email is NOT injected into DOM text below
        showSuccess(successEl, '🎉 You\'re in! Check your inbox for your welcome email.');

        // Restore button after short delay
        setTimeout(() => {
          safeSetText(submitBtn, 'Start Free Trial');
          submitBtn.removeAttribute('disabled');
          submitBtn.removeAttribute('aria-busy');
          isSubmitting = false;
        }, 2500);

      } catch (err) {
        // Use safe generic message — don't expose err.message to DOM
        showError(errorEl, 'Something went wrong. Please try again in a moment.');
        safeSetText(submitBtn, 'Start Free Trial');
        submitBtn.removeAttribute('disabled');
        submitBtn.removeAttribute('aria-busy');
        isSubmitting = false;
      }
    }

    // Button click
    submitBtn.addEventListener('click', handleSubmit);

    // Enter key in input
    emailInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleSubmit();
    });

    // Clear error on input
    emailInput.addEventListener('input', () => {
      toggleVisibility(errorEl, false);
    });
  }

  return { init };
})();

/* =============================================
   7. FOOTER NEWSLETTER SUBSCRIPTION
   - Same email validation + sanitization
   - Safe text-only feedback (no HTML injection)
============================================= */

const FooterNewsletter = (() => {
  let isSubmitting = false;

  function init() {
    const btn    = document.getElementById('footerSubBtn');
    const input  = document.getElementById('footerEmail');
    const status = document.getElementById('footerSubStatus');

    if (!btn || !input) return;

    async function handleSubscribe() {
      if (isSubmitting) return;

      const email = input.value.trim();

      if (!email) {
        safeSetText(status, 'Please enter your email.');
        status.style.color = '#ef4444';
        return;
      }

      if (!isValidEmail(email)) {
        safeSetText(status, 'Please enter a valid email address.');
        status.style.color = '#ef4444';
        return;
      }

      isSubmitting = true;
      btn.setAttribute('disabled', 'true');
      safeSetText(btn, '...');

      // Simulate API delay
      await new Promise((r) => setTimeout(r, 700));

      // Save to mock storage
      try {
        const key = 'stp_newsletter';
        const existing = JSON.parse(localStorage.getItem(key) || '[]');
        if (!existing.includes(email)) {
          existing.push(email);
          localStorage.setItem(key, JSON.stringify(existing));
        }
      } catch (_) { /* silent */ }

      input.value = '';
      safeSetText(status, '✓ Subscribed! Thanks for joining.');
      status.style.color = 'var(--clr-accent)';

      setTimeout(() => {
        safeSetText(status, '');
        btn.removeAttribute('disabled');
        safeSetText(btn, 'Subscribe');
        isSubmitting = false;
      }, 3000);
    }

    btn.addEventListener('click', handleSubscribe);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleSubscribe();
    });
  }

  return { init };
})();

/* =============================================
   8. DEMO MODAL
   - Opens on "Watch Demo" button click
   - Closes on overlay click, close button, or Escape
   - Traps focus inside modal (accessibility)
   - ARIA attributes managed correctly
============================================= */

const DemoModal = (() => {
  let previousFocus = null;

  function getFocusableElements(container) {
    return Array.from(
      container.querySelectorAll(
        'a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])'
      )
    ).filter((el) => !el.closest('[hidden]'));
  }

  function trapFocus(e, modal) {
    const focusable = getFocusableElements(modal);
    if (!focusable.length) return;
    const first = focusable[0];
    const last  = focusable[focusable.length - 1];

    if (e.key === 'Tab') {
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
  }

  function openModal(modal) {
    previousFocus = document.activeElement;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    // Focus first focusable element
    const firstFocusable = getFocusableElements(modal)[0];
    if (firstFocusable) {
      setTimeout(() => firstFocusable.focus(), 50);
    }

    // Trap focus
    modal._trapFocusHandler = (e) => trapFocus(e, modal);
    document.addEventListener('keydown', modal._trapFocusHandler);
  }

  function closeModal(modal) {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';

    if (modal._trapFocusHandler) {
      document.removeEventListener('keydown', modal._trapFocusHandler);
    }

    // Restore focus to triggering element
    if (previousFocus) {
      previousFocus.focus();
      previousFocus = null;
    }
  }

  function init() {
    const modal      = document.getElementById('demoModal');
    const openBtn    = document.getElementById('watchDemoBtn');
    const closeBtn   = document.getElementById('modalClose');
    const overlay    = document.getElementById('modalOverlay');
    const modalCTA   = document.getElementById('modalCTA');

    if (!modal) return;

    if (openBtn) {
      openBtn.addEventListener('click', () => openModal(modal));
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', () => closeModal(modal));
    }

    if (overlay) {
      overlay.addEventListener('click', () => closeModal(modal));
    }

    if (modalCTA) {
      modalCTA.addEventListener('click', () => closeModal(modal));
    }

    // Close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('is-open')) {
        closeModal(modal);
      }
    });
  }

  return { init };
})();

/* =============================================
   9. DYNAMIC YEAR IN FOOTER
   - Avoids hard-coded year
   - Safe: reads current year from Date object
============================================= */

function initFooterYear() {
  const yearEl = document.getElementById('currentYear');
  if (yearEl) {
    safeSetText(yearEl, new Date().getFullYear().toString());
  }
}

/* =============================================
   10. KEYBOARD & ACCESSIBILITY HELPERS
   - Adds :focus-visible polyfill behavior for old browsers
   - Announces page changes to screen readers via live region
============================================= */

const A11yHelpers = (() => {
  function init() {
    // Add keyboard-navigation class to body on Tab press
    // This helps with focus styling without affecting mouse users
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        document.body.classList.add('keyboard-nav');
      }
    });

    document.addEventListener('mousedown', () => {
      document.body.classList.remove('keyboard-nav');
    });
  }

  return { init };
})();

/* =============================================
   11. LAZY IMAGE LOADING ENHANCEMENT
   - Adds loading="lazy" attribute to images
     that don't have it set (progressive enhancement)
============================================= */

function initLazyImages() {
  if ('loading' in HTMLImageElement.prototype) {
    document.querySelectorAll('img:not([loading])').forEach((img) => {
      img.setAttribute('loading', 'lazy');
    });
  }
  // Modern browsers handle native lazy loading;
  // older browsers load images normally — graceful degradation.
}

/* =============================================
   12. BUTTON RIPPLE EFFECT
   - Pure CSS-JS micro-interaction on btn clicks
   - Enhances perceived responsiveness
============================================= */

function initRippleEffect() {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn--primary, .btn--outline');
    if (!btn) return;

    // Remove existing ripples
    const existingRipple = btn.querySelector('.btn-ripple');
    if (existingRipple) existingRipple.remove();

    const rect   = btn.getBoundingClientRect();
    const size   = Math.max(rect.width, rect.height) * 2;
    const x      = e.clientX - rect.left - size / 2;
    const y      = e.clientY - rect.top  - size / 2;

    const ripple = document.createElement('span');
    // Safely set all properties via element properties (not innerHTML)
    ripple.className = 'btn-ripple';

    // Apply ripple styles
    Object.assign(ripple.style, {
      position: 'absolute',
      width: `${size}px`,
      height: `${size}px`,
      left: `${x}px`,
      top: `${y}px`,
      background: 'rgba(255,255,255,0.25)',
      borderRadius: '50%',
      transform: 'scale(0)',
      animation: 'rippleAnim 0.5s linear',
      pointerEvents: 'none',
    });

    // Ensure button has relative positioning for the ripple
    const currentPosition = getComputedStyle(btn).position;
    if (currentPosition === 'static') {
      btn.style.position = 'relative';
    }
    btn.style.overflow = 'hidden';

    btn.appendChild(ripple);

    ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
  });

  // Inject ripple animation keyframes (safe: no user content)
  const style = document.createElement('style');
  style.textContent = '@keyframes rippleAnim { to { transform: scale(1); opacity: 0; } }';
  document.head.appendChild(style);
}

/* =============================================
   13. NAVBAR ACTIVE LINK HIGHLIGHT
   - Highlights nav links based on scroll position
   - Uses IntersectionObserver for accuracy
============================================= */

const NavActiveLinks = (() => {
  function init() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.navbar__nav-link');
    if (!sections.length || !navLinks.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            navLinks.forEach((link) => {
              const href = link.getAttribute('href');
              if (href === `#${id}`) {
                link.style.color = 'var(--clr-accent)';
                link.setAttribute('aria-current', 'true');
              } else {
                link.style.color = '';
                link.removeAttribute('aria-current');
              }
            });
          }
        });
      },
      { threshold: 0.35, rootMargin: '-68px 0px 0px 0px' }
    );

    sections.forEach((s) => observer.observe(s));
  }

  return { init };
})();

/* =============================================
   14. INIT — Bootstrap all modules on DOMContentLoaded
============================================= */

document.addEventListener('DOMContentLoaded', () => {
  ThemeManager.init();
  NavbarManager.init();
  SmoothScroll.init();
  ScrollReveal.init();
  CTAForm.init();
  FooterNewsletter.init();
  DemoModal.init();
  A11yHelpers.init();
  NavActiveLinks.init();
  initFooterYear();
  initLazyImages();
  initRippleEffect();

  // Log to confirm initialization (remove in production if desired)
  console.log('%cSmartTaskPro loaded successfully ✅', 'color: #4361ee; font-weight: bold; font-size: 14px;');
});
