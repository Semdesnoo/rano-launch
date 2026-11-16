// Static preview of this Shopify theme for GitHub Pages (liquidjs + mocked Shopify objects).
// Usage: node preview/build.mjs [basePath]   -> writes _site/
// ponytail: mocks only what this theme uses; not a general Shopify emulator.
import { Liquid, Tag, Hash } from 'liquidjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const THEME = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(THEME, '_site');
const BASE = (process.argv[2] || '/').replace(/\/?$/, '/');
const read = (p) => fs.readFileSync(path.join(THEME, p), 'utf8');
const locale = JSON.parse(read('locales/en.default.json'));

// ---------- mock catalogue (real Rano products) ----------
const im = (f) => ({ src: `/img/${f}`, alt: '', width: 1200, height: 1500, media_type: 'image' });
const P = (handle, title, price, compare, imgs, tags = []) => ({
  id: handle, handle, title, url: `/products/${handle}`, price: price * 100, compare_at_price: compare ? compare * 100 : null,
  available: true, tags, vendor: 'Rano Europe', has_only_default_variant: true, price_varies: false,
  images: imgs.map(im), media: imgs.map(im), featured_image: im(imgs[0]),
  description: `<p>The ${title} is a statement in motion: designed in Italy from full-grain premium leather, defined by clean lines and a bold tone that blends luxury with confidence.</p><p>A spacious, lightweight piece that holds its structure, featuring silver hardware and a smart interior.</p>`,
  variants: [{ id: 1, title: 'Default Title', price: price * 100, compare_at_price: compare ? compare * 100 : null, available: true, options: ['Default Title'] }],
  options_with_values: [], collections: [],
});
const withVariant = (p) => { p.selected_or_first_available_variant = p.variants[0]; p.variants[0].id = p.handle; return p; };
const products = [
  P('giallo-traveller', 'Giallo Traveller', 258, 359, ['DSC03510.jpg', 'Rano___Model-070.jpg', 'Rano___Model-076.jpg', 'Rano___Model-077.jpg']),
  P('blue-mare-traveller', 'Blue Mare Traveller', 258, 359, ['DSC03516.jpg', 'Rano___Model-045.jpg', 'DSC03522.jpg', 'DSC00214.jpg']),
  P('rano-rosa-traveller', 'Rosa Traveller', 258, 359, ['DSC03523_b261c397-68c1-4f94-84bc-4193bc80164e.jpg', 'Rano_Model-112.jpg', 'E9841D9D-FC6B-46F2-B7E4-CA70BB4A064C.jpg']),
  P('giallo-travel-pouch', 'Giallo Travel Pouch', 71, 110, ['GEELFRONT.png', 'DSC00016.jpg']),
  P('rosa-travel-pouch', 'Rosa Travel Pouch', 71, 110, ['ROZEFRONT.png', 'Minimalistische_roze_lederen_toilettas.png']),
  P('blue-mare-travel-pouch', 'Blue Mare Travel Pouch', 71, 110, ['BLAUWFRONT.png', 'BLAUWSIDE.png']),
  P('giallo-cardholder', 'Giallo Card Holder', 31, 39, ['yellow1.png', 'yellow2.png']),
  P('rosa-cardholder', 'Rosa Card Holder', 31, 39, ['pinkcardholder1.png']),
  P('blue-mare-card-holder', 'Blue Mare Card Holder', 31, 39, ['Blue_Mare_Cardholder_Shopify.png', 'ChatGPT_Image_28_aug_2026_00_18_21.png']),
  P('bundle-product-7', 'Giallo Full Travel Set', 360, null, ['DSC03510.jpg', 'GEELFRONT.png', 'yellow1.png'], ['bundle']),
  P('bundle-product-4', 'Rosa Full Travel Set', 360, null, ['DSC03523_b261c397-68c1-4f94-84bc-4193bc80164e.jpg', 'ROZEFRONT.png'], ['bundle']),
];
products.forEach(withVariant);
// 3D: a preview/models/<handle>.glb becomes the product's first media (in Shopify: upload the .glb as product media)
for (const p of products) if (fs.existsSync(path.join(THEME, 'preview/models', p.handle + '.glb'))) p.media.unshift({ media_type: 'model', src: `/models/${p.handle}.glb`, alt: p.title, poster: p.images[0].src });
const byHandle = Object.fromEntries(products.map((p) => [p.handle, p]));
const C = (handle, title, hs) => ({ handle, title, url: `/collections/${handle}`, products: hs.map((h) => byHandle[h]), products_count: hs.length, description: '', sort_options: [{ value: 'manual', name: 'Featured' }, { value: 'price-ascending', name: 'Price, low to high' }], sort_by: 'manual' });
const collections = {
  'rano-traveller': C('rano-traveller', 'Rano Traveller', ['giallo-traveller', 'blue-mare-traveller', 'rano-rosa-traveller']),
  'rano-travel-pouch': C('rano-travel-pouch', 'Rano Travel Pouch', ['giallo-travel-pouch', 'rosa-travel-pouch', 'blue-mare-travel-pouch']),
  'card-holder': C('card-holder', 'Card Holder', ['giallo-cardholder', 'rosa-cardholder', 'blue-mare-card-holder']),
  all: C('all', 'All products', products.map((p) => p.handle)),
};
for (const c of Object.values(collections)) if (c.handle !== 'all') c.products.forEach((p) => p.collections.push(c));
products.forEach((p) => p.collections.push(collections.all));

