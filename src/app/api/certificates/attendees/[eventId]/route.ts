import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET /api/certificates/attendees/[eventId]
// Retorna participantes que fizeram check-in no evento
export async function GET(
  _request: Request,
  { params }: { params: { eventId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    if (session.user.role === "OPERADOR") return NextResponse.json({ error: "Sem permissão" }, { status: 403 })

    const eventParticipants = await prisma.eventParticipant.findMany({
      where: {
        eventId: params.eventId,
        checkIns: { some: {} }, // apenas quem tem pelo menos 1 check-in
      },
      include: {
        participant: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: {
        participant: { name: "asc" },
      },
    })

    const attendees = eventParticipants.map((ep) => ({
      id: ep.participant.id,
      name: ep.participant.name,
      email: ep.participant.email,
    }))

    return NextResponse.json(attendees)
  } catch (error) {
    console.error("Erro ao buscar presentes:", error)
    return NextResponse.json({ error: "Erro ao buscar presentes" }, { status: 500 })
  }
}
