import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import DriveSetup from "@/components/admin/DriveSetup"
import Link from "next/link"
import { Suspense } from "react"

export default async function SetupDrivePage() {
  const session = await auth()
  if (!session || session.user.role !== "admin") redirect("/photobooth")

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <header className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-wide">Google Drive Setup</h1>
        <Link
          href="/admin"
          className="text-sm text-zinc-400 hover:text-white transition-colors"
        >
          ← Back to Admin
        </Link>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12">
        <Suspense fallback={<div className="text-zinc-500">Loading...</div>}>
          <DriveSetup />
        </Suspense>
      </main>
    </div>
  )
}
