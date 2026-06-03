import type { Metadata } from "next"
import "./globals.css"
import { auth } from "@/lib/auth"
import { SessionProvider } from "next-auth/react"

export const metadata: Metadata = {
  title: "Photobooth",
  description: "Digital Photobooth",
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  return (
    <html lang="en">
      <body className="bg-black text-white min-h-screen">
        <SessionProvider session={session}>{children}</SessionProvider>
      </body>
    </html>
  )
}
