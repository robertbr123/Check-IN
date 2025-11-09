import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    console.log("Session:", JSON.stringify(session, null, 2))

    if (!session) {
      return NextResponse.json({ 
        error: "Não autorizado",
        debug: "Session is null"
      }, { status: 401 })
    }

    if (session.user.role === "OPERADOR") {
      return NextResponse.json({ 
        error: "Sem permissão",
        debug: "User role is OPERADOR"
      }, { status: 403 })
    }

    const body = await request.json()
    console.log("Body received:", JSON.stringify(body, null, 2))
    
    const { name, description, location, startDate, endDate, capacity } = body

    if (!name || !location || !startDate || !endDate) {
      return NextResponse.json({
        error: "Campos obrigatórios faltando",
        debug: { name: !!name, location: !!location, startDate: !!startDate, endDate: !!endDate }
      }, { status: 400 })
    }

    console.log("Creating event with data:", {
      name,
      description,
      location,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      capacity,
      createdBy: session.user.id,
    })

    const event = await prisma.event.create({
      data: {
        name,
        description,
        location,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        capacity: capacity ? parseInt(capacity) : null,
        createdBy: session.user.id,
      },
      include: {
        _count: {
          select: { eventParticipants: true },
        },
      },
    })

    console.log("Event created successfully:", event.id)

    return NextResponse.json({
      success: true,
      event,
    })
  } catch (error) {
    console.error("Erro ao criar evento:", error)
    return NextResponse.json(
      { 
        error: "Erro ao criar evento",
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
