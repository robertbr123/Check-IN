import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const [totalEvents, totalParticipants, totalCheckIns, totalUsers] = await Promise.all([
      prisma.event.count({ where: { active: true } }),
      prisma.participant.count({ where: { active: true } }),
      prisma.checkIn.count(),
      session.user.role === "ADMIN" ? prisma.user.count({ where: { active: true } }) : 0,
    ])

    return NextResponse.json({
      totalEvents,
      totalParticipants,
      totalCheckIns,
      totalUsers,
    })
  } catch (error) {
    console.error("Erro ao carregar estatísticas:", error)
    return NextResponse.json(
      { error: "Erro ao carregar estatísticas" },
      { status: 500 }
    )
  }
}
