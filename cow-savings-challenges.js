(function(){
"use strict";

/* The tool's root element. State attributes (data-arrange, data-editing,
   data-complete) are set here, not on document.body, so this tool's
   state can never collide with the site's own body-level attributes
   or CSS that might key off the real page body. */
var ROOT = document.querySelector(".cow-sav") || document.body;

/* ============================================================
   CONFIGURATION
   ------------------------------------------------------------
   TO ADD A NEW CHALLENGE, add one object to the CHALLENGES
   array below. Nothing else in this file needs to change.

     id        unique, short, never reused (used as a save key)
     title     use {total} where the goal figure should appear
     strapline the italic line under the heading
     blurb     the sentence on the chooser card
     amounts   the list of individual amounts
     seed      any number; fixes the scattered layout for good
     currencies which symbols this challenge offers

   Copy tokens usable in title, strapline and blurb:
     {total}  the goal, with the currency symbol
     {min}    the smallest amount, with the symbol
     {max}    the largest amount, with the symbol
     {count}  how many choices, no symbol

   Tokens mean the copy stays true if the amounts are edited,
   and switches from pounds to euros with the member's choice.

   The goal total is CALCULATED from the amounts. There is no
   separate total to keep in step, so the maths cannot drift
   out of line with the buttons on screen.
   ============================================================ */

function range(from, to){
  var a = [];
  for (var i = from; i <= to; i++) a.push(i);
  return a;
}

var CHALLENGES = [
  {
    id: "c1000",
    title: "The {total} Savings Challenge",
    strapline: "Save what you can, when you can. Every choice counts.",
    blurb: "The full challenge. Forty-four individual choices, from the smallest amount to the largest.",
    amounts: range(1, 42).concat([47, 50]),
    currencies: ["GBP", "EUR"],
    seed: 20260815
  },
  {
    id: "c500",
    title: "The {total} Starter Challenge",
    strapline: "A gentler way to begin, using smaller amounts whenever you have money available.",
    blurb: "A gentler place to begin, with smaller amounts and the same flexibility to save at your own pace.",
    amounts: range(1, 30).concat([35]),
    currencies: ["GBP", "EUR"],
    seed: 20260500
  }
];

var CURRENCIES = {
  GBP: { symbol: "\u00A3", name: "British pounds" },
  EUR: { symbol: "\u20AC", name: "Euros" }
};

/* ============================================================
   MEMBERSTACK STORAGE
   ------------------------------------------------------------
   When the page is inside the members' area and a member is
   signed in, her challenge selection, currency and completed
   amounts are written to her own Memberstack member record, so
   they follow her to any browser or device.

   The tool always keeps a copy on the device as well, so a
   dropped connection never loses a confirmed amount. If
   Memberstack is absent or the visitor is signed out, the tool
   behaves exactly as before and saves on the device only.

   namespace  the key inside the member's JSON record. Other
              Choice of Wealth tools can use the same record
              under their own namespace without collision.
   ============================================================ */
var MEMBERSTACK = {
  enabled: true,
  namespace: "savingsChallenges",
  waitMs: 4000,
  debounceMs: 800
};

var MESSAGES = [
  function(c, n, t){ return "Another choice completed. Your wealth grows one decision at a time."; },
  function(c, n, t){ return c + n + " added to your goal. Every choice counts."; },
  function(c, n, t){ return "Small actions can build meaningful results."; },
  function(c, n, t){ return "You have moved one step closer to your " + t + " goal."; },
  function(c, n, t){ return "Recorded. That amount is now sitting in your own savings account."; },
  function(c, n, t){ return "One more choice, made in your own time."; }
];

var MILESTONE_COPY = {
  25: { title: "A quarter of the way", line: "You have completed a quarter of the challenge. Steady choices, made on your terms." },
  50: { title: "Halfway", line: "Half of the challenge is behind you. The habit is doing the work now." },
  75: { title: "Three quarters", line: "Three quarters complete. The last stretch is yours to pace." },
  100:{ title: "You did it.", line: "Every amount mattered. Every choice moved you forward." }
};

/* ============================================================
   DERIVED CHALLENGE DATA
   ============================================================ */
function seededOrder(list, seed){
  var a = list.slice(), s = seed >>> 0;
  function rnd(){ s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }
  for (var i = a.length - 1; i > 0; i--){
    var j = Math.floor(rnd() * (i + 1));
    var t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}

var LIBRARY = {};
CHALLENGES.forEach(function(cfg){
  var clean = [];
  cfg.amounts.forEach(function(n){
    if (typeof n === "number" && n > 0 && n === Math.floor(n) && clean.indexOf(n) === -1) clean.push(n);
  });
  LIBRARY[cfg.id] = {
    id: cfg.id,
    titleTemplate: cfg.title,
    strapline: cfg.strapline,
    blurb: cfg.blurb,
    currencies: cfg.currencies && cfg.currencies.length ? cfg.currencies : ["GBP"],
    amounts: clean,
    ordered: clean.slice().sort(function(a,b){ return a-b; }),
    scattered: seededOrder(clean, cfg.seed || 1),
    shortName: cfg.title.replace("{total}", "").replace(/^The\s+/, "").replace(/\s{2,}/g, " ").trim(),
    total: clean.reduce(function(s,n){ return s+n; }, 0),
    count: clean.length
  };
});

/* ============================================================
   STATE + STORAGE
   ============================================================ */
var KEY = "cow_savings_v2";
var LEGACY_KEY = "cow_savings_challenge_v1";

var store = { active: null, challenges: {} };
var C = null;          /* active challenge definition */
var P = null;          /* active challenge progress   */
var editing = false;

function blankProgress(){
  return { currency: null, completed: [], milestones: [], msgIndex: 0, arrange: "scattered", name: "" };
}
function progressFor(id){
  if (!store.challenges[id]) store.challenges[id] = blankProgress();
  return store.challenges[id];
}

var Store = (function(){
  var hasHost = (typeof window !== "undefined") && window.storage && typeof window.storage.get === "function";
  var mem = null;
  function readLocal(key){
    try{ var raw = window.localStorage.getItem(key); return raw ? JSON.parse(raw) : null; }
    catch(e){ return null; }
  }
  return {
    load: function(key){
      if (hasHost){
        return window.storage.get(key).then(function(r){
          return (r && r.value) ? JSON.parse(r.value) : null;
        }).catch(function(){ return null; });
      }
      return Promise.resolve(readLocal(key) || (key === KEY ? mem : null));
    },
    save: function(obj){
      mem = obj;
      var s = JSON.stringify(obj);
      if (hasHost) return window.storage.set(KEY, s).catch(function(){ return null; });
      try{ window.localStorage.setItem(KEY, s); } catch(e){}
      return Promise.resolve(true);
    }
  };
})();

/* Memberstack member record. Reads and writes the namespace only,
   merging into whatever else the member record already holds. */
var MS = {
  api: null, available: false,
  init: function(){
    if (!MEMBERSTACK.enabled) return Promise.resolve(false);
    return new Promise(function(resolve){
      var waited = 0, step = 150;
      function findApi(){
        if (window.$memberstackDom) return window.$memberstackDom;
        try{
          if (window.parent && window.parent !== window && window.parent.$memberstackDom){
            return window.parent.$memberstackDom;
          }
        } catch(e){ /* cross-origin frame, nothing to reach */ }
        return null;
      }
      (function poll(){
        var api = findApi();
        if (api && typeof api.getCurrentMember === "function"){
          api.getCurrentMember().then(function(res){
            var m = res && res.data;
            if (m && m.id){ MS.api = api; MS.available = true; }
            resolve(MS.available);
          }).catch(function(){ resolve(false); });
          return;
        }
        waited += step;
        if (waited >= MEMBERSTACK.waitMs) return resolve(false);
        setTimeout(poll, step);
      })();
    });
  },
  load: function(){
    if (!MS.available) return Promise.resolve(null);
    return MS.api.getMemberJSON().then(function(res){
      var json = (res && res.data) || {};
      return json[MEMBERSTACK.namespace] || null;
    }).catch(function(){ return null; });
  },
  save: function(obj){
    if (!MS.available) return Promise.resolve(false);
    return MS.api.getMemberJSON().then(function(res){
      var json = (res && res.data) || {};
      json[MEMBERSTACK.namespace] = obj;
      return MS.api.updateMemberJSON({ json: json }).then(function(){ return true; });
    }).catch(function(){ return false; });
  }
};

var booting = true;
var touched = false;
var remoteTimer = null;

/* Nothing is written to the member record until the first read and
   comparison have finished. A write attempted before then is held,
   not discarded, and goes up straight after the comparison. */
var syncReady = false;
var baseline = null;          /* the device copy exactly as it loaded */
var resetDuringSync = {};     /* challenge ids reset before the comparison */

function hasProgress(){
  if (store.active) return true;
  var any = false;
  Object.keys(store.challenges).forEach(function(id){
    if (store.challenges[id] && store.challenges[id].completed.length) any = true;
  });
  return any;
}

function flushRemote(){
  clearTimeout(remoteTimer);
  remoteTimer = null;
  if (!syncReady) return;
  if (!MS.available || !hasProgress()) return;
  MS.save(store);
}

function scheduleRemote(){
  if (!MS.available) return;
  clearTimeout(remoteTimer);
  remoteTimer = setTimeout(flushRemote, MEMBERSTACK.debounceMs);
}

document.addEventListener("visibilitychange", function(){
  if (document.visibilityState === "hidden") flushRemote();
});

/* Device copy is written immediately. The member record follows,
   debounced, so a run of quick taps is one write rather than ten. */
function persist(){
  if (booting){ Store.save(store); return; }
  touched = true;
  store.updatedAt = Date.now();
  Store.save(store);
  scheduleRemote();
}

/* ============================================================
   HELPERS
   ============================================================ */
function $(id){ return document.getElementById(id); }
function esc(s){ return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }
function symOf(code){ return CURRENCIES[code] ? CURRENCIES[code].symbol : "\u00A3"; }
/* The symbol a challenge shows: the member's own choice once she has made it,
   otherwise the first currency listed for that challenge. */
function symFor(ch, p){
  var code = (p && p.currency && ch.currencies.indexOf(p.currency) !== -1) ? p.currency : ch.currencies[0];
  return symOf(code);
}
function sym(){ return C ? symFor(C, P) : "\u00A3"; }
function fmt(n){ return sym() + n.toLocaleString("en-GB"); }
function plain(n){ return n.toLocaleString("en-GB"); }
function tokens(text, ch, s){
  return String(text)
    .replace(/\{total\}/g, s + plain(ch.total))
    .replace(/\{min\}/g, s + plain(Math.min.apply(null, ch.amounts)))
    .replace(/\{max\}/g, s + plain(Math.max.apply(null, ch.amounts)))
    .replace(/\{count\}/g, plain(ch.count));
}
function titleOf(ch, symbol){ return tokens(ch.titleTemplate, ch, symbol || ""); }
function savedTotal(){ return P.completed.reduce(function(s,n){ return s+n; }, 0); }
function pctExact(){ return (savedTotal() / C.total) * 100; }

/* ============================================================
   SCREENS
   ============================================================ */
function show(which){
  $("chooser").hidden = which !== "chooser";
  $("gate").hidden = which !== "gate";
  $("challenge").hidden = which !== "challenge";
  window.scrollTo(0, 0);
}

/* ---------- Chooser ---------- */
function renderChooser(){
  var wrap = $("picks");
  wrap.innerHTML = "";
  CHALLENGES.forEach(function(cfg){
    var ch = LIBRARY[cfg.id];
    var p = store.challenges[cfg.id];
    var done = p && p.completed ? p.completed.reduce(function(s,n){ return s+n; }, 0) : 0;
    var symbol = symFor(ch, p);
    var pct = (done / ch.total) * 100;

    var b = document.createElement("button");
    b.type = "button";
    b.className = "pick";
    b.setAttribute("data-id", cfg.id);

    var progressLine = done > 0
      ? '<div class="pick__bar"><span style="width:' + pct + '%"></span></div>' +
        '<div class="pick__meta">' + symbol + plain(done) + " saved of " + symbol + plain(ch.total) +
        " &middot; " + p.completed.length + " of " + ch.count + " choices</div>"
      : '<div class="pick__meta">' + ch.count + " choices &middot; largest " +
        (symbol || "") + plain(Math.max.apply(null, ch.amounts)) + "</div>";

    b.innerHTML =
      '<div class="pick__total figure-num">' + (symbol || "") + plain(ch.total) + "</div>" +
      '<div class="pick__name">' + esc(ch.shortName) + "</div>" +
      '<div class="pick__blurb">' + esc(tokens(ch.blurb, ch, symbol)) + "</div>" +
      progressLine;

    b.setAttribute("aria-label",
      titleOf(ch, symbol) + ". " + ch.count + " choices. " +
      (done > 0 ? symbol + plain(done) + " saved so far." : "Not started."));

    wrap.appendChild(b);
  });
  show("chooser");
}

$("picks").addEventListener("click", function(e){
  var b = e.target.closest(".pick");
  if (!b) return;
  openChallenge(b.getAttribute("data-id"));
});

function openChallenge(id){
  C = LIBRARY[id];
  P = progressFor(id);
  store.active = id;
  persist();
  if (P.currency) enterChallenge();
  else renderGate();
}

/* ---------- Currency gate ---------- */
var pendingCurrency = null;

function renderGate(){
  pendingCurrency = null;
  $("gate-eyebrow").textContent = titleOf(C, "");
  $("gate-sub").textContent = tokens(C.strapline, C, "");
  $("gate-note").textContent = "The total stays at " + plain(C.total) +
    " in the currency you choose. Amounts are not converted.";

  var wrap = $("gate-choices");
  wrap.innerHTML = '<p id="cur-label" class="sr-only">Choose your currency</p>';
  wrap.style.gridTemplateColumns = C.currencies.length > 1 ? "1fr 1fr" : "1fr";

  C.currencies.forEach(function(code){
    var b = document.createElement("button");
    b.type = "button";
    b.className = "currency-card";
    b.setAttribute("aria-pressed", "false");
    b.setAttribute("data-currency", code);
    b.innerHTML =
      '<span class="currency-card__sym" aria-hidden="true">' + CURRENCIES[code].symbol + "</span>" +
      '<span class="currency-card__label">' + CURRENCIES[code].name + "</span>" +
      '<span class="currency-card__check">Selected</span>';
    b.setAttribute("aria-label", CURRENCIES[code].name + ". Total " + CURRENCIES[code].symbol + plain(C.total) + ".");
    wrap.appendChild(b);
  });

  $("start-btn").disabled = true;
  $("gate-back").hidden = CHALLENGES.length < 2;
  show("gate");
}

$("gate-choices").addEventListener("click", function(e){
  var card = e.target.closest(".currency-card");
  if (!card) return;
  pendingCurrency = card.getAttribute("data-currency");
  Array.prototype.forEach.call($("gate-choices").querySelectorAll(".currency-card"), function(c){
    c.setAttribute("aria-pressed", c === card ? "true" : "false");
  });
  $("start-btn").disabled = false;
});

$("start-btn").addEventListener("click", function(){
  if (!pendingCurrency) return;
  P.currency = pendingCurrency;
  persist();
  enterChallenge();
});

$("gate-back").addEventListener("click", function(){
  store.active = null;
  persist();
  renderChooser();
});

/* ---------- Challenge ---------- */
function enterChallenge(){
  ROOT.setAttribute("data-arrange", P.arrange);
  Array.prototype.forEach.call(document.querySelectorAll(".arrange__btn"), function(b){
    b.setAttribute("aria-pressed", b.getAttribute("data-arrange") === P.arrange ? "true" : "false");
  });
  $("switch-btn").hidden = CHALLENGES.length < 2;
  $("currency-btn").hidden = C.currencies.length < 2;
  $("head-title").textContent = titleOf(C, sym());
  $("head-sub").textContent = tokens(C.strapline, C, sym());
  $("grid-title").textContent = "Your " + C.count + " choices";
  buildGrid();
  renderDash();
  setEditing(false);
  show("challenge");
}

/* ============================================================
   GRID
   ============================================================ */
var grid = $("grid");
var tiles = {};

function buildGrid(){
  grid.innerHTML = "";
  tiles = {};
  var order = P.arrange === "ordered" ? C.ordered : C.scattered;
  var frag = document.createDocumentFragment();

  order.forEach(function(amount, i){
    var b = document.createElement("button");
    b.type = "button";
    b.className = "tile";
    b.setAttribute("data-amount", String(amount));
    b.setAttribute("data-done", "false");
    b.setAttribute("data-drift", String((i * 5 + (i % 3)) % 4));
    b.innerHTML =
      '<span class="tile__figure"><span class="tile__cur">' + sym() + "</span>" + amount + "</span>" +
      '<span class="tile__state">Saved</span>' +
      '<span class="tile__strike" aria-hidden="true"></span>';
    frag.appendChild(b);
    tiles[amount] = b;
  });

  grid.appendChild(frag);
  syncTiles();
}

function syncTiles(){
  C.amounts.forEach(function(amount){
    var t = tiles[amount];
    if (!t) return;
    var done = P.completed.indexOf(amount) !== -1;
    t.setAttribute("data-done", done ? "true" : "false");
    t.querySelector(".tile__cur").textContent = sym();

    if (editing){
      if (done){
        t.setAttribute("aria-label", fmt(amount) + ", saved. Select to remove it from your progress.");
        t.removeAttribute("aria-disabled");
      } else {
        t.setAttribute("aria-label", fmt(amount) + ", not yet saved. Not available while editing progress.");
        t.setAttribute("aria-disabled", "true");
      }
    } else if (done){
      t.setAttribute("aria-label", fmt(amount) + ", saved.");
      t.setAttribute("aria-disabled", "true");
    } else {
      t.setAttribute("aria-label", "Choose " + fmt(amount) + ". Not yet saved.");
      t.removeAttribute("aria-disabled");
    }
  });
}

/* ============================================================
   DASHBOARD
   ============================================================ */
function renderDash(){
  var saved = savedTotal();
  var exact = pctExact();
  var shown = Math.round(exact);

  $("d-saved").textContent = fmt(saved);
  $("d-of").textContent = "of " + fmt(C.total);
  $("d-remaining").textContent = fmt(C.total - saved);
  $("d-count").textContent = P.completed.length + " of " + C.count;
  $("d-pct").textContent = shown + "%";
  $("d-fill").style.width = exact + "%";
  $("complete-line").textContent = "You saved " + fmt(C.total) + " through " + C.count + " individual choices.";

  var bar = $("d-bar");
  bar.setAttribute("aria-valuenow", String(shown));
  bar.setAttribute("aria-valuetext", shown + " per cent complete. " + fmt(saved) + " saved of " + fmt(C.total) + ".");

  Array.prototype.forEach.call(document.querySelectorAll(".ledger__tick"), function(el){
    el.setAttribute("data-reached", exact >= parseInt(el.getAttribute("data-milestone"), 10) ? "true" : "false");
  });

  ROOT.setAttribute("data-complete", P.completed.length === C.count ? "true" : "false");
}

function announce(msg){ $("live").textContent = msg; }

/* ============================================================
   MODAL
   ============================================================ */
var scrim = $("scrim");
var modal = $("modal");
var lastFocus = null;
var modalOpen = false;

function openModal(html, opts){
  opts = opts || {};
  /* Chained panels (choose, then transfer) must remember the tile that
     started the journey, not the button that is about to be replaced. */
  var origin = document.activeElement;
  if (!modal.contains(origin)) lastFocus = origin;
  modal.className = "modal" + (opts.variant ? " modal--" + opts.variant : "");
  modal.innerHTML = html;
  scrim.setAttribute("data-open", "true");
  modalOpen = true;
  document.body.style.overflow = "hidden";
  var first = modal.querySelector("[data-autofocus]") || modal.querySelector("button, input, [tabindex]");
  if (first) setTimeout(function(){ first.focus(); }, 60);
}

function closeModal(){
  if (!modalOpen) return;
  scrim.setAttribute("data-open", "false");
  scrim.removeAttribute("data-locked");
  modalOpen = false;
  document.body.style.overflow = "";
  setTimeout(function(){ if (!modalOpen) modal.innerHTML = ""; }, 320);
  if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
}

document.addEventListener("keydown", function(e){
  if (!modalOpen) return;
  if (e.key === "Escape"){ e.preventDefault(); closeModal(); return; }
  if (e.key !== "Tab") return;
  var f = modal.querySelectorAll('button:not([disabled]), input, [href], [tabindex]:not([tabindex="-1"])');
  if (!f.length) return;
  var first = f[0], last = f[f.length - 1];
  if (e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
});

scrim.addEventListener("mousedown", function(e){
  if (e.target === scrim && !scrim.hasAttribute("data-locked")) closeModal();
});

/* ============================================================
   TRANSFER FLOW
   ============================================================ */
function openStepOne(amount){
  var a = esc(fmt(amount));
  openModal(
    '<p class="modal__eyebrow">Choice ' + (P.completed.length + 1) + " of " + C.count + "</p>" +
    '<h2 id="modal-title">Ready to make this choice?</h2>' +
    '<div class="modal__amount figure-num">' + a + "</div>" +
    "<p>Transfer " + a + " to your chosen savings account.</p>" +
    '<div class="modal__actions">' +
      '<button type="button" class="btn btn-primary" data-action="step2" data-autofocus>Transfer ' + a + " now</button>" +
      '<button type="button" class="btn btn-secondary" data-action="close">Not right now</button>' +
    "</div>" +
    '<p class="modal__fineprint">This button does not move any money. It is a prompt for you to make the transfer yourself, in your own banking app.</p>'
  );
  modal.setAttribute("data-amount", String(amount));
}

function openStepTwo(amount){
  var a = esc(fmt(amount));
  openModal(
    '<p class="modal__eyebrow">In your banking app</p>' +
    '<h2 id="modal-title">Over to you.</h2>' +
    "<p>Open your banking app and transfer " + a + " to your chosen savings account. Return here when the transfer is complete.</p>" +
    '<div class="modal__actions">' +
      '<button type="button" class="btn btn-primary" data-action="confirm" data-autofocus>I\u2019ve transferred it</button>' +
      '<button type="button" class="btn btn-secondary" data-action="close">Not right now</button>' +
    "</div>" +
    '<p class="modal__fineprint">Nothing is marked as saved until you confirm it here. Choice of Wealth cannot see your account and does not check your transfer.</p>'
  );
  modal.setAttribute("data-amount", String(amount));
}

function confirmAmount(amount){
  if (P.completed.indexOf(amount) !== -1) return;
  P.completed.push(amount);

  var msg = MESSAGES[P.msgIndex % MESSAGES.length](sym(), amount, fmt(C.total));
  P.msgIndex = (P.msgIndex + 1) % MESSAGES.length;

  persist();
  syncTiles();
  renderDash();

  var t = tiles[amount];
  if (t){
    t.setAttribute("data-flash", "true");
    setTimeout(function(){ t.removeAttribute("data-flash"); }, 600);
  }

  announce(fmt(amount) + " saved. " + fmt(savedTotal()) + " saved so far, " +
           fmt(C.total - savedTotal()) + " remaining, " + Math.round(pctExact()) + " per cent complete.");

  closeModal();
  showToast(msg, amount);
  checkMilestones();
}

/* ============================================================
   UNDO
   ============================================================ */
var toast = $("toast");
var toastTimer = null;
var undoTarget = null;

function showToast(msg, amount){
  undoTarget = amount;
  $("toast-msg").textContent = msg;
  $("toast-undo").hidden = (amount === null);
  toast.setAttribute("data-open", "true");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(hideToast, 12000);
}
function hideToast(){
  toast.setAttribute("data-open", "false");
  undoTarget = null;
  clearTimeout(toastTimer);
}
$("toast-undo").addEventListener("click", function(){
  if (undoTarget === null) return;
  removeAmount(undoTarget, true);
  hideToast();
});

function removeAmount(amount, silent){
  var i = P.completed.indexOf(amount);
  if (i === -1) return;
  P.completed.splice(i, 1);
  var exact = pctExact();
  P.milestones = P.milestones.filter(function(m){ return exact >= m; });
  persist();
  syncTiles();
  renderDash();
  announce(fmt(amount) + " removed from your progress. " + fmt(savedTotal()) + " saved so far.");
  if (!silent) showToast(fmt(amount) + " has been removed from your progress.", null);
}

/* ============================================================
   MILESTONES
   ============================================================ */
function checkMilestones(){
  var exact = pctExact();
  var marks = [25, 50, 75, 100];
  for (var i = 0; i < marks.length; i++){
    var m = marks[i];
    if (exact >= m && P.milestones.indexOf(m) === -1){
      P.milestones.push(m);
      persist();
      setTimeout(function(mark){ return function(){ showMilestone(mark); }; }(m), 620);
      return;
    }
  }
}

function ring(pct){
  var circ = 239;
  var offset = circ - (circ * (pct / 100));
  return '<div class="modal__ring" aria-hidden="true">' +
    '<svg width="88" height="88" viewBox="0 0 88 88">' +
      '<circle cx="44" cy="44" r="38" fill="none" stroke="#E8E4E1" stroke-width="4"></circle>' +
      '<circle class="ring-fg" cx="44" cy="44" r="38" fill="none" stroke="#FF4F9A" stroke-width="4" stroke-linecap="round" stroke-dasharray="' + circ + '" stroke-dashoffset="' + offset + '"></circle>' +
    "</svg>" +
    '<span class="figure-num">' + pct + "%</span></div>";
}

function showMilestone(m){
  var copy = MILESTONE_COPY[m];
  var body;
  if (m === 100){
    body = ring(100) +
      '<h2 id="modal-title">You did it.</h2>' +
      '<div class="modal__lines">' +
        "<p>You saved " + esc(fmt(C.total)) + " through " + C.count + " individual choices.</p>" +
        "<p>Every amount mattered. Every choice moved you forward.</p>" +
      "</div>" +
      '<div class="modal__actions">' +
        '<button type="button" class="btn btn-primary" data-action="certificate" data-autofocus>Create your certificate</button>' +
        '<button type="button" class="btn btn-secondary" data-action="close">Close</button>' +
      "</div>";
  } else {
    body = ring(m) +
      '<h2 id="modal-title">' + esc(copy.title) + "</h2>" +
      '<div class="modal__lines"><p>' + esc(copy.line) + "</p></div>" +
      '<div class="modal__actions"><button type="button" class="btn btn-primary" data-action="close" data-autofocus>Keep going</button></div>';
  }
  openModal(body, { variant: "milestone" });
}

/* ============================================================
   CERTIFICATE
   ============================================================ */
function openCertificate(){
  openModal(
    '<p class="modal__eyebrow">Certificate</p>' +
    '<h2 id="modal-title">Your completion certificate</h2>' +
    "<p>Add your name if you would like it on the certificate. You can leave this blank.</p>" +
    '<div class="cert-field">' +
      '<label for="cert-name">Name on certificate</label>' +
      '<input type="text" id="cert-name" maxlength="42" autocomplete="name" placeholder="Optional" value="' + esc(P.name) + '" data-autofocus>' +
    "</div>" +
    '<div class="modal__actions">' +
      '<button type="button" class="btn btn-primary" data-action="cert-download">Download certificate</button>' +
      '<button type="button" class="btn btn-secondary" data-action="cert-share">Share certificate</button>' +
      '<button type="button" class="btn-quiet" data-action="close">Close</button>' +
    "</div>",
    { variant: "milestone" }
  );
}

function letterspace(ctx, text, x, y, spacing){
  var chars = String(text).split(""), total = 0, i;
  for (i = 0; i < chars.length; i++) total += ctx.measureText(chars[i]).width + spacing;
  total -= spacing;
  var cx = x - total / 2;
  for (i = 0; i < chars.length; i++){
    ctx.fillText(chars[i], cx, y);
    cx += ctx.measureText(chars[i]).width + spacing;
  }
}

/* Steps a font down until the line fits inside the certificate border. */
function fitFont(ctx, text, maxWidth, template, size, floor){
  ctx.font = template.replace("{size}", size);
  while (size > floor && ctx.measureText(text).width > maxWidth){
    size -= 2;
    ctx.font = template.replace("{size}", size);
  }
  return size;
}

function drawCertificate(){
  var W = 1600, H = 1131;
  var c = document.createElement("canvas");
  c.width = W; c.height = H;
  var x = c.getContext("2d");

  x.fillStyle = "#FAF7F2"; x.fillRect(0, 0, W, H);
  x.strokeStyle = "#E8E4E1"; x.lineWidth = 2; x.strokeRect(56, 56, W - 112, H - 112);
  x.strokeStyle = "#8F7A6A"; x.lineWidth = 1; x.strokeRect(74, 74, W - 148, H - 148);

  x.textAlign = "left"; x.textBaseline = "alphabetic"; x.fillStyle = "#252326";
  x.font = '600 20px Inter, sans-serif';
  letterspace(x, "CHOICE OF WEALTH", W / 2, 214, 7);

  x.textAlign = "center";
  var safeW = W - 260;
  var heading = titleOf(C, sym());
  fitFont(x, heading, safeW, '300 {size}px "Cormorant Garamond", Georgia, serif', 92, 48);
  x.fillText(heading, W / 2, 360);

  x.fillStyle = "#FF4F9A"; x.fillRect(W / 2 - 60, 404, 120, 3);

  var y = 500;
  if (P.name){
    x.fillStyle = "#252326";
    x.font = '400 28px Inter, sans-serif';
    x.fillText("Completed by", W / 2, y);
    fitFont(x, P.name, safeW, 'italic 300 {size}px "Cormorant Garamond", Georgia, serif', 82, 40);
    x.fillText(P.name, W / 2, y + 96);
    y += 176;
  }

  x.fillStyle = "#252326";
  x.font = '400 30px Inter, sans-serif';
  x.fillText("Completed through " + C.count + " individual choices.", W / 2, y + 28);

  x.font = 'italic 300 46px "Cormorant Garamond", Georgia, serif';
  x.fillText("Every amount mattered. Every choice moved you forward.", W / 2, y + 118);

  var d = new Date();
  var months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  x.font = '400 24px Inter, sans-serif';
  x.fillText(d.getDate() + " " + months[d.getMonth()] + " " + d.getFullYear(), W / 2, H - 220);

  x.fillStyle = "#8F7A6A"; x.fillRect(W / 2 - 40, H - 186, 80, 1);
  x.fillStyle = "#252326"; x.font = '600 18px Inter, sans-serif';
  letterspace(x, "CHOICEOFWEALTH.COM", W / 2, H - 142, 5);

  return c;
}

function withFonts(fn){
  if (document.fonts && document.fonts.load){
    Promise.all([
      document.fonts.load('300 92px "Cormorant Garamond"'),
      document.fonts.load('italic 300 82px "Cormorant Garamond"'),
      document.fonts.load('600 20px Inter'),
      document.fonts.load('400 30px Inter')
    ]).then(fn).catch(fn);
  } else { fn(); }
}

function certFilename(){ return "choice-of-wealth-" + C.total + "-savings-challenge-certificate.png"; }

function downloadCertificate(){
  withFonts(function(){
    var a = document.createElement("a");
    a.href = drawCertificate().toDataURL("image/png");
    a.download = certFilename();
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    announce("Certificate downloaded.");
  });
}

function shareCertificate(){
  withFonts(function(){
    var c = drawCertificate();
    if (!c.toBlob || !navigator.share){ downloadCertificate(); return; }
    c.toBlob(function(blob){
      if (!blob){ downloadCertificate(); return; }
      try{
        var file = new File([blob], certFilename(), { type: "image/png" });
        if (navigator.canShare && navigator.canShare({ files: [file] })){
          navigator.share({
            files: [file],
            title: titleOf(C, sym()),
            text: "Completed through " + C.count + " individual choices."
          }).catch(function(){});
        } else { downloadCertificate(); }
      } catch(e){ downloadCertificate(); }
    }, "image/png");
  });
}

/* ============================================================
   RESET / CURRENCY / EDIT / SWITCH
   ============================================================ */
function openReset(){
  openModal(
    '<p class="modal__eyebrow">Reset</p>' +
    '<h2 id="modal-title">Reset ' + esc(titleOf(C, sym())) + "?</h2>" +
    "<p>This clears all " + P.completed.length + " completed choices in this challenge and returns its progress to " +
      esc(fmt(0)) + ". Other challenges are not affected, and your saved money is not affected in any way. This cannot be undone.</p>" +
    '<div class="modal__actions">' +
      '<button type="button" class="btn btn-secondary" data-action="close" data-autofocus>Keep my progress</button>' +
      '<button type="button" class="btn btn-danger" data-action="reset-confirm">Reset challenge</button>' +
    "</div>"
  );
  scrim.setAttribute("data-locked", "true");
}

function doReset(){
  if (!syncReady) resetDuringSync[C.id] = true;
  P.completed = []; P.milestones = []; P.msgIndex = 0; P.name = "";
  persist();
  syncTiles(); renderDash(); setEditing(false);
  closeModal(); hideToast();
  announce("Challenge reset. Nothing saved yet.");
}

function openCurrency(){
  var other = null;
  C.currencies.forEach(function(code){ if (code !== P.currency) other = code; });
  if (!other) return;
  openModal(
    '<p class="modal__eyebrow">Currency</p>' +
    '<h2 id="modal-title">Switch to ' + CURRENCIES[other].name + "?</h2>" +
    "<p>The challenge total stays at " + plain(C.total) + " and every amount stays the same. Only the symbol changes, from " +
      CURRENCIES[P.currency].symbol + " to " + CURRENCIES[other].symbol +
      ". Nothing is converted and your progress is kept.</p>" +
    '<div class="modal__actions">' +
      '<button type="button" class="btn btn-primary" data-action="currency-confirm" data-currency="' + other + '" data-autofocus>Switch to ' + CURRENCIES[other].symbol + "</button>" +
      '<button type="button" class="btn btn-secondary" data-action="close">Keep ' + CURRENCIES[P.currency].symbol + "</button>" +
    "</div>"
  );
}

function setCurrency(code){
  P.currency = code;
  persist();
  $("head-title").textContent = titleOf(C, sym());
  $("head-sub").textContent = tokens(C.strapline, C, sym());
  buildGrid(); renderDash(); closeModal();
  announce("Currency set to " + CURRENCIES[code].name + ".");
}

function setEditing(on){
  editing = on;
  ROOT.setAttribute("data-editing", on ? "true" : "false");
  var b = $("edit-btn");
  b.setAttribute("aria-pressed", on ? "true" : "false");
  b.textContent = on ? "Done editing" : "Edit progress";
  $("grid-hint").textContent = on
    ? "Select a completed amount to remove it from your progress."
    : "Choose any available amount, in any order.";
  syncTiles();
}

function openRemove(amount){
  openModal(
    '<p class="modal__eyebrow">Edit progress</p>' +
    '<h2 id="modal-title">Remove ' + esc(fmt(amount)) + " from your progress?</h2>" +
    "<p>This amount goes back to being available. Your savings account is not affected. Use this if you marked it by accident.</p>" +
    '<div class="modal__actions">' +
      '<button type="button" class="btn btn-primary" data-action="remove-confirm" data-amount="' + amount + '" data-autofocus>Remove ' + esc(fmt(amount)) + "</button>" +
      '<button type="button" class="btn btn-secondary" data-action="close">Keep it</button>' +
    "</div>"
  );
}

/* ============================================================
   EVENTS
   ============================================================ */
grid.addEventListener("click", function(e){
  var t = e.target.closest(".tile");
  if (!t) return;
  var amount = parseInt(t.getAttribute("data-amount"), 10);
  var done = t.getAttribute("data-done") === "true";
  if (editing){ if (done) openRemove(amount); return; }
  if (done) return;
  openStepOne(amount);
});

modal.addEventListener("click", function(e){
  var b = e.target.closest("[data-action]");
  if (!b) return;
  var action = b.getAttribute("data-action");
  var amount = parseInt(modal.getAttribute("data-amount"), 10);
  var input;

  if (action === "close"){ closeModal(); }
  else if (action === "step2"){ openStepTwo(amount); }
  else if (action === "confirm"){ confirmAmount(amount); }
  else if (action === "remove-confirm"){ removeAmount(parseInt(b.getAttribute("data-amount"), 10), false); closeModal(); }
  else if (action === "reset-confirm"){ doReset(); }
  else if (action === "currency-confirm"){ setCurrency(b.getAttribute("data-currency")); }
  else if (action === "certificate"){ openCertificate(); }
  else if (action === "cert-download"){ input = $("cert-name"); if (input){ P.name = input.value.trim(); persist(); } downloadCertificate(); }
  else if (action === "cert-share"){ input = $("cert-name"); if (input){ P.name = input.value.trim(); persist(); } shareCertificate(); }
});

$("edit-btn").addEventListener("click", function(){ setEditing(!editing); });
$("reset-btn").addEventListener("click", openReset);
$("currency-btn").addEventListener("click", openCurrency);
$("cert-open").addEventListener("click", openCertificate);
$("switch-btn").addEventListener("click", function(){
  setEditing(false);
  hideToast();
  store.active = null;
  persist();
  renderChooser();
});

Array.prototype.forEach.call(document.querySelectorAll(".arrange__btn"), function(btn){
  btn.addEventListener("click", function(){
    var mode = btn.getAttribute("data-arrange");
    if (mode === P.arrange) return;
    P.arrange = mode;
    ROOT.setAttribute("data-arrange", mode);
    Array.prototype.forEach.call(document.querySelectorAll(".arrange__btn"), function(b){
      b.setAttribute("aria-pressed", b.getAttribute("data-arrange") === mode ? "true" : "false");
    });
    persist();
    buildGrid();
    announce(mode === "ordered" ? "Amounts arranged by value." : "Amounts arranged in a scattered order.");
  });
});

/* ============================================================
   SELF-CHECK: runs for every challenge in the library
   ============================================================ */
(function selfCheck(){
  var problems = [];
  CHALLENGES.forEach(function(cfg){
    var ch = LIBRARY[cfg.id];
    if (!ch.count) problems.push(cfg.id + ": no valid amounts");
    if (ch.count !== cfg.amounts.length) problems.push(cfg.id + ": duplicate or invalid amounts were removed");
    if (ch.scattered.length !== ch.count) problems.push(cfg.id + ": layout order length mismatch");
    if (ch.scattered.reduce(function(a,b){ return a+b; }, 0) !== ch.total) problems.push(cfg.id + ": scattered order does not preserve the amounts");
    if (ch.count > 2 && ch.scattered.every(function(v,i,a){ return i === 0 || a[i-1] <= v; })) problems.push(cfg.id + ": scattered order came out sorted");
    if (cfg.title.indexOf("{total}") === -1) problems.push(cfg.id + ": title has no {total} placeholder");
  });
  var ids = CHALLENGES.map(function(c){ return c.id; });
  ids.forEach(function(id, i){ if (ids.indexOf(id) !== i) problems.push("duplicate challenge id: " + id); });

  if (problems.length) console.warn("Savings challenges self-check FAILED:", problems);
  else console.log("Savings challenges self-check: passed. " + CHALLENGES.map(function(c){
    var ch = LIBRARY[c.id];
    return c.id + " = " + ch.count + " amounts totalling " + ch.total;
  }).join("; ") + ".");
})();

/* ============================================================
   BOOT
   ============================================================ */
function sanitise(id, p){
  var ch = LIBRARY[id];
  var out = blankProgress();
  if (!p || typeof p !== "object") return out;
  if (p.currency && ch.currencies.indexOf(p.currency) !== -1) out.currency = p.currency;
  if (Array.isArray(p.completed)){
    out.completed = p.completed.filter(function(n, i, arr){
      return typeof n === "number" && ch.amounts.indexOf(n) !== -1 && arr.indexOf(n) === i;
    });
  }
  if (Array.isArray(p.milestones)) out.milestones = p.milestones.filter(function(m){ return [25,50,75,100].indexOf(m) !== -1; });
  if (typeof p.msgIndex === "number") out.msgIndex = p.msgIndex;
  if (p.arrange === "ordered" || p.arrange === "scattered") out.arrange = p.arrange;
  if (typeof p.name === "string") out.name = p.name.slice(0, 42);
  return out;
}

function adopt(raw){
  var next = { active: null, challenges: {}, updatedAt: (raw && raw.updatedAt) || 0 };
  Object.keys(LIBRARY).forEach(function(id){
    next.challenges[id] = sanitise(id, raw && raw.challenges ? raw.challenges[id] : null);
  });
  if (raw && raw.active && LIBRARY[raw.active]) next.active = raw.active;
  return next;
}

/* Replays anything the member did during the loading window on top of the
   newer member record, rather than uploading the older device copy whole.
   Additions she just confirmed are kept, removals she just made are applied,
   and everything already in her account is preserved. */
function mergeLocalChangesInto(target, base, local){
  Object.keys(LIBRARY).forEach(function(id){
    var ch = LIBRARY[id];
    var b = base.challenges[id] || blankProgress();
    var l = local.challenges[id] || blankProgress();
    var r = target.challenges[id] || blankProgress();

    if (resetDuringSync[id]){
      var fresh = blankProgress();
      fresh.currency = l.currency;
      fresh.arrange = l.arrange;
      target.challenges[id] = fresh;
      return;
    }

    l.completed.forEach(function(n){
      if (b.completed.indexOf(n) === -1 && r.completed.indexOf(n) === -1) r.completed.push(n);
    });
    b.completed.forEach(function(n){
      if (l.completed.indexOf(n) === -1){
        var i = r.completed.indexOf(n);
        if (i !== -1) r.completed.splice(i, 1);
      }
    });

    if (l.currency && l.currency !== b.currency) r.currency = l.currency;
    if (l.arrange !== b.arrange) r.arrange = l.arrange;
    if (l.name !== b.name) r.name = l.name;

    var pct = (r.completed.reduce(function(sum, n){ return sum + n; }, 0) / ch.total) * 100;
    l.milestones.forEach(function(m){ if (r.milestones.indexOf(m) === -1) r.milestones.push(m); });
    r.milestones = r.milestones.filter(function(m){ return pct >= m; });

    target.challenges[id] = r;
  });

  if (local.active && local.active !== base.active) target.active = local.active;
  return target;
}

function routeToScreen(){
  booting = true;
  Object.keys(LIBRARY).forEach(function(id){
    if (!store.challenges[id]) store.challenges[id] = blankProgress();
  });
  if (CHALLENGES.length === 1){
    openChallenge(CHALLENGES[0].id);
  } else if (store.active && LIBRARY[store.active]){
    openChallenge(store.active);
  } else {
    renderChooser();
  }
  booting = false;
}

Store.load(KEY).then(function(saved){
  if (saved && typeof saved === "object" && saved.challenges){
    store = adopt(saved);
    return null;
  }
  /* First run on a later build: import any progress from build 1. */
  return Store.load(LEGACY_KEY).then(function(old){
    if (old && Array.isArray(old.completed) && old.completed.length){
      store.challenges.c1000 = sanitise("c1000", {
        currency: old.currency, completed: old.completed, milestones: old.milestones,
        msgIndex: old.msgIndex, arrange: old.arrange, name: old.name
      });
      store.active = "c1000";
      store.updatedAt = Date.now();
      persist();
      console.log("Imported progress from the previous build.");
    }
    return null;
  }).catch(function(){ return null; });
}).catch(function(){ return null; }).then(function(){
  baseline = JSON.parse(JSON.stringify(store));
  /* Render straight away from the device copy, so nothing waits on the network. */
  routeToScreen();
  return MS.init();
}).then(function(signedIn){
  if (!signedIn){
    syncReady = true;
    console.log("Savings challenges: saving on this device only. No signed-in member found.");
    return null;
  }
  return MS.load().then(function(remote){
    var remoteIsNewer = remote && (remote.updatedAt || 0) > (store.updatedAt || 0);
    if (remoteIsNewer){
      store = mergeLocalChangesInto(adopt(remote), baseline, store);
      if (touched) store.updatedAt = Date.now();
      Store.save(store);
      if (store.active && LIBRARY[store.active]){
        C = LIBRARY[store.active];
        P = progressFor(store.active);
      }
      routeToScreen();
      console.log(touched
        ? "Savings challenges: account progress restored and this session's choices applied on top."
        : "Savings challenges: progress restored from the member's account.");
      syncReady = true;
      if (touched) flushRemote();
    } else {
      syncReady = true;
      flushRemote();
      console.log("Savings challenges: progress saving to the member's account.");
    }
    return null;
  });
}).catch(function(err){
  syncReady = true;
  console.warn("Savings challenges: member storage unavailable, this device only.", err);
});

})();
