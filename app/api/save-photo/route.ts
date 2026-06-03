import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { uploadPhotoToDrive } from "@/lib/drive"
import { v4 as uuidv4 } from "uuid"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { imageData } = await req.json()

    if (!imageData || typeof imageData !== "string") {
      return NextResponse.json({ error: "Invalid image data" }, { status: 400 })
    }

    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "")
    const buffer = Buffer.from(base64Data, "base64")

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
    const shortId = uuidv4().slice(0, 8)
    const filename = `photobooth_${timestamp}_${shortId}.jpg`

    const link = await uploadPhotoToDrive(buffer, filename)

    return NextResponse.json({ success: true, link })
  } catch (err) {
    console.error("save-photo error:", err)
    const message = err instanceof Error ? err.message : "Failed to save photo"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
