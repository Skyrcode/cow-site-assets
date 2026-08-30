"use strict";
/* =========================================================
   CHOICE OF WEALTH™ — SCAM RED-FLAG CHECKER
   Logic module: configuration + deterministic evaluation
   + Memberstack member-record storage (members' area only).

   MEMBER STORAGE — HOW THIS DIFFERS FROM THE PROTOTYPE
   ------------------------------------------------------------
   This tool lives inside the gated members' area, so progress
   is saved to the signed-in member's own Memberstack record
   under its own namespace, not to this device's localStorage.
   That means a member's in-progress check follows her account,
   not the browser: she can start on her phone and finish on her
   laptop. Nothing is written to localStorage or any other
   on-device storage at all.

   Every answer schedules a small debounced write to the member
   record (so rapid clicks through the assessment don't fire a
   network request per click); a write is also flushed
   immediately when the tab is hidden or the check is completed,
   so nothing is lost. "Start again and clear my check" removes
   the saved record entirely.

   If Memberstack has not finished initialising yet, or no
   member is signed in, the check simply runs in memory for
   that page view with nothing persisted — there is no
   device-storage fallback, by design, since this tool is only
   ever shown to signed-in members.

   Nothing about the questions, scoring, results or PDF
   generator was changed from the original logic. Only the
   storage layer was rewritten.
   ========================================================= */

/* ---------- 1. CATEGORIES ---------- */
const CATEGORIES = [
  { id:"investment", title:"Investment or trading opportunity", desc:"Someone is asking me to invest, trade or move money." },
  { id:"contact",    title:"Message, email or phone call",      desc:"Someone contacted me unexpectedly." },
  { id:"purchase",   title:"Online purchase or payment",        desc:"I’m being asked to pay for something." },
  { id:"romance",    title:"Romance or personal relationship",  desc:"Someone I know online or personally is asking for money." },
  { id:"recovery",   title:"Money recovery service",            desc:"Someone says they can recover money I have already lost." },
  { id:"job",        title:"Job or business opportunity",       desc:"I’m being offered work, income or a business opportunity." },
  { id:"other",      title:"Something else",                    desc:"I’m not sure which category fits." }
];
const ALL = CATEGORIES.map(c => c.id);

/* ---------- 2. WARNING SIGN LIBRARY ---------- */
const SIGNS = {
  UNEXPECTED_CONTACT: {
    name:"Unexpected contact",
    critical:false,
    text:"Most financial fraud begins with contact you did not ask for. An approach that arrives out of nowhere deserves the same checks you would apply to a stranger at your door, however professional it looks.",
    verify:"Confirm who contacted you using details you find yourself, not the ones you were sent."
  },
  PRESSURE: {
    name:"Pressure",
    critical:false,
    text:"Pressure reduces the time you have to check information carefully. A genuine financial decision should allow you enough time to understand what you are agreeing to.",
    verify:"Decide on a date and time by which you will make the decision, and keep it."
  },
  SECRECY: {
    name:"Secrecy",
    critical:false,
    text:"Being asked to keep a payment, opportunity or relationship private removes a natural check on the decision. Being discouraged from seeking a second opinion can be an important warning sign. Give yourself permission to discuss the situation with someone you trust before continuing.",
    verify:"Tell one person you trust what is happening before you go any further."
  },
  PAYMENT_METHOD: {
    name:"Payment method",
    critical:false,
    text:"Some payment methods are difficult or impossible to reverse once sent. That does not make any method fraudulent in itself, but it does mean a mistake cannot easily be undone.",
    verify:"Ask why this payment method is required and whether a traceable, reversible alternative is available."
  },
  CHANGED_BANK_DETAILS: {
    name:"Changed bank details",
    critical:false,
    text:"Fraudsters may impersonate genuine businesses and provide replacement payment details. Confirm changes using a trusted contact method you already know.",
    verify:"Call the organisation on a number you already had and confirm the change before paying anything."
  },
  GUARANTEED_RETURNS: {
    name:"Guaranteed returns",
    critical:false,
    text:"Investment returns cannot normally be guaranteed. Be cautious when risk is minimised while returns are presented as certain.",
    verify:"Ask how the return is generated, what could go wrong and how much you could lose."
  },
  ADVANCE_FEE: {
    name:"Payment before payout",
    critical:true,
    text:"Unexpected requests for additional payment before money can be released, withdrawn or recovered deserve careful verification, particularly when the fee was not clearly disclosed beforehand.",
    verify:"Pause before making another payment. Ask for the fee and its basis in writing, and verify it independently."
  },
  REMOTE_ACCESS: {
    name:"Remote access",
    critical:true,
    text:"Remote-access software can allow another person to view or control your device. Never give financial account access to someone whose identity and purpose you have not independently verified.",
    verify:"Remove any software you were asked to install and check your accounts from a device nobody else has touched."
  },
  SECURITY_CODES: {
    name:"Security codes",
    critical:true,
    text:"One-time codes, passwords and recovery phrases protect your accounts. Someone asking for them may be trying to bypass that protection.",
    verify:"Contact your bank or account provider on a number you trust and tell them what was requested."
  },
  IMPERSONATION: {
    name:"Claimed identity",
    critical:false,
    text:"Names, telephone numbers, email addresses and online profiles can sometimes be copied or imitated. A claim to be your bank, a government body, a company or someone you know is a claim, not a confirmation, until you have checked it through a route of your own.",
    verify:"End the conversation and make contact again using a number or address you already trust."
  },
  IMPERSONATION_UNCONFIRMED: {
    name:"Identity not separately confirmed",
    critical:true,
    text:"The claimed identity has not yet been confirmed through a separate contact method. This is the single check that does the most work here, and it costs nothing but a few minutes. If an organisation contacts you unexpectedly, end the conversation and contact the organisation yourself using details you independently trust.",
    verify:"Hang up or close the message, then call the organisation on a number from your card, your statement or its official website."
  },
  MONEY_THROUGH_ACCOUNT: {
    name:"Money passing through your account",
    critical:false,
    text:"Receiving money and forwarding it on can leave you responsible for funds you are not able to account for, and accounts used this way are often frozen or closed. Understand where money has come from, and why it cannot travel directly, before it passes through your account.",
    verify:"Ask why the money cannot be sent directly to its destination, and speak to your own bank before agreeing to anything."
  },
  NOT_VERIFIED: {
    name:"Not yet verified",
    critical:false,
    text:"Independent verification is the single check that does the most work. Until it has happened, everything you know about this person or company has come from the person or company itself.",
    verify:"Find the organisation’s official website and telephone number yourself, then use those."
  },
  DETAILS_MISMATCH: {
    name:"Details that don’t match",
    critical:false,
    text:"Copied websites, lookalike email addresses and small spelling differences are designed to be missed at a glance. A detail that does not match what you found independently is worth taking seriously.",
    verify:"Compare the website address, email domain and company details letter by letter against the official record."
  },
  TOO_GOOD: {
    name:"Difficult to understand or unusually good",
    critical:false,
    text:"You do not need to understand every financial detail. You should, however, be able to ask questions and receive clear answers. Complexity that discourages questions is doing a job.",
    verify:"Write down your three biggest questions and ask them. Note whether you get clear answers."
  },
  PERSONAL_RELATIONSHIP: {
    name:"Personal relationship",
    critical:false,
    text:"Trust can develop quickly online. Requests for money should be considered separately from the emotional relationship.",
    verify:"Ask yourself what you would advise a friend to do in the same situation, then take a few days."
  },
  RECOVERY_APPROACH: {
    name:"Recovery approach",
    critical:false,
    text:"People who have already lost money can be targeted again by individuals claiming they can recover it for a fee. Independently verify any recovery organisation before paying.",
    verify:"Check the organisation against the official regulator or authority in your country before responding."
  },
  RECOVERY_PAYMENT: {
    name:"Payment to recover money",
    critical:true,
    text:"An upfront payment in return for recovering money you have already lost is a well-documented pattern of repeat targeting. Recovery normally begins with your own bank, the police or a regulator, not with an unexpected approach.",
    verify:"Report the approach to your bank and the relevant authority instead of paying anything."
  }
};

