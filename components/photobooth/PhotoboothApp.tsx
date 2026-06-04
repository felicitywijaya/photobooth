"use client"

import { useCallback, useState } from "react"
import { signOut } from "next-auth/react"
import CameraCapture from "./CameraCapture"
import FrameReview from "./FrameReview"
import TemplateSelector from "./TemplateSelector"

type Phase = "idle" | "camera" | "review" | "template-select" | "processing" | "done" | "error"

interface Template {
  id: string
  name: string
  url: string
  createdAt: string
}

interface Rect {
  x: number
  y: number
  width: number
  height: number
}

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
        results.forEach(({ index, dataUrl }) => {
          next[index] = dataUrl
        })
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

  // ── Template selection callback ────────────────────────────────────────────

  const handleTemplateSelected = useCallback(
    async (template: Template) => {
      setPhase("processing")
      try {
        const composed = await compositeImages(frames as string[], template.url)
        setFinalImage(composed)
        downloadImage(composed)
        setPhase("done")

        setTimeout(() => {
          setFrames([null, null, null])
          setFinalImage(null)
          setPhase("idle")
        }, 8000)
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : "Something went wrong")
        setPhase("error")
      }
    },
    [frames]
  )

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
            Photobooth
          </h1>
          <p className="text-zinc-400 text-lg">3 frames · 5 seconds each</p>
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
    return <TemplateSelector onSelect={handleTemplateSelected} />
  }

  if (phase === "processing") {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center gap-6">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-zinc-700 rounded-full" />
          <div className="absolute inset-0 border-4 border-t-white rounded-full animate-spin" />
        </div>
        <p className="text-white text-xl font-semibold">Creating your photo...</p>
      </div>
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
  const filename = `photobooth_${new Date().toISOString().replace(/[:.]/g, "-")}.jpg`
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
    // iOS Safari: download attribute tidak support — user bisa long-press gambar untuk save
  }
}

// ── Canvas compositing ───────────────────────────────────────────────────────

async function compositeImages(frames: string[], templateUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const templateImg = new window.Image()
    templateImg.crossOrigin = "anonymous"

    templateImg.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = templateImg.naturalWidth
      canvas.height = templateImg.naturalHeight
      const ctx = canvas.getContext("2d")!

      // Detect transparent regions from template
      ctx.drawImage(templateImg, 0, 0)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const regions = detectPlaceholderRegions(imageData, 3)

      // Clear and draw white background
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = "#ffffff"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Load and draw each frame into its region
      const loadPromises = frames.slice(0, regions.length).map((frameDataUrl, i) => {
        return new Promise<void>((res, rej) => {
          const photo = new window.Image()
          photo.onload = () => {
            const region = regions[i]
            const scaleX = region.width / photo.naturalWidth
            const scaleY = region.height / photo.naturalHeight
            const scale = Math.max(scaleX, scaleY)
            const scaledW = photo.naturalWidth * scale
            const scaledH = photo.naturalHeight * scale
            const offsetX = region.x + (region.width - scaledW) / 2
            const offsetY = region.y + (region.height - scaledH) / 2

            ctx.save()
            ctx.beginPath()
            ctx.rect(region.x, region.y, region.width, region.height)
            ctx.clip()
            ctx.drawImage(photo, offsetX, offsetY, scaledW, scaledH)
            ctx.restore()
            res()
          }
          photo.onerror = rej
          photo.src = frameDataUrl
        })
      })

      Promise.all(loadPromises)
        .then(() => {
          // Draw template on top so frame borders/decorations appear over photos
          ctx.drawImage(templateImg, 0, 0)
          resolve(canvas.toDataURL("image/jpeg", 0.82))
        })
        .catch(reject)
    }

    templateImg.onerror = reject
    templateImg.src = templateUrl
  })
}

function detectPlaceholderRegions(imageData: ImageData, count: number): Rect[] {
  const { data, width, height } = imageData
  const ROW_COVERAGE_THRESHOLD = 0.15
  const MIN_HEIGHT = 20

  // Check if the template has any real transparency (PNG with alpha holes)
  let hasTransparency = false
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < 128) { hasTransparency = true; break }
  }

  // For PNG: match transparent pixels. For JPEG: match gray placeholder boxes.
  // Gray placeholders: R≈G≈B (channels within 25 of each other) and mid-brightness (150–225).
  function isPlaceholder(pixelIndex: number): boolean {
    if (hasTransparency) return data[pixelIndex + 3] < 50
    const r = data[pixelIndex], g = data[pixelIndex + 1], b = data[pixelIndex + 2]
    const avg = (r + g + b) / 3
    return avg > 150 && avg < 225 &&
      Math.abs(r - g) < 25 && Math.abs(g - b) < 25 && Math.abs(r - b) < 25
  }

  const rowCoverage = new Float32Array(height)
  for (let y = 0; y < height; y++) {
    let count = 0
    for (let x = 0; x < width; x++) {
      if (isPlaceholder((y * width + x) * 4)) count++
    }
    rowCoverage[y] = count / width
  }

  const bands: Array<{ start: number; end: number }> = []
  let inBand = false
  let bandStart = 0

  for (let y = 0; y < height; y++) {
    if (rowCoverage[y] >= ROW_COVERAGE_THRESHOLD && !inBand) {
      inBand = true
      bandStart = y
    } else if (rowCoverage[y] < ROW_COVERAGE_THRESHOLD && inBand) {
      inBand = false
      if (y - bandStart >= MIN_HEIGHT) bands.push({ start: bandStart, end: y - 1 })
    }
  }
  if (inBand && height - bandStart >= MIN_HEIGHT) {
    bands.push({ start: bandStart, end: height - 1 })
  }

  const regions: Rect[] = bands.map(({ start, end }) => {
    let xMin = width
    let xMax = -1
    for (let y = start; y <= end; y++) {
      for (let x = 0; x < width; x++) {
        if (isPlaceholder((y * width + x) * 4)) {
          if (x < xMin) xMin = x
          if (x > xMax) xMax = x
        }
      }
    }
    return { x: xMin, y: start, width: xMax - xMin + 1, height: end - start + 1 }
  })

  // Take the `count` largest regions, then sort by vertical position
  regions.sort((a, b) => b.width * b.height - a.width * a.height)
  const top = regions.slice(0, count)
  top.sort((a, b) => a.y - b.y)
  return top
}
