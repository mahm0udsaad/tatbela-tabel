"use client"

import { AlertTriangle, Check } from "lucide-react"

type StatusBannerProps = {
  statusMessage: string | null
  errorMessage: string | null
}

export function StatusBanner({ statusMessage, errorMessage }: StatusBannerProps) {
  if (!statusMessage && !errorMessage) return null
  const isError = Boolean(errorMessage)
  const message = errorMessage ?? statusMessage ?? ""
  return (
    <div
      className={`rounded-xl border px-4 py-3 text-sm font-semibold flex items-center gap-2 ${
        isError ? "border-red-200 bg-red-50 text-red-700" : "border-green-200 bg-green-50 text-green-700"
      }`}
    >
      {isError ? <AlertTriangle size={18} /> : <Check size={18} />}
      {message}
    </div>
  )
}