/* ---------- 3. QUESTION CONFIGURATION ---------- */
const YES = "yes", NO = "no", UNSURE = "unsure", NA = "na", PNA = "pna";

function std(flagId, yesW, unsureW, extras){
  const base = [
    { label:"Yes", value:YES, weight:yesW, flag:flagId },
    { label:"No", value:NO, weight:0, flag:null },
    { label:"I’m not sure", value:UNSURE, weight:unsureW, flag:flagId }
  ];
  return extras ? base.concat(extras) : base;
}
const OPT_NA  = { label:"Doesn’t apply", value:NA, weight:0, flag:null, muted:true };
const OPT_PNA = { label:"Prefer not to answer", value:PNA, weight:0, flag:null, muted:true };

const QUESTIONS = [
  {
    id:"q1", category:"Unexpected contact", appliesTo:ALL,
    question:"Did this person or company contact you unexpectedly?",
    helper:"This could be through WhatsApp, social media, email, text, a dating app or a phone call.",
    options:std("UNEXPECTED_CONTACT", 1, 1, [OPT_PNA])
  },
  {
    id:"q15", category:"Claimed identity", appliesTo:ALL,
    question:"Is the person claiming to be someone you know, your bank, a government organisation or another trusted organisation?",
    helper:"Names, telephone numbers, email addresses and online profiles can sometimes be copied or imitated. Verify the request using contact details you already trust.",
    options:std("IMPERSONATION", 2, 1, [OPT_NA, OPT_PNA])
  },
  {
    id:"q15b", category:"Claimed identity", appliesTo:ALL,
    dependsOn:{ id:"q15", value:YES },
    question:"Have you confirmed the request through a separate contact method?",
    helper:"For example, end the conversation and call the person or organisation using a number you already know or find independently.",
    options:[
      { label:"Yes, through a separate method", value:YES, weight:0, flag:null },
      { label:"No, not yet", value:NO, weight:3, flag:"IMPERSONATION_UNCONFIRMED" },
      { label:"I’m not sure", value:UNSURE, weight:2, flag:"IMPERSONATION_UNCONFIRMED" },
      OPT_PNA
    ]
  },
  {
    id:"q2", category:"Urgency", appliesTo:ALL,
    question:"Are you being encouraged to act quickly?",
    helper:"Examples include “today only”, “limited opportunity”, “your account will be closed” or pressure to make a decision before you have time to check.",
    options:std("PRESSURE", 2, 1, [OPT_PNA])
  },
  {
    id:"q3", category:"Secrecy", appliesTo:ALL,
    question:"Have you been discouraged from discussing this with someone you trust?",
    helper:"A request to keep an opportunity, relationship, payment or conversation secret can be an important warning sign.",
    options:std("SECRECY", 3, 1, [OPT_PNA])
  },
  {
    id:"q4", category:"Payment method", appliesTo:ALL,
    question:"Are you being asked to send money using an unusual or difficult-to-reverse payment method?",
    helper:"This might include cryptocurrency, gift cards, cash, payment to an individual, or moving money through several accounts. Using cryptocurrency does not by itself mean something is fraudulent.",
    options:std("PAYMENT_METHOD", 3, 1, [OPT_NA, OPT_PNA])
  },
  {
    id:"q5", category:"Payment details", appliesTo:ALL,
    question:"Have payment or bank details changed unexpectedly?",
    helper:"For example, an invoice arrives with new bank details or someone asks you to ignore payment instructions you used before.",
    options:std("CHANGED_BANK_DETAILS", 3, 1, [OPT_NA, OPT_PNA])
  },
  {
    id:"q16", category:"Money through your account", appliesTo:ALL,
    question:"Has anyone asked you to receive money into your account and then send some or all of it elsewhere?",
    helper:"Be cautious about allowing your bank account to be used to receive or forward money for someone else, particularly if you do not fully understand where the money came from.",
    options:std("MONEY_THROUGH_ACCOUNT", 3, 1, [OPT_NA, OPT_PNA])
  },
  {
    id:"q6", category:"Returns promised", appliesTo:["investment","job","contact","other"],
    question:"Are you being promised unusually high, guaranteed or very consistent returns?",
    helper:"Investments involve uncertainty. Claims that profits are guaranteed, risk-free or almost certain deserve additional checking.",
    options:std("GUARANTEED_RETURNS", 3, 1, [OPT_NA, OPT_PNA])
  },
  {
    id:"q7", category:"Additional payments", appliesTo:ALL,
    question:"Are you being asked to pay additional money before you can withdraw, receive or recover money?",
    helper:"Examples include unexpected “tax”, “release”, “verification”, “insurance” or “unlocking” fees.",
    options:std("ADVANCE_FEE", 3, 1, [OPT_NA, OPT_PNA])
  },
  {
    id:"q8", category:"Device and account access", appliesTo:ALL,
    question:"Has anyone asked for access to your phone, computer, banking app or financial account?",
    helper:"This includes installing remote-access software or asking you to share your screen.",
    options:std("REMOTE_ACCESS", 3, 1, [OPT_PNA])
  },
  {
    id:"q9", category:"Security information", appliesTo:ALL,
    question:"Has anyone asked for a password, PIN, one-time security code, recovery phrase or similar security information?",
    helper:"Treat requests for account security credentials with extreme caution. Never enter any of these into this tool.",
    options:std("SECURITY_CODES", 4, 2, [OPT_PNA])
  },
  {
    id:"q10", category:"Independent verification", appliesTo:ALL,
    question:"Have you independently checked who you are dealing with?",
    helper:"Independent means using contact details or websites you found yourself, not only links, telephone numbers or documents sent to you by the person.",
    options:[
      { label:"Yes, independently", value:"verified", weight:0, flag:null },
      { label:"Not yet", value:"notyet", weight:2, flag:"NOT_VERIFIED" },
      { label:"I’m not sure how", value:"unsurehow", weight:2, flag:"NOT_VERIFIED" },
      OPT_PNA
    ]
  },
  {
    id:"q11", category:"Company details", appliesTo:["investment","contact","purchase","recovery","job","other"],
    question:"Do the website, email address and company details match what you found independently?",
    helper:"Small spelling differences, copied websites and lookalike email addresses can be easy to miss.",
    options:[
      { label:"Yes, they match", value:YES, weight:0, flag:null },
      { label:"No, something is different", value:NO, weight:3, flag:"DETAILS_MISMATCH" },
      { label:"I haven’t checked", value:"unchecked", weight:1, flag:"NOT_VERIFIED" },
      OPT_NA,
      OPT_PNA
    ]
  },
  {
    id:"q12", category:"The offer itself", appliesTo:ALL,
    question:"Is any part of the offer difficult to understand or unusually good compared with what you would normally expect?",
    helper:"You do not need to understand every financial detail. You should, however, be able to ask questions and receive clear answers.",
    options:std("TOO_GOOD", 2, 1, [OPT_PNA])
  },
  {
    id:"q13", category:"Relationship", appliesTo:["romance","contact","investment","other"],
    question:"Is someone you have mainly or only known online asking you for money, investment funds or financial help?",
    helper:"Emotional trust and financial trust are not always the same thing.",
    options:std("PERSONAL_RELATIONSHIP", 3, 1, [OPT_NA, OPT_PNA])
  },
  {
    id:"q14", category:"Recovering lost money", appliesTo:["recovery","contact","other","investment"],
    question:"Has someone contacted you claiming they can recover money you previously lost?",
    helper:"Be especially cautious if they contacted you unexpectedly or want an upfront payment.",
    options:std("RECOVERY_APPROACH", 2, 1, [OPT_NA, OPT_PNA])
  },
  {
    id:"q14b", category:"Recovering lost money", appliesTo:ALL,
    dependsOn:{ id:"q14", value:YES },
    question:"Are they asking for money before returning the recovered funds?",
    helper:"A request for payment before recovered money is returned is a pattern seen repeatedly in follow-up fraud.",
    options:std("RECOVERY_PAYMENT", 3, 1, [OPT_PNA])
  }
];

