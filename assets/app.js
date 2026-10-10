/* The Bad Lands Cow Boy — Theodore Roosevelt Presidential Library
   Static site: data/*.json is compiled from source/transcriptions by scripts/build_site_data.py */
(function () {
  "use strict";

  // ---------- helpers ----------
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  var MON = ["Jan.","Feb.","Mar.","Apr.","May","June","July","Aug.","Sept.","Oct.","Nov.","Dec."];
  var DOW = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  var LCCN = "sn84024777";
  var SITE = "https://badlandscowboy.labs.trlibrary.com/";
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]; }); }
  function pd(s) { var p = s.split("-"); return new Date(Date.UTC(+p[0], +p[1] - 1, +p[2])); }
  function iso(d) { return d.toISOString().slice(0, 10); }
  function longDate(s) { var d = pd(s); return MONTHS[d.getUTCMonth()] + " " + d.getUTCDate() + ", " + d.getUTCFullYear(); }
  function dowDate(s) { var d = pd(s); return DOW[d.getUTCDay()] + ", " + longDate(s); }
  function monthYear(s) { var d = pd(s); return MONTHS[d.getUTCMonth()] + " " + d.getUTCFullYear(); }
  function fmtN(n) { return Number(n).toLocaleString("en-US"); }
  function norm(s) { return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase(); }
  function place(issue) { return issue < "1885-11-13" ? "Little Missouri, Dakota Territory" : "Medora, Dakota Territory"; }
  function locPage(issue, page) { return "https://www.loc.gov/resource/" + LCCN + "/" + issue + "/ed-1/?sp=" + (page || 1); }
  function getJSON(u) { return fetch(u).then(function (r) { if (!r.ok) throw new Error(u); return r.json(); }); }
  var cache = {};
  function load(name) { if (!cache[name]) cache[name] = getJSON("data/" + name); return cache[name]; }
  function toast(msg) { var t = $("#toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(toast.t); toast.t = setTimeout(function () { t.classList.remove("show"); }, 2600); }
  function copy(text, msg) {
    var done = function () { toast(msg || "Copied"); };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done, fallback); else fallback();
    function fallback() { var ta = document.createElement("textarea"); ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0"; document.body.appendChild(ta); ta.select(); try { document.execCommand("copy"); done(); } catch (e) { toast("Copy failed"); } ta.remove(); }
  }

  // ---------- embed mode ----------
  var params = new URLSearchParams(location.search);
  var EMBED = params.get("embed") === "1";
  var EMBED_ID = params.get("id") || "";
  if (EMBED) {
    document.body.classList.add("embed");
    if (params.get("view")) document.body.classList.add("single");
    var post = function () { parent.postMessage({ type: "badlands-cowboy:height", id: EMBED_ID, height: document.documentElement.scrollHeight }, "*"); };
    if (window.ResizeObserver) new ResizeObserver(post).observe(document.body);
    window.addEventListener("load", post);
    $$("a[href^='#']").forEach(function () {});
  }

  // ---------- routing ----------
  var VIEWS = ["thisweek", "timeline", "roosevelt", "paper", "search", "brands", "about", "embed"];
  var rendered = {};
  function route() {
    var h = decodeURIComponent(location.hash.replace(/^#\/?/, "")).split("/");
    var view = VIEWS.indexOf(h[0]) >= 0 ? h[0] : (EMBED && params.get("view")) || "thisweek";
    $$(".tabs button").forEach(function (b) { b.setAttribute("aria-selected", b.dataset.view === view ? "true" : "false"); });
    $$("section.panel").forEach(function (p) { p.hidden = p.dataset.panel !== view; });
    var fn = { thisweek: renderThisWeek, timeline: renderTimeline, roosevelt: renderRoosevelt, paper: renderPaper,
               search: renderSearch, brands: renderBrands, about: renderAbout, embed: renderEmbed }[view];
    fn(h.slice(1));
  }
  function go(hash) { if (location.hash === hash) route(); else location.hash = hash; }
  $$(".tabs button").forEach(function (b) {
    b.addEventListener("click", function () {
      go("#" + b.dataset.view);
      var tabs = $(".tabs"); if (tabs.getBoundingClientRect().top < 0 || window.scrollY > tabs.offsetTop) window.scrollTo({ top: tabs.offsetTop, behavior: "smooth" });
    });
  });
  window.addEventListener("hashchange", route);
  function linkTo(hash) { return EMBED ? SITE + hash : hash; }
  function targetAttr() { return EMBED ? ' target="_blank" rel="noopener"' : ""; }

  // ---------- events ----------
  function dateLabel(e) {
    var y = e.date.slice(0, 4);
    if (e.prec === "day") return dowDate(e.date);
    if (e.prec === "week") return e.end && e.end !== e.date ? "Reported " + MON[pd(e.date).getUTCMonth()] + " " + pd(e.date).getUTCDate() + "–" + (e.end.slice(5, 7) === e.date.slice(5, 7) ? "" : MON[pd(e.end).getUTCMonth()] + " ") + pd(e.end).getUTCDate() + ", " + pd(e.end).getUTCFullYear() : "Reported week of " + longDate(e.date);
    if (e.prec === "month") return monthYear(e.date);
    return "About " + monthYear(e.date);
  }
  function citation(e) {
    return "The Bad Lands Cow Boy (" + place(e.issue) + "), " + longDate(e.issue) + (e.page ? ", p. " + e.page : "") +
      ". Library of Congress, Chronicling America, " + locPage(e.issue, e.page) + ".";
  }
  function social(e) {
    var y = e.date.slice(0, 4);
    var lead = e.prec === "day" && !e.planned ? "On this day in " + y + ", " : "This week in " + y + ", ";
    var s = lead + "Medora's newspaper, The Bad Lands Cow Boy, reported: " + (e.summary || e.title);
    if (e.excerpt) s += "\n\n“" + e.excerpt.replace(/^["“]|["”]$/g, "") + "”\n— The Bad Lands Cow Boy, " + longDate(e.issue);
    s += "\n\nRead the original page: " + SITE + "#paper/" + e.issue + "/" + (e.article || "") +
      "\nPlan your visit to the Theodore Roosevelt Presidential Library: trlibrary.com/visit\n#DareGreatly";
    return s;
  }
  function evCard(e, opt) {
    opt = opt || {};
    var tags = (e.tags || []).filter(function (t) { return t !== "tr" && t !== "mores"; }).slice(0, 4);
    var cls = "ev" + (e.tr ? " tr" : "") + (e.trRel ? " rel" : "");
    var also = e.also && e.also.length ? " · also in " + e.also.length + " later issue" + (e.also.length > 1 ? "s" : "") : "";
    return '<article class="' + cls + '" data-id="' + esc(e.id) + '">' +
      '<div class="when">' + esc(dateLabel(e)) +
        (e.planned ? ' <span class="tag planned">Planned or expected</span>' : "") +
        (e.tr ? ' <span class="tag tr">Roosevelt</span>' : "") + (e.mores ? ' <span class="tag mores">de Morès</span>' : "") +
        (e.conf === "low" ? ' <span class="tag low">Hard-to-read scan</span>' : "") + "</div>" +
      "<h3>" + esc(e.title) + "</h3>" +
      (e.summary ? "<p>" + esc(e.summary) + "</p>" : "") +
      (e.excerpt ? "<blockquote>" + esc(e.excerpt.replace(/^["“]|["”]$/g, "")) + "</blockquote>" : "") +
      '<div class="foot2"><span>The Cow Boy, ' + esc(longDate(e.issue)) + (e.page ? ", p. " + e.page : "") + esc(also) + "</span>" +
        '<a href="' + linkTo("#paper/" + e.issue + "/" + (e.article || "")) + '"' + targetAttr() + ">Read it in the paper →</a>" +
        (opt.noTools ? "" : '<button class="linkbtn" data-cite="' + esc(e.id) + '">Copy citation</button>' +
          '<button class="linkbtn" data-social="' + esc(e.id) + '">Copy social draft</button>') +
        tags.map(function (t) { return '<span class="tag">' + esc(t.replace(/-/g, " ")) + "</span>"; }).join(" ") +
      "</div></article>";
  }
  var EV = null, EVBYID = {};
  function events() {
    if (EV) return Promise.resolve(EV);
    return load("events.json").then(function (d) { EV = d; d.forEach(function (e) { EVBYID[e.id] = e; }); return d; });
  }
  document.addEventListener("click", function (ev) {
    var c = ev.target.closest("[data-cite]"), s = ev.target.closest("[data-social]");
    if (c) copy(citation(EVBYID[c.dataset.cite]), "Citation copied");
    if (s) copy(social(EVBYID[s.dataset.social]), "Draft copied. Check it against the page scan before posting.");
  });

  // ---------- header stats ----------
  load("meta.json").then(function (m) {
    $("#stats").innerHTML = [[m.issues, "issues"], [fmtN(m.events), "dated events"], [m.tr, "Roosevelt items"], [fmtN(Math.round(m.words / 1000)) + "k", "words transcribed"]]
      .map(function (x) { return "<div><b>" + x[0] + "</b><span>" + x[1] + "</span></div>"; }).join("");
  });

  // ---------- THIS WEEK ----------
  var tw = null;
  function initTW() {
    if (tw) return;
    var now = new Date();
    tw = { m: now.getMonth(), d: now.getDate() };
    var ms = $("#tw-m"); ms.innerHTML = MONTHS.map(function (m, i) { return '<option value="' + i + '">' + m + "</option>"; }).join("");
    function days() { var n = new Date(Date.UTC(2001, tw.m + 1, 0)).getUTCDate(); $("#tw-d").innerHTML = Array.from({ length: n }, function (_, i) { return '<option value="' + (i + 1) + '">' + (i + 1) + "</option>"; }).join(""); if (tw.d > n) tw.d = n; $("#tw-d").value = tw.d; }
    tw.sync = function () { ms.value = tw.m; days(); };
    ms.addEventListener("change", function () { tw.m = +ms.value; days(); drawTW(); });
    $("#tw-d").addEventListener("change", function () { tw.d = +$("#tw-d").value; drawTW(); });
    function shift(n) { var d = new Date(Date.UTC(2001, tw.m, tw.d + n)); tw.m = d.getUTCMonth(); tw.d = d.getUTCDate(); tw.sync(); drawTW(); }
    $("#tw-prev").addEventListener("click", function () { shift(-7); });
    $("#tw-next").addEventListener("click", function () { shift(7); });
    $("#tw-today").addEventListener("click", function () { var n = new Date(); tw.m = n.getMonth(); tw.d = n.getDate(); tw.sync(); drawTW(); });
    tw.sync();
  }
  function renderThisWeek(args) {
    initTW();
    if (args[0] && /^\d\d-\d\d$/.test(args[0])) { tw.m = +args[0].slice(0, 2) - 1; tw.d = +args[0].slice(3); tw.sync(); }
    drawTW();
  }
  function drawTW() {
    var label = MONTHS[tw.m] + " " + tw.d;
    $("#tw-title").textContent = "The week of " + label;
    Promise.all([events(), load("issues.json"), load("meta.json")]).then(function (r) {
      var evs = r[0], issues = r[1], meta = r[2];
      var thisYear = new Date().getFullYear();
      var out = "", strip = "", total = 0;
      [1884, 1885, 1886].forEach(function (y) {
        var c = Date.UTC(y, tw.m, tw.d), lo = iso(new Date(c - 3 * 864e5)), hi = iso(new Date(c + 3 * 864e5));
        var list = evs.filter(function (e) {
          if (e.prec === "day") return e.date >= lo && e.date <= hi;
          if (e.prec === "week") return e.date <= hi && (e.end || e.date) >= lo;
          return false;
        });
        list.sort(function (a, b) { return (b.tr - a.tr) || a.date.localeCompare(b.date) || (b.mores - a.mores); });
        total += list.length;
        var iss = issues.filter(function (i) { return i.date >= lo && i.date <= hi; });
        var miss = meta.missing.filter(function (m) { return m >= lo && m <= hi; });
        iss.forEach(function (i) {
          strip += '<a class="icard" href="' + linkTo("#paper/" + i.date) + '"' + targetAttr() + '><img loading="lazy" alt="" src="' + esc(i.thumb) + '/full/,200/0/default.jpg"><div><b>' + esc(longDate(i.date)) + "</b><span>" + esc(i.volume || "") + "<br>On the newsstand this week. Read the issue →</span></div></a>";
        });
        miss.forEach(function (m) { strip += '<div class="icard missing"><div><b>' + esc(longDate(m)) + "</b><span>This issue doesn't survive in the Library of Congress run.</span></div></div>"; });
        out += '<div class="year-h">' + y + " <small>" + (thisYear - y) + " years ago" + (list.length ? " · " + list.length + " item" + (list.length > 1 ? "s" : "") : "") + "</small></div>";
        if (y === 1884 && c < Date.UTC(1884, 1, 7)) out += '<p class="empty">The Cow Boy hadn’t started yet. Its first issue came out on February 7, 1884.</p>';
        else if (!list.length) out += '<p class="empty">No dated items for this week' + (miss.length ? ". The issue that would have covered it is missing." : ".") + "</p>";
        else {
          var dated = list.filter(function (e) { return e.tr || e.prec === "day"; });
          var rest = list.filter(function (e) { return !(e.tr || e.prec === "day"); });
          if (!dated.length) { dated = rest.slice(0, 4); rest = rest.slice(4); }
          out += '<div class="ev-list">' + dated.map(function (e) { return evCard(e); }).join("") + "</div>";
          if (rest.length) out += '<details class="more-week"><summary>More from that week\u2019s paper (' + rest.length + ")</summary><div class=\"ev-list\">" + rest.map(function (e) { return evCard(e); }).join("") + "</div></details>";
        }
      });
      $("#tw-lede").textContent = total ? "What Medora's paper reported for " + label + ", give or take three days, in each year it was published." : "Nothing dated to this week survives. Try another date.";
      $("#tw-issues").innerHTML = strip;
      $("#tw-body").innerHTML = out;
    });
  }

  // ---------- TIMELINE ----------
  var tl = null;
  var TOPICS = ["ranching", "roundup", "railroad", "stage", "business", "building", "town-life", "social", "saloons", "law", "crime", "courts", "politics", "weather", "hunting", "wildlife", "Native-Americans", "military", "deaths", "fire", "holidays", "health", "land", "coal"];
  function renderTimeline(args) {
    events().then(function (evs) {
      if (!tl) {
        tl = { month: "1884-02", tags: {}, q: "", tr: false, mores: false, all: false, limit: 150 };
        var months = [];
        for (var y = 1884; y <= 1886; y++) for (var m = 0; m < 12; m++) months.push(y + "-" + String(m + 1).padStart(2, "0"));
        tl.months = months.filter(function (m) { return m >= "1884-02"; });
        $("#tl-month").innerHTML = tl.months.map(function (m) { return '<option value="' + m + '">' + MONTHS[+m.slice(5) - 1] + " " + m.slice(0, 4) + "</option>"; }).join("");
        var counts = {}; evs.forEach(function (e) { counts[e.date.slice(0, 7)] = (counts[e.date.slice(0, 7)] || 0) + 1; });
        var max = Math.max.apply(null, tl.months.map(function (m) { return counts[m] || 0; }));
        $("#tl-histo").innerHTML = tl.months.map(function (m) { var n = counts[m] || 0; return '<button data-m="' + m + '" title="' + MONTHS[+m.slice(5) - 1] + " " + m.slice(0, 4) + ": " + n + ' events" style="height:' + Math.max(4, n / max * 100) + '%"' + (n ? "" : ' class="miss"') + "></button>"; }).join("");
        $("#tl-histo").insertAdjacentHTML("afterend", '<div class="histo-x"><span>Feb. 1884</span><span>1885</span><span>1886</span><span>Dec. 1886</span></div>');
        var tc = {}; evs.forEach(function (e) { e.tags.forEach(function (t) { tc[t] = (tc[t] || 0) + 1; }); });
        $("#tl-tags").innerHTML = TOPICS.filter(function (t) { return tc[t]; }).map(function (t) { return '<button class="chip" data-tag="' + t + '" aria-pressed="false">' + esc(t.replace(/-/g, " ")) + '<span class="n">' + tc[t] + "</span></button>"; }).join("");
        $("#tl-histo").addEventListener("click", function (e) { var b = e.target.closest("button"); if (b) { tl.all = false; $("#tl-all").checked = false; go("#timeline/" + b.dataset.m); } });
        $("#tl-month").addEventListener("change", function () { go("#timeline/" + this.value); });
        $("#tl-prev").addEventListener("click", function () { step(-1); });
        $("#tl-next").addEventListener("click", function () { step(1); });
        function step(n) { var i = tl.months.indexOf(tl.month) + n; if (i >= 0 && i < tl.months.length) go("#timeline/" + tl.months[i]); }
        var t; $("#tl-q").addEventListener("input", function () { clearTimeout(t); var v = this.value; t = setTimeout(function () { tl.q = norm(v.trim()); tl.limit = 150; drawTL(); }, 180); });
        $("#tl-tr").addEventListener("change", function () { tl.tr = this.checked; drawTL(); });
        $("#tl-mores").addEventListener("change", function () { tl.mores = this.checked; drawTL(); });
        $("#tl-all").addEventListener("change", function () { tl.all = this.checked; tl.limit = 150; drawTL(); });
        $("#tl-tags").addEventListener("click", function (e) { var b = e.target.closest("[data-tag]"); if (!b) return; var on = b.getAttribute("aria-pressed") !== "true"; b.setAttribute("aria-pressed", on); if (on) tl.tags[b.dataset.tag] = 1; else delete tl.tags[b.dataset.tag]; tl.limit = 150; drawTL(); });
        $("#tl-body").addEventListener("click", function (e) { if (e.target.id === "tl-more") { tl.limit += 150; drawTL(); } });
      }
      if (args[0] && /^\d{4}-\d\d$/.test(args[0])) tl.month = args[0];
      drawTL();
    });
  }
  function drawTL() {
    $("#tl-month").value = tl.month;
    var i = tl.months.indexOf(tl.month);
    $("#tl-prev").disabled = tl.all || i <= 0; $("#tl-next").disabled = tl.all || i >= tl.months.length - 1;
    $$("#tl-histo button").forEach(function (b) { b.classList.toggle("on", !tl.all && b.dataset.m === tl.month); });
    var tags = Object.keys(tl.tags);
    var list = EV.filter(function (e) {
      if (!tl.all && e.date.slice(0, 7) !== tl.month) return false;
      if (tl.tr && !e.tr) return false;
      if (tl.mores && !e.mores) return false;
      if (tags.length && !tags.some(function (t) { return e.tags.indexOf(t) >= 0; })) return false;
      if (tl.q) { var h = norm([e.title, e.summary, e.excerpt, e.people.join(" "), e.places.join(" ")].join(" ")); if (tl.q.split(/\s+/).some(function (w) { return h.indexOf(w) < 0; })) return false; }
      return true;
    });
    var html = "", cur = "";
    list.slice(0, tl.limit).forEach(function (e) {
      var m = e.date.slice(0, 7);
      if (m !== cur) { cur = m; html += (html ? "</div>" : "") + '<div class="month-h">' + MONTHS[+m.slice(5) - 1] + " " + m.slice(0, 4) + "</div><div class=\"ev-list\">"; }
      html += evCard(e);
    });
    if (html) html += "</div>";
    if (!list.length) html = '<p class="empty">No events match. ' + (tl.all ? "Try fewer filters." : "Try another month, or tick “All months” to search the whole run.") + "</p>";
    if (list.length > tl.limit) html += '<div class="more"><button class="btn ghost" id="tl-more">Show more (' + fmtN(list.length - tl.limit) + " left)</button></div>";
    $("#tl-body").innerHTML = '<p class="count">' + fmtN(list.length) + " event" + (list.length === 1 ? "" : "s") + (tl.all ? " across 1884–1886" : " in " + MONTHS[+tl.month.slice(5) - 1] + " " + tl.month.slice(0, 4)) + "</p>" + html;
  }

  // ---------- ROOSEVELT ----------
  var trInit = false;
  function renderRoosevelt() {
    events().then(function (evs) {
      if (!trInit) { trInit = true; $("#tr-rel").addEventListener("change", draw); }
      draw();
      function draw() {
        var rel = $("#tr-rel").checked, html = "", y = "";
        var list = evs.filter(function (e) { return e.tr || (rel && e.trRel); });
        list.forEach(function (e) {
          if (e.date.slice(0, 4) !== y) { y = e.date.slice(0, 4); html += '<div class="year-h">' + y + "</div>"; }
          html += evCard(e);
        });
        $("#tr-body").innerHTML = '<p class="count">' + list.length + " items</p>" + html;
      }
    });
  }

  // ---------- READ THE PAPER ----------
  var osd = null, rd = {};
  function renderPaper(args) {
    var date = args[0], aid = args[1];
    Promise.all([load("issues.json"), load("meta.json")]).then(function (r) {
      var issues = r[0], meta = r[1];
      if (!date || !issues.some(function (i) { return i.date === date; })) return pickIssue(issues, meta);
      if (rd.date === date && $("#reader")) { selectArticle(aid, true); return; }
      openIssue(date, aid, issues);
    });
  }
  function pickIssue(issues, meta) {
    rd = {};
    var byY = {};
    issues.forEach(function (i) { (byY[i.date.slice(0, 4)] = byY[i.date.slice(0, 4)] || []).push({ i: i }); });
    meta.missing.forEach(function (m) { (byY[m.slice(0, 4)] = byY[m.slice(0, 4)] || []).push({ miss: m }); });
    var html = '<div class="panel-head"><div><div class="eyebrow">Every surviving issue</div><h2>Read the Paper</h2><p class="lede">Open any issue to read the transcription beside the original page. Click an item and the scan zooms to it.</p></div></div><div class="issue-pick">';
    Object.keys(byY).sort().forEach(function (y) {
      var arr = byY[y].sort(function (a, b) { return (a.i ? a.i.date : a.miss).localeCompare(b.i ? b.i.date : b.miss); });
      html += '<div><div class="year-h">' + y + " <small>" + arr.filter(function (a) { return a.i; }).length + " issues</small></div><div class=\"grid3\">";
      arr.forEach(function (a) {
        if (a.miss) { html += '<div class="icard missing"><div><b>' + esc(longDate(a.miss)) + "</b><span>Missing from the surviving run</span></div></div>"; return; }
        var i = a.i;
        html += '<a class="icard" href="#paper/' + i.date + '"><img loading="lazy" alt="" src="' + esc(i.thumb) + '/full/,200/0/default.jpg"><div><b>' + esc(longDate(i.date)) + "</b><span>" + esc(i.volume || "") + (i.tr ? " · <strong>Roosevelt</strong>" : "") + "<br>" + esc((i.top || []).slice(0, 2).join(" · ")) + "</span></div></a>";
      });
      html += "</div></div>";
    });
    $("#paper-root").innerHTML = html + "</div>";
  }
  var SECT = { masthead: "Masthead", local: "Local news", editorial: "Editorial", correspondence: "Correspondence", politics: "Politics", range: "Range & stock", railroad: "Railroad", legal: "Legal notice", advertising: "Advertising", "ready-print": "Ready-print (syndicated)" };
  function openIssue(date, aid, issues) {
    getJSON("data/issues/" + date + ".json").then(function (iss) {
      rd = { date: date, iss: iss, page: 1, q: rd.q };
      var idx = issues.findIndex(function (i) { return i.date === date; });
      var prev = issues[idx - 1], next = issues[idx + 1];
      var html = '<div class="reader-top"><div><div class="eyebrow">The Bad Lands Cow Boy · ' + esc(place(date)) + "</div><h2>" + esc(dowDate(date)) + "</h2>" +
        '<div class="small">' + esc(iss.volume || "") + ' · <a href="https://www.loc.gov/item/' + LCCN + "/" + date + '/ed-1/" target="_blank" rel="noopener">This issue at the Library of Congress ↗</a></div></div>' +
        '<div class="issue-nav ui"><a class="chip" href="#paper">All issues</a>' +
        (prev ? '<a class="chip" href="#paper/' + prev.date + '">← ' + esc(longDate(prev.date)) + "</a>" : "") +
        (next ? '<a class="chip" href="#paper/' + next.date + '">' + esc(longDate(next.date)) + " →</a>" : "") + "</div></div>" +
        (iss.review ? '<div class="review">' + esc(iss.review) + "</div>" : "") +
        '<div class="reader" id="reader"><div id="arts"></div><div class="viewer-wrap"><div class="pagebar" id="pagebar"></div><div class="viewer" id="viewer"></div>' +
        '<div class="viewer-note">Scroll or pinch to zoom. Page images: Library of Congress, Chronicling America.</div></div></div>';
      $("#paper-root").innerHTML = html;
      $("#pagebar").innerHTML = iss.pages.map(function (p) { return '<button class="chip" data-page="' + p.seq + '" aria-pressed="false" title="' + esc(p.notes || "") + '">Page ' + p.seq + (p.kind === "ready-print" ? " · syndicated" : "") + "</button>"; }).join("") +
        '<a class="linkbtn" id="locpage" target="_blank" rel="noopener" href="#">Open at LOC ↗</a>';
      $("#pagebar").addEventListener("click", function (e) { var b = e.target.closest("[data-page]"); if (b) setPage(+b.dataset.page); });
      $("#arts").addEventListener("click", function (e) {
        if (e.target.closest("a,button")) return;
        var a = e.target.closest(".art"); if (a) { history.replaceState(null, "", "#paper/" + date + "/" + a.dataset.aid); selectArticle(a.dataset.aid, false); }
      });
      drawArticles();
      var start = aid && iss.articles.find(function (a) { return a.id === aid; });
      setPage(start ? start.page || 1 : 1, function () { if (start) selectArticle(aid, true); });
      window.scrollTo({ top: $(".tabs").offsetTop, behavior: "auto" });
    }).catch(function () { $("#paper-root").innerHTML = '<p class="empty">That issue couldn’t be loaded.</p>'; });
  }
  function markQ(text) {
    var t = esc(text);
    if (!rd.q) return t;
    rd.q.forEach(function (w) { if (w.length > 1) t = t.replace(new RegExp("(" + w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "gi"), "<mark>$1</mark>"); });
    return t;
  }
  function drawArticles() {
    var arts = rd.iss.articles, html = "";
    var groups = [["Local news, editorials & notices", function (a) { return ["advertising", "ready-print", "masthead"].indexOf(a.section) < 0; }],
                  ["Masthead", function (a) { return a.section === "masthead"; }],
                  ["Advertisers & brands (directory)", function (a) { return a.section === "advertising"; }],
                  ["Ready-print pages (syndicated, summarized)", function (a) { return a.section === "ready-print"; }]];
    groups.forEach(function (g) {
      var list = arts.filter(g[1]); if (!list.length) return;
      html += '<div class="sec-h">' + g[0] + "</div>";
      list.forEach(function (a) {
        var cls = "art" + (a.section === "advertising" ? " ad" : "") + (a.section === "ready-print" ? " rp" : "");
        html += '<div class="' + cls + '" id="art-' + esc(a.id) + '" data-aid="' + esc(a.id) + '" data-page="' + (a.page || 1) + '">' +
          '<div class="meta"><span class="tag">' + esc(SECT[a.section] || a.section) + "</span><span>Page " + (a.page || "?") + (a.cols ? ", col. " + esc(a.cols) : "") + "</span>" +
          (a.confidence && a.confidence !== "high" ? '<span class="tag low">' + esc(a.confidence) + " confidence</span>" : "") +
          (a.method === "ocr" ? '<span class="tag">from OCR</span>' : "") + "</div>" +
          (a.headline ? "<h4>" + markQ(a.headline) + "</h4>" : "") +
          (a.text ? '<div class="txt">' + markQ(a.text) + "</div>" : "") +
          (!a.text && a.summary ? '<div class="sum">' + esc(a.summary) + "</div>" : "") + "</div>";
      });
    });
    $("#arts").innerHTML = html;
  }
  function setPage(n, cb) {
    rd.page = n;
    $$("#pagebar [data-page]").forEach(function (b) { b.setAttribute("aria-pressed", +b.dataset.page === n ? "true" : "false"); });
    $("#locpage").href = locPage(rd.date, n);
    var p = rd.iss.pages.find(function (x) { return x.seq === n; }) || rd.iss.pages[0];
    var src = p.iiif + "/info.json";
    function opened() { rd.ready = true; if (cb) cb(); }
    rd.ready = false;
    if (!window.OpenSeadragon) { setTimeout(function () { setPage(n, cb); }, 120); return; }
    if (!osd) {
      osd = OpenSeadragon({ element: $("#viewer"), tileSources: src, prefixUrl: "https://cdnjs.cloudflare.com/ajax/libs/openseadragon/4.1.0/images/",
        showNavigator: true, navigatorPosition: "TOP_RIGHT", gestureSettingsMouse: { clickToZoom: false }, visibilityRatio: 0.6, minZoomImageRatio: 0.5, maxZoomPixelRatio: 2.5, crossOriginPolicy: "Anonymous" });
      osd.addHandler("open", function () { if (rd.onOpen) { var f = rd.onOpen; rd.onOpen = null; f(); } });
      rd.onOpen = opened;
    } else if (!document.body.contains(osd.element)) {
      osd.destroy(); osd = null; return setPage(n, cb);
    } else { rd.onOpen = opened; osd.open(src); }
  }
  function selectArticle(aid, scroll) {
    if (!aid || !rd.iss) return;
    var a = rd.iss.articles.find(function (x) { return x.id === aid; }); if (!a) return;
    $$(".art.on").forEach(function (el) { el.classList.remove("on"); });
    var el = $("#art-" + CSS.escape(aid)); if (el) { el.classList.add("on"); if (scroll) el.scrollIntoView({ block: window.innerWidth <= 960 ? "start" : "center" }); }
    var show = function () {
      osd.clearOverlays();
      var it = osd.world.getItemAt(0); if (!it || !a.region) return;
      var sz = it.getContentSize(), r = a.region;
      var rect = it.imageToViewportRectangle(r[0] / 100 * sz.x, r[1] / 100 * sz.y, r[2] / 100 * sz.x, r[3] / 100 * sz.y);
      var ov = document.createElement("div"); ov.className = "hl";
      osd.addOverlay({ element: ov, location: rect });
      var padW = rect.width * 0.25, h = Math.min(rect.height, rect.width * 2.2);
      osd.viewport.fitBoundsWithConstraints(new OpenSeadragon.Rect(rect.x - padW, rect.y - padW * 0.5, rect.width + padW * 2, h + padW));
    };
    if ((a.page || 1) !== rd.page) setPage(a.page || 1, show); else if (rd.ready) show(); else rd.onOpen = show;
  }

  // ---------- SEARCH ----------
  var sInit = false, SIDX = null;
  function renderSearch(args) {
    if (!sInit) {
      sInit = true;
      $("#s-form").addEventListener("submit", function (e) { e.preventDefault(); go("#search/" + encodeURIComponent($("#s-q").value.trim())); });
      $("#s-body").addEventListener("click", function (e) { if (e.target.id === "s-more") { sLimit += 100; doSearch($("#s-q").value); } });
    }
    var q = args.join("/");
    if (q) { $("#s-q").value = q; sLimit = 100; doSearch(q); } else { $("#s-body").innerHTML = ""; setTimeout(function () { $("#s-q").focus(); }, 50); }
  }
  var sLimit = 100;
  function terms(q) { var t = []; q.replace(/"([^"]+)"|(\S+)/g, function (_, a, b) { t.push(norm(a || b)); }); return t.filter(Boolean); }
  function doSearch(q) {
    var t = terms(q); if (!t.length) return;
    $("#s-body").innerHTML = '<p class="count">Searching…</p>';
    (SIDX ? Promise.resolve(SIDX) : load("search.json").then(function (d) { SIDX = d.map(function (r) { return { d: r[0], a: r[1], h: r[2], t: r[3], n: norm(r[2] + " " + r[3]) }; }); return SIDX; })).then(function (idx) {
      var hits = idx.filter(function (r) { return t.every(function (w) { return r.n.indexOf(w) >= 0; }); });
      rd.q = t;
      var html = '<p class="count">' + fmtN(hits.length) + " item" + (hits.length === 1 ? "" : "s") + " mention " + esc(q) + "</p>";
      hits.slice(0, sLimit).forEach(function (r) {
        var pos = r.n.indexOf(t[0]) - (r.h ? r.h.length + 1 : 0), s = Math.max(0, pos - 140);
        var snip = (s > 0 ? "…" : "") + r.t.slice(s, pos + 220) + (pos + 220 < r.t.length ? "…" : "");
        var h = esc(snip);
        t.forEach(function (w) { h = h.replace(new RegExp("(" + w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "gi"), "<mark>$1</mark>"); });
        html += '<div class="hit"><div class="meta">' + esc(longDate(r.d)) + (r.h ? " · " + esc(r.h) : "") + '</div><p>' + h + '</p><a class="linkbtn" href="#paper/' + r.d + "/" + r.a + '">Read it in the paper →</a></div>';
      });
      if (hits.length > sLimit) html += '<div class="more"><button class="btn ghost" id="s-more">Show more</button></div>';
      if (!hits.length) html += '<p class="empty">Nothing found. Period spelling varies (for example “ranche,” “round up”), so try a shorter word.</p>';
      $("#s-body").innerHTML = html;
    });
  }

  // ---------- BRANDS & BUSINESSES ----------
  var dInit = false, dKind = "brands";
  function renderBrands() {
    load("directory.json").then(function (dir) {
      if (!dInit) {
        dInit = true;
        $$("[data-dir]").forEach(function (b) { b.addEventListener("click", function () { dKind = b.dataset.dir; $$("[data-dir]").forEach(function (x) { x.setAttribute("aria-pressed", x === b); }); draw(); }); });
        $("#d-q").addEventListener("input", draw);
      }
      draw();
      function draw() {
        var q = norm($("#d-q").value.trim());
        var list = dir[dKind].filter(function (r) { return !q || norm(r.name + " " + r.text).indexOf(q) >= 0; })
          .sort(function (a, b) { return b.n - a.n || a.name.localeCompare(b.name); });
        $("#d-body").innerHTML = list.length ? list.map(function (r) {
          var body = r.text.indexOf(r.name) === 0 ? r.text.slice(r.name.length).replace(/^[,\s—-]+/, "") : r.text;
          return '<div class="dcard"><h4>' + esc(r.name) + "</h4><p>" + esc(body) + '</p><div class="meta"><span>' + r.n + " issue" + (r.n > 1 ? "s" : "") + " · " + esc(MON[pd(r.first).getUTCMonth()] + " " + r.first.slice(0, 4)) + (r.last !== r.first ? "–" + esc(MON[pd(r.last).getUTCMonth()] + " " + r.last.slice(0, 4)) : "") + '</span><a href="#paper/' + r.issue + '">See the ad →</a></div></div>';
        }).join("") : '<p class="empty">No match.</p>';
      }
    });
  }

  // ---------- ABOUT ----------
  function renderAbout() {
    if (rendered.about) return; rendered.about = true;
    load("meta.json").then(function (m) {
      $("#about-root").innerHTML = '<div class="prose">' +
        '<div class="eyebrow">About the paper</div><h2>A newspaper for a cow town</h2>' +
        "<p>A. T. Packard, a young University of Michigan graduate, came west on the Northern Pacific and put out the first issue of <em>The Bad Lands Cow Boy</em> on February 7, 1884, at Little Missouri, beside the new town of Medora. It was a four-page weekly. Two pages were Packard’s own: local items, editorials, range news, legal notices, ads and columns of cattle brands. The other two were “ready-print,” national filler bought pre-printed. The paper’s dateline moved to Medora in November 1885. The last issue the Library of Congress holds is dated December 23, 1886. The Theodore Roosevelt Center gives the final issue as January 1887.</p>" +
        "<p>Roosevelt sought Packard out and regarded the Cow Boy office as his social headquarters in Medora.</p>" +
        "<h3>What’s here</h3><ul>" +
        "<li><strong>" + m.issues + " issues</strong>: every issue in the Library of Congress run, February 7, 1884 to December 23, 1886.</li>" +
        "<li><strong>" + fmtN(m.articles) + " transcribed items</strong> (about " + fmtN(Math.round(m.words / 1000)) + ",000 words) of local news, editorials, correspondence, range news and notices.</li>" +
        "<li><strong>" + fmtN(m.events) + " dated events</strong> drawn from those items, including <strong>" + m.tr + "</strong> that name Theodore Roosevelt.</li>" +
        "<li>A directory of the cattle brands and businesses the paper advertised.</li></ul>" +
        "<h3>How the transcriptions were made</h3>" +
        "<p>The Library of Congress scans come with machine-read (OCR) text, but 1880s newsprint defeats most OCR, often down to gibberish. For this project, AI read each column of local content directly from the full-resolution page scans, using the old OCR only as a guide. Original spelling, punctuation and wording are kept, including the paper’s misprints. Words that couldn’t be read are marked <code>[illegible]</code>, and uncertain readings appear as <code>[word?]</code>. Each item carries a confidence rating.</p>" +
        "<p>Ready-print pages are summarized, not transcribed, because they weren’t written in Medora. Display ads and brand cards are listed as a directory instead of word for word.</p>" +
        "<p>Events are dated from the paper’s own wording. “Monday” in a Thursday paper means the Monday before. Undated items are placed in the week before the issue. Each event links back to the item and the spot on the page it came from.</p>" +
        "<p><strong>Check before you quote.</strong> AI transcription is very good but not perfect. Before using any text in print, a post or an exhibit, compare it with the page image. One click opens it beside the transcription.</p>" +
        "<h3>Reading the 1880s on its own terms</h3><p>The Cow Boy reflects the attitudes of its time and place, including language about Native Americans, Chinese immigrants and others that is offensive today. It’s transcribed as printed, because the historical record is more useful whole.</p>" +
        "<h3>Missing issues</h3><p>These weeks are missing from the surviving run. Some may never have been printed. The gaps around the paper\u2019s move to Medora in November 1885 may be weeks it didn\u2019t publish. The issue of November 25, 1886 survives only in part.</p>" +
        '<ul class="missing-list">' + m.missing.map(function (d) { return "<li>" + esc(longDate(d)) + "</li>"; }).join("") + "</ul>" +
        "<p>Yale University Library holds an original copy of the September 11, 1884 issue. If you know of other surviving copies, please tell the Library.</p>" +
        "<h3>Sources and credits</h3><ul>" +
        '<li>Page images and original OCR: <a href="https://www.loc.gov/item/sn84024777/">Library of Congress, Chronicling America</a>, from the State Historical Society of North Dakota’s microfilm (National Digital Newspaper Program).</li>' +
        '<li>Original copies of several issues, along with Roosevelt’s ranching contract and letters, belong to the <a href="https://www.theodorerooseveltcenter.org/collection/theodore-roosevelt-medora-foundation/">Theodore Roosevelt Medora Foundation</a>, digitized through Digital Horizons.</li>' +
        '<li>Background on A. T. Packard: <a href="https://www.theodorerooseveltcenter.org/encyclopedia/dakota-and-ranching/a-t-packard">Theodore Roosevelt Center, Dickinson State University</a>.</li>' +
        "<li>Transcriptions, event index and site: Theodore Roosevelt Presidential Library.</li></ul>" +
        "<h3>How to cite</h3><p>Cite the newspaper itself, not this site: <em>The Bad Lands Cow Boy</em> (Medora, Dakota Territory), July 8, 1886, p. 1. Library of Congress, Chronicling America. Every event has a “Copy citation” button.</p>" +
        "</div>";
    });
  }

  // ---------- EMBED & DATA ----------
  function renderEmbed() {
    if (rendered.embed) return; rendered.embed = true;
    var snip = function (v) { return '<div data-badlands-cowboy="' + v + '"></div>\n<script src="' + SITE + 'embed.js" async></' + 'script>'; };
    $("#embed-root").innerHTML = '<div class="prose"><div class="eyebrow">For trlibrary.com and partners</div><h2>Embed &amp; Data</h2>' +
      "<p>Each section can run on another page as a widget. The widget sizes itself to its content. Paste this where the widget should appear (in Drupal, a Code block):</p>" +
      "<h3>This Week in Medora</h3><p>Updates itself every day.</p><pre>" + esc(snip("thisweek")) + "</pre>" +
      "<h3>Roosevelt in the Cow Boy</h3><pre>" + esc(snip("roosevelt")) + "</pre>" +
      "<h3>Other views</h3><p>Use <code>timeline</code>, <code>paper</code>, <code>search</code> or <code>brands</code> as the value. Use <code>all</code> to show the full site with its tabs.</p>" +
      "<h3>Data downloads</h3><ul>" +
      '<li><a href="data/events.csv" download>events.csv</a>: every dated event, one row each, with source issue and page links. Opens in Excel.</li>' +
      '<li><a href="data/events.json">events.json</a>: the same, as JSON.</li>' +
      '<li><a href="data/directory.json">directory.json</a>: brands and businesses.</li>' +
      '<li>Full per-issue transcriptions are in <code>data/issues/</code> and the project’s GitHub repository.</li></ul>' +
      "<h3>Social drafts</h3><p>Every event has a “Copy social draft” button. It produces an #OTD-style post with the quote, the source and a link to the original page. Check the quote against the scan before posting.</p></div>";
  }

  // ---------- go ----------
  if (EMBED && params.get("view") && !location.hash) location.hash = "#" + params.get("view");
  route();
})();
