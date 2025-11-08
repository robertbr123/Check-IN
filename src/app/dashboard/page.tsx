"use client"

import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Calendar, UserCheck, QrCode } from "lucide-react"
import { useEffect, useState } from "react"

interface DashboardStats {
  totalEvents: number
  totalParticipants: number
  totalCheckIns: number
  totalUsers: number
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<DashboardStats>({
    totalEvents: 0,
    totalParticipants: 0,
    totalCheckIns: 0,
    totalUsers: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/dashboard/stats")
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error)
    } finally {
      setLoading(false)
    }
  }

  const isAdmin = session?.user?.role === "ADMIN"

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-blue-900">Dashboard</h1>
        <p className="text-slate-600 mt-2">
          Bem-vindo, {session?.user?.name}! ({session?.user?.role})
        </p>
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
              {loading ? "..." : stats.totalEvents}
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
              {loading ? "..." : stats.totalParticipants}
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
              {loading ? "..." : stats.totalCheckIns}
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
                {loading ? "..." : stats.totalUsers}
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

              {session?.user?.role !== "OPERADOR" && (
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
                  {session?.user?.role !== "OPERADOR" && (
                    <>
                      <li>Gerenciar eventos e participantes</li>
                      <li>Visualizar relatórios</li>
                    </>
                  )}
                  {session?.user?.role === "ADMIN" && (
                    <li>Gerenciar usuários do sistema</li>
                  )}
                </ul>
              </div>

              <div className="pt-3 border-t border-slate-200">
                <p className="text-xs text-slate-500">
                  Sistema de Check-IN v1.0.0
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
