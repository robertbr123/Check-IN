import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET /api/certificates/templates?eventId=xxx — retorna template do evento
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    if (session.user.role === "OPERADOR") return NextResponse.json({ error: "Sem permissão" }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get("eventId")

    if (!eventId) return NextResponse.json({ error: "eventId obrigatório" }, { status: 400 })

    const template = await prisma.certificateTemplate.findUnique({
      where: { eventId },
    })

    return NextResponse.json(template ?? null)
  } catch (error) {
    console.error("Erro ao buscar template:", error)
    return NextResponse.json({ error: "Erro ao buscar template" }, { status: 500 })
  }
}

// POST /api/certificates/templates — cria novo template
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    if (session.user.role === "OPERADOR") return NextResponse.json({ error: "Sem permissão" }, { status: 403 })

    const body = await request.json()
    const { eventId, imageData, imageMime, nameX, nameY, fontSize, fontColor, fontFamily, bold, italic, textAlign, showCpf, cpfX, cpfY, cpfFontSize } = body

    if (!eventId || !imageData) {
      return NextResponse.json({ error: "eventId e imageData são obrigatórios" }, { status: 400 })
    }

    const template = await prisma.certificateTemplate.create({
      data: {
        eventId,
        imageData,
        imageMime: imageMime || "image/jpeg",
        nameX: nameX ?? 50,
        nameY: nameY ?? 60,
        fontSize: fontSize ?? 60,
        fontColor: fontColor || "#000000",
        fontFamily: fontFamily || "helvetica",
        bold: bold ?? false,
        italic: italic ?? false,
        textAlign: textAlign || "center",
        showCpf: showCpf ?? false,
        cpfX: cpfX ?? 50,
        cpfY: cpfY ?? 68,
        cpfFontSize: cpfFontSize ?? 36,
        createdBy: session.user.id,
      },
    })

    return NextResponse.json(template)
  } catch (error) {
    console.error("Erro ao criar template:", error)
    return NextResponse.json({ error: "Erro ao criar template" }, { status: 500 })
  }
}

// PUT /api/certificates/templates?id=xxx — atualiza template existente
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    if (session.user.role === "OPERADOR") return NextResponse.json({ error: "Sem permissão" }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 })

    const body = await request.json()
    const { imageData, imageMime, nameX, nameY, fontSize, fontColor, fontFamily, bold, italic, textAlign, showCpf, cpfX, cpfY, cpfFontSize } = body

    const template = await prisma.certificateTemplate.update({
      where: { id },
      data: {
        ...(imageData && { imageData }),
        ...(imageMime && { imageMime }),
        nameX: nameX ?? undefined,
        nameY: nameY ?? undefined,
        fontSize: fontSize ?? undefined,
        fontColor: fontColor || undefined,
        fontFamily: fontFamily || undefined,
        bold: bold ?? undefined,
        italic: italic ?? undefined,
        textAlign: textAlign || undefined,
        showCpf: showCpf ?? undefined,
        cpfX: cpfX ?? undefined,
        cpfY: cpfY ?? undefined,
        cpfFontSize: cpfFontSize ?? undefined,
      },
    })

    return NextResponse.json(template)
  } catch (error) {
    console.error("Erro ao atualizar template:", error)
    return NextResponse.json({ error: "Erro ao atualizar template" }, { status: 500 })
  }
}

// DELETE /api/certificates/templates?id=xxx — remove template
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    if (session.user.role === "OPERADOR") return NextResponse.json({ error: "Sem permissão" }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 })

    await prisma.certificateTemplate.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao remover template:", error)
    return NextResponse.json({ error: "Erro ao remover template" }, { status: 500 })
  }
}
