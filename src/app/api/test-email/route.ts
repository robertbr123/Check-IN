import { NextResponse } from "next/server"
import { verifyEmailConfig } from "@/lib/email"

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const result = await verifyEmailConfig()
    
    const envCheck = {
      SMTP_HOST: !!process.env.SMTP_HOST,
      SMTP_PORT: !!process.env.SMTP_PORT,
      SMTP_USER: !!process.env.SMTP_USER,
      SMTP_PASS: !!process.env.SMTP_PASS,
      SMTP_FROM: !!process.env.SMTP_FROM,
      values: {
        SMTP_HOST: process.env.SMTP_HOST || 'not configured',
        SMTP_PORT: process.env.SMTP_PORT || 'not configured',
        SMTP_USER: process.env.SMTP_USER ? process.env.SMTP_USER.substring(0, 3) + '***' : 'not configured',
        SMTP_FROM: process.env.SMTP_FROM || 'not configured',
      }
    }
    
    return NextResponse.json({
      ...result,
      environment: envCheck,
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 })
  }
}
