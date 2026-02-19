import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import QRCode from 'qrcode'

export const dynamic = 'force-dynamic'

// Função para adicionar 5 horas e formatar data/hora para RHF
function formatDateTimeRHF(date: Date): string {
  const d = new Date(date)
  d.setHours(d.getHours() + 5)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${day}/${month}/${year}, ${hours}:${minutes}`
}

// Função para adicionar 5 horas a uma data (retorna ISO string)
function addFiveHours(date: Date): string {
  const d = new Date(date)
  d.setHours(d.getHours() + 5)
  return d.toISOString()
}

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

    // Buscar participante pelo CPF (tenta com e sem máscara)
    let participant = await prisma.participant.findUnique({
      where: { document: cleanCpf }
    })

    // Se não encontrar, tenta buscar com máscara (para dados antigos)
    if (!participant) {
      const maskedCpf = cleanCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
      participant = await prisma.participant.findUnique({
        where: { document: maskedCpf }
      })
    }

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
        status: {
          not: "CANCELLED"
        },
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
          eventStartDate: addFiveHours(ep.event.startDate),
          eventEndDate: addFiveHours(ep.event.endDate),
          eventStartDateFormatted: formatDateTimeRHF(ep.event.startDate),
          eventEndDateFormatted: formatDateTimeRHF(ep.event.endDate),
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
        document: participant.document?.replace(/\D/g, '') || ''
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
