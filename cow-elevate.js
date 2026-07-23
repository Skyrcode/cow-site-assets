/* ============================================================
   CHOICE OF WEALTH — Elevate Pack v3 (JS)
   Direction: Mercury-style editorial restraint.
   Load this AFTER your existing site scripts, and AFTER
   cow-elevate.css.
   ============================================================ */
document.addEventListener('DOMContentLoaded', function(){

  /* ---------- SAFETY NET ---------- */
  setTimeout(function(){
    document.querySelectorAll('.cw-reveal:not(.cw-in)').forEach(function(el){ el.classList.add('cw-in'); });
  }, 2200);
  setTimeout(function(){
    var avatar = document.querySelector('.member-avatar');
    if(avatar && !avatar.textContent.trim()) avatar.textContent = 'M';
  }, 1800);

  /* ---------- REVEAL — restrained target list ---------- */
  var revealSelectors = ['.toool-card', '.worksheet', '.briefing', '.featured-book', '.lesson'];
  var revealEls = document.querySelectorAll(revealSelectors.join(','));
  revealEls.forEach(function(el, i){
    el.classList.add('cw-reveal');
    el.style.transitionDelay = Math.min((i % 6) * 0.05, 0.3) + 's';
  });
  if('IntersectionObserver' in window){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){ entry.target.classList.add('cw-in'); io.unobserve(entry.target); }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function(el){ io.observe(el); });
  } else {
    revealEls.forEach(function(el){ el.classList.add('cw-in'); });
  }

  /* ---------- TOOLS HUB — mini bar viz ---------- */
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

  /* ---------- WORKSHEETS — icons ---------- */
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

  /* ---------- DISPATCHES — read time + ticker ---------- */
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

  /* ---------- HERO STATS — count up (tabular, restored exactly after) ---------- */
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

  /* ---------- MAGNETIC BUTTONS ---------- */
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

  /* ---------- SUBTLE PARALLAX (hero only, deliberately minimal) ---------- */
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

});
