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
      eventParticipants: await prisma.eventParticipant.count(),
      checkIns: await prisma.checkIn.count(),
      
      // Eventos com inscrições
      eventsWithParticipants: await prisma.event.findMany({
        select: {
          id: true,
          name: true,
          _count: {
            select: { eventParticipants: true }
          }
        }
      })
    }
    
    return NextResponse.json({
      status: "ok",
      stats,
    })
  } catch (error) {
    return NextResponse.json({
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
