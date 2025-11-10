import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import QRCode from "qrcode"

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(
  request: Request,
  { params }: { params: { code: string } }
) {
  try {
    const { code } = params

    // Buscar participante pelo QR Code
    const eventParticipant = await prisma.eventParticipant.findFirst({
      where: {
        qrCode: code,
        status: {
          not: "CANCELLED",
        },
      },
      include: {
        participant: true,
        event: true,
      },
    })

    if (!eventParticipant) {
      return NextResponse.json(
        { error: "QR Code não encontrado ou cancelado" },
        { status: 404 }
      )
    }

    // Gerar imagem do QR Code
    const qrCodeImage = await QRCode.toDataURL(eventParticipant.qrCode, {
      width: 400,
      margin: 2,
      color: {
        dark: "#2563EB",
        light: "#FFFFFF",
      },
    })

    return NextResponse.json({
      participant: {
        name: eventParticipant.participant.name,
        email: eventParticipant.participant.email,
        phone: eventParticipant.participant.phone,
        company: eventParticipant.participant.company,
      },
      event: {
        name: eventParticipant.event.name,
        description: eventParticipant.event.description,
        location: eventParticipant.event.location,
        startDate: eventParticipant.event.startDate,
        endDate: eventParticipant.event.endDate,
      },
      qrCode: eventParticipant.qrCode,
      qrCodeImage,
    })
  } catch (error) {
    console.error("Erro ao buscar QR Code público:", error)
    return NextResponse.json(
      { error: "Erro ao buscar QR Code" },
      { status: 500 }
    )
  }
}
