/* ============================================================
   CHOICE OF WEALTH — Reveal Pack v3
   Fixes the v2 mismatch: this now toggles .cw-m-in on the exact
   classes cow-motion.css v3 expects (.cw-m-fade / .cw-m-clip /
   .cw-m-bar), and .cw-in-text on .cw-m-text headings.
   Removed vs. the old file (not in Ana's brief, and #2/#3 were
   literal infinite loops — the exact thing she said not to do):
     - custom cursor (dot + ring)
     - magnetic buttons
     - hero parallax drift
     - hero number count-up
     - Tools Hub auto-injected bar charts
     - Worksheet auto-injected icons
     - Dispatches auto-injected scrolling headline ticker
   Kept: avatar safety net (unrelated site function, still needed).
   Added: word-by-word heading reveal, form success pulse, a
   global window.cwPulse() helper other scripts can call.
   ============================================================ */
document.addEventListener('DOMContentLoaded', function(){

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. AVATAR SAFETY NET ---------- */
  setTimeout(function(){
    var avatar = document.querySelector('.member-avatar');
    if(avatar && !avatar.textContent.trim()) avatar.textContent = 'M';
  }, 1800);

  /* ---------- 2. GLOBAL PULSE HELPER ---------- */
  window.cwPulse = function(el){
    if(!el || reduceMotion) return;
    el.classList.remove('cw-m-pulse');
    void el.offsetWidth;
    el.classList.add('cw-m-pulse');
    el.addEventListener('animationend', function handler(){
      el.classList.remove('cw-m-pulse');
      el.removeEventListener('animationend', handler);
    });
  };

  /* ---------- 3. SCROLL REVEAL — repeatable (cw-m-fade / cw-m-clip / cw-m-bar) ---------- */
  var repeatEls = document.querySelectorAll('.cw-m-fade, .cw-m-clip, .cw-m-bar');
  if('IntersectionObserver' in window && !reduceMotion){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        entry.target.classList.toggle('cw-m-in', entry.isIntersecting);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
    repeatEls.forEach(function(el){ io.observe(el); });
  } else {
    repeatEls.forEach(function(el){ el.classList.add('cw-m-in'); });
  }

  /* ---------- 4. HEADING REVEAL — fires once (cw-m-text), optional word split ---------- */
  function wrapWords(el){
    Array.from(el.childNodes).forEach(function(node){
      if(node.nodeType === 3 && node.textContent.trim()){
        var parts = node.textContent.split(/(\s+)/);
        var frag = document.createDocumentFragment();
        parts.forEach(function(part, idx){
          if(part === '' || /^\s+$/.test(part)){ frag.appendChild(document.createTextNode(part)); return; }
          var outer = document.createElement('span');
          outer.className = 'cw-word';
          var inner = document.createElement('span');
          inner.textContent = part;
          inner.style.transitionDelay = Math.min(idx * 0.03, 0.5) + 's';
          outer.appendChild(inner);
          frag.appendChild(outer);
        });
        el.replaceChild(frag, node);
      }
    });
  }

  var textEls = document.querySelectorAll('.cw-m-text');
  textEls.forEach(function(el, i){
    el.style.transitionDelay = Math.min((i % 5) * 0.06, 0.24) + 's';
    if(el.classList.contains('cw-m-text-split')) wrapWords(el);
  });

  if('IntersectionObserver' in window && !reduceMotion){
    var ioText = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.classList.add('cw-in-text');
          ioText.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });
    textEls.forEach(function(el){ ioText.observe(el); });
  } else {
    textEls.forEach(function(el){ el.classList.add('cw-in-text'); });
  }

  setTimeout(function(){
    textEls.forEach(function(el){
      if(!el.classList.contains('cw-in-text')) el.classList.add('cw-in-text');
    });
  }, 2000);

  /* ---------- 5. FORM SUCCESS PULSE ---------- */
  document.querySelectorAll('.w-form').forEach(function(formWrap){
    var doneEl = formWrap.querySelector('.w-form-done');
    var submitBtn = formWrap.querySelector('[type="submit"]');
    if(!doneEl || !submitBtn) return;
    var mo = new MutationObserver(function(){
      if(doneEl.offsetParent !== null && !formWrap._cwPulsed){
        formWrap._cwPulsed = true;
        window.cwPulse(submitBtn);
      }
    });
    mo.observe(doneEl, { attributes: true });
  });

});
