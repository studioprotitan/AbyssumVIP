/**
 * CST_NAV_PATCH.js
 * Drop this in the same directory as your episode files.
 * Add before </body> in each episode:
 *   <script src="CST_NAV_PATCH.js"></script>
 *
 * FIXES:
 *  1. Padding so bottom choices are never cut off
 *  2. Fixed HQ nav bar with return + next-location button
 *  3. Auto-shows next-location button when save is detected
 */
(function () {
  /* ── EPISODE DETECTION ─────────────────────────── */
  const href  = window.location.href || '';
  const title = document.title || '';
  const slug  = (href + title).toUpperCase();

  let epNum = 0;
  if      (slug.includes('EP01') || slug.includes('COLD'))  epNum = 1;
  else if (slug.includes('EP02') || slug.includes('DEAD'))  epNum = 2;
  else if (slug.includes('EP03') || slug.includes('STYX'))  epNum = 3;
  else if (slug.includes('EP04') || slug.includes('SWAT'))  epNum = 4;

  const NEXT = {
    1: { file:'CST_EP02_DEAD_STONE.html',     label:'DEAD STONE STATION →' },
    2: { file:'CST_EP03_STYX_STATION.html',   label:'STYX STATION →'       },
    3: { file:'CST_EP04_SWAT.html',           label:'OPERATION SWAT →'     },
    4: { file:'CST_MISSION_HUB.html',         label:'RETURN TO HQ →'       },
  };

  /* ── STYLES ────────────────────────────────────── */
  const style = document.createElement('style');
  style.textContent = `
    /* ── PADDING FIX: choices never cut off ── */
    body {
      padding-bottom: 68px !important;
      overflow-x: hidden !important;
    }
    /* Target common choice container patterns from CST episode engine */
    .choices, .choice-grid, .card-choices,
    [class*="choice"], [class*="scene-choices"],
    .hud-choices, #choices, #scene-panel,
    .scene-body, .episode-content,
    .bottom-bar, .unit-choices {
      padding-bottom: 12px !important;
    }
    .scene-panel, .scene-wrapper, .main-wrap {
      padding-bottom: 72px !important;
    }
    /* Fix roster bar (EP03 wrapping bug) */
    #roster-bar, .roster-bar, [id*="roster"] {
      flex-wrap: nowrap !important;
      overflow-x: auto !important;
      height: 46px !important;
    }

    /* ── NAV BAR ── */
    #cst-nav-bar {
      position: fixed;
      bottom: 0; left: 0; right: 0;
      height: 52px;
      background: rgba(6,6,10,0.96);
      border-top: 1px solid rgba(239,159,39,0.18);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 16px;
      z-index: 99999;
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      font-family: 'Courier New', monospace;
      gap: 10px;
    }
    .cst-nav-left  { display:flex; align-items:center; gap:10px; }
    .cst-nav-right { display:flex; align-items:center; gap:10px; }
    .cst-nav-meta  {
      font-family: 'Courier New', monospace;
      font-size: 9px;
      letter-spacing: .12em;
      color: rgba(232,230,224,0.28);
      text-transform: uppercase;
    }

    .cst-btn {
      background: transparent;
      border: 1px solid rgba(239,159,39,0.32);
      color: rgba(239,159,39,0.82);
      padding: 5px 13px;
      font-family: 'Courier New', monospace;
      font-size: 10px;
      letter-spacing: .16em;
      text-transform: uppercase;
      cursor: pointer;
      border-radius: 3px;
      transition: all .13s;
      white-space: nowrap;
      line-height: 1.4;
    }
    .cst-btn:hover {
      background: rgba(239,159,39,0.11);
      border-color: rgba(239,159,39,.55);
      color: rgba(239,159,39,1);
    }
    .cst-btn.red {
      border-color: rgba(226,75,74,0.4);
      color: rgba(226,75,74,0.85);
      display: none;
    }
    .cst-btn.red:hover {
      background: rgba(226,75,74,0.1);
      border-color: rgba(226,75,74,.65);
    }
    .cst-btn.red.visible { display: inline-block; }
    .cst-btn.teal {
      border-color: rgba(29,158,117,0.4);
      color: rgba(29,158,117,0.85);
      display: none;
    }
    .cst-btn.teal:hover { background: rgba(29,158,117,0.1); }
    .cst-btn.teal.visible { display: inline-block; }

    #cst-save-dot {
      width: 6px; height: 6px;
      border-radius: 50%;
      background: rgba(255,255,255,0.2);
      display: inline-block;
      transition: all .3s;
      flex-shrink: 0;
    }
    #cst-save-dot.saved {
      background: #1D9E75;
      box-shadow: 0 0 6px #1D9E75;
      animation: cst-pulse 2s infinite;
    }
    @keyframes cst-pulse {
      0%,100% { box-shadow:0 0 4px #1D9E75 }
      50%      { box-shadow:0 0 10px #1D9E75 }
    }
  `;
  document.head.appendChild(style);

  /* ── BUILD NAV ─────────────────────────────────── */
  const bar = document.createElement('div');
  bar.id = 'cst-nav-bar';

  const next     = NEXT[epNum];
  const nextHtml = next
    ? `<button class="cst-btn red" id="cst-next-btn" onclick="window.location.href='${next.file}'">${next.label}</button>
       <button class="cst-btn teal" id="cst-replay-btn" onclick="window.location.reload()">↺ REPLAY</button>`
    : '';

  bar.innerHTML = `
    <div class="cst-nav-left">
      <button class="cst-btn" onclick="window.location.href='CST_MISSION_HUB.html'">◀ MISSION HQ</button>
      <span class="cst-nav-meta">EP.0${epNum || '?'} · MYSTICS OF MAYHEM</span>
    </div>
    <div class="cst-nav-right">
      ${nextHtml}
      <span id="cst-save-dot"></span>
      <span class="cst-nav-meta" id="cst-save-label">MONITORING</span>
    </div>
  `;
  document.body.appendChild(bar);

  /* ── SAVE DETECTION ────────────────────────────── */
  const SAVE_KEYS = [
    `cst_ep0${epNum}_save`,
    `cst_ep0${epNum}_ending`,
    `cst_ep0${epNum}_complete`,
    `ep0${epNum}_ending`,
    `ep0${epNum}_save`,
  ];

  function checkSave() {
    const hasSave = SAVE_KEYS.some(k => localStorage.getItem(k));
    const dot     = document.getElementById('cst-save-dot');
    const lbl     = document.getElementById('cst-save-label');
    const nextBtn = document.getElementById('cst-next-btn');
    const rplBtn  = document.getElementById('cst-replay-btn');

    if (hasSave) {
      if (dot)    { dot.className = 'saved'; }
      if (lbl)    { lbl.textContent = 'SAVE RECORDED'; }
      if (nextBtn){ nextBtn.classList.add('visible'); }
      if (rplBtn) { rplBtn.classList.add('visible'); }
    }
  }

  /* Intercept localStorage writes for immediate detection */
  const _set = localStorage.setItem.bind(localStorage);
  localStorage.setItem = function (k, v) {
    _set(k, v);
    const relevant = SAVE_KEYS.some(sk => k.includes(sk.replace(`ep0${epNum}_`,'')));
    if (relevant || k.includes('ep0') || k.includes('ending') || k.includes('save')) {
      setTimeout(checkSave, 100);
    }
  };

  /* Poll as fallback */
  checkSave();
  setInterval(checkSave, 1500);
})();
