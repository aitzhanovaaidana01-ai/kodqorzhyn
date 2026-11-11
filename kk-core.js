/* КОДҚОРЖЫН — ішкі беттердің ортақ коды: кіру, ұпай, серверге жіберу, Python іске қосу, үзіліс.
   =====================================================================
   МҰҒАЛІМГЕ: Google Apps Script сілтемесі өзгерсе, төмендегі жолды ғана ауыстырыңыз
   (index.html ішіндегі KK_TRACK_URL-мен бірдей болуы керек).
   ===================================================================== */
const KK_TRACK_URL = "https://script.google.com/macros/s/AKfycbyZPRN1rTPt0GnLj8ZmXKMHJsUeIZ7GaGnuDrQ_AhUIqypcv5iHL75kO9aVfu_lGE5e/exec";

window.KK = (function () {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const LS = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v) } catch (e) { return d } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)) } catch (e) { } }
  };
  const TRACK = /^https:\/\/script\.google(usercontent)?\.com\//.test(KK_TRACK_URL);
  const LV = ["Оңай", "Орташа", "Күрделі"], PTS = [10, 20, 30];
  const OLD_PTS = { p1: 10, p2: 10, p3: 10, p4: 10, p5: 20, p6: 20, p7: 20, p8: 20, p9: 30, p10: 30, p11: 30, p12: 30 };
  const MAX_MS = 34 * 60;
  let me = LS.get("kk-me", null);
  let page = { section: () => "", onChange: () => { } };

  /* ---------- theme ---------- */
  const root = document.documentElement;
  const savedTheme = LS.get("kk-theme", null);
  if (savedTheme) root.setAttribute("data-theme", savedTheme);
  function isDark() { const t = root.getAttribute("data-theme"); return t ? t === "dark" : matchMedia("(prefers-color-scheme: dark)").matches }

  /* ---------- progress ---------- */
  function ms() { const s = LS.get("kk-ms", {}); s.done = s.done || {}; s.tries = s.tries || {}; return s }
  function saveMs(s) { LS.set("kk-ms", s) }
  function oldDone() { const p = LS.get("kk-practice", { done: {} }); return Object.keys(p.done || {}).filter(k => OLD_PTS[k]) }
  function msScore() { return Object.keys(ms().done).reduce((a, k) => a + (PTS[+k.split("-")[1]] || 0), 0) }
  function score() { return msScore() + oldDone().reduce((a, k) => a + OLD_PTS[k], 0) }
  function progKeys() { return Object.keys(ms().done).concat(oldDone()) }
  function mergeProg(keys) {
    if (!Array.isArray(keys)) return false;
    const s = ms(); let ch = false;
    const pr = LS.get("kk-practice", { done: {}, tries: {}, name: "", cls: "" }); pr.done = pr.done || {};
    keys.forEach(k => {
      if (/^\d{1,2}-[0-2]$/.test(k)) { if (!s.done[k]) { s.done[k] = { date: "", tries: 0, sync: 1 }; ch = true } }
      else if (OLD_PTS[k] && !pr.done[k]) { pr.done[k] = { date: "", tries: 0 }; ch = true }
    });
    if (ch) { saveMs(s); LS.set("kk-practice", pr) }
    return ch;
  }

  /* ---------- server ---------- */
  let board = null, activeSec = LS.get("kk-active", 0);
  function body(event) {
    const done = Object.keys(ms().done).length;
    const b = {
      name: me.name, cls: me.cls, device: me.id, minutes: Math.round(activeSec / 60),
      section: page.section(), mission: LS.get("kk-mission", 1) + "-миссия",
      practice: "миссия " + done + "/102 · практика " + oldDone().length + "/12",
      score: score(), prog: progKeys(), want: "top"
    };
    if (event) b.event = event;
    return b;
  }
  /* Жіберіп, жауабын оқиды (жаңа Apps Script «Үздік 5» пен сақталған прогресті қайтарады). */
  async function sync(event) {
    if (!me || !TRACK) return null;
    try {
      const r = await fetch(KK_TRACK_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(body(event)) });
      const j = await r.json();
      if (j && j.ok && Array.isArray(j.top)) {
        board = j;
        if (mergeProg(j.prog)) page.onChange();
        return j;
      }
    } catch (e) { }
    return null;
  }
  function beacon(event) {
    if (!me || !TRACK) return;
    try { fetch(KK_TRACK_URL, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(body(event)), keepalive: true }).catch(() => { }) } catch (e) { }
  }
  setInterval(() => { if (me && !document.hidden) sync().then(j => { if (j) page.onChange() }) }, 60000);
  document.addEventListener("visibilitychange", () => { if (document.hidden) beacon() });

  /* ---------- header ---------- */
  function header(active) {
    const links = [["index.html", "🏠 БАСТЫ БЕТ"], ["missions.html", "🪜 34 БАСПАЛДАҚ"], ["komek.html", "🧑‍🏫 ҰСТАЗДАН КӨМЕК"], ["oyin.html", "🎮 ОЙЫН"]];
    $("#top").innerHTML = `<div class="wrap"><a class="brand" href="index.html"><b>КОД</b><i>ҚОРЖЫН</i></a>
      <nav class="nav" aria-label="Бөлімдер">${links.map(l => `<a href="${l[0]}" class="${l[0] === active ? "on" : ""}"${l[0] === active ? ' aria-current="page"' : ""}>${l[1]}</a>`).join("")}</nav>
      <div class="who" id="who"></div>
      <button class="btn ghost sm" id="themeBtn" type="button" aria-label="Тақырып түсін ауыстыру"><span class="emo" id="themeIco"></span></button></div><div class="top-line"></div>`;
    const ico = () => $("#themeIco").textContent = isDark() ? "☀️" : "🌙";
    $("#themeBtn").onclick = () => { const t = isDark() ? "light" : "dark"; root.setAttribute("data-theme", t); LS.set("kk-theme", t); ico() };
    ico(); drawWho();
  }
  function drawWho() {
    const w = $("#who"); if (!w) return;
    if (me) w.innerHTML = `<span class="who-chip" title="${esc(me.name)} · ${esc(me.cls)}">👤 ${esc(me.name.split(" ")[0])} <small id="brkLeft"></small></span><button class="btn ghost sm" type="button" id="logoutB">Шығу</button>`;
    else w.innerHTML = `<button class="btn primary sm" type="button" id="loginB">Кіру</button>`;
    const lo = $("#logoutB"); if (lo) lo.onclick = () => { beacon("Шықты"); me = null; LS.set("kk-me", null); board = null; drawWho(); page.onChange(); openLogin() };
    const li = $("#loginB"); if (li) li.onclick = openLogin;
  }

  /* ---------- login (басты беттегі ережелермен бірдей) ---------- */
  const CYR_UP = "А-ЯЁӘҒҚҢӨҰҮҺІ", CYR_LO = "а-яёәғқңөұүһі";
  const WORD = new RegExp(`^[${CYR_UP}][${CYR_LO}]+(-[${CYR_UP}][${CYR_LO}]+)?$`);
  const capWord = w => w.split("-").map(p => p.charAt(0).toLocaleUpperCase("kk") + p.slice(1).toLocaleLowerCase("kk")).join("-");
  function checkName(raw) {
    const v = raw.replace(/\s+/g, " ").trim();
    if (!v) return { err: "Аты-жөніңді жаз." };
    if (/[A-Za-z]/.test(v)) return { err: "Латын әрпі табылды. Аты-жөніңді тек қазақ (кирилл) әріптерімен жаз." };
    if (/[0-9]/.test(v)) return { err: "Аты-жөнде сан болмайды." };
    if (/[^ \-А-ЯЁӘҒҚҢӨҰҮҺІа-яёәғқңөұүһі]/.test(v)) return { err: "Тек әріптер, бос орын және сызықша (-) рұқсат етіледі." };
    const ws = v.split(" ");
    if (ws.length < 2) return { err: "Атыңды да, тегіңді де жаз. Мысалы: Айбар Серікұлы." };
    if (ws.length > 3) return { err: "Тым көп сөз. Атың мен тегіңді ғана жаз." };
    if (ws.some(w => w.replace(/-/g, "").length < 2)) return { err: "Әр сөзде кемінде 2 әріп болуы керек." };
    if (!ws.every(w => WORD.test(w))) return { err: "Әр сөз бас әріппен басталып, қалғаны кіші әріппен жазылуы керек.", fix: ws.map(capWord).join(" ") };
    return { ok: v };
  }
  function ensureOverlays() {
    if ($("#loginOv")) return;
    document.body.insertAdjacentHTML("beforeend", `
<div class="ov" id="loginOv" hidden role="dialog" aria-modal="true" aria-labelledby="lgTitle"><div class="ov-box">
  <div class="ov-brand"><b>КОД</b><i>ҚОРЖЫН</i> · 34 миссия</div>
  <div id="lgStep1">
    <h2 id="lgTitle">Сайтқа кіру</h2>
    <p class="lead2">Ұпайың есептеліп, «Үздік 5» кестесіне кіру үшін аты-жөніңді қатесіз жаз. Мысалы: <b>Айбар Серікұлы</b>.</p>
    <form id="lgForm" novalidate>
      <div class="fld"><label for="lgName">Аты-жөнің</label><input id="lgName" autocomplete="off" autocapitalize="words" spellcheck="false" placeholder="Айбар Серікұлы" maxlength="60"></div>
      <div class="msg" id="lgMsg" aria-live="polite"></div>
      <div class="fld"><label for="lgNum">Сыныбың</label><div class="row2">
        <select id="lgNum"><option>7</option><option selected>8</option><option>9</option><option>10</option><option>11</option></select>
        <select id="lgLet" aria-label="Сынып әрпі"><option>А</option><option>Ә</option><option>Б</option><option>В</option><option>Г</option><option>Ғ</option><option>Д</option><option>Е</option></select>
      </div></div>
      <button class="btn primary" type="submit" style="width:100%">Жалғастыру →</button>
    </form>
  </div>
  <div id="lgStep2" hidden>
    <h2>Дұрыс па?</h2>
    <p class="lead2">Мұғалім сені осы атпен көреді. Қате болса, түзет.</p>
    <div class="card" style="margin-bottom:16px"><span class="muted" style="font-size:13px">Оқушы</span><br><b id="lgShow" style="font-size:19px"></b><br><span id="lgShowCls" class="muted" style="font-weight:600"></span></div>
    <div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn primary" type="button" id="lgYes">✓ Иә, кіру</button><button class="btn ghost" type="button" id="lgEdit">✎ Түзету</button></div>
  </div>
</div></div>
<div class="ov" id="brkOv" hidden role="dialog" aria-modal="true" aria-labelledby="brkTitle"><div class="ov-box">
  <div class="brk-ico emo" id="brkIco">👀</div>
  <h2 id="brkTitle" style="text-align:center">Үзіліс уақыты!</h2>
  <p class="lead2" style="text-align:center">Сен 15 минут компьютерде отырдың. Миыңа және көзіңе демалыс бер.</p>
  <ol class="brk-steps" id="brkSteps"></ol>
  <div class="brk-timer"><span class="tr"><i id="brkBar"></i></span><b id="brkSec">30</b></div>
  <div style="text-align:center"><button class="btn primary" type="button" id="brkDone" disabled>✓ Орындадым</button></div>
</div></div>`);
    let pending = null;
    $("#lgName").addEventListener("input", () => { $("#lgName").classList.remove("bad"); $("#lgMsg").textContent = ""; $("#lgMsg").className = "msg" });
    $("#lgForm").addEventListener("submit", e => {
      e.preventDefault(); const r = checkName($("#lgName").value), m = $("#lgMsg");
      if (r.err) {
        $("#lgName").classList.add("bad"); m.className = "msg bad"; m.innerHTML = esc(r.err) + (r.fix ? ` <button type="button" id="lgFix">«${esc(r.fix)}» деп түзету</button>` : "");
        const f = $("#lgFix"); if (f) f.onclick = () => { $("#lgName").value = r.fix; $("#lgName").classList.remove("bad"); m.className = "msg ok"; m.textContent = "Түзетілді. Тексеріп, «Жалғастыру» бас."; $("#lgName").focus() }; return
      }
      pending = { name: r.ok, cls: $("#lgNum").value + " «" + $("#lgLet").value + "»" };
      $("#lgShow").textContent = pending.name; $("#lgShowCls").textContent = pending.cls + " сынып";
      $("#lgStep1").hidden = true; $("#lgStep2").hidden = false; $("#lgYes").focus();
    });
    $("#lgEdit").onclick = () => { $("#lgStep1").hidden = false; $("#lgStep2").hidden = true; $("#lgName").focus() };
    $("#lgYes").onclick = () => {
      let dev = LS.get("kk-dev", null); if (!dev) { dev = Math.random().toString(36).slice(2, 10); LS.set("kk-dev", dev) }
      me = { name: pending.name, cls: pending.cls, id: dev }; LS.set("kk-me", me);
      const pr = LS.get("kk-practice", null); if (pr) { pr.name = me.name; pr.cls = me.cls; LS.set("kk-practice", pr) }
      $("#loginOv").hidden = true; drawWho(); page.onChange();
      sync("Кірді").then(() => page.onChange());
    };
    $("#brkDone").onclick = () => { $("#brkOv").hidden = true; sinceBreak = 0; LS.set("kk-since", 0) };
  }
  function openLogin() { ensureOverlays(); $("#loginOv").hidden = false; $("#lgStep1").hidden = false; $("#lgStep2").hidden = true; setTimeout(() => $("#lgName").focus(), 50) }

  /* ---------- break reminder: әр 15 минут белсенді уақыттан кейін ---------- */
  const BREAK_EVERY = 15 * 60;
  let sinceBreak = LS.get("kk-since", 0), brkLeft = 0, brkTimer = null;
  const EX = [
    ["👀", "20-20-20 ережесі", ["Экраннан көзіңді ал.", "Терезеден ең алыстағы затқа 20 секунд қара.", "Сосын 3 рет баяу жыпылықта."]],
    ["🙆", "Иық циклі", ["Орныңнан тұр.", "Иығыңды алға қарай 5 рет айналдыр.", "Сосын артқа қарай 5 рет айналдыр."]],
    ["🖐️", "Пернетақта қолдары", ["Саусақтарыңды кең жай.", "Жұдырығыңды қатты түй.", "10 рет қайтала, сосын білегіңді айналдыр."]],
    ["🧍", "Түзу отыру алгоритмі", ["Арқаңды түзе, иығыңды босаңсыт.", "Екі аяғыңды еденге толық қой.", "Экран көз деңгейінде тұрғанын тексер."]],
    ["💧", "Су ішу командасы", ["Орныңнан тұрып, бір стақан су іш.", "Терең 3 рет тыныс ал.", "Сабаққа қайта ораласың!"]]
  ];
  function showBreak() {
    ensureOverlays(); const x = EX[Math.floor(Math.random() * EX.length)];
    $("#brkIco").textContent = x[0]; $("#brkTitle").textContent = "Үзіліс: " + x[1];
    $("#brkSteps").innerHTML = x[2].map(s => `<li>${esc(s)}</li>`).join("");
    $("#brkOv").hidden = false; brkLeft = 30; $("#brkDone").disabled = true;
    const tick = () => { $("#brkSec").textContent = Math.max(0, brkLeft); $("#brkBar").style.width = ((30 - brkLeft) / 30 * 100) + "%"; if (brkLeft <= 0) { clearInterval(brkTimer); $("#brkDone").disabled = false; $("#brkDone").focus() } brkLeft-- };
    tick(); clearInterval(brkTimer); brkTimer = setInterval(tick, 1000);
  }
  setInterval(() => {
    const bo = $("#brkOv"), lo = $("#loginOv");
    if (document.hidden || (bo && !bo.hidden)) return;
    activeSec++; sinceBreak++;
    if (activeSec % 10 === 0) { LS.set("kk-active", activeSec); LS.set("kk-since", sinceBreak) }
    const left = Math.max(0, BREAK_EVERY - sinceBreak), el = $("#brkLeft");
    if (el) el.textContent = "⏱ " + Math.floor(left / 60) + ":" + String(left % 60).padStart(2, "0");
    if (sinceBreak >= BREAK_EVERY && (!lo || lo.hidden)) showBreak();
  }, 1000);

  /* ---------- Python (Skulpt) ---------- */
  const SK = "https://cdn.jsdelivr.net/npm/skulpt@1.2.0/dist/";
  let skP = null;
  function ld(src) { return new Promise((res, rej) => { const s = document.createElement("script"); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s) }) }
  function loadSk() { if (window.Sk && Sk.importMainWithBody) return Promise.resolve(); if (!skP) { skP = ld(SK + "skulpt.min.js").then(() => ld(SK + "skulpt-stdlib.js").catch(() => { })).catch(e => { skP = null; throw e }) } return skP }
  const HINT = {
    SyntaxError: "Синтаксистік қате: жақшаны, тырнақшаны, қос нүктені ( : ) және шегіністі тексер.",
    IndentationError: "Шегініс қатесі: if, for, while, def жолынан кейінгі жолдар 4 бос орынмен басталуы керек.",
    NameError: "Атау табылмады: айнымалы немесе команда атауын тексер. Python бас әріп пен кіші әріпті ажыратады.",
    TypeError: "Тип қатесі: мәтін мен санды тікелей қосуға болмайды. int() немесе str() қолдан.",
    ZeroDivisionError: "Нөлге бөлуге болмайды! Бөлгіштің мәнін тексер.",
    ValueError: "Мән қатесі: int() тек сан түріндегі мәтінді қабылдайды. input() мәндерін тексер.",
    IndexError: "Индекс қатесі: тізімде немесе мәтінде мұндай нөмірлі элемент жоқ. Санау 0-ден басталады.",
    AttributeError: "Мұндай әдіс жоқ: нүктеден кейінгі атауды тексер (мысалы, .lower(), .upper()).",
    TimeLimitError: "Бағдарлама тым ұзақ орындалды. Цикл тоқтайтынын тексер.",
    EOFError: "input() үшін мән жетпеді. «input() мәндері» өрісіне мәндерді үтір арқылы жаз."
  };
  function errInfo(e) {
    let n = "", m = String(e); try { if (e && e.tp$name) { n = e.tp$name; m = e.toString() } } catch (_) { }
    const k = Object.keys(HINT).find(k => n.includes(k) || m.includes(k));
    const ln = (m.match(/line (\d+)/) || [])[1];
    return { name: k || n || "Қате", m, line: ln ? +ln : 0, h: k ? HINT[k] : "Қате хабарламасын оқы: онда қатенің түрі мен жол нөмірі жазылған." };
  }
  async function exec(code, inputs) {
    await loadSk();
    let shown = "", pure = ""; const q = inputs.slice();
    Sk.configure({
      output: t => { shown += t; pure += t },
      read: x => { if (Sk.builtinFiles === undefined || Sk.builtinFiles.files[x] === undefined) throw "Файл табылмады: '" + x + "'"; return Sk.builtinFiles.files[x] },
      __future__: Sk.python3, inputfunTakesPrompt: true,
      inputfun: p => { if (!q.length) throw new Sk.builtin.EOFError("input() үшін мән жоқ"); const v = q.shift(); shown += (p || "") + v + "\n"; return v },
      execLimit: 5000
    });
    try { await Sk.misceval.asyncToPromise(() => Sk.importMainWithBody("<stdin>", false, code, true)); return { ok: true, shown, pure } }
    catch (e) { return { ok: false, shown, pure, err: errInfo(e) } }
  }
  /* textarea + жол нөмірлері + Tab/Enter шегінісі */
  function editor(ta, gut, onInput) {
    const g = () => { if (!gut) return; const n = ta.value.split("\n").length; gut.innerHTML = Array.from({ length: n }, (_, i) => `<div>${i + 1}</div>`).join(""); gut.scrollTop = ta.scrollTop };
    const ins = t => { const s = ta.selectionStart, en = ta.selectionEnd; ta.value = ta.value.slice(0, s) + t + ta.value.slice(en); ta.selectionStart = ta.selectionEnd = s + t.length; g(); if (onInput) onInput() };
    ta.addEventListener("input", () => { g(); if (onInput) onInput() });
    ta.addEventListener("scroll", () => { if (gut) gut.scrollTop = ta.scrollTop });
    ta.addEventListener("keydown", e => {
      if (e.key === "Tab" && !e.shiftKey) { e.preventDefault(); ins("    ") }
      else if (e.key === "Enter") { e.preventDefault(); const s = ta.selectionStart; const ls = ta.value.lastIndexOf("\n", s - 1) + 1; const line = ta.value.slice(ls, s); let ind = line.match(/^\s*/)[0]; if (line.trim().endsWith(":")) ind += "    "; ins("\n" + ind) }
    });
    g(); return g;
  }
  async function copy(text, okEl) {
    let ok = false;
    try { await navigator.clipboard.writeText(text); ok = true } catch (e) {
      try { const t = document.createElement("textarea"); t.value = text; t.style.position = "fixed"; t.style.opacity = "0"; document.body.appendChild(t); t.select(); ok = document.execCommand("copy"); t.remove() } catch (_) { }
    }
    if (okEl) { okEl.textContent = ok ? "✓ Көшірілді" : "Мәтінді белгілеп, өзің көшір"; clearTimeout(okEl._t); okEl._t = setTimeout(() => okEl.textContent = "", 2500) }
    return ok;
  }

  function start(opts) {
    page = Object.assign(page, opts || {});
    ensureOverlays();
    if (!me && opts && opts.needLogin) openLogin();
    else if (me) sync("Қайта ашты").then(j => { if (j) page.onChange() });
  }

  return {
    $, $$, esc, LS, LV, PTS, MAX_MS, TRACK,
    get me() { return me }, get board() { return board },
    ms, saveMs, score, msScore, oldDone, header, start, openLogin, sync, exec, editor, copy
  };
})();
