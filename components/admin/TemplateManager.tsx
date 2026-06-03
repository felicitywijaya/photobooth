"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"

interface Template {
  id: string
  name: string
  url: string
  createdAt: string
}

export default function TemplateManager() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function fetchTemplates() {
    setLoading(true)
    try {
      const res = await fetch("/api/templates")
      const data = await res.json()
      setTemplates(Array.isArray(data) ? data : [])
    } catch {
      setError("Failed to load templates")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTemplates()
  }, [])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.name.toLowerCase().endsWith(".png")) {
      setError("Only PNG files are supported")
      return
    }

    setUploading(true)
    setError("")

    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await fetch("/api/templates", { method: "POST", body: formData })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Upload failed")
      }
      await fetchTemplates()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  async function handleDelete(id: string) {
    setDeleteId(id)
    try {
      const res = await fetch(`/api/templates/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Delete failed")
      setTemplates((prev) => prev.filter((t) => t.id !== id))
    } catch {
      setError("Failed to delete template")
    } finally {
      setDeleteId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Frame Templates</h2>
          <p className="text-zinc-400 text-sm mt-1">
            Upload PNG files with 3 transparent rectangular areas (top to bottom = frame 1, 2, 3)
          </p>
        </div>
        <label className={`cursor-pointer bg-white text-black font-semibold rounded-lg px-5 py-2.5 text-sm hover:bg-zinc-200 transition-colors ${uploading ? "opacity-50 cursor-not-allowed" : ""}`}>
          {uploading ? "Uploading..." : "Upload Template"}
          <input
            ref={fileRef}
            type="file"
            accept=".png,image/png"
            className="hidden"
            onChange={handleUpload}
            disabled={uploading}
          />
        </label>
      </div>

      {error && (
        <div className="bg-red-900/40 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-sm">
          {error}
          <button onClick={() => setError("")} className="ml-2 underline">Dismiss</button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="aspect-[3/4] bg-zinc-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center py-20 text-zinc-500">
          <p className="text-4xl mb-4">🖼️</p>
          <p className="text-lg">No templates yet</p>
          <p className="text-sm mt-1">Upload a PNG template to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {templates.map((template) => (
            <div
              key={template.id}
              className="group relative bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 hover:border-zinc-600 transition-colors"
            >
              <div className="relative aspect-[3/4] bg-zinc-800">
                <Image
                  src={template.url}
                  alt={template.name}
                  fill
                  className="object-contain"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
              </div>
              <div className="p-3">
                <p className="text-sm text-zinc-300 truncate" title={template.name}>
                  {template.name}
                </p>
                <p className="text-xs text-zinc-600 mt-0.5">
                  {new Date(template.createdAt).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => handleDelete(template.id)}
                disabled={deleteId === template.id}
                className="absolute top-2 right-2 bg-red-600 hover:bg-red-500 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
              >
                {deleteId === template.id ? "..." : "Delete"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
