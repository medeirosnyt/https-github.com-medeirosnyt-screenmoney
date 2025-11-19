/**
 * API Route: Análise de Gráficos com GPT-4 Vision
 * 
 * Recebe imagem base64 e retorna análise de tendência e timeframe detectado
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { limiter } from "@/lib/ratelimit";

// Chave da API OpenAI
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Prompt otimizado para análise de gráficos de opções binárias
const ANALYSIS_PROMPT = `Você é um especialista em análise técnica de gráficos de opções binárias. 

**VALIDAÇÃO DA IMAGEM (CRUCIAL):**
Primeiro, verifique se a imagem é um gráfico de candlesticks (velas) de opções binárias.
- Se NÃO for um gráfico de candlesticks, retorne um erro conforme formato abaixo
- Se for uma tabela, planilha, texto ou outro tipo de imagem, retorne erro
- Apenas analise se for claramente um gráfico com velas (candlesticks)

**SE FOR UM GRÁFICO VÁLIDO, analise e forneça:**

1. **TIMEFRAME DETECTADO**: Identifique se é M1 (1 minuto), M5 (5 minutos) ou M15 (15 minutos) observando as velas e o período mostrado no gráfico.

2. **TENDÊNCIA**: Determine se a tendência atual é de ALTA (bullish) ou BAIXA (bearish) baseado em:
   - Padrões de candlesticks
   - Movimentos de preço recentes
   - Suportes e resistências visíveis
   - Momentum atual

3. **CONFIANÇA**: Avalie sua confiança na análise de 70 a 95.

4. **RECOMENDAÇÃO**: Baseado na análise, recomende COMPRA (call) ou VENDA (put).

**FORMATO DE RESPOSTA - SEMPRE JSON, NUNCA TEXTO PURO:**

Para ERRO (imagem inválida):
{
  "error": true,
  "errorType": "invalid_image_type",
  "message": "Por favor, envie um gráfico de candlesticks (opções binárias). A imagem enviada parece ser [tipo detectado].",
  "detectedType": "tabela financeira" ou "planilha" ou "texto" ou "outro"
}

Para SUCESSO (análise válida):
{
  "error": false,
  "timeframe": "M1" ou "M5" ou "M15",
  "trend": "up" ou "down",
  "confidence": número entre 70 e 95,
  "recommendation": "texto curto explicando a recomendação (máximo 100 caracteres)",
  "details": "análise detalhada do gráfico (máximo 200 caracteres)"
}

**REGRAS CRÍTICAS:**
- SEMPRE retorne JSON válido, nunca texto puro
- SEMPRE inclua o campo "error" (true ou false)
- Se não conseguir analisar, retorne error: true
- Seja rigoroso: só analise gráficos de candlesticks reais`;

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
      const globalCheck = limiter.checkGlobalLimit();
      if (!globalCheck.allowed) {
        return NextResponse.json(
          {
            error: "Limite global diário excedido",
            message: "O sistema atingiu o limite de 2000 requisições por dia. Tente novamente amanhã.",
          },
          { status: 429 }
        );
      }

      const ipCheck = limiter.checkIpLimit(ip);
      if (!ipCheck.allowed) {
        const resetInSeconds = Math.ceil((ipCheck.resetAt - Date.now()) / 1000);
        return NextResponse.json(
          {
            error: "Limite de requisições excedido",
            message: `Você excedeu o limite de 5 requisições por minuto. Tente novamente em ${resetInSeconds} segundos.`,
          },
          { status: 429 }
        );
      }
    }

    // 5. Incrementar contador global
    limiter.incrementGlobal();

    // 6. Validar chave da API
    if (!OPENAI_API_KEY) {
      console.error("[Analyze Chart] OPENAI_API_KEY não configurada");
      return NextResponse.json(
        { error: "Configuração do servidor incompleta" },
        { status: 500 }
      );
    }

    // 7. Obter imagem base64 do body
    const { image } = await req.json();

    if (!image || !image.startsWith("data:image/")) {
      return NextResponse.json(
        { error: "Imagem inválida ou ausente" },
        { status: 400 }
      );
    }

    console.log("[Analyze Chart] Iniciando análise com GPT-4 Vision...");

    // 8. Fazer requisição para OpenAI com GPT-4 Vision
    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",  // Modelo com visão
        response_format: { type: "json_object" },  // Força retorno em JSON
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: ANALYSIS_PROMPT
              },
              {
                type: "image_url",
                image_url: {
                  url: image,
                  detail: "high"
                }
              }
            ]
          }
        ],
        max_tokens: 500,
        temperature: 0.3,  // Baixa para respostas mais consistentes
      }),
    });

    // 9. Obter resposta da OpenAI
    const openaiData = await openaiResponse.json();

    if (!openaiResponse.ok) {
      console.error("[Analyze Chart] Erro da OpenAI:", openaiData);
      return NextResponse.json(
        {
          error: "Erro ao processar análise",
          details: openaiData.error?.message || "Erro desconhecido",
        },
        { status: openaiResponse.status }
      );
    }

    // 10. Extrair e parsear resposta
    const content = openaiData.choices?.[0]?.message?.content;
    
    if (!content) {
      console.error("[Analyze Chart] Resposta vazia da OpenAI");
      return NextResponse.json(
        { error: "Análise não pôde ser gerada" },
        { status: 500 }
      );
    }

    console.log("[Analyze Chart] Resposta da IA:", content);

    // Tentar parsear JSON com limpeza robusta
    let analysisResult;
    try {
      // Limpeza robusta de conteúdo
      let cleanContent = content
        // Remover BOM e caracteres Unicode invisíveis
        .replace(/^\uFEFF/, "")
        .replace(/\u200B/g, "")
        // Remover blocos de código markdown
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      
      // Tentar extrair JSON do meio do texto (primeiro { até último })
      const firstBrace = cleanContent.indexOf("{");
      const lastBrace = cleanContent.lastIndexOf("}");
      
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        cleanContent = cleanContent.substring(firstBrace, lastBrace + 1);
      }
      
      // Remover múltiplas quebras de linha e espaços excessivos
      cleanContent = cleanContent
        .replace(/\n\s*\n/g, "\n")
        .trim();
      
      console.log("[Analyze Chart] Conteúdo limpo para parse:", cleanContent);
      
      analysisResult = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("[Analyze Chart] Erro ao parsear JSON:", parseError);
      console.error("[Analyze Chart] Conteúdo recebido:", content);
      
      // Fallback inteligente: detectar se é mensagem de recusa
      const lowerContent = content.toLowerCase();
      if (
        lowerContent.includes("não consigo") ||
        lowerContent.includes("desculpe") ||
        lowerContent.includes("não é um gráfico") ||
        lowerContent.includes("não parece") ||
        lowerContent.includes("imagem inválida")
      ) {
        return NextResponse.json(
          {
            error: "Tipo de imagem inválido",
            message: "Por favor, envie um gráfico de candlesticks (opções binárias). A imagem enviada não corresponde ao formato esperado.",
          },
          { status: 400 }
        );
      }
      
      // Se não, é erro de formato mesmo
      return NextResponse.json(
        { 
          error: "Formato de resposta inválido da IA",
          message: "Erro ao processar a resposta. Por favor, tente novamente."
        },
        { status: 500 }
      );
    }

    // 11. Verificar se é resposta de erro da IA
    if (analysisResult.error === true) {
      console.log("[Analyze Chart] IA detectou imagem inválida:", analysisResult);
      return NextResponse.json(
        {
          error: "Tipo de imagem inválido",
          message: analysisResult.message || "Por favor, envie um gráfico de candlesticks (opções binárias).",
          detectedType: analysisResult.detectedType || "não identificado"
        },
        { status: 400 }
      );
    }

    // 12. Validar estrutura da resposta de sucesso
    if (!analysisResult.timeframe || !analysisResult.trend || analysisResult.confidence === undefined) {
      console.error("[Analyze Chart] Resposta incompleta:", analysisResult);
      return NextResponse.json(
        { 
          error: "Análise incompleta",
          message: "A análise não retornou todos os campos necessários. Por favor, tente novamente."
        },
        { status: 500 }
      );
    }

    // 13. Validar tipos dos campos
    const validTimeframes = ["M1", "M5", "M15"];
    const validTrends = ["up", "down"];
    const confidence = Number(analysisResult.confidence);

    if (!validTimeframes.includes(analysisResult.timeframe)) {
      console.error("[Analyze Chart] Timeframe inválido:", analysisResult.timeframe);
      return NextResponse.json(
        { 
          error: "Dados inválidos",
          message: "A análise retornou um timeframe inválido. Por favor, tente novamente."
        },
        { status: 500 }
      );
    }

    if (!validTrends.includes(analysisResult.trend)) {
      console.error("[Analyze Chart] Tendência inválida:", analysisResult.trend);
      return NextResponse.json(
        { 
          error: "Dados inválidos",
          message: "A análise retornou uma tendência inválida. Por favor, tente novamente."
        },
        { status: 500 }
      );
    }

    if (isNaN(confidence) || confidence < 70 || confidence > 95) {
      console.error("[Analyze Chart] Confiança inválida:", analysisResult.confidence);
      return NextResponse.json(
        { 
          error: "Dados inválidos",
          message: "A análise retornou um nível de confiança inválido. Por favor, tente novamente."
        },
        { status: 500 }
      );
    }

    // 14. Retornar análise ao cliente
    const response = NextResponse.json({
      timeframe: analysisResult.timeframe,
      timeframeDetected: analysisResult.timeframe,
      trend: analysisResult.trend,
      confidence: analysisResult.confidence,
      recommendation: analysisResult.recommendation || "Análise concluída",
      details: analysisResult.details || "",
      expirationTime: "1 minuto",  // Sempre 1 minuto conforme requisito
    });

    // Adicionar headers de rate limit
    const stats = limiter.getStats(ip);
    if (!superAccess) {
      response.headers.set("X-RateLimit-Remaining-IP", stats.ip?.remaining.toString() || "5");
      response.headers.set("X-RateLimit-Remaining-Global", stats.global.remaining.toString());
    }

    console.log("[Analyze Chart] Análise concluída com sucesso");
    return response;

  } catch (error) {
    console.error("[Analyze Chart] Erro:", error);
    return NextResponse.json(
      { 
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : "Erro desconhecido"
      },
      { status: 500 }
    );
  }
}

// Health check
export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Análise de gráficos está funcionando",
    hasApiKey: !!OPENAI_API_KEY,
  });
}
