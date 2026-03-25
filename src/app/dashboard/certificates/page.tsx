"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Award, Upload, Download, Trash2, Save, Users, Loader2, CheckCircle2,
} from "lucide-react"
import jsPDF from "jspdf"
import toast from "react-hot-toast"

interface Event {
  id: string
  name: string
  deletedAt: string | null
}

interface CertificateTemplate {
  id: string
  eventId: string
  imageData: string
  imageMime: string
  nameX: number
  nameY: number
  fontSize: number
  fontColor: string
  fontFamily: string
  bold: boolean
  italic: boolean
  textAlign: string
}

interface Attendee {
  id: string
  name: string
  email: string
}

export default function CertificatesPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [selectedEventId, setSelectedEventId] = useState("")
  const [template, setTemplate] = useState<CertificateTemplate | null>(null)
  const [loadingTemplate, setLoadingTemplate] = useState(false)
  const [saving, setSaving] = useState(false)
  const [attendees, setAttendees] = useState<Attendee[]>([])
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState(0)

  // Editor state
  const [imageData, setImageData] = useState("")
  const [imageMime, setImageMime] = useState("image/jpeg")
  const [nameX, setNameX] = useState(50)
  const [nameY, setNameY] = useState(65)
  const [fontSize, setFontSize] = useState(60)
  const [fontColor, setFontColor] = useState("#000000")
  const [fontFamily, setFontFamily] = useState("helvetica")
  const [bold, setBold] = useState(false)
  const [italic, setItalic] = useState(false)
  const [textAlign, setTextAlign] = useState("center")

  const [isDragging, setIsDragging] = useState(false)
  const [containerWidth, setContainerWidth] = useState(800)
  const containerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchEvents()
  }, [])

  // Atualiza largura do container para cálculo de escala do preview
  useEffect(() => {
    const update = () => {
      if (containerRef.current) setContainerWidth(containerRef.current.clientWidth)
    }
    update()
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [imageData])

  useEffect(() => {
    if (selectedEventId) {
      fetchTemplate(selectedEventId)
      fetchAttendees(selectedEventId)
    } else {
      setTemplate(null)
      setAttendees([])
      resetEditor()
    }
  }, [selectedEventId])

  const resetEditor = () => {
    setImageData("")
    setNameX(50)
    setNameY(65)
    setFontSize(60)
    setFontColor("#000000")
    setFontFamily("helvetica")
    setBold(false)
    setItalic(false)
    setTextAlign("center")
  }

  const fetchEvents = async () => {
    const res = await fetch("/api/events")
    if (res.ok) setEvents(await res.json())
  }

  const fetchTemplate = async (eventId: string) => {
    setLoadingTemplate(true)
    try {
      const res = await fetch(`/api/certificates/templates?eventId=${eventId}`)
      if (res.ok) {
        const data = await res.json()
        if (data) {
          setTemplate(data)
          setImageData(data.imageData)
          setImageMime(data.imageMime)
          setNameX(data.nameX)
          setNameY(data.nameY)
          setFontSize(data.fontSize)
          setFontColor(data.fontColor)
          setFontFamily(data.fontFamily)
          setBold(data.bold)
          setItalic(data.italic)
          setTextAlign(data.textAlign)
        } else {
          setTemplate(null)
          resetEditor()
        }
      }
    } finally {
      setLoadingTemplate(false)
    }
  }

  const fetchAttendees = async (eventId: string) => {
    const res = await fetch(`/api/certificates/attendees/${eventId}`)
    if (res.ok) setAttendees(await res.json())
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const result = ev.target?.result as string
      const [header, data] = result.split(",")
      const mime = header.match(/:(.*?);/)?.[1] || "image/jpeg"
      setImageData(data)
      setImageMime(mime)
    }
    reader.readAsDataURL(file)
    // Reset input so same file can be re-uploaded
    e.target.value = ""
  }

  const updatePosition = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    setNameX(Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100)))
    setNameY(Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100)))
  }, [])

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true)
    updatePosition(e)
    e.preventDefault()
  }
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging) updatePosition(e)
  }
  const handleMouseUp = () => setIsDragging(false)

  const saveTemplate = async () => {
    if (!imageData || !selectedEventId) return
    setSaving(true)
    try {
      const body = { eventId: selectedEventId, imageData, imageMime, nameX, nameY, fontSize, fontColor, fontFamily, bold, italic, textAlign }
      const res = await fetch(
        template ? `/api/certificates/templates?id=${template.id}` : `/api/certificates/templates`,
        { method: template ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
      )
      if (res.ok) {
        setTemplate(await res.json())
        toast.success("Template salvo com sucesso!")
      } else {
        toast.error("Erro ao salvar template")
      }
    } finally {
      setSaving(false)
    }
  }

  const deleteTemplate = async () => {
    if (!template) return
    const res = await fetch(`/api/certificates/templates?id=${template.id}`, { method: "DELETE" })
    if (res.ok) {
      setTemplate(null)
      resetEditor()
      toast.success("Template removido")
    }
  }

  // Gera PDF de um certificado individualmente
  const generateOneCertificate = (participantName: string): Promise<ArrayBuffer> =>
    new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        const ratio = img.width / img.height
        const pdfWidth = 297
        const pdfHeight = pdfWidth / ratio

        const doc = new jsPDF({
          orientation: pdfHeight < pdfWidth ? "landscape" : "portrait",
          unit: "mm",
          format: [pdfWidth, pdfHeight],
        })

        const w = doc.internal.pageSize.getWidth()
        const h = doc.internal.pageSize.getHeight()

        const fmt = imageMime.includes("png") ? "PNG" : "JPEG"
        doc.addImage(`data:${imageMime};base64,${imageData}`, fmt, 0, 0, w, h)

        const x = (nameX / 100) * w
        const y = (nameY / 100) * h

        const style =
          bold && italic ? "bolditalic" : bold ? "bold" : italic ? "italic" : "normal"
        doc.setFont(fontFamily, style)
        doc.setFontSize(fontSize)

        const r = parseInt(fontColor.slice(1, 3), 16)
        const g = parseInt(fontColor.slice(3, 5), 16)
        const b = parseInt(fontColor.slice(5, 7), 16)
        doc.setTextColor(r, g, b)

        doc.text(participantName, x, y, {
          align: textAlign as "left" | "center" | "right",
        })

        resolve(doc.output("arraybuffer"))
      }
      img.src = `data:${imageMime};base64,${imageData}`
    })

  const generateCertificates = async () => {
    if (!imageData || attendees.length === 0) return
    setGenerating(true)
    setProgress(0)
    try {
      const JSZip = (await import("jszip")).default
      const zip = new JSZip()
      const eventName = events.find((e) => e.id === selectedEventId)?.name || "evento"

      for (let i = 0; i < attendees.length; i++) {
        const pdf = await generateOneCertificate(attendees[i].name)
        const safeName = attendees[i].name.replace(/[<>:"/\\|?*]/g, "").trim()
        zip.file(`certificado-${safeName}.pdf`, pdf)
        setProgress(Math.round(((i + 1) / attendees.length) * 100))
      }

      const blob = await zip.generateAsync({ type: "blob" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `certificados-${eventName.replace(/\s+/g, "-")}.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success(`${attendees.length} certificados gerados com sucesso!`)
    } catch (err) {
      console.error(err)
      toast.error("Erro ao gerar certificados")
    } finally {
      setGenerating(false)
      setProgress(0)
    }
  }

  // Calcula tamanho de fonte no preview proporcional ao PDF real
  // PDF: 297mm ≈ 842px @ 96dpi; 1pt = 1.333px
  const previewFontSizePx = Math.round(fontSize * 1.333 * (containerWidth / 842))

  const selectedEvent = events.find((e) => e.id === selectedEventId)
  const cssFontFamily =
    fontFamily === "times"
      ? "Times New Roman, serif"
      : fontFamily === "courier"
      ? "Courier New, monospace"
      : "Arial, sans-serif"

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-blue-900">Certificados</h1>
        <p className="text-slate-600 mt-2">
          Configure o template e gere certificados em PDF para todos os presentes
        </p>
      </div>

      {/* Seletor de Evento */}
      <Card>
        <CardHeader>
          <CardTitle>Selecionar Evento</CardTitle>
          <CardDescription>Escolha o evento para configurar o certificado</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedEventId} onValueChange={setSelectedEventId}>
            <SelectTrigger className="max-w-sm">
              <SelectValue placeholder="Selecione um evento" />
            </SelectTrigger>
            <SelectContent>
              {events.map((event) => (
                <SelectItem key={event.id} value={event.id}>
                  <div className="flex items-center gap-2">
                    {event.name}
                    {event.deletedAt && (
                      <Badge variant="secondary" className="text-xs">Arquivado</Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Editor de Template */}
      {selectedEventId && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle>Template do Certificado</CardTitle>
                <CardDescription>
                  Faça upload da imagem e arraste ou clique para posicionar o nome
                </CardDescription>
              </div>
              {template && (
                <Badge className="gap-1 bg-green-100 text-green-700 border-green-200">
                  <CheckCircle2 className="w-3 h-3" />
                  Template salvo
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Upload */}
            <div className="flex items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png"
                className="hidden"
                onChange={handleImageUpload}
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="gap-2"
              >
                <Upload className="w-4 h-4" />
                {imageData ? "Trocar Imagem" : "Upload da Imagem do Certificado"}
              </Button>
              <p className="text-xs text-slate-500">
                Formatos: JPG ou PNG. Recomendado: proporção paisagem (ex: 1920×1080).
              </p>
            </div>

            {loadingTemplate && (
              <div className="flex items-center gap-2 text-slate-500 py-4">
                <Loader2 className="w-4 h-4 animate-spin" />
                Carregando template...
              </div>
            )}

            {imageData && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Canvas de posicionamento */}
                <div className="lg:col-span-2">
                  <p className="text-sm font-medium mb-2 text-slate-700">
                    Clique ou arraste na imagem para posicionar o nome
                  </p>
                  <div
                    ref={containerRef}
                    className={`relative select-none rounded-lg overflow-hidden border-2 transition-colors ${
                      isDragging
                        ? "border-blue-500 cursor-grabbing"
                        : "border-slate-300 cursor-crosshair hover:border-blue-400"
                    }`}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                  >
                    <img
                      src={`data:${imageMime};base64,${imageData}`}
                      alt="Template do certificado"
                      className="w-full block pointer-events-none"
                      draggable={false}
                    />

                    {/* Preview do nome */}
                    <div
                      className="absolute pointer-events-none"
                      style={{
                        left: `${nameX}%`,
                        top: `${nameY}%`,
                        transform: "translate(-50%, -50%)",
                        fontFamily: cssFontFamily,
                        fontSize: `${previewFontSizePx}px`,
                        color: fontColor,
                        fontWeight: bold ? "bold" : "normal",
                        fontStyle: italic ? "italic" : "normal",
                        textAlign: textAlign as any,
                        whiteSpace: "nowrap",
                        lineHeight: 1,
                        textShadow:
                          "0 0 4px rgba(255,255,255,0.8), 0 0 8px rgba(255,255,255,0.5)",
                      }}
                    >
                      Nome do Participante
                    </div>

                    {/* Marcador de posição */}
                    <div
                      className="absolute pointer-events-none"
                      style={{
                        left: `${nameX}%`,
                        top: `${nameY}%`,
                        transform: "translate(-50%, -50%)",
                      }}
                    >
                      <div className="w-3 h-3 rounded-full bg-blue-500 border-2 border-white shadow-md" />
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Posição: X={nameX.toFixed(1)}% Y={nameY.toFixed(1)}%
                  </p>
                </div>

                {/* Painel de configuração */}
                <div className="space-y-4">
                  {/* Fonte */}
                  <div className="space-y-1">
                    <Label>Fonte</Label>
                    <Select value={fontFamily} onValueChange={setFontFamily}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="helvetica">Helvetica (Sans-serif)</SelectItem>
                        <SelectItem value="times">Times (Serif)</SelectItem>
                        <SelectItem value="courier">Courier (Monospace)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Tamanho */}
                  <div className="space-y-1">
                    <Label>Tamanho (pt)</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={8}
                        max={200}
                        value={fontSize}
                        onChange={(e) => setFontSize(Number(e.target.value))}
                      />
                      <span className="text-sm text-slate-500 w-6">pt</span>
                    </div>
                  </div>

                  {/* Cor */}
                  <div className="space-y-1">
                    <Label>Cor do Texto</Label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={fontColor}
                        onChange={(e) => setFontColor(e.target.value)}
                        className="w-10 h-10 rounded border border-slate-300 cursor-pointer p-0.5 bg-white"
                      />
                      <span className="text-sm font-mono text-slate-600">{fontColor.toUpperCase()}</span>
                    </div>
                  </div>

                  {/* Alinhamento */}
                  <div className="space-y-1">
                    <Label>Alinhamento</Label>
                    <div className="flex gap-1">
                      {(["left", "center", "right"] as const).map((a) => (
                        <Button
                          key={a}
                          size="sm"
                          variant={textAlign === a ? "default" : "outline"}
                          onClick={() => setTextAlign(a)}
                          className="flex-1 text-base"
                        >
                          {a === "left" ? "⬅" : a === "center" ? "↔" : "➡"}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Estilo */}
                  <div className="space-y-1">
                    <Label>Estilo</Label>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={bold ? "default" : "outline"}
                        onClick={() => setBold(!bold)}
                        className="flex-1 font-bold text-base"
                      >
                        N
                      </Button>
                      <Button
                        size="sm"
                        variant={italic ? "default" : "outline"}
                        onClick={() => setItalic(!italic)}
                        className="flex-1 italic text-base"
                      >
                        I
                      </Button>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="pt-2 space-y-2 border-t border-slate-100">
                    <Button
                      className="w-full gap-2"
                      onClick={saveTemplate}
                      disabled={saving || !imageData}
                    >
                      {saving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      {saving ? "Salvando..." : template ? "Atualizar Template" : "Salvar Template"}
                    </Button>

                    {template && (
                      <Button
                        variant="destructive"
                        size="sm"
                        className="w-full gap-2"
                        onClick={deleteTemplate}
                      >
                        <Trash2 className="w-4 h-4" />
                        Remover Template
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Geração de Certificados */}
      {selectedEventId && template && (
        <Card>
          <CardHeader>
            <CardTitle>Gerar Certificados</CardTitle>
            <CardDescription>
              Gera um PDF por participante presente e baixa tudo em um arquivo ZIP
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className={`flex items-center gap-3 p-4 rounded-lg border ${
                attendees.length > 0
                  ? "bg-green-50 border-green-200"
                  : "bg-slate-50 border-slate-200"
              }`}
            >
              <Users
                className={`w-5 h-5 flex-shrink-0 ${
                  attendees.length > 0 ? "text-green-600" : "text-slate-400"
                }`}
              />
              <div>
                <p className="font-medium">
                  {attendees.length}{" "}
                  {attendees.length === 1 ? "participante presente" : "participantes presentes"}
                </p>
                <p className="text-sm text-slate-500">
                  {attendees.length === 0
                    ? "Nenhum check-in registrado para este evento ainda"
                    : `Para o evento: ${selectedEvent?.name}`}
                </p>
              </div>
            </div>

            {attendees.length > 0 && (
              <>
                {generating && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm text-slate-600">
                      <span>Gerando certificados...</span>
                      <span className="font-medium">{progress}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full transition-all duration-200"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-400">
                      {Math.round((progress / 100) * attendees.length)} de {attendees.length} certificados
                    </p>
                  </div>
                )}

                <Button
                  size="lg"
                  className="gap-2"
                  onClick={generateCertificates}
                  disabled={generating}
                >
                  {generating ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Download className="w-5 h-5" />
                  )}
                  {generating
                    ? "Gerando..."
                    : `Gerar e Baixar ZIP (${attendees.length} certificados)`}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Estado vazio */}
      {!selectedEventId && (
        <Card>
          <CardContent className="text-center py-16">
            <Award className="w-16 h-16 mx-auto text-slate-300 mb-4" />
            <p className="text-slate-600 text-lg mb-1">Selecione um evento</p>
            <p className="text-slate-500 text-sm">
              Escolha um evento acima para configurar o template de certificado
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
