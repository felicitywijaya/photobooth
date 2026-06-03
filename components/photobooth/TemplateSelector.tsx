"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Image from "next/image"

interface Template {
  id: string
  name: string
  url: string
  createdAt: string
}

interface TemplateSelectorProps {
  onSelect: (template: Template) => void
}

const SELECTION_TIMEOUT = 15

export default function TemplateSelector({ onSelect }: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Template | null>(null)
  const [countdown, setCountdown] = useState(SELECTION_TIMEOUT)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const hasAutoSelected = useRef(false)

  const confirm = useCallback(
    (template: Template) => {
      if (timerRef.current) clearInterval(timerRef.current)
      onSelect(template)
    },
    [onSelect]
  )

  useEffect(() => {
    fetch("/api/templates")
      .then((r) => r.json())
      .then((data: Template[]) => {
        setTemplates(Array.isArray(data) ? data : [])
        if (Array.isArray(data) && data.length > 0) setSelected(data[0])
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (loading || templates.length === 0) return

    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!)
          if (!hasAutoSelected.current) {
            hasAutoSelected.current = true
            const target = selected ?? templates[0]
            if (target) onSelect(target)
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, templates.length])

  const circumference = 2 * Math.PI * 44
  const dashOffset = circumference * (1 - countdown / SELECTION_TIMEOUT)

  return (
    <div className="fixed inset-0 bg-zinc-950 flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-6 gap-6 overflow-auto">
        <h2 className="text-2xl font-bold text-white tracking-wide">Choose Your Frame</h2>

        {/* Countdown ring */}
        <div className="relative w-24 h-24 flex items-center justify-center">
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="44" fill="none" stroke="#27272a" strokeWidth="6" />
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              stroke={countdown <= 5 ? "#ef4444" : "#ffffff"}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              className="transition-all duration-1000"
            />
          </svg>
          <span className={`text-3xl font-bold z-10 ${countdown <= 5 ? "text-red-400" : "text-white"}`}>
            {countdown}
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 w-full max-w-2xl">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-zinc-800 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center text-zinc-400 py-8">
            <p className="text-4xl mb-3">🖼️</p>
            <p>No templates available. Ask the admin to upload one.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 w-full max-w-2xl">
            {templates.map((template) => {
              const isSelected = selected?.id === template.id
              return (
                <button
                  key={template.id}
                  onClick={() => {
                    setSelected(template)
                    confirm(template)
                  }}
                  className={`relative aspect-[3/4] rounded-xl overflow-hidden border-2 transition-all ${
                    isSelected
                      ? "border-white scale-[1.02] shadow-xl shadow-white/20"
                      : "border-zinc-700 hover:border-zinc-400"
                  }`}
                >
                  <Image
                    src={template.url}
                    alt={template.name}
                    fill
                    className="object-contain bg-zinc-800"
                    sizes="(max-width: 640px) 50vw, 33vw"
                  />
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent px-2 py-2">
                    <p className="text-white text-xs truncate">{template.name}</p>
                  </div>
                  {isSelected && (
                    <div className="absolute top-2 right-2 bg-white text-black text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold">
                      ✓
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        )}

        <p className="text-zinc-500 text-sm">
          Auto-selects highlighted template when timer runs out
        </p>
      </div>
    </div>
  )
}
