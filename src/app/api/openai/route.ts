/**
 * API Route: Proxy Seguro para OpenAI
 * 
 * Aplica rate limiting e faz proxy seguro das requisições para a API da OpenAI
 * Nunca expõe a chave da API ao cliente
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { limiter } from "@/lib/ratelimit";

// Chave da API OpenAI (NUNCA expor ao cliente)
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export async function POST(req: NextRequest) {
  try {
    // 1. Detectar IP do cliente
    const ip = (req.headers.get("x-client-ip") || "0.0.0.0").trim().toLowerCase();

    // 2. Verificar super acesso (admin ignora limites)
    const superAccess = req.cookies.get("superAccess")?.value === "true";

    // 3. Resetar contadores se for novo dia
    limiter.resetIfNewDay();

    // 4. Aplicar rate limits (apenas se não for admin)
    if (!superAccess) {
      // Verificar limite global diário
      const globalCheck = limiter.checkGlobalLimit();
      if (!globalCheck.allowed) {
        return NextResponse.json(
          {
            error: "Limite global diário excedido",
            message: "O sistema atingiu o limite de 2000 requisições por dia. Tente novamente amanhã.",
            remaining: 0,
          },
          {
            status: 429,
            headers: {
              "X-RateLimit-Limit": "2000",
              "X-RateLimit-Remaining": "0",
              "X-RateLimit-Reset": new Date(Date.now() + 86400000).toISOString(),
            },
          }
        );
      }

      // Verificar limite por IP
      const ipCheck = limiter.checkIpLimit(ip);
      if (!ipCheck.allowed) {
        const resetInSeconds = Math.ceil((ipCheck.resetAt - Date.now()) / 1000);
        return NextResponse.json(
          {
            error: "Limite de requisições excedido",
            message: `Você excedeu o limite de 5 requisições por minuto. Tente novamente em ${resetInSeconds} segundos.`,
            remaining: 0,
            resetAt: ipCheck.resetAt,
          },
          {
            status: 429,
            headers: {
              "X-RateLimit-Limit": "5",
              "X-RateLimit-Remaining": "0",
              "X-RateLimit-Reset": new Date(ipCheck.resetAt).toISOString(),
              "Retry-After": resetInSeconds.toString(),
            },
          }
        );
      }
    }

    // 5. Incrementar contador global
    limiter.incrementGlobal();

    // 6. Validar chave da API
    if (!OPENAI_API_KEY) {
      console.error("[OpenAI Proxy] OPENAI_API_KEY não configurada");
      return NextResponse.json(
        { error: "Configuração do servidor incompleta" },
        { status: 500 }
      );
    }

    // 7. Obter body da requisição
    const body = await req.json();

    // 8. Fazer requisição para OpenAI (proxy seguro)
    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    // 9. Obter resposta da OpenAI
    const openaiData = await openaiResponse.json();

    // 10. Retornar resposta ao cliente
    if (!openaiResponse.ok) {
      console.error("[OpenAI Proxy] Erro da OpenAI:", openaiData);
      return NextResponse.json(
        {
          error: "Erro ao processar requisição",
          details: openaiData.error?.message || "Erro desconhecido",
        },
        { status: openaiResponse.status }
      );
    }

    // Adicionar headers de rate limit na resposta
    const stats = limiter.getStats(ip);
    const response = NextResponse.json(openaiData);
    
    if (!superAccess) {
      response.headers.set("X-RateLimit-Limit-IP", "5");
      response.headers.set("X-RateLimit-Remaining-IP", stats.ip?.remaining.toString() || "5");
      response.headers.set("X-RateLimit-Limit-Global", "2000");
      response.headers.set("X-RateLimit-Remaining-Global", stats.global.remaining.toString());
    } else {
      response.headers.set("X-Super-Access", "true");
    }

    return response;

  } catch (error) {
    console.error("[OpenAI Proxy] Erro:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// Endpoint de health check
export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "OpenAI Proxy está funcionando",
    hasApiKey: !!OPENAI_API_KEY,
  });
}
