(function () {
  "use strict";

  var CLAVE = "sm-cookie-consent";
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
  banner.setAttribute("aria-modal", "false");
  banner.setAttribute("aria-labelledby", "cookie-titulo");
  banner.setAttribute("aria-describedby", "cookie-texto");
  banner.hidden = true;
  banner.innerHTML =
    '<p class="cookie__titulo" id="cookie-titulo">Tu privacidad, tu decisión</p>' +
    '<p class="cookie__texto" id="cookie-texto">Usamos almacenamiento local para recordar tu elección. El mapa de Google puede instalar cookies cuando se carga. Puedes aceptar, rechazar o cambiar tu decisión cuando quieras. Consulta la <a href="cookies.html">política de cookies</a> y el <a href="privacidad.html">aviso de privacidad</a>.</p>' +
    '<div class="cookie__acciones">' +
      '<button class="btn btn--primary" id="cookie-aceptar" type="button">Aceptar</button>' +
      '<button class="btn" id="cookie-rechazar" type="button">Rechazar</button>' +
      '<button class="cookie__config" id="cookie-config" type="button" aria-expanded="false" aria-controls="cookie-detalle">Configurar</button>' +
    '</div>' +
    '<div class="cookie__detalle" id="cookie-detalle" hidden>' +
      '<div class="cookie__fila"><strong>Esenciales</strong><input type="checkbox" checked disabled aria-label="Cookies esenciales siempre activas"><p>Guardan tu elección en este navegador.</p></div>' +
      '<div class="cookie__fila"><strong>Mapa de Google</strong><input type="checkbox" id="cookie-mapa" aria-label="Permitir el mapa de Google"><p>Carga el mapa de ubicación. Google puede instalar cookies propias.</p></div>' +
      '<button class="btn btn--primary cookie__guardar" id="cookie-guardar" type="button">Guardar preferencias</button>' +
    '</div>';
  document.body.appendChild(banner);

  var detalle = document.getElementById("cookie-detalle");
  var config = document.getElementById("cookie-config");
  var opcionMapa = document.getElementById("cookie-mapa");

  function ocultar() { banner.hidden = true; }
  function mostrar() {
    if (opcionMapa) opcionMapa.checked = !!(leer() || {}).mapa;
    banner.hidden = false;
  }
  function decidir(valor) {
    escribir(valor);
    aplicar(valor);
    ocultar();
  }

  var previo = leer();
  if (previo) {
    aplicar(previo);
    ocultar();
  } else {
    aplicar({ esenciales: true, mapa: false });
    window.setTimeout(mostrar, 700);
  }

  document.getElementById("cookie-aceptar").addEventListener("click", function () {
    decidir({ esenciales: true, mapa: true });
  });
  document.getElementById("cookie-rechazar").addEventListener("click", function () {
    decidir({ esenciales: true, mapa: false });
  });
  config.addEventListener("click", function () {
    var abierto = config.getAttribute("aria-expanded") === "true";
    config.setAttribute("aria-expanded", String(!abierto));
    detalle.hidden = abierto;
  });
  document.getElementById("cookie-guardar").addEventListener("click", function () {
    decidir({ esenciales: true, mapa: !!(opcionMapa && opcionMapa.checked) });
  });
  var reabrir = document.getElementById("cookie-reabrir");
  if (reabrir) reabrir.addEventListener("click", mostrar);
  if (cargarMapa && iframe) cargarMapa.addEventListener("click", function () {
    if (!iframe.getAttribute("src")) iframe.setAttribute("src", iframe.getAttribute("data-src"));
    iframe.hidden = false;
    if (placeholder) placeholder.hidden = true;
  });
})();
