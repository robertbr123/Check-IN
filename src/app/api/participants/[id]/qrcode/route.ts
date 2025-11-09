import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import QRCode from "qrcode"

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const participant = await prisma.participant.findUnique({
      where: { id: params.id },
    })

    if (!participant) {
      return NextResponse.json(
        { error: "Participante não encontrado" },
        { status: 404 }
      )
    }

    // Gera o QR code como data URL
    const qrCodeDataUrl = await QRCode.toDataURL(participant.qrCode, {
      width: 400,
      margin: 2,
      color: {
        dark: "#2563eb", // Azul
        light: "#ffffff",
      },
    })

    return NextResponse.json({
      qrCode: qrCodeDataUrl,
      qrCodeText: participant.qrCode,
    })
  } catch (error) {
    console.error("Erro ao gerar QR code:", error)
    return NextResponse.json(
      { error: "Erro ao gerar QR code" },
      { status: 500 }
    )
  }
}
