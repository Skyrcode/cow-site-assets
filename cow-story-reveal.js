/* ============================================================
   CHOICE OF WEALTH — Story Reveal Pack v1 (JS)
   Site-wide scroll animation engine, modeled on the Ana Paula
   "My Story" reference page. Fully namespaced under "csr-".

   Does NOT touch the Members page. Only acts on elements that
   carry csr- classes/attributes, which you add page by page —
   so pages you haven't touched yet are completely unaffected,
   and Members page (which loads cow-elevate instead) never
   sees this file at all unless you explicitly add it there.

   HOW TO USE (add these to elements in Webflow):
   - Wrap a section in class="csr-reveal" — this is the trigger
     zone. When it scrolls into view, it gets "csr-in" added,
     which fires every csr- child inside it.
   - class="csr-fade" on any element — fades + rises in.
   - Headings: wrap each line in
       <span class="csr-ln"><i>Line of text</i></span>
     Multiple csr-ln lines inside one heading will each animate
     independently if you give each an inline style="--csr-d:.2s"
     (stagger the delay per line, e.g. .05s, .2s, .35s).
   - class="csr-eyebrow-line" on a small <span> before an eyebrow
     label — draws a short line in.
   - class="csr-clip" on an image wrapper — reveals via clip-path.
   - data-csr-drift="0.08" on an image/decorative element — drifts
     slowly as you scroll (positive = moves down slower than
     scroll, negative = moves up). Keep values small: -0.1 to 0.15.
   - data-csr-count="48" data-csr-suffix="%" on a number element —
     counts up from 0 the first time it's visible.
   - Stagger any csr-fade/csr-ln with inline style="--csr-d:.2s"
     (seconds of delay).
   - Ticker: wrap looped content in
       <div class="csr-ticker"><div class="csr-ticker-track">
         <span>Word</span><span>Word</span>... (duplicate the full
         list once for a seamless loop)
       </div></div>
   ============================================================ */
(function(){

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. SECTION REVEALS ---------- */
  var revealBlocks = document.querySelectorAll('.csr-reveal');

  if(revealBlocks.length){
    if(!('IntersectionObserver' in window)){
      revealBlocks.forEach(function(b){ b.classList.add('csr-in'); });
    } else {
      var io = new IntersectionObserver(function(entries){
        entries.forEach(function(entry){
          if(!entry.isIntersecting) return;
          entry.target.classList.add('csr-in');
          io.unobserve(entry.target);
          entry.target.querySelectorAll('[data-csr-count]').forEach(countUp);
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -5% 0px' });
      revealBlocks.forEach(function(b){ io.observe(b); });
    }
  }

  /* ---------- 2. COUNT-UP NUMBERS ---------- */
  function countUp(el){
    var target = parseFloat(el.getAttribute('data-csr-count'));
    if(isNaN(target)) return;
    var suffix = el.getAttribute('data-csr-suffix') || '';
    var decimals = (String(target).split('.')[1] || '').length;

    if(reduce){ el.textContent = target.toFixed(decimals) + suffix; return; }

    var start = null, dur = 1600;
    function step(ts){
      if(!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = (target * eased).toFixed(decimals) + suffix;
      if(p < 1) requestAnimationFrame(step);
      else el.textContent = target.toFixed(decimals) + suffix;
    }
    requestAnimationFrame(step);
  }

  /* ---------- 3. SCROLL-LINKED DRIFT (parallax) ---------- */
  var drifters = document.querySelectorAll('[data-csr-drift]');

  if(drifters.length && !reduce){
    var ticking = false;

    function updateDrift(){
      var vh = window.innerHeight;
      drifters.forEach(function(el){
        var r = el.getBoundingClientRect();
        if(r.bottom < -200 || r.top > vh + 200) return; // skip offscreen work
        var speed = parseFloat(el.getAttribute('data-csr-drift')) || 0;
        var offset = (r.top + r.height / 2 - vh / 2) * speed;
        el.style.transform = 'translate3d(0,' + offset.toFixed(2) + 'px,0)';
      });
      ticking = false;
    }

    window.addEventListener('scroll', function(){
      if(!ticking){ requestAnimationFrame(updateDrift); ticking = true; }
    }, { passive: true });
    window.addEventListener('resize', updateDrift);
    updateDrift();
  }

})();
