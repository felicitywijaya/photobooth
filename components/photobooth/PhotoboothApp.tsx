"use client"

import { useCallback, useState } from "react"
import { signOut } from "next-auth/react"
import CameraCapture from "./CameraCapture"
import FrameReview from "./FrameReview"
import TemplateSelector from "./TemplateSelector"

type Phase = "idle" | "camera" | "review" | "template-select" | "done" | "error"

export default function PhotoboothApp() {
  const [phase, setPhase] = useState<Phase>("idle")
  const [frames, setFrames] = useState<(string | null)[]>([null, null, null])
  const [reshootIndex, setReshootIndex] = useState<number | null>(null)
  const [errorMessage, setErrorMessage] = useState("")
  const [finalImage, setFinalImage] = useState<string | null>(null)

  // ── Camera callbacks ───────────────────────────────────────────────────────

  const handleCaptureComplete = useCallback(
    (results: { index: number; dataUrl: string }[]) => {
      setFrames((prev) => {
        const next = [...prev]
        results.forEach(({ index, dataUrl }) => { next[index] = dataUrl })
        return next
      })
      setReshootIndex(null)
      setPhase("review")
    },
    []
  )

  // ── Review callbacks ───────────────────────────────────────────────────────

  const handleReshoot = useCallback((index: number) => {
    setReshootIndex(index)
    setPhase("camera")
  }, [])

  const handleReviewContinue = useCallback(() => {
    setPhase("template-select")
  }, [])

  // ── Template confirm callback ──────────────────────────────────────────────
  // Compositing is done inside TemplateSelector; we receive the final image URL.

  const handleTemplateConfirmed = useCallback((composedUrl: string) => {
    setFinalImage(composedUrl)
    downloadImage(composedUrl)
    setPhase("done")
    setTimeout(() => {
      setFrames([null, null, null])
      setFinalImage(null)
      setPhase("idle")
    }, 8000)
  }, [])

  // ── Reset ──────────────────────────────────────────────────────────────────

  const handleReset = useCallback(() => {
    setFrames([null, null, null])
    setFinalImage(null)
    setErrorMessage("")
    setReshootIndex(null)
    setPhase("idle")
  }, [])

  // ── Render ─────────────────────────────────────────────────────────────────

  if (phase === "idle") {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center gap-8 px-4">
        <div className="text-center space-y-3">
          <h1 className="text-5xl font-bold text-white tracking-widest uppercase">
            EchoBooth
          </h1>
          <p className="text-zinc-400 text-lg">3 frames · 10 seconds each</p>
        </div>

        <button
          onClick={() => setPhase("camera")}
          className="bg-white text-black font-bold text-2xl px-16 py-5 rounded-2xl hover:bg-zinc-200 active:scale-95 transition-all shadow-2xl"
        >
          Start Photo
        </button>

        <button
          onClick={async () => { await signOut({ redirect: false }); window.location.href = "/login" }}
          className="absolute bottom-6 right-6 text-zinc-600 hover:text-zinc-400 text-xs transition-colors"
        >
          Sign Out
        </button>
      </div>
    )
  }

  if (phase === "camera") {
    return (
      <CameraCapture
        reshootIndex={reshootIndex}
        existingFrames={frames}
        onComplete={handleCaptureComplete}
      />
    )
  }

  if (phase === "review") {
    return (
      <FrameReview
        frames={frames}
        onReshoot={handleReshoot}
        onContinue={handleReviewContinue}
      />
    )
  }

  if (phase === "template-select") {
    return (
      <TemplateSelector
        frames={frames.filter((f): f is string => f !== null)}
        onConfirm={handleTemplateConfirmed}
      />
    )
  }

  if (phase === "done") {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center gap-6 px-4">
        {finalImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={finalImage}
            alt="Your photo"
            className="max-h-[50vh] max-w-full object-contain rounded-xl shadow-2xl"
          />
        )}
        <div className="text-center space-y-2">
          <p className="text-green-400 text-2xl font-bold">✓ Photo Ready!</p>
          <p className="text-zinc-400 text-sm">
            Download otomatis dimulai. Jika tidak, tekan tombol di bawah.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => finalImage && downloadImage(finalImage)}
            className="bg-white text-black font-semibold px-6 py-3 rounded-xl hover:bg-zinc-200 transition-colors"
          >
            Download Lagi
          </button>
          <button
            onClick={handleReset}
            className="bg-zinc-800 text-white font-semibold px-6 py-3 rounded-xl hover:bg-zinc-700 transition-colors"
          >
            Foto Lagi
          </button>
        </div>
        <p className="text-zinc-600 text-xs">Otomatis reset dalam beberapa detik...</p>
      </div>
    )
  }

  if (phase === "error") {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center gap-6 px-4 text-center">
        <p className="text-red-400 text-2xl font-bold">Something went wrong</p>
        <p className="text-zinc-400 text-sm max-w-sm">{errorMessage}</p>
        <button
          onClick={handleReset}
          className="bg-white text-black font-semibold px-8 py-3 rounded-xl hover:bg-zinc-200 transition-colors"
        >
          Try Again
        </button>
      </div>
    )
  }

  return null
}

// ── Download ─────────────────────────────────────────────────────────────────

function downloadImage(dataUrl: string): void {
  const filename = `echobooth_${new Date().toISOString().replace(/[:.]/g, "-")}.jpg`
  try {
    const arr = dataUrl.split(",")
    const bstr = atob(arr[1])
    const u8arr = new Uint8Array(bstr.length)
    for (let i = 0; i < bstr.length; i++) u8arr[i] = bstr.charCodeAt(i)
    const blob = new Blob([u8arr], { type: "image/jpeg" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } catch {
    // iOS Safari: download attribute tidak support
  }
}
