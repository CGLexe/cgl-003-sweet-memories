// Enrutamiento por dispositivo para un mismo link.
// Computadora / TV -> /web/   |   Celular / tablet -> /movil/
// Devuelve el header x-middleware-rewrite que Vercel interpreta antes de servir
// el archivo estático. Hostinger usa el .htaccess equivalente en la raíz.

const MOVIL = /(android|iphone|ipad|ipod|mobile|windows phone|blackberry|opera mini|iemobile)/i;

export function middleware(request) {
  const ua = request.headers.get("user-agent") || "";
  const url = request.nextUrl;
  const ruta = url.pathname;

  // Ya está dentro de una versión: no reescribir de nuevo.
  if (ruta.startsWith("/web/") || ruta.startsWith("/movil/")) return;

  const esMovil = MOVIL.test(ua);
  const destino = esMovil ? "/movil" : "/web";
  // Forzar versión con ?v=web o ?v=movil (útil para revisar cada una).
  const override = url.searchParams.get("v");
  const base = override === "web" ? "/web" : override === "movil" ? "/movil" : destino;

  const target = new URL(base + (ruta === "/" ? "/index.html" : ruta), request.url);
  const headers = new Headers();
  headers.set("x-middleware-rewrite", target.href);
  return new Response(null, { status: 200, headers });
}

export const config = {
  matcher: ["/", "/:path*"],
};
