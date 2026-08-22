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
  var revealEls = document.querySelectorAll(revealSelectors);
  if(!revealEls.length) return;

  if('IntersectionObserver' in window){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.classList.add('cw-m-in');
        } else {
          entry.target.classList.remove('cw-m-in'); // re-mask on exit, replays next time it's in view
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    revealEls.forEach(function(el){ io.observe(el); });
  } else {
    revealEls.forEach(function(el){ el.classList.add('cw-m-in'); });
  }

  // Safety net — only for the initial load moment, so whatever's
  // already on screen when the page opens doesn't sit invisible
  // waiting for a scroll event that may never come.
  setTimeout(function(){
    revealEls.forEach(function(el){
      var rect = el.getBoundingClientRect();
      var inViewport = rect.top < window.innerHeight && rect.bottom > 0;
      if(inViewport && !el.classList.contains('cw-m-in')) el.classList.add('cw-m-in');
    });
  }, 2000);

});
