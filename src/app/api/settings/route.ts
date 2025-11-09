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

    // Buscar configurações (sempre há apenas 1 registro)
    let settings = await prisma.settings.findFirst()

    // Se não existir, criar com valores padrão
    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          systemName: "Check-IN System",
          primaryColor: "#2563eb",
          secondaryColor: "#1e40af",
          accentColor: "#3b82f6",
          successColor: "#16a34a",
          warningColor: "#eab308",
          errorColor: "#dc2626",
          emailFromName: "Check-IN System",
          emailSubject: "Seu QR Code de Check-in",
        },
      })
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error("Erro ao buscar configurações:", error)
    return NextResponse.json(
      { error: "Erro ao buscar configurações" },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Apenas ADMIN pode alterar configurações
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 })
    }

    const body = await request.json()

    // Buscar configurações existentes
    let settings = await prisma.settings.findFirst()

    if (settings) {
      // Atualizar
      settings = await prisma.settings.update({
        where: { id: settings.id },
        data: body,
      })
    } else {
      // Criar
      settings = await prisma.settings.create({
        data: body,
      })
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error("Erro ao atualizar configurações:", error)
    return NextResponse.json(
      { error: "Erro ao atualizar configurações" },
      { status: 500 }
    )
  }
}
