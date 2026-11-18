// Enrutamiento por dispositivo para un mismo link.
// Computadora / TV -> /web/   |   Celular / tablet -> /movil/
// Se ejecuta en el edge de Vercel, antes de servir el archivo estático.
// Hostinger usa el .htaccess equivalente en la raíz.

const MOVIL = /(android|iphone|ipad|ipod|mobile|windows phone|blackberry|opera mini|iemobile)/i;

export function middleware(request) {
  const ua = request.headers.get("user-agent") || "";
  const esMovil = MOVIL.test(ua);
  const destino = esMovil ? "/movil" : "/web";
  const url = request.nextUrl;
  const ruta = url.pathname;

  // Ya está dentro de una versión: no reescribir de nuevo.
  if (ruta.startsWith("/movil/") || ruta.startsWith("/web/")) return undefined;

  // Forzar versión con ?v=web o ?v=movil (útil para revisar cada una).
  const override = url.searchParams.get("v");
  const base = override === "web" ? "/web" : override === "movil" ? "/movil" : destino;

  const nueva = url.clone();
  nueva.pathname = base + (ruta === "/" ? "/index.html" : ruta);
  return Response.rewrite(nueva);
}

export const config = {
  // Todo excepto archivos internos de Vercel y el favicon (compartido).
  matcher: ["/((?!_vercel|_next|favicon\\.png|robots\\.txt|sitemap\\.xml).*)"],
};
