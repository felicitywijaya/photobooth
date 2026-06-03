import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { deleteTemplate } from "@/lib/blob"

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id } = await params
    await deleteTemplate(id)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("deleteTemplate error:", err)
    return NextResponse.json({ error: "Failed to delete template" }, { status: 500 })
  }
}
