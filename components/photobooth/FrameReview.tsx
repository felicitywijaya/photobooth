"use client"

import Image from "next/image"

interface FrameReviewProps {
  frames: (string | null)[]
  onReshoot: (index: number) => void
  onContinue: () => void
}

export default function FrameReview({ frames, onReshoot, onContinue }: FrameReviewProps) {
  const allCaptured = frames.every((f) => f !== null)

  return (
    <div className="fixed inset-0 bg-zinc-950 flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-6 gap-6 overflow-auto">
        <h2 className="text-2xl font-bold text-white tracking-wide">Review Your Photos</h2>
        <p className="text-zinc-400 text-sm">Tap Reshoot to retake any frame</p>

        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-3xl justify-center">
          {frames.map((frame, i) => (
            <div
              key={i}
              className="flex-1 min-w-0 flex flex-col items-center gap-3"
            >
              <div className="relative w-full aspect-video bg-zinc-800 rounded-xl overflow-hidden border border-zinc-700">
                {frame ? (
                  <Image
                    src={frame}
                    alt={`Frame ${i + 1}`}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-zinc-600">
                    <span className="text-4xl">📷</span>
                  </div>
                )}
                <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                  Frame {i + 1}
                </div>
              </div>
              <button
                onClick={() => onReshoot(i)}
                className="w-full bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors border border-zinc-700"
              >
                Reshoot
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={onContinue}
          disabled={!allCaptured}
          className="mt-2 bg-white text-black font-bold text-lg px-12 py-4 rounded-xl hover:bg-zinc-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Continue →
        </button>
      </div>
    </div>
  )
}
