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
const KEY = "cow.wealthInAction.journey1.v1";
let storageOK = true;
let saveConfirmed = false;      /* only ever true after a save has actually succeeded */
let app = {
  schema: 1,
  screen: "dashboard",
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
  rebalOpened: false
};
/* The interface never claims a save happened unless it actually did. */
function save(){
  if (!storageOK){ saveConfirmed = false; return false; }
  try {
    localStorage.setItem(KEY, JSON.stringify(app));
    saveConfirmed = true;
    return true;
  } catch (e) {
    storageOK = false; saveConfirmed = false; showStorageNotice(); paintExitControl();
    return false;
  }
}
function load(){
  try {
    localStorage.setItem(KEY + ".t", "1"); localStorage.removeItem(KEY + ".t");
  } catch (e) { storageOK = false; showStorageNotice(); paintExitControl(); return; }
  try {
    const raw = localStorage.getItem(KEY);
    if (raw){
      const p = JSON.parse(raw);
      if (p && p.schema === 1) app = Object.assign(app, p);
    }
  } catch (e) { /* unreadable: keep defaults */ }
}
function clearStore(){
  try { localStorage.removeItem(KEY); } catch (e) {}
  location.reload();
}
function showStorageNotice(){
  if (document.getElementById("storeBanner")) return;
  const b = document.createElement("div");
  b.id = "storeBanner"; b.className = "callout"; b.style.margin = "0 20px 16px";
  b.innerHTML = '<p class="kicker">Worth knowing</p><p class="sm" style="margin:0">Your browser is not allowing this page to save progress, so this journey needs to be completed in one sitting. If you leave, you will start again. Everything else works normally.</p>';
  document.getElementById("main").prepend(b);
}
/* The exit control tells the truth about what leaving will do. */
function paintExitControl(){
  const b = document.getElementById("exitBtn");
  if (!b) return;
  if (storageOK){
    b.textContent = "Save on this device and exit";
    b.setAttribute("title", "Your progress is saved in this browser.");
  } else {
    b.textContent = "Exit journey";
    b.setAttribute("title", "Your progress cannot be saved in this browser. Leaving will mean starting again.");
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
function go(name){
  app.screen = name; save();
  document.querySelectorAll("section.screen").forEach(s => s.classList.remove("on"));
  document.getElementById("s-" + name).classList.add("on");
  const c = CHAPTERS[name];
  let label = c[0], pctDone = c[1];
  if (name === "event"){
    label = "Chapter 3, Experience the market. Period " + app.stage + " of 3";
    pctDone = EVENT_PROGRESS[app.stage] || c[1];
  }
  document.getElementById("chapterLabel").textContent = label;
  const pf = document.getElementById("progFill");
  if (reduced()) pf.style.width = pctDone + "%";
  else setTimeout(() => { pf.style.width = pctDone + "%"; }, 40);
  document.getElementById("progLabel").textContent = name === "dashboard" ? "" : pctDone + " per cent complete";
  document.getElementById("exitBtn").style.visibility = name === "dashboard" ? "hidden" : "visible";
  if (name === "dashboard") renderDashboard();
  if (name === "welcome") renderCurrency();
  if (name === "disclaimer") renderDisclaimer();
  if (name === "goal") renderChoice("goal");
  if (name === "horizon") renderChoice("horizon");
  if (name === "react") renderChoice("react");
  if (name === "capital") renderCapital();
  if (name === "review") renderReview();
  if (name === "reasons") renderReasons();
  if (name === "complete") renderComplete();
  if (name === "next") renderNext();
  if (name === "event") renderEvent();
  if (name === "t3" || name === "report") markComplete();
  if (name === "report") renderReport();
  const sec = document.getElementById("s-" + name);
  addArrows(sec);
  animateIn(sec);
  animateArt(sec);
  if (name === "dashboard"){ animateChildren(document.getElementById("journeyCards"), ".jcard", 0.09);
                             animateChildren(document.getElementById("badgeRow"), ".sealrow", 0.05); }
  if (name === "assets") animateChildren(document.getElementById("assetCards"), ".acard", 0.07);
  if (name === "allocate"){ animateChildren(document.getElementById("allocRows"), ".brow", 0.06); replayDonut(); }
  if (name === "report") animateReport();
  window.scrollTo(0, 0);
  const h = document.querySelector("#s-" + name + " h1");
  if (h){ h.setAttribute("tabindex", "-1"); h.focus({ preventScroll:true }); }
}

function markComplete(){
  if (!app.completed){ app.completed = true; app.dash = "done"; save(); }
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
  var all = document.querySelectorAll(".pressed");
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
  document.addEventListener("pointerdown", function(e){ pressStart(hit(e), e.clientX, e.clientY); }, { passive:true });
  document.addEventListener("pointerup", pressEnd, { passive:true });
  document.addEventListener("pointercancel", pressEnd, { passive:true });
} else {
  document.addEventListener("touchstart", function(e){
    var t = e.touches && e.touches[0];
    pressStart(hit(e), t ? t.clientX : null, t ? t.clientY : null);
  }, { passive:true });
  document.addEventListener("touchend", pressEnd, { passive:true });
  document.addEventListener("mousedown", function(e){ pressStart(hit(e), e.clientX, e.clientY); }, { passive:true });
  document.addEventListener("mouseup", pressEnd, { passive:true });
}
/* keyboard users get the same press state */
document.addEventListener("keydown", function(e){
  if (e.key !== "Enter" && e.key !== " ") return;
  var el = hit({ target: document.activeElement });
  if (el) pressStart(el, null, null);
}, { passive:true });
document.addEventListener("keyup", pressEnd, { passive:true });

/* forward-moving primary actions carry an arrow that slides on hover, focus and press */
const NO_ARROW = ["reset", "start again", "change my", "keep my", "close", "try another"];
function addArrows(root){
  (root || document).querySelectorAll(".btn-primary, .btn-secondary").forEach(b => {
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
  const b = document.getElementById(id);
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
  const holder = root.querySelector(".wrap, .wrap-wide");
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
  document.getElementById("modalNo").classList.remove("hidden");
  document.getElementById("modalFoot").textContent = "Nothing will be applied until you confirm.";
  document.getElementById("modalH").textContent = title;
  document.getElementById("modalBody").innerHTML = html;
  document.getElementById("modalYes").textContent = yes || "Confirm decision";
  document.getElementById("modalNo").textContent = no || "Change my mind";
  modalReturn = document.activeElement;
  const m = document.getElementById("mask");
  m.classList.add("on");
  document.body.style.overflow = "hidden";
  document.getElementById("modalYes").focus();
}
function closeModal(){
  document.getElementById("mask").classList.remove("on");
  document.body.style.overflow = "";
  if (modalReturn && modalReturn.focus) modalReturn.focus();
  modalConfirm = null;
}
document.getElementById("modalNo").addEventListener("click", closeModal);
document.getElementById("modalYes").addEventListener("click", () => { const f = modalConfirm; closeModal(); if (f) f(); });
document.addEventListener("keydown", e => {
  const m = document.getElementById("mask");
  if (!m.classList.contains("on")) return;
  if (e.key === "Escape"){ e.preventDefault(); closeModal(); return; }
  if (e.key === "Tab"){
    const f = m.querySelectorAll("button");
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
  }
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
  document.getElementById("modalFoot").textContent = "";
  document.getElementById("modalNo").classList.add("hidden");
}
["discLink", "discLink2"].forEach(id => document.getElementById(id).addEventListener("click", openDisclaimer));
document.getElementById("exitBtn").addEventListener("click", () => { save(); go("dashboard"); });

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
  const cp = document.getElementById("continuePanel");
  const pctDone = CHAPTERS[app.screen] ? CHAPTERS[app.screen][1] : 0;
  if (app.completed){
    cp.innerHTML = '<div class="panel"><p class="kicker">Journey complete</p>'
      + '<p class="sm">You completed Journey 1' + (storageOK ? ", and your report is saved in this browser." : ".") + '</p>'
      + '<div class="actions"><button class="btn btn-primary" onclick="go(\'report\')">View my report</button>'
      + '<button class="btn-link" style="font-size:15px" onclick="restartJourney()">Start this journey again</button></div></div>';
  } else if (started){
    cp.innerHTML = '<div class="panel"><p class="kicker">Continue where you left off</p>'
      + '<h3>Journey 1: Build Your First Portfolio</h3>'
      + '<p class="sm">' + (CHAPTERS[app.screen] ? CHAPTERS[app.screen][0] : "Chapter 1, Prepare") + '.</p>'
      + '<div class="meter" style="margin:12px 0"><span id="dashMeter" style="width:0"></span></div>'
      + '<p class="sm num">' + pctDone + ' per cent complete.</p>'
      + '<div class="actions"><button class="btn btn-primary" onclick="go(\'' + (app.screen === "dashboard" ? "welcome" : app.screen) + '\')">Continue</button>'
      + '<button class="btn-link" style="font-size:15px" onclick="restartJourney()">Start this journey again</button></div></div>';
    setTimeout(function(){ const m = document.getElementById("dashMeter"); if (m) m.style.width = pctDone + "%"; }, 120);
  } else {
    cp.innerHTML = '<div class="panel"><p class="kicker">A free practice journey</p>'
      + '<p class="sm">Journey 1 takes approximately 20 to 30 minutes, and gives you 10,000 in virtual money to practise with. Nothing is real, nothing is bought, and no sign-up is needed.</p>'
      + '<div class="actions"><button class="btn btn-primary" onclick="go(\'welcome\')">Start Journey 1</button></div></div>';
  }

  document.getElementById("journeyCards").innerHTML =
    '<div class="jcard' + (app.completed ? " done" : (started ? " prog" : "")) + '">'
    + '<span class="jnum">01</span><h3>Build Your First Portfolio</h3>'
    + (app.completed ? '<p class="sm" style="margin:0 0 8px">&#10003; Completed</p>'
        : (started ? '<p class="sm" style="margin:0 0 8px"><strong>In progress</strong></p>' : ''))
    + '<p class="sm">Learn what the categories are, allocate 10,000 in virtual money, and see what happens across two and a half simulated years.</p>'
    + '<p class="cap">Approximately 20 to 30 minutes. You can leave and continue later on this device.</p>'
    + '<div class="actions"><button class="btn btn-primary" onclick="go(\'' + (app.completed ? "report" : "welcome") + '\')">'
    + (app.completed ? "View my report" : (started ? "Continue" : "Start journey")) + '</button></div></div>';

  const earned = earnedBadges();
  document.getElementById("badgeRow").innerHTML = BADGES.map(function(b){
    return sealHTML(b, earned.indexOf(b.id) >= 0, false);
  }).join("");

  const ins = document.getElementById("insightText"), lk = document.getElementById("insightLink");
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
  addArrows(document.getElementById("s-dashboard"));
}

/* ============================================================
   3. ASSET CATEGORIES
   ============================================================ */
function renderAssets(){
  document.getElementById("assetCards").innerHTML = CATS.map(c =>
    '<div class="acard"><div class="head">'
    + '<span class="orb o-' + c.id + '" aria-hidden="true"><svg viewBox="0 0 32 32">' + ICONS[c.id] + '</svg></span>'
    + '<div style="flex:1"><h3 style="margin-bottom:6px">' + c.name + '</h3>'
    + '<span class="mlabel">' + c.move + '</span></div></div>'
    + '<p class="sm" style="margin:14px 0">' + c.role + '</p>'
    + '<button class="btn-link sm" style="font-size:15px" aria-expanded="false" aria-controls="lm-' + c.id + '" data-learn="' + c.id + '">Learn more</button>'
    + '<div class="panel hidden" id="lm-' + c.id + '" style="margin-top:12px">'
    + c.learn.map(p => '<p class="sm">' + p + '</p>').join("") + '</div></div>').join("");

  document.getElementById("assetTable").innerHTML =
    '<table><caption>These labels describe how widely each category moves inside this fictional journey. They are not risk ratings for real investments.</caption>'
    + '<thead><tr><th>Category</th><th>Movement in this simulation</th><th>Produces income</th><th>Moves mainly with</th></tr></thead><tbody>'
    + CATS.map(c => '<tr><td>' + c.name + '</td><td>' + c.move.replace(" movement in this simulation", "") + '</td><td>' + c.income + '</td><td>' + c.with + '</td></tr>').join("")
    + '</tbody></table>';

  document.querySelectorAll("[data-learn]").forEach(b => b.addEventListener("click", () => {
    const id = b.dataset.learn, p = document.getElementById("lm-" + id);
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
  const b = document.getElementById("assetNext");
  b.setAttribute("aria-disabled", "false");
  const n = app.panels.length;
  document.getElementById("assetHelper").textContent = n === CATS.length
    ? "You have opened the detailed explanation for all six categories. That earns the Asset Explorer badge."
    : "You have opened " + n + " of six detailed explanations. Opening all six earns the Asset Explorer badge, and you can come back to them at any time.";
}
document.getElementById("assetNext").addEventListener("click", function(){ go("allocate"); });
document.getElementById("tableToggle").addEventListener("click", function(){
  const t = document.getElementById("assetTable");
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
  document.getElementById("allocRows").innerHTML = CATS.map(c =>
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
    document.querySelector('[data-minus="' + c.id + '"]').addEventListener("click", () => bump(c.id, -100));
    document.querySelector('[data-plus="' + c.id + '"]').addEventListener("click", () => bump(c.id, 100));
    const inp = document.getElementById("amt-" + c.id);
    inp.addEventListener("blur", () => commitField(c.id));
    inp.addEventListener("keydown", e => {
      if (e.key === "Enter"){ e.preventDefault(); commitField(c.id); }
      if (e.key === "ArrowUp"){ e.preventDefault(); bump(c.id, 100); }
      if (e.key === "ArrowDown"){ e.preventDefault(); bump(c.id, -100); }
    });
  });
}
function setErr(id, msg){
  const e = document.getElementById("err-" + id);
  e.textContent = msg || ""; e.className = msg ? "errline on" : "errline";
}
function flashRow(id){
  if (reduced()) return;
  const el = document.getElementById("amt-" + id);
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
  const inp = document.getElementById("amt-" + id);
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
    const inp = document.getElementById("amt-" + c.id);
    if (inp && document.activeElement !== inp) inp.value = (app.alloc[c.id] || 0).toLocaleString("en-GB");
  });
  const vals = CATS.map(c => fromEuros(app.alloc[c.id] || 0));
  const tot = fromEuros(t);
  const pcts = weightsPct(vals, tot);
  CATS.forEach((c, i) => {
    const el = document.getElementById("pct-" + c.id); if (el) el.textContent = pctStr(pcts[i]);
    const v = document.getElementById("val-" + c.id);
    if (v) v.textContent = "\u20AC" + (app.alloc[c.id] || 0).toLocaleString("en-GB");
  });

  const target = fromEuros(rem);
  countTo("remaining", lastRemaining, target, 380);
  lastRemaining = target;
  document.getElementById("allocMeter").style.width = (t / TARGET * 100) + "%";
  const sub = document.getElementById("allocSub");
  if (sub) sub.textContent = t === TARGET
    ? "All €10,000.00 allocated across " + CATS.filter(c => (app.alloc[c.id] || 0) > 0).length + " categories."
    : fmt(fromEuros(t)) + " of €10,000.00 allocated. Cash counts as a choice.";
  document.getElementById("donutTotal").textContent = fmt(tot);
  drawDonut(vals, pcts, t);

  CATS.forEach(c => {
    const row = document.getElementById("amt-" + c.id);
    if (row && row.closest) row.closest(".brow").classList.toggle("funded", (app.alloc[c.id] || 0) > 0);
  });
  const full = t === TARGET;
  const b = document.getElementById("allocNext");
  b.setAttribute("aria-disabled", full ? "false" : "true");
  const help = document.getElementById("allocHelper");
  if (full){
    help.innerHTML = '<span class="done-tick"><span class="ring" aria-hidden="true">&#10003;</span>You have allocated every virtual euro.</span>';
    if (!wasFull){
      const rb = document.getElementById("remaining");
      rb.classList.remove("pulse"); void rb.offsetWidth; rb.classList.add("pulse");
      wake("allocNext"); addArrows(document.getElementById("s-allocate"));
    }
  } else {
    help.textContent = t === 0 ? "Start anywhere. Add an amount to any category, and the chart will follow."
      : "You still have " + fmt(fromEuros(rem)) + " to allocate. Add it to any category, including Cash.";
  }
  wasFull = full;

  const lower = (app.alloc.cash || 0) + (app.alloc.bonds || 0);
  const mix = document.getElementById("mixLine");
  if (t === 0){
    mix.textContent = "Nothing allocated yet. Add amounts to any category. Cash counts as a choice.";
  } else {
    const lp = Math.round(lower / t * 100);
    mix.textContent = "Your portfolio is currently " + lp + " per cent in lower-movement categories and " + (100 - lp)
      + " per cent in higher-movement categories, as those groups are defined in this simulation. This grouping exists only for this educational simulation and is not a universal description of these categories.";
  }
  const conc = document.getElementById("concentration");
  let big = null;
  CATS.forEach((c, i) => { if (t > 0 && (app.alloc[c.id] || 0) / t > 0.5) big = { c:c, p:pcts[i] }; });
  conc.innerHTML = big
    ? '<p class="sm" style="margin-top:12px">' + big.c.name + ' now makes up ' + pctStr(big.p)
      + ' of your portfolio. Holding a large share in one category means your result will depend heavily on that category. This is neither a mistake nor a suggestion to change it.</p>'
    : "";

  const summary = "Portfolio composition: " + CATS.map((c, i) => c.name + " " + pctStr(pcts[i])).join(", ") + ".";
  document.getElementById("donutSummary").textContent = summary;
  clearTimeout(liveTimer);
  liveTimer = setTimeout(() => {
    document.getElementById("remainStatus").textContent = full
      ? "Fully allocated. Zero remaining."
      : fmt(fromEuros(rem)) + " remaining to allocate.";
  }, 600);
}
let donutReady = false;
function buildDonut(){
  const svg = document.getElementById("donut");
  const C = 2 * Math.PI * 92;
  svg.innerHTML = '<circle cx="120" cy="120" r="92" fill="none" stroke="#E8E4E1" stroke-width="28"/>'
    + CATS.map(c => '<circle id="seg-' + c.id + '" cx="120" cy="120" r="92" fill="none" stroke="' + c.colour
      + '" stroke-width="28" stroke-linecap="round" stroke-dasharray="0 ' + C + '" stroke-dashoffset="0"'
      + ' transform="rotate(-90 120 120)" style="transition:stroke-dasharray .55s cubic-bezier(.22,.8,.3,1),stroke-dashoffset .55s cubic-bezier(.22,.8,.3,1)"/>').join("");
  donutReady = true;
}
function drawDonut(vals, pcts, t){
  const svg = document.getElementById("donut");
  if (!svg) return;
  if (!donutReady) buildDonut();
  const C = 2 * Math.PI * 92;
  let off = 0;
  const gap = 6;
  CATS.forEach(c => {
    const seg = document.getElementById("seg-" + c.id);
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
    const seg = document.getElementById("seg-" + c.id);
    if (!seg) return;
    seg.style.transition = "none";
    seg.setAttribute("stroke-dasharray", "0 " + C);
  });
  const held = lastDonut; lastDonut = 0n;
  setTimeout(() => { renderAlloc(); lastDonut = held; }, 60);
}
document.getElementById("diversToggle").addEventListener("click", function(){
  const p = document.getElementById("diversPanel");
  const open = p.classList.toggle("hidden") === false;
  this.setAttribute("aria-expanded", open);
  this.textContent = open ? "Close" : "What these groups mean";
  if (open){ app.divers = true; save(); }
});
document.getElementById("resetBtn").addEventListener("click", () => {
  openModal("Reset all amounts",
    '<p class="sm">This clears every category and returns your full ' + CUR() + '10,000. Your goal and time period stay as they are.</p>',
    "Reset amounts", "Keep my amounts");
  modalConfirm = () => { CATS.forEach(c => app.alloc[c.id] = 0); CATS.forEach(c => setErr(c.id, "")); renderAlloc(); save(); };
});
document.getElementById("allocNext").addEventListener("click", function(){
  if (this.getAttribute("aria-disabled") === "true"){
    const bar = document.getElementById("remaining");
    bar.setAttribute("tabindex", "-1"); bar.focus();
    document.getElementById("remainStatus").textContent = "You still have " + fmt(fromEuros(TARGET - allocTotal())) + " to allocate. Add it to any category, including Cash.";
    return;
  }
  go("t2");
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
  const beats = document.querySelectorAll("#evDark .beat");
  const last = beats[beats.length - 1];
  if (last){
    last.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block:"start" });
    const h = last.querySelector(".kicker");
    if (h){ h.setAttribute("tabindex", "-1"); h.focus({ preventScroll:true }); }
  }
  if (stageBeat >= 4) countTo("evAfterFig", totalOf(evBefore), totalOf(evAfter), 600);
}

function growBars(){
  document.querySelectorAll("#evBars .mtrack i").forEach((el, i) => {
    const w = el.dataset.w;
    if (reduced()){ el.style.width = w + "%"; return; }
    el.style.width = "0%";
    setTimeout(() => { el.style.transition = "width .55s ease-out"; el.style.width = w + "%"; }, 60 * i);
  });
}
const counters = {};
function countTo(id, from, to, dur){
  const el = document.getElementById(id);
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
  document.querySelectorAll("[data-dec]").forEach(b => b.setAttribute("aria-checked", b.dataset.dec === id));
  const det = document.getElementById("decDetail");

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

  const src = document.getElementById("decSrc");
  if (src) src.addEventListener("change", () => pickSourceChanged());
  const amt = document.getElementById("decAmt");
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
  const src = document.getElementById("decSrc").value;
  const dst = document.getElementById("decDst");
  if (dst){
    const keep = dst.value === src ? "cash" : dst.value;
    dst.innerHTML = catOptions(src, keep === src ? "cash" : keep);
  }
  const help = document.getElementById("decAmtHelp");
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
  const e = document.getElementById("decErr");
  e.textContent = msg || "";
  e.className = msg ? "errline on" : "errline";
}
function validateDecision(){
  const id = app.decision;
  const btn = document.getElementById("decReview");
  const enable = ok => {
    const was = btn.getAttribute("aria-disabled");
    btn.setAttribute("aria-disabled", ok ? "false" : "true");
    if (ok && was === "true") wake("decReview");
  };
  if (!id){ enable(false); return false; }
  if (id === "hold" || id === "rebal"){ setDecErr(""); enable(true); return true; }

  const inp = document.getElementById("decAmt");
  if (!inp){ enable(false); return false; }
  const cents = parseAmount(inp.value);
  const cap = id === "contrib" ? 200000n : maxCents(document.getElementById("decSrc").value);
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
    const inp = document.getElementById("decAmt");
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
    const src = document.getElementById("decSrc").value;
    const cents = parseAmount(document.getElementById("decAmt").value);
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
    const src = document.getElementById("decSrc").value, dst = document.getElementById("decDst").value;
    const cents = parseAmount(document.getElementById("decAmt").value);
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
    const cents = parseAmount(document.getElementById("decAmt").value);
    body = line("Your decision", D.label)
      + line("Amount", fmtCents(cents) + " in virtual money")
      + line("Portfolio effect", "Your total becomes " + fmt(ta + cents * CENT) + ", of which " + fmtCents(cents)
        + " is virtual money you have added rather than growth. It is allocated across your existing percentages.");
    run = () => showFeedback("contrib", cents, null, null);
  }
  openModal("Review your decision", body, "Confirm decision", "Change my decision");
  addArrows(document.getElementById("mask"));
  document.getElementById("modalFoot").textContent = "Nothing will be applied until you confirm.";
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

  const fb = document.getElementById("feedbackBlock");
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
  const body = document.getElementById("reportBody");
  animateChildren(body, "h2, .panel, .callout, .pull, .nextup", 0.05);
  animateChildren(body, ".seallist .sealrow", 0.09);
  animateArt(document.getElementById("s-report"));
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
  const c = CHOICES[name], host = document.getElementById(c.host);
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
      document.getElementById(c.errEl).textContent = "";
      const n = c.note[app[c.key]] || c.note["*"] || "";
      document.getElementById(c.noteEl).textContent = n;
      document.getElementById(c.btn).setAttribute("aria-disabled", "false");
    });
  });
  const chosen = !!app[c.key];
  document.getElementById(c.btn).setAttribute("aria-disabled", chosen ? "false" : "true");
  document.getElementById(c.noteEl).textContent = chosen ? (c.note[app[c.key]] || c.note["*"] || "") : "";
  addArrows(host.closest("section"));
}
["goal","horizon","react"].forEach(function(name){
  const c = CHOICES[name];
  document.getElementById(c.btn).addEventListener("click", function(){
    if (this.getAttribute("aria-disabled") === "true"){
      document.getElementById(c.errEl).textContent = c.err;
      return;
    }
    go(c.next);
  });
});

