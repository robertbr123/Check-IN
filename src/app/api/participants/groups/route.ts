import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Listar grupos únicos (cargos e empresas) para seleção em massa
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Buscar todos os participantes com cargo e empresa
    const participants = await prisma.participant.findMany({
      select: {
        id: true,
        position: true,
        company: true,
      },
    })

    // Extrair cargos únicos (não nulos e não vazios)
    const positionsMap = new Map<string, string[]>()
    const companiesMap = new Map<string, string[]>()

    participants.forEach((p: { id: string; position: string | null; company: string | null }) => {
      // Processar cargos
      if (p.position && p.position.trim() !== "") {
        const positionKey = p.position.trim().toLowerCase()
        if (!positionsMap.has(positionKey)) {
          positionsMap.set(positionKey, [])
        }
        positionsMap.get(positionKey)!.push(p.id)
      }

      // Processar empresas
      if (p.company && p.company.trim() !== "") {
        const companyKey = p.company.trim().toLowerCase()
        if (!companiesMap.has(companyKey)) {
          companiesMap.set(companyKey, [])
        }
        companiesMap.get(companyKey)!.push(p.id)
      }
    })

    // Converter para array ordenado com contagem
    const positions = Array.from(positionsMap.entries())
      .map(([key, ids]) => ({
        name: participants.find((p: { id: string; position: string | null; company: string | null }) => p.position?.trim().toLowerCase() === key)?.position || key,
        count: ids.length,
        participantIds: ids,
      }))
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))

    const companies = Array.from(companiesMap.entries())
      .map(([key, ids]) => ({
        name: participants.find((p: { id: string; position: string | null; company: string | null }) => p.company?.trim().toLowerCase() === key)?.company || key,
        count: ids.length,
        participantIds: ids,
      }))
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))

    return NextResponse.json({
      positions,
      companies,
    })
  } catch (error) {
    console.error("Erro ao listar grupos:", error)
    return NextResponse.json(
      { error: "Erro ao listar grupos" },
      { status: 500 }
    )
  }
}
