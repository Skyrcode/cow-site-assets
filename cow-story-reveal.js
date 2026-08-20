/* ============================================================
   CHOICE OF WEALTH — Motion Pack v1 (JS)
   Drives cw-m-fade / cw-m-clip / cw-m-text reveals.

   No auto-tagging. Only watches elements that already carry
   one of the reveal classes in the HTML — you place those by
   hand, once, on exactly the elements you want to move.

   Includes a built-in safety net: if an element is still
   unrevealed 2s after this script runs, it force-reveals.
   This is not a bug workaround bolted on later — it's a
   permanent guarantee that no scroll-reveal element can ever
   get stuck invisible, regardless of load-order quirks, CMS
   re-renders, or anything else.

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
          io.unobserve(entry.target); // fire once, never re-mask
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    revealEls.forEach(function(el){ io.observe(el); });
  } else {
    revealEls.forEach(function(el){ el.classList.add('cw-m-in'); });
  }

  // Safety net — guarantees nothing stays invisible.
  setTimeout(function(){
    revealEls.forEach(function(el){
      if(!el.classList.contains('cw-m-in')) el.classList.add('cw-m-in');
    });
  }, 2000);

});
