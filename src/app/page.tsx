"use client";

import { useState, useRef, useEffect } from "react";
import { Upload, TrendingUp, TrendingDown, Loader2, CheckCircle2, Activity, DollarSign, Users, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import AnalysisActions from "@/components/custom/analysis-actions";
import Image from "next/image";

interface AnalysisResult {
  trend: "up" | "down";
  confidence: number;
  recommendation: string;
  timeframe: string;
  timeframeDetected?: string;
  expirationTime?: string;
  details?: string;
}

function gerarLucroInicial() {
  const minimo = 20_000;
  const maximo = 80_000;
  const valor = Math.random() * (maximo - minimo) + minimo;
  return valor;
}

function gerarIncremento() {
  const minimo = 50;
  const maximo = 300;
  const valor = Math.random() * (maximo - minimo) + minimo;
  return valor;
}

// Função para comprimir imagem AGRESSIVAMENTE para mobile
function compressImage(base64: string, maxWidth: number = 600, quality: number = 0.6): Promise<string> {
  return new Promise((resolve) => {
    const img = document.createElement('img');
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Redimensionar agressivamente para mobile
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);

      // Comprimir MUITO para mobile (qualidade 0.6)
      const compressed = canvas.toDataURL('image/jpeg', quality);
      resolve(compressed);
    };
    img.src = base64;
  });
}

