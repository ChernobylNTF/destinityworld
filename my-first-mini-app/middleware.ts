export { auth as middleware } from "@/auth"

export const config = {
  matcher: [
    /*
     * Coincide con todas las rutas de solicitud EXCEPTO las que comienzan con:
     * - api (rutas de API)
     * - _next/static (archivos estáticos de Next.js)
     * - _next/image (archivos de optimización de imágenes de Next.js)
     * - favicon.ico (el ícono de la pestaña)
     * - / (la página de inicio pública)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|^/$).*)',
  ],
}
