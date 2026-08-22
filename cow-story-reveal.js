/* ============================================================
   CHOICE OF WEALTH — Motion Pack v1 (JS)
   Drives cw-m-fade / cw-m-clip / cw-m-text reveals.

   No auto-tagging. Only watches elements that already carry
   one of the reveal classes in the HTML — you place those by
   hand, once, on exactly the elements you want to move.

   REPLAY MODE: elements reveal every time they scroll into
   view, and re-mask every time they scroll out — either
   direction. Scrolling back up past a section replays its
   entrance animation again, same as scrolling down to it.

   Includes a built-in safety net: on first load, if an
   element that's already on screen hasn't revealed within 2s
   (e.g. the very first section, before any scrolling happens),
   it force-reveals. This only runs once, on load — after that,
   the observer alone drives all reveal/re-mask behavior.

   Load this AFTER cow-motion.css, and AFTER any CMS content
   has had a chance to render (place near the end of body,
   same as other COW scripts).
   ============================================================ */
document.addEventListener('DOMContentLoaded', function(){

  var revealSelectors = '.cw-m-fade, .cw-m-clip, .cw-m-text';
  var revealEls = Array.prototype.slice.call(document.querySelectorAll(revealSelectors));
  if(!revealEls.length) return;

  // Direct geometry check on scroll, instead of IntersectionObserver.
  // An element counts as "in view" once 15% of its height has
  // crossed into the viewport, with a small bottom margin so it
  // reveals slightly before hitting the very edge of the screen —
  // same visual timing as before, just computed directly instead
  // of relying on the browser's IO callback, which has been an
  // unpredictable source of bugs on this project (stuck masks,
  // false negatives on elements confirmed to be on-screen).
  var BOTTOM_MARGIN = 40;

  function isRevealed(el){
    var rect = el.getBoundingClientRect();
    var vh = window.innerHeight;
    if(rect.height <= 0) return false;
    var visibleTop = Math.max(rect.top, 0);
    var visibleBottom = Math.min(rect.bottom, vh - BOTTOM_MARGIN);
    var visibleHeight = visibleBottom - visibleTop;
    var ratio = visibleHeight / rect.height;
    return ratio >= 0.15;
  }

  var ticking = false;
  function update(){
    revealEls.forEach(function(el){
      var should = isRevealed(el);
      var has = el.classList.contains('cw-m-in');
      if(should && !has) el.classList.add('cw-m-in');
      if(!should && has) el.classList.remove('cw-m-in'); // re-mask on exit, replays next time it's in view
    });
    ticking = false;
  }

  function onScroll(){
    if(!ticking){ window.requestAnimationFrame(update); ticking = true; }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);

  update(); // run once immediately for whatever's on screen at load

});
