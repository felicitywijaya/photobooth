import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isAuthenticated = !!req.auth
  const role = req.auth?.user?.role

  if (pathname === "/login" && isAuthenticated) {
    const dest = role === "admin" ? "/admin" : "/photobooth"
    return NextResponse.redirect(new URL(dest, req.url))
  }

  if (!isAuthenticated && (pathname.startsWith("/photobooth") || pathname.startsWith("/admin"))) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  if (pathname.startsWith("/admin") && role !== "admin") {
    return NextResponse.redirect(new URL("/photobooth", req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/", "/login", "/photobooth/:path*", "/admin/:path*"],
}
