/* Mr. Tony Services — main.js */
(function () {
  'use strict';

  var EMAIL = 'mrtbayservices@gmail.com';

    // ---- Attribution: gclid / UTM / fbclid ----
  var ATTR_KEY = 'mrt_attr';
  var ATTR_TTL = 90 * 24 * 60 * 60 * 1000; // 90 gün
  var ATTR_PARAMS = ['gclid', 'gbraid', 'wbraid', 'fbclid',
    'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];

  function readAttr() {
    try {
      var raw = localStorage.getItem(ATTR_KEY);
      if (!raw) return null;
      var obj = JSON.parse(raw);
      if (!obj || Date.now() - obj.ts > ATTR_TTL) {
        localStorage.removeItem(ATTR_KEY);
        return null;
      }
      return obj;
    } catch (_) { return null; }
  }

  function captureAttribution() {
    var q = new URLSearchParams(location.search);
    var found = {};
    var has = false;
    ATTR_PARAMS.forEach(function (k) {
      var v = q.get(k);
      if (v) { found[k] = v.slice(0, 200); has = true; }
    });
    if (!has) return; // parametr yoxdursa əvvəlki məlumat qalır
    found.landing_page = location.pathname;
    found.referrer = document.referrer || '';
    found.ts = Date.now();
    try { localStorage.setItem(ATTR_KEY, JSON.stringify(found)); } catch (_) {}
  }
  captureAttribution();

  function loadPartial(id, url) {
    var el = document.getElementById(id);
    if (!el) return Promise.resolve();
    return fetch(url)
      .then(function (r) { return r.text(); })
      .then(function (h) { el.outerHTML = h; })
      .catch(function () {});
  }

  Promise.all([
    loadPartial('site-header', '/partials/header.html'),
    loadPartial('site-footer', '/partials/footer.html')
  ]).then(init);

  function init() {
    
    // Səhifənin öz forması varsa, footer-dakını sil (təkrar id olmasın)
    if (document.querySelectorAll('#estimate').length > 1) {
      var fe = document.getElementById('footer-estimate');
      if (fe) fe.remove();
    }

    // /chimney/#estimate kimi birbaşa linklər üçün: footer gec yükləndiyi üçün əl ilə sürüşdür
    if (location.hash === '#estimate') {
      var tgt = document.getElementById('estimate');
      if (tgt) setTimeout(function () { tgt.scrollIntoView(); }, 50);
    }

  // Footer year
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

    document.querySelectorAll('#menu a').forEach(function (a) {
    var p = a.getAttribute('href');
    if (p.charAt(0) === '/' && p.length > 1 && p.indexOf('#') === -1 && location.pathname.indexOf(p) === 0) {
      a.setAttribute('aria-current', 'page');
    }
  });

  // Sticky header shadow
  var nav = document.getElementById('nav');
  function onScroll() { nav.classList.toggle('scrolled', window.scrollY > 10); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Mobile menu
  var burger = document.getElementById('burger');
  var menu = document.getElementById('menu');
  function setMenu(open) {
    menu.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', String(open));
  }
  burger.addEventListener('click', function () { setMenu(!menu.classList.contains('open')); });
  menu.addEventListener('click', function (e) { if (e.target.tagName === 'A') setMenu(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });

  // Reveal on scroll
  var items = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add('in'); });
  }

  // Service buttons pre-select the form dropdown
  var select = document.getElementById('service');
  function pickService(v) {
    if (!select) return;
    for (var i = 0; i < select.options.length; i++) {
      if (select.options[i].text === v) { select.selectedIndex = i; break; }
    }
  }
  var PAGE_SERVICE = { '/gutter': 'Gutter Cleaning & Repairs', '/chimney': 'Chimney Cleaning & Repairs' };
  var ps = PAGE_SERVICE[location.pathname.replace(/\/+$/, '')];
  if (ps && select && !select.value) pickService(ps);

  document.querySelectorAll('[data-service]').forEach(function (a) {
    a.addEventListener('click', function () {
      pickService(a.getAttribute('data-service'));
    });
  });

  // Estimate form
  var form = document.getElementById('estimate');
  var msg = document.getElementById('msg');
    if (!form) return;

  function show(text, ok) {
    msg.textContent = text;
    msg.className = 'msg ' + (ok ? 'ok' : 'err');
  }

  function mailtoFallback(data) {
    var body = 'Name: ' + data.name + '\nPhone: ' + data.phone + '\nEmail: ' + (data.email || '-') +
      '\nService: ' + data.service + '\n\n' + data.message;
    window.location.href = 'mailto:' + EMAIL + '?subject=' +
      encodeURIComponent('Estimate request: ' + data.service + ' — ' + data.name) +
      '&body=' + encodeURIComponent(body);
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var fd = new FormData(form);
    if (fd.get('company')) return; // honeypot

    var data = {
      name: (fd.get('name') || '').trim(),
      phone: (fd.get('phone') || '').trim(),
      email: (fd.get('email') || '').trim(),
      service: fd.get('service') || '',
      message: (fd.get('message') || '').trim()
    };
    if (!data.name || !data.phone || !data.service || !data.message) {
      show('Please fill in your name, phone, service and project details.', false);
      return;
    }
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      show('Please enter a valid email address.', false);
      return;
    }

    var attr = readAttr() || {};
    data.page = location.pathname;
    data.attribution = attr;

    var btn = form.querySelector('button[type="submit"]');
    btn.disabled = true; btn.textContent = 'Sending…';

        // Save request + notify Telegram (token stays on the server)
    fetch('https://fdzxqwtenqfommrtdlvg.supabase.co/functions/v1/new-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).catch(function (err) { console.error('Request save failed:', err); });

    // 📩 Web3Forms (email)
    fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        access_key: '3be1002a-bd15-4b1f-bb09-e73e8e26845d',
        subject: 'New estimate request: ' + data.service + ' — ' + data.name,
        from_name: 'Mr. Tony Services website',
        name: data.name,
        phone: data.phone,
        email: data.email,
        service: data.service,
        source: [attr.utm_source, attr.utm_medium, attr.utm_campaign].filter(Boolean).join(' / ') || 'direct/organic',
        gclid: attr.gclid || '',
        landing_page: attr.landing_page || location.pathname,
        message: data.message
      })
    }).then(function (res) {
      return res.json();
    }).then(function (json) {
      if (!json.success) throw new Error('web3forms failed');
      form.reset();
      show('Thank you! Your request was sent. We will contact you shortly.', true);

      // 🎯 Konversiya yalnız həqiqətən uğurlu olduqda
      if (typeof gtag === 'function') {
        gtag('event', 'conversion_event_submit_lead_form');
      }
    }).catch(function () {
      // Forma sıfırlanmır, istifadəçi yazdığını itirmir
      show('Sorry, something went wrong. Please call us or try again.', false);
    }).finally(function () {
      btn.disabled = false;
      btn.textContent = 'Send request';
    });
  });
  }
})();