/* ---------- 4. RESULT LEVELS ---------- */
const LEVELS = {
  1:{ key:"few",      heading:"Few warning signs identified",          badge:"Few warning signs identified" },
  2:{ key:"some",     heading:"Some warning signs are worth checking", badge:"Some warning signs identified" },
  3:{ key:"multiple", heading:"Multiple warning signs identified",     badge:"Multiple warning signs identified" }
};

/* ---------- 5. DETERMINISTIC EVALUATION ---------- */
function evaluate(answers, categoryId){
  let score = 0;
  const flags = [];
  const questions = questionsFor(categoryId, answers);

  questions.forEach(q => {
    const value = answers[q.id];
    if (value === undefined) return;
    const opt = q.options.find(o => o.value === value);
    if (!opt) return;
    score += opt.weight;
    if (opt.flag && !flags.includes(opt.flag)) flags.push(opt.flag);
  });

  let level = score >= 7 ? 3 : (score >= 3 ? 2 : 1);

  const is = (id,val) => answers[id] === val;
  const criticalRules = [];
  if (is("q9", YES)) criticalRules.push("security-information-requested");
  if (is("q8", YES) && (is("q4", YES) || is("q7", YES))) criticalRules.push("account-access-with-payment-request");
  if (is("q14b", YES) || (categoryId === "recovery" && is("q7", YES))) criticalRules.push("upfront-fee-to-recover-losses");
  if (is("q2", YES) && is("q3", YES) && is("q4", YES)) criticalRules.push("pressure-secrecy-and-unusual-payment");
  if (is("q15", YES) && (is("q15b", NO) || is("q15b", UNSURE))) criticalRules.push("impersonation-not-independently-confirmed");
  if (criticalRules.length) level = 3;

  return { level, score, flags, criticalRules };
}

function questionsFor(categoryId, answers){
  return QUESTIONS.filter(q => {
    if (q.dependsOn) return answers[q.dependsOn.id] === q.dependsOn.value;
    return q.appliesTo.includes(categoryId);
  });
}

/* ---------- 6. RESULT COPY ---------- */
const RESULT_COPY = {
  1:{
    copy:[
      "Based on your answers, this check identified relatively few of the warning signs included in this tool.",
      "That doesn’t automatically mean everything is genuine.",
      "Before sending money or sharing personal information, it is still worth independently confirming who you are dealing with."
    ],
    primary:{ label:"Show me what to verify", go:"verify" },
    secondary:null
  },
  2:{
    copy:[
      "A few things in your answers deserve a closer look.",
      "This does not prove that the person, company or opportunity is fraudulent. It does mean that pausing before sending money or sharing information would be sensible."
    ],
    primary:{ label:"Help me verify this", go:"verify" },
    secondary:{ label:"I’ve already sent money", go:"acted" }
  },
  3:{
    copy:[
      "Several of your answers match patterns commonly seen in financial scams or impersonation attempts.",
      "That does not allow this tool to confirm fraud, but it is a strong reason to stop and independently verify the situation before taking another financial action."
    ],
    primary:{ label:"Show my next steps", go:"verify" },
    secondary:{ label:"I’ve already sent money or information", go:"acted" }
  }
};

