import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { qrCode } = body

    if (!qrCode) {
      return NextResponse.json({ error: "QR Code não fornecido" }, { status: 400 })
    }

    // Busca a inscrição pelo QR code
    const eventParticipant = await prisma.eventParticipant.findUnique({
      where: { qrCode },
      include: {
        participant: true,
        event: {
          select: {
            id: true,
            name: true,
            startDate: true,
            endDate: true,
          },
        },
      },
    })

    if (!eventParticipant) {
      return NextResponse.json(
        { error: "Participante não encontrado" },
        { status: 404 }
      )
    }

    if (eventParticipant.status === "CANCELLED") {
      return NextResponse.json(
        { error: "Inscrição cancelada" },
        { status: 400 }
      )
    }

    // Verifica o último check-in desta inscrição
    const lastCheckIn = await prisma.checkIn.findFirst({
      where: {
        eventParticipantId: eventParticipant.id,
      },
      orderBy: {
        checkInTime: "desc",
      },
    })

    let checkInType: "CHECK_IN" | "CHECK_OUT"
    let message: string

    // Se não tem check-in ou o último foi check-out, faz check-in
    if (!lastCheckIn || lastCheckIn.checkOutTime) {
      // Criar novo check-in
      const newCheckIn = await prisma.checkIn.create({
        data: {
          eventParticipantId: eventParticipant.id,
          eventId: eventParticipant.eventId,
          status: "CHECKED_IN",
          scannedBy: session.user.name,
        },
      })

      // Atualiza status da inscrição para ATTENDED
      await prisma.eventParticipant.update({
        where: { id: eventParticipant.id },
        data: { status: "ATTENDED" },
      })

      checkInType = "CHECK_IN"
      message = "Check-in realizado com sucesso!"

      return NextResponse.json({
        success: true,
        message,
        participant: {
          name: eventParticipant.participant.name,
          email: eventParticipant.participant.email,
          event: eventParticipant.event.name,
          company: eventParticipant.participant.company,
        },
        checkIn: {
          type: checkInType,
          time: newCheckIn.checkInTime,
        },
      })
    } else {
      // Atualizar com check-out
      const updatedCheckIn = await prisma.checkIn.update({
        where: { id: lastCheckIn.id },
        data: {
          checkOutTime: new Date(),
          status: "CHECKED_OUT",
        },
      })

      checkInType = "CHECK_OUT"
      message = "Check-out realizado com sucesso!"

      return NextResponse.json({
        success: true,
        message,
        participant: {
          name: eventParticipant.participant.name,
          email: eventParticipant.participant.email,
          event: eventParticipant.event.name,
          company: eventParticipant.participant.company,
        },
        checkIn: {
          type: checkInType,
          time: updatedCheckIn.checkOutTime!,
        },
      })
    }
  } catch (error) {
    console.error("Erro ao processar check-in:", error)
    return NextResponse.json(
      { error: "Erro ao processar check-in" },
      { status: 500 }
    )
  }
}
