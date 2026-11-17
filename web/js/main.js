(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var media = (window.SM_MEDIA || []).slice();
  var track = document.getElementById("reel-track");
  var viewport = document.getElementById("reel-viewport");
  var strip = document.getElementById("reel-strip");
  var counter = document.getElementById("reel-counter");
  var prev = document.getElementById("reel-prev");
  var next = document.getElementById("reel-next");
  var pauseBtn = document.getElementById("reel-pause");
  var chips = Array.prototype.slice.call(document.querySelectorAll("#filtros .chip"));
  var active = media;
  var index = 0;
  var timer = null;
  var dragging = null;

  function slideHTML(item, i) {
    var visual = item.type === "video"
      ? '<video controls playsinline preload="metadata" poster="' + item.poster + '" aria-label="' + item.alt + '"><source src="' + item.src + '" type="video/mp4"></video>'
      : '<img src="' + item.src + '" alt="' + item.alt + '" width="800" height="1000" loading="' + (i < 2 ? "eager" : "lazy") + '" decoding="async">';
    return '<div class="reel__item"><div class="frame" data-tag="' + item.cat + '">' + visual + "</div></div>";
  }

  function step() {
    var item = track.querySelector(".reel__item");
    if (!item) return 0;
    var gap = parseFloat(getComputedStyle(track).gap) || 16;
    return item.getBoundingClientRect().width + gap;
  }

  function go(to) {
    if (!active.length) return;
    index = (to + active.length) % active.length;
    track.style.transform = "translate3d(" + (-index * step()) + "px,0,0)";
    counter.textContent = (index + 1) + " de " + active.length;
    var thumb = strip.children[index];
    if (thumb) {
      Array.prototype.forEach.call(strip.children, function (c) { c.classList.remove("is-active"); c.setAttribute("aria-selected", "false"); });
      thumb.classList.add("is-active");
      thumb.setAttribute("aria-selected", "true");
      thumb.scrollIntoView({ block: "nearest", inline: "nearest", behavior: reduce ? "auto" : "smooth" });
    }
  }

  function render() {
    track.innerHTML = active.map(slideHTML).join("");
    strip.innerHTML = active.map(function (item, i) {
      var thumbSrc = item.poster || item.src;
      return '<button class="reel__thumb" type="button" role="tab" data-i="' + i + '" aria-label="Ver ' + item.alt + '"><img src="' + thumbSrc + '" alt="" loading="lazy" decoding="async"></button>';
    }).join("");
    Array.prototype.forEach.call(strip.children, function (b) {
      b.addEventListener("click", function () { go(Number(b.dataset.i)); stop(); });
    });
    index = 0;
    go(0);
  }

  function start() {
    if (reduce || timer || active.length < 2) return;
    timer = window.setInterval(function () { go(index + 1); }, 5000);
    if (pauseBtn) { pauseBtn.setAttribute("aria-label", "Pausar galería automática"); pauseBtn.querySelector(".material-symbols-outlined").textContent = "pause"; }
  }
  function stop() {
    if (timer) { window.clearInterval(timer); timer = null; }
    if (pauseBtn) { pauseBtn.setAttribute("aria-label", "Reanudar galería automática"); pauseBtn.querySelector(".material-symbols-outlined").textContent = "play_arrow"; }
  }

  if (track && media.length) {
    render();
    start();
    prev.addEventListener("click", function () { go(index - 1); stop(); });
    next.addEventListener("click", function () { go(index + 1); stop(); });
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
    viewport.tabIndex = 0;
    viewport.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { go(index + 1); stop(); }
      if (e.key === "ArrowLeft") { go(index - 1); stop(); }
    });
    viewport.addEventListener("pointerdown", function (e) { dragging = { x: e.clientX, t: Date.now() }; });
    viewport.addEventListener("pointerup", function (e) {
      if (!dragging) return;
      var dx = e.clientX - dragging.x;
      if (Math.abs(dx) > 48) { go(dx < 0 ? index + 1 : index - 1); stop(); }
      dragging = null;
    });
    window.addEventListener("resize", function () { go(index); });
    document.addEventListener("visibilitychange", function () { document.hidden ? stop() : start(); });
  }

  var heroVideo = document.getElementById("hero-video");
  var heroPause = document.getElementById("hero-pause");
  if (heroVideo && heroPause) {
    if (reduce) { heroVideo.pause(); heroPause.querySelector(".material-symbols-outlined").textContent = "play_arrow"; heroPause.setAttribute("aria-label", "Reproducir video"); }
    heroPause.addEventListener("click", function () {
      if (heroVideo.paused) { heroVideo.play(); heroPause.querySelector(".material-symbols-outlined").textContent = "pause"; heroPause.setAttribute("aria-label", "Pausar video"); }
      else { heroVideo.pause(); heroPause.querySelector(".material-symbols-outlined").textContent = "play_arrow"; heroPause.setAttribute("aria-label", "Reproducir video"); }
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
