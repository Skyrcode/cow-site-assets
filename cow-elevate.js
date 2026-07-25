/* ============================================================
   CHOICE OF WEALTH — Elevate Pack v5 (JS)
   Supersedes v4. Blocks 1–8 are unchanged from v4 — nothing
   removed, nothing renamed, no existing functionality lost.
   Blocks 9–10 are new: text-reveal masks + custom cursor.
   Load this AFTER your existing site scripts, and AFTER
   cow-elevate-v5.css, in place of cow-elevate v4.
   ============================================================ */
document.addEventListener('DOMContentLoaded', function(){

  /* ---------- 1. AVATAR SAFETY NET (unrelated, still needed) ---------- */
  setTimeout(function(){
    var avatar = document.querySelector('.member-avatar');
    if(avatar && !avatar.textContent.trim()) avatar.textContent = 'M';
  }, 1800);

  /* ---------- 2. SCROLL ANIMATION — applies to almost every card/section,
     and REPLAYS every time you scroll it into view ---------- */
  var revealSelectors = [
    '.toool-card', '.worksheet', '.briefing', '.featured-book', '.lesson',
    '.story-item', '.episode', '.member-stat-row', '.footer-div',
    '.section-head', '.lesson-section-head'
  ];
  var revealEls = document.querySelectorAll(revealSelectors.join(','));
  revealEls.forEach(function(el, i){
    el.classList.add('cw-reveal');
    el.style.transitionDelay = Math.min((i % 6) * 0.05, 0.3) + 's';
  });

  if('IntersectionObserver' in window){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.classList.add('cw-in');
        } else {
          entry.target.classList.remove('cw-in');
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
    revealEls.forEach(function(el){ io.observe(el); });
  } else {
    revealEls.forEach(function(el){ el.classList.add('cw-in'); });
  }

  /* ---------- 3. TOOLS HUB — small animated bars inside each card ---------- */
  var toolBars = { budget:[50,30,20,45,60], networth:[70,45,85,30,95], compound:[20,35,50,70,100] };
  document.querySelectorAll('.toool-card').forEach(function(card){
    var id = card.getAttribute('id');
    var pattern = toolBars[id] || [30,50,40,65,80];
    var viz = document.createElement('div');
    viz.className = 'tool-mini-viz';
    pattern.forEach(function(h){
      var bar = document.createElement('div');
      bar.className = 'bar';
      bar.style.setProperty('--h', h + '%');
      viz.appendChild(bar);
    });
    card.appendChild(viz);
  });

  /* ---------- 4. WORKSHEETS — a small icon on each card ---------- */
  var worksheetIcons = [
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="0.5" fill="currentColor"/></svg>',
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M21 12A9 9 0 1 1 12 3v9z"/></svg>',
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2" y="6" width="20" height="13" rx="2"/><path d="M2 10h20"/></svg>',
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 4v16"/><path d="M4 6l14 3-14 3"/></svg>',
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="9" cy="8" r="3"/><circle cx="17" cy="8" r="3"/><path d="M2 20c0-3 3-5 7-5s7 2 7 5"/></svg>'
  ];
  document.querySelectorAll('.worksheets-grid .worksheet').forEach(function(card, i){
    if(card.classList.contains('work')) return;
    var icon = document.createElement('div');
    icon.className = 'worksheet-icon';
    icon.innerHTML = worksheetIcons[i % worksheetIcons.length];
    card.insertBefore(icon, card.firstChild);
  });

  /* ---------- 5. DISPATCHES — read time label + scrolling headline strip ---------- */
  document.querySelectorAll('.briefing').forEach(function(card){
    var p = card.querySelector('p');
    var meta = card.querySelector('.text-block-28');
    if(!p || !meta || card.querySelector('.briefing-readtime')) return;
    var words = p.textContent.trim().split(/\s+/).length;
    var mins = Math.max(1, Math.round(words / 200));
    var rt = document.createElement('span');
    rt.className = 'briefing-readtime';
    rt.textContent = mins + ' min read';
    meta.insertAdjacentElement('afterend', rt);
  });
  var headlineEls = document.querySelectorAll('#briefings h4.heading-51');
  if(headlineEls.length > 1){
    var items = [];
    headlineEls.forEach(function(h){ items.push(h.textContent.trim()); });
    var loopItems = items.concat(items);
    var track = document.createElement('div');
    track.className = 'cw-ticker';
    loopItems.forEach(function(text){
      var span = document.createElement('span');
      span.innerHTML = '<em>&#9679;</em>' + text;
      track.appendChild(span);
    });
    var wrap = document.createElement('div');
    wrap.className = 'cw-ticker-wrap';
    wrap.appendChild(track);
    var briefingsList = document.querySelector('.briefings-list');
    if(briefingsList) briefingsList.insertAdjacentElement('afterend', wrap);
  }

  /* ---------- 6. HERO NUMBERS — count up from 0 the first time they're seen ---------- */
  function animateCount(el){
    var textNode = null;
    for(var i = 0; i < el.childNodes.length; i++){
      if(el.childNodes[i].nodeType === 3 && el.childNodes[i].textContent.trim()){
        textNode = el.childNodes[i]; break;
      }
    }
    if(!textNode) return;
    var raw = textNode.textContent;
    var match = raw.match(/[\d,]+\.?\d*/);
    if(!match) return;
    var numStr = match[0];
    var num = parseFloat(numStr.replace(/,/g, ''));
    if(isNaN(num)) return;
    var prefix = raw.slice(0, match.index);
    var suffix = raw.slice(match.index + numStr.length);
    var hasComma = numStr.indexOf(',') !== -1;
    var decimals = (numStr.split('.')[1] || '').length;
    var duration = 1000, startTime = null;
    function frame(ts){
      if(!startTime) startTime = ts;
      var progress = Math.min((ts - startTime) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var current = num * eased;
      var display = decimals ? current.toFixed(decimals) : Math.round(current).toString();
      if(hasComma) display = Number(display).toLocaleString('en-US');
      textNode.textContent = prefix + display + suffix;
      if(progress < 1) requestAnimationFrame(frame);
      else textNode.textContent = raw;
    }
    requestAnimationFrame(frame);
  }
  var statNums = document.querySelectorAll('.hero-stat-member .text-block-25');
  if(statNums.length && 'IntersectionObserver' in window){
    var io2 = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){ animateCount(entry.target); io2.unobserve(entry.target); }
      });
    }, { threshold: 0.4 });
    statNums.forEach(function(el){ io2.observe(el); });
  }

  /* ---------- 7. BUTTONS THAT FOLLOW YOUR CURSOR SLIGHTLY ---------- */
  var magnets = document.querySelectorAll('.button-6, .tool-card-open, .np-play');
  magnets.forEach(function(btn){
    btn.classList.add('cw-magnetic');
    var strength = 0.25;
    btn.addEventListener('mousemove', function(e){
      var rect = btn.getBoundingClientRect();
      var x = e.clientX - rect.left - rect.width / 2;
      var y = e.clientY - rect.top - rect.height / 2;
      btn.style.transform = 'translate(' + (x * strength) + 'px,' + (y * strength) + 'px)';
    });
    btn.addEventListener('mouseleave', function(){ btn.style.transform = 'translate(0,0)'; });
  });

  /* ---------- 8. HERO DRIFTS SLIGHTLY AS YOU SCROLL (depth effect) ---------- */
  var parallaxTargets = [];
  var heroStat = document.querySelector('.hero-stat-member');
  var heroHeading = document.querySelector('.heading-41');
  if(heroStat) parallaxTargets.push({ el: heroStat, speed: 0.06 });
  if(heroHeading) parallaxTargets.push({ el: heroHeading, speed: 0.03 });

  if(parallaxTargets.length && !window.matchMedia('(prefers-reduced-motion: reduce)').matches){
    var ticking = false;
    function updateParallax(){
      var y = window.scrollY || window.pageYOffset;
      parallaxTargets.forEach(function(t){
        t.el.style.transform = 'translateY(' + (y * t.speed * -1) + 'px)';
      });
      ticking = false;
    }
    window.addEventListener('scroll', function(){
      if(!ticking){ window.requestAnimationFrame(updateParallax); ticking = true; }
    }, { passive: true });
  }

  /* ============================================================
     9. TEXT REVEAL — mask-in every heading, hero down to card
     titles ("maximal" setting). Pure clip-path on the existing
     element — no innerHTML rewriting, so colored <span> words
     and CMS-bound text are left completely alone. Each heading
     fires once, the first time it's on screen, then stops being
     watched (unlike the repeating card reveal in block 2 above —
     headings shouldn't re-mask every time you scroll past them).
     ============================================================ */
  var textRevealSelectors = [
    '.heading-41', '.heading-42', '.heading-43', '.heading-44', '.heading-45',
    '.heading-46', '.heading-47', '.heading-48', '.heading-49', '.heading-50',
    '.heading-51', '.ep-title', '.np-title'
  ];
  var textRevealEls = document.querySelectorAll(textRevealSelectors.join(','));
  textRevealEls.forEach(function(el, i){
    el.classList.add('cw-text-reveal');
    el.style.transitionDelay = Math.min((i % 5) * 0.06, 0.24) + 's';
  });

  if('IntersectionObserver' in window){
    var ioText = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.classList.add('cw-in-text');
          ioText.unobserve(entry.target); // fire once only
        }
      });
    }, { threshold: 0.2 });
    textRevealEls.forEach(function(el){ ioText.observe(el); });
  } else {
    textRevealEls.forEach(function(el){ el.classList.add('cw-in-text'); });
  }

  /* ============================================================
     10. CUSTOM CURSOR — dot (instant) + ring (lerped trail)
     Only turns on for mouse users who haven't asked for reduced
     motion. Touchscreens and prefers-reduced-motion keep the
     native cursor, no JS runs for them at all beyond this check.
     ============================================================ */
  var wantsCursor = window.matchMedia('(hover: hover) and (pointer: fine)').matches
                  && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if(wantsCursor){
    document.body.classList.add('cw-cursor-active');

    var cwDot = document.createElement('div');
    cwDot.className = 'cw-cursor-dot';
    var cwRing = document.createElement('div');
    cwRing.className = 'cw-cursor-ring';
    var cwLabel = document.createElement('span');
    cwRing.appendChild(cwLabel);
    document.body.appendChild(cwDot);
    document.body.appendChild(cwRing);

    var mx = 0, my = 0, rx = 0, ry = 0;

    document.addEventListener('mousemove', function(e){
      mx = e.clientX; my = e.clientY;
      cwDot.style.transform = 'translate(' + mx + 'px,' + my + 'px) translate(-50%,-50%)';
    });

    (function animateCwRing(){
      var ease = 0.16;
      rx += (mx - rx) * ease;
      ry += (my - ry) * ease;
      cwRing.style.transform = 'translate(' + rx + 'px,' + ry + 'px) translate(-50%,-50%)';
      requestAnimationFrame(animateCwRing);
    })();

    // Labeled targets: cards, play buttons, primary CTAs
    var labelMap = [
      { selector: '.toool-card, .worksheet, .lesson, .briefing, .featured-book', label: 'View' },
      { selector: '.ep-play, .np-play, .np-play-wrap, .story-item', label: 'Play' },
      { selector: '.button-6, .tool-card-open, .ahref.primary, .btn-pv', label: 'Open' }
    ];
    labelMap.forEach(function(group){
      document.querySelectorAll(group.selector).forEach(function(el){
        el.setAttribute('data-cw-cursor-wired', 'true');
        el.addEventListener('mouseenter', function(){
          cwLabel.textContent = group.label;
          cwRing.classList.add('cw-cursor-label');
        });
        el.addEventListener('mouseleave', function(){
          cwRing.classList.remove('cw-cursor-label');
        });
      });
    });

    // Everything else clickable: grow slightly, no label
    var genericTargets = document.querySelectorAll(
      'a:not([data-cw-cursor-wired]), button:not([data-cw-cursor-wired]), .w-button:not([data-cw-cursor-wired])'
    );
    genericTargets.forEach(function(el){
      el.addEventListener('mouseenter', function(){ cwRing.classList.add('cw-cursor-grow'); });
      el.addEventListener('mouseleave', function(){ cwRing.classList.remove('cw-cursor-grow'); });
    });
  }

});