/* Click tracking → Telegram & Google Analytics */
(function () {
  var URL = 'https://fdzxqwtenqfommrtdlvg.supabase.co/functions/v1/notify-click';
  
    function readAttr() {
    try {
      var o = JSON.parse(localStorage.getItem('mrt_attr') || 'null');
      return o && Date.now() - o.ts < 90 * 864e5 ? o : {};
    } catch (_) { return {}; }
  }

  function kind(h) {
    h = (h || '').toLowerCase();
    if (h.indexOf('tel:') === 0) return 'call';
    if (h.indexOf('mailto:') === 0) return 'email';
    if (h.indexOf('wa.me') !== -1) return 'whatsapp';
    if (h.indexOf('housecallpro.com') !== -1) return 'booking';
    if (h.indexOf('instagram.com') !== -1) return 'instagram';
    if (h.indexOf('yelp.') !== -1) return 'yelp';
    return null;
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    var type = kind(a.getAttribute('href'));
    if (!type) return;

    // 🎯 Əgər klik telefon zəlidirsə, GA4-ə birbaşa phone_call konversiyası göndər
    if (type === 'call' && typeof gtag === 'function') {
      gtag('event', 'phone_call');
    }

    try {
      fetch(URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: type,
          page: location.pathname,
          device: /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
          attribution: readAttr()
        }),
        keepalive: true
      }).catch(function () {});
    } catch (_) {}
  });
})();
