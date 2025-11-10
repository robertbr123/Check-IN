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
    const { name, description, location, startDate, endDate, capacity } = body

    const event = await prisma.event.update({
      where: { id: params.id },
      data: {
        name,
        description,
        location,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        capacity,
      },
      include: {
        _count: {
          select: { eventParticipants: true },
        },
      },
    })

    return NextResponse.json(event)
  } catch (error) {
    console.error("Erro ao atualizar evento:", error)
    return NextResponse.json(
      { error: "Erro ao atualizar evento" },
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

    const { searchParams } = new URL(request.url)
    const permanent = searchParams.get('permanent') === 'true'

    if (permanent) {
      // Exclusão definitiva - apenas para eventos já arquivados (deletedAt != null)
      const event = await prisma.event.findUnique({
        where: { id: params.id },
        select: { deletedAt: true },
      })

      if (!event) {
        return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 })
      }

      if (!event.deletedAt) {
        return NextResponse.json(
          { error: "Apenas eventos arquivados podem ser excluídos definitivamente" },
          { status: 400 }
        )
      }

      // Exclusão física - remove do banco de dados
      await prisma.event.delete({
        where: { id: params.id },
      })

      return NextResponse.json({ 
        success: true, 
        message: "Evento excluído definitivamente" 
      })
    } else {
      // Soft delete - arquivar evento
      await prisma.event.update({
        where: { id: params.id },
        data: {
          deletedAt: new Date(),
          active: false,
        },
      })

      return NextResponse.json({ 
        success: true,
        message: "Evento arquivado com sucesso"
      })
    }
  } catch (error) {
    console.error("Erro ao excluir evento:", error)
    return NextResponse.json(
      { error: "Erro ao excluir evento" },
      { status: 500 }
    )
  }
}
