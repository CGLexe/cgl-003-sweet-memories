(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var media = (window.SM_MEDIA || []).slice();

  /* ============================================================
     1. Revelados al entrar en viewport (una entrada por contenedor)
     ============================================================ */
  var reveals = Array.prototype.slice.call(document.querySelectorAll("[data-reveal]"));
  function show(el) {
    el.classList.add("is-in");
    if (el.classList.contains("cta__inner")) {
      var cta = el.closest(".cta");
      if (cta) cta.classList.add("is-in");
    }
  }
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { show(entry.target); io.unobserve(entry.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(show);
  }

  /* ============================================================
     2. Cinta tipográfica: loop continuo con control de pausa
     ============================================================ */
  var railEl = document.querySelector(".rail");
  var railPause = document.getElementById("rail-pause");
  if (railEl && railPause) {
    railPause.addEventListener("click", function () {
      var paused = railEl.classList.toggle("is-paused");
      railPause.setAttribute("aria-label", paused ? "Reanudar cinta animada" : "Pausar cinta animada");
      railPause.querySelector(".material-symbols-outlined").textContent = paused ? "play_arrow" : "pause";
    });
  }

  var heroVideo = document.getElementById("hero-video");

  /* ============================================================
     3. Coverflow: tarjetas en abanico, foco central (video de referencia)
     ============================================================ */
  var track = document.getElementById("reel-track");
  var viewport = document.getElementById("reel-viewport");
  var reel = document.getElementById("reel");
  var counter = document.getElementById("reel-counter");
  var total = document.getElementById("gallery-total");
  var prev = document.getElementById("reel-prev");
  var next = document.getElementById("reel-next");
  var pauseBtn = document.getElementById("reel-pause");
  var chips = Array.prototype.slice.call(document.querySelectorAll("#filtros .chip"));
  var TINTAS = ["#f6cfc6", "#cfe4ef", "#f7e3aa", "#d9d2ee", "#d8ecd8", "#e7d3c8", "#bfe3e0", "#f2cbdc", "#efd9b8", "#d3d9ef"];
  var STICKERS = ["stk-1F490", "stk-1F338", "stk-1F339", "stk-1F337", "stk-1F33C", "stk-1F3F5", "stk-1F41D", "stk-1F98B", "stk-2728", "stk-1F31F", "stk-1F496", "stk-1F49C"];
  var TEXTO = {
    "Rosas": "Rosas elegidas a mano",
    "Girasoles": "Girasoles de temporada",
    "Peonías": "Peonías en su punto",
    "Monumental": "Piezas que imponen",
    "Entregas": "Listo para entregar",
    "Globos y peluches": "Un detalle extra",
    "Temporada": "Flores de temporada"
  };
  var FALLBACK = "data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 800 1000%27%3E%3Crect width=%27800%27 height=%271000%27 fill=%27%23f1e9e6%27/%3E%3Ctext x=%27400%27 y=%27510%27 text-anchor=%27middle%27 font-family=%27sans-serif%27 font-size=%2738%27 fill=%27%23a53052%27%3EFoto no disponible%3C/text%3E%3C/svg%3E";
  var active = media;
  var index = 0;
  var timer = null;
  var cards = [];

  function slideHTML(item, i) {
    var visual = item.type === "video"
      ? '<div class="coverflow__video"><video controls playsinline preload="metadata" poster="' + item.poster + '" aria-label="' + item.alt + '"><source src="' + item.src + '" type="video/mp4"></video></div>'
      : '<img src="' + item.src + '" alt="' + item.alt + '" width="800" height="1000" loading="lazy" decoding="async" onerror="this.onerror=null;this.src=\'' + FALLBACK + '\'">';
    var etiqueta = TEXTO[item.cat] || "Sweet Memories";
    var s1 = STICKERS[i % STICKERS.length];
    var s2 = STICKERS[(i + 5) % STICKERS.length];
    return '<div class="coverflow__card" role="button" tabindex="-1" aria-label="Ampliar: ' + item.alt.replace(/"/g, "&quot;") + '" style="--tinta:' + TINTAS[i % TINTAS.length] + '">' +
      '<div class="coverflow__frame">' + visual +
        '<span class="coverflow__sticker coverflow__sticker--a"><svg aria-hidden="true"><use href="#' + s1 + '"/></svg></span>' +
        '<span class="coverflow__sticker coverflow__sticker--b"><svg aria-hidden="true"><use href="#' + s2 + '"/></svg></span>' +
        '<span class="coverflow__label">' + etiqueta + '</span>' +
      '</div></div>';
  }

  function render() {
    if (!track || !active.length) return;
    track.innerHTML = active.map(slideHTML).join("");
    document.documentElement.classList.add("catalogo-listo");
    cards = Array.prototype.slice.call(track.children);
    if (total) total.textContent = active.length + (active.length === 1 ? " pieza" : " piezas");
    index = 0;
    paint();
  }

  function paint() {
    if (!cards.length) return;
    var n = cards.length;
    var mitad = Math.floor(n / 2);
    var ang = n > 1 ? 58 / Math.min(4, mitad) : 0;
    var sep = n > 1 ? Math.min(window.innerWidth * 0.16, 190) : 0;
    cards.forEach(function (card, i) {
      var d = i - index;
      if (d > mitad) d -= n;
      if (d < -mitad) d += n;
      var abs = Math.abs(d);
      var visible = abs <= 4;
      var z = 20 - abs;
      var x = d * sep;
      var ty = Math.min(abs, 4) * 14;
      var ry = d * -ang;
      var sc = 1 - Math.min(abs, 4) * 0.11;
      card.style.zIndex = String(z);
      card.style.opacity = visible ? (abs > 3 ? 0 : (abs === 3 ? .25 : 1)) : "0";
      card.style.transform = "translate3d(calc(-50% + " + x.toFixed(1) + "px)," + ty.toFixed(1) + "px,0) rotateY(" + ry.toFixed(1) + "deg) scale(" + sc.toFixed(3) + ")";
      card.classList.toggle("is-active", d === 0);
      card.setAttribute("aria-hidden", d === 0 ? "false" : "true");
      card.setAttribute("tabindex", d === 0 ? "0" : "-1");
      card.style.willChange = visible ? "transform, opacity" : "auto";
    });
  }

  function go(to) {
    if (!cards.length) return;
    index = ((to % cards.length) + cards.length) % cards.length;
    paint();
  }
  function start() {
    if (reduce || timer || active.length < 2) return;
    timer = window.setInterval(function () { go(index + 1); }, 5000);
    if (reel) reel.classList.remove("is-paused");
    if (pauseBtn) {
      pauseBtn.setAttribute("aria-label", "Pausar galería automática");
      var ic = pauseBtn.querySelector(".material-symbols-outlined");
      if (ic) ic.textContent = "pause";
    }
  }
  function stop() {
    if (timer) { window.clearInterval(timer); timer = null; }
    if (reel) reel.classList.add("is-paused");
    if (pauseBtn) {
      pauseBtn.setAttribute("aria-label", "Reanudar galería automática");
      var ic = pauseBtn.querySelector(".material-symbols-outlined");
      if (ic) ic.textContent = "play_arrow";
    }
  }

  if (track && media.length) {
    render();
    start();
    if (prev) prev.addEventListener("click", function () { go(index - 1); stop(); });
    if (next) next.addEventListener("click", function () { go(index + 1); stop(); });
    if (pauseBtn) pauseBtn.addEventListener("click", function () { timer ? stop() : start(); });
    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        chips.forEach(function (c) { c.classList.remove("is-active"); c.setAttribute("aria-pressed", "false"); });
        chip.classList.add("is-active");
        chip.setAttribute("aria-pressed", "true");
        var f = chip.dataset.filter;
        active = f === "todo" ? media : media.filter(function (m) { return m.cat === f; });
        render();
        start();
      });
    });
    if (viewport) {
      viewport.addEventListener("keydown", function (e) {
        if (e.key === "ArrowRight") { go(index + 1); stop(); }
        if (e.key === "ArrowLeft") { go(index - 1); stop(); }
      });
      var drag = null;
      viewport.addEventListener("pointerdown", function (e) {
        if (e.button !== undefined && e.button !== 0) return;
        drag = { x: e.clientX, moved: false };
        stop();
        if (viewport.setPointerCapture) { try { viewport.setPointerCapture(e.pointerId); } catch (err) {} }
      });
      viewport.addEventListener("pointermove", function (e) {
        if (!drag) return;
        if (Math.abs(e.clientX - drag.x) > 40) { drag.moved = true; go(index + (e.clientX < drag.x ? 1 : -1)); drag.x = e.clientX; }
      });
      function endDrag() { drag = null; }
      viewport.addEventListener("pointerup", endDrag);
      viewport.addEventListener("pointercancel", endDrag);
    }
    window.addEventListener("resize", paint);
    document.addEventListener("visibilitychange", function () { document.hidden ? stop() : start(); });

    /* Lightbox: clic en la tarjeta central para ampliar, botón + para hacer zoom */
    var lb = document.getElementById("lightbox");
    var lbImg = document.getElementById("lightbox-img");
    var lbVideo = document.getElementById("lightbox-video");
    var lbCap = document.getElementById("lightbox-cap");
    var lbZoom = document.getElementById("lightbox-zoom");
    var zoom = 1;
    var esVideo = false;
    var lbReturn = null;
    function abrirLB(item, origen) {
      if (!lb || !item) return;
      esVideo = item.type === "video";
      lbImg.hidden = esVideo;
      lbVideo.hidden = !esVideo;
      if (esVideo) {
        if (lbVideo.getAttribute("src") !== item.src) lbVideo.setAttribute("src", item.src);
        lbVideo.setAttribute("poster", item.poster || "");
        try { lbVideo.currentTime = 0; lbVideo.play(); } catch (err) {}
        if (lbZoom) lbZoom.hidden = true;
      } else {
        lbImg.src = item.src;
        lbImg.alt = item.alt;
        lbImg.style.transform = "scale(1)";
        zoom = 1;
        if (lbZoom) { lbZoom.hidden = false; lbZoom.textContent = "+"; lbZoom.setAttribute("aria-label", "Acercar imagen"); }
      }
      lbCap.textContent = item.alt;
      lb.hidden = false;
      document.body.style.overflow = "hidden";
      lbReturn = origen || document.activeElement;
      document.getElementById("lightbox-close").focus();
      stop();
    }
    function cerrarLB() {
      if (!lb) return;
      if (lbVideo) { try { lbVideo.pause(); } catch (err) {} lbVideo.removeAttribute("src"); lbVideo.load(); }
      lb.hidden = true;
      document.body.style.overflow = "";
      lbImg.removeAttribute("src");
      if (lbReturn && lbReturn.focus) { try { lbReturn.focus(); } catch (err) {} }
    }
    if (track) {
      track.addEventListener("click", function (e) {
        if (e.target.closest("video, .coverflow__pause")) return;
        var card = e.target.closest(".coverflow__card");
        if (!card) return;
        var i = Array.prototype.indexOf.call(track.children, card);
        if (i === index) abrirLB(active[i], card);
        else go(i < index ? index - 1 : index + 1);
      });
      track.addEventListener("keydown", function (e) {
        if (e.key !== "Enter" && e.key !== " ") return;
        var card = e.target.closest(".coverflow__card");
        if (!card) return;
        e.preventDefault();
        var i = Array.prototype.indexOf.call(track.children, card);
        if (i === index) abrirLB(active[i], card);
        else go(i < index ? index - 1 : index + 1);
      });
    }
    if (lb) {
      document.getElementById("lightbox-close").addEventListener("click", cerrarLB);
      lb.addEventListener("click", function (e) { if (e.target === lb) cerrarLB(); });
      document.addEventListener("keydown", function (e) {
        if (lb.hidden) return;
        if (e.key === "Escape") { cerrarLB(); return; }
        if (e.key !== "Tab") return;
        var f = [];
        var lbCloseEl = document.getElementById("lightbox-close");
        if (lbCloseEl && !lbCloseEl.hidden) f.push(lbCloseEl);
        if (lbZoom && !lbZoom.hidden) f.push(lbZoom);
        if (esVideo && lbVideo && !lbVideo.hidden) f.push(lbVideo);
        if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      });
      if (lbZoom) lbZoom.addEventListener("click", function () {
        if (esVideo) return;
        zoom = zoom >= 2.4 ? 1 : +(zoom + 0.6).toFixed(1);
        lbImg.style.transform = "scale(" + zoom + ")";
        lbZoom.setAttribute("aria-label", zoom > 1 ? "Restablecer tamaño" : "Acercar imagen");
        lbZoom.textContent = zoom > 1 ? "↺" : "+";
      });
    }
  }

  /* ============================================================
     4. Video del hero y menú móvil
     ============================================================ */
  if (heroVideo) {
    var heroPause = document.getElementById("hero-pause");
    if (heroPause) {
      if (reduce) { heroVideo.pause(); heroPause.querySelector(".material-symbols-outlined").textContent = "play_arrow"; heroPause.setAttribute("aria-label", "Reproducir video"); }
      heroPause.addEventListener("click", function () {
        if (heroVideo.paused) { heroVideo.play(); heroPause.querySelector(".material-symbols-outlined").textContent = "pause"; heroPause.setAttribute("aria-label", "Pausar video"); }
        else { heroVideo.pause(); heroPause.querySelector(".material-symbols-outlined").textContent = "play_arrow"; heroPause.setAttribute("aria-label", "Reproducir video"); }
      });
    }
  }

  // Cuidados: expandir consejos extra
  var careToggle = document.getElementById("care-toggle");
  var careExtra = document.getElementById("care-extra");
  if (careToggle && careExtra) {
    careToggle.addEventListener("click", function () {
      var open = careToggle.getAttribute("aria-expanded") === "true";
      careToggle.setAttribute("aria-expanded", String(!open));
      careExtra.hidden = open;
      careToggle.querySelector("span").textContent = open ? "Más consejos del atelier" : "Ver menos consejos";
    });
  }

  var toggle = document.querySelector(".nav__toggle");
  var menu = document.getElementById("menu-movil");
  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      toggle.setAttribute("aria-label", open ? "Abrir menú" : "Cerrar menú");
      menu.hidden = open;
    });
    Array.prototype.forEach.call(menu.querySelectorAll("a"), function (a) {
      a.addEventListener("click", function () { menu.hidden = true; toggle.setAttribute("aria-expanded", "false"); });
    });
  }
})();