const BEFORE_YOU_CONTINUE = [
  "Find the organisation’s official website yourself.",
  "Confirm contact details independently.",
  "Check payment details before transferring money.",
  "Read important terms before agreeing.",
  "Never share passwords, PINs or one-time security codes.",
  "Give yourself time to think."
];

const NEXT_STEPS = [
  { num:"01", name:"Pause",   text:"Do not make another payment simply because someone says it is urgent." },
  { num:"02", name:"Verify",  text:"Contact the bank, business, regulator or organisation through contact information you find independently." },
  { num:"03", name:"Protect", text:"Do not share passwords, PINs, security codes or recovery phrases." },
  { num:"04", name:"Ask",     text:"Speak to someone you trust before proceeding if you are uncertain." }
];

const ACTED_ITEMS = [
  { t:"If money was sent", p:["Contact your bank, card provider or payment service as soon as possible and explain your concern.","Do not send additional money simply because someone says another payment is required to release or recover the first payment."] },
  { t:"If bank or card information was shared", p:["Contact the relevant financial provider through verified contact details."] },
  { t:"If a password was shared", p:["Change it immediately anywhere it is used and review account security."] },
  { t:"If a security code was shared", p:["Contact the relevant bank or account provider immediately."] },
  { t:"If remote-access software was installed", p:["Disconnect the device from sensitive accounts and seek trusted technical support. Contact your financial provider if banking information may have been exposed."] },
  { t:"If identity documents were shared", p:["Follow identity-protection guidance from the relevant authorities in your country and monitor relevant accounts."] },
  { t:"If money was lost", p:["Consider reporting the incident to the appropriate fraud, police, financial or consumer-protection authority."] }
];

