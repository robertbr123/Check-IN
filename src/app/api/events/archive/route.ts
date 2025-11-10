import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Arquivar eventos automaticamente após a data de término
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Buscar eventos ativos com data de término passada
    const now = new Date()
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    yesterday.setHours(23, 59, 59, 999) // Final do dia anterior

    const eventsToArchive = await prisma.event.findMany({
      where: {
        deletedAt: null, // Apenas eventos ativos
        endDate: {
          lt: yesterday, // Data de término anterior a ontem
        },
      },
    })

    // Arquivar eventos (soft delete)
    const archived = await prisma.event.updateMany({
      where: {
        deletedAt: null,
        endDate: {
          lt: yesterday,
        },
      },
      data: {
        deletedAt: now,
      },
    })

    return NextResponse.json({
      message: `${archived.count} evento(s) arquivado(s) automaticamente`,
      count: archived.count,
      events: eventsToArchive.map(e => ({
        id: e.id,
        name: e.name,
        endDate: e.endDate,
      })),
    })
  } catch (error) {
    console.error("Erro ao arquivar eventos:", error)
    return NextResponse.json(
      { error: "Erro ao arquivar eventos" },
      { status: 500 }
    )
  }
}
