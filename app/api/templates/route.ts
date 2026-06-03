import { NextResponse } from "next/server"
import { readdir } from "fs/promises"
import path from "path"

export async function GET() {
  try {
    const templatesDir = path.join(process.cwd(), "public", "templates")
    const files = await readdir(templatesDir)
    const templates = files
      .filter((f) => /\.(png|jpg|jpeg)$/i.test(f))
      .map((f) => ({
        id: f,
        name: f.replace(/\.[^.]+$/, ""),
        url: `/templates/${f}`,
      }))
    return NextResponse.json(templates)
  } catch {
    return NextResponse.json([])
  }
}
