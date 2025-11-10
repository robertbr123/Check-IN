"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Plus, Pencil, Trash2, MapPin } from "lucide-react"
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
import { formatDateTime } from "@/lib/utils"

interface Event {
  id: string
  name: string
  description: string | null
  location: string
  startDate: string
  endDate: string
  capacity: number | null
  active: boolean
  deletedAt: string | null
  _count: {
    eventParticipants: number
  }
}

type TabType = 'active' | 'archived'

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('active')
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    location: "",
    startDate: "",
    endDate: "",
    capacity: "",
  })

  useEffect(() => {
    autoArchiveEvents()
    fetchEvents()
  }, [])

  const autoArchiveEvents = async () => {
    try {
      await fetch("/api/events/archive", { method: "POST" })
    } catch (error) {
      console.error("Erro ao arquivar eventos automaticamente:", error)
    }
  }

  const fetchEvents = async () => {
    try {
      // Buscar todos os eventos (incluindo arquivados)
      const response = await fetch("/api/events?includeDeleted=true")
      if (response.ok) {
        const data = await response.json()
        setEvents(data)
      }
    } catch (error) {
      console.error("Erro ao carregar eventos:", error)
    } finally {
      setLoading(false)
    }
  }

  // Filtrar eventos por tab
  const filteredEvents = events.filter(event => {
    if (activeTab === 'active') {
      return !event.deletedAt
    } else {
      return event.deletedAt !== null
    }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = editingEvent ? `/api/events/${editingEvent.id}` : "/api/events"
      const method = editingEvent ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          capacity: formData.capacity ? parseInt(formData.capacity) : null,
        }),
      })

      if (response.ok) {
        fetchEvents()
        setDialogOpen(false)
        resetForm()
      } else {
        const error = await response.json()
        console.error("Erro da API:", error)
        alert(error.error || "Erro ao salvar evento")
      }
    } catch (error) {
      console.error("Erro ao salvar evento:", error)
      alert("Erro ao salvar evento. Verifique o console para mais detalhes.")
    }
  }

  const handleDelete = async (id: string, isArchived: boolean) => {
    if (isArchived) {
      // Exclusão definitiva
      if (!confirm(
        "⚠️ ATENÇÃO! Esta ação é IRREVERSÍVEL!\n\n" +
        "Você está prestes a EXCLUIR DEFINITIVAMENTE este evento do banco de dados.\n" +
        "Todos os dados de participantes, check-ins e relatórios deste evento serão PERDIDOS PERMANENTEMENTE.\n\n" +
        "Deseja realmente continuar?"
      )) return

      try {
        const response = await fetch(`/api/events/${id}?permanent=true`, { 
          method: "DELETE" 
        })
        if (response.ok) {
          alert("Evento excluído definitivamente do banco de dados")
          fetchEvents()
        } else {
          const error = await response.json()
          alert(error.error || "Erro ao excluir evento")
        }
      } catch (error) {
        console.error("Erro ao excluir evento definitivamente:", error)
        alert("Erro ao excluir evento")
      }
    } else {
      // Arquivar evento (soft delete)
      if (!confirm(
        "Deseja arquivar este evento?\n\n" +
        "O evento será movido para a aba 'Arquivados' mas todos os dados serão preservados.\n" +
        "Você poderá acessar relatórios e dados históricos a qualquer momento."
      )) return

      try {
        const response = await fetch(`/api/events/${id}`, { method: "DELETE" })
        if (response.ok) {
          alert("Evento arquivado com sucesso")
          fetchEvents()
        }
      } catch (error) {
        console.error("Erro ao arquivar evento:", error)
        alert("Erro ao arquivar evento")
      }
    }
  }

  const handleEdit = (event: Event) => {
    setEditingEvent(event)
    setFormData({
      name: event.name,
      description: event.description || "",
      location: event.location,
      startDate: new Date(event.startDate).toISOString().slice(0, 16),
      endDate: new Date(event.endDate).toISOString().slice(0, 16),
      capacity: event.capacity?.toString() || "",
    })
    setDialogOpen(true)
  }

  const resetForm = () => {
    setEditingEvent(null)
    setFormData({
      name: "",
      description: "",
      location: "",
      startDate: "",
      endDate: "",
      capacity: "",
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-blue-900">Eventos</h1>
          <p className="text-slate-600 mt-2">Gerenciar eventos do sistema</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Novo Evento
        </Button>
      </div>

      {/* Tabs */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2 border-b">
            <button
              onClick={() => setActiveTab('active')}
              className={`px-4 py-2 font-medium transition-colors border-b-2 -mb-px ${
                activeTab === 'active'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Ativos ({events.filter(e => !e.deletedAt).length})
            </button>
            <button
              onClick={() => setActiveTab('archived')}
              className={`px-4 py-2 font-medium transition-colors border-b-2 -mb-px ${
                activeTab === 'archived'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Arquivados ({events.filter(e => e.deletedAt).length})
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <p className="col-span-full text-center py-12 text-slate-500">Carregando...</p>
        ) : filteredEvents.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="text-center py-12">
              <Calendar className="w-12 h-12 mx-auto text-slate-400 mb-4" />
              <p className="text-slate-500 mb-4">
                {activeTab === 'active' 
                  ? 'Nenhum evento ativo' 
                  : 'Nenhum evento arquivado'}
              </p>
              {activeTab === 'active' && (
                <Button onClick={() => setDialogOpen(true)}>Criar Primeiro Evento</Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredEvents.map((event) => (
            <Card key={event.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{event.name}</CardTitle>
                    <div className="flex gap-2 mt-2">
                      {event.deletedAt ? (
                        <Badge variant="secondary">📦 Arquivado</Badge>
                      ) : event.active ? (
                        <Badge variant="success">✓ Ativo</Badge>
                      ) : (
                        <Badge variant="secondary">Inativo</Badge>
                      )}
                      {event.deletedAt && (
                        <Badge variant="outline" className="text-xs text-slate-500">
                          {new Date(event.deletedAt).toLocaleDateString("pt-BR")}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {event.description && (
                  <p className="text-sm text-slate-600 line-clamp-2">
                    {event.description}
                  </p>
                )}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-slate-600">
                    <MapPin className="w-4 h-4" />
                    {event.location}
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Calendar className="w-4 h-4" />
                    {formatDateTime(event.startDate)}
                  </div>
                  {event.capacity && (
                    <div className="text-slate-600">
                      Capacidade: {event._count.eventParticipants} / {event.capacity}
                    </div>
                  )}
                  <div className="text-blue-600 font-medium">
                    {event._count.eventParticipants} participante(s)
                  </div>
                </div>
                <div className="flex gap-2 pt-3">
                  {!event.deletedAt && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleEdit(event)}
                    >
                      <Pencil className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(event.id, !!event.deletedAt)}
                    className={event.deletedAt ? "flex-1" : ""}
                    title={event.deletedAt ? "Excluir definitivamente" : "Arquivar evento"}
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                    {event.deletedAt && <span className="ml-2 text-red-600">Excluir Definitivamente</span>}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingEvent ? "Editar Evento" : "Novo Evento"}
            </DialogTitle>
            <DialogDescription>
              {editingEvent
                ? "Atualize as informações do evento"
                : "Preencha os dados do novo evento"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Evento *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full min-h-[100px] rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Local *</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Data/Hora Início *</Label>
                  <Input
                    id="startDate"
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">Data/Hora Fim *</Label>
                  <Input
                    id="endDate"
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacidade (opcional)</Label>
                <Input
                  id="capacity"
                  type="number"
                  min="1"
                  value={formData.capacity}
                  onChange={(e) =>
                    setFormData({ ...formData, capacity: e.target.value })
                  }
                  placeholder="Deixe vazio para sem limite"
                />
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
                {editingEvent ? "Atualizar" : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
