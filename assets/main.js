/* AliSuperTools — shared scripts */
(function () {
  "use strict";

  /* Mobile menu */
  var btn = document.querySelector(".menu-btn");
  var nav = document.querySelector(".main-nav");
  if (btn && nav) {
    btn.addEventListener("click", function () {
      nav.classList.toggle("open");
    });
    nav.addEventListener("click", function (e) {
      if (e.target.tagName === "A") nav.classList.remove("open");
    });
  }

  /* Footer year */
  var yr = document.getElementById("year");
  if (yr) yr.textContent = new Date().getFullYear();

  /* Back to top */
  var top = document.querySelector(".to-top");
  if (top) {
    window.addEventListener("scroll", function () {
      top.classList.toggle("show", window.scrollY > 500);
    }, { passive: true });
    top.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /* FAQ accordion */
  document.querySelectorAll(".faq-item").forEach(function (item) {
    var q = item.querySelector(".faq-q");
    var a = item.querySelector(".faq-a");
    if (!q || !a) return;
    q.addEventListener("click", function () {
      var open = item.classList.contains("open");
      document.querySelectorAll(".faq-item.open").forEach(function (o) {
        o.classList.remove("open");
        o.querySelector(".faq-a").style.maxHeight = null;
      });
      if (!open) {
        item.classList.add("open");
        a.style.maxHeight = a.scrollHeight + "px";
      }
    });
  });

  /* Live tool search (homepage + tools page) */
  var search = document.querySelector("[data-tool-search]");
  if (search) {
    var cards = Array.prototype.slice.call(document.querySelectorAll("[data-tool-card]"));
    var noRes = document.querySelector(".no-results");
    var heads = document.querySelectorAll("[data-cat-head]");
    function run() {
      var q = search.value.trim().toLowerCase();
      var visible = 0;
      cards.forEach(function (c) {
        var hit = !q || c.getAttribute("data-tool-card").toLowerCase().indexOf(q) > -1;
        c.style.display = hit ? "" : "none";
        if (hit) visible++;
      });
      heads.forEach(function (h) {
        var next = h.nextElementSibling, any = false;
        if (next) {
          Array.prototype.forEach.call(next.children, function (ch) {
            if (ch.style.display !== "none") any = true;
          });
        }
        h.style.display = any ? "" : "none";
      });
      if (noRes) noRes.style.display = visible ? "none" : "block";
    }
    search.addEventListener("input", run);
    var form = search.closest("form");
    if (form) form.addEventListener("submit", function (e) { e.preventDefault(); run(); });
  }

  /* Toast helper (used by tool pages) */
  window.showToast = function (msg) {
    var t = document.querySelector(".toast");
    if (!t) {
      t = document.createElement("div");
      t.className = "toast";
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add("show");
    setTimeout(function () { t.classList.remove("show"); }, 2200);
  };

  /* Copy helper (used by tool pages) */
  window.copyText = function (text, msg) {
    if (!text) { showToast("Nothing to copy yet"); return; }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        showToast(msg || "Copied to clipboard");
      }, function () { fallbackCopy(text, msg); });
    } else { fallbackCopy(text, msg); }
  };
  function fallbackCopy(text, msg) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); showToast(msg || "Copied to clipboard"); }
    catch (e) { showToast("Copy failed — please select and copy manually"); }
    document.body.removeChild(ta);
  }
})();