const L = (title, url, links = []) => ({ title, url, links, active: false, child_active: false });
const menus = {
  'main-menu': { title: 'Shop', links: [L('The Giallo Traveller', '/products/giallo-traveller'), L('Our story', '/pages/about-us'), L('Craftsmanship', '/pages/craftsmanship'), L('Contact', '/pages/contact')] },
  'footer-company': { title: 'Company', links: [L('About us', '/pages/about-us'), L('Reviews', '/#reviews'), L('Craftsmanship', '/pages/craftsmanship'), L('Partnerships & Ambassadors', '/pages/partnerships'), L('Become a reseller', '/pages/reseller'), L('Corporate Gifting', '/pages/corporate-gifting'), L('Instagram', 'https://www.instagram.com/ranoeurope/'), L('TikTok', 'https://www.tiktok.com/@ranoeurope')] },
  footer: { title: 'Customer service', links: [L('Help centre & FAQs', '/pages/contact'), L('Track my order', '/pages/track-order'), L('Shipping Policy', '/policies/shipping-policy'), L('Return & Refund Policy', '/policies/refund-policy'), L('Privacy Policy', '/policies/privacy-policy'), L('Terms of Service', '/policies/terms-of-service'), L('Contact', '/pages/contact-form')] },
  'footer-shop': { title: 'Rano', links: [L('Shop All', '/collections/all'), L('Bestsellers', '/collections/all?sort_by=best-selling'), L('The Traveller', '/collections/rano-traveller'), L('Travel Pouch', '/collections/rano-travel-pouch'), L('Card Holder', '/collections/card-holder'), L('Full Travel Sets', '/products/bundle-product-7'), L('The Gift Edit', '/products/bundle-product-4')] },
};

