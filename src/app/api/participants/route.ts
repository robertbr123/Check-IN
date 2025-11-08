import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateQRCode } from "@/lib/utils"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const participants = await prisma.participant.findMany({
      include: {
        event: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
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

    // Verifica se já existe participante com mesmo email no evento
    const existing = await prisma.participant.findFirst({
      where: {
        email,
        eventId,
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: "Participante já cadastrado neste evento" },
        { status: 400 }
      )
    }

    // Gera QR code único
    const qrCode = generateQRCode()

    const participant = await prisma.participant.create({
      data: {
        name,
        email,
        phone,
        document,
        company,
        position,
        qrCode,
        eventId,
      },
      include: {
        event: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json(participant)
  } catch (error) {
    console.error("Erro ao criar participante:", error)
    return NextResponse.json(
      { error: "Erro ao criar participante" },
      { status: 500 }
    )
  }
}
