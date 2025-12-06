import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import QRCode from 'qrcode'

export const dynamic = 'force-dynamic'

// Chave de API para integração (configurável via env)
const INTEGRATION_API_KEY = process.env.INTEGRATION_API_KEY || ''

/**
 * Middleware para validar API Key de integração
 */
function validateApiKey(request: Request): boolean {
  const authHeader = request.headers.get('authorization')
  const apiKey = authHeader?.replace('Bearer ', '')
  
  // Se não houver chave configurada, permite acesso (desenvolvimento)
  if (!INTEGRATION_API_KEY) {
    return true
  }
  
  return apiKey === INTEGRATION_API_KEY
}

/**
 * GET /api/integration/rhf/events
 * Retorna eventos e QR codes de um funcionário pelo CPF
 * Query params: cpf (obrigatório)
 * 
 * Usado pelo Portal do Funcionário do RHF para mostrar QR codes de eventos
 */
export async function GET(request: Request) {
  try {
    // Validar API Key
    if (!validateApiKey(request)) {
      return NextResponse.json({ error: "API Key inválida" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const cpf = searchParams.get('cpf')

    if (!cpf) {
      return NextResponse.json(
        { error: "CPF é obrigatório" },
        { status: 400 }
      )
    }

    // Limpar CPF (remover pontos e traços)
    const cleanCpf = cpf.replace(/\D/g, '')

    // Buscar participante pelo CPF
    const participant = await prisma.participant.findUnique({
      where: { document: cleanCpf }
    })

    if (!participant) {
      return NextResponse.json({
        events: [],
        message: "Nenhum evento encontrado para este CPF"
      })
    }

    // Buscar inscrições em eventos ativos
    const eventParticipants = await prisma.eventParticipant.findMany({
      where: {
        participantId: participant.id,
        cancelled: false,
        event: {
          deletedAt: null,
          // Apenas eventos futuros ou em andamento
          endDate: {
            gte: new Date()
          }
        }
      },
      include: {
        event: true,
        checkIns: {
          orderBy: { checkInTime: 'desc' },
          take: 5
        }
      },
      orderBy: {
        event: {
          startDate: 'asc'
        }
      }
    })

    // Gerar QR codes como imagem base64
    const eventsWithQR = await Promise.all(
      eventParticipants.map(async (ep) => {
        const qrCodeImage = await QRCode.toDataURL(ep.qrCode, {
          width: 300,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#ffffff'
          }
        })

        return {
          id: ep.id,
          eventId: ep.event.id,
          eventName: ep.event.name,
          eventDescription: ep.event.description,
          eventLocation: ep.event.location,
          eventStartDate: ep.event.startDate,
          eventEndDate: ep.event.endDate,
          qrCode: ep.qrCode,
          qrCodeImage: qrCodeImage,
          registeredAt: ep.registeredAt,
          checkIns: ep.checkIns.map(ci => ({
            type: ci.status,
            time: ci.checkInTime,
            checkOutTime: ci.checkOutTime
          })),
          lastCheckIn: ep.checkIns[0] || null
        }
      })
    )

    return NextResponse.json({
      participant: {
        id: participant.id,
        name: participant.name,
        email: participant.email,
        document: participant.document
      },
      events: eventsWithQR
    })
  } catch (error) {
    console.error("Erro ao buscar eventos do participante:", error)
    return NextResponse.json(
      { error: "Erro ao buscar eventos" },
      { status: 500 }
    )
  }
}
