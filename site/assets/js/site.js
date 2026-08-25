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

      var el = null, marked = false;

      function aim() {
        try { el = el || document.querySelector(sel); } catch (e) { return false; }
        if (!el) return false;
        /* Les blocs n'apparaissent qu'au défilement : on force celui qui nous
           intéresse et ses parents à être visibles, sinon on viserait un
           élément encore transparent. */
        var p = el;
        while (p && p !== document.body) { p.classList.add('in'); p = p.parentElement; }
        /* `instant` et non `smooth` : la feuille de style pose
           `scroll-behavior:smooth` sur `html`, or une animation de défilement
           s'annule au moindre incident pendant le chargement — c'est ainsi
           qu'on se retrouvait à 40 px du haut. Un saut sec ne s'annule pas. */
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
          '<button type="button" class="btn btn-primary" id="rv-send">Send</button>' +
          '<button type="button" class="rv-close" id="rv-cancel">Cancel</button>' +
        '</div>' +
        '<div class="rv-note" id="rv-note"></div>';
      document.body.appendChild(panel);
      panel.querySelector('#rv-cancel').addEventListener('click', close);
      panel.querySelector('#rv-send').addEventListener('click', send);

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
        clearImage();
        image = blob;
        imageURL = URL.createObjectURL(blob);
        panel.querySelector('#rv-thumb-img').src = imageURL;
        panel.querySelector('#rv-thumb-meta').textContent = fmtSize(blob.size);
        panel.querySelector('#rv-thumb').hidden = false;
        panel.querySelector('#rv-drop-hint').hidden = true;
        setNote('', '');
      });
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

    function openPanel(el) {
      if (!panel) build();
      target = el;
      var d = describe(el);
      panel.querySelector('#rv-title').textContent =
        el ? 'A remark on this element' : 'A remark on this page';
      panel.querySelector('#rv-ctx').innerHTML =
        location.pathname + (d.where ? '<b>' + d.where.replace(/</g, '&lt;') + '</b>' : '') +
        (d.excerpt ? '<b>“' + d.excerpt.replace(/</g, '&lt;') + '”</b>' : '');
      panel.classList.add('in');
      btn.style.display = 'none';
      mark.classList.remove('in');
      /* On garde le liseré sur l'élément visé pendant la saisie : au doigt,
         c'est la seule confirmation de ce qu'on est en train de commenter. */
      if (hover && hover !== el) hover.classList.remove('rv-hi');
      if (el) { el.classList.add('rv-hi'); hover = el; }
      open = true;
      btn.setAttribute('aria-expanded', 'true');
      panel.querySelector('#rv-msg').focus();
    }

    function close() {
      if (!panel) return;
      panel.classList.remove('in');
      btn.style.display = '';
      btn.setAttribute('aria-expanded', 'false');
      open = false;
      target = null;
      clearImage();
      clearHover();
    }

    function send() {
      var msg = panel.querySelector('#rv-msg').value.trim();
      var note = panel.querySelector('#rv-note');
      if (!msg) {
        note.className = 'rv-note err';
        note.textContent = 'Write a line first — even a short one.';
        return;
      }
      var who = panel.querySelector('#rv-who').value.trim();
      try { if (who) localStorage.setItem('negoasia-reviewer', who); } catch (e) {}

      var d = describe(target);
      var data = {
        'form-name': 'review',
        page: location.href,
        where: d.where,
        selector: d.selector,
        excerpt: d.excerpt,
        message: msg,
        author: who || 'unknown',
        viewport: innerWidth + 'x' + innerHeight,
        useragent: navigator.userAgent
      };
      /* FormData et non urlencoded, parce qu'un fichier ne se code pas en
         chaîne de requête. Et surtout : PAS d'en-tête Content-Type. Le
         navigateur doit poser lui-même le multipart avec sa frontière ; l'écrire
         à la main casse l'envoi côté Netlify. */
      var body = new FormData();
      Object.keys(data).forEach(function (k) { body.append(k, data[k]); });
      if (image) {
        /* Extension déduite du sous-type MIME, pas d'un ternaire : les images de
           moins de 1,5 Mo passent intactes, donc un GIF, un WebP ou un SVG arrive
           tel quel. Le nommer .jpg ne casse pas l'envoi — Netlify se fie au type
           MIME — mais un fichier téléchargé depuis le tableau de bord porterait
           une extension mensongère. */
        var sub = ((image.type || '').split('/')[1] || '').split('+')[0].toLowerCase();
        if (sub === 'jpeg') sub = 'jpg';
        var ext = /^[a-z0-9]{1,5}$/.test(sub) ? sub : 'png';
        body.append('image', image, 'remark-' + Date.now() + '.' + ext);
      }

      note.className = 'rv-note';
      note.textContent = image ? 'Sending the image…' : 'Sending…';
      fetch('/', { method: 'POST', body: body }).then(function (r) {
        if (!r.ok) throw new Error(r.status);
        note.className = 'rv-note ok';
        note.textContent = 'Got it — thank you.';
        panel.querySelector('#rv-msg').value = '';
        clearImage();
        setTimeout(function () { close(); note.textContent = ''; }, 1500);
      }).catch(function () {
        note.className = 'rv-note err';
        note.textContent = 'Could not send. Screenshot it and send it by message instead.';
      });
    }
  })();

  var stored = read();
  if (stored === 'granted') {
    loadAnalytics();
  } else if (stored !== 'denied') {
    /* Give the page a moment to settle before interrupting the reader. */
    setTimeout(showBanner, 1200);
  }
})();
