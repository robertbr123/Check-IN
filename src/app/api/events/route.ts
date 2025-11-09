import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const events = await prisma.event.findMany({
      include: {
        _count: {
          select: { participants: true },
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

    const event = await prisma.event.create({
      data: {
        name,
        description,
        location,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        capacity,
        createdBy: session.user.id,
      },
      include: {
        _count: {
          select: { participants: true },
        },
      },
    })

    return NextResponse.json(event)
  } catch (error) {
    console.error("Erro ao criar evento:", error)
    return NextResponse.json(
      { error: "Erro ao criar evento" },
      { status: 500 }
    )
  }
}