// ---------- settings ----------
const schemaDefaults = (schema) => Object.fromEntries((schema.settings || []).filter((s) => 'default' in s).map((s) => [s.id, s.default]));
const globalSchema = JSON.parse(read('config/settings_schema.json'));
const settings = Object.assign({}, ...globalSchema.map(schemaDefaults), JSON.parse(read('config/settings_data.json')).presets.Default);
const resolve = (type, v) => {
  if (v == null || v === '') return type === 'url' || type === 'text' ? v : null;
  if (type === 'collection') return collections[v] || null;
  if (type === 'product') return byHandle[v] || null;
  if (type === 'link_list') return menus[v] || null;
  if (type === 'url') return String(v).replace('shopify://collections/', '/collections/').replace('shopify://pages/', '/pages/');
  return v;
};
const schemaOf = (type) => { const m = read(`sections/${type}.liquid`).match(/{%\s*schema\s*%}([\s\S]*?){%\s*endschema\s*%}/); return m ? JSON.parse(m[1]) : {}; };
// Preview-only sample reviews: Rano has no Trustpilot reviews yet, so the live theme ships without any.
const SAMPLE = [
  ['Sophie', '2 days ago', 'Beautiful leather', 'The Giallo Traveller looks even better in real life. The leather feels soft and solid at the same time.', ''],
  ['Daan', '5 days ago', 'Perfect weekend bag', 'Fits everything for a city trip and still goes in the overhead cabin.', '3 days ago'],
  ['Giulia', '9 November', 'Fast delivery', 'Ordered on Monday, delivered on Wednesday. Nicely packed.', ''],
  ['Mark', '6 November', 'Great gift', 'Bought the Rosa pouch for my girlfriend. She uses it every day.', ''],
  ['Lotte', '2 November', 'Quality you can feel', 'You can see the craftsmanship in the stitching and the hardware. Worth it.', ''],
  ['Youssef', '28 October', 'Exactly as shown', 'Colour is exactly like the photos. The card holder is slim and fits in my front pocket.', '27 October'],
  ['Emma', '25 October', 'Compliments everywhere', 'Every time I travel with it someone asks where the bag is from. Customer service was very friendly when I had a question about the strap and they answered within an hour.', ''],
  ['Thomas', '21 October', 'Solid', 'Good size, good leather, good price.', ''],
];
function withSampleReviews(data) {
  if (data.type !== 'trustpilot-reviews' || (data.block_order || []).length) return data;
  const blocks = Object.fromEntries(SAMPLE.map(([name, date, title, text, reply_date], i) => [`r${i}`, { type: 'review', settings: { stars: i === 7 ? 4 : 5, name, date, title, text, reply_date, verified: i % 3 !== 2 } }]));
  return { ...data, blocks, block_order: Object.keys(blocks), settings: { ...data.settings, review_count: '8', rating: '4.8' } };
}
function buildSection(id, data) {
  data = withSampleReviews(data);
  const schema = schemaOf(data.type);
  const types = Object.fromEntries((schema.settings || []).map((s) => [s.id, s.type]));
  const st = { ...schemaDefaults(schema), ...(data.settings || {}) };
  for (const k in st) st[k] = resolve(types[k], st[k]);
  const blocks = (data.block_order || []).map((bid) => {
    const b = data.blocks[bid]; const bs = (schema.blocks || []).find((x) => x.type === b.type) || {};
    const bt = Object.fromEntries((bs.settings || []).map((s) => [s.id, s.type]));
    const s = { ...schemaDefaults(bs), ...b.settings }; for (const k in s) s[k] = resolve(bt[k], s[k]);
    return { id: bid, type: b.type, settings: s, shopify_attributes: '' };
  });
  return { id, type: data.type, settings: st, blocks };
}

// ---------- engine ----------
const engine = new Liquid({ root: [path.join(THEME, 'snippets')], extname: '.liquid', jsTruthy: false, strictFilters: true });
const money = (c) => '€' + (Number(c || 0) / 100).toFixed(2).replace('.', ',');
const attrs = (h) => Object.entries(h || {}).filter(([, v]) => v !== false && v != null && v !== '').map(([k, v]) => `${k}="${String(v).replace(/"/g, '&quot;')}"`).join(' ');
engine.registerFilter('t', (k) => k.split('.').reduce((o, x) => o?.[x], locale) ?? k);
engine.registerFilter('asset_url', (f) => `/assets/${f}`);
engine.registerFilter('image_url', (img) => (typeof img === 'string' ? img : img?.src || ''));
engine.registerFilter('image_tag', function (src, ...args) { const h = Object.fromEntries(args.filter(Array.isArray)); delete h.widths; return `<img src="${src}" ${attrs(h)}>`; });
engine.registerFilter('money', money);
engine.registerFilter('money_with_currency', (c) => money(c) + ' EUR');
engine.registerFilter('stylesheet_tag', (u) => `<link rel="stylesheet" href="${u}">`);
engine.registerFilter('preload_tag', (u) => `<link rel="preload" href="${u}" as="font" crossorigin>`);
engine.registerFilter('placeholder_svg_tag', (n, cls) => `<svg class="${cls || ''}" style="background:#ddd"></svg>`);
engine.registerFilter('video_tag', () => '');
engine.registerFilter('media_tag', () => '');
engine.registerFilter('model_viewer_tag', function (m, ...args) { const h = Object.fromEntries(args.filter(Array.isArray)); delete h.image_size; return `<model-viewer src="${m.src}" poster="${m.poster}" ${Object.entries(h).map(([k, v]) => (v === true ? k : `${k}="${v}"`)).join(' ')}></model-viewer>`; });
engine.registerFilter('payment_type_svg_tag', (t, cls) => fs.readFileSync(path.join(THEME, 'preview/pay', t + '.svg'), 'utf8').replace('<svg', `<svg class="${cls || ''}"`));
engine.registerFilter('default_pagination', () => '');
engine.registerFilter('default_errors', () => '');
engine.registerFilter('url_param_escape', (s) => encodeURIComponent(s));
engine.registerFilter('pluralize', (n, a, b) => (n === 1 ? a : b));
engine.registerFilter('payment_button', () => '');

