/* Mr. Tony Services — main.js */
(function () {
  'use strict';

  var EMAIL = 'mrtbayservices@gmail.com';

  // Footer year
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

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
  document.querySelectorAll('[data-service]').forEach(function (a) {
    a.addEventListener('click', function () {
      var v = a.getAttribute('data-service');
      for (var i = 0; i < select.options.length; i++) {
        if (select.options[i].text === v) { select.selectedIndex = i; break; }
      }
    });
  });

  // Estimate form
  var form = document.getElementById('estimate');
  var msg = document.getElementById('msg');

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

    var btn = form.querySelector('button[type="submit"]');
    btn.disabled = true; btn.textContent = 'Sending…';

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
        message: data.message
      })
    }).then(function (res) {
      return res.json();
    }).then(function (json) {
      if (!json.success) throw new Error(json.message || 'Send failed');
      form.reset();
      show('Thank you! Your request was sent. We will contact you shortly.', true);
    }).catch(function () {
      show('Opening your email app to send the request…', true);
      mailtoFallback(data);
    }).finally(function () {
      btn.disabled = false; btn.textContent = 'Send request';
    });
  });
})();
