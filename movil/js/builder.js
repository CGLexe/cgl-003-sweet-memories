(function () {
  "use strict";

  var form = document.getElementById("order-form");
  if (!form) return;

  var steps = Array.prototype.slice.call(form.querySelectorAll(".builder__step"));
  var back = document.getElementById("step-back");
  var next = document.getElementById("step-next");
  var label = document.getElementById("step-label");
  var fill = document.getElementById("builder-progress");
  var error = document.getElementById("form-error");
  var summary = document.getElementById("summary-list");
  var summaryImg = document.getElementById("summary-img");
  var send = document.getElementById("send-order");
  var paso = 0;
  var titulos = ["Tipo de pieza", "Tamaño y flores", "Tonos y extras", "Entrega y datos"];

  // Cada vista se eligió revisando la foto real, no por el alt del manifiesto.
  // Clasificación revisada contra fuentes de floristería y contra las fotos reales del catálogo.
  // El buchón es una cúpula densa de rosas; el "monumental" es el mismo estilo, por eso se fusionó.
  var vistas = {
    "Ramo buchón": { src: "assets/photos/igexport-B2nTOBkh7OD.webp", alt: "Cúpula densa de rosas rojas" },
    "Ramo clásico": { src: "assets/photos/igexport-DbXPZzMFuhx-5.webp", alt: "Ramo de peonías rosadas en papel" },
    "Composición de atelier": { src: "assets/photos/igexport-DbBsGc2CZbG.webp", alt: "Ramo de peonías crema con follaje plateado" },
    "Caja / Hatbox": { src: "assets/photos/igexport-B877-0uB7dF-5.webp", alt: "Caja rosa con rosas y corazón de rosas rojas" },
    "Peluche y globos": { src: "assets/photos/igexport-CkLc7_rrSa3.webp", alt: "Peluche rosa con rosas en caja" }
  };

  function checked(name) {
    return Array.prototype.map.call(
      form.querySelectorAll('[name="' + name + '"]:checked'),
      function (el) { return el.value; }
    );
  }
  function value(name) {
    var el = form.querySelector('[name="' + name + '"]');
    return el ? String(el.value).trim() : "";
  }
  function join(name) { return checked(name).join(", "); }

  // El tono "Personalizado" muestra su campo y se incorpora al resumen y al mensaje.
  var tonoCustom = document.getElementById("tono-personalizado");
  var tonoCustomWrap = document.getElementById("tono-custom-wrap");
  var tonoCustomInput = document.getElementById("tono-personalizado-input");
  function tono() {
    if (tonoCustom && tonoCustom.checked) {
      var c = tonoCustomInput ? String(tonoCustomInput.value).trim() : "";
      return c ? "Personalizado: " + c : "Personalizado";
    }
    return checked("tonos")[0];
  }
  function sincronizarTono() {
    if (!tonoCustomWrap) return;
    tonoCustomWrap.hidden = !(tonoCustom && tonoCustom.checked);
    if (!tonoCustomWrap.hidden && tonoCustomInput) tonoCustomInput.focus();
  }
  if (tonoCustom) tonoCustom.addEventListener("change", sincronizarTono);

  // Calendario y reloj nativos: abrir el selector al hacer clic en el campo.
  Array.prototype.forEach.call(form.querySelectorAll(".picker-input"), function (el) {
    el.addEventListener("click", function () {
      if (el.showPicker) {
        try { el.showPicker(); } catch (err) { /* navegador sin soporte */ }
      }
    });
  });

  function setPaso(n) {
    paso = Math.min(steps.length - 1, Math.max(0, n));
    steps.forEach(function (step, i) {
      step.hidden = i !== paso;
      step.classList.toggle("is-active", i === paso);
    });
    if (label) label.textContent = "Paso " + (paso + 1) + " de " + steps.length + " · " + titulos[paso];
    if (fill) fill.style.transform = "scaleX(" + ((paso + 1) / steps.length) + ")";
    if (back) back.disabled = paso === 0;
    if (next) {
      next.innerHTML = paso === steps.length - 1
        ? 'Enviar pedido <span class="material-symbols-outlined" aria-hidden="true">arrow_forward</span>'
        : 'Siguiente <span class="material-symbols-outlined" aria-hidden="true">arrow_forward</span>';
    }
    if (error) error.hidden = true;
  }

  function fila(term, desc) {
    if (!desc) return;
    var div = document.createElement("div");
    var dt = document.createElement("dt");
    var dd = document.createElement("dd");
    dt.textContent = term;
    dd.textContent = desc;
    div.appendChild(dt);
    div.appendChild(dd);
    summary.appendChild(div);
  }

  function resumen() {
    if (!summary) return;
    summary.innerHTML = "";
    fila("Pieza", checked("tipo")[0]);
    fila("Tamaño", checked("tamano")[0]);
    fila("Flores", join("flores"));
    fila("Tonos", tono());
    fila("Extras", join("extras"));
    fila("Ocasión", checked("ocasion")[0]);
    fila("Para", value("destinatario"));
    fila("Entrega", value("direccion"));
    var cuando = [value("fecha"), value("hora")].filter(Boolean).join(" · ");
    fila("Cuándo", cuando);
    fila("Presupuesto", value("presupuesto"));
    fila("Mensaje", value("mensaje"));
  }

  function vista() {
    if (!summaryImg) return;
    var tipo = checked("tipo")[0];
    var vista = vistas[tipo];
    if (vista && summaryImg.getAttribute("src") !== vista.src) {
      summaryImg.style.opacity = "0";
      window.setTimeout(function () {
        summaryImg.setAttribute("src", vista.src);
        summaryImg.setAttribute("alt", vista.alt);
        summaryImg.style.opacity = "1";
      }, 130);
    }
  }

  function fallo(mensaje, campos) {
    if (error) { error.textContent = mensaje; error.hidden = false; }
    (campos || []).forEach(function (name) {
      var el = form.querySelector('[name="' + name + '"]');
      if (el) el.classList.add("field-error");
    });
    if (campos && campos.length) {
      var first = form.querySelector('[name="' + campos[0] + '"]');
      if (first) first.focus();
    }
  }

  function validarEntrega() {
    var campos = ["destinatario", "direccion", "presupuesto", "telefono"];
    Array.prototype.forEach.call(form.querySelectorAll(".field-error"), function (el) {
      el.classList.remove("field-error");
    });
    var faltan = campos.filter(function (name) {
      var el = form.querySelector('[name="' + name + '"]');
      return !el || !String(el.value).trim();
    });
    if (faltan.length) {
      fallo("Faltan datos para la entrega: destinatario, dirección, presupuesto y teléfono.", faltan);
      return false;
    }
    if (error) error.hidden = true;
    return true;
  }

  function mensaje() {
    var lineas = [
      "Hola Sweet Memories 🌸 Quiero pedir un arreglo:",
      "",
      "📦 Pieza: " + checked("tipo")[0],
      "📏 Tamaño: " + checked("tamano")[0],
      "💐 Flores: " + join("flores"),
      "🎨 Tonos: " + tono()
    ];
    var extras = join("extras");
    if (extras) lineas.push("✨ Extras: " + extras);
    lineas.push("🎉 Ocasión: " + checked("ocasion")[0]);
    lineas.push("");
    lineas.push("👤 Para: " + value("destinatario"));
    lineas.push("📍 Entrega: " + value("direccion"));
    var cuando = [value("fecha"), value("hora")].filter(Boolean).join(" · ");
    if (cuando) lineas.push("🗓️ Cuándo: " + cuando);
    lineas.push("💰 Presupuesto: " + value("presupuesto"));
    var msj = value("mensaje");
    if (msj) lineas.push("📝 Mensaje: " + msj);
    lineas.push("");
    lineas.push("📞 Mi teléfono: " + value("telefono"));
    return lineas.join("\n");
  }

  function enviar() {
    if (paso < steps.length - 1) { setPaso(steps.length - 1); }
    if (!validarEntrega()) return;
    var url = "https://wa.me/5219516112088?text=" + encodeURIComponent(mensaje());
    window.open(url, "_blank", "noopener,noreferrer");
  }

  if (back) back.addEventListener("click", function () { setPaso(paso - 1); });
  if (next) next.addEventListener("click", function () {
    if (paso === steps.length - 1) { enviar(); return; }
    setPaso(paso + 1);
  });
  if (send) send.addEventListener("click", enviar);

  form.addEventListener("change", function () { resumen(); vista(); });
  form.addEventListener("input", function () {
    resumen();
    Array.prototype.forEach.call(form.querySelectorAll(".field-error"), function (el) {
      if (String(el.value).trim()) el.classList.remove("field-error");
    });
  });

  setPaso(0);
  sincronizarTono();
  resumen();
  vista();
})();
