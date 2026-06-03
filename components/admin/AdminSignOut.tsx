"use client"

import { signOut } from "next-auth/react"

export default function AdminSignOut() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="text-sm bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-lg transition-colors"
    >
      Sign Out
    </button>
  )
}
