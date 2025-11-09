import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Forçar runtime dinâmico para essa rota
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

        const [totalEvents, totalParticipants, totalCheckIns, totalUsers] = await Promise.all([
      prisma.event.count(),
      prisma.eventParticipant.count(),
      prisma.checkIn.count(),
      prisma.user.count(),
    ])

    return NextResponse.json({
      totalEvents,
      totalParticipants,
      totalCheckIns,
      totalUsers,
    })
  } catch (error) {
    console.error("Erro ao carregar estatísticas:", error)
    return NextResponse.json(
      { error: "Erro ao carregar estatísticas" },
      { status: 500 }
    )
  }
}
