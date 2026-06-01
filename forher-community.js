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
    peer:   { label: 'From the community', accent: '#8E5378' },
    pacing: { label: 'Keeping your pace',  accent: '#2F7A7A' },
    recipe: { label: 'In the kitchen',     accent: '#C9772A' }
  };
  var KIND_ORDER = ['peer', 'pacing', 'recipe'];

  // Wellness videos (recorded sessions). Placeholder metadata — wire real URLs /
  // thumbnails into `url` and `thumb` later. // DRAFT — pending content team
  var FORHER_VIDEOS = [
    { id: 'v-pcos-yoga',    phase: 'any',        intent: 'pcos', title: 'Yoga for PCOS',            duration: '12 min', accent: '#8E5378', url: '' },
    { id: 'v-menstrual',    phase: 'menstrual',  intent: 'any',  title: 'Gentle flow for your period', duration: '8 min', accent: '#C76B7A', url: '' },
    { id: 'v-follicular',   phase: 'follicular', intent: 'any',  title: 'Energising morning flow',  duration: '15 min', accent: '#C9A24A', url: '' },
    { id: 'v-ovulation',    phase: 'ovulation',  intent: 'any',  title: 'Strength & stamina session', duration: '18 min', accent: '#2F7A7A', url: '' },
    { id: 'v-luteal-pms',   phase: 'luteal',     intent: 'any',  title: 'Yoga for PMS relief',      duration: '10 min', accent: '#8E5378', url: '' },
    { id: 'v-breath',       phase: 'any',        intent: 'any',  title: '5-minute breathing reset', duration: '5 min',  accent: '#2F7A7A', url: '' }
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
      '.fhc-disclaimer{font-size:9.5px;line-height:1.4;color:#A99CA3;margin:2px 2px 0;font-style:italic}';
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

  // Renders the three hook types (one card each, best match per kind) into
  // containerEl for the given phase + intent. Safe to call repeatedly.
  function renderCommunity(containerEl, phase, intent) {
    if (!containerEl) return;
    injectStylesOnce();
    var hooks = getCommunityHooks(phase, intent);
    if (!hooks.length) { containerEl.innerHTML = ''; return; }

    var cards = '';
    KIND_ORDER.forEach(function (kind) {
      var pick = hooks.filter(function (h) { return h.kind === kind; })[0];
      if (!pick) return;
      var meta = KIND_META[kind];
      cards += '' +
        '<div class="fhc-card" style="--fhc-accent:' + meta.accent + '">' +
          '<div class="fhc-kind"><span class="fhc-dot"></span>' + meta.label + '</div>' +
          '<div class="fhc-text">' + escapeHtml(pick.text) + '</div>' +
          '<div class="fhc-meta">' + pick.savedCount.toLocaleString() + ' women saved this</div>' +
        '</div>';
    });

    containerEl.innerHTML = '' +
      '<div class="fhc">' +
        '<div class="fhc-head">' +
          '<span class="fhc-title">Community &amp; wellness</span>' +
          '<span class="fhc-sub">for your ' + escapeHtml(phase) + ' phase</span>' +
        '</div>' +
        cards +
        '<p class="fhc-disclaimer">Shared by the For Her community for general wellbeing — not medical advice or treatment. Check with your clinician for anything health-related.</p>' +
      '</div>';
  }

  // Expose as plain globals (no module system).
  global.FORHER_TIPS = FORHER_TIPS;
  global.FORHER_VIDEOS = FORHER_VIDEOS;
  global.getCommunityHooks = getCommunityHooks;
  global.getCommunityVideo = getCommunityVideo;
  global.renderCommunity = renderCommunity;
})(window);
