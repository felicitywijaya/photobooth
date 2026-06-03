import { put, del, list } from "@vercel/blob"
import { v4 as uuidv4 } from "uuid"

export interface Template {
  id: string
  name: string
  url: string
  createdAt: string
}

export async function listTemplates(): Promise<Template[]> {
  const { blobs } = await list({ prefix: "templates/" })
  return blobs.map((blob) => {
    const pathPart = blob.pathname.replace("templates/", "")
    const underscoreIdx = pathPart.indexOf("_")
    const id = pathPart.substring(0, underscoreIdx)
    const name = decodeURIComponent(pathPart.substring(underscoreIdx + 1))
    return {
      id,
      name,
      url: blob.url,
      createdAt: blob.uploadedAt.toISOString(),
    }
  })
}

function mimeFromName(filename: string): string {
  const ext = filename.toLowerCase().split(".").pop()
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg"
  return "image/png"
}

export async function uploadTemplate(file: File): Promise<Template> {
  const id = uuidv4()
  const safeName = encodeURIComponent(file.name)
  const blob = await put(`templates/${id}_${safeName}`, file, {
    access: "public",
    contentType: mimeFromName(file.name),
  })
  return {
    id,
    name: file.name,
    url: blob.url,
    createdAt: new Date().toISOString(),
  }
}

export async function deleteTemplate(id: string): Promise<void> {
  const { blobs } = await list({ prefix: `templates/${id}_` })
  for (const blob of blobs) {
    await del(blob.url)
  }
}

export async function saveDriveToken(token: object): Promise<void> {
  const content = JSON.stringify(token)
  const blob = new Blob([content], { type: "application/json" })
  await put("config/google-drive-token.json", blob, {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
  })
}

export async function getDriveToken(): Promise<object | null> {
  try {
    const { blobs } = await list({ prefix: "config/google-drive-token.json" })
    if (blobs.length === 0) return null
    const res = await fetch(blobs[0].url, { cache: "no-store" })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}
