(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) return;

  var ICONS = [
    "fl-flower", "fl-flower-outline", "fl-flower-pollen", "fl-flower-pollen-outline",
    "fl-flower-poppy", "fl-flower-tulip", "fl-flower-tulip-outline",
    "fl-butterfly", "fl-butterfly-outline", "fl-bee-flower",
    "fl-bi-flower1", "fl-bi-flower2", "fl-bi-flower3"
  ];
  var COLORS = ["#c94c6d", "#dfb976", "#a53052", "#5a7859"];
  var rnd = function (a, b) { return a + Math.random() * (b - a); };
  var pick = function (arr) { return arr[Math.floor(Math.random() * arr.length)]; };

  /* ---------- 1. Órbitas con trayectorias random ---------- */
  Array.prototype.forEach.call(document.querySelectorAll("[data-orbit]"), function (el) {
    var rx = parseFloat(el.style.getPropertyValue("--rx")) || 36;
    var ry = parseFloat(el.style.getPropertyValue("--ry")) || 18;

    el.style.left = rnd(3, 94).toFixed(1) + "%";
    el.style.top = rnd(5, 92).toFixed(1) + "%";
    el.style.setProperty("--s", rnd(20, 56).toFixed(0) + "px");

    var use = el.querySelector("use");
    if (use && Math.random() < .6) use.setAttribute("href", "#" + pick(ICONS));

    var frames = [];
    var points = 8 + Math.floor(Math.random() * 4);
    var start = Math.random() * Math.PI * 2;
    var wobble = rnd(.25, .75);
    for (var k = 0; k <= points; k++) {
      var a = start + (k / points) * Math.PI * 2;
      var kx = rx * (1 + (Math.random() - .5) * wobble);
      var ky = ry * (1 + (Math.random() - .5) * wobble);
      frames.push({
        transform: "translate3d(" + (Math.cos(a) * kx).toFixed(1) + "px," + (Math.sin(a) * ky).toFixed(1) + "px,0)"
      });
    }

    var duration = rnd(15000, 34000);
    el.animate(frames, {
      duration: duration,
      iterations: Infinity,
      delay: -rnd(0, duration),
      direction: Math.random() < .5 ? "normal" : "reverse",
      easing: "linear"
    });

    var item = el.querySelector(".flora__item");
    if (item) {
      item.animate([
        { transform: "rotate(0deg) scale(1)" },
        { transform: "rotate(180deg) scale(" + rnd(1.08, 1.22).toFixed(2) + ")" },
        { transform: "rotate(360deg) scale(1)" }
      ], {
        duration: rnd(9000, 20000),
        iterations: Infinity,
        delay: -rnd(0, 8000),
        easing: "linear"
      });

      // Un subconjunto cambia de tinta con el tiempo (crema <-> dorado en secciones oscuras, tinta <-> rosa en claras)
      if (Math.random() < .38) {
        var flora = el.closest(".flora");
        if (flora) {
          var css = getComputedStyle(flora);
          var c1 = css.getPropertyValue("--flora-c").trim();
          var c2 = css.getPropertyValue("--flora-c2").trim();
          if (c1 && c2) {
            item.animate([
              { color: c1 }, { color: c2 }, { color: c1 }
            ], {
              duration: rnd(12000, 22000),
              iterations: Infinity,
              delay: -rnd(0, 10000),
              easing: "ease-in-out"
            });
          }
        }
      }
    }
  });

  /* ---------- 2. Huella floral al arrastrar el puntero ---------- */
  var layer = document.createElement("div");
  layer.className = "trail-layer";
  layer.setAttribute("aria-hidden", "true");
  document.body.appendChild(layer);

  var MAX = window.innerWidth < 768 ? 8 : 12;
  var active = 0;
  var last = 0;
  var dragging = false;

  function spawn(x, y, first) {
    if (active >= MAX) return;
    var host = document.createElement("div");
    host.className = "trail-seed";
    host.style.transform = "translate3d(" + x + "px," + y + "px,0)";

    var kids = [];
    var total = first ? 3 : 2;
    for (var j = 0; j < total; j++) {
      var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      var use = document.createElementNS("http://www.w3.org/2000/svg", "use");
      use.setAttribute("href", "#" + pick(ICONS));
      svg.setAttribute("viewBox", "0 0 24 24");
      svg.appendChild(use);
      svg.style.setProperty("--s", rnd(18, 40).toFixed(0) + "px");
      svg.style.setProperty("--c", pick(COLORS));
      svg.style.opacity = "0";
      host.appendChild(svg);
      kids.push(svg);
    }
    layer.appendChild(host);
    active++;

    kids.forEach(function (svg, j) {
      var angle = rnd(0, Math.PI * 2);
      var dist = rnd(45, 130);
      var dx = Math.cos(angle) * dist;
      var dy = Math.sin(angle) * dist - rnd(0, 30);
      svg.animate([
        { transform: "translate3d(0,0,0) rotate(0deg) scale(.5)", opacity: 0 },
        { transform: "translate3d(" + (dx * .35).toFixed(1) + "px," + (dy * .35).toFixed(1) + "px,0) rotate(" + rnd(-120, 120).toFixed(0) + "deg) scale(1)", opacity: .95, offset: .25 },
        { transform: "translate3d(" + dx.toFixed(1) + "px," + dy.toFixed(1) + "px,0) rotate(" + rnd(-360, 360).toFixed(0) + "deg) scale(.35)", opacity: 0 }
      ], {
        duration: rnd(900, 1500),
        delay: j * 70,
        easing: "cubic-bezier(.23,1,.32,1)",
        fill: "forwards"
      });
    });

    window.setTimeout(function () { host.remove(); active--; }, 1900);
  }

  function down(e) {
    if (!e.isPrimary) return;
    if (e.target.closest && e.target.closest("button, a, input, select, textarea, .reel__viewport")) return;
    dragging = true;
    spawn(e.clientX, e.clientY, true);
    last = Date.now();
  }
  function move(e) {
    if (!dragging || !e.isPrimary) return;
    var now = Date.now();
    if (now - last < 70) return;
    last = now;
    spawn(e.clientX, e.clientY, false);
  }
  function up() { dragging = false; }

  window.addEventListener("pointerdown", down, { passive: true });
  window.addEventListener("pointermove", move, { passive: true });
  window.addEventListener("pointerup", up);
  window.addEventListener("pointercancel", up);
})();
