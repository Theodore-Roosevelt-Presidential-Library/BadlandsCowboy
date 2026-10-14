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
  var CARD = EMBED && params.get("person") ? params.get("person") : "";
  if (EMBED) {
    document.body.classList.add("embed");
    if (params.get("view")) document.body.classList.add("single");
    if (params.get("heading") === "off") document.body.classList.add("noheading");
    if (CARD) document.body.classList.add("pcard-mode");
    var post = function () { parent.postMessage({ type: "badlands-cowboy:height", id: EMBED_ID, height: document.documentElement.scrollHeight }, "*"); };
    if (window.ResizeObserver) new ResizeObserver(post).observe(document.body);
    window.addEventListener("load", post);
    $$("a[href^='#']").forEach(function () {});
  }

  // ---------- routing ----------
  var VIEWS = ["thisweek", "timeline", "roosevelt", "people", "paper", "search", "brands", "about", "embed"];
  var rendered = {};
  function route() {
    var h = decodeURIComponent(location.hash.replace(/^#\/?/, "")).split("/");
    if (CARD) h = ["people", CARD];
    var view = VIEWS.indexOf(h[0]) >= 0 ? h[0] : (EMBED && params.get("view")) || "thisweek";
    $$(".tabs button").forEach(function (b) { b.setAttribute("aria-selected", b.dataset.view === view ? "true" : "false"); });
    $$("section.panel").forEach(function (p) { p.hidden = p.dataset.panel !== view; });
    if (view !== "people") document.body.classList.remove("v-people");
    var fn = { thisweek: renderThisWeek, timeline: renderTimeline, roosevelt: renderRoosevelt, paper: renderPaper,
               search: renderSearch, people: renderPeople, brands: renderBrands, about: renderAbout, embed: renderEmbed }[view];
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
      peopleLinks(e.people) +
      '<div class="foot2"><span>' + (e.reprint ? "Missing issue of " + esc(longDate(e.issue)) + ", as reprinted in the " + esc(e.reprint.title) + ", " + esc(longDate(e.reprint.date)) : "The Cow Boy, " + esc(longDate(e.issue)) + (e.page ? ", p. " + e.page : "") + esc(also)) + "</span>" +
        '<a href="' + linkTo("#paper/" + e.issue + "/" + (e.article || "")) + '"' + targetAttr() + ">Read it in the paper →</a>" +
        (opt.noTools ? "" : '<button class="linkbtn" data-cite="' + esc(e.id) + '">Copy citation</button>' +
          '<button class="linkbtn" data-social="' + esc(e.id) + '">Copy social draft</button>') +
        tags.map(function (t) { return '<span class="tag">' + esc(t.replace(/-/g, " ")) + "</span>"; }).join(" ") +
      "</div></article>";
  }
  // people: alias -> id, id -> index row
  var PIDX = null, PALIAS = {}, PBYID = {};
  function peopleIdx() {
    if (PIDX) return Promise.resolve(PIDX);
    return load("people.json").then(function (d) { PALIAS = d.alias; d.people.forEach(function (r) { PBYID[r[0]] = r; }); PIDX = d.people; return PIDX; });
  }
  function personLink(id, label) { var r = PBYID[id]; if (!r) return esc(label || id); return '<a class="plink" href="' + (EMBED && !document.body.classList.contains("v-people") ? SITE : "") + "#people/" + id + '"' + (EMBED && !document.body.classList.contains("v-people") ? ' target="_blank" rel="noopener"' : "") + ">" + esc(label || r[1]) + "</a>"; }
  function peopleLinks(names) {
    if (!PIDX || !names || !names.length) return "";
    var seen = {}, out = [];
    names.forEach(function (n) { var id = PALIAS[n]; if (id && PBYID[id] && !seen[id]) { seen[id] = 1; out.push(personLink(id)); } });
    return out.length ? '<div class="people-row"><span>People:</span> ' + out.join(", ") + "</div>" : "";
  }
  var EV = null, EVBYID = {};
  function events() {
    if (EV) return Promise.resolve(EV);
    return Promise.all([load("events.json"), peopleIdx().catch(function () {})]).then(function (r) { var d = r[0]; EV = d; d.forEach(function (e) { EVBYID[e.id] = e; }); return d; });
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
    Promise.all([events(), load("issues.json"), load("meta.json"), reprints()]).then(function (r) {
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
        miss.forEach(function (m) { var n = (RP && RP[m] || []).length; strip += n ? '<a class="icard missing" href="' + linkTo("#paper/" + m) + '"' + targetAttr() + '><div><b>' + esc(longDate(m)) + "</b><span>No copy of this issue survives. " + n + " item" + (n > 1 ? "s" : "") + " recovered from other papers' reprints →</span></div></a>" : '<div class="icard missing"><div><b>' + esc(longDate(m)) + "</b><span>No copy of this issue is known to survive.</span></div></div>"; });
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
    var date = args[0], aid = args[1], hl = args[2];
    Promise.all([load("issues.json"), load("meta.json"), reprints()]).then(function (r) {
      var issues = r[0], meta = r[1];
      if (date && meta.missing.indexOf(date) >= 0) return missingIssue(date, aid, issues, meta);
      if (!date || !issues.some(function (i) { return i.date === date; })) return pickIssue(issues, meta);
      if (hl && /^p:/.test(hl)) { return getJSON("data/people/" + hl.slice(2) + ".json").then(function (p) { rd.q = p.hl.map(norm); rd.qp = hl; go2(); }, go2); }
      if (rd.qp && !hl) { rd.q = null; rd.qp = null; if (rd.date === date) { drawArticles(); } }
      go2();
      function go2() {
      if (rd.date === date && $("#reader")) { if (rd.drawnQ !== rd.qp) drawArticles(); selectArticle(aid, true); return; }
      openIssue(date, aid, issues);
      }
    });
  }
  var RP = null;
  function reprints() { if (RP) return Promise.resolve(RP); return load("reprints.json").then(function (d) { RP = d; return d; }, function () { RP = {}; return RP; }); }
  function rpImg(src, w) { var b = src.region; return src.iiif + "/pct:" + [Math.max(0, b[0] - 0.6), Math.max(0, b[1] - 0.5), b[2] + 1.2, b[3] + 1].map(function (v) { return v.toFixed(2); }).join(",") + "/" + (w || "full") + "/0/default.jpg"; }
  function missingIssue(date, aid, issues, meta) {
    rd = {};
    var items = RP[date] || [];
    var before = issues.filter(function (i) { return i.date < date; }).pop(), after = issues.find(function (i) { return i.date > date; });
    var html = '<div class="reader-top"><div><div class="eyebrow">The Bad Lands Cow Boy · ' + esc(place(date)) + "</div><h2>" + esc(dowDate(date)) + "</h2>" +
      '<div class="small">No copy of this issue is known to survive.</div></div><div class="issue-nav ui"><a class="chip" href="#paper">All issues</a>' +
      (before ? '<a class="chip" href="#paper/' + before.date + '">← ' + esc(longDate(before.date)) + "</a>" : "") +
      (after ? '<a class="chip" href="#paper/' + after.date + '">' + esc(longDate(after.date)) + " →</a>" : "") + "</div></div>";
    if (!items.length) html += '<p class="empty">Nothing from this week has turned up in other papers yet. If you know of a surviving copy, please tell the Library.</p>';
    else {
      html += '<p class="lede">Other papers often reprinted items from the Cow Boy with a credit line. ' + (items.length > 1 ? "These " + items.length + " items most likely came" : "This item most likely came") + " from this lost issue. Each is transcribed from the reprinting paper's page, which may have trimmed or reworded it.</p><div class=\"rp-list\">";
      items.forEach(function (it) {
        var s = it.src;
        html += '<article class="rp' + (aid === it.id ? " on" : "") + '" id="art-' + it.id + '"><div class="rp-scan"><a href="' + esc(s.url) + '" target="_blank" rel="noopener"><img loading="lazy" alt="The item as printed in the ' + esc(s.title) + '" src="' + esc(rpImg(s)) + '"></a></div><div>' +
          '<div class="meta"><span class="tag">Reprint</span><span>' + esc(s.title) + (s.place ? ", " + esc(s.place) : "") + ", " + esc(longDate(s.date)) + (s.page ? ", p. " + s.page : "") + "</span>" +
          (it.conf !== "high" ? '<span class="tag low">' + esc(it.conf) + " confidence it came from this issue</span>" : "") + "</div>" +
          '<div class="txt">' + esc(it.text) + "</div>" + peopleLinks(it.people) +
          (it.why ? '<p class="small">Why this issue: ' + esc(it.why) + "</p>" : "") +
          '<a class="linkbtn" href="' + esc(s.url) + '" target="_blank" rel="noopener">See the full page at the Library of Congress ↗</a></div></article>';
      });
      html += "</div>";
    }
    $("#paper-root").innerHTML = html;
    window.scrollTo({ top: $(".tabs").offsetTop, behavior: "auto" });
    if (aid) { var el = $("#art-" + CSS.escape(aid)); if (el) el.scrollIntoView({ block: "center" }); }
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
        if (a.miss) { var n = (RP[a.miss] || []).length; html += '<a class="icard missing" href="#paper/' + a.miss + '"><div><b>' + esc(longDate(a.miss)) + "</b><span>No copy survives" + (n ? ". " + n + " item" + (n > 1 ? "s" : "") + " recovered from reprints →" : "") + "</span></div></a>"; return; }
        var i = a.i;
        html += '<a class="icard" href="#paper/' + i.date + '"><img loading="lazy" alt="" src="' + esc(i.thumb) + '/full/,200/0/default.jpg"><div><b>' + esc(longDate(i.date)) + "</b><span>" + esc(i.volume || "") + (i.tr ? " · <strong>Roosevelt</strong>" : "") + "<br>" + esc((i.top || []).slice(0, 2).join(" · ")) + "</span></div></a>";
      });
      html += "</div></div>";
    });
    $("#paper-root").innerHTML = html + "</div>";
  }
  var SECT = { masthead: "Masthead", local: "Local news", editorial: "Editorial", correspondence: "Correspondence", politics: "Politics", range: "Range & stock", railroad: "Railroad", legal: "Legal notice", advertising: "Advertising", "ready-print": "Ready-print (syndicated)" };
  function openIssue(date, aid, issues) {
    Promise.all([getJSON("data/issues/" + date + ".json"), peopleIdx().catch(function () {})]).then(function (rr) { var iss = rr[0];
      rd = { date: date, iss: iss, page: 1, q: rd.q, qp: rd.qp };
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
        var a = e.target.closest(".art"); if (a) { history.replaceState(null, "", "#paper/" + date + "/" + a.dataset.aid + (rd.qp ? "/" + rd.qp : "")); selectArticle(a.dataset.aid, false); }
      });
      drawArticles();
      var start = aid && (/^box:/.test(aid) ? { page: +aid.split(":")[1] } : iss.articles.find(function (a) { return a.id === aid; }));
      setPage(start ? start.page || 1 : 1, function () { if (start) selectArticle(aid, true); });
      window.scrollTo({ top: $(".tabs").offsetTop, behavior: "auto" });
    }).catch(function () { $("#paper-root").innerHTML = '<p class="empty">That issue couldn’t be loaded.</p>'; });
  }
  function markQ(text) {
    var t = esc(text);
    if (!rd.q) return t;
    var b = rd.qp ? "\\b" : "";
    rd.q.forEach(function (w) { if (w.length > 1) t = t.replace(new RegExp(b + "(" + w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")" + b, "gi"), "<mark>$1</mark>"); });
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
          (!a.text && a.summary ? '<div class="sum">' + esc(a.summary) + "</div>" : "") +
          (a.pids && PIDX ? '<div class="people-row"><span>People:</span> ' + a.pids.map(function (id) { return personLink(id); }).join(", ") + "</div>" : "") + "</div>";
      });
    });
    $("#arts").innerHTML = html;
    rd.drawnQ = rd.qp;
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
    var a;
    if (/^box:/.test(aid)) { var pp = aid.slice(4).split(":"); a = { id: aid, page: +pp[0], region: pp[1].split(",").map(Number) }; }
    else a = rd.iss.articles.find(function (x) { return x.id === aid; });
    if (!a) return;
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
      rd.q = t; rd.qp = null;
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

  // ---------- PEOPLE ----------
  var GROUPS = [["roosevelt-circle", "Roosevelt's circle"], ["mores-circle", "The Marquis's circle"], ["ranching", "Ranchers & cowboys"], ["town", "Medora townspeople"], ["business", "Business"], ["railroad", "Railroad"], ["law", "Law & order"], ["politics", "Politics"], ["press", "Press"], ["clergy", "Clergy"], ["military", "Military"], ["native", "Native Americans"], ["other", "Others"]];
  var GNAME = {}; GROUPS.forEach(function (g) { GNAME[g[0]] = g[1]; });
  var pp = { q: "", group: "", sort: "n", limit: 120, init: false };
  function renderPeople(args) {
    document.body.classList.add("v-people");
    peopleIdx().then(function (idx) {
      if (!pp.init) {
        pp.init = true;
        $("#pp-groups").innerHTML = GROUPS.map(function (g) { var n = idx.filter(function (r) { return r[3] === g[0]; }).length; return n ? '<button class="chip" data-g="' + g[0] + '" aria-pressed="false">' + esc(g[1]) + '<span class="n">' + n + "</span></button>" : ""; }).join("");
        $("#pp-groups").addEventListener("click", function (e) { var b = e.target.closest("[data-g]"); if (!b) return; pp.group = pp.group === b.dataset.g ? "" : b.dataset.g; $$("#pp-groups [data-g]").forEach(function (x) { x.setAttribute("aria-pressed", x.dataset.g === pp.group); }); pp.limit = 120; drawList(); });
        var t; $("#pp-q").addEventListener("input", function () { clearTimeout(t); var v = this.value; t = setTimeout(function () { pp.q = norm(v.trim()); pp.limit = 120; drawList(); }, 150); });
        $("#pp-sort").addEventListener("change", function () { pp.sort = this.value; drawList(); });
        $("#pp-bio").addEventListener("change", function () { pp.limit = 120; drawList(); });
        $("#pp-body").addEventListener("click", function (e) { if (e.target.id === "pp-more") { pp.limit += 240; drawList(); } });
      }
      if (args[0]) return drawPerson(args[0]);
      $("#pp-list").hidden = false; $("#pp-person").hidden = true; drawList();
    });
  }
  function drawList() {
    var bio = $("#pp-bio").checked;
    var list = PIDX.filter(function (r) {
      if (pp.group && r[3] !== pp.group) return false;
      if (bio && !r[7]) return false;
      return !pp.q || norm(r[1] + " " + r[2]).indexOf(pp.q) >= 0;
    }).slice().sort(pp.sort === "name" ? function (a, b) { return lastName(a[1]).localeCompare(lastName(b[1])) || a[1].localeCompare(b[1]); } : function (a, b) { return b[4] - a[4] || a[1].localeCompare(b[1]); });
    $("#pp-body").innerHTML = '<p class="count">' + fmtN(list.length) + " " + (list.length === 1 ? "person" : "people") + "</p>" + '<div class="pp-grid">' + list.slice(0, pp.limit).map(function (r) {
      return '<a class="pcard' + (r[7] ? "" : " thin") + '" href="#people/' + r[0] + '"><h4>' + esc(r[1]) + "</h4>" + (r[2] ? "<p>" + esc(r[2]) + "</p>" : "") + '<div class="m">' + r[4] + " item" + (r[4] > 1 ? "s" : "") + " · " + (r[5] === r[6] ? r[5] : r[5] + "–" + r[6]) + "</div></a>";
    }).join("") + "</div>" + (list.length > pp.limit ? '<div class="more"><button class="btn ghost" id="pp-more">Show more (' + fmtN(list.length - pp.limit) + " left)</button></div>" : "");
  }
  function lastName(n) { var t = n.replace(/\(.*?\)/g, "").trim().split(/\s+/); return norm(t[t.length - 1] || n); }
  function drawPerson(id) {
    $("#pp-list").hidden = true; $("#pp-person").hidden = false;
    $("#pp-person").innerHTML = '<p class="count">Loading…</p>';
    getJSON("data/people/" + id + ".json").then(function (p) {
      if (CARD) return drawPersonCard(p);
      var hl = "p:" + p.id, byY = {};
      p.mentions.forEach(function (m) { (byY[m[0].slice(0, 4)] = byY[m[0].slice(0, 4)] || []).push(m); });
      var html = '<div class="person"><a class="chip" href="#people">← All people</a>' +
        '<div class="eyebrow" style="margin-top:18px">' + esc(GNAME[p.group] || "") + "</div><h2>" + esc(p.name) + "</h2>" +
        (p.role ? '<p class="lede">' + esc(p.role) + "</p>" : "") +
        '<div class="pstats"><span><b>' + p.mentions.length + "</b> item" + (p.mentions.length > 1 ? "s" : "") + " in the Cow Boy</span><span>" + esc(longDate(p.mentions[0][0])) + (p.mentions.length > 1 ? " to " + esc(longDate(p.mentions[p.mentions.length - 1][0])) : "") + "</span>" +
        (p.aliases.length > 1 ? "<span>Also printed as " + p.aliases.filter(function (a) { return a !== p.name; }).map(esc).join("; ") + "</span>" : "") + "</div>" +
        (p.bio ? '<div class="bio"><p>' + esc(p.bio) + '</p><p class="small">Written only from what the Cow Boy printed, with AI help. Spellings follow the paper. Check the page before quoting.</p></div>' :
          '<p class="small">The Cow Boy mentions ' + esc(p.name) + " only briefly. Every item is below.</p>") +
        (p.ambiguous ? '<p class="review">The paper gives only a partial name here, so these items may refer to more than one person.</p>' : "");
      if (p.moments.length) html += '<h3>Key moments</h3><ol class="moments">' + p.moments.map(function (m) { var r = m.ref.split("/"); return '<li><a href="' + linkTo("#paper/" + r[0] + "/" + r[1] + "/" + hl) + '"' + targetAttr() + "><b>" + esc(longDate(r[0])) + "</b> " + esc(m.label) + "</a></li>"; }).join("") + "</ol>";
      html += "<h3>Every mention</h3>";
      Object.keys(byY).sort().forEach(function (y) {
        html += '<div class="year-h">' + y + " <small>" + byY[y].length + "</small></div>";
        byY[y].forEach(function (m) {
          var h = esc(m[3]);
          p.hl.forEach(function (w) { h = h.replace(new RegExp("\\b(" + w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")\\b", "gi"), "<mark>$1</mark>"); });
          html += '<div class="hit"><div class="meta">' + esc(longDate(m[0])) + (m[2] ? " · " + esc(m[2]) : "") + "</div><p>" + h + '</p><a class="linkbtn" href="' + linkTo("#paper/" + m[0] + "/" + m[1] + "/" + hl) + '"' + targetAttr() + ">Read it in the paper →</a></div>";
        });
      });
      html += '<div class="acts"><button class="linkbtn" id="pp-copy">Copy link to this person</button><button class="linkbtn" id="pp-cite">Copy a short bio for a post</button></div></div>';
      $("#pp-person").innerHTML = html;
      $("#pp-copy").addEventListener("click", function () { copy(SITE + "#people/" + p.id, "Link copied"); });
      $("#pp-cite").addEventListener("click", function () { copy(p.name + (p.role ? ", " + p.role : "") + ". " + (p.bio || "") + "\n\nEvery mention in Medora's 1880s newspaper: " + SITE + "#people/" + p.id + "\nPlan your visit to the Theodore Roosevelt Presidential Library: trlibrary.com/visit\n#DareGreatly", "Copied. Check it against the page scans before posting."); });
      if (!EMBED) window.scrollTo({ top: $(".tabs").offsetTop, behavior: "auto" });
    }, function () { $("#pp-person").innerHTML = '<p class="empty">That person couldn’t be found. <a href="#people">See everyone</a>.</p>'; });
  }


  // Single-person card for a host page that already carries a verified biography
  // (e.g. trlibrary.com/tr/people/...): no AI bio, no back link, mentions folded away.
  function drawPersonCard(p) {
    var hl = "p:" + p.id, n = p.mentions.length;
    var first = p.mentions[0][0], last = p.mentions[n - 1][0];
    var item = function (m) {
      var h = esc(m[3]);
      p.hl.forEach(function (w) { h = h.replace(new RegExp("\\b(" + w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")\\b", "gi"), "<mark>$1</mark>"); });
      return '<div class="hit"><div class="meta">' + esc(longDate(m[0])) + (m[2] ? " · " + esc(m[2]) : "") + "</div><p>" + h + '</p><a class="linkbtn" href="' + linkTo("#paper/" + m[0] + "/" + m[1] + "/" + hl) + '"' + targetAttr() + ">Read it in the paper →</a></div>";
    };
    var html = '<div class="person pcard-one"><div class="eyebrow">In The Bad Lands Cow Boy</div>' +
      '<div class="pstats"><span><b>' + n + "</b> item" + (n > 1 ? "s" : "") + " in Medora’s newspaper</span><span>" + esc(longDate(first)) + (n > 1 ? " to " + esc(longDate(last)) : "") + "</span>" +
      (p.aliases.length > 1 ? "<span>Printed as " + p.aliases.map(esc).join("; ") + "</span>" : "") + "</div>";
    if (p.moments.length) html += '<h3>Key moments</h3><ol class="moments">' + p.moments.map(function (m) { var r = m.ref.split("/"); return '<li><a href="' + linkTo("#paper/" + r[0] + "/" + r[1] + "/" + hl) + '"' + targetAttr() + "><b>" + esc(longDate(r[0])) + "</b> " + esc(m.label) + "</a></li>"; }).join("") + "</ol>";
    html += '<details class="allm"><summary>Every mention (' + n + ")</summary>" + p.mentions.map(item).join("") + "</details>";
    html += '<p class="small">Spellings follow the paper. Each item links to the page it was printed on.</p>';
    html += '<div class="acts"><a class="btn" href="' + SITE + "#people/" + p.id + '" target="_blank" rel="noopener">Open in the Cow Boy archive →</a></div></div>';
    $("#pp-person").innerHTML = html;
  }

  // ---------- THE ADS (gallery + directory lists) ----------
  var dInit = false, dKind = "gallery", adCats = {}, ADS = null, ADBYID = {};
  var CATGROUPS = [
    ["Saloons, liquor & cigars", ["saloon", "liquor & cigars"]],
    ["Hotels & eating", ["hotel", "restaurant", "groceries"]],
    ["Stores", ["general store", "clothing", "hardware & guns", "drugs & medicine"]],
    ["Ranch & range", ["livestock & ranch supplies", "saddlery & harness", "wagons & vehicles"]],
    ["Cattle & horse brands", ["cattle brand", "horse brand"]],
    ["Money, land & law", ["bank & insurance", "real estate & town lots", "lawyer", "doctor"]],
    ["Rail & stage", ["railroad & stage"]],
    ["Services", ["services"]],
    ["Mail order & makers", ["manufacturer", "newspaper & printing", "other"]]];
  function adImg(a, w) { var b = a.box; return a.iiif + "/pct:" + b.map(function (v) { return v.toFixed(2); }).join(",") + "/" + (w === "full" ? "full" : "!" + w + "," + w) + "/0/default.jpg"; }
  function monY(d) { return MON[pd(d).getUTCMonth()] + " " + d.slice(0, 4); }
  function adSocial(a) {
    return "From the ads in Medora's frontier newspaper, The Bad Lands Cow Boy, " + monY(a.issue) + ": " + a.advertiser + (a.town ? " of " + a.town : "") + ". " +
      (a.sells ? "Selling: " + a.sells + ". " : "") + (a.pitch ? "The pitch: " + a.pitch + "." : "") +
      "\n\nSee the original ad: " + SITE + "#brands/" + a.id + "\nPlan your visit to the Theodore Roosevelt Presidential Library: trlibrary.com/visit\n#DareGreatly";
  }
  function openAd(id) {
    var a = ADBYID[id]; if (!a) return;
    $("#m-body").innerHTML = '<div class="ad-detail"><div class="scan"><img alt="' + esc(a.advertiser) + ' ad from The Bad Lands Cow Boy" src="' + esc(adImg(a, "full")) + '"></div><div>' +
      '<div class="eyebrow">' + esc(a.category || "") + (a.local ? " · Badlands business" : "") + "</div><h3 id=\"m-title\">" + esc(a.advertiser) + "</h3><dl>" +
      (a.town ? "<div><dt>Where</dt><dd>" + esc(a.town) + "</dd></div>" : "") +
      (a.sells ? "<div><dt>Selling</dt><dd>" + esc(a.sells) + "</dd></div>" : "") +
      (a.pitch ? "<div><dt>The pitch</dt><dd>" + esc(a.pitch) + "</dd></div>" : "") +
      (a.prices ? "<div><dt>Prices</dt><dd>" + esc(a.prices) + "</dd></div>" : "") +
      "<div><dt>Ran</dt><dd>First in " + esc(longDate(a.issue)) + ", page " + a.page + (a.runs > 1 ? "; in about " + a.runs + " issues, through " + esc(monY(a.last)) : "") + "</dd></div>" +
      (a.notes ? "<div><dt>Notes</dt><dd>" + esc(a.notes) + "</dd></div>" : "") +
      (a.text ? '<div><dt>As printed</dt><dd class="txt">' + esc(a.text) + "</dd></div>" : "") + "</dl>" +
      '<div class="acts"><a href="' + linkTo("#paper/" + a.issue + "/box:" + a.page + ":" + a.box.join(",")) + '"' + targetAttr() + '>See it on the page →</a>' +
      '<button class="linkbtn" data-adsocial="' + a.id + '">Copy social draft</button>' +
      '<button class="linkbtn" data-adcite="' + a.id + '">Copy citation</button></div></div></div>';
    $("#modal").hidden = false; document.body.style.overflow = "hidden";
  }
  function closeModal() { $("#modal").hidden = true; document.body.style.overflow = ""; if (/^#brands\/ad/.test(location.hash)) history.replaceState(null, "", "#brands"); }
  document.addEventListener("click", function (e) {
    if (e.target.closest("[data-close]")) closeModal();
    var c = e.target.closest("[data-adcard]"); if (c) { history.replaceState(null, "", "#brands/" + c.dataset.adcard); openAd(c.dataset.adcard); }
    var s = e.target.closest("[data-adsocial]"); if (s) copy(adSocial(ADBYID[s.dataset.adsocial]), "Draft copied. Check it against the scan before posting.");
    var ci = e.target.closest("[data-adcite]"); if (ci) { var a = ADBYID[ci.dataset.adcite]; copy("Advertisement, " + a.advertiser + ". The Bad Lands Cow Boy (" + place(a.issue) + "), " + longDate(a.issue) + ", p. " + a.page + ". Library of Congress, Chronicling America, " + locPage(a.issue, a.page) + ".", "Citation copied"); }
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !$("#modal").hidden) closeModal(); });
  function renderBrands(args) {
    Promise.all([load("directory.json"), load("ads.json")]).then(function (r) {
      var dir = r[0]; ADS = r[1]; ADS.forEach(function (a) { ADBYID[a.id] = a; });
      if (!dInit) {
        dInit = true;
        $$("[data-dir]").forEach(function (b) { b.addEventListener("click", function () { dKind = b.dataset.dir; $$("[data-dir]").forEach(function (x) { x.setAttribute("aria-pressed", x === b); }); draw(); }); });
        $("#d-q").addEventListener("input", draw);
        $("#ad-local").addEventListener("change", draw);
        $("#ad-cats").innerHTML = CATGROUPS.map(function (g, i) {
          var n = ADS.filter(function (a) { return g[1].indexOf(a.category) >= 0; }).length;
          return n ? '<button class="chip" data-cat="' + i + '" aria-pressed="false">' + esc(g[0]) + '<span class="n">' + n + "</span></button>" : "";
        }).join("");
        $("#ad-cats").addEventListener("click", function (e) { var b = e.target.closest("[data-cat]"); if (!b) return; var on = b.getAttribute("aria-pressed") !== "true"; b.setAttribute("aria-pressed", on); if (on) adCats[b.dataset.cat] = 1; else delete adCats[b.dataset.cat]; draw(); });
      }
      draw();
      if (args && args[0] && ADBYID[args[0]]) openAd(args[0]);
      function draw() {
        var q = norm($("#d-q").value.trim());
        $("#ad-cats").style.display = $("#ad-local").parentNode.style.display = dKind === "gallery" ? "" : "none";
        if (dKind === "gallery") {
          var cats = Object.keys(adCats).reduce(function (acc, i) { return acc.concat(CATGROUPS[i][1]); }, []);
          var list = ADS.filter(function (a) {
            if ($("#ad-local").checked && !a.local) return false;
            if (cats.length && cats.indexOf(a.category) < 0) return false;
            return !q || norm([a.advertiser, a.town, a.sells, a.pitch, a.text, (a.aka || []).join(" ")].join(" ")).indexOf(q) >= 0;
          }).sort(function (a, b) { return a.issue.localeCompare(b.issue) || a.page - b.page; });
          $("#d-body").className = "ad-grid";
          $("#d-body").innerHTML = '<p class="count" style="grid-column:1/-1">' + list.length + " ads</p>" + list.map(function (a) {
            return '<button class="adcard" data-adcard="' + a.id + '"><div class="img"><img loading="lazy" alt="" src="' + esc(adImg(a, 460)) + '"></div><div class="b"><h4>' + esc(a.advertiser) + "</h4><p>" + esc(a.sells || "") + '</p><div class="m">' + esc(a.town || "") + (a.town ? " · " : "") + "from " + esc(monY(a.issue)) + (a.runs > 1 ? " · ran ~" + a.runs + " issues" : "") + "</div></div></button>";
          }).join("");
          return;
        }
        $("#d-body").className = "dir-grid";
        var list2 = dir[dKind].filter(function (r) { return !q || norm(r.name + " " + r.text).indexOf(q) >= 0; })
          .sort(function (a, b) { return b.n - a.n || a.name.localeCompare(b.name); });
        $("#d-body").innerHTML = list2.length ? list2.map(function (r) {
          var body = r.text.indexOf(r.name) === 0 ? r.text.slice(r.name.length).replace(/^[,\s—-]+/, "") : r.text;
          return '<div class="dcard"><h4>' + esc(r.name) + "</h4><p>" + esc(body) + '</p><div class="meta"><span>' + r.n + " issue" + (r.n > 1 ? "s" : "") + " · " + esc(monY(r.first)) + (r.last !== r.first ? "–" + esc(monY(r.last)) : "") + '</span><a href="#paper/' + r.issue + '">See the issue →</a></div></div>';
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
        "<p>A. T. Packard, a young University of Michigan graduate, came west on the Northern Pacific and put out the first issue of <em>The Bad Lands Cow Boy</em> on February 7, 1884, at Little Missouri, beside the new town of Medora. It was a four-page weekly. Two pages were Packard’s own: local items, editorials, range news, legal notices, ads and columns of cattle brands. The other two were “ready-print,” national filler bought pre-printed. The paper’s dateline moved to Medora in November 1885. The last issue the Library of Congress holds is dated December 23, 1886. The Cow Boy office burned on or about January 13, 1887, and no later issue was published in Packard\u2019s time. The name lives on: <em>The Bad Lands Cow Boy</em> is still printed today as a yearly souvenir edition.</p>" +
        "<p>Roosevelt sought Packard out and regarded the Cow Boy office as his social headquarters in Medora.</p>" +
        "<h3>What’s here</h3><ul>" +
        "<li><strong>" + m.issues + " issues</strong>: every issue in the Library of Congress run, February 7, 1884 to December 23, 1886.</li>" +
        "<li><strong>" + fmtN(m.articles) + " transcribed items</strong> (about " + fmtN(Math.round(m.words / 1000)) + ",000 words) of local news, editorials, correspondence, range news and notices.</li>" +
        "<li><strong>" + fmtN(m.events) + " dated events</strong> drawn from those items, including <strong>" + m.tr + "</strong> that name Theodore Roosevelt.</li>" +
        "<li>A gallery of the paper\u2019s ads, each cropped from the page where it first ran, with what it was selling and how. Cattle and horse brands are included.</li>" +
        "<li><strong>" + fmtN(m.people || 0) + " people</strong> named in the paper, matched across its many spellings, with bios of the " + (m.bios || 0) + " who appear most and a link to every mention.</li>" +
        "<li><strong>" + (m.reprints || 0) + " items recovered</strong> from missing issues, found where other papers reprinted them.</li></ul>" +
        "<h3>How the transcriptions were made</h3>" +
        "<p>The Library of Congress scans come with machine-read (OCR) text, but 1880s newsprint defeats most OCR, often down to gibberish. For this project, AI read each column of local content directly from the full-resolution page scans, using the old OCR only as a guide. Original spelling, punctuation and wording are kept, including the paper’s misprints. Words that couldn’t be read are marked <code>[illegible]</code>, and uncertain readings appear as <code>[word?]</code>. Each item carries a confidence rating.</p>" +
        "<p>Ready-print pages are summarized, not transcribed, because they weren’t written in Medora. Display ads and brand cards are listed as a directory instead of word for word.</p>" +
        "<p>Events are dated from the paper’s own wording. “Monday” in a Thursday paper means the Monday before. Undated items are placed in the week before the issue. Each event links back to the item and the spot on the page it came from.</p>" +
        "<p><strong>Check before you quote.</strong> AI transcription is very good but not perfect. Before using any text in print, a post or an exhibit, compare it with the page image. One click opens it beside the transcription.</p>" +
        "<h3>The people</h3><p>The transcriptions tag every person an item names. Those names were matched across the paper\u2019s many spellings (\u201cRosevelt,\u201d \u201cSeawall\u201d) and forms (\u201cBill Merrifield,\u201d \u201cW. H. Merrifield\u201d). Where the paper gives only a surname and it could be more than one person, the entry says so. Bios are written only from what the Cow Boy printed, not from other sources, so they show how Medora saw its own people. Relatives are kept apart, and a few matches are uncertain; each bio links to every item so you can check.</p>" +
        "<h3>Reading the 1880s on its own terms</h3><p>The Cow Boy reflects the attitudes of its time and place, including language about Native Americans, Chinese immigrants and others that is offensive today. It’s transcribed as printed, because the historical record is more useful whole.</p>" +
        "<h3>Missing issues</h3><p>These weeks are missing from the surviving run. The Library of Congress scans come from the State Historical Society of North Dakota\u2019s file, which has the same gaps. The volume and issue numbers printed on the paper show nearly all of them were published. Only one issue number falls between April 15 and May 6, 1886, so one of April 22 or 29 probably never came out. The issue of November 25, 1886 survives here only in part.</p>" +
        '<ul class="missing-list">' + m.missing.map(function (d) { return "<li>" + esc(longDate(d)) + "</li>"; }).join("") + "</ul>" +
        "<p>Frontier papers reprinted each other constantly, often with a credit such as \u201c\u2014Bad Lands Cow Boy.\u201d A search of other papers of the time recovered " + (m.reprints || 0) + " items that most likely came from missing issues. Each is transcribed from the reprinting paper\u2019s page, labeled with its source and how sure we are of the issue, and shown under the missing date in Read the Paper.</p>" +
        "<p>Known copies elsewhere: Yale\u2019s Beinecke Library holds an original September 11, 1884 issue. The New York Public Library\u2019s Rare Book Division holds November 25, 1886. The Minnesota Historical Society has reported one issue not in the North Dakota file. If you know of other surviving copies, please tell the Library.</p>" +
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
      "<p>Each section can run on another page as a widget. The widget sizes itself to its content. Paste this where the widget should appear (in Drupal, a Code block). Add <code>data-heading=\"off\"</code> to hide the widget\u2019s own title when the page already has one.</p>" +
      "<h3>This Week in Medora</h3><p>Updates itself every day.</p><pre>" + esc(snip("thisweek")) + "</pre>" +
      "<h3>Roosevelt in the Cow Boy</h3><pre>" + esc(snip("roosevelt")) + "</pre>" +
      "<h3>People of the Cow Boy</h3><p>A searchable directory with bios. Clicking a name stays inside the widget.</p><pre>" + esc(snip("people")) + "</pre>" +
      "<h3>Other views</h3><p>Use <code>timeline</code>, <code>paper</code>, <code>search</code> or <code>brands</code> as the value. Use <code>all</code> to show the full site with its tabs.</p>" +
      "<h3>Data downloads</h3><ul>" +
      '<li><a href="data/events.csv" download>events.csv</a>: every dated event, one row each, with source issue and page links. Opens in Excel.</li>' +
      '<li><a href="data/events.json">events.json</a>: the same, as JSON.</li>' +
      '<li><a href="data/directory.json">directory.json</a>: brands and businesses.</li>' +
      '<li><a href="data/people.json">people.json</a>: everyone named, with name variants; one file per person in <code>data/people/</code> with bio and every mention.</li>' +
      '<li><a href="data/reprints.json">reprints.json</a>: items recovered from missing issues through other papers\u2019 reprints, with sources.</li>' +
      '<li>Full per-issue transcriptions are in <code>data/issues/</code> and the project’s GitHub repository.</li></ul>' +
      "<h3>Social drafts</h3><p>Every event has a “Copy social draft” button. It produces an #OTD-style post with the quote, the source and a link to the original page. Check the quote against the scan before posting.</p></div>";
  }

  // ---------- go ----------
  if (EMBED && params.get("view") && !location.hash) location.hash = "#" + params.get("view");
  route();
})();
