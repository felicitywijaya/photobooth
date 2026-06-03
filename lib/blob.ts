import { put, list } from "@vercel/blob"

// Used only for storing Google Drive OAuth token

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
