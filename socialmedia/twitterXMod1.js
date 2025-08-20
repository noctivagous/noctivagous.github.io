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
    const overlay = `linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.35))`;
    btn.style.backgroundImage = `${overlay}, url("${url}")`;
    btn.style.backgroundSize = 'cover';
    btn.style.backgroundPosition = 'center';
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
    }
    .xv2-btn:hover { box-shadow: 0 1px 2px rgba(0,0,0,0.12); }
    .xv2-arrow { flex: 0 0 auto; width: 16px; height: 16px; transition: transform 150ms; transform: rotate(-90deg); color: currentColor; }
    .xv2-open .xv2-arrow { transform: rotate(0deg); }
    .xv2-avatar { width: 80px; height: 80px; border-radius: 0%; overflow: hidden; flex: 0 0 auto; background: rgba(0,0,0,0.15); box-shadow: 0 0 0 1px rgba(0,0,0,0.08) inset; }
    .xv2-avatar img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .xv2-meta { display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap; font-size: 13px; line-height: 1.3; }
    .xv2-name { font-weight: 600; }
    .xv2-handle, .xv2-time { opacity: 0.8; }
    .xv2-preview { font-size: 13pt; opacity: 0.9; margin-top: 2px; }
    .xv2-content { overflow: hidden; transition: max-height 200ms ease-in-out; max-height: 0; margin-top: 8px; }
    .xv2-open .xv2-content { /* max-height set inline per instance */ }
    /* Right-side thumbnail inside header */
    .xv2-thumb {
      position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
      width: 70px; height: 46px; border-radius: 8px; overflow: hidden;
      box-shadow: 0 0 0 1px rgba(255,255,255,0.5) inset, 0 1px 3px rgba(0,0,0,0.25);
      background: rgba(0,0,0,0.15);
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

  // ===== Core: build one accordion for a tweet =====
  function buildAccordion(article) {
    if (!article || article.closest('.xv2-wrap')) return;

    // Metadata
    const nameBlock = qs('[data-testid="User-Name"]', article);
    const displayName = nameBlock ? getText(nameBlock) : 'User';
    const handleEl = nameBlock ? qs('a[href*="/"] div[dir="ltr"] span', nameBlock.parentElement) : null;
    const handle = handleEl ? getText(handleEl).replace(/^@/, '') : '';
    const timeEl = qs('a time', article);
    const timeText = timeEl ? (timeEl.getAttribute('aria-label') || timeEl.textContent || '').trim() : '';
    const tweetTextEl = qs('[data-testid="tweetText"]', article);
    const previewLine = trunc(getText(tweetTextEl), 190) || '(no text)';

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
    const metaBox = document.createElement('div'); metaBox.style.flex = '1 1 auto';
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
      setHeaderPreview(btn, url, wrap.classList.contains('xv2-open'));
      if (url && thumbImg.src !== url) thumbImg.src = url;
      if (!url) thumb.style.background = 'rgba(0,0,0,0.15)';
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


