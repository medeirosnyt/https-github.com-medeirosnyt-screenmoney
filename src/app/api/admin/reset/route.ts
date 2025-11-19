/**
 * API Route: Reset de Rate Limits
 * 
 * Reseta todos os contadores em memória (requer autenticação admin)
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Importação dinâmica para evitar problemas de inicialização
let limiter: any = null;

async function getLimiter() {
  if (!limiter) {
    const module = await import("@/lib/ratelimit");
    limiter = module.limiter;
  }
  return limiter;
}

export async function POST(req: NextRequest) {
  try {
    // Verifica autenticação admin
    const superAccess = req.cookies.get("superAccess")?.value === "true";

    if (!superAccess) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    // Obtém limiter e reseta todos os limites
    const rateLimiter = await getLimiter();
    rateLimiter.resetAll();

    return NextResponse.json({
      success: true,
      message: "Limites resetados com sucesso",
    });
  } catch (error) {
    console.error("[Admin Reset] Erro ao resetar limites:", error);
    return NextResponse.json(
      { 
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : "Erro desconhecido"
      },
      { status: 500 }
    );
  }
}
