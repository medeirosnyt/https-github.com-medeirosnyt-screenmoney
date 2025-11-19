"use client";

import { useEffect, useState, useRef } from "react";
import { TrendingUp, X } from "lucide-react";

interface ProfitNotification {
  id: string;
  name: string;
  city: string;
  country: string;
  profit: number;
  timestamp: number;
}

// Nomes brasileiros comuns (primeiros nomes)
const BRAZILIAN_FIRST_NAMES = [
  "João", "Maria", "Carlos", "Ana", "Felipe", "Juliana",
  "Lucas", "Fernanda", "Pedro", "Camila", "Rafael", "Beatriz",
  "Gustavo", "Larissa", "Bruno", "Mariana", "Thiago", "Amanda",
  "Diego", "Gabriela", "Rodrigo", "Letícia", "Matheus", "Isabela",
  "Gabriel", "Carolina", "Leonardo", "Patrícia", "Vinicius", "Renata"
];

// Sobrenomes comuns (apenas inicial)
const LAST_NAME_INITIALS = [
  "S.", "M.", "A.", "O.", "P.", "R.", "F.", "C.", "L.", "N.",
  "B.", "G.", "T.", "D.", "V.", "H.", "J.", "K.", "W.", "Z."
];

// Cidades brasileiras principais
const BRAZILIAN_CITIES = [
  "São Paulo", "Rio de Janeiro", "Belo Horizonte", "Curitiba",
  "Porto Alegre", "Brasília", "Salvador", "Fortaleza",
  "Recife", "Manaus", "Goiânia", "Florianópolis",
  "Campinas", "Santos", "Vitória", "Natal"
];

// Variações de mensagens persuasivas (usando placeholders)
const MESSAGE_TEMPLATES = [
  { before: "", name: true, middle: " acabou de lucrar ", amount: true, after: " usando o app." },
  { before: "", name: true, middle: " lucrou ", amount: true, after: " agora com o nosso app." },
  { before: "", name: true, middle: " fez ", amount: true, after: " de lucro com análise do app." },
  { before: "", name: true, middle: " bateu ", amount: true, after: " usando o app agora mesmo." },
  { before: "", name: true, middle: " acabou de ganhar ", amount: true, after: " com o app." },
  { before: "", name: true, middle: " lucrou ", amount: true, after: " após análise no app." }
];

// Finais de centavos realistas
const REALISTIC_CENTS = [0, 50, 90, 99, 25, 75, 10, 20, 30, 40, 60, 70, 80, 95, 15, 35, 45, 55, 65, 85];

function generateRealisticProfit(): number {
  // 60% dos valores entre R$ 90 e R$ 1.500
  // 30% dos valores entre R$ 1.500 e R$ 5.000
  // 10% dos valores entre R$ 5.000 e R$ 10.000
  
  const random = Math.random();
  let amount: number;
  
  if (random < 0.6) {
    // 60% - valores baixos a médios (mais comum)
    amount = Math.random() * (1500 - 90) + 90;
  } else if (random < 0.9) {
    // 30% - valores médios a altos
    amount = Math.random() * (5000 - 1500) + 1500;
  } else {
    // 10% - valores altos
    amount = Math.random() * (10000 - 5000) + 5000;
  }
  
  // Arredondar para inteiro e adicionar centavos realistas
  const integerPart = Math.floor(amount);
  const cents = REALISTIC_CENTS[Math.floor(Math.random() * REALISTIC_CENTS.length)];
  
  const result = integerPart + (cents / 100);
  
  // Garantir que sempre retorna um número válido
  return isNaN(result) || !isFinite(result) ? 150.00 : result;
}