/* ---------- 7. PDF WRITER (no libraries, no network) ---------- */
const PdfWriter = (function(){
  const WIN = {"\u2019":0x92,"\u2018":0x91,"\u201C":0x93,"\u201D":0x94,"\u2013":0x96,
               "\u2014":0x97,"\u2122":0x99,"\u00A3":0xA3,"\u2026":0x85,"\u2022":0x95,"\u2713":0x2D};
  const FW = { F1:0.50, F2:0.54, F3:0.46 };

  function esc(str){
    let out = "";
    for (const ch of String(str)){
      let code = (WIN[ch] !== undefined) ? WIN[ch] : ch.codePointAt(0);
      if (code > 255) code = 63;
      if (code === 40 || code === 41 || code === 92) out += "\\" + String.fromCharCode(code);
      else if (code < 32 || code > 126) out += "\\" + ("00" + code.toString(8)).slice(-3);
      else out += String.fromCharCode(code);
    }
    return out;
  }

  function wrap(str, font, size, width){
    const per = size * FW[font];
    const max = Math.max(10, Math.floor(width / per));
    const words = String(str).split(/\s+/).filter(Boolean);
    const lines = []; let line = "";
    words.forEach(w => {
      if (line && (line.length + 1 + w.length) > max){ lines.push(line); line = w; }
      else line = line ? line + " " + w : w;
    });
    if (line) lines.push(line);
    return lines.length ? lines : [""];
  }

  function build(blocks){
    const PW = 595.28, PH = 841.89, M = 56, W = PW - M * 2;
    const pages = [];
    let ops = [], y = PH - M;

    function flush(){ pages.push(ops.join("\n")); ops = []; y = PH - M; }
    function ensure(h){ if (y - h < M + 20) flush(); }
    function put(str, font, size, leading, x, w, rgb){
      wrap(str, font, size, w).forEach(l => {
        ensure(leading);
        ops.push("BT " + rgb + " rg /" + font + " " + size + " Tf 1 0 0 1 " +
                 x.toFixed(2) + " " + y.toFixed(2) + " Tm (" + esc(l) + ") Tj ET");
        y -= leading;
      });
    }
    function rule(){
      ensure(12);
      ops.push("0.88 0.85 0.82 rg " + M + " " + (y + 7).toFixed(2) + " " + W.toFixed(2) + " 0.6 re f");
      y -= 13;
    }

    blocks.forEach(b => {
      if (b.type === "brand")      put(b.text, "F2", 8, 15, M, W, "0.09 0.31 0.36");
      else if (b.type === "title"){ y -= 4; put(b.text, "F2", 22, 27, M, W, "0.10 0.10 0.10"); y -= 6; }
      else if (b.type === "meta")   put(b.text, "F1", 10, 15, M, W, "0.40 0.40 0.40");
      else if (b.type === "h2"){ y -= 16; ensure(34); put(b.text.toUpperCase(), "F2", 9, 13, M, W, "0.09 0.31 0.36"); rule(); }
      else if (b.type === "p"){ put(b.text, "F1", 10.5, 15, M, W, "0.17 0.17 0.17"); y -= 6; }
      else if (b.type === "note"){ put(b.text, "F3", 9, 13, M, W, "0.38 0.38 0.38"); y -= 4; }
      else if (b.type === "space") y -= (b.h || 12);
      else if (b.type === "bullet"){
        const x = M + 16, w = W - 16;
        wrap(b.text, "F1", 10.5, w).forEach((l, i) => {
          ensure(15);
          if (i === 0){
            ops.push("BT 0.77 0.10 0.48 rg /F2 10.5 Tf 1 0 0 1 " + M + " " + y.toFixed(2) +
                     " Tm (" + esc("\u2022") + ") Tj ET");
          }
          ops.push("BT 0.17 0.17 0.17 rg /F1 10.5 Tf 1 0 0 1 " + x.toFixed(2) + " " +
                   y.toFixed(2) + " Tm (" + esc(l) + ") Tj ET");
          y -= 15;
        });
        y -= 5;
      }
    });
    flush();

    const n = pages.length;
    const objs = [];
    const kids = [];
    for (let i = 0; i < n; i++) kids.push((3 + i * 2) + " 0 R");
    objs[1] = "<< /Type /Catalog /Pages 2 0 R >>";
    objs[2] = "<< /Type /Pages /Count " + n + " /Kids [" + kids.join(" ") + "] >>";
    const fb = 3 + n * 2;
    for (let i = 0; i < n; i++){
      const pn = 3 + i * 2, cn = pn + 1;
      objs[pn] = "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources " +
                 "<< /Font << /F1 " + fb + " 0 R /F2 " + (fb + 1) + " 0 R /F3 " + (fb + 2) + " 0 R >> >> " +
                 "/Contents " + cn + " 0 R >>";
      objs[cn] = "<< /Length " + pages[i].length + " >>\nstream\n" + pages[i] + "\nendstream";
    }
    objs[fb]     = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>";
    objs[fb + 1] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>";
    objs[fb + 2] = "<< /Type /Font /Subtype /Type1 /BaseFont /Times-Italic /Encoding /WinAnsiEncoding >>";
    objs[fb + 3] = "<< /Title (My red-flag check) /Producer (Choice of Wealth Scam Red-Flag Checker) >>";

    let out = "%PDF-1.4\n";
    const off = [];
    for (let i = 1; i < objs.length; i++){
      off[i] = out.length;
      out += i + " 0 obj\n" + objs[i] + "\nendobj\n";
    }
    const xref = out.length;
    out += "xref\n0 " + objs.length + "\n0000000000 65535 f \n";
    for (let i = 1; i < objs.length; i++) out += ("0000000000" + off[i]).slice(-10) + " 00000 n \n";
    out += "trailer\n<< /Size " + objs.length + " /Root 1 0 R /Info " + (fb + 3) + " 0 R >>\n" +
           "startxref\n" + xref + "\n%%EOF";

    const bytes = new Uint8Array(out.length);
    for (let i = 0; i < out.length; i++) bytes[i] = out.charCodeAt(i) & 0xFF;
    return bytes;
  }

  function save(bytes, filename){
    const blob = new Blob([bytes], { type:"application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  return { build, save, esc, wrap };
})();

/* =========================================================
   APPLICATION STATE + RENDERING
   ========================================================= */
const state = {
  category:null,
  answers:{},
  index:0,
  result:null,
  lastScreen:"hero"
};

const $ = sel => document.querySelector(sel);

/* ============================================================
   STORAGE — signed-in member's account only (no device storage)
   ------------------------------------------------------------
   Category, answers and position only — never notes, results
   or the internal score. Expires after 24 hours.
   ============================================================ */
const STORE_TTL = 24 * 60 * 60 * 1000;

const MEMBERSTACK = {
  enabled: true,
  namespace: "scamRedFlagChecker",
  waitMs: 4000,
  debounceMs: 800
};

/* Memberstack member record. Reads and writes the namespace only,
   merging into whatever else the member record already holds. */
const MS = {
  api: null, available: false,
  init(){
    if (!MEMBERSTACK.enabled) return Promise.resolve(false);
    return new Promise(resolve => {
      let waited = 0; const step = 150;
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
        const api = findApi();
        if (api && typeof api.getCurrentMember === "function"){
          api.getCurrentMember().then(res => {
            const m = res && res.data;
            if (m && m.id){ MS.api = api; MS.available = true; }
            resolve(MS.available);
          }).catch(() => resolve(false));
          return;
        }
        waited += step;
        if (waited >= MEMBERSTACK.waitMs) return resolve(false);
        setTimeout(poll, step);
      })();
    });
  },
  load(){
    if (!MS.available) return Promise.resolve(null);
    return MS.api.getMemberJSON().then(res => {
      const json = (res && res.data) || {};
      return json[MEMBERSTACK.namespace] || null;
    }).catch(() => null);
  },
  save(payload){
    if (!MS.available) return Promise.resolve(false);
    return MS.api.getMemberJSON().then(res => {
      const json = (res && res.data) || {};
      json[MEMBERSTACK.namespace] = payload;
      return MS.api.updateMemberJSON({ json }).then(() => true);
    }).catch(() => false);
  }
};

let syncReady = false;      // true once the initial sign-in check has run
let remoteTimer = null;     // debounce handle for the next account write
let remoteCache = null;     // last payload loaded from / written to the account

function currentPayload(){
  if (!state.category) return null;
  return { v:"1.1", t:Date.now(), category:state.category, answers:state.answers, index:state.index };
}

function validPayload(p){
  return !!(p && p.category && CATEGORIES.some(c => c.id === p.category) &&
            (Date.now() - (p.t || 0) <= STORE_TTL));
}

function flushRemote(){
  clearTimeout(remoteTimer);
  remoteTimer = null;
  if (!syncReady || !MS.available) return;
  const payload = currentPayload();
  if (!payload) return;
  remoteCache = payload;
  MS.save(payload);
}
function scheduleRemote(){
  if (!MS.available) return;
  clearTimeout(remoteTimer);
  remoteTimer = setTimeout(flushRemote, MEMBERSTACK.debounceMs);
}
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") flushRemote();
});
window.addEventListener("pagehide", flushRemote);

/* Nothing is written to this device. Every change schedules a
   debounced write straight to the member's account. If no member
   is signed in (or Memberstack hasn't finished initialising),
   the check simply runs in memory for this page view only. */
function saveProgress(){
  if (!state.category) return;
  scheduleRemote();
}
function clearProgress(){
  clearTimeout(remoteTimer);
  remoteTimer = null;
  remoteCache = null;
  if (syncReady && MS.available) MS.save(null);
}

const screens = {
  hero:   $("#screen-hero"),
  step1:  $("#screen-step1"),
  assess: $("#screen-assess"),
  result: $("#screen-result"),
  verify: $("#screen-verify"),
  acted:  $("#screen-acted")
};
const closer = $("#closer");

