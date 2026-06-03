import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import TemplateManager from "@/components/admin/TemplateManager"
import AdminSignOut from "@/components/admin/AdminSignOut"
import Link from "next/link"

export default async function AdminPage() {
  const session = await auth()
  if (!session || session.user.role !== "admin") redirect("/login")

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <header className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-wide">Admin Panel</h1>
        <div className="flex items-center gap-4">
          <Link
            href="/admin/setup-drive"
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            Google Drive Setup
          </Link>
          <AdminSignOut />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <TemplateManager />
      </main>
    </div>
  )
}
