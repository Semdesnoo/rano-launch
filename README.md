# Rano Launch - single-product Shopify theme

OS 2.0 theme for [ranoeurope.com](https://ranoeurope.com), layout modelled on doreandrose.com.

**Live preview:** https://semdesnoo.github.io/rano-launch/

**Shopify zip:** https://github.com/Semdesnoo/rano-launch/releases/tag/latest (`rano-launch.zip`)

## Workflow
1. Edit files on GitHub (pencil icon) or locally, commit to `main`.
2. GitHub Actions rebuilds the preview site and the Shopify zip (about 1 minute, see the *Actions* tab).
3. Happy with the preview? Download the zip from *Releases* and upload it in Shopify.

## Where to change what
| What | File |
|---|---|
| Homepage texts, images, videos, section order | `templates/index.json` |
| Product page tabs (care, shipping) | `templates/product.json` |
| About / Contact page | `templates/page.about.json`, `templates/page.contact.json` |
| Announcement bar, header | `sections/header-group.json` |
| Footer texts | `sections/footer.liquid` (schema defaults) |
| Colours, logo width, cart message | `config/settings_data.json` |
| Photos & videos | `assets/` (upload a file with the same name to replace it) |
| Styling | `assets/rano.css` |

Preview-only (not in the zip): `preview/` renders the theme with the real Rano products; product photos live in `preview/img/` because in Shopify they come from the store itself. Cart/checkout only work in Shopify.

Local preview: `npm install && npm run preview`, then serve `_site/` with any static server.

## Shopify install
Upload the zip (Online Store > Themes > Add theme > Upload zip), then:
- Pages: assign template `page.about` to *About us*, `page.contact` to *Contact*.
- Navigation: `main-menu` = Shop All, Bestsellers, About, Contact. Give *Shop All* sub-items with their own sub-items (e.g. By category / By colour / Highlights) to get the mega menu columns; the 4 images are set in the header section. Footer has 3 columns: make menus `footer-company` (Company), `footer` (Customer service) and `footer-shop` (Rano) in Navigation; the preview shows the suggested links. Policy links (`/policies/shipping-policy`, `refund-policy`, `privacy-policy`, `terms-of-service`) are filled from Settings > Policies.
- Settings > Markets / Languages: add countries and languages so the selector in the top bar shows them.
- Customer accounts (Settings > Customer accounts): turn on, then *Customize* > upload `assets/account-banner.png` as logo/banner and set the accent colour to #151514. Shopify hosts the sign-in / create-account page; `preview/account.html` shows how it looks.
- Check shipping/returns copy in `templates/product.json` against the real policy.

## Extra pages and policies (set up once in Shopify)

**Pages** (Online Store > Pages > Add page, choose the template on the right):

| Page title | Handle | Template |
|---|---|---|
| Track my order | `track-order` | `page.track-order` |
| Partnerships & Ambassadors | `partnerships` | `page.partnerships` |
| Become a reseller | `reseller` | `page.reseller` |
| Corporate Gifting | `corporate-gifting` | `page.corporate-gifting` |
| Craftsmanship | `craftsmanship` | `page.craftsmanship` |

Form submissions from the three application pages arrive in the store's contact email, labelled with the form name.

**Policies** (Settings > Policies): copy the text from `policies/*.html` (open the file, copy everything, paste in the editor's `<>` HTML view).
Fill in the placeholders in square brackets first: legal entity name, address, KvK number, VAT number and phone.
These texts follow EU/Dutch consumer law and GDPR but are not legal advice; have them checked once.

**Footer menus**: point *Track my order* to `/pages/track-order`, and Craftsmanship / Partnerships / Reseller / Corporate Gifting to their pages.

## "Complete the set & save" (product page bundle)

The product page offers a matching pouch and card holder (same colour first). Chosen add-ons go into the bag together with the main product, each tagged with the hidden property `_bundle: Rano set`.
The theme only **shows** the set price. To actually charge it, create two automatic discounts in Shopify (Discounts > Create > Amount off products, Automatic):
- *Rano set 10%*: 10% off, minimum quantity of items **2**, applies to all products.
- *Rano set 15%*: 15% off, minimum quantity of items **3**, applies to all products.
Shopify applies the best one. Keep the percentages equal to the product section settings (default 10 / 15).

## Premium look
- Headings use **Bodoni Moda** (self-hosted, SIL OFL), body text Geist.
- Sale badges and struck-through prices are **off** by default (Theme settings > Product cards > *Show sale badges and original prices*). Switch on only during a sale.

## Countries, languages and currencies
- One combined picker (top right + footer): search field, most visited markets first (US, UK, AU, NL, DE), then all other countries A-Z, and EN/NL/DE/FR/IT/ES language chips at the bottom. It lists exactly the countries enabled in Markets; the preview shows the full list of 221 countries (`preview/countries.json`).
- Picking a country also switches to its language when that language is published (NL/BE -> Nederlands, DE/AT/CH -> Deutsch, FR/LU -> Français, IT -> Italiano, ES -> Español, others -> English).
- Theme texts are translated in `locales/` (en, nl, de, fr, it, es).
- In Shopify: **Settings > Markets** add the countries and turn on *local currency* (prices are converted automatically, rounding rules optional). **Settings > Languages** add and publish nl, de, fr, it, es; use the free *Translate & Adapt* app to auto-translate products, pages and section texts.

## Our story page (`page.about`)
Film hero (`atelier.mp4`), craft steps with sticky film (`atelier-hands.mp4`), counting facts, story rows with parallax.
Craftsman footage: free Pexels videos 4452763, 4452751, 4456168, 4452810 (Pexels licence, commercial use allowed, no attribution required). Replace with Rano's own atelier footage when available (section settings > Video).
