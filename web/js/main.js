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
  var active = media;
  var index = 0;
  var timer = null;
  var cards = [];

  function slideHTML(item, i) {
    var visual = item.type === "video"
      ? '<video controls playsinline preload="metadata" poster="' + item.poster + '" aria-label="' + item.alt + '"><source src="' + item.src + '" type="video/mp4"></video>'
      : '<img src="' + item.src + '" alt="' + item.alt + '" width="800" height="1000" loading="lazy" decoding="async">';
    return '<div class="coverflow__card" style="--tinta:' + TINTAS[i % TINTAS.length] + '"><div class="coverflow__frame">' + visual + '</div></div>';
  }

  function render() {
    if (!track || !active.length) return;
    track.innerHTML = active.map(slideHTML).join("");
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
    });
    if (counter) counter.textContent = (index + 1) + " de " + n;
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
