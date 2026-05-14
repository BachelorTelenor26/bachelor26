'use client'

import { useState } from 'react'
import { Check, ChevronDown, ChevronUp } from 'lucide-react'
import Image from 'next/image'
const TELENOR_IMAGE_PREFIX = 'https://www.telenor.no/_ipx/f_webp'

function resolveImageUrl(url: string): string {
  if (url.startsWith('http')) return url
  return `${TELENOR_IMAGE_PREFIX}${url.startsWith('/') ? '' : '/'}${url}`
}

type BodyBlock = {
  type: string
  content?: { text: string }[]
  items?: { text: string }[][]
}

interface Answer {
  id: string
  step: { title: string; imageUrl?: string | null }
  body?: BodyBlock[] | null
  choice: { label: string } | null
  customText: string | null
}

interface SessionStepListProps {
  answers: Answer[]
  totalSteps: number
}

function BodyContent({ blocks }: { blocks: BodyBlock[] }) {
  return (
    <div className="flex flex-col gap-2 mt-2 text-sm text-gray-600">
      {blocks.map((block, i) => {
        if (block.type === 'paragraph') {
          return (
            <p key={i}>
              {block.content?.map((c) => c.text).join('')}
            </p>
          )
        }
        if (block.type === 'ordered-list') {
          return (
            <ol key={i} className="list-decimal list-inside flex flex-col gap-1">
              {block.items?.map((item, j) => (
                <li key={j}>{item.map((c) => c.text).join('')}</li>
              ))}
            </ol>
          )
        }
        if (block.type === 'unordered-list') {
          return (
            <ul key={i} className="list-disc list-inside flex flex-col gap-1">
              {block.items?.map((item, j) => (
                <li key={j}>{item.map((c) => c.text).join('')}</li>
              ))}
            </ul>
          )
        }
        return null
      })}
    </div>
  )
}

export default function SessionStepList({ answers }: SessionStepListProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h2 className="font-semibold text-gray-900 mb-4">Hva kunden har forsøkt</h2>
      <div className="flex flex-col gap-3">
        {answers.map((answer) => {
          const isOpen = expanded.has(answer.id)
          const hasDetails = (answer.body && answer.body.length > 0) || answer.step.imageUrl

          return (
            <div
              key={answer.id}
              className="pb-3 border-b border-gray-100 last:border-0 last:pb-0"
            >
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <button
                    onClick={() => hasDetails && toggle(answer.id)}
                    className={`w-full text-left flex items-center justify-between gap-2 ${hasDetails ? 'cursor-pointer' : 'cursor-default'}`}
                  >
                    <p className="text-sm font-medium text-gray-900">{answer.step.title}</p>
                    {hasDetails && (
                      isOpen
                        ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
                        : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                    )}
                  </button>
                  {answer.choice && (
                    <p className="text-xs text-gray-400 mt-0.5">Svar: {answer.choice.label}</p>
                  )}
                  {isOpen && (
                    <div className="mt-3">
                      {answer.step.imageUrl && (
                        <div className="mb-3 rounded-lg overflow-hidden border border-gray-100">
                          <Image
                            src={resolveImageUrl(answer.step.imageUrl)}
                            alt={answer.step.title}
                            className="w-full object-contain max-h-64"
                          />
                        </div>
                      )}
                      {answer.body && answer.body.length > 0 && (
                        <BodyContent blocks={answer.body} />
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
