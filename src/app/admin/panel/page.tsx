"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ShieldCheck,
  Activity,
  Globe,
  User,
  RefreshCw,
  Loader2,
  CheckCircle2,
  AlertCircle,
  LogOut,
} from "lucide-react";

interface Stats {
  global: {
    total: number;
    limit: number;
    remaining: number;
    day: string;
  };
  ip: {
    count: number;
    limit: number;
    remaining: number;
    resetAt: number;
  } | null;
  totalIps: number;
  hasSuperAccess: boolean;
}

export default function AdminPanelPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const fetchStats = async () => {
    try {
      setError(null);
      const response = await fetch("/api/admin/status", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        cache: "no-store",
      });

      if (response.status === 401) {
        // Não autenticado, redireciona para login
        router.push("/admin");
        return;
      }

      const data = await response.json();
      
      // Verifica se há erro mas ainda assim usa os dados padrão retornados
      if (data.error) {
        console.warn("API retornou erro mas com dados padrão:", data.error);
      }
      
      setStats(data);
      setError(null);
    } catch (error) {
      console.error("Erro ao buscar estatísticas:", error);
      setError("Erro ao carregar estatísticas. Tentando novamente...");
      
      // Tenta novamente após 2 segundos
      setTimeout(() => {
        fetchStats();
      }, 2000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async () => {
    if (!confirm("Tem certeza que deseja resetar todos os limites?")) {
      return;
    }

    setIsResetting(true);
    setResetSuccess(false);

    try {
      const response = await fetch("/api/admin/reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      setResetSuccess(true);
      await fetchStats(); // Atualiza estatísticas
      setTimeout(() => setResetSuccess(false), 3000);
    } catch (error) {
      console.error("Erro ao resetar limites:", error);
      alert("Erro ao resetar limites. Tente novamente.");
    } finally {
      setIsResetting(false);
    }
  };

  const handleLogout = () => {
    // Remove cookie e redireciona
    document.cookie = "superAccess=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    router.push("/admin");
  };

  useEffect(() => {
    fetchStats();
    // Atualiza a cada 5 segundos
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  // Mostra erro se houver
  if (error && !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <Card className="border-red-500/50 bg-red-500/10 backdrop-blur-sm max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <AlertCircle className="w-12 h-12 text-red-400" />
              <div>
                <p className="text-red-400 font-semibold text-lg mb-2">
                  Erro de Conexão
                </p>
                <p className="text-red-300/70 text-sm mb-4">
                  {error}
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={fetchStats}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Tentar Novamente
                </Button>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="border-slate-700 bg-slate-800/50 text-white hover:bg-slate-700"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const globalPercentage = (stats.global.total / stats.global.limit) * 100;
  const ipPercentage = stats.ip ? (stats.ip.count / stats.ip.limit) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-blue-500" />
              Painel Administrativo
            </h1>
            <p className="text-slate-400 mt-1">
              Monitoramento de limites da API OpenAI
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={fetchStats}
              variant="outline"
              className="border-slate-700 bg-slate-800/50 text-white hover:bg-slate-700"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="border-red-700 bg-red-900/20 text-red-400 hover:bg-red-900/40"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>

        {/* Alerta de erro não crítico */}
        {error && stats && (
          <Card className="border-yellow-500/50 bg-yellow-500/10 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-yellow-400" />
                <div>
                  <p className="text-yellow-400 font-semibold">
                    Aviso
                  </p>
                  <p className="text-yellow-300/70 text-sm">
                    {error}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Status do Super Acesso */}
        {stats.hasSuperAccess && (
          <Card className="border-green-500/50 bg-green-500/10 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-green-400" />
                <div>
                  <p className="text-green-400 font-semibold">
                    Super Acesso Ativo
                  </p>
                  <p className="text-green-300/70 text-sm">
                    Você está ignorando todos os rate limits
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mensagem de Sucesso do Reset */}
        {resetSuccess && (
          <Card className="border-blue-500/50 bg-blue-500/10 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-blue-400" />
                <p className="text-blue-400 font-semibold">
                  Limites resetados com sucesso!
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Cards de Estatísticas */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Limite Global Diário */}
          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-500" />
                Limite Global Diário
              </CardTitle>
              <CardDescription className="text-slate-400">
                Total de requisições hoje ({stats.global.day})
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-4xl font-bold text-white">
                    {stats.global.total.toLocaleString()}
                  </p>
                  <p className="text-slate-400 text-sm">
                    de {stats.global.limit.toLocaleString()} requisições
                  </p>
                </div>
                <Badge
                  variant={globalPercentage > 80 ? "destructive" : "secondary"}
                  className="text-lg px-3 py-1"
                >
                  {globalPercentage.toFixed(1)}%
                </Badge>
              </div>

              {/* Barra de Progresso */}
              <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    globalPercentage > 80
                      ? "bg-red-500"
                      : globalPercentage > 60
                      ? "bg-yellow-500"
                      : "bg-green-500"
                  }`}
                  style={{ width: `${Math.min(globalPercentage, 100)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Restantes:</span>
                <span className="text-white font-semibold">
                  {stats.global.remaining.toLocaleString()}
                </span>
              </div>

              {globalPercentage > 80 && (
                <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/50 rounded-lg p-3">
                  <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                  <p className="text-red-400 text-sm">
                    Atenção: Limite diário próximo do máximo!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Limite por IP */}
          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <User className="w-5 h-5 text-cyan-500" />
                Seu IP (Rate Limit)
              </CardTitle>
              <CardDescription className="text-slate-400">
                Requisições por minuto do seu IP
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {stats.ip ? (
                <>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-4xl font-bold text-white">
                        {stats.ip.count}
                      </p>
                      <p className="text-slate-400 text-sm">
                        de {stats.ip.limit} requisições/min
                      </p>
                    </div>
                    <Badge
                      variant={ipPercentage > 80 ? "destructive" : "secondary"}
                      className="text-lg px-3 py-1"
                    >
                      {ipPercentage.toFixed(0)}%
                    </Badge>
                  </div>

                  {/* Barra de Progresso */}
                  <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        ipPercentage > 80
                          ? "bg-red-500"
                          : ipPercentage > 60
                          ? "bg-yellow-500"
                          : "bg-cyan-500"
                      }`}
                      style={{ width: `${Math.min(ipPercentage, 100)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Restantes:</span>
                    <span className="text-white font-semibold">
                      {stats.ip.remaining}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Reset em:</span>
                    <span className="text-white font-semibold">
                      {Math.ceil(
                        (stats.ip.resetAt - Date.now()) / 1000
                      )}s
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <Activity className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">Nenhuma requisição ainda</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Informações Adicionais */}
        <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-500" />
              Informações do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <span className="text-slate-400">Total de IPs únicos hoje:</span>
              <Badge variant="secondary" className="text-base">
                {stats.totalIps}
              </Badge>
            </div>
            <Separator className="bg-slate-700" />
            <div className="flex items-center justify-between py-2">
              <span className="text-slate-400">Limite por IP:</span>
              <span className="text-white font-semibold">
                5 requisições/minuto
              </span>
            </div>
            <Separator className="bg-slate-700" />
            <div className="flex items-center justify-between py-2">
              <span className="text-slate-400">Limite global:</span>
              <span className="text-white font-semibold">
                2000 requisições/dia
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Botão de Reset */}
        <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h3 className="text-white font-semibold mb-1">
                  Resetar Todos os Limites
                </h3>
                <p className="text-slate-400 text-sm">
                  Limpa todos os contadores em memória (global e por IP)
                </p>
              </div>
              <Button
                onClick={handleReset}
                disabled={isResetting}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold"
              >
                {isResetting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Resetando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Resetar Limites
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
