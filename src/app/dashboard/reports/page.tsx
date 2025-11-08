"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Download, FileSpreadsheet, Users, UserCheck, Clock } from "lucide-react"
import * as XLSX from "xlsx"

interface Event {
  id: string
  name: string
}

interface ReportData {
  participant: {
    name: string
    email: string
    phone: string | null
    company: string | null
  }
  checkIns: {
    checkInTime: string
    checkOutTime: string | null
    status: string
  }[]
  totalCheckIns: number
}

interface Stats {
  totalParticipants: number
  checkedIn: number
  checkedOut: number
  presenceRate: number
}

export default function ReportsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [selectedEvent, setSelectedEvent] = useState<string>("")
  const [reportData, setReportData] = useState<ReportData[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchEvents()
  }, [])

  useEffect(() => {
    if (selectedEvent) {
      fetchReport()
    }
  }, [selectedEvent])

  const fetchEvents = async () => {
    try {
      const response = await fetch("/api/events")
      if (response.ok) {
        const data = await response.json()
        setEvents(data)
      }
    } catch (error) {
      console.error("Erro ao carregar eventos:", error)
    }
  }

  const fetchReport = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/reports/${selectedEvent}`)
      if (response.ok) {
        const data = await response.json()
        setReportData(data.participants)
        setStats(data.stats)
      }
    } catch (error) {
      console.error("Erro ao carregar relatório:", error)
    } finally {
      setLoading(false)
    }
  }

  const exportToExcel = () => {
    if (reportData.length === 0) return

    // Prepara os dados para exportação
    const excelData = reportData.flatMap((item) => {
      if (item.checkIns.length === 0) {
        return [
          {
            Nome: item.participant.name,
            Email: item.participant.email,
            Telefone: item.participant.phone || "-",
            Empresa: item.participant.company || "-",
            "Check-in": "-",
            "Check-out": "-",
            Status: "Sem check-in",
          },
        ]
      }

      return item.checkIns.map((checkIn) => ({
        Nome: item.participant.name,
        Email: item.participant.email,
        Telefone: item.participant.phone || "-",
        Empresa: item.participant.company || "-",
        "Check-in": new Date(checkIn.checkInTime).toLocaleString("pt-BR"),
        "Check-out": checkIn.checkOutTime
          ? new Date(checkIn.checkOutTime).toLocaleString("pt-BR")
          : "-",
        Status: checkIn.status === "CHECKED_IN" ? "Presente" : "Saiu",
      }))
    })

    // Cria a planilha
    const ws = XLSX.utils.json_to_sheet(excelData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Relatório")

    // Define largura das colunas
    ws["!cols"] = [
      { wch: 25 }, // Nome
      { wch: 30 }, // Email
      { wch: 15 }, // Telefone
      { wch: 20 }, // Empresa
      { wch: 20 }, // Check-in
      { wch: 20 }, // Check-out
      { wch: 15 }, // Status
    ]

    // Salva o arquivo
    const eventName = events.find((e) => e.id === selectedEvent)?.name || "evento"
    XLSX.writeFile(wb, `relatorio-${eventName.replace(/\s/g, "-")}.xlsx`)
  }

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-blue-900">Relatórios</h1>
          <p className="text-slate-600 mt-2">
            Visualize e exporte relatórios de presença dos eventos
          </p>
        </div>
      </div>

      {/* Event Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Selecionar Evento</CardTitle>
          <CardDescription>Escolha o evento para visualizar o relatório</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Select value={selectedEvent} onValueChange={setSelectedEvent}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Selecione um evento" />
              </SelectTrigger>
              <SelectContent>
                {events.map((event) => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={exportToExcel}
              disabled={!selectedEvent || reportData.length === 0}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Exportar Excel
            </Button>
          </div>
        </CardContent>
      </Card>

      {selectedEvent && stats && (
        <>
          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Participantes</CardTitle>
                <Users className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalParticipants}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Check-ins</CardTitle>
                <UserCheck className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.checkedIn}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Check-outs</CardTitle>
                <Clock className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{stats.checkedOut}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taxa de Presença</CardTitle>
                <FileSpreadsheet className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {stats.presenceRate.toFixed(1)}%
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Report Table */}
          <Card>
            <CardHeader>
              <CardTitle>Detalhes de Presença</CardTitle>
              <CardDescription>
                Lista completa de participantes e seus check-ins
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-center py-8 text-slate-500">Carregando...</p>
              ) : reportData.length === 0 ? (
                <p className="text-center py-8 text-slate-500">
                  Nenhum participante cadastrado para este evento
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Participante</TableHead>
                      <TableHead>Contato</TableHead>
                      <TableHead>Empresa</TableHead>
                      <TableHead>Check-ins</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{item.participant.name}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p>{item.participant.email}</p>
                            {item.participant.phone && (
                              <p className="text-slate-500">{item.participant.phone}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {item.participant.company || (
                            <span className="text-slate-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {item.checkIns.length === 0 ? (
                            <span className="text-slate-400">Nenhum</span>
                          ) : (
                            <div className="space-y-2">
                              {item.checkIns.map((checkIn, idx) => (
                                <div
                                  key={idx}
                                  className="text-sm bg-slate-50 p-2 rounded border border-slate-200"
                                >
                                  <p className="font-medium text-green-600">
                                    ↓ {formatDateTime(checkIn.checkInTime)}
                                  </p>
                                  {checkIn.checkOutTime && (
                                    <p className="font-medium text-orange-600">
                                      ↑ {formatDateTime(checkIn.checkOutTime)}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {item.checkIns.length === 0 ? (
                            <Badge variant="secondary">Sem check-in</Badge>
                          ) : item.checkIns[item.checkIns.length - 1].status === "CHECKED_IN" ? (
                            <Badge variant="success">Presente</Badge>
                          ) : (
                            <Badge variant="warning">Saiu</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {!selectedEvent && (
        <Card>
          <CardContent className="text-center py-12">
            <FileSpreadsheet className="w-16 h-16 mx-auto text-slate-400 mb-4" />
            <p className="text-slate-600 text-lg mb-2">Selecione um evento</p>
            <p className="text-slate-500">
              Escolha um evento acima para visualizar o relatório de presença
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
