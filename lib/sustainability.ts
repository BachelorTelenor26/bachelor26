import fs from 'fs'
import path from 'path'

export interface RunScores {
  performance: number
  accessibility: number
  bestPractices: number
  seo: number
}

export interface LighthouseRun {
  runAt: string
  url: string
  scores: RunScores
}

export interface LighthouseReport {
  generatedAt: string
  url: string
  averageScores: RunScores
  runs: LighthouseRun[]
}

export interface WebsiteCarbonData {
  rating: string | null
  co2PerVisitGrams: number | null
  cleanerThanPercent: number | null
  lastTested: string | null
  hostIsGreen: boolean | null
}

export interface SustainabilityData {
  fetchedAt: string
  report: LighthouseReport | null
  recentRuns: LighthouseRun[]
  recentAverageScores: RunScores | null
  carbonData: WebsiteCarbonData | null
}

const RECENT_RUN_COUNT = 3

export function getReport(): LighthouseReport | null {
  try {
    const filePath = path.join(process.cwd(), 'public', 'lighthouse-report.json')
    const raw = fs.readFileSync(filePath, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return null
  }
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

function parseNumber(value: string | null): number | null {
  if (!value) return null
  const parsed = Number.parseFloat(value.replace(',', '.'))
  return Number.isNaN(parsed) ? null : parsed
}

function extractDataCountValue(html: string, anchor: RegExp): number | null {
  const match = html.match(anchor)
  if (!match) return null
  return parseNumber(match[1])
}

function normalizePercent(value: number | null): number | null {
  if (value === null) return null
  let normalized = value
  while (normalized > 100) normalized /= 100
  return normalized
}

export async function getWebsiteCarbonData(): Promise<WebsiteCarbonData | null> {
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

export function getRecentRuns(report: LighthouseReport | null, count = RECENT_RUN_COUNT): LighthouseRun[] {
  return report
    ? [...report.runs]
        .sort((left, right) => new Date(right.runAt).getTime() - new Date(left.runAt).getTime())
        .slice(0, count)
    : []
}

export function getRecentAverageScores(
  recentRuns: LighthouseRun[],
  fallback: RunScores | null
): RunScores | null {
  return recentRuns.length
    ? {
        performance: recentRuns.reduce((sum, run) => sum + run.scores.performance, 0) / recentRuns.length,
        accessibility: recentRuns.reduce((sum, run) => sum + run.scores.accessibility, 0) / recentRuns.length,
        bestPractices: recentRuns.reduce((sum, run) => sum + run.scores.bestPractices, 0) / recentRuns.length,
        seo: recentRuns.reduce((sum, run) => sum + run.scores.seo, 0) / recentRuns.length,
      }
    : fallback
}

export async function getSustainabilityData(): Promise<SustainabilityData> {
  const report = getReport()
  const carbonData = await getWebsiteCarbonData()
  const recentRuns = getRecentRuns(report)
  const recentAverageScores = getRecentAverageScores(recentRuns, report?.averageScores ?? null)

  return {
    fetchedAt: new Date().toISOString(),
    report,
    recentRuns,
    recentAverageScores,
    carbonData,
  }
}