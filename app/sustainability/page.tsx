import { Metadata } from 'next'
import fs from 'fs'
import path from 'path'

export const metadata: Metadata = {
  title: 'Bærekraft - Telenor Kunnskapsbase',
  description: 'Lighthouse-rapport og karbonavtrykk for Telenor Kunnskapsbase',
}

interface RunScores {
  performance: number
  accessibility: number
  bestPractices: number
  seo: number
}

interface LighthouseRun {
  runAt: string
  url: string
  scores: RunScores
}

interface LighthouseReport {
  generatedAt: string
  url: string
  averageScores: RunScores
  runs: LighthouseRun[]
}

interface WebsiteCarbonData {
  rating: string | null
  co2PerVisitGrams: number | null
  cleanerThanPercent: number | null
  lastTested: string | null
  hostIsGreen: boolean | null
}

const RECENT_RUN_COUNT = 3

function getReport(): LighthouseReport | null {
  try {
    const filePath = path.join(process.cwd(), 'public', 'lighthouse-report.json')
    const raw = fs.readFileSync(filePath, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('no-NO', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

function extractMatch(text: string, regex: RegExp): string | null {
  const match = text.match(regex)
  return match?.[1]?.trim() ?? null
}

function normalizeWebsiteCarbonText(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim()
}

function extractDataCountValue(html: string, anchor: RegExp): number | null {
  const match = html.match(anchor)
  if (!match) return null
  return parseNumber(match[1])
}

function parseNumber(value: string | null): number | null {
  if (!value) return null
  const parsed = Number.parseFloat(value.replace(',', '.'))
  return Number.isNaN(parsed) ? null : parsed
}

function normalizePercent(value: number | null): number | null {
  if (value === null) return null
  let normalized = value
  while (normalized > 100) normalized /= 100
  return normalized
}

function formatCarbonNumber(value: number | null, digits = 2) {
  if (value === null) return 'Ukjent'
  return new Intl.NumberFormat('no-NO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  }).format(value)
}

async function getWebsiteCarbonData(): Promise<WebsiteCarbonData | null> {
  try {
    const response = await fetch('https://www.websitecarbon.com/website/telenor-jensnic-no/', {
      next: { revalidate: 60 * 60 * 24 * 7 },
      headers: {
        'user-agent': 'Mozilla/5.0',
      },
    })

    if (!response.ok) return null

    const html = await response.text()
    const text = normalizeWebsiteCarbonText(html)
    const rating = extractMatch(html, /highlight--grade--([A-F][+-]?)/i)
      ?? extractMatch(text, /carbon rating of\s*([A-F]\s*[+-]?)/i)?.replace(/\s+/g, '')
      ?? extractMatch(text, /Website Carbon Calculator\s+([A-F][+-]?)/i)
      ?? extractMatch(text, /(^|\s)(A\+)(\s|$)/i)
    const co2PerVisitGrams = extractDataCountValue(
      html,
      /report-carbon__amount[\s\S]*?data-count="([0-9]+(?:\.[0-9]+)?)"[\s\S]*?id="js-emission-count"/i
    ) ?? parseNumber(
      extractMatch(text, /Only\s*([0-9]+(?:[.,][0-9]+){0,2})\s*g of CO2/i)
    )
    const cleanerThanPercent = normalizePercent(
      extractDataCountValue(
        html,
        /report-summary__subheading[\s\S]*?class="js-countup"[\s\S]*?data-count="([0-9]+(?:\.[0-9]+)?)"/i
      ) ?? parseNumber(extractMatch(text, /cleaner than\s*([0-9]+(?:[.,][0-9]+){0,2})\s*%/i))
    )
    const lastTested = extractMatch(text, /last tested on\s*([^.]*)\./i)
    const hostIsGreen = /uses\s+green energy/i.test(text)
      ? true
      : /bog standard energy/i.test(text)
        ? false
        : null

    return {
      rating,
      co2PerVisitGrams,
      cleanerThanPercent,
      lastTested,
      hostIsGreen,
    }
  } catch {
    return null
  }
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  const pct = Math.round(score * 100)
  const color = pct >= 90 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500'
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-700">{label}</span>
        <span className="font-semibold text-gray-900">{pct}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function ScoreDot({ score }: { score: number }) {
  const pct = Math.round(score * 100)
  const color = pct >= 90 ? 'text-green-600' : pct >= 50 ? 'text-yellow-600' : 'text-red-600'
  return <span className={`font-mono font-semibold ${color}`}>{pct}</span>
}

export default async function SustainabilityPage() {
  const report = getReport()
  const carbonData = await getWebsiteCarbonData()
  const recentRuns = report
    ? [...report.runs]
        .sort((left, right) => new Date(right.runAt).getTime() - new Date(left.runAt).getTime())
        .slice(0, RECENT_RUN_COUNT)
    : []
  const recentAverageScores = recentRuns.length
    ? {
        performance: recentRuns.reduce((sum, run) => sum + run.scores.performance, 0) / recentRuns.length,
        accessibility: recentRuns.reduce((sum, run) => sum + run.scores.accessibility, 0) / recentRuns.length,
        bestPractices: recentRuns.reduce((sum, run) => sum + run.scores.bestPractices, 0) / recentRuns.length,
        seo: recentRuns.reduce((sum, run) => sum + run.scores.seo, 0) / recentRuns.length,
      }
    : report?.averageScores ?? null

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Bærekraft</h1>
      <p className="text-gray-500 mb-8">
        Denne siden viser ytelse og karbonavtrykk for Telenor Kunnskapsbase, målt med{' '}
        <a href="https://developer.chrome.com/docs/lighthouse" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">
          Google Lighthouse
        </a>{' '}
        og{' '}
        <a href="https://www.websitecarbon.com/website/telenor-jensnic-no/" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">
          websitecarbon.com
        </a>
        .
      </p>

      {report && recentAverageScores ? (
        <>
          <div className="border border-gray-200 rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-semibold text-gray-900">
                Gjennomsnitt ({recentRuns.length} målinger)
              </h2>
              <span className="text-xs text-gray-400">
                {formatDate(report.generatedAt)}
              </span>
            </div>
            <div className="space-y-4">
              <ScoreBar label="Ytelse" score={recentAverageScores.performance} />
              <ScoreBar label="Tilgjengelighet" score={recentAverageScores.accessibility} />
              <ScoreBar label="Beste praksis" score={recentAverageScores.bestPractices} />
              <ScoreBar label="SEO" score={recentAverageScores.seo} />
            </div>
          </div>

          <div className="border border-gray-200 rounded-2xl p-6 mb-8">
            <h2 className="font-semibold text-gray-900 mb-4">Målinger</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-400 border-b border-gray-100">
                  <th className="text-left pb-2 font-normal">Måling</th>
                  <th className="text-right pb-2 font-normal">Ytelse</th>
                  <th className="text-right pb-2 font-normal">Tilgjengelighet</th>
                  <th className="text-right pb-2 font-normal">Beste praksis</th>
                  <th className="text-right pb-2 font-normal">SEO</th>
                </tr>
              </thead>
              <tbody>
                {recentRuns.map((run, i) => (
                  <tr key={i} className="border-b border-gray-50 last:border-0">
                    <td className="py-2 text-gray-500">
                      #{i + 1}{' '}
                      <span className="text-xs text-gray-400">
                        {formatDate(run.runAt)}
                      </span>
                    </td>
                    <td className="py-2 text-right"><ScoreDot score={run.scores.performance} /></td>
                    <td className="py-2 text-right"><ScoreDot score={run.scores.accessibility} /></td>
                    <td className="py-2 text-right"><ScoreDot score={run.scores.bestPractices} /></td>
                    <td className="py-2 text-right"><ScoreDot score={run.scores.seo} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="border border-gray-200 rounded-2xl p-6 mb-8 text-gray-400 text-sm">
          Lighthouse-rapport ikke tilgjengelig ennå.
        </div>
      )}

      <div className="border border-gray-200 rounded-2xl p-6">
        <h2 className="font-semibold text-gray-900 mb-2">Karbonavtrykk</h2>
        <p className="text-sm text-gray-500 mb-4">
          Estimert CO₂ per sidevisning er beregnet av websitecarbon.com basert på
          overførte data og kjent energimiks for hosting-lokasjonen.
        </p>

        {carbonData ? (
          <div className="mb-4 text-sm text-gray-700 space-y-1">
            <p>
              Karbonrating: <span className="font-semibold text-gray-900">{carbonData.rating ?? 'Ukjent'}</span>
            </p>
            <p>
              CO₂ per sidevisning: <span className="font-semibold text-gray-900">{formatCarbonNumber(carbonData.co2PerVisitGrams)} g</span>
            </p>
            <p>
              Renere enn: <span className="font-semibold text-gray-900">{formatCarbonNumber(carbonData.cleanerThanPercent)}%</span>
            </p>
            <p>
              Hosting: <span className="font-semibold text-gray-900">{carbonData.hostIsGreen === null ? 'Ukjent' : carbonData.hostIsGreen ? 'Grønn energi' : 'Bog standard energi'}</span>
            </p>
            <p>
              Sist testet: <span className="font-semibold text-gray-900">{carbonData.lastTested ?? 'Ukjent'}</span>
            </p>
          </div>
        ) : null}

        <a
          href="https://www.websitecarbon.com/website/telenor-jensnic-no/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-sm text-blue-600 underline"
        >
          Se full rapport på websitecarbon.com →
        </a>
      </div>
    </div>
  )
}
