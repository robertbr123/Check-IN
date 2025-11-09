import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { compare, hash } from "bcryptjs"

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({
        error: "Email e senha são obrigatórios",
      }, { status: 400 })
    }

    // Busca o usuário
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return NextResponse.json({
        status: "user_not_found",
        message: "Usuário não encontrado",
        email,
      })
    }

    // Verifica se está ativo
    if (!user.active) {
      return NextResponse.json({
        status: "user_inactive",
        message: "Usuário inativo",
        user: {
          email: user.email,
          name: user.name,
          active: user.active,
        },
      })
    }

    // Testa a senha
    const isPasswordValid = await compare(password, user.password)

    if (!isPasswordValid) {
      // Mostra informações para debug
      const testHash = await hash(password, 10)
      
      return NextResponse.json({
        status: "invalid_password",
        message: "Senha incorreta",
        debug: {
          email: user.email,
          passwordProvided: password,
          passwordMatch: false,
          storedPasswordHash: user.password.substring(0, 20) + "...",
          testHashForProvidedPassword: testHash.substring(0, 20) + "...",
        },
      })
    }

    // Login OK
    return NextResponse.json({
      status: "success",
      message: "Login bem-sucedido!",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        active: user.active,
      },
    })
  } catch (error) {
    console.error("Erro no test-login:", error)
    return NextResponse.json({
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 })
  }
}
