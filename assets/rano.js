/* Rano theme JS: vanilla, no dependencies. */
(() => {
  document.documentElement.classList.add('js');
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const overlay = $('[data-overlay]');

  /* ---------- Drawers (menu, cart, search) ---------- */
  let openEl = null, lastFocus = null;
  function openDrawer(el) {
    if (!el) return;
    if (openEl && openEl !== el) closeDrawer();
    lastFocus = document.activeElement;
    el.hidden = false;
    const isPanel = el.classList.contains('search-panel');
    if (!isPanel) { overlay.hidden = false; document.body.style.overflow = 'hidden'; }
    requestAnimationFrame(() => { el.classList.add('is-open'); if (!isPanel) overlay.classList.add('is-open'); });
    openEl = el;
    const focusable = $('input, button, a', el);
    focusable && setTimeout(() => focusable.focus(), 50);
  }
  function closeDrawer() {
    if (!openEl) return;
    const el = openEl;
    el.classList.remove('is-open');
    overlay.classList.remove('is-open');
    document.body.style.overflow = '';
    setTimeout(() => { el.hidden = true; overlay.hidden = true; }, el.classList.contains('search-panel') ? 0 : 400);
    openEl = null;
    lastFocus && lastFocus.focus();
  }
  document.addEventListener('click', (e) => {
    const opener = e.target.closest('[data-open]');
    if (opener) {
      e.preventDefault();
      const target = document.getElementById(opener.dataset.open);
      target === openEl ? closeDrawer() : openDrawer(target);
      return;
    }
    if (e.target.closest('[data-close]') || e.target === overlay) closeDrawer();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDrawer(); });

  /* ---------- Header shadow on scroll (IntersectionObserver, no scroll listener) ---------- */
  const header = $('[data-header]');
  if (header) {
    const sentinel = document.createElement('div');
    sentinel.style.cssText = 'position:absolute;top:0;height:1px;width:1px';
    document.body.prepend(sentinel);
    new IntersectionObserver(([en]) => header.classList.toggle('is-scrolled', !en.isIntersecting)).observe(sentinel);
  }

  /* ---------- Announcement rotator ---------- */
  $$('[data-rotator]').forEach((bar) => {
    const msgs = $$('.announce__msg', bar);
    if (msgs.length < 2 || reduce) return;
    let i = 0;
    setInterval(() => { msgs[i].classList.remove('is-active'); i = (i + 1) % msgs.length; msgs[i].classList.add('is-active'); }, 4500);
  });

  /* ---------- Hero slideshow ---------- */
  $$('[data-slideshow]').forEach((root) => {
    const slides = $$('[data-slide]', root), dots = $$('[data-dot]', root);
    const secs = Number(root.dataset.interval) || 0;
    root.style.setProperty('--dur', secs + 's');
    let i = 0, timer;
    const go = (n) => {
      slides[i].classList.remove('is-active'); dots[i] && dots[i].classList.remove('is-active');
      i = (n + slides.length) % slides.length;
      slides[i].classList.add('is-active');
      if (dots[i]) { dots[i].classList.remove('is-active'); void dots[i].offsetWidth; dots[i].classList.add('is-active'); }
      $$('video', root).forEach((v) => (v.closest('[data-slide]') === slides[i] ? v.play().catch(() => {}) : v.pause()));
      schedule();
    };
    const schedule = () => { clearTimeout(timer); if (secs && slides.length > 1 && !reduce) timer = setTimeout(() => go(i + 1), secs * 1000); };
    dots.forEach((d) => d.addEventListener('click', () => go(Number(d.dataset.dot))));
    let x0 = null;
    root.addEventListener('touchstart', (e) => (x0 = e.touches[0].clientX), { passive: true });
    root.addEventListener('touchend', (e) => { if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 50) go(i + (dx < 0 ? 1 : -1)); x0 = null; });
    schedule();
  });

  /* ---------- Carousels: arrows sit on the cards' edge (over the photos), shown only when there is more to scroll ---------- */
  $$('.carousel[data-carousel]').forEach((track) => {
    const wrap = document.createElement('div'); wrap.className = 'carousel-wrap'; track.before(wrap); wrap.append(track);
    const mk = (dir) => { const b = document.createElement('button'); b.type = 'button'; b.className = `carousel-edge carousel-edge--${dir}`; b.setAttribute('aria-label', dir === 'prev' ? 'Previous' : 'Next');
      b.innerHTML = `<svg viewBox="0 0 256 256" aria-hidden="true"><path fill="currentColor" d="${dir === 'prev' ? 'M164.24 203.76a6 6 0 1 1-8.48 8.48l-80-80a6 6 0 0 1 0-8.48l80-80a6 6 0 0 1 8.48 8.48L88.49 128Z' : 'M180.24 132.24l-80 80a6 6 0 0 1-8.48-8.48L167.51 128 91.76 52.24a6 6 0 0 1 8.48-8.48l80 80a6 6 0 0 1 0 8.48Z'}"/></svg>`;
      b.addEventListener('click', () => track.scrollBy({ left: (dir === 'next' ? 1 : -1) * track.clientWidth * 0.8, behavior: reduce ? 'auto' : 'smooth' })); wrap.append(b); return b; };
    const prev = mk('prev'), next = mk('next');
    const sync = () => {
      const media = track.querySelector('img,video'); const r = media && media.getBoundingClientRect(), t = track.getBoundingClientRect();
      if (r && r.height) { wrap.style.setProperty('--edge-top', `${r.top - t.top}px`); wrap.style.setProperty('--edge-h', `${r.height}px`); }
      const max = track.scrollWidth - track.clientWidth;
      prev.hidden = track.scrollLeft < 8; next.hidden = track.scrollLeft > max - 8 || max < 8;
    };
    track.addEventListener('scroll', sync, { passive: true }); addEventListener('resize', sync); addEventListener('load', sync); sync();
    new MutationObserver(sync).observe(track.closest('[hidden]') || track, { attributes: true, attributeFilter: ['hidden'] });
  });
  document.addEventListener('click', (e) => { if (e.target.closest('[data-tab]')) requestAnimationFrame(() => dispatchEvent(new Event('resize'))); });

  /* ---------- Carousel autoplay (pauses on hover/touch, loops) ---------- */
  $$('[data-autoplay]').forEach((track) => {
    if (reduce) return;
    let paused = false;
    ['pointerenter', 'touchstart', 'focusin'].forEach((e) => track.addEventListener(e, () => (paused = true), { passive: true }));
    ['pointerleave', 'focusout'].forEach((e) => track.addEventListener(e, () => (paused = false)));
    setInterval(() => {
      if (paused || track.offsetParent === null) return;
      const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
      track.scrollTo({ left: atEnd ? 0 : track.scrollLeft + track.firstElementChild.getBoundingClientRect().width + 12, behavior: 'smooth' });
    }, Number(track.dataset.autoplay) * 1000);
  });

  /* ---------- Countdown promo ---------- */
  $$('[data-countdown]').forEach((el) => {
    const end = Date.parse(el.dataset.countdown);
    if (!end) return;
    const pad = (n) => String(n).padStart(2, '0');
    const tick = () => {
      const left = end - Date.now();
      if (left <= 0) { el.hidden = true; return clearInterval(t); }
      const s = Math.floor(left / 1000);
      $('[data-d]', el).textContent = pad(Math.floor(s / 86400));
      $('[data-h]', el).textContent = pad(Math.floor(s / 3600) % 24);
      $('[data-m]', el).textContent = pad(Math.floor(s / 60) % 60);
      $('[data-s]', el).textContent = pad(s % 60);
    };
    const t = setInterval(tick, 1000); tick();
  });
  document.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-copy]');
    if (!b) return;
    try { await navigator.clipboard.writeText(b.dataset.copy); } catch (_) {}
    const l = $('[data-copy-label]', b); l.textContent = 'Copied'; setTimeout(() => (l.textContent = 'Copy'), 1800);
  });

  /* ---------- Click-to-play videos ---------- */
  document.addEventListener('click', (e) => {
    const box = e.target.closest('[data-play]');
    if (!box) return;
    const v = $('video', box);
    $$('[data-play] video').forEach((o) => { if (o !== v) { o.pause(); o.closest('[data-play]').classList.remove('is-playing'); } });
    if (v.paused) { v.muted = false; v.play().catch(() => { v.muted = true; v.play(); }); box.classList.add('is-playing'); }
    else { v.pause(); box.classList.remove('is-playing'); }
  });

  /* ---------- Trustpilot grid: Read more only when clamped ---------- */
  $$('[data-tp-grid] .tp-card').forEach((card) => {
    const txt = $('.tp-card__text', card), more = $('[data-tp-more]', card);
    if (more && txt.scrollHeight > txt.clientHeight + 2) {
      more.hidden = false;
      more.addEventListener('click', () => { card.classList.toggle('is-open'); more.textContent = card.classList.contains('is-open') ? 'Show less' : 'Read more'; });
    }
  });

  /* ---------- Localization dropdowns: close on outside click / Esc ---------- */
  document.addEventListener('click', (e) => $$('[data-loc][open]').forEach((d) => !d.contains(e.target) && d.removeAttribute('open')));
  document.addEventListener('keydown', (e) => e.key === 'Escape' && $$('[data-loc][open]').forEach((d) => d.removeAttribute('open')));

  /* ---------- Mega menu: close after clicking a link (hover stays open otherwise) ---------- */
  $$('[data-mega] .mega a').forEach((a) => a.addEventListener('click', () => document.activeElement.blur()));

  /* ---------- Tabs ---------- */
  $$('[data-tabs]').forEach((root) => {
    const tabs = $$('[data-tab]', root), panels = $$('[data-panel]', root);
    tabs.forEach((t) => t.addEventListener('click', () => {
      tabs.forEach((x) => { x.classList.toggle('is-active', x === t); x.setAttribute('aria-selected', x === t); });
      panels.forEach((p, n) => (p.hidden = n !== Number(t.dataset.tab)));
    }));
  });

  /* ---------- Reveal + play videos only when visible ---------- */
  const io = new IntersectionObserver((entries) => entries.forEach((en) => {
    if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
  }), { rootMargin: '0px 0px -8% 0px' });
  $$('.reveal').forEach((el) => io.observe(el));
  const vio = new IntersectionObserver((entries) => entries.forEach((en) => {
    const v = en.target;
    if (v.closest('[data-slide]') && !v.closest('[data-slide]').classList.contains('is-active')) return;
    en.isIntersecting ? v.play().catch(() => {}) : v.pause();
  }), { threshold: 0.2 });
  $$('video[autoplay]').forEach((v) => { v.muted = true; vio.observe(v); });

  /* ---------- Cart (AJAX + section rendering) ---------- */
  const countEls = () => $$('[data-cart-count]');
  async function refreshCart(open = true) {
    const res = await fetch(`${window.rano.root}?sections=cart-drawer`);
    const html = (await res.json())['cart-drawer'];
    const fresh = new DOMParser().parseFromString(html, 'text/html').querySelector('#cart-drawer');
    const drawer = $('#cart-drawer');
    drawer.innerHTML = fresh.innerHTML;
    $$('.reveal', drawer).forEach((el) => el.classList.add('is-in'));
    const cart = await (await fetch(`${window.rano.root}cart.js`)).json();
    countEls().forEach((c) => { c.textContent = cart.item_count; c.hidden = cart.item_count === 0; });
    if (open && openEl !== drawer) openDrawer(drawer);
  }
  document.addEventListener('submit', async (e) => {
    const form = e.target.closest('[data-add-form]');
    if (!form || !window.fetch) return;
    e.preventDefault();
    const btn = $('[type="submit"]', form);
    btn && btn.classList.add('is-loading');
    try {
      const extras = $$('[data-bundle-item]:checked', form);
      let body = new FormData(form), headers = { Accept: 'application/json' };
      if (extras.length) { // main product + add-ons in one request, tagged so an automatic discount / report can see the set
        const props = { _bundle: 'Rano set' }; for (const [k, v] of body) { const m = k.match(/^properties\[(.+)\]$/); if (m) props[m[1]] = v; }
        body = JSON.stringify({ items: [{ id: Number(body.get('id')), quantity: Number(body.get('quantity') || 1), properties: props }, ...extras.map((x) => ({ id: Number(x.value), quantity: 1, properties: { _bundle: 'Rano set' } }))] });
        headers['Content-Type'] = 'application/json';
      }
      const res = await fetch(window.rano.cartAdd, { method: 'POST', headers, body });
      if (!res.ok) { const err = await res.json(); alert(err.description || 'Could not add to bag'); return; }
      await refreshCart(true);
    } catch (_) { form.submit(); }
    finally { btn && btn.classList.remove('is-loading'); }
  });
  document.addEventListener('click', async (e) => {
    const b = e.target.closest('#cart-drawer [data-qty]');
    if (!b) return;
    const line = b.dataset.line || b.closest('[data-line]').dataset.line;
    const drawer = $('#cart-drawer');
    drawer.classList.add('is-loading');
    await fetch(window.rano.cartChange, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ line: Number(line), quantity: Number(b.dataset.qty) }) });
    await refreshCart(false);
    drawer.classList.remove('is-loading');
  });

  /* ---------- Cookie consent (Shopify Customer Privacy API; localStorage outside Shopify) ---------- */
  const cookie = $('[data-cookie]');
  if (cookie) {
    const KEY = 'rano-consent';
    const boxes = $$('[data-consent]', cookie);
    const show = () => { cookie.hidden = false; requestAnimationFrame(() => cookie.classList.add('is-open')); };
    const save = (all) => {
      const c = Object.fromEntries(boxes.map((b) => [b.dataset.consent, all || b.checked]));
      localStorage.setItem(KEY, JSON.stringify(c));
      const cp = window.Shopify && Shopify.customerPrivacy;
      cp && cp.setTrackingConsent({ analytics: c.analytics, marketing: c.marketing, preferences: c.preferences, sale_of_data: c.marketing }, () => {});
      cookie.classList.remove('is-open');
      setTimeout(() => (cookie.hidden = true), 400);
    };
    $('[data-cookie-accept]', cookie).addEventListener('click', () => save(true));
    $('[data-cookie-save]', cookie).addEventListener('click', () => save(false));
    if (window.Shopify && Shopify.loadFeatures) {
      Shopify.loadFeatures([{ name: 'consent-tracking-api', version: '0.1' }], (err) => {
        if (!err && Shopify.customerPrivacy.shouldShowBanner()) show();
      });
    } else if (!localStorage.getItem(KEY)) {
      show();
    }
  }

  /* ---------- 3D models: Shopify's model-viewer, Google CDN outside Shopify ---------- */
  // Rotation only after tapping "Rotate 3D"; otherwise the model would swallow gallery swipes on mobile.
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-model-toggle]'); if (!btn) return;
    const mv = btn.parentElement.querySelector('model-viewer'); const on = btn.getAttribute('aria-pressed') !== 'true';
    mv.toggleAttribute('camera-controls', on); if (on) mv.removeAttribute('auto-rotate'); else mv.setAttribute('auto-rotate', '');
    btn.setAttribute('aria-pressed', on); btn.querySelector('[data-on]').hidden = on; btn.querySelector('[data-off]').hidden = !on;
    btn.closest('.pdp__slide').classList.toggle('is-rotating', on);
  });
  if ($('model-viewer')) {
    const fallback = () => customElements.get('model-viewer') || import('https://ajax.googleapis.com/ajax/libs/model-viewer/4.0.0/model-viewer.min.js');
    if (window.Shopify && Shopify.loadFeatures) Shopify.loadFeatures([{ name: 'model-viewer-ui', version: '1.0', onLoad: fallback }]);
    else fallback();
  }

  /* ---------- Drag-to-rotate: 3D turn through the product photos ---------- */
  $$('[data-spin]').forEach((el) => {
    const img = $('img', el), srcs = el.dataset.images.split('|');
    srcs.forEach((s) => { const i = new Image(); i.src = s; });
    let i = 0, x0 = null, busy = false;
    const set = (deg, t = '') => { img.style.transition = t; img.style.transform = `rotateY(${deg}deg) scale(${1 - Math.abs(deg) / 900})`; el.style.setProperty('--shine', Math.min(Math.abs(deg) / 60, 0.5)); };
    const turn = (dir) => {
      busy = true;
      set(-90 * dir, 'transform .28s ease-in');
      setTimeout(() => {
        i = (i + dir + srcs.length) % srcs.length;
        img.removeAttribute('srcset'); img.src = srcs[i];
        set(90 * dir);
        requestAnimationFrame(() => requestAnimationFrame(() => { set(0, 'transform .45s cubic-bezier(.16,1,.3,1)'); setTimeout(() => (busy = false), 450); }));
      }, 280);
    };
    el.addEventListener('pointerdown', (e) => { if (busy) return; x0 = e.clientX; el.setPointerCapture(e.pointerId); });
    el.addEventListener('pointermove', (e) => { if (x0 === null) return; set(Math.max(-70, Math.min(70, ((e.clientX - x0) / el.clientWidth) * 140))); });
    const end = (e) => {
      if (x0 === null) return;
      const dx = (e.clientX - x0) / el.clientWidth; x0 = null;
      Math.abs(dx) > 0.18 ? turn(dx < 0 ? 1 : -1) : set(0, 'transform .45s cubic-bezier(.16,1,.3,1)');
    };
    el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
  });

  /* ---------- Help centre: topics, search, view toggle, prefilled subject ---------- */
  const help = $('[data-help]');
  if (help) {
    const topicsWrap = $('[data-help-topics]', help), groups = $$('[data-faq-group]', help), empty = $('[data-help-empty]', help);
    const showTopics = () => { topicsWrap.hidden = false; groups.forEach((g) => { g.hidden = true; g.classList.remove('help-faq--search'); $('[data-help-back]', g).hidden = false; $('.h2', g).hidden = false; $$('[data-faq]', g).forEach((d) => (d.hidden = false)); }); empty.hidden = true; };
    $$('[data-topic]', help).forEach((t) => t.addEventListener('click', () => {
      topicsWrap.hidden = true; groups.forEach((g) => (g.hidden = g.dataset.faqGroup !== t.dataset.topic));
      $('#topic-' + t.dataset.topic).scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    }));
    $$('[data-help-back]', help).forEach((b) => b.addEventListener('click', showTopics));
    $$('[data-view]', help).forEach((b) => b.addEventListener('click', () => {
      $$('[data-view]', help).forEach((x) => x.classList.toggle('is-active', x === b));
      $('[data-view-target]', help).classList.toggle('is-list', b.dataset.view === 'list');
    }));
    $('[data-help-search]', help).addEventListener('input', (e) => {
      const q = e.target.value.trim().toLowerCase();
      if (q.length < 2) return showTopics();
      topicsWrap.hidden = true; let hits = 0;
      groups.forEach((g) => {
        let n = 0;
        $$('[data-faq]', g).forEach((d) => { const m = d.textContent.toLowerCase().includes(q); d.hidden = !m; if (m) n++; });
        g.hidden = n === 0; g.classList.add('help-faq--search'); $('[data-help-back]', g).hidden = true; hits += n;
      });
      empty.hidden = hits > 0;
    });
  }

  /* ---------- Contact form page: subject from ?subject= or quick action ---------- */
  const subj = $('[data-cform-subject]');
  if (subj) {
    const q = new URLSearchParams(location.search).get('subject');
    if (q) subj.value = q;
    $$('.cform-page [data-subject]').forEach((a) => a.addEventListener('click', (e) => {
      if (a.getAttribute('href') !== '#cform') return;
      e.preventDefault(); subj.value = a.dataset.subject;
      $('#cform').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); $('#cf-name').focus({ preventScroll: true });
    }));
  }

  /* ---------- Product page ---------- */
  const pdp = $('[data-product]');
  if (pdp) {
    const variants = JSON.parse($('[data-variants]', pdp).textContent);
    const idInput = $('[data-variant-id]', pdp), atc = $('[data-atc]', pdp), priceEl = $('[data-price]', pdp);
    const money = (c) => new Intl.NumberFormat(document.documentElement.lang || 'en', { style: 'currency', currency: window.Shopify && Shopify.currency ? Shopify.currency.active : 'EUR' }).format(c / 100);
    $$('[data-option]', pdp).forEach((sel) => sel.addEventListener('change', () => {
      const chosen = $$('[data-option]', pdp).map((s) => s.value);
      const v = variants.find((x) => x.options.every((o, n) => o === chosen[n]));
      atc.disabled = !v || !v.available;
      $('[data-atc-label]', atc).textContent = !v ? 'Unavailable' : v.available ? 'Add to bag' : 'Sold out';
      const bx = $('[data-bundle]', pdp); if (v && bx) bx.dataset.mainPrice = v.price;
      $('[data-atc-price]', atc).hidden = !v || !v.available; if (v) $('[data-atc-price]', atc).textContent = fmtMoney(v.price);
      if (bx) bx.dispatchEvent(new Event('change'));
      if (!v) return;
      idInput.value = v.id;
      const sale = v.compare_at_price > v.price;
      priceEl.innerHTML = `<span class="price${sale ? ' price--sale' : ''}"><span class="price__now">${money(v.price)}</span>${sale ? `<s class="price__was">${money(v.compare_at_price)}</s>` : ''}</span>`;
      history.replaceState(null, '', `?variant=${v.id}`);
    }));

    // Mobile gallery dots
    const track = $('.pdp__track', pdp), dots = $$('.pdp__dots span', pdp);
    if (track && dots.length) {
      const sio = new IntersectionObserver((entries) => entries.forEach((en) => {
        if (en.isIntersecting) dots.forEach((d, n) => d.classList.toggle('is-active', n === [...track.children].indexOf(en.target)));
      }), { root: track, threshold: 0.6 });
      [...track.children].forEach((s) => sio.observe(s));
    }

    // Sticky add-to-cart (mobile) when the main button is out of view
    const bar = $('[data-sticky-atc]', pdp);
    if (bar && atc) {
      bar.hidden = false;
      new IntersectionObserver(([en]) => bar.classList.toggle('is-visible', !en.isIntersecting && en.boundingClientRect.top < 0)).observe(atc);
      $('[data-sticky-submit]', bar).addEventListener('click', () => atc.click());
    }
  }
})();

