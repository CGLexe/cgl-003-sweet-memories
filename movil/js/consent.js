(function () {
  "use strict";

  var CLAVE = "sm-cookie-consent";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var iframe = document.querySelector(".mapa__iframe");
  var placeholder = document.getElementById("mapa-placeholder");
  var cargarMapa = document.getElementById("mapa-cargar");

  function leer() {
    try { return JSON.parse(window.localStorage.getItem(CLAVE) || "null"); }
    catch (e) { return null; }
  }
  function escribir(valor) {
    try { window.localStorage.setItem(CLAVE, JSON.stringify(valor)); }
    catch (e) { /* sin almacenamiento: la elección dura esta visita */ }
  }
  function aplicar(valor) {
    var permitido = !!(valor && valor.mapa);
    if (!iframe) return;
    if (permitido) {
      if (!iframe.getAttribute("src")) iframe.setAttribute("src", iframe.getAttribute("data-src"));
      iframe.hidden = false;
      if (placeholder) placeholder.hidden = true;
    } else {
      iframe.removeAttribute("src");
      iframe.hidden = true;
      if (placeholder) placeholder.hidden = false;
    }
  }

  var banner = document.createElement("div");
  banner.className = "cookie";
  banner.id = "cookie-aviso";
  banner.setAttribute("role", "dialog");
  banner.setAttribute("aria-modal", "true");
  banner.setAttribute("aria-labelledby", "cookie-titulo");
  banner.setAttribute("aria-describedby", "cookie-texto");
  banner.hidden = true;
  banner.innerHTML =
    '<div class="cookie__card" role="document">' +
      '<p class="cookie__marca">Antes de seguir</p>' +
      '<h2 class="cookie__titulo" id="cookie-titulo">Acepta las <em>cookies</em></h2>' +
      '<p class="cookie__texto" id="cookie-texto">Usamos almacenamiento local para recordar tu elección y, si lo permites, cargar el mapa de Google. Puedes cambiar de opinión cuando quieras. Consulta la <a href="cookies.html">política de cookies</a> y el <a href="privacidad.html">aviso de privacidad</a>.</p>' +
      '<div class="cookie__acciones">' +
        '<button class="btn btn--primary" id="cookie-aceptar" type="button">Aceptar cookies</button>' +
        '<button class="btn cookie__rechazar" id="cookie-rechazar" type="button">Rechazar</button>' +
      '</div>' +
      '<button class="cookie__config" id="cookie-config" type="button" aria-expanded="false" aria-controls="cookie-detalle">Configurar preferencias</button>' +
      '<div class="cookie__detalle" id="cookie-detalle" hidden>' +
        '<div class="cookie__fila"><strong>Recordar tu elección</strong><input type="checkbox" checked disabled aria-label="Almacenamiento esencial siempre activo"><p>Guarda tu decisión en este navegador.</p></div>' +
        '<div class="cookie__fila"><strong>Mapa de Google</strong><input type="checkbox" id="cookie-mapa" aria-label="Permitir el mapa de Google"><p>Carga el mapa de la floristería. Google puede instalar cookies propias.</p></div>' +
        '<button class="btn btn--primary cookie__guardar" id="cookie-guardar" type="button">Guardar preferencias</button>' +
      '</div>' +
      '<p class="cookie__pie">Sin publicidad ni analítica. <a href="cookies.html">Cómo lo manejo</a></p>' +
    '</div>';
  document.body.appendChild(banner);

  var card = banner.querySelector(".cookie__card");
  var detalle = document.getElementById("cookie-detalle");
  var config = document.getElementById("cookie-config");
  var opcionMapa = document.getElementById("cookie-mapa");
  var aceptar = document.getElementById("cookie-aceptar");
  var rechazar = document.getElementById("cookie-rechazar");
  var guardar = document.getElementById("cookie-guardar");
  var reabrir = document.getElementById("cookie-reabrir");
  var anterior = null;
  var cerrando = false;

  function focusables() {
    return Array.prototype.filter.call(
      card.querySelectorAll('button:not([disabled]), a[href], input:not([disabled])'),
      function (el) { return el.offsetParent !== null; }
    );
  }
  function mostrar() {
    if (!banner.hidden) return;
    anterior = document.activeElement;
    banner.hidden = false;
    if (opcionMapa) opcionMapa.checked = !!(leer() || {}).mapa;
    window.requestAnimationFrame(function () { banner.classList.add("is-in"); });
    window.setTimeout(function () { aceptar.focus(); }, reduce ? 0 : 120);
  }
  function ocultar() {
    if (banner.hidden || cerrando) return;
    cerrando = true;
    banner.classList.remove("is-in");
    window.setTimeout(function () {
      banner.hidden = true;
      cerrando = false;
      if (anterior && document.contains(anterior)) anterior.focus();
    }, reduce ? 0 : 320);
  }
  function decidir(valor) {
    escribir(valor);
    aplicar(valor);
    ocultar();
  }

  var previo = leer();
  if (previo) {
    aplicar(previo);
    banner.hidden = true;
  } else {
    aplicar({ esenciales: true, mapa: false });
    window.setTimeout(mostrar, 700);
  }

  aceptar.addEventListener("click", function () {
    decidir({ esenciales: true, mapa: true });
  });
  rechazar.addEventListener("click", function () {
    decidir({ esenciales: true, mapa: false });
  });
  config.addEventListener("click", function () {
    var abierto = config.getAttribute("aria-expanded") === "true";
    config.setAttribute("aria-expanded", String(!abierto));
    detalle.hidden = abierto;
    if (!abierto) window.setTimeout(function () { opcionMapa.focus(); }, 30);
  });
  guardar.addEventListener("click", function () {
    decidir({ esenciales: true, mapa: !!(opcionMapa && opcionMapa.checked) });
  });
  if (reabrir) reabrir.addEventListener("click", mostrar);
  if (cargarMapa && iframe) cargarMapa.addEventListener("click", function () {
    if (!iframe.getAttribute("src")) iframe.setAttribute("src", iframe.getAttribute("data-src"));
    iframe.hidden = false;
    if (placeholder) placeholder.hidden = true;
  });

  banner.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      e.preventDefault();
      decidir({ esenciales: true, mapa: false });
      return;
    }
    if (e.key !== "Tab") return;
    var items = focusables();
    if (!items.length) return;
    var primero = items[0];
    var ultimo = items[items.length - 1];
    if (e.shiftKey && document.activeElement === primero) {
      e.preventDefault();
      ultimo.focus();
    } else if (!e.shiftKey && document.activeElement === ultimo) {
      e.preventDefault();
      primero.focus();
    }
  });
})();
