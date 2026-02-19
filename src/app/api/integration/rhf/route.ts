import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateQRCode } from "@/lib/utils"

export const dynamic = 'force-dynamic'

// URL base do RHF (configurável via env)
const RHF_API_URL = process.env.RHF_API_URL || 'http://localhost:3001/api'
const RHF_API_KEY = process.env.RHF_API_KEY || ''

/**
 * GET /api/integration/rhf
 * Buscar funcionários do RHF para cadastrar como participantes
 * Query params: search (nome ou CPF)
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''

    // Buscar funcionários no RHF
    const response = await fetch(`${RHF_API_URL}/integration/employees?search=${encodeURIComponent(search)}`, {
      headers: {
        'Authorization': `Bearer ${RHF_API_KEY}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error('Erro ao buscar funcionários no RHF')
    }

    const employees = await response.json()
    return NextResponse.json(employees)
  } catch (error) {
    console.error("Erro ao buscar funcionários RHF:", error)
    return NextResponse.json(
      { error: "Erro ao buscar funcionários do RHF" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/integration/rhf
 * Importar funcionário do RHF como participante e inscrevê-lo em um evento
 * Body: { employeeId, eventId }
 */
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
    const { employeeId, eventId } = body

    if (!employeeId || !eventId) {
      return NextResponse.json(
        { error: "employeeId e eventId são obrigatórios" },
        { status: 400 }
      )
    }

    // Buscar dados do funcionário no RHF
    const response = await fetch(`${RHF_API_URL}/integration/employees/${employeeId}`, {
      headers: {
        'Authorization': `Bearer ${RHF_API_KEY}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error('Funcionário não encontrado no RHF')
    }

    const employee = await response.json()

    // Limpar CPF (remover pontos e traços)
    const cleanCpf = employee.cpf?.replace(/\D/g, '') || ''

    // Verificar se o evento existe
    const event = await prisma.event.findUnique({
      where: { id: eventId }
    })

    if (!event) {
      return NextResponse.json(
        { error: "Evento não encontrado" },
        { status: 404 }
      )
    }

    // Criar ou atualizar participante usando CPF como identificador
    const participant = await prisma.participant.upsert({
      where: { document: cleanCpf },
      update: {
        name: employee.name,
        email: employee.email || '',
        phone: employee.phone || '',
        company: employee.department || '',
        position: employee.position || '',
      },
      create: {
        name: employee.name,
        email: employee.email || '',
        phone: employee.phone || '',
        document: cleanCpf,
        company: employee.department || '',
        position: employee.position || '',
      }
    })

    // Verificar se já está inscrito no evento
    const existingRegistration = await prisma.eventParticipant.findFirst({
      where: {
        participantId: participant.id,
        eventId: eventId
      }
    })

    if (existingRegistration) {
      return NextResponse.json({
        message: "Funcionário já está inscrito neste evento",
        participant: existingRegistration,
        alreadyRegistered: true
      })
    }

    // Criar inscrição no evento com QR Code
    const eventParticipant = await prisma.eventParticipant.create({
      data: {
        participantId: participant.id,
        eventId: eventId,
        qrCode: generateQRCode(),
      },
      include: {
        participant: true,
        event: true
      }
    })

    return NextResponse.json({
      message: "Funcionário importado e inscrito com sucesso",
      participant: eventParticipant,
      alreadyRegistered: false
    })
  } catch (error) {
    console.error("Erro ao importar funcionário:", error)
    return NextResponse.json(
      { error: "Erro ao importar funcionário do RHF" },
      { status: 500 }
    )
  }
}
