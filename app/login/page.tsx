"use client"

import { signIn } from "next-auth/react"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const data = new FormData(e.currentTarget)
    const result = await signIn("credentials", {
      username: data.get("username"),
      password: data.get("password"),
      redirect: false,
    })

    setLoading(false)

    if (result?.error) {
      setError("Invalid username or password")
    } else {
      router.push("/photobooth")
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-white tracking-widest uppercase">
            Photobooth
          </h1>
          <p className="text-zinc-500 mt-2 text-sm">Sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              name="username"
              type="text"
              placeholder="Username"
              required
              autoComplete="username"
              className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-white transition-colors placeholder-zinc-500"
            />
          </div>
          <div>
            <input
              name="password"
              type="password"
              placeholder="Password"
              required
              autoComplete="current-password"
              className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-white transition-colors placeholder-zinc-500"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black font-semibold rounded-lg px-4 py-3 text-sm hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  )
}
