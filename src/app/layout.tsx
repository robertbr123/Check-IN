import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import ThemeProvider from "@/components/providers/ThemeProvider"
import ToastProvider from "@/components/providers/ToastProvider"
import { SettingsProvider } from "@/components/providers/SettingsProvider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Check-IN System",
  description: "Sistema de gerenciamento de check-in para eventos",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <SettingsProvider>
            {children}
            <ToastProvider />
          </SettingsProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
