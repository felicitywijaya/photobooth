"use client"

import { useCallback, useEffect, useRef, useState } from "react"

interface CaptureResult {
  index: number
  dataUrl: string
}

interface CameraCaptureProps {
  reshootIndex: number | null
  existingFrames: (string | null)[]
  onComplete: (results: CaptureResult[]) => void
}

const COUNTDOWN_SECONDS = 10

export default function CameraCapture({ reshootIndex, existingFrames, onComplete }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [countdown, setCountdown] = useState<number | null>(null)
  const [currentFrameIdx, setCurrentFrameIdx] = useState(0)
  const [flash, setFlash] = useState(false)
  const [cameraError, setCameraError] = useState("")
  const [cameraReady, setCameraReady] = useState(false)
  const [capturedThisSession, setCapturedThisSession] = useState<CaptureResult[]>([])

  const frameIndices = reshootIndex !== null ? [reshootIndex] : [0, 1, 2]

  const captureFrame = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    const vW = video.videoWidth
    const vH = video.videoHeight

    // Crop to the portrait ratio the user sees on screen (object-cover preview).
    // Min 4:3 so landscape desktops still capture portrait.
    const targetRatio = Math.max(window.innerHeight / window.innerWidth, 4 / 3)
    const videoRatio = vH / vW

    let srcX = 0, srcY = 0, srcW = vW, srcH = vH
    if (videoRatio < targetRatio) {
      // Video wider than target — trim sides
      srcW = Math.round(vH / targetRatio)
      srcX = Math.round((vW - srcW) / 2)
    } else {
      // Video taller than target — trim top/bottom
      srcH = Math.round(vW * targetRatio)
      srcY = Math.round((vH - srcH) / 2)
    }

    canvas.width = srcW
    canvas.height = srcH

    const ctx = canvas.getContext("2d")!
    ctx.save()
    ctx.translate(canvas.width, 0)
    ctx.scale(-1, 1)
    ctx.drawImage(video, srcX, srcY, srcW, srcH, 0, 0, srcW, srcH)
    ctx.restore()

    return canvas.toDataURL("image/jpeg", 0.9)
  }, [])

  const startCountdown = useCallback(
    (stepIndex: number, accumulated: CaptureResult[]) => {
      let count = COUNTDOWN_SECONDS
      setCountdown(count)
      setCurrentFrameIdx(stepIndex)

      const tick = () => {
        count -= 1
        if (count > 0) {
          setCountdown(count)
          timerRef.current = setTimeout(tick, 1000)
        } else {
          setCountdown(0)
          // Flash + capture
          setFlash(true)
          setTimeout(() => setFlash(false), 300)

          const dataUrl = captureFrame()
          if (!dataUrl) return

          const frameIndex = frameIndices[stepIndex]
          const newResult: CaptureResult = { index: frameIndex, dataUrl }
          const newAccumulated = [...accumulated, newResult]

          setCapturedThisSession(newAccumulated)

          const nextStepIndex = stepIndex + 1
          if (nextStepIndex < frameIndices.length) {
            setTimeout(() => startCountdown(nextStepIndex, newAccumulated), 600)
          } else {
            setTimeout(() => {
              onComplete(newAccumulated)
            }, 400)
          }
        }
      }

      timerRef.current = setTimeout(tick, 1000)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [captureFrame, frameIndices, onComplete]
  )

  useEffect(() => {
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        })
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
      } catch (err) {
        console.error("Camera error:", err)
        setCameraError(
          "Camera access denied. Please allow camera permissions and reload."
        )
      }
    }
    startCamera()

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
      }
    }
  }, [])

  function handleVideoReady() {
    setCameraReady(true)
    // Small delay for camera to warm up
    setTimeout(() => startCountdown(0, []), 1000)
  }

  const currentTarget = frameIndices[currentFrameIdx]
  const frameLabel =
    reshootIndex !== null
      ? `Re-shooting Frame ${reshootIndex + 1}`
      : `Frame ${currentTarget + 1} of 3`

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center">
      {cameraError ? (
        <div className="text-center px-6">
          <p className="text-red-400 text-lg mb-4">{cameraError}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-white text-black px-6 py-3 rounded-lg font-semibold"
          >
            Reload Page
          </button>
        </div>
      ) : (
        <>
          {/* Camera feed */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            onCanPlay={handleVideoReady}
            style={{ transform: "scaleX(-1)" }}
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Hidden canvas for capture */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Flash overlay */}
          {flash && (
            <div className="absolute inset-0 bg-white z-30 pointer-events-none" />
          )}

          {/* HUD overlay */}
          {cameraReady && countdown !== null && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-between py-12 pointer-events-none">
              {/* Frame label */}
              <div className="bg-black/60 backdrop-blur-sm px-6 py-2 rounded-full">
                <p className="text-white text-lg font-semibold tracking-wide">{frameLabel}</p>
              </div>

              {/* Countdown */}
              <div className="flex flex-col items-center">
                <span
                  className="font-bold text-white leading-none"
                  style={{ fontSize: "clamp(6rem, 25vw, 14rem)", textShadow: "0 0 40px rgba(0,0,0,0.8)" }}
                >
                  {countdown === 0 ? "📸" : countdown}
                </span>
              </div>

              {/* Frame dots */}
              <div className="flex gap-3">
                {[0, 1, 2].map((i) => {
                  const allFrames = existingFrames.slice()
                  capturedThisSession.forEach((r) => {
                    allFrames[r.index] = r.dataUrl
                  })
                  const captured = !!allFrames[i]
                  const isCurrent = currentTarget === i && countdown !== null && countdown > 0
                  return (
                    <div
                      key={i}
                      className={`w-3 h-3 rounded-full transition-all ${
                        isCurrent
                          ? "bg-white scale-125"
                          : captured
                          ? "bg-green-400"
                          : "bg-zinc-600"
                      }`}
                    />
                  )
                })}
              </div>
            </div>
          )}

          {/* Loading state */}
          {!cameraReady && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/70">
              <p className="text-white text-lg animate-pulse">Starting camera...</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
