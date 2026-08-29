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

  /* La bannière est fixée en bas ; sur mobile elle occupe un quart de l'écran.
     On publie sa hauteur pour que le bouton de retours se pose AU-DESSUS
     plutôt que par-dessus le bouton « Accept » — c'est ce qui le rendait
     invisible sur téléphone : or sur or, superposé. */
  function ccHeight() {
    var h = (banner && banner.classList.contains('in')) ? banner.offsetHeight : 0;
    document.documentElement.style.setProperty('--cc-h', h ? h + 'px' : '0px');
  }

  function showBanner() {
    var el = buildBanner();
    requestAnimationFrame(function () { el.classList.add('in'); ccHeight(); });
  }
  function hideBanner() {
    if (banner) banner.classList.remove('in');
    ccHeight();
  }
  addEventListener('resize', ccHeight);

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



  /* ===============================================================
     REVIEW WIDGET — preview only
     Nicolas reads the site on his phone and sends remarks by
     WhatsApp. The one thing those messages always lack is *which
     page*, which turns every remark into a guessing game. This
     button lives on the page itself, so the URL is captured for
     free. It renders only on the Netlify preview domain and can
     therefore never appear on negoasia.com.
     Its form is declared statically in /forms.html — Netlify needs
     to see it at build time to accept the submissions.
     =============================================================== */
  (function reviewWidget() {
    if (!/\.netlify\.app$/.test(location.hostname)) return;
    if (location.pathname.indexOf('/admin') === 0) return;

    /* Retour au point exact depuis le rapport de retours (25/08).
       Le widget capture déjà un sélecteur CSS pour chaque remarque ; on peut
       donc refaire le chemin dans l'autre sens : ?rv=<sélecteur> amène la page
       sur l'élément visé et le cerne du même liseré doré que le survol. Le
       paramètre est retiré de la barre d'adresse aussitôt, pour qu'un lien
       partagé ensuite ne traîne pas un surlignage derrière lui. */
    (function spotlight() {
      var m = /[?&]rv=([^&]+)/.exec(location.search);
      if (!m) return;
      var sel;
      try { sel = decodeURIComponent(m[1]); } catch (e) { return; }

      /* Le navigateur restaure sa position au chargement, et cette restauration
         arrive APRÈS notre défilement : c'est ce qui ramenait la page en haut.
         On la suspend, puis on la rétablit — le réglage survit à la page qui l'a
         posé, donc le laisser sur `manual` casserait le retour arrière pour tout
         le reste de l'onglet. */
      var restore = null;
      try {
        if ('scrollRestoration' in history) {
          restore = history.scrollRestoration;
          history.scrollRestoration = 'manual';
        }
      } catch (e) {}

      var el = null, marked = false, userMoved = false;

      /* On écoute les gestes, pas l'événement `scroll` : nos propres sauts
         déclenchent `scroll` et on s'arrêterait nous-mêmes au premier passage.
         Un geste du lecteur, lui, met fin au recalage — sans quoi il serait
         ramené au centre jusqu'à quatre fois pendant qu'il essaie de lire
         autour, et par sauts secs, donc bien plus violemment qu'un glissement. */
      ['wheel', 'touchstart', 'keydown', 'mousedown'].forEach(function (t) {
        addEventListener(t, function () { userMoved = true; }, { passive: true, once: true });
      });

      function aim() {
        if (userMoved && marked) return true;
        try { el = el || document.querySelector(sel); } catch (e) { return false; }
        if (!el) return false;
        /* Les blocs n'apparaissent qu'au défilement : on force celui qui nous
           intéresse et ses parents à être visibles, sinon on viserait un
           élément encore transparent. */
        var p = el;
        while (p && p !== document.body) { p.classList.add('in'); p = p.parentElement; }
        /* `instant` et non `auto` : `auto` s'en remet au `scroll-behavior:smooth`
           posé sur `html` par la feuille de style, et une animation de
           défilement s'annule au moindre incident pendant le chargement — c'est
           ainsi qu'on se retrouvait à 40 px du haut. `instant` force le saut
           sec, qui ne s'annule pas. */
        el.scrollIntoView({ block: 'center', behavior: 'instant' });
        if (!marked) {
          marked = true;
          el.classList.add('rv-hi');
          setTimeout(function () { el.classList.remove('rv-hi'); }, 6000);
          try { history.replaceState(null, '', location.pathname + location.hash); } catch (e) {}
        }
        return true;
      }

      /* On revise plusieurs fois : les polices et les images arrivent après coup
         et décalent la page de quelques dizaines de pixels, et le chargement
         peut reprendre la main entre-temps. Le dernier passage rend la
         restauration au navigateur. */
      var when = [0, 250, 700, 1400, 2400];
      when.forEach(function (d, k) {
        setTimeout(function () {
          aim();
          if (k === when.length - 1) {
            try { if (restore !== null) history.scrollRestoration = restore; } catch (e) {}
          }
        }, d);
      });
    })();

    /* Élements sur lesquels Nicolas peut pointer. On vise le bloc de sens le
       plus fin — un paragraphe, un titre, une puce, une carte — pour qu'il
       n'ait plus à décrire où il regarde. */
    var SEL = 'main h1, main h2, main h3, main p, main li, main blockquote,' +
              'main .stat, main .svc, main .card, main .quote, main .step,' +
              'main .it, main .post, main .photo, main img, main dd, main summary';

    var open = false, panel = null, target = null, hover = null, picking = false;
    var editing = null, retargeting = null;

    /* Un doigt ne survole pas. Sur téléphone, désigner un élément demande donc
       un mode explicite : on tape le bouton, puis on tape l'endroit visé. */
    var TOUCH = !matchMedia('(hover: hover) and (pointer: fine)').matches;

    var ICON =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'rv-btn';
    btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML = ICON + 'A remark';
    /* Le bouton ouvre le mode « désigner », souris comprise. Le retour sur la
       page entière reste accessible depuis le bandeau. */
    btn.addEventListener('click', function () { setPick(!picking); });
    document.body.appendChild(btn);

    /* Bandeau du mode « désigner ». Il vaut aussi pour la souris : viser une
       pastille de 26 px était une épreuve d'adresse, et le liseré s'éteignait
       en route. Ici, un clic n'importe où dans l'élément suffit. */
    var bar = null;
    function buildBar() {
      if (bar) return bar;
      bar = document.createElement('div');
      bar.className = 'rv-bar';
      bar.innerHTML =
        '<span>' + (TOUCH ? 'Tap' : 'Click') + ' anywhere on the part you want to comment on.</span>' +
        '<button type="button" data-rv="page">The whole page</button>' +
        '<button type="button" data-rv="cancel">Cancel</button>';
      bar.addEventListener('click', function (e) {
        var b = e.target.closest('[data-rv]');
        if (!b) return;
        e.preventDefault();
        e.stopPropagation();
        var what = b.getAttribute('data-rv');
        setPick(false);
        if (what === 'page') openPanel(null);
      });
      document.body.appendChild(bar);
      return bar;
    }

    function setPick(on) {
      picking = on;
      buildBar().classList.toggle('in', on);
      document.body.classList.toggle('rv-picking', on);
      btn.classList.toggle('picking', on);
      btn.innerHTML = ICON + (on ? 'Cancel' : 'A remark');
      /* En mode désigner la pastille n'a plus d'objet : tout l'élément est
         cliquable. La laisser afficherait une cible là où il n'y en a plus. */
      mark.classList.remove('in');
      if (!on) clearHover();
    }

    /* Capture : on intercepte le tap AVANT que le lien ne navigue. */
    document.addEventListener('click', function (e) {
      if (!picking) return;
      if (e.target.closest('.rv-bar, .rv-btn, .rv-panel')) return;
      e.preventDefault();
      e.stopPropagation();
      var el = null;
      if (!e.target.closest('header, footer, .cc')) {
        /* Le fond d'une section ne correspond à aucun sélecteur fin : on
           retombe alors sur la section elle-même, jamais sur rien. */
        el = e.target.closest(SEL) || e.target.closest('main section, main article');
      }
      setPick(false);
      /* Reciblage : le clic ne cree pas une remarque, il deplace celle qu'on
         est en train de reviser sur un autre element. */
      if (retargeting) {
        var rec = retargeting; retargeting = null;
        openPanel(el, rec);
        return;
      }
      openPanel(el);
    }, true);

    /* Retour visuel immédiat au doigt posé, avant même que le panneau s'ouvre. */
    document.addEventListener('touchstart', function (e) {
      if (!picking) return;
      if (e.target.closest('.rv-bar, .rv-btn, .rv-panel, header, footer, .cc')) return;
      var el = e.target.closest(SEL) || e.target.closest('main section, main article');
      if (!el || el === hover) return;
      if (hover) hover.classList.remove('rv-hi');
      hover = el;
      el.classList.add('rv-hi');
    }, { passive: true, capture: true });

    /* Pastille flottante, une seule, repositionnée au survol. */
    var mark = document.createElement('button');
    mark.type = 'button';
    mark.className = 'rv-mark';
    mark.title = 'A remark on this element';
    mark.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" ' +
      'stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 ' +
      '2-2h14a2 2 0 0 1 2 2z"/></svg>';
    mark.addEventListener('click', function (e) {
      e.stopPropagation();
      openPanel(hover);
    });
    if (!TOUCH) document.body.appendChild(mark);

    function clearHover() {
      cancelClear();
      if (hover) hover.classList.remove('rv-hi');
      hover = null;
      mark.classList.remove('in');
    }

    /* Sursis avant extinction. Pour atteindre la pastille, la souris doit
       forcément quitter l'élément ; sans ce délai, le liseré et la pastille
       s'éteignent dans l'intervalle et la cible se dérobe. */
    var clearT = null;
    function scheduleClear() {
      if (clearT) return;
      clearT = setTimeout(function () { clearT = null; clearHover(); }, 320);
    }
    function cancelClear() {
      if (clearT) { clearTimeout(clearT); clearT = null; }
    }

    document.addEventListener('mouseover', function (e) {
      /* Safari mobile émule un mouseover au tap : sans ce garde-fou, un liseré
         et une pastille apparaissent au hasard sous le doigt. */
      if (TOUCH || open) return;
      /* La pastille et le panneau font partie du geste : y entrer ne doit pas
         éteindre le liseré. */
      if (e.target.closest('.rv-panel, .rv-btn, .rv-mark, .rv-bar')) { cancelClear(); return; }
      if (e.target.closest('header, footer, .cc')) { scheduleClear(); return; }
      var el = e.target.closest(SEL);
      if (!el) { scheduleClear(); return; }
      cancelClear();
      if (el === hover) return;
      if (hover) hover.classList.remove('rv-hi');
      hover = el;
      el.classList.add('rv-hi');
      if (picking) { mark.classList.remove('in'); return; }
      /* La pastille chevauche le coin de l'élément au lieu de flotter à 34 px
         à sa gauche : plus d'espace mort à franchir pour l'atteindre. */
      var r = el.getBoundingClientRect();
      mark.style.top = Math.max(scrollY + 4, r.top + scrollY - 13) + 'px';
      mark.style.left = Math.max(4, r.left + scrollX - 13) + 'px';
      mark.classList.add('in');
    });
    /* Pas d'extinction au défilement. La pastille est positionnée en
       coordonnées de document : elle reste collée à son élément quand la page
       bouge. L'éteindre ici faisait disparaître la cible au moindre coup de
       molette pendant qu'on visait — c'est ce que Bruno a signalé le 04/08. */

    /* Chemin CSS court, pour retrouver l'élément exact plus tard. */
    function path(el) {
      var out = [];
      while (el && el.tagName && el.tagName.toLowerCase() !== 'main' && out.length < 5) {
        var s = el.tagName.toLowerCase();
        if (el.id) { out.unshift('#' + el.id); break; }
        var p = el.parentElement;
        if (p) {
          var same = Array.prototype.filter.call(p.children, function (c) { return c.tagName === el.tagName; });
          if (same.length > 1) s += ':nth-of-type(' + (same.indexOf(el) + 1) + ')';
        }
        out.unshift(s);
        el = el.parentElement;
      }
      return out.join(' > ');
    }

    /* Section porteuse : son surtitre ou son titre. À défaut, le nom de sa
       classe — « stats », « trust » — ce qui reste plus parlant qu'un <div>. */
    function sectionOf(el) {
      var sec = el.closest('section, article, header');
      if (!sec) return '';
      var h = sec.querySelector('h1, h2, h3');
      var eyebrow = sec.querySelector('.eyebrow');
      var named = [eyebrow && eyebrow.textContent.trim(), h && h.textContent.trim()]
        .filter(Boolean).join(' — ');
      if (named) return named;
      var cls = (sec.className || '').split(/\s+/).filter(function (c) {
        return c && c !== 'on-dark' && c !== 'reveal' && c !== 'wrap';
      })[0];
      return cls ? cls.charAt(0).toUpperCase() + cls.slice(1) : '';
    }

    /* Nom humain de l'élément : « Key figure » plutôt que « div ». */
    var LABELS = [
      ['.stat', 'Key figure'], ['.svc', 'Service block'], ['.card', 'Card'],
      ['.quote', 'Testimonial'], ['.step', 'Step'], ['.it', 'Credential strip item'],
      ['.post', 'Article card'], ['.photo', 'Photo slot'], ['.featured', 'Featured article'],
      ['.qlist li', 'Numbered question'], ['.awards li', 'Credential'],
      ['.logos span', 'Client logo'], ['.flist li', 'Bullet']
    ];
    var TAGS = { H1: 'Main heading', H2: 'Heading', H3: 'Sub-heading', P: 'Paragraph',
                 LI: 'List item', BLOCKQUOTE: 'Pull quote', IMG: 'Image',
                 DD: 'Detail line', SUMMARY: 'FAQ question',
                 SECTION: 'Section', ARTICLE: 'Section' };

    function labelOf(el) {
      for (var i = 0; i < LABELS.length; i++) {
        if (el.matches(LABELS[i][0])) return LABELS[i][1];
      }
      return TAGS[el.tagName] || el.tagName.toLowerCase();
    }

    function describe(el) {
      if (!el) return { where: '', selector: '', excerpt: '', label: 'The page as a whole' };
      /* innerText plutôt que textContent : il respecte les sauts de ligne, sinon
         un chiffre et sa légende se collent — « $1B+In negotiations coached ». */
      var txt = (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim();
      if (!txt && el.tagName === 'IMG') txt = '[image] ' + (el.getAttribute('alt') || '');
      if (!txt && el.classList.contains('photo')) txt = '[photo placeholder]';
      var excerpt = txt.length > 140 ? txt.slice(0, 140) + '…' : txt;
      var sec = sectionOf(el);
      return {
        where: (sec ? sec + ' › ' : '') + labelOf(el),
        selector: path(el),
        excerpt: excerpt,
        label: excerpt || el.tagName.toLowerCase()
      };
    }

    /* ------------------------------------------------------------------
       LE PANIER (29/08). Écrire une remarque ne l'envoie plus : elle entre
       dans une liste locale que Nicolas relit, modifie, recible et complète
       autant qu'il veut, page après page, puis envoie d'un seul geste.
       C'est la réponse au 25 août, où deux remarques sur le même sous-titre
       à quatre minutes d'écart m'ont laissé arbitrer seul lequel des deux
       textes il voulait. Désormais c'est lui qui tranche, sur le moment.
       ------------------------------------------------------------------ */
    var KEY = 'negoasia-remarks-v1';

    /* Les images vont dans IndexedDB et non dans localStorage : une capture
       réduite pèse encore 1,7 Mo, et localStorage plafonne à 5 Mo pour tout
       le domaine. Deux captures suffiraient à faire échouer l'écriture de la
       liste elle-même, silencieusement. */
    var DBP = null;
    function db() {
      if (DBP !== null) return DBP;
      try {
        var rq = indexedDB.open('negoasia-rv', 1);
        rq.onupgradeneeded = function () { rq.result.createObjectStore('img'); };
        DBP = new Promise(function (res, rej) {
          rq.onsuccess = function () { res(rq.result); };
          rq.onerror = function () { rej(rq.error); };
        });
      } catch (e) { DBP = Promise.reject(e); }
      return DBP;
    }
    function imgPut(id, blob) {
      return db().then(function (d) {
        return new Promise(function (res, rej) {
          var t = d.transaction('img', 'readwrite');
          t.objectStore('img').put(blob, id);
          t.oncomplete = function () { res(); };
          t.onerror = function () { rej(t.error); };
        });
      });
    }
    function imgGet(id) {
      return db().then(function (d) {
        return new Promise(function (res) {
          var r = d.transaction('img', 'readonly').objectStore('img').get(id);
          r.onsuccess = function () { res(r.result || null); };
          r.onerror = function () { res(null); };
        });
      }).catch(function () { return null; });
    }
    function imgDel(id) {
      return db().then(function (d) {
        d.transaction('img', 'readwrite').objectStore('img').delete(id);
      }).catch(function () {});
    }

    var store = { pending: [], sent: [] };
    try {
      var _raw = localStorage.getItem(KEY);
      if (_raw) {
        var _o = JSON.parse(_raw);
        store.pending = _o.pending || [];
        store.sent = _o.sent || [];
      }
    } catch (e) {}

    function persist() {
      try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) {}
      paintCount();
    }
    function uid() {
      return 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    }
    function esc(s) {
      return String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
    /* Comparaison insensible à l'espacement : l'extrait a été capturé avec
       innerText (qui insère des sauts de ligne entre blocs) et la relecture
       se fait sur un document parsé, où le texte se recolle autrement. On
       retire donc tout ce qui n'est pas alphanumérique des deux côtés. */
    function key(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ''); }
    function flat(el) {
      var out = '';
      (function walk(n) {
        for (var c = n.firstChild; c; c = c.nextSibling) {
          if (c.nodeType === 3) out += c.nodeValue;
          else if (c.nodeType === 1) { out += ' '; walk(c); out += ' '; }
        }
      })(el);
      return out.replace(/\s+/g, ' ').trim();
    }
    function ago(ts) {
      var s = Math.max(0, Math.round((Date.now() - ts) / 1000));
      if (s < 90) return 'just now';
      var m = Math.round(s / 60);
      if (m < 60) return m + ' min ago';
      var h = Math.round(m / 60);
      if (h < 24) return h + ' h ago';
      return 'on ' + new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
    }
    function whenSent(ts) {
      return new Date(ts).toLocaleString('en-GB',
        { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
    }

    /* Bouton « Ma liste », au-dessus du bouton de remarque. Il n'apparaît que
       lorsqu'il y a quelque chose dedans : une liste vide ne mérite pas un
       bouton permanent au-dessus du contenu. */
    var listBtn = document.createElement('button');
    listBtn.type = 'button';
    listBtn.className = 'rv-listbtn';
    listBtn.hidden = true;
    document.body.appendChild(listBtn);
    listBtn.addEventListener('click', function () { openList('pending'); });

    function paintCount() {
      var n = store.pending.length, s = store.sent.length;
      listBtn.hidden = !(n || s);
      listBtn.innerHTML = n
        ? 'My list <b>' + n + '</b>'
        : 'My list <span class="q">' + s + ' sent</span>';
      listBtn.classList.toggle('has', n > 0);
    }

    /* Fermer l'onglet avec des remarques jamais envoyées est le seul geste
       vraiment destructeur du panier. Le navigateur pose la question. */
    addEventListener('beforeunload', function (e) {
      if (!store.pending.length) return;
      e.preventDefault();
      e.returnValue = '';
    });

    var listEl = null, listTab = 'pending', sending = false;

    function openList(tab) {
      if (!listEl) buildList();
      listTab = tab || listTab;
      listEl.classList.add('in');
      document.body.classList.add('rv-lock');
      renderList();
      if (listTab === 'sent') checkStates();
    }
    function closeList() {
      if (!listEl) return;
      listEl.classList.remove('in');
      document.body.classList.remove('rv-lock');
    }

    function buildList() {
      listEl = document.createElement('div');
      listEl.className = 'rv-list';
      listEl.setAttribute('role', 'dialog');
      listEl.setAttribute('aria-label', 'My remarks');
      listEl.innerHTML =
        '<div class="rv-list-in">' +
          '<div class="rv-list-hd">' +
            '<h3>My remarks</h3>' +
            '<button type="button" class="rv-x" data-a="close" aria-label="Close">&times;</button>' +
          '</div>' +
          '<div class="rv-tabs">' +
            '<button type="button" class="rv-tab" data-tab="pending"></button>' +
            '<button type="button" class="rv-tab" data-tab="sent"></button>' +
          '</div>' +
          '<div class="rv-rows" id="rv-rows"></div>' +
          '<div class="rv-foot" id="rv-foot"></div>' +
        '</div>';
      document.body.appendChild(listEl);
      listEl.addEventListener('click', onListClick);
      addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && listEl.classList.contains('in')) closeList();
      });
    }

    function rowHTML(r, sent) {
      var st = '';
      if (sent) {
        var map = {
          changed: ['ok', 'Changed'],
          same:    ['warn', 'Unchanged'],
          gone:    ['warn', 'Not found'],
          '':      ['', 'Checking…']
        };
        var m = map[r._state || ''] || map[''];
        st = '<span class="rv-state ' + m[0] + '">' + m[1] + '</span>';
      }
      var acts = sent
        ? '<button type="button" data-a="see" data-id="' + r.id + '">View on the site</button>'
        : '<button type="button" data-a="edit" data-id="' + r.id + '">Edit</button>' +
          '<button type="button" data-a="see" data-id="' + r.id + '">View</button>' +
          '<button type="button" data-a="aim" data-id="' + r.id + '">Re-target</button>' +
          '<button type="button" class="del" data-a="del" data-id="' + r.id + '">Delete</button>';
      return '<article class="rv-row" id="row-' + r.id + '">' +
        '<div class="rv-row-hd">' +
          '<span class="rv-where">' + esc(r.path) + (r.where ? ' · ' + esc(r.where) : '') + '</span>' +
          '<span class="rv-when">' + esc(sent ? whenSent(r.sentAt) : ago(r.updatedAt || r.createdAt)) + '</span>' +
          st +
        '</div>' +
        (r.excerpt ? '<div class="rv-ex">« ' + esc(r.excerpt) + ' »</div>' : '') +
        '<div class="rv-msg">' + esc(r.msg) + '</div>' +
        (sent && r._nowText && r._state === 'changed'
          ? '<div class="rv-now"><b>On the site now</b>' + esc(r._nowText) + '</div>' : '') +
        (r.hasImg ? '<div class="rv-img" data-img="' + r.id + '"></div>' : '') +
        '<div class="rv-acts">' + acts + '</div>' +
      '</article>';
    }

    function renderList() {
      if (!listEl) return;
      var tabs = listEl.querySelectorAll('.rv-tab');
      tabs[0].textContent = 'To send (' + store.pending.length + ')';
      tabs[1].textContent = 'Sent (' + store.sent.length + ')';
      tabs[0].setAttribute('aria-pressed', String(listTab === 'pending'));
      tabs[1].setAttribute('aria-pressed', String(listTab === 'sent'));

      var rows = listEl.querySelector('#rv-rows');
      var arr = listTab === 'pending'
        ? store.pending.slice().sort(function (a, b) { return (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt); })
        : store.sent.slice().sort(function (a, b) { return b.sentAt - a.sentAt; });
      rows.innerHTML = arr.length
        ? arr.map(function (r) { return rowHTML(r, listTab === 'sent'); }).join('')
        : '<p class="rv-none">' + (listTab === 'pending'
            ? 'Nothing waiting. Point at anything on a page to add a remark.'
            : 'Nothing sent yet.') + '</p>';

      /* Les vignettes viennent d'IndexedDB : on les pose après coup. */
      rows.querySelectorAll('[data-img]').forEach(function (box) {
        imgGet(box.getAttribute('data-img')).then(function (blob) {
          if (!blob) { box.textContent = 'Image attached'; return; }
          var im = new Image();
          im.src = URL.createObjectURL(blob);
          im.alt = '';
          box.appendChild(im);
        });
      });

      /* Le fil d'etat reste toujours present : c'est lui qui porte le compte
         rendu de l'envoi, et il disparaissait au moment precis ou la liste se
         vidait — donc juste avant d'afficher « 3 remarques envoyees ». */
      var foot = listEl.querySelector('#rv-foot');
      var keep = foot.querySelector('#rv-prog');
      var msg = keep ? keep.textContent : '';
      var cls = keep ? keep.className : 'rv-prog';
      var head = '';
      if (listTab === 'pending' && store.pending.length) {
        head = '<button type="button" class="btn btn-primary" data-a="sendall">Send all (' + store.pending.length + ')</button>' +
               '<button type="button" class="rv-close" data-a="copy">Copy the list</button>';
      } else if (store[listTab].length) {
        head = '<button type="button" class="rv-close" data-a="copy">Copy the list</button>';
      }
      foot.innerHTML = head + '<div class="' + cls + '" id="rv-prog"></div>';
      foot.querySelector('#rv-prog').textContent = msg;
      foot.hidden = !head && !msg;
    }

    function onListClick(e) {
      var b = e.target.closest('[data-a],[data-tab]');
      if (!b) return;
      if (b.hasAttribute('data-tab')) {
        listTab = b.getAttribute('data-tab');
        renderList();
        if (listTab === 'sent') checkStates();
        return;
      }
      var a = b.getAttribute('data-a'), id = b.getAttribute('data-id');
      if (a === 'close') return closeList();
      if (a === 'sendall') return sendAll();
      if (a === 'copy') return copyList();
      var r = find(id);
      if (!r) return;
      if (a === 'del') {
        if (!confirm('Delete this remark?')) return;
        store.pending = store.pending.filter(function (x) { return x.id !== id; });
        imgDel(id); persist(); renderList(); return;
      }
      if (a === 'see') {
        closeList();
        var url = r.path + (r.sel ? '?rv=' + encodeURIComponent(r.sel) : '');
        if (r.path === location.pathname && r.sel) { location.href = url; location.reload(); }
        else location.href = url;
        return;
      }
      if (a === 'edit') {
        closeList();
        if (r.path !== location.pathname) {
          /* La remarque vit sur une autre page : on y va, et on rouvre le
             formulaire à l'arrivée. */
          try { sessionStorage.setItem('negoasia-rv-edit', id); } catch (e2) {}
          location.href = r.path + (r.sel ? '?rv=' + encodeURIComponent(r.sel) : '');
          return;
        }
        openPanel(r.sel ? safeQuery(r.sel) : null, r);
        return;
      }
      if (a === 'aim') {
        closeList();
        if (r.path !== location.pathname) {
          try { sessionStorage.setItem('negoasia-rv-aim', id); } catch (e2) {}
          location.href = r.path;
          return;
        }
        retargeting = r;
        setPick(true);
      }
    }

    function find(id) {
      var r = null;
      store.pending.forEach(function (x) { if (x.id === id) r = x; });
      if (!r) store.sent.forEach(function (x) { if (x.id === id) r = x; });
      return r;
    }
    function safeQuery(sel) {
      try { return document.querySelector(sel); } catch (e) { return null; }
    }

    /* Reprise après changement de page : « Modifier » et « Recibler » sur une
       remarque posée ailleurs traversent la navigation par sessionStorage. */
    (function resume() {
      var id;
      try { id = sessionStorage.getItem('negoasia-rv-edit'); } catch (e) { return; }
      if (id) {
        try { sessionStorage.removeItem('negoasia-rv-edit'); } catch (e) {}
        var r = find(id);
        if (r) setTimeout(function () { openPanel(r.sel ? safeQuery(r.sel) : null, r); }, 700);
        return;
      }
      try { id = sessionStorage.getItem('negoasia-rv-aim'); } catch (e) { return; }
      if (id) {
        try { sessionStorage.removeItem('negoasia-rv-aim'); } catch (e) {}
        var r2 = find(id);
        if (r2) setTimeout(function () { retargeting = r2; setPick(true); }, 700);
      }
    })();

    /* État des remarques envoyées : on relit la page telle qu'elle est
       maintenant et on compare avec l'extrait capturé au moment de la
       remarque. Même origine, donc un simple fetch suffit — c'est le même
       mécanisme que les liens ?rv= du rapport, dans l'autre sens. */
    var stateDone = false;
    function checkStates() {
      if (stateDone || !store.sent.length) return;
      stateDone = true;
      var pages = {};
      store.sent.forEach(function (r) { if (r.sel) (pages[r.path] = pages[r.path] || []).push(r); });
      Object.keys(pages).forEach(function (path) {
        fetch(path, { cache: 'no-store' })
          .then(function (res) { return res.text(); })
          .then(function (html) {
            var doc = new DOMParser().parseFromString(html, 'text/html');
            pages[path].forEach(function (r) {
              var el = null;
              try { el = doc.querySelector(r.sel); } catch (e) {}
              if (!el) { r._state = 'gone'; return; }
              var now = flat(el);
              r._nowText = now.length > 200 ? now.slice(0, 200) + '…' : now;
              var old = key(r.excerpt).slice(0, 45);
              r._state = (old && key(now).indexOf(old) >= 0) ? 'same' : 'changed';
            });
            renderList();
          })
          .catch(function () { stateDone = false; });
      });
    }

    function copyList() {
      var arr = listTab === 'sent' ? store.sent : store.pending;
      var txt = arr.map(function (r) {
        return '— ' + r.path + (r.where ? ' · ' + r.where : '') +
               (r.excerpt ? '\n  was: “' + r.excerpt + '”' : '') +
               '\n  remark: ' + r.msg;
      }).join('\n\n');
      try {
        navigator.clipboard.writeText(txt);
        prog('ok', 'List copied.');
      } catch (e) { prog('err', 'Could not copy here.'); }
    }

    function prog(cls, txt) {
      var p = listEl && listEl.querySelector('#rv-prog');
      if (!p) return;
      p.className = 'rv-prog' + (cls ? ' ' + cls : '');
      p.textContent = txt;
    }

    /* Envoi du lot. Une requête par remarque, en série : une capture réduite
       pèse encore près de 2 Mo et Netlify plafonne la requête à 8 Mo, donc un
       envoi groupé en une seule requête casserait au troisième écran. Chaque
       ligne ne quitte la liste que si SON envoi a réussi ; une coupure réseau
       au milieu laisse les suivantes en place avec le bouton Réessayer. */
    function sendAll() {
      if (sending || !store.pending.length) return;
      sending = true;
      var batch = 'b' + Date.now().toString(36);
      var queue = store.pending.slice();
      var done = 0, failed = 0;
      var btnEl = listEl.querySelector('[data-a="sendall"]');
      if (btnEl) btnEl.disabled = true;

      function step(i) {
        if (i >= queue.length) {
          sending = false;
          persist(); renderList();
          prog(failed ? 'err' : 'ok', failed
            ? done + ' sent, ' + failed + ' failed. Try again.'
            : done + ' remark' + (done > 1 ? 's' : '') + ' sent. Thank you.');
          return;
        }
        var r = queue[i];
        prog('', 'Sending ' + (i + 1) + ' of ' + queue.length + '…');
        postOne(r, batch).then(function () {
          done++;
          r.sentAt = Date.now();
          r.batch = batch;
          store.pending = store.pending.filter(function (x) { return x.id !== r.id; });
          store.sent.unshift(r);
          persist();
          step(i + 1);
        }).catch(function () {
          failed++;
          step(i + 1);
        });
      }
      step(0);
    }

    function postOne(r, batch) {
      return imgGet(r.hasImg ? r.id : '__none__').then(function (blob) {
        var body = new FormData();
        var data = {
          'form-name': 'review',
          page: location.origin + r.path,
          where: r.where,
          selector: r.sel,
          excerpt: r.excerpt,
          message: r.msg,
          author: r.author || 'unknown',
          viewport: r.viewport || (innerWidth + 'x' + innerHeight),
          useragent: navigator.userAgent,
          batch: batch
        };
        Object.keys(data).forEach(function (k) { body.append(k, data[k]); });
        if (blob) {
          var sub = ((blob.type || '').split('/')[1] || '').split('+')[0].toLowerCase();
          if (sub === 'jpeg') sub = 'jpg';
          var ext = /^[a-z0-9]{1,5}$/.test(sub) ? sub : 'png';
          body.append('image', blob, 'remark-' + r.id + '.' + ext);
        }
        return fetch('/', { method: 'POST', body: body }).then(function (res) {
          if (!res.ok) throw new Error(res.status);
        });
      });
    }

    function build() {
      panel = document.createElement('div');
      panel.className = 'rv-panel';
      panel.setAttribute('role', 'dialog');
      panel.setAttribute('aria-label', 'Send a remark');
      panel.innerHTML =
        '<h3 id="rv-title">A remark on this element</h3>' +
        '<p class="sub">Say what does not match how you see it. The page and the exact spot ' +
        'travel with your message, so there is nothing to describe.</p>' +
        '<div class="ctx" id="rv-ctx"></div>' +
        '<div class="rv-dup" id="rv-dup" hidden></div>' +
        '<label for="rv-msg">What would you change?</label>' +
        '<textarea id="rv-msg" placeholder="What bothers you, and what you would put instead."></textarea>' +
        '<label>Add an image (optional)</label>' +
        '<div class="rv-drop" id="rv-drop">' +
          '<input type="file" id="rv-img" accept="image/*" hidden>' +
          '<p class="rv-drop-hint" id="rv-drop-hint">Paste a screenshot, drop an image here, or ' +
            '<button type="button" id="rv-pick">choose a file</button>.</p>' +
          '<div class="rv-thumb" id="rv-thumb" hidden>' +
            '<img id="rv-thumb-img" alt="">' +
            '<span id="rv-thumb-meta"></span>' +
            '<button type="button" id="rv-rm" aria-label="Remove the image">Remove</button>' +
          '</div>' +
        '</div>' +
        '<label for="rv-who">From (optional)</label>' +
        '<input type="text" id="rv-who" placeholder="Nicolas">' +
        '<div class="rv-actions">' +
          '<button type="button" class="btn btn-primary" id="rv-send">Add to my list</button>' +
          '<button type="button" class="rv-close" id="rv-cancel">Cancel</button>' +
        '</div>' +
        '<div class="rv-note" id="rv-note"></div>';
      document.body.appendChild(panel);
      panel.querySelector('#rv-cancel').addEventListener('click', close);
      panel.querySelector('#rv-send').addEventListener('click', saveEntry);
      /* Brouillon : la saisie est sauvegardee au fil de la frappe. Un clic
         malheureux ne doit pas coûter un paragraphe deja ecrit. */
      panel.querySelector('#rv-msg').addEventListener('input', function () {
        if (editing) return;
        try {
          sessionStorage.setItem('negoasia-rv-draft',
            JSON.stringify({ k: draftKey(), v: this.value }));
        } catch (e) {}
      });
      panel.querySelector('#rv-dup').addEventListener('click', function (e) {
        var b2 = e.target.closest('[data-dup]');
        if (!b2) return;
        var prev = find(this.getAttribute('data-prev'));
        if (b2.getAttribute('data-dup') === 'replace' && prev) {
          editing = prev;
          panel.querySelector('#rv-msg').value = prev.msg;
          panel.querySelector('#rv-send').textContent = 'Update my remark';
        }
        this.hidden = true;
      });

      var input = panel.querySelector('#rv-img');
      var drop  = panel.querySelector('#rv-drop');
      panel.querySelector('#rv-pick').addEventListener('click', function () { input.click(); });
      panel.querySelector('#rv-rm').addEventListener('click', clearImage);
      input.addEventListener('change', function () { if (input.files[0]) takeImage(input.files[0]); });

      /* Coller : c'est le geste réel — capture d'écran, Ctrl+V. L'écoute est sur
         le panneau entier parce que le curseur est dans la zone de texte à
         l'ouverture, pas sur la zone d'image. */
      panel.addEventListener('paste', function (e) {
        var items = (e.clipboardData || {}).items || [];
        for (var i = 0; i < items.length; i++) {
          if (items[i].type && items[i].type.indexOf('image/') === 0) {
            var f = items[i].getAsFile();
            if (f) { e.preventDefault(); takeImage(f); return; }
          }
        }
      });

      ['dragenter', 'dragover'].forEach(function (t) {
        drop.addEventListener(t, function (e) { e.preventDefault(); drop.classList.add('over'); });
      });
      ['dragleave', 'drop'].forEach(function (t) {
        drop.addEventListener(t, function (e) { e.preventDefault(); drop.classList.remove('over'); });
      });
      drop.addEventListener('drop', function (e) {
        var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
        if (f) takeImage(f);
      });
      try {
        var who = localStorage.getItem('negoasia-reviewer');
        if (who) panel.querySelector('#rv-who').value = who;
      } catch (e) {}
      addEventListener('keydown', function (e) { if (e.key === 'Escape' && open) close(); });
    }

    /* Netlify plafonne la requête entière à 8 Mo et coupe l'envoi à 30 s. Une
       capture d'écran de portable dépasse régulièrement les deux. On réduit donc
       côté navigateur : largeur ramenée à 2000 px, ce qui reste largement lisible
       pour du texte de page web, et ré-encodage JPEG seulement si le fichier est
       gros. Un petit PNG net est laissé intact. */
    var MAX_W = 2000, SHRINK_OVER = 1.5 * 1024 * 1024, HARD_MAX = 7 * 1024 * 1024;
    var image = null, imageURL = null;

    function fmtSize(b) {
      return b < 1024 * 1024 ? Math.round(b / 1024) + ' KB'
                             : (b / 1024 / 1024).toFixed(1) + ' MB';
    }

    function setNote(cls, txt) {
      var note = panel.querySelector('#rv-note');
      note.className = 'rv-note' + (cls ? ' ' + cls : '');
      note.textContent = txt;
    }

    function takeImage(file) {
      if (!file.type || file.type.indexOf('image/') !== 0) {
        setNote('err', 'That is not an image.');
        return;
      }
      shrink(file).then(function (blob) {
        if (blob.size > HARD_MAX) {
          setNote('err', 'That image is too large to send (' + fmtSize(blob.size) + ').');
          return;
        }
        showImage(blob);
        setNote('', '');
      });
    }

    function showImage(blob) {
      clearImage();
      image = blob;
      imageURL = URL.createObjectURL(blob);
      panel.querySelector('#rv-thumb-img').src = imageURL;
      panel.querySelector('#rv-thumb-meta').textContent = fmtSize(blob.size);
      panel.querySelector('#rv-thumb').hidden = false;
      panel.querySelector('#rv-drop-hint').hidden = true;
    }

    function clearImage() {
      if (imageURL) { URL.revokeObjectURL(imageURL); imageURL = null; }
      image = null;
      if (!panel) return;
      panel.querySelector('#rv-img').value = '';
      panel.querySelector('#rv-thumb').hidden = true;
      panel.querySelector('#rv-thumb-img').removeAttribute('src');
      panel.querySelector('#rv-drop-hint').hidden = false;
    }

    function shrink(file) {
      return new Promise(function (resolve) {
        if (file.size <= SHRINK_OVER) { resolve(file); return; }
        var url = URL.createObjectURL(file);
        var img = new Image();
        img.onload = function () {
          var scale = Math.min(1, MAX_W / img.naturalWidth);
          var c = document.createElement('canvas');
          c.width  = Math.round(img.naturalWidth  * scale);
          c.height = Math.round(img.naturalHeight * scale);
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          URL.revokeObjectURL(url);
          c.toBlob(function (blob) {
            resolve(blob && blob.size < file.size ? blob : file);
          }, 'image/jpeg', 0.9);
        };
        img.onerror = function () { URL.revokeObjectURL(url); resolve(file); };
        img.src = url;
      });
    }

    function draftKey() {
      return location.pathname + '|' + (target ? path(target) : '');
    }

    function openPanel(el, rec) {
      if (!panel) build();
      target = el;
      editing = rec || null;
      var d = describe(el);
      var dup = panel.querySelector('#rv-dup');
      dup.hidden = true; dup.innerHTML = '';

      panel.querySelector('#rv-title').textContent =
        editing ? 'Edit my remark' : (el ? 'A remark on this element' : 'A remark on this page');
      panel.querySelector('#rv-send').textContent =
        editing ? 'Update my remark' : 'Add to my list';
      panel.querySelector('#rv-ctx').innerHTML =
        location.pathname + (d.where ? '<b>' + d.where.replace(/</g, '&lt;') + '</b>' : '') +
        (d.excerpt ? '<b>&ldquo;' + d.excerpt.replace(/</g, '&lt;') + '&rdquo;</b>' : '');

      clearImage();
      var box = panel.querySelector('#rv-msg');
      if (editing) {
        box.value = editing.msg || '';
        if (editing.hasImg) {
          imgGet(editing.id).then(function (blob) { if (blob) showImage(blob); });
        }
      } else {
        /* Deja une remarque en attente sur cet element ? C'est le cas du
           25 aout : deux envois a quatre minutes d'ecart sur le meme
           sous-titre. On le lui dit, et c'est lui qui tranche. */
        var sel = d.selector, prev = null;
        store.pending.forEach(function (r) {
          if (r.path === location.pathname && r.sel && r.sel === sel) prev = r;
        });
        if (prev) {
          dup.hidden = false;
          dup.setAttribute('data-prev', prev.id);
          dup.innerHTML =
            '<p><b>You already wrote this ' + ago(prev.updatedAt || prev.createdAt) + ' :</b></p>' +
            '<blockquote>' + esc(prev.msg) + '</blockquote>' +
            '<div class="rv-dup-a">' +
              '<button type="button" data-dup="replace">Replace it</button>' +
              '<button type="button" data-dup="add">Add a second one</button>' +
            '</div>';
        }
        box.value = '';
        try {
          var dr = JSON.parse(sessionStorage.getItem('negoasia-rv-draft') || 'null');
          if (dr && dr.k === draftKey() && dr.v) box.value = dr.v;
        } catch (e) {}
      }

      setNote('', '');
      panel.classList.add('in');
      btn.style.display = 'none';
      listBtn.style.display = 'none';
      mark.classList.remove('in');
      if (hover && hover !== el) hover.classList.remove('rv-hi');
      if (el) { el.classList.add('rv-hi'); hover = el; }
      open = true;
      btn.setAttribute('aria-expanded', 'true');
      box.focus();
    }

    function close() {
      if (!panel) return;
      panel.classList.remove('in');
      btn.style.display = '';
      listBtn.style.display = '';
      btn.setAttribute('aria-expanded', 'false');
      open = false;
      target = null;
      editing = null;
      clearImage();
      clearHover();
    }

    function saveEntry() {
      var msg = panel.querySelector('#rv-msg').value.trim();
      if (!msg) {
        setNote('err', 'Write a line first — even a short one.');
        return;
      }
      var who = panel.querySelector('#rv-who').value.trim();
      try { if (who) localStorage.setItem('negoasia-reviewer', who); } catch (e) {}

      var d = describe(target);
      var rec = editing || { id: uid(), createdAt: Date.now() };
      rec.path = location.pathname;
      rec.where = d.where;
      rec.sel = d.selector;
      rec.excerpt = d.excerpt;
      rec.msg = msg;
      rec.author = who || 'unknown';
      rec.viewport = innerWidth + 'x' + innerHeight;
      rec.updatedAt = Date.now();

      var wasEditing = !!editing;
      function finish(warn) {
        if (!wasEditing) store.pending.push(rec);
        persist();
        try { sessionStorage.removeItem('negoasia-rv-draft'); } catch (e) {}
        setNote(warn ? 'err' : 'ok',
          warn ? 'Saved, but the image could not be kept.'
               : (wasEditing ? 'Remark updated.' : 'Added to your list (' + store.pending.length + ').'));
        setTimeout(function () { close(); setNote('', ''); }, 1100);
      }

      if (image) {
        rec.hasImg = true;
        imgPut(rec.id, image).then(function () { finish(false); })
                             .catch(function () { rec.hasImg = false; finish(true); });
      } else {
        if (rec.hasImg) { rec.hasImg = false; imgDel(rec.id); }
        finish(false);
      }
    }

    paintCount();
  })();

  var stored = read();
  if (stored === 'granted') {
    loadAnalytics();
  } else if (stored !== 'denied') {
    /* Give the page a moment to settle before interrupting the reader. */
    setTimeout(showBanner, 1200);
  }
})();