// Footer columns: open on desktop, accordion on mobile
if (matchMedia('(max-width: 989px)').matches) document.querySelectorAll('[data-footer-col]').forEach((d) => d.removeAttribute('open'));

// PDP quick questions: show the matching answer as a chat bubble
document.addEventListener('click', (e) => {
  const chip = e.target.closest('[data-ask-q]'); if (!chip) return;
  const box = chip.closest('[data-ask]'); const open = chip.getAttribute('aria-expanded') !== 'true';
  box.querySelectorAll('[data-ask-q]').forEach((c) => c.setAttribute('aria-expanded', 'false'));
  box.querySelectorAll('[data-ask-a]').forEach((a) => { a.hidden = !(open && a.dataset.askA === chip.dataset.askQ); });
  chip.setAttribute('aria-expanded', open);
});
// "Ask us anything" on the product page prefills the contact form
{
  const q = new URLSearchParams(location.search); const body = document.querySelector('textarea[name="contact[body]"]');
  if (body && q.get('q') && !body.value) body.value = (q.get('product') ? `About ${q.get('product')}: ` : '') + q.get('q');
}

// Reviews: turn grid/strip into a seamless, non-pausing marquee (all screen sizes)
{
  document.querySelectorAll('[data-tp-grid], .tp-track').forEach((box) => {
    const cards = [...box.children]; if (cards.length < 2) return;
    const inner = document.createElement('div'); inner.className = 'tp-marquee__inner';
    cards.forEach((c) => inner.append(c));
    cards.forEach((c) => { const d = c.cloneNode(true); d.setAttribute('aria-hidden', 'true'); d.querySelectorAll('a,button').forEach((x) => x.tabIndex = -1); inner.append(d); });
    inner.style.setProperty('--tp-dur', cards.length * 6 + 's');
    box.removeAttribute('data-carousel'); box.removeAttribute('data-autoplay'); box.classList.add('tp-marquee'); box.append(inner);
  });
}

