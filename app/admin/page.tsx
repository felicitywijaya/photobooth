import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import AdminSignOut from "@/components/admin/AdminSignOut"
import { readdir } from "fs/promises"
import path from "path"
import Image from "next/image"

async function getTemplates() {
  try {
    const dir = path.join(process.cwd(), "public", "templates")
    const files = await readdir(dir)
    return files.filter((f) => /\.(png|jpg|jpeg)$/i.test(f))
  } catch {
    return []
  }
}

export default async function AdminPage() {
  const session = await auth()
  if (!session || session.user.role !== "admin") redirect("/login")

  const templates = await getTemplates()

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <header className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-wide">Admin Panel</h1>
        <AdminSignOut />
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">

        {/* Templates section */}
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">Frame Templates</h2>
            <p className="text-zinc-400 text-sm mt-1">
              Templates dibaca dari folder{" "}
              <code className="bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-300">
                public/templates/
              </code>{" "}
              di project. Tambah atau hapus file PNG/JPG di sana lalu redeploy.
            </p>
          </div>

          {templates.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-zinc-700 rounded-xl text-zinc-500">
              <p className="text-4xl mb-3">🖼️</p>
              <p className="text-lg">Belum ada template</p>
              <p className="text-sm mt-1">
                Taruh file PNG/JPG di folder{" "}
                <code className="bg-zinc-800 px-1 rounded">public/templates/</code>{" "}
                lalu redeploy
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {templates.map((file) => (
                <div
                  key={file}
                  className="bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800"
                >
                  <div className="relative aspect-[3/4] bg-zinc-800">
                    <Image
                      src={`/templates/${file}`}
                      alt={file}
                      fill
                      className="object-contain"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                  </div>
                  <div className="p-3">
                    <p className="text-sm text-zinc-300 truncate" title={file}>
                      {file.replace(/\.[^.]+$/, "")}
                    </p>
                    <p className="text-xs text-zinc-600 mt-0.5">{file}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
