import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { sendQRCodeEmail } from "@/lib/email"
import QRCode from "qrcode"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const participantId = params.id

    // Busca o participante com informações do evento
    const participant = await prisma.participant.findUnique({
      where: { id: participantId },
      include: {
        event: true,
      },
    })

    if (!participant) {
      return NextResponse.json(
        { error: "Participante não encontrado" },
        { status: 404 }
      )
    }

    // Gera QR Code como Data URL
    const qrCodeDataUrl = await QRCode.toDataURL(participant.qrCode, {
      width: 300,
      margin: 2,
      color: {
        dark: "#2563eb",
        light: "#ffffff",
      },
    })

    // Envia o email
    await sendQRCodeEmail({
      to: participant.email,
      participantName: participant.name,
      eventName: participant.event.name,
      eventLocation: participant.event.location || undefined,
      eventDate: participant.event.startDate,
      qrCodeDataUrl,
    })

    return NextResponse.json({
      success: true,
      message: "Email enviado com sucesso",
    })
  } catch (error) {
    console.error("Erro ao enviar email:", error)
    return NextResponse.json(
      { error: "Erro ao enviar email. Verifique as configurações SMTP." },
      { status: 500 }
    )
  }
}
