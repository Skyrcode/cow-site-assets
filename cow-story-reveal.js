/* ============================================================
   CHOICE OF WEALTH — Story Reveal Pack v2 (JS)
   Site-wide scroll animation engine, modeled on the Ana Paula
   "My Story" reference page. Fully namespaced under "csr-".

   Does NOT touch the Members page's own animation system
   (cow-elevate.css/js) — this file auto-detects a Members page
   and skips auto-tagging there, so the two systems never fight.

   v2 adds AUTO-TAGGING: on page load, it automatically applies
   csr-reveal / csr-fade / csr-clip to normal page structure
   (direct sections of the page, their headings/paragraphs/images)
   so you don't have to hand-add classes to every element in the
   Webflow Designer. You can still hand-place csr-ln / csr-eyebrow-line
   / data-csr-count / data-csr-drift / .csr-ticker anywhere you want
   the fancier effects — auto-tagging only handles the basic
   fade-up + image-clip layer.

   HOW TO OPT OUT of auto-tagging on a specific element:
   add the attribute data-csr-skip to it (skips it and everything
   inside it).

   HOW TO OPT OUT of auto-tagging on an entire page:
   add data-csr-skip to the <body> tag in that page's Webflow
   page settings custom code, or just don't include this reveal
   pack in that page's needs (it's sitewide by default via the
   Head/Footer custom code, so the Members-page guard below is
   what actually protects that page).
   ============================================================ */
(function(){

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 0. AUTO-TAG — apply csr- classes to normal page structure ---------- */
  (function autoTag(){

    // Bail out entirely on the Members page — it already animates via cow-elevate.
    var isMembersPage = document.querySelector(
      '.member-eyebrow, .member-avatar, .membertopbar-inner, .member-brandmark, #story-viewer'
    );
    if (isMembersPage) return;

    // Elements/regions that should never be auto-tagged.
    var EXCLUDE = [
      'nav', '.navbar', '.footer-new',
      '.w-commerce-commercecartcontainerwrapper', '.cart',
      '.newsletter-form', 'form',
      '[data-csr-skip]', '[data-csr-skip] *'
    ].join(',');

    function isExcluded(el){
      return !!(el.closest && el.closest(EXCLUDE));
    }

    // Webflow wraps page content in .page-wrapper, with each major
    // section as a direct child (hero, about, pillars, testimonials,
    // footer, etc). That structure is a reliable, low-risk hook —
    // far safer than guessing class names per page.
    var wrapper = document.querySelector('.page-wrapper') || document.body;
    var topSections = wrapper.children;

    Array.prototype.forEach.call(topSections, function(sec){
      if (isExcluded(sec)) return;
      if (sec.classList.contains('csr-reveal') || sec.classList.contains('csr-no-auto')) return;

      sec.classList.add('csr-reveal');

      // Tag headings/paragraphs/images one and two levels deep inside
      // this section with a light stagger. Anything already carrying
      // a csr- class (hand-placed by you) is left alone.
      var candidates = sec.querySelectorAll(':scope > *, :scope > * > *');
      var delay = 0;

      Array.prototype.forEach.call(candidates, function(child){
        if (isExcluded(child)) return;
        if (child.matches('.csr-fade, .csr-ln, .csr-clip, .csr-eyebrow-line')) return;
        if (child.closest('.csr-fade, .csr-ln, .csr-clip')) return; // already inside a tagged node

        var tag = child.tagName.toLowerCase();

        if (tag === 'img') {
          child.classList.add('csr-clip');
          return;
        }
        if (['h1','h2','h3','h4','p'].indexOf(tag) !== -1) {
          child.classList.add('csr-fade');
          child.style.setProperty('--csr-d', delay.toFixed(2) + 's');
          delay = Math.min(delay + 0.08, 0.4);
        }
      });
    });
  })();

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
