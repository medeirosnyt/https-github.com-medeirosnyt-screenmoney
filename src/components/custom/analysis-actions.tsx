"use client";

import { RefreshCw, TrendingUp, TrendingDown, PartyPopper, Lightbulb } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";
import confetti from "canvas-confetti";

interface AnalysisActionsProps {
  onNewAnalysis: () => void;
  onResult: (result: "win" | "loss") => void;
}

export default function AnalysisActions({ onNewAnalysis, onResult }: AnalysisActionsProps) {
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackType, setFeedbackType] = useState<"win" | "loss" | null>(null);

  const triggerConfetti = () => {
    // Configuração do confete - explosão central
    const count = 200;
    const defaults = {
      origin: { y: 0.7 }
    };

    function fire(particleRatio: number, opts: confetti.Options) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
        spread: 90,
        startVelocity: 55,
      });
    }

    // Dispara múltiplas explosões para efeito mais dramático
    fire(0.25, {
      spread: 26,
      startVelocity: 55,
    });

    fire(0.2, {
      spread: 60,
    });

    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8
    });

    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2
    });

    fire(0.1, {
      spread: 120,
      startVelocity: 45,
    });

    // Explosões laterais para efeito mais completo
    setTimeout(() => {
      confetti({
        particleCount: 100,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.6 }
      });
      confetti({
        particleCount: 100,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.6 }
      });
    }, 200);
  };

  const handleWin = () => {
    setFeedbackType("win");
    setShowFeedback(true);
    onResult("win");

    // Dispara o confete imediatamente
    triggerConfetti();

    // Toast de sucesso com mensagem motivadora
    toast({
      title: "Brabo demais!",
      description: "Essa operação bateu certinho! Continua assim, gestão em dia e foco no próximo gráfico.",
      className: "bg-gradient-to-r from-[#22c55e] to-emerald-600 border-[#22c55e] text-white",
      duration: 5000,
    });
  };

  const handleLoss = () => {
    setFeedbackType("loss");
    setShowFeedback(true);
    onResult("loss");

    // Toast empático com mensagem de aprendizado
    toast({
      title: "Faz parte do jogo",
      description: "Nem toda operação vai bater. O importante é manter a gestão de banca e aprender com o cenário.",
      className: "bg-gradient-to-r from-amber-500 to-orange-600 border-amber-500 text-white",
      duration: 6000,
    });
  };

  const handleNewAnalysis = () => {
    setShowFeedback(false);
    setFeedbackType(null);
    onNewAnalysis();
  };

  return (
    <div className="space-y-4">
      {/* Card de Ações Principais */}
      <div className="bg-[#0b1220]/60 backdrop-blur-xl rounded-xl p-4 sm:p-6 border border-[#38bdf8]/20 shadow-lg">
        <h3 className="text-white font-semibold text-sm sm:text-base mb-3 sm:mb-4 text-center">
          Como foi o resultado?
        </h3>
        
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          {/* Botão: Fazer outra análise */}
          <button
            onClick={handleNewAnalysis}
            className="flex-1 bg-gradient-to-r from-[#38bdf8] to-cyan-600 hover:from-[#38bdf8]/90 hover:to-cyan-700 text-white font-semibold py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg shadow-[#38bdf8]/30 flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="whitespace-nowrap">Nova Análise</span>
          </button>

          {/* Botão: Deu certo (WIN) */}
          <button
            onClick={handleWin}
            className="flex-1 bg-gradient-to-r from-[#22c55e] to-emerald-600 hover:from-[#22c55e]/90 hover:to-emerald-700 text-white font-semibold py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg shadow-[#22c55e]/30 flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="whitespace-nowrap">Deu Bom</span>
          </button>

          {/* Botão: Deu errado (LOSS) */}
          <button
            onClick={handleLoss}
            className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-500/90 hover:to-orange-700 text-white font-semibold py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="whitespace-nowrap">Deu Ruim</span>
          </button>
        </div>

        <p className="text-slate-400 text-xs text-center mt-3 sm:mt-4">
          Seu feedback nos ajuda a melhorar as análises
        </p>
      </div>

      {/* Card de Feedback Detalhado - Aparece após clicar em Win/Loss */}
      {showFeedback && feedbackType === "win" && (
        <div className="bg-gradient-to-br from-[#22c55e]/10 to-emerald-600/10 backdrop-blur-xl rounded-xl p-4 sm:p-6 border-2 border-[#22c55e]/40 shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-start gap-3 mb-4">
            <div className="bg-[#22c55e]/20 p-2 rounded-lg">
              <PartyPopper className="w-6 h-6 text-[#22c55e]" />
            </div>
            <div className="flex-1">
              <h4 className="text-white font-bold text-base sm:text-lg mb-1">
                Mandou bem, irmão!
              </h4>
              <p className="text-slate-300 text-sm">
                Essa operação bateu certinho! Você está no caminho certo.
              </p>
            </div>
          </div>

          <div className="bg-[#0b1220]/50 rounded-lg p-4 mb-4 border border-[#22c55e]/20">
            <p className="text-slate-300 text-sm leading-relaxed">
              <span className="text-[#22c55e] font-semibold">Continua assim!</span> Gestão de banca em dia, 
              disciplina nas entradas e sempre respeitando o stop loss. É assim que se constrói consistência no mercado.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={handleNewAnalysis}
              className="flex-1 bg-gradient-to-r from-[#22c55e] to-emerald-600 hover:from-[#22c55e]/90 hover:to-emerald-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg shadow-[#22c55e]/30 flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              Analisar Outro Gráfico
            </button>
          </div>
        </div>
      )}

      {showFeedback && feedbackType === "loss" && (
        <div className="bg-gradient-to-br from-amber-500/10 to-orange-600/10 backdrop-blur-xl rounded-xl p-4 sm:p-6 border-2 border-amber-500/40 shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-start gap-3 mb-4">
            <div className="bg-amber-500/20 p-2 rounded-lg">
              <Lightbulb className="w-6 h-6 text-amber-400" />
            </div>
            <div className="flex-1">
              <h4 className="text-white font-bold text-base sm:text-lg mb-1">
                Faz parte do jogo
              </h4>
              <p className="text-slate-300 text-sm">
                Nem toda operação vai bater. O importante é aprender e seguir em frente.
              </p>
            </div>
          </div>

          <div className="bg-[#0b1220]/50 rounded-lg p-4 mb-4 border border-amber-500/20">
            <p className="text-slate-300 text-sm mb-3">
              <span className="text-amber-400 font-semibold">Possíveis motivos:</span>
            </p>
            <ul className="space-y-2 text-slate-300 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-amber-400 mt-0.5">•</span>
                <span><strong>Delay de entrada:</strong> Timing pode ter sido afetado por latência</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 mt-0.5">•</span>
                <span><strong>Alta volatilidade:</strong> Mercado muito agitado no momento</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 mt-0.5">•</span>
                <span><strong>Horário ruim:</strong> Baixa liquidez ou notícias impactando</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 mt-0.5">•</span>
                <span><strong>Confirmação:</strong> Faltou validar em outros timeframes</span>
              </li>
            </ul>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 mb-4">
            <p className="text-amber-200 text-xs leading-relaxed flex items-start gap-2">
              <Lightbulb className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span><strong>Lembre-se:</strong> Até os melhores traders têm operações perdedoras. 
              O segredo está na gestão de risco e na consistência ao longo do tempo.</span>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={handleNewAnalysis}
              className="flex-1 bg-gradient-to-r from-[#38bdf8] to-cyan-600 hover:from-[#38bdf8]/90 hover:to-cyan-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg shadow-[#38bdf8]/30 flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              Analisar Outro Gráfico
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
