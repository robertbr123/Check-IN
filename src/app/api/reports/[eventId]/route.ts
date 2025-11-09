import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(
  request: Request,
  { params }: { params: { eventId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    if (session.user.role === "OPERADOR") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 })
    }

    // Busca todas as inscrições do evento com seus check-ins
    const eventParticipants = await prisma.eventParticipant.findMany({
      where: {
        eventId: params.eventId,
      },
      include: {
        participant: true,
        checkIns: {
          orderBy: {
            checkInTime: "desc",
          },
        },
      },
    })

    // Calcula estatísticas
    const totalParticipants = eventParticipants.length
    const participantsWithCheckIn = eventParticipants.filter(
      (ep) => ep.checkIns.length > 0
    ).length
    
    const checkedIn = eventParticipants.filter(
      (ep) => ep.checkIns.length > 0 && ep.checkIns[0].status === "CHECKED_IN"
    ).length

    const checkedOut = eventParticipants.filter(
      (ep) => ep.checkIns.length > 0 && ep.checkIns[0].status === "CHECKED_OUT"
    ).length

    const presenceRate = totalParticipants > 0 
      ? (participantsWithCheckIn / totalParticipants) * 100 
      : 0

    // Formata os dados para o relatório
    const reportData = eventParticipants.map((ep) => ({
      participant: {
        name: ep.participant.name,
        email: ep.participant.email,
        phone: ep.participant.phone,
        company: ep.participant.company,
      },
      checkIns: ep.checkIns.map((checkIn) => ({
        checkInTime: checkIn.checkInTime,
        checkOutTime: checkIn.checkOutTime,
        status: checkIn.status,
      })),
      totalCheckIns: ep.checkIns.length,
    }))

    return NextResponse.json({
      participants: reportData,
      stats: {
        totalParticipants,
        checkedIn,
        checkedOut,
        presenceRate,
      },
    })
  } catch (error) {
    console.error("Erro ao gerar relatório:", error)
    return NextResponse.json(
      { error: "Erro ao gerar relatório" },
      { status: 500 }
    )
  }
}
