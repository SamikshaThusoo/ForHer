/* =====================================================================
   For Her — Community / motivation / diet module
   ---------------------------------------------------------------------
   Embeddable, framework-free. Drop the script in, then call:
     renderCommunity(containerEl, phase, intent)
   where phase ∈ menstrual|follicular|ovulation|luteal and
         intent ∈ cycle|pcos|ttc|pregnant|explore (any value is fine).

   The content below is editable seed copy and intentionally separate from
   the render logic. Liability bar: peer tips are framed as "women found
   this helped" (never "treats"); pacing tips are about keeping your own
   pace (never a leaderboard); nothing here is a medical claim.

   // DRAFT — pending clinical review
   ===================================================================== */
(function (global) {
  'use strict';

  // Each tip: { id, phase, intent, kind, text, savedCount }
  //   kind ∈ peer | pacing | recipe
  //   intent: 'any' shows for everyone; otherwise gated to that journey.
  // DRAFT — pending clinical review
  var FORHER_TIPS = [
    // ---------------- Menstrual ----------------
    { id: 'm-peer-1',   phase: 'menstrual',  intent: 'any',  kind: 'peer',   text: 'Many women found a warm compress and an earlier night took the edge off cramps.', savedCount: 312 },
    { id: 'm-pace-1',   phase: 'menstrual',  intent: 'any',  kind: 'pacing', text: 'Low on energy? Keeping pace can simply mean a 10-minute walk instead of a workout — it still counts.', savedCount: 188 },
    { id: 'm-recipe-1', phase: 'menstrual',  intent: 'any',  kind: 'recipe', text: 'Iron-friendly bowl: rajma or a spinach-dal helps replenish what your period takes.', savedCount: 241 },
    { id: 'm-recipe-2', phase: 'menstrual',  intent: 'any',  kind: 'recipe', text: 'Warm ginger or ajwain water is a comforting, caffeine-free way to settle bloating.', savedCount: 156 },
    { id: 'm-peer-2',   phase: 'menstrual',  intent: 'pcos', kind: 'peer',   text: 'Women managing PCOS say logging each period — even a quick note — helps them spot patterns over time.', savedCount: 97 },

    // ---------------- Follicular ----------------
    { id: 'f-pace-1',   phase: 'follicular', intent: 'any',  kind: 'pacing', text: 'Energy usually climbs now — a good week to keep pace with slightly longer walks or a new class.', savedCount: 203 },
    { id: 'f-peer-1',   phase: 'follicular', intent: 'any',  kind: 'peer',   text: 'Many women feel more social and clear-headed in these days — a nice time to start something new.', savedCount: 174 },
    { id: 'f-recipe-1', phase: 'follicular', intent: 'any',  kind: 'recipe', text: 'Fermented foods like idli, dosa or yogurt are an easy fit as estrogen rises.', savedCount: 132 },
    { id: 'f-recipe-2', phase: 'follicular', intent: 'pcos', kind: 'recipe', text: 'Pair carbs with protein and fibre (think besan chilla) to keep blood sugar steady.', savedCount: 118 },
    { id: 'f-peer-2',   phase: 'follicular', intent: 'ttc',  kind: 'peer',   text: 'Trying to conceive? Women often start noting cervical-mucus changes around now.', savedCount: 88 },

    // ---------------- Ovulation ----------------
    { id: 'o-peer-1',   phase: 'ovulation',  intent: 'any',  kind: 'peer',   text: 'Many women feel their most confident around ovulation — lean into it where you can.', savedCount: 219 },
    { id: 'o-pace-1',   phase: 'ovulation',  intent: 'any',  kind: 'pacing', text: 'Strength and stamina often peak — keep pace with a harder session if you feel up to it.', savedCount: 161 },
    { id: 'o-recipe-1', phase: 'ovulation',  intent: 'any',  kind: 'recipe', text: 'Hydrating foods — cucumber, watermelon, coconut water — help you feel light this week.', savedCount: 143 },
    { id: 'o-peer-2',   phase: 'ovulation',  intent: 'ttc',  kind: 'peer',   text: 'Your fertile window is open now; women trying to conceive often time intimacy across these days.', savedCount: 126 },
    { id: 'o-recipe-2', phase: 'ovulation',  intent: 'any',  kind: 'recipe', text: 'Antioxidant-rich berries, citrus and leafy greens are a refreshing fit right now.', savedCount: 109 },

    // ---------------- Luteal ----------------
    { id: 'l-pace-1',   phase: 'luteal',     intent: 'any',  kind: 'pacing', text: 'Energy can taper before your period — keeping pace might mean gentle yoga or a calm walk.', savedCount: 197 },
    { id: 'l-peer-1',   phase: 'luteal',     intent: 'any',  kind: 'peer',   text: 'Many women notice mood and cravings shift now — being a little kinder to yourself helps.', savedCount: 228 },
    { id: 'l-recipe-1', phase: 'luteal',     intent: 'any',  kind: 'recipe', text: 'Magnesium-rich foods — pumpkin seeds, bananas, a little dark chocolate — can ease pre-period tension.', savedCount: 184 },
    { id: 'l-recipe-2', phase: 'luteal',     intent: 'any',  kind: 'recipe', text: 'Complex carbs like millet or oats steady energy and curb sugar cravings.', savedCount: 121 },
    { id: 'l-peer-2',   phase: 'luteal',     intent: 'pcos', kind: 'peer',   text: 'Women with PCOS sometimes feel luteal symptoms more strongly — noting what helps lets you repeat it.', savedCount: 76 }
  ];

  // Returns tips matching the current phase and intent (intent-specific first,
  // then 'any'). Pass any intent string; unknown intents simply fall back to
  // the 'any' tips for that phase.
  function getCommunityHooks(phase, intent) {
    var forPhase = FORHER_TIPS.filter(function (t) { return t.phase === phase; });
    return forPhase
      .filter(function (t) { return t.intent === intent || t.intent === 'any'; })
      .sort(function (a, b) {
        // Intent-specific tips rank above generic 'any' tips.
        var ai = a.intent === 'any' ? 1 : 0;
        var bi = b.intent === 'any' ? 1 : 0;
        if (ai !== bi) return ai - bi;
        return b.savedCount - a.savedCount;
      });
  }

  var KIND_META = {
    peer:   { label: 'From the community',     accent: '#8E5378' },
    pacing: { label: 'Keeping your pace',      accent: '#2F7A7A' },
    recipe: { label: 'Diet from the community', accent: '#C9772A' }
  };
  var KIND_ORDER = ['peer', 'pacing', 'recipe'];

  // Wellness videos (recorded sessions). Placeholder metadata — wire real URLs /
  // thumbnails into `url` and `thumb` later. // DRAFT — pending content team
  var FORHER_VIDEOS = [
    { id: 'v-pcos-yoga',    phase: 'any',        intent: 'pcos', title: 'Yoga for PCOS',            duration: '12 min', accent: '#8E5378', url: '' },
    { id: 'v-menstrual',    phase: 'menstrual',  intent: 'any',  title: 'Gentle flow for your period', duration: '8 min', accent: '#C76B7A', url: '' },
    { id: 'v-follicular',   phase: 'follicular', intent: 'any',  title: 'Energising morning flow',  duration: '15 min', accent: '#C9A24A', url: '' },
    { id: 'v-ovulation',    phase: 'ovulation',  intent: 'any',  title: 'Strength & stamina session', duration: '18 min', accent: '#2F7A7A', url: '' },
    { id: 'v-luteal-pms',   phase: 'luteal',     intent: 'any',     title: 'Yoga for PMS relief',      duration: '10 min', accent: '#8E5378', url: '' },
    { id: 'v-ttc',          phase: 'any',        intent: 'ttc',     title: 'Fertility-friendly yoga',  duration: '14 min', accent: '#C9A24A', url: '' },
    { id: 'v-prenatal',     phase: 'any',        intent: 'pregnant', title: 'Gentle prenatal stretch', duration: '10 min', accent: '#2F7A7A', url: '' },
    { id: 'v-breath',       phase: 'any',        intent: 'any',     title: '5-minute breathing reset', duration: '5 min',  accent: '#2F7A7A', url: '' }
  ];

  // Best video for the phase + intent (intent- and phase-specific rank first).
  function getCommunityVideo(phase, intent) {
    var pool = FORHER_VIDEOS.filter(function (v) {
      return (v.intent === intent || v.intent === 'any') && (v.phase === phase || v.phase === 'any');
    });
    pool.sort(function (a, b) {
      var as = (a.intent === 'any' ? 1 : 0) + (a.phase === 'any' ? 1 : 0);
      var bs = (b.intent === 'any' ? 1 : 0) + (b.phase === 'any' ? 1 : 0);
      return as - bs;
    });
    return pool[0] || null;
  }

  function injectStylesOnce() {
    if (document.getElementById('fhc-styles')) return;
    var css = '' +
      '.fhc{margin-top:6px}' +
      '.fhc-head{display:flex;align-items:baseline;justify-content:space-between;gap:8px;margin:0 2px 10px}' +
      '.fhc-title{font-size:13px;font-weight:700;color:#5B2A4A;letter-spacing:.2px}' +
      '.fhc-sub{font-size:10.5px;color:#9A8A92;font-weight:500}' +
      '.fhc-card{position:relative;background:#fff;border:1px solid rgba(91,42,74,.10);border-radius:16px;' +
        'padding:13px 14px 13px 16px;margin-bottom:10px;box-shadow:0 3px 12px rgba(91,42,74,.05);overflow:hidden}' +
      '.fhc-card::before{content:"";position:absolute;left:0;top:0;bottom:0;width:4px;background:var(--fhc-accent,#8E5378)}' +
      '.fhc-kind{display:flex;align-items:center;gap:6px;font-size:10.5px;font-weight:700;' +
        'letter-spacing:.4px;text-transform:uppercase;color:var(--fhc-accent,#8E5378);margin-bottom:5px}' +
      '.fhc-kind .fhc-dot{width:5px;height:5px;border-radius:50%;background:var(--fhc-accent,#8E5378)}' +
      '.fhc-text{font-size:12.5px;line-height:1.5;color:#4A3A44}' +
      '.fhc-meta{margin-top:8px;font-size:10.5px;color:#9A8A92;font-weight:600}' +
      '.fhc-disclaimer{font-size:9.5px;line-height:1.4;color:#A99CA3;margin:2px 2px 0;font-style:italic}' +
      // Contribution panel ("how are you feeling this phase")
      '.fhc-contrib{background:linear-gradient(135deg,rgba(142,83,120,.08) 0%,rgba(142,83,120,.03) 100%);' +
        'border:1px solid rgba(142,83,120,.2);border-radius:16px;padding:14px 15px;margin-bottom:10px}' +
      '.fhc-contrib-head{font-size:13.5px;font-weight:700;color:#5B2A4A}' +
      '.fhc-contrib-head em{font-style:italic;color:#8E5378}' +
      '.fhc-contrib-sub{font-size:11px;line-height:1.45;color:#6B5A65;margin:5px 0 10px}' +
      '.fhc-chips{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px}' +
      '.fhc-chip{font-size:11.5px;font-weight:600;color:#5B2A4A;background:#fff;' +
        'border:1px solid rgba(91,42,74,.2);border-radius:999px;padding:6px 12px;cursor:pointer;font-family:inherit;transition:all .15s ease}' +
      '.fhc-chip.selected{background:linear-gradient(135deg,#5B2A4A,#8E5378);color:#fff;border-color:transparent}' +
      '.fhc-note{width:100%;box-sizing:border-box;border:1px solid rgba(91,42,74,.18);border-radius:10px;' +
        'padding:9px 11px;font:inherit;font-size:12px;color:#3E1B33;resize:vertical;min-height:38px;margin-bottom:10px;background:#fff}' +
      '.fhc-note:focus{outline:none;border-color:rgba(142,83,120,.5)}' +
      '.fhc-share{width:100%;border:none;border-radius:12px;padding:11px;font:inherit;font-size:12.5px;font-weight:700;' +
        'color:#fff;background:linear-gradient(135deg,#5B2A4A 0%,#8E5378 100%);cursor:pointer;box-shadow:0 6px 16px rgba(91,42,74,.2)}' +
      '.fhc-share:active{transform:scale(.99)}' +
      '.fhc-share.ghost{background:#fff;color:#8E5378;border:1px solid rgba(142,83,120,.35);box-shadow:none}' +
      '.fhc-card--link{display:block;text-decoration:none;cursor:pointer;transition:box-shadow .15s ease,transform .1s ease}' +
      '.fhc-card--link:hover{box-shadow:0 8px 20px rgba(91,42,74,.12)}' +
      '.fhc-card--link:active{transform:scale(.995)}' +
      '.fhc-card-chev{margin-left:auto;font-weight:700;opacity:.5}';
    var s = document.createElement('style');
    s.id = 'fhc-styles';
    s.textContent = css;
    document.head.appendChild(s);
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  // Feeling options offered in the contribution panel.
  var FEELING_OPTS = ['Energetic', 'Tired', 'Crampy', 'Moody', 'Calm', 'Bloated', 'Motivated', 'Anxious'];

  function saveFeeling(entry) {
    try {
      var arr = JSON.parse(localStorage.getItem('forher.feelings.v1') || '[]');
      arr.push(entry);
      localStorage.setItem('forher.feelings.v1', JSON.stringify(arr));
    } catch (_) {}
  }

  function contribFormHtml(phase) {
    return '' +
      '<div class="fhc-contrib-head">How are you feeling this <em>' + escapeHtml(phase) + '</em> phase?</div>' +
      '<p class="fhc-contrib-sub">Tap what fits, and share what helped you — other women in your phase will see it, instead of templates.</p>' +
      '<div class="fhc-chips">' +
        FEELING_OPTS.map(function (f) { return '<button class="fhc-chip" type="button" data-feel="' + f + '">' + f + '</button>'; }).join('') +
      '</div>' +
      '<textarea class="fhc-note" placeholder="What helped you today? Share your thoughts… (optional)"></textarea>' +
      '<button class="fhc-share" type="button">Share with the community</button>';
  }

  function contribThanksHtml(phase) {
    return '' +
      '<div class="fhc-contrib-head">Thank you for sharing 🌸</div>' +
      '<p class="fhc-contrib-sub">Your ' + escapeHtml(phase) + '-phase note is saved. As more women share, you\'ll see real community insights here instead of templates.</p>' +
      '<button class="fhc-share ghost" type="button" data-reshare="1">Update my note</button>';
  }

  // Wire the contribution panel: chip toggles + share/reshare, self-contained.
  function wireContribution(panel, phase, intent) {
    var share = panel.querySelector('.fhc-share');
    if (!share) return;
    if (share.dataset.reshare) {
      share.addEventListener('click', function () {
        panel.innerHTML = contribFormHtml(phase);
        wireContribution(panel, phase, intent);
      });
      return;
    }
    panel.querySelectorAll('.fhc-chip').forEach(function (chip) {
      chip.addEventListener('click', function () { chip.classList.toggle('selected'); });
    });
    share.addEventListener('click', function () {
      var feelings = [].slice.call(panel.querySelectorAll('.fhc-chip.selected')).map(function (c) { return c.dataset.feel; });
      var noteEl = panel.querySelector('.fhc-note');
      saveFeeling({ phase: phase, intent: intent, feelings: feelings, note: noteEl ? noteEl.value : '' });
      panel.innerHTML = contribThanksHtml(phase);
      wireContribution(panel, phase, intent);
    });
  }

  // Renders the community section: three hook types (peer / pacing / diet) plus
  // a "how are you feeling this phase" contribution panel. Safe to call repeatedly.
  // opts.cardHref: if set, each recommendation card links there (e.g. the full
  // community page). Omit it on the community page itself so cards aren't links.
  function renderCommunity(containerEl, phase, intent, opts) {
    if (!containerEl) return;
    injectStylesOnce();
    opts = opts || {};
    var hooks = getCommunityHooks(phase, intent);
    if (!hooks.length) { containerEl.innerHTML = ''; return; }

    var cards = '';
    KIND_ORDER.forEach(function (kind) {
      var pick = hooks.filter(function (h) { return h.kind === kind; })[0];
      if (!pick) return;
      var meta = KIND_META[kind];
      var tag = opts.cardHref ? 'a' : 'div';
      var hrefAttr = opts.cardHref ? ' href="' + opts.cardHref + '"' : '';
      var linkCls = opts.cardHref ? ' fhc-card--link' : '';
      cards += '' +
        '<' + tag + ' class="fhc-card' + linkCls + '"' + hrefAttr + ' style="--fhc-accent:' + meta.accent + '">' +
          '<div class="fhc-kind"><span class="fhc-dot"></span>' + meta.label +
            (opts.cardHref ? '<span class="fhc-card-chev">›</span>' : '') + '</div>' +
          '<div class="fhc-text">' + escapeHtml(pick.text) + '</div>' +
          '<div class="fhc-meta">' + pick.savedCount.toLocaleString() + ' women saved this</div>' +
        '</' + tag + '>';
    });

    containerEl.innerHTML = '' +
      '<div class="fhc">' +
        '<div class="fhc-head">' +
          '<span class="fhc-title">Community &amp; wellness</span>' +
          '<span class="fhc-sub">for your ' + escapeHtml(phase) + ' phase</span>' +
        '</div>' +
        cards +
        '<div class="fhc-contrib" id="fhcContrib">' + contribFormHtml(phase) + '</div>' +
        '<p class="fhc-disclaimer">Shared by the For Her community for general wellbeing — not medical advice or treatment. Check with your clinician for anything health-related.</p>' +
      '</div>';

    var panel = containerEl.querySelector('#fhcContrib');
    if (panel) wireContribution(panel, phase, intent);
  }

  // ---- Phase / intent derived from localStorage (for the standalone page) ----
  function daysBetween(aIso, bIso) {
    return Math.floor((new Date(bIso + 'T00:00:00') - new Date(aIso + 'T00:00:00')) / 86400000);
  }

  // Current cycle phase from forher.cycle.v1 (+ learned length), or null if no data.
  function currentPhaseFromStorage() {
    try {
      var s = JSON.parse(localStorage.getItem('forher.cycle.v1') || 'null');
      if (!s || !s.periodDays || !s.periodDays.length) return null;
      var len = 28;
      var cl = JSON.parse(localStorage.getItem('forher.cyclelen.v1') || 'null');
      if (cl && cl.length >= 21 && cl.length <= 40) len = cl.length;
      var sorted = s.periodDays.slice().sort();
      var starts = [];
      for (var i = 0; i < sorted.length; i++) {
        if (i === 0 || daysBetween(sorted[i - 1], sorted[i]) > 1) starts.push(sorted[i]);
      }
      var today = new Date(); today.setHours(0, 0, 0, 0);
      var tkey = today.toISOString().split('T')[0];
      var last = null;
      for (var j = 0; j < starts.length; j++) { if (starts[j] <= tkey) last = starts[j]; else break; }
      if (!last) return null;
      var day = ((daysBetween(last, tkey) % len) + len) % len + 1;
      if (day <= 5) return 'menstrual';
      if (day <= 13) return 'follicular';
      if (day <= 16) return 'ovulation';
      return 'luteal';
    } catch (_) { return null; }
  }

  function currentIntentFromStorage() {
    try {
      var c = JSON.parse(localStorage.getItem('forher.intent.v1') || 'null');
      return (c && c.intent) ? c.intent : 'cycle';
    } catch (_) { return 'cycle'; }
  }

  // Expose as plain globals (no module system).
  global.FORHER_TIPS = FORHER_TIPS;
  global.FORHER_VIDEOS = FORHER_VIDEOS;
  global.getCommunityHooks = getCommunityHooks;
  global.getCommunityVideo = getCommunityVideo;
  global.renderCommunity = renderCommunity;
  global.currentPhaseFromStorage = currentPhaseFromStorage;
  global.currentIntentFromStorage = currentIntentFromStorage;
})(window);
