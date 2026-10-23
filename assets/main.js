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
        var oq = o.querySelector(".faq-q");
        if (oq) oq.setAttribute("aria-expanded", "false");
      });
      if (!open) {
        item.classList.add("open");
        a.style.maxHeight = a.scrollHeight + "px";
        q.setAttribute("aria-expanded", "true");
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

/* ---------- Competitor-design upgrade: share / ratings / favorites ---------- */
(function () {
  "use strict";
  function lsGet(k) {
    try { return (typeof localStorage !== "undefined") ? localStorage.getItem(k) : null; }
    catch (e) { return null; }
  }
  function lsSet(k, v) {
    try { if (typeof localStorage !== "undefined") localStorage.setItem(k, v); }
    catch (e) { /* private mode */ }
  }
  var pageUrl = location.href.split("#")[0];
  var pageTitle = document.title;

  /* Share block (every tool page) */
  document.querySelectorAll("[data-share]").forEach(function (btn) {
    btn.addEventListener("click", function () { copyText(pageUrl, "Tool link copied"); });
  });
  var x = document.querySelector("[data-share-x]"), fb = document.querySelector("[data-share-fb]"), wa = document.querySelector("[data-share-wa]");
  if (x) x.href = "https://twitter.com/intent/tweet?url=" + encodeURIComponent(pageUrl) + "&text=" + encodeURIComponent(pageTitle);
  if (fb) fb.href = "https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(pageUrl);
  if (wa) wa.href = "https://wa.me/?text=" + encodeURIComponent(pageTitle + " " + pageUrl);

  /* Star rating per tool page (stored in browser) */
  var rateWrap = document.querySelector("[data-rating]");
  if (rateWrap) {
    var key = "ast-rating:" + pageUrl, stars = Array.prototype.slice.call(rateWrap.querySelectorAll("[data-star]"));
    var msg = document.querySelector("[data-rate-msg]");
    var saved = parseInt(lsGet(key) || "0", 10);
    function paint(n) {
      stars.forEach(function (s) { s.classList.toggle("lit", parseInt(s.getAttribute("data-star"), 10) <= n); });
      if (msg) msg.textContent = n ? ("Thanks! You rated this tool " + n + " / 5.") : "";
    }
    stars.forEach(function (s) {
      var n = parseInt(s.getAttribute("data-star"), 10);
      s.addEventListener("click", function () { lsSet(key, String(n)); paint(n); showToast("Thanks for rating " + n + " / 5"); });
      s.addEventListener("mouseenter", function () { paint(n); });
      s.addEventListener("mouseleave", function () { paint(parseInt(lsGet(key) || "0", 10)); });
    });
    paint(saved);
  }

  /* Favorites on the tools page (cards) */
  var favBtns = Array.prototype.slice.call(document.querySelectorAll("[data-fav]"));
  if (favBtns.length) {
    var favKey = "ast-favs", favs = [];
    try { favs = JSON.parse(lsGet(favKey) || "[]"); } catch (e) { favs = []; }
    favBtns.forEach(function (b) {
      var card = b.closest("[data-tool-card]");
      var id = card ? (card.getAttribute("href") || "") : "";
      b.addEventListener("click", function (e) {
        e.preventDefault(); e.stopPropagation();
        var i = favs.indexOf(id);
        if (i > -1) { favs.splice(i, 1); b.classList.remove("active"); showToast("Removed from favorites"); }
        else { favs.push(id); b.classList.add("active"); showToast("Saved to favorites"); }
        lsSet(favKey, JSON.stringify(favs));
      });
      if (favs.indexOf(id) > -1) b.classList.add("active");
    });
    var filter = document.querySelector("[data-fav-filter]");
    if (filter) {
      filter.addEventListener("click", function () {
        var on = filter.classList.toggle("active");
        filter.querySelector("span").textContent = on ? "Showing favorites" : "Show favorites";
        document.querySelectorAll("[data-tool-card]").forEach(function (c) {
          var id = c.getAttribute("href") || "";
          c.style.display = (on && favs.indexOf(id) === -1) ? "none" : "";
        });
      });
    }
  }
})();

/* ---------- Dark mode toggle ---------- */
(function () {
  "use strict";
  var rootEl = document.documentElement;
  var tbtn = document.getElementById("theme-toggle");
  if (!tbtn) return;
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* private mode */ } }
  function paint() {
    var dark = rootEl.getAttribute("data-theme") === "dark";
    tbtn.textContent = dark ? "☀️" : "\uD83C\uDF19";
    tbtn.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
    tbtn.title = dark ? "Light mode" : "Dark mode";
  }
  tbtn.addEventListener("click", function () {
    var dark = rootEl.getAttribute("data-theme") === "dark";
    if (dark) { rootEl.removeAttribute("data-theme"); lsSet("ast-theme", "light"); }
    else { rootEl.setAttribute("data-theme", "dark"); lsSet("ast-theme", "dark"); }
    paint();
  });
  paint();
})();

