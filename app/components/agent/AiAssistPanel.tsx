'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Sparkles, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import { parseResponse } from '@/app/lib/utils'

interface AiAssistPanelProps {
  sessionId?: string
  initialHistory?: ApiHistoryMessage[]
}

type StreamState = 'idle' | 'streaming' | 'error' | 'rate-limit'

interface ConversationMessage {
  role: 'agent' | 'ai'
  content: string
  parsed?: { direct: string; further: string } | null
}

type ApiHistoryMessage = {
  role: 'agent' | 'ai'
  content: string
}

function formatTextWithCode(text: string) {
  return text.split(/`([^`]+)`/g).map((part, index) => {
    if (index % 2 === 1) {
      return (
        <code
          key={index}
          className="bg-black/5 border border-black/10 text-gray-800 px-1.5 py-0.5 rounded-md font-mono text-xs"
        >
          {part}
        </code>
      )
    }
    return <span key={index}>{part}</span>
  })
}

function ResponseSection({
  title,
  content,
  color,
  isLatestAiMessage,
  showCursor,
}: {
  title: string
  content: string
  color: string
  isLatestAiMessage?: boolean
  showCursor?: boolean
}) {
  const [open, setOpen] = useState(isLatestAiMessage !== false)

  if (!content && !showCursor) return null
  return (
    <div className={`rounded-lg border ${color} overflow-hidden`}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-left hover:bg-black/5 transition-colors"
      >
        {title}
        {open ? <ChevronUp className="w-4 h-4 shrink-0" /> : <ChevronDown className="w-4 h-4 shrink-0" />}
      </button>
      {open && (
        <div className="px-4 pb-4 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
          {formatTextWithCode(content)}
          {showCursor && <span className="inline-block w-1.5 h-3.5 bg-gray-400 animate-pulse ml-0.5 align-middle" />}
        </div>
      )}
    </div>
  )
}

export default function AiAssistPanel({ sessionId, initialHistory = [] }: AiAssistPanelProps) {
  const [conversation, setConversation] = useState<ConversationMessage[]>(
    initialHistory.map((message) => ({
      role: message.role,
      content: message.content,
      parsed: message.role === 'ai' ? parseResponse(message.content) : null,
    }))
  )
  const [agentNotes, setAgentNotes] = useState('')
  const [currentStreaming, setCurrentStreaming] = useState('')
  const [state, setState] = useState<StreamState>('idle')
  const hasInitializedRef = useRef(false)
  const abortRef = useRef<AbortController | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [conversation, currentStreaming])

  const handleAnalyze = useCallback(async (isInitial: boolean = false) => {
    const notesToSend = isInitial ? undefined : agentNotes.trim() || undefined
    if (!sessionId && !notesToSend) return

    if (notesToSend) {
      setConversation((prev) => [...prev, { role: 'agent', content: notesToSend }])
      setAgentNotes('')
    }

    const historyForRequest: ApiHistoryMessage[] = conversation.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }))

    abortRef.current = new AbortController()
    setState('streaming')
    setCurrentStreaming('')

    try {
      const res = await fetch('/api/ai-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, agentNotes: notesToSend, history: historyForRequest }),
        signal: abortRef.current.signal,
      })

      if (res.status === 401) {
        setState('error')
        setCurrentStreaming('Du er ikke logget inn. Last siden på nytt og prøv igjen.')
        return
      }

      if (!res.ok || !res.body) {
        setState('error')
        setCurrentStreaming('En feil oppstod. Prøv igjen senere.')
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let full = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        full += chunk

        if (full.includes('RATE_LIMIT_ERROR')) {
          setState('rate-limit')
          setCurrentStreaming('')
          return
        }
        if (full.includes('SERVICE_UNAVAILABLE_ERROR')) {
          setState('error')
          setCurrentStreaming('AI-tjenesten er midlertidig utilgjengelig. Prøv igjen om litt.')
          return
        }
        if (full.includes('STREAM_ERROR')) {
          setState('error')
          setCurrentStreaming('En feil oppstod under analysen. Prøv igjen.')
          return
        }

        setCurrentStreaming((prev) => prev + chunk)
      }

      const parsed = parseResponse(full)
      setConversation((prev) => [...prev, { role: 'ai', content: full, parsed }])

      setState('idle')
      setCurrentStreaming('')
    } catch (err: unknown) {
      if ((err as { name?: string }).name === 'AbortError') return
      setState('error')
      setCurrentStreaming('Nettverksfeil. Sjekk internettilkoblingen din.')
    }
  }, [agentNotes, conversation, sessionId])

  useEffect(() => {
    if (sessionId && !hasInitializedRef.current && state === 'idle' && conversation.length === 0) {
      hasInitializedRef.current = true
      handleAnalyze(true)
    }
  }, [sessionId, state, conversation.length, handleAnalyze])

  const isStreaming = state === 'streaming'
  const parsedStreaming = currentStreaming ? parseResponse(currentStreaming) : null
  const hasFurtherHeader = currentStreaming.includes('**Videre feilsøking**')
  const latestAiMessageIndex = conversation.reduce(
    (latest, msg, index) => (msg.role === 'ai' ? index : latest),
    -1
  )

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 h-[75vh] max-h-[75vh] overflow-hidden flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-4 h-4 text-[#1F74BF]" />
        <h2 className="font-semibold text-gray-900">AI-assistent</h2>
        {isStreaming && (
          <div className="ml-auto flex items-center gap-1.5 text-xs text-gray-400">
            <Loader2 className="w-3 h-3 animate-spin" />
            Genererer svar...
          </div>
        )}
      </div>

      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto mb-4 pr-2 space-y-3"
      >
        {conversation.map((msg, idx) => (
          <div key={idx} className="space-y-2">
            {msg.role === 'agent' && (
              <div className="bg-gray-50 rounded-lg border border-gray-200 p-3 text-sm text-gray-700">
                <span className="font-semibold text-gray-600 block mb-1">Din oppfølging:</span>
                {msg.content}
              </div>
            )}
            {msg.role === 'ai' && (
              <div className="space-y-2">
                {msg.parsed ? (
                  <>
                    <ResponseSection
                      key={`direct-${idx}-${idx === latestAiMessageIndex ? 'latest' : 'old'}`}
                      title="Direkte løsning"
                      content={msg.parsed.direct}
                      color="border-green-200 bg-green-50/40"
                      isLatestAiMessage={idx === latestAiMessageIndex}
                    />
                    {msg.parsed.further && (
                      <ResponseSection
                        key={`further-${idx}-${idx === latestAiMessageIndex ? 'latest' : 'old'}`}
                        title="Videre feilsøking"
                        content={msg.parsed.further}
                        color="border-blue-200 bg-blue-50/40"
                        isLatestAiMessage={idx === latestAiMessageIndex}
                      />
                    )}
                  </>
                ) : (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {msg.content}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {isStreaming && (
          <div className="space-y-2">
            {parsedStreaming ? (
              <>
                <ResponseSection
                  title="Direkte løsning"
                  content={parsedStreaming.direct}
                  color="border-green-200 bg-green-50/40"
                  showCursor={!hasFurtherHeader}
                />
                {(parsedStreaming.further || hasFurtherHeader) && (
                  <ResponseSection
                    title="Videre feilsøking"
                    content={parsedStreaming.further}
                    color="border-blue-200 bg-blue-50/40"
                    showCursor={hasFurtherHeader}
                  />
                )}
              </>
            ) : currentStreaming ? (
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                {currentStreaming}
                <span className="inline-block w-1.5 h-3.5 bg-gray-400 animate-pulse ml-0.5 align-middle" />
              </div>
            ) : (
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-4 space-y-3 animate-pulse">
                <div className="h-3 bg-gray-200 rounded-full w-full" />
                <div className="h-3 bg-gray-200 rounded-full w-5/6" />
                <div className="h-3 bg-gray-200 rounded-full w-4/6" />
                <div className="pt-1 space-y-3">
                  <div className="h-3 bg-gray-200 rounded-full w-full" />
                  <div className="h-3 bg-gray-200 rounded-full w-3/4" />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {state === 'rate-limit' && (
        <div className="rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700 mb-3">
          Grensen for AI-forespørsler er nådd. Vent litt og prøv igjen.
        </div>
      )}

      {state === 'error' && currentStreaming && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 mb-3">
          {currentStreaming}
        </div>
      )}

      <div className="flex flex-col gap-3 border-t border-gray-200 pt-3">
        <textarea
          value={agentNotes}
          onChange={(e) => setAgentNotes(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              if (!isStreaming && (sessionId || agentNotes.trim())) {
                handleAnalyze(false)
              }
            }
          }}
          placeholder={
            sessionId
              ? 'Legg til oppfølgingsspørsmål eller mer informasjon fra kunden... (Enter for å sende, Shift+Enter for ny linje)'
              : 'Beskriv kundens problem — enhet, symptomer, hva kunden har forsøkt... (Enter for å sende)'
          }
          rows={2}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 outline-none resize-none focus:border-[#0064FA] focus:ring-2 focus:ring-[#0064FA]/10 transition-all"
        />

        <button
          onClick={() => handleAnalyze(false)}
          disabled={isStreaming || (!sessionId && !agentNotes.trim())}
          suppressHydrationWarning
          className="flex items-center justify-center gap-2 rounded-lg bg-[#1F74BF] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#0055D4] transition-colors disabled:opacity-60 disabled:cursor-not-allowed self-start"
        >
          {isStreaming ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyserer...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              {conversation.length > 0 ? 'Oppfølging' : 'Analyser'}
            </>
          )}
        </button>
      </div>
    </div>
  )
}
