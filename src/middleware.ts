/**
 * Middleware Next.js para detectar IP real do cliente
 * 
 * Extrai o IP de diferentes headers (compatível com Vercel e outros proxies)
 * e adiciona ao header x-client-ip para uso nas rotas
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  // Tenta extrair IP de diferentes fontes (ordem de prioridade)
  const ip =
    req.ip || // IP direto (quando disponível)
    req.headers.get("x-real-ip") || // Nginx
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || // Proxies/CDN
    req.headers.get("cf-connecting-ip") || // Cloudflare
    "0.0.0.0"; // Fallback

  // Adiciona IP ao header para uso nas rotas
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-client-ip", ip);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

// Aplica middleware apenas nas rotas de API
export const config = {
  matcher: ["/api/:path*", "/admin/:path*"],
};
