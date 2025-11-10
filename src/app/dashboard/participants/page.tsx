"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Pencil, Trash2, QrCode, Download, Mail, Search, MessageCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import ImportCSV from "@/components/ImportCSV"

interface Participant {
  id: string
  qrCode: string
  status: string
  registeredAt: string
  eventId: string
  participantId: string
  participant: {
    name: string
    email: string
    phone: string | null
    document: string | null
    company: string | null
    position: string | null
  }
  event: {
    id: string
    name: string
  }
}

interface Event {
  id: string
  name: string
}

export default function ParticipantsPage() {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [qrDialogOpen, setQrDialogOpen] = useState(false)
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null)
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null)
  const [qrCodeImage, setQrCodeImage] = useState<string>("")
  const [selectedEventForImport, setSelectedEventForImport] = useState<string>("")
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [filterEventId, setFilterEventId] = useState<string>("")
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    document: "",
    company: "",
    position: "",
    eventId: "",
  })

  useEffect(() => {
    fetchParticipants()
    fetchEvents()
  }, [searchTerm, filterEventId])

  const fetchParticipants = async () => {
    try {
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (filterEventId) params.append('eventId', filterEventId)
      
      const url = `/api/participants${params.toString() ? `?${params.toString()}` : ''}`
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setParticipants(data)
      }
    } catch (error) {
      console.error("Erro ao carregar participantes:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchEvents = async () => {
    try {
      const response = await fetch("/api/events")
      if (response.ok) {
        const data = await response.json()
        setEvents(data.filter((e: any) => e.active))
      }
    } catch (error) {
      console.error("Erro ao carregar eventos:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = editingParticipant
        ? `/api/participants/${editingParticipant.id}`
        : "/api/participants"
      const method = editingParticipant ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        fetchParticipants()
        setDialogOpen(false)
        resetForm()
      } else {
        const error = await response.json()
        alert(error.error || "Erro ao salvar participante")
      }
    } catch (error) {
      console.error("Erro ao salvar participante:", error)
      alert("Erro ao salvar participante")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este participante?")) return

    try {
      const response = await fetch(`/api/participants/${id}`, { method: "DELETE" })
      if (response.ok) {
        fetchParticipants()
      }
    } catch (error) {
      console.error("Erro ao excluir participante:", error)
    }
  }

  const handleEdit = (participant: Participant) => {
    setEditingParticipant(participant)
    setFormData({
      name: participant.participant.name,
      email: participant.participant.email,
      phone: participant.participant.phone || "",
      document: participant.participant.document || "",
      company: participant.participant.company || "",
      position: participant.participant.position || "",
      eventId: participant.eventId,
    })
    setDialogOpen(true)
  }

  const handleShowQRCode = async (participant: Participant) => {
    setSelectedParticipant(participant)
    try {
      const response = await fetch(`/api/participants/${participant.id}/qrcode`)
      if (response.ok) {
        const data = await response.json()
        setQrCodeImage(data.qrCode)
        setQrDialogOpen(true)
      }
    } catch (error) {
      console.error("Erro ao gerar QR code:", error)
    }
  }

  const handleDownloadQRCode = () => {
    if (!qrCodeImage || !selectedParticipant) return

    const link = document.createElement("a")
    link.href = qrCodeImage
    link.download = `qrcode-${selectedParticipant.participant.name.replace(/\s/g, "-")}.png`
    link.click()
  }

  const handleSendEmail = async (participantId: string) => {
    try {
      const response = await fetch(`/api/participants/${participantId}/send-email`, {
        method: "POST",
      })

      if (response.ok) {
        alert("Email enviado com sucesso!")
      } else {
        const error = await response.json()
        alert(error.error || "Erro ao enviar email")
      }
    } catch (error) {
      console.error("Erro ao enviar email:", error)
      alert("Erro ao enviar email. Verifique as configurações SMTP.")
    }
  }

  const handleSendWhatsApp = async (participant: Participant) => {
    try {
      // Buscar configurações do sistema
      const settingsResponse = await fetch("/api/settings")
      let systemName = "Check-IN"
      if (settingsResponse.ok) {
        const settings = await settingsResponse.json()
        systemName = settings.systemName || "Check-IN"
      }

      // Formatar número de telefone (remover caracteres especiais e adicionar DDI 55)
      let phone = participant.participant.phone?.replace(/\D/g, "") || ""
      
      if (!phone) {
        alert("Este participante não possui telefone cadastrado.")
        return
      }

      // Adicionar DDI 55 do Brasil se não tiver
      if (!phone.startsWith("55")) {
        phone = "55" + phone
      }

      // Formatar data do evento
      const eventResponse = await fetch(`/api/events`)
      let eventDate = ""
      if (eventResponse.ok) {
        const events = await eventResponse.json()
        const event = events.find((e: any) => e.id === participant.eventId)
        if (event?.startDate) {
          eventDate = new Date(event.startDate).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        }
      }

      // Criar mensagem personalizada (sem emojis, apenas texto)
      const message = `Ola *${participant.participant.name}*!\n\n` +
        `Voce esta confirmado(a) para o evento:\n` +
        `*${participant.event.name}*\n` +
        (eventDate ? `Data: ${eventDate}\n\n` : '\n') +
        `Para fazer check-in no evento, apresente seu QR Code na entrada.\n\n` +
        `Acesse o link abaixo para visualizar e baixar seu QR Code:\n` +
        `${window.location.origin}/qrcode/${participant.qrCode}\n\n` +
        `_Mensagem enviada pelo sistema ${systemName}_`

      // Abrir WhatsApp Web com a mensagem
      const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
      
      window.open(whatsappUrl, "_blank")
    } catch (error) {
      console.error("Erro ao preparar mensagem WhatsApp:", error)
      alert("Erro ao abrir WhatsApp")
    }
  }

  const resetForm = () => {
    setEditingParticipant(null)
    setFormData({
      name: "",
      email: "",
      phone: "",
      document: "",
      company: "",
      position: "",
      eventId: "",
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-blue-900">Participantes</h1>
          <p className="text-slate-600 mt-2">Gerenciar participantes dos eventos</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Novo Participante
        </Button>
      </div>

      {/* Import CSV */}
      <ImportCSV 
        eventId={selectedEventForImport}
        onImportComplete={fetchParticipants}
      />

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros de Pesquisa</CardTitle>
          <CardDescription>Pesquise por nome, email, empresa ou filtre por evento</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Pesquisar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="search"
                  placeholder="Nome, email ou empresa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="filterEvent">Filtrar por Evento</Label>
              <Select
                value={filterEventId || undefined}
                onValueChange={(value) => setFilterEventId(value || "")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os eventos" />
                </SelectTrigger>
                <SelectContent>
                  {events.map((event) => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {filterEventId && (
                <button
                  onClick={() => setFilterEventId("")}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Mostrar todos os eventos
                </button>
              )}
            </div>
          </div>
          {(searchTerm || filterEventId) && (
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm("")
                  setFilterEventId("")
                }}
              >
                Limpar Filtros
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Event Selector for Import */}
      <Card>
        <CardHeader>
          <CardTitle>Selecionar Evento para Importação</CardTitle>
          <CardDescription>Escolha um evento antes de importar participantes via CSV</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Select
              value={selectedEventForImport || undefined}
              onValueChange={setSelectedEventForImport}
            >
              <SelectTrigger>
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
            {selectedEventForImport && (
              <button
                onClick={() => setSelectedEventForImport("")}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Limpar seleção
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Participants List */}
      <Card>
        <CardHeader>
          <CardTitle>Participantes Cadastrados</CardTitle>
          <CardDescription>
            {participants.length} participante(s) cadastrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-8 text-slate-500">Carregando...</p>
          ) : participants.length === 0 ? (
            <div className="text-center py-12">
              <QrCode className="w-12 h-12 mx-auto text-slate-400 mb-4" />
              <p className="text-slate-500 mb-4">Nenhum participante cadastrado</p>
              <Button onClick={() => setDialogOpen(true)}>
                Cadastrar Primeiro Participante
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {participants.map((participant) => (
                <div
                  key={participant.id}
                  className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <div>
                        <p className="font-medium text-slate-900">{participant.participant.name}</p>
                        <p className="text-sm text-slate-500">{participant.participant.email}</p>
                        {participant.participant.phone && (
                          <p className="text-sm text-slate-500">{participant.participant.phone}</p>
                        )}
                      </div>
                      <Badge variant="outline" className="text-blue-600 border-blue-300">
                        {participant.event.name}
                      </Badge>
                      {participant.participant.company && (
                        <Badge variant="secondary">{participant.participant.company}</Badge>
                      )}
                      {participant.status === "CANCELLED" && (
                        <Badge variant="secondary">Cancelado</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleShowQRCode(participant)}
                      className="gap-2"
                    >
                      <QrCode className="w-4 h-4" />
                      QR Code
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSendWhatsApp(participant)}
                      className="gap-2 text-green-600 hover:text-green-700 hover:border-green-600"
                      title="Enviar informações por WhatsApp"
                      disabled={!participant.participant.phone}
                    >
                      <MessageCircle className="w-4 h-4" />
                      WhatsApp
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSendEmail(participant.id)}
                      className="gap-2"
                      title="Enviar QR Code por email"
                    >
                      <Mail className="w-4 h-4" />
                      Email
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(participant)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(participant.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingParticipant ? "Editar Participante" : "Novo Participante"}
            </DialogTitle>
            <DialogDescription>
              {editingParticipant
                ? "Atualize as informações do participante"
                : "Preencha os dados do novo participante. O QR code será gerado automaticamente."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="document">Documento (CPF/RG)</Label>
                <Input
                  id="document"
                  value={formData.document}
                  onChange={(e) => setFormData({ ...formData, document: e.target.value })}
                  placeholder="000.000.000-00"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company">Empresa</Label>
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position">Cargo</Label>
                  <Input
                    id="position"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="eventId">Evento *</Label>
                <Select
                  value={formData.eventId}
                  onValueChange={(value) => setFormData({ ...formData, eventId: value })}
                  required
                >
                  <SelectTrigger>
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
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDialogOpen(false)
                  resetForm()
                }}
              >
                Cancelar
              </Button>
              <Button type="submit">
                {editingParticipant ? "Atualizar" : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>QR Code do Participante</DialogTitle>
            <DialogDescription>
              {selectedParticipant?.participant.name} - {selectedParticipant?.event.name}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center py-6 space-y-4">
            {qrCodeImage && (
              <img
                src={qrCodeImage}
                alt="QR Code"
                className="w-64 h-64 border-4 border-blue-600 rounded-lg"
              />
            )}
            <div className="text-center">
              <p className="text-sm text-slate-500 font-mono">
                {selectedParticipant?.qrCode}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQrDialogOpen(false)}>
              Fechar
            </Button>
            <Button 
              variant="outline" 
              onClick={() => selectedParticipant && handleSendWhatsApp(selectedParticipant)} 
              className="gap-2 text-green-600 hover:text-green-700 hover:border-green-600"
              disabled={!selectedParticipant?.participant.phone}
              title="Enviar por WhatsApp"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </Button>
            <Button 
              variant="outline" 
              onClick={() => selectedParticipant && handleSendEmail(selectedParticipant.id)} 
              className="gap-2"
            >
              <Mail className="w-4 h-4" />
              Email
            </Button>
            <Button onClick={handleDownloadQRCode} className="gap-2">
              <Download className="w-4 h-4" />
              Baixar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