// Track my order: tabs + DHL lookup
document.querySelectorAll('[data-track]').forEach((box) => {
  box.querySelectorAll('[data-track-tab]').forEach((tab) => tab.addEventListener('click', () => {
    box.querySelectorAll('[data-track-tab]').forEach((t) => { const on = t === tab; t.classList.toggle('is-active', on); t.setAttribute('aria-selected', on); });
    box.querySelectorAll('[data-track-form]').forEach((f) => { f.hidden = f.dataset.trackForm !== tab.dataset.trackTab; });
  }));
  const form = box.querySelector('[data-track-form="dhl"]'), input = form.querySelector('input'), msg = form.querySelector('[data-track-msg]'), hint = msg.textContent;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const code = input.value.replace(/[\s-]/g, '').toUpperCase();
    const ok = /^[A-Z0-9]{8,35}$/.test(code); // DHL codes: 10-digit express, JJD/JVGL/3S parcel codes
    input.parentElement.classList.toggle('is-error', !ok); msg.classList.toggle('is-error', !ok);
    msg.textContent = ok ? hint : 'Please enter a valid DHL tracking number (letters and numbers only).';
    if (ok) window.open(box.dataset.url.replace('{code}', encodeURIComponent(code)), '_blank', 'noopener');
  });
});
// Application forms: at least one option where required
document.addEventListener('submit', (e) => {
  const need = [...e.target.querySelectorAll('[data-need-one]')].find((g) => !g.querySelector(':checked'));
  if (need) { e.preventDefault(); need.closest('fieldset').scrollIntoView({ behavior: 'smooth', block: 'center' }); need.animate([{ transform: 'translateX(-4px)' }, { transform: 'translateX(4px)' }, { transform: 'none' }], 240); }
}, true);

