import { NextResponse } from "next/server"
import { getDriveToken } from "@/lib/blob"

export async function GET() {
  try {
    const token = await getDriveToken()
    return NextResponse.json({ connected: !!token })
  } catch {
    return NextResponse.json({ connected: false })
  }
}
