"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Save, Palette, FileText, Mail, Settings as SettingsIcon } from "lucide-react"
import { useRouter } from "next/navigation"

interface Settings {
  id: string
  systemName: string
  logoUrl: string | null
  faviconUrl: string | null
  primaryColor: string
  secondaryColor: string
  accentColor: string
  successColor: string
  warningColor: string
  errorColor: string
  reportHeader: string | null
  reportFooter: string | null
  reportLogoUrl: string | null
  reportShowLogo: boolean
  reportShowDate: boolean
  reportShowPageNum: boolean
  emailFromName: string
  emailSubject: string
  emailTemplate: string | null
  allowSelfCheckIn: boolean
  requireDocument: boolean
  enableNotifications: boolean
}

export default function SettingsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    // Apenas ADMIN pode acessar
    if (session && session.user.role !== "ADMIN") {
      router.push("/dashboard")
      return
    }

    fetchSettings()
  }, [session])

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/settings")
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
      }
    } catch (error) {
      console.error("Erro ao carregar configurações:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!settings) return

    setSaving(true)
    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })

      if (response.ok) {
        alert("Configurações salvas com sucesso!")
      } else {
        alert("Erro ao salvar configurações")
      }
    } catch (error) {
      console.error("Erro ao salvar:", error)
      alert("Erro ao salvar configurações")
    } finally {
      setSaving(false)
    }
  }

  const updateSetting = (key: keyof Settings, value: any) => {
    if (!settings) return
    setSettings({ ...settings, [key]: value })
  }

  if (loading) {
    return <div className="p-8 text-center">Carregando...</div>
  }

  if (!settings) {
    return <div className="p-8 text-center">Erro ao carregar configurações</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-blue-900">Configurações do Sistema</h1>
          <p className="text-slate-600 mt-2">Personalize a identidade visual e comportamento do sistema</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          <Save className="w-4 h-4" />
          {saving ? "Salvando..." : "Salvar Configurações"}
        </Button>
      </div>

      {/* Identidade Visual */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="w-5 h-5" />
            Identidade Visual
          </CardTitle>
          <CardDescription>
            Personalize o nome e logos do sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="systemName">Nome do Sistema</Label>
            <Input
              id="systemName"
              value={settings.systemName}
              onChange={(e) => updateSetting("systemName", e.target.value)}
              placeholder="Check-IN System"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="logoUrl">URL do Logo Principal</Label>
              <Input
                id="logoUrl"
                value={settings.logoUrl || ""}
                onChange={(e) => updateSetting("logoUrl", e.target.value || null)}
                placeholder="https://exemplo.com/logo.png"
              />
              {settings.logoUrl && (
                <img src={settings.logoUrl} alt="Logo" className="h-16 object-contain" />
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="faviconUrl">URL do Favicon</Label>
              <Input
                id="faviconUrl"
                value={settings.faviconUrl || ""}
                onChange={(e) => updateSetting("faviconUrl", e.target.value || null)}
                placeholder="https://exemplo.com/favicon.ico"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cores do Tema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Cores do Tema
          </CardTitle>
          <CardDescription>
            Personalize as cores do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="primaryColor">Cor Primária</Label>
              <div className="flex gap-2">
                <Input
                  id="primaryColor"
                  type="color"
                  value={settings.primaryColor}
                  onChange={(e) => updateSetting("primaryColor", e.target.value)}
                  className="w-20 h-10"
                />
                <Input
                  value={settings.primaryColor}
                  onChange={(e) => updateSetting("primaryColor", e.target.value)}
                  placeholder="#2563eb"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="secondaryColor">Cor Secundária</Label>
              <div className="flex gap-2">
                <Input
                  id="secondaryColor"
                  type="color"
                  value={settings.secondaryColor}
                  onChange={(e) => updateSetting("secondaryColor", e.target.value)}
                  className="w-20 h-10"
                />
                <Input
                  value={settings.secondaryColor}
                  onChange={(e) => updateSetting("secondaryColor", e.target.value)}
                  placeholder="#1e40af"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="accentColor">Cor de Destaque</Label>
              <div className="flex gap-2">
                <Input
                  id="accentColor"
                  type="color"
                  value={settings.accentColor}
                  onChange={(e) => updateSetting("accentColor", e.target.value)}
                  className="w-20 h-10"
                />
                <Input
                  value={settings.accentColor}
                  onChange={(e) => updateSetting("accentColor", e.target.value)}
                  placeholder="#3b82f6"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="successColor">Cor de Sucesso</Label>
              <div className="flex gap-2">
                <Input
                  id="successColor"
                  type="color"
                  value={settings.successColor}
                  onChange={(e) => updateSetting("successColor", e.target.value)}
                  className="w-20 h-10"
                />
                <Input
                  value={settings.successColor}
                  onChange={(e) => updateSetting("successColor", e.target.value)}
                  placeholder="#16a34a"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="warningColor">Cor de Aviso</Label>
              <div className="flex gap-2">
                <Input
                  id="warningColor"
                  type="color"
                  value={settings.warningColor}
                  onChange={(e) => updateSetting("warningColor", e.target.value)}
                  className="w-20 h-10"
                />
                <Input
                  value={settings.warningColor}
                  onChange={(e) => updateSetting("warningColor", e.target.value)}
                  placeholder="#eab308"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="errorColor">Cor de Erro</Label>
              <div className="flex gap-2">
                <Input
                  id="errorColor"
                  type="color"
                  value={settings.errorColor}
                  onChange={(e) => updateSetting("errorColor", e.target.value)}
                  className="w-20 h-10"
                />
                <Input
                  value={settings.errorColor}
                  onChange={(e) => updateSetting("errorColor", e.target.value)}
                  placeholder="#dc2626"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Template de Relatório */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Template de Relatório
          </CardTitle>
          <CardDescription>
            Configure o cabeçalho e rodapé dos relatórios
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reportLogoUrl">URL do Logo para Relatórios</Label>
            <Input
              id="reportLogoUrl"
              value={settings.reportLogoUrl || ""}
              onChange={(e) => updateSetting("reportLogoUrl", e.target.value || null)}
              placeholder="https://exemplo.com/logo-relatorio.png"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reportHeader">Cabeçalho do Relatório</Label>
            <textarea
              id="reportHeader"
              value={settings.reportHeader || ""}
              onChange={(e) => updateSetting("reportHeader", e.target.value || null)}
              className="w-full min-h-[100px] rounded-md border border-slate-300 px-3 py-2 text-sm"
              placeholder="Texto personalizado para o cabeçalho..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reportFooter">Rodapé do Relatório</Label>
            <textarea
              id="reportFooter"
              value={settings.reportFooter || ""}
              onChange={(e) => updateSetting("reportFooter", e.target.value || null)}
              className="w-full min-h-[100px] rounded-md border border-slate-300 px-3 py-2 text-sm"
              placeholder="Texto personalizado para o rodapé..."
            />
          </div>
          <div className="space-y-3">
            <Label>Opções do Relatório</Label>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="reportShowLogo"
                checked={settings.reportShowLogo}
                onChange={(e) => updateSetting("reportShowLogo", e.target.checked)}
                className="w-4 h-4"
              />
              <Label htmlFor="reportShowLogo" className="cursor-pointer">
                Mostrar logo no relatório
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="reportShowDate"
                checked={settings.reportShowDate}
                onChange={(e) => updateSetting("reportShowDate", e.target.checked)}
                className="w-4 h-4"
              />
              <Label htmlFor="reportShowDate" className="cursor-pointer">
                Mostrar data de geração
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="reportShowPageNum"
                checked={settings.reportShowPageNum}
                onChange={(e) => updateSetting("reportShowPageNum", e.target.checked)}
                className="w-4 h-4"
              />
              <Label htmlFor="reportShowPageNum" className="cursor-pointer">
                Mostrar numeração de páginas
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configurações de Email */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Configurações de Email
          </CardTitle>
          <CardDescription>
            Personalize os emails enviados pelo sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="emailFromName">Nome do Remetente</Label>
              <Input
                id="emailFromName"
                value={settings.emailFromName}
                onChange={(e) => updateSetting("emailFromName", e.target.value)}
                placeholder="Check-IN System"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emailSubject">Assunto Padrão</Label>
              <Input
                id="emailSubject"
                value={settings.emailSubject}
                onChange={(e) => updateSetting("emailSubject", e.target.value)}
                placeholder="Seu QR Code de Check-in"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="emailTemplate">Template do Email (HTML)</Label>
            <textarea
              id="emailTemplate"
              value={settings.emailTemplate || ""}
              onChange={(e) => updateSetting("emailTemplate", e.target.value || null)}
              className="w-full min-h-[150px] rounded-md border border-slate-300 px-3 py-2 text-sm font-mono"
              placeholder="<html>Template HTML personalizado...</html>"
            />
            <p className="text-xs text-slate-500">
              Use variáveis: {"{nome}"}, {"{evento}"}, {"{qrcode}"}, {"{data}"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Outras Configurações */}
      <Card>
        <CardHeader>
          <CardTitle>Outras Configurações</CardTitle>
          <CardDescription>
            Configurações gerais do sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="allowSelfCheckIn"
              checked={settings.allowSelfCheckIn}
              onChange={(e) => updateSetting("allowSelfCheckIn", e.target.checked)}
              className="w-4 h-4"
            />
            <Label htmlFor="allowSelfCheckIn" className="cursor-pointer">
              Permitir auto check-in (participantes podem fazer check-in sozinhos)
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="requireDocument"
              checked={settings.requireDocument}
              onChange={(e) => updateSetting("requireDocument", e.target.checked)}
              className="w-4 h-4"
            />
            <Label htmlFor="requireDocument" className="cursor-pointer">
              Exigir documento (CPF/RG) no cadastro
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="enableNotifications"
              checked={settings.enableNotifications}
              onChange={(e) => updateSetting("enableNotifications", e.target.checked)}
              className="w-4 h-4"
            />
            <Label htmlFor="enableNotifications" className="cursor-pointer">
              Habilitar notificações
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Save Button (Bottom) */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg" className="gap-2">
          <Save className="w-5 h-5" />
          {saving ? "Salvando..." : "Salvar Todas as Configurações"}
        </Button>
      </div>
    </div>
  )
}
