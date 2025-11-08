"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, Download, CheckCircle2, XCircle, FileSpreadsheet } from "lucide-react"
import Papa from "papaparse"

interface ImportCSVProps {
  eventId: string
  onImportComplete: () => void
}

interface CSVRow {
  nome: string
  email: string
  telefone?: string
  documento?: string
  empresa?: string
  cargo?: string
}

export default function ImportCSV({ eventId, onImportComplete }: ImportCSVProps) {
  const [importing, setImporting] = useState(false)
  const [results, setResults] = useState<{
    success: number
    errors: { row: number; error: string }[]
  } | null>(null)

  const downloadTemplate = () => {
    const template = `nome,email,telefone,documento,empresa,cargo
João Silva,joao@empresa.com,(11) 99999-9999,123.456.789-00,Tech Corp,Desenvolvedor
Maria Santos,maria@empresa.com,(11) 98888-8888,987.654.321-00,Digital Inc,Designer`

    const blob = new Blob([template], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = "template-participantes.csv"
    link.click()
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setImporting(true)
    setResults(null)

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const data = results.data as CSVRow[]
        
        if (data.length === 0) {
          alert("O arquivo CSV está vazio")
          setImporting(false)
          return
        }

        // Valida e importa
        const importResults = await importParticipants(data)
        setResults(importResults)
        setImporting(false)

        if (importResults.success > 0) {
          onImportComplete()
        }
      },
      error: (error) => {
        console.error("Erro ao ler CSV:", error)
        alert("Erro ao ler o arquivo CSV")
        setImporting(false)
      },
    })

    // Reset input
    event.target.value = ""
  }

  const importParticipants = async (data: CSVRow[]) => {
    let success = 0
    const errors: { row: number; error: string }[] = []

    for (let i = 0; i < data.length; i++) {
      const row = data[i]
      const rowNumber = i + 2 // +2 porque começa na linha 2 (header é linha 1)

      try {
        // Validações básicas
        if (!row.nome || !row.email) {
          errors.push({
            row: rowNumber,
            error: "Nome e email são obrigatórios",
          })
          continue
        }

        // Envia para a API
        const response = await fetch("/api/participants", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: row.nome,
            email: row.email,
            phone: row.telefone || null,
            document: row.documento || null,
            company: row.empresa || null,
            position: row.cargo || null,
            eventId,
          }),
        })

        if (response.ok) {
          success++
        } else {
          const error = await response.json()
          errors.push({
            row: rowNumber,
            error: error.error || "Erro ao criar participante",
          })
        }
      } catch (error) {
        errors.push({
          row: rowNumber,
          error: "Erro de conexão",
        })
      }
    }

    return { success, errors }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5" />
          Importar Participantes via CSV
        </CardTitle>
        <CardDescription>
          Importe múltiplos participantes de uma só vez usando um arquivo CSV
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={downloadTemplate}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Baixar Modelo CSV
          </Button>

          <div className="flex-1">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              disabled={importing || !eventId}
              className="hidden"
              id="csv-upload"
            />
            <label htmlFor="csv-upload" className="cursor-pointer">
              <Button
                asChild
                disabled={importing || !eventId}
                className="gap-2 w-full"
              >
                <span>
                  <Upload className="w-4 h-4" />
                  {importing ? "Importando..." : "Selecionar Arquivo CSV"}
                </span>
              </Button>
            </label>
          </div>
        </div>

        {!eventId && (
          <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200">
            ⚠️ Selecione um evento antes de importar participantes
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 text-sm">
          <p className="font-medium text-blue-900 mb-2">📋 Instruções:</p>
          <ol className="list-decimal list-inside space-y-1 text-blue-800">
            <li>Baixe o modelo CSV clicando no botão acima</li>
            <li>Preencha os dados dos participantes no arquivo</li>
            <li>
              <strong>Campos obrigatórios:</strong> nome, email
            </li>
            <li>
              <strong>Campos opcionais:</strong> telefone, documento, empresa, cargo
            </li>
            <li>Selecione o arquivo preenchido para importar</li>
          </ol>
        </div>

        {/* Results */}
        {results && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
              <div>
                <p className="font-medium text-green-900">
                  {results.success} participante(s) importado(s) com sucesso!
                </p>
              </div>
            </div>

            {results.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <XCircle className="w-5 h-5 text-red-600" />
                  <p className="font-medium text-red-900">
                    {results.errors.length} erro(s) encontrado(s):
                  </p>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {results.errors.map((error, index) => (
                    <div
                      key={index}
                      className="text-sm text-red-700 bg-white p-2 rounded border border-red-200"
                    >
                      <span className="font-medium">Linha {error.row}:</span>{" "}
                      {error.error}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
