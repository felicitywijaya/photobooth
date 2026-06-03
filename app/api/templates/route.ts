import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { listTemplates, uploadTemplate } from "@/lib/blob"

export async function GET() {
  try {
    const templates = await listTemplates()
    return NextResponse.json(templates)
  } catch (err) {
    console.error("listTemplates error:", err)
    return NextResponse.json({ error: "Failed to list templates" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const allowed = [".png", ".jpg", ".jpeg"]
    const ext = file.name.toLowerCase().match(/\.[^.]+$/)?.[0] ?? ""
    if (!allowed.includes(ext)) {
      return NextResponse.json({ error: "Only PNG, JPG, or JPEG files are allowed" }, { status: 400 })
    }

    const template = await uploadTemplate(file)
    return NextResponse.json(template)
  } catch (err) {
    console.error("uploadTemplate error:", err)
    return NextResponse.json({ error: "Failed to upload template" }, { status: 500 })
  }
}
