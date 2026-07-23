/* ============================================================
   CHOICE OF WEALTH — Elevate Pack v2 (JS)
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

  /* ---------- AVATAR SAFETY NET ---------- */
  setTimeout(function(){
    var avatar = document.querySelector('.member-avatar');
    if(avatar && !avatar.textContent.trim()){
      avatar.textContent = 'M';
    }
  }, 1800);

  /* ---------- REVEAL: tag + observe every target ---------- */
  var revealSelectors = [
    '.toool-card', '.worksheet', '.briefing', '.featured-book', '.lesson',
    '.member-stat-row', '.story-item', '.episode', '.footer-div'
  ];
  var revealEls = document.querySelectorAll(revealSelectors.join(','));
  revealEls.forEach(function(el, i){
    el.classList.add('cw-reveal');
    el.style.transitionDelay = Math.min((i % 8) * 0.06, 0.4) + 's';
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

  /* ---------- TOOLS HUB — mini bar visualizations ---------- */
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

  /* ---------- WORKSHEETS — icon per card ---------- */
  var worksheetIcons = [
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="0.5" fill="currentColor"/></svg>',
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 12A9 9 0 1 1 12 3v9z"/></svg>',
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="6" width="20" height="13" rx="2"/><path d="M2 10h20"/></svg>',
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 4v16"/><path d="M4 6l14 3-14 3"/></svg>',
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="9" cy="8" r="3"/><circle cx="17" cy="8" r="3"/><path d="M2 20c0-3 3-5 7-5s7 2 7 5"/></svg>'
  ];
  document.querySelectorAll('.worksheets-grid .worksheet').forEach(function(card, i){
    if(card.classList.contains('work')) return;
    var icon = document.createElement('div');
    icon.className = 'worksheet-icon';
    icon.innerHTML = worksheetIcons[i % worksheetIcons.length];
    card.insertBefore(icon, card.firstChild);
  });

  /* ---------- DISPATCHES — read time + headline ticker ---------- */
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

  /* ---------- HERO STATS — count up on scroll into view ---------- */
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
    var duration = 1200, startTime = null;
    function frame(ts){
      if(!startTime) startTime = ts;
      var progress = Math.min((ts - startTime) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var current = num * eased;
      var display = decimals ? current.toFixed(decimals) : Math.round(current).toString();
      if(hasComma) display = Number(display).toLocaleString('en-US');
      textNode.textContent = prefix + display + suffix;
      if(progress < 1) requestAnimationFrame(frame);
      else textNode.textContent = raw; // restore exact original formatting
    }
    requestAnimationFrame(frame);
  }
  var statNums = document.querySelectorAll('.hero-stat-member .text-block-25');
  if(statNums.length && 'IntersectionObserver' in window){
    var io2 = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          animateCount(entry.target);
          io2.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    statNums.forEach(function(el){ io2.observe(el); });
  }

});
