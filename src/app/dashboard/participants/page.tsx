"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Pencil, Trash2, QrCode, Download, Mail, Search, MessageCircle, Calendar, X } from "lucide-react"
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

interface UniqueParticipant {
  id: string
  name: string
  email: string
  phone: string | null
  document: string
  company: string | null
  position: string | null
  createdAt: string
  eventParticipants: Array<{
    id: string
    qrCode: string
    status: string
    registeredAt: string
    event: {
      id: string
      name: string
      startDate: string
      endDate: string
      location: string | null
      deletedAt: string | null
    }
  }>
}

interface Event {
  id: string
  name: string
}

export default function ParticipantsPage() {
  const [participants, setParticipants] = useState<UniqueParticipant[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [eventsDialogOpen, setEventsDialogOpen] = useState(false)
  const [qrDialogOpen, setQrDialogOpen] = useState(false)
  const [selectedParticipant, setSelectedParticipant] = useState<UniqueParticipant | null>(null)
  const [editingParticipant, setEditingParticipant] = useState<UniqueParticipant | null>(null)
  const [qrCodeImage, setQrCodeImage] = useState<string>("")
  const [selectedQRCode, setSelectedQRCode] = useState<string>("")
  const [selectedEventForImport, setSelectedEventForImport] = useState<string>("")
  const [searchTerm, setSearchTerm] = useState<string>("")
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
  }, [searchTerm])

  const fetchParticipants = async () => {
    try {
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      
      const url = `/api/participants/unique${params.toString() ? `?${params.toString()}` : ''}`
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

  const handleEdit = (participant: UniqueParticipant) => {
    setEditingParticipant(participant)
    setFormData({
      name: participant.name,
      email: participant.email,
      phone: participant.phone || "",
      document: participant.document || "",
      company: participant.company || "",
      position: participant.position || "",
      eventId: "", // Será selecionado ao adicionar novo evento
    })
    setDialogOpen(true)
  }

  const handleManageEvents = (participant: UniqueParticipant) => {
    setSelectedParticipant(participant)
    setEventsDialogOpen(true)
  }

  const handleAddEvent = async (participantId: string, eventId: string) => {
    try {
      const response = await fetch(`/api/participants/${participantId}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      })

      if (response.ok) {
        fetchParticipants()
        alert("Evento adicionado com sucesso!")
      } else {
        const error = await response.json()
        alert(error.error || "Erro ao adicionar evento")
      }
    } catch (error) {
      console.error("Erro ao adicionar evento:", error)
      alert("Erro ao adicionar evento")
    }
  }

  const handleRemoveEvent = async (participantId: string, eventId: string) => {
    if (!confirm("Tem certeza que deseja remover este participante do evento?")) return

    try {
      const response = await fetch(
        `/api/participants/${participantId}/events?eventId=${eventId}`,
        { method: "DELETE" }
      )

      if (response.ok) {
        fetchParticipants()
        alert("Participante removido do evento")
      }
    } catch (error) {
      console.error("Erro ao remover do evento:", error)
    }
  }

  const handleShowQRCode = async (eventParticipantId: string, qrCode: string, participantName: string) => {
    setSelectedQRCode(qrCode)
    try {
      const response = await fetch(`/api/participants/${eventParticipantId}/qrcode`)
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
    link.download = `qrcode-${selectedParticipant.name.replace(/\s/g, "-")}.png`
    link.click()
  }

  const handleSendEmail = async (eventParticipantId: string) => {
    try {
      const response = await fetch(`/api/participants/${eventParticipantId}/send-email`, {
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

  const handleSendWhatsApp = async (participant: UniqueParticipant, eventParticipant: any) => {
    try {
      // Buscar configurações do sistema
      const settingsResponse = await fetch("/api/settings")
      let systemName = "Check-IN"
      if (settingsResponse.ok) {
        const settings = await settingsResponse.json()
        systemName = settings.systemName || "Check-IN"
      }

      // Formatar número de telefone (remover caracteres especiais e adicionar DDI 55)
      let phone = participant.phone?.replace(/\D/g, "") || ""
      
      if (!phone) {
        alert("Este participante não possui telefone cadastrado.")
        return
      }

      // Adicionar DDI 55 do Brasil se não tiver
      if (!phone.startsWith("55")) {
        phone = "55" + phone
      }

      // Formatar data do evento
      const eventDate = new Date(eventParticipant.event.startDate).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })

      // Criar mensagem personalizada (sem emojis, apenas texto)
      const message = `Ola *${participant.name}*!\n\n` +
        `Voce esta confirmado(a) para o evento:\n` +
        `*${eventParticipant.event.name}*\n` +
        `Data: ${eventDate}\n\n` +
        `Para fazer check-in no evento, apresente seu QR Code na entrada.\n\n` +
        `Acesse o link abaixo para visualizar e baixar seu QR Code:\n` +
        `${window.location.origin}/qrcode/${eventParticipant.qrCode}\n\n` +
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
          <CardTitle>Pesquisar Participante</CardTitle>
          <CardDescription>Pesquise por nome, email, CPF ou empresa</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="search">Pesquisar</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                id="search"
                placeholder="Nome, email, CPF ou empresa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            {searchTerm && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSearchTerm("")}
                className="mt-2"
              >
                Limpar Pesquisa
              </Button>
            )}
          </div>
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
            {participants.length} participante(s) único(s) cadastrado(s)
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
            <div className="space-y-4">
              {participants.map((participant) => (
                <div
                  key={participant.id}
                  className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50"
                >
                  {/* Informações do Participante */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 flex-wrap mb-2">
                        <h3 className="font-bold text-lg text-slate-900">{participant.name}</h3>
                        {participant.company && (
                          <Badge variant="secondary">{participant.company}</Badge>
                        )}
                      </div>
                      <div className="text-sm text-slate-600 space-y-1">
                        <p>📧 {participant.email}</p>
                        {participant.phone && <p>📱 {participant.phone}</p>}
                        {participant.document && <p>🆔 CPF: {participant.document}</p>}
                        {participant.position && <p>💼 {participant.position}</p>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(participant)}
                        title="Editar dados do participante"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleManageEvents(participant)}
                        className="gap-2"
                        title="Gerenciar eventos"
                      >
                        <Calendar className="w-4 h-4" />
                        Eventos
                      </Button>
                    </div>
                  </div>

                  {/* Lista de Eventos do Participante */}
                  <div className="border-t pt-3 mt-3">
                    <p className="text-sm font-medium text-slate-700 mb-2">
                      Eventos inscritos ({participant.eventParticipants.length}):
                    </p>
                    {participant.eventParticipants.length === 0 ? (
                      <p className="text-sm text-slate-500 italic">Nenhum evento inscrito</p>
                    ) : (
                      <div className="space-y-2">
                        {participant.eventParticipants.map((ep) => (
                          <div
                            key={ep.id}
                            className="flex items-center justify-between bg-white p-3 rounded border border-slate-200"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-slate-900">{ep.event.name}</span>
                                {ep.event.deletedAt && (
                                  <Badge variant="secondary" className="text-xs">Arquivado</Badge>
                                )}
                                <span className="text-xs text-slate-500">
                                  {new Date(ep.event.startDate).toLocaleDateString("pt-BR")}
                                </span>
                              </div>
                              {ep.event.location && (
                                <p className="text-sm text-slate-500 mt-1">📍 {ep.event.location}</p>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleShowQRCode(ep.id, ep.qrCode, participant.name)}
                                title="Ver QR Code"
                              >
                                <QrCode className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSendWhatsApp(participant, ep)}
                                className="text-green-600 hover:text-green-700"
                                title="Enviar por WhatsApp"
                                disabled={!participant.phone}
                              >
                                <MessageCircle className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSendEmail(ep.id)}
                                title="Enviar por Email"
                              >
                                <Mail className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRemoveEvent(participant.id, ep.event.id)}
                                title="Remover do evento"
                              >
                                <X className="w-4 h-4 text-red-600" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
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
              {selectedParticipant?.name}
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
                {selectedQRCode}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQrDialogOpen(false)}>
              Fechar
            </Button>
            <Button onClick={handleDownloadQRCode} className="gap-2">
              <Download className="w-4 h-4" />
              Baixar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Events Dialog */}
      <Dialog open={eventsDialogOpen} onOpenChange={setEventsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Gerenciar Eventos</DialogTitle>
            <DialogDescription>
              {selectedParticipant?.name} - {selectedParticipant?.document}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Adicionar novo evento */}
            <div className="border rounded-lg p-4 bg-slate-50">
              <Label htmlFor="newEvent" className="mb-2 block">Adicionar a um novo evento</Label>
              <div className="flex gap-2">
                <Select
                  onValueChange={(eventId) => {
                    if (selectedParticipant) {
                      handleAddEvent(selectedParticipant.id, eventId)
                    }
                  }}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Selecione um evento" />
                  </SelectTrigger>
                  <SelectContent>
                    {events
                      .filter(e => !selectedParticipant?.eventParticipants.some(ep => ep.event.id === e.id))
                      .map((event) => (
                        <SelectItem key={event.id} value={event.id}>
                          {event.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Eventos atuais */}
            <div>
              <Label className="mb-2 block">Eventos inscritos ({selectedParticipant?.eventParticipants.length || 0})</Label>
              {selectedParticipant && selectedParticipant.eventParticipants.length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {selectedParticipant.eventParticipants.map((ep) => (
                    <div
                      key={ep.id}
                      className="flex items-center justify-between p-3 border rounded-lg bg-white"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{ep.event.name}</span>
                          {ep.event.deletedAt && (
                            <Badge variant="secondary" className="text-xs">Arquivado</Badge>
                          )}
                        </div>
                        <p className="text-sm text-slate-500">
                          {new Date(ep.event.startDate).toLocaleDateString("pt-BR")} - {ep.event.location}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveEvent(selectedParticipant.id, ep.event.id)}
                        className="text-red-600"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 italic py-4 text-center">
                  Nenhum evento inscrito
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setEventsDialogOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