// Bundle: live set total. Prices in cents; pct by number of pieces (main + checked add-ons).
// ponytail: display only; the real discount is a Shopify automatic discount (see README).
// ponytail: matches the store's EUR money format (€1.234,56); read shop.money_format if more currencies are added
const fmtMoney = (c) => '€' + (c / 100).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+,)/g, '.');
const bundlePct = (pieces, p2, p3) => (pieces >= 3 ? p3 : pieces === 2 ? p2 : 0);
document.querySelectorAll('[data-bundle]').forEach((box) => {
  const p2 = +box.dataset.pct2, p3 = +box.dataset.pct3;
  const update = () => {
    const on = [...box.querySelectorAll('[data-bundle-item]:checked')];
    const main = +box.dataset.mainPrice, pieces = on.length + 1, pct = bundlePct(pieces, p2, p3), was = on.reduce((t, x) => t + +x.dataset.price, main), now = Math.round(was * (100 - pct) / 100);
    box.querySelectorAll('[data-bundle-from]').forEach((el) => { el.textContent = fmtMoney(Math.round(+el.dataset.bundleFrom * (100 - bundlePct(Math.max(pieces, 2), p2, p3)) / 100)); });
    box.querySelectorAll('.bundle__item').forEach((l) => l.classList.toggle('is-on', l.querySelector('input').checked));
    const sum = box.querySelector('[data-bundle-sum]'); sum.hidden = !on.length;
    box.querySelector('[data-bundle-total]').textContent = fmtMoney(now);
    box.querySelector('[data-bundle-was]').textContent = fmtMoney(was);
    box.querySelector('[data-bundle-save]').textContent = fmtMoney(was - now);
    const atc = box.closest('form').querySelector('[data-atc]');
    if (atc && !atc.disabled) { atc.querySelector('[data-atc-label]').textContent = on.length ? 'Add set to bag' : 'Add to bag'; atc.querySelector('[data-atc-price]').textContent = fmtMoney(now); }
  };
  box.addEventListener('change', update);
});
console.assert(fmtMoney(129610) === '€1.296,10' && bundlePct(1, 10, 15) === 0 && bundlePct(2, 10, 15) === 10 && bundlePct(4, 10, 15) === 15, 'bundlePct');

