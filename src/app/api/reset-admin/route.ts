import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hash } from "bcryptjs"

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST() {
  try {
    // Busca o admin
    const admin = await prisma.user.findUnique({
      where: { email: "admin@checkin.com" },
    })

    if (!admin) {
      // Se não existe, cria
      const hashedPassword = await hash("admin123", 10)
      
      const newAdmin = await prisma.user.create({
        data: {
          name: "Administrador",
          email: "admin@checkin.com",
          password: hashedPassword,
          role: "ADMIN",
          active: true,
        },
      })

      return NextResponse.json({
        status: "created",
        message: "Usuário admin criado com sucesso",
        credentials: {
          email: "admin@checkin.com",
          password: "admin123",
        },
      })
    }

    // Se existe, atualiza a senha
    const hashedPassword = await hash("admin123", 10)
    
    await prisma.user.update({
      where: { email: "admin@checkin.com" },
      data: {
        password: hashedPassword,
        active: true,
      },
    })

    return NextResponse.json({
      status: "updated",
      message: "Senha do admin resetada com sucesso",
      credentials: {
        email: "admin@checkin.com",
        password: "admin123",
      },
    })
  } catch (error) {
    console.error("Erro ao resetar admin:", error)
    return NextResponse.json(
      { 
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    )
  }
}
