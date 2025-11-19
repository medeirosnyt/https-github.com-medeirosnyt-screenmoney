"use client";

import { useEffect, useState } from "react";
import { TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Componente compacto que exibe o lucro total nas últimas 24h
 * Design minimalista, mobile-first, focado em prova social discreta
 */
export function ProfitStats24hSection() {
  const [totalProfit, setTotalProfit] = useState<number>(0);

  // Gera valor aleatório entre 110.000 e 1.000.000 ao montar o componente
  useEffect(() => {
    const min = 110000;
    const max = 1000000;
    const randomProfit = Math.floor(Math.random() * (max - min + 1)) + min;
    setTotalProfit(randomProfit);
  }, []);

  // Formatação de valores em reais
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <Card className="w-full max-w-md mx-auto bg-gradient-to-br from-[#22c55e]/10 to-emerald-900/10 border-[#22c55e]/30 backdrop-blur-sm shadow-lg">
      <CardContent className="p-3 md:p-4">
        <div className="flex items-center gap-3">
          {/* Ícone */}
          <div className="p-2 bg-[#22c55e]/20 rounded-lg flex-shrink-0">
            <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-[#22c55e]" />
          </div>

          {/* Conteúdo */}
          <div className="flex-1 min-w-0">
            <p className="text-xs md:text-sm text-slate-400 mb-0.5">
              Lucro obtido com o app nas últimas 24h
            </p>
            <p className="text-xl md:text-2xl lg:text-3xl font-semibold text-slate-50 tracking-tight">
              {formatCurrency(totalProfit)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
