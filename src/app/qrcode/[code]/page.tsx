"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Calendar, MapPin, Clock } from "lucide-react"

interface ParticipantData {
  participant: {
    name: string
    email: string
    phone: string | null
    company: string | null
  }
  event: {
    name: string
    description: string | null
    location: string | null
    startDate: string
    endDate: string
  }
  qrCode: string
  qrCodeImage: string
}

export default function PublicQRCodePage() {
  const params = useParams()
  const code = params.code as string
  
  const [data, setData] = useState<ParticipantData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetchQRCode()
  }, [code])

  const fetchQRCode = async () => {
    try {
      const response = await fetch(`/api/public/qrcode/${code}`)
      if (response.ok) {
        const result = await response.json()
        setData(result)
      } else {
        setError(true)
      }
    } catch (error) {
      console.error("Erro ao carregar QR Code:", error)
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (!data) return

    const link = document.createElement("a")
    link.href = data.qrCodeImage
    link.download = `qrcode-${data.participant.name.replace(/\s/g, "-")}.png`
    link.click()
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-slate-600">Carregando...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">QR Code não encontrado</CardTitle>
            <CardDescription>
              O código informado não existe ou foi cancelado.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4">
      <div className="max-w-2xl mx-auto space-y-6 py-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-blue-900">
            Seu QR Code de Check-in
          </h1>
          <p className="text-slate-600 mt-2">
            Apresente este QR Code na entrada do evento
          </p>
        </div>

        {/* QR Code Card */}
        <Card>
          <CardHeader>
            <CardTitle>{data.participant.name}</CardTitle>
            <CardDescription>{data.participant.email}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* QR Code Image */}
            <div className="flex flex-col items-center">
              <div className="bg-white p-4 rounded-lg shadow-lg border-4 border-blue-600">
                <img
                  src={data.qrCodeImage}
                  alt="QR Code"
                  className="w-64 h-64"
                />
              </div>
              <p className="text-sm text-slate-500 font-mono mt-4">
                {data.qrCode}
              </p>
            </div>

            {/* Download Button */}
            <Button onClick={handleDownload} className="w-full gap-2" size="lg">
              <Download className="w-5 h-5" />
              Baixar QR Code
            </Button>
          </CardContent>
        </Card>

        {/* Event Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Detalhes do Evento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-bold text-lg text-blue-900">
                {data.event.name}
              </h3>
              {data.event.description && (
                <p className="text-slate-600 mt-2">{data.event.description}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-blue-600 mt-1" />
                <div>
                  <p className="font-medium text-slate-700">Início</p>
                  <p className="text-sm text-slate-600">
                    {formatDate(data.event.startDate)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-orange-600 mt-1" />
                <div>
                  <p className="font-medium text-slate-700">Término</p>
                  <p className="text-sm text-slate-600">
                    {formatDate(data.event.endDate)}
                  </p>
                </div>
              </div>

              {data.event.location && (
                <div className="flex items-start gap-3 md:col-span-2">
                  <MapPin className="w-5 h-5 text-green-600 mt-1" />
                  <div>
                    <p className="font-medium text-slate-700">Local</p>
                    <p className="text-sm text-slate-600">{data.event.location}</p>
                  </div>
                </div>
              )}
            </div>

            {data.participant.company && (
              <div className="pt-4 border-t">
                <p className="text-sm text-slate-600">
                  <span className="font-medium">Empresa:</span> {data.participant.company}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <h3 className="font-bold text-blue-900 mb-3">
              💡 Instruções Importantes
            </h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li>✓ Salve ou imprima este QR Code antes do evento</li>
              <li>✓ Apresente o QR Code na entrada para fazer check-in</li>
              <li>✓ Você pode mostrar direto do celular ou impresso</li>
              <li>✓ Guarde este link para acessar novamente quando precisar</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
