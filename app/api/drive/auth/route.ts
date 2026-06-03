import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getAuthUrl } from "@/lib/drive"

export async function GET() {
  const session = await auth()
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const url = getAuthUrl()
  return NextResponse.redirect(url)
}
