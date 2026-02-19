import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Verificar se deve incluir eventos deletados (para relatórios)
    const { searchParams } = new URL(request.url)
    const includeDeleted = searchParams.get('includeDeleted') === 'true'

    const events = await prisma.event.findMany({
      where: includeDeleted ? {} : {
        deletedAt: null, // Apenas eventos não excluídos
      },
      include: {
        _count: {
          select: { eventParticipants: true },
        },
      },
      orderBy: {
        startDate: "desc",
      },
    })

    return NextResponse.json(events)
  } catch (error) {
    console.error("Erro ao listar eventos:", error)
    return NextResponse.json(
      { error: "Erro ao listar eventos" },
      { status: 500 }
    )
  }
}

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
    const { name, description, location, startDate, endDate, capacity } = body

    // Função para converter datetime-local para Date
    // O input datetime-local envia "2026-02-19T16:00" sem timezone
    // Tratamos como UTC para salvar o horário exatamente como informado
    const parseLocalDateTime = (dateTimeStr: string): Date => {
      // Se já tem timezone, usa direto
      if (dateTimeStr.includes('Z') || dateTimeStr.includes('+') || dateTimeStr.includes('-', 10)) {
        return new Date(dateTimeStr)
      }
      // Adiciona Z para tratar como UTC
      return new Date(dateTimeStr + 'Z')
    }

    console.log("Criando evento com dados:", { name, location, startDate, endDate, capacity, createdBy: session.user.id })

    const event = await prisma.event.create({
      data: {
        name,
        description,
        location,
        startDate: parseLocalDateTime(startDate),
        endDate: parseLocalDateTime(endDate),
        capacity,
        createdBy: session.user.id,
      },
      include: {
        _count: {
          select: { eventParticipants: true },
        },
      },
    })

    console.log("Evento criado com sucesso:", event.id)

    return NextResponse.json(event)
  } catch (error) {
    console.error("Erro detalhado ao criar evento:", error)
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    return NextResponse.json(
      { error: "Erro ao criar evento", details: errorMessage },
      { status: 500 }
    )
  }
}
