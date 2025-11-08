import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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

    // Busca todos os participantes do evento com seus check-ins
    const participants = await prisma.participant.findMany({
      where: {
        eventId: params.eventId,
        active: true,
      },
      include: {
        checkIns: {
          orderBy: {
            checkInTime: "desc",
          },
        },
      },
    })

    // Calcula estatísticas
    const totalParticipants = participants.length
    const participantsWithCheckIn = participants.filter(
      (p) => p.checkIns.length > 0
    ).length
    
    const checkedIn = participants.filter(
      (p) => p.checkIns.length > 0 && p.checkIns[0].status === "CHECKED_IN"
    ).length

    const checkedOut = participants.filter(
      (p) => p.checkIns.length > 0 && p.checkIns[0].status === "CHECKED_OUT"
    ).length

    const presenceRate = totalParticipants > 0 
      ? (participantsWithCheckIn / totalParticipants) * 100 
      : 0

    // Formata os dados para o relatório
    const reportData = participants.map((participant) => ({
      participant: {
        name: participant.name,
        email: participant.email,
        phone: participant.phone,
        company: participant.company,
      },
      checkIns: participant.checkIns.map((checkIn) => ({
        checkInTime: checkIn.checkInTime,
        checkOutTime: checkIn.checkOutTime,
        status: checkIn.status,
      })),
      totalCheckIns: participant.checkIns.length,
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