// Date fields: the browser's own calendar can't be styled, so swap in a rounded Rano calendar.
document.querySelectorAll('input[type="date"]').forEach((input) => {
  const lang = document.documentElement.lang || 'en', today = new Date(); today.setHours(0, 0, 0, 0);
  const pad = (n) => String(n).padStart(2, '0'), fmt = (d) => `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
  input.type = 'text'; input.readOnly = true; input.placeholder = 'dd-mm-yyyy'; input.classList.add('cal-input');
  input.setAttribute('aria-haspopup', 'dialog'); input.setAttribute('aria-expanded', 'false');
  const wrap = document.createElement('div'); wrap.className = 'cal-wrap'; input.before(wrap); wrap.append(input);
  const pop = document.createElement('div'); pop.className = 'cal'; pop.hidden = true; pop.setAttribute('role', 'dialog'); pop.setAttribute('aria-label', 'Choose a date'); wrap.append(pop);
  let view = new Date(today.getFullYear(), today.getMonth(), 1), picked = null;
  const days = [...Array(7)].map((_, i) => new Date(2024, 0, i + 1).toLocaleDateString(lang, { weekday: 'short' }).slice(0, 2)); // 1 Jan 2024 = Monday
  const draw = () => {
    const first = (view.getDay() + 6) % 7, n = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
    let cells = '';
    for (let i = 0; i < first; i++) cells += '<span></span>';
    for (let d = 1; d <= n; d++) {
      const dt = new Date(view.getFullYear(), view.getMonth(), d), past = dt < today;
      const cls = [+dt === +today && 'is-today', picked && +dt === +picked && 'is-picked'].filter(Boolean).join(' ');
      cells += `<button type="button" data-d="${d}" class="${cls}"${past ? ' disabled' : ''}>${d}</button>`;
    }
    pop.innerHTML = `<div class="cal__head"><button type="button" data-m="-1" aria-label="Previous month"${view <= new Date(today.getFullYear(), today.getMonth(), 1) ? ' disabled' : ''}>‹</button><strong>${view.toLocaleDateString(lang, { month: 'long', year: 'numeric' })}</strong><button type="button" data-m="1" aria-label="Next month">›</button></div><div class="cal__grid">${days.map((x) => `<small>${x}</small>`).join('')}${cells}</div><div class="cal__foot"><button type="button" data-clear>Clear</button><button type="button" data-today>Today</button></div>`;
  };
  const open = (on) => { pop.hidden = !on; input.setAttribute('aria-expanded', on); if (on) { draw(); (pop.querySelector('.is-picked,.is-today:not(:disabled)') || pop.querySelector('[data-d]:not(:disabled)')).focus(); } };
  const set = (d) => { picked = d; input.value = d ? fmt(d) : ''; input.dispatchEvent(new Event('change', { bubbles: true })); open(false); input.focus(); };
  input.addEventListener('click', () => open(pop.hidden));
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') { e.preventDefault(); open(true); } });
  pop.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b || b.disabled) return;
    if (b.dataset.m) { view = new Date(view.getFullYear(), view.getMonth() + +b.dataset.m, 1); draw(); }
    else if (b.dataset.d) set(new Date(view.getFullYear(), view.getMonth(), +b.dataset.d));
    else if ('clear' in b.dataset) set(null);
    else if ('today' in b.dataset) set(new Date(today));
  });
  pop.addEventListener('keydown', (e) => { if (e.key === 'Escape') { open(false); input.focus(); } });
  document.addEventListener('click', (e) => { if (!e.composedPath().includes(wrap)) open(false); });
});

// Country picker: live search + switch language with the country
document.querySelectorAll('[data-loc-panel]').forEach((panel) => {
  const q = panel.querySelector('[data-loc-search]'), items = [...panel.querySelectorAll('[data-loc-items] li')], empty = panel.querySelector('[data-loc-empty]');
  q.addEventListener('input', () => {
    const v = q.value.trim().toLowerCase(); let n = 0;
    items.forEach((li) => { const hit = !v || li.querySelector('button').dataset.name.includes(v); li.hidden = !hit; n += hit; li.classList.toggle('loc__sep--off', !!v); });
    empty.hidden = n > 0;
  });
  q.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); const first = items.find((li) => !li.hidden); first && first.querySelector('button').click(); } });
  panel.closest('details').addEventListener('toggle', (e) => { if (e.target.open && matchMedia('(hover:hover)').matches) q.focus(); });
  panel.addEventListener('click', (e) => {
    const b = e.target.closest('button[name="country_code"]'); if (!b) return;
    const lang = panel.closest('form').querySelector('[data-loc-lang]');
    lang.disabled = !b.dataset.lang; lang.value = b.dataset.lang;
  });
});

// Facts: count up once when visible (keeps the final number in the HTML for no-JS / reduced motion)
if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const cio = new IntersectionObserver((ents) => ents.forEach((en) => {
    if (!en.isIntersecting) return; cio.unobserve(en.target);
    const el = en.target, end = +el.dataset.count, t0 = performance.now(), dur = 1800;
    const tick = (t) => { const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 4); el.textContent = Math.round(end * e); if (k < 1) requestAnimationFrame(tick); };
    el.textContent = '0'; requestAnimationFrame(tick);
  }), { threshold: .6 });
  document.querySelectorAll('[data-count]').forEach((el) => cio.observe(el));
  // Gentle parallax on story photos
  const pics = [...document.querySelectorAll('.story__media')];
  if (pics.length) {
    let raf = 0; const run = () => { raf = 0; const vh = innerHeight; pics.forEach((m) => { const r = m.getBoundingClientRect(); if (r.bottom < 0 || r.top > vh) return; const p = (r.top + r.height / 2 - vh / 2) / vh; m.style.setProperty('--py', `${(-p * 6).toFixed(2)}%`); }); };
    addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(run); }, { passive: true }); run();
  }
}

// Launch hero: mouse parallax on the product + sticky buy bar when the hero leaves the screen
document.querySelectorAll('[data-launch]').forEach((hero) => {
  const stage = hero.querySelector('[data-launch-stage]'), bar = document.querySelector('[data-launch-bar]');
  if (matchMedia('(hover:hover) and (prefers-reduced-motion:no-preference)').matches) hero.addEventListener('pointermove', (e) => {
    const r = hero.getBoundingClientRect(); stage.style.setProperty('--mx', `${((e.clientX - r.left) / r.width - .5) * 24}px`); stage.style.setProperty('--my', `${((e.clientY - r.top) / r.height - .5) * 16}px`);
  });
  if (bar) new IntersectionObserver(([en]) => { const on = !en.isIntersecting && en.boundingClientRect.top < 0; bar.classList.toggle('is-visible', on); bar.setAttribute('aria-hidden', !on); bar.querySelector('button').tabIndex = on ? 0 : -1; }).observe(hero.querySelector('.launch__form') || hero);
});
// 3D scroll film: scroll position drives the camera between chapter angles
const lerp = (a, b, t) => a + (b - a) * t;
document.querySelectorAll('[data-spin3d]').forEach((sec) => {
  const mv = sec.querySelector('model-viewer'), chs = [...sec.querySelectorAll('[data-chapter]')], rail = [...sec.querySelectorAll('.spin3d__rail li')];
  const orbits = chs.map((c) => c.dataset.orbit.split(/\s+/).map(Number));
  let raf = 0, last = -1;
  const run = () => {
    raf = 0;
    const r = sec.getBoundingClientRect(), total = sec.offsetHeight - innerHeight;
    const p = Math.min(1, Math.max(0, -r.top / total)), f = p * (chs.length - 1), i = Math.min(chs.length - 2, Math.floor(f)), t = f - i;
    const ease = t * t * (3 - 2 * t), a = orbits[i], b = orbits[i + 1] || a;
    if (mv) mv.cameraOrbit = `${lerp(a[0], b[0], ease)}deg ${lerp(a[1], b[1], ease)}deg ${lerp(a[2], b[2], ease)}%`;
    sec.style.setProperty('--p', p.toFixed(4));
    const act = Math.round(f);
    if (act !== last) { last = act; chs.forEach((c, k) => c.classList.toggle('is-active', k === act)); rail.forEach((l, k) => l.classList.toggle('is-active', k === act)); }
  };
  addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(run); }, { passive: true }); addEventListener('resize', run); run();
});
console.assert(lerp(0, 90, .5) === 45, 'lerp');
