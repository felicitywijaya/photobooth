import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import PhotoboothApp from "@/components/photobooth/PhotoboothApp"

export default async function PhotoboothPage() {
  const session = await auth()
  if (!session) redirect("/login")

  return <PhotoboothApp />
}
