import { useEffect, useState } from "react"

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

export function useSettings() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSettings()
  }, [])

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

  const refreshSettings = () => {
    fetchSettings()
  }

  return { settings, loading, refreshSettings }
}
