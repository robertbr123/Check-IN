"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Pencil, Trash2, QrCode, Download } from "lucide-react"
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

interface Participant {
  id: string
  name: string
  email: string
  phone: string | null
  document: string | null
  company: string | null
  position: string | null
  qrCode: string
  eventId: string
  active: boolean
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
  }, [])

  const fetchParticipants = async () => {
    try {
      const response = await fetch("/api/participants")
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
      name: participant.name,
      email: participant.email,
      phone: participant.phone || "",
      document: participant.document || "",
      company: participant.company || "",
      position: participant.position || "",
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
    link.download = `qrcode-${selectedParticipant.name.replace(/\s/g, "-")}.png`
    link.click()
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
                        <p className="font-medium text-slate-900">{participant.name}</p>
                        <p className="text-sm text-slate-500">{participant.email}</p>
                        {participant.phone && (
                          <p className="text-sm text-slate-500">{participant.phone}</p>
                        )}
                      </div>
                      <Badge variant="outline" className="text-blue-600 border-blue-300">
                        {participant.event.name}
                      </Badge>
                      {participant.company && (
                        <Badge variant="secondary">{participant.company}</Badge>
                      )}
                      {!participant.active && (
                        <Badge variant="secondary">Inativo</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
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
              {selectedParticipant?.name} - {selectedParticipant?.event.name}
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
            <Button onClick={handleDownloadQRCode} className="gap-2">
              <Download className="w-4 h-4" />
              Baixar QR Code
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
