"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Calendar, UserCheck, QrCode, RefreshCw, Clock } from "lucide-react"
import { useRealtimeStats } from "@/hooks/useRealtimeStats"

export default function DashboardPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const { stats, loading, lastUpdate, refresh } = useRealtimeStats(10000) // Atualiza a cada 10 segundos

  // Redirecionar OPERADOR para o scanner
  useEffect(() => {
    if (session?.user?.role === "OPERADOR") {
      router.push("/dashboard/scanner")
    }
  }, [session, router])

  const isAdmin = session?.user?.role === "ADMIN"
  const isOperador = session?.user?.role === "OPERADOR"
  
  // Se for operador, não renderizar nada (está redirecionando)
  if (isOperador) {
    return null
  }
  
  const formatLastUpdate = () => {
    if (!lastUpdate) return "Nunca"
    const seconds = Math.floor((new Date().getTime() - lastUpdate.getTime()) / 1000)
    if (seconds < 10) return "Agora mesmo"
    if (seconds < 60) return `${seconds}s atrás`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}min atrás`
    return lastUpdate.toLocaleTimeString("pt-BR")
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-blue-900">Dashboard</h1>
          <p className="text-slate-600 mt-2">
            Bem-vindo, {session?.user?.name}! ({session?.user?.role})
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="gap-2">
            <Clock className="w-3 h-3" />
            Atualizado {formatLastUpdate()}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-600">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Eventos</CardTitle>
            <Calendar className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900">
              {loading ? "..." : stats?.totalEvents || 0}
            </div>
            <p className="text-xs text-slate-500 mt-1">Eventos cadastrados</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-600">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Participantes</CardTitle>
            <UserCheck className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-900">
              {loading ? "..." : stats?.totalParticipants || 0}
            </div>
            <p className="text-xs text-slate-500 mt-1">Participantes ativos</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-600">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Check-ins</CardTitle>
            <QrCode className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-900">
              {loading ? "..." : stats?.totalCheckIns || 0}
            </div>
            <p className="text-xs text-slate-500 mt-1">Check-ins realizados</p>
          </CardContent>
        </Card>

        {isAdmin && (
          <Card className="border-l-4 border-l-orange-600">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usuários</CardTitle>
              <Users className="h-5 w-5 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-900">
                {loading ? "..." : stats?.totalUsers || 0}
              </div>
              <p className="text-xs text-slate-500 mt-1">Usuários do sistema</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
            <CardDescription>Acesso rápido às funcionalidades principais</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <a
                href="/dashboard/scanner"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-50 transition-colors border border-slate-200"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <QrCode className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">Scanner de QR Code</p>
                  <p className="text-sm text-slate-500">Fazer check-in/out de participantes</p>
                </div>
              </a>

              {!isOperador && (
                <>
                  <a
                    href="/dashboard/events"
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-50 transition-colors border border-slate-200"
                  >
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">Gerenciar Eventos</p>
                      <p className="text-sm text-slate-500">Criar e editar eventos</p>
                    </div>
                  </a>

                  <a
                    href="/dashboard/participants"
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-50 transition-colors border border-slate-200"
                  >
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <UserCheck className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">Gerenciar Participantes</p>
                      <p className="text-sm text-slate-500">Cadastrar participantes</p>
                    </div>
                  </a>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sobre o Sistema</CardTitle>
            <CardDescription>Informações e recursos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm text-slate-600">
              <div>
                <p className="font-medium text-slate-900 mb-1">Seu Nível de Acesso:</p>
                <div className="inline-flex px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                  {session?.user?.role}
                </div>
              </div>

              <div>
                <p className="font-medium text-slate-900 mb-1">Permissões:</p>
                <ul className="list-disc list-inside space-y-1 text-slate-600">
                  <li>Usar scanner de QR code</li>
                  {!isOperador && (
                    <>
                      <li>Gerenciar eventos e participantes</li>
                      <li>Visualizar relatórios</li>
                    </>
                  )}
                  {isAdmin && (
                    <li>Gerenciar usuários do sistema</li>
                  )}
                </ul>
              </div>

              <div className="pt-3 border-t border-slate-200">
                <p className="text-xs text-slate-500">
                  Sistema de Check-ON v1.0.0
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
