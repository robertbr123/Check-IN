"use client"

import { SessionProvider } from "next-auth/react"
import { Navbar } from "@/components/Navbar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SessionProvider>
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-6 md:py-8">{children}</main>
      </div>
    </SessionProvider>
  )
}
