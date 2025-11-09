import { NextResponse } from "next/server"
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
})

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    // Query direta sem usar o schema do Prisma
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `
    
    const participants = await prisma.$queryRaw`
      SELECT * FROM participants LIMIT 10;
    `
    
    const participantCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM participants;
    `
    
    return NextResponse.json({
      status: "ok",
      tables,
      participants,
      participantCount,
    })
  } catch (error) {
    return NextResponse.json({
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 })
  }
}
