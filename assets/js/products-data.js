/* BeyondSure – Wellness store data, shared by shop.html and product.html
   ----------------------------------------------------------------------
   PRODUCTS works like a dummy API response: every page reads from this
   one array, so swapping it for a real fetch() later only changes this file.

   Real data (from the live store screenshots):
     - Livnora Liver Wellness Syrup  (name, brand, category, price, MRP)
     - Keshmira Herbal Hair Oil      (name, brand, category, price,
                                      description, key benefits)
     - Payment & Security note
   Everything marked `sample: true` (or "SAMPLE" in a comment) is DUMMY
   content – confirm or replace it before going live.

   Product images: `image` is a live photo URL. The current photos are
   free stock photos from Unsplash (unsplash.com/license – free to use,
   no attribution required) and are PLACEHOLDERS – swap them for real
   product photos. If a photo fails to load, or a product has no `image`,
   a themed pack illustration is drawn from `art` instead.
*/
(function () {
  'use strict';

  // Unsplash photo by id, square-cropped for product tiles
  const photo = (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=800&h=800&q=75`;

  const PRODUCTS = [
    /* ---------------- real products ---------------- */
    {
      id: 'livnora-liver-wellness-syrup', image: photo('1608571423902-eed4a5ad8108'),
      sku: 'LIV001',
      name: 'Livnora Liver Wellness Syrup',
      brand: 'Beyondsure',
      category: 'Liver Care',
      price: 251.16, mrp: 299, inStock: true,
      featured: 1, addedOn: '2026-10-28',
      rating: 0, reviews: 0,
      size: '225 ml',
      art: { shape: 'syrup', color: '#c0392b', label: 'Livnora', sub: 'Liver Wellness Syrup' },
      // SAMPLE text below – the live page did not show this product's description
      short: 'An Ayurvedic liver tonic made with traditionally used herbs to support everyday liver wellness and digestion.',
      description: [
        'Livnora Liver Wellness Syrup is an Ayurvedic tonic prepared with herbs that have traditionally been used to support liver function and healthy digestion.',
        'Take it as part of a balanced diet and an active lifestyle. Consult a BeyondSure doctor if you have an existing liver condition.'
      ],
      benefits: [
        'Liver Support: Made with herbs traditionally used to support normal liver function.',
        'Healthy Digestion: Helps maintain appetite and comfortable digestion.',
        'Everyday Wellness: A simple daily tonic for overall well-being.'
      ],
      sample: true
    },
    {
      id: 'keshmira-herbal-hair-oil', image: photo('1617897903246-719242758050'),
      sku: 'HIR001',
      name: 'Keshmira Herbal Hair Oil',
      brand: 'Shrigoda Healthcare',
      category: 'Hair Care',
      price: 299, mrp: 299, inStock: true,
      featured: 2, addedOn: '2026-11-04',
      rating: 0, reviews: 0,
      size: '100 ml',
      art: { shape: 'oil', color: '#0f8f80', label: 'Keshmira', sub: 'Herbal Hair Oil' },
      short: 'Keshmira Herbal Hair Oil is a premium Ayurvedic herbal hair oil specially formulated with the goodness of traditionally valued herbs to provide complete nourishment and care for the hair and scalp. Its carefully selected herbal blend helps maintain healthy hair roots, improve hair texture and support naturally strong, smooth and lustrous-looking hair.',
      description: [
        'Keshmira Herbal Hair Oil is a premium Ayurvedic herbal hair oil specially formulated with the goodness of traditionally valued herbs to provide complete nourishment and care for the hair and scalp. Its carefully selected herbal blend helps maintain healthy hair roots, improve hair texture and support naturally strong, smooth and lustrous-looking hair.',
        'Enriched with traditional ingredients such as Bhringraj, Amla, Bringadi, Jatamansi, Hibiscus, Neem and Methi, this herbal hair oil is designed to nourish the scalp and hair from root to tip. These ingredients have been traditionally used in Ayurveda for their nourishing, conditioning and scalp-care properties.'
      ],
      benefits: [
        'Nourishes Hair & Scalp: Helps provide essential herbal nourishment to the scalp and hair.',
        'Strengthens Hair Roots: Regular scalp massage helps nourish the roots and maintain stronger, healthier-looking hair.',
        'Helps Reduce Hair Fall: Supports overall scalp and hair health, helping reduce hair breakage and excessive hair fall associated with dryness and weakness.',
        'Helps Control Dandruff: Herbal ingredients such as Neem and Methi are traditionally valued for maintaining a clean and healthy scalp.',
        'Improves Hair Texture: Helps make hair feel softer, smoother and more manageable.',
        'Scalp Care: Provides a soothing and nourishing oil massage for dry and tired scalp.'
      ],
      // SAMPLE specs / usage / care
      specs: [['Key ingredients', 'Bhringraj, Amla, Bringadi, Jatamansi, Hibiscus, Neem, Methi'], ['Hair type', 'All hair types']],
      sample: false
    },

    /* ---------------- DUMMY products (sample: true) ---------------- */
    {
      id: 'immuno-plus-herbal-tablets', image: photo('1587854692152-cbe660dbde88'), sku: 'IMMS01' /* SAMPLE */, name: 'Immuno Plus Herbal Tablets', brand: 'Beyondsure', category: 'Immunity',
      price: 349, mrp: 399, inStock: true, featured: 3, addedOn: '2026-11-12', rating: 0, reviews: 0, size: '60 tablets',
      art: { shape: 'capsules', color: '#1964ee', label: 'Immuno+', sub: 'Herbal Tablets' },
      short: 'A daily herbal blend with Giloy, Tulsi and Amla to support natural immunity.',
      benefits: ['Immunity Support: Herbs traditionally used to support the body’s natural defences.', 'Daily Vitality: Helps you feel active through the day.'],
      sample: true
    },
    {
      id: 'digestiva-herbal-churna', image: photo('1596040033229-a9821ebd058d'), sku: 'DIGS02' /* SAMPLE */, name: 'Digestiva Herbal Churna', brand: 'Shrigoda Healthcare', category: 'Digestive Care',
      price: 199, mrp: 199, inStock: true, featured: 4, addedOn: '2026-10-15', rating: 0, reviews: 0, size: '100 g',
      art: { shape: 'jar', color: '#d97706', label: 'Digestiva', sub: 'Herbal Churna' },
      short: 'A classic after-meal churna with Ajwain, Saunf and Hing for comfortable digestion.',
      benefits: ['Comfortable Digestion: Helps ease occasional heaviness after meals.', 'Natural Taste: Pleasant herbal flavour, easy to take with warm water.'],
      sample: true
    },
    {
      id: 'glowveda-aloe-face-gel', image: photo('1509423350716-97f9360b4e09'), sku: 'GLOS03' /* SAMPLE */, name: 'Glowveda Aloe Face Gel', brand: 'Beyondsure', category: 'Skin Care',
      price: 225, mrp: 275, inStock: true, featured: 5, addedOn: '2026-11-16', rating: 0, reviews: 0, size: '100 g',
      art: { shape: 'tube', color: '#16a34a', label: 'Glowveda', sub: 'Aloe Face Gel' },
      short: 'A light aloe vera and cucumber gel that soothes and hydrates everyday skin.',
      benefits: ['Soothes Skin: Cooling aloe vera calms dry, tired skin.', 'Light Hydration: Non-sticky gel suitable for daily use.'],
      sample: true
    },
    {
      id: 'orthoease-joint-care-oil', image: photo('1612817288484-6f916006741a'), sku: 'ORTS04' /* SAMPLE */, name: 'OrthoEase Joint Care Oil', brand: 'Shrigoda Healthcare', category: 'Joint Care',
      price: 320, mrp: 360, inStock: false, featured: 6, addedOn: '2026-09-30', rating: 0, reviews: 0, size: '100 ml',
      art: { shape: 'oil', color: '#7c3aed', label: 'OrthoEase', sub: 'Joint Care Oil' },
      short: 'A warming massage oil with Mahanarayan and Nirgundi for stiff joints and muscles.',
      benefits: ['Warming Massage: Helps relax stiff joints and tired muscles.', 'Easy Movement: Supports comfortable everyday movement.'],
      sample: true
    },
    {
      id: 'glucocare-karela-jamun-juice', image: photo('1622597467836-f3285f2131b8'), sku: 'GLUS05' /* SAMPLE */, name: 'Glucocare Karela Jamun Juice', brand: 'Beyondsure', category: 'Diabetes Care',
      price: 289, mrp: 349, inStock: true, featured: 7, addedOn: '2026-11-08', rating: 0, reviews: 0, size: '500 ml',
      art: { shape: 'syrup', color: '#4d7c0f', label: 'Glucocare', sub: 'Karela Jamun Juice' },
      short: 'Karela and Jamun juice, traditionally used to support healthy sugar metabolism.',
      benefits: ['Sugar Wellness: Herbs traditionally used to support healthy glucose levels.', 'No Added Sugar: Suitable as part of a diabetic-friendly routine.'],
      sample: true
    },
    {
      id: 'triphala-herbal-tablets', image: photo('1615485500704-8e990f9900f7'), sku: 'TRIS06' /* SAMPLE */, name: 'Triphala Herbal Tablets', brand: 'Shrigoda Healthcare', category: 'Digestive Care',
      price: 179, mrp: 199, inStock: true, featured: 8, addedOn: '2026-10-05', rating: 0, reviews: 0, size: '60 tablets',
      art: { shape: 'box', color: '#b45309', label: 'Triphala', sub: 'Herbal Tablets' },
      short: 'Amla, Haritaki and Bibhitaki in an easy tablet for gentle daily cleansing.',
      benefits: ['Gentle Cleansing: Traditionally used to support regular bowel movement.', 'Rich in Amla: A natural source of Vitamin C.'],
      sample: true
    },
    {
      id: 'ashwagandha-calm-capsules', image: photo('1628771065518-0d82f1938462'), sku: 'ASHS07' /* SAMPLE */, name: 'Ashwagandha Calm Capsules', brand: 'Beyondsure', category: 'Stress & Sleep',
      price: 399, mrp: 499, inStock: true, featured: 9, addedOn: '2026-11-14', rating: 0, reviews: 0, size: '60 capsules',
      art: { shape: 'capsules', color: '#0b1b3f', label: 'Ashwagandha', sub: 'Calm Capsules' },
      short: 'KSM Ashwagandha root extract to help you manage everyday stress and sleep better.',
      benefits: ['Stress Balance: Traditionally used to help the body adapt to stress.', 'Restful Sleep: Supports a calmer mind at bedtime.'],
      sample: true
    },
    {
      id: 'keshmira-anti-dandruff-shampoo', image: photo('1631729371254-42c2892f0e6e'), sku: 'KESS08' /* SAMPLE */, name: 'Keshmira Anti-Dandruff Shampoo', brand: 'Shrigoda Healthcare', category: 'Hair Care',
      price: 249, mrp: 249, inStock: true, featured: 10, addedOn: '2026-11-17', rating: 0, reviews: 0, size: '200 ml',
      art: { shape: 'tube', color: '#0e7490', label: 'Keshmira', sub: 'Anti-Dandruff Shampoo' },
      short: 'A mild herbal shampoo with Neem and Shikakai for a clean, flake-free scalp.',
      benefits: ['Clean Scalp: Neem and Shikakai help keep the scalp clean.', 'Gentle Wash: Mild enough for regular use.'],
      sample: true
    }
  ];

  /* SAMPLE defaults used when a product has no text of its own */
  const DEFAULTS = {
    howToUse: ['Use as directed on the pack or by your physician.', 'Store the pack closed after every use.'],
    care: ['Store in a cool, dry place away from direct sunlight.', 'Keep out of reach of children.', 'For external / oral use only as labelled.'],
    shipping: [
      'Free delivery on orders above ₹499; a small delivery fee applies below that.',
      'Orders are usually dispatched within 1–2 working days and delivered in 3–7 working days.',
      'Unopened products can be returned within 7 days of delivery.'
    ]
  };

  // Real text from the live product page
  const PAYMENT_NOTE = 'We ensure secure processing of your payment information and do not retain or have any access to your credit card details.';

  const CATEGORIES = [...new Set(PRODUCTS.map((p) => p.category))].sort();
  const BRANDS = [...new Set(PRODUCTS.map((p) => p.brand))].sort();

  const productUrl = (p) => `product.html?id=${encodeURIComponent(p.id)}`;
  const discount = (p) => (p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0);
  const inr = (n) => '₹' + Number(n).toLocaleString('en-IN');

  /* ------------------------------------------------------------------
     CART (kept in this browser only – localStorage)
     ------------------------------------------------------------------ */
  const store = {
    get(key, fallback) { try { const v = localStorage.getItem(key); return v === null ? fallback : JSON.parse(v); } catch (e) { return fallback; } },
    set(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { /* storage unavailable */ } }
  };
  /* Maximum quantity per product in the basket.
     No limit for now (Infinity). To add one later, set a number here, e.g. MAX_QTY = 10 –
     the product page and the basket both use this one setting. */
  const MAX_QTY = Infinity;
  const cart = {
    get: () => store.get('bs_cart', {}),
    add(id, qty = 1) { const c = cart.get(); c[id] = Math.min(MAX_QTY, (c[id] || 0) + qty); store.set('bs_cart', c); cart.paint(); },
    set(id, qty) { const c = cart.get(); if (qty > 0) c[id] = Math.min(MAX_QTY, qty); else delete c[id]; store.set('bs_cart', c); cart.paint(); },
    remove(id) { cart.set(id, 0); },
    count: () => Object.values(cart.get()).reduce((a, b) => a + b, 0),
    // updates every element marked data-cart-count (the badge on the basket icon)
    paint() {
      const n = cart.count();
      document.querySelectorAll('[data-cart-count]').forEach((el) => { el.textContent = n; el.hidden = n === 0; });
      document.querySelectorAll('[data-cart-link]').forEach((el) => el.setAttribute('aria-label', n ? `Basket, ${n} item${n === 1 ? '' : 's'}` : 'Basket, empty'));
    }
  };
  /* Basket totals. Prices already include GST at 12% (worked out from the live
     basket: ₹85.86 GST on ₹801.32, and ₹491.21 taxable + ₹58.95 tax = ₹550.16). */
  const GST_RATE = 0.12;
  const round2 = (n) => Math.round(n * 100) / 100;
  function cartTotals() {
    const c = cart.get();
    const lines = Object.entries(c)
      .map(([id, qty]) => ({ p: PRODUCTS.find((x) => x.id === id), qty }))
      .filter((l) => l.p && l.qty > 0);
    const items = lines.reduce((a, l) => a + l.qty, 0);
    const mrp = round2(lines.reduce((a, l) => a + l.p.mrp * l.qty, 0));
    const total = round2(lines.reduce((a, l) => a + l.p.price * l.qty, 0));
    const taxable = round2(total / (1 + GST_RATE));
    return { lines, items, mrp, discount: round2(mrp - total), total, taxable, tax: round2(total - taxable) };
  }

  const favs = {
    get: () => store.get('bs_fav_products', []),
    toggle(id) { const f = favs.get(); const on = !f.includes(id); store.set('bs_fav_products', on ? f.concat(id) : f.filter((x) => x !== id)); return on; },
    has: (id) => favs.get().includes(id)
  };

  /* ------------------------------------------------------------------
     PACK ILLUSTRATION (inline SVG, drawn from product.art)
     ------------------------------------------------------------------ */
  let artSeq = 0;
  const shade = (hex, amt) => { // amt < 0 darker, > 0 lighter
    const n = parseInt(hex.slice(1), 16);
    const f = (c) => Math.max(0, Math.min(255, Math.round(amt < 0 ? c * (1 + amt) : c + (255 - c) * amt)));
    return '#' + [n >> 16, (n >> 8) & 255, n & 255].map((c) => f(c).toString(16).padStart(2, '0')).join('');
  };
  const escTxt = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function productArt(p) {
    const a = p.art || { shape: 'box', color: '#1964ee', label: p.name.split(' ')[0], sub: '' };
    const id = `pa${++artSeq}`;
    const c = a.color, dk = shade(c, -0.35), lt = shade(c, 0.85);
    // label text sized to fit its width
    const txt = (x, y, w, label, sub, fill = '#101828', subFill = '#5b6474') => {
      const fs = Math.min(17, (w - 10) / (label.length * 0.62));
      const ss = Math.min(9.5, (w - 8) / (sub.length * 0.52));
      return `<text x="${x}" y="${y}" text-anchor="middle" font-family="'Plus Jakarta Sans',sans-serif" font-weight="800" font-size="${fs.toFixed(1)}" fill="${fill}">${escTxt(label)}</text>` +
        (sub ? `<text x="${x}" y="${y + 15}" text-anchor="middle" font-family="Figtree,sans-serif" font-weight="600" font-size="${ss.toFixed(1)}" fill="${subFill}">${escTxt(sub)}</text>` : '');
    };
    const leaf = (x, y, r, rot) => `<g transform="translate(${x} ${y}) rotate(${rot})"><path d="M0 0 C ${r * 0.5} ${-r * 0.6}, ${r * 1.4} ${-r * 0.5}, ${r * 1.8} 0 C ${r * 1.4} ${r * 0.5}, ${r * 0.5} ${r * 0.6}, 0 0 Z" fill="#5fae7d"/><path d="M0 0 L ${r * 1.7} 0" stroke="#3f8a5c" stroke-width="1.5"/></g>`;

    let pack = '';
    if (a.shape === 'syrup') {
      pack = `<rect x="172" y="88" width="56" height="34" rx="7" fill="#1f2937"/><rect x="172" y="112" width="56" height="6" fill="#111827"/>
        <rect x="181" y="120" width="38" height="28" fill="${dk}"/>
        <rect x="138" y="144" width="124" height="194" rx="36" fill="url(#${id}g)"/>
        <rect x="147" y="196" width="106" height="104" rx="10" fill="#fff"/><rect x="147" y="196" width="106" height="22" rx="10" fill="${c}"/><rect x="147" y="208" width="106" height="10" fill="${c}"/>
        ${txt(200, 252, 106, a.label, a.sub)}
        <rect x="150" y="158" width="9" height="150" rx="4.5" fill="#fff" opacity=".22"/>`;
    } else if (a.shape === 'oil') {
      pack = `<rect x="182" y="74" width="36" height="46" rx="9" fill="#1f2937"/><rect x="186" y="66" width="28" height="14" rx="5" fill="#374151"/>
        <rect x="187" y="118" width="26" height="22" fill="${dk}"/>
        <rect x="152" y="136" width="96" height="202" rx="28" fill="url(#${id}g)"/>
        <rect x="159" y="186" width="82" height="112" rx="9" fill="#fff"/><rect x="159" y="186" width="82" height="20" rx="9" fill="${c}"/><rect x="159" y="196" width="82" height="10" fill="${c}"/>
        ${txt(200, 240, 82, a.label, a.sub)}
        <rect x="161" y="148" width="8" height="160" rx="4" fill="#fff" opacity=".22"/>`;
    } else if (a.shape === 'jar') {
      pack = `<rect x="126" y="166" width="148" height="44" rx="11" fill="${c}"/>
        ${[0, 1, 2, 3, 4, 5, 6].map((i) => `<rect x="${140 + i * 19}" y="172" width="4" height="32" rx="2" fill="${dk}" opacity=".35"/>`).join('')}
        <rect x="118" y="204" width="164" height="134" rx="28" fill="#fff" stroke="#e2e7f1" stroke-width="2"/>
        <rect x="118" y="234" width="164" height="74" fill="${lt}"/><rect x="118" y="234" width="6" height="74" fill="${c}"/><rect x="276" y="234" width="6" height="74" fill="${c}"/>
        ${txt(200, 270, 150, a.label, a.sub)}`;
    } else if (a.shape === 'box') {
      pack = `<path d="M128 150 L164 128 L288 128 L252 150 Z" fill="${shade(c, 0.25)}"/>
        <path d="M252 150 L288 128 L288 312 L252 336 Z" fill="${dk}"/>
        <rect x="128" y="150" width="124" height="186" fill="url(#${id}g)"/>
        <rect x="138" y="204" width="104" height="86" rx="8" fill="#fff"/>
        ${txt(190, 242, 104, a.label, a.sub)}
        <circle cx="190" cy="176" r="12" fill="#fff" opacity=".25"/>`;
    } else if (a.shape === 'tube') {
      pack = `<rect x="140" y="96" width="120" height="16" rx="4" fill="${dk}"/>
        <path d="M142 110 H258 L242 300 H158 Z" fill="#fff" stroke="#e2e7f1" stroke-width="2"/>
        <path d="M146 150 H254 L247 236 H153 Z" fill="${lt}"/><path d="M146 150 H254 L252 168 H148 Z" fill="${c}"/>
        ${txt(200, 200, 100, a.label, a.sub)}
        <rect x="170" y="298" width="60" height="42" rx="9" fill="${c}"/><rect x="170" y="298" width="60" height="8" fill="${dk}" opacity=".5"/>`;
    } else { // capsules
      pack = `<rect x="148" y="104" width="104" height="44" rx="11" fill="${c}"/>
        ${[0, 1, 2, 3, 4].map((i) => `<rect x="${160 + i * 19}" y="110" width="4" height="32" rx="2" fill="${dk}" opacity=".35"/>`).join('')}
        <rect x="138" y="142" width="124" height="196" rx="28" fill="#fff" stroke="#e2e7f1" stroke-width="2"/>
        <rect x="138" y="196" width="124" height="98" fill="${c}"/>
        ${txt(200, 240, 116, a.label, a.sub, '#fff', 'rgba(255,255,255,.85)')}
        <g transform="translate(262 318) rotate(-28)"><rect x="-26" y="-10" width="52" height="20" rx="10" fill="#fff" stroke="#e2e7f1"/><rect x="0" y="-10" width="26" height="20" rx="10" fill="${c}"/><rect x="0" y="-10" width="10" height="20" fill="${c}"/></g>
        <g transform="translate(118 326) rotate(18)"><rect x="-22" y="-9" width="44" height="18" rx="9" fill="#fff" stroke="#e2e7f1"/><rect x="0" y="-9" width="22" height="18" rx="9" fill="${shade(c, 0.35)}"/><rect x="0" y="-9" width="8" height="18" fill="${shade(c, 0.35)}"/></g>`;
    }

    return `<svg class="bys-prod-art" viewBox="0 0 400 400" role="img" aria-label="${escTxt(p.name)} pack" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="${id}bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6f9ff"/><stop offset="1" stop-color="${lt}"/></linearGradient>
        <linearGradient id="${id}g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${shade(c, 0.12)}"/><stop offset=".55" stop-color="${c}"/><stop offset="1" stop-color="${dk}"/></linearGradient>
      </defs>
      <rect width="400" height="400" fill="url(#${id}bg)"/>
      <circle cx="200" cy="222" r="136" fill="${c}" opacity=".08"/>
      <circle cx="318" cy="92" r="26" fill="${c}" opacity=".07"/>
      <ellipse cx="200" cy="342" rx="104" ry="12" fill="#0b1b3f" opacity=".1"/>
      ${leaf(86, 334, 34, -38)}${leaf(310, 336, 30, -146)}${leaf(96, 322, 22, -78)}
      ${pack}
    </svg>`;
  }

  /* live photo if one is set, otherwise the illustration.
     `sizes` = how wide the photo is shown; the browser then downloads only the size it needs
     (Unsplash photos are offered at several widths via srcset). */
  const PHOTO_WIDTHS = [200, 400, 600, 800, 1000];
  const atWidth = (url, w) => url.replace(/([?&])w=\d+&h=\d+/, `$1w=${w}&h=${w}`);
  const productImage = (p, sizes = '(max-width: 767.98px) 50vw, 330px', eager = false) => {
    if (!p.image) return productArt(p);
    const resizable = /images\.unsplash\.com/.test(p.image) && /[?&]w=\d+&h=\d+/.test(p.image);
    const srcset = resizable ? ` srcset="${PHOTO_WIDTHS.map((w) => `${escTxt(atWidth(p.image, w))} ${w}w`).join(', ')}" sizes="${sizes}"` : '';
    const load = eager ? 'loading="eager" fetchpriority="high"' : 'loading="lazy"';
    return `<img class="bys-prod-photo" src="${escTxt(resizable ? atWidth(p.image, 600) : p.image)}"${srcset} alt="${escTxt(p.name)}" ${load} decoding="async" data-pid="${escTxt(p.id)}">`;
  };

  // if a photo fails to load, swap in the illustration for that product
  document.addEventListener('error', (e) => {
    const img = e.target;
    if (!(img instanceof HTMLImageElement) || !img.classList.contains('bys-prod-photo')) return;
    const p = PRODUCTS.find((x) => x.id === img.dataset.pid);
    if (p) img.outerHTML = productArt(p);
  }, true);

  /* ------------------------------------------------------------------
     PRODUCT CARD – one template for the shop grid and "You may also like"
     ------------------------------------------------------------------ */
  function productCard(p, i = 0) {
    const off = discount(p);
    const fav = favs.has(p.id);
    const url = productUrl(p);
    return `
      <article class="sp-card${p.inStock ? '' : ' is-out'}" style="animation-delay:${i * 60}ms">
        <a class="sp-media" href="${url}" tabindex="-1" aria-hidden="true">
          ${productImage(p)}
          ${off ? `<span class="sp-off">${off}% off</span>` : ''}
          ${p.inStock ? '' : '<span class="sp-unavail"><i class="bi bi-exclamation-triangle"></i> Temporarily unavailable</span>'}
        </a>
        <button type="button" class="sp-fav" data-fav="${p.id}" aria-pressed="${fav}" aria-label="${fav ? 'Remove from' : 'Save to'} wishlist: ${escTxt(p.name)}"><i class="bi bi-heart"></i></button>
        <div class="sp-body">
          <span class="sp-brand">${escTxt(p.brand)}</span>
          <h3 class="sp-name"><a href="${url}">${escTxt(p.name)}</a></h3>
          <div class="sp-foot">
            <div class="sp-price"><strong>${inr(p.price)}</strong>${off ? `<s>${inr(p.mrp)}</s>` : ''}</div>
            ${p.inStock
              ? `<button type="button" class="sp-add" data-add="${p.id}" aria-label="Add ${escTxt(p.name)} to cart"><i class="bi bi-bag-plus"></i><span>Add</span></button>`
              : '<span class="sp-add is-disabled" aria-hidden="true"><i class="bi bi-bag-x"></i><span>Sold out</span></span>'}
          </div>
        </div>
      </article>`;
  }

  window.BS_SHOP = { PRODUCTS, CATEGORIES, BRANDS, DEFAULTS, PAYMENT_NOTE, GST_RATE, MAX_QTY, productUrl, discount, inr, cart, cartTotals, favs, productImage, productArt, productCard };
})();
