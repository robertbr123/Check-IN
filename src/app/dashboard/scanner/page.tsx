"use client"

import { useEffect, useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { QrCode, Camera, CheckCircle2, XCircle, User, Calendar, Clock } from "lucide-react"
import { Html5Qrcode } from "html5-qrcode"

interface ScanResult {
  success: boolean
  message: string
  participant?: {
    name: string
    email: string
    event: string
    company?: string
  }
  checkIn?: {
    type: "CHECK_IN" | "CHECK_OUT"
    time: string
  }
}

export default function ScannerPage() {
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState<ScanResult | null>(null)
  const [recentScans, setRecentScans] = useState<ScanResult[]>([])
  const scannerRef = useRef<Html5Qrcode | null>(null)

  const startScanner = async () => {
    try {
      const scanner = new Html5Qrcode("reader")
      scannerRef.current = scanner

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        onScanSuccess,
        onScanFailure
      )

      setScanning(true)
    } catch (err) {
      console.error("Erro ao iniciar scanner:", err)
      alert("Erro ao acessar a câmera. Verifique as permissões.")
    }
  }

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop()
        scannerRef.current.clear()
        scannerRef.current = null
      } catch (err) {
        console.error("Erro ao parar scanner:", err)
      }
    }
    setScanning(false)
  }

  const onScanSuccess = async (decodedText: string) => {
    // Para o scanner temporariamente
    await stopScanner()

    try {
      const response = await fetch("/api/scanner/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrCode: decodedText }),
      })

      const data = await response.json()

      if (response.ok) {
        setResult({
          success: true,
          message: data.message,
          participant: data.participant,
          checkIn: data.checkIn,
        })

        // Adiciona aos scans recentes
        setRecentScans((prev) => [
          {
            success: true,
            message: data.message,
            participant: data.participant,
            checkIn: data.checkIn,
          },
          ...prev.slice(0, 9), // Mantém os últimos 10
        ])

        // Som de sucesso
        playSuccessSound()
      } else {
        setResult({
          success: false,
          message: data.error || "QR Code inválido",
        })
        playErrorSound()
      }
    } catch (error) {
      console.error("Erro ao processar check-in:", error)
      setResult({
        success: false,
        message: "Erro ao processar check-in",
      })
      playErrorSound()
    }

    // Reinicia o scanner após 3 segundos
    setTimeout(() => {
      setResult(null)
      startScanner()
    }, 3000)
  }

  const onScanFailure = (error: any) => {
    // Ignora erros de scan (muito frequentes)
  }

  const playSuccessSound = () => {
    const audio = new Audio("/sounds/success.mp3")
    audio.play().catch(() => {})
  }

  const playErrorSound = () => {
    const audio = new Audio("/sounds/error.mp3")
    audio.play().catch(() => {})
  }

  useEffect(() => {
    return () => {
      stopScanner()
    }
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-blue-900">Scanner de QR Code</h1>
        <p className="text-slate-600 mt-2">
          Escaneie o QR code dos participantes para fazer check-in/check-out
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scanner */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Câmera</CardTitle>
              <CardDescription>
                Aponte a câmera para o QR code do participante
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Scanner Container */}
                <div
                  id="reader"
                  className={`w-full rounded-lg overflow-hidden border-4 ${
                    scanning ? "border-blue-600" : "border-slate-300"
                  }`}
                  style={{ minHeight: "400px" }}
                ></div>

                {/* Result Display */}
                {result && (
                  <div
                    className={`p-6 rounded-lg border-4 ${
                      result.success
                        ? "bg-green-50 border-green-500"
                        : "bg-red-50 border-red-500"
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      {result.success ? (
                        <CheckCircle2 className="w-12 h-12 text-green-600" />
                      ) : (
                        <XCircle className="w-12 h-12 text-red-600" />
                      )}
                      <div>
                        <h3
                          className={`text-xl font-bold ${
                            result.success ? "text-green-900" : "text-red-900"
                          }`}
                        >
                          {result.success ? "Sucesso!" : "Erro"}
                        </h3>
                        <p
                          className={
                            result.success ? "text-green-700" : "text-red-700"
                          }
                        >
                          {result.message}
                        </p>
                      </div>
                    </div>

                    {result.participant && (
                      <div className="space-y-2 bg-white p-4 rounded-lg border border-slate-200">
                        <div className="flex items-center gap-2 text-slate-900">
                          <User className="w-4 h-4" />
                          <span className="font-medium">{result.participant.name}</span>
                        </div>
                        <div className="text-sm text-slate-600">
                          📧 {result.participant.email}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Calendar className="w-4 h-4" />
                          {result.participant.event}
                        </div>
                        {result.participant.company && (
                          <div className="text-sm text-slate-600">
                            🏢 {result.participant.company}
                          </div>
                        )}
                        {result.checkIn && (
                          <div className="mt-3 pt-3 border-t border-slate-200">
                            <Badge
                              variant={
                                result.checkIn.type === "CHECK_IN"
                                  ? "success"
                                  : "warning"
                              }
                              className="mr-2"
                            >
                              {result.checkIn.type === "CHECK_IN"
                                ? "CHECK-IN"
                                : "CHECK-OUT"}
                            </Badge>
                            <span className="text-sm text-slate-600">
                              <Clock className="w-4 h-4 inline mr-1" />
                              {new Date(result.checkIn.time).toLocaleString("pt-BR")}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Control Buttons */}
                <div className="flex gap-3">
                  {!scanning ? (
                    <Button onClick={startScanner} className="flex-1 gap-2" size="lg">
                      <Camera className="w-5 h-5" />
                      Iniciar Scanner
                    </Button>
                  ) : (
                    <Button
                      onClick={stopScanner}
                      variant="destructive"
                      className="flex-1 gap-2"
                      size="lg"
                    >
                      <XCircle className="w-5 h-5" />
                      Parar Scanner
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Scans */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Scans Recentes</CardTitle>
              <CardDescription>Últimos 10 scans realizados</CardDescription>
            </CardHeader>
            <CardContent>
              {recentScans.length === 0 ? (
                <div className="text-center py-8">
                  <QrCode className="w-12 h-12 mx-auto text-slate-400 mb-3" />
                  <p className="text-sm text-slate-500">
                    Nenhum scan realizado ainda
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentScans.map((scan, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border ${
                        scan.success
                          ? "bg-green-50 border-green-200"
                          : "bg-red-50 border-red-200"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {scan.success ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 min-w-0">
                          {scan.participant ? (
                            <>
                              <p className="font-medium text-sm text-slate-900 truncate">
                                {scan.participant.name}
                              </p>
                              <p className="text-xs text-slate-600 truncate">
                                {scan.participant.event}
                              </p>
                              {scan.checkIn && (
                                <Badge
                                  variant={
                                    scan.checkIn.type === "CHECK_IN"
                                      ? "success"
                                      : "warning"
                                  }
                                  className="text-xs mt-1"
                                >
                                  {scan.checkIn.type === "CHECK_IN" ? "IN" : "OUT"}
                                </Badge>
                              )}
                            </>
                          ) : (
                            <p className="text-sm text-red-700">{scan.message}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
