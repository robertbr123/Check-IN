import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role === "OPERADOR") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 })
    }

    const body = await request.json()
    const { name, email, phone, document, company, position } = body

    // Atualiza o participante
    const participant = await prisma.participant.update({
      where: { id: params.id },
      data: {
        name,
        email,
        phone,
        document,
        company,
        position,
      },
    })

    // Retorna com as inscrições
    const eventParticipant = await prisma.eventParticipant.findFirst({
      where: { participantId: params.id },
      include: {
        participant: true,
        event: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json(eventParticipant)
  } catch (error) {
    console.error("Erro ao atualizar participante:", error)
    return NextResponse.json(
      { error: "Erro ao atualizar participante" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role === "OPERADOR") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 })
    }

    // Soft delete - apenas cancela a inscrição, mantém histórico
    await prisma.eventParticipant.update({
      where: { id: params.id },
      data: {
        status: "CANCELLED",
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao cancelar inscrição:", error)
    return NextResponse.json(
      { error: "Erro ao cancelar inscrição" },
      { status: 500 }
    )
  }
}
