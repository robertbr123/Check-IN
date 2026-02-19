import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateQRCode } from "@/lib/utils"

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    if (session.user.role === "OPERADOR") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 })
    }

    const body = await request.json()
    const { participantIds, eventId } = body

    if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
      return NextResponse.json(
        { error: "Selecione pelo menos um participante" },
        { status: 400 }
      )
    }

    if (!eventId) {
      return NextResponse.json(
        { error: "Selecione um evento" },
        { status: 400 }
      )
    }

    // Verificar se o evento existe e está ativo
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    })

    if (!event || !event.active) {
      return NextResponse.json(
        { error: "Evento não encontrado ou inativo" },
        { status: 400 }
      )
    }

    // Buscar participantes já cadastrados neste evento
    const existingRegistrations = await prisma.eventParticipant.findMany({
      where: {
        eventId,
        participantId: { in: participantIds },
      },
      select: { participantId: true },
    })

    const alreadyRegisteredIds = new Set(existingRegistrations.map(r => r.participantId))
    const newParticipantIds = participantIds.filter((id: string) => !alreadyRegisteredIds.has(id))

    if (newParticipantIds.length === 0) {
      return NextResponse.json(
        { error: "Todos os participantes selecionados já estão cadastrados neste evento" },
        { status: 400 }
      )
    }

    // Criar registros em massa
    const createdRecords = await Promise.all(
      newParticipantIds.map(async (participantId: string) => {
        const qrCode = generateQRCode()
        return prisma.eventParticipant.create({
          data: {
            participantId,
            eventId,
            qrCode,
            status: "CONFIRMED",
          },
        })
      })
    )

    const skipped = participantIds.length - newParticipantIds.length

    return NextResponse.json({
      success: true,
      added: createdRecords.length,
      skipped,
      message: `${createdRecords.length} participante(s) adicionado(s) ao evento${skipped > 0 ? `. ${skipped} já estavam cadastrados.` : '.'}`
    })
  } catch (error) {
    console.error("Erro ao adicionar participantes em massa:", error)
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    return NextResponse.json(
      { error: "Erro ao adicionar participantes", details: errorMessage },
      { status: 500 }
    )
  }
}