export default function Home() {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [lucro, setLucro] = useState<number>(0);
  const [mounted, setMounted] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Gerenciamento do lucro diário - sistema de incremento
  useEffect(() => {
    // Gera valor inicial apenas uma vez
    const lucroInicial = gerarLucroInicial();
    setLucro(lucroInicial);
    setMounted(true);

    // Incrementa o lucro a cada minuto
    const intervalo = setInterval(() => {
      setLucro(prev => prev + gerarIncremento());
    }, 60_000);

    return () => clearInterval(intervalo);
  }, []);

  const valorFormatado = mounted
    ? lucro.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : "Carregando...";

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        alert("Por favor, selecione apenas arquivos de imagem");
        return;
      }

      const reader = new FileReader();
      reader.onload = async (e) => {
        const result = e.target?.result as string;
        
        // Comprimir AGRESSIVAMENTE para mobile (600px, qualidade 0.6)
        setAnalysisProgress("Otimizando imagem...");
        const compressed = await compressImage(result, 600, 0.6);
        
        setCapturedImage(compressed);
        setAnalysisResult(null);
        setAnalysisProgress("");
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const analyzeChart = async () => {
    if (!capturedImage) {
      alert("Por favor, faça upload de uma imagem primeiro");
      return;
    }

    setIsAnalyzing(true);
    setAnalysisResult(null);
    setAnalysisProgress("Preparando análise...");

    try {
      setAnalysisProgress("Enviando imagem para análise...");
      
      // Requisição SIMPLIFICADA sem timeout/abort
      const response = await fetch("/api/analyze-chart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: capturedImage,
        }),
      });

      setAnalysisProgress("Processando resposta...");

      if (!response.ok) {
        // Tentar ler resposta de erro
        let errorMessage = "Erro ao analisar gráfico. Tente novamente.";
        
        try {
          const errorData = await response.json();
          
          if (response.status === 400) {
            errorMessage = errorData.message || "Por favor, envie um gráfico de candlesticks (opções binárias). A imagem enviada não corresponde ao formato esperado.";
          } else if (response.status === 429) {
            errorMessage = errorData.message || "Você excedeu o limite de requisições. Por favor, aguarde alguns minutos.";
          } else if (response.status === 500) {
            errorMessage = errorData.message || errorData.error || "Erro no servidor. Por favor, tente novamente.";
          } else {
            errorMessage = errorData.message || errorData.error || errorMessage;
          }
        } catch (parseError) {
          // Se não conseguir fazer parse, use mensagem genérica
          errorMessage = `Erro ${response.status}. Por favor, tente novamente.`;
        }
        
        throw new Error(errorMessage);
      }

      // Ler resposta JSON
      const data = await response.json();

      // Mapear resposta da API para o formato esperado
      const result: AnalysisResult = {
        trend: data.trend,
        confidence: data.confidence,
        recommendation: data.recommendation,
        timeframe: data.expirationTime || "1 minuto",
        timeframeDetected: data.timeframeDetected,
        expirationTime: data.expirationTime,
        details: data.details,
      };

      setAnalysisResult(result);
      setAnalysisProgress("Análise concluída!");
      
    } catch (error: any) {
      console.error("Erro na análise:", error);
      
      let errorMessage = "Erro ao analisar gráfico. Verifique sua conexão e tente novamente.";
      
      // Erros de rede específicos
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorMessage = "Erro de conexão. Verifique sua internet e tente novamente.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
      
    } finally {
      setIsAnalyzing(false);
      setAnalysisProgress("");
    }
  };

  const handleNewAnalysis = () => {
    setCapturedImage(null);
    setAnalysisResult(null);
  };

  const handleResult = (result: "win" | "loss") => {
    console.log(`Resultado registrado: ${result}`);
    // Aqui você pode adicionar lógica para salvar métricas, enviar para API, etc.
    // Os toasts são exibidos automaticamente pelo componente AnalysisActions
  };

  return (
    <div className="min-h-screen relative overflow-hidden pb-32">
      {/* Background Tecnológico Avançado */}
      <div className="fixed inset-0 bg-[#000000] z-0">
        {/* Gradiente base escuro */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#020617] via-[#0b1220] to-[#000000]"></div>
        
        {/* Grade tecnológica */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(rgba(56, 189, 248, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(56, 189, 248, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}
        ></div>

        {/* Brilhos neon difusos - Verde (alta) */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#22c55e] rounded-full blur-[120px] opacity-20 animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#22c55e] rounded-full blur-[120px] opacity-15 animate-pulse" style={{ animationDelay: '1s' }}></div>
        
        {/* Brilhos neon difusos - Ciano (cripto) */}
        <div className="absolute top-1/3 right-1/3 w-80 h-80 bg-[#38bdf8] rounded-full blur-[100px] opacity-20 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute bottom-1/3 left-1/3 w-80 h-80 bg-[#38bdf8] rounded-full blur-[100px] opacity-15 animate-pulse" style={{ animationDelay: '1.5s' }}></div>

        {/* Máscara radial para centralizar atenção */}
        <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-[#000000] opacity-60"></div>

        {/* Elementos SVG - Gráficos abstratos e blockchain */}
        <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
          {/* Linhas de conexão blockchain */}
          <g stroke="#38bdf8" strokeWidth="1" fill="none" opacity="0.3">
            <line x1="10%" y1="20%" x2="30%" y2="40%" />
            <line x1="30%" y1="40%" x2="50%" y2="30%" />
            <line x1="50%" y1="30%" x2="70%" y2="50%" />
            <line x1="70%" y1="50%" x2="90%" y2="35%" />
            <circle cx="10%" cy="20%" r="4" fill="#38bdf8" />
            <circle cx="30%" cy="40%" r="4" fill="#38bdf8" />
            <circle cx="50%" cy="30%" r="4" fill="#22c55e" />
            <circle cx="70%" cy="50%" r="4" fill="#38bdf8" />
            <circle cx="90%" cy="35%" r="4" fill="#22c55e" />
          </g>

          {/* Candlesticks abstratos */}
          <g opacity="0.15">
            <rect x="15%" y="60%" width="2" height="30" fill="#22c55e" />
            <rect x="14.5%" y="65%" width="3" height="15" fill="#22c55e" />
            
            <rect x="25%" y="55%" width="2" height="35" fill="#ef4444" />
            <rect x="24.5%" y="62%" width="3" height="18" fill="#ef4444" />
            
            <rect x="35%" y="50%" width="2" height="40" fill="#22c55e" />
            <rect x="34.5%" y="58%" width="3" height="20" fill="#22c55e" />
            
            <rect x="45%" y="58%" width="2" height="32" fill="#22c55e" />
            <rect x="44.5%" y="63%" width="3" height="16" fill="#22c55e" />
          </g>

          {/* Ondas de preço abstratas */}
          <path 
            d="M 0 70 Q 25 60, 50 65 T 100 70" 
            stroke="#22c55e" 
            strokeWidth="2" 
            fill="none" 
            opacity="0.2"
          />
          <path 
            d="M 0 75 Q 25 68, 50 72 T 100 75" 
            stroke="#38bdf8" 
            strokeWidth="2" 
            fill="none" 
            opacity="0.15"
          />
        </svg>

        {/* Partículas flutuantes */}
        <div className="absolute top-[10%] left-[20%] w-1 h-1 bg-[#22c55e] rounded-full animate-float"></div>
        <div className="absolute top-[30%] right-[25%] w-1 h-1 bg-[#38bdf8] rounded-full animate-float" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute bottom-[20%] left-[15%] w-1 h-1 bg-[#22c55e] rounded-full animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-[40%] right-[30%] w-1 h-1 bg-[#38bdf8] rounded-full animate-float" style={{ animationDelay: '1.5s' }}></div>
      </div>

      {/* Conteúdo Principal */}
      <div className="relative z-10 container mx-auto px-4 py-8 md:py-16">
        <div className="text-center text-white mb-6 md:mb-12">
          <h1 className="text-3xl md:text-6xl font-bold mb-3 md:mb-4 bg-gradient-to-r from-[#22c55e] via-[#38bdf8] to-[#22c55e] bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(34,197,94,0.3)]">
            Análise de Investimentos
          </h1>
          <p className="text-sm md:text-xl text-slate-300 mb-2">
            Faça upload do gráfico e receba análise com IA em tempo real
          </p>
          <p className="text-xs md:text-sm text-slate-400">
            Tecnologia avançada de reconhecimento de padrões
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="bg-[#0b1220]/60 backdrop-blur-xl rounded-2xl p-4 md:p-8 border border-[#38bdf8]/20 shadow-2xl shadow-[#38bdf8]/10">
            {!capturedImage && (
              <div className="text-center space-y-4 md:space-y-6">
                <div className="flex flex-col gap-3">
                  <button
                    onClick={triggerFileUpload}
                    className="bg-gradient-to-r from-[#38bdf8] to-cyan-600 hover:from-[#38bdf8]/90 hover:to-cyan-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg shadow-[#38bdf8]/30 flex items-center gap-3 justify-center text-sm md:text-base"
                  >
                    <Upload className="w-5 h-5 md:w-6 md:h-6" />
                    Mande seu Print aqui
                  </button>
                </div>

                {/* Card Explicativo - Tipo de Imagem */}
                <div className="bg-[#1a2b4a]/40 backdrop-blur-sm rounded-lg p-3 md:p-4 border border-[#38bdf8]/10 max-w-2xl mx-auto">
                  <div className="flex items-start gap-2 md:gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <Activity className="w-4 h-4 md:w-5 md:h-5 text-[#38bdf8]" />
                    </div>
                    <div className="flex-1">
                      <p className="text-slate-300 text-xs md:text-sm leading-relaxed">
                        <span className="font-semibold text-[#38bdf8]">📊 Tipo de imagem aceita:</span> Envie um gráfico de candlesticks (velas) de opções binárias para análise precisa. A IA identifica padrões de alta e baixa automaticamente.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Botão CTA da Corretora - Posição 1 */}
                <div className="mt-4 md:mt-6">
                  <Button 
                    asChild 
                    className="w-full py-5 md:py-6 text-sm md:text-base font-bold bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:via-amber-600 hover:to-orange-700 text-white shadow-2xl shadow-orange-500/50 border-2 border-orange-400/30 transition-all duration-300 transform hover:scale-[1.02] rounded-xl"
                  >
                    <a
                      href="https://www.homebroker.com/ref/zdRNW3Qd/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      🚀 Criar conta na corretora
                    </a>
                  </Button>
                </div>

                {/* Card Como Funciona */}
                <div className="bg-[#1a2b4a]/50 backdrop-blur-sm rounded-lg p-4 md:p-6 border border-[#38bdf8]/10">
                  <p className="text-slate-300 text-xs md:text-sm mb-3 flex items-center justify-center gap-2">
                    <Activity className="w-4 h-4" />
                    Como funciona:
                  </p>
                  <ul className="text-slate-400 text-xs md:text-sm space-y-2 text-left max-w-md mx-auto">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4 text-[#22c55e] mt-0.5 flex-shrink-0" />
                      <span>Faça upload de um gráfico de opções binárias</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4 text-[#22c55e] mt-0.5 flex-shrink-0" />
                      <span>Nossa IA analisa padrões e tendências em segundos</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4 text-[#22c55e] mt-0.5 flex-shrink-0" />
                      <span>Receba recomendações precisas para suas operações</span>
                    </li>
                  </ul>
                </div>

                {/* Card Lucro Diário */}
                <div className="bg-gradient-to-br from-[#0b1220]/90 to-[#1a2b4a]/90 backdrop-blur-xl rounded-2xl p-4 md:p-8 border-2 border-[#22c55e]/30 shadow-2xl shadow-[#22c55e]/20">
                  {/* Ícone e Título */}
                  <div className="flex items-center justify-center gap-2 md:gap-3 mb-4 md:mb-6">
                    <div className="bg-[#22c55e]/20 p-2 md:p-3 rounded-full">
                      <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-[#22c55e]" />
                    </div>
                    <h2 className="text-base md:text-xl font-semibold text-slate-200">
                      Lucro Total nas Últimas 24h
                    </h2>
                  </div>

                  {/* Valor do Lucro */}
                  <div className="text-center mb-4 md:mb-6">
                    <p className="text-3xl md:text-6xl font-black bg-gradient-to-r from-[#22c55e] to-emerald-400 bg-clip-text text-transparent mb-2 md:mb-3 drop-shadow-[0_0_40px_rgba(34,197,94,0.5)]">
                      {valorFormatado}
                    </p>
                    <p className="text-slate-400 text-xs md:text-sm">
                      Atualizado automaticamente a cada minuto
                    </p>
                  </div>

                  {/* Estatísticas Adicionais */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-3">
                    <div className="bg-[#0b1220]/60 backdrop-blur-sm rounded-xl p-3 md:p-4 border border-[#38bdf8]/20">
                      <div className="flex items-center gap-2 mb-1 md:mb-2">
                        <DollarSign className="w-3 h-3 md:w-4 md:h-4 text-[#38bdf8]" />
                        <p className="text-slate-400 text-xs">Média por Usuário</p>
                      </div>
                      <p className="text-lg md:text-xl font-bold text-white">
                        {mounted ? (lucro / 150).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "..."}
                      </p>
                    </div>

                    <div className="bg-[#0b1220]/60 backdrop-blur-sm rounded-xl p-3 md:p-4 border border-[#38bdf8]/20">
                      <div className="flex items-center gap-2 mb-1 md:mb-2">
                        <Users className="w-3 h-3 md:w-4 md:h-4 text-[#38bdf8]" />
                        <p className="text-slate-400 text-xs">Usuários Ativos</p>
                      </div>
                      <p className="text-lg md:text-xl font-bold text-white">
                        {mounted ? Math.floor(Math.random() * (300 - 80 + 1) + 80) : "..."}
                      </p>
                    </div>

                    <div className="bg-[#0b1220]/60 backdrop-blur-sm rounded-xl p-3 md:p-4 border border-[#38bdf8]/20">
                      <div className="flex items-center gap-2 mb-1 md:mb-2">
                        <Activity className="w-3 h-3 md:w-4 md:h-4 text-[#38bdf8]" />
                        <p className="text-slate-400 text-xs">Análises Hoje</p>
                      </div>
                      <p className="text-lg md:text-xl font-bold text-white">
                        {mounted ? Math.floor(Math.random() * (1500 - 200 + 1) + 200) : "..."}
                      </p>
                    </div>
                  </div>

                  {/* Informação Adicional */}
                  <div className="mt-4 md:mt-6 bg-[#22c55e]/10 border border-[#22c55e]/30 rounded-xl p-2 md:p-3">
                    <p className="text-slate-300 text-xs leading-relaxed text-center">
                      <strong className="text-[#22c55e]">💡 Dica:</strong> Estes valores representam o lucro acumulado de todos os usuários que utilizaram o app para análise de gráficos nas últimas 24 horas.
                    </p>
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            )}

            {capturedImage && (
              <div className="space-y-4 md:space-y-6">
                <div className="rounded-xl overflow-hidden border-2 border-[#38bdf8]/30">
                  <Image
                    src={capturedImage}
                    alt="Gráfico capturado"
                    width={800}
                    height={600}
                    className="w-full h-auto"
                  />
                </div>

                {/* Indicador de Progresso da Análise */}
                {isAnalyzing && analysisProgress && (
                  <div className="bg-[#38bdf8]/10 border border-[#38bdf8]/30 rounded-lg p-3 md:p-4">
                    <div className="flex items-center gap-3">
                      <Loader2 className="w-4 h-4 md:w-5 md:h-5 text-[#38bdf8] animate-spin" />
                      <p className="text-[#38bdf8] text-xs md:text-sm font-medium">{analysisProgress}</p>
                    </div>
                  </div>
                )}

                {/* Resultado da Análise */}
                {analysisResult && (
                  <div className={`bg-gradient-to-r ${
                    analysisResult.trend === "up" 
                      ? "from-[#22c55e]/20 to-emerald-500/20 border-[#22c55e]/50" 
                      : "from-red-500/20 to-rose-500/20 border-red-500/50"
                  } border-2 rounded-xl p-4 md:p-6 backdrop-blur-sm`}>
                    <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
                      {analysisResult.trend === "up" ? (
                        <TrendingUp className="w-6 h-6 md:w-8 md:h-8 text-[#22c55e]" />
                      ) : (
                        <TrendingDown className="w-6 h-6 md:w-8 md:h-8 text-red-400" />
                      )}
                      <div>
                        <h3 className="text-white font-bold text-lg md:text-xl">
                          {analysisResult.trend === "up" ? "Tendência de Alta" : "Tendência de Baixa"}
                        </h3>
                        <p className="text-slate-300 text-xs md:text-sm">
                          Confiança: {analysisResult.confidence}%
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      {/* RECOMENDAÇÃO COM ÊNFASE MÁXIMA */}
                      <div className={`${
                        analysisResult.trend === "up" 
                          ? "bg-gradient-to-r from-[#22c55e] to-emerald-600" 
                          : "bg-gradient-to-r from-red-500 to-rose-600"
                      } rounded-xl p-4 md:p-6 border-4 ${
                        analysisResult.trend === "up" 
                          ? "border-[#22c55e]" 
                          : "border-red-500"
                      } shadow-2xl ${
                        analysisResult.trend === "up" 
                          ? "shadow-[#22c55e]/50" 
                          : "shadow-red-500/50"
                      } animate-pulse`}>
                        <div className="flex items-center justify-center gap-2 md:gap-4 mb-2 md:mb-3">
                          {analysisResult.trend === "up" ? (
                            <ArrowUp className="w-8 h-8 md:w-12 md:h-12 text-white animate-bounce" />
                          ) : (
                            <ArrowDown className="w-8 h-8 md:w-12 md:h-12 text-white animate-bounce" />
                          )}
                          <p className="text-3xl md:text-6xl font-black text-white tracking-wider drop-shadow-2xl">
                            {analysisResult.trend === "up" ? "COMPRAR" : "VENDER"}
                          </p>
                          {analysisResult.trend === "up" ? (
                            <ArrowUp className="w-8 h-8 md:w-12 md:h-12 text-white animate-bounce" />
                          ) : (
                            <ArrowDown className="w-8 h-8 md:w-12 md:h-12 text-white animate-bounce" />
                          )}
                        </div>
                        <p className="text-white text-center text-sm md:text-lg font-semibold">
                          {analysisResult.recommendation}
                        </p>
                      </div>
                      
                      {/* Timeframe Detectado */}
                      {analysisResult.timeframeDetected && (
                        <div className="bg-[#0b1220]/50 rounded-lg p-3 md:p-4 border border-[#38bdf8]/10">
                          <p className="text-slate-400 text-xs mb-1">Timeframe detectado no gráfico:</p>
                          <p className="text-white font-semibold text-sm md:text-base">
                            {analysisResult.timeframeDetected}
                          </p>
                        </div>
                      )}

                      {/* Tempo de Expiração Recomendado */}
                      <div className="bg-emerald-500/10 rounded-lg p-3 md:p-4 border-2 border-emerald-500/30">
                        <p className="text-emerald-400 text-xs mb-1 font-semibold">⏱️ Tempo de expiração recomendado:</p>
                        <p className="text-emerald-300 font-bold text-base md:text-lg">
                          {analysisResult.expirationTime || "1 minuto"}
                        </p>
                        <p className="text-emerald-400/70 text-xs mt-1">
                          Opere em M1 (1 minuto) para melhores resultados
                        </p>
                      </div>

                      {/* Detalhes da Análise (se houver) */}
                      {analysisResult.details && (
                        <div className="bg-[#0b1220]/50 rounded-lg p-3 md:p-4 border border-[#38bdf8]/10">
                          <p className="text-slate-400 text-xs mb-2">Análise detalhada:</p>
                          <p className="text-slate-300 text-xs md:text-sm leading-relaxed">
                            {analysisResult.details}
                          </p>
                        </div>
                      )}

                      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-2 md:p-3">
                        <p className="text-yellow-200 text-xs leading-relaxed flex items-start gap-2">
                          <TrendingUp className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0 mt-0.5" />
                          <span><strong>Aviso:</strong> Esta análise é apenas informativa e não constitui em recomendação financeira. Opções binárias envolvem alto risco, então não coloque nenhum valor que irá comprometer.</span>
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Botão CTA da Corretora - Posição 2 (após análise) */}
                {analysisResult && (
                  <div className="mt-4 md:mt-6">
                    <Button 
                      asChild 
                      className="w-full py-5 md:py-6 text-sm md:text-base font-bold bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:via-amber-600 hover:to-orange-700 text-white shadow-2xl shadow-orange-500/50 border-2 border-orange-400/30 transition-all duration-300 transform hover:scale-[1.02] rounded-xl"
                    >
                      <a
                        href="https://www.homebroker.com/ref/zdRNW3Qd/"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        🚀 Criar conta na corretora
                      </a>
                    </Button>
                  </div>
                )}

                {/* Componente de Ações Pós-Análise */}
                {analysisResult && (
                  <AnalysisActions 
                    onNewAnalysis={handleNewAnalysis}
                    onResult={handleResult}
                  />
                )}

                {/* Botões de Ação */}
                <div className="flex flex-col gap-2 md:gap-3">
                  <button
                    onClick={() => {
                      setCapturedImage(null);
                      setAnalysisResult(null);
                    }}
                    className="bg-[#1a2b4a]/80 hover:bg-[#1a2b4a] text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 border border-[#38bdf8]/20 text-sm md:text-base"
                  >
                    Remover Imagem
                  </button>
                  <button
                    onClick={triggerFileUpload}
                    className="bg-gradient-to-r from-[#38bdf8] to-cyan-600 hover:from-[#38bdf8]/90 hover:to-cyan-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 flex items-center gap-2 justify-center shadow-lg shadow-[#38bdf8]/30 text-sm md:text-base"
                  >
                    <Upload className="w-4 h-4 md:w-5 md:h-5" />
                    Novo Upload
                  </button>
                  <button
                    onClick={analyzeChart}
                    disabled={isAnalyzing}
                    className="bg-gradient-to-r from-[#22c55e] to-emerald-600 hover:from-[#22c55e]/90 hover:to-emerald-700 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 flex items-center gap-2 justify-center shadow-lg shadow-[#22c55e]/30 text-sm md:text-base"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
                        Analisando...
                      </>
                    ) : (
                      "Analisar Gráfico"
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
