import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * Health Check Endpoint
 * Verifica se a aplicação e o banco de dados estão funcionando
 */
export async function GET() {
  try {
    // Verificar conexão com o banco
    await prisma.$queryRaw`SELECT 1`

    // Obter informações básicas
    const uptime = process.uptime()
    const memoryUsage = process.memoryUsage()

    return NextResponse.json(
      {
        status: "healthy",
        timestamp: new Date().toISOString(),
        uptime: Math.floor(uptime),
        database: "connected",
        memory: {
          rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
          heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
          heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
        },
        environment: process.env.NODE_ENV,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Health check failed:", error)

    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        database: "disconnected",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 503 }
    )
  }
}
