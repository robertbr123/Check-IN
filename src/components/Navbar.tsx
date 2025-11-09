"use client"

import { signOut, useSession } from "next-auth/react"
import Link from "next/link"
import { Button } from "./ui/button"
import ThemeToggle from "./ThemeToggle"
import { useSettings } from "./providers/SettingsProvider"
import {
  Users,
  Calendar,
  UserCheck,
  BarChart3,
  QrCode,
  LogOut,
  Menu,
  X,
  Settings,
} from "lucide-react"
import { useState } from "react"

export function Navbar() {
  const { data: session } = useSession()
  const { settings } = useSettings()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleSignOut = () => {
    signOut({ callbackUrl: "/login" })
  }

  const isAdmin = session?.user?.role === "ADMIN"
  const isGestor = session?.user?.role === "GESTOR" || isAdmin
  const isOperador = session?.user?.role === "OPERADOR"
  const canAccessScanner = true // Todos podem acessar o scanner

  // Navbar simplificado para OPERADOR
  if (isOperador) {
    return (
      <nav className="bg-card border-b border-border sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo e Nome do Sistema */}
            <div className="flex items-center space-x-2">
              {settings?.logoUrl ? (
                <img 
                  src={settings.logoUrl} 
                  alt={settings.systemName} 
                  className="h-10 w-auto object-contain"
                />
              ) : (
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <QrCode className="w-6 h-6 text-white" />
                </div>
              )}
              <span className="font-bold text-xl text-blue-900">
                {settings?.systemName || "Check-IN"}
              </span>
            </div>

            {/* Botão Sair */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </Button>
          </div>
        </div>
      </nav>
    )
  }

  return (
    <nav className="bg-card border-b border-border sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center space-x-2">
            {settings?.logoUrl ? (
              <img 
                src={settings.logoUrl} 
                alt={settings.systemName} 
                className="h-10 w-auto object-contain"
              />
            ) : (
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <QrCode className="w-6 h-6 text-white" />
              </div>
            )}
            <span className="font-bold text-xl text-blue-900">
              {settings?.systemName || "Check-IN"}
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-1">
            {canAccessScanner && (
              <Link href="/dashboard/scanner">
                <Button variant="ghost" className="flex items-center gap-2">
                  <QrCode className="w-4 h-4" />
                  Scanner
                </Button>
              </Link>
            )}

            {isGestor && (
              <>
                <Link href="/dashboard/events">
                  <Button variant="ghost" className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Eventos
                  </Button>
                </Link>

                <Link href="/dashboard/participants">
                  <Button variant="ghost" className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4" />
                    Participantes
                  </Button>
                </Link>

                <Link href="/dashboard/reports">
                  <Button variant="ghost" className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Relatórios
                  </Button>
                </Link>
              </>
            )}

            {isAdmin && (
              <>
                <Link href="/dashboard/users">
                  <Button variant="ghost" className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Usuários
                  </Button>
                </Link>

                <Link href="/dashboard/settings">
                  <Button variant="ghost" className="flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Configurações
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* User Info & Logout */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />
            <div className="text-right">
              <p className="text-sm font-medium">
                {session?.user?.name}
              </p>
              <p className="text-xs text-muted-foreground">{session?.user?.role}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </Button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col space-y-2">
              {canAccessScanner && (
                <Link
                  href="/dashboard/scanner"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Button variant="ghost" className="w-full justify-start gap-2">
                    <QrCode className="w-4 h-4" />
                    Scanner
                  </Button>
                </Link>
              )}

              {isGestor && (
                <>
                  <Link
                    href="/dashboard/events"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Button variant="ghost" className="w-full justify-start gap-2">
                      <Calendar className="w-4 h-4" />
                      Eventos
                    </Button>
                  </Link>

                  <Link
                    href="/dashboard/participants"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Button variant="ghost" className="w-full justify-start gap-2">
                      <UserCheck className="w-4 h-4" />
                      Participantes
                    </Button>
                  </Link>

                  <Link
                    href="/dashboard/reports"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Button variant="ghost" className="w-full justify-start gap-2">
                      <BarChart3 className="w-4 h-4" />
                      Relatórios
                    </Button>
                  </Link>
                </>
              )}

              {isAdmin && (
                <>
                  <Link
                    href="/dashboard/users"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Button variant="ghost" className="w-full justify-start gap-2">
                      <Users className="w-4 h-4" />
                      Usuários
                    </Button>
                  </Link>

                  <Link
                    href="/dashboard/settings"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Button variant="ghost" className="w-full justify-start gap-2">
                      <Settings className="w-4 h-4" />
                      Configurações
                    </Button>
                  </Link>
                </>
              )}

              <div className="pt-4 border-t border-border mt-2">
                <div className="px-4 py-2 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">
                      {session?.user?.name}
                    </p>
                    <p className="text-xs text-muted-foreground">{session?.user?.role}</p>
                  </div>
                  <ThemeToggle />
                </div>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2 mt-2"
                  onClick={handleSignOut}
                >
                  <LogOut className="w-4 h-4" />
                  Sair
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