class SchemaTag extends Tag { constructor(t, r, l) { super(t, r, l); r.shift(); while (r.length) { const x = r.shift(); if (x.name === 'endschema') break; } } * render() {} }
engine.registerTag('schema', SchemaTag);
engine.registerTag('form', class extends Tag {
  constructor(t, r, l, p) { super(t, r, l); this.tpls = []; this.args = t.args; const s = p.parseStream(r).on('tag:endform', () => s.stop()).on('template', (x) => this.tpls.push(x)).on('end', () => { throw new Error('form not closed'); }); s.start(); }
  * render(ctx, emitter) { const cls = (this.args.match(/class:\s*'([^']*)'/) || [])[1] || ''; const data = this.args.includes('data-add-form') ? ' data-add-form' : ''; const fid = (this.args.match(/id:\s*'([^']*)'/) || [])[1]; const idA = fid ? ` id="${fid}"` : ''; emitter.write(this.args.includes('localization') ? `<form method="get" class="${cls}">` : `<form method="post" action="/cart/add" class="${cls}"${idA}${data}>`); ctx.push({ form: { errors: null, posted_successfully: false } }); yield this.liquid.renderer.renderTemplates(this.tpls, ctx, emitter); ctx.pop(); emitter.write('</form>'); }
});
engine.registerTag('paginate', class extends Tag {
  constructor(t, r, l, p) { super(t, r, l); this.tpls = []; const s = p.parseStream(r).on('tag:endpaginate', () => s.stop()).on('template', (x) => this.tpls.push(x)).on('end', () => { throw new Error('paginate not closed'); }); s.start(); }
  * render(ctx, emitter) { ctx.push({ paginate: { pages: 1 } }); yield this.liquid.renderer.renderTemplates(this.tpls, ctx, emitter); ctx.pop(); }
});
async function renderSection(sec, scope) {
  const html = await engine.parseAndRender(read(`sections/${sec.type}.liquid`), { ...scope, section: sec });
  const note = sec.type === 'trustpilot-reviews' ? '<p style="margin:0 auto;max-width:1680px;padding:0 var(--pad);font-size:12px;color:#7a2f2a">Voorbeeldreviews in deze preview. In Shopify komen hier de echte Trustpilot-reviews.</p>' : '';
  return `<div id="shopify-section-${sec.id}" class="shopify-section section-${sec.type}">${note}${html}</div>`;
}
const group = (name, scope) => { const g = JSON.parse(read(`sections/${name}.json`)); return Promise.all(g.order.map((id) => renderSection(buildSection(id, g.sections[id]), scope))).then((a) => a.join('')); };
engine.registerTag('sections', class extends Tag { constructor(t, r, l) { super(t, r, l); this.name = t.args.replace(/['"\s]/g, ''); } async render(ctx, em) { em.write(await group(this.name, ctx.getAll())); } });
engine.registerTag('section', class extends Tag { constructor(t, r, l) { super(t, r, l); this.name = t.args.replace(/['"\s]/g, ''); } async render(ctx, em) { em.write(await renderSection(buildSection(this.name, { type: this.name }), ctx.getAll())); } });

const cart = { item_count: 0, items: [], total_price: 0, currency: { iso_code: 'EUR' } };
async function page(template, extra = {}) {
  const t = JSON.parse(read(`templates/${template}.json`));
  const scope = {
    settings, collections, cart, shop: { name: 'Rano Europe', privacy_policy: { url: 'https://ranoeurope.com/policies/privacy-policy' }, customer_accounts_enabled: true, enabled_payment_types: ['visa', 'master', 'ideal', 'apple_pay', 'paypal', 'klarna'] },
    routes: { root_url: '/', cart_url: '/cart', cart_add_url: '/cart/add', cart_change_url: '/cart/change', search_url: '/search', account_url: '/account', all_products_collection_url: '/collections/all' },
    request: { locale: { iso_code: 'en' }, origin: 'http://localhost' }, localization: (() => { const cs = JSON.parse(fs.readFileSync(path.join(THEME, 'preview/countries.json'), 'utf8')).map((c) => ({ ...c, src: `https://cdn.shopify.com/static/images/flags/${c.iso_code.toLowerCase()}.svg` })); const ls = [{ iso_code: 'en', endonym_name: 'English' }, { iso_code: 'nl', endonym_name: 'Nederlands' }, { iso_code: 'de', endonym_name: 'Deutsch' }, { iso_code: 'fr', endonym_name: 'Français' }, { iso_code: 'it', endonym_name: 'Italiano' }, { iso_code: 'es', endonym_name: 'Español' }]; return { available_countries: cs, country: cs.find((c) => c.iso_code === 'NL'), available_languages: ls, language: ls[0] }; })(),
    template: { name: template.split('.')[0] }, request: { locale: { iso_code: 'en' }, origin: 'http://localhost', design_mode: false }, canonical_url: '/', page_title: 'Rano Europe', current_page: 1, ...extra,
  };
  Object.assign(engine.options.globals, { settings, collections, cart, routes: scope.routes, shop: scope.shop, localization: scope.localization });
  const body = extra.policy_html ?? (await Promise.all(t.order.map((id) => renderSection(buildSection(id, t.sections[id]), scope)))).join('');
  return engine.parseAndRender(read('layout/theme.liquid'), { ...scope, content_for_layout: body, content_for_header: '' });
}

// ---------- static build ----------
const BANNER = `<div style="position:fixed;left:12px;bottom:12px;z-index:60;background:#151514;color:#fff;font:500 12px/1.3 Geist,sans-serif;padding:8px 12px;border-radius:4px;pointer-events:none">Preview. Winkelmand en checkout werken pas in Shopify.</div>
<script>document.addEventListener('submit',e=>{if(e.target.matches('form.loc')){e.preventDefault();const s=e.submitter;if(s){localStorage.setItem('rano-loc-'+s.name,JSON.stringify({v:s.value,html:(s.querySelector('span')||s).outerHTML,img:(s.querySelector('img')||{}).outerHTML||''}));const l=e.target.querySelector('[data-loc-lang]');if(s.name==='country_code'&&l&&!l.disabled){const b2=[...document.querySelectorAll('button[name=language_code]')].find(x=>x.value===l.value);if(b2)localStorage.setItem('rano-loc-language_code',JSON.stringify({v:b2.value,html:'<span>'+b2.textContent.trim()+'</span>'}))}location.reload()}return}});(()=>{for(const n of ['country_code','language_code']){const d=JSON.parse(localStorage.getItem('rano-loc-'+n)||'null');if(!d)continue;document.querySelectorAll('button[name='+n+']').forEach(x=>x.toggleAttribute('aria-current',x.value===d.v));if(n==='language_code')continue;document.querySelectorAll('details[data-loc]').forEach(dd=>{if(!dd.querySelector('button[name='+n+']'))return;const sm=dd.querySelector('summary');const sp=sm.querySelector('span');const h=document.createElement('div');h.innerHTML=d.html;sp.textContent=h.textContent.trim();if(d.img){const im=sm.querySelector('img');if(im){h.innerHTML=d.img;im.replaceWith(h.firstChild)}}})}})();</script><script>document.addEventListener('submit',e=>{if(e.target.closest('[data-add-form]')){e.preventDefault();e.stopImmediatePropagation();alert('Preview: toevoegen aan winkelmand werkt pas in Shopify.')}},true)</script>`;
const rebase = (html) => html.replace(/(href|src|poster|action)="\/(?!\/)/g, `$1="${BASE}`).replace(/"root":"\/"|root: "\/"/g, (m) => m.replace('/', BASE)).replace('</body>', BANNER + '</body>');
const policyHtml = (title, h) => `<div class="shopify-policy__container"><div class="shopify-policy__title"><h1>${title}</h1></div><div class="shopify-policy__body"><div class="rte">${fs.readFileSync(path.join(THEME, 'policies', h + '.html'), 'utf8')}</div></div></div>`;
const pages = {
  '': () => page('index'),
  'pages/about-us': () => page('page.about', { page: { title: 'About us' } }),
  'pages/contact': () => page('page.contact', { page: { title: 'Contact' } }),
  'pages/contact-form': () => page('page.contact-form', { page: { title: 'Contact us' } }),
  'cart': () => page('cart'),
  'policies/shipping-policy': () => page('page', { policy_html: policyHtml('Shipping Policy', 'shipping-policy') }),
  'policies/refund-policy': () => page('page', { policy_html: policyHtml('Return &amp; Refund Policy', 'refund-policy') }),
  'policies/privacy-policy': () => page('page', { policy_html: policyHtml('Privacy Policy', 'privacy-policy') }),
  'policies/terms-of-service': () => page('page', { policy_html: policyHtml('Terms of Service', 'terms-of-service') }),
  'policies/contact-information': () => page('page', { policy_html: policyHtml('Contact Information', 'contact-information') }),
  'pages/track-order': () => page('page.track-order', { page: { title: 'Track my order' } }),
  'pages/partnerships': () => page('page.partnerships', { page: { title: 'Partnerships & Ambassadors' } }),
  'pages/reseller': () => page('page.reseller', { page: { title: 'Become a reseller' } }),
  'pages/corporate-gifting': () => page('page.corporate-gifting', { page: { title: 'Corporate Gifting' } }),
  'pages/craftsmanship': () => page('page.craftsmanship', { page: { title: 'Craftsmanship' } }),
  'search': () => page('search', { search: { performed: false } }),
  ...Object.fromEntries(products.map((p) => [`products/${p.handle}`, () => page('product', { product: p, page_title: p.title })])),
  ...Object.fromEntries(Object.values(collections).map((c) => [`collections/${c.handle}`, () => page('collection', { collection: c })])),
};
fs.rmSync(OUT, { recursive: true, force: true });
for (const [route, render] of Object.entries(pages)) {
  const dir = path.join(OUT, route); fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), rebase(await render()));
}
fs.cpSync(path.join(THEME, 'assets'), path.join(OUT, 'assets'), { recursive: true });
fs.cpSync(path.join(THEME, 'preview/img'), path.join(OUT, 'img'), { recursive: true });
if (fs.existsSync(path.join(THEME, 'preview/models'))) fs.cpSync(path.join(THEME, 'preview/models'), path.join(OUT, 'models'), { recursive: true });
fs.writeFileSync(path.join(OUT, '.nojekyll'), '');
fs.mkdirSync(path.join(OUT, 'account'), { recursive: true });
fs.writeFileSync(path.join(OUT, 'account/index.html'), fs.readFileSync(path.join(THEME, 'preview/account.html'), 'utf8').replaceAll('BASE/', BASE));
fs.copyFileSync(path.join(OUT, 'index.html'), path.join(OUT, '404.html'));
console.log(`built ${Object.keys(pages).length} pages -> _site (base ${BASE})`);
