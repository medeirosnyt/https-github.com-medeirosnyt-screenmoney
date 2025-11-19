"use client";

import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

// Lista de nomes brasileiros realistas
const BRAZILIAN_NAMES = [
  "João", "Maria", "Pedro", "Ana", "Carlos", "Juliana", "Lucas", "Fernanda",
  "Rafael", "Camila", "Bruno", "Beatriz", "Felipe", "Larissa", "Gustavo",
  "Amanda", "Thiago", "Gabriela", "Rodrigo", "Mariana", "Diego", "Letícia",
  "Matheus", "Isabela", "Vinicius", "Natália", "Leonardo", "Carolina"
];

// Lista de cidades brasileiras
const BRAZILIAN_CITIES = [
  "SP", "RJ", "BH", "Curitiba", "Porto Alegre", "Salvador", "Brasília",
  "Fortaleza", "Recife", "Manaus", "Belém", "Goiânia", "Campinas"
];

// Gera valor aleatório entre R$ 90 e R$ 10.000 com centavos
const generateRandomProfit = () => {
  const min = 90;
  const max = 10000;
  const value = Math.random() * (max - min) + min;
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

// Gera mensagem aleatória de lucro
const generateProfitMessage = () => {
  const name = BRAZILIAN_NAMES[Math.floor(Math.random() * BRAZILIAN_NAMES.length)];
  const city = BRAZILIAN_CITIES[Math.floor(Math.random() * BRAZILIAN_CITIES.length)];
  const profit = generateRandomProfit();
  
  const templates = [
    `${name} de ${city} acabou de lucrar ${profit}`,
    `${name} bateu meta com ${profit} agora há pouco`,
    `${name} fechou operação com ${profit} de lucro`,
    `${name} (${city}) lucrou ${profit} usando o app`
  ];
  
  return templates[Math.floor(Math.random() * templates.length)];
};

export function FixedFooter() {
  const [tickerMessage, setTickerMessage] = useState("");
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Gera primeira mensagem após montagem
    setTickerMessage(generateProfitMessage());
    setIsVisible(true);

    // Atualiza mensagem a cada 6-12 segundos
    const interval = setInterval(() => {
      setIsVisible(false);
      
      setTimeout(() => {
        setTickerMessage(generateProfitMessage());
        setIsVisible(true);
      }, 300); // Tempo da animação de fade out
      
    }, Math.random() * 6000 + 6000); // 6-12 segundos

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed bottom-0 inset-x-0 z-50">
      {/* Mini Ticker de Prova Social */}
      <div className="bg-[#0b1220]/95 backdrop-blur-md border-t border-white/10 py-2">
        <div 
          className={`text-center text-xs sm:text-sm text-slate-300 transition-opacity duration-300 ${
            isVisible ? "opacity-100" : "opacity-0"
          }`}
        >
          💰 {tickerMessage}
        </div>
      </div>

      {/* Botão Fixo CTA */}
      <div className="bg-gradient-to-r from-orange-600 via-orange-500 to-amber-600 p-3 shadow-2xl shadow-orange-500/50">
        <Button 
          asChild 
          className="w-full py-4 text-base sm:text-lg font-bold bg-white hover:bg-slate-100 text-orange-600 shadow-xl transition-all duration-300 transform hover:scale-[1.02] border-2 border-orange-300"
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
    </div>
  );
}
