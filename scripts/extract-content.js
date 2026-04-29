// scripts/extract-content.js
const fs = require('fs')
const path = require('path')

const localesDir = path.join(__dirname, '../public/locales')
const output = []
const skipped = []

function extractBody(body) {
  if (!body || body.length === 0) return ''

  return body
    .map(block => {
      if (
        (block.type === 'paragraph' || block.type === 'heading') &&
        block.content
      ) {
        return block.content.map(c => c.text).join(' ')
      }
      if (block.type === 'ordered-list' && block.items) {
        return block.items
          .map((item, i) => {
            const text = item.map(c => c.text).join(' ')
            return `${i + 1}. ${text}`
          })
          .join('\n')
      }
      if (block.type === 'unordered-list' && block.items) {
        return block.items
          .map(item => {
            const text = item.map(c => c.text).join(' ')
            return `- ${text}`
          })
          .join('\n')
      }
      return ''
    })
    .filter(Boolean)
    .join('\n')
}

function isDeviceSelector(json) {
  const hasEmptyBody = !json.body || json.body.length === 0
  const deviceNames = ['WiFi Ruter', 'Zyxel', 'Huawei', 'annen ruter']
  const choicesAreDevices =
    json.choices?.some(c =>
      deviceNames.some(name => c.label.includes(name))
    ) ?? false
  return hasEmptyBody && choicesAreDevices
}

function processDir(dir, context = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      processDir(fullPath, [...context, entry.name])
    } else if (entry.name.endsWith('.json')) {
      try {
        const raw = fs.readFileSync(fullPath, 'utf-8')
        const json = JSON.parse(raw)

        // Hopp over rutervalg-filer
        if (isDeviceSelector(json)) continue

        const body = extractBody(json.body)

        if (!body || body.trim() === '') {
          skipped.push(path.relative(localesDir, fullPath))
          continue
        }

        output.push({
          file: path.relative(localesDir, fullPath),
          category: context[0] ?? '',
          device: context[1] ?? '',
          title: json.title ?? '',
          body,
          choices: json.choices?.map(c => c.label).join(' / ') ?? '',
        })
      } catch (e) {
        console.error(`Feil i ${fullPath}:`, e.message)
      }
    }
  }
}

processDir(localesDir)

// Hovedfil med innhold
const lines = output.map(item =>
  [
    `=== ${item.file} ===`,
    `Kategori: ${item.category}`,
    `Ruter: ${item.device}`,
    `Tittel: ${item.title}`,
    `Body:\n${item.body}`,
    `Valg: ${item.choices}`,
    '',
  ].join('\n')
)

fs.writeFileSync(
  path.join(__dirname, 'extracted-content.txt'),
  lines.join('\n---\n\n')
)

// Liste over filer uten body
fs.writeFileSync(
  path.join(__dirname, 'mangler-innhold.txt'),
  `Filer uten body-innhold (${skipped.length} stk):\n\n` + skipped.join('\n')
)

console.log(`Ferdig!`)
console.log(
  `- ${output.length} filer med innhold → scripts/extracted-content.txt`
)
console.log(
  `- ${skipped.length} filer uten innhold → scripts/mangler-innhold.txt`
)