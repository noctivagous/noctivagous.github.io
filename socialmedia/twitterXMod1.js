/*  
PASTE INTO WEB CONSOLE 
-- turns all tweets into accordion item buttons.
*/

(() => {
  // ===== Guard: prevent multiple installs =====
  if (window.__xAccordionsV2?.installed) {
    console.warn('AccordionsV2 already active. Use __xAccordionsV2.disable() to remove.');
    return;
  }

  // ===== Utilities =====
  const qs  = (s, r=document) => r.querySelector(s);
  const qsa = (s, r=document) => Array.from(r.querySelectorAll(s));
  const oneLine = s => (s || '').replace(/\s+/g, ' ').trim();
  const trunc = (s, n) => (s && s.length > n ? s.slice(0, n - 1) + '…' : (s || ''));
  const getText = el => (el ? oneLine(el.textContent || '') : '');
  const extractUrlFromStyle = el => {
    if (!el || !el.style) return null;
    const m = (el.style.backgroundImage || '').match(/url\((['"]?)(.*?)\1\)/i);
    return m ? m[2] : null;
  };

  function findAvatarUrl(article) {
    const img = qs('[data-testid^="UserAvatar-"] img', article);
    if (img?.src) return img.src;
    const bgEl = qs('[data-testid^="UserAvatar-"] [style*="background-image"]', article);
    return extractUrlFromStyle(bgEl);
  }

  function findPreviewUrl(article) {
    // Card media
    const cardImg = qs('[data-testid="card.layoutLarge.media"] img', article);
    if (cardImg?.src) return cardImg.src;
    const cardBG = qs('[data-testid="card.layoutLarge.media"] [style*="background-image"]', article);
    const cardBGUrl = extractUrlFromStyle(cardBG);
    if (cardBGUrl) return cardBGUrl;
    // Video poster
    const vid = qs('[data-testid="videoPlayer"] video, [data-testid="videoComponent"] video, video', article);
    if (vid?.poster) return vid.poster;
    // Inline tweet photo
    const photo = qs('[data-testid="tweetPhoto"] img', article);
    if (photo?.src) return photo.src;
    return null;
  }

  function setHeaderPreview(btn, url, opened) {
    if (opened || !url) {
      btn.style.backgroundImage = 'none';
      btn.style.color = '';
      btn.style.borderColor = 'rgba(0,0,0,0.1)';
      return;
    }
	const overlay = `linear-gradient(rgba(0,0,0,0.65), rgba(0,0,0,0.25))`;
    btn.style.backgroundImage = `${overlay}, url("${url}")`;
//    btn.style.backgroundSize = 'cover';
  //  btn.style.backgroundPosition = 'center';
    btn.style.color = '#fff';
    btn.style.borderColor = 'rgba(255,255,255,0.35)';
  }

  // ===== Styles =====
  const style = document.createElement('style');
  style.id = 'x-accordions-v2-style';
  style.textContent = `
    .xv2-wrap { position: relative; }
    .xv2-btn {
      display: flex; align-items: center; gap: 12px;
      width: 100%; padding: 20px 14px; padding-left:3pt; box-sizing: border-box;
      background: rgba(0,0,0,0.04); border: 1px solid rgba(0,0,0,0.1);
      border-radius: 12px; cursor: pointer;
      transition: background 120ms, color 120ms, border-color 120ms, box-shadow 120ms;
      position: relative; /* for thumbnail positioning */
       overflow: hidden;
          background-repeat: no-repeat;
      background-position: center;
      background-size: cover;
   }
    .xv2-btn.has-thumb { padding-right: 110px; }

    .xv2-btn:hover { box-shadow: 0 1px 2px rgba(0,0,0,0.12); }
    .xv2-arrow { flex: 0 0 auto; width: 16px; height: 16px; transition: transform 150ms; transform: rotate(-90deg); color: currentColor; }
    .xv2-open .xv2-arrow { transform: rotate(0deg); }
    .xv2-avatar { width: 80px; height: 80px; border-radius: 0%; overflow: hidden; flex: 0 0 auto; background: rgba(0,0,0,0.15); box-shadow: 0 0 0 1px rgba(0,0,0,0.08) inset; }
    .xv2-avatar img { width: 100%; height: 100%; object-fit: cover; display: block; }
  
    .xv2-meta { display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap; font-size: 13px; line-height: 1.3; }
  
    .xv2-name { font-weight: 600;  font-family:tahoma;   color: gray;    text-shadow: 2px 2px 2px black; }
    .xv2-handle, .xv2-time { opacity: 0.8; }
    .xv2-preview { font-size: 13pt; opacity: 0.9; margin-top: 2px; line-height:1.2em; text-shadow:1px 1px darkblue; }
    .xv2-content { overflow: hidden; transition: max-height 200ms ease-in-out; max-height: 0; margin-top: 8px; }
    .xv2-open .xv2-content { /* max-height set inline per instance */ }
    /* Right-side thumbnail inside header */
    .xv2-thumb {
      position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
      width: 70px; height: 70px; border-radius: 8px; border:1pt solid white; overflow: hidden;
      box-shadow: 0 0 0 1px rgba(255,255,255,0.5) inset, 0 1px 3px rgba(0,0,0,0.25);
      background: rgba(0,0,0,0.15);
         display: none;            /* hidden by default; shown only when media exists */
     pointer-events: none;     /* purely decorative; don't steal clicks/hover */
      z-index: 1;
    }
    .xv2-thumb img { width: 100%; height: 100%; object-fit: cover; display:block; }
    /* Hover-reveal tooltip */
    .xv2-tip {
      position: absolute; left: 14px; right: 14px; bottom: 8px;
      background: rgba(0,0,0,0.85); color: #fff;
      padding: 10px 12px; border-radius: 10px; font-size: 13px; line-height: 1.35;
      opacity: 0; pointer-events: none; transform: translateY(6px);
      transition: opacity 150ms, transform 150ms;
      max-height: 40vh; overflow: auto;
      box-shadow: 0 6px 18px rgba(0,0,0,0.25);
    }
    .xv2-tip-show { opacity: 1; transform: translateY(0); }
  `;
  document.head.appendChild(style);

// helper to extract text AND emojis
function extractTextAndEmoji(node) {
  if (!node) return "";
  const raw = node.innerText || "";

  // Match words, numbers, and emoji
  const regex = /\p{L}+\p{M}*|\p{N}+|\p{Emoji_Presentation}|\p{Emoji}\uFE0F/gu;
  const matches = raw.match(regex);
  return matches ? matches.join(" ") : "";
}

// helper to truncate safely
function trunc2(str, n) {
  return (str.length > n) ? str.slice(0, n) + "…" : str;
}


// Replace your current displayName extraction with this:

function extractDisplayNameFromUserName(root) {
  if (!root) return '';

  // Helper: visible?
  const isVisible = (el) => {
    const cs = getComputedStyle(el);
    return cs && cs.visibility !== 'hidden' && cs.display !== 'none';
  };

  // Normalize text (remove zero-width chars, condense spaces)
  const clean = (s) => (s || '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // zero-widths
    .replace(/\s+/g, ' ')
    .trim();

  // Per requirement: FIRST span with text
  const spans = root.querySelectorAll('span');
  for (const sp of spans) {
    if (!isVisible(sp)) continue;
    const txt = clean(sp.textContent);
    if (!txt) continue;
    // Skip obvious handle tokens like @name if they appear first
    if (txt.startsWith('@')) continue;
    return txt;
  }

  // Fallback: first non-empty line of innerText
  const line = clean((root.innerText || '').split('\n').find(Boolean));
  return line || '';
}


  // ===== Core: build one accordion for a tweet =====
  function buildAccordion(article) {
    if (!article || article.closest('.xv2-wrap')) return;

    // Metadata
const nameBlock   = article.querySelector('[data-testid="User-Name"]');
const displayName = extractDisplayNameFromUserName(nameBlock);

    const handleEl = nameBlock ? qs('a[href*="/"] div[dir="ltr"] span', nameBlock.parentElement) : null;
    const handle = handleEl ? getText(handleEl).replace(/^@/, '') : '';
    const timeEl = qs('a time', article);
    const timeText = timeEl ? (timeEl.getAttribute('aria-label') || timeEl.textContent || '').trim() : '';
    const tweetTextEl = qs('[data-testid="tweetText"]', article);

	const combined = extractTextAndEmoji(tweetTextEl);
	const previewLine = trunc2(combined, 210) || '(no text)';


    // Wrapper
    const wrap = document.createElement('div');
    wrap.className = 'xv2-wrap';

    // Header button
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'xv2-btn';
    btn.setAttribute('aria-expanded', 'false');

    // Arrow
    const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    arrow.setAttribute('viewBox', '0 0 24 24'); arrow.classList.add('xv2-arrow');
    arrow.innerHTML = '<path d="M8.59 16.59 13.17 12 8.59 7.41 10 6l6 6-6 6z" fill="currentColor"></path>';

    // Avatar
    const av = document.createElement('div');
    av.className = 'xv2-avatar';
    const avImg = document.createElement('img'); avImg.alt = '';
    av.appendChild(avImg);

    // Meta
    //const metaBox = document.createElement('div'); metaBox.style.flex = '1 1 auto';
    const metaBox = document.createElement('div'); metaBox.style.flex = '1 1 auto'; metaBox.style.minWidth = '0';

    const metaTop = document.createElement('div'); metaTop.className = 'xv2-meta';
    const nm = document.createElement('span'); nm.className = 'xv2-name'; nm.textContent = displayName;
    const hd = document.createElement('span'); hd.className = 'xv2-handle'; hd.textContent = handle ? `@${handle}` : '';
    const tm = document.createElement('span'); tm.className = 'xv2-time'; tm.textContent = timeText || '';
    metaTop.append(nm, hd, tm);
    const prev = document.createElement('div'); prev.className = 'xv2-preview'; prev.textContent = previewLine;
    metaBox.append(metaTop, prev);

    // Right-side media thumbnail
    const thumb = document.createElement('div'); thumb.className = 'xv2-thumb';
    const thumbImg = document.createElement('img'); thumbImg.alt = '';
    thumb.appendChild(thumbImg);

    btn.append(arrow, av, metaBox, thumb);

	insertWordCount(btn, getText(tweetTextEl));
    // Body content
    const content = document.createElement('div'); content.className = 'xv2-content';
    const ph = document.createComment('xv2-article-ph');
    article.parentNode.insertBefore(ph, article);
    content.appendChild(article);
    wrap.append(btn, content);
    ph.parentNode.replaceChild(wrap, ph);

    // Initial collapsed state
    content.style.maxHeight = '0px';
    wrap.classList.remove('xv2-open');

    // Avatar resolver (handles late loads)
    function resolveAvatar() {
      const url = findAvatarUrl(article);
      if (url && avImg.src !== url) avImg.src = url;
    }
    resolveAvatar();
    const avMo = new MutationObserver(resolveAvatar);
    avMo.observe(article, { subtree: true, attributes: true, childList: true, attributeFilter: ['src', 'style'] });

    // Media resolver for header background and thumbnail
    function resolveMedia() {
      const url = findPreviewUrl(article);
   //   setHeaderPreview(btn, url, wrap.classList.contains('xv2-open'));
     // if (url && thumbImg.src !== url) thumbImg.src = url;
     // if (!url) thumb.style.background = 'rgba(0,0,0,0.15)';
   
     // Background preview (driven by CSS for size/animation)
  setHeaderPreview(btn, url, wrap.classList.contains('xv2-open'));

  // Right-side thumbnail logic
  if (url) {
    if (thumbImg.src !== url) thumbImg.src = url;
    thumb.style.display = 'block';
    btn.classList.add('has-thumb');      // reserve space so text doesn't run under the image
  } else {
    thumbImg.removeAttribute('src');
    thumb.style.display = 'none';
    btn.classList.remove('has-thumb');   // no space reservation when there is no preview
  }

   
    }
    resolveMedia();
    const mediaMo = new MutationObserver(resolveMedia);
    mediaMo.observe(article, { subtree: true, attributes: true, childList: true, attributeFilter: ['src', 'poster', 'style'] });

    // Hover-reveal tooltip (3s)
    const tip = document.createElement('div'); tip.className = 'xv2-tip';
    tip.textContent = getText(tweetTextEl);
    btn.appendChild(tip);
    let hoverTimer = null;
    btn.addEventListener('mouseenter', () => {
      hoverTimer = setTimeout(() => { tip.classList.add('xv2-tip-show'); }, 3000);
    });
    btn.addEventListener('mouseleave', () => {
      clearTimeout(hoverTimer); hoverTimer = null;
      tip.classList.remove('xv2-tip-show');
    });


// Utility: count words including emoji
function countWordsWithEmoji(text) {
  if (!text) return 0;

  // Regex for words (alphanumeric) and for emoji
  const wordRegex = /\p{L}+\p{M}*|\p{N}+|\p{Emoji_Presentation}|\p{Emoji}\uFE0F/gu;

  const matches = text.match(wordRegex);
  return matches ? matches.length : 0;
}

// Insert word count badge
function insertWordCount(accordionItem, tweetText) {
  const count = countWordsWithEmoji(tweetText);

  let badge = document.createElement('div');
  badge.textContent = `${count} words`;
  badge.style.position = "absolute";
  badge.style.top = "4px";
  badge.style.left = "6px";
  badge.style.fontSize = "11px";
  badge.style.fontFamily = "sans-serif";
  badge.style.color = "#555";
  badge.style.background = "rgba(255,255,255,0.7)";
  badge.style.padding = "2px 5px";
  badge.style.borderRadius = "6px";

  accordionItem.style.position = "relative";
  accordionItem.appendChild(badge);
}




    // Toggle expand/collapse
    function toggle() {
      const open = wrap.classList.toggle('xv2-open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      tip.classList.remove('xv2-tip-show'); // hide any tip when toggling
      if (open) {
        setHeaderPreview(btn, null, true);
        content.style.maxHeight = '0px';
        content.style.maxHeight = content.scrollHeight + 'px';
      } else {
        content.style.maxHeight = '0px';
        resolveMedia();
      }
    }
    btn.addEventListener('click', toggle);

    // Keep observer refs for cleanup
    wrap.__observers = [avMo, mediaMo];
  }

  // ===== Processing: all timelines, continuously =====
  const processedTimelines = new WeakSet();

  function processTimeline(tl) {
    if (!tl || processedTimelines.has(tl)) return;
    processedTimelines.add(tl);

    // Convert existing tweets
    qsa('article[data-testid="tweet"]', tl).forEach(buildAccordion);

    // Watch this timeline for new tweets
    const mo = new MutationObserver(muts => {
      for (const m of muts) {
        m.addedNodes && m.addedNodes.forEach(node => {
          if (!(node instanceof HTMLElement)) return;
          if (node.matches?.('article[data-testid="tweet"]')) buildAccordion(node);
          qsa('article[data-testid="tweet"]', node).forEach(buildAccordion);
        });
      }
    });
    mo.observe(tl, { childList: true, subtree: true });
    tl.__xv2TimelineObserver = mo;
  }

  function processAllTimelines(root=document) {
    qsa('div[aria-label^="Timeline:"]', root).forEach(processTimeline);
  }

  // Initial scan
  processAllTimelines();

  // Global observer: detect new timelines during SPA navigation
  const rootObserver = new MutationObserver(muts => {
    for (const m of muts) {
      m.addedNodes && m.addedNodes.forEach(node => {
        if (!(node instanceof HTMLElement)) return;
        if (node.matches?.('div[aria-label^="Timeline:"]')) processTimeline(node);
        qsa('div[aria-label^="Timeline:"]', node).forEach(processTimeline);
      });
    }
  });
  rootObserver.observe(document.body, { childList: true, subtree: true });

  // ===== Public API =====
  function setAll(open) {
    qsa('.xv2-wrap').forEach(wrap => {
      const btn = qs('.xv2-btn', wrap);
      const content = qs('.xv2-content', wrap);
      if (!btn || !content) return;
      wrap.classList.toggle('xv2-open', !!open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) {
        btn.style.backgroundImage = 'none';
        btn.style.color = '';
        btn.style.borderColor = 'rgba(0,0,0,0.1)';
        content.style.maxHeight = content.scrollHeight + 'px';
      } else {
        content.style.maxHeight = '0px';
        // restore preview background per tweet
        const article = qs('article[data-testid="tweet"]', wrap);
        const url = article ? findPreviewUrl(article) : null;
        setHeaderPreview(btn, url, false);
      }
    });
  }

  function disable() {
    // Stop global and per-timeline observers
    rootObserver.disconnect();
    qsa('div[aria-label^="Timeline:"]').forEach(tl => {
      try { tl.__xv2TimelineObserver?.disconnect(); } catch {}
      delete tl.__xv2TimelineObserver;
    });

    // Unwrap tweets and remove wrappers
    qsa('.xv2-wrap').forEach(wrap => {
      (wrap.__observers || []).forEach(obs => { try { obs.disconnect(); } catch {} });
      const article = qs('article[data-testid="tweet"]', wrap);
      if (article && wrap.parentNode) wrap.parentNode.insertBefore(article, wrap);
      wrap.remove();
    });

    // Remove styles
    const st = qs('#x-accordions-v2-style'); if (st) st.remove();

    window.__xAccordionsV2 = { installed: false, expandAll(){}, collapseAll(){}, disable(){} };
    console.log('AccordionsV2 removed.');
  }

  window.__xAccordionsV2 = {
    installed: true,
    expandAll: () => setAll(true),
    collapseAll: () => setAll(false),
    disable
  };

  console.log('AccordionsV2 active: all timelines monitored; hover=3s text tooltip; media previews + right thumbnail enabled.');
})();


(() => {
  // ==============================
  // Guard: prevent multiple installs
  // ==============================
  if (window.__xControls?.installed) {
    console.warn('Controls already active. Use __xControls.disable() to remove.');
    return;
  }

  // ==============================
  // Utilities
  // ==============================
  const qs  = (s, r=document) => r.querySelector(s);
  const qsa = (s, r=document) => Array.from(r.querySelectorAll(s));

  // Match the wrappers produced by your accordion script
  const WRAP_SEL    = '.xv2-wrap';
  const BTN_SEL     = '.xv2-btn';
  const ARTICLE_SEL = 'article[data-testid="tweet"]';
	const CLICKABLE_SEL = 'a,button,[role="button"],[tabindex]:not([tabindex="-1"])';
	
  // Track hover state
  let currentHoverWrap = null;
  let lastMouse = { x: 0, y: 0 };
  let currentHoverEl = null;

  function wrapFor(node) {
    if (!node) return null;
    if (node.matches?.(WRAP_SEL)) return node;
    return node.closest?.(WRAP_SEL) || null;
  }




  // ==============================
  // Styles (modal + click flash)
  // ==============================
  const style = document.createElement('style');
  style.id = 'x-keys-style';
  style.textContent = `
    #x-keys-modal {
      position: fixed; right: 16px; bottom: 16px; z-index: 2147483647;
      max-width: 360px; padding: 12px 14px; border-radius: 12px;
      background: rgba(255,255,255,0.95); border: 1px solid rgba(0,0,0,0.15);
      backdrop-filter: saturate(140%) blur(6px);
      font: 13px system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
      color: #111; box-shadow: 0 4px 14px rgba(0,0,0,0.15);
    }
    #x-keys-modal h4 { margin: 0 0 8px 0; font-size: 13px; font-weight: 700; }
    #x-keys-modal table { width: 100%; border-collapse: collapse; margin: 6px 0 0 0; }
    #x-keys-modal td { padding: 4px 2px; vertical-align: top; }
    #x-keys-modal kbd {
      background:#f2f2f3; border:1px solid #ccc; border-bottom-color:#bbb; border-radius:4px;
      padding: 1px 5px; font: 12px/1 monospace; color:#000;
    }
    #x-keys-close {
      position:absolute; top:6px; right:8px; border:0; background:transparent; cursor:pointer;
      font-size:14px; line-height:1; color:#444;
    }
    .x-click-flash {
      position: fixed; pointer-events: none; z-index: 2147483647;
      border: 2px solid #4a8df6; border-radius: 8px; box-shadow: 0 0 0 2px rgba(74,141,246,0.35);
      transition: opacity 200ms ease-out; opacity: 1;
    }
  `;
  document.head.appendChild(style);

  // ==============================
  // Modal (instructions only)
  // ==============================
  const modal = document.createElement('div');
  modal.id = 'x-keys-modal';
  modal.innerHTML = `
    <button id="x-keys-close" aria-label="Close">✕</button>
    <h4>Keyboard actions</h4>
    <table>
      <tr><td><kbd>F</kbd></td><td>Open/Close the hovered tweet from its accordion state.</td></tr>
      <tr><td><kbd>D</kbd></td><td>Delete the hovered tweet from the page.</td></tr>
      <tr><td><kbd>G</kbd></td><td>Click the element under the cursor (link, button, or any element).</td></tr>
    </table>
    <div style="margin-top:8px; opacity:.75;">
      Notes: Works on accordions created by this script (<code>.xv2-wrap</code>).
      Other layout features in this script are temporarily disabled.
    </div>
  `;
  document.body.appendChild(modal);
  document.body.classList.add('x-g-crosshair');
  qs('#x-keys-close', modal).addEventListener('click', () => modal.remove());


let currentClickable = null;
 
function setClickableCandidate(el) {
  // Find the nearest clickable ancestor
  let cand = el?.closest?.(CLICKABLE_SEL) || null;
  // Exclude the accordion header button itself
  if (cand && cand.closest?.(BTN_SEL)) cand = null;
  if (currentClickable === cand) return;
  if (currentClickable) currentClickable.classList.remove('x-g-focus-ring');
  currentClickable = cand;
  if (currentClickable) currentClickable.classList.add('x-g-focus-ring');
}


  // ==============================
  // Hover tracking
  // ==============================
  function onMouseMove(e) {
    lastMouse.x = e.clientX;
    lastMouse.y = e.clientY;
    // The element under the cursor at this moment
    currentHoverEl = document.elementFromPoint(lastMouse.x, lastMouse.y) || e.target;
    // Closest tweet wrapper, if any
    const w = wrapFor(currentHoverEl);
    if (w) currentHoverWrap = w;
    else if (!wrapFor(e.relatedTarget)) currentHoverWrap = null;
     setClickableCandidate(currentHoverEl);
  }
  document.addEventListener('mousemove', onMouseMove, true);

  // Fallback for mouseover/out to keep wrap in sync when moving within the tweet
  function onPointerOver(e) {
    const w = wrapFor(e.target);
    if (w) currentHoverWrap = w;
     setClickableCandidate(e.target);
  }
  function onPointerOut(e) {
    const w = wrapFor(e.target);
    if (w && w === currentHoverWrap && !wrapFor(e.relatedTarget)) currentHoverWrap = null;
    if (!e.relatedTarget) setClickableCandidate(null);
  }
  document.addEventListener('mouseover', onPointerOver, true);
  document.addEventListener('mouseout', onPointerOut, true);


function rippleAt(x, y) {
  const r = document.createElement('div');
  r.className = 'x-g-ripple';
  r.style.left = x + 'px';
  r.style.top  = y + 'px';
  document.body.appendChild(r);
  r.addEventListener('animationend', () => r.remove(), { once: true });
}
  // ==============================
  // Click helper for G key
  // ==============================
  function syntheticClick(el) {
    if (!el) return false;
    // Prefer a clickable ancestor (link/button/role/button-like)
    const target = el.closest?.('a, button, [role="button"], [tabindex]') || el;

    // Visual feedback box
    try {
      const r = target.getBoundingClientRect();
      const flash = document.createElement('div');
      Object.assign(flash, { className: 'x-click-flash' });
      Object.assign(flash.style, {
        left: `${Math.max(0, r.left - 4)}px`,
        top:  `${Math.max(0, r.top  - 4)}px`,
        width: `${Math.max(0, r.width + 8)}px`,
        height:`${Math.max(0, r.height + 8)}px`
      });
      document.body.appendChild(flash);
      setTimeout(() => { flash.style.opacity = '0'; }, 150);
      setTimeout(() => { flash.remove(); }, 380);
    } catch {}

    // Try native .click() first
    try {
      if (typeof target.click === 'function') {
        target.click();
        return true;
      }
    } catch {}

    // Fallback: dispatch mouse events
    const opts = { bubbles: true, cancelable: true, view: window, clientX: lastMouse.x, clientY: lastMouse.y };
    try { target.dispatchEvent(new MouseEvent('mousedown', opts)); } catch {}
    try { target.dispatchEvent(new MouseEvent('mouseup',   opts)); } catch {}
    try { target.dispatchEvent(new MouseEvent('click',     opts)); } catch {}
    return true;
  }

  // ==============================
  // Key handling: D (delete), F (open), G (click)
  // ==============================
  function onKeyDown(e) {
    const tag = (e.target && e.target.tagName || '').toLowerCase();
    // Ignore when typing in inputs/textareas or contenteditable
    if (tag === 'input' || tag === 'textarea' || (e.target && e.target.isContentEditable)) return;

    // --- G: click element under cursor ---
    if (e.key === 'g' || e.key === 'G') {
      e.preventDefault();
   //    syntheticClick(currentHoverEl || document.elementFromPoint(lastMouse.x, lastMouse.y));
    rippleAt(lastMouse.x, lastMouse.y);
    const el = currentClickable || currentHoverEl || document.elementFromPoint(lastMouse.x, lastMouse.y);
    syntheticClick(el);

      return;
    }

    // The following require a hovered tweet accordion wrapper
    if (!currentHoverWrap) return;

    if (e.key === 'd' || e.key === 'D') {
      // Remove tweet wrapper (article is inside the wrapper)
      e.preventDefault();
      (currentHoverWrap.__observers || []).forEach(obs => { try { obs.disconnect(); } catch {} });
      const parent = currentHoverWrap.parentNode;
      currentHoverWrap.remove();
      if (parent && parent.focus) { try { parent.focus(); } catch {} }
    } else if (e.key === 'f' || e.key === 'F') {
      // Open/expand the accordion by clicking the header button
      e.preventDefault();
      const btn = qs(BTN_SEL, currentHoverWrap);
      if (btn) btn.click();
    }
  }
  document.addEventListener('keydown', onKeyDown, true);

  // ==============================
  // STUBS (disabled features retained as placeholders)
  // ==============================
  function toggleLeftSidebar()   { console.info('[stub] toggleLeftSidebar is disabled in this build.'); }
  function toggleRightSidebar()  { console.info('[stub] toggleRightSidebar is disabled in this build.'); }
  function toggleWideTimeline()  { console.info('[stub] toggleWideTimeline is disabled in this build.'); }
  function setTweetColumns(n)    { console.info(`[stub] setTweetColumns(${n}) is disabled in this build.`); }

  // ==============================
  // Public API and cleanup
  // ==============================
  function disable() {
    document.removeEventListener('mousemove', onMouseMove, true);
    document.removeEventListener('mouseover', onPointerOver, true);
    document.removeEventListener('mouseout', onPointerOut, true);
    document.removeEventListener('keydown', onKeyDown, true);
    document.body.classList.remove('x-g-crosshair');
    const st = qs('#x-keys-style'); if (st) st.remove();
    const md = qs('#x-keys-modal'); if (md) md.remove();
    window.__xControls = { installed: false, disable(){} };
    console.log('Key controls removed.');
  }

  window.__xControls = {
    installed: true,
    disable,
    // stubs exposed for future wiring
    toggleLeftSidebar,
    toggleRightSidebar,
    toggleWideTimeline,
    setTweetColumns
  };

  console.log('Key controls active: F=open accordion, D=delete tweet, G=click element under cursor. Press the × on the modal to hide instructions.');
})();


// highlights for what can be clicked with G.
(() => {
  // Guard
  if (window.__xControls?.installed) {
    console.warn('Controls already active.');
    return;
  }

  const WRAP_SEL = '.xv2-wrap';
  const BTN_SEL  = '.xv2-btn';

  let currentHoverWrap = null;
  let lastMouse = {x:0,y:0};
  let currentHoverEl = null;
  let currentClickable = null;
  let highlighted = null;

 
 function wrapFor(node) {
   if (!node) return null;
   if (node.matches?.(WRAP_SEL)) return node;
   return node.closest?.(WRAP_SEL) || null;
 }


  // Styles
  const style = document.createElement('style');
  style.id = 'x-hover-style';
  style.textContent = `
    .x-hover-outline {
      outline: 2px solid rgba(0,200,0,.75) !important;
      box-shadow: 0 0 6px 2px rgba(0,200,0,.45) !important;
      transition: outline .05s, box-shadow .05s;
    }
  `;
  document.head.appendChild(style);

  function wrapFor(node) {
    if (!node) return null;
    if (node.matches?.(WRAP_SEL)) return node;
    return node.closest?.(WRAP_SEL) || null;
  }

  function clearHighlight() {
    if (highlighted) {
      highlighted.classList.remove('x-hover-outline');
      highlighted = null;
    }
  }

  function updateHighlight(el) {
    if (!el) { clearHighlight(); return; }

    // Exclude accordion button
    if (el.closest(BTN_SEL)) {
      clearHighlight();
      return;
    }

    if (highlighted === el) return;
    clearHighlight();
    highlighted = el;
    highlighted.classList.add('x-hover-outline');
  }

  function onMouseMove(e) {
    lastMouse.x = e.clientX;
    lastMouse.y = e.clientY;
    currentHoverEl = document.elementFromPoint(lastMouse.x, lastMouse.y) || e.target;
    const w = wrapFor(currentHoverEl);
    if (w) currentHoverWrap = w;
    else if (!wrapFor(e.relatedTarget)) currentHoverWrap = null;
    updateHighlight(currentHoverEl);
  }

  document.addEventListener('mousemove', onMouseMove, true);

  function onKeyDown(e) {
    const tag = (e.target && e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || e.target.isContentEditable) return;

    // G = click element under cursor
    if (e.key === 'g' || e.key === 'G') {
      e.preventDefault();
      const el = highlighted || currentHoverEl || document.elementFromPoint(lastMouse.x,lastMouse.y);
      if (el && !el.closest(BTN_SEL)) {
        el.click?.();
      }
    }
  }
  document.addEventListener('keydown', onKeyDown, true);

  function disable() {
    document.removeEventListener('mousemove', onMouseMove, true);
    document.removeEventListener('keydown', onKeyDown, true);
    clearHighlight();
    const st = document.querySelector('#x-hover-style');
    if (st) st.remove();
    window.__xControls = {installed:false,disable(){}};
  }

  window.__xControls = {installed:true, disable};

  console.log('Hover glow enabled: any clickable element (except accordion buttons) highlights with green outline. Press G to click it.');
})();

(() => {
  // Inject styles once
  if (!document.getElementById('xv2-bg-shrink-style')) {
    const style = document.createElement('style');
    style.id = 'xv2-bg-shrink-style';
    style.textContent = `
      /* Default state: fill (cover) */
      .xv2-btn {
        background-size: cover;
        background-position: center;
        transition: background-size 220ms ease, background-position 220ms ease, filter 220ms ease, color 120ms ease;
      }
      /* Hover state: image height = button height (auto width), keeps aspect */
      .xv2-btn.xv2-bg-shrink {
        background-size: auto 100%;
        background-position: center;
      }

      /* If you use the filtered pseudo-element approach (tweet-btn-bg::before) */
      .tweet-btn-bg::before {
        background-size: cover;
        transition: background-size 220ms ease, filter 220ms ease;
      }
      .tweet-btn-bg.xv2-bg-shrink::before {
        background-size: auto 100%;
      }
      /* ==== Big crosshair cursor on the whole page ==== */
body.x-g-crosshair, body.x-g-crosshair * {
  cursor: url('data:image/svgxml;utf8, \
<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"> \
  <circle cx="32" cy="32" r="30" fill="none" stroke="rgba(0,0,0,0.15)" stroke-width="2"/> \
  <line x1="32" y1="6"  x2="32" y2="22" stroke="rgba(0,128,0,0.90)" stroke-width="3"/> \
  <line x1="32" y1="42" x2="32" y2="58" stroke="rgba(0,128,0,0.90)" stroke-width="3"/> \
  <line x1="6"  y1="32" x2="22" y2="32" stroke="rgba(0,128,0,0.90)" stroke-width="3"/> \
  <line x1="42" y1="32" x2="58" y2="32" stroke="rgba(0,128,0,0.90)" stroke-width="3"/> \
</svg>') 32 32, crosshair !important;
}

/* ==== Artificial focus ring for G-click targets ==== */
.x-g-focus-ring {
  outline: 3px solid rgba(0, 200, 0, 0.85) !important;
  box-shadow:
    0 0 0 2px rgba(0, 200, 0, 0.35),
    0 0 10px 2px rgba(0, 200, 0, 0.45) !important;
  transition: outline 50ms, box-shadow 50ms;
}

/* ==== Ripple under the cursor when G is pressed ==== */
@keyframes x-g-ripple {
  0%   { transform: translate(-50%, -50%) scale(0.2); opacity: 0.45; }
  60%  { transform: translate(-50%, -50%) scale(1.0); opacity: 0.25; }
  100% { transform: translate(-50%, -50%) scale(1.6); opacity: 0; }
}
.x-g-ripple {
  position: fixed; left: 0; top: 0; z-index: 2147483646; pointer-events: none;
  width: 46px; height: 46px; border-radius: 50%;
  background: radial-gradient(circle, rgba(0,200,0,0.35) 0%, rgba(0,200,0,0.25) 60%, rgba(0,200,0,0) 70%);
  animation: x-g-ripple 380ms ease-out forwards;
}
    `;
    document.head.appendChild(style);
  }

  const WRAP_SEL = '.xv2-wrap';
  const BTN_SEL  = '.xv2-btn';

  function attachHoverAnimation(btn) {
    if (!btn || btn.__xv2BgShrinkBound) return;
    btn.__xv2BgShrinkBound = true;

    const wrap = btn.closest(WRAP_SEL);

    function enter() {
      // Optional: skip effect while expanded
      if (wrap && wrap.classList.contains('xv2-open')) return;
      btn.classList.add('xv2-bg-shrink');
    }
    function leave() {
      btn.classList.remove('xv2-bg-shrink');
    }

    btn.addEventListener('mouseenter', enter);
    btn.addEventListener('mouseleave', leave);
  }

  // Apply to existing accordions
  document.querySelectorAll(BTN_SEL).forEach(attachHoverAnimation);

  // Observe for newly added accordions
  const mo = new MutationObserver(muts => {
    for (const m of muts) {
      m.addedNodes && m.addedNodes.forEach(node => {
        if (!(node instanceof HTMLElement)) return;
        if (node.matches?.(BTN_SEL)) attachHoverAnimation(node);
        node.querySelectorAll?.(BTN_SEL).forEach(attachHoverAnimation);
      });
    }
  });
  mo.observe(document.body, { childList: true, subtree: true });

  // Expose a small API if you need to disable later
  window.__xBgShrink = {
    disable() {
      mo.disconnect();
      document.querySelectorAll(BTN_SEL).forEach(btn => {
        btn.classList.remove('xv2-bg-shrink');
      });
      // Optional: remove the style tag
      // document.getElementById('xv2-bg-shrink-style')?.remove();
    }
  };

  console.log('Hover background shrink enabled: image animates to button height on .xv2-btn hover, restores on exit.');
})();
