import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    // Tenta conectar ao banco
    await prisma.$connect()
    
    // Testa uma query simples
    const userCount = await prisma.user.count()
    
    // Verifica variáveis de ambiente (sem expor valores sensíveis)
    const envCheck = {
      DATABASE_URL: !!process.env.DATABASE_URL,
      NEXTAUTH_URL: !!process.env.NEXTAUTH_URL,
      NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
      NODE_ENV: process.env.NODE_ENV,
    }
    
    return NextResponse.json({
      status: "ok",
      database: {
        connected: true,
        userCount,
      },
      environment: envCheck,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Debug error:", error)
    
    return NextResponse.json({
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error",
      environment: {
        DATABASE_URL: !!process.env.DATABASE_URL,
        NEXTAUTH_URL: !!process.env.NEXTAUTH_URL,
        NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
        NODE_ENV: process.env.NODE_ENV,
      },
    }, { status: 500 })
  }
}
