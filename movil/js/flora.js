(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var ICONS = [
    "fl-flower", "fl-flower-outline", "fl-flower-pollen", "fl-flower-pollen-outline",
    "fl-flower-poppy", "fl-flower-tulip", "fl-flower-tulip-outline",
    "fl-butterfly", "fl-butterfly-outline", "fl-bee-flower",
    "fl-bi-flower1", "fl-bi-flower2", "fl-bi-flower3"
  ];
  // Móvil: techo de órbitas animadas para no pasar el presupuesto de frame.
  var MAX_ORBITAS = 26;
  var COLORS = ["#c94c6d", "#dfb976", "#a53052", "#5a7859"];
  var rnd = function (a, b) { return a + Math.random() * (b - a); };
  var pick = function (arr) { return arr[Math.floor(Math.random() * arr.length)]; };

  var layer = document.getElementById("flora-global");
  if (!layer) return;
  var groups = Array.prototype.slice.call(layer.querySelectorAll(".flora__depth"));
  var orbits = Array.prototype.slice.call(layer.querySelectorAll("[data-orbit]"));
  // Recorta el exceso de órbitas en móvil: oculta y descarta las que sobran.
  if (orbits.length > MAX_ORBITAS) {
    orbits.slice(MAX_ORBITAS).forEach(function (o) { o.style.display = "none"; });
    orbits = orbits.slice(0, MAX_ORBITAS);
  }

  // Bandas de contraste: se recalculan al cargar y al redimensionar.
  // Se elige la banda mas pequena que contiene el punto (la franja final
  // esta dentro de "ubicacion", por eso gana la mas especifica).
  var BANDAS = [
    ["#inicio", "ink"],
    ["#galeria", "gold"],
    ["#pedido", "ink"],
    ["#cuidados", "green"],
    ["#ubicacion", "ink"],
    [".visit__cta", "gold"]
  ];
  var bandas = [];

  function medir() {
    var y = window.pageYOffset || document.documentElement.scrollTop || 0;
    bandas = [];
    BANDAS.forEach(function (par) {
      var el = document.querySelector(par[0]);
      if (!el) return;
      var r = el.getBoundingClientRect();
      bandas.push({ top: r.top + y, bottom: r.bottom + y, tone: par[1] });
    });
    var gr = layer.getBoundingClientRect();
    var inicioDoc = gr.top + y;
    // El footer queda fuera: se recorta la capa justo en su borde superior.
    var footer = document.querySelector(".closing");
    if (footer) {
      var fr = footer.getBoundingClientRect();
      var recorte = Math.max(0, Math.round(gr.bottom - fr.top) + 8);
      layer.style.setProperty("--flora-clip-bottom", recorte + "px");
    }
    orbits.forEach(function (o) {
      var yp = parseFloat(o.el.style.getPropertyValue("--y")) || 0;
      o.baseY = inicioDoc + (yp / 100) * gr.height;
    });
  }

  function tonoEn(docY) {
    var mejor = null;
    for (var i = 0; i < bandas.length; i++) {
      var b = bandas[i];
      if (docY >= b.top && docY < b.bottom && (!mejor || (b.bottom - b.top) < (mejor.bottom - mejor.top))) mejor = b;
    }
    return mejor ? mejor.tone : "ink";
  }

  orbits.forEach(function (el, i) {
    var grupo = el.closest(".flora__depth");
    orbits[i] = {
      el: el,
      depth: parseFloat(grupo && grupo.dataset.depth) || 0,
      baseY: 0,
      tone: ""
    };
  });

  /* ---------- 1. Órbitas random + parallax por planos ---------- */
  orbits.forEach(function (o) {
    var el = o.el;
    var rx = parseFloat(el.style.getPropertyValue("--rx")) || 36;
    var ry = parseFloat(el.style.getPropertyValue("--ry")) || 18;
    el.style.setProperty("--s", rnd(16, 38).toFixed(0) + "px");
    el.style.left = rnd(3, 94).toFixed(1) + "%";

    var use = el.querySelector("use");
    if (use && Math.random() < .6) use.setAttribute("href", "#" + pick(ICONS));

    if (reduce) return;
    var frames = [];
    var dys = [];
    var points = 8 + Math.floor(Math.random() * 4);
    var start = Math.random() * Math.PI * 2;
    var wobble = rnd(.25, .75);
    for (var k = 0; k <= points; k++) {
      var a = start + (k / points) * Math.PI * 2;
      var kx = rx * (1 + (Math.random() - .5) * wobble);
      var ky = ry * (1 + (Math.random() - .5) * wobble);
      var dy = Math.sin(a) * ky;
      dys.push(dy);
      frames.push({
        transform: "translate3d(" + (Math.cos(a) * kx).toFixed(1) + "px," + dy.toFixed(1) + "px,0)"
      });
    }
    var dur = rnd(15000, 34000);
    var delay = -rnd(0, dur);
    var reverse = Math.random() < .5;
    o.dys = dys;
    o.dur = dur;
    o.delay = delay;
    o.reverse = reverse;
    o.anim = el.animate(frames, {
      duration: dur,
      iterations: Infinity,
      delay: delay,
      direction: reverse ? "reverse" : "normal",
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
    }
  });

  var ticking = false;
  function pintar() {
    var y = window.pageYOffset || document.documentElement.scrollTop || 0;
    if (!reduce) {
      groups.forEach(function (g) {
        var d = parseFloat(g.dataset.depth) || 0;
        g.style.transform = "translate3d(0," + (y * d).toFixed(1) + "px,0)";
      });
    }
    orbits.forEach(function (o) {
      var desplazamiento = 0;
      if (o.anim && o.dys && o.dys.length > 1 && typeof o.anim.currentTime === "number") {
        var p = ((o.anim.currentTime - o.delay) % o.dur) / o.dur;
        if (o.reverse) p = 1 - p;
        var idx = p * (o.dys.length - 1);
        var i = Math.floor(idx);
        var frac = idx - i;
        var sig = Math.min(i + 1, o.dys.length - 1);
        desplazamiento = o.dys[i] + (o.dys[sig] - o.dys[i]) * frac;
      }
      var tono = tonoEn(o.baseY + y * o.depth + desplazamiento);
      if (tono !== o.tone) {
        if (o.tone && !reduce) {
          var item = o.el.querySelector(".flora__item");
          if (item) item.animate([
            { opacity: .2 }, { opacity: .7, offset: .45 }, { opacity: 1 }
          ], { duration: 650, easing: "ease-out" });
        }
        o.el.setAttribute("data-tone", tono);
        o.tone = tono;
      }
    });
    ticking = false;
  }
  function pedir() {
    if (!ticking) { ticking = true; window.requestAnimationFrame(pintar); }
  }

  medir();
  pintar();

  if (!reduce) {
    window.addEventListener("scroll", pedir, { passive: true });
    var t;
    function remeditar() {
      window.clearTimeout(t);
      t = window.setTimeout(function () { medir(); pintar(); }, 160);
    }
    window.addEventListener("resize", remeditar, { passive: true });
    window.addEventListener("load", remeditar);
    // Las órbitas siguen moviéndose con la página detenida: el tono también debe actualizarse.
    window.setInterval(pedir, 200);
    if (window.ResizeObserver) {
      var obs = new ResizeObserver(remeditar);
      obs.observe(document.body);
    }
  }

  /* ---------- 2. Huella floral al arrastrar el puntero ---------- */
  if (reduce) return;

  var trail = document.createElement("div");
  trail.className = "trail-layer";
  trail.setAttribute("aria-hidden", "true");
  document.body.appendChild(trail);

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
    trail.appendChild(host);
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
  // En móvil el dedo desliza la página: la huella solo aparece al tocar,
  // no sigue al movimiento, para no competir con el scroll.
  if (window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 768) {
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  } else {
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  }
})();
