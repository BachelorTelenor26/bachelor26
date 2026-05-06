const fs = require('fs')
const path = require('path')

const dir = path.resolve('.lighthouseci')
const files = fs.readdirSync(dir).filter(
  (f) => f.endsWith('.json') && !f.includes('manifest') && !f.startsWith('flags-')
)

if (!files.length) {
  console.error('No Lighthouse JSON report found in', dir)
  process.exit(1)
}

files.sort()

const runs = files.map((file) => {
  const raw = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf-8'))
  if (!raw.categories) return null
  const cats = raw.categories
  const runAt = raw.fetchTime ?? new Date().toISOString()
  return {
    runAt,
    url: raw.finalUrl,
    scores: {
      performance: cats.performance?.score ?? 0,
      accessibility: cats.accessibility?.score ?? 0,
      bestPractices: cats['best-practices']?.score ?? 0,
      seo: cats.seo?.score ?? 0,
    },
  }
}).filter(Boolean)

function avg(key) {
  return runs.reduce((sum, r) => sum + r.scores[key], 0) / runs.length
}

const report = {
  generatedAt: new Date().toISOString(),
  url: runs[0].url,
  averageScores: {
    performance: avg('performance'),
    accessibility: avg('accessibility'),
    bestPractices: avg('bestPractices'),
    seo: avg('seo'),
  },
  runs,
}

const outPath = path.resolve('public/lighthouse-report.json')
fs.writeFileSync(outPath, JSON.stringify(report, null, 2))
console.log('Written to', outPath)
console.log('Average scores:', JSON.stringify(report.averageScores, null, 2))