/* ---------- Quick toolbox (ConvertTextTools-style) ---------- */
(function () {
  "use strict";
  function tbTitle(text) {
    var small = ["a", "an", "the", "and", "but", "or", "for", "nor", "on", "at", "to", "from", "by", "in", "of", "up", "as"];
    return text.toLowerCase().split(/(\s+)/).map(function (w, i, arr) {
      if (!/\w/.test(w)) return w;
      var isEdge = i === 0 || i === arr.length - 1;
      if (!isEdge && small.indexOf(w) > -1) return w;
      return w.charAt(0).toUpperCase() + w.slice(1);
    }).join("");
  }
  function tbSentence(text) {
    return text.toLowerCase().replace(/(^\s*[a-z])|([.!?]\s*[a-z])/g, function (m) { return m.toUpperCase(); });
  }
  function tbLines(text) {
    return text.split(/\r?\n/).map(function (l) { return l.trim(); }).filter(function (l) { return l !== ""; });
  }
  function tbTransform(action, text) {
    var m, parts, i;
    switch (action) {
      case "upper": return text.toUpperCase();
      case "lower": return text.toLowerCase();
      case "title": return tbTitle(text);
      case "sentence": return tbSentence(text);
      case "alt":
        var up = false;
        return text.split("").map(function (c) {
          if (/[a-z]/i.test(c)) { var r = up ? c.toUpperCase() : c.toLowerCase(); up = !up; return r; }
          return c;
        }).join("");
      case "remove-spaces":
        return text.replace(/\t/g, " ").split(/\r?\n/).map(function (l) { return l.replace(/ {2,}/g, " ").trim(); }).join("\n").replace(/\n{3,}/g, "\n\n").trim();
      case "reverse": return Array.from(text).reverse().join("");
      case "word-count": return "Words: " + (text.trim() === "" ? 0 : text.trim().split(/\s+/).length);
      case "char-count": return "Characters: " + text.length + " (" + text.replace(/\s/g, "").length + " without spaces)";
      case "sentence-count":
        m = text.match(/[^.!?]+[.!?]+/g);
        return "Sentences: " + (text.trim() === "" ? 0 : (m ? m.length : 1));
      case "paragraph-count":
        return "Paragraphs: " + (text.trim() === "" ? 0 : text.split(/\n\s*\n/).filter(function (p) { return p.trim() !== ""; }).length);
      case "remove-breaks": return text.replace(/\s*\n\s*/g, " ").replace(/ {2,}/g, " ").trim();
      case "add-breaks": return text.replace(/([.!?])\s+/g, "$1\n");
      case "remove-punct": return text.replace(/[!"#$%&'()*+,\-.\/:;<=>?@\[\\\]^_`{|}~’‘“”«»]/g, "").replace(/ {2,}/g, " ");
      case "sort-az": return tbLines(text).sort(function (a, b) { return a.localeCompare(b, undefined, { sensitivity: "base" }); }).join("\n");
      case "sort-za": return tbLines(text).sort(function (a, b) { return b.localeCompare(a, undefined, { sensitivity: "base" }); }).join("\n");
      case "commas": return tbLines(text).join(", ");
      case "slug":
        return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
      case "to-binary":
        return text.split("").map(function (c) { return c.charCodeAt(0).toString(2).padStart(8, "0"); }).join(" ");
      case "from-binary":
        parts = text.trim().split(/\s+/).filter(Boolean);
        for (i = 0; i < parts.length; i++) { if (!/^[01]{1,8}$/.test(parts[i])) return null; }
        return parts.map(function (b) { return String.fromCharCode(parseInt(b, 2)); }).join("");
    }
    return text;
  }
  function tbFrCount(text, find, cs) {
    if (!find) return 0;
    var hay = cs ? text : text.toLowerCase(), needle = cs ? find : find.toLowerCase();
    return hay.split(needle).length - 1;
  }
  function tbFrReplace(text, find, repl, cs) {
    if (cs) return text.split(find).join(repl);
    var out = "", i = 0, lt = text.toLowerCase(), lf = find.toLowerCase();
    while (true) {
      var idx = lt.indexOf(lf, i);
      if (idx === -1) { out += text.slice(i); break; }
      out += text.slice(i, idx) + repl; i = idx + find.length;
    }
    return out;
  }
  window.tbTransform = tbTransform;
  window.tbFindReplace = { count: tbFrCount, replace: tbFrReplace };

  var tb = document.querySelector("[data-toolbox]");
  if (!tb) return;
  var input = tb.querySelector("#tb-input"), output = tb.querySelector("#tb-output");
  var activeAction = tb.getAttribute("data-active");
  tb.querySelectorAll("[data-tb-action]").forEach(function (btn) {
    var action = btn.getAttribute("data-tb-action");
    if (action === activeAction) btn.classList.add("active");
    btn.addEventListener("click", function () {
      if (input.value.trim() === "") { showToast("Please enter some text first"); input.focus(); return; }
      var res = tbTransform(action, input.value);
      if (res === null) { showToast("Invalid binary — use groups of 0s and 1s"); return; }
      output.value = res;
      showToast("Done");
    });
  });
  var tabs = tb.querySelectorAll("[data-tb-tab]");
  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      tabs.forEach(function (t) { t.classList.toggle("active", t === tab); });
      var which = tab.getAttribute("data-tb-tab");
      tb.querySelectorAll("[data-tb-pane]").forEach(function (p) {
        p.hidden = p.getAttribute("data-tb-pane") !== which;
      });
    });
  });
  tb.querySelectorAll("[data-tb-fr]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var find = tb.querySelector("#tb-find").value;
      var repl = tb.querySelector("#tb-replace").value;
      var cs = tb.querySelector("#tb-case").checked;
      if (input.value.trim() === "") { showToast("Please enter some text first"); return; }
      if (!find) { showToast("Type something to find first"); return; }
      var n = tbFrCount(input.value, find, cs);
      if (btn.getAttribute("data-tb-fr") === "count") {
        output.value = "Matches found: " + n + " \u00D7 \"" + find + "\"";
        showToast(n + " match" + (n === 1 ? "" : "es") + " found");
      } else {
        if (n === 0) { showToast("Nothing found to replace"); return; }
        output.value = tbFrReplace(input.value, find, repl, cs);
        showToast("Replaced " + n + " match" + (n === 1 ? "" : "es"));
      }
    });
  });
  var copyBtn = tb.querySelector("[data-tb-copy]");
  if (copyBtn) copyBtn.addEventListener("click", function () { copyText(output.value, "Output copied"); });
  var ci = tb.querySelector("[data-tb-clear-input]");
  if (ci) ci.addEventListener("click", function () { input.value = ""; input.focus(); });
  var co = tb.querySelector("[data-tb-clear-output]");
  if (co) co.addEventListener("click", function () { output.value = ""; });
})();

