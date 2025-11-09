"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"

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

interface SettingsContextType {
  settings: Settings | null
  loading: boolean
  refreshSettings: () => Promise<void>
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/settings")
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
        
        // Aplicar cores CSS
        if (data) {
          document.documentElement.style.setProperty('--color-primary', data.primaryColor)
          document.documentElement.style.setProperty('--color-secondary', data.secondaryColor)
          document.documentElement.style.setProperty('--color-accent', data.accentColor)
          document.documentElement.style.setProperty('--color-success', data.successColor)
          document.documentElement.style.setProperty('--color-warning', data.warningColor)
          document.documentElement.style.setProperty('--color-error', data.errorColor)
          
          // Atualizar título da página
          document.title = data.systemName
          
          // Atualizar favicon se configurado
          if (data.faviconUrl) {
            const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement || document.createElement('link')
            link.type = 'image/x-icon'
            link.rel = 'shortcut icon'
            link.href = data.faviconUrl
            document.getElementsByTagName('head')[0].appendChild(link)
          }
        }
      }
    } catch (error) {
      console.error("Erro ao carregar configurações:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  const refreshSettings = async () => {
    await fetchSettings()
  }

  return (
    <SettingsContext.Provider value={{ settings, loading, refreshSettings }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error("useSettings deve ser usado dentro de um SettingsProvider")
  }
  return context
}
