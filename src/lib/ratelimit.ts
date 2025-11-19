/**
 * Sistema de Rate Limiting em Memória (sem banco de dados)
 * 
 * Gerencia limites de requisições por IP e global diário
 * para proteger custos da API da OpenAI
 */

type IpBucket = {
  count: number;
  resetAt: number;
};

type GlobalLimit = {
  total: number;
  day: string;
};

class RateLimiter {
  // Map para armazenar contadores por IP
  ipMap: Map<string, IpBucket> = new Map();
  
  // Contador global diário
  global: GlobalLimit = { total: 0, day: "" };

  // Configurações
  readonly IP_LIMIT = 5; // 5 requisições por minuto por IP
  readonly IP_WINDOW = 60_000; // 1 minuto em ms
  readonly GLOBAL_DAILY_LIMIT = 2000; // 2000 requisições por dia

  constructor() {
    const today = new Date().toISOString().slice(0, 10);
    this.global.day = today;
  }

  /**
   * Verifica se é um novo dia e reseta contadores se necessário
   */
  resetIfNewDay(): void {
    const today = new Date().toISOString().slice(0, 10);
    if (today !== this.global.day) {
      console.log(`[RateLimiter] Novo dia detectado. Resetando contadores. Anterior: ${this.global.day}, Novo: ${today}`);
      this.global.day = today;
      this.global.total = 0;
      this.ipMap.clear();
    }
  }

  /**
   * Verifica se o IP atingiu o limite de requisições
   * @param ip - Endereço IP do cliente
   * @returns true se dentro do limite, false se excedeu
   */
  checkIpLimit(ip: string): { allowed: boolean; remaining: number; resetAt: number } {
    const now = Date.now();
    let bucket = this.ipMap.get(ip);

    // Se não existe bucket ou o tempo expirou, cria/reseta
    if (!bucket || now > bucket.resetAt) {
      bucket = {
        count: 0,
        resetAt: now + this.IP_WINDOW,
      };
      this.ipMap.set(ip, bucket);
    }

    // Incrementa contador
    bucket.count++;

    const allowed = bucket.count <= this.IP_LIMIT;
    const remaining = Math.max(0, this.IP_LIMIT - bucket.count);

    return {
      allowed,
      remaining,
      resetAt: bucket.resetAt,
    };
  }

  /**
   * Verifica se o limite global diário foi atingido
   * @returns true se dentro do limite, false se excedeu
   */
  checkGlobalLimit(): { allowed: boolean; remaining: number } {
    const allowed = this.global.total < this.GLOBAL_DAILY_LIMIT;
    const remaining = Math.max(0, this.GLOBAL_DAILY_LIMIT - this.global.total);

    return {
      allowed,
      remaining,
    };
  }

  /**
   * Incrementa o contador global
   */
  incrementGlobal(): void {
    this.global.total++;
  }

  /**
   * Obtém estatísticas atuais
   */
  getStats(ip?: string) {
    const globalRemaining = Math.max(0, this.GLOBAL_DAILY_LIMIT - this.global.total);
    
    let ipStats = null;
    if (ip) {
      const bucket = this.ipMap.get(ip);
      if (bucket && Date.now() <= bucket.resetAt) {
        ipStats = {
          count: bucket.count,
          limit: this.IP_LIMIT,
          remaining: Math.max(0, this.IP_LIMIT - bucket.count),
          resetAt: bucket.resetAt,
        };
      } else {
        ipStats = {
          count: 0,
          limit: this.IP_LIMIT,
          remaining: this.IP_LIMIT,
          resetAt: Date.now() + this.IP_WINDOW,
        };
      }
    }

    return {
      global: {
        total: this.global.total,
        limit: this.GLOBAL_DAILY_LIMIT,
        remaining: globalRemaining,
        day: this.global.day,
      },
      ip: ipStats,
      totalIps: this.ipMap.size,
    };
  }

  /**
   * Reseta todos os contadores (apenas para admin)
   */
  resetAll(): void {
    console.log("[RateLimiter] Reset manual executado pelo admin");
    this.global.total = 0;
    this.ipMap.clear();
  }
}

// Singleton - instância única compartilhada
export const limiter = new RateLimiter();