/* currency, chosen once at the start and used everywhere after */
function renderCurrency(){
  const host = document.getElementById("curCards");
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
  const w = document.getElementById("s-welcome");
  if (w) w.querySelectorAll("[data-money]").forEach(function(el){ el.textContent = CUR() + el.dataset.money; });
}

function renderDisclaimer(){
  const box = document.getElementById("disAgree");
  const btn = document.getElementById("disNext");
  box.checked = !!app.disclaimerAccepted;
  btn.setAttribute("aria-disabled", box.checked ? "false" : "true");
  box.onchange = function(){
    app.disclaimerAccepted = box.checked; save();
    btn.setAttribute("aria-disabled", box.checked ? "false" : "true");
    if (box.checked) document.getElementById("disHelp").textContent = "";
  };
}
document.getElementById("disNext").addEventListener("click", function(){
  if (this.getAttribute("aria-disabled") === "true"){
    document.getElementById("disHelp").textContent = "Please tick the box to confirm you understand this is an educational simulation.";
    document.getElementById("disAgree").focus();
    return;
  }
  go("goal");
});
document.getElementById("fullDiscLink").addEventListener("click", openDisclaimer);

function renderCapital(){
  const el = document.getElementById("capFigure");
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
  document.getElementById("reviewTable").innerHTML =
    '<div class="panel" style="overflow-x:auto"><table><caption>How your virtual ' + fmt(fromEuros(TARGET)) + ' is allocated</caption>' +
    '<thead><tr><th scope="col">Category</th><th scope="col" class="n">Amount</th><th scope="col" class="n">Share</th><th scope="col">Movement in this simulation</th></tr></thead><tbody>' +
    CATS.map(function(c, i){
      return '<tr><th scope="row">' + c.name + '</th><td class="n">' + fmt(vals[i]) + '</td><td class="n">' + pctStr(pcts[i]) + '</td><td>' + c.move.replace(" in this simulation","") + '</td></tr>';
    }).join("") + '</tbody></table></div>';
  drawReviewDonut(ids, vals, pcts, fromEuros(t));
  document.getElementById("revTotal").textContent = fmt(fromEuros(t));
  document.getElementById("revDonutSummary").textContent = "Portfolio composition: " +
    CATS.map(function(c, i){ return c.name + " " + pctStr(pcts[i]); }).join(", ") + ".";

  const lower = (app.alloc.cash || 0) + (app.alloc.bonds || 0);
  const lp = Math.round(lower / t * 100);
  let big = null;
  CATS.forEach(function(c, i){ if ((app.alloc[c.id] || 0) / t > 0.5) big = { c:c, p:pcts[i] }; });
  const none = CATS.every(function(c){ return (app.alloc[c.id] || 0) / t <= 0.35; });
  document.getElementById("reviewObs").innerHTML =
    '<div class="layer"><div class="panel"><p class="kicker">Lower-movement and higher-movement exposure</p>' +
    '<p class="sm">Around ' + lp + ' per cent of your portfolio is in categories defined in this simulation as lower-movement, and around ' + (100 - lp) +
    ' per cent in categories defined as higher-movement. Higher-movement categories carry a wider range of possible outcomes, in both directions.</p>' +
    '<p class="sm" style="margin:0">This grouping exists only for this educational simulation. It is not a universal description of these categories, and the four higher-movement categories do not behave alike or perform the same function.</p>' +
    '</div></div>' +
    (big
      ? '<p class="sm">' + big.c.name + ' makes up ' + pctStr(big.p) + ' of your portfolio. That means most of your result will follow what happens to that one category. Some people choose this deliberately. It is your decision, and you can change it before confirming.</p>'
      : (none ? '<p class="sm">No single category makes up more than a third of your portfolio. Spreading money across categories that behave differently is what diversification means in practice.</p>' : ''));
  addArrows(document.getElementById("s-review"));
}
function drawReviewDonut(ids, vals, pcts, tot){
  const svg = document.getElementById("revDonut");
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
document.getElementById("revConfirm").addEventListener("click", function(){
  openModal("Confirm your portfolio",
    '<p class="sm">This becomes your starting allocation for the simulation. You will still be able to make changes after the first two market periods.</p>',
    "Yes, confirm", "Go back and edit");
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
  const host = document.getElementById("reasonChips");
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
  const ta = document.getElementById("reasonNote");
  ta.value = app.reasonNote || "";
  ta.oninput = function(){
    app.reasonNote = ta.value; save();
    document.getElementById("reasonCount").textContent = ta.value.length >= 400 ? (ta.value.length + " of 500 characters") : "";
    checkReasons();
  };
  checkReasons();
  addArrows(document.getElementById("s-reasons"));
}
function checkReasons(){
  const ok = app.reasons.length > 0 || (app.reasonNote || "").trim().length >= 10;
  document.getElementById("reasonNext").setAttribute("aria-disabled", ok ? "false" : "true");
  if (ok) document.getElementById("reasonErr").textContent = "";
}
document.getElementById("reasonNext").addEventListener("click", function(){
  if (this.getAttribute("aria-disabled") === "true"){
    document.getElementById("reasonErr").textContent = "Choose at least one reason, or write a short note, to continue.";
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
  if (!app.holdings || !app.beforeStage){
    if (app.allocConfirmed && allocTotal() === TARGET){
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
  const dark = document.getElementById("evDark"), light = document.getElementById("evLight");

  document.getElementById("evKicker").textContent = "Period " + n + " of 3 · " + C.period;
  document.getElementById("evH").textContent = C.title;

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
  document.querySelectorAll("[data-reveal]").forEach(function(b){ b.onclick = function(){ advanceBeat(b.dataset.reveal); }; });
  const wt = document.getElementById("whyToggle");
  if (wt) wt.onclick = function(){
    const p = document.getElementById("whyPanel");
    const open = p.classList.toggle("hidden") === false;
    this.setAttribute("aria-expanded", open);
    this.textContent = open ? "Close" : "Why did each category move differently";
    if (open){ app.moveOpened = true; save(); }
  };
  const bt = document.getElementById("barToggle");
  if (bt) bt.onclick = function(){
    const t = document.getElementById("evTable"), b = document.getElementById("evBars");
    const open = t.classList.toggle("hidden") === false;
    b.classList.toggle("hidden", open);
    this.setAttribute("aria-expanded", open);
    this.textContent = open ? "View as bars" : "View as a table";
  };
  addArrows(document.getElementById("s-event"));
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
  document.getElementById("evBars").innerHTML = CATS.map(function(c){
    const v = ev.pct[c.id], up = v >= 0, w = Math.abs(v) / maxAbs * 46;
    return '<div class="mrow"><div class="lab"><span class="cn">' + c.name + '</span>' +
      movementLabel(v) +
      '<div class="mtrack"><span class="mid" aria-hidden="true"></span><i class="' + (up ? "up" : "dn") + '" data-w="' + w.toFixed(2) + '"></i></div>' +
      '<p class="val" style="margin:8px 0 0;text-align:right">' + fmt(evAfter[c.id]) + '</p></div>';
  }).join("");
  document.getElementById("evTable").innerHTML =
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
    '<div class="actions"><button class="btn btn-primary" onclick="go(\'t3\')">Complete the journey</button></div>' +
    '<p class="disc">Virtual money. Simulated scenario. Not investment advice.</p>';
}

/* ============================================================
   DECISION SCREEN
   ============================================================ */
function decisionHTML(){
  const C = EVENT_COPY[app.stage - 1];
  return '<p class="hang" style="margin-top:0">' + C.pull + '</p>' +
   '<h2>What would you like to do?</h2>' +
   '<p id="decIntro">Your portfolio is now worth <span class="num">' + fmt(totalOf(evAfter)) +
     '</span>. You can leave it as it is, or make a change. Nothing will be applied until you confirm.</p>' +
   '<p class="sm">There is no correct choice here. Every option below has something in its favour and something it costs you.</p>' +
   '<div id="decisionCards" role="radiogroup" aria-label="What would you like to do"></div>' +
   '<div id="decDetail" style="margin-top:14px"></div>' +
   '<p class="errline" id="decErr" role="alert"></p>' +
   '<div class="actions"><button class="btn btn-primary" id="decReview" aria-disabled="true">Review my decision</button></div>' +
   '<div id="feedbackBlock" class="hidden" style="margin-top:36px"></div>' +
   '<p class="disc">Virtual money. Simulated scenario. Not investment advice.</p>';
}
function wireDecision(){
  document.getElementById("decisionCards").innerHTML = DECISIONS.map(function(d){
    return '<button class="opt" role="radio" aria-checked="false" data-dec="' + d.id + '">' +
      '<span class="tick" aria-hidden="true">&#10003;</span>' +
      '<span class="t">' + d.label + '</span>' +
      '<span class="d"><strong>May help.</strong> ' + d.help + '<br><strong>May cost you.</strong> ' + d.cost + '</span></button>';
  }).join("");
  document.querySelectorAll("[data-dec]").forEach(function(b){
    b.addEventListener("click", function(){ pickDecision(b.dataset.dec); });
  });
  app.decision = null;
  const rev = document.getElementById("decReview");
  rev.addEventListener("click", function(){ onDecReview.call(rev); });
  addArrows(document.getElementById("s-event"));
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
  const nextBtn = document.getElementById("fbNext");
  if (nextBtn) nextBtn.addEventListener("click", function(){
    if (app.stage < 3){ app.stage++; save(); go("event"); }
    else go("t3");
  });
  const host = document.getElementById("holdRefCards");
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
        document.getElementById("holdRefBlock").innerHTML =
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
    go(app.allocConfirmed && allocTotal() === TARGET ? "event" : (allocTotal() > 0 ? "allocate" : "welcome"));
    return;
  }
  const r = liveRecord();
  document.getElementById("reportBody").innerHTML = reportHTML(r);
  const body = document.getElementById("reportBody");
  animateReport();
  addArrows(document.getElementById("s-report"));
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
  + '<button class="btn btn-primary" onclick="go(\'next\')">See what to explore next</button>'
  + '<button class="btn btn-secondary" onclick="restartJourney()">Start this journey again</button>'
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
    save();
    renderAllocRows(); renderAlloc();
    go("welcome");
  };
}
function renderComplete(){
  markComplete();
  document.getElementById("completeBadges").innerHTML =
    BADGES.map(function(b){ const on = earnedBadges().indexOf(b.id) >= 0; return sealHTML(b, on, on); }).join("");
  addArrows(document.getElementById("s-complete"));
}
function renderNext(){
  markComplete();
  addArrows(document.getElementById("s-next"));
}

/* ============================================================
   BOOT
   ============================================================ */
load();
paintExitControl();
renderAssets();
renderAllocRows();
buildDonut();
renderAlloc();
addArrows(document);
document.getElementById("exitBtn").addEventListener("click", function(){
  if (storageOK){
    const ok = save();
    openModal("Saved on this device",
      ok ? '<p class="sm">Your progress is saved in this browser. It will not automatically appear on another device or browser, and clearing your browser data may remove it.</p>'
         : '<p class="sm">Your progress could not be saved just now. If you leave this page, you will need to start the journey again.</p>',
      "Return to the start", "Stay here");
    modalConfirm = function(){ go("dashboard"); };
  } else {
    openModal("Exit journey",
      '<p class="sm">Your browser is not allowing this page to save progress, so leaving will mean starting again. Nothing has been saved.</p>',
      "Exit anyway", "Stay here");
    modalConfirm = function(){ go("dashboard"); };
  }
});
go(app.screen || "dashboard");
