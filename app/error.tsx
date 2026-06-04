"use client"

import { useEffect } from "react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center gap-6 px-4 text-center">
      <p className="text-red-400 text-2xl font-bold">Terjadi Kesalahan</p>
      <p className="text-zinc-400 text-sm max-w-sm">
        Halaman tidak dapat dimuat. Coba muat ulang.
      </p>
      <button
        onClick={reset}
        className="bg-white text-black font-semibold px-8 py-3 rounded-xl hover:bg-zinc-200 transition-colors"
      >
        Muat Ulang
      </button>
    </div>
  )
}
