import { useEffect, useState } from "react"

interface Stats {
  totalEvents: number
  totalParticipants: number
  totalCheckIns: number
  totalUsers: number
}

export function useRealtimeStats(refreshInterval: number = 5000) {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/dashboard/stats")
      if (response.ok) {
        const data = await response.json()
        setStats(data)
        setLastUpdate(new Date())
        setError(null)
      } else {
        setError("Erro ao carregar estatísticas")
      }
    } catch (err) {
      setError("Erro de conexão")
      console.error("Erro ao carregar estatísticas:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Busca inicial
    fetchStats()

    // Configura interval para atualização automática
    const interval = setInterval(fetchStats, refreshInterval)

    // Cleanup
    return () => clearInterval(interval)
  }, [refreshInterval])

  return { stats, loading, error, lastUpdate, refresh: fetchStats }
}
