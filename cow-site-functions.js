/* COW Members Page — Site-wide footer
   Sections: 1 Memberstack · 2 Avatar CSS · 3 Stories · 4 Tools Modal · 5 Audio Player · 6 Scroll Fix */
document.addEventListener('DOMContentLoaded',function(){

/* ═══════════════════════════════════════════════════
   1. MEMBERSTACK — FIRST NAME
═══════════════════════════════════════════════════ */
function initMemberName(){
  if(!window.$memberstackDom)return;
  window.$memberstackDom.getCurrentMember().then(function(res){
    if(!res||!res.data)return;
    var m=res.data;
    var first=(m.customFields&&(m.customFields['first-name']||m.customFields['firstName']))||
              (m.metaData&&(m.metaData.firstName||m.metaData['first-name']))||
              (m.name?m.name.split(' ')[0]:'')||'';
    first=first.trim();
    if(!first)return;
    var avatar=document.querySelector('.member-avatar');
    if(avatar)avatar.textContent=first;
    var nameChip=document.querySelector('.member-name-chip');
    if(nameChip)nameChip.textContent=first;
    var heroName=document.querySelector('.member-eyebrow .text-block-19');
    if(heroName)heroName.textContent='Welcome back, '+first;
  }).catch(function(e){console.warn('[COW] member error',e);});
}
initMemberName();

/* ═══════════════════════════════════════════════════
   2. INJECT AVATAR + TAP ZONE CSS
═══════════════════════════════════════════════════ */
var styleEl=document.createElement('style');
styleEl.textContent=[
  '.avatar-teal,.story-bg-teal{background:var(--teal-deep);color:var(--cream);display:grid;place-items:center;width:100%;height:100%;border-radius:50%;font-family:"Cormorant Garamond",serif;font-style:italic;font-size:22px;}',
  '.avatar-pink,.story-bg-pink{background:var(--pink-deep);color:var(--cream);display:grid;place-items:center;width:100%;height:100%;border-radius:50%;font-family:"Cormorant Garamond",serif;font-style:italic;font-size:22px;}',
  '.avatar-gold,.story-bg-gold{background:var(--gold);color:var(--near-black);display:grid;place-items:center;width:100%;height:100%;border-radius:50%;font-family:"Cormorant Garamond",serif;font-size:22px;}',
  '.avatar-ibeige,.story-bg-beige{background:var(--beige);color:var(--near-black);display:grid;place-items:center;width:100%;height:100%;border-radius:50%;font-size:22px;}',
  '.story-tap-zone{position:absolute;inset:0;display:flex;z-index:5;pointer-events:none;}',
  '.tap-prev,.tap-next{flex:1;cursor:pointer;pointer-events:auto;}',
  '#tap-prev,#tap-next{flex:1;cursor:pointer;pointer-events:auto;}',
  '.story-content{position:relative;flex:1;display:flex;flex-direction:column;}',
  '.story-media.fullbleed{padding:0;}',
  '.story-stage{touch-action:none;overscroll-behavior:contain;}',
  '.story-progress{position:absolute!important;top:max(12px,env(safe-area-inset-top))!important;left:max(12px,env(safe-area-inset-left))!important;right:max(12px,env(safe-area-inset-right))!important;z-index:20!important;display:flex!important;gap:4px!important;box-sizing:border-box!important;margin:0!important;}',
  '.story-header{position:absolute!important;top:max(26px,calc(env(safe-area-inset-top) + 14px))!important;left:max(16px,env(safe-area-inset-left))!important;right:max(16px,env(safe-area-inset-right))!important;z-index:15!important;display:flex!important;align-items:center!important;justify-content:space-between!important;pointer-events:none!important;box-sizing:border-box!important;margin:0!important;}'
].join('');
document.head.appendChild(styleEl);

/* ═══════════════════════════════════════════════════
   3. STORIES
═══════════════════════════════════════════════════ */
var STORY_DURATION=6000;
var storyOrder=['lesson','quote','book','founder','tools','behind','reviews'];
var viewedStories={};
var currentKey=null,currentSlide=0,storyTimer=null,storyStart=0,storyElapsed=0,storyPaused=false;
var viewer=document.getElementById('story-viewer');
var stageEl=document.getElementById('story-stage');
var progressEl=document.getElementById('story-progress');
var headerEl=document.getElementById('story-header');
var contentEl=document.getElementById('story-content');

function getSlidesForStory(key){
  var slides=[];
  var items=document.querySelectorAll('[data-slide-story="'+key+'"]');
  if(items.length){
    items.forEach(function(el){slides.push(readSlideFromEl(el));});
    slides.sort(function(a,b){return(a.order||0)-(b.order||0);});
    return slides;
  }
  var scopedList=document.querySelector('[data-story-slides="'+key+'"]');
  if(scopedList){
    scopedList.querySelectorAll('.w-dyn-item').forEach(function(el){slides.push(readSlideFromEl(el));});
    slides.sort(function(a,b){return(a.order||0)-(b.order||0);});
    return slides;
  }
  var allSlideEls=document.querySelectorAll('[data-slide-slug]');
  allSlideEls.forEach(function(el){
    var slug=el.getAttribute('data-slide-slug')||'';
    if(slug.toLowerCase().indexOf(key)===0||slug.toLowerCase().indexOf(key+'-')!==-1){slides.push(readSlideFromEl(el));}
  });
  if(slides.length){
    slides.sort(function(a,b){return(a.order||0)-(b.order||0);});
    return slides;
  }
  return[defaultSlide(key)];
}

function readSlideFromEl(el){
  var typeVal=(el.getAttribute('data-slide-type')||el.getAttribute('data-type')||'text').toLowerCase();
  return{
    order:parseInt(el.getAttribute('data-slide-order')||el.getAttribute('data-order')||'1'),
    type:typeVal,
    bg:el.getAttribute('data-slide-bg')||el.getAttribute('data-bg')||'bg-teal-deep',
    heading:el.getAttribute('data-slide-heading')||el.getAttribute('data-heading')||(el.querySelector('[data-heading]')?el.querySelector('[data-heading]').textContent.trim():''),
    body:el.getAttribute('data-slide-body')||el.getAttribute('data-body')||(el.querySelector('[data-body]')?el.querySelector('[data-body]').textContent.trim():''),
    ctaLabel:el.getAttribute('data-slide-cta-label')||el.getAttribute('data-cta-label')||'',
    ctaLink:el.getAttribute('data-slide-cta-link')||el.getAttribute('data-cta-link')||'#',
    image:(typeVal==='video'
      ? el.getAttribute('data-slide-video')
      : el.getAttribute('data-slide-image'))
      ||el.getAttribute('data-image')||(el.querySelector('img')?el.querySelector('img').src:''),
    duration:parseInt(el.getAttribute('data-slide-duration')||el.getAttribute('data-max-duration')||'0')*1000||STORY_DURATION
  };
}

function defaultSlide(key){
  var defaults={
    reviews:{bg:'bg-gold',heading:'Member Reviews',body:'Real stories from women building wealth.',ctaLabel:'Read more',ctaLink:'#'},
    lesson:{bg:'bg-teal-deep',heading:'New Lesson',body:'A new audio lesson is available. Tap to listen.',ctaLabel:'Listen now',ctaLink:'#audio'},
    quote:{bg:'bg-pink-deep',heading:"This week's quote",body:'You are not too late.',ctaLabel:'',ctaLink:'#'},
    book:{bg:'bg-cream',heading:'30 Days to Take Control of Your Money',body:'Included with your membership.',ctaLabel:'Download',ctaLink:'#library'},
    behind:{bg:'bg-blush',heading:'A note from Ana Paula',body:'New lessons are landing this month.',ctaLabel:'Continue learning',ctaLink:'#lessons'},
    tools:{bg:'bg-cream',heading:'New Tool',body:'See how fast you can get debt-free with the Debt Payoff Planner.',ctaLabel:'Open toolkit',ctaLink:'#tools'}
  };
  var d=defaults[key]||defaults.lesson;
  return{order:1,type:'text',bg:d.bg,heading:d.heading,body:d.body,ctaLabel:d.ctaLabel,ctaLink:d.ctaLink,image:'',duration:STORY_DURATION};
}

function openStory(key){
  currentKey=key;currentSlide=0;storyElapsed=0;
  viewer.classList.add('show');
  document.body.style.overflow='hidden';
  if(window.lenis)window.lenis.stop();
  renderStoryFrame();
  viewedStories[key]=true;
  var ring=document.querySelector('[data-story-key="'+key+'"]');
  if(ring)ring.classList.add('viewed');
}

function closeStory(){
  viewer.classList.remove('show');
  document.body.style.overflow='';
  if(window.lenis)window.lenis.start();
  stopStoryTimer();
  progressEl.innerHTML='';
  headerEl.innerHTML='';
  contentEl.innerHTML='';
}

function renderStoryFrame(){
  var slides=getSlidesForStory(currentKey);
  var slide=slides[currentSlide]||slides[0];
  var circleEl=document.querySelector('[data-story-key="'+currentKey+'"]');
  var storyTitle=circleEl?(circleEl.querySelector('.story-label')||circleEl).textContent.trim():currentKey;

  progressEl.innerHTML='';
  for(var i=0;i<slides.length;i++){
    var bar=document.createElement('div');
    bar.className='story-progress-bar'+(i<currentSlide?' done':'');
    bar.innerHTML='<div class="story-progress-fill" style="width:'+(i<currentSlide?'100':'0')+'%"></div>';
    progressEl.appendChild(bar);
  }

  var avatarInner=circleEl?circleEl.querySelector('.story-ring-inner'):null;
  var avatarHTML='';
  if(avatarInner){
    var img=avatarInner.querySelector('img');
    if(img&&img.src&&img.src.indexOf('placeholder')===-1){
      avatarHTML='<div class="story-header-avatar"><img src="'+img.src+'" alt=""/></div>';
    }else{
      var avDiv=avatarInner.firstElementChild;
      var avText=avDiv?avDiv.textContent.trim():'';
      var avClass='teal';
      if(avDiv){
        if(avDiv.classList.contains('avatar-pink')||avDiv.classList.contains('story-bg-pink'))avClass='pink';
        else if(avDiv.classList.contains('avatar-gold')||avDiv.classList.contains('story-bg-gold'))avClass='gold';
        else if(avDiv.classList.contains('avatar-ibeige')||avDiv.classList.contains('story-bg-beige'))avClass='beige';
      }
      avatarHTML='<div class="story-header-avatar solid '+avClass+'">'+avText+'</div>';
    }
  }

  headerEl.innerHTML=
    '<div class="story-header-left">'+avatarHTML+
      '<div><div class="story-header-name">'+storyTitle+'</div>'+
      '<div class="story-header-time">Just added</div></div>'+
    '</div>'+
    '<button class="story-close" id="story-close-btn" aria-label="Close">'+
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:22px;height:22px">'+
        '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>'+
      '</svg>'+
    '</button>';
  document.getElementById('story-close-btn').addEventListener('click',closeStory);

  var mediaHTML='';
if(slide.type==='image'&&slide.image){
  mediaHTML='<img src="'+slide.image+'" alt="" style="width:100%;height:100%;object-fit:cover;" />';
}else if(slide.type==='video'&&slide.image){
  mediaHTML='<video id="story-video-el" autoplay playsinline preload="auto" style="width:100%;height:100%;object-fit:cover;"></video>';
}else{
  mediaHTML='<div class="story-h1">'+(slide.heading||'')+'</div>';
}

  var captionHTML='';
  if(slide.body){captionHTML='<div class="story-caption"><p>'+slide.body+'</p></div>';}

  var ctaHTML='';
  if(slide.ctaLabel){
    ctaHTML='<div class="story-cta"><a href="'+slide.ctaLink+'" class="pink">'+slide.ctaLabel+
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;margin-left:6px"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>'+
      '</a></div>';
  }

  var mediaClass='story-media '+slide.bg+((slide.type==='image'||slide.type==='video')?' fullbleed':'');
contentEl.innerHTML=
  '<div class="'+mediaClass+'">'+mediaHTML+'</div>'+
    captionHTML+ctaHTML+
    '<div style="position:absolute;inset:0;display:flex;z-index:5;pointer-events:none;">'+
      '<div id="tap-prev" style="flex:1;cursor:pointer;pointer-events:auto;"></div>'+
      '<div id="tap-next" style="flex:1;cursor:pointer;pointer-events:auto;"></div>'+
    '</div>';

  document.getElementById('tap-prev').addEventListener('click',prevStorySlide);
  document.getElementById('tap-next').addEventListener('click',nextStorySlide);

  // Load Bunny HLS video into the story video element
  if(slide.type==='video'&&slide.image){
    var videoEl=document.getElementById('story-video-el');

    if(videoEl){
      videoEl.insertAdjacentHTML('afterend','<div id="story-video-loading" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none;"><div style="width:32px;height:32px;border:3px solid rgba(255,255,255,0.3);border-top-color:#fff;border-radius:50%;animation:cowspin 0.8s linear infinite;"></div></div>');
      videoEl.addEventListener('playing',function(){
        var l=document.getElementById('story-video-loading');
        if(l)l.remove();
      },{once:true});

      if(window.currentStoryHls){window.currentStoryHls.destroy();window.currentStoryHls=null;}
      if(videoEl.canPlayType('application/vnd.apple.mpegurl')){
        videoEl.src=slide.image;
     }else if(window.Hls&&Hls.isSupported()){
  var hls=new Hls({capLevelToPlayerSize:false});
  hls.on(Hls.Events.MANIFEST_PARSED,function(){
    hls.currentLevel = hls.levels.length - 1;
  });
  hls.loadSource(slide.image);
  hls.attachMedia(videoEl);
  window.currentStoryHls=hls;
}

     videoEl.muted = false;
      var playPromise = videoEl.play();
      if (playPromise) {
        playPromise.catch(function(err){
          console.warn('[COW] unmuted autoplay blocked, retrying muted', err);
          videoEl.muted = true;
          videoEl.play();
        });
      }

      // Drive the progress bar off real video playback time
      videoEl.addEventListener('timeupdate',function(){
        if(!videoEl.duration)return;
        var bar=progressEl.children[currentSlide];
        var fillEl=bar?bar.querySelector('.story-progress-fill'):null;
        if(!fillEl)return;
        var pct=Math.min(100,(videoEl.currentTime/videoEl.duration)*100);
        fillEl.style.width=pct+'%';
      });
      videoEl.addEventListener('ended',function(){
        nextStorySlide();
      },{once:true});

      var nextSlide = slides[currentSlide + 1];
      if (nextSlide && nextSlide.type === 'video' && nextSlide.image) {
        var preloadLink = document.createElement('link');
        preloadLink.rel = 'preload';
        preloadLink.as = 'fetch';
        preloadLink.href = nextSlide.image;
        preloadLink.crossOrigin = 'anonymous';
        document.head.appendChild(preloadLink);
      }
    } // closes if(videoEl)
  } // closes if(slide.type==='video'&&slide.image)

 storyElapsed=0;
  if(slide.type==='video'&&slide.image){
    // Video-driven progress instead of fixed timer
  }else{
    startStoryTimer(slide.duration||STORY_DURATION);
  }
} // closes renderStoryFrame

function startStoryTimer(dur){
  stopStoryTimer();
  storyStart=Date.now();storyPaused=false;
  var fillEl=progressEl.children[currentSlide]&&progressEl.children[currentSlide].querySelector('.story-progress-fill');
  storyTimer=setInterval(function(){
    if(storyPaused)return;
    storyElapsed=Date.now()-storyStart;
    var pct=Math.min(100,(storyElapsed/dur)*100);
    if(fillEl)fillEl.style.width=pct+'%';
    if(storyElapsed>=dur){stopStoryTimer();nextStorySlide();}
  },30);
}
function stopStoryTimer(){if(storyTimer){clearInterval(storyTimer);storyTimer=null;}}

function nextStorySlide(){
  var slides=getSlidesForStory(currentKey);
  if(currentSlide<slides.length-1){currentSlide++;renderStoryFrame();}
  else{var idx=storyOrder.indexOf(currentKey);if(idx<storyOrder.length-1){openStory(storyOrder[idx+1]);}else{closeStory();}}
}
function prevStorySlide(){
  if(currentSlide>0){currentSlide--;renderStoryFrame();}
  else{var idx=storyOrder.indexOf(currentKey);if(idx>0){openStory(storyOrder[idx-1]);}}
}

var holdTimer=null;
if(stageEl){
  stageEl.addEventListener('mousedown',function(){holdTimer=setTimeout(function(){
    storyPaused=true;
    var v=document.getElementById('story-video-el');
    if(v)v.pause();
  },250);});
  stageEl.addEventListener('mouseup',function(){
    clearTimeout(holdTimer);
    if(storyPaused){
      storyPaused=false;storyStart=Date.now()-storyElapsed;
      var v=document.getElementById('story-video-el');
      if(v)v.play();
    }
  });
}

// Merged hold-to-pause + swipe-down-to-close (single gesture handler, non-passive)
(function(){
  if(!stageEl)return;
  var startY=0, startX=0, currentY=0, dragging=false, isVerticalDrag=null;

  stageEl.addEventListener('touchstart',function(e){
    if(e.touches.length!==1)return;
    startY=e.touches[0].clientY;
    startX=e.touches[0].clientX;
    currentY=startY;
    dragging=true;
    isVerticalDrag=null;
    stageEl.style.transition='none';
    holdTimer=setTimeout(function(){
      if(isVerticalDrag===null){
        storyPaused=true;
        var v=document.getElementById('story-video-el');
        if(v)v.pause();
      }
    },250);
  },{passive:true});

  stageEl.addEventListener('touchmove',function(e){
    if(!dragging)return;
    currentY=e.touches[0].clientY;
    var currentX=e.touches[0].clientX;
    var deltaY=currentY-startY;
    var deltaX=currentX-startX;

    if(isVerticalDrag===null&&(Math.abs(deltaY)>10||Math.abs(deltaX)>10)){
      isVerticalDrag=Math.abs(deltaY)>Math.abs(deltaX);
      clearTimeout(holdTimer);
    }

    if(isVerticalDrag&&deltaY>0){
      e.preventDefault();
      stageEl.style.transform='translateY('+deltaY+'px)';
      var fade=Math.max(0,1-(deltaY/400));
      viewer.style.background='rgba(0,0,0,'+(0.85*fade)+')';
    }
  },{passive:false});

  stageEl.addEventListener('touchend',function(){
    if(!dragging)return;
    dragging=false;
    clearTimeout(holdTimer);
    var deltaY=currentY-startY;
    stageEl.style.transition='transform 0.25s ease-out';

    if(isVerticalDrag&&deltaY>100){
      stageEl.style.transform='translateY(100%)';
      setTimeout(function(){
        stageEl.style.transform='';
        viewer.style.background='';
        closeStory();
      },200);
    }else{
      stageEl.style.transform='translateY(0)';
      viewer.style.background='rgba(0,0,0,0.85)';
      if(storyPaused){
        storyPaused=false;storyStart=Date.now()-storyElapsed;
        var v=document.getElementById('story-video-el');
        if(v)v.play();
      }
    }
    isVerticalDrag=null;
  });
})();
document.addEventListener('keydown',function(e){
  if(!viewer||!viewer.classList.contains('show'))return;
  if(e.key==='Escape')closeStory();
  if(e.key==='ArrowRight')nextStorySlide();
  if(e.key==='ArrowLeft')prevStorySlide();
});

document.querySelectorAll('[data-story-key]').forEach(function(el){
  var key=el.getAttribute('data-story-key');
  if(!key)return;
  el.addEventListener('click',function(e){e.preventDefault();openStory(key);});
});

/* ═══════════════════════════════════════════════════
   4. TOOLS MODAL
═══════════════════════════════════════════════════ */
var existingBackdrop=document.getElementById('tools-backdrop');
if(!existingBackdrop){
  document.body.insertAdjacentHTML('beforeend',
    '<div id="tools-backdrop" style="display:none;position:fixed;inset:0;background:rgba(22,79,92,0.55);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);z-index:9000;align-items:center;justify-content:center;padding:24px;">'+
      '<div id="tools-modal" style="background:var(--cream);width:100%;max-width:740px;max-height:90vh;overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;border-radius:6px;position:relative;box-shadow:0 24px 80px rgba(0,0,0,0.25);">'+
        '<div style="display:flex;justify-content:space-between;align-items:center;padding:24px 32px;background:var(--teal-deep);color:var(--cream);position:sticky;top:0;z-index:2;border-radius:6px 6px 0 0;">'+
          '<div><div id="tools-modal-ix" style="font-size:10px;letter-spacing:0.22em;color:var(--pink-soft);text-transform:uppercase;font-weight:600;margin-bottom:4px;"></div>'+
          '<h3 id="tools-modal-title" style="font-family:\'Cormorant Garamond\',serif;font-weight:500;font-size:24px;margin:0;color:var(--cream);"></h3></div>'+
          '<div style="display:flex;align-items:center;gap:8px;">'+
          '<button id="tools-currency-btn" style="width:34px;height:34px;border:1px solid rgba(248,187,217,0.35);background:transparent;color:var(--cream);cursor:pointer;font-size:14px;font-weight:600;display:grid;place-items:center;border-radius:50%;">$</button>'+
          '<button id="tools-modal-close" style="width:34px;height:34px;border:1px solid rgba(248,187,217,0.35);background:transparent;color:var(--cream);cursor:pointer;font-size:18px;display:grid;place-items:center;border-radius:50%;">&#x2715;</button>'+
          '</div>'+
        '</div>'+
        '<div id="tools-modal-body" style="padding:36px 32px 40px;"></div>'+
      '</div>'+
    '</div>');
}

var toolsBackdrop=document.getElementById('tools-backdrop');
var toolsModal=document.getElementById('tools-modal');
var toolsClose=document.getElementById('tools-modal-close');
var toolsBody=document.getElementById('tools-modal-body');
var currentToolFn=null;

var toolsCurrencyBtn=document.getElementById('tools-currency-btn');
if(toolsCurrencyBtn){
  toolsCurrencyBtn.addEventListener('click',function(){
    currencyIdx=(currencyIdx+1)%currencySymbols.length;
    toolsCurrencyBtn.textContent=currencySymbols[currencyIdx];
    if(currentToolFn){toolsBody.innerHTML='';currentToolFn(toolsBody);}
  });
}

if(toolsModal){
  toolsModal.addEventListener('wheel',function(e){e.stopPropagation();},{passive:true});
  toolsModal.addEventListener('touchmove',function(e){e.stopPropagation();},{passive:true});
}

function openToolModal(ix,title,buildFn){
  currentToolFn=buildFn;
  document.getElementById('tools-modal-ix').textContent=ix;
  document.getElementById('tools-modal-title').textContent=title;
  toolsBody.innerHTML='';
  buildFn(toolsBody);
  toolsBackdrop.style.display='flex';
  toolsModal.scrollTop=0;
  document.body.style.overflow='hidden';
  if(window.lenis)window.lenis.stop();
}
function closeToolModal(){
  toolsBackdrop.style.display='none';
  toolsBody.innerHTML='';
  document.body.style.overflow='';
  if(window.lenis)window.lenis.start();
}
if(toolsClose)toolsClose.addEventListener('click',closeToolModal);
if(toolsBackdrop)toolsBackdrop.addEventListener('click',function(e){if(e.target===toolsBackdrop)closeToolModal();});
document.addEventListener('keydown',function(e){
  if(e.key==='Escape'&&toolsBackdrop&&toolsBackdrop.style.display==='flex')closeToolModal();
});

var currencySymbols=['$','£','€'];
var currencyIdx=0;
var fmt=function(n){return currencySymbols[currencyIdx]+Math.round(n).toLocaleString('en-US');};

function buildBudget(body){
  body.innerHTML=
    '<p style="margin-bottom:14px;color:var(--body-gray);font-size:14px;">The classic 50/30/20 framework: half toward what you need, three-tenths toward what you want, two-tenths toward what you\'ll become.</p>'+
    '<p style="margin-bottom:22px;color:var(--body-gray);font-size:13px;font-style:italic;">The 50/30/20 split is a starting point, not a rule &mdash; your circumstances and priorities may look different.</p>'+
    '<div class="field"><label style="font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:var(--body-gray);font-weight:600;display:block;margin-bottom:8px;">Monthly After-Tax Income</label>'+
    '<input type="number" id="cw-budget-in" value="8000" style="background:var(--white);border:1px solid var(--line);padding:13px 16px;font-size:16px;border-radius:3px;width:100%;font-family:inherit;" /></div>'+
    '<div style="display:flex;height:38px;margin:24px 0 8px;overflow:hidden;border-radius:3px;">'+
      '<div style="background:var(--teal-deep);flex:50;display:grid;place-items:center;font-size:11px;letter-spacing:0.1em;color:var(--cream);font-weight:600;">50% Needs</div>'+
      '<div style="background:var(--pink-deep);flex:30;display:grid;place-items:center;font-size:11px;letter-spacing:0.1em;color:var(--cream);font-weight:600;">30% Wants</div>'+
      '<div style="background:var(--gold);flex:20;display:grid;place-items:center;font-size:11px;letter-spacing:0.1em;color:var(--near-black);font-weight:600;">20% Save</div>'+
    '</div>'+
    '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-top:16px;">'+
      '<div style="padding:16px;background:var(--white);border-top:3px solid var(--teal-deep);border-radius:0 0 3px 3px;"><div style="font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:var(--body-gray);margin-bottom:6px;font-weight:600;">Needs</div><div id="cw-b-needs" style="font-family:\'Cormorant Garamond\',serif;font-size:24px;color:var(--near-black);">$4,000</div><div style="font-size:11px;color:var(--body-gray);margin-top:2px;">50%</div></div>'+
      '<div style="padding:16px;background:var(--white);border-top:3px solid var(--pink-deep);border-radius:0 0 3px 3px;"><div style="font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:var(--body-gray);margin-bottom:6px;font-weight:600;">Wants</div><div id="cw-b-wants" style="font-family:\'Cormorant Garamond\',serif;font-size:24px;color:var(--near-black);">$2,400</div><div style="font-size:11px;color:var(--body-gray);margin-top:2px;">30%</div></div>'+
      '<div style="padding:16px;background:var(--white);border-top:3px solid var(--gold);border-radius:0 0 3px 3px;"><div style="font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:var(--body-gray);margin-bottom:6px;font-weight:600;">Save</div><div id="cw-b-save" style="font-family:\'Cormorant Garamond\',serif;font-size:24px;color:var(--near-black);">$1,600</div><div style="font-size:11px;color:var(--body-gray);margin-top:2px;">20%</div></div>'+
    '</div>'+
    '<div style="margin-top:24px;padding:24px 28px;background:var(--teal-deep);color:var(--cream);border-radius:4px;position:relative;">'+
      '<div style="position:absolute;left:0;top:20px;bottom:20px;width:3px;background:var(--pink-soft);"></div>'+
      '<div style="font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:var(--pink-soft);margin-bottom:16px;font-weight:600;">Annualised Projection</div>'+
      '<div style="display:flex;justify-content:space-between;align-items:baseline;padding:10px 0;border-bottom:1px solid rgba(248,187,217,0.15);"><span style="font-size:13px;color:rgba(250,247,244,0.75);">Saved per year</span><span id="cw-b-year" style="font-family:\'Cormorant Garamond\',serif;font-size:30px;color:var(--pink-soft);"></span></div>'+
      '<div style="display:flex;justify-content:space-between;align-items:baseline;padding:10px 0;border-bottom:1px solid rgba(248,187,217,0.15);"><span style="font-size:13px;color:rgba(250,247,244,0.75);">In 10 years (no growth)</span><span id="cw-b-decade" style="font-family:\'Cormorant Garamond\',serif;font-size:22px;"></span></div>'+
      '<div style="display:flex;justify-content:space-between;align-items:baseline;padding:10px 0;"><span style="font-size:13px;color:rgba(250,247,244,0.75);">In 10 years at 7%</span><span id="cw-b-decade7" style="font-family:\'Cormorant Garamond\',serif;font-size:22px;"></span></div>'+
    '</div>'+
    '<button id="cw-budget-reset" style="margin-top:16px;padding:10px 18px;font-size:12px;background:transparent;color:var(--teal-deep);border:1px solid var(--teal-deep);border-radius:3px;cursor:pointer;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;font-family:inherit;">Start Again</button>';
  var input=document.getElementById('cw-budget-in');
  document.getElementById('cw-budget-reset').addEventListener('click',function(){input.value=8000;recalc();});
  function recalc(){
    var v=parseFloat(input.value)||0;
    document.getElementById('cw-b-needs').textContent=fmt(v*0.5);
    document.getElementById('cw-b-wants').textContent=fmt(v*0.3);
    document.getElementById('cw-b-save').textContent=fmt(v*0.2);
    document.getElementById('cw-b-year').textContent=fmt(v*0.2*12);
    document.getElementById('cw-b-decade').textContent=fmt(v*0.2*12*10);
    var monthly=v*0.2,r=0.07/12,n=120;
    document.getElementById('cw-b-decade7').textContent=fmt(monthly*((Math.pow(1+r,n)-1)/r));
  }
  input.addEventListener('input',recalc);
  recalc();
}

function buildNetWorth(body){
  var defaultAssets=function(){return[{name:'Brokerage account',value:184000},{name:'Retirement (pension/ISA)',value:142000},{name:'Cash & savings',value:38000},{name:'Property equity',value:156000}];};
  var defaultLiabilities=function(){return[{name:'Mortgage balance',value:84000},{name:'Car finance',value:8000}];};
  var assets=defaultAssets();
  var liabilities=defaultLiabilities();
  function render(){
    body.innerHTML=
      '<p style="font-size:14px;color:var(--body-gray);margin-bottom:20px;line-height:1.55;">Add your assets and liabilities below. Your net worth updates as you type.</p>'+
      '<div id="cw-nw-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px;">'+
        '<div><h4 style="font-size:11px;letter-spacing:0.2em;text-transform:uppercase;margin-bottom:12px;padding-bottom:8px;border-bottom:2px solid var(--teal-deep);color:var(--teal-deep);font-weight:600;">Assets</h4><div id="cw-assets-list"></div>'+
        '<button id="cw-add-asset" style="margin-top:8px;padding:7px 14px;font-size:11px;background:transparent;color:var(--teal-deep);border:1px solid var(--teal-deep);border-radius:3px;cursor:pointer;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;font-family:inherit;">+ Add Asset</button></div>'+
        '<div><h4 style="font-size:11px;letter-spacing:0.2em;text-transform:uppercase;margin-bottom:12px;padding-bottom:8px;border-bottom:2px solid var(--pink-deep);color:var(--pink-deep);font-weight:600;">Liabilities</h4><div id="cw-liab-list"></div>'+
        '<button id="cw-add-liab" style="margin-top:8px;padding:7px 14px;font-size:11px;background:transparent;color:var(--pink-deep);border:1px solid var(--pink-deep);border-radius:3px;cursor:pointer;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;font-family:inherit;">+ Add Liability</button></div>'+
      '</div>'+
      '<div style="padding:24px 28px;background:var(--teal-deep);color:var(--cream);border-radius:4px;position:relative;">'+
        '<div style="position:absolute;left:0;top:20px;bottom:20px;width:3px;background:var(--pink-soft);"></div>'+
        '<div style="font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:var(--pink-soft);margin-bottom:16px;font-weight:600;">Your Net Worth</div>'+
        '<div style="display:flex;justify-content:space-between;align-items:baseline;padding:10px 0;border-bottom:1px solid rgba(248,187,217,0.15);"><span style="font-size:13px;color:rgba(250,247,244,0.75);">Total Assets</span><span id="cw-t-assets" style="font-family:\'Cormorant Garamond\',serif;font-size:22px;">$0</span></div>'+
        '<div style="display:flex;justify-content:space-between;align-items:baseline;padding:10px 0;border-bottom:1px solid rgba(248,187,217,0.15);"><span style="font-size:13px;color:rgba(250,247,244,0.75);">Total Liabilities</span><span id="cw-t-liab" style="font-family:\'Cormorant Garamond\',serif;font-size:22px;">$0</span></div>'+
        '<div style="display:flex;justify-content:space-between;align-items:baseline;padding:10px 0;"><span style="font-size:13px;color:rgba(250,247,244,0.75);">Your estimated net worth</span><span id="cw-t-net" style="font-family:\'Cormorant Garamond\',serif;font-size:30px;color:var(--pink-soft);">$0</span></div>'+
      '</div>'+
      '<p style="margin-top:14px;color:var(--body-gray);font-size:13px;font-style:italic;">This is a snapshot, not a judgement &mdash; it reflects the numbers you enter today, and will naturally change over time.</p>'+
      '<button id="cw-nw-reset" style="margin-top:16px;padding:10px 18px;font-size:12px;background:transparent;color:var(--teal-deep);border:1px solid var(--teal-deep);border-radius:3px;cursor:pointer;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;font-family:inherit;">Start Again</button>';
    if(window.innerWidth<600)document.getElementById('cw-nw-grid').style.gridTemplateColumns='1fr';
    var aList=document.getElementById('cw-assets-list');
    var lList=document.getElementById('cw-liab-list');
    function makeRow(listEl,arr,i){
      var row=document.createElement('div');
      row.style.cssText='display:grid;grid-template-columns:1fr 110px 30px;gap:8px;margin-bottom:8px;align-items:center;';
      row.innerHTML=
        '<input type="text" value="'+arr[i].name+'" style="padding:8px 10px;border:1px solid var(--line);background:var(--white);font-size:13px;border-radius:3px;color:var(--near-black);font-family:inherit;width:100%;min-width:0;" />'+
        '<input type="number" value="'+arr[i].value+'" style="padding:8px 10px;border:1px solid var(--line);background:var(--white);font-size:13px;border-radius:3px;color:var(--near-black);font-family:inherit;width:100%;min-width:0;" />'+
        '<button style="width:30px;height:30px;border:1px solid var(--line);background:var(--white);cursor:pointer;color:var(--pink-deep);font-size:16px;border-radius:3px;display:grid;place-items:center;">\xd7</button>';
      row.querySelectorAll('input')[0].addEventListener('input',function(e){arr[i].name=e.target.value;updateTotals();});
      row.querySelectorAll('input')[1].addEventListener('input',function(e){arr[i].value=parseFloat(e.target.value)||0;updateTotals();});
      row.querySelector('button').addEventListener('click',function(){arr.splice(i,1);render();});
      listEl.appendChild(row);
    }
    assets.forEach(function(_,i){makeRow(aList,assets,i);});
    liabilities.forEach(function(_,i){makeRow(lList,liabilities,i);});
    document.getElementById('cw-add-asset').addEventListener('click',function(){assets.push({name:'New asset',value:0});render();});
    document.getElementById('cw-add-liab').addEventListener('click',function(){liabilities.push({name:'New liability',value:0});render();});
    document.getElementById('cw-nw-reset').addEventListener('click',function(){assets=defaultAssets();liabilities=defaultLiabilities();render();});
    updateTotals();
  }
  function updateTotals(){
    var a=assets.reduce(function(s,x){return s+(parseFloat(x.value)||0);},0);
    var l=liabilities.reduce(function(s,x){return s+(parseFloat(x.value)||0);},0);
    document.getElementById('cw-t-assets').textContent=fmt(a);
    document.getElementById('cw-t-liab').textContent=fmt(l);
    var netEl=document.getElementById('cw-t-net');
    netEl.textContent=fmt(a-l);
    netEl.style.color=(a-l)>=0?'var(--pink-soft)':'#ff6b6b';
  }
  render();
}

function buildCompound(body){
  body.innerHTML=
    '<p style="margin-bottom:22px;color:var(--body-gray);font-size:14px;">The eighth wonder of the world. Set your inputs and watch contributions and interest separate as the years stretch out.</p>'+
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;" id="ci-grid">'+
      '<div style="display:flex;flex-direction:column;gap:8px;"><label style="font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:var(--body-gray);font-weight:600;">Starting Amount</label><input type="number" id="cw-ci-start" value="10000" style="background:var(--white);border:1px solid var(--line);padding:13px 16px;font-size:16px;border-radius:3px;width:100%;font-family:inherit;" /></div>'+
      '<div style="display:flex;flex-direction:column;gap:8px;"><label style="font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:var(--body-gray);font-weight:600;">Monthly Contribution</label><input type="number" id="cw-ci-month" value="500" style="background:var(--white);border:1px solid var(--line);padding:13px 16px;font-size:16px;border-radius:3px;width:100%;font-family:inherit;" /></div>'+
      '<div style="display:flex;flex-direction:column;gap:8px;"><label style="font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:var(--body-gray);font-weight:600;">Assumed annual rate (%)</label><input type="number" id="cw-ci-rate" value="7" step="0.1" style="background:var(--white);border:1px solid var(--line);padding:13px 16px;font-size:16px;border-radius:3px;width:100%;font-family:inherit;" /></div>'+
      '<div style="display:flex;flex-direction:column;gap:8px;"><label style="font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:var(--body-gray);font-weight:600;">Time period (years)</label><input type="number" id="cw-ci-years" value="25" style="background:var(--white);border:1px solid var(--line);padding:13px 16px;font-size:16px;border-radius:3px;width:100%;font-family:inherit;" /></div>'+
    '</div>'+
    '<div style="margin-top:24px;padding:24px 28px;background:var(--teal-deep);color:var(--cream);border-radius:4px;position:relative;">'+
      '<div style="position:absolute;left:0;top:20px;bottom:20px;width:3px;background:var(--pink-soft);"></div>'+
      '<div style="font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:var(--pink-soft);margin-bottom:16px;font-weight:600;">Your Projection</div>'+
      '<div style="display:flex;justify-content:space-between;align-items:baseline;padding:10px 0;border-bottom:1px solid rgba(248,187,217,0.15);"><span style="font-size:13px;color:rgba(250,247,244,0.75);">Illustrative final value</span><span id="cw-ci-final" style="font-family:\'Cormorant Garamond\',serif;font-size:30px;color:var(--pink-soft);"></span></div>'+
      '<div style="display:flex;justify-content:space-between;align-items:baseline;padding:10px 0;border-bottom:1px solid rgba(248,187,217,0.15);"><span style="font-size:13px;color:rgba(250,247,244,0.75);">Total Contributions</span><span id="cw-ci-contrib" style="font-family:\'Cormorant Garamond\',serif;font-size:22px;"></span></div>'+
      '<div style="display:flex;justify-content:space-between;align-items:baseline;padding:10px 0;"><span style="font-size:13px;color:rgba(250,247,244,0.75);">Illustrative growth</span><span id="cw-ci-int" style="font-family:\'Cormorant Garamond\',serif;font-size:22px;"></span></div>'+
      '<div id="cw-ci-bars" style="display:flex;gap:6px;align-items:flex-end;height:80px;margin-top:20px;"></div>'+
      '<div id="cw-ci-labels" style="display:flex;gap:6px;margin-top:6px;"></div>'+
    '</div>'+
    '<p style="margin-top:14px;color:var(--body-gray);font-size:13px;font-style:italic;">This is an educational illustration based on a fixed assumed rate &mdash; actual returns will vary and are never guaranteed.</p>'+
    '<button id="cw-compound-reset" style="margin-top:16px;padding:10px 18px;font-size:12px;background:transparent;color:var(--teal-deep);border:1px solid var(--teal-deep);border-radius:3px;cursor:pointer;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;font-family:inherit;">Start Again</button>';
  if(window.innerWidth<600)document.getElementById('ci-grid').style.gridTemplateColumns='1fr';
  var ciDefaults=['10000','500','7','25'];
  var inputs=['cw-ci-start','cw-ci-month','cw-ci-rate','cw-ci-years'].map(function(id){return document.getElementById(id);});
  inputs.forEach(function(inp){inp.addEventListener('input',recalc);});
  document.getElementById('cw-compound-reset').addEventListener('click',function(){
    inputs.forEach(function(inp,i){inp.value=ciDefaults[i];});
    recalc();
  });
  function recalc(){
    var P=parseFloat(inputs[0].value)||0,m=parseFloat(inputs[1].value)||0;
    var r=(parseFloat(inputs[2].value)||0)/100,y=Math.max(0,Math.floor(parseFloat(inputs[3].value)||0));
    var mr=r/12,n=y*12;
    var fv=P*Math.pow(1+mr,n)+(mr>0?m*((Math.pow(1+mr,n)-1)/mr):m*n);
    var contrib=P+m*n,interest=fv-contrib;
    document.getElementById('cw-ci-final').textContent=fmt(fv);
    document.getElementById('cw-ci-contrib').textContent=fmt(contrib);
    document.getElementById('cw-ci-int').textContent=fmt(interest);
    var bars=document.getElementById('cw-ci-bars'),labels=document.getElementById('cw-ci-labels');
    bars.innerHTML='';labels.innerHTML='';
    var steps=5,max=0,pts=[];
    for(var s=1;s<=steps;s++){var yi=Math.round((y*s)/steps);var ni=yi*12;var fvi=P*Math.pow(1+mr,ni)+(mr>0?m*((Math.pow(1+mr,ni)-1)/mr):m*ni);pts.push({y:yi,fv:fvi});if(fvi>max)max=fvi;}
    pts.forEach(function(p){
      var b=document.createElement('div');b.style.cssText='flex:1;background:var(--pink-soft);border-radius:2px 2px 0 0;min-height:4px;height:'+(max>0?(p.fv/max*100):4)+'%;';b.title='Year '+p.y+': '+fmt(p.fv);bars.appendChild(b);
      var l=document.createElement('span');l.style.cssText='flex:1;text-align:center;font-size:10px;color:rgba(250,247,244,0.65);';l.textContent='Y'+p.y;labels.appendChild(l);
    });
  }
  recalc();
}

var toolMap={
  budget:{ix:'/ 01',title:'Budget Tracker 50/30/20',fn:buildBudget},
  networth:{ix:'/ 02',title:'Net Worth Calculator',fn:buildNetWorth},
  compound:{ix:'/ 03',title:'Compound Interest',fn:buildCompound}
};
Object.keys(toolMap).forEach(function(key){
  var el=document.getElementById(key);
  if(!el)return;
  el.addEventListener('click',function(e){e.preventDefault();var t=toolMap[key];openToolModal(t.ix,t.title,t.fn);});
});

/* ═══════════════════════════════════════════════════
   5. AUDIO PLAYER (real audio, CMS-driven)
═══════════════════════════════════════════════════ */
function getEpisodesFromDOM(){
  var eps=[];
  var scope=document.getElementById('audio');
  if(!scope)return[];
  scope.querySelectorAll('.episode').forEach(function(row,idx){
    var titleEl=row.querySelector('.ep-title div, .ep-title');
    var title=titleEl?titleEl.textContent.trim():'Lesson '+(idx+1);
    var dur=parseInt(row.getAttribute('data-duration'))||12;
    var host=row.getAttribute('data-host')||'Ana Paula Casey';
    var pill=row.querySelector('.ep-cat-pill');
    var cat=pill?pill.textContent.trim():'Foundations';
    if(cat.toLowerCase().indexOf('smart')!==-1)cat='Smart Money';
    else if(cat.toLowerCase().indexOf('invest')!==-1)cat='Investing';
    else if(cat.toLowerCase().indexOf('protect')!==-1)cat='Protection';
    else cat='Foundations';
    var srcLink=row.querySelector('.audio-src-holder');
    var audioUrl=srcLink?srcLink.getAttribute('href'):null;
    if(audioUrl==='#')audioUrl=null;
    eps.push({id:idx+1,title:title,host:host,cat:cat,duration:dur,audioUrl:audioUrl,el:row});
  });
  return eps;
}

var allEpisodes=getEpisodesFromDOM();
var currentCat='All';
var currentEpisode=allEpisodes[0]||{id:1,title:'Why Saving Alone Is No Longer Enough',host:'Ana Paula Casey',cat:'Foundations',duration:12,audioUrl:null};
var isPlaying=false,currentTime=0,duration=currentEpisode.duration*60;
var speedIdx=0,speeds=[1,1.25,1.5,0.75];
var isLiked=false,isSaved=false,waveAnimId=null;

var audioEl=new Audio();
audioEl.preload='metadata';

var npTitleEl=document.getElementById('np-title')||document.getElementById('title');
var npByEl=document.getElementById('np-by');
var npCurrentEl=document.querySelector('.np-current');
var npRemainEl=document.querySelector('.np-remaining');
var npFillEl=document.getElementById('np-scrub-fill');
var npThumbEl=document.getElementById('np-scrub-thumb');
var npScrubEl=document.querySelector('.np-scrub');
var npPlayBtn=document.querySelector('.np-play');
var npSpeedBtn=document.querySelector('.np-speed');
var npBackBtn=document.getElementById('np-back');
var npFwdBtn=document.getElementById('np-fwd');
var npLikeBtn=document.getElementById('np-like');
var npSaveBtn=document.getElementById('np-save');
var waveformEl=document.getElementById('np-waveform');
var waveBars=waveformEl?Array.from(waveformEl.querySelectorAll('.np-bar')):[];

function fmtTime(s){var m=Math.floor(s/60);var ss=Math.floor(s%60).toString().padStart(2,'0');return m.toString().padStart(2,'0')+':'+ss;}
function updateScrub(){
  var pct=duration>0?(currentTime/duration)*100:0;
  if(npFillEl)npFillEl.style.width=pct+'%';
  if(npThumbEl)npThumbEl.style.left=pct+'%';
  if(npCurrentEl)npCurrentEl.textContent=fmtTime(currentTime);
  if(npRemainEl)npRemainEl.textContent='-'+fmtTime(Math.max(0,duration-currentTime));
}
function animateWave(){
  cancelAnimationFrame(waveAnimId);
  var start=Date.now();
  function frame(){
    if(audioEl.paused)return;
    var t=(Date.now()-start)/1000;
    waveBars.forEach(function(bar,i){var ph=i*0.3;var h=8+Math.abs(Math.sin(t*4+ph)*14)+Math.abs(Math.sin(t*7+ph*1.7)*8);bar.style.height=h+'px';});
    waveAnimId=requestAnimationFrame(frame);
  }
  frame();
}
function stillWave(){
  cancelAnimationFrame(waveAnimId);
  waveBars.forEach(function(bar,i){bar.style.height=(Math.abs(Math.sin(i*1.3)*4)+Math.abs(Math.sin(i*0.7)*3)+6)+'px';});
}
function setPlayIcon(playing){
  if(!npPlayBtn)return;
  var wrap=npPlayBtn.querySelector('.np-play-icon')||npPlayBtn.querySelector('.w-embed')||npPlayBtn;
  wrap.innerHTML=playing
    ?'<svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><rect x="6" y="5" width="4" height="14"/><rect x="14" y="5" width="4" height="14"/></svg>'
    :'<svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M8 5v14l11-7z"/></svg>';
}

audioEl.addEventListener('loadedmetadata',function(){
  if(!isNaN(audioEl.duration)&&isFinite(audioEl.duration)){duration=audioEl.duration;updateScrub();}
});
audioEl.addEventListener('timeupdate',function(){currentTime=audioEl.currentTime;updateScrub();});
audioEl.addEventListener('ended',function(){isPlaying=false;setPlayIcon(false);stillWave();updateEpisodeStates();});
audioEl.addEventListener('play',function(){isPlaying=true;setPlayIcon(true);animateWave();updateEpisodeStates();});
audioEl.addEventListener('pause',function(){isPlaying=false;setPlayIcon(false);stillWave();updateEpisodeStates();});
audioEl.addEventListener('error',function(){console.warn('[COW] audio failed to load:',audioEl.src);});

function togglePlay(){
  if(!currentEpisode.audioUrl){console.warn('[COW] no audio URL set for this episode yet');return;}
  if(audioEl.paused){
    var p=audioEl.play();
    if(p)p.catch(function(e){console.warn('[COW] play blocked',e);});
  }else{
    audioEl.pause();
  }
}

var currentAudioHls=null;

function loadEpisode(ep){
  currentEpisode=ep;duration=ep.duration*60;currentTime=0;
  var emphasized=ep.title.replace(/\b(Wealth|Investing|Money|Confidence|Risk|Compound|Mindset|Saving|Power|Independence)\b/,function(m){return'<em>'+m+'</em>';});
  if(npTitleEl)npTitleEl.innerHTML=emphasized;
  if(npByEl)npByEl.textContent='Lesson '+ep.id+' / '+ep.host+' / '+ep.duration+' min';

  audioEl.pause();
  audioEl.currentTime=0;
  if(currentAudioHls){currentAudioHls.destroy();currentAudioHls=null;}

 if(ep.audioUrl){
    if(ep.audioUrl.indexOf('.m3u8')!==-1){
      if(window.Hls&&Hls.isSupported()){
        currentAudioHls=new Hls();
        currentAudioHls.loadSource(ep.audioUrl);
        currentAudioHls.attachMedia(audioEl);
        // hls.js owns loading here — do NOT call audioEl.load()
      }else if(audioEl.canPlayType('application/vnd.apple.mpegurl')){
        audioEl.src=ep.audioUrl;
        audioEl.load();
      }
    }else{
      audioEl.src=ep.audioUrl;
      audioEl.load();
    }
  }else{
    audioEl.removeAttribute('src');
    audioEl.load();
  }
  audioEl.playbackRate=speeds[speedIdx];
  updateScrub();
}
function updateEpisodeStates(){
  allEpisodes.forEach(function(ep){
    if(!ep.el)return;
    var active=currentEpisode&&ep.title===currentEpisode.title&&isPlaying;
    ep.el.classList.toggle('is-playing',active);
    var wrap=ep.el.querySelector('.np-play-wrap');
    if(wrap){var svg=wrap.querySelector('svg');if(active&&svg)svg.innerHTML='<rect x="6" y="5" width="4" height="14"/><rect x="14" y="5" width="4" height="14"/>';else if(svg)svg.innerHTML='<path d="M8 5v14l11-7z"/>';}
  });
}

allEpisodes.forEach(function(ep){
  var row=ep.el;if(!row)return;
  var btn=row.querySelector('.ep-play,.np-play-wrap');
  if(!btn||btn._wired)return;
  btn._wired=true;
  btn.addEventListener('click',function(e){
    e.preventDefault();e.stopPropagation();
    if(currentEpisode&&ep.title===currentEpisode.title){togglePlay();}
    else{loadEpisode(ep);togglePlay();}
  });
});

if(npPlayBtn)npPlayBtn.addEventListener('click',function(e){e.preventDefault();togglePlay();});
if(npBackBtn)npBackBtn.addEventListener('click',function(e){e.preventDefault();audioEl.currentTime=Math.max(0,audioEl.currentTime-15);});
if(npFwdBtn)npFwdBtn.addEventListener('click',function(e){e.preventDefault();audioEl.currentTime=Math.min(duration,audioEl.currentTime+15);});
if(npScrubEl){
  npScrubEl.addEventListener('click',function(e){
    var rect=npScrubEl.getBoundingClientRect();
    var pct=(e.clientX-rect.left)/rect.width;
    audioEl.currentTime=Math.max(0,Math.min(duration,pct*duration));
  });
}
if(npSpeedBtn)npSpeedBtn.addEventListener('click',function(e){e.preventDefault();speedIdx=(speedIdx+1)%speeds.length;npSpeedBtn.textContent=speeds[speedIdx]+'\xd7';audioEl.playbackRate=speeds[speedIdx];});
if(npLikeBtn)npLikeBtn.addEventListener('click',function(e){
  e.preventDefault();isLiked=!isLiked;npLikeBtn.classList.toggle('active',isLiked);
  var svg=npLikeBtn.querySelector('svg')||(npLikeBtn.querySelector('.w-embed')&&npLikeBtn.querySelector('.w-embed svg'));
  if(svg)svg.setAttribute('fill',isLiked?'currentColor':'none');
});
if(npSaveBtn)npSaveBtn.addEventListener('click',function(e){
  e.preventDefault();isSaved=!isSaved;npSaveBtn.classList.toggle('active',isSaved);
  var svg=npSaveBtn.querySelector('svg')||(npSaveBtn.querySelector('.w-embed')&&npSaveBtn.querySelector('.w-embed svg'));
  if(svg)svg.setAttribute('fill',isSaved?'currentColor':'none');
});

document.querySelectorAll('.ae-cat').forEach(function(btn){
  btn.addEventListener('click',function(e){
    e.preventDefault();
    document.querySelectorAll('.ae-cat').forEach(function(b){b.classList.remove('active');});
    btn.classList.add('active');
    var raw=btn.getAttribute('data-cat')||btn.id||'All';
    if(raw==='All')currentCat='All';
    else if(raw==='Smart-Money'||raw==='smart-money')currentCat='Smart Money';
    else currentCat=raw;
    var epCountEl=document.getElementById('ep-count');
    if(epCountEl){var lbl=currentCat==='All'?'all four series':currentCat;epCountEl.innerHTML='Featured selections from <strong>'+lbl+'</strong>';}
    allEpisodes.forEach(function(ep){
      if(!ep.el)return;
      var show=currentCat==='All'||ep.cat===currentCat;
      ep.el.closest('.w-dyn-item')?ep.el.closest('.w-dyn-item').style.display=(show?'':'none'):ep.el.style.display=(show?'':'none');
    });
  });
});

if(allEpisodes.length){loadEpisode(allEpisodes[0]);}
stillWave();
updateEpisodeStates();
  
/* ═══════════════════════════════════════════════════
   6. SCROLL FIX
═══════════════════════════════════════════════════ */
function fixScroll(el){
  if(!el)return;
  el.addEventListener('wheel',function(e){
    e.stopPropagation();
    var atTop = el.scrollTop <= 0;
    var atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1;
    if(!((atTop && e.deltaY < 0) || (atBottom && e.deltaY > 0))){
      e.preventDefault();
    }
    el.scrollTop += e.deltaY;
  },{passive:false});
  el.addEventListener('touchmove',function(e){e.stopPropagation();},{passive:true});
}
fixScroll(document.querySelector('[data-sheet-module]'));
fixScroll(document.querySelector('.bottom-sheet'));
fixScroll(document.getElementById('mem-sheet'));
fixScroll(toolsModal);
  

});/* end DOMContentLoaded */