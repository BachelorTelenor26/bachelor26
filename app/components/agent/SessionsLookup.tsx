'use client'

import { useState } from 'react'
import { LayoutGrid } from 'lucide-react'

interface SessionLookupProps {
  onSubmit: (code: string) => void
  error: string | null
  isLoading: boolean
}

export default function SessionLookup({ onSubmit, error, isLoading }: SessionLookupProps) {
  const [code, setCode] = useState('')

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit(code.trim())
      }}
      className="flex flex-col gap-3"
    >
      <div className="flex w-full gap-2">
        <div className="flex flex-1 items-center gap-3 rounded-lg border border-gray-400 bg-white px-4 py-3 transition-all focus-within:border-[#0064FA] focus-within:ring-2 focus-within:ring-[#0064FA]/10">
          <LayoutGrid className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="KS-JQJV-8ULV"
            required
            aria-invalid={!!error}
            aria-describedby={error ? 'session-error' : undefined}
            className="flex-1 font-mono text-sm outline-none placeholder:font-sans placeholder:normal-case placeholder:text-gray-400"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || code.length < 4}
          className="rounded-lg bg-[#1F74BF] px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-[#0055D4] disabled:cursor-not-allowed disabled:opacity-90"
        >
          {isLoading ? 'Søker...' : 'Slå opp'}
        </button>
      </div>

      {error && (
        <p id="session-error" role="alert" className="text-sm text-red-500">
          {error}
        </p>
      )}
    </form>
  )
}