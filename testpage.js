/* ============================================================
   WEALTH IN ACTION — EMBED BOOTSTRAP (self-contained, member-gated)
   Mounts the tool inside a Shadow DOM root so its CSS, markup and
   element IDs never collide with the host Webflow page. Only shows
   the tool to a signed-in Memberstack member, and saves progress
   to that member's account (member JSON) instead of the browser.
   ============================================================ */
(function(){
  "use strict";

  var host = document.getElementById('wia-app-root');
  if (!host) return;

  var FOUNDER_PLAN_ID = "pln_founder-access-tsr04lz";
  var ANNUAL_PLAN_ID  = "pln_annual-ktjz0r2v";
  var MONTHLY_PLAN_ID = "pln_monthly-lh1bj0jcx";
  var UPGRADE_URL = "/membership-upgrade"; // ← replace with your real upgrade page path

  var SIGNED_OUT_HTML = '<div style="font-family:-apple-system,system-ui,sans-serif;'
    + 'max-width:520px;margin:40px auto;padding:28px;text-align:center;'
    + 'border:1px solid #E8E4E1;border-radius:18px;background:#FAF7F2;color:#252326">'
    + '<p style="font-size:17px;line-height:1.5;margin:0 0 16px">Wealth in Action saves your progress to your account, so please sign in to start or continue your journey.</p>'
    + '<button id="wia-signin-btn" style="font-family:inherit;font-size:16px;font-weight:500;'
    + 'min-height:48px;padding:0 22px;border-radius:12px;border:1px solid transparent;'
    + 'background:#FF4F9A;color:#252326;cursor:pointer">Sign in</button></div>';

  var LOCKED_HTML = '<div style="font-family:-apple-system,system-ui,sans-serif;'
    + 'max-width:520px;margin:40px auto;padding:28px;text-align:center;'
    + 'border:1px solid #E8E4E1;border-radius:18px;background:#FAF7F2;color:#252326">'
    + '<p style="font-size:17px;line-height:1.5;margin:0 0 16px">Wealth in Action is available with Annual Membership.</p>'
    + '<button id="wia-upgrade-btn" style="font-family:inherit;font-size:16px;font-weight:500;'
    + 'min-height:48px;padding:0 22px;border-radius:12px;border:1px solid transparent;'
    + 'background:#FF4F9A;color:#252326;cursor:pointer">Upgrade to Annual</button></div>';

  function showSignedOut(){
    host.innerHTML = SIGNED_OUT_HTML;
    var btn = document.getElementById('wia-signin-btn');
    if (btn) btn.addEventListener('click', function(){
      if (window.$memberstackDom) window.$memberstackDom.openModal('LOGIN');
    });
  }

  function showLocked(){
    host.innerHTML = LOCKED_HTML;
    var btn = document.getElementById('wia-upgrade-btn');
    if (btn) btn.addEventListener('click', function(){
      window.location.href = UPGRADE_URL;
    });
  }

  function hasPremiumAccess(member){
    var conns = (member && member.planConnections) || [];
    return conns.some(function(c){
      return c.active && (c.planId === FOUNDER_PLAN_ID || c.planId === ANNUAL_PLAN_ID);
    });
  }

  function bootTool(member){
    var wiaMember = member;

    // Load the two webfonts once globally on the host page (harmless if this embed appears more than once)
    if (!document.getElementById('wia-fonts-link')){
      var pc1 = document.createElement('link'); pc1.rel = 'preconnect'; pc1.href = 'https://fonts.googleapis.com'; document.head.appendChild(pc1);
      var pc2 = document.createElement('link'); pc2.rel = 'preconnect'; pc2.href = 'https://fonts.gstatic.com'; pc2.crossOrigin = ''; document.head.appendChild(pc2);
      var fl = document.createElement('link'); fl.id = 'wia-fonts-link'; fl.rel = 'stylesheet';
      fl.href = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500&family=Inter:wght@400;500;600&display=swap';
      document.head.appendChild(fl);
    }

        var shadow = host.attachShadow({mode:'open'});
    shadow.innerHTML = `<style>:root{
  --pink:#FF4F9A; --pink-hover:#FF63A6; --cream:#FAF7F2; --blush:#FFF0F6; --white:#FFFFFF;
  --charcoal:#252326; --taupe:#8F7A6A; --taupe-deep:#6F5C4E; --grey:#E8E4E1;
  --green:#4F8068; --red:#B85C68; --amber:#D89B45;
  --green-dk:#8FD3B4; --rose-dk:#F5A3AE;
  --serif:'Cormorant Garamond',Georgia,'Times New Roman',serif;
  --sans:'Inter',Lato,-apple-system,system-ui,sans-serif;
  --e1:0 1px 2px rgba(37,35,38,.04),0 2px 10px rgba(37,35,38,.05);
  --e2:0 6px 28px rgba(37,35,38,.12);
  --ease:cubic-bezier(.22,.8,.3,1);
}
:host{ all: initial; display:block; }
*{box-sizing:border-box}
.wia-root{margin:0;padding:0;background:var(--cream);color:var(--charcoal);font-family:var(--sans);font-size:17px;
  line-height:1.6;-webkit-font-smoothing:antialiased}

/* ---------- type ---------- */
h1,h2{font-family:var(--serif);font-weight:500;letter-spacing:-.005em;margin:0 0 12px}
h1{font-size:40px;line-height:1.08}
h2{font-size:30px;line-height:1.15;margin-top:0}
h3{font-family:var(--serif);font-size:23px;line-height:1.25;font-weight:500;margin:0 0 6px}
p{margin:0 0 14px}
.num{font-variant-numeric:tabular-nums;font-feature-settings:"tnum"}
.kicker,.eyebrow{font-size:12px;line-height:1.4;font-weight:600;letter-spacing:.14em;
  text-transform:uppercase;margin:0 0 10px;color:var(--taupe-deep)}
.sm{font-size:15px;line-height:1.6}
.cap{font-size:13px;line-height:1.55;color:var(--charcoal)}
.lede{font-size:19px;line-height:1.5}
a{color:var(--charcoal)}
:focus{outline:none}
:focus-visible{outline:3px solid var(--charcoal);outline-offset:2px;border-radius:6px}
.band-dark :focus-visible{outline-color:var(--cream)}
.skip{position:absolute;left:-9999px;top:0;background:var(--white);padding:12px 16px;z-index:100}
.skip:focus{left:8px;top:8px}
.vh{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.hidden{display:none !important}

/* ---------- figures: Inter tabular, always ---------- */
.figure-xl,.figure-lg,.figure-md,.hero-total,.brow .val,.remaining .n,.bigmove{
  font-family:var(--sans);font-variant-numeric:tabular-nums;font-weight:500}
.figure-xl{font-size:44px;line-height:1.02;letter-spacing:-.02em}
.figure-lg{font-size:34px;line-height:1.05;letter-spacing:-.015em}
.figure-md{font-size:24px;line-height:1.15}

/* ---------- shell ---------- */
.wia-wrap{max-width:720px;margin:0 auto;padding:0 20px}
.wia-wrap-wide{max-width:1080px;margin:0 auto;padding:0 20px}
header.jh{position:sticky;top:0;z-index:30;background:rgba(250,247,242,.94);
  backdrop-filter:saturate(140%) blur(6px);border-bottom:1px solid var(--grey)}
.jh-in{display:flex;align-items:center;gap:14px;justify-content:space-between;padding:10px 0}
.mark{font-family:var(--serif);font-size:19px;white-space:nowrap}
.chapter{font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:var(--taupe-deep);
  text-align:center;flex:1;min-width:0}
.progress{height:3px;background:var(--blush)}
.progress span{display:block;height:100%;background:var(--pink);transition:width .5s var(--ease)}
.progress-label{font-size:12px;padding:4px 0 0;color:var(--taupe-deep)}
main{padding:0 0 110px}
section.screen{display:none}
section.screen.on{display:block;animation:riseIn .32s ease-out both}

/* ---------- bands: the rhythm device ---------- */
.band{padding:32px 0 36px;position:relative;overflow:hidden}
.band.tight{padding:24px 0 24px}
.band-blush{background:var(--blush)}
.band-cream{background:var(--cream)}
.band-white{background:var(--white)}
.band-dark{background:var(--charcoal);color:var(--cream)}
.band-dark h1,.band-dark h2,.band-dark h3{color:var(--cream)}
.band-dark .kicker,.band-dark .eyebrow{color:var(--pink)}
.band-dark .sm,.band-dark .cap,.band-dark p{color:var(--grey)}
.band-dark .card,.band-dark .panel{background:rgba(250,247,242,.06);border-color:rgba(250,247,242,.18);color:var(--cream)}
.blob{position:absolute;border-radius:999px;pointer-events:none}
.blob-1{width:240px;height:240px;right:-80px;top:-90px;background:rgba(255,79,154,.12)}
.blob-2{width:170px;height:170px;left:-80px;bottom:-90px;background:rgba(216,155,69,.13)}
.band-dark .blob-1{background:rgba(255,79,154,.16)}
.band-dark .blob-2{background:rgba(216,155,69,.10)}
.swash{display:block;margin:0 0 12px;color:var(--pink)}

/* ---------- editorial devices ---------- */
.hang{font-family:var(--serif);font-size:27px;line-height:1.3;margin:26px 0 26px -20px;
  padding:4px 0 4px 20px;border-left:3px solid var(--pink)}
.pull{font-family:var(--serif);font-size:26px;line-height:1.32;border-left:3px solid var(--pink);
  padding-left:18px;margin:24px 0}
.layer{position:relative;margin:24px 0}
.layer::before{content:"";position:absolute;inset:14px -10px -14px 10px;background:var(--blush);border-radius:20px}
.band-blush .layer::before{background:rgba(255,79,154,.10)}
.band-dark .layer::before{background:rgba(255,79,154,.14)}
.layer .card,.layer .panel{position:relative;border-radius:20px}
.nextup{display:inline-flex;align-items:center;gap:10px;background:var(--blush);border:1px solid #F6DCE8;
  border-radius:999px;padding:9px 16px;margin:20px 0 0;font-size:15px}
.band-blush .nextup{background:var(--white);border-color:#F6DCE8}
.nextup .dot{width:7px;height:7px;border-radius:999px;background:var(--pink);flex:none}

/* ---------- surfaces ---------- */
.card{background:var(--white);border:1px solid var(--grey);border-radius:18px;padding:20px;box-shadow:var(--e1)}
.card+.card{margin-top:14px}
.panel{background:var(--white);border:1px solid var(--grey);border-radius:18px;padding:20px}
.blush{background:var(--blush);border:1px solid #F6DCE8;border-radius:18px;padding:20px}
.callout{background:var(--blush);border:1px solid #F6DCE8;border-left:4px solid var(--amber);
  border-radius:0 18px 18px 0;padding:18px;margin:18px 0}
.band-dark .callout{background:rgba(216,155,69,.12);border-color:rgba(216,155,69,.35);border-left-color:var(--amber)}

/* ---------- buttons ---------- */
.btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;font-family:var(--sans);
  font-size:17px;font-weight:500;line-height:1;min-height:54px;padding:0 26px;border-radius:14px;
  border:1px solid transparent;cursor:pointer;text-decoration:none;position:relative;overflow:hidden;
  transition:transform .16s var(--ease),background .16s ease-out,border-color .16s ease-out,box-shadow .22s ease-out}
.btn .arw{display:inline-block;font-size:16px;transition:transform .24s var(--ease)}
.btn:hover .arw,.btn:focus-visible .arw{transform:translateX(5px)}
.btn:active .arw{transform:translateX(2px)}
.btn:active,.btn.pressed{transform:scale(.965)}
.step.pressed{transform:scale(.9);background:var(--blush);border-color:var(--pink)}
.opt.pressed{transform:scale(.99)}
.ripple{position:absolute;border-radius:999px;transform:scale(0);opacity:.5;pointer-events:none;
  background:rgba(37,35,38,.3);animation:rip .6s ease-out forwards}
.btn-secondary .ripple,.btn-link .ripple,.opt .ripple,.step .ripple{background:rgba(255,79,154,.26)}
.band-dark .btn-secondary .ripple{background:rgba(250,247,242,.28)}
@keyframes rip{to{transform:scale(2.8);opacity:0}}
@keyframes wake{0%{box-shadow:0 0 0 0 rgba(255,79,154,.5)}100%{box-shadow:0 0 0 16px rgba(255,79,154,0)}}
.btn.wake{animation:wake .62s ease-out 1}
.step{position:relative;overflow:hidden}
.opt{position:relative;overflow:hidden}
.btn-primary{background:var(--pink);color:var(--charcoal)}
.btn-primary:hover{background:var(--pink-hover)}
@media (hover:hover){
  .btn-primary:hover{transform:translateY(-2px);box-shadow:0 8px 20px rgba(255,79,154,.3)}
  .btn-secondary:hover{transform:translateY(-2px)}
}
.btn-primary:active,.btn-primary.pressed{transform:translateY(0) scale(.965);box-shadow:0 2px 8px rgba(255,79,154,.24)}
.btn-primary[aria-disabled="true"]{background:var(--grey);color:rgba(37,35,38,.45);cursor:not-allowed}
.btn-secondary{background:var(--white);color:var(--charcoal);border-color:var(--grey)}
.btn-secondary:hover{border-color:var(--pink)}
.band-dark .btn-secondary{background:transparent;color:var(--cream);border-color:rgba(250,247,242,.45)}
.band-dark .btn-secondary:hover{border-color:var(--cream)}
.btn-quiet{background:var(--white);color:var(--charcoal);border-color:var(--red)}
.btn-link{background:none;border:none;padding:0;min-height:44px;font-size:16px;text-decoration:underline;
  text-underline-offset:3px;color:var(--charcoal);cursor:pointer;font-family:var(--sans);position:relative;
  transition:text-underline-offset .2s ease-out,color .16s ease-out}
.btn-link:hover{text-underline-offset:5px}
.btn-link:active{opacity:.72}
.band-dark .btn-link{color:var(--cream)}
.actions{display:flex;flex-direction:column;gap:12px;margin-top:22px}
.actions .btn{width:100%}
.footbar{position:fixed;left:0;right:0;bottom:0;background:rgba(250,247,242,.96);
  backdrop-filter:blur(6px);border-top:1px solid var(--grey);
  padding:10px 20px calc(10px + env(safe-area-inset-bottom));z-index:25}
.footbar .inner{max-width:1080px;margin:0 auto;display:flex;flex-direction:column;gap:6px}
.helper{font-size:14px;margin:0;color:var(--taupe-deep)}

/* ---------- option cards ---------- */
.opt{display:block;width:100%;text-align:left;background:var(--white);border:1px solid var(--grey);
  border-radius:18px;padding:18px;cursor:pointer;font-family:var(--sans);font-size:17px;
  color:var(--charcoal);position:relative;
  transition:border-color .16s ease-out,background .16s ease-out,transform .16s var(--ease),box-shadow .2s ease-out}
.opt+.opt{margin-top:12px}
.opt .t{font-family:var(--serif);font-size:21px;line-height:1.25;display:block;margin-bottom:4px}
.opt .d{font-size:15px;line-height:1.55;display:block}
.opt[aria-checked="true"],.opt[aria-pressed="true"]{border:2px solid var(--pink);background:var(--blush);
  padding:17px;box-shadow:0 0 0 5px rgba(255,79,154,.12)}
.opt .tick{position:absolute;top:16px;right:16px;display:none;color:var(--pink);font-weight:600}
.opt[aria-checked="true"] .tick{display:block}

/* ---------- category identity orbs, equal for all six ---------- */
.orb{width:60px;height:60px;min-width:60px;border-radius:999px;display:flex;align-items:center;
  justify-content:center;position:relative;transition:transform .2s var(--ease)}
.orb::after{content:"";position:absolute;inset:-5px;border-radius:999px;border:1px solid currentColor;opacity:.25}
.orb svg{width:28px;height:28px;stroke-width:1.5;fill:none;stroke-linecap:round;stroke-linejoin:round}
.orb.sm{width:48px;height:48px;min-width:48px}.orb.sm svg{width:24px;height:24px}
.o-cash{background:rgba(143,122,106,.12);color:#6F5C4E}
.o-bonds{background:rgba(143,122,106,.26);color:#5C4B3E}
.o-global{background:rgba(255,79,154,.14);color:#B02C68}
.o-tech{background:rgba(37,35,38,.10);color:#252326}
.o-property{background:rgba(79,128,104,.16);color:#3E6653}
.o-gold{background:rgba(216,155,69,.20);color:#8A5F1F}

/* ---------- asset cards ---------- */
.acard{background:var(--white);border:1px solid var(--grey);border-radius:20px;padding:18px;
  transition:border-color .16s ease-out,box-shadow .2s ease-out,transform .18s var(--ease)}
.acard .head{display:flex;gap:14px;align-items:center}
.acard.opened{border-color:#FFC7DF}
.mlabel{display:inline-block;font-size:12px;line-height:1.4;padding:4px 10px;border-radius:999px;
  background:var(--cream);border:1px solid var(--grey);color:var(--charcoal);
  transition:background .16s ease-out,border-color .16s ease-out}
.acard.opened .mlabel{background:var(--blush);border-color:#FFC7DF}

/* ---------- allocation ---------- */
.remaining{display:flex;align-items:baseline;gap:12px;flex-wrap:wrap;margin:2px 0 6px}
.remaining .n{font-size:38px;line-height:1;letter-spacing:-.02em}
.remaining .l{font-size:15px}
.track{height:10px;background:rgba(37,35,38,.07);border:1px solid var(--charcoal);border-radius:999px;overflow:hidden;margin-top:8px}
.track i{display:block;height:100%;background:var(--pink);border-radius:999px;width:0;transition:width .45s var(--ease)}
.brow{display:flex;gap:14px;align-items:center;padding:16px 0;border-bottom:1px solid rgba(37,35,38,.09);
  transition:background .16s ease-out}
.brow:last-child{border-bottom:none}
.brow .nm{font-family:var(--serif);font-size:22px;line-height:1.2;display:block}
.brow .val{font-size:21px;text-align:right;line-height:1.2}
.brow .pc{font-size:13px;color:var(--taupe-deep);text-align:right;font-variant-numeric:tabular-nums}
.brow .ctl{display:flex;gap:6px;align-items:center;margin-top:8px}
.brow.funded .orb{transform:scale(1.04)}
.step{width:44px;height:44px;min-width:44px;border-radius:12px;border:1px solid var(--grey);
  background:var(--white);font-size:19px;line-height:1;cursor:pointer;color:var(--charcoal);
  font-family:var(--sans);transition:transform .1s ease-out,background .14s ease-out,border-color .14s ease-out}
.step:active{transform:scale(.9);background:var(--blush);border-color:var(--pink)}
.step:disabled{opacity:.4;cursor:not-allowed}
.amt{height:52px;width:118px;border:1px solid var(--grey);border-radius:12px;background:var(--white);
  font-family:var(--sans);font-size:17px;font-variant-numeric:tabular-nums;text-align:right;
  padding:0 12px;color:var(--charcoal);transition:border-color .14s ease-out,box-shadow .14s ease-out}
.amt:focus{border-color:var(--pink);box-shadow:0 0 0 4px rgba(255,79,154,.14)}
.errline{min-height:20px;font-size:14px;margin:4px 0 0}
.errline.on{color:var(--charcoal)}

/* ---------- hero donut ---------- */
.hero-donut{position:relative;width:266px;height:266px;margin:14px 0 6px}
.hero-donut .glow{position:absolute;inset:-18px;border-radius:999px;
  background:radial-gradient(circle,rgba(255,79,154,.15) 0%,rgba(255,79,154,0) 68%)}
.hero-donut svg{position:relative;width:266px;height:266px;display:block}
.hero-mid{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;
  justify-content:center;pointer-events:none;text-align:center}
.hero-mid .k{font-size:11px;font-weight:600;letter-spacing:.15em;text-transform:uppercase;color:var(--taupe-deep)}
.hero-total{font-size:40px;line-height:1.05;letter-spacing:-.02em}
#donut circle{transition:stroke-dasharray .55s var(--ease),stroke-dashoffset .55s var(--ease)}

/* ---------- market bars ---------- */
.mrow{padding:14px 0 4px}
.mrow .lab{display:flex;justify-content:space-between;align-items:baseline;gap:12px}
.mrow .cn{font-family:var(--serif);font-size:20px}
.mrow .mv{font-size:21px;font-weight:500;font-variant-numeric:tabular-nums;white-space:nowrap}
.mrow .val{font-size:13px;color:var(--grey)}
.mtrack{height:9px;background:rgba(250,247,242,.10);border:1px solid rgba(250,247,242,.55);border-radius:999px;position:relative;margin-top:9px}
.mtrack i{position:absolute;top:0;height:100%;border-radius:999px;width:0;transition:width .55s var(--ease)}
.mtrack .mid{position:absolute;left:50%;top:-5px;width:1px;height:17px;background:rgba(250,247,242,.32)}
.up{color:var(--green)}.down{color:var(--red)}
.band-dark .up,.mv.up{color:var(--green-dk)}
.band-dark .down,.mv.dn{color:var(--rose-dk)}
.mtrack i.up{background:var(--green-dk);left:50%}
.mtrack i.dn{background:var(--rose-dk);right:50%}
.bigmove{font-size:44px;line-height:1.02;letter-spacing:-.02em}

/* ---------- tables ---------- */
table{width:100%;border-collapse:collapse;font-size:15px}
caption{text-align:left;font-size:13px;padding-bottom:8px;color:var(--taupe-deep)}
th,td{text-align:left;padding:11px 8px;border-bottom:1px solid var(--grey);vertical-align:top}
td.n,th.n{text-align:right;font-variant-numeric:tabular-nums}
.band-dark th,.band-dark td{border-color:rgba(250,247,242,.18)}

/* ---------- dashboard ---------- */
.jcard{background:var(--white);border:1px solid var(--grey);border-radius:20px;padding:20px;
  transition:border-color .16s ease-out,box-shadow .2s ease-out,transform .18s var(--ease)}
.jcard.done{background:var(--cream);border-color:var(--taupe)}
.jcard.locked{background:var(--cream)}
.jcard.prog{border-left:3px solid var(--pink)}
.jnum{font-family:var(--serif);font-size:34px;line-height:1;display:block;margin-bottom:6px;color:var(--pink)}
.cards3{display:grid;gap:14px}
.dash-foot{display:grid;gap:14px;margin-top:28px}
.meter{height:10px;background:rgba(37,35,38,.07);border:1px solid var(--charcoal);border-radius:999px;overflow:hidden;margin-top:8px}
.meter span{display:block;height:100%;background:var(--pink);width:0;transition:width .45s var(--ease)}

/* ---------- seals ---------- */
.seal{width:58px;height:58px;border-radius:999px;border:1.5px solid var(--pink);background:var(--white);
  display:flex;align-items:center;justify-content:center;flex:none;position:relative;
  transition:transform .2s var(--ease)}
.seal::after{content:"";position:absolute;inset:5px;border-radius:999px;border:1px solid rgba(255,79,154,.3)}
.seal .g{font-family:var(--serif);font-size:22px;color:var(--charcoal)}
.seal.off{border-color:var(--grey);border-style:dashed;background:var(--cream)}
.seal.off::after{border-color:var(--grey)}
.seallist{display:grid;gap:14px}
.sealrow{display:flex;gap:14px;align-items:center}
.sealrow .st{font-family:var(--serif);font-size:19px;display:block;line-height:1.25}
.sealrow .sd{font-size:13px;line-height:1.5;display:block;margin-top:2px;color:var(--taupe-deep)}

/* ---------- transitions and completion ---------- */
.trans{min-height:66vh;display:flex;flex-direction:column;justify-content:center;text-align:center;padding:40px 0}
.trans h1{max-width:20ch;margin:0 auto 16px}
.trans .lede{max-width:36ch;margin:0 auto 8px}
.trans .art{margin:4px auto 22px;display:block}
.trans .art path,.trans .art circle{stroke:var(--pink);fill:none;stroke-width:2;stroke-linecap:round}
.trans .next{font-size:15px;margin-top:20px;color:var(--taupe-deep)}
.trans .actions{justify-content:center;align-items:center}
.trans .actions .btn{max-width:340px}
.moment{text-align:center;padding:4px 0 20px}
.moment svg{display:block;margin:0 auto 16px}
.moment h1{max-width:22ch;margin:0 auto 12px}
.moment .lede{max-width:40ch;margin:0 auto}
.done-tick{display:inline-flex;align-items:center;gap:9px;font-size:15px}
.done-tick .ring{width:22px;height:22px;border-radius:999px;border:1.5px solid var(--pink);
  display:inline-flex;align-items:center;justify-content:center;font-size:12px;animation:ringGrow .3s ease-out both}

/* ---------- modal ---------- */
.mask{position:fixed;inset:0;background:rgba(37,35,38,.42);display:none;align-items:center;
  justify-content:center;padding:20px;z-index:60}
.mask.on{display:flex}
.modal{background:var(--white);border-radius:22px;padding:24px;max-width:520px;width:100%;
  box-shadow:var(--e2);max-height:88vh;overflow:auto;animation:riseIn .24s ease-out both}
.modal .actions{flex-direction:column-reverse}

/* ---------- charts and misc ---------- */
.bar{padding:10px 0;border-bottom:1px solid var(--grey)}
.bartrack{position:relative;height:9px;background:var(--grey);border-radius:999px;margin-top:6px}
.bartrack i{position:absolute;top:0;height:100%;border-radius:999px;display:block;width:0}
.disc{font-size:13px;line-height:1.55;border-top:1px solid var(--grey);margin-top:26px;padding-top:12px;color:var(--taupe-deep)}
.band-dark .disc{border-color:rgba(250,247,242,.18);color:var(--grey)}
.tag{display:inline-block;font-size:12px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;
  padding:4px 11px;border-radius:999px;background:var(--white);border:1px solid var(--grey)}
.band-dark .tag{background:rgba(250,247,242,.1);border-color:rgba(250,247,242,.28);color:var(--cream)}
svg.icon{width:28px;height:28px;flex:none;stroke:currentColor;stroke-width:1.5;fill:none;
  stroke-linecap:round;stroke-linejoin:round}
.grid2{display:grid;gap:14px}
.two{display:grid;gap:20px}
.sect{margin:34px 0 14px}

/* ---------- animation ---------- */
@keyframes drawLine{from{stroke-dashoffset:var(--len)}to{stroke-dashoffset:0}}
@keyframes riseIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@keyframes ringGrow{from{transform:scale(.7);opacity:0}to{transform:scale(1);opacity:1}}
@keyframes softPop{0%{transform:scale(.94)}60%{transform:scale(1.02)}100%{transform:scale(1)}}
.rise{animation:riseIn .45s var(--ease) both}
.rise.d1{animation-delay:.08s}.rise.d2{animation-delay:.16s}.rise.d3{animation-delay:.24s}
.rise.d4{animation-delay:.32s}.rise.d5{animation-delay:.4s}
.pulse{animation:softPop .32s ease-out}
@media (hover:hover){
  .acard:hover,.jcard:hover{transform:translateY(-2px);box-shadow:0 6px 22px rgba(37,35,38,.08);border-color:#FFC7DF}
  .opt:hover{transform:translateY(-2px);border-color:var(--pink)}
  .sealrow:hover .seal{transform:scale(1.06)}
  .nextup:hover{transform:translateX(3px)}
  .brow:hover .orb{transform:scale(1.06)}
}

/* ---------- responsive ---------- */
@media (min-width:768px){
  h1{font-size:60px}h2{font-size:38px}h3{font-size:25px}
  .figure-xl{font-size:56px}.figure-lg{font-size:40px}
  .band{padding:44px 0 48px}
  .band.tight{padding:28px 0 28px}
  .wia-wrap,.wia-wrap-wide{padding:0 32px}
  .hang{font-size:34px;margin-left:-32px;padding-left:32px}
  .pull{font-size:30px}
  .grid2{grid-template-columns:1fr 1fr}
  .two{grid-template-columns:1fr 1fr;align-items:start}
  .cards3{grid-template-columns:repeat(3,1fr);gap:20px}
  .cards3 .jcard{display:flex;flex-direction:column}
  .cards3 .jcard .actions{margin-top:auto}
  .dash-foot{grid-template-columns:1fr 1fr;gap:20px}
  .seallist{grid-template-columns:1fr 1fr}
  .trans h1{font-size:64px}
  .footbar{position:static;border-top:none;background:none;backdrop-filter:none;padding:0}
  .footbar .inner{flex-direction:row-reverse;justify-content:flex-start;align-items:center;gap:16px;
    margin-top:20px;padding:0 32px;max-width:1080px}
  .footbar .inner .btn{width:auto}
  main{padding-bottom:56px}
  .actions{flex-direction:row}
  .actions .btn{width:auto}
  .opt+.opt{margin-top:0}
  .alloc-grid{display:grid;grid-template-columns:1fr 380px;gap:36px;align-items:start}
  .alloc-summary{position:sticky;top:96px}
  .hero-donut,.hero-donut svg{width:300px;height:300px}
  .hero-total{font-size:46px}
  .bigmove{font-size:60px}
}

/* ---------- review journey menu: floating pill, bottom-left ---------- */
#reviewNav{position:fixed;left:16px;bottom:16px;z-index:70;font-size:13px;display:none}
#reviewNavToggle{background:var(--charcoal);color:var(--white);border:none;border-radius:999px;
  padding:11px 16px;font-family:var(--sans);font-size:13px;font-weight:500;cursor:pointer;
  min-height:44px;box-shadow:0 6px 28px rgba(37,35,38,.18);
  transition:transform .16s var(--ease),box-shadow .2s ease-out}
#reviewNavToggle:hover{transform:translateY(-2px);box-shadow:0 8px 22px rgba(37,35,38,.24)}
#reviewNavToggle[aria-expanded="true"]{background:var(--pink);color:var(--charcoal)}
#reviewNavPanel{display:none;background:var(--white);border:1px solid var(--grey);border-radius:18px;
  padding:16px;box-shadow:0 6px 28px rgba(37,35,38,.18);margin-bottom:8px;max-width:300px;
  max-height:70vh;overflow:auto}
#reviewNavPanel.on{display:block}
.rn-row{display:block;width:100%;text-align:left;background:var(--cream);border:1px solid var(--grey);
  border-radius:12px;padding:10px 12px;margin-bottom:8px;font-family:var(--sans);font-size:14px;
  color:var(--charcoal);cursor:pointer;position:relative;overflow:hidden;
  transition:border-color .16s ease-out,background .16s ease-out,padding-left .18s ease-out}
.rn-row:hover:not(:disabled){background:var(--blush);border-color:var(--pink);padding-left:16px}
.rn-row[aria-current="step"]{border:2px solid var(--pink);background:var(--blush);padding:9px 11px}
.rn-row:disabled{opacity:.4;cursor:not-allowed;background:var(--cream)}
.rn-row:disabled:hover{padding-left:12px}
@media (max-width:767px){ #reviewNav{left:8px;bottom:8px} #reviewNavPanel{max-width:82vw} }

@media (max-width:374px){
  h1{font-size:34px}.wia-wrap,.wia-wrap-wide{padding:0 16px}
  .hang{margin-left:-16px;padding-left:16px}
  .hero-donut,.hero-donut svg{width:240px;height:240px}
  .hero-total{font-size:34px}
  .remaining .n{font-size:32px}
}
@media (prefers-reduced-motion:reduce){
  .wia-root:not(.force-motion) *{animation:none !important;transition:none !important}
  .wia-root:not(.force-motion) .rise,.wia-root:not(.force-motion) section.screen.on,.wia-root:not(.force-motion) #reportBody *,
  .wia-root:not(.force-motion) .jcard,.wia-root:not(.force-motion) .brow,.wia-root:not(.force-motion) .acard,
  .wia-root:not(.force-motion) .sealrow,.wia-root:not(.force-motion) .modal{opacity:1 !important;transform:none !important}
  .wia-root:not(.force-motion) .ripple{display:none !important}
  .wia-root:not(.force-motion) svg polyline,.wia-root:not(.force-motion) svg .pt,.wia-root:not(.force-motion) svg .ptlab,
  .wia-root:not(.force-motion) svg .dr{stroke-dashoffset:0 !important;opacity:1 !important}
  .wia-root:not(.force-motion) .track i,.wia-root:not(.force-motion) .meter span,
  .wia-root:not(.force-motion) .mtrack i,.wia-root:not(.force-motion) .bartrack i{transition:none !important}
}
#ribbon{display:flex;align-items:center;gap:12px;background:var(--charcoal);color:var(--cream);font-size:13px;padding:8px 20px;overflow:hidden}
.rlabel{white-space:nowrap;color:var(--grey);display:flex;gap:8px;align-items:center}
.rlabel-short,.demo{display:none}
.rtrack{flex:1;min-width:0;overflow-x:auto;overflow-y:hidden}
.rlane{display:flex;gap:22px;width:max-content;transition:opacity .22s}
.rctl{display:flex;gap:12px}
.rctl button{background:none;border:0;color:var(--cream);font:inherit;text-decoration:underline;cursor:pointer;min-height:32px}
#ribbonWhyPanel{background:var(--blush);padding:12px 20px;font-size:14px}
.item{background:none;border:0;color:inherit;font:inherit;display:flex;gap:8px;align-items:baseline;cursor:pointer;white-space:nowrap;min-height:32px}
.item .tk{font-weight:600}.item .nm{color:var(--grey)}.item .sep{opacity:.4}
.ch.up{color:var(--green-dk)}.ch.dn{color:var(--rose-dk)}
@media (pointer:fine) and (min-width:768px) and (prefers-reduced-motion:no-preference){
  .rtrack{overflow:hidden}
  .rlane{animation:rscroll 40s linear infinite}
  #ribbon.paused .rlane{animation-play-state:paused}
}
@keyframes rscroll{to{transform:translateX(-50%)}}
@media (max-width:767px){.rlabel-full{display:none}.rlabel-short{display:inline}}
.field{font-size:12px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;margin:0 0 10px;color:var(--taupe-deep)}
.ccard{display:block;width:100%;text-align:left;background:var(--white);border:1px solid var(--grey);border-radius:18px;padding:18px;cursor:pointer;font:inherit;color:inherit;transition:border-color .16s ease-out}
.ccard:hover{border-color:var(--pink)}
.ccard.opened{border-color:#FFC7DF;background:var(--blush)}
.ccard .top{display:flex;gap:14px;align-items:center}
.ccard .nm{font-family:var(--serif);font-size:22px;line-height:1.2;display:block}
.ccard .tick{font-size:13px;color:var(--taupe-deep);display:block}
.pillrow{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}
.pill{font-size:12px;padding:4px 10px;border-radius:999px;background:var(--cream);border:1px solid var(--grey)}
.segbtns,.lparts{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 12px}
.segbtns button,.lparts button{min-height:44px;padding:0 16px;border-radius:12px;font:inherit;font-size:15px;cursor:pointer;background:transparent;color:var(--cream);border:1px solid rgba(250,247,242,.45)}
.segbtns button[aria-pressed="true"],.lparts button[aria-pressed="true"]{background:var(--pink);color:var(--charcoal);border-color:var(--pink)}
.lesson-candle{display:block;margin:20px 0;max-width:100%;height:auto}
.chartwrap,.tblscroll{overflow-x:auto}
svg.chart{display:block;width:100%;min-width:560px;height:auto}
svg.chart:focus-visible{outline:3px solid var(--cream);outline-offset:2px}
.axis{stroke:rgba(250,247,242,.5);stroke-width:1}
.axlab{fill:#E8E4E1;font:11px Inter,sans-serif}
.wick{stroke-width:1.5}.wick-up{stroke:#8FD3B4}.wick-dn{stroke:#F5A3AE}
.candle-up{fill:none;stroke:#8FD3B4;stroke-width:1.5}
.candle-dn{fill:#F5A3AE;stroke:#F5A3AE;stroke-width:1.5}
rect.sel{fill:none;stroke:var(--pink);stroke-width:1.5}
line.sel{stroke:var(--pink);stroke-width:1}
.readout{display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:12px;margin-top:12px}
.readout .k{font-size:12px;color:var(--grey)}
.readout .v{font-variant-numeric:tabular-nums}
.chartmeta{font-size:13px;color:var(--grey);margin-top:12px}
</style><div class="wia-root">
<a class="skip" href="#main">Skip to main content</a>

<div id="ribbon" role="region" aria-label="Fictional market ribbon">
  <span class="rlabel"><span class="rlabel-full">A practice market. Fictional companies, synthetic prices</span><span class="rlabel-short">Practice market</span><span class="demo" aria-hidden="true">Practice</span></span>
  <div class="rtrack"><div class="rlane" id="rlane"></div></div>
  <div class="rctl">
    <button id="ribbonToggle" aria-pressed="false" class="hidden">Pause ticker</button>
    <button id="ribbonWhy" aria-expanded="false" aria-controls="ribbonWhyPanel">About this ribbon</button>
  </div>
</div>
<div id="ribbonWhyPanel" class="hidden">
  <strong>Why is this moving?</strong> This ribbon shows fictional companies and synthetic prices from the period you have reached. It is here so that market information becomes familiar to read. It is not live market data, and nothing can be bought here.
</div>
<p class="vh" id="ribbonSummary" role="status"></p>
<div id="fbanner"><span id="bannerText"></span></div>

<header class="jh">
  <div class="wia-wrap-wide jh-in">
    <span class="mark">Wealth in Action</span>
    <span class="chapter" id="chapterLabel"></span>
    <button class="btn-link" id="exitBtn" style="font-size:15px">Save to my account and exit</button>
  </div>
  <div class="progress"><span id="progFill" style="width:0%"></span></div>
  <div class="wia-wrap-wide"><div class="progress-label num" id="progLabel"></div></div>
</header>

<main id="main">

<!-- ================= 1. DASHBOARD ================= -->
<section class="screen" id="s-dashboard" aria-labelledby="dashH">
 <div class="band band-blush">
   <div class="blob blob-1"></div><div class="blob blob-2"></div>
   <div class="wia-wrap-wide" style="position:relative">
     <p class="kicker">Choice of Wealth</p>
     <svg class="swash" width="84" height="14" viewBox="0 0 86 14" aria-hidden="true">
       <path d="M2 11C14 11 16 3 30 3s16 8 28 8 14-8 26-8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
     </svg>
     <h1 id="dashH">Wealth in Action</h1>
     <p class="lede" style="max-width:26ch">Learn. Practise. Build confidence.</p>
     <p class="sm" id="greeting"></p>
   </div>
 </div>

 <div class="band band-cream tight">
  <div class="wia-wrap-wide">
    <div id="continuePanel"></div>
    <h2 class="sect">Your journey</h2>
    <div id="journeyCards"></div>

    <div class="dash-foot">
      <div class="layer" style="margin:0">
        <div class="panel">
          <p class="kicker">From your last journey</p>
          <p class="sm" id="insightText" style="margin:0">Your most recent learning note will appear here.</p>
          <button class="btn-link sm hidden" id="insightLink" style="font-size:15px;margin-top:8px">See your full report</button>
        </div>
      </div>
      <div class="panel">
        <p class="kicker">Learning badges</p>
        <div class="seallist" id="badgeRow"></div>
        <p class="cap" style="margin:14px 0 0">Badges recognise what you read, explored and completed. None depends on a decision, an allocation or a result.</p>
      </div>
    </div>

    <p class="cap" style="margin-top:20px">
      <a href="#" id="discLink">Educational disclaimer</a> &nbsp;·&nbsp;
      <a href="https://anas-choice-of-wealth-site.webflow.io/wealth-tool-page" rel="noopener" target="_top">More Wealth Tools</a> &nbsp;·&nbsp;
      <a href="https://anas-choice-of-wealth-site.webflow.io/" rel="noopener" target="_top">Choice of Wealth</a>
    </p>
    <p class="cap">Your progress is saved to your account, so it will be here the next time you sign in, on any device.</p>
    <p class="disc">Virtual money. Simulated scenario. Not investment advice.</p>
  </div>
 </div>
</section>

<!-- ================= 2. WELCOME ================= -->
<section class="screen" id="s-welcome" aria-labelledby="welH">
 <div class="band band-blush">
   <div class="blob blob-1"></div>
   <div class="wia-wrap" style="position:relative">
     <p class="kicker">Journey 1 · Chapter 1, Prepare</p>
     <h1 id="welH">A practice space for your first portfolio</h1>
     <p class="lede" style="max-width:34ch;margin-top:14px">You will receive €10,000 in virtual money, build a portfolio, and see what happens to it across two and a half simulated years.</p>
   </div>
 </div>

 <div class="band band-cream">
  <div class="wia-wrap">
   <p>None of the money is real. Nothing here is bought, sold or connected to any market. What is real is the practice: the choosing, the waiting, and the decisions you make when the numbers move.</p>
   <p class="sm">Journey 1 takes approximately 20 to 30 minutes. You can leave and continue later, and your progress is saved as you go.</p>

   <div class="layer">
     <div class="panel">
       <p class="kicker">What you will do</p>
       <ul class="sm" style="margin:0;padding-left:20px">
         <li style="margin-bottom:8px">Allocate virtual money across six asset categories.</li>
         <li style="margin-bottom:8px">See three simulated market periods and decide how to respond after the first two.</li>
         <li>Finish with a learning report you can return to.</li>
       </ul>
     </div>
   </div>

   <p class="hang">You are about to build your first practice portfolio.</p>

   <div class="layer"><div class="panel">
     <p class="kicker">Choose your currency</p>
     <p class="sm">The money is virtual, so nothing is converted. This simply decides which symbol you see throughout.</p>
     <div id="curCards" role="radiogroup" aria-label="Choose your currency" class="grid2"></div>
   </div></div>

   <div class="actions">
     <button class="btn btn-primary" onclick="window.__wia1.go('disclaimer')">Begin Journey 1</button>
     <button class="btn-link" id="discLink2">Read the full educational disclaimer</button>
   </div>
   <div class="nextup"><span class="dot" aria-hidden="true"></span><span>Next: meet the six categories.</span></div>
   <p class="disc">Virtual money. Simulated scenario. Not investment advice.</p>
  </div>
 </div>
</section>

<!-- ================= 3. ASSET CATEGORIES ================= -->
<section class="screen" id="s-assets" aria-labelledby="assH">
 <div class="band band-blush tight">
   <div class="blob blob-1"></div>
   <div class="wia-wrap" style="position:relative">
     <p class="kicker">Chapter 2 · Build your portfolio · Step 1 of 4</p>
     <h1 id="assH">Six ways to hold money</h1>
     <p class="lede" style="max-width:32ch;margin-top:12px">Each one behaves differently, which is the whole point of the exercise.</p>
   </div>
 </div>

 <div class="band band-cream tight">
  <div class="wia-wrap">
   <p class="sm">Open any card to read more, and come back to them whenever you like. These are simplified educational categories. They are not real funds or products, and no real company is named.</p>
   <p class="cap">The movement labels describe how widely each category moves inside this fictional journey. They are not risk ratings for real investments.</p>

   <div style="margin:14px 0"><button class="btn-link sm" id="tableToggle" aria-expanded="false" style="font-size:15px">View as a table</button></div>
   <div id="assetTable" class="panel hidden" style="overflow-x:auto;margin-bottom:16px"></div>

   <div id="assetCards" class="grid2"></div>

   <div class="nextup"><span class="dot" aria-hidden="true"></span><span>Next: bring your portfolio to life.</span></div>
   <p class="disc">Virtual money. Simulated scenario. Not investment advice.</p>
  </div>
 </div>
 <div class="footbar"><div class="inner">
   <button class="btn btn-primary" id="assetNext">Start allocating</button>
   <p class="helper" id="assetHelper">You have opened 0 of six detailed explanations.</p>
 </div></div>
</section>

<!-- 2. RESEARCH LIBRARY -->
<section class="screen" id="s-library">
 <div class="band band-blush tight"><div class="blob blob-1"></div>
  <div class="wia-wrap" style="position:relative">
   <p class="kicker">Chapter 1 · Meet the companies</p>
   <h1>Six businesses to research</h1>
   <p class="lede" style="max-width:34ch;margin-top:10px">Open each one and read how it earns its money before you decide anything.</p>
  </div>
 </div>
 <div class="band band-cream tight"><div class="wia-wrap">
   <div class="layer"><div class="panel">
     <p class="field">What owning a share means</p>
     <p class="sm">A share is an equity interest in a company. It is not a bet on a number, and it is not a debt the company owes you.</p>
     <p class="sm">Owning shares does not mean you own a slice of the company's buildings, its stock or its bank balance directly. The company owns those. What you hold is an interest in the company itself: a claim on what is left after everyone else has been paid, a share of any profits the company chooses to distribute as dividends, and normally a vote on certain decisions.</p>
     <p class="sm" style="margin:0">Lenders, suppliers, employees and tax authorities are paid before shareholders. Shareholders come last, which is why the interest can be worth a great deal and can also be worth very little.</p>
   </div></div>
   <p class="sm" id="libIntro"></p>
   <div class="grid2" id="libCards"></div>
   <div class="layer"><div class="panel">
     <p class="field">Also available to you</p>
     <p class="sm" style="margin:0 0 8px"><strong>Virtual cash.</strong> Any part of your €10,000 may stay as cash, including all of it.</p>
     <p class="sm" style="margin:0"><strong>The Equal-Weighted Company Basket.</strong> One holding that places an equal amount into each of the companies in this library at the virtual decision date. The weights then drift with the prices and nothing is rebalanced, so a company that rises becomes a larger part of the basket. It is not an index, a fund, a benchmark or a broadly diversified investment: it is these companies, equally allocated once and then left alone. Shown separately from the individual companies throughout, and nothing here compares your portfolio with it.</p>
   </div></div>
   <div class="nextup"><span class="dot"></span><span>Next: learn to read a price chart.</span></div>
   <p class="disc" id="libDisc"></p>
 </div></div>
 <div class="wia-wrap"><div class="actions" style="padding-bottom:20px">
   <button class="btn btn-primary" id="libNext" aria-disabled="true">How to read a candlestick</button>
   <p class="cap" id="libHelper" style="margin:0"></p>
 </div></div>
</section>

<!-- 3. CANDLESTICK LESSON -->
<section class="screen" id="s-lesson">
 <div class="band band-dark"><div class="blob blob-1"></div>
  <div class="wia-wrap" style="position:relative">
   <p class="kicker">Chapter 2 · Research before you choose</p>
   <h1 style="max-width:16ch">Every candle tells us what happened. Not what happens next.</h1>
   <p class="lede" style="max-width:38ch;margin-top:14px">One candle summarises how a price moved during one period. Select each part to see what it means.</p>

   <svg class="lesson-candle" id="lessonSvg" width="260" height="330" viewBox="0 0 260 330" aria-hidden="true"></svg>

   <div class="lparts" id="lessonParts"></div>
   <div class="panel" id="lessonCopy" style="min-height:96px"><p class="sm" style="margin:0">Select a part above to read what it means.</p></div>

   <div class="panel" style="margin-top:16px">
     <p class="kicker">Two periods side by side</p>
     <svg id="lessonPair" width="100%" height="180" viewBox="0 0 260 180" aria-hidden="true"></svg>
     <p class="cap" style="margin:0" id="pairCopy"></p>
   </div>

   <div class="callout"><p class="sm" style="margin:0">A candlestick summarises how a price moved during a particular period. It does not tell us what the price will do next.</p></div>
   <p class="disc" id="lessonDisc"></p>
  </div>
 </div>
 <div class="wia-wrap"><div class="actions" style="padding:20px 0">
   <button class="btn btn-primary" id="lessonNext" aria-disabled="true">Open a company profile</button>
   <p class="cap" id="lessonHelper" style="margin:0"></p>
 </div></div>
</section>

<!-- 4. COMPANY PROFILE -->
<section class="screen" id="s-profile">
 <div class="band band-cream tight"><div class="wia-wrap-wide" id="profHead"></div></div>
 <div class="band band-dark"><div class="wia-wrap-wide" id="profChart"></div></div>
 <div class="band band-cream"><div class="wia-wrap-wide" id="profBody"></div></div>
</section>


<!-- ================= 4. ALLOCATION ================= -->
<section class="screen" id="s-allocate" aria-labelledby="allH">
 <div class="band band-blush tight">
   <div class="blob blob-1"></div><div class="blob blob-2"></div>
   <div class="wia-wrap-wide" style="position:relative">
     <p class="kicker">Chapter 2 · Build your portfolio · Step 2 of 4</p>
     <h1 id="allH">Where will your €10,000 go?</h1>
     <p class="lede" style="max-width:32ch;margin-top:12px">There is no perfect answer here. This is your opportunity to explore.</p>
   </div>
 </div>

 <div class="band band-cream tight">
  <div class="wia-wrap-wide">
   <div class="alloc-grid">

     <div>
       <div id="allocRows"></div>
       <div class="layer">
         <div class="panel">
           <p class="kicker">Your mix so far</p>
           <p class="sm" id="mixLine" style="margin:0"></p>
           <div id="concentration"></div>
           <button class="btn-link sm" id="diversToggle" aria-expanded="false" aria-controls="diversPanel" style="font-size:15px;margin-top:10px">What these groups mean</button>
           <div class="hidden" id="diversPanel" style="margin-top:10px;border-top:1px solid var(--grey);padding-top:12px">
             <p class="sm" style="margin:0 0 10px">Lower-movement categories in this simulation are Cash and Government bonds. Higher-movement categories are Global companies, Technology companies, the Property fund and Gold.</p>
             <p class="sm" style="margin:0">This grouping exists only for this educational simulation. It is not a universal description of these categories, and the four higher-movement categories do not behave alike or perform the same function. The higher-movement total is not a measure of growth.</p>
           </div>
         </div>
       </div>
       <div style="margin-top:12px"><button class="btn-link sm" id="resetBtn" style="font-size:15px">Reset all amounts</button></div>
     </div>

     <aside class="alloc-summary" aria-label="Portfolio summary">
       <div class="remaining">
         <span class="n num" id="remaining">€10,000.00</span>
         <span class="l">still to place</span>
       </div>
       <div class="track"><i id="allocMeter"></i></div>
       <p class="cap" id="allocSub" style="margin-top:8px">Cash counts as a choice.</p>
       <p class="vh" id="remainStatus" role="status" aria-live="polite"></p>

       <div class="hero-donut">
         <div class="glow" aria-hidden="true"></div>
         <svg id="donut" viewBox="0 0 240 240" aria-hidden="true"></svg>
         <div class="hero-mid">
           <span class="k cap">Allocated</span>
           <span class="hero-total num" id="donutTotal">€0.00</span>
         </div>
       </div>
       <p class="vh" id="donutSummary"></p>
     </aside>

   </div>

   <div class="nextup"><span class="dot" aria-hidden="true"></span><span>Next: the market changes.</span></div>
   <p class="disc">Virtual money. Simulated scenario. Not investment advice.</p>
  </div>
 </div>
 <div class="footbar"><div class="inner">
   <button class="btn btn-primary" id="allocNext" aria-disabled="true" aria-describedby="allocHelper">Review my portfolio</button>
   <p class="helper" id="allocHelper">Start anywhere. Add an amount to any category, and the chart will follow.</p>
 </div></div>
</section>

<!-- ================= 5. MARKET EVENT + DECISION ================= -->
<section class="screen" id="s-event" aria-labelledby="evH">
 <div class="band band-dark">
  <div class="blob blob-1"></div><div class="blob blob-2"></div>
  <div class="wia-wrap" style="position:relative">
   <p class="kicker" id="evKicker"></p>
   <span class="tag">Simulated</span>
   <h1 id="evH" style="margin-top:14px;max-width:15ch">The market changes</h1>
   <div id="evDark"></div>
  </div>
 </div>
 <div class="band band-cream">
  <div class="wia-wrap" id="evLight"></div>
 </div>
</section>


<!-- ================= CHAPTER 1: PREPARE ================= -->
<section class="screen" id="s-disclaimer" aria-labelledby="disH">
 <div class="band band-blush tight"><div class="blob blob-1"></div>
  <div class="wia-wrap" style="position:relative">
   <p class="kicker">Chapter 1 · Prepare · Step 2 of 6</p>
   <h1 id="disH">Before you begin</h1>
  </div>
 </div>
 <div class="band band-cream"><div class="wia-wrap">
  <p>Wealth in Action is an educational simulation created by Choice of Wealth.</p>
  <p>All money in this experience is virtual. The market events are fictional. They were written for teaching, using an invented set of assumptions, and they are not forecasts.</p>
  <p>Historical performance describes what happened in the past. Simulated performance shows what happened under an invented or modelled set of assumptions. Neither predicts future results.</p>
  <p>This experience does not give you personalised financial advice and does not recommend any product, fund or company. When you are ready to invest for real, speak to an appropriately qualified professional who can consider your full circumstances.</p>
  <div class="layer"><div class="panel">
    <label class="opt" style="cursor:pointer" for="disAgree" id="disAgreeWrap">
      <span style="display:flex;gap:12px;align-items:flex-start">
        <input type="checkbox" id="disAgree" style="width:24px;height:24px;margin-top:2px;accent-color:var(--pink)">
        <span class="d" style="font-size:16px">I understand this is an educational simulation and not financial advice.</span>
      </span>
    </label>
    <p class="cap" id="disHelp" style="margin:10px 0 0"></p>
  </div></div>
  <button class="btn-link sm" id="fullDiscLink" style="font-size:15px">Read the full educational disclaimer</button>
  <div class="actions">
    <button class="btn btn-primary" id="disNext" aria-disabled="true" aria-describedby="disHelp">I understand, continue</button>
    <button class="btn btn-secondary" onclick="window.__wia1.go('welcome')">Back</button>
  </div>
  <p class="disc">Virtual money. Simulated scenario. Not investment advice.</p>
 </div></div>
</section>

<section class="screen" id="s-goal" aria-labelledby="goalH">
 <div class="band band-blush tight"><div class="blob blob-1"></div>
  <div class="wia-wrap" style="position:relative">
   <p class="kicker">Chapter 1 · Prepare · Step 3 of 6</p>
   <h1 id="goalH">What is this money for?</h1>
   <p class="lede" style="max-width:34ch;margin-top:10px">It gives your decisions a context, and it appears in your final report.</p>
  </div>
 </div>
 <div class="band band-cream"><div class="wia-wrap">
  <p class="sm">Choosing a goal does not change the market events you see.</p>
  <div id="goalCards" role="radiogroup" aria-label="What is this money for"></div>
  <p class="sm" id="goalNote" style="margin-top:14px"></p>
  <p class="errline" id="goalErr" role="alert"></p>
  <div class="actions">
    <button class="btn btn-primary" id="goalNext" aria-disabled="true">Continue</button>
    <button class="btn btn-secondary" onclick="window.__wia1.go('disclaimer')">Back</button>
  </div>
  <p class="disc">Virtual money. Simulated scenario. Not investment advice.</p>
 </div></div>
</section>

<section class="screen" id="s-horizon" aria-labelledby="horH">
 <div class="band band-blush tight"><div class="blob blob-1"></div>
  <div class="wia-wrap" style="position:relative">
   <p class="kicker">Chapter 1 · Prepare · Step 4 of 6</p>
   <h1 id="horH">How long would you leave this money invested?</h1>
  </div>
 </div>
 <div class="band band-cream"><div class="wia-wrap">
  <p>Time horizon means the length of time you would leave money invested before you need it. It matters because a fall in value is a different event depending on whether you need the money next year or in twenty years.</p>
  <div id="horCards" role="radiogroup" aria-label="How long would you leave this money invested"></div>
  <p class="sm" id="horNote" style="margin-top:14px"></p>
  <div class="callout">
    <p class="kicker">Worth knowing</p>
    <p class="sm" style="margin:0">A longer horizon does not remove the possibility of a fall. It changes how much a fall matters at the time, because there is more time available before the money is needed.</p>
  </div>
  <p class="errline" id="horErr" role="alert"></p>
  <div class="actions">
    <button class="btn btn-primary" id="horNext" aria-disabled="true">Continue</button>
    <button class="btn btn-secondary" onclick="window.__wia1.go('goal')">Back</button>
  </div>
  <p class="disc">Virtual money. Simulated scenario. Not investment advice.</p>
 </div></div>
</section>

<section class="screen" id="s-react" aria-labelledby="reactH">
 <div class="band band-blush tight"><div class="blob blob-1"></div>
  <div class="wia-wrap" style="position:relative">
   <p class="kicker">Chapter 1 · Prepare · Step 5 of 6</p>
   <h1 id="reactH">How might you react?</h1>
   <p class="lede" style="max-width:36ch;margin-top:10px">One short question. There is no correct answer.</p>
  </div>
 </div>
 <div class="band band-cream"><div class="wia-wrap">
  <p class="sm">Your choice does not change what happens next. It is recorded so you can compare it with what you actually do later.</p>
  <div class="layer"><div class="panel">
    <p style="margin:0">Imagine your portfolio falls by 20 per cent over several months. Newspapers are describing it as a serious decline. What is your honest first instinct?</p>
  </div></div>
  <div id="reactCards" role="radiogroup" aria-label="How might you react"></div>
  <p class="sm" id="reactNote" style="margin-top:14px"></p>
  <p class="errline" id="reactErr" role="alert"></p>
  <div class="actions">
    <button class="btn btn-primary" id="reactNext" aria-disabled="true">Continue</button>
    <button class="btn btn-secondary" onclick="window.__wia1.go('horizon')">Back</button>
  </div>
  <p class="disc">Virtual money. Simulated scenario. Not investment advice.</p>
 </div></div>
</section>

<section class="screen" id="s-capital" aria-labelledby="capH">
 <div class="band band-blush"><div class="blob blob-1"></div><div class="blob blob-2"></div>
  <div class="wia-wrap" style="position:relative">
   <p class="kicker">Chapter 1 · Prepare · Step 6 of 6</p>
   <h1 id="capH">Your virtual money is ready</h1>
   <p class="cap" style="margin-top:14px">Virtual starting capital</p>
   <p class="figure-xl num" id="capFigure" style="margin:0">0.00</p>
  </div>
 </div>
 <div class="band band-cream"><div class="wia-wrap">
  <p>This is virtual money. It exists only inside this simulation.</p>
  <p>Right now it is held as cash. Cash generally changes less than investments and may earn interest. Its purchasing power can still fall when prices rise. Investing means putting money into assets whose value can rise and fall, in exchange for the possibility of growth.</p>
  <div class="grid2">
    <div class="panel"><p class="kicker">Holding cash</p><ul class="sm" style="margin:0;padding-left:18px">
      <li style="margin-bottom:8px">The balance usually changes little, and may earn interest.</li>
      <li style="margin-bottom:8px">Its purchasing power can fall when prices rise.</li>
      <li>Usually available quickly.</li></ul></div>
    <div class="panel"><p class="kicker">Investing</p><ul class="sm" style="margin:0;padding-left:18px">
      <li style="margin-bottom:8px">The value moves up and down.</li>
      <li style="margin-bottom:8px">It may grow, and it may fall in value.</li>
      <li>Better suited to money you can leave alone.</li></ul></div>
  </div>
  <div class="nextup"><span class="dot" aria-hidden="true"></span><span>Next: meet the six categories.</span></div>
  <div class="actions">
    <button class="btn btn-primary" onclick="window.__wia1.go('t1')">Continue</button>
    <button class="btn btn-secondary" onclick="window.__wia1.go('react')">Back</button>
  </div>
  <p class="disc">Virtual money. Simulated scenario. Not investment advice.</p>
 </div></div>
</section>

<!-- ================= CHAPTER 2 ================= -->
<section class="screen" id="s-review" aria-labelledby="revH">
 <div class="band band-blush tight"><div class="blob blob-1"></div>
  <div class="wia-wrap-wide" style="position:relative">
   <p class="kicker">Chapter 2 · Build your portfolio · Step 3 of 4</p>
   <h1 id="revH">Your portfolio</h1>
   <p class="lede" style="max-width:34ch;margin-top:10px">Take a moment to look at it before you continue.</p>
  </div>
 </div>
 <div class="band band-cream tight"><div class="wia-wrap-wide">
  <div class="two">
   <div id="reviewTable"></div>
   <aside class="alloc-summary">
     <div class="hero-donut">
       <div class="glow" aria-hidden="true"></div>
       <svg id="revDonut" viewBox="0 0 240 240" aria-hidden="true"></svg>
       <div class="hero-mid"><span class="k cap">Total</span><span class="hero-total num" id="revTotal"></span></div>
     </div>
     <p class="vh" id="revDonutSummary"></p>
   </aside>
  </div>
  <div id="reviewObs"></div>
  <div class="actions">
    <button class="btn btn-primary" id="revConfirm">Continue to Experience the Market</button>
    <button class="btn btn-secondary" onclick="window.__wia1.go('allocate')">Edit amounts</button>
  </div>
  <p class="disc">Virtual money. Simulated scenario. Not investment advice.</p>
 </div></div>
</section>

<section class="screen" id="s-reasons" aria-labelledby="reaH">
 <div class="band band-blush tight"><div class="blob blob-1"></div>
  <div class="wia-wrap" style="position:relative">
   <p class="kicker">Chapter 2 · Build your portfolio · Step 4 of 4</p>
   <h1 id="reaH">Why did you choose this?</h1>
   <p class="lede" style="max-width:36ch;margin-top:10px">There is no marking. This appears in your final report.</p>
  </div>
 </div>
 <div class="band band-cream"><div class="wia-wrap">
  <p class="sm">In your own words, or by choosing from the options below, so you can see later whether your reasoning matched what you did.</p>
  <div id="reasonChips" style="display:flex;flex-wrap:wrap;gap:10px"></div>
  <div style="margin-top:18px">
    <label class="sm" for="reasonNote" style="display:block;margin-bottom:6px">Anything else you want to note</label>
    <textarea id="reasonNote" rows="4" placeholder="Optional" maxlength="500"
      style="width:100%;font-family:var(--sans);font-size:16px;border:1px solid var(--grey);border-radius:14px;padding:12px;background:var(--white);color:var(--charcoal)"></textarea>
    <p class="cap" id="reasonCount" style="margin:6px 0 0" aria-live="polite"></p>
  </div>
  <p class="errline" id="reasonErr" role="alert"></p>
  <div class="nextup"><span class="dot" aria-hidden="true"></span><span>Next: the market changes.</span></div>
  <div class="actions">
    <button class="btn btn-primary" id="reasonNext" aria-disabled="true">Continue</button>
  </div>
  <p class="disc">Virtual money. Simulated scenario. Not investment advice.</p>
 </div></div>
</section>

<!-- ================= CHAPTER 3 CLOSE ================= -->
<section class="screen" id="s-complete" aria-labelledby="compH">
 <div class="band band-blush"><div class="blob blob-1"></div><div class="blob blob-2"></div>
  <div class="wia-wrap" style="position:relative;text-align:center">
   <svg width="118" height="118" viewBox="0 0 130 130" aria-hidden="true" style="margin:0 auto 14px;display:block">
     <circle class="dr" cx="65" cy="65" r="50" fill="none" stroke="#FF4F9A" stroke-width="1.5"/>
     <circle class="dr" cx="65" cy="65" r="37" fill="none" stroke="#FF4F9A" stroke-width="1" style="opacity:.4"/>
     <path class="dr" d="M48 66 L60 78 L84 52" fill="none" stroke="#FF4F9A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
   </svg>
   <h1 id="compH" style="max-width:20ch;margin:0 auto 12px">You have completed Journey 1</h1>
   <p class="lede" style="max-width:42ch;margin:0 auto">You built a portfolio, saw it through a period of rising costs, a decline and an uneven recovery, and made your own decisions along the way.</p>
  </div>
 </div>
 <div class="band band-cream"><div class="wia-wrap">
  <p>Your final simulated value is on the next screen, along with what the journey shows about the choices you made. Whatever the figure, the value of this exercise is the practice.</p>
  <h2 class="sect">Badges earned in this journey</h2>
  <div class="seallist" id="completeBadges"></div>
  <div class="actions">
    <button class="btn btn-primary" onclick="window.__wia1.go('report')">View my learning report</button>
  </div>
  <p class="disc">Virtual money. Simulated scenario. Not investment advice.</p>
 </div></div>
</section>

<section class="screen" id="s-next" aria-labelledby="nextH">
 <div class="band band-blush tight"><div class="blob blob-1"></div>
  <div class="wia-wrap" style="position:relative">
   <p class="kicker">Journey 1 complete</p>
   <h1 id="nextH">Keep building your confidence</h1>
  </div>
 </div>
 <div class="band band-cream"><div class="wia-wrap">
  <p>You have completed your first Wealth in Action practice journey. Inside the Choice of Wealth Inner Circle, you can continue learning through guided lessons, Savings Challenges and the Company Investor Lab, all designed to help you understand financial decisions before making them with real money.</p>
  <div class="actions">
    <a class="btn btn-primary" id="innerCircleLink" href="https://anas-choice-of-wealth-site.webflow.io/members-page" rel="noopener" target="_top">Explore the Inner Circle</a>
    <a class="btn btn-secondary" id="toolsLink" href="https://anas-choice-of-wealth-site.webflow.io/wealth-tool-page" rel="noopener" target="_top">Back to Wealth Tools</a>
  </div>
  <p class="cap" style="margin-top:18px">Your journey and your report are already complete. Nothing here is required.</p>
  <div style="margin-top:22px">
    <button class="btn-link sm" onclick="window.__wia1.go('report')" style="font-size:15px">Return to my report</button>
  </div>
  <p class="disc">Virtual money. Simulated scenario. Not investment advice.</p>
 </div></div>
</section>

<!-- ================= CHAPTER TRANSITIONS ================= -->
<section class="screen" id="s-t1" aria-labelledby="t1H">
 <div class="band band-blush" style="min-height:100%">
  <div class="blob blob-1"></div><div class="blob blob-2"></div>
  <div class="wia-wrap" style="position:relative"><div class="trans">
   <p class="kicker">Chapter 2 · Build your portfolio</p>
   <svg class="art" width="150" height="84" viewBox="0 0 150 84" aria-hidden="true">
     <path class="dr" d="M10 66 C42 66 48 20 75 20 C102 20 108 48 140 48"/>
     <circle class="dr" cx="75" cy="20" r="5"/>
   </svg>
   <h1 id="t1H">Let's turn €10,000 into your first practice portfolio</h1>
   <p class="lede">First you will meet the six categories. Then you decide how much goes into each one.</p>
   <div class="actions"><button class="btn btn-primary" onclick="window.__wia1.go('assets')">Meet the six categories</button></div>
   <p class="next">Next: meet the six categories.</p>
  </div></div>
 </div>
</section>

<section class="screen" id="s-t2" aria-labelledby="t2H">
 <div class="band band-blush" style="min-height:100%">
  <div class="blob blob-1"></div>
  <div class="wia-wrap" style="position:relative"><div class="trans">
   <p class="kicker">Chapter 3 · Experience the market</p>
   <svg class="art" width="170" height="90" viewBox="0 0 170 90" aria-hidden="true">
     <circle class="dr" cx="85" cy="45" r="32"/>
     <path class="dr" d="M18 70 L52 54 L85 63 L118 30 L152 42"/>
   </svg>
   <h1 id="t2H">Your portfolio is ready. Now let's see how it responds</h1>
   <p class="lede">Three simulated periods, written for teaching. After the first two, you decide what to do.</p>
   <div class="actions"><button class="btn btn-primary" onclick="window.__wia1.go('event')">Begin the first period</button></div>
   <p class="next">Next: the market changes.</p>
  </div></div>
 </div>
</section>

<section class="screen" id="s-t3" aria-labelledby="t3H">
 <div class="band band-blush" style="min-height:100%">
  <div class="blob blob-1"></div><div class="blob blob-2"></div>
  <div class="wia-wrap" style="position:relative"><div class="trans">
   <p class="kicker">Journey 1 complete</p>
   <svg class="art" width="130" height="130" viewBox="0 0 130 130" aria-hidden="true">
     <circle class="dr" cx="65" cy="65" r="50"/>
     <circle class="dr" cx="65" cy="65" r="37" style="opacity:.42"/>
     <path class="dr" d="M48 66 L60 78 L84 52"/>
   </svg>
   <h1 id="t3H">You completed the journey. Let's look at what you discovered</h1>
   <p class="lede">Whatever happened to the virtual portfolio, the important result is what you now understand.</p>
   <div class="actions"><button class="btn btn-primary" onclick="window.__wia1.go('report')">Open my learning report</button></div>
   <p class="next">Next: discover what your decisions revealed.</p>
  </div></div>
 </div>
</section>

<!-- ================= 6. LEARNING REPORT ================= -->
<section class="screen" id="s-report" aria-labelledby="repH">
 <div class="band band-blush">
  <div class="blob blob-1"></div><div class="blob blob-2"></div>
  <div class="wia-wrap" style="position:relative">
   <div class="moment">
     <svg width="118" height="118" viewBox="0 0 130 130" aria-hidden="true">
       <circle class="dr" cx="65" cy="65" r="50" fill="none" stroke="#FF4F9A" stroke-width="1.5"/>
       <circle class="dr" cx="65" cy="65" r="37" fill="none" stroke="#FF4F9A" stroke-width="1" style="opacity:.4"/>
       <path class="dr" d="M48 66 L60 78 L84 52" fill="none" stroke="#FF4F9A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
     </svg>
     <h1 id="repH">You completed your first Wealth in Action journey.</h1>
     <p class="lede">Whatever happened to the virtual portfolio, the important result is what you now understand.</p>
     <p class="cap" style="margin-top:14px" id="repDateLine">Journey 1: Build Your First Portfolio.</p>
   </div>
  </div>
 </div>

 <div class="band band-cream tight">
  <div class="wia-wrap-wide">
   <div id="reportBody"></div>
   <p class="disc" id="reportDisc"></p>
  </div>
 </div>
</section>

</main>

<!-- modal -->
<div class="mask" id="mask" role="dialog" aria-modal="true" aria-labelledby="modalH">
  <div class="modal">
    <h3 id="modalH">Review your decision</h3>
    <div id="modalBody"></div>
    <p class="cap" id="modalFoot">Nothing will be applied until you confirm.</p>
    <div class="actions">
      <button class="btn btn-primary" id="modalYes">Confirm decision</button>
      <button class="btn btn-secondary" id="modalNo">Change my mind</button>
    </div>
  </div>
</div>

<!-- review journey menu: a floating pill, fixed to the bottom-left, with a popover list above it -->
<div id="reviewNav">
  <div id="reviewNavPanel" role="dialog" aria-labelledby="reviewNavH">
    <p id="reviewNavH" class="kicker" style="margin:0 0 4px">Your journey</p>
    <p class="cap" style="margin:0 0 12px">Steps you've reached are listed below. Locked steps have not been reached yet in this journey.</p>
    <div id="reviewNavList"></div>
  </div>
  <button id="reviewNavToggle" aria-expanded="false">Review menu</button>
</div>
</div>
`;

    var skipLink = shadow.querySelector('.skip');
    if (skipLink) skipLink.addEventListener('click', function(e){
      e.preventDefault();
      var m = shadow.getElementById('main');
      if (m){ m.setAttribute('tabindex','-1'); m.focus(); m.scrollIntoView(); }
    });

    function wiaActiveEl(){ return shadow.activeElement || document.activeElement; }

    (function(shadowRoot, wiaMember){

/* ============================================================
   WEALTH IN ACTION — APP LOGIC (production build, unmodified)
   See README-webflow-integration.md before pasting this anywhere.
   This must run AFTER the HTML markup exists on the page, so in
   Webflow it belongs in Page Settings → Custom Code →
   "Before </body> tag" (never in the <head> code).
   ============================================================ */
"use strict";
/* ============================================================
   MONEY ENGINE
   Exact integer arithmetic. Values held as BigInt picoeuros
   (1 euro = 10^12 units). Movement factors are exact integers
   over 1000. No binary floating point touches any money value.
   Rounding to cents happens only in fmt(), and fmt output is
   never fed back into a calculation.
   ============================================================ */
const S = 1000000000000n;          // 1 euro
const CENT = S / 100n;             // 1 cent

function fromEuros(n){ return BigInt(Math.round(n)) * S; }
function mulF(v, milli){ return v * BigInt(milli) / 1000n; }   // exact: v always divisible by 1000
function roundDiv(a, b){                                        // half-up, sign-aware
  const neg = (a < 0n) !== (b < 0n);
  const A = a < 0n ? -a : a, B = b < 0n ? -b : b;
  const r = (A * 2n + B) / (B * 2n);
  return neg ? -r : r;
}
function toCents(v){ return roundDiv(v, CENT); }
/* One currency token drives every symbol in the interface, the calculations
   and the report. The money is virtual, so nothing is converted: the choice
   only decides which symbol is shown, consistently, from the first screen on. */
const CURRENCIES = { GBP:{ symbol:"\u00A3", name:"Pounds", code:"GBP" },
                     EUR:{ symbol:"\u20AC", name:"Euros", code:"EUR" } };
function CUR(){ return CURRENCIES[(typeof app !== "undefined" && app.currency) || "GBP"].symbol; }
function fmt(v, sign){
  const c = toCents(v);
  const neg = c < 0n, abs = neg ? -c : c;
  const whole = (abs / 100n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const frac = (abs % 100n).toString().padStart(2, "0");
  const s = (neg ? "\u2212" : (sign ? "+" : "")) + CUR() + whole + "." + frac;
  return s;
}
/* The illustrative charge in the report is 0.35 per cent a year on the worked
   portfolio. Shown in whichever currency the visitor chose, never deducted. */
function money84(){ return CUR() + "84.77"; }
function pct1(part, total){                 // one decimal place, as a Number for display only
  if (total === 0n) return 0;
  return Number(roundDiv(part * 1000n, total)) / 10;
}
function pctStr(x){ return x.toFixed(1) + "%"; }

/* largest remainder so displayed percentages total 100.0 */
function weightsPct(vals, total){
  if (total === 0n) return vals.map(() => 0);
  const raw = vals.map(v => Number(roundDiv(v * 100000n, total)) / 1000); // percentage to 2dp
  const floors = raw.map(x => Math.floor(x * 10) / 10);
  let used = Math.round(floors.reduce((a, b) => a + b, 0) * 10);
  const rem = raw.map((x, i) => ({ i, r: x - floors[i] })).sort((a, b) => b.r - a.r);
  const out = floors.slice();
  let k = 0;
  while (used < 1000 && k < rem.length) { out[rem[k].i] = Math.round((out[rem[k].i] + 0.1) * 10) / 10; used++; k++; }
  return out;
}

/* ============================================================
   SCENARIO DATA  (fictional, fixed, from the specification)
   ============================================================ */
const CATS = [
  { id:"cash",     name:"Cash",                  move:"Lower movement in this simulation",  colour:"#E8E4E1",
    role:"Cash generally changes less than investments and may earn interest. Its purchasing power can still fall when prices rise.",
    learn:["Cash in this simulation means money held as money rather than invested. In this journey it earns a small positive amount in each period, which is why its value rises slightly rather than staying flat.",
           "In real life, cash balances may earn interest, and the rate can change. What that interest does for you depends on inflation, which is the rate at which prices rise. If prices rise by 4 per cent in a year and your cash earns 1 per cent, the balance has grown while buying less than it did.",
           "Cash is not entirely risk free. Alongside inflation, there are considerations around the institution holding the money, how quickly you can access it, and currency where money is held in one currency and spent in another.",
           "The behaviour of cash in this simulation is not a universal description of every bank account or cash product."],
    income:"Interest, which can change", with:"Interest rates, with purchasing power affected by inflation" },
  { id:"bonds",    name:"Government bonds",      move:"Lower movement in this simulation",  colour:"#8F7A6A",
    role:"Lending money to a government in exchange for fixed interest.",
    learn:["A bond is a loan. When you buy a government bond, you are lending money to a government, which agrees to pay interest at a set rate and return the amount at the end of an agreed period.",
           "Because the interest is fixed, bonds usually move less than shares. They are not fixed in price. If interest rates rise, newly issued bonds pay more, which makes existing bonds paying less attractive to other buyers, so their prices tend to fall. You will see this in the first market event.",
           "Their behaviour also depends on the government issuing them, how long until they mature, and the currency they are issued in."],
    income:"Fixed interest", with:"Interest rates" },
  { id:"global",   name:"Global companies",      move:"Higher movement in this simulation", colour:"#FF4F9A",
    role:"A wide spread of large companies across many countries and industries.",
    learn:["This category represents part-ownership of a large number of established companies around the world, across industries such as manufacturing, healthcare, energy, consumer goods and finance.",
           "When you own shares, you own a share of a company's future profits. Their value rises and falls with what buyers are willing to pay, which reflects expectations about those profits.",
           "Spreading money across many companies and countries reduces the effect of any single company doing badly. It does not remove the possibility that most companies fall at the same time because economic conditions have changed."],
    income:"Dividends from profits", with:"Economic conditions and company profits" },
  { id:"tech",     name:"Technology companies",  move:"Widest movement in this simulation", colour:"#252326",
    role:"Companies in a single sector, with wider movements in both directions.",
    learn:["This category holds companies from one sector rather than across many. Concentration means having a large share of a portfolio exposed to the same set of conditions.",
           "Much of the value placed on these companies rests on expected future growth rather than on profits already earned. That makes their prices particularly sensitive to interest rates.",
           "Across the three periods in this journey, this category falls the most and then rises the most. Both movements come from the same characteristic."],
    income:"Little or none", with:"Expectations about future growth" },
  { id:"property", name:"Property fund",         move:"Moderate movement in this simulation", colour:"#4F8068",
    role:"A pooled holding of commercial buildings and the rent they produce.",
    learn:["A property fund pools money from many people to own buildings such as offices, warehouses and shops, and passes on a share of the rent.",
           "Property is sensitive to borrowing costs, because most property is bought with debt. When interest rates rise, borrowing becomes more expensive and property values often fall.",
           "The characteristic to notice is speed. Shares can be sold in a moment. Buildings cannot."],
    income:"Rent", with:"Borrowing costs and demand for buildings" },
  { id:"gold",     name:"Gold",                  move:"Moderate movement in this simulation", colour:"#D89B45",
    role:"A physical metal that pays no income and moves on demand alone.",
    learn:["Gold produces nothing. A company can grow its profits and a bond pays interest, but a bar of gold simply sits. Its price moves only because of what others are willing to pay for it.",
           "People often buy it during periods of uncertainty, which is why it has sometimes risen when shares have fallen. Sometimes is the important word.",
           "In this journey gold rises during the decline and then falls during the recovery."],
    income:"None", with:"Demand and uncertainty" }
];
const IDX = {}; CATS.forEach((c, i) => IDX[c.id] = i);

/* factors x1000, exact */
const EVENTS = [
  { n:1, period:"Months 1 to 6",   f:{cash:1008, bonds:935,  global:968,  tech:906,  property:929,  gold:1026}, pct:{cash:0.8, bonds:-6.5, global:-3.2, tech:-9.4, property:-7.1, gold:2.6},  infl:1041 },
  { n:2, period:"Months 7 to 14",  f:{cash:1011, bonds:1024, global:852,  tech:775,  property:887,  gold:1089}, pct:{cash:1.1, bonds:2.4,  global:-14.8, tech:-22.5, property:-11.3, gold:8.9}, infl:1032 },
  { n:3, period:"Months 15 to 30", f:{cash:1022, bonds:1041, global:1260, tech:1420, property:1060, gold:932},  pct:{cash:2.2, bonds:4.1,  global:26.0, tech:42.0, property:6.0, gold:-6.8},  infl:1019 }
];
const INFL_NUM = 1094723928n, INFL_DEN = 1000000000n;   // 1.041 x 1.032 x 1.019
const DEFAULT_ALLOC = { cash:2000, bonds:1500, global:3000, tech:1000, property:1500, gold:1000 };

const ICONS = {
  cash:'<rect x="4" y="8" width="24" height="16" rx="3"/><circle cx="16" cy="16" r="4"/>',
  bonds:'<rect x="6" y="5" width="20" height="22" rx="2"/><path d="M10 12h12M10 17h12M10 22h6"/>',
  global:'<circle cx="16" cy="16" r="11"/><path d="M5 16h22M16 5c3.5 3.6 3.5 18.4 0 22M16 5c-3.5 3.6-3.5 18.4 0 22"/>',
  tech:'<rect x="9" y="9" width="14" height="14" rx="2"/><path d="M13 9V5M19 9V5M13 27v-4M19 27v-4M9 13H5M9 19H5M27 13h-4M27 19h-4"/>',
  property:'<path d="M5 15l11-8 11 8"/><path d="M8 15v12h16V15"/>',
  gold:'<path d="M5 12h22l-3 12H8z"/><path d="M8 17h16"/>'
};

/* ============================================================
   PORTFOLIO MODEL
   ============================================================ */
function allocToState(alloc){
  const st = {};
  CATS.forEach(c => st[c.id] = fromEuros(alloc[c.id] || 0));
  return st;
}
function total(st){ return CATS.reduce((a, c) => a + st[c.id], 0n); }
function applyEvent(st, ev){
  const out = {};
  CATS.forEach(c => out[c.id] = mulF(st[c.id], ev.f[c.id]));
  return out;
}
function moveToCash(st, fromId, amountEuros){
  const out = Object.assign({}, st);
  const x = fromEuros(amountEuros);
  out[fromId] = out[fromId] - x;
  out.cash = out.cash + x;
  return out;
}
function allToCash(st){
  const out = {}; CATS.forEach(c => out[c.id] = 0n);
  out.cash = total(st);
  return out;
}
function purchasingPower(v){ return v * INFL_DEN / INFL_NUM; }

/* Build one complete journey record. The ONLY source for a report. */
function buildRecord(pathId, alloc){
  const start = allocToState(alloc || DEFAULT_ALLOC);
  const rec = { pathId:pathId, startTotal: total(start), contributions: 0n, points: [], decisions: [] };
  let st = start;
  rec.points.push({ label:"Start", value: total(st) });

  st = applyEvent(st, EVENTS[0]);
  rec.points.push({ label:"After period 1", value: total(st) });
  rec.decisions.push({ point:"After period 1", situation:"Down 3.52 per cent",
                       decision:"Held unchanged", effect:"No change to holdings", type:"hold" });

  st = applyEvent(st, EVENTS[1]);
  rec.points.push({ label:"After period 2", value: total(st) });
  rec.lowest = total(st);
  if (pathId === "cash"){
    st = allToCash(st);
    rec.decisions.push({ point:"After period 2", situation:"Down 9.96 per cent from the starting amount",
                         decision:"Moved everything into cash", effect:"Cash rose to 100 per cent of the portfolio", type:"tocash" });
  } else {
    rec.decisions.push({ point:"After period 2", situation:"Down 9.96 per cent from the starting amount",
                         decision:"Held unchanged", effect:"No change to holdings", type:"hold" });
  }

  st = applyEvent(st, EVENTS[2]);
  rec.points.push({ label:"After period 3", value: total(st) });
  rec.final = st;
  rec.finalTotal = total(st);
  rec.change = rec.finalTotal - (rec.startTotal + rec.contributions);
  rec.power = purchasingPower(rec.finalTotal);
  return rec;
}

/* ============================================================
   APP STATE + STORAGE
   ============================================================ */
const MS_KEY = "cow.wealthInAction.journey1.v1";
let storageOK = true;
let saveConfirmed = false;      /* only ever true after a save has actually succeeded */
function defaultApp(){
  return {
    schema: 1,
    screen: "dashboard",
    furthest: 0,            /* highest step genuinely reached; only ever increases. Drives the Review journey menu. */
    currency: "GBP",
    disclaimerAccepted: false,
    goal: null,
    horizon: null,
    prediction: null,
    alloc: { cash:0, bonds:0, global:0, tech:0, property:0, gold:0 },
    allocConfirmed: false,
    reasons: [],
    reasonNote: "",
    panels: [],
    stage: 1,                     /* which market period the visitor is on, 1 to 3 */
    holdings: null,               /* live holdings, in cents, carried across periods */
    contributions: "0",
    points: [],                   /* portfolio value at the start and after each period */
    decisions: [],                /* one entry per confirmed decision */
    holdReflection: null,
    decision: null,
    completed: false,
    divers: false,
    moveOpened: false,
    rebalOpened: false,
    opened: [],
    lessonParts: [],
    chartAlt: {},
    currentCo: null
  };
}
let app = defaultApp();
/* Progress is saved to the signed-in member's account via Memberstack's
   member JSON store, not to this browser/device. memberJsonCache holds the
   member's FULL json blob (which may hold data for other tools too), so a
   save merges MS_KEY into it rather than overwriting the whole thing.
   Writes are debounced so we are not hitting the API on every keystroke;
   the interface never claims a save happened until it actually has. */
let memberJsonCache = {};
let saveTimer = null;
function scheduleSave(){
  saveConfirmed = false;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(flushSave, 800);
}
function flushSave(){
  clearTimeout(saveTimer);
  if (!wiaMember || !window.$memberstackDom){ storageOK = false; saveConfirmed = false; return Promise.resolve(false); }
  const payload = Object.assign({}, memberJsonCache, { [MS_KEY]: app });
  return window.$memberstackDom.updateMemberJSON({ json: payload }).then(function(){
    memberJsonCache = payload;
    storageOK = true; saveConfirmed = true;
    return true;
  }).catch(function(e){
    storageOK = false; saveConfirmed = false; showStorageNotice(); paintExitControl();
    return false;
  });
}
/* Fire-and-forget from the ~200 call sites throughout this file; the actual
   network write is debounced via flushSave above. */
function save(){ scheduleSave(); return true; }
function load(){
  if (!wiaMember || !window.$memberstackDom){ storageOK = false; return Promise.resolve(); }
  return window.$memberstackDom.getMemberJSON().then(function(res){
    const full = (res && typeof res.data !== "undefined") ? res.data : res;
    memberJsonCache = full && typeof full === "object" ? full : {};
    const p = memberJsonCache[MS_KEY];
    if (p && p.schema === 1) app = Object.assign(app, p);
  }).catch(function(e){
    storageOK = false; showStorageNotice(); paintExitControl();
  });
}
function clearStore(){
  const fresh = defaultApp();
  app = fresh;
  const payload = Object.assign({}, memberJsonCache);
  delete payload[MS_KEY];
  memberJsonCache = payload;
  if (wiaMember && window.$memberstackDom){
    window.$memberstackDom.updateMemberJSON({ json: payload }).catch(function(){});
  }
  go("dashboard");
}
function showStorageNotice(){
  if (shadowRoot.getElementById("storeBanner")) return;
  const b = document.createElement("div");
  b.id = "storeBanner"; b.className = "callout"; b.style.margin = "0 20px 16px";
  b.innerHTML = '<p class="kicker">Worth knowing</p><p class="sm" style="margin:0">We could not reach your account to save progress just now, so this journey needs to be completed in one sitting. If you leave, you will start again. Everything else works normally.</p>';
  shadowRoot.getElementById("main").prepend(b);
}
/* The exit control tells the truth about what leaving will do. */
function paintExitControl(){
  const b = shadowRoot.getElementById("exitBtn");
  if (!b) return;
  if (storageOK){
    b.textContent = "Save to my account and exit";
    b.setAttribute("title", "Your progress is saved to your account.");
  } else {
    b.textContent = "Exit journey";
    b.setAttribute("title", "Your progress cannot be saved right now. Leaving will mean starting again.");
  }
}

/* ============================================================
   NAVIGATION
   ============================================================ */
const CHAPTERS = {
  dashboard: ["Wealth in Action", 0],
  welcome:   ["Chapter 1, Prepare. Step 1 of 6", 4],
  disclaimer:["Chapter 1, Prepare. Step 2 of 6", 8],
  goal:      ["Chapter 1, Prepare. Step 3 of 6", 12],
  horizon:   ["Chapter 1, Prepare. Step 4 of 6", 16],
  react:     ["Chapter 1, Prepare. Step 5 of 6", 20],
  capital:   ["Chapter 1, Prepare. Step 6 of 6", 24],
  t1:        ["Chapter 1 complete", 26],
  assets:    ["Chapter 2, Build your portfolio. Step 1 of 4", 30],
  library:   ["Chapter 2, Meet the companies", 31],
  lesson:    ["Chapter 2, Research before you choose", 32],
  profile:   ["Chapter 2, Company profile", 33],
  allocate:  ["Chapter 2, Build your portfolio. Step 2 of 4", 35],
  review:    ["Chapter 2, Build your portfolio. Step 3 of 4", 40],
  reasons:   ["Chapter 2, Build your portfolio. Step 4 of 4", 44],
  t2:        ["Chapter 2 complete", 46],
  event:     ["Chapter 3, Experience the market", 60],
  t3:        ["Chapter 3 complete", 90],
  complete:  ["Journey 1 complete", 94],
  report:    ["Journey 1 complete", 100],
  next:      ["Journey 1 complete", 100]
};
/* Progress inside chapter 3 reflects which of the three periods she has reached. */
const EVENT_PROGRESS = { 1:52, 2:66, 3:80 };

/* ============================================================
   REVIEW JOURNEY MENU
   Lets a member jump back to any step they have genuinely reached
   in this journey. app.furthest only ever increases and is saved
   like everything else, so unlocking survives leaving and returning.
   Steps not yet reached stay locked; this never lets anyone skip
   ahead of where they actually are.
   ============================================================ */
const SEQUENCE = ["dashboard","welcome","disclaimer","goal","horizon","react","capital","t1",
  "assets","library","lesson","profile","allocate","review","reasons","t2","event1","event2","event3","t3","complete","report","next"];
const REVIEW_STEPS = [
  { key:"dashboard", label:"Dashboard" },
  { key:"welcome",   label:"Welcome and currency" },
  { key:"disclaimer",label:"Educational disclaimer" },
  { key:"goal",      label:"Financial goal" },
  { key:"horizon",   label:"Time horizon" },
  { key:"react",     label:"How might you react" },
  { key:"capital",   label:"Your virtual money" },
  { key:"t1",        label:"Chapter 1 transition" },
  { key:"assets",    label:"Asset categories" },
  { key:"library",   label:"Meet the companies" },
  { key:"lesson",    label:"Research before you choose" },
  { key:"profile",   label:"Company profile" },
  { key:"allocate",  label:"Allocation" },
  { key:"review",    label:"Review portfolio" },
  { key:"reasons",   label:"Why did you choose this" },
  { key:"t2",        label:"Chapter 2 transition" },
  { key:"event1",    label:"Period 1" },
  { key:"event2",    label:"Period 2" },
  { key:"event3",    label:"Period 3" },
  { key:"t3",        label:"Chapter 3 transition" },
  { key:"complete",  label:"Journey complete" },
  { key:"report",    label:"Learning report" },
  { key:"next",      label:"What to explore next" }
];
function sequenceKey(name){ return name === "event" ? "event" + app.stage : name; }
function sequenceIndex(name){ const i = SEQUENCE.indexOf(sequenceKey(name)); return i < 0 ? 0 : i; }
function markReached(name){
  const idx = sequenceIndex(name);
  if (idx > (app.furthest || 0)) app.furthest = idx;
}
function reviewStepReached(key){ return SEQUENCE.indexOf(key) <= (app.furthest || 0); }
function goToReviewStep(key){
  closeReviewMenu();
  if (key === "event1" || key === "event2" || key === "event3"){
    app.stage = Number(key.slice(-1)); save(); go("event");
  } else {
    go(key);
  }
}
function paintReviewMenu(){
  const list = shadowRoot.getElementById("reviewNavList");
  if (!list) return;
  list.innerHTML = REVIEW_STEPS.map(function(s, i){
    const reached = reviewStepReached(s.key);
    const current = sequenceKey(app.screen) === s.key;
    const num = String(i + 1).padStart(2, "0");
    return '<button class="rn-row" data-review="' + s.key + '"'
      + (reached ? '' : ' aria-disabled="true" disabled')
      + (current ? ' aria-current="step"' : '') + '>'
      + num + ' ' + s.label + '</button>';
  }).join("");
  list.querySelectorAll("[data-review]").forEach(function(b){
    if (b.disabled) return;
    b.addEventListener("click", function(){ goToReviewStep(b.dataset.review); });
  });
}
function isReviewNavOpen(){
  const p = shadowRoot.getElementById("reviewNavPanel");
  return !!p && p.classList.contains("on");
}
function openReviewMenu(){
  paintReviewMenu();
  shadowRoot.getElementById("reviewNavPanel").classList.add("on");
  shadowRoot.getElementById("reviewNavToggle").setAttribute("aria-expanded", "true");
}
function closeReviewMenu(){
  const p = shadowRoot.getElementById("reviewNavPanel");
  if (!p) return;
  p.classList.remove("on");
  const t = shadowRoot.getElementById("reviewNavToggle");
  if (t) t.setAttribute("aria-expanded", "false");
}
function toggleReviewMenu(){ isReviewNavOpen() ? closeReviewMenu() : openReviewMenu(); }

function go(name){
  app.screen = name; markReached(name); save();
  shadowRoot.querySelectorAll("section.screen").forEach(s => s.classList.remove("on"));
  shadowRoot.getElementById("s-" + name).classList.add("on");
  const c = CHAPTERS[name];
  let label = c[0], pctDone = c[1];
  if (name === "event"){
    label = "Chapter 3, Experience the market. Period " + app.stage + " of 3";
    pctDone = EVENT_PROGRESS[app.stage] || c[1];
  }
  shadowRoot.getElementById("chapterLabel").textContent = label;
  const pf = shadowRoot.getElementById("progFill");
  if (reduced()) pf.style.width = pctDone + "%";
  else setTimeout(() => { pf.style.width = pctDone + "%"; }, 40);
  shadowRoot.getElementById("progLabel").textContent = name === "dashboard" ? "" : pctDone + " per cent complete";
  shadowRoot.getElementById("exitBtn").style.visibility = name === "dashboard" ? "hidden" : "visible";
  const rn = shadowRoot.getElementById("reviewNav");
  if (rn){
    const rnHidden = name === "dashboard" || (app.furthest || 0) === 0;
    rn.style.display = rnHidden ? "none" : "block";
    if (rnHidden) closeReviewMenu();
  }
  if (name === "dashboard") renderDashboard();
  if (name === "welcome") renderCurrency();
  if (name === "disclaimer") renderDisclaimer();
  if (name === "goal") renderChoice("goal");
  if (name === "horizon") renderChoice("horizon");
  if (name === "react") renderChoice("react");
  if (name === "capital") renderCapital();
  if (name === "library") renderLibrary();
  if (name === "lesson") renderLesson();
  if (name === "review") renderReview();
  if (name === "reasons") renderReasons();
  if (name === "complete") renderComplete();
  if (name === "next") renderNext();
  if (name === "event") renderEvent();
  if (name === "t3" || name === "report") markComplete();
  if (name === "report") renderReport();
  const sec = shadowRoot.getElementById("s-" + name);
  addArrows(sec);
  animateIn(sec);
  animateArt(sec);
  if (name === "dashboard"){ animateChildren(shadowRoot.getElementById("journeyCards"), ".jcard", 0.09);
                             animateChildren(shadowRoot.getElementById("badgeRow"), ".sealrow", 0.05); }
  if (name === "assets") animateChildren(shadowRoot.getElementById("assetCards"), ".acard", 0.07);
  if (name === "allocate"){ animateChildren(shadowRoot.getElementById("allocRows"), ".brow", 0.06); replayDonut(); }
  if (name === "report") animateReport();
  window.scrollTo(0, 0);
  const h = shadowRoot.querySelector("#s-" + name + " h1");
  if (h){ h.setAttribute("tabindex", "-1"); h.focus({ preventScroll:true }); }
  renderRibbon(false);
}

function markComplete(){
  if (!app.completed){
    app.completed = true; app.dash = "done";
    app.furthest = Math.max(app.furthest || 0, SEQUENCE.length - 1);
    save();
  }
}
function earnedBadges(){
  const e = [];
  if (allocTotal() === TARGET || app.completed) e.push("first");
  if (app.panels.length === CATS.length) e.push("asset");
  if (app.divers) e.push("divers");
  if (app.moveOpened) e.push("move");
  if (app.rebalOpened) e.push("rebal");
  if (app.completed) e.push("done");
  return e;
}

/* Press feedback. Driven by JS rather than :active, because iOS Safari
   suppresses :active on most elements unless a touch listener exists. */
var MOTION_OK = true;
function pressStart(el, x, y){
  if (!el) return;
  el.classList.add("pressed");
  if (reduced() && !isReviewTool(el)) return;
  if (el.getAttribute("aria-disabled") === "true") return;
  var r = el.getBoundingClientRect();
  var size = Math.max(r.width, r.height);
  var dot = document.createElement("span");
  dot.className = "ripple";
  dot.style.width = dot.style.height = size + "px";
  dot.style.left = ((x == null ? r.width / 2 : x - r.left) - size / 2) + "px";
  dot.style.top = ((y == null ? r.height / 2 : y - r.top) - size / 2) + "px";
  el.appendChild(dot);
  setTimeout(function(){ if (dot.parentNode) dot.parentNode.removeChild(dot); }, 650);
}
function pressEnd(){
  var all = shadowRoot.querySelectorAll(".pressed");
  for (var i = 0; i < all.length; i++) all[i].classList.remove("pressed");
}
function hit(e){
  var t = e.target;
  while (t && t !== document.body){
    if (t.classList && (t.classList.contains("btn") || t.classList.contains("step") || t.classList.contains("opt"))) return t;
    if (t.tagName === "BUTTON" && t.parentNode && t.parentNode.id === "devpanel") return t;
    t = t.parentNode;
  }
  return null;
}
/* Press feedback is applied to the product's own controls. */
function isReviewTool(el){
  return !!(el && el.parentNode && el.parentNode.id === "devpanel");
}
if (window.PointerEvent){
  shadowRoot.addEventListener("pointerdown", function(e){ pressStart(hit(e), e.clientX, e.clientY); }, { passive:true });
  shadowRoot.addEventListener("pointerup", pressEnd, { passive:true });
  shadowRoot.addEventListener("pointercancel", pressEnd, { passive:true });
} else {
  shadowRoot.addEventListener("touchstart", function(e){
    var t = e.touches && e.touches[0];
    pressStart(hit(e), t ? t.clientX : null, t ? t.clientY : null);
  }, { passive:true });
  shadowRoot.addEventListener("touchend", pressEnd, { passive:true });
  shadowRoot.addEventListener("mousedown", function(e){ pressStart(hit(e), e.clientX, e.clientY); }, { passive:true });
  shadowRoot.addEventListener("mouseup", pressEnd, { passive:true });
}
/* keyboard users get the same press state */
shadowRoot.addEventListener("keydown", function(e){
  if (e.key !== "Enter" && e.key !== " ") return;
  var el = hit({ target: wiaActiveEl() });
  if (el) pressStart(el, null, null);
}, { passive:true });
shadowRoot.addEventListener("keyup", pressEnd, { passive:true });

/* forward-moving primary actions carry an arrow that slides on hover, focus and press */
const NO_ARROW = ["reset", "start again", "change my", "keep my", "close", "try another"];
function addArrows(root){
  (root || shadowRoot).querySelectorAll(".btn-primary, .btn-secondary").forEach(b => {
    if (b.querySelector(".arw")) return;
    const t = (b.textContent || "").toLowerCase();
    if (NO_ARROW.some(w => t.indexOf(w) >= 0)) return;
    const a = document.createElement("span");
    a.className = "arw"; a.setAttribute("aria-hidden", "true");
    a.textContent = "\u2192";
    b.appendChild(a);
  });
}

/* a one-off wake when a disabled action becomes available. Never a repeating pulse. */
function wake(id){
  const b = shadowRoot.getElementById(id);
  if (!b || reduced()) return;
  b.classList.remove("wake"); void b.offsetWidth; b.classList.add("wake");
  setTimeout(() => b.classList.remove("wake"), 700);
}

var FORCE_MOTION = false;
function systemReduced(){
  return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
}
function reduced(){
  if (FORCE_MOTION) return false;
  return systemReduced();
}
function animateIn(root){
  if (!root) return;
  const holder = root.querySelector(".wia-wrap, .wia-wrap-wide");
  if (!holder) return;
  const kids = Array.prototype.slice.call(holder.children);
  const targets = kids.length === 1 && kids[0].classList.contains("trans")
    ? Array.prototype.slice.call(kids[0].children) : kids;
  targets.forEach((el, i) => {
    el.style.animation = "none";
    if (reduced()){ el.style.opacity = ""; el.style.transform = ""; return; }
    void el.offsetWidth;
    el.style.animation = "riseIn .5s cubic-bezier(.22,.8,.3,1) " + (0.04 + i * 0.06).toFixed(2) + "s both";
  });
}
function animateChildren(el, sel, step){
  if (!el || reduced()) return;
  el.querySelectorAll(sel).forEach((c, i) => {
    c.style.animation = "none"; void c.offsetWidth;
    c.style.animation = "riseIn .45s cubic-bezier(.22,.8,.3,1) " + (i * (step || 0.06)).toFixed(2) + "s both";
  });
}
function animateArt(root){
  if (!root) return;
  const paths = root.querySelectorAll("svg .dr");
  paths.forEach((el, i) => {
    let len = 0;
    try { len = el.getTotalLength ? el.getTotalLength() : 0; } catch (e) { len = 0; }
    if (!len) return;
    el.style.strokeDasharray = len;
    if (reduced()){ el.style.strokeDashoffset = 0; return; }
    el.style.strokeDashoffset = len;
    el.style.setProperty("--len", len);
    el.style.animation = "drawLine .9s ease-out " + (0.1 + i * 0.22) + "s forwards";
  });
}

/* ============================================================
   MODAL
   ============================================================ */
let modalReturn = null, modalConfirm = null;
function openModal(title, html, yes, no){
  shadowRoot.getElementById("modalNo").classList.remove("hidden");
  shadowRoot.getElementById("modalFoot").textContent = "Nothing will be applied until you confirm.";
  shadowRoot.getElementById("modalH").textContent = title;
  shadowRoot.getElementById("modalBody").innerHTML = html;
  shadowRoot.getElementById("modalYes").textContent = yes || "Confirm decision";
  shadowRoot.getElementById("modalNo").textContent = no || "Change my mind";
  modalReturn = wiaActiveEl();
  const m = shadowRoot.getElementById("mask");
  m.classList.add("on");
  document.body.style.overflow = "hidden";
  shadowRoot.getElementById("modalYes").focus();
}
function closeModal(){
  shadowRoot.getElementById("mask").classList.remove("on");
  document.body.style.overflow = "";
  if (modalReturn && modalReturn.focus) modalReturn.focus();
  modalConfirm = null;
}
shadowRoot.getElementById("modalNo").addEventListener("click", closeModal);
shadowRoot.getElementById("modalYes").addEventListener("click", () => { const f = modalConfirm; closeModal(); if (f) f(); });
shadowRoot.addEventListener("keydown", e => {
  const m = shadowRoot.getElementById("mask");
  if (!m.classList.contains("on")) return;
  if (e.key === "Escape"){ e.preventDefault(); closeModal(); return; }
  if (e.key === "Tab"){
    const f = m.querySelectorAll("button");
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && wiaActiveEl() === first){ e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && wiaActiveEl() === last){ e.preventDefault(); first.focus(); }
  }
});
shadowRoot.getElementById("reviewNavToggle").addEventListener("click", toggleReviewMenu);
shadowRoot.addEventListener("keydown", e => {
  if (e.key !== "Escape") return;
  if (isReviewNavOpen()) closeReviewMenu();
});
shadowRoot.addEventListener("click", e => {
  if (!isReviewNavOpen()) return;
  const nav = shadowRoot.getElementById("reviewNav");
  if (nav && !nav.contains(e.target)) closeReviewMenu();
});

const DISCLAIMER = [
  "Wealth in Action is an educational simulation created by Choice of Wealth. It exists so that you can practise investment decisions without risking money.",
  "All money in this experience is virtual. Nothing is bought, sold, held or transferred. This tool is not connected to any broker, bank, platform or market, and no real investment is made at any point.",
  "The market events are fictional. They were written for teaching, using an invented set of assumptions. They are not forecasts, and no real market will repeat them.",
  "Historical performance describes what happened in the past. Simulated performance shows what happened under an invented or modelled set of assumptions. Neither predicts future results. Results in Wealth in Action do not indicate what any member might earn or lose in a real market.",
  "The movement labels describe how widely each category moves inside this fictional journey. They are not risk ratings for real investments.",
  "Wealth in Action does not provide personalised financial advice and does not recommend any investment. If you are deciding what to do with your own money, consider speaking to a professional who is qualified and regulated to give financial advice and who can take your full circumstances into account."
];
function openDisclaimer(e){
  if (e) e.preventDefault();
  openModal("About Wealth in Action",
    DISCLAIMER.map(p => '<p class="sm">' + p + '</p>').join(""), "Close", "Close");
  modalConfirm = null;
  shadowRoot.getElementById("modalFoot").textContent = "";
  shadowRoot.getElementById("modalNo").classList.add("hidden");
}
["discLink", "discLink2"].forEach(id => shadowRoot.getElementById(id).addEventListener("click", openDisclaimer));
shadowRoot.getElementById("exitBtn").addEventListener("click", () => { save(); go("dashboard"); });

/* ============================================================
   1. DASHBOARD
   ============================================================ */
const BADGES = [
  { id:"first", g:"I",  name:"First Portfolio",            desc:"You built your first practice portfolio.", todo:"Build and confirm a portfolio." },
  { id:"asset", g:"VI", name:"Asset Explorer",             desc:"You explored all six categories.", todo:"Open the detailed explanation for all six categories." },
  { id:"divers",g:"D",  name:"Understanding Diversification", desc:"You saw diversification in action.", todo:"Open the explanation of lower-movement and higher-movement exposure." },
  { id:"move",  g:"M",  name:"Market Movement Explorer",   desc:"You looked into why each category moved differently.", todo:"Open the movement explanation at a market event." },
  { id:"rebal", g:"R",  name:"Rebalancing Basics",         desc:"You explored how rebalancing works.", todo:"Open the rebalancing explanation at a decision point." },
  { id:"done",  g:"\u2713", name:"Journey Completed",          desc:"You completed your first investment-learning journey.", todo:"Reach your learning report." }
];
function sealHTML(b, on, isNew){
  return '<div class="sealrow"><div class="seal ' + (on ? "" : "off") + (isNew ? " new" : "") + '" aria-hidden="true"><span class="g">' + b.g + '</span></div>'
    + '<div><span class="st">' + b.name + '</span>'
    + '<span class="sd">' + (on ? b.desc : b.todo) + '</span></div></div>';
}
const JOURNEYS = [
  { n:"01", t:"Build Your First Portfolio", p:"Learn what the categories are, allocate €10,000, and see what happens across two and a half simulated years.", d:"Approximately 20 to 30 minutes. You can leave and continue later." },
  { n:"02", t:"When Markets Fall",          p:"Spend longer inside a decline, and see how you respond when values keep falling.", d:"Approximately 20 to 30 minutes. You can leave and continue later." },
  { n:"03", t:"The Power of Regular Investing", p:"See what happens when you invest a set amount every month, through rising and falling prices.", d:"Approximately 15 to 25 minutes. You can leave and continue later." }
];
function setDash(v){ app.dash = v; save(); renderDashboard(); }
function renderDashboard(){
  const started = app.allocConfirmed || app.disclaimerAccepted || allocTotal() > 0;
  const cp = shadowRoot.getElementById("continuePanel");
  const pctDone = CHAPTERS[app.screen] ? CHAPTERS[app.screen][1] : 0;
  if (app.completed){
    cp.innerHTML = '<div class="panel"><p class="kicker">Journey complete</p>'
      + '<p class="sm">You completed Journey 1' + (storageOK ? ", and your report is saved to your account." : ".") + '</p>'
      + '<div class="actions"><button class="btn btn-primary" onclick="window.__wia1.go(\'report\')">View my report</button>'
      + '<button class="btn-link" style="font-size:15px" onclick="window.__wia1.restartJourney()">Start this journey again</button></div></div>';
  } else if (started){
    cp.innerHTML = '<div class="panel"><p class="kicker">Continue where you left off</p>'
      + '<h3>Journey 1: Build Your First Portfolio</h3>'
      + '<p class="sm">' + (CHAPTERS[app.screen] ? CHAPTERS[app.screen][0] : "Chapter 1, Prepare") + '.</p>'
      + '<div class="meter" style="margin:12px 0"><span id="dashMeter" style="width:0"></span></div>'
      + '<p class="sm num">' + pctDone + ' per cent complete.</p>'
      + '<div class="actions"><button class="btn btn-primary" onclick="window.__wia1.go(\'' + (app.screen === "dashboard" ? "welcome" : app.screen) + '\')">Continue</button>'
      + '<button class="btn-link" style="font-size:15px" onclick="window.__wia1.restartJourney()">Start this journey again</button></div></div>';
    setTimeout(function(){ const m = shadowRoot.getElementById("dashMeter"); if (m) m.style.width = pctDone + "%"; }, 120);
  } else {
    cp.innerHTML = '<div class="panel"><p class="kicker">A free practice journey</p>'
      + '<p class="sm">Journey 1 takes approximately 20 to 30 minutes, and gives you 10,000 in virtual money to practise with. Nothing is real, nothing is bought, and no sign-up is needed.</p>'
      + '<div class="actions"><button class="btn btn-primary" onclick="window.__wia1.go(\'welcome\')">Start Journey 1</button></div></div>';
  }

  shadowRoot.getElementById("journeyCards").innerHTML =
    '<div class="jcard' + (app.completed ? " done" : (started ? " prog" : "")) + '">'
    + '<span class="jnum">01</span><h3>Build Your First Portfolio</h3>'
    + (app.completed ? '<p class="sm" style="margin:0 0 8px">&#10003; Completed</p>'
        : (started ? '<p class="sm" style="margin:0 0 8px"><strong>In progress</strong></p>' : ''))
    + '<p class="sm">Learn what the categories are, allocate 10,000 in virtual money, and see what happens across two and a half simulated years.</p>'
    + '<p class="cap">Approximately 20 to 30 minutes. You can leave and continue later, on any device.</p>'
    + '<div class="actions"><button class="btn btn-primary" onclick="window.__wia1.go(\'' + (app.completed ? "report" : "welcome") + '\')">'
    + (app.completed ? "View my report" : (started ? "Continue" : "Start journey")) + '</button></div></div>';

  const earned = earnedBadges();
  shadowRoot.getElementById("badgeRow").innerHTML = BADGES.map(function(b){
    return sealHTML(b, earned.indexOf(b.id) >= 0, false);
  }).join("");

  const ins = shadowRoot.getElementById("insightText"), lk = shadowRoot.getElementById("insightLink");
  if (app.completed){
    ins.textContent = "You built a portfolio across six categories and saw it through three simulated market periods.";
    lk.classList.remove("hidden"); lk.onclick = function(){ go("report"); };
  } else if (started){
    ins.textContent = "You are part-way through building your first portfolio.";
    lk.classList.add("hidden");
  } else {
    ins.textContent = "Your learning note will appear here once you have started.";
    lk.classList.add("hidden");
  }
  addArrows(shadowRoot.getElementById("s-dashboard"));
}

/* ============================================================
   3. ASSET CATEGORIES
   ============================================================ */
function renderAssets(){
  shadowRoot.getElementById("assetCards").innerHTML = CATS.map(c =>
    '<div class="acard"><div class="head">'
    + '<span class="orb o-' + c.id + '" aria-hidden="true"><svg viewBox="0 0 32 32">' + ICONS[c.id] + '</svg></span>'
    + '<div style="flex:1"><h3 style="margin-bottom:6px">' + c.name + '</h3>'
    + '<span class="mlabel">' + c.move + '</span></div></div>'
    + '<p class="sm" style="margin:14px 0">' + c.role + '</p>'
    + '<button class="btn-link sm" style="font-size:15px" aria-expanded="false" aria-controls="lm-' + c.id + '" data-learn="' + c.id + '">Learn more</button>'
    + '<div class="panel hidden" id="lm-' + c.id + '" style="margin-top:12px">'
    + c.learn.map(p => '<p class="sm">' + p + '</p>').join("") + '</div></div>').join("");

  shadowRoot.getElementById("assetTable").innerHTML =
    '<table><caption>These labels describe how widely each category moves inside this fictional journey. They are not risk ratings for real investments.</caption>'
    + '<thead><tr><th>Category</th><th>Movement in this simulation</th><th>Produces income</th><th>Moves mainly with</th></tr></thead><tbody>'
    + CATS.map(c => '<tr><td>' + c.name + '</td><td>' + c.move.replace(" movement in this simulation", "") + '</td><td>' + c.income + '</td><td>' + c.with + '</td></tr>').join("")
    + '</tbody></table>';

  shadowRoot.querySelectorAll("[data-learn]").forEach(b => b.addEventListener("click", () => {
    const id = b.dataset.learn, p = shadowRoot.getElementById("lm-" + id);
    const open = p.classList.toggle("hidden") === false;
    b.setAttribute("aria-expanded", open);
    b.textContent = open ? "Close" : "Learn more";
    b.closest(".acard").classList.toggle("opened", open || app.panels.indexOf(id) >= 0);
    if (open && app.panels.indexOf(id) < 0){ app.panels.push(id); save(); }
    checkAssetGate();
  }));
  checkAssetGate();
}
function checkAssetGate(){
  /* The six short descriptions are all present on this screen, so allocation is
     always reachable. Opening the detailed explanations is optional here and is
     the sole criterion for the Asset Explorer badge. Both use app.panels. */
  const b = shadowRoot.getElementById("assetNext");
  b.setAttribute("aria-disabled", "false");
  const n = app.panels.length;
  shadowRoot.getElementById("assetHelper").textContent = n === CATS.length
    ? "You have opened the detailed explanation for all six categories. That earns the Asset Explorer badge."
    : "You have opened " + n + " of six detailed explanations. Opening all six earns the Asset Explorer badge, and you can come back to them at any time.";
}
shadowRoot.getElementById("assetNext").addEventListener("click", function(){ go("library"); });
shadowRoot.getElementById("tableToggle").addEventListener("click", function(){
  const t = shadowRoot.getElementById("assetTable");
  const open = t.classList.toggle("hidden") === false;
  this.setAttribute("aria-expanded", open);
  this.textContent = open ? "Hide the table" : "View as a table";
});

/* ============================================================
   4. ALLOCATION
   ============================================================ */
const TARGET = 10000;
function allocTotal(){ return CATS.reduce((a, c) => a + (app.alloc[c.id] || 0), 0); }
function renderAllocRows(){
  shadowRoot.getElementById("allocRows").innerHTML = CATS.map(c =>
    '<div class="brow" id="row-' + c.id + '">'
    + '<span class="orb o-' + c.id + '" aria-hidden="true"><svg viewBox="0 0 32 32">' + ICONS[c.id] + '</svg></span>'
    + '<div style="flex:1;min-width:0">'
    + '<span class="nm" id="lbl-' + c.id + '">' + c.name + '</span>'
    + '<span class="cap">' + c.move + '</span>'
    + '<div class="ctl">'
    + '<button class="step" data-minus="' + c.id + '" aria-label="Decrease ' + c.name + ' by 100 euros">&minus;</button>'
    + '<input class="amt num" type="text" inputmode="numeric" id="amt-' + c.id + '" value="0" '
    + 'aria-labelledby="lbl-' + c.id + '" aria-describedby="pct-' + c.id + ' err-' + c.id + '">'
    + '<button class="step" data-plus="' + c.id + '" aria-label="Increase ' + c.name + ' by 100 euros">+</button>'
    + '</div>'
    + '<p class="errline" id="err-' + c.id + '" role="alert"></p></div>'
    + '<div><div class="val num" id="val-' + c.id + '">€0</div><div class="pc" id="pct-' + c.id + '">0.0%</div></div>'
    + '</div>').join("");

  CATS.forEach(c => {
    shadowRoot.querySelector('[data-minus="' + c.id + '"]').addEventListener("click", () => bump(c.id, -100));
    shadowRoot.querySelector('[data-plus="' + c.id + '"]').addEventListener("click", () => bump(c.id, 100));
    const inp = shadowRoot.getElementById("amt-" + c.id);
    inp.addEventListener("blur", () => commitField(c.id));
    inp.addEventListener("keydown", e => {
      if (e.key === "Enter"){ e.preventDefault(); commitField(c.id); }
      if (e.key === "ArrowUp"){ e.preventDefault(); bump(c.id, 100); }
      if (e.key === "ArrowDown"){ e.preventDefault(); bump(c.id, -100); }
    });
  });
}
function setErr(id, msg){
  const e = shadowRoot.getElementById("err-" + id);
  e.textContent = msg || ""; e.className = msg ? "errline on" : "errline";
}
function flashRow(id){
  if (reduced()) return;
  const el = shadowRoot.getElementById("amt-" + id);
  if (!el) return;
  const row = el.closest(".brow");
  row.classList.remove("pulse"); void row.offsetWidth; row.classList.add("pulse");
}
function bump(id, delta){
  const room = TARGET - allocTotal() + (app.alloc[id] || 0);
  let v = (app.alloc[id] || 0) + delta;
  if (v < 0){ v = 0; setErr(id, "Amounts cannot be negative."); } else setErr(id, "");
  if (v > room){ v = room; setErr(id, "You have " + fmt(fromEuros(TARGET - allocTotal())) + " left to allocate. The amount has been set to the highest available."); }
  app.alloc[id] = v; flashRow(id); renderAlloc(); save();
}
function commitField(id){
  const inp = shadowRoot.getElementById("amt-" + id);
  const raw = inp.value.replace(/[^0-9.\-]/g, "");
  if (raw === ""){ app.alloc[id] = 0; setErr(id, ""); renderAlloc(); save(); return; }
  const n = Number(raw);
  if (!isFinite(n)){ setErr(id, "Enter a whole number, without decimals."); renderAlloc(); return; }
  if (n < 0){ app.alloc[id] = 0; setErr(id, "Amounts cannot be negative."); renderAlloc(); save(); return; }
  if (raw.indexOf(".") >= 0) setErr(id, "Enter a whole number, without decimals."); else setErr(id, "");
  let v = Math.round(n);
  const room = TARGET - allocTotal() + (app.alloc[id] || 0);
  if (v > room){ v = room; setErr(id, "You have " + fmt(fromEuros(TARGET - allocTotal() + (app.alloc[id] || 0) - v)) + " left to allocate. The amount has been set to the highest available."); }
  app.alloc[id] = v; renderAlloc(); save();
}
let liveTimer = 0, wasFull = false;
function renderAlloc(){
  const t = allocTotal(), rem = TARGET - t;
  CATS.forEach(c => {
    const inp = shadowRoot.getElementById("amt-" + c.id);
    if (inp && wiaActiveEl() !== inp) inp.value = (app.alloc[c.id] || 0).toLocaleString("en-GB");
  });
  const vals = CATS.map(c => fromEuros(app.alloc[c.id] || 0));
  const tot = fromEuros(t);
  const pcts = weightsPct(vals, tot);
  CATS.forEach((c, i) => {
    const el = shadowRoot.getElementById("pct-" + c.id); if (el) el.textContent = pctStr(pcts[i]);
    const v = shadowRoot.getElementById("val-" + c.id);
    if (v) v.textContent = "\u20AC" + (app.alloc[c.id] || 0).toLocaleString("en-GB");
  });

  const target = fromEuros(rem);
  countTo("remaining", lastRemaining, target, 380);
  lastRemaining = target;
  shadowRoot.getElementById("allocMeter").style.width = (t / TARGET * 100) + "%";
  const sub = shadowRoot.getElementById("allocSub");
  if (sub) sub.textContent = t === TARGET
    ? "All €10,000.00 allocated across " + CATS.filter(c => (app.alloc[c.id] || 0) > 0).length + " categories."
    : fmt(fromEuros(t)) + " of €10,000.00 allocated. Cash counts as a choice.";
  shadowRoot.getElementById("donutTotal").textContent = fmt(tot);
  drawDonut(vals, pcts, t);

  CATS.forEach(c => {
    const row = shadowRoot.getElementById("amt-" + c.id);
    if (row && row.closest) row.closest(".brow").classList.toggle("funded", (app.alloc[c.id] || 0) > 0);
  });
  const full = t === TARGET;
  const b = shadowRoot.getElementById("allocNext");
  b.setAttribute("aria-disabled", full ? "false" : "true");
  const help = shadowRoot.getElementById("allocHelper");
  if (full){
    help.innerHTML = '<span class="done-tick"><span class="ring" aria-hidden="true">&#10003;</span>You have allocated every virtual euro.</span>';
    if (!wasFull){
      const rb = shadowRoot.getElementById("remaining");
      rb.classList.remove("pulse"); void rb.offsetWidth; rb.classList.add("pulse");
      wake("allocNext"); addArrows(shadowRoot.getElementById("s-allocate"));
    }
  } else {
    help.textContent = t === 0 ? "Start anywhere. Add an amount to any category, and the chart will follow."
      : "You still have " + fmt(fromEuros(rem)) + " to allocate. Add it to any category, including Cash.";
  }
  wasFull = full;

  const lower = (app.alloc.cash || 0) + (app.alloc.bonds || 0);
  const mix = shadowRoot.getElementById("mixLine");
  if (t === 0){
    mix.textContent = "Nothing allocated yet. Add amounts to any category. Cash counts as a choice.";
  } else {
    const lp = Math.round(lower / t * 100);
    mix.textContent = "Your portfolio is currently " + lp + " per cent in lower-movement categories and " + (100 - lp)
      + " per cent in higher-movement categories, as those groups are defined in this simulation. This grouping exists only for this educational simulation and is not a universal description of these categories.";
  }
  const conc = shadowRoot.getElementById("concentration");
  let big = null;
  CATS.forEach((c, i) => { if (t > 0 && (app.alloc[c.id] || 0) / t > 0.5) big = { c:c, p:pcts[i] }; });
  conc.innerHTML = big
    ? '<p class="sm" style="margin-top:12px">' + big.c.name + ' now makes up ' + pctStr(big.p)
      + ' of your portfolio. Holding a large share in one category means your result will depend heavily on that category. This is neither a mistake nor a suggestion to change it.</p>'
    : "";

  const summary = "Portfolio composition: " + CATS.map((c, i) => c.name + " " + pctStr(pcts[i])).join(", ") + ".";
  shadowRoot.getElementById("donutSummary").textContent = summary;
  clearTimeout(liveTimer);
  liveTimer = setTimeout(() => {
    shadowRoot.getElementById("remainStatus").textContent = full
      ? "Fully allocated. Zero remaining."
      : fmt(fromEuros(rem)) + " remaining to allocate.";
  }, 600);
}
let donutReady = false;
function buildDonut(){
  const svg = shadowRoot.getElementById("donut");
  const C = 2 * Math.PI * 92;
  svg.innerHTML = '<circle cx="120" cy="120" r="92" fill="none" stroke="#E8E4E1" stroke-width="28"/>'
    + CATS.map(c => '<circle id="seg-' + c.id + '" cx="120" cy="120" r="92" fill="none" stroke="' + c.colour
      + '" stroke-width="28" stroke-linecap="round" stroke-dasharray="0 ' + C + '" stroke-dashoffset="0"'
      + ' transform="rotate(-90 120 120)" style="transition:stroke-dasharray .55s cubic-bezier(.22,.8,.3,1),stroke-dashoffset .55s cubic-bezier(.22,.8,.3,1)"/>').join("");
  donutReady = true;
}
function drawDonut(vals, pcts, t){
  const svg = shadowRoot.getElementById("donut");
  if (!svg) return;
  if (!donutReady) buildDonut();
  const C = 2 * Math.PI * 92;
  let off = 0;
  const gap = 6;
  CATS.forEach(c => {
    const seg = shadowRoot.getElementById("seg-" + c.id);
    if (!seg) return;
    const share = (app.alloc[c.id] || 0) / TARGET;
    const len = share > 0 ? Math.max(C * share - gap, 1) : 0;
    seg.style.transition = reduced() ? "none" : "stroke-dasharray .55s cubic-bezier(.22,.8,.3,1),stroke-dashoffset .55s cubic-bezier(.22,.8,.3,1)";
    seg.setAttribute("stroke-dasharray", len + " " + (C - len));
    seg.setAttribute("stroke-dashoffset", (-C * off));
    off += share;
  });
  countTo("donutTotal", lastDonut, fromEuros(t), 450);
  lastDonut = fromEuros(t);
  const midLabel = svg.parentNode.querySelector(".cap");
  if (midLabel) midLabel.textContent = t === TARGET ? "Total allocated" : t === 0 ? "Not yet allocated" : "Allocated so far";
}
let lastDonut = 0n, lastRemaining = null;
function replayDonut(){
  if (reduced()) return;
  const C = 2 * Math.PI * 92;
  CATS.forEach(c => {
    const seg = shadowRoot.getElementById("seg-" + c.id);
    if (!seg) return;
    seg.style.transition = "none";
    seg.setAttribute("stroke-dasharray", "0 " + C);
  });
  const held = lastDonut; lastDonut = 0n;
  setTimeout(() => { renderAlloc(); lastDonut = held; }, 60);
}
shadowRoot.getElementById("diversToggle").addEventListener("click", function(){
  const p = shadowRoot.getElementById("diversPanel");
  const open = p.classList.toggle("hidden") === false;
  this.setAttribute("aria-expanded", open);
  this.textContent = open ? "Close" : "What these groups mean";
  if (open){ app.divers = true; save(); }
});
shadowRoot.getElementById("resetBtn").addEventListener("click", () => {
  openModal("Reset all amounts",
    '<p class="sm">This clears every category and returns your full ' + CUR() + '10,000. Your goal and time period stay as they are.</p>',
    "Reset amounts", "Keep my amounts");
  modalConfirm = () => { CATS.forEach(c => app.alloc[c.id] = 0); CATS.forEach(c => setErr(c.id, "")); renderAlloc(); save(); };
});
shadowRoot.getElementById("allocNext").addEventListener("click", function(){
  if (this.getAttribute("aria-disabled") === "true"){
    const bar = shadowRoot.getElementById("remaining");
    bar.setAttribute("tabindex", "-1"); bar.focus();
    shadowRoot.getElementById("remainStatus").textContent = "You still have " + fmt(fromEuros(TARGET - allocTotal())) + " to allocate. Add it to any category, including Cash.";
    return;
  }
  go("review");
});

/* ============================================================
   5. MARKET EVENT AND DECISION
   ============================================================ */
const DECISIONS = [
  { id:"hold",   label:"Hold my portfolio as it is", help:"You keep the same holdings, so if their values rise you take part in that, and you incur no costs for changing anything.", cost:"You also keep the same holdings if their values fall further, and there is nothing that makes a recovery certain.", detail:false },
  { id:"tocash", label:"Move some money into cash", help:"The amount moved is no longer exposed to market movements, and it becomes available for later use.", cost:"The amount moved is also no longer exposed to any rise, and its purchasing power can fall while prices rise.", detail:true },
  { id:"sell",   label:"Sell part of a category", help:"Reduces how much your result depends on that one category.", cost:"If that category's value rises, you take part in less of it.", detail:true },
  { id:"realloc",label:"Move money to a different category", help:"Lets you change the shape of your portfolio without adding or removing money.", cost:"You are moving out of something at today's value and into something else at today's value, without knowing which will do better.", detail:true },
  { id:"rebal",  label:"Rebalance to my original percentages", help:"Keeps the shape of your portfolio consistent with your original intention.", cost:"It reduces your holding in whatever has been rising and adds to whatever has been falling.", detail:false },
  { id:"contrib",label:"Add a virtual contribution", help:"Adds money at today's prices, so more of your portfolio is exposed to any subsequent rise.", cost:"More money is also exposed to any further fall.", detail:true }
];
/* Rebalancing returns to the percentages recorded when she confirmed
   her portfolio, not to a default. */
function currentAlloc(){
  if (app.initialWeights){
    const a = {};
    CATS.forEach(function(c){ a[c.id] = Math.round((app.initialWeights[c.id] || 0) * TARGET); });
    return a;
  }
  return allocTotal() === TARGET ? app.alloc : DEFAULT_ALLOC;
}
/* The event screen is rendered by the data-driven engine further down. */
function advanceBeat(n){
  stageBeat = Number(n);
  paintEvent();
  const beats = shadowRoot.querySelectorAll("#evDark .beat");
  const last = beats[beats.length - 1];
  if (last){
    last.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block:"start" });
    const h = last.querySelector(".kicker");
    if (h){ h.setAttribute("tabindex", "-1"); h.focus({ preventScroll:true }); }
  }
  if (stageBeat >= 4) countTo("evAfterFig", totalOf(evBefore), totalOf(evAfter), 600);
}

function growBars(){
  shadowRoot.querySelectorAll("#evBars .mtrack i").forEach((el, i) => {
    const w = el.dataset.w;
    if (reduced()){ el.style.width = w + "%"; return; }
    el.style.width = "0%";
    setTimeout(() => { el.style.transition = "width .55s ease-out"; el.style.width = w + "%"; }, 60 * i);
  });
}
const counters = {};
function countTo(id, from, to, dur){
  const el = shadowRoot.getElementById(id);
  if (!el) return;
  if (reduced() || from === null || from === undefined || from === to){ el.textContent = fmt(to); return; }
  if (counters[id]) cancelAnimationFrame(counters[id]);
  const a = Number(toCents(from)), b = Number(toCents(to)), t0 = performance.now();
  const d = dur || 600;
  function tick(now){
    const k = Math.min(1, (now - t0) / d);
    const e = 1 - Math.pow(1 - k, 3);
    el.textContent = fmt(BigInt(Math.round(a + (b - a) * e)) * CENT);
    if (k < 1) counters[id] = requestAnimationFrame(tick);
    else { el.textContent = fmt(to); delete counters[id]; }
  }
  counters[id] = requestAnimationFrame(tick);
}

function pickDecision(id){
  app.decision = id;
  if (id === "rebal") app.rebalOpened = true;
  save();
  shadowRoot.querySelectorAll("[data-dec]").forEach(b => b.setAttribute("aria-checked", b.dataset.dec === id));
  const det = shadowRoot.getElementById("decDetail");

  if (id === "hold"){
    det.innerHTML = "";
  } else if (id === "tocash" || id === "sell"){
    const src = defaultSource();
    det.innerHTML = '<div class="panel">'
      + '<label class="sm" for="decSrc" style="display:block;margin-bottom:6px">Which category are you selling from</label>'
      + '<select class="amt" id="decSrc" style="width:100%;text-align:left;margin-bottom:16px">' + catOptions("cash", src) + '</select>'
      + amountField("Amount to move into Cash", "You have " + fmtCents(maxCents(src)) + " in " + CATS[IDX[src]].name + ". Enter an amount between " + CUR() + "0.01 and " + fmtCents(maxCents(src)) + ".", "")
      + '</div>';
  } else if (id === "realloc"){
    const src = defaultSource();
    det.innerHTML = '<div class="panel">'
      + '<label class="sm" for="decSrc" style="display:block;margin-bottom:6px">Move money from</label>'
      + '<select class="amt" id="decSrc" style="width:100%;text-align:left;margin-bottom:16px">' + catOptions(null, src) + '</select>'
      + '<label class="sm" for="decDst" style="display:block;margin-bottom:6px">Move money into</label>'
      + '<select class="amt" id="decDst" style="width:100%;text-align:left;margin-bottom:16px">' + catOptions(src, "cash") + '</select>'
      + amountField("Amount to move", "You have " + fmtCents(maxCents(src)) + " in " + CATS[IDX[src]].name + ". Enter an amount between " + CUR() + "0.01 and " + fmtCents(maxCents(src)) + ".", "")
      + '</div>';
  } else if (id === "rebal"){
    const t = total(evAfter);
    const alloc = currentAlloc();
    const startTot = CATS.reduce((a, c) => a + (alloc[c.id] || 0), 0);
    det.innerHTML = '<div class="panel"><p class="eyebrow">How rebalancing works</p>'
      + '<p class="sm">Rebalancing returns every category to the percentage you chose at the start, applied to your current total of ' + fmt(t)
      + '. It usually means increasing what has fallen and reducing what has risen. Your total value does not change today.</p>'
      + '<div style="overflow-x:auto"><table><thead><tr><th>Category</th><th class="n">Now</th><th class="n">After</th><th class="n">Change</th></tr></thead><tbody>'
      + CATS.map(c => {
          const target = t * BigInt(alloc[c.id] || 0) / BigInt(startTot);
          const d = target - evAfter[c.id];
          return '<tr><td>' + c.name + '</td><td class="n">' + fmt(evAfter[c.id]) + '</td><td class="n">' + fmt(target)
            + '</td><td class="n">' + (d >= 0n ? "+" : "") + fmt(d) + '</td></tr>';
        }).join("")
      + '</tbody></table></div></div>';
  } else if (id === "contrib"){
    det.innerHTML = '<div class="panel">'
      + amountField("Virtual contribution", "Contributions in this journey are capped at " + CUR() + "2,000 at each decision point. Enter an amount between " + CUR() + "0.01 and " + CUR() + "2,000.00. This money is virtual and is not connected to your real finances.", "")
      + '</div>';
  }

  const src = shadowRoot.getElementById("decSrc");
  if (src) src.addEventListener("change", () => pickSourceChanged());
  const amt = shadowRoot.getElementById("decAmt");
  if (amt){ amt.addEventListener("input", validateDecision); amt.addEventListener("blur", validateDecision); }
  validateDecision();
}
/* These three were defined beside the old event renderer and are still needed. */
function maxCents(id){ return evAfter[id] / CENT; }
function fmtCents(c){ return fmt(c * CENT); }
function catOptions(exclude, selected){
  return CATS.filter(function(c){ return c.id !== exclude; })
    .map(function(c){ return '<option value="' + c.id + '"' + (c.id === selected ? " selected" : "") + '>' + c.name + ' (' + fmt(evAfter[c.id]) + ')</option>'; }).join("");
}
function amountField(labelText, helpText, val){
  return '<label class="sm" for="decAmt" style="display:block;margin-bottom:6px">' + labelText + '</label>'
    + '<div style="display:flex;align-items:center;gap:8px"><span class="sm">' + CUR() + '</span>'
    + '<input class="amt num" id="decAmt" type="text" inputmode="decimal" value="' + val + '" style="width:170px" aria-describedby="decAmtHelp decErr"></div>'
    + '<p class="cap" id="decAmtHelp" style="margin:8px 0 0">' + helpText + '</p>';
}
function defaultSource(){
  let best = "global", bv = -1n;
  CATS.forEach(c => { if (c.id !== "cash" && evAfter[c.id] > bv){ bv = evAfter[c.id]; best = c.id; } });
  return best;
}
function pickSourceChanged(){
  const src = shadowRoot.getElementById("decSrc").value;
  const dst = shadowRoot.getElementById("decDst");
  if (dst){
    const keep = dst.value === src ? "cash" : dst.value;
    dst.innerHTML = catOptions(src, keep === src ? "cash" : keep);
  }
  const help = shadowRoot.getElementById("decAmtHelp");
  if (help) help.textContent = "You have " + fmtCents(maxCents(src)) + " in " + CATS[IDX[src]].name
    + ". Enter an amount between " + CUR() + "0.01 and " + fmtCents(maxCents(src)) + ".";
  validateDecision();
}

/* strict amount parsing: whole euros or up to two decimal places, no negatives, no text */
function parseAmount(str){
  const t = String(str).trim().replace(/[\s,\u20AC]/g, "");
  if (t === "") return null;
  if (!/^\d+(\.\d{1,2})?$/.test(t)) return null;
  const parts = t.split(".");
  const cents = BigInt(parts[0]) * 100n + BigInt((parts[1] || "").padEnd(2, "0"));
  return cents;
}
function setDecErr(msg){
  const e = shadowRoot.getElementById("decErr");
  e.textContent = msg || "";
  e.className = msg ? "errline on" : "errline";
}
function validateDecision(){
  const id = app.decision;
  const btn = shadowRoot.getElementById("decReview");
  const enable = ok => {
    const was = btn.getAttribute("aria-disabled");
    btn.setAttribute("aria-disabled", ok ? "false" : "true");
    if (ok && was === "true") wake("decReview");
  };
  if (!id){ enable(false); return false; }
  if (id === "hold" || id === "rebal"){ setDecErr(""); enable(true); return true; }

  const inp = shadowRoot.getElementById("decAmt");
  if (!inp){ enable(false); return false; }
  const cents = parseAmount(inp.value);
  const cap = id === "contrib" ? 200000n : maxCents(shadowRoot.getElementById("decSrc").value);
  const lowStr = "" + CUR() + "0.01", highStr = fmtCents(cap);

  if (inp.value.trim() === ""){ setDecErr(""); enable(false); return false; }
  if (cents === null){ setDecErr("Enter an amount between " + lowStr + " and " + highStr + "."); enable(false); return false; }
  if (cents < 1n){ setDecErr("Enter an amount between " + lowStr + " and " + highStr + "."); enable(false); return false; }
  if (cents > cap){ setDecErr("Enter an amount between " + lowStr + " and " + highStr + "."); enable(false); return false; }
  setDecErr(""); enable(true); return true;
}

function onDecReview(){
  /* `this` was the button; the engine calls this with the button as context. */
  if (this.getAttribute("aria-disabled") === "true"){
    if (!app.decision) setDecErr("Choose an option to continue.");
    const inp = shadowRoot.getElementById("decAmt");
    if (inp) inp.focus();
    return;
  }
  const id = app.decision, ta = total(evAfter);
  const D = DECISIONS.find(x => x.id === id);
  let body = "", run = null;

  if (id === "hold"){
    body = line("Your decision", D.label)
      + line("Portfolio effect", "Nothing is bought or sold. Your total value stays at " + fmt(ta) + " and your allocation stays as it is.");
    run = () => showFeedback("hold", 0n, null, null);
  }
  else if (id === "tocash" || id === "sell"){
    const src = shadowRoot.getElementById("decSrc").value;
    const cents = parseAmount(shadowRoot.getElementById("decAmt").value);
    const after = transfer(evAfter, src, "cash", cents);
    const t = total(after);
    body = line("Your decision", D.label)
      + line("Amount", fmtCents(cents))
      + line("From", CATS[IDX[src]].name + ", leaving " + fmt(after[src]))
      + line("Into", "Cash, bringing it to " + fmt(after.cash))
      + line("Portfolio effect", "Your total value stays at " + fmt(t)
        + ", because moving money between categories does not change what your portfolio is worth today. After this change, Cash is "
        + pctStr(pct1(after.cash, t)) + " of your portfolio and " + CATS[IDX[src]].name + " is " + pctStr(pct1(after[src], t)) + ".");
    run = () => showFeedback(id, cents, src, "cash");
  }
  else if (id === "realloc"){
    const src = shadowRoot.getElementById("decSrc").value, dst = shadowRoot.getElementById("decDst").value;
    const cents = parseAmount(shadowRoot.getElementById("decAmt").value);
    const after = transfer(evAfter, src, dst, cents);
    const t = total(after);
    body = line("Your decision", D.label)
      + line("Amount", fmtCents(cents))
      + line("From", CATS[IDX[src]].name + ", leaving " + fmt(after[src]))
      + line("Into", CATS[IDX[dst]].name + ", bringing it to " + fmt(after[dst]))
      + line("Portfolio effect", "Your total value stays at " + fmt(t) + ". After this change, "
        + CATS[IDX[src]].name + " is " + pctStr(pct1(after[src], t)) + " and " + CATS[IDX[dst]].name + " is " + pctStr(pct1(after[dst], t)) + ".");
    run = () => showFeedback("realloc", cents, src, dst);
  }
  else if (id === "rebal"){
    body = line("Your decision", D.label)
      + line("Portfolio effect", "Every category returns to the percentage you chose at the start, applied to your current total of "
        + fmt(ta) + ". Your total value does not change today.");
    run = () => showFeedback("rebal", 0n, null, null);
  }
  else if (id === "contrib"){
    const cents = parseAmount(shadowRoot.getElementById("decAmt").value);
    body = line("Your decision", D.label)
      + line("Amount", fmtCents(cents) + " in virtual money")
      + line("Portfolio effect", "Your total becomes " + fmt(ta + cents * CENT) + ", of which " + fmtCents(cents)
        + " is virtual money you have added rather than growth. It is allocated across your existing percentages.");
    run = () => showFeedback("contrib", cents, null, null);
  }
  openModal("Review your decision", body, "Confirm decision", "Change my decision");
  addArrows(shadowRoot.getElementById("mask"));
  shadowRoot.getElementById("modalFoot").textContent = "Nothing will be applied until you confirm.";
  modalConfirm = run;
}
function line(k, v){
  return '<div style="padding:10px 0;border-bottom:1px solid var(--grey)"><p class="eyebrow" style="margin:0 0 4px">' + k
    + '</p><p class="sm" style="margin:0">' + v + '</p></div>';
}
function transfer(st, from, to, cents){
  const out = Object.assign({}, st);
  const x = cents * CENT;
  out[from] = out[from] - x;
  out[to] = out[to] + x;
  return out;
}
function rebalanced(st, alloc){
  const t = total(st);
  const startTot = CATS.reduce((a, c) => a + (alloc[c.id] || 0), 0);
  const out = {};
  CATS.forEach(c => out[c.id] = t * BigInt(alloc[c.id] || 0) / BigInt(startTot));
  return out;
}
function fbHold(after){
  return [
    ["Your decision", "You left your portfolio unchanged after the first period."],
    ["Immediate effect", "Nothing was bought or sold. Your total is " + fmt(total(after)) + ", and every category continues to move as the simulation moves."],
    ["Possible benefit", "You keep the same holdings, so if their values rise you take part in that, and you have not paid any cost to make a change."],
    ["Possible trade-off", "You keep the same holdings if values fall further, and nothing makes a recovery certain. If you had needed this money soon, continuing to hold could mean selling at a lower value later."],
    ["The principle", "A fall reduces the current value of an investment, whether or not it is sold. Holding means its value may recover, fall further or remain lower. In real life the appropriate decision can depend on your goals, your circumstances, your time horizon, your need for access, tax, costs and the investment itself."],
    ["Worth remembering", "This is a written scenario. In a real market, nobody knows during a decline whether it is close to ending or only beginning."]
  ];
}
function fbToCash(after, before, cents, src){
  const t = total(after), n = CATS[IDX[src]].name;
  return [
    ["Your decision", "You moved " + fmtCents(cents) + " from " + n + " into Cash."],
    ["Immediate effect", "Cash is now " + pctStr(pct1(after.cash, t)) + " of your portfolio, up from " + pctStr(pct1(before.cash, total(before)))
      + ". Your total value today is unchanged at " + fmt(t) + ", because moving money between categories does not change what a portfolio is worth at that moment."],
    ["Possible benefit", "That part of your portfolio is not exposed to further falls, and it is available if you need it or want to use it elsewhere."],
    ["Possible trade-off", "That part is also not exposed to any rise, and cash held while prices are rising buys less over time."],
    ["The principle", "Selling converts the current market value into cash and removes that portion from future market movements. It is neither correct nor incorrect in itself. In real life it can depend on your goals, your circumstances, your time horizon, your need for access, tax, costs and the investment itself."],
    ["Worth remembering", "These figures are simulated. In a real market you would be making this decision without knowing what the next screen says."]
  ];
}
function fbRealloc(after, cents, src, dst){
  const t = total(after), sn = CATS[IDX[src]].name, dn = CATS[IDX[dst]].name;
  return [
    ["Your decision", "You moved " + fmtCents(cents) + " from " + sn + " into " + dn + "."],
    ["Immediate effect", "Your total value today is unchanged at " + fmt(t) + ". " + sn + " is now " + pctStr(pct1(after[src], t))
      + " of your portfolio and " + dn + " is " + pctStr(pct1(after[dst], t)) + "."],
    ["Possible benefit", "You have changed the shape of your portfolio without adding or removing money, so it now reflects what you want to hold."],
    ["Possible trade-off", "You moved out of one category at today's value and into another at today's value, without knowing which will do better from here."],
    ["The principle", "Moving between categories changes what your result depends on. It does not reduce or increase the total today, and it commits you to a different set of outcomes."],
    ["Worth remembering", "In a real market this can involve costs and tax consequences that this simulation does not model."]
  ];
}
function fbRebal(after, before){
  const rows = CATS.filter(c => after[c.id] !== before[c.id])
    .map(c => CATS[IDX[c.id]].name + " to " + fmt(after[c.id])).join(", ");
  return [
    ["Your decision", "You rebalanced back to the percentages you chose at the start."],
    ["Immediate effect", "Your total value is unchanged at " + fmt(total(after)) + ". Within it: " + rows + "."],
    ["Possible benefit", "Your portfolio again reflects the intention you set out with, rather than a shape created by markets moving without you."],
    ["Possible trade-off", "Rebalancing reduces what has been rising and adds to what has been falling. If the recent pattern continues, that works against you."],
    ["The principle", "Portfolios drift. Categories that rise become a larger share and those that fall become a smaller one, so over time you hold something you did not choose. Rebalancing is the correction, and it usually feels counter-intuitive."],
    ["Worth remembering", "Real rebalancing can involve costs and tax consequences that this simulation does not model."]
  ];
}
function fbContrib(after, cents){
  return [
    ["Your decision", "You added a virtual contribution of " + fmtCents(cents) + "."],
    ["Immediate effect", "Your total is now " + fmt(total(after)) + ", of which " + fmtCents(cents) + " is virtual money you added rather than growth. Your report keeps those two figures separate."],
    ["Possible benefit", "You added money at lower prices than at the start, so each euro buys more units than it would have."],
    ["Possible trade-off", "More money is also exposed to any further fall. In real life this would only be reasonable with money you did not need for something else."],
    ["The principle", "Buying when prices have fallen means more units for the same money. It also means committing more at the point when the outcome is least clear."],
    ["Worth remembering", "Adding money during a decline has sometimes worked well and sometimes not. This scenario shows one written outcome, not a rule."]
  ];
}
function showFeedback(kind, cents, src, dst){
  let after = evAfter, parts;
  if (kind === "tocash" || kind === "sell"){
    after = transfer(evAfter, src, "cash", cents);
    parts = fbToCash(after, evAfter, cents, src);
  } else if (kind === "realloc"){
    after = transfer(evAfter, src, dst, cents);
    parts = fbRealloc(after, cents, src, dst);
  } else if (kind === "rebal"){
    after = rebalanced(evAfter, currentAlloc());
    parts = fbRebal(after, evAfter);
  } else if (kind === "contrib"){
    const t = total(evAfter); after = {};
    CATS.forEach(c => after[c.id] = evAfter[c.id] + cents * CENT * evAfter[c.id] / t);
    parts = fbContrib(after, cents);
  } else {
    parts = fbHold(after);
  }
  /* Commit the decision to the live record: this is what carries into the next
     period and what the report reads. */
  setHoldings(after);
  if (kind === "contrib") app.contributions = (contributionsTotal() + cents * CENT).toString();
  app.points[app.points.length - 1] = { label:"Period " + app.stage, value: totalOf(after).toString() };
  app.decisions.push({
    stage: app.stage,
    type: kind,
    label: decisionLabel(kind, cents, src, dst),
    effect: decisionEffect(kind, after),
    situation: situationText()
  });
  app.decision = null;
  save();

  const db = shadowRoot.getElementById("decisionBlock");
  if (db) db.classList.add("hidden");
  const fb = shadowRoot.getElementById("feedbackBlock");
  fb.classList.remove("hidden");
  fb.innerHTML = feedbackShellHTML(parts);
  wireFeedback();
  addArrows(fb);
  fb.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block:"start" });
  const h2 = fb.querySelector("h2");
  if (h2){ h2.setAttribute("tabindex", "-1"); h2.focus({ preventScroll:true }); }
}
function decisionLabel(kind, cents, src, dst){
  if (kind === "hold") return "Held unchanged";
  if (kind === "rebal") return "Rebalanced to the original percentages";
  if (kind === "contrib") return "Added a virtual contribution of " + fmtCents(cents);
  if (kind === "realloc") return "Moved " + fmtCents(cents) + " from " + CATS[IDX[src]].name + " into " + CATS[IDX[dst]].name;
  return (kind === "sell" ? "Sold " : "Moved ") + fmtCents(cents) + " of " + CATS[IDX[src]].name + " into Cash";
}
function decisionEffect(kind, after){
  if (kind === "hold") return "No change to holdings";
  if (kind === "contrib") return "Virtual cash added, tracked separately from growth";
  const t = totalOf(after);
  return "Cash is now " + pctStr(pct1(after.cash, t)) + " of the portfolio";
}
function situationText(){
  const t = totalOf(evAfter), start = fromEuros(TARGET) + contributionsTotal();
  const d = t - start;
  const pc = Math.abs(Number(roundDiv(d * 10000n, start)) / 100).toFixed(2);
  return (d < 0n ? "Down " : "Up ") + pc + " per cent from the starting amount";
}

/* ============================================================
   6. LEARNING REPORT
   ============================================================ */
function row(a, b){ return '<tr><td>' + a + '</td><td class="n">' + b + '</td></tr>'; }
function animateReport(){
  const body = shadowRoot.getElementById("reportBody");
  animateChildren(body, "h2, .panel, .callout, .pull, .nextup", 0.05);
  animateChildren(body, ".seallist .sealrow", 0.09);
  animateArt(shadowRoot.getElementById("s-report"));
  try {
    const poly = body.querySelector("polyline.dr");
    if (poly && !reduced() && typeof poly.getTotalLength === "function"){
      const len = poly.getTotalLength();
      poly.style.strokeDasharray = len;
      poly.style.strokeDashoffset = len;
      poly.style.setProperty("--len", len);
      poly.style.animation = "drawLine 1.1s cubic-bezier(.22,.8,.3,1) .25s forwards";
    }
  } catch (e) { /* the line stays fully drawn */ }
  body.querySelectorAll("svg .pt, svg .ptlab").forEach((el, i) => {
    if (reduced()){ el.style.opacity = 1; return; }
    el.style.opacity = 0;
    el.style.animation = "riseIn .4s ease-out " + (0.45 + i * 0.13).toFixed(2) + "s both";
  });
  const f = body.querySelector("#repFinal");
  if (f && !reduced()) countTo("repFinal", fromEuros(10000), currentFinal, 900);
}
let currentFinal = 0n;

/* ============================================================
   CHAPTER 1 SCREENS
   ============================================================ */
const CHOICES = {
  goal: { key:"goal", cards:[
      ["Long-term growth","Building wealth over many years, with no particular date attached."],
      ["Future security","A financial cushion that reduces how much you depend on your income."],
      ["A specific plan","A named goal such as property, study or a business you intend to start."],
      ["Learning first","You want to understand investing before deciding what the money is for."]],
    note:{ "Learning first":"That is a valid starting point. Many people invest for years before naming a single goal." },
    err:"Choose one goal to continue.", next:"horizon", host:"goalCards", btn:"goalNext", noteEl:"goalNote", errEl:"goalErr" },
  horizon: { key:"horizon", cards:[
      ["1 to 3 years","You may need this money soon."],
      ["4 to 9 years","You have time, but the date is in view."],
      ["10 years or more","You do not expect to need this money for a long time."]],
    note:{ "1 to 3 years":"With a shorter horizon, there is less time available between a fall and the point at which the money is needed. Your report will reflect that." },
    err:"Choose a time period to continue.", next:"react", host:"horCards", btn:"horNext", noteEl:"horNote", errEl:"horErr" },
  react: { key:"prediction", cards:[
      ["Sell some of it","I would want to reduce how much is exposed to further falls."],
      ["Do nothing","I would leave it alone and wait."],
      ["Buy more","I would see lower prices as an opportunity."],
      ["I am not sure","I do not know how I would feel until it happened."]],
    note:{ "*":"Recorded. There is no right answer here, and instincts often change when the numbers are in front of you." },
    err:"Choose the answer closest to your instinct to continue.", next:"capital", host:"reactCards", btn:"reactNext", noteEl:"reactNote", errEl:"reactErr" }
};
function renderChoice(name){
  const c = CHOICES[name], host = shadowRoot.getElementById(c.host);
  host.innerHTML = c.cards.map(function(card){
    return '<button class="opt" role="radio" aria-checked="' + (app[c.key] === card[0]) + '" data-choice="' + name + '" data-value="' + card[0] + '">' +
      '<span class="tick" aria-hidden="true">&#10003;</span>' +
      '<span class="t">' + card[0] + '</span><span class="d">' + card[1] + '</span></button>';
  }).join("");
  if (c.cards.length === 4) host.classList.add("optgrid");
  host.querySelectorAll("[data-choice]").forEach(function(b){
    b.addEventListener("click", function(){
      app[c.key] = b.dataset.value; save();
      host.querySelectorAll("[data-choice]").forEach(function(x){ x.setAttribute("aria-checked", x.dataset.value === app[c.key]); });
      shadowRoot.getElementById(c.errEl).textContent = "";
      const n = c.note[app[c.key]] || c.note["*"] || "";
      shadowRoot.getElementById(c.noteEl).textContent = n;
      shadowRoot.getElementById(c.btn).setAttribute("aria-disabled", "false");
    });
  });
  const chosen = !!app[c.key];
  shadowRoot.getElementById(c.btn).setAttribute("aria-disabled", chosen ? "false" : "true");
  shadowRoot.getElementById(c.noteEl).textContent = chosen ? (c.note[app[c.key]] || c.note["*"] || "") : "";
  addArrows(host.closest("section"));
}
["goal","horizon","react"].forEach(function(name){
  const c = CHOICES[name];
  shadowRoot.getElementById(c.btn).addEventListener("click", function(){
    if (this.getAttribute("aria-disabled") === "true"){
      shadowRoot.getElementById(c.errEl).textContent = c.err;
      return;
    }
    go(c.next);
  });
});

/* currency, chosen once at the start and used everywhere after */
function renderCurrency(){
  const host = shadowRoot.getElementById("curCards");
  if (!host) return;
  host.innerHTML = Object.keys(CURRENCIES).map(function(code){
    const cur = CURRENCIES[code];
    return '<button class="opt" role="radio" aria-checked="' + (app.currency === code) + '" data-cur="' + code + '">' +
      '<span class="tick" aria-hidden="true">&#10003;</span>' +
      '<span class="t">' + cur.symbol + ' ' + cur.name + '</span>' +
      '<span class="d">Amounts are shown as ' + cur.symbol + '10,000 throughout.</span></button>';
  }).join("");
  host.querySelectorAll("[data-cur]").forEach(function(b){
    b.addEventListener("click", function(){
      app.currency = b.dataset.cur; save();
      host.querySelectorAll("[data-cur]").forEach(function(x){ x.setAttribute("aria-checked", x.dataset.cur === app.currency); });
      refreshCurrencyEverywhere();
    });
  });
}
function refreshCurrencyEverywhere(){
  renderAssets();
  renderAllocRows();
  renderAlloc();
  const w = shadowRoot.getElementById("s-welcome");
  if (w) w.querySelectorAll("[data-money]").forEach(function(el){ el.textContent = CUR() + el.dataset.money; });
}

function renderDisclaimer(){
  const box = shadowRoot.getElementById("disAgree");
  const btn = shadowRoot.getElementById("disNext");
  box.checked = !!app.disclaimerAccepted;
  btn.setAttribute("aria-disabled", box.checked ? "false" : "true");
  box.onchange = function(){
    app.disclaimerAccepted = box.checked; save();
    btn.setAttribute("aria-disabled", box.checked ? "false" : "true");
    if (box.checked) shadowRoot.getElementById("disHelp").textContent = "";
  };
}
shadowRoot.getElementById("disNext").addEventListener("click", function(){
  if (this.getAttribute("aria-disabled") === "true"){
    shadowRoot.getElementById("disHelp").textContent = "Please tick the box to confirm you understand this is an educational simulation.";
    shadowRoot.getElementById("disAgree").focus();
    return;
  }
  go("goal");
});
shadowRoot.getElementById("fullDiscLink").addEventListener("click", openDisclaimer);

function renderCapital(){
  const el = shadowRoot.getElementById("capFigure");
  countTo("capFigure", 0n, fromEuros(TARGET), 700);
  el.textContent = fmt(fromEuros(TARGET));
}

/* ============================================================
   CHAPTER 2: REVIEW AND REASONS
   ============================================================ */
function renderReview(){
  const t = allocTotal();
  const ids = CATS.map(function(c){ return c.id; });
  const vals = ids.map(function(id){ return fromEuros(app.alloc[id] || 0); });
  const pcts = weightsPct(vals, fromEuros(t));
  shadowRoot.getElementById("reviewTable").innerHTML =
    '<div class="panel" style="overflow-x:auto"><table><caption>How your virtual ' + fmt(fromEuros(TARGET)) + ' is allocated</caption>' +
    '<thead><tr><th scope="col">Category</th><th scope="col" class="n">Amount</th><th scope="col" class="n">Share</th><th scope="col">Movement in this simulation</th></tr></thead><tbody>' +
    CATS.map(function(c, i){
      return '<tr><th scope="row">' + c.name + '</th><td class="n">' + fmt(vals[i]) + '</td><td class="n">' + pctStr(pcts[i]) + '</td><td>' + c.move.replace(" in this simulation","") + '</td></tr>';
    }).join("") + '</tbody></table></div>';
  drawReviewDonut(ids, vals, pcts, fromEuros(t));
  shadowRoot.getElementById("revTotal").textContent = fmt(fromEuros(t));
  shadowRoot.getElementById("revDonutSummary").textContent = "Portfolio composition: " +
    CATS.map(function(c, i){ return c.name + " " + pctStr(pcts[i]); }).join(", ") + ".";

  const lower = (app.alloc.cash || 0) + (app.alloc.bonds || 0);
  const lp = Math.round(lower / t * 100);
  let big = null;
  CATS.forEach(function(c, i){ if ((app.alloc[c.id] || 0) / t > 0.5) big = { c:c, p:pcts[i] }; });
  const none = CATS.every(function(c){ return (app.alloc[c.id] || 0) / t <= 0.35; });
  shadowRoot.getElementById("reviewObs").innerHTML =
    '<div class="layer"><div class="panel"><p class="kicker">Lower-movement and higher-movement exposure</p>' +
    '<p class="sm">Around ' + lp + ' per cent of your portfolio is in categories defined in this simulation as lower-movement, and around ' + (100 - lp) +
    ' per cent in categories defined as higher-movement. Higher-movement categories carry a wider range of possible outcomes, in both directions.</p>' +
    '<p class="sm" style="margin:0">This grouping exists only for this educational simulation. It is not a universal description of these categories, and the four higher-movement categories do not behave alike or perform the same function.</p>' +
    '</div></div>' +
    (big
      ? '<p class="sm">' + big.c.name + ' makes up ' + pctStr(big.p) + ' of your portfolio. That means most of your result will follow what happens to that one category. Some people choose this deliberately. It is your decision, and you can change it before you continue.</p>'
      : (none ? '<p class="sm">No single category makes up more than a third of your portfolio. Spreading money across categories that behave differently is what diversification means in practice.</p>' : ''));
  addArrows(shadowRoot.getElementById("s-review"));
}
function drawReviewDonut(ids, vals, pcts, tot){
  const svg = shadowRoot.getElementById("revDonut");
  const C = 2 * Math.PI * 86;
  let off = 0, out = '<circle cx="120" cy="120" r="86" fill="none" stroke="rgba(37,35,38,.07)" stroke-width="34"/>';
  CATS.forEach(function(c, i){
    const share = pcts[i] / 100;
    if (share <= 0) return;
    const len = Math.max(C * share - 6, 1);
    out += '<circle cx="120" cy="120" r="86" fill="none" stroke="' + c.colour + '" stroke-width="34" stroke-linecap="round" stroke-dasharray="' +
      len + ' ' + (C - len) + '" stroke-dashoffset="' + (-C * off) + '" transform="rotate(-90 120 120)"/>';
    off += share;
  });
  svg.innerHTML = out;
}
shadowRoot.getElementById("revConfirm").addEventListener("click", function(){
  openModal("Continue to Experience the Market",
    '<p class="sm">This confirms your allocation as the starting point for the simulation and takes you into Chapter 3, Experience the Market, where you will see how your portfolio responds to three simulated market periods. You will still be able to make changes after the first two.</p>',
    "Yes, continue", "Go back and edit");
  modalConfirm = function(){
    app.allocConfirmed = true;
    app.initialWeights = {};
    const t = allocTotal();
    CATS.forEach(function(c){ app.initialWeights[c.id] = (app.alloc[c.id] || 0) / t; });
    startJourney();
    save();
    go("reasons");
  };
});

const REASON_CHIPS = [
  "I wanted to spread the money across several categories.",
  "I wanted to keep a portion in categories that move less.",
  "I wanted more exposure to categories that may grow.",
  "I chose categories I understand.",
  "I am experimenting to see what happens."
];
function renderReasons(){
  const host = shadowRoot.getElementById("reasonChips");
  host.innerHTML = REASON_CHIPS.map(function(r, i){
    return '<button class="opt" aria-pressed="' + (app.reasons.indexOf(r) >= 0) + '" data-reason="' + i + '" style="width:auto;flex:1 1 260px">' +
      '<span class="tick" aria-hidden="true">&#10003;</span><span class="d" style="font-size:15px">' + r + '</span></button>';
  }).join("");
  host.querySelectorAll("[data-reason]").forEach(function(b){
    b.addEventListener("click", function(){
      const r = REASON_CHIPS[Number(b.dataset.reason)];
      const i = app.reasons.indexOf(r);
      if (i >= 0) app.reasons.splice(i, 1); else app.reasons.push(r);
      b.setAttribute("aria-pressed", app.reasons.indexOf(r) >= 0);
      save(); checkReasons();
    });
  });
  const ta = shadowRoot.getElementById("reasonNote");
  ta.value = app.reasonNote || "";
  ta.oninput = function(){
    app.reasonNote = ta.value; save();
    shadowRoot.getElementById("reasonCount").textContent = ta.value.length >= 400 ? (ta.value.length + " of 500 characters") : "";
    checkReasons();
  };
  checkReasons();
  addArrows(shadowRoot.getElementById("s-reasons"));
}
function checkReasons(){
  const ok = app.reasons.length > 0 || (app.reasonNote || "").trim().length >= 10;
  shadowRoot.getElementById("reasonNext").setAttribute("aria-disabled", ok ? "false" : "true");
  if (ok) shadowRoot.getElementById("reasonErr").textContent = "";
}
shadowRoot.getElementById("reasonNext").addEventListener("click", function(){
  if (this.getAttribute("aria-disabled") === "true"){
    shadowRoot.getElementById("reasonErr").textContent = "Choose at least one reason, or write a short note, to continue.";
    return;
  }
  go("t2");
});

/* ============================================================
   THE LIVE JOURNEY
   ============================================================ */
const EVENT_COPY = [
  { n:1, period:"Months 1 to 6", title:"The cost of everything rises",
    news:"Prices have been rising faster than expected across food, energy and housing. Central banks have responded by raising interest rates, which makes borrowing more expensive for households and companies.",
    newsSub:"Markets have reacted quickly, and not all in the same direction.",
    explain:["Inflation means prices rising. When prices rise too quickly, central banks usually raise interest rates, which is the cost of borrowing money. Higher rates slow spending, and they also change what investments are worth.",
             "Existing bonds paying lower fixed interest become less attractive than new ones paying more, so their prices fall. Companies whose value rests on expected future growth are valued less highly today."],
    principle:"Interest rates and bond prices usually move in opposite directions. A category described here as lower movement can still fall in value. Lower movement means smaller movements, not no movement.",
    why:"Each category responds to different things. Bonds respond most directly to interest rates. Technology companies are valued largely on expected future profits. Property responds to borrowing costs because most property is bought with debt. Gold responds to demand and uncertainty. Cash earns interest, which rose, while prices rose by more.",
    inflNote:"Prices rose by 4.1 per cent during this period in this simulation, so the same basket of goods costs more than it did at the start. That affects money whether it is invested or held as cash. The inflation figures in this journey are fictional simulation assumptions.",
    pull:"Now you can see why different categories do not always move together.", decision:true },

  { n:2, period:"Months 7 to 14", title:"A long decline",
    news:"Company profits have come in below expectations across several industries, and higher borrowing costs have started to reduce spending. Share prices have fallen over a period of months rather than in a single day.",
    newsSub:"Commentary has turned negative, and some reports are describing this as the worst period in years.",
    explain:["This is what a decline often looks like. Not one dramatic day, but a long stretch of gradual falls, with recoveries in between that do not hold. Periods like this are uncomfortable because they take months, and because nobody can tell you at the time whether the lowest point has been reached.",
             "Interest rates have stopped rising, which has allowed bond prices to recover a little. Gold has risen again. Shares have fallen, and the categories that depend most on expected future growth have fallen the furthest."],
    principle:"A fall reduces the current value of an investment, whether or not it is sold. If the investment continues to be held, its value may recover, fall further or remain lower. Selling converts the current market value into cash and removes that portion from future market movements.",
    principleExtra:"Neither response is correct in general. In real life the appropriate decision can depend on your goals, your financial circumstances, your time horizon, whether you need access to the money, your tax position, the costs involved and the nature of the investment.",
    why:"The categories that depend most on expected future profits fell furthest. Bonds recovered a little once rates stopped rising. Gold rose, as it sometimes does when people are uncertain. Cash earned a small amount of interest while prices rose by more.",
    inflNote:"Prices rose by 3.2 per cent during this period in this simulation. The inflation figures in this journey are fictional simulation assumptions.",
    steady:"The numbers below have fallen. Take your time with this screen. There is no time limit on any decision here, and nothing real is at stake.",
    pull:"A fall reduces the current value of an investment, whether or not it is sold.", decision:true },

  { n:3, period:"Months 15 to 30", title:"An uneven recovery",
    news:"Inflation has slowed and interest rate rises have stopped. Confidence has returned to parts of the market, though not evenly.",
    newsSub:"Some categories have recovered strongly, others slowly, and one has fallen back after rising during the decline.",
    explain:["Recoveries are rarely tidy. In this period, the categories that fell furthest have risen the most, which is a pattern that has sometimes occurred and has often not. The property fund has recovered slowly, because buildings are valued and sold slowly. Gold, which rose while shares were falling, has fallen back as confidence returned.",
             "Whether your portfolio has recovered depends on what you held through this period, which depends on the decisions you made when the numbers were at their lowest."],
    principle:"The category that supported your portfolio during the decline is the one that fell during this recovery. Historical performance describes what happened in the past. Simulated performance shows what happened under an invented or modelled set of assumptions. Neither predicts future results.",
    why:"Not everything recovered at the same speed, and not everything recovered at all. Gold rose while other categories were falling, and then fell during this period. The property fund moved back up slowly. Technology companies fell the furthest and then rose the most.",
    inflNote:"Prices rose by 1.9 per cent during this period in this simulation. The inflation figures in this journey are fictional simulation assumptions.",
    closing:"There is no decision on this screen. This period runs to the end of the simulation, so your final result reflects the decisions you have already made rather than a last adjustment.",
    pull:"The strongest category in one period is not a guide to the next.", decision:false }
];

const DATA_PERIODS = 3;
function startJourney(){
  const h = {};
  CATS.forEach(function(c){ h[c.id] = (fromEuros(app.alloc[c.id] || 0)).toString(); });
  app.holdings = h;
  app.stage = 1;
  app.decisions = [];
  app.contributions = "0";
  app.points = [{ label:"Start", value: fromEuros(allocTotal()).toString() }];
  app.holdReflection = null;
  app.eventApplied = {};
  app.beforeStage = JSON.stringify(h);
  save();
}
function holdingsObj(){
  const o = {};
  CATS.forEach(function(c){ o[c.id] = BigInt((app.holdings && app.holdings[c.id]) || "0"); });
  return o;
}
function setHoldings(o){
  const h = {};
  CATS.forEach(function(c){ h[c.id] = o[c.id].toString(); });
  app.holdings = h;
}
function totalOf(o){ return CATS.reduce(function(a, c){ return a + o[c.id]; }, 0n); }
function applyEventTo(o, n){
  const ev = EVENTS[n - 1], out = {};
  CATS.forEach(function(c){ out[c.id] = o[c.id] * BigInt(ev.f[c.id]) / 1000n; });
  return out;
}
function contributionsTotal(){ return BigInt(app.contributions || "0"); }

/* ---------- the event screen, driven entirely by data ---------- */
let evBefore = null, evAfter = null, stageBeat = 1, pendingDecision = null;

function renderEvent(){
  if (typeof app.stage !== "number" || app.stage < 1 || app.stage > DATA_PERIODS) app.stage = 1;
  const n = app.stage;
  /* A saved record can be incomplete: an older version, a write interrupted
     part way, or a member JSON edited by hand. Rather than failing on a blank
     screen, rebuild the journey from the confirmed allocation, or send the
     visitor back to a screen that makes sense. This only rebuilds when the
     allocation itself is complete: the allocConfirmed flag is not treated as
     a gate here, so a flag that is out of sync with the holdings can never
     leave the journey stuck on this screen. */
  if (!app.holdings || !app.beforeStage){
    if (allocTotal() === TARGET){
      app.allocConfirmed = true;
      if (!app.initialWeights){
        app.initialWeights = {};
        CATS.forEach(function(c){ app.initialWeights[c.id] = (app.alloc[c.id] || 0) / TARGET; });
      }
      startJourney();
      app.stage = 1;
    } else {
      app.stage = 1;
      save();
      go(allocTotal() > 0 ? "allocate" : "welcome");
      return;
    }
  }
  if (!app.eventApplied) app.eventApplied = {};
  if (!app.eventApplied[n]){
    app.beforeStage = JSON.stringify(app.holdings);
    const after = applyEventTo(holdingsObj(), n);
    setHoldings(after);
    app.points.push({ label:"Period " + n, value: totalOf(after).toString() });
    app.eventApplied[n] = true;
    save();
  }
  evBefore = {}; const beforeRaw = JSON.parse(app.beforeStage);
  CATS.forEach(function(c){ evBefore[c.id] = BigInt(beforeRaw[c.id]); });
  evAfter = holdingsObj();
  stageBeat = 1; pendingDecision = null;
  paintEvent();
}

function paintEvent(){
  const n = app.stage, C = EVENT_COPY[n - 1], ev = EVENTS[n - 1];
  const tb = totalOf(evBefore), ta = totalOf(evAfter);
  const dark = shadowRoot.getElementById("evDark"), light = shadowRoot.getElementById("evLight");

  shadowRoot.getElementById("evKicker").textContent = "Period " + n + " of 3 · " + C.period;
  shadowRoot.getElementById("evH").textContent = C.title;

  let s = '<div class="beat" data-beat="1">' +
    (C.steady ? '<div class="callout" style="margin-top:18px"><p class="kicker" style="color:var(--amber)">Take your time</p><p class="sm" style="margin:0">' + C.steady + '</p></div>' : '') +
    '<p class="lede" style="max-width:40ch;margin-top:18px">' + C.news + '</p>' +
    '<p class="sm" style="max-width:42ch">' + C.newsSub + '</p>' +
    (stageBeat < 2 ? '<div class="actions"><button class="btn btn-secondary" data-reveal="2">What does that mean for investments</button></div>' : '') +
    '</div>';

  if (stageBeat >= 2){
    s += '<div class="beat" data-beat="2" style="margin-top:32px;border-top:1px solid rgba(250,247,242,.18);padding-top:26px">' +
      '<p class="kicker">Two · What changed in the economy</p>' +
      C.explain.map(function(p){ return '<p>' + p + '</p>'; }).join("") +
      '<div class="callout"><p class="kicker" style="color:var(--amber)">The principle</p><p class="sm" style="margin:0">' + C.principle + '</p>' +
      (C.principleExtra ? '<p class="sm" style="margin:10px 0 0">' + C.principleExtra + '</p>' : '') + '</div>' +
      '<button class="btn-link sm" id="whyToggle" aria-expanded="false" aria-controls="whyPanel" style="font-size:15px">Why did each category move differently</button>' +
      '<div id="whyPanel" class="panel hidden" style="margin-top:12px"><p class="sm" style="margin:0">' + C.why + '</p></div>' +
      (stageBeat < 3 ? '<div class="actions"><button class="btn btn-secondary" data-reveal="3">See how each category responded</button></div>' : '') +
      '</div>';
  }

  if (stageBeat >= 3){
    s += '<div class="beat" data-beat="3" style="margin-top:32px;border-top:1px solid rgba(250,247,242,.18);padding-top:26px">' +
      '<p class="kicker">Three · How each category responded</p>' +
      '<div style="margin-bottom:6px"><button class="btn-link sm" id="barToggle" aria-expanded="false" style="font-size:15px">View as a table</button></div>' +
      '<div id="evBars"></div><div id="evTable" class="hidden" style="overflow-x:auto"></div>' +
      (stageBeat < 4 ? '<div class="actions"><button class="btn btn-secondary" data-reveal="4">See what happened to my portfolio</button></div>' : '') +
      '</div>';
  }

  if (stageBeat >= 4){
    const diff = ta - tb, down = diff < 0n;
    const pc = Math.abs(Number(roundDiv(diff * 10000n, tb)) / 100).toFixed(2);
    const startTot = fromEuros(TARGET) + contributionsTotal();
    const sinceStart = ta - startTot;
    const sincePc = Math.abs(Number(roundDiv(sinceStart * 10000n, startTot)) / 100).toFixed(2);
    const lowest = lowestSoFar();
    s += '<div class="beat" data-beat="4" style="margin-top:32px;border-top:1px solid rgba(250,247,242,.18);padding-top:26px">' +
      '<p class="kicker">Four · What happened to your portfolio</p>' +
      '<p class="bigmove ' + (down ? "down" : "up") + '" id="evAfterFig" style="margin:0">' + fmt(ta) + '</p>' +
      '<p class="sm movetext" id="evChange" style="margin:10px 0 0"><span class="' + (down ? "down" : "up") + '">' +
        '<span aria-hidden="true">' + (down ? "\u2193" : "\u2191") + '</span> ' + (down ? "Down " : "Up ") +
        fmt(diff < 0n ? -diff : diff) + ", " + (down ? "down " : "up ") + pc + ' per cent this period</span></p>' +
      '<p class="cap" style="margin-top:6px">From <span class="num">' + fmt(tb) + '</span> at the start of this period. ' +
        'That is ' + (sinceStart < 0n ? "down " : "up ") + sincePc + ' per cent since you started.</p>' +
      (ta <= lowest ? '<p class="cap" style="margin-top:6px"><strong>This is the lowest point your portfolio has reached so far in this simulation.</strong></p>' : '') +
      (n === 2 ? '<div class="callout" style="margin-top:22px"><p class="kicker" style="color:var(--amber)">What a fall does to value</p>' +
        '<p class="sm">A fall reduces the current value of an investment, whether or not it is sold. If the investment continues to be held, its value may recover, fall further or remain lower. Selling converts the current market value into cash and removes that portion from future market movements.</p>' +
        '<p class="sm" style="margin:0">In real life the appropriate decision can depend on your goals, your financial circumstances, your time horizon, whether you need access to the money, your tax position, the costs involved and the nature of the investment itself.</p></div>' : '') +
      (n === 3 ? '<div class="callout" style="margin-top:22px"><p class="kicker" style="color:var(--amber)">What moved and what did not</p><p class="sm" style="margin:0">' + C.why + '</p></div>' : '') +
      '<div class="callout" style="margin-top:16px"><p class="kicker" style="color:var(--amber)">Worth knowing</p><p class="sm" style="margin:0">' + C.inflNote + '</p></div>' +
      '<p class="cap" style="margin-top:16px">Simulated scenario. These movements are fictional and were written for teaching under an invented set of assumptions. They are not a forecast.</p>' +
      (stageBeat < 5
        ? '<div class="actions"><button class="btn btn-primary" data-reveal="5">' + (C.decision ? "Now it is your decision" : "Continue") + '</button></div>'
        : '') +
      '</div>';
  }
  s += '<p class="disc">Virtual money. Simulated scenario. Not investment advice.</p>';
  dark.innerHTML = s;

  if (stageBeat >= 3) paintEventBars();
  light.innerHTML = stageBeat >= 5 ? (C.decision ? decisionHTML() : closingHTML(C)) : '';
  if (stageBeat >= 5 && C.decision) wireDecision();
  shadowRoot.querySelectorAll("[data-reveal]").forEach(function(b){ b.onclick = function(){ advanceBeat(b.dataset.reveal); }; });
  const wt = shadowRoot.getElementById("whyToggle");
  if (wt) wt.onclick = function(){
    const p = shadowRoot.getElementById("whyPanel");
    const open = p.classList.toggle("hidden") === false;
    this.setAttribute("aria-expanded", open);
    this.textContent = open ? "Close" : "Why did each category move differently";
    if (open){ app.moveOpened = true; save(); }
  };
  const bt = shadowRoot.getElementById("barToggle");
  if (bt) bt.onclick = function(){
    const t = shadowRoot.getElementById("evTable"), b = shadowRoot.getElementById("evBars");
    const open = t.classList.toggle("hidden") === false;
    b.classList.toggle("hidden", open);
    this.setAttribute("aria-expanded", open);
    this.textContent = open ? "View as bars" : "View as a table";
  };
  addArrows(shadowRoot.getElementById("s-event"));
}
function lowestSoFar(){
  let lo = null;
  (app.points || []).forEach(function(p){
    const v = BigInt(p.value);
    if (lo === null || v < lo) lo = v;
  });
  return lo === null ? 0n : lo;
}
function movementLabel(v){
  const up = v >= 0;
  return '<span class="mv ' + (up ? "up" : "dn") + '"><span aria-hidden="true">' + (up ? "\u2191" : "\u2193") + '</span> ' +
    (up ? "up " : "down ") + Math.abs(v).toFixed(1) + '%</span>';
}
function paintEventBars(){
  const ev = EVENTS[app.stage - 1];
  const maxAbs = Math.max.apply(null, CATS.map(function(c){ return Math.abs(ev.pct[c.id]); }));
  shadowRoot.getElementById("evBars").innerHTML = CATS.map(function(c){
    const v = ev.pct[c.id], up = v >= 0, w = Math.abs(v) / maxAbs * 46;
    return '<div class="mrow"><div class="lab"><span class="cn">' + c.name + '</span>' +
      movementLabel(v) +
      '<div class="mtrack"><span class="mid" aria-hidden="true"></span><i class="' + (up ? "up" : "dn") + '" data-w="' + w.toFixed(2) + '"></i></div>' +
      '<p class="val" style="margin:8px 0 0;text-align:right">' + fmt(evAfter[c.id]) + '</p></div>';
  }).join("");
  shadowRoot.getElementById("evTable").innerHTML =
    '<table><caption>Simulated price movements for period ' + app.stage + '</caption><thead><tr><th scope="col">Category</th><th scope="col">Movement</th><th scope="col" class="n">Value after</th></tr></thead><tbody>' +
    CATS.map(function(c){
      const v = ev.pct[c.id];
      return '<tr><th scope="row">' + c.name + '</th><td>' + (v >= 0 ? "up " : "down ") + Math.abs(v).toFixed(1) + '%</td><td class="n">' + fmt(evAfter[c.id]) + '</td></tr>';
    }).join("") + '</tbody></table>';
  growBars();
}
function closingHTML(C){
  return '<p class="hang" style="margin-top:0">' + C.pull + '</p>' +
    '<div class="callout"><p class="kicker">Worth knowing</p><p class="sm" style="margin:0">' + C.closing + '</p></div>' +
    '<div class="nextup"><span class="dot" aria-hidden="true"></span><span>Next: discover what your decisions revealed.</span></div>' +
    '<div class="actions"><button class="btn btn-primary" onclick="window.__wia1.go(\'t3\')">Complete the journey</button></div>' +
    '<p class="disc">Virtual money. Simulated scenario. Not investment advice.</p>';
}

/* ============================================================
   DECISION SCREEN
   ============================================================ */
function decisionHTML(){
  const C = EVENT_COPY[app.stage - 1];
  return '<p class="hang" style="margin-top:0">' + C.pull + '</p>' +
   '<div id="decisionBlock">' +
   '<h2>What would you like to do?</h2>' +
   '<p id="decIntro">Your portfolio is now worth <span class="num">' + fmt(totalOf(evAfter)) +
     '</span>. You can leave it as it is, or make a change. Nothing will be applied until you confirm.</p>' +
   '<p class="sm">There is no correct choice here. Every option below has something in its favour and something it costs you.</p>' +
   '<div id="decisionCards" role="radiogroup" aria-label="What would you like to do"></div>' +
   '<div id="decDetail" style="margin-top:14px"></div>' +
   '<p class="errline" id="decErr" role="alert"></p>' +
   '<div class="actions"><button class="btn btn-primary" id="decReview" aria-disabled="true">Review my decision</button></div>' +
   '</div>' +
   '<div id="feedbackBlock" class="hidden" style="margin-top:36px"></div>' +
   '<p class="disc">Virtual money. Simulated scenario. Not investment advice.</p>';
}
function wireDecision(){
  shadowRoot.getElementById("decisionCards").innerHTML = DECISIONS.map(function(d){
    return '<button class="opt" role="radio" aria-checked="false" data-dec="' + d.id + '">' +
      '<span class="tick" aria-hidden="true">&#10003;</span>' +
      '<span class="t">' + d.label + '</span>' +
      '<span class="d"><strong>May help.</strong> ' + d.help + '<br><strong>May cost you.</strong> ' + d.cost + '</span></button>';
  }).join("");
  shadowRoot.querySelectorAll("[data-dec]").forEach(function(b){
    b.addEventListener("click", function(){ pickDecision(b.dataset.dec); });
  });
  app.decision = null;
  const rev = shadowRoot.getElementById("decReview");
  rev.addEventListener("click", function(){ onDecReview.call(rev); });
  addArrows(shadowRoot.getElementById("s-event"));
}

function feedbackShellHTML(parts){
  const n = app.stage;
  const holdRef = (n === 2 && lastDecisionType() === "hold" && !app.holdReflection);
  return '<div class="done-tick" style="margin-bottom:12px"><span class="ring" aria-hidden="true">&#10003;</span>' +
      'You have just practised making an investment decision during uncertainty.</div>' +
    '<h2>What your decision means</h2>' +
    '<dl class="two" style="margin:0">' + parts.map(function(p){
      return '<div class="panel" style="margin-bottom:0"><dt class="kicker">' + p[0] + '</dt><dd class="sm" style="margin:0">' + p[1] + '</dd></div>';
    }).join("") + '</dl>' +
    (n === 2 ? predictionCompareHTML() : "") +
    (holdRef ? holdReflectionHTML() : "") +
    '<div class="nextup"><span class="dot" aria-hidden="true"></span><span>' +
      (n < 3 ? "Next: the market moves again." : "Next: discover what your decisions revealed.") + '</span></div>' +
    '<div class="actions">' +
      '<button class="btn btn-primary" id="fbNext">' + (n < 3 ? "Continue to the next period" : "Complete the journey") + '</button>' +
    '</div>';
}
function lastDecisionType(){
  const d = app.decisions[app.decisions.length - 1];
  return d ? d.type : null;
}
function holdReflectionHTML(){
  return '<div class="callout" id="holdRefBlock"><p class="kicker">One optional question</p>' +
    '<p class="sm">Was this a decision to hold, or were you unsure what to do?</p>' +
    '<div id="holdRefCards"></div></div>';
}
function predictionCompareHTML(){
  if (!app.prediction) return "";
  const t = lastDecisionType();
  const acted = (t === "hold") ? "you chose to hold"
    : (t === "tocash" || t === "sell") ? "you chose to move money into cash"
    : (t === "contrib") ? "you chose to add more"
    : "you chose to make a change";
  let line;
  if (app.prediction === "I am not sure"){
    line = "At the start you were not sure how you would react. Now you have an answer: " + acted + ". That is worth remembering.";
  } else if ((app.prediction === "Do nothing" && t === "hold") ||
             (app.prediction === "Sell some of it" && (t === "tocash" || t === "sell")) ||
             (app.prediction === "Buy more" && t === "contrib")){
    line = "At the start you thought you might " + app.prediction.toLowerCase() +
      " if your portfolio fell. That is what you chose to do. Noticing that your instinct held under pressure is useful information about yourself.";
  } else {
    line = "At the start you thought you might " + app.prediction.toLowerCase() +
      " if your portfolio fell. When it happened, " + acted +
      ". Instincts often change once real numbers are in front of you, and neither response is a failing.";
  }
  return '<div class="layer"><div class="panel"><p class="kicker">What you thought you might do</p>' +
    '<p class="sm" style="margin:0">' + line + '</p></div></div>';
}
const HOLD_REFLECTION = ["It was a deliberate decision to hold", "I was unsure what to do", "I would prefer not to answer"];
function wireFeedback(){
  const nextBtn = shadowRoot.getElementById("fbNext");
  if (nextBtn) nextBtn.addEventListener("click", function(){
    if (app.stage < 3){ app.stage++; save(); go("event"); }
    else go("t3");
  });
  const host = shadowRoot.getElementById("holdRefCards");
  if (host){
    host.innerHTML = HOLD_REFLECTION.map(function(o){
      return '<button class="opt" style="margin-top:10px" data-holdref="' + o + '"><span class="d" style="font-size:15px">' + o + '</span></button>';
    }).join("");
    host.querySelectorAll("[data-holdref]").forEach(function(b){
      b.addEventListener("click", function(){
        app.holdReflection = b.dataset.holdref; save();
        const extra = (app.holdReflection === "I was unsure what to do")
          ? "Feeling unsure during a decline is ordinary. It is not evidence that you are unsuited to investing, and it is not a failing. Doing nothing is a decision with the same consequences as any other, and the difference between hesitating and deliberately holding matters for what you do next time."
          : "Recorded. Thank you.";
        shadowRoot.getElementById("holdRefBlock").innerHTML =
          '<p class="kicker">Noted</p><p class="sm" style="margin:0">' + extra + '</p>';
      });
    });
  }
}

/* ============================================================
   THE LEARNING REPORT
   ============================================================ */
function liveRecord(){
  const final = holdingsObj();
  const finalTotal = totalOf(final);
  const contrib = contributionsTotal();
  const start = fromEuros(TARGET);
  const pts = (app.points || []).map(function(p){ return { label:p.label, value: BigInt(p.value) }; });
  let peak = 0n, maxDD = 0, trough = finalTotal, lowest = finalTotal;
  pts.forEach(function(p){
    if (p.value > peak) peak = p.value;
    if (p.value < lowest) lowest = p.value;
    const dd = peak === 0n ? 0 : Number((p.value - peak) * 10000n / peak) / 100;
    if (dd < maxDD){ maxDD = dd; trough = p.value; }
  });
  return { final:final, finalTotal:finalTotal, contributions:contrib, start:start, points:pts,
           change: finalTotal - (start + contrib), lowest:lowest, maxDD:maxDD, trough:trough,
           power: purchasingPower(finalTotal) };
}
function renderReport(){
  if (!app.holdings || !app.points || app.points.length < 2){
    go(allocTotal() === TARGET ? "event" : (allocTotal() > 0 ? "allocate" : "welcome"));
    return;
  }
  const r = liveRecord();
  shadowRoot.getElementById("reportBody").innerHTML = reportHTML(r);
  const body = shadowRoot.getElementById("reportBody");
  animateReport();
  addArrows(shadowRoot.getElementById("s-report"));
}
function reportHTML(r){
  const up = r.change >= 0n;
  const base = r.start + r.contributions;
  const changePc = Math.abs(Number(roundDiv(r.change * 10000n, base)) / 100).toFixed(2);
  const lowPc = Math.abs(Number(roundDiv((r.lowest - r.start) * 10000n, r.start)) / 100).toFixed(2);
  const ids = CATS.map(function(c){ return c.id; });
  const finals = ids.map(function(id){ return r.final[id]; });
  const pcts = weightsPct(finals, r.finalTotal);
  const feeIllustration = r.finalTotal * 175n / 10000n;

  const opening = up
    ? "Your portfolio finished above where it started. Over a period this short, that outcome depends heavily on the assumptions written into this simulation. What follows is what the journey shows about the decisions you made."
    : "Your portfolio finished below where it started. A portfolio finishing below its starting value is one possible outcome over a period of this length. This exercise uses virtual money so that you can examine the result without risking real money. What follows is what the journey shows about the decisions you made.";

  const funded = CATS.filter(function(c){ return (app.alloc[c.id] || 0) > 0; }).length;
  const practised = [
    "You allocated " + fmt(r.start) + " across " + funded + " " + (funded === 1 ? "category" : "categories") + ".",
    "You saw your portfolio through three simulated market periods.",
    "You made " + app.decisions.length + " " + (app.decisions.length === 1 ? "decision" : "decisions") + " under changing conditions."
  ];

  const obs = [];
  const heldE2 = app.decisions.some(function(d){ return d.stage === 2 && d.type === "hold"; });
  const soldE2 = app.decisions.some(function(d){ return d.stage === 2 && (d.type === "tocash" || d.type === "sell"); });
  if (heldE2) obs.push("You kept the same holdings while values were falling. That meant you were exposed to what followed, in both directions, and you carried the full fall while it was happening.");
  if (soldE2) obs.push("You moved part of your portfolio into cash close to the lowest point in this simulation. That portion was not exposed to further falls, and it was also not exposed to the rise that followed.");
  if (funded <= 2) obs.push("You concentrated your money in a small number of categories, which made your result depend heavily on those categories, in both directions.");
  if (pcts[IDX.gold] > 25) obs.push("Gold rose while other categories fell, then fell during the recovery. Holding it through both periods shows why a category that helps in one period may not help in the next.");
  if (r.contributions > 0n) obs.push("You added virtual money during the journey. Your report separates that money from growth, so the change shown reflects what happened to the money rather than how much you put in.");
  if (app.decisions.some(function(d){ return d.type === "rebal"; })) obs.push("You returned your portfolio to its original percentages, which meant increasing what had fallen and reducing what had risen.");
  if (pcts[IDX.cash] > 40) obs.push("A large share of your portfolio was in cash at the end. In this simulation cash rose in every period. Its purchasing power still fell, because prices rose by more.");
  if (!obs.length) obs.push("You held your portfolio through all three periods without changing it. That meant your result followed the categories you chose at the start, in both directions.");

  return ''
  + '<div class="callout"><p class="sm" style="margin:0">' + opening + '</p></div>'

  + '<h2 class="sect">What you practised</h2>'
  + practised.map(function(p){ return '<p class="sm" style="margin:0 0 8px">' + p + '</p>'; }).join("")
  + (app.goal ? '<p class="cap" style="margin-top:10px">Your stated goal: ' + app.goal + '. Your time horizon: ' + (app.horizon || "not set") + '.</p>' : '')

  + '<h2 class="sect">Your figures</h2>'
  + '<div class="layer"><div class="panel"><table><tbody>'
  + row("Starting virtual amount", fmt(r.start))
  + row("Virtual contributions added", fmt(r.contributions))
  + r.points.slice(1).map(function(p){ return row("Value after " + p.label.toLowerCase(), fmt(p.value)); }).join("")
  + '<tr><td>Total simulated change</td><td class="n"><span id="repFinal">' + (up ? "+" : "") + fmt(r.change) + '</span>, that is ' + (up ? "+" : "\u2212") + changePc + ' per cent</td></tr>'
  + row("Final simulated value", fmt(r.finalTotal))
  + row("Lowest point reached", fmt(r.lowest) + ", that is " + lowPc + " per cent below the starting amount")
  + row("What that amount would buy", fmt(r.power) + ", after 9.47 per cent of simulated inflation")
  + '</tbody></table>'
  + '<p class="cap" style="margin-top:12px">Prices rose during this period in the simulation, so the final amount buys less than ' + fmt(r.start) + ' would have bought at the start. Nominal value and purchasing power are two different things, and both are shown here rather than combined. The inflation figures in this journey are fictional simulation assumptions.</p></div></div>'

  + '<h2 class="sect">Your decisions</h2>'
  + '<div class="panel" style="overflow-x:auto"><table><caption>What you decided at each point</caption>'
  + '<thead><tr><th scope="col">Point</th><th scope="col">Situation</th><th scope="col">Your decision</th><th scope="col">Effect</th></tr></thead><tbody>'
  + (app.decisions.length
      ? app.decisions.map(function(d){
          return '<tr><th scope="row">After period ' + d.stage + '</th><td>' + d.situation + '</td><td>' + d.label + '</td><td>' + d.effect + '</td></tr>';
        }).join("")
      : '<tr><td colspan="4">No changes were made during this journey.</td></tr>')
  + '</tbody></table></div>'

  + '<h2 class="sect">Your final allocation</h2><div class="panel">'
  + CATS.map(function(c, i){
      return '<div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--grey);font-size:15px">'
        + '<span class="orb sm o-' + c.id + '" aria-hidden="true"><svg viewBox="0 0 32 32">' + ICONS[c.id] + '</svg></span>'
        + '<span style="flex:1">' + c.name + '</span>'
        + '<span class="num" style="text-align:right">' + fmt(r.final[c.id]) + '<br><span class="cap">' + pctStr(pcts[i]) + '</span></span></div>';
    }).join("")
  + '</div>'

  + '<h2 class="sect">What the journey shows</h2>'
  + obs.map(function(o){ return '<p class="sm">' + o + '</p>'; }).join("")

  + (app.prediction ? '<h2 class="sect">What you noticed about yourself</h2><p class="sm">' + reportPredictionLine() + '</p>' : '')

  + ((app.reasons.length || (app.reasonNote || "").trim())
      ? '<h2 class="sect">Why you chose this, in your own words</h2><div class="panel">'
        + app.reasons.map(function(x){ return '<p class="sm" style="margin:0 0 8px">' + x + '</p>'; }).join("")
        + ((app.reasonNote || "").trim() ? '<p class="sm" style="margin:8px 0 0"><em>' + escapeText(app.reasonNote.trim()) + '</em></p>' : '')
        + '</div>' : '')

  + '<h2 class="sect">About costs</h2>'
  + '<div class="callout"><p class="kicker">An illustration, not part of your result</p>'
  + '<p class="sm" style="margin:0">No charges have been applied to your portfolio in this journey. As an illustration only, a charge of 0.35 per cent a year applied to a portfolio of this size would have come to about ' + fmt(feeIllustration) + ' over the thirty months, deducted whether the portfolio rose or fell. Real charges vary by provider, product and service, and 0.35 per cent is used here only as an example. It is not a typical or recommended figure.</p></div>'

  + '<h2 class="sect">Concepts covered</h2><div class="panel"><ul class="sm" style="margin:0;padding-left:20px">'
  + ["The difference between saving and investing.",
     "How widely different categories move, and why that is not the same as risk.",
     "Time horizon, and why a fall means different things at different horizons.",
     "Asset allocation and diversification.",
     "Concentration, and what depends on one category.",
     "What a fall does to value, whether or not it is sold.",
     "Inflation, and why a rising balance is not the same as rising purchasing power.",
     "Why the strongest category in one period is not a guide to the next.",
     "Costs, which are deducted whether a portfolio rises or falls."]
    .map(function(x){ return '<li style="margin-bottom:8px">' + x + '</li>'; }).join("")
  + '</ul></div>'

  + '<h2 class="sect">Badges earned</h2><div class="seallist">'
  + BADGES.map(function(b){
      const on = earnedBadges().indexOf(b.id) >= 0;
      return sealHTML(b, on, on);
    }).join("")
  + '</div><p class="cap" style="margin-top:12px">Badges recognise what you read, explored and completed. None depends on a decision, an allocation or a result.</p>'

  + '<p class="disc">This report describes a simulation. The figures relate to virtual money moving through fictional market events written for teaching, and they are not a record of any investment.<br><br>'
  + 'Historical performance describes what happened in the past. Simulated performance shows what happened under an invented or modelled set of assumptions. Neither predicts future results.<br><br>'
  + 'Wealth in Action does not provide financial advice. For decisions about your own money, speak to an appropriately qualified professional.</p>'

  + '<div class="nextup"><span class="dot" aria-hidden="true"></span><span>Next: where to take this.</span></div>'
  + '<div class="actions" style="margin-top:20px">'
  + '<button class="btn btn-primary" onclick="window.__wia1.go(\'next\')">See what to explore next</button>'
  + '<button class="btn btn-secondary" onclick="window.__wia1.restartJourney()">Start this journey again</button>'
  + '</div>';
}
function escapeText(t){
  return String(t).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}
function reportPredictionLine(){
  const d = app.decisions.filter(function(x){ return x.stage === 2; })[0];
  const t = d ? d.type : null;
  if (!t) return "At the start you thought you might " + app.prediction.toLowerCase() + " if your portfolio fell.";
  if (app.prediction === "I am not sure")
    return "At the start you were not sure how you would react. When your portfolio fell, you made a decision anyway. That is worth remembering, and one journey is not enough to know how you would respond to a longer or deeper fall.";
  const matched = (app.prediction === "Do nothing" && t === "hold") ||
                  (app.prediction === "Sell some of it" && (t === "tocash" || t === "sell")) ||
                  (app.prediction === "Buy more" && t === "contrib");
  return matched
    ? "At the start you thought you might " + app.prediction.toLowerCase() + " if your portfolio fell by 20 per cent. That is what you chose to do. Noticing that your instinct held under pressure is useful information, and one journey is not enough to know how you would respond to a longer or deeper fall."
    : "At the start you thought you might " + app.prediction.toLowerCase() + " if your portfolio fell by 20 per cent. When it happened, you did something different. That difference is worth noticing, and one journey is not enough to know how you would respond to a longer or deeper fall.";
}
function restartJourney(){
  openModal("Start this journey again",
    '<p class="sm">This clears your allocation, decisions and result. Your currency choice is kept.</p>',
    "Start again", "Keep my journey");
  modalConfirm = function(){
    const cur = app.currency;
    CATS.forEach(function(c){ app.alloc[c.id] = 0; });
    app.allocConfirmed = false; app.holdings = null; app.decisions = []; app.points = [];
    app.stage = 1; app.eventApplied = {}; app.contributions = "0"; app.completed = false;
    app.reasons = []; app.reasonNote = ""; app.holdReflection = null; app.currency = cur;
   app.furthest = 0; app.opened = []; app.lessonParts = [];
    save();
    renderAllocRows(); renderAlloc();
    go("welcome");
  };
}
function renderComplete(){
  markComplete();
  shadowRoot.getElementById("completeBadges").innerHTML =
    BADGES.map(function(b){ const on = earnedBadges().indexOf(b.id) >= 0; return sealHTML(b, on, on); }).join("");
  addArrows(shadowRoot.getElementById("s-complete"));
}
function renderNext(){
  markComplete();
  addArrows(shadowRoot.getElementById("s-next"));
}

/* The dashboard greeting is time-of-day only. */
function paintGreeting(){
  const el = shadowRoot.getElementById("greeting");
  if (!el) return;
  const h = new Date().getHours();
  const timeGreeting = h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  let name = "";
  if (wiaMember && wiaMember.customFields){
    name = wiaMember.customFields["first-name"] || wiaMember.customFields["firstName"] || wiaMember.customFields["first_name"] || "";
  }
  el.textContent = name ? (timeGreeting + ", " + name.toUpperCase() + ".") : (timeGreeting + ".");
}


/* ============================================================
   COMPANY INVESTOR LAB — integrated additions (ribbon, candlestick
   lesson, company profiles). Inserted into WIA's own Chapter 2 flow
   between "assets" (meet the six categories) and "allocate" (where
   the member builds her portfolio). The portfolio builder, the
   five-year market stages and the separate report from the original
   Company Investor Lab are NOT included here — Wealth in Action
   already has its own portfolio builder, market events and report,
   and this keeps the two from running two different money engines
   side by side. Company figures are fictional throughout.
   ============================================================ */
var DATA = {"meta":{"fictional":true,"datasetVersion":"synthetic-demo-1","currency":"EUR","currencySymbol":"\u20ac","locale":"en-GB","exchange":"Fictional Exchange","mic":"XFIC","interval":"Monthly","priceBasis":"Synthetic prices, written for teaching. No adjustment has been applied because no corporate action exists in this dataset.","periodLabel":"A fictional eight-year window: three years of research history, then a five-year virtual exercise","months":96,"banner":"A safe space to practise with fictional companies and virtual money, and build your confidence.","startingCapital":10000,"contributionCap":2000,"maxHoldings":5,"stages":[{"n":1,"label":"Exercise year 1","from":36,"to":48},{"n":2,"label":"Exercise year 2","from":48,"to":60},{"n":3,"label":"Exercise year 3","from":60,"to":72},{"n":4,"label":"Exercise year 4","from":72,"to":84},{"n":5,"label":"Exercise year 5","from":84,"to":95}],"researchMonths":36,"exerciseStart":36,"decisionIndex":35,"researchLabel":"Research history","exerciseLabel":"Virtual exercise","decisionDateLabel":"The virtual decision date, at the start of the exercise","disclaimerKey":"fictional","disclaimers":{"fictional":"A safe space to practise with fictional companies and virtual money, and build your confidence.","production":"Real company names and historical information are used for education. Virtual money only. Inclusion is not a recommendation or endorsement."},"basketName":"Equal-Weighted Company Basket"},"companies":[{"id":"lum","name":"Lumina Technologies PLC","ticker":"LUM","sector":"Technology","country":"Fictional","desc":"Lumina designs and licenses the optical components used inside other companies' manufacturing equipment. It sells to a small number of very large customers, on long contracts, and earns most of its money from licensing rather than from making things itself.","support":["Its components appear in equipment made by several of the largest manufacturers in its field.","Licensing income arrives on multi-year contracts rather than order by order.","It spends a high proportion of revenue on research, which it reports each year."],"risks":["A small number of customers account for most of its revenue.","Its equipment is bought in cycles, so orders can stop abruptly.","Its research spending continues whether or not orders arrive."],"fin":[["Revenue","1,240","1,410","1,180","1,690","1,940"],["Operating profit","238","291","162","402","471"],["Net profit","181","224","118","310","362"],["Total debt","410","390","455","370","320"],["Cash","260","305","240","420","560"],["Free cash flow","152","198","86","341","408"],["Shares outstanding","64.0m","64.0m","64.0m","63.5m","63.5m"]],"div":[["Year 1","0.42"],["Year 2","0.48"],["Year 3","0.48"],["Year 4","0.58"],["Year 5","0.66"]],"icon":"<circle cx=\"16\" cy=\"16\" r=\"7\"/><path d=\"M16 3v4M16 25v4M3 16h4M25 16h4M7 7l3 3M22 22l3 3M25 7l-3 3M10 22l-3 3\"/>","colour":"#FF4F9A","candles":[{"t":0,"o":35.97,"h":36.64,"l":35.17,"c":35.59},{"t":1,"o":35.59,"h":39.78,"l":33.88,"c":38.74},{"t":2,"o":38.74,"h":40.6,"l":37.77,"c":40.04},{"t":3,"o":40.04,"h":44.91,"l":39.01,"c":43.71},{"t":4,"o":43.71,"h":44.48,"l":38.78,"c":40.04},{"t":5,"o":40.04,"h":40.4,"l":39.93,"c":40.11},{"t":6,"o":40.11,"h":41.06,"l":33.22,"c":34.82},{"t":7,"o":34.82,"h":38.58,"l":33.34,"c":37.55},{"t":8,"o":37.55,"h":37.93,"l":36.76,"c":37.13},{"t":9,"o":37.13,"h":37.82,"l":31.13,"c":32.99},{"t":10,"o":32.99,"h":36.6,"l":32.17,"c":34.75},{"t":11,"o":34.75,"h":38.14,"l":33.3,"c":37.75},{"t":12,"o":37.75,"h":39.1,"l":37.43,"c":38.71},{"t":13,"o":38.71,"h":40.04,"l":38.39,"c":39.61},{"t":14,"o":39.61,"h":41.24,"l":34.74,"c":36.41},{"t":15,"o":36.41,"h":36.76,"l":35.67,"c":36.28},{"t":16,"o":36.28,"h":37.64,"l":35.57,"c":36.91},{"t":17,"o":36.91,"h":39.11,"l":36.23,"c":38.72},{"t":18,"o":38.72,"h":43.56,"l":37.96,"c":41.73},{"t":19,"o":41.73,"h":46.42,"l":39.9,"c":45.27},{"t":20,"o":45.27,"h":45.3,"l":45.23,"c":45.26},{"t":21,"o":45.26,"h":46.55,"l":44.82,"c":45.97},{"t":22,"o":45.97,"h":46.46,"l":41.52,"c":42.85},{"t":23,"o":42.85,"h":45.45,"l":39.63,"c":41.84},{"t":24,"o":41.84,"h":48.03,"l":40.45,"c":46.35},{"t":25,"o":46.35,"h":48.25,"l":45.97,"c":47.8},{"t":26,"o":47.8,"h":50.32,"l":47.14,"c":49.89},{"t":27,"o":49.89,"h":51.0,"l":47.26,"c":47.92},{"t":28,"o":47.92,"h":52.15,"l":46.55,"c":50.87},{"t":29,"o":50.87,"h":51.39,"l":50.45,"c":50.98},{"t":30,"o":50.98,"h":51.03,"l":50.8,"c":50.86},{"t":31,"o":50.86,"h":51.06,"l":50.18,"c":50.34},{"t":32,"o":50.34,"h":54.19,"l":49.65,"c":52.68},{"t":33,"o":52.68,"h":54.05,"l":46.4,"c":47.05},{"t":34,"o":47.05,"h":52.26,"l":44.75,"c":50.53},{"t":35,"o":50.53,"h":52.14,"l":47.0,"c":48.2},{"t":36,"o":48.2,"h":55.56,"l":45.84,"c":52.31},{"t":37,"o":52.31,"h":60.24,"l":50.74,"c":57.27},{"t":38,"o":57.27,"h":64.63,"l":55.4,"c":62.71},{"t":39,"o":62.71,"h":73.47,"l":61.45,"c":69.05},{"t":40,"o":69.05,"h":82.54,"l":67.24,"c":77.51},{"t":41,"o":77.51,"h":78.54,"l":75.67,"c":77.75},{"t":42,"o":77.75,"h":86.39,"l":75.5,"c":83.61},{"t":43,"o":83.61,"h":84.12,"l":82.67,"c":83.3},{"t":44,"o":83.3,"h":84.95,"l":79.19,"c":80.51},{"t":45,"o":80.51,"h":92.16,"l":76.32,"c":90.14},{"t":46,"o":90.14,"h":98.86,"l":84.76,"c":95.12},{"t":47,"o":95.12,"h":96.48,"l":94.68,"c":95.96},{"t":48,"o":95.96,"h":102.77,"l":94.36,"c":100.62},{"t":49,"o":100.62,"h":102.63,"l":100.11,"c":101.83},{"t":50,"o":101.83,"h":103.61,"l":93.34,"c":95.32},{"t":51,"o":95.32,"h":103.22,"l":93.43,"c":100.66},{"t":52,"o":100.66,"h":105.26,"l":98.9,"c":104.05},{"t":53,"o":104.05,"h":104.6,"l":103.1,"c":103.43},{"t":54,"o":103.43,"h":108.94,"l":101.25,"c":108.13},{"t":55,"o":108.13,"h":113.5,"l":106.34,"c":111.77},{"t":56,"o":111.77,"h":117.42,"l":100.85,"c":103.61},{"t":57,"o":103.61,"h":110.22,"l":102.58,"c":107.98},{"t":58,"o":107.98,"h":108.76,"l":107.17,"c":107.93},{"t":59,"o":107.93,"h":113.16,"l":89.37,"c":97.28},{"t":60,"o":97.28,"h":98.22,"l":96.9,"c":97.7},{"t":61,"o":97.7,"h":99.29,"l":97.13,"c":97.8},{"t":62,"o":97.8,"h":102.04,"l":87.54,"c":91.35},{"t":63,"o":91.35,"h":91.94,"l":89.45,"c":89.84},{"t":64,"o":89.84,"h":112.41,"l":85.37,"c":105.45},{"t":65,"o":105.45,"h":123.55,"l":103.02,"c":119.88},{"t":66,"o":119.88,"h":120.44,"l":119.81,"c":120.26},{"t":67,"o":120.26,"h":121.27,"l":115.17,"c":116.32},{"t":68,"o":116.32,"h":123.89,"l":100.76,"c":103.81},{"t":69,"o":103.81,"h":126.38,"l":95.96,"c":118.24},{"t":70,"o":118.24,"h":120.61,"l":114.33,"c":115.88},{"t":71,"o":115.88,"h":117.37,"l":105.57,"c":107.84},{"t":72,"o":107.84,"h":112.48,"l":106.6,"c":111.49},{"t":73,"o":111.49,"h":113.56,"l":104.37,"c":107.23},{"t":74,"o":107.23,"h":109.48,"l":96.59,"c":98.83},{"t":75,"o":98.83,"h":99.77,"l":98.09,"c":98.75},{"t":76,"o":98.75,"h":99.05,"l":97.48,"c":97.91},{"t":77,"o":97.91,"h":99.48,"l":95.24,"c":96.8},{"t":78,"o":96.8,"h":107.75,"l":93.87,"c":103.38},{"t":79,"o":103.38,"h":105.75,"l":90.41,"c":92.08},{"t":80,"o":92.08,"h":94.22,"l":87.23,"c":88.8},{"t":81,"o":88.8,"h":103.59,"l":86.01,"c":98.77},{"t":82,"o":98.77,"h":102.83,"l":90.72,"c":91.99},{"t":83,"o":91.99,"h":98.05,"l":90.58,"c":97.22},{"t":84,"o":97.22,"h":98.51,"l":96.98,"c":98.08},{"t":85,"o":98.08,"h":104.43,"l":97.21,"c":101.31},{"t":86,"o":101.31,"h":104.17,"l":88.14,"c":91.36},{"t":87,"o":91.36,"h":92.78,"l":90.5,"c":91.55},{"t":88,"o":91.55,"h":93.49,"l":81.79,"c":85.31},{"t":89,"o":85.31,"h":87.61,"l":68.24,"c":73.39},{"t":90,"o":73.39,"h":74.11,"l":72.13,"c":72.44},{"t":91,"o":72.44,"h":73.33,"l":72.16,"c":73.11},{"t":92,"o":73.11,"h":74.53,"l":65.1,"c":67.76},{"t":93,"o":67.76,"h":69.48,"l":66.68,"c":68.53},{"t":94,"o":68.53,"h":79.96,"l":63.65,"c":77.55},{"t":95,"o":77.55,"h":78.85,"l":75.02,"c":76.16}],"fictional":true},{"id":"vrd","name":"Verdant Foods NV","ticker":"VRD","sector":"Consumer goods","country":"Fictional","desc":"Verdant makes packaged foods sold through supermarkets under brands most households recognise. Demand changes slowly, and its profit depends heavily on what its ingredients cost.","support":["Its products are bought regularly rather than occasionally.","It sells through several large retail chains rather than one.","It has raised its dividend in each year of this period."],"risks":["Ingredient costs move independently of what it can charge.","Retailers' own-label products compete directly with its brands.","Growth depends on entering new categories, which it has to fund."],"fin":[["Revenue","3,860","3,940","4,120","4,310","4,480"],["Operating profit","521","512","548","573","602"],["Net profit","372","364","392","410","431"],["Total debt","1,180","1,140","1,090","1,020","960"],["Cash","310","330","360","390","420"],["Free cash flow","348","341","372","395","418"],["Shares outstanding","240m","240m","239m","238m","238m"]],"div":[["Year 1","1.02"],["Year 2","1.06"],["Year 3","1.10"],["Year 4","1.14"],["Year 5","1.20"]],"icon":"<path d=\"M16 27C9 27 5 22 5 15c6 0 11 4 11 12z\"/><path d=\"M16 27c7 0 11-5 11-12-6 0-11 4-11 12z\"/><path d=\"M16 27V13\"/>","colour":"#8F7A6A","candles":[{"t":0,"o":28.21,"h":30.27,"l":27.86,"c":30.03},{"t":1,"o":30.03,"h":30.31,"l":28.67,"c":28.95},{"t":2,"o":28.95,"h":30.63,"l":28.49,"c":30.14},{"t":3,"o":30.14,"h":30.24,"l":29.91,"c":29.96},{"t":4,"o":29.96,"h":30.01,"l":29.72,"c":29.75},{"t":5,"o":29.75,"h":29.79,"l":29.41,"c":29.6},{"t":6,"o":29.6,"h":29.69,"l":29.03,"c":29.14},{"t":7,"o":29.14,"h":29.16,"l":28.97,"c":29.03},{"t":8,"o":29.03,"h":29.97,"l":28.48,"c":29.71},{"t":9,"o":29.71,"h":30.14,"l":29.48,"c":30.05},{"t":10,"o":30.05,"h":30.21,"l":28.75,"c":29.15},{"t":11,"o":29.15,"h":29.26,"l":28.93,"c":29.05},{"t":12,"o":29.05,"h":29.36,"l":28.82,"c":29.26},{"t":13,"o":29.26,"h":31.34,"l":28.66,"c":30.64},{"t":14,"o":30.64,"h":31.06,"l":29.05,"c":29.62},{"t":15,"o":29.62,"h":30.53,"l":29.47,"c":30.21},{"t":16,"o":30.21,"h":31.25,"l":29.98,"c":30.91},{"t":17,"o":30.91,"h":30.96,"l":30.63,"c":30.83},{"t":18,"o":30.83,"h":30.98,"l":30.78,"c":30.95},{"t":19,"o":30.95,"h":31.61,"l":30.51,"c":31.49},{"t":20,"o":31.49,"h":32.14,"l":30.92,"c":31.79},{"t":21,"o":31.79,"h":31.88,"l":31.76,"c":31.83},{"t":22,"o":31.83,"h":32.16,"l":31.19,"c":31.38},{"t":23,"o":31.38,"h":31.93,"l":31.11,"c":31.77},{"t":24,"o":31.77,"h":32.93,"l":31.47,"c":32.56},{"t":25,"o":32.56,"h":32.78,"l":32.09,"c":32.15},{"t":26,"o":32.15,"h":34.65,"l":31.92,"c":34.08},{"t":27,"o":34.08,"h":34.27,"l":33.22,"c":33.56},{"t":28,"o":33.56,"h":34.45,"l":30.95,"c":31.31},{"t":29,"o":31.31,"h":31.43,"l":30.87,"c":31.17},{"t":30,"o":31.17,"h":32.86,"l":30.96,"c":32.42},{"t":31,"o":32.42,"h":32.65,"l":32.12,"c":32.38},{"t":32,"o":32.38,"h":32.76,"l":31.55,"c":31.94},{"t":33,"o":31.94,"h":32.71,"l":31.66,"c":32.52},{"t":34,"o":32.52,"h":32.56,"l":32.43,"c":32.45},{"t":35,"o":32.45,"h":32.62,"l":31.36,"c":31.6},{"t":36,"o":31.6,"h":32.1,"l":30.58,"c":30.69},{"t":37,"o":30.69,"h":30.98,"l":29.6,"c":30.05},{"t":38,"o":30.05,"h":30.93,"l":29.91,"c":30.66},{"t":39,"o":30.66,"h":30.88,"l":30.22,"c":30.31},{"t":40,"o":30.31,"h":30.37,"l":29.76,"c":29.95},{"t":41,"o":29.95,"h":31.94,"l":29.51,"c":31.46},{"t":42,"o":31.46,"h":31.91,"l":31.37,"c":31.83},{"t":43,"o":31.83,"h":32.82,"l":31.66,"c":32.51},{"t":44,"o":32.51,"h":33.04,"l":32.34,"c":32.93},{"t":45,"o":32.93,"h":33.04,"l":32.3,"c":32.48},{"t":46,"o":32.48,"h":32.84,"l":31.72,"c":31.95},{"t":47,"o":31.95,"h":32.78,"l":31.52,"c":32.66},{"t":48,"o":32.66,"h":33.95,"l":32.23,"c":33.78},{"t":49,"o":33.78,"h":34.44,"l":32.29,"c":32.64},{"t":50,"o":32.64,"h":32.91,"l":31.76,"c":32.12},{"t":51,"o":32.12,"h":32.26,"l":31.88,"c":31.99},{"t":52,"o":31.99,"h":32.01,"l":31.87,"c":31.92},{"t":53,"o":31.92,"h":32.4,"l":30.14,"c":30.94},{"t":54,"o":30.94,"h":31.34,"l":29.36,"c":29.87},{"t":55,"o":29.87,"h":30.07,"l":29.74,"c":29.96},{"t":56,"o":29.96,"h":31.57,"l":29.59,"c":31.28},{"t":57,"o":31.28,"h":32.21,"l":30.93,"c":32.08},{"t":58,"o":32.08,"h":33.86,"l":31.49,"c":33.5},{"t":59,"o":33.5,"h":33.7,"l":33.42,"c":33.57},{"t":60,"o":33.57,"h":35.39,"l":32.79,"c":34.93},{"t":61,"o":34.93,"h":35.7,"l":34.35,"c":35.3},{"t":62,"o":35.3,"h":36.01,"l":32.5,"c":33.29},{"t":63,"o":33.29,"h":33.41,"l":32.69,"c":32.81},{"t":64,"o":32.81,"h":36.49,"l":32.34,"c":35.51},{"t":65,"o":35.51,"h":36.77,"l":35.09,"c":36.51},{"t":66,"o":36.51,"h":36.58,"l":36.28,"c":36.41},{"t":67,"o":36.41,"h":36.79,"l":35.57,"c":35.89},{"t":68,"o":35.89,"h":36.97,"l":35.7,"c":36.67},{"t":69,"o":36.67,"h":37.39,"l":36.45,"c":37.21},{"t":70,"o":37.21,"h":37.54,"l":37.13,"c":37.44},{"t":71,"o":37.44,"h":38.48,"l":35.44,"c":35.81},{"t":72,"o":35.81,"h":36.41,"l":35.59,"c":36.14},{"t":73,"o":36.14,"h":38.12,"l":35.11,"c":37.2},{"t":74,"o":37.2,"h":41.49,"l":36.13,"c":40.15},{"t":75,"o":40.15,"h":40.92,"l":37.24,"c":38.21},{"t":76,"o":38.21,"h":40.32,"l":37.89,"c":39.89},{"t":77,"o":39.89,"h":40.28,"l":38.23,"c":38.65},{"t":78,"o":38.65,"h":39.56,"l":37.97,"c":39.34},{"t":79,"o":39.34,"h":39.66,"l":38.5,"c":38.78},{"t":80,"o":38.78,"h":39.68,"l":38.6,"c":39.37},{"t":81,"o":39.37,"h":40.02,"l":39.14,"c":39.76},{"t":82,"o":39.76,"h":40.86,"l":39.34,"c":40.51},{"t":83,"o":40.51,"h":44.28,"l":39.94,"c":43.72},{"t":84,"o":43.72,"h":44.27,"l":42.63,"c":43.13},{"t":85,"o":43.13,"h":44.77,"l":42.58,"c":44.17},{"t":86,"o":44.17,"h":44.63,"l":41.74,"c":42.28},{"t":87,"o":42.28,"h":43.5,"l":39.24,"c":39.91},{"t":88,"o":39.91,"h":41.3,"l":35.26,"c":37.23},{"t":89,"o":37.23,"h":39.39,"l":36.76,"c":38.72},{"t":90,"o":38.72,"h":39.03,"l":38.64,"c":38.93},{"t":91,"o":38.93,"h":40.06,"l":38.77,"c":39.59},{"t":92,"o":39.59,"h":40.25,"l":38.14,"c":38.32},{"t":93,"o":38.32,"h":38.47,"l":37.04,"c":37.23},{"t":94,"o":37.23,"h":37.43,"l":36.47,"c":36.69},{"t":95,"o":36.69,"h":37.37,"l":36.5,"c":37.29}],"fictional":true},{"id":"mrd","name":"Meridian Retail Group SA","ticker":"MRD","sector":"Retail","country":"Fictional","desc":"Meridian runs grocery and general retail stores, and a growing home-delivery business. It sells a great deal at a very small margin on each item, so small changes in cost or volume matter a lot.","support":["Customers shop with it weekly rather than occasionally.","Its delivery business has grown in every year of this period.","It owns a proportion of its store property outright."],"risks":["Margins are thin, so a small cost increase removes a large share of profit.","Delivery is expensive to run and has required continuing investment.","Competition is direct and local."],"fin":[["Revenue","28,400","29,100","31,600","32,200","33,400"],["Operating profit","1,020","1,060","1,290","1,180","1,140"],["Net profit","612","640","801","702","668"],["Total debt","4,300","4,150","3,900","3,850","3,780"],["Cash","1,120","1,240","1,680","1,410","1,320"],["Free cash flow","740","790","1,190","830","760"],["Shares outstanding","980m","975m","968m","960m","952m"]],"div":[["Year 1","0.61"],["Year 2","0.64"],["Year 3","0.72"],["Year 4","0.74"],["Year 5","0.76"]],"icon":"<path d=\"M5 11h22l-2 15H7z\"/><path d=\"M11 11V7a5 5 0 0 1 10 0v4\"/>","colour":"#4F8068","candles":[{"t":0,"o":20.96,"h":21.91,"l":20.47,"c":21.69},{"t":1,"o":21.69,"h":22.01,"l":20.97,"c":21.23},{"t":2,"o":21.23,"h":21.37,"l":20.01,"c":20.37},{"t":3,"o":20.37,"h":22.43,"l":19.77,"c":21.99},{"t":4,"o":21.99,"h":23.53,"l":21.62,"c":23.12},{"t":5,"o":23.12,"h":23.91,"l":21.26,"c":21.54},{"t":6,"o":21.54,"h":21.69,"l":20.58,"c":20.99},{"t":7,"o":20.99,"h":21.31,"l":19.99,"c":20.41},{"t":8,"o":20.41,"h":21.03,"l":20.13,"c":20.96},{"t":9,"o":20.96,"h":21.31,"l":20.19,"c":20.38},{"t":10,"o":20.38,"h":21.1,"l":20.21,"c":20.87},{"t":11,"o":20.87,"h":22.97,"l":20.47,"c":22.29},{"t":12,"o":22.29,"h":22.36,"l":22.14,"c":22.2},{"t":13,"o":22.2,"h":24.34,"l":21.36,"c":24.02},{"t":14,"o":24.02,"h":24.75,"l":23.51,"c":24.3},{"t":15,"o":24.3,"h":24.63,"l":22.51,"c":22.72},{"t":16,"o":22.72,"h":22.97,"l":22.52,"c":22.92},{"t":17,"o":22.92,"h":25.11,"l":22.33,"c":24.22},{"t":18,"o":24.22,"h":24.32,"l":24.21,"c":24.3},{"t":19,"o":24.3,"h":25.73,"l":23.65,"c":25.51},{"t":20,"o":25.51,"h":25.6,"l":24.82,"c":24.97},{"t":21,"o":24.97,"h":25.21,"l":24.04,"c":24.23},{"t":22,"o":24.23,"h":25.19,"l":24.05,"c":24.96},{"t":23,"o":24.96,"h":26.13,"l":24.58,"c":25.93},{"t":24,"o":25.93,"h":26.28,"l":25.87,"c":26.15},{"t":25,"o":26.15,"h":26.29,"l":25.88,"c":26.08},{"t":26,"o":26.08,"h":27.68,"l":25.64,"c":27.49},{"t":27,"o":27.49,"h":27.8,"l":26.66,"c":26.8},{"t":28,"o":26.8,"h":26.93,"l":25.79,"c":26.13},{"t":29,"o":26.13,"h":26.88,"l":25.71,"c":26.52},{"t":30,"o":26.52,"h":26.68,"l":26.02,"c":26.17},{"t":31,"o":26.17,"h":26.6,"l":25.22,"c":25.56},{"t":32,"o":25.56,"h":25.59,"l":25.2,"c":25.35},{"t":33,"o":25.35,"h":25.78,"l":23.96,"c":24.11},{"t":34,"o":24.11,"h":24.46,"l":23.14,"c":23.62},{"t":35,"o":23.62,"h":23.91,"l":22.55,"c":22.85},{"t":36,"o":22.85,"h":23.15,"l":21.85,"c":22.19},{"t":37,"o":22.19,"h":24.66,"l":21.17,"c":23.8},{"t":38,"o":23.8,"h":24.37,"l":19.78,"c":20.61},{"t":39,"o":20.61,"h":20.76,"l":19.28,"c":19.65},{"t":40,"o":19.65,"h":20.18,"l":19.42,"c":20.01},{"t":41,"o":20.01,"h":20.88,"l":17.31,"c":17.97},{"t":42,"o":17.97,"h":19.11,"l":17.28,"c":18.74},{"t":43,"o":18.74,"h":19.12,"l":17.86,"c":18.12},{"t":44,"o":18.12,"h":18.13,"l":18.06,"c":18.07},{"t":45,"o":18.07,"h":18.15,"l":17.34,"c":17.57},{"t":46,"o":17.57,"h":19.32,"l":16.91,"c":19.12},{"t":47,"o":19.12,"h":21.58,"l":18.13,"c":20.65},{"t":48,"o":20.65,"h":20.74,"l":20.51,"c":20.66},{"t":49,"o":20.66,"h":20.85,"l":19.93,"c":20.48},{"t":50,"o":20.48,"h":21.07,"l":20.35,"c":20.69},{"t":51,"o":20.69,"h":21.19,"l":19.19,"c":19.5},{"t":52,"o":19.5,"h":20.29,"l":19.26,"c":20.07},{"t":53,"o":20.07,"h":21.15,"l":19.61,"c":20.82},{"t":54,"o":20.82,"h":21.04,"l":20.64,"c":20.89},{"t":55,"o":20.89,"h":21.12,"l":20.28,"c":20.43},{"t":56,"o":20.43,"h":21.3,"l":20.21,"c":21.01},{"t":57,"o":21.01,"h":21.53,"l":18.88,"c":19.52},{"t":58,"o":19.52,"h":20.58,"l":19.17,"c":20.42},{"t":59,"o":20.42,"h":20.6,"l":19.6,"c":19.93},{"t":60,"o":19.93,"h":21.78,"l":19.75,"c":21.36},{"t":61,"o":21.36,"h":22.08,"l":20.92,"c":21.74},{"t":62,"o":21.74,"h":23.21,"l":17.95,"c":18.97},{"t":63,"o":18.97,"h":19.19,"l":17.37,"c":17.97},{"t":64,"o":17.97,"h":20.03,"l":17.32,"c":19.52},{"t":65,"o":19.52,"h":22.84,"l":18.23,"c":21.69},{"t":66,"o":21.69,"h":23.84,"l":21.29,"c":23.17},{"t":67,"o":23.17,"h":26.34,"l":22.65,"c":25.33},{"t":68,"o":25.33,"h":25.66,"l":23.14,"c":23.8},{"t":69,"o":23.8,"h":26.42,"l":22.71,"c":26.17},{"t":70,"o":26.17,"h":26.29,"l":26.12,"c":26.18},{"t":71,"o":26.18,"h":26.34,"l":25.75,"c":25.95},{"t":72,"o":25.95,"h":26.86,"l":25.54,"c":26.56},{"t":73,"o":26.56,"h":27.77,"l":26.31,"c":27.45},{"t":74,"o":27.45,"h":27.67,"l":26.79,"c":26.87},{"t":75,"o":26.87,"h":29.29,"l":26.48,"c":28.69},{"t":76,"o":28.69,"h":29.33,"l":27.51,"c":27.84},{"t":77,"o":27.84,"h":29.06,"l":27.46,"c":28.8},{"t":78,"o":28.8,"h":28.98,"l":28.42,"c":28.47},{"t":79,"o":28.47,"h":30.33,"l":27.82,"c":29.66},{"t":80,"o":29.66,"h":30.24,"l":29.39,"c":30.18},{"t":81,"o":30.18,"h":30.48,"l":29.25,"c":29.45},{"t":82,"o":29.45,"h":29.7,"l":27.95,"c":28.56},{"t":83,"o":28.56,"h":28.85,"l":26.86,"c":27.54},{"t":84,"o":27.54,"h":29.19,"l":26.95,"c":28.69},{"t":85,"o":28.69,"h":28.88,"l":27.31,"c":27.85},{"t":86,"o":27.85,"h":28.58,"l":27.09,"c":27.51},{"t":87,"o":27.51,"h":27.76,"l":25.24,"c":26.09},{"t":88,"o":26.09,"h":26.5,"l":25.86,"c":26.39},{"t":89,"o":26.39,"h":26.56,"l":25.85,"c":25.97},{"t":90,"o":25.97,"h":28.62,"l":25.19,"c":28.14},{"t":91,"o":28.14,"h":28.32,"l":26.93,"c":27.36},{"t":92,"o":27.36,"h":28.42,"l":23.62,"c":24.8},{"t":93,"o":24.8,"h":25.73,"l":24.43,"c":25.42},{"t":94,"o":25.42,"h":25.97,"l":23.32,"c":23.65},{"t":95,"o":23.65,"h":24.48,"l":23.54,"c":24.22}],"fictional":true},{"id":"axl","name":"Axle Motors SA","ticker":"AXL","sector":"Automotive","country":"Fictional","desc":"Axle makes cars and light commercial vehicles. It owns large factories, sells through dealers, and is part-way through changing what it builds.","support":["It has an established dealer network and a recognised name.","It has announced new models in each year of this period.","It holds more cash than debt at the end of the period."],"risks":["Car buying rises and falls with the wider economy.","Its factories cost the same to run whether they are busy or not.","Changing what it builds requires spending before it earns."],"fin":[["Revenue","44,200","41,800","33,900","39,600","42,100"],["Operating profit","2,140","1,620","-480","1,510","1,240"],["Net profit","1,480","1,010","-820","1,020","760"],["Total debt","9,800","10,200","12,400","10,900","9,600"],["Cash","8,900","8,100","6,400","9,200","10,100"],["Free cash flow","1,620","840","-2,100","1,880","1,140"],["Shares outstanding","1.24bn","1.24bn","1.24bn","1.23bn","1.22bn"]],"div":[["Year 1","0.34"],["Year 2","0.20"],["Year 3","0.00"],["Year 4","0.26"],["Year 5","0.30"]],"icon":"<path d=\"M4 19l2-6h20l2 6\"/><path d=\"M4 19h24v4H4z\"/><circle cx=\"9\" cy=\"24\" r=\"2.5\"/><circle cx=\"23\" cy=\"24\" r=\"2.5\"/>","colour":"#252326","candles":[{"t":0,"o":13.71,"h":14.79,"l":13.38,"c":14.48},{"t":1,"o":14.48,"h":15.26,"l":14.17,"c":15.09},{"t":2,"o":15.09,"h":15.23,"l":15.04,"c":15.11},{"t":3,"o":15.11,"h":16.19,"l":14.81,"c":15.92},{"t":4,"o":15.92,"h":18.01,"l":15.1,"c":17.53},{"t":5,"o":17.53,"h":19.12,"l":12.84,"c":14.19},{"t":6,"o":14.19,"h":14.64,"l":12.99,"c":13.47},{"t":7,"o":13.47,"h":13.88,"l":12.61,"c":12.8},{"t":8,"o":12.8,"h":12.97,"l":11.5,"c":11.99},{"t":9,"o":11.99,"h":12.25,"l":10.92,"c":11.1},{"t":10,"o":11.1,"h":11.17,"l":10.98,"c":11.06},{"t":11,"o":11.06,"h":11.49,"l":10.93,"c":11.27},{"t":12,"o":11.27,"h":12.72,"l":10.83,"c":12.09},{"t":13,"o":12.09,"h":12.24,"l":11.74,"c":11.84},{"t":14,"o":11.84,"h":13.02,"l":11.46,"c":12.76},{"t":15,"o":12.76,"h":12.98,"l":12.32,"c":12.45},{"t":16,"o":12.45,"h":13.64,"l":12.31,"c":13.26},{"t":17,"o":13.26,"h":13.55,"l":13.12,"c":13.22},{"t":18,"o":13.22,"h":13.66,"l":12.37,"c":12.81},{"t":19,"o":12.81,"h":14.09,"l":12.25,"c":13.54},{"t":20,"o":13.54,"h":14.74,"l":13.4,"c":14.21},{"t":21,"o":14.21,"h":14.46,"l":14.13,"c":14.34},{"t":22,"o":14.34,"h":14.37,"l":14.01,"c":14.15},{"t":23,"o":14.15,"h":15.53,"l":13.99,"c":15.18},{"t":24,"o":15.18,"h":15.3,"l":15.03,"c":15.07},{"t":25,"o":15.07,"h":15.35,"l":14.84,"c":15.27},{"t":26,"o":15.27,"h":15.46,"l":15.24,"c":15.4},{"t":27,"o":15.4,"h":15.66,"l":15.22,"c":15.5},{"t":28,"o":15.5,"h":15.71,"l":15.15,"c":15.37},{"t":29,"o":15.37,"h":15.92,"l":12.77,"c":13.13},{"t":30,"o":13.13,"h":13.18,"l":13.11,"c":13.17},{"t":31,"o":13.17,"h":13.74,"l":13.04,"c":13.61},{"t":32,"o":13.61,"h":14.6,"l":13.35,"c":14.18},{"t":33,"o":14.18,"h":14.77,"l":13.47,"c":13.97},{"t":34,"o":13.97,"h":14.47,"l":13.65,"c":14.27},{"t":35,"o":14.27,"h":14.47,"l":14.18,"c":14.4},{"t":36,"o":14.4,"h":15.95,"l":13.93,"c":15.46},{"t":37,"o":15.46,"h":16.38,"l":12.91,"c":13.48},{"t":38,"o":13.48,"h":14.16,"l":11.69,"c":12.15},{"t":39,"o":12.15,"h":12.44,"l":11.94,"c":12.39},{"t":40,"o":12.39,"h":13.04,"l":10.89,"c":11.26},{"t":41,"o":11.26,"h":11.96,"l":11.18,"c":11.69},{"t":42,"o":11.69,"h":12.15,"l":10.62,"c":10.9},{"t":43,"o":10.9,"h":12.72,"l":10.74,"c":12.09},{"t":44,"o":12.09,"h":12.42,"l":11.01,"c":11.4},{"t":45,"o":11.4,"h":11.64,"l":10.81,"c":11.04},{"t":46,"o":11.04,"h":11.74,"l":9.06,"c":9.8},{"t":47,"o":9.8,"h":10.79,"l":9.46,"c":10.39},{"t":48,"o":10.39,"h":10.91,"l":9.31,"c":9.43},{"t":49,"o":9.43,"h":10.76,"l":8.9,"c":10.32},{"t":50,"o":10.32,"h":10.4,"l":9.96,"c":10.19},{"t":51,"o":10.19,"h":10.52,"l":8.98,"c":9.35},{"t":52,"o":9.35,"h":9.99,"l":7.04,"c":7.82},{"t":53,"o":7.82,"h":7.96,"l":7.69,"c":7.91},{"t":54,"o":7.91,"h":8.67,"l":7.82,"c":8.48},{"t":55,"o":8.48,"h":8.79,"l":7.67,"c":8.06},{"t":56,"o":8.06,"h":8.83,"l":7.66,"c":8.7},{"t":57,"o":8.7,"h":9.63,"l":8.58,"c":9.33},{"t":58,"o":9.33,"h":9.47,"l":9.05,"c":9.17},{"t":59,"o":9.17,"h":10.48,"l":8.75,"c":10.22},{"t":60,"o":10.22,"h":10.91,"l":9.99,"c":10.59},{"t":61,"o":10.59,"h":11.52,"l":10.38,"c":11.36},{"t":62,"o":11.36,"h":11.68,"l":8.86,"c":9.42},{"t":63,"o":9.42,"h":9.7,"l":9.34,"c":9.58},{"t":64,"o":9.58,"h":10.25,"l":9.49,"c":10.12},{"t":65,"o":10.12,"h":11.68,"l":9.86,"c":11.42},{"t":66,"o":11.42,"h":12.71,"l":11.13,"c":12.26},{"t":67,"o":12.26,"h":12.71,"l":10.65,"c":10.9},{"t":68,"o":10.9,"h":10.96,"l":10.68,"c":10.76},{"t":69,"o":10.76,"h":13.11,"l":9.66,"c":12.33},{"t":70,"o":12.33,"h":13.59,"l":12.07,"c":13.29},{"t":71,"o":13.29,"h":13.42,"l":12.95,"c":13.05},{"t":72,"o":13.05,"h":13.28,"l":12.52,"c":12.67},{"t":73,"o":12.67,"h":12.84,"l":11.83,"c":12.09},{"t":74,"o":12.09,"h":13.55,"l":11.52,"c":12.96},{"t":75,"o":12.96,"h":13.57,"l":12.68,"c":13.43},{"t":76,"o":13.43,"h":13.91,"l":12.21,"c":12.76},{"t":77,"o":12.76,"h":12.86,"l":12.62,"c":12.72},{"t":78,"o":12.72,"h":14.01,"l":12.45,"c":13.68},{"t":79,"o":13.68,"h":14.72,"l":13.03,"c":14.55},{"t":80,"o":14.55,"h":15.47,"l":12.24,"c":13.11},{"t":81,"o":13.11,"h":13.19,"l":13.03,"c":13.15},{"t":82,"o":13.15,"h":13.25,"l":12.87,"c":13.0},{"t":83,"o":13.0,"h":13.71,"l":12.82,"c":13.37},{"t":84,"o":13.37,"h":14.73,"l":12.89,"c":14.38},{"t":85,"o":14.38,"h":14.98,"l":14.26,"c":14.82},{"t":86,"o":14.82,"h":14.85,"l":14.78,"c":14.8},{"t":87,"o":14.8,"h":15.07,"l":14.17,"c":14.29},{"t":88,"o":14.29,"h":14.36,"l":13.95,"c":14.14},{"t":89,"o":14.14,"h":14.39,"l":14.07,"c":14.35},{"t":90,"o":14.35,"h":14.76,"l":13.3,"c":13.5},{"t":91,"o":13.5,"h":13.94,"l":11.92,"c":12.27},{"t":92,"o":12.27,"h":12.79,"l":12.16,"c":12.68},{"t":93,"o":12.68,"h":13.24,"l":10.82,"c":11.3},{"t":94,"o":11.3,"h":11.81,"l":11.23,"c":11.67},{"t":95,"o":11.67,"h":11.83,"l":10.84,"c":11.23}],"fictional":true},{"id":"mai","name":"Maison Aurelle SA","ticker":"MAI","sector":"Luxury","country":"Fictional","desc":"Maison Aurelle designs and sells luxury leather goods, fragrance and watches through its own stores. Customers choose to buy rather than need to, and the company sets its own prices.","support":["It sells through its own stores rather than through wholesalers.","Its brands have been in continuous use for decades.","It reports the highest operating margin of any company in this library."],"risks":["Spending on luxury falls when confidence falls.","A large share of sales comes from a small number of regions.","Its stores are expensive to run and are committed on long leases."],"fin":[["Revenue","9,400","10,100","8,200","12,600","14,300"],["Operating profit","2,350","2,580","1,480","3,650","4,190"],["Net profit","1,690","1,860","1,020","2,640","3,050"],["Total debt","2,100","2,000","2,400","1,900","1,700"],["Cash","1,800","2,100","1,600","3,200","4,100"],["Free cash flow","1,540","1,720","760","2,910","3,340"],["Shares outstanding","106m","106m","106m","105m","105m"]],"div":[["Year 1","4.20"],["Year 2","4.60"],["Year 3","3.80"],["Year 4","6.40"],["Year 5","7.20"]],"icon":"<path d=\"M6 12h20l-2 15H8z\"/><path d=\"M12 12V9a4 4 0 0 1 8 0v3\"/><path d=\"M13 18h6\"/>","colour":"#D89B45","candles":[{"t":0,"o":75.39,"h":88.86,"l":71.92,"c":84.78},{"t":1,"o":84.78,"h":94.0,"l":83.11,"c":90.88},{"t":2,"o":90.88,"h":96.52,"l":89.67,"c":94.77},{"t":3,"o":94.77,"h":97.04,"l":93.42,"c":96.45},{"t":4,"o":96.45,"h":99.73,"l":94.43,"c":96.86},{"t":5,"o":96.86,"h":98.03,"l":89.87,"c":90.82},{"t":6,"o":90.82,"h":92.02,"l":82.59,"c":85.14},{"t":7,"o":85.14,"h":91.32,"l":84.15,"c":89.71},{"t":8,"o":89.71,"h":94.25,"l":88.98,"c":91.95},{"t":9,"o":91.95,"h":95.26,"l":91.42,"c":94.33},{"t":10,"o":94.33,"h":95.06,"l":93.16,"c":93.67},{"t":11,"o":93.67,"h":95.24,"l":90.64,"c":92.16},{"t":12,"o":92.16,"h":96.91,"l":90.38,"c":94.97},{"t":13,"o":94.97,"h":97.67,"l":90.06,"c":90.72},{"t":14,"o":90.72,"h":96.28,"l":88.68,"c":94.42},{"t":15,"o":94.42,"h":96.5,"l":90.05,"c":91.51},{"t":16,"o":91.51,"h":92.27,"l":91.09,"c":92.09},{"t":17,"o":92.09,"h":92.83,"l":91.12,"c":91.71},{"t":18,"o":91.71,"h":94.31,"l":86.66,"c":88.15},{"t":19,"o":88.15,"h":95.07,"l":87.51,"c":93.34},{"t":20,"o":93.34,"h":95.22,"l":88.74,"c":90.46},{"t":21,"o":90.46,"h":92.71,"l":90.05,"c":92.3},{"t":22,"o":92.3,"h":92.77,"l":91.14,"c":92.18},{"t":23,"o":92.18,"h":95.43,"l":91.12,"c":94.55},{"t":24,"o":94.55,"h":94.73,"l":94.22,"c":94.52},{"t":25,"o":94.52,"h":96.62,"l":88.59,"c":90.36},{"t":26,"o":90.36,"h":96.31,"l":88.6,"c":94.08},{"t":27,"o":94.08,"h":95.7,"l":93.01,"c":94.81},{"t":28,"o":94.81,"h":97.06,"l":89.12,"c":92.27},{"t":29,"o":92.27,"h":92.66,"l":90.97,"c":91.22},{"t":30,"o":91.22,"h":91.75,"l":89.19,"c":89.69},{"t":31,"o":89.69,"h":95.53,"l":89.08,"c":93.49},{"t":32,"o":93.49,"h":98.12,"l":91.91,"c":97.12},{"t":33,"o":97.12,"h":100.51,"l":96.43,"c":99.81},{"t":34,"o":99.81,"h":100.12,"l":99.09,"c":99.86},{"t":35,"o":99.86,"h":100.33,"l":94.88,"c":96.5},{"t":36,"o":96.5,"h":101.79,"l":95.64,"c":100.86},{"t":37,"o":100.86,"h":102.26,"l":98.87,"c":100.39},{"t":38,"o":100.39,"h":111.2,"l":97.54,"c":107.79},{"t":39,"o":107.79,"h":108.34,"l":107.03,"c":107.61},{"t":40,"o":107.61,"h":112.4,"l":105.3,"c":109.71},{"t":41,"o":109.71,"h":111.99,"l":108.16,"c":111.58},{"t":42,"o":111.58,"h":116.11,"l":100.62,"c":102.03},{"t":43,"o":102.03,"h":104.62,"l":101.01,"c":103.53},{"t":44,"o":103.53,"h":109.66,"l":100.82,"c":106.9},{"t":45,"o":106.9,"h":120.67,"l":102.84,"c":115.59},{"t":46,"o":115.59,"h":116.79,"l":111.23,"c":112.32},{"t":47,"o":112.32,"h":112.83,"l":110.16,"c":110.74},{"t":48,"o":110.74,"h":113.66,"l":109.55,"c":112.46},{"t":49,"o":112.46,"h":115.16,"l":101.32,"c":104.03},{"t":50,"o":104.03,"h":105.57,"l":97.58,"c":98.71},{"t":51,"o":98.71,"h":107.23,"l":95.8,"c":104.05},{"t":52,"o":104.05,"h":107.14,"l":102.86,"c":106.64},{"t":53,"o":106.64,"h":118.56,"l":103.46,"c":114.51},{"t":54,"o":114.51,"h":117.47,"l":105.96,"c":108.72},{"t":55,"o":108.72,"h":111.09,"l":102.21,"c":103.92},{"t":56,"o":103.92,"h":112.51,"l":102.58,"c":109.45},{"t":57,"o":109.45,"h":116.65,"l":108.85,"c":114.83},{"t":58,"o":114.83,"h":118.71,"l":114.22,"c":117.62},{"t":59,"o":117.62,"h":128.98,"l":113.97,"c":124.51},{"t":60,"o":124.51,"h":130.73,"l":123.11,"c":128.82},{"t":61,"o":128.82,"h":137.99,"l":127.94,"c":133.68},{"t":62,"o":133.68,"h":143.65,"l":112.57,"c":115.58},{"t":63,"o":115.58,"h":116.56,"l":114.69,"c":114.97},{"t":64,"o":114.97,"h":116.92,"l":111.37,"c":112.41},{"t":65,"o":112.41,"h":129.36,"l":110.79,"c":125.93},{"t":66,"o":125.93,"h":133.72,"l":124.22,"c":132.09},{"t":67,"o":132.09,"h":137.08,"l":129.06,"c":134.71},{"t":68,"o":134.71,"h":135.9,"l":132.4,"c":134.05},{"t":69,"o":134.05,"h":137.27,"l":131.56,"c":136.18},{"t":70,"o":136.18,"h":142.25,"l":135.15,"c":140.06},{"t":71,"o":140.06,"h":141.0,"l":135.05,"c":136.54},{"t":72,"o":136.54,"h":145.3,"l":135.64,"c":142.45},{"t":73,"o":142.45,"h":147.22,"l":140.12,"c":146.29},{"t":74,"o":146.29,"h":148.22,"l":140.58,"c":142.38},{"t":75,"o":142.38,"h":159.08,"l":139.84,"c":156.96},{"t":76,"o":156.96,"h":158.3,"l":156.11,"c":158.05},{"t":77,"o":158.05,"h":163.15,"l":157.45,"c":161.72},{"t":78,"o":161.72,"h":167.03,"l":160.73,"c":163.96},{"t":79,"o":163.96,"h":172.69,"l":162.09,"c":170.03},{"t":80,"o":170.03,"h":171.31,"l":163.41,"c":165.26},{"t":81,"o":165.26,"h":177.06,"l":162.67,"c":172.97},{"t":82,"o":172.97,"h":173.42,"l":170.79,"c":171.21},{"t":83,"o":171.21,"h":173.71,"l":165.36,"c":166.5},{"t":84,"o":166.5,"h":173.73,"l":165.53,"c":171.76},{"t":85,"o":171.76,"h":174.24,"l":165.83,"c":166.84},{"t":86,"o":166.84,"h":169.12,"l":164.53,"c":166.12},{"t":87,"o":166.12,"h":172.62,"l":150.55,"c":154.11},{"t":88,"o":154.11,"h":160.38,"l":140.02,"c":141.69},{"t":89,"o":141.69,"h":142.58,"l":137.55,"c":139.69},{"t":90,"o":139.69,"h":145.12,"l":138.93,"c":143.09},{"t":91,"o":143.09,"h":146.74,"l":128.66,"c":132.02},{"t":92,"o":132.02,"h":134.32,"l":125.67,"c":127.36},{"t":93,"o":127.36,"h":132.67,"l":126.52,"c":131.12},{"t":94,"o":131.12,"h":140.64,"l":129.89,"c":136.71},{"t":95,"o":136.71,"h":138.56,"l":132.68,"c":136.06}],"fictional":true},{"id":"hlx","name":"Helixa Health NV","ticker":"HLX","sector":"Healthcare","country":"Fictional","desc":"Helixa develops and sells prescription medicines. Its products take years to develop and are protected for a fixed period, after which other companies may copy them.","support":["Demand for its products does not follow the economy.","It reports several products in late-stage development each year.","Its cash generation has been positive in every year of this period."],"risks":["Protection on its largest product expires within a decade.","Development can fail at a late stage after years of spending.","Prices are set or constrained by health systems rather than freely."],"fin":[["Revenue","12,800","13,200","13,900","14,400","15,100"],["Operating profit","3,180","3,290","3,510","3,620","3,840"],["Net profit","2,410","2,490","2,660","2,740","2,910"],["Total debt","5,600","5,300","5,000","4,700","4,400"],["Cash","2,900","3,200","3,600","4,000","4,500"],["Free cash flow","2,280","2,360","2,540","2,610","2,780"],["Shares outstanding","1.26bn","1.26bn","1.25bn","1.25bn","1.24bn"]],"div":[["Year 1","1.44"],["Year 2","1.50"],["Year 3","1.56"],["Year 4","1.62"],["Year 5","1.68"]],"icon":"<path d=\"M10 4c0 8 12 8 12 16M22 4c0 8-12 8-12 16M10 28c0-4 12-4 12-8\"/>","colour":"#7A9BB5","candles":[{"t":0,"o":48.15,"h":48.31,"l":47.73,"c":48.17},{"t":1,"o":48.17,"h":49.43,"l":45.76,"c":46.11},{"t":2,"o":46.11,"h":46.16,"l":45.87,"c":45.94},{"t":3,"o":45.94,"h":47.01,"l":45.61,"c":46.77},{"t":4,"o":46.77,"h":48.0,"l":46.54,"c":47.32},{"t":5,"o":47.32,"h":47.7,"l":45.86,"c":46.65},{"t":6,"o":46.65,"h":49.09,"l":46.22,"c":48.53},{"t":7,"o":48.53,"h":49.8,"l":48.04,"c":49.58},{"t":8,"o":49.58,"h":49.66,"l":49.49,"c":49.56},{"t":9,"o":49.56,"h":49.58,"l":49.42,"c":49.46},{"t":10,"o":49.46,"h":50.44,"l":47.69,"c":48.1},{"t":11,"o":48.1,"h":48.52,"l":45.53,"c":46.31},{"t":12,"o":46.31,"h":47.0,"l":45.73,"c":46.64},{"t":13,"o":46.64,"h":47.41,"l":42.89,"c":44.33},{"t":14,"o":44.33,"h":44.43,"l":44.14,"c":44.19},{"t":15,"o":44.19,"h":45.4,"l":43.67,"c":45.12},{"t":16,"o":45.12,"h":45.19,"l":44.94,"c":45.02},{"t":17,"o":45.02,"h":45.3,"l":44.94,"c":45.08},{"t":18,"o":45.08,"h":50.31,"l":44.58,"c":48.48},{"t":19,"o":48.48,"h":50.95,"l":47.87,"c":50.1},{"t":20,"o":50.1,"h":52.0,"l":49.52,"c":51.7},{"t":21,"o":51.7,"h":52.83,"l":51.44,"c":52.57},{"t":22,"o":52.57,"h":53.5,"l":52.19,"c":53.18},{"t":23,"o":53.18,"h":57.07,"l":52.68,"c":55.92},{"t":24,"o":55.92,"h":56.52,"l":53.05,"c":53.81},{"t":25,"o":53.81,"h":54.1,"l":53.13,"c":53.31},{"t":26,"o":53.31,"h":56.29,"l":52.86,"c":55.58},{"t":27,"o":55.58,"h":56.77,"l":53.04,"c":54.15},{"t":28,"o":54.15,"h":55.49,"l":53.93,"c":55.21},{"t":29,"o":55.21,"h":57.73,"l":54.39,"c":57.25},{"t":30,"o":57.25,"h":58.37,"l":56.92,"c":58.09},{"t":31,"o":58.09,"h":59.61,"l":54.9,"c":55.88},{"t":32,"o":55.88,"h":56.05,"l":55.4,"c":55.56},{"t":33,"o":55.56,"h":57.99,"l":55.31,"c":57.44},{"t":34,"o":57.44,"h":58.03,"l":57.01,"c":57.78},{"t":35,"o":57.78,"h":57.96,"l":57.2,"c":57.3},{"t":36,"o":57.3,"h":58.24,"l":55.24,"c":55.81},{"t":37,"o":55.81,"h":56.84,"l":55.61,"c":56.47},{"t":38,"o":56.47,"h":57.52,"l":55.61,"c":57.05},{"t":39,"o":57.05,"h":60.2,"l":56.65,"c":59.25},{"t":40,"o":59.25,"h":59.66,"l":58.79,"c":59.07},{"t":41,"o":59.07,"h":59.75,"l":57.45,"c":58.06},{"t":42,"o":58.06,"h":60.63,"l":57.33,"c":59.93},{"t":43,"o":59.93,"h":60.68,"l":59.81,"c":60.48},{"t":44,"o":60.48,"h":60.55,"l":60.31,"c":60.38},{"t":45,"o":60.38,"h":61.61,"l":56.49,"c":58.02},{"t":46,"o":58.02,"h":64.21,"l":55.11,"c":62.21},{"t":47,"o":62.21,"h":63.82,"l":61.91,"c":63.28},{"t":48,"o":63.28,"h":64.21,"l":62.66,"c":63.92},{"t":49,"o":63.92,"h":65.77,"l":63.62,"c":65.2},{"t":50,"o":65.2,"h":66.37,"l":62.15,"c":63.05},{"t":51,"o":63.05,"h":63.38,"l":62.77,"c":63.16},{"t":52,"o":63.16,"h":67.28,"l":62.46,"c":65.98},{"t":53,"o":65.98,"h":67.61,"l":65.49,"c":67.17},{"t":54,"o":67.17,"h":68.76,"l":63.41,"c":64.44},{"t":55,"o":64.44,"h":69.99,"l":62.62,"c":68.54},{"t":56,"o":68.54,"h":72.98,"l":67.72,"c":71.86},{"t":57,"o":71.86,"h":72.44,"l":71.64,"c":72.24},{"t":58,"o":72.24,"h":74.55,"l":71.35,"c":74.03},{"t":59,"o":74.03,"h":75.05,"l":73.75,"c":74.88},{"t":60,"o":74.88,"h":78.6,"l":73.64,"c":77.64},{"t":61,"o":77.64,"h":81.0,"l":76.22,"c":79.44},{"t":62,"o":79.44,"h":79.96,"l":76.99,"c":77.85},{"t":63,"o":77.85,"h":78.34,"l":77.58,"c":78.05},{"t":64,"o":78.05,"h":79.92,"l":77.26,"c":79.11},{"t":65,"o":79.11,"h":79.67,"l":77.25,"c":77.75},{"t":66,"o":77.75,"h":77.83,"l":77.5,"c":77.56},{"t":67,"o":77.56,"h":79.78,"l":77.09,"c":79.32},{"t":68,"o":79.32,"h":83.7,"l":77.73,"c":82.07},{"t":69,"o":82.07,"h":83.81,"l":81.37,"c":82.67},{"t":70,"o":82.67,"h":83.7,"l":78.45,"c":80.32},{"t":71,"o":80.32,"h":81.04,"l":79.29,"c":79.61},{"t":72,"o":79.61,"h":81.6,"l":78.63,"c":81.0},{"t":73,"o":81.0,"h":83.52,"l":80.03,"c":82.98},{"t":74,"o":82.98,"h":84.53,"l":81.86,"c":83.84},{"t":75,"o":83.84,"h":93.88,"l":81.83,"c":90.28},{"t":76,"o":90.28,"h":92.12,"l":89.48,"c":90.81},{"t":77,"o":90.81,"h":91.86,"l":88.12,"c":89.52},{"t":78,"o":89.52,"h":90.91,"l":86.05,"c":86.79},{"t":79,"o":86.79,"h":87.53,"l":84.83,"c":85.38},{"t":80,"o":85.38,"h":88.68,"l":84.87,"c":88.06},{"t":81,"o":88.06,"h":89.75,"l":87.3,"c":89.24},{"t":82,"o":89.24,"h":90.45,"l":87.68,"c":88.77},{"t":83,"o":88.77,"h":90.13,"l":86.11,"c":87.34},{"t":84,"o":87.34,"h":90.15,"l":79.66,"c":81.88},{"t":85,"o":81.88,"h":87.83,"l":81.36,"c":85.61},{"t":86,"o":85.61,"h":87.9,"l":85.3,"c":86.82},{"t":87,"o":86.82,"h":89.39,"l":85.96,"c":88.42},{"t":88,"o":88.42,"h":90.37,"l":82.91,"c":84.56},{"t":89,"o":84.56,"h":85.22,"l":80.85,"c":81.35},{"t":90,"o":81.35,"h":82.23,"l":79.26,"c":79.5},{"t":91,"o":79.5,"h":80.69,"l":71.14,"c":72.38},{"t":92,"o":72.38,"h":72.6,"l":72.28,"c":72.54},{"t":93,"o":72.54,"h":73.43,"l":71.94,"c":73.18},{"t":94,"o":73.18,"h":73.97,"l":71.46,"c":72.16},{"t":95,"o":72.16,"h":72.96,"l":71.71,"c":72.77}],"fictional":true}],"events":[{"stage":1,"items":[{"co":"LUM","label":"Results","text":"Lumina reported higher licensing income and said orders from its two largest customers had increased."},{"co":"AXL","label":"Results","text":"Axle reported lower vehicle sales and said it would spend more on new models over the following three years."},{"co":"","label":"Economy","text":"Borrowing costs rose across the fictional economy for the first time in several years."}]},{"stage":2,"items":[{"co":"MRD","label":"Results","text":"Meridian reported higher sales and lower profit, and said delivery had cost more to run than expected."},{"co":"MAI","label":"Dividend","text":"Maison Aurelle increased its dividend and opened stores in two new regions."},{"co":"","label":"Economy","text":"Confidence weakened and several fictional companies withdrew their guidance for the year."}]},{"stage":3,"items":[{"co":"","label":"Economy","text":"A sharp and sudden fall affected almost every company in the library within the same two months."},{"co":"AXL","label":"Results","text":"Axle reported a loss for the year and suspended its dividend."},{"co":"HLX","label":"Results","text":"Helixa reported results in line with the previous year and continued to pay its dividend."}]},{"stage":4,"items":[{"co":"LUM","label":"Results","text":"Lumina reported its highest revenue in the period and said its order book had lengthened."},{"co":"MAI","label":"Results","text":"Maison Aurelle reported a sharp recovery in sales and restored its dividend to above its earlier level."},{"co":"MRD","label":"Results","text":"Meridian reported lower profit than the previous year despite higher sales."}]},{"stage":5,"items":[{"co":"","label":"Economy","text":"Borrowing costs rose sharply and companies whose value rested on future growth were affected most."},{"co":"VRD","label":"Results","text":"Verdant reported higher revenue and said ingredient costs had risen faster than its prices."},{"co":"HLX","label":"Results","text":"Helixa raised its dividend for the fifth consecutive year."}]}]};
var COCUR = DATA.meta.currencySymbol;
var CO = {}; DATA.companies.forEach(function(c){ CO[c.id] = c; });
var MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
var EX_START = DATA.meta.exerciseStart, DECISION_T = DATA.meta.decisionIndex;
function periodLabel(t){
  return t < EX_START
    ? "Research Y" + (Math.floor(t / 12) + 1) + " " + MONTHS[t % 12]
    : "Exercise Y" + (Math.floor((t - EX_START) / 12) + 1) + " " + MONTHS[(t - EX_START) % 12];
}
/* Wealth in Action has no company-exercise period of its own, so research
   history is all that is ever shown here: revealedTo() always stops at the
   virtual decision date. */
function exerciseStarted(){ return false; }
function revealedTo(){ return DECISION_T; }
var COMPANY_DISCLAIMER = "A safe space to practise with fictional companies and virtual money, and build your confidence.";

var RIBBON_SCREENS = ["library","lesson","profile","allocate","review","reasons","event"];
var ribbonPaused = false, ribbonStageShown = null;
try { ribbonPaused = sessionStorage.getItem("cil.ribbonPaused") === "1"; } catch(e){}

/* the period the ribbon is showing: stage 0 before the market chapter, otherwise the stage end */
function ribbonT(){
  if (!exerciseStarted()) return DECISION_T;
  return app.screen === "stage" ? stageEnd(app.stage)
                                : (app.stage > 1 ? stageEnd(app.stage - 1) : DECISION_T);
}
function ribbonPrevT(){
  var t = ribbonT();
  if (t === DECISION_T) return DECISION_T;
  var stages = DATA.meta.stages;
  for (var i = stages.length - 1; i >= 0; i--) if (stages[i].to === t) return stages[i].from;
  return DECISION_T;
}
function ribbonRow(c){
  var t = ribbonT(), p = ribbonPrevT();
  var px = c.candles[t].c;
  /* Before the market chapter begins there is no previous stage, so the change
     shown is within the opening period itself, from its open to its close.
     Nothing from a later period is used. */
  var base = (t === p) ? c.candles[t].o : c.candles[p].c;
  var ch = px - base;
  var pc = base === 0 ? 0 : (ch / base) * 100;
  var dir = ch > 0.0049 ? "up" : (ch < -0.0049 ? "down" : "flat");
  return { id:c.id, ticker:c.ticker, name:c.name, price:px, change:ch, pct:pc, dir:dir, t:t };
}
function ribbonItemHTML(r){
  var arrow = r.dir === "up" ? "\u2191" : r.dir === "down" ? "\u2193" : "\u2192";
  var cls = r.dir === "up" ? "up" : r.dir === "down" ? "dn" : "fl";
  var word = r.dir === "up" ? "up" : r.dir === "down" ? "down" : "unchanged";
  var sign = r.change > 0 ? "+" : r.change < 0 ? "\u2212" : "";
  var label = CO[r.id].name + ", fictional company. Synthetic price " + COCUR + r.price.toFixed(2) + ", " +
    (r.dir === "flat" ? "unchanged" : word + " " + Math.abs(r.pct).toFixed(2) + " per cent") +
    " in the current simulated period. Opens this company's fictional profile.";
  return '<button class="item" data-ribbon="' + r.id + '" aria-label="' + label + '">' +
    '<span class="tk">' + r.ticker + '</span>' +
    '<span class="nm">' + r.name.split(" ")[0] + '</span>' +
    '<span class="sep" aria-hidden="true">|</span>' +
    '<span class="px">' + COCUR + r.price.toFixed(2) + '</span>' +
    '<span class="sep" aria-hidden="true">|</span>' +
    '<span class="ch ' + cls + '"><span aria-hidden="true">' + arrow + '</span> ' + sign +
      Math.abs(r.pct).toFixed(2) + '%</span></button>';
}
/* Whether the ribbon runs as a continuous marquee. One pure function, so the
   behaviour can be asserted for every environment without needing that device.
   Touch and narrow viewports are ALWAYS a manual swipe lane, including while the
   review override is on, because auto-scrolling under a thumb is exactly what the
   mobile corrections removed. */
function laneMovesFor(env){
  if (env.coarse || env.narrow) return false;
  if (env.override) return true;
  return !env.systemReduced;
}
function currentEnv(){
  var mm = window.matchMedia;
  return {
    coarse: !!(mm && mm("(pointer: coarse)").matches),
    narrow: !!(mm && mm("(max-width: 767px)").matches),
    systemReduced: systemReduced(),
    override: FORCE_MOTION
  };
}
function laneMoves(){ return laneMovesFor(currentEnv()); }
function renderRibbon(force){
  var el = shadowRoot.getElementById("ribbon"), why = shadowRoot.getElementById("ribbonWhyPanel");
  var show = RIBBON_SCREENS.indexOf(app.screen) >= 0;
  el.classList.toggle("hidden", !show);
  if (!show){ why.classList.add("hidden"); return; }
  var t = ribbonT();
  if (!force && ribbonStageShown === t) return;
  var rows = DATA.companies.map(ribbonRow);
  var lane = shadowRoot.getElementById("rlane");
  var once = rows.map(ribbonItemHTML).join("");
  var html = laneMoves() ? once + once : once;
  /* the pause control exists only where something moves */
  var tog = shadowRoot.getElementById("ribbonToggle");
  tog.classList.toggle("hidden", !laneMoves());
  if (ribbonStageShown !== null && !reduced()){
    lane.style.opacity = "0";
    setTimeout(function(){ lane.innerHTML = html; lane.style.opacity = "1"; wireRibbon(); }, 220);
  } else {
    lane.innerHTML = html;
    wireRibbon();
  }
  ribbonStageShown = t;
  shadowRoot.getElementById("ribbonSummary").textContent =
    "Fictional market ribbon, synthetic prices for the current simulated period. " +
    rows.map(function(r){
      return CO[r.id].name + " " + COCUR + r.price.toFixed(2) + ", " +
        (r.dir === "flat" ? "unchanged" : (r.dir === "up" ? "up " : "down ") + Math.abs(r.pct).toFixed(2) + " per cent");
    }).join(". ") + ".";
  el.classList.toggle("paused", ribbonPaused);
}
function wireRibbon(){
  shadowRoot.querySelectorAll("[data-ribbon]").forEach(function(b){
    b.addEventListener("click", function(){ openProfile(b.dataset.ribbon); });
  });
}
window.addEventListener("resize", function(){ renderRibbon(true); }, { passive:true });
shadowRoot.getElementById("ribbonToggle").addEventListener("click", function(){
  ribbonPaused = !ribbonPaused;
  try { sessionStorage.setItem("cil.ribbonPaused", ribbonPaused ? "1" : "0"); } catch(e){}
  shadowRoot.getElementById("ribbon").classList.toggle("paused", ribbonPaused);
  this.textContent = ribbonPaused ? "Play ticker" : "Pause ticker";
  this.setAttribute("aria-pressed", ribbonPaused ? "true" : "false");
});
shadowRoot.getElementById("ribbonWhy").addEventListener("click", function(){
  var p = shadowRoot.getElementById("ribbonWhyPanel");
  var open = p.classList.toggle("hidden") === false;
  this.setAttribute("aria-expanded", open ? "true" : "false");
});

function chartHTML(co, fromT, toT, idPrefix){
  var mode = app.chartAlt[co.id] || "candles";
  return '' +
   '<div class="segbtns" role="group" aria-label="Chart view">' +
     '<button data-view="candles" data-co="' + co.id + '" aria-pressed="' + (mode==="candles") + '">Candlesticks</button>' +
     '<button data-view="line" data-co="' + co.id + '" aria-pressed="' + (mode==="line") + '">Line</button>' +
     '<button data-view="table" data-co="' + co.id + '" aria-pressed="' + (mode==="table") + '">Table</button>' +
   '</div>' +
   '<div id="' + idPrefix + '-view"></div>' +
   '<p class="chartmeta">' + co.name + ' (' + co.ticker + ') · ' + DATA.meta.exchange +
     ' · quoted in ' + DATA.meta.currency + ' · ' + DATA.meta.interval + ' candles · ' +
     periodLabel(fromT) + ' to ' + periodLabel(toT) + '<br>' + boundaryText(fromT, toT) +
     '<br>' + DATA.meta.priceBasis + '</p>';
}
var chartState = {};
/* Spoken and written description of the research and exercise boundary */
function boundaryText(fromT, toT){
  if (fromT >= EX_START) return "All periods shown are within the virtual exercise.";
  if (toT < EX_START) return "All periods shown are research history, up to the virtual decision date.";
  return "The chart is divided at the virtual decision date: periods up to " + periodLabel(DECISION_T) +
    " are " + DATA.meta.researchLabel.toLowerCase() + ", and periods from " + periodLabel(EX_START) +
    " onwards are the " + DATA.meta.exerciseLabel.toLowerCase() + ".";
}
function drawChart(co, fromT, toT, idPrefix){
  var host = shadowRoot.getElementById(idPrefix + "-view");
  if (!host) return;
  var mode = app.chartAlt[co.id] || "candles";
  var ks = co.candles.slice(fromT, toT + 1);
  if (mode === "table"){ host.innerHTML = chartTable(co, ks); return; }
  chartState[idPrefix] = { co:co, ks:ks, sel:ks.length - 1, idPrefix:idPrefix, mode:mode };
  host.innerHTML =
    '<div class="chartwrap"><svg class="chart" id="' + idPrefix + '-svg" viewBox="0 0 720 300" tabindex="0" role="img" ' +
    'aria-label="' + (mode === "line" ? "Line chart of closing prices" : "Candlestick chart") + ' for ' + co.name +
    ', ' + ks.length + ' ' + DATA.meta.interval.toLowerCase() + ' periods from ' + periodLabel(fromT) + ' to ' + periodLabel(toT) +
    '. ' + boundaryText(fromT, toT) +
    ' Use left and right arrow keys to move between periods." aria-describedby="' + idPrefix + '-readout"></svg></div>' +
    '<div class="readout" id="' + idPrefix + '-readout" role="status" aria-live="polite"></div>';
  paintChart(idPrefix);
  var svg = shadowRoot.getElementById(idPrefix + "-svg");
  svg.addEventListener("keydown", function(e){
    var st = chartState[idPrefix], n = st.ks.length;
    var k = e.key, moved = true;
    if (k === "ArrowRight") st.sel = Math.min(n - 1, st.sel + 1);
    else if (k === "ArrowLeft") st.sel = Math.max(0, st.sel - 1);
    else if (k === "Home") st.sel = 0;
    else if (k === "End") st.sel = n - 1;
    else moved = false;
    if (moved){ e.preventDefault(); paintChart(idPrefix); }
  });
  function pick(clientX){
    var st = chartState[idPrefix], r = svg.getBoundingClientRect();
    var x = (clientX - r.left) / r.width * 720;
    var i = Math.round((x - 46) / ((720 - 66) / Math.max(1, st.ks.length - 1)));
    st.sel = Math.max(0, Math.min(st.ks.length - 1, i));
    paintChart(idPrefix);
  }
  svg.addEventListener("pointermove", function(e){ if (e.pointerType === "mouse") pick(e.clientX); });
  svg.addEventListener("pointerdown", function(e){ pick(e.clientX); svg.focus(); });
}
function paintChart(idPrefix){
  var st = chartState[idPrefix]; if (!st) return;
  var ks = st.ks, W = 720, H = 300, padL = 46, padR = 20, padT = 16, padB = 32;
  var lo = Math.min.apply(null, ks.map(function(k){ return k.l; }));
  var hi = Math.max.apply(null, ks.map(function(k){ return k.h; }));
  var pad = (hi - lo) * 0.08; lo -= pad; hi += pad;
  var x = function(i){ return padL + i * (W - padL - padR) / Math.max(1, ks.length - 1); };
  var y = function(v){ return H - padB - (v - lo) / (hi - lo) * (H - padT - padB); };
  var s = '';
  s += '<line class="axis" x1="' + padL + '" y1="' + (H - padB) + '" x2="' + (W - padR) + '" y2="' + (H - padB) + '"/>';
  for (var g = 0; g <= 3; g++){
    var v = lo + (hi - lo) * g / 3, yy = y(v);
    s += '<line class="axis" x1="' + padL + '" y1="' + yy + '" x2="' + (W - padR) + '" y2="' + yy + '" style="opacity:.35"/>';
    s += '<text class="axlab" x="4" y="' + (yy + 4) + '">' + COCUR + v.toFixed(0) + '</text>';
  }
  var step = (W - padL - padR) / Math.max(1, ks.length - 1);
  var bw = Math.max(3, Math.min(14, step * 0.62));
  if (st.mode === "line"){
    s += '<polyline points="' + ks.map(function(k,i){ return x(i) + "," + y(k.c); }).join(" ") +
         '" fill="none" stroke="#FF4F9A" stroke-width="2" stroke-linejoin="round"/>';
  } else {
    ks.forEach(function(k, i){
      var up = k.c >= k.o, cx = x(i);
      s += '<line class="wick ' + (up ? "wick-up" : "wick-dn") + '" x1="' + cx + '" y1="' + y(k.h) + '" x2="' + cx + '" y2="' + y(k.l) + '"/>';
      var top = y(Math.max(k.o, k.c)), bot = y(Math.min(k.o, k.c));
      var h = Math.max(1.5, bot - top);
      s += '<rect class="' + (up ? "candle-up" : "candle-dn") + '" x="' + (cx - bw/2) + '" y="' + top + '" width="' + bw + '" height="' + h + '" rx="1"/>';
    });
  }
  /* labelled boundary at the virtual decision date, drawn with a line and words, never colour alone */
  var bIdx = -1;
  for (var bi = 0; bi < ks.length; bi++) if (ks[bi].t === EX_START){ bIdx = bi; break; }
  if (bIdx > 0){
    var bx = x(bIdx) - step / 2;
    s += '<line x1="' + bx + '" y1="' + padT + '" x2="' + bx + '" y2="' + (H - padB) + '" stroke="#FF4F9A" stroke-width="1.5" stroke-dasharray="5 4"/>';
    s += '<text class="axlab" x="' + (bx - 6) + '" y="' + (padT + 11) + '" text-anchor="end" fill="#E8E4E1">' + DATA.meta.researchLabel + '</text>';
    s += '<text class="axlab" x="' + (bx + 6) + '" y="' + (padT + 11) + '" fill="#FF4F9A">' + DATA.meta.exerciseLabel + '</text>';
  }
  var sk = ks[st.sel], sx = x(st.sel);
  s += '<line class="sel" x1="' + sx + '" y1="' + padT + '" x2="' + sx + '" y2="' + (H - padB) + '" style="opacity:.5"/>';
  s += '<rect class="sel" x="' + (sx - bw/2 - 3) + '" y="' + (y(sk.h) - 3) + '" width="' + (bw + 6) + '" height="' + (y(sk.l) - y(sk.h) + 6) + '" rx="3"/>';
  var lab = [0, Math.floor(ks.length/2), ks.length - 1];
  lab.forEach(function(i){
    s += '<text class="axlab" x="' + x(i) + '" y="' + (H - 10) + '" text-anchor="middle">' + periodLabel(ks[i].t) + '</text>';
  });
  shadowRoot.getElementById(idPrefix + "-svg").innerHTML = s;
  var ch = sk.c - sk.o, up2 = ch >= 0;
  var pc = (ch / sk.o * 100).toFixed(1);
  shadowRoot.getElementById(idPrefix + "-readout").innerHTML =
    '<div><span class="k">Period</span><br><span class="v">' + periodLabel(sk.t) + '</span></div>' +
    '<div><span class="k">Open</span><br><span class="v">' + COCUR + sk.o.toFixed(2) + '</span></div>' +
    '<div><span class="k">High</span><br><span class="v">' + COCUR + sk.h.toFixed(2) + '</span></div>' +
    '<div><span class="k">Low</span><br><span class="v">' + COCUR + sk.l.toFixed(2) + '</span></div>' +
    '<div><span class="k">Close</span><br><span class="v">' + COCUR + sk.c.toFixed(2) + '</span></div>' +
    '<div style="grid-column:1/-1"><span class="k">Change over this period</span><br><span class="v">' +
      '<span aria-hidden="true">' + (up2 ? "\u2191" : "\u2193") + '</span> ' + (up2 ? "up " : "down ") +
      Math.abs(ch).toFixed(2) + " " + DATA.meta.currency + ", " + (up2 ? "up " : "down ") + Math.abs(pc) + ' per cent</span></div>';
}
function chartTable(co, ks){
  var spans = ks.length && ks[0].t < EX_START && ks[ks.length-1].t >= EX_START;
  return '<div class="tblscroll"><table><caption>Every period for ' + co.name + ' (' + co.ticker + '), ' +
   DATA.meta.interval.toLowerCase() + ' candles, prices in ' + DATA.meta.currency + '. ' +
   boundaryText(ks[0].t, ks[ks.length-1].t) +
   '</caption><thead><tr><th scope="col">Period</th><th scope="col">Part</th><th scope="col" class="n">Open</th><th scope="col" class="n">High</th>' +
   '<th scope="col" class="n">Low</th><th scope="col" class="n">Close</th><th scope="col" class="n">Change</th></tr></thead><tbody>' +
   ks.map(function(k){
     var ch = k.c - k.o, up = ch >= 0;
     var part = k.t < EX_START ? DATA.meta.researchLabel : DATA.meta.exerciseLabel;
     var mark = (spans && k.t === EX_START)
       ? ' style="border-top:2px solid var(--pink)"' : '';
     return '<tr' + mark + '><th scope="row">' + periodLabel(k.t) + '</th><td>' + part + '</td><td class="n">' + k.o.toFixed(2) + '</td><td class="n">' +
      k.h.toFixed(2) + '</td><td class="n">' + k.l.toFixed(2) + '</td><td class="n">' + k.c.toFixed(2) + '</td>' +
      '<td class="n">' + (up ? "up " : "down ") + Math.abs(ch).toFixed(2) + '</td></tr>';
   }).join("") + '</tbody></table></div>';
}
shadowRoot.addEventListener("click", function(e){
  var b = e.target.closest && e.target.closest("[data-view]");
  if (!b) return;
  app.chartAlt[b.dataset.co] = b.dataset.view; save();
  var wrap = b.parentNode;
  wrap.querySelectorAll("[data-view]").forEach(function(x){ x.setAttribute("aria-pressed", x.dataset.view === b.dataset.view); });
  var prefix = wrap.nextElementSibling.id.replace("-view","");
  var st = chartRanges[prefix];
  drawChart(CO[b.dataset.co], st.from, st.to, prefix);
});
var chartRanges = {};
function mountChart(co, fromT, toT, prefix, host){
  chartRanges[prefix] = { from:fromT, to:toT };
  host.innerHTML = chartHTML(co, fromT, toT, prefix);
  drawChart(co, fromT, toT, prefix);
}

/* ============================================================
   SCREENS
   ============================================================ */

function orb(co, small){
  return '<span class="orb' + (small ? " sm" : "") + '" style="background:' + co.colour + '22;color:' + co.colour +
   '" aria-hidden="true"><svg viewBox="0 0 32 32">' + co.icon + '</svg></span>';
}
function coDisc(el){
  shadowRoot.getElementById(el).innerHTML =
    COMPANY_DISCLAIMER + "<br><br>Historical performance describes what happened in the past. Simulated performance shows what happened under an invented or modelled set of assumptions. Neither predicts future results.";
}


function renderLibrary(){
  shadowRoot.getElementById("libIntro").textContent =
    "Six fictional businesses, all quoted in the same currency so that nothing has to be converted. Each card opens a full profile.";
  shadowRoot.getElementById("libCards").innerHTML = DATA.companies.map(function(c){
    var op = app.opened.indexOf(c.id) >= 0;
    var f = c.candles[0].c, l = c.candles[DECISION_T].c;
    return '<button class="ccard' + (op ? " opened" : "") + '" onclick="window.__wia1.openProfile(\'' + c.id + '\')">' +
      '<div class="top">' + orb(c) + '<div><span class="nm">' + c.name + '</span>' +
      '<span class="tick">' + c.ticker + ' · ' + DATA.meta.exchange + ' · ' + DATA.meta.currency + '</span></div></div>' +
      '<div class="pillrow"><span class="pill">' + c.sector + '</span>' +
      '<span class="pill">' + (op ? "Opened" : "Not opened yet") + '</span></div>' +
      '<p class="sm" style="margin:10px 0 0">' + c.desc.split(".")[0] + '.</p></button>';
  }).join("");
  var n = app.opened.length, all = n === DATA.companies.length;
  var b = shadowRoot.getElementById("libNext");
  b.setAttribute("aria-disabled", all ? "false" : "true");
  shadowRoot.getElementById("libHelper").textContent = all
    ? "You have opened all six profiles."
    : "You have opened " + n + " of " + DATA.companies.length + " profiles. Open them all to continue.";
  coDisc("libDisc");
}
shadowRoot.getElementById("libNext").addEventListener("click", function(){
  if (this.getAttribute("aria-disabled") === "true") return;
  go("lesson");
});

/* ---------- 3. candlestick lesson ---------- */
var LESSON = [
  ["open","Opening price","Where the price started at the beginning of this period."],
  ["close","Closing price","Where it finished at the end of this period. These two form the body of the candle."],
  ["body","The body","The distance between the opening and closing price. A tall body means the price finished a long way from where it started."],
  ["high","Highest price","The highest the price reached at any point during the period, shown by the line above the body."],
  ["low","Lowest price","The lowest it reached, shown by the line below. These two lines are called wicks."],
  ["dir","Up or down period","If it finished higher than it started the candle is drawn hollow, and if it finished lower it is drawn solid. Both are ordinary. Neither is good or bad in itself."]
];
function renderLesson(){
  shadowRoot.getElementById("lessonParts").innerHTML = LESSON.map(function(p){
    return '<button data-part="' + p[0] + '" aria-pressed="' + (app.lessonParts.indexOf(p[0]) >= 0) + '">' + p[1] + '</button>';
  }).join("");
  shadowRoot.getElementById("lessonParts").querySelectorAll("[data-part]").forEach(function(b){
    b.addEventListener("click", function(){
      var id = b.dataset.part;
      if (app.lessonParts.indexOf(id) < 0) app.lessonParts.push(id);
      save();
      b.setAttribute("aria-pressed","true");
      var p = LESSON.filter(function(x){ return x[0] === id; })[0];
      shadowRoot.getElementById("lessonCopy").innerHTML =
        '<p class="kicker" style="margin:0 0 6px">' + p[1] + '</p><p class="sm" style="margin:0">' + p[2] + '</p>';
      paintLesson(id);
      lessonGate();
    });
  });
  paintLesson(null); paintPair(); lessonGate();
}
function paintLesson(active){
  var o = 200, c = 110, hi = 70, lo = 250, x = 130, w = 54;
  function hl(part, on){ return active === part ? "#FF4F9A" : on; }
  var s = '';
  s += '<line x1="' + x + '" y1="' + hi + '" x2="' + x + '" y2="' + o + '" stroke="' + hl("high","#8FD3B4") + '" stroke-width="3"/>';
  s += '<line x1="' + x + '" y1="' + c + '" x2="' + x + '" y2="' + lo + '" stroke="' + hl("low","#8FD3B4") + '" stroke-width="3"/>';
  s += '<rect x="' + (x - w/2) + '" y="' + c + '" width="' + w + '" height="' + (o - c) + '" fill="none" stroke="' +
       hl("body", hl("dir","#8FD3B4")) + '" stroke-width="3" rx="2"/>';
  function tag(px, py, txt, part){
    var on = active === part;
    return '<line x1="' + px + '" y1="' + py + '" x2="' + (x + w/2 + 6) + '" y2="' + py + '" stroke="' + (on ? "#FF4F9A" : "rgba(250,247,242,.4)") + '" stroke-width="1.5"/>' +
      '<text x="' + (px - 6) + '" y="' + (py + 4) + '" text-anchor="end" fill="' + (on ? "#FF4F9A" : "#E8E4E1") +
      '" font-family="Inter,sans-serif" font-size="12">' + txt + '</text>';
  }
  s = '<g>' + s + '</g>';
  var svg = shadowRoot.getElementById("lessonSvg");
  var labels = '' +
    '<text x="248" y="' + (hi + 4) + '" text-anchor="end" fill="' + (active==="high"?"#FF4F9A":"#E8E4E1") + '" font-family="Inter,sans-serif" font-size="12">Highest</text>' +
    '<text x="248" y="' + (c + 4) + '" text-anchor="end" fill="' + (active==="close"?"#FF4F9A":"#E8E4E1") + '" font-family="Inter,sans-serif" font-size="12">Close</text>' +
    '<text x="248" y="' + (o + 4) + '" text-anchor="end" fill="' + (active==="open"?"#FF4F9A":"#E8E4E1") + '" font-family="Inter,sans-serif" font-size="12">Open</text>' +
    '<text x="248" y="' + (lo + 4) + '" text-anchor="end" fill="' + (active==="low"?"#FF4F9A":"#E8E4E1") + '" font-family="Inter,sans-serif" font-size="12">Lowest</text>' +
    '<text x="20" y="' + ((c + o)/2 + 4) + '" fill="' + (active==="body"?"#FF4F9A":"#E8E4E1") + '" font-family="Inter,sans-serif" font-size="12">Body</text>';
  svg.innerHTML = s + labels;
  if (!reduced() && active){ svg.style.animation = "none"; void svg.offsetWidth; svg.style.animation = "riseIn .3s ease-out both"; }
}
function paintPair(){
  var s = '';
  s += '<line x1="70" y1="20" x2="70" y2="160" stroke="#8FD3B4" stroke-width="2.5"/>';
  s += '<rect x="52" y="50" width="36" height="80" fill="none" stroke="#8FD3B4" stroke-width="2.5" rx="2"/>';
  s += '<text x="70" y="176" text-anchor="middle" fill="#8FD3B4" font-family="Inter,sans-serif" font-size="12">Finished higher</text>';
  s += '<line x1="190" y1="20" x2="190" y2="160" stroke="#F5A3AE" stroke-width="2.5"/>';
  s += '<rect x="172" y="50" width="36" height="80" fill="#F5A3AE" stroke="#F5A3AE" stroke-width="2.5" rx="2"/>';
  s += '<text x="190" y="176" text-anchor="middle" fill="#F5A3AE" font-family="Inter,sans-serif" font-size="12">Finished lower</text>';
  shadowRoot.getElementById("lessonPair").innerHTML = s;
  shadowRoot.getElementById("pairCopy").textContent =
    "Hollow means the period finished higher than it started. Solid means it finished lower. The shape tells you this without relying on colour.";
}
function lessonGate(){
  var all = app.lessonParts.length >= LESSON.length;
  var b = shadowRoot.getElementById("lessonNext");
  b.setAttribute("aria-disabled", all ? "false" : "true");
  shadowRoot.getElementById("lessonHelper").textContent = all
    ? "You have read all six parts."
    : "You have read " + app.lessonParts.length + " of six parts.";
  coDisc("lessonDisc");
}
shadowRoot.getElementById("lessonNext").addEventListener("click", function(){
  if (this.getAttribute("aria-disabled") === "true") return;
  openProfile(DATA.companies[0].id);
});

/* ---------- 4. company profile ---------- */
function openProfile(id){
  app.currentCo = id;
  if (app.opened.indexOf(id) < 0) app.opened.push(id);
  save();
  go("profile");
  renderProfile();
}
function renderProfile(){
  var c = CO[app.currentCo];
  var upto = c.candles.slice(0, revealedTo() + 1);
  var first = upto[0], last = upto[upto.length - 1];
  var hiK = upto.reduce(function(a,b){ return b.h > a.h ? b : a; });
  var loK = upto.reduce(function(a,b){ return b.l < a.l ? b : a; });
  shadowRoot.getElementById("profHead").innerHTML =
    '<p class="kicker">Chapter 2 · Company profile</p>' +
    '<div style="display:flex;gap:14px;align-items:center;margin-bottom:8px">' + orb(c) +
      '<div><h1 style="margin:0">' + c.name + '</h1>' +
      '<span class="tick">' + c.ticker + ' · ' + DATA.meta.exchange + ' (' + DATA.meta.mic + ') · quoted in ' + DATA.meta.currency + ' · ' + c.sector + '</span></div></div>' +
    '<p class="cap" style="margin-top:10px"><strong>Fictional company.</strong> Written for practice. Everything on this page behaves the way a real company profile behaves, so the reading you do here is the reading you would do anywhere.</p>';

  var chartHost = shadowRoot.getElementById("profChart");
  chartHost.innerHTML = '<p class="kicker">Price history</p><h2 style="margin-bottom:14px">' + DATA.meta.periodLabel + '</h2><div id="profChartHost"></div>' +
    '<p class="cap" style="margin-top:12px">Every candle tells us what happened. Not what happens next. ' +
    '<button class="btn-link" style="font-size:14px" onclick="window.__wia1.go(\'lesson\')">Read the candlestick lesson again</button></p>';
  mountChart(c, 0, revealedTo(), "prof", shadowRoot.getElementById("profChartHost"));

  var years = ["Year 1","Year 2","Year 3","Year 4","Year 5"];
  shadowRoot.getElementById("profBody").innerHTML =
    '<h2>How this company earns money</h2><p>' + c.desc + '</p>' +
    '<div class="layer"><div class="panel"><p class="kicker">Selected financial information</p>' +
      '<div style="overflow-x:auto"><table><caption>Synthetic figures, written for practice. They are laid out exactly as a real company reports them, so the shape is familiar when you meet one.</caption>' +
      '<thead><tr><th scope="col">Line</th>' + years.map(function(y){ return '<th scope="col" class="n">' + y + '</th>'; }).join("") + '</tr></thead><tbody>' +
      c.fin.map(function(r){ return '<tr><th scope="row">' + r[0] + '</th>' + r.slice(1).map(function(v){ return '<td class="n">' + v + '</td>'; }).join("") + '</tr>'; }).join("") +
      '</tbody></table></div>' +
      '<p class="cap" style="margin-top:10px">' + (exerciseStarted() ? "" :
        "Only information available up to the virtual decision date is shown. Nothing from the exercise period appears on this screen. ") +
        'Amounts in millions of ' + DATA.meta.currency + ' unless stated. Market capitalisation is calculated as shares outstanding multiplied by the closing price on a stated date, never taken from a data feed.</p>' +
    '</div></div>' +

    '<div class="grid2">' +
      '<div class="panel"><p class="kicker">Dividends per share</p><table><tbody>' +
        c.div.map(function(d){ return '<tr><th scope="row">' + d[0] + '</th><td class="n">' + COCUR + d[1] + '</td></tr>'; }).join("") +
        '</tbody></table><p class="cap" style="margin-top:8px">A dividend is cash paid out to owners from the company\'s profits. It is decided each time and can be increased, reduced or stopped.</p>' +
        '<p class="cap" style="margin-top:8px">Whether you receive one depends on whether you held the shares at the entitlement cut-off associated with the ex-dividend date. The record date is shown for provenance and does not itself create entitlement. The cash then arrives on the payment date, which is usually weeks later. Entitlement and receipt are two separate events.</p></div>' +
      '<div class="panel"><p class="kicker">Price range, ' + (exerciseStarted() ? "up to the current stage" : "research history only") + '</p><table><tbody>' +
        '<tr><th scope="row">First close</th><td class="n">' + COCUR + first.c.toFixed(2) + '</td></tr>' +
        '<tr><th scope="row">Last close</th><td class="n">' + COCUR + last.c.toFixed(2) + '</td></tr>' +
        '<tr><th scope="row">Highest</th><td class="n">' + COCUR + hiK.h.toFixed(2) + ', ' + periodLabel(hiK.t) + '</td></tr>' +
        '<tr><th scope="row">Lowest</th><td class="n">' + COCUR + loK.l.toFixed(2) + ', ' + periodLabel(loK.t) + '</td></tr>' +
        '</tbody></table><p class="cap" style="margin-top:8px">This describes what the price did. It is not a range the price is expected to stay within.</p></div>' +
    '</div>' +

    '<div class="grid2" style="margin-top:18px">' +
      '<div class="panel"><p class="kicker">Three things that may support the business</p><ul class="sm" style="margin:0;padding-left:18px">' +
        c.support.map(function(x){ return '<li style="margin-bottom:8px">' + x + '</li>'; }).join("") + '</ul></div>' +
      '<div class="panel"><p class="kicker">Three uncertainties</p><ul class="sm" style="margin:0;padding-left:18px">' +
        c.risks.map(function(x){ return '<li style="margin-bottom:8px">' + x + '</li>'; }).join("") + '</ul></div>' +
    '</div>' +

    '<div class="callout"><p class="kicker">Questions to sit with</p><ul class="sm" style="margin:0;padding-left:18px">' +
      '<li style="margin-bottom:6px">If this company\'s largest market slowed down, which part of its business would feel it first?</li>' +
      '<li style="margin-bottom:6px">Does its profit rise and fall with the economy, or is demand fairly steady?</li>' +
      '<li style="margin-bottom:6px">Who else sells what it sells, and what would make a customer choose one over the other?</li>' +
      '<li>Where did the share price and the revenue move differently, and what might explain the gap?</li>' +
    '</ul></div>' +
    '<p class="sm"><strong>No rating appears on this page.</strong> There is no buy, sell or hold, no target price, no score and no ranking. What to do with this information is the exercise.</p>' +

    '<div class="actions">' +
      '<button class="btn btn-primary" onclick="window.__wia1.go(\'allocate\')">Build my virtual portfolio</button>' +
      '<button class="btn btn-secondary" onclick="window.__wia1.go(\'library\')">Back to the library</button>' +
    '</div>' +
    '<p class="disc">' + COMPANY_DISCLAIMER + '</p>';
  addArrows(shadowRoot.getElementById("s-profile"));
}


/* ============================================================
   BOOT
   ============================================================ */
load().then(function(){
  paintExitControl();
  paintGreeting();
  renderAssets();
  renderAllocRows();
  buildDonut();
  renderAlloc();
  addArrows(shadowRoot);
  shadowRoot.getElementById("exitBtn").addEventListener("click", function(){
    flushSave().then(function(ok){
      if (ok){
        openModal("Saved to your account",
          '<p class="sm">Your progress is saved to your account, so it will be here the next time you sign in, on any device.</p>',
          "Return to the start", "Stay here");
      } else {
        openModal("Exit journey",
          '<p class="sm">Your progress could not be saved just now. If you leave this page, you will need to start the journey again.</p>',
          "Exit anyway", "Stay here");
      }
      modalConfirm = function(){ go("dashboard"); };
    });
  });
  go(app.screen || "dashboard");
});

window.__wia1 = window.__wia1 || {};
window.__wia1.go = go;
window.__wia1.restartJourney = restartJourney;
window.__wia1.openProfile = openProfile;

    })(shadow, wiaMember);
  }

  function checkAuthAndBoot(){
    if (!window.$memberstackDom){ showSignedOut(); return; }
    window.$memberstackDom.getCurrentMember().then(function(res){
      var member = res && res.data;
      if (!member){ showSignedOut(); return; }
      if (hasPremiumAccess(member)) bootTool(member);
      else showLocked();
    }).catch(function(){ showSignedOut(); });
  }

  if (window.$memberstackReady) {
    checkAuthAndBoot();
  } else {
    document.addEventListener('memberstack.ready', checkAuthAndBoot);
  }
})();
