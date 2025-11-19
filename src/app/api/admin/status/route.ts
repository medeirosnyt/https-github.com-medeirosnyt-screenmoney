/**
 * API Route: Status dos Rate Limits
 * 
 * Retorna estatísticas atuais dos limites (requer autenticação admin)
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    // Verifica autenticação admin
    const superAccess = req.cookies.get("superAccess")?.value === "true";

    if (!superAccess) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    // Importação dinâmica do limiter para evitar problemas de inicialização
    const { limiter } = await import("@/lib/ratelimit");

    // Reseta se for novo dia
    limiter.resetIfNewDay();

    // Obtém IP do cliente de forma robusta
    const ip = 
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("x-real-ip") ||
      req.headers.get("x-client-ip") ||
      "unknown";

    // Obtém estatísticas
    const stats = limiter.getStats(ip);

    return NextResponse.json(
      {
        ...stats,
        hasSuperAccess: true,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      }
    );
  } catch (error) {
    console.error("[Admin Status] Erro ao obter estatísticas:", error);
    
    // Retorna resposta de erro estruturada
    return NextResponse.json(
      { 
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : "Erro desconhecido",
        // Retorna dados padrão para evitar quebra do frontend
        global: {
          total: 0,
          limit: 2000,
          remaining: 2000,
          day: new Date().toISOString().slice(0, 10),
        },
        ip: null,
        totalIps: 0,
        hasSuperAccess: true,
      },
      { 
        status: 200, // Mudado para 200 para evitar erro no frontend
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      }
    );
  }
}
