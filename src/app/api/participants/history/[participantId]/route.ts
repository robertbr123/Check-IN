import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(
  request: Request,
  { params }: { params: { participantId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Buscar participante
    const participant = await prisma.participant.findUnique({
      where: { id: params.participantId },
    })

    if (!participant) {
      return NextResponse.json(
        { error: "Participante não encontrado" },
        { status: 404 }
      )
    }

    // Buscar todas as inscrições (incluindo eventos excluídos e cancelados)
    const eventParticipants = await prisma.eventParticipant.findMany({
      where: {
        participantId: params.participantId,
      },
      include: {
        event: true,
        checkIns: {
          orderBy: {
            checkInTime: 'asc'
          }
        },
      },
      orderBy: {
        registeredAt: 'desc'
      }
    })

    // Calcular estatísticas
    const totalEvents = eventParticipants.length
    const confirmedEvents = eventParticipants.filter(ep => ep.status === 'CONFIRMED').length
    const cancelledEvents = eventParticipants.filter(ep => ep.status === 'CANCELLED').length
    const attendedEvents = eventParticipants.filter(ep => ep.checkIns.length > 0).length
    const totalCheckIns = eventParticipants.reduce((acc, ep) => acc + ep.checkIns.length, 0)

    return NextResponse.json({
      participant,
      stats: {
        totalEvents,
        confirmedEvents,
        cancelledEvents,
        attendedEvents,
        totalCheckIns,
      },
      history: eventParticipants,
    })
  } catch (error) {
    console.error("Erro ao buscar histórico:", error)
    return NextResponse.json(
      { error: "Erro ao buscar histórico" },
      { status: 500 }
    )
  }
}
