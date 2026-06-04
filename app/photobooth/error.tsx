"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function PhotoboothError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()

  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center gap-6 px-4 text-center">
      <p className="text-red-400 text-2xl font-bold">Terjadi Kesalahan</p>
      <p className="text-zinc-400 text-sm max-w-sm">
        Halaman tidak dapat dimuat. Coba muat ulang atau kembali ke halaman utama.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="bg-white text-black font-semibold px-6 py-3 rounded-xl hover:bg-zinc-200 transition-colors"
        >
          Coba Lagi
        </button>
        <button
          onClick={() => router.push("/login")}
          className="bg-zinc-800 text-white font-semibold px-6 py-3 rounded-xl hover:bg-zinc-700 transition-colors"
        >
          Login Ulang
        </button>
      </div>
    </div>
  )
}
