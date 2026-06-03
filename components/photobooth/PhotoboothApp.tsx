"use client"

import { useCallback, useState } from "react"
import { signOut } from "next-auth/react"
import CameraCapture from "./CameraCapture"
import FrameReview from "./FrameReview"
import TemplateSelector from "./TemplateSelector"

type Phase = "camera" | "review" | "template-select" | "processing" | "done" | "error"

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

interface PhotoboothAppProps {
  role: "admin" | "user"
}

export default function PhotoboothApp({ role }: PhotoboothAppProps) {
  const [phase, setPhase] = useState<Phase>("camera")
  const [frames, setFrames] = useState<(string | null)[]>([null, null, null])
  const [reshootIndex, setReshootIndex] = useState<number | null>(null)
  const [errorMessage, setErrorMessage] = useState("")
  const [finalImage, setFinalImage] = useState<string | null>(null)
  const [driveLink, setDriveLink] = useState("")

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

        const res = await fetch("/api/save-photo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageData: composed }),
        })

        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Save failed")

        setDriveLink(data.link)
        setPhase("done")

        // Auto-reset after 6 seconds
        setTimeout(() => {
          setFrames([null, null, null])
          setFinalImage(null)
          setDriveLink("")
          setPhase("camera")
        }, 6000)
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
    setDriveLink("")
    setErrorMessage("")
    setReshootIndex(null)
    setPhase("camera")
  }, [])

  // ── Render ─────────────────────────────────────────────────────────────────

  if (phase === "camera") {
    return (
      <>
        <CameraCapture
          reshootIndex={reshootIndex}
          existingFrames={frames}
          onComplete={handleCaptureComplete}
        />
        {role === "admin" && (
          <div className="fixed top-4 right-4 z-50 flex gap-2">
            <a
              href="/admin"
              className="bg-black/60 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-lg hover:bg-black/80 transition-colors"
            >
              Admin
            </a>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="bg-black/60 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-lg hover:bg-black/80 transition-colors"
            >
              Sign Out
            </button>
          </div>
        )}
        {role === "user" && (
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="fixed top-4 right-4 z-50 bg-black/60 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-lg hover:bg-black/80 transition-colors"
          >
            Sign Out
          </button>
        )}
      </>
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
        <p className="text-zinc-400 text-sm">Saving to Google Drive</p>
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
          <p className="text-green-400 text-2xl font-bold">✓ Photo Saved!</p>
          <p className="text-zinc-400 text-sm">Your photo has been saved to Google Drive</p>
        </div>
        <p className="text-zinc-500 text-sm">Starting over in a few seconds...</p>
        <button
          onClick={handleReset}
          className="bg-white text-black font-semibold px-8 py-3 rounded-xl hover:bg-zinc-200 transition-colors"
        >
          Take Another Photo
        </button>
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
      const regions = detectTransparentRegions(imageData, 3)

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

function detectTransparentRegions(imageData: ImageData, count: number): Rect[] {
  const { data, width, height } = imageData
  const ALPHA_THRESHOLD = 50
  const ROW_COVERAGE_THRESHOLD = 0.15
  const MIN_HEIGHT = 20

  const rowCoverage = new Float32Array(height)
  for (let y = 0; y < height; y++) {
    let transparentCount = 0
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] < ALPHA_THRESHOLD) transparentCount++
    }
    rowCoverage[y] = transparentCount / width
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
        if (data[(y * width + x) * 4 + 3] < ALPHA_THRESHOLD) {
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
