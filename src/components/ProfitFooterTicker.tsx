"use client";

import { useEffect, useState } from "react";
import { TrendingUp } from "lucide-react";

interface ProfitItem {
  name: string;
  amount: string;
}

/**
 * Rodapé fixo com carrossel de pessoas lucrando em tempo real
 * Design tecnológico/cripto com gradiente escuro
 * Responsivo: mobile (48-64px) e desktop (56-72px)
 */
export function ProfitFooterTicker() {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Lista de lucros mockados
  const profits: ProfitItem[] = [
    { name: "João Silva", amount: "R$ 2.347,89" },
    { name: "Maria Santos", amount: "R$ 15.823,12" },
    { name: "Carlos Ferreira", amount: "R$ 987,55" },
    { name: "Ana Costa", amount: "R$ 32.451,10" },
    { name: "Pedro Oliveira", amount: "R$ 8.234,67" },
    { name: "Juliana Lima", amount: "R$ 19.567,43" },
    { name: "Roberto Alves", amount: "R$ 5.432,21" },
    { name: "Fernanda Souza", amount: "R$ 27.891,56" },
  ];

  // Carrossel automático: troca a cada 6 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % profits.length);
    }, 6000); // 6 segundos

    return () => clearInterval(interval);
  }, [profits.length]);

  const currentProfit = profits[currentIndex];

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-t border-white/5 flex items-center justify-center px-3 sm:px-6 py-2 h-12 sm:h-14 md:h-16">
      {/* Conteúdo do carrossel com animação fade */}
      <div
        key={currentIndex}
        className="flex items-center gap-2 sm:gap-3 max-w-full animate-fade-in"
      >
        {/* Ícone de lucro */}
        <div className="rounded-full bg-white/5 p-1 sm:p-1.5 flex-shrink-0">
          <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-400" />
        </div>

        {/* Texto da notificação */}
        <p className="text-xs sm:text-sm text-white/80 truncate">
          <span className="font-semibold text-white">{currentProfit.name}</span>{" "}
          acabou de lucrar{" "}
          <span className="font-bold text-emerald-400">{currentProfit.amount}</span>{" "}
          usando o app
        </p>
      </div>
    </div>
  );
}
