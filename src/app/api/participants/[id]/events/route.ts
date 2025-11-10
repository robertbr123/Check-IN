import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateQRCode } from "@/lib/utils"

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Adicionar evento a um participante
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    if (session.user.role === "OPERADOR") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 })
    }

    const { eventId } = await request.json()
    const participantId = params.id

    // Verificar se já está inscrito
    const existing = await prisma.eventParticipant.findUnique({
      where: {
        participantId_eventId: {
          participantId,
          eventId,
        },
      },
    })

    if (existing) {
      // Se estava cancelado, reativar
      if (existing.status === "CANCELLED") {
        const updated = await prisma.eventParticipant.update({
          where: { id: existing.id },
          data: { status: "CONFIRMED" },
          include: {
            event: true,
          },
        })
        return NextResponse.json(updated)
      }
      
      return NextResponse.json(
        { error: "Participante já inscrito neste evento" },
        { status: 400 }
      )
    }

    // Criar nova inscrição
    const qrCode = generateQRCode()
    const eventParticipant = await prisma.eventParticipant.create({
      data: {
        participantId,
        eventId,
        qrCode,
        status: "CONFIRMED",
      },
      include: {
        event: true,
      },
    })

    return NextResponse.json(eventParticipant)
  } catch (error) {
    console.error("Erro ao adicionar evento:", error)
    return NextResponse.json(
      { error: "Erro ao adicionar evento" },
      { status: 500 }
    )
  }
}

// Remover evento de um participante (soft delete)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    if (session.user.role === "OPERADOR") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get("eventId")

    if (!eventId) {
      return NextResponse.json(
        { error: "eventId é obrigatório" },
        { status: 400 }
      )
    }

    const participantId = params.id

    // Cancelar inscrição (soft delete)
    await prisma.eventParticipant.updateMany({
      where: {
        participantId,
        eventId,
      },
      data: {
        status: "CANCELLED",
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao remover evento:", error)
    return NextResponse.json(
      { error: "Erro ao remover evento" },
      { status: 500 }
    )
  }
}
