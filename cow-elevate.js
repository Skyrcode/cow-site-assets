/* ============================================================
   CHOICE OF WEALTH — Elevate Pack (JS)
   Load this AFTER your existing site scripts, and AFTER
   cow-elevate.css.
   ============================================================ */
document.addEventListener('DOMContentLoaded', function(){

  /* ---------- SAFETY NET: nothing stays invisible ---------- */
  setTimeout(function(){
    document.querySelectorAll('.cw-reveal:not(.cw-in)').forEach(function(el){
      el.classList.add('cw-in');
    });
  }, 2500);

  /* ---------- 1. TAG REVEAL TARGETS + OBSERVE ---------- */
  var revealSelectors = [
    '.toool-card', '.worksheet', '.briefing', '.featured-book', '.lesson'
  ];
  var revealEls = document.querySelectorAll(revealSelectors.join(','));
  revealEls.forEach(function(el, i){
    el.classList.add('cw-reveal');
    el.style.transitionDelay = Math.min(i * 0.06, 0.4) + 's';
  });

  if('IntersectionObserver' in window){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.classList.add('cw-in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function(el){ io.observe(el); });
  } else {
    revealEls.forEach(function(el){ el.classList.add('cw-in'); });
  }

  /* ---------- 2. TOOLS HUB — mini bar visualizations ---------- */
  var toolBars = {
    budget:   [50, 30, 20, 45, 60],
    networth: [70, 45, 85, 30, 95],
    compound: [20, 35, 50, 70, 100]
  };
  document.querySelectorAll('.toool-card').forEach(function(card){
    var id = card.getAttribute('id');
    var pattern = toolBars[id] || [30, 50, 40, 65, 80];
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

  /* ---------- 3. WORKSHEETS — icon per card ---------- */
  var worksheetIcons = [
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="0.5" fill="currentColor"/></svg>',
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 12A9 9 0 1 1 12 3v9z"/></svg>',
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="6" width="20" height="13" rx="2"/><path d="M2 10h20"/></svg>',
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 4v16"/><path d="M4 6l14 3-14 3"/></svg>',
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="9" cy="8" r="3"/><circle cx="17" cy="8" r="3"/><path d="M2 20c0-3 3-5 7-5s7 2 7 5"/></svg>'
  ];
  document.querySelectorAll('.worksheets-grid .worksheet').forEach(function(card, i){
    if(card.classList.contains('work')) return; // skip the "coming soon" card
    var icon = document.createElement('div');
    icon.className = 'worksheet-icon';
    icon.innerHTML = worksheetIcons[i % worksheetIcons.length];
    card.insertBefore(icon, card.firstChild);
  });

  /* ---------- 4. DISPATCHES — read time + headline ticker ---------- */
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
    var loopItems = items.concat(items); // duplicated for seamless scroll
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

});
