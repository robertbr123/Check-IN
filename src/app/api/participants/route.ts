import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateQRCode } from "@/lib/utils"

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Extrair query params
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const eventId = searchParams.get('eventId') || ''

    // Construir filtros
    const where: any = {}
    
    if (eventId) {
      where.eventId = eventId
    }

    if (search) {
      where.participant = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { company: { contains: search, mode: 'insensitive' } },
        ]
      }
    }

    const eventParticipants = await prisma.eventParticipant.findMany({
      where,
      include: {
        participant: true,
        event: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        registeredAt: "desc",
      },
    })

    return NextResponse.json(eventParticipants)
  } catch (error) {
    console.error("Erro ao listar participantes:", error)
    return NextResponse.json(
      { error: "Erro ao listar participantes" },
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
    const { name, email, phone, document, company, position, eventId } = body

    // 1. Buscar ou criar participante
    const participant = await prisma.participant.upsert({
      where: { email },
      update: {
        name,
        phone,
        document,
        company,
        position,
      },
      create: {
        name,
        email,
        phone,
        document,
        company,
        position,
      },
    })

    // 2. Verificar se já está inscrito neste evento
    const existingRegistration = await prisma.eventParticipant.findUnique({
      where: {
        participantId_eventId: {
          participantId: participant.id,
          eventId,
        },
      },
    })

    if (existingRegistration) {
      return NextResponse.json(
        { error: "Participante já cadastrado neste evento" },
        { status: 400 }
      )
    }

    // 3. Criar inscrição no evento com QR Code único
    const qrCode = generateQRCode()
    
    const eventParticipant = await prisma.eventParticipant.create({
      data: {
        participantId: participant.id,
        eventId,
        qrCode,
        status: "CONFIRMED",
      },
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
    console.error("Erro ao criar participante:", error)
    return NextResponse.json(
      { error: "Erro ao criar participante" },
      { status: 500 }
    )
  }
}