function formatProfit(profit: number | undefined | null): string {
  // Validação defensiva: garantir que profit é um número válido
  const validProfit = typeof profit === 'number' && isFinite(profit) && !isNaN(profit) 
    ? profit 
    : 150.00; // valor padrão caso algo dê errado
  
  return validProfit.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function generateNotification(): ProfitNotification {
  const firstName = BRAZILIAN_FIRST_NAMES[Math.floor(Math.random() * BRAZILIAN_FIRST_NAMES.length)];
  const lastInitial = LAST_NAME_INITIALS[Math.floor(Math.random() * LAST_NAME_INITIALS.length)];
  const name = `${firstName} ${lastInitial}`;
  
  const city = BRAZILIAN_CITIES[Math.floor(Math.random() * BRAZILIAN_CITIES.length)];
  const country = "Brasil";
  
  const profit = generateRealisticProfit();
  
  return {
    id: `${Date.now()}-${Math.random()}`,
    name,
    city,
    country,
    profit,
    timestamp: Date.now()
  };
}

export function ProfitNotifications() {
  const [notifications, setNotifications] = useState<ProfitNotification[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const removalTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  useEffect(() => {
    // Função para adicionar nova notificação
    const addNotification = () => {
      const newNotification = generateNotification();
      
      setNotifications(prev => {
        // Manter máximo de 2 notificações simultâneas
        const updated = [...prev, newNotification];
        if (updated.length > 2) {
          const removed = updated.shift();
          // Limpar timeout de remoção da notificação que foi removida manualmente
          if (removed) {
            const timeout = removalTimeoutsRef.current.get(removed.id);
            if (timeout) {
              clearTimeout(timeout);
              removalTimeoutsRef.current.delete(removed.id);
            }
          }
        }
        return updated;
      });

      // Agendar remoção automática desta notificação após 5-7 segundos
      const removalDelay = Math.random() * (7000 - 5000) + 5000;
      const removalTimeout = setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
        removalTimeoutsRef.current.delete(newNotification.id);
      }, removalDelay);
      
      removalTimeoutsRef.current.set(newNotification.id, removalTimeout);

      // Agendar próxima notificação com pausa randomizada entre 20-40 segundos
      const nextDelay = Math.random() * (40000 - 20000) + 20000;
      timeoutRef.current = setTimeout(addNotification, nextDelay);
    };

    // Iniciar primeira notificação após 5 segundos
    timeoutRef.current = setTimeout(addNotification, 5000);

    // Cleanup: limpar todos os timers ao desmontar
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      // Limpar todos os timers de remoção
      removalTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      removalTimeoutsRef.current.clear();
    };
  }, []); // Executar apenas uma vez na montagem

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    // Limpar timeout de remoção automática
    const timeout = removalTimeoutsRef.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      removalTimeoutsRef.current.delete(id);
    }
  };

  return (
    <div className="fixed bottom-4 right-2 sm:right-4 z-40 flex flex-col gap-2 pointer-events-none max-w-[90%] sm:max-w-[320px]">
      {notifications.map((notification, index) => {
        // Escolher template de mensagem aleatório
        const template = MESSAGE_TEMPLATES[Math.floor(Math.random() * MESSAGE_TEMPLATES.length)];
        const formattedProfit = formatProfit(notification.profit);
        
        return (
          <div
            key={notification.id}
            className="pointer-events-auto animate-slide-in-right"
            style={{
              animationDelay: `${index * 50}ms`
            }}
          >
            <div className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-xl border border-emerald-500/30 rounded-xl shadow-2xl shadow-emerald-500/20 p-3">
              <div className="flex items-start gap-2.5">
                {/* Ícone de lucro com destaque */}
                <div className="flex-shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500/20 to-green-500/20 border border-emerald-400/50 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <TrendingUp className="w-5 h-5 text-emerald-400" strokeWidth={2.5} />
                </div>

                {/* Conteúdo principal */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      {/* Mensagem principal com destaque no valor */}
                      <p className="text-white font-semibold text-sm leading-snug mb-1">
                        {template.before}
                        {template.name && notification.name}
                        {template.middle}
                        <span className="text-emerald-400 font-bold">
                          {formattedProfit}
                        </span>
                        {template.after}
                      </p>
                      
                      {/* Localização */}
                      <p className="text-slate-400 text-xs font-medium">
                        📍 {notification.city}, {notification.country}
                      </p>
                      
                      {/* Linha de credibilidade */}
                      <p className="text-slate-500 text-[10px] mt-1 italic">
                        Análise feita automaticamente pelo app
                      </p>
                    </div>

                    {/* Botão fechar */}
                    <button
                      onClick={() => removeNotification(notification.id)}
                      className="flex-shrink-0 text-slate-500 hover:text-white transition-colors duration-200 -mt-0.5"
                      aria-label="Fechar notificação"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Barra de progresso animada */}
              <div className="mt-2 h-1 bg-slate-700/50 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 via-green-400 to-emerald-500 animate-progress-bar shadow-lg shadow-emerald-500/50"
                  style={{
                    animationDuration: "6000ms"
                  }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
