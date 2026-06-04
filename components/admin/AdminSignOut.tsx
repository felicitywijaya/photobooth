"use client"

import { signOut } from "next-auth/react"

export default function AdminSignOut() {
  async function handleSignOut() {
    await signOut({ redirect: false })
    window.location.href = "/login"
  }

  return (
    <button
      onClick={handleSignOut}
      className="text-sm bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-lg transition-colors"
    >
      Sign Out
    </button>
  )
}
