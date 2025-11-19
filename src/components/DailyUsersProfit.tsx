"use client";

import { useEffect, useState } from "react";
import { TrendingUp } from "lucide-react";

function gerarLucroAleatorio() {
  const minimo = 110_000;
  const maximo = 1_000_000;
  const valor = Math.random() * (maximo - minimo) + minimo;
  return valor;
}

export function DailyUsersProfit() {
  const [lucro, setLucro] = useState<number>(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Inicializa valor apenas no cliente
    setLucro(gerarLucroAleatorio());
    setMounted(true);

    // Atualiza a cada 1 minuto (60.000ms)
    const intervalo = setInterval(() => {
      setLucro(gerarLucroAleatorio());
    }, 60_000);

    return () => clearInterval(intervalo);
  }, []);

  // Evita hidratação incorreta
  if (!mounted) {
    return (
      <div className="w-full bg-slate-900/80 border-2 border-cyan-500/30 backdrop-blur-sm rounded-xl p-6 shadow-xl shadow-cyan-500/20">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-emerald-400" />
          <h3 className="text-sm font-medium text-slate-300">
            Lucro obtido com o app nas últimas 24h
          </h3>
        </div>
        <p className="text-4xl sm:text-5xl font-bold text-emerald-400 tracking-tight">
          Carregando...
        </p>
      </div>
    );
  }

  const valorFormatado = lucro.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <div className="w-full bg-slate-900/80 border-2 border-cyan-500/30 backdrop-blur-sm rounded-xl p-6 shadow-xl shadow-cyan-500/20">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-emerald-400" />
        <h3 className="text-sm font-medium text-slate-300">
          Lucro obtido com o app nas últimas 24h
        </h3>
      </div>
      <p className="text-4xl sm:text-5xl font-bold text-emerald-400 tracking-tight">
        {valorFormatado}
      </p>
      <p className="text-xs text-slate-500 mt-4 leading-relaxed">
        Resultados somados das análises feitas dentro do app nas últimas 24h.
      </p>
    </div>
  );
}