/* 3D card tilt + animated cursor — desktop pointers only, respects reduced motion */
(function () {
  try {
    if (!window.matchMedia) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var rafFn = window.requestAnimationFrame || function (f) { return setTimeout(f, 16); };

    /* 3D tilt on tool cards */
    document.querySelectorAll(".tool-card").forEach(function (card) {
      var queued = false, lastE = null;
      card.addEventListener("mousemove", function (e) {
        lastE = e;
        if (queued) return;
        queued = true;
        rafFn(function () {
          queued = false;
          if (!lastE) return;
          var r = card.getBoundingClientRect();
          var px = (lastE.clientX - r.left) / r.width - 0.5;
          var py = (lastE.clientY - r.top) / r.height - 0.5;
          card.style.transform = "perspective(820px) rotateX(" + (-py * 10).toFixed(2) + "deg) rotateY(" + (px * 12).toFixed(2) + "deg) translateY(-6px)";
          card.style.setProperty("--mx", (px * 100 + 50) + "%");
          card.style.setProperty("--my", (py * 100 + 50) + "%");
        });
      });
      card.addEventListener("mouseleave", function () { card.style.transform = ""; lastE = null; });
    });

    /* Animated cursor: instant dot + trailing ring */
    var dot = document.createElement("div"); dot.className = "cursor-dot";
    var ring = document.createElement("div"); ring.className = "cursor-ring";
    document.body.appendChild(dot); document.body.appendChild(ring);
    var mx = -100, my = -100, rx = -100, ry = -100, shown = false;
    document.addEventListener("mousemove", function (e) {
      mx = e.clientX; my = e.clientY;
      if (!shown) { shown = true; rx = mx; ry = my; dot.style.opacity = "1"; ring.style.opacity = "1"; }
      dot.style.transform = "translate(" + mx + "px," + my + "px)";
    });
    (function loop() {
      rx += (mx - rx) * 0.16; ry += (my - ry) * 0.16;
      ring.style.transform = "translate(" + rx + "px," + ry + "px)";
      rafFn(loop);
    })();
    document.addEventListener("mouseover", function (e) {
      if (!e.target.closest) return;
      var typing = e.target.closest("input, textarea, select");
      var hot = e.target.closest("a, button, label, .faq-q");
      ring.classList.toggle("cursor-on", !!hot && !typing);
      ring.classList.toggle("cursor-hide", !!typing);
      dot.classList.toggle("cursor-hide", !!typing);
    });
    document.addEventListener("mouseleave", function () {
      shown = false; dot.style.opacity = "0"; ring.style.opacity = "0";
    });
  } catch (e) {}
})();

/* Tool cards slide in as they scroll into view (staggered) */
(function () {
  try {
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!("IntersectionObserver" in window)) return;
    var cards = document.querySelectorAll(".tool-card");
    if (!cards.length) return;
    cards.forEach(function (c) { c.classList.add("slide-init"); });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en, i) {
        if (!en.isIntersecting) return;
        var el = en.target;
        el.style.transitionDelay = (i % 6) * 60 + "ms";
        el.classList.add("slide-in");
        io.unobserve(el);
        el.addEventListener("transitionend", function h(ev) {
          if (ev.propertyName !== "transform") return;
          el.classList.remove("slide-init", "slide-in");
          el.style.transitionDelay = "";
          el.removeEventListener("transitionend", h);
        });
      });
    }, { threshold: 0.12 });
    cards.forEach(function (c) { io.observe(c); });
  } catch (e) {}
})();
