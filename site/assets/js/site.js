/* NegoAsia — shared behaviour. Progressive enhancement only:
   every page remains fully readable and usable with JS disabled. */
(function () {
  'use strict';

  /* ---------------------------------------------------------------
     CONFIG — the only thing to change when analytics goes live.
     Replace with the real GA4 measurement ID, e.g. "G-4B7XKQ2P1D".
     Leave empty and no analytics is loaded at all.
     --------------------------------------------------------------- */
  var GA4_ID = '';                       // TODO: paste the GA4 measurement ID here
  var CONSENT_KEY = 'negoasia-consent';  // "granted" | "denied"

  /* Header compacts on scroll */
  var hdr = document.getElementById('hdr');
  if (hdr) {
    var onScroll = function () { hdr.classList.toggle('scrolled', window.scrollY > 40); };
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* Mobile menu */
  var burger = document.getElementById('burger');
  var menu = document.querySelector('.menu');
  if (burger && menu) {
    burger.addEventListener('click', function () {
      var open = menu.style.display === 'flex';
      menu.style.display = open ? '' : 'flex';
      burger.setAttribute('aria-expanded', String(!open));
      if (!open) {
        Object.assign(menu.style, {
          position: 'absolute', top: '100%', right: '34px', flexDirection: 'column',
          background: 'var(--ivory)', padding: '18px 22px', borderRadius: '2px',
          gap: '1rem', boxShadow: '0 12px 30px rgba(29,38,54,.14)'
        });
      }
    });
  }

  /* Reveal on scroll */
  var revealables = document.querySelectorAll('.reveal');
  if (revealables.length) {
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
        });
      }, { threshold: .12 });
      revealables.forEach(function (el) { io.observe(el); });
    } else {
      revealables.forEach(function (el) { el.classList.add('in'); });
    }
  }

  /* Blog category filters (static, client-side) */
  var filters = document.querySelector('.filters');
  if (filters) {
    var cards = Array.prototype.slice.call(document.querySelectorAll('.posts .post'));
    var empty = document.querySelector('.empty');
    filters.addEventListener('click', function (e) {
      var btn = e.target.closest('button[data-filter]');
      if (!btn) return;
      var want = btn.getAttribute('data-filter');
      filters.querySelectorAll('button').forEach(function (b) {
        b.setAttribute('aria-pressed', String(b === btn));
      });
      var shown = 0;
      cards.forEach(function (c) {
        var match = want === 'all' || (c.getAttribute('data-tag') || '') === want;
        c.style.display = match ? '' : 'none';
        if (match) shown++;
      });
      if (empty) empty.hidden = shown > 0;
    });
  }

  /* Current year in footers */
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });


  /* ===============================================================
     COOKIE CONSENT + ANALYTICS
     Nothing is loaded and no cookie is written until the visitor
     accepts. Declining is one click, symmetrical with accepting —
     required by the Thai PDPA and by the GDPR.
     =============================================================== */

  function read() {
    try { return localStorage.getItem(CONSENT_KEY); } catch (e) { return null; }
  }
  function write(v) {
    try { localStorage.setItem(CONSENT_KEY, v); } catch (e) {}
  }

  function loadAnalytics() {
    if (!GA4_ID || window.__negoGA) return;
    window.__negoGA = true;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA4_ID;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA4_ID, { anonymize_ip: true });
  }

  /* Conversion event on the audit form — fires only if analytics is on. */
  document.querySelectorAll('form[name="audit"]').forEach(function (f) {
    f.addEventListener('submit', function () {
      if (window.gtag) {
        window.gtag('event', 'generate_lead', {
          form_name: 'audit',
          page_location: location.pathname
        });
      }
    });
  });

  var banner = null;

  function buildBanner() {
    if (banner) return banner;
    banner = document.createElement('aside');
    banner.className = 'cc';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Cookie preferences');
    banner.innerHTML =
      '<div class="cc-inner">' +
        '<p><b>We use one optional cookie.</b> It tells us which pages are read, nothing more — ' +
        'no advertising, no profiling, no data sold. The site works exactly the same if you decline. ' +
        'Details in our <a href="/privacy/">Privacy Policy</a>.</p>' +
        '<div class="cc-actions">' +
          '<button type="button" class="btn btn-outline-dark" data-cc="denied">Decline</button>' +
          '<button type="button" class="btn btn-primary" data-cc="granted">Accept</button>' +
        '</div>' +
      '</div>';
    banner.addEventListener('click', function (e) {
      var b = e.target.closest('[data-cc]');
      if (!b) return;
      var choice = b.getAttribute('data-cc');
      write(choice);
      if (choice === 'granted') loadAnalytics();
      hideBanner();
    });
    document.body.appendChild(banner);
    return banner;
  }

  function showBanner() {
    var el = buildBanner();
    requestAnimationFrame(function () { el.classList.add('in'); });
  }
  function hideBanner() {
    if (banner) banner.classList.remove('in');
  }

  /* Footer link so the choice can always be changed — injected, not duplicated. */
  var footBottom = document.querySelector('.foot-bottom');
  if (footBottom) {
    var wrapSpan = footBottom.lastElementChild;
    var link = document.createElement('button');
    link.type = 'button';
    link.className = 'cc-link';
    link.textContent = 'Cookie settings';
    link.addEventListener('click', function () { showBanner(); });
    if (wrapSpan) {
      wrapSpan.appendChild(document.createTextNode(' · '));
      wrapSpan.appendChild(link);
    }
  }

  var stored = read();
  if (stored === 'granted') {
    loadAnalytics();
  } else if (stored !== 'denied') {
    /* Give the page a moment to settle before interrupting the reader. */
    setTimeout(showBanner, 1200);
  }
})();
