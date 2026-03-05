"use client"

import { useEffect, useState, useMemo } from "react"
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
import { Download, FileSpreadsheet, Users, UserCheck, Clock, FileText, Filter, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import * as XLSX from "xlsx"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { formatDateTime } from "@/lib/utils"

interface Event {
  id: string
  name: string
  deletedAt: string | null
  startDate: string
  endDate: string
}

interface ReportData {
  participant: {
    name: string
    email: string
    cpf: string
    phone: string | null
    company: string | null
    position: string | null
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
  
  // Filtros
  const [companyFilter, setCompanyFilter] = useState<string>("all")
  const [cargoFilter, setCargoFilter] = useState<string>("all")
  const [participantFilter, setParticipantFilter] = useState<string>("all")

  useEffect(() => {
    fetchEvents()
  }, [])

  useEffect(() => {
    if (selectedEvent) {
      fetchReport()
      // Limpar filtros ao trocar de evento
      setCompanyFilter("all")
      setCargoFilter("all")
      setParticipantFilter("all")
    }
  }, [selectedEvent])

  // Lista de empresas únicas
  const uniqueCompanies = useMemo(() => {
    const companies = reportData
      .map((item) => item.participant.company)
      .filter((company): company is string => !!company)
    return Array.from(new Set(companies)).sort()
  }, [reportData])

  // Lista de cargos únicos
  const uniqueCargos = useMemo(() => {
    const cargos = reportData
      .map((item) => item.participant.position)
      .filter((position): position is string => !!position)
    return Array.from(new Set(cargos)).sort()
  }, [reportData])

  // Lista de participantes (filtrada por empresa e cargo se selecionados)
  const filteredParticipants = useMemo(() => {
    let participants = reportData
    if (companyFilter !== "all") {
      participants = participants.filter(
        (item) => item.participant.company === companyFilter
      )
    }
    if (cargoFilter !== "all") {
      participants = participants.filter(
        (item) => item.participant.position === cargoFilter
      )
    }
    return participants.map((item) => ({
      name: item.participant.name,
      email: item.participant.email,
    })).sort((a, b) => a.name.localeCompare(b.name))
  }, [reportData, companyFilter, cargoFilter])

  // Dados filtrados
  const filteredData = useMemo(() => {
    let data = reportData
    
    if (companyFilter !== "all") {
      data = data.filter((item) => item.participant.company === companyFilter)
    }

    if (cargoFilter !== "all") {
      data = data.filter((item) => item.participant.position === cargoFilter)
    }
    
    if (participantFilter !== "all") {
      data = data.filter((item) => item.participant.email === participantFilter)
    }
    
    return data
  }, [reportData, companyFilter, cargoFilter, participantFilter])

  // Estatísticas filtradas
  const filteredStats = useMemo(() => {
    if (!stats || filteredData.length === 0) return null
    
    const totalParticipants = filteredData.length
    const participantsWithCheckIn = filteredData.filter(
      (item) => item.checkIns.length > 0
    ).length
    const checkedIn = filteredData.filter(
      (item) => item.checkIns.length > 0 && item.checkIns[0].status === "CHECKED_IN"
    ).length
    const checkedOut = filteredData.filter(
      (item) => item.checkIns.length > 0 && item.checkIns[0].status === "CHECKED_OUT"
    ).length
    const presenceRate = totalParticipants > 0
      ? (participantsWithCheckIn / totalParticipants) * 100
      : 0

    return {
      totalParticipants,
      checkedIn,
      checkedOut,
      presenceRate,
    }
  }, [filteredData, stats])

  // Limpar filtro de participante quando a empresa ou cargo muda
  useEffect(() => {
    setParticipantFilter("all")
  }, [companyFilter, cargoFilter])

  const fetchEvents = async () => {
    try {
      // Incluir eventos deletados para permitir visualização de relatórios históricos
      const response = await fetch("/api/events?includeDeleted=true")
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
    if (filteredData.length === 0) return

    // Prepara os dados para exportação
    const excelData = filteredData.flatMap((item) => {
      if (item.checkIns.length === 0) {
        return [
          {
            Nome: item.participant.name,
            CPF: item.participant.cpf || "-",
            Email: item.participant.email,
            Telefone: item.participant.phone || "-",
            Empresa: item.participant.company || "-",
            Cargo: item.participant.position || "-",
            "Check-in": "-",
            "Check-out": "-",
            Status: "Sem check-in",
          },
        ]
      }

      return item.checkIns.map((checkIn) => ({
        Nome: item.participant.name,
        CPF: item.participant.cpf || "-",
        Email: item.participant.email,
        Telefone: item.participant.phone || "-",
        Empresa: item.participant.company || "-",
        Cargo: item.participant.position || "-",
        "Check-in": formatDateTime(checkIn.checkInTime),
        "Check-out": checkIn.checkOutTime
          ? formatDateTime(checkIn.checkOutTime)
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
      { wch: 18 }, // CPF
      { wch: 30 }, // Email
      { wch: 15 }, // Telefone
      { wch: 20 }, // Empresa
      { wch: 20 }, // Cargo
      { wch: 20 }, // Check-in
      { wch: 20 }, // Check-out
      { wch: 15 }, // Status
    ]

    // Salva o arquivo
    const eventName = events.find((e) => e.id === selectedEvent)?.name || "evento"
    XLSX.writeFile(wb, `relatorio-${eventName.replace(/\s/g, "-")}.xlsx`)
  }

  const exportToPDF = async () => {
    if (filteredData.length === 0 || !filteredStats) return

    const eventName = events.find((e) => e.id === selectedEvent)?.name || "Evento"
    
    // Buscar configurações do sistema
    let settings: any = null
    try {
      const response = await fetch("/api/settings")
      if (response.ok) {
        settings = await response.json()
      }
    } catch (error) {
      console.error("Erro ao carregar configurações:", error)
    }

    // Criar PDF em orientação horizontal (landscape)
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    })

    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    let yPosition = 15

    // ===== CABEÇALHO COM LOGO E INFORMAÇÕES DO SISTEMA =====
    
    // Adicionar logo se existir
    if (settings?.logoUrl) {
      try {
        // Tentar carregar e adicionar o logo
        const img = new Image()
        img.crossOrigin = "Anonymous"
        img.src = settings.logoUrl
        
        await new Promise((resolve) => {
          img.onload = () => {
            doc.addImage(img, "PNG", 15, yPosition, 25, 25)
            resolve(true)
          }
          img.onerror = () => resolve(false)
        })
      } catch (error) {
        console.error("Erro ao carregar logo:", error)
      }
    }

    // Nome do Sistema e Título
    doc.setFontSize(20)
    doc.setTextColor(37, 99, 235) // Azul
    doc.setFont("helvetica", "bold")
    doc.text(settings?.systemName || "Check-IN System", 45, yPosition + 8)

    doc.setFontSize(16)
    doc.setTextColor(0, 0, 0)
    doc.text("Relatório de Presença", 45, yPosition + 16)

    // Linha decorativa abaixo do cabeçalho
    doc.setDrawColor(37, 99, 235)
    doc.setLineWidth(0.5)
    doc.line(15, yPosition + 28, pageWidth - 15, yPosition + 28)

    yPosition = yPosition + 35

    // ===== INFORMAÇÕES DO EVENTO =====
    const selectedEventData = events.find(e => e.id === selectedEvent)
    const isArchived = selectedEventData?.deletedAt !== null
    
    doc.setFontSize(14)
    doc.setTextColor(37, 99, 235)
    doc.setFont("helvetica", "bold")
    doc.text("Evento:", 15, yPosition)
    
    doc.setTextColor(0, 0, 0)
    doc.setFont("helvetica", "normal")
    doc.text(eventName, 35, yPosition)
    
    // Badge de evento arquivado
    if (isArchived) {
      doc.setFontSize(10)
      doc.setTextColor(100, 100, 100)
      doc.text("(ARQUIVADO)", 35 + doc.getTextWidth(eventName) + 3, yPosition)
    }

    yPosition += 8

    // Data de geração
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text(`Gerado em: ${formatDateTime(new Date().toISOString())}`, 15, yPosition)

    yPosition += 10

    // ===== ESTATÍSTICAS EM CARDS =====
    const cardWidth = (pageWidth - 50) / 4
    const cardHeight = 18
    const cardStartY = yPosition
    const cardSpacing = 5

    // Array de estatísticas
    const statsCards = [
      {
        label: "Total de Participantes",
        value: filteredStats.totalParticipants.toString(),
        color: [37, 99, 235], // Azul
      },
      {
        label: "Check-ins Realizados",
        value: filteredStats.checkedIn.toString(),
        color: [34, 197, 94], // Verde
      },
      {
        label: "Check-outs Realizados",
        value: filteredStats.checkedOut.toString(),
        color: [249, 115, 22], // Laranja
      },
      {
        label: "Taxa de Presença",
        value: `${filteredStats.presenceRate.toFixed(1)}%`,
        color: [168, 85, 247], // Roxo
      },
    ]

    // Desenhar cards de estatísticas
    statsCards.forEach((stat, index) => {
      const x = 15 + (cardWidth + cardSpacing) * index

      // Fundo do card com borda
      doc.setFillColor(250, 250, 250)
      doc.setDrawColor(220, 220, 220)
      doc.setLineWidth(0.3)
      doc.roundedRect(x, cardStartY, cardWidth, cardHeight, 2, 2, "FD")

      // Barra colorida no topo do card
      doc.setFillColor(stat.color[0], stat.color[1], stat.color[2])
      doc.rect(x, cardStartY, cardWidth, 3, "F")

      // Valor
      doc.setFontSize(16)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(stat.color[0], stat.color[1], stat.color[2])
      doc.text(stat.value, x + cardWidth / 2, cardStartY + 10, { align: "center" })

      // Label
      doc.setFontSize(8)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(100, 100, 100)
      doc.text(stat.label, x + cardWidth / 2, cardStartY + 15, { align: "center" })
    })

    yPosition = cardStartY + cardHeight + 10

    // ===== TABELA DE PARTICIPANTES =====
    // Título do filtro de cargo ativo
    if (cargoFilter !== "all") {
      doc.setFontSize(10)
      doc.setTextColor(100, 100, 100)
      doc.text(`Cargo: ${cargoFilter}`, 15, yPosition)
      yPosition += 8
    }

    const sortedData = [...filteredData].sort((a, b) =>
      a.participant.name.localeCompare(b.participant.name, "pt-BR")
    )

    const tableData = sortedData.flatMap((item) => {
      if (item.checkIns.length === 0) {
        return [[
          item.participant.name,
          item.participant.cpf || "-",
          item.participant.phone || "-",
          item.participant.company || "-",
          item.participant.position || "-",
          "-",
          "-",
          "Sem check-in",
        ]]
      }

      return item.checkIns.map((checkIn) => [
        item.participant.name,
        item.participant.cpf || "-",
        item.participant.phone || "-",
        item.participant.company || "-",
        item.participant.position || "-",
        formatDateTime(checkIn.checkInTime),
        checkIn.checkOutTime
          ? formatDateTime(checkIn.checkOutTime)
          : "-",
        checkIn.status === "CHECKED_IN" ? "Presente" : "Saiu",
      ])
    })

    autoTable(doc, {
      head: [["Nome", "CPF", "Telefone", "Empresa", "Cargo", "Check-in", "Check-out", "Status"]],
      body: tableData,
      startY: yPosition,
      theme: "striped",
      styles: {
        fontSize: 8,
        cellPadding: 3,
        lineColor: [220, 220, 220],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [37, 99, 235],
        textColor: 255,
        fontSize: 9,
        fontStyle: "bold",
        halign: "center",
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        0: { cellWidth: 65, fontStyle: "bold", overflow: "linebreak" }, // Nome
        1: { cellWidth: 30 }, // CPF
        2: { cellWidth: 22 }, // Telefone
        3: { cellWidth: 28 }, // Empresa
        4: { cellWidth: 25 }, // Cargo
        5: { cellWidth: 27, halign: "center" }, // Check-in
        6: { cellWidth: 27, halign: "center" }, // Check-out
        7: { cellWidth: 20, halign: "center" }, // Status
      },
      didDrawPage: (data) => {
        // Rodapé em cada página
        const pageNumber = data.pageNumber
        const totalPages = (doc as any).internal.getNumberOfPages()
        
        doc.setFontSize(8)
        doc.setTextColor(150, 150, 150)
        doc.text(
          `Página ${pageNumber}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: "center" }
        )
        
        // Nome do sistema no rodapé
        doc.text(
          settings?.systemName || "Check-IN System",
          pageWidth - 15,
          pageHeight - 10,
          { align: "right" }
        )
      },
    })

    // Salva o PDF
    doc.save(`relatorio-${eventName.replace(/\s/g, "-")}.pdf`)
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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Selecionar Evento</CardTitle>
              <CardDescription>Escolha o evento para visualizar o relatório</CardDescription>
            </div>
            {selectedEvent && events.find(e => e.id === selectedEvent)?.deletedAt && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <span>📦</span> Evento Arquivado
              </Badge>
            )}
          </div>
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
                    <div className="flex items-center gap-2">
                      <span>{event.name}</span>
                      {event.deletedAt && (
                        <Badge variant="secondary" className="text-xs">
                          Arquivado
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={exportToPDF}
              disabled={!selectedEvent || filteredData.length === 0}
              variant="outline"
              className="gap-2"
            >
              <FileText className="w-4 h-4" />
              Exportar PDF
            </Button>
            <Button
              onClick={exportToExcel}
              disabled={!selectedEvent || filteredData.length === 0}
              className="gap-2"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Exportar Excel
            </Button>
          </div>
        </CardContent>
      </Card>

      {selectedEvent && stats && (
        <>
          {/* Filtros */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Filter className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-lg">Filtros</CardTitle>
                </div>
                  {(companyFilter !== "all" || cargoFilter !== "all" || participantFilter !== "all") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setCompanyFilter("all")
                      setCargoFilter("all")
                      setParticipantFilter("all")
                    }}
                    className="gap-1 text-slate-500 hover:text-slate-700"
                  >
                    <X className="h-4 w-4" />
                    Limpar filtros
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Filtro por Empresa */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Empresa</label>
                  <Select value={companyFilter} onValueChange={setCompanyFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as empresas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as empresas</SelectItem>
                      {uniqueCompanies.map((company) => (
                        <SelectItem key={company} value={company}>
                          {company}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtro por Cargo */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Cargo</label>
                  <Select value={cargoFilter} onValueChange={setCargoFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os cargos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os cargos</SelectItem>
                      {uniqueCargos.map((cargo) => (
                        <SelectItem key={cargo} value={cargo}>
                          {cargo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtro por Funcionário */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Funcionário</label>
                  <Select value={participantFilter} onValueChange={setParticipantFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os funcionários" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os funcionários</SelectItem>
                      {filteredParticipants.map((participant) => (
                        <SelectItem key={participant.email} value={participant.email}>
                          {participant.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Indicador de filtros ativos */}
              {(companyFilter !== "all" || cargoFilter !== "all" || participantFilter !== "all") && (
                <div className="mt-4 flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-slate-500">Filtros ativos:</span>
                  {companyFilter !== "all" && (
                    <Badge variant="secondary" className="gap-1">
                      Empresa: {companyFilter}
                      <button
                        onClick={() => setCompanyFilter("all")}
                        className="ml-1 hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {cargoFilter !== "all" && (
                    <Badge variant="secondary" className="gap-1">
                      Cargo: {cargoFilter}
                      <button
                        onClick={() => setCargoFilter("all")}
                        className="ml-1 hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {participantFilter !== "all" && (
                    <Badge variant="secondary" className="gap-1">
                      Funcionário: {filteredParticipants.find(p => p.email === participantFilter)?.name || participantFilter}
                      <button
                        onClick={() => setParticipantFilter("all")}
                        className="ml-1 hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  <span className="text-sm text-slate-400">|
                    {filteredData.length} de {reportData.length} participantes
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Participantes</CardTitle>
                <Users className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{filteredStats?.totalParticipants || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Check-ins</CardTitle>
                <UserCheck className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{filteredStats?.checkedIn || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Check-outs</CardTitle>
                <Clock className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{filteredStats?.checkedOut || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taxa de Presença</CardTitle>
                <FileSpreadsheet className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {filteredStats?.presenceRate.toFixed(1) || 0}%
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
              ) : filteredData.length === 0 ? (
                <p className="text-center py-8 text-slate-500">
                  {reportData.length === 0 
                    ? "Nenhum participante cadastrado para este evento"
                    : "Nenhum participante encontrado com os filtros selecionados"}
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
                    {filteredData.map((item, index) => (
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
