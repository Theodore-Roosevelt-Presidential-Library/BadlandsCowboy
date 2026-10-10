/*!
 * The Bad Lands Cow Boy embed — Theodore Roosevelt Presidential Library
 * https://badlandscowboy.labs.trlibrary.com
 *
 * Usage (one script tag per page, any number of widgets):
 *   <div data-badlands-cowboy="thisweek"></div>
 *   <script src="https://badlandscowboy.labs.trlibrary.com/embed.js" async></script>
 *
 * Views: thisweek | timeline | roosevelt | paper | search | brands | about | all
 * Optional: data-min-height="700" (starting height before the widget reports its size)
 */
(function () {
  "use strict";
  var ORIGIN = "https://badlandscowboy.labs.trlibrary.com";
  try { var me = document.currentScript && document.currentScript.src; if (me) ORIGIN = new URL(me).origin; } catch (e) {}
  var frames = {}, n = 0;
  function mount(el) {
    if (el.getAttribute("data-bc-mounted")) return;
    el.setAttribute("data-bc-mounted", "1");
    var view = el.getAttribute("data-badlands-cowboy") || "thisweek";
    var id = "bc" + ++n;
    var f = document.createElement("iframe");
    f.src = ORIGIN + "/?embed=1&id=" + id + (view !== "all" ? "&view=" + encodeURIComponent(view) : "");
    f.title = "The Bad Lands Cow Boy — Medora, 1884–1886";
    f.loading = "lazy";
    f.style.cssText = "width:100%;border:0;display:block;overflow:hidden;height:" + (parseInt(el.getAttribute("data-min-height"), 10) || 700) + "px";
    el.appendChild(f);
    frames[id] = f;
  }
  window.addEventListener("message", function (e) {
    if (e.origin !== ORIGIN || !e.data || e.data.type !== "badlands-cowboy:height") return;
    var f = frames[e.data.id];
    if (f && e.data.height) f.style.height = Math.ceil(e.data.height) + "px";
  });
  function scan() { Array.prototype.forEach.call(document.querySelectorAll("[data-badlands-cowboy]"), mount); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", scan); else scan();
})();