function show(name){
  Object.keys(screens).forEach(k => { screens[k].hidden = (k !== name); });
  closer.hidden = (name === "assess");
  if (name !== "verify" && name !== "acted") state.lastScreen = name;
  window.scrollTo({ top:0, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  const focusTarget = screens[name].querySelector("h1, h2, legend");
  if (focusTarget){
    focusTarget.setAttribute("tabindex","-1");
    focusTarget.focus({ preventScroll:true });
  }
}
function prefersReducedMotion(){
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/* ---------- Step 1: category cards ---------- */
function renderCategories(){
  const grid = $("#categoryGrid");
  grid.innerHTML = "";
  CATEGORIES.forEach(c => {
    const label = document.createElement("label");
    label.className = "choice";
    label.innerHTML =
      '<input type="radio" name="category" value="' + c.id + '">' +
      '<span class="choice__tick" aria-hidden="true">✓</span>' +
      '<span class="choice__title">' + c.title + '</span>' +
      '<span class="choice__desc">' + c.desc + '</span>';
    label.querySelector("input").addEventListener("change", e => {
      state.category = e.target.value;
      grid.querySelectorAll(".choice").forEach(el => el.classList.remove("is-selected"));
      label.classList.add("is-selected");
      $("#startBtn").disabled = false;
    });
    grid.appendChild(label);
  });
}

/* ---------- Assessment ---------- */
function activeQuestions(){
  return questionsFor(state.category, state.answers);
}

function renderQuestion(){
  const list = activeQuestions();
  if (state.index >= list.length){ finish(); return; }

  const q = list[state.index];
  const total = list.length;

  $("#qCategory").textContent = q.category;
  $("#qText").textContent = q.question;
  $("#qHelper").textContent = q.helper;
  $("#qCount").textContent = (state.index + 1) + " of " + total;

  const bar = $("#progressBar");
  bar.innerHTML = "";
  for (let i = 0; i < total; i++){
    const seg = document.createElement("span");
    seg.className = "progress__seg" + (i < state.index ? " is-done" : (i === state.index ? " is-current" : ""));
    bar.appendChild(seg);
  }

  const box = $("#qAnswers");
  box.innerHTML = "";
  q.options.forEach((opt, i) => {
    const label = document.createElement("label");
    label.className = "answer" + (opt.muted ? " answer--muted" : "");
    const checked = state.answers[q.id] === opt.value ? " checked" : "";
    label.innerHTML =
      '<input type="radio" name="' + q.id + '" value="' + opt.value + '"' + checked + '>' +
      '<span class="answer__dot" aria-hidden="true"></span>' +
      '<span class="answer__txt">' + opt.label + '</span>';
    if (checked) label.classList.add("is-selected");
    label.querySelector("input").addEventListener("change", () => {
      state.answers[q.id] = opt.value;
      box.querySelectorAll(".answer").forEach(el => el.classList.remove("is-selected"));
      label.classList.add("is-selected");
      $("#nextBtn").disabled = false;
      saveProgress();
    });
    box.appendChild(label);
  });

  $("#nextBtn").disabled = state.answers[q.id] === undefined;
  $("#backBtn").textContent = state.index === 0 ? "Change what I’m checking" : "Back";
}

function pruneDependents(){
  QUESTIONS.forEach(q => {
    if (q.dependsOn && state.answers[q.dependsOn.id] !== q.dependsOn.value) delete state.answers[q.id];
  });
}

function next(){
  const list = activeQuestions();
  const q = list[state.index];
  if (state.answers[q.id] === undefined) return;
  pruneDependents();
  state.index++;
  const updated = activeQuestions();
  saveProgress();
  if (state.index >= updated.length) finish(); else renderQuestion();
}

function back(){
  if (state.index === 0){ show("step1"); return; }
  state.index--;
  saveProgress();
  renderQuestion();
}

/* ---------- Result ---------- */
function finish(){
  state.result = evaluate(state.answers, state.category);
  renderResult();
  show("result");
}

function renderResult(){
  const r = state.result;
  const level = LEVELS[r.level];
  const copy = RESULT_COPY[r.level];

  const badge = $("#resultBadge");
  badge.className = "result__badge result__badge--" + ["","one","two","three"][r.level];
  badge.innerHTML =
    '<span class="marks" aria-hidden="true">' +
      [1,2,3].map(n => '<span class="mark' + (n <= r.level ? " on" : "") + '"></span>').join("") +
    '</span><span>' + level.badge + '</span>';

  $("#resultHeading").textContent = level.heading;
  $("#resultCopy").innerHTML = copy.copy.map(p => "<p>" + p + "</p>").join("");

  const extra = $("#resultExtra");
  extra.innerHTML = "";

  if (r.level === 1){
    const h = document.createElement("div");
    h.style.marginTop = "44px";
    h.innerHTML =
      '<h3 class="h3">Before you continue</h3>' +
      '<ul class="checklist">' +
        BEFORE_YOU_CONTINUE.map(i => '<li><span class="ck" aria-hidden="true">✓</span><span>' + i + '</span></li>').join("") +
      '</ul>';
    extra.appendChild(h);
  }

  if (r.level === 2){
    const e = document.createElement("p");
    e.className = "editorial";
    e.textContent = "Pause first. Verify second. Decide third.";
    extra.appendChild(e);
  }

  if (r.level === 3){
    const c = document.createElement("div");
    c.className = "callout";
    c.innerHTML =
      '<p class="callout__title">You do not have to continue</p>' +
      '<p>You are allowed to stop a conversation, delay a payment and check independently.</p>';
    extra.appendChild(c);

    const steps = document.createElement("div");
    steps.className = "steps";
    steps.innerHTML = NEXT_STEPS.map(s =>
      '<div class="step"><span class="step__num">' + s.num + '</span>' +
      '<span class="step__name">' + s.name + '</span><p>' + s.text + '</p></div>'
    ).join("");
    extra.appendChild(steps);
  }

  const block = $("#signsBlock");
  const listEl = $("#signsList");
  listEl.innerHTML = "";
  if (r.flags.length && r.level > 1){
    block.hidden = false;
    block.querySelector(".h3").textContent = r.level === 3 ? "Why these signs matter" : "The signs you identified";
    r.flags.forEach(key => {
      const s = SIGNS[key];
      const el = document.createElement("article");
      el.className = "sign" + (s.critical ? " sign--critical" : "");
      el.innerHTML =
        '<div class="sign__top"><span class="sign__name">' + s.name + '</span>' +
        '<span class="sign__tag">' + (s.critical ? "Important sign" : "Sign identified") + '</span></div>' +
        '<p>' + s.text + '</p>' +
        '<div class="sign__verify"><b>What you can check</b>' + s.verify + '</div>';
      listEl.appendChild(el);
    });
  } else {
    block.hidden = true;
  }

  const actions = $("#resultActions");
  actions.innerHTML = "";
  const primary = document.createElement("button");
  primary.className = "btn btn--primary";
  primary.textContent = copy.primary.label;
  primary.addEventListener("click", () => show(copy.primary.go));
  actions.appendChild(primary);

  if (copy.secondary){
    const sec = document.createElement("button");
    sec.className = "btn btn--ghost";
    sec.textContent = copy.secondary.label;
    sec.addEventListener("click", () => show(copy.secondary.go));
    actions.appendChild(sec);
  }

  const restart = document.createElement("button");
  restart.className = "linkbtn";
  restart.textContent = "Start again and clear my check";
  restart.addEventListener("click", restartCheck);
  actions.appendChild(restart);
}

function restartCheck(){
  clearProgress();
  state.category = null;
  state.answers = {};
  state.index = 0;
  state.result = null;
  $("#notesField").value = "";
  $("#notesWarn").hidden = true;
  document.querySelectorAll('input[name="category"]').forEach(i => { i.checked = false; });
  document.querySelectorAll("#categoryGrid .choice").forEach(el => el.classList.remove("is-selected"));
  $("#startBtn").disabled = true;
  show("hero");
}

/* ---------- Already acted accordion ---------- */
function renderActed(){
  const wrap = $("#actedList");
  wrap.innerHTML = "";
  ACTED_ITEMS.forEach((item, i) => {
    const row = document.createElement("div");
    row.className = "acted-item";
    const panelId = "acted-panel-" + i;
    row.innerHTML =
      '<h3><button class="acted-item__btn" aria-expanded="false" aria-controls="' + panelId + '">' + item.t + '</button></h3>' +
      '<div class="acted-item__panel" id="' + panelId + '" hidden>' + item.p.map(p => "<p>" + p + "</p>").join("") + '</div>';
    const btn = row.querySelector("button");
    const panel = row.querySelector(".acted-item__panel");
    btn.addEventListener("click", () => {
      const open = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", String(!open));
      panel.hidden = open;
    });
    wrap.appendChild(row);
  });
}

/* ---------- Save my check ---------- */
const SENSITIVE = /(?:\d[ -]?){12,}|\b\d{6,}\b/;

function buildPrintSheet(){
  const r = state.result;
  const cat = CATEGORIES.find(c => c.id === state.category);
  const date = new Date().toLocaleDateString("en-GB", { day:"numeric", month:"long", year:"numeric" });

  $("#psDate").textContent = date;
  $("#psCategory").textContent = cat ? cat.title : "Not recorded";

  const flags = r ? r.flags : [];
  $("#psSigns").innerHTML = flags.length
    ? "<ul>" + flags.map(k => "<li>" + SIGNS[k].name + ": " + SIGNS[k].text + "</li>").join("") + "</ul>"
    : "<p>This check did not identify the warning signs included in this tool. That does not confirm that anything is genuine.</p>";

  const checks = flags.length ? flags.map(k => SIGNS[k].verify) : BEFORE_YOU_CONTINUE;
  $("#psVerify").innerHTML = "<ul>" + checks.map(v => "<li>" + v + "</li>").join("") + "</ul>";

  const notes = $("#notesField").value.trim();
  $("#psNotes").textContent = notes || "(No notes added)";
}

function checkBlocks(){
  const r = state.result;
  const cat = CATEGORIES.find(c => c.id === state.category);
  const date = new Date().toLocaleDateString("en-GB", { day:"numeric", month:"long", year:"numeric" });
  const flags = r ? r.flags : [];
  const notes = $("#notesField").value.trim();

  const b = [];
  b.push({ type:"brand", text:"CHOICE OF WEALTH\u2122" });
  b.push({ type:"title", text:"My red-flag check" });
  b.push({ type:"meta",  text:date });

  b.push({ type:"h2", text:"Type of situation checked" });
  b.push({ type:"p",  text:cat ? cat.title + ". " + cat.desc : "Not recorded." });

  b.push({ type:"h2", text:"Warning signs identified" });
  if (flags.length){
    flags.forEach(k => b.push({ type:"bullet", text:SIGNS[k].name + ". " + SIGNS[k].text }));
  } else {
    b.push({ type:"p", text:"This check did not identify the warning signs included in this tool. That does not confirm that anything is genuine, and it is still worth checking who you are dealing with." });
  }

  b.push({ type:"h2", text:"Things to verify" });
  (flags.length ? flags.map(k => SIGNS[k].verify) : BEFORE_YOU_CONTINUE)
    .forEach(v => b.push({ type:"bullet", text:v }));

  b.push({ type:"h2", text:"My notes" });
  b.push({ type:"p", text:notes || "(No notes added)" });

  b.push({ type:"h2", text:"Safety reminder" });
  b.push({ type:"p", text:"Never share passwords, PINs, one-time security codes or recovery phrases. You are allowed to stop a conversation, delay a payment and check independently." });

  b.push({ type:"space", h:10 });
  b.push({ type:"note", text:"This is an educational awareness record only. It does not state that any person, company or opportunity is genuine or fraudulent, and it contains no score or probability. If you believe fraud may have occurred, contact your financial provider and the appropriate authorities in your country." });
  return b;
}

function notesAreSafe(){
  const notes = $("#notesField").value;
  if (SENSITIVE.test(notes)){
    $("#notesWarn").hidden = false;
    $("#notesField").focus();
    return false;
  }
  $("#notesWarn").hidden = true;
  return true;
}

function downloadCheck(){
  if (!notesAreSafe()) return;
  try{
    const bytes = PdfWriter.build(checkBlocks());
    PdfWriter.save(bytes, "my-red-flag-check.pdf");
  } catch(e){
    buildPrintSheet();
    window.print();
  }
}

function printCheck(){
  if (!notesAreSafe()) return;
  buildPrintSheet();
  window.print();
}

/* ---------- Wiring ---------- */
document.querySelectorAll("[data-go]").forEach(el => {
  el.addEventListener("click", () => show(el.getAttribute("data-go")));
});
$("#startBtn").addEventListener("click", () => {
  if (!state.category) return;
  state.index = 0;
  state.answers = {};
  renderQuestion();
  show("assess");
});
$("#nextBtn").addEventListener("click", next);
$("#backBtn").addEventListener("click", back);
$("#verifyBack").addEventListener("click", () => show(state.result ? "result" : "hero"));
$("#actedBack").addEventListener("click", () => show(state.result ? "result" : "hero"));
$("#downloadBtn").addEventListener("click", downloadCheck);
$("#printBtn").addEventListener("click", printCheck);
$("#clearBtn").addEventListener("click", restartCheck);
$("#resumeClearBtn").addEventListener("click", () => {
  clearProgress();
  $("#resumeBar").hidden = true;
});
$("#resumeBtn").addEventListener("click", () => {
  const p = remoteCache;
  if (!validPayload(p)) { $("#resumeBar").hidden = true; return; }
  state.category = p.category;
  state.answers = p.answers || {};
  state.index = p.index || 0;
  pruneDependents();
  const list = activeQuestions();
  document.querySelectorAll('input[name="category"]').forEach(i => {
    if (i.value === state.category){ i.checked = true; i.closest(".choice").classList.add("is-selected"); }
  });
  $("#startBtn").disabled = false;
  if (state.index >= list.length){ finish(); }
  else { renderQuestion(); show("assess"); }
});
$("#notesField").addEventListener("input", e => {
  if (!SENSITIVE.test(e.target.value)) $("#notesWarn").hidden = true;
});

renderCategories();
renderActed();

/* ============================================================
   BOOT
   ------------------------------------------------------------
   There is no device copy to check first, so the resume bar
   stays hidden until Memberstack has confirmed who is signed in
   and her saved check (if any) has been loaded from her account.
   ============================================================ */
function offerResumeFrom(payload){
  if (validPayload(payload)){
    remoteCache = payload;
    $("#resumeBar").hidden = false;
  }
}

MS.init().then(signedIn => {
  syncReady = true;
  if (!signedIn){
    console.log("Scam Red-Flag Checker: no signed-in member found. Progress will not be saved.");
    return null;
  }
  return MS.load().then(remote => {
    if (remote && validPayload(remote)){
      offerResumeFrom(remote);
      console.log("Scam Red-Flag Checker: a saved check was found on this member's account.");
    } else {
      console.log("Scam Red-Flag Checker: progress will save to this member's account.");
    }
    return null;
  });
}).catch(err => {
  syncReady = true;
  console.warn("Scam Red-Flag Checker: member storage unavailable this session.", err);
});

/* =========================================================
   SELF-TESTS (console only, never shown to members)
   ========================================================= */
(function selfTest(){
  const t = [];
  const check = (name, pass) => t.push((pass ? "PASS" : "FAIL") + " — " + name);

  check("T1 no signs → level 1",
    evaluate({ q1:NO,q2:NO,q3:NO,q4:NO,q5:NO,q6:NO,q7:NO,q8:NO,q9:NO,q10:"verified",q11:YES,q12:NO,q13:NO,q14:NO }, "investment").level === 1);

  const t2 = evaluate({ q1:YES,q2:YES,q3:NO,q4:NO,q5:NO,q6:NO,q7:NO,q8:NO,q9:NO,q10:"verified",q11:YES,q12:NO,q13:NO,q14:NO }, "investment");
  check("T2 score 3 → level 2", t2.score === 3 && t2.level === 2);

  const t3 = evaluate({ q9:YES }, "contact");
  check("T3 security code → level 3", t3.level === 3 && t3.criticalRules.includes("security-information-requested"));

  const t4 = evaluate({ q8:YES, q4:YES }, "purchase");
  check("T4 access + payment → level 3", t4.level === 3);

  const t5 = evaluate({ q14:YES, q14b:YES }, "recovery");
  check("T5 recovery fee → level 3", t5.level === 3 && t5.flags.includes("RECOVERY_PAYMENT"));

  const t6 = evaluate({ q2:YES, q3:YES, q4:YES }, "other");
  check("T6 pressure+secrecy+payment → level 3", t6.level === 3);

  const t7 = evaluate({ q1:PNA, q2:PNA, q3:PNA }, "other");
  check("T7 prefer not to answer → score 0", t7.score === 0 && t7.flags.length === 0);

  check("T8 q14b hidden unless q14 yes",
    questionsFor("recovery", { q14:NO }).every(q => q.id !== "q14b") &&
    questionsFor("recovery", { q14:YES }).some(q => q.id === "q14b"));

  const rq = questionsFor("romance", {}).map(q => q.id);
  check("T9 romance excludes q6/q11", !rq.includes("q6") && !rq.includes("q11") && rq.includes("q13"));

  const a = { q1:YES,q2:YES,q3:YES,q4:UNSURE,q9:NO };
  check("T10 deterministic", JSON.stringify(evaluate(a,"other")) === JSON.stringify(evaluate(a,"other")));

  const t11 = evaluate({ q15:YES, q15b:YES }, "contact");
  check("T11 impersonation confirmed → level 1, no override",
    t11.score === 2 && t11.level === 1 && t11.criticalRules.length === 0 && t11.flags.includes("IMPERSONATION"));

  const t12 = evaluate({ q15:YES, q15b:NO }, "contact");
  check("T12 impersonation unconfirmed → level 3",
    t12.level === 3 && t12.criticalRules.includes("impersonation-not-independently-confirmed") &&
    t12.flags.includes("IMPERSONATION_UNCONFIRMED"));

  check("T13 impersonation unsure → level 3",
    evaluate({ q15:YES, q15b:UNSURE }, "contact").level === 3);

  check("T14 q15b hidden unless q15 yes",
    questionsFor("contact", { q15:NO }).every(q => q.id !== "q15b") &&
    questionsFor("contact", { q15:YES }).some(q => q.id === "q15b"));

  const t15 = evaluate({ q16:YES }, "job");
  check("T15 money through account → score 3, level 2, flagged",
    t15.score === 3 && t15.level === 2 && t15.flags.includes("MONEY_THROUGH_ACCOUNT"));

  check("T16 q15 and q16 in all journeys",
    CATEGORIES.every(c => {
      const ids = questionsFor(c.id, {}).map(q => q.id);
      return ids.includes("q15") && ids.includes("q16");
    }));

  check("T17 all three result states defined",
    [1,2,3].every(l => LEVELS[l] && RESULT_COPY[l] && RESULT_COPY[l].copy.length));

  check("T18 every flag has a sign entry",
    QUESTIONS.every(q => q.options.every(o => !o.flag || SIGNS[o.flag])));

  console.log("%cScam Red-Flag Checker — logic self-tests", "font-weight:bold");
  t.forEach(line => console.log(line));
})();
