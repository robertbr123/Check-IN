import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    // Rotas que precisam de ADMIN
    const adminRoutes = ["/dashboard/users"]
    
    // Rotas que precisam de ADMIN ou GESTOR
    const gestorRoutes = [
      "/dashboard/events",
      "/dashboard/participants",
      "/dashboard/reports",
    ]

    // Verifica se é rota de admin e usuário não é admin
    if (adminRoutes.some(route => path.startsWith(route))) {
      if (token?.role !== "ADMIN") {
        return NextResponse.redirect(new URL("/dashboard", req.url))
      }
    }

    // Verifica se é rota de gestor e usuário não é admin nem gestor
    if (gestorRoutes.some(route => path.startsWith(route))) {
      if (token?.role !== "ADMIN" && token?.role !== "GESTOR") {
        return NextResponse.redirect(new URL("/dashboard", req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  matcher: ["/dashboard/:path*"],
}
