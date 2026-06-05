"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Image from "next/image"
import { compositeImages } from "@/lib/composite"

interface Template {
  id: string
  name: string
  url: string
}

interface TemplateSelectorProps {
  frames: string[]
  onConfirm: (composedUrl: string) => void
}

const SELECTION_TIMEOUT = 30

export default function TemplateSelector({ frames, onConfirm }: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Template | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isCompositing, setIsCompositing] = useState(false)
  const [countdown, setCountdown] = useState(SELECTION_TIMEOUT)

  const compositeCacheRef = useRef<Map<string, string>>(new Map())
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const selectedRef = useRef<Template | null>(null)
  const hasAutoConfirmed = useRef(false)

  const selectTemplate = useCallback(async (template: Template) => {
    setSelected(template)
    selectedRef.current = template

    const cached = compositeCacheRef.current.get(template.id)
    if (cached) {
      setPreviewUrl(cached)
      setIsCompositing(false)
      return
    }

    setIsCompositing(true)
    setPreviewUrl(null)

    const id = template.id
    try {
      const url = await compositeImages(frames, template.url)
      compositeCacheRef.current.set(id, url)
      if (selectedRef.current?.id === id) {
        setPreviewUrl(url)
        setIsCompositing(false)
      }
    } catch (e) {
      console.error("Compositing failed:", e)
      if (selectedRef.current?.id === id) setIsCompositing(false)
    }
  }, [frames])

  useEffect(() => {
    fetch("/api/templates")
      .then((r) => r.json())
      .then((data: Template[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setTemplates(data)
          selectTemplate(data[0])
        }
      })
      .finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (loading || templates.length === 0) return

    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!)
          if (!hasAutoConfirmed.current) {
            hasAutoConfirmed.current = true
            const target = selectedRef.current ?? templates[0]
            if (target) {
              const cached = compositeCacheRef.current.get(target.id)
              if (cached) {
                onConfirm(cached)
              } else {
                compositeImages(frames, target.url)
                  .then((url) => onConfirm(url))
                  .catch(console.error)
              }
            }
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, templates.length])

  const handleConfirm = useCallback(() => {
    if (!selected) return
    const cached = compositeCacheRef.current.get(selected.id)
    if (!cached) return
    if (timerRef.current) clearInterval(timerRef.current)
    onConfirm(cached)
  }, [selected, onConfirm])

  const circumference = 2 * Math.PI * 44
  const dashOffset = circumference * (1 - countdown / SELECTION_TIMEOUT)

  return (
    <div className="fixed inset-0 bg-zinc-950 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0">
        <h2 className="text-xl font-bold text-white tracking-wide">Pilih Frame</h2>

        {/* Countdown ring */}
        <div className="relative w-14 h-14 flex items-center justify-center">
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="44" fill="none" stroke="#27272a" strokeWidth="8" />
            <circle
              cx="50" cy="50" r="44" fill="none"
              stroke={countdown <= 5 ? "#ef4444" : "#ffffff"}
              strokeWidth="8" strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              className="transition-all duration-1000"
            />
          </svg>
          <span className={`text-sm font-bold z-10 ${countdown <= 5 ? "text-red-400" : "text-white"}`}>
            {countdown}
          </span>
        </div>
      </div>

      {/* Preview area */}
      <div className="flex-1 flex items-center justify-center px-4 min-h-0">
        {loading ? (
          <div className="w-48 aspect-[3/4] bg-zinc-800 rounded-xl animate-pulse" />
        ) : isCompositing ? (
          <div className="w-48 aspect-[3/4] bg-zinc-800 rounded-xl flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-4 border-zinc-600 border-t-white rounded-full animate-spin" />
            <p className="text-zinc-400 text-xs">Memuat preview...</p>
          </div>
        ) : previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt="Preview"
            className="max-h-full max-w-full object-contain rounded-xl shadow-2xl"
            style={{ maxHeight: "calc(100vh - 260px)" }}
          />
        ) : (
          <div className="w-48 aspect-[3/4] bg-zinc-800 rounded-xl" />
        )}
      </div>

      {/* Thumbnail row */}
      <div className="flex-shrink-0 px-4 py-3">
        {!loading && templates.length > 1 && (
          <div className="flex gap-3 overflow-x-auto pb-1 justify-center">
            {templates.map((template) => {
              const isSelected = selected?.id === template.id
              return (
                <button
                  key={template.id}
                  onClick={() => selectTemplate(template)}
                  className={`relative flex-shrink-0 w-16 aspect-[3/4] rounded-lg overflow-hidden border-2 transition-all ${
                    isSelected
                      ? "border-white shadow-lg shadow-white/20"
                      : "border-zinc-700 hover:border-zinc-400 opacity-60 hover:opacity-100"
                  }`}
                >
                  <Image
                    src={template.url}
                    alt={template.name}
                    fill
                    className="object-contain bg-zinc-800"
                    sizes="64px"
                  />
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Confirm button */}
      <div className="flex-shrink-0 px-4 pb-6 flex flex-col items-center gap-2">
        <button
          onClick={handleConfirm}
          disabled={!previewUrl || isCompositing}
          className="bg-white text-black font-bold text-lg px-12 py-4 rounded-2xl hover:bg-zinc-200 active:scale-95 transition-all shadow-xl disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
        >
          Pakai Frame Ini
        </button>
        <p className="text-zinc-600 text-xs">Auto-pilih saat timer habis</p>
      </div>
    </div>
  )
}
