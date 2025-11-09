import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const stats = {
      users: await prisma.user.count(),
      events: await prisma.event.count(),
      participants: await prisma.participant.count(),
      checkIns: await prisma.checkIn.count(),
      
      // Participantes agrupados por email (para ver duplicatas)
      uniqueEmails: await prisma.participant.groupBy({
        by: ['email'],
        _count: {
          email: true
        }
      }),
      
      // Eventos com participantes
      eventsWithParticipants: await prisma.event.findMany({
        select: {
          id: true,
          name: true,
          _count: {
            select: { participants: true }
          }
        }
      })
    }
    
    return NextResponse.json({
      status: "ok",
      stats,
      duplicateEmails: stats.uniqueEmails.filter(e => e._count.email > 1)
    })
  } catch (error) {
    return NextResponse.json({
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
