import { NextRequest, NextResponse } from "next/server"
import { exchangeCode } from "@/lib/drive"

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code")
  const error = req.nextUrl.searchParams.get("error")

  if (error) {
    return NextResponse.redirect(
      new URL(`/admin/setup-drive?error=${encodeURIComponent(error)}`, req.url)
    )
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/admin/setup-drive?error=no_code", req.url)
    )
  }

  try {
    await exchangeCode(code)
    return NextResponse.redirect(new URL("/admin/setup-drive?success=true", req.url))
  } catch (err) {
    console.error("Drive OAuth callback error:", err)
    return NextResponse.redirect(
      new URL("/admin/setup-drive?error=exchange_failed", req.url)
    )
  }
}
