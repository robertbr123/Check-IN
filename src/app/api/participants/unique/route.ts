import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Listar todos os participantes únicos com seus eventos
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''

    // Construir filtro de busca
    const where: any = {}
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { document: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Buscar participantes com seus eventos
    const participants = await prisma.participant.findMany({
      where,
      include: {
        eventParticipants: {
          where: {
            status: {
              not: "CANCELLED",
            },
          },
          include: {
            event: {
              select: {
                id: true,
                name: true,
                startDate: true,
                endDate: true,
                location: true,
                deletedAt: true,
              },
            },
          },
          orderBy: {
            event: {
              startDate: 'desc',
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(participants)
  } catch (error) {
    console.error("Erro ao listar participantes:", error)
    return NextResponse.json(
      { error: "Erro ao listar participantes" },
      { status: 500 }
    )
  }
}
