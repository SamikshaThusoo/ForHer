/* =====================================================================
   For Her — Diet scanner (borrowed from the nutrition product)
   ---------------------------------------------------------------------
   Front-end flow + mocked data so the experience is real on the prototype.
   Swap the real engine in later by replacing FORHER_FOODS / the lookup in
   resolveScan()/resolveSearch() with API calls — the render layer stays.

   Usage:
     renderScannerEntry(containerEl, { phase, intent })
   Renders the hero entry card and owns its own bottom-sheet flow.

   // DRAFT — mocked nutrition data, pending real scanner integration
   ===================================================================== */
(function (global) {
  'use strict';

  // Per-serving nutrition. cals in kcal; macros in grams. addedSugar flags
  // sugar that isn't naturally occurring (drives the PCOS note).
  // tags: 'packaged' shows in Scan; 'home' shows in Add-a-meal search.
  // DRAFT — mocked values for the prototype.
  var FORHER_FOODS = [
    // -------- Packaged (Scan a snack) --------
    { id: 'maggi',    name: 'Maggi 2-Minute Noodles', brand: 'Nestlé', serving: '1 cake (70 g)', kind: 'packaged',
      cals: 320, protein: 7,  carbs: 45, fat: 12, fibre: 2, sugar: 3, addedSugar: true, sodium: 'High',
      ingredients: ['Refined wheat flour (maida)', 'Palm oil', 'Wheat gluten', 'Salt', 'Thickeners', 'Flavour enhancer (MSG)'] },
    { id: 'bhujia',   name: 'Aloo Bhujia', brand: "Haldiram's", serving: '30 g', kind: 'packaged',
      cals: 165, protein: 3,  carbs: 14, fat: 11, fibre: 1, sugar: 1, addedSugar: false, sodium: 'High',
      ingredients: ['Gram flour (besan)', 'Potato', 'Edible oil', 'Spices', 'Salt'] },
    { id: 'goodday',  name: 'Good Day Cashew Cookies', brand: 'Britannia', serving: '3 biscuits (57 g)', kind: 'packaged',
      cals: 285, protein: 4,  carbs: 36, fat: 14, fibre: 1, sugar: 14, addedSugar: true, sodium: 'Low',
      ingredients: ['Refined wheat flour (maida)', 'Sugar', 'Edible vegetable oil', 'Cashew', 'Invert syrup'] },
    { id: 'lays',     name: 'Classic Salted Chips', brand: "Lay's", serving: '28 g', kind: 'packaged',
      cals: 150, protein: 2,  carbs: 15, fat: 10, fibre: 1, sugar: 0, addedSugar: false, sodium: 'High',
      ingredients: ['Potato', 'Edible vegetable oil', 'Salt'] },
    { id: 'proteinbar', name: 'Multigrain Protein Bar', brand: 'Yoga Bar', serving: '1 bar (60 g)', kind: 'packaged',
      cals: 215, protein: 10, carbs: 24, fat: 8,  fibre: 6, sugar: 8, addedSugar: true, sodium: 'Low',
      ingredients: ['Dates', 'Oats', 'Soy protein', 'Almonds', 'Brown rice crisp', 'Honey'] },
    { id: 'darkchoc', name: 'Dark Chocolate (55%)', brand: 'Amul', serving: '20 g', kind: 'packaged',
      cals: 110, protein: 2,  carbs: 10, fat: 7,  fibre: 2, sugar: 8, addedSugar: true, sodium: 'Low',
      ingredients: ['Cocoa solids', 'Sugar', 'Cocoa butter', 'Milk solids'] },

    // -------- Home meals (Add a meal — search) --------
    { id: 'poha',     name: 'Poha', serving: '1 bowl (~200 g)', kind: 'home',
      cals: 250, protein: 5,  carbs: 42, fat: 7,  fibre: 3, sugar: 2, addedSugar: false,
      ingredients: ['Flattened rice', 'Onion', 'Peanuts', 'Curry leaves', 'Oil'] },
    { id: 'chilla',   name: 'Besan Chilla (2)', serving: '2 pieces', kind: 'home',
      cals: 220, protein: 12, carbs: 24, fat: 8,  fibre: 5, sugar: 2, addedSugar: false,
      ingredients: ['Gram flour (besan)', 'Onion', 'Tomato', 'Spices', 'Oil'] },
    { id: 'dalrice',  name: 'Dal + Rice', serving: '1 plate', kind: 'home',
      cals: 400, protein: 14, carbs: 66, fat: 8,  fibre: 6, sugar: 2, addedSugar: false,
      ingredients: ['Toor dal', 'Rice', 'Ghee', 'Spices'] },
    { id: 'paneer',   name: 'Paneer Sabzi', serving: '1 bowl (~150 g)', kind: 'home',
      cals: 290, protein: 16, carbs: 12, fat: 20, fibre: 3, sugar: 4, addedSugar: false,
      ingredients: ['Paneer', 'Tomato', 'Onion', 'Cream', 'Spices'] },
    { id: 'banana',   name: 'Banana', serving: '1 medium', kind: 'home',
      cals: 105, protein: 1,  carbs: 27, fat: 0,  fibre: 3, sugar: 14, addedSugar: false,
      ingredients: ['Banana'] },
    { id: 'curdoats', name: 'Curd + Oats Bowl', serving: '1 bowl', kind: 'home',
      cals: 230, protein: 11, carbs: 30, fat: 6,  fibre: 5, sugar: 6, addedSugar: false,
      ingredients: ['Rolled oats', 'Curd', 'Seeds', 'Fruit'] }
  ];

  function packaged() { return FORHER_FOODS.filter(function (f) { return f.kind === 'packaged'; }); }
  function homeFoods() { return FORHER_FOODS.filter(function (f) { return f.kind === 'home'; }); }

  function searchFoods(q) {
    q = (q || '').trim().toLowerCase();
    if (!q) return homeFoods().slice(0, 5);
    return FORHER_FOODS.filter(function (f) {
      return f.name.toLowerCase().indexOf(q) !== -1 || (f.brand && f.brand.toLowerCase().indexOf(q) !== -1);
    }).slice(0, 6);
  }

  // ---- Phase / PCOS-aware verdict — this is what makes it a *women's* scanner.
  // Returns { tone: 'good'|'watch'|'mixed', headline, note }.
  function verdictFor(food, phase, intent) {
    var pcos = intent === 'pcos';
    var proteinFibre = food.protein + food.fibre;
    var sugary = food.addedSugar && food.sugar >= 8;
    var refined = food.ingredients.some(function (i) { return /maida|refined wheat/i.test(i); });

    var tone, headline, note;
    if (sugary) {
      tone = 'watch';
      headline = 'High in added sugar';
      note = pcos
        ? 'Added sugar spikes insulin, which PCOS is sensitive to. Pairing it with protein or picking a lower-sugar option keeps things steadier.'
        : 'Quick sugar can leave you dipping soon after. Pairing it with protein or fibre softens the spike.';
      if (phase === 'luteal') note += ' Luteal cravings are real — a few squares of dark chocolate beat a sugary biscuit.';
    } else if (proteinFibre >= 14) {
      tone = 'good';
      headline = 'Steady protein & fibre';
      note = pcos
        ? 'Good protein and fibre slow sugar release — exactly what helps keep PCOS-related insulin in check.'
        : 'Protein and fibre here keep your blood sugar steady and you fuller for longer.';
      if (phase === 'menstrual') note += ' Iron-rich choices this week help replenish what your period takes.';
    } else if (refined) {
      tone = 'mixed';
      headline = 'Mostly refined carbs';
      note = pcos
        ? 'Refined flour digests fast and nudges blood sugar up. A side of protein or veg helps balance it for PCOS.'
        : 'Refined flour digests fast — adding some protein or veg alongside keeps energy even.';
    } else {
      tone = 'mixed';
      headline = 'Okay in moderation';
      note = 'Fine as an occasional snack. Keep an eye on portion and how it sits with your energy.';
    }
    return { tone: tone, headline: headline, note: note };
  }

  function injectStylesOnce() {
    if (document.getElementById('fhs-styles')) return;
    var css = '' +
      // ---- Entry hero card ----
      '.fhs-entry{position:relative;overflow:hidden;border-radius:20px;padding:16px 16px 14px;margin-bottom:16px;' +
        'background:linear-gradient(135deg,#5B2A4A 0%,#7A3A62 55%,#B5687E 100%);color:#fff;box-shadow:0 10px 26px rgba(91,42,74,.28)}' +
      '.fhs-entry::after{content:"";position:absolute;right:-30px;top:-30px;width:130px;height:130px;border-radius:50%;' +
        'background:radial-gradient(circle,rgba(255,255,255,.18) 0%,rgba(255,255,255,0) 70%)}' +
      '.fhs-entry-eyebrow{font-size:10px;font-weight:800;letter-spacing:.7px;text-transform:uppercase;opacity:.82;display:flex;align-items:center;gap:6px}' +
      '.fhs-entry-eyebrow .fhs-spark{width:15px;height:15px}' +
      '.fhs-entry-title{font-size:18px;font-weight:800;line-height:1.2;margin:7px 0 3px}' +
      '.fhs-entry-sub{font-size:11.5px;line-height:1.45;opacity:.9;max-width:90%}' +
      '.fhs-entry-actions{display:flex;gap:9px;margin-top:13px}' +
      '.fhs-act{flex:1;display:flex;align-items:center;justify-content:center;gap:7px;border:none;cursor:pointer;font-family:inherit;' +
        'font-size:12.5px;font-weight:700;border-radius:13px;padding:11px 8px;transition:transform .1s ease}' +
      '.fhs-act:active{transform:scale(.97)}' +
      '.fhs-act.solid{background:#fff;color:#5B2A4A}' +
      '.fhs-act.ghost{background:rgba(255,255,255,.14);color:#fff;border:1px solid rgba(255,255,255,.32)}' +
      '.fhs-act svg{width:16px;height:16px;flex:0 0 auto}' +
      // ---- Bottom sheet ----
      '.fhs-overlay{position:fixed;inset:0;background:rgba(40,18,33,.5);backdrop-filter:blur(2px);z-index:80;opacity:0;' +
        'transition:opacity .2s ease;display:flex;align-items:flex-end;justify-content:center}' +
      '.fhs-overlay.open{opacity:1}' +
      '.fhs-sheet{width:100%;max-width:420px;background:linear-gradient(180deg,#FFFFFF 0%,#FBF3F5 100%);' +
        'border-radius:24px 24px 0 0;max-height:90vh;overflow-y:auto;transform:translateY(100%);transition:transform .26s cubic-bezier(.2,.8,.2,1);' +
        'box-shadow:0 -10px 40px rgba(91,42,74,.25);padding:8px 18px 26px}' +
      '.fhs-overlay.open .fhs-sheet{transform:translateY(0)}' +
      '.fhs-grab{width:38px;height:4px;border-radius:999px;background:rgba(91,42,74,.2);margin:8px auto 6px}' +
      '.fhs-sheet-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}' +
      '.fhs-sheet-title{font-size:15px;font-weight:800;color:#3E1B33}' +
      '.fhs-x{width:30px;height:30px;border-radius:50%;border:1px solid rgba(91,42,74,.15);background:#fff;color:#5B2A4A;' +
        'font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center}' +
      // scan picker
      '.fhs-hint{font-size:11.5px;color:#6B5A65;line-height:1.45;margin:-2px 0 12px}' +
      '.fhs-pick{display:flex;align-items:center;gap:11px;width:100%;text-align:left;cursor:pointer;font-family:inherit;' +
        'background:#fff;border:1px solid rgba(91,42,74,.12);border-radius:14px;padding:11px 12px;margin-bottom:8px;transition:box-shadow .15s ease}' +
      '.fhs-pick:active{box-shadow:0 4px 14px rgba(91,42,74,.12)}' +
      '.fhs-pick-emoji{width:38px;height:38px;border-radius:10px;background:rgba(142,83,120,.1);display:flex;align-items:center;justify-content:center;font-size:18px;flex:0 0 auto}' +
      '.fhs-pick > span:not(.fhs-pick-emoji):not(.fhs-pick-cal){display:flex;flex-direction:column;min-width:0}' +
      '.fhs-pick-name{display:block;font-size:13px;font-weight:700;color:#3E1B33}' +
      '.fhs-pick-meta{display:block;font-size:10.5px;color:#9A8A92;margin-top:1px}' +
      '.fhs-pick-cal{margin-left:auto;font-size:12px;font-weight:800;color:#8E5378;white-space:nowrap}' +
      '.fhs-search{width:100%;box-sizing:border-box;border:1px solid rgba(91,42,74,.18);border-radius:12px;padding:11px 13px;' +
        'font:inherit;font-size:13px;color:#3E1B33;margin-bottom:12px;background:#fff}' +
      '.fhs-search:focus{outline:none;border-color:rgba(142,83,120,.5)}' +
      // scanning animation
      '.fhs-scanning{text-align:center;padding:30px 10px 24px}' +
      '.fhs-scan-frame{position:relative;width:120px;height:120px;margin:0 auto 16px;border-radius:20px;' +
        'background:rgba(142,83,120,.07);border:2px solid rgba(142,83,120,.25)}' +
      '.fhs-scan-corner{position:absolute;width:20px;height:20px;border:3px solid #8E5378}' +
      '.fhs-scan-corner.tl{top:8px;left:8px;border-right:none;border-bottom:none;border-radius:6px 0 0 0}' +
      '.fhs-scan-corner.tr{top:8px;right:8px;border-left:none;border-bottom:none;border-radius:0 6px 0 0}' +
      '.fhs-scan-corner.bl{bottom:8px;left:8px;border-right:none;border-top:none;border-radius:0 0 0 6px}' +
      '.fhs-scan-corner.br{bottom:8px;right:8px;border-left:none;border-top:none;border-radius:0 0 6px 0}' +
      '.fhs-scan-line{position:absolute;left:10px;right:10px;height:2px;background:linear-gradient(90deg,transparent,#8E5378,transparent);' +
        'top:12px;animation:fhsScan 1.1s ease-in-out infinite}' +
      '@keyframes fhsScan{0%{top:12px}50%{top:104px}100%{top:12px}}' +
      '.fhs-scan-label{font-size:12.5px;font-weight:700;color:#5B2A4A}' +
      // result
      '.fhs-res-head{display:flex;align-items:flex-start;gap:12px;margin-bottom:14px}' +
      '.fhs-res-emoji{width:46px;height:46px;border-radius:12px;background:rgba(142,83,120,.1);display:flex;align-items:center;justify-content:center;font-size:22px;flex:0 0 auto}' +
      '.fhs-res-head > span:not(.fhs-res-emoji):not(.fhs-cals){display:flex;flex-direction:column;min-width:0}' +
      '.fhs-res-name{display:block;font-size:15px;font-weight:800;color:#3E1B33;line-height:1.2}' +
      '.fhs-res-serving{display:block;font-size:11px;color:#9A8A92;margin-top:2px}' +
      '.fhs-cals{margin-left:auto;text-align:right;flex:0 0 auto}' +
      '.fhs-cals-n{font-size:22px;font-weight:800;color:#5B2A4A;line-height:1}' +
      '.fhs-cals-u{font-size:10px;font-weight:700;color:#9A8A92;letter-spacing:.4px}' +
      '.fhs-macros{display:flex;gap:8px;margin-bottom:14px}' +
      '.fhs-macro{flex:1;background:#fff;border:1px solid rgba(91,42,74,.1);border-radius:13px;padding:9px 6px;text-align:center}' +
      '.fhs-macro-n{font-size:14px;font-weight:800;color:#3E1B33}' +
      '.fhs-macro-l{font-size:9.5px;font-weight:700;letter-spacing:.3px;text-transform:uppercase;color:#9A8A92;margin-top:2px}' +
      '.fhs-macro-bar{height:3px;border-radius:999px;margin-top:6px;background:rgba(91,42,74,.1);overflow:hidden}' +
      '.fhs-macro-bar > i{display:block;height:100%;border-radius:999px}' +
      '.fhs-sec-label{font-size:10.5px;font-weight:800;letter-spacing:.5px;text-transform:uppercase;color:#9A8A92;margin:2px 0 7px}' +
      '.fhs-ings{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:16px}' +
      '.fhs-ing{font-size:11px;font-weight:600;color:#5B2A4A;background:rgba(142,83,120,.08);border:1px solid rgba(142,83,120,.16);border-radius:999px;padding:4px 10px}' +
      '.fhs-ing.flag{color:#B5532F;background:rgba(201,119,42,.1);border-color:rgba(201,119,42,.25)}' +
      // verdict
      '.fhs-verdict{border-radius:15px;padding:13px 14px;margin-bottom:16px;border:1px solid}' +
      '.fhs-verdict.good{background:rgba(47,122,122,.07);border-color:rgba(47,122,122,.25)}' +
      '.fhs-verdict.watch{background:rgba(201,119,42,.08);border-color:rgba(201,119,42,.28)}' +
      '.fhs-verdict.mixed{background:rgba(142,83,120,.07);border-color:rgba(142,83,120,.22)}' +
      '.fhs-verdict-head{display:flex;align-items:center;gap:7px;font-size:12.5px;font-weight:800;margin-bottom:5px}' +
      '.fhs-verdict.good .fhs-verdict-head{color:#236B6B}' +
      '.fhs-verdict.watch .fhs-verdict-head{color:#B5532F}' +
      '.fhs-verdict.mixed .fhs-verdict-head{color:#8E5378}' +
      '.fhs-verdict-note{font-size:11.5px;line-height:1.5;color:#4A3A44}' +
      '.fhs-verdict-tag{font-size:9px;font-weight:800;letter-spacing:.4px;text-transform:uppercase;padding:2px 7px;border-radius:999px;margin-left:auto}' +
      '.fhs-verdict.good .fhs-verdict-tag{background:rgba(47,122,122,.15);color:#236B6B}' +
      '.fhs-verdict.watch .fhs-verdict-tag{background:rgba(201,119,42,.16);color:#B5532F}' +
      '.fhs-verdict.mixed .fhs-verdict-tag{background:rgba(142,83,120,.15);color:#8E5378}' +
      '.fhs-res-actions{display:flex;gap:9px}' +
      '.fhs-res-btn{flex:1;border:none;cursor:pointer;font-family:inherit;font-size:12.5px;font-weight:700;border-radius:12px;padding:11px;transition:transform .1s ease}' +
      '.fhs-res-btn:active{transform:scale(.98)}' +
      '.fhs-res-btn.primary{background:linear-gradient(135deg,#5B2A4A,#8E5378);color:#fff;box-shadow:0 6px 16px rgba(91,42,74,.22)}' +
      '.fhs-res-btn.ghost{background:#fff;color:#8E5378;border:1px solid rgba(142,83,120,.35)}' +
      '.fhs-disc{font-size:9.5px;line-height:1.4;color:#A99CA3;font-style:italic;margin-top:12px;text-align:center}';
    var s = document.createElement('style');
    s.id = 'fhs-styles';
    s.textContent = css;
    document.head.appendChild(s);
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function emojiFor(food) {
    var map = { maggi: '🍜', bhujia: '🥨', goodday: '🍪', lays: '🥔', proteinbar: '🍫', darkchoc: '🍫',
      poha: '🍚', chilla: '🥞', dalrice: '🍛', paneer: '🧀', banana: '🍌', curdoats: '🥣' };
    return map[food.id] || '🍽️';
  }

  // ---------- Sheet plumbing ----------
  var sheetEl = null;

  function closeSheet() {
    if (!sheetEl) return;
    sheetEl.classList.remove('open');
    var el = sheetEl;
    setTimeout(function () { if (el && el.parentNode) el.parentNode.removeChild(el); }, 260);
    sheetEl = null;
  }

  function openSheet(innerHtml) {
    closeSheet();
    var overlay = document.createElement('div');
    overlay.className = 'fhs-overlay';
    overlay.innerHTML = '<div class="fhs-sheet" role="dialog" aria-modal="true"><div class="fhs-grab"></div>' + innerHtml + '</div>';
    overlay.addEventListener('click', function (e) { if (e.target === overlay) closeSheet(); });
    document.body.appendChild(overlay);
    sheetEl = overlay;
    // next frame → trigger transition
    requestAnimationFrame(function () { overlay.classList.add('open'); });
    return overlay;
  }

  function sheetHead(title) {
    return '<div class="fhs-sheet-head"><div class="fhs-sheet-title">' + escapeHtml(title) + '</div>' +
      '<button class="fhs-x" type="button" data-fhs-close aria-label="Close">✕</button></div>';
  }

  function wireClose(overlay) {
    overlay.querySelectorAll('[data-fhs-close]').forEach(function (b) {
      b.addEventListener('click', closeSheet);
    });
  }

  // ---------- Flows ----------
  function openScan(ctx) {
    var list = packaged().map(function (f) {
      return '<button class="fhs-pick" type="button" data-food="' + f.id + '">' +
        '<span class="fhs-pick-emoji">' + emojiFor(f) + '</span>' +
        '<span><span class="fhs-pick-name">' + escapeHtml(f.name) + '</span>' +
        '<span class="fhs-pick-meta">' + escapeHtml(f.brand || '') + ' · ' + escapeHtml(f.serving) + '</span></span>' +
        '<span class="fhs-pick-cal">' + f.cals + ' kcal</span></button>';
    }).join('');
    var overlay = openSheet(
      sheetHead('Scan a snack') +
      '<p class="fhs-hint">Point your camera at a label to scan it. For this preview, pick a snack to see what the scan returns.</p>' +
      list);
    wireClose(overlay);
    overlay.querySelectorAll('[data-food]').forEach(function (b) {
      b.addEventListener('click', function () {
        var food = FORHER_FOODS.filter(function (f) { return f.id === b.dataset.food; })[0];
        runScanAnimation(ctx, food);
      });
    });
  }

  function runScanAnimation(ctx, food) {
    var overlay = openSheet(
      sheetHead('Scanning…') +
      '<div class="fhs-scanning">' +
        '<div class="fhs-scan-frame">' +
          '<span class="fhs-scan-corner tl"></span><span class="fhs-scan-corner tr"></span>' +
          '<span class="fhs-scan-corner bl"></span><span class="fhs-scan-corner br"></span>' +
          '<span class="fhs-scan-line"></span>' +
        '</div>' +
        '<div class="fhs-scan-label">Reading the label…</div>' +
      '</div>');
    wireClose(overlay);
    setTimeout(function () { showResult(ctx, food); }, 1150);
  }

  function openAdd(ctx) {
    var overlay = openSheet(
      sheetHead('Add a meal') +
      '<p class="fhs-hint">Type what you ate and we\'ll estimate the breakdown.</p>' +
      '<input class="fhs-search" type="text" placeholder="e.g. poha, dal rice, chilla…" autocomplete="off" />' +
      '<div data-results></div>');
    wireClose(overlay);
    var input = overlay.querySelector('.fhs-search');
    var results = overlay.querySelector('[data-results]');
    function paint() {
      var foods = searchFoods(input.value);
      if (!foods.length) {
        results.innerHTML = '<p class="fhs-hint" style="text-align:center;padding:14px 0">No match yet — try a simpler name.</p>';
        return;
      }
      results.innerHTML = foods.map(function (f) {
        return '<button class="fhs-pick" type="button" data-food="' + f.id + '">' +
          '<span class="fhs-pick-emoji">' + emojiFor(f) + '</span>' +
          '<span><span class="fhs-pick-name">' + escapeHtml(f.name) + '</span>' +
          '<span class="fhs-pick-meta">' + escapeHtml(f.serving) + '</span></span>' +
          '<span class="fhs-pick-cal">' + f.cals + ' kcal</span></button>';
      }).join('');
      results.querySelectorAll('[data-food]').forEach(function (b) {
        b.addEventListener('click', function () {
          var food = FORHER_FOODS.filter(function (f) { return f.id === b.dataset.food; })[0];
          showResult(ctx, food);
        });
      });
    }
    input.addEventListener('input', paint);
    paint();
    setTimeout(function () { input.focus(); }, 320);
  }

  function macroBar(value, max, color) {
    var pct = Math.max(4, Math.min(100, Math.round((value / max) * 100)));
    return '<div class="fhs-macro-bar"><i style="width:' + pct + '%;background:' + color + '"></i></div>';
  }

  function showResult(ctx, food) {
    var v = verdictFor(food, ctx.phase, ctx.intent);
    var toneTag = { good: 'Good pick', watch: 'Go easy', mixed: 'In moderation' }[v.tone];
    var toneIcon = { good: '✓', watch: '!', mixed: '~' }[v.tone];

    var ings = food.ingredients.map(function (i) {
      var flag = /maida|refined wheat|sugar|invert syrup|palm oil|msg|flavour enhancer/i.test(i);
      return '<span class="fhs-ing' + (flag ? ' flag' : '') + '">' + escapeHtml(i) + '</span>';
    }).join('');

    var overlay = openSheet(
      sheetHead('Nutrition breakdown') +
      '<div class="fhs-res-head">' +
        '<span class="fhs-res-emoji">' + emojiFor(food) + '</span>' +
        '<span><span class="fhs-res-name">' + escapeHtml(food.name) + '</span>' +
          '<span class="fhs-res-serving">' + escapeHtml((food.brand ? food.brand + ' · ' : '') + food.serving) + '</span></span>' +
        '<span class="fhs-cals"><span class="fhs-cals-n">' + food.cals + '</span><br><span class="fhs-cals-u">KCAL</span></span>' +
      '</div>' +
      '<div class="fhs-macros">' +
        '<div class="fhs-macro"><div class="fhs-macro-n">' + food.protein + 'g</div><div class="fhs-macro-l">Protein</div>' + macroBar(food.protein, 20, '#2F7A7A') + '</div>' +
        '<div class="fhs-macro"><div class="fhs-macro-n">' + food.carbs + 'g</div><div class="fhs-macro-l">Carbs</div>' + macroBar(food.carbs, 60, '#8E5378') + '</div>' +
        '<div class="fhs-macro"><div class="fhs-macro-n">' + food.fat + 'g</div><div class="fhs-macro-l">Fat</div>' + macroBar(food.fat, 25, '#C9772A') + '</div>' +
        '<div class="fhs-macro"><div class="fhs-macro-n">' + food.fibre + 'g</div><div class="fhs-macro-l">Fibre</div>' + macroBar(food.fibre, 10, '#4F9D69') + '</div>' +
      '</div>' +
      '<div class="fhs-sec-label">Ingredients</div>' +
      '<div class="fhs-ings">' + ings + '</div>' +
      '<div class="fhs-verdict ' + v.tone + '">' +
        '<div class="fhs-verdict-head">' + toneIcon + ' ' + escapeHtml(v.headline) +
          '<span class="fhs-verdict-tag">' + toneTag + '</span></div>' +
        '<div class="fhs-verdict-note">' + escapeHtml(v.note) + '</div>' +
      '</div>' +
      '<div class="fhs-res-actions">' +
        '<button class="fhs-res-btn primary" type="button" data-fhs-close>Done</button>' +
        '<button class="fhs-res-btn ghost" type="button" data-again>Scan another</button>' +
      '</div>' +
      '<p class="fhs-disc">Estimated values for general wellbeing — not medical or dietary advice.</p>');
    wireClose(overlay);
    var again = overlay.querySelector('[data-again]');
    if (again) again.addEventListener('click', function () { openScan(ctx); });
  }

  // ---------- Entry card ----------
  var SPARK = '<svg class="fhs-spark" viewBox="0 0 24 24" fill="none"><path d="M12 2l1.8 5.2L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.8L12 2z" fill="currentColor"/></svg>';
  var CAM = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4h-5L8 6H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-4l-1.5-2z"/><circle cx="12" cy="13" r="3.5"/></svg>';
  var PLUS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/></svg>';

  function renderScannerEntry(containerEl, opts) {
    if (!containerEl) return;
    injectStylesOnce();
    opts = opts || {};
    var ctx = { phase: opts.phase || 'follicular', intent: opts.intent || 'cycle' };

    containerEl.innerHTML = '' +
      '<div class="fhs-entry">' +
        '<div class="fhs-entry-eyebrow">' + SPARK + 'Diet scanner</div>' +
        '<div class="fhs-entry-title">What\'s really in your food?</div>' +
        '<div class="fhs-entry-sub">Scan a packaged snack or log a meal — see calories, ingredients and what it means for your cycle.</div>' +
        '<div class="fhs-entry-actions">' +
          '<button class="fhs-act solid" type="button" data-scan>' + CAM + 'Scan a snack</button>' +
          '<button class="fhs-act ghost" type="button" data-add>' + PLUS + 'Add a meal</button>' +
        '</div>' +
      '</div>';

    containerEl.querySelector('[data-scan]').addEventListener('click', function () { openScan(ctx); });
    containerEl.querySelector('[data-add]').addEventListener('click', function () { openAdd(ctx); });
  }

  // Expose as plain globals (no module system), mirroring forher-community.js.
  global.FORHER_FOODS = FORHER_FOODS;
  global.renderScannerEntry = renderScannerEntry;
})(window);
