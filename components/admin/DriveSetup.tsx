"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"

export default function DriveSetup() {
  const [connected, setConnected] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const searchParams = useSearchParams()
  const success = searchParams.get("success")
  const error = searchParams.get("error")

  useEffect(() => {
    fetch("/api/drive/status")
      .then((r) => r.json())
      .then((data) => {
        setConnected(data.connected)
        setLoading(false)
      })
      .catch(() => {
        setConnected(false)
        setLoading(false)
      })
  }, [success])

  return (
    <div className="space-y-8">
      {success && (
        <div className="bg-green-900/40 border border-green-700 text-green-300 px-4 py-3 rounded-lg text-sm">
          Google Drive connected successfully!
        </div>
      )}
      {error && (
        <div className="bg-red-900/40 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-sm">
          Authorization failed: {error}. Please try again.
        </div>
      )}

      <div className="bg-zinc-900 rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold">Connection Status</h2>

        {loading ? (
          <div className="flex items-center gap-2 text-zinc-400">
            <span className="animate-pulse">Checking connection...</span>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full ${connected ? "bg-green-500" : "bg-red-500"}`}
            />
            <span className={connected ? "text-green-400" : "text-red-400"}>
              {connected ? "Connected to Google Drive" : "Not connected"}
            </span>
          </div>
        )}
      </div>

      <div className="bg-zinc-900 rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold">
          {connected ? "Reconnect Google Drive" : "Connect Google Drive"}
        </h2>
        <p className="text-zinc-400 text-sm leading-relaxed">
          This grants the app permission to create folders and upload photos to your Google Drive.
          Photos are saved in a folder named by today&apos;s date (e.g. <code className="bg-zinc-800 px-1 rounded">2026-06-03</code>).
          You only need to do this once.
        </p>
        <a
          href="/api/drive/auth"
          className="inline-block bg-white text-black font-semibold rounded-lg px-6 py-3 text-sm hover:bg-zinc-200 transition-colors"
        >
          {connected ? "Reconnect" : "Connect"} with Google
        </a>
      </div>

      <div className="bg-zinc-900/50 rounded-xl p-4 text-xs text-zinc-500 space-y-1">
        <p className="font-medium text-zinc-400">Setup Instructions</p>
        <ol className="list-decimal list-inside space-y-1">
          <li>Go to Google Cloud Console and create a project</li>
          <li>Enable the Google Drive API</li>
          <li>Create OAuth 2.0 credentials (Web application)</li>
          <li>
            Add <code className="bg-zinc-800 px-1 rounded">{"{NEXTAUTH_URL}"}/api/drive/callback</code> as an authorized redirect URI
          </li>
          <li>Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your .env</li>
          <li>Click &quot;Connect with Google&quot; above</li>
        </ol>
      </div>
    </div>
  )
}
