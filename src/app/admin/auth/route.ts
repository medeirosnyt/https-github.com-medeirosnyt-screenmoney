/**
 * Route de autenticação administrativa
 * 
 * Valida senha e cria cookie HttpOnly para acesso privilegiado
 * Usuários autenticados ignoram rate limits
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Senha administrativa (usa variável de ambiente ou fallback)
const ADMIN_PASSWORD = process.env.ADMIN_PASS ?? "Vascao2025";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { password } = body;

    // Valida senha
    const isValid = password === ADMIN_PASSWORD;

    if (!isValid) {
      return NextResponse.json(
        { success: false, message: "Senha incorreta" },
        { status: 401 }
      );
    }

    // Cria resposta de sucesso
    const response = NextResponse.json({ success: true });

    // Define cookie HttpOnly seguro
    // superAccess=true permite ignorar rate limits
    response.cookies.set({
      name: "superAccess",
      value: "true",
      httpOnly: true, // Não acessível via JavaScript
      secure: process.env.NODE_ENV === "production", // HTTPS em produção
      sameSite: "strict", // Proteção CSRF
      maxAge: 86400, // 24 horas
      path: "/", // Válido para todo o site
    });

    console.log("[Admin Auth] Login bem-sucedido");

    return response;
  } catch (error) {
    console.error("[Admin Auth] Erro:", error);
    return NextResponse.json(
      { success: false, message: "Erro no servidor" },
      { status: 500 }
    );
  }
}
