export function formatCategoryName(slug: string): string {
  const names: Record<string, string> = {
    'ikke-pa-nett': 'Ikke på nett',
    'tregt-nett': 'Tregt nett',
    'ustabilt-nett': 'Ustabilt nett',
  }
  return names[slug] ?? slug
}

export function formatDeviceName(slug: string): string {
  const names: Record<string, string> = {
    'huawei_b818': 'Huawei B818',
    'wifi_ruter': 'WiFi Ruter',
    'wifi_ruter_ii': 'WiFi Ruter II',
    'zyxel_p8702n': 'Zyxel P8702N',
    'jeg_har_en_annen_ruter': 'Annen ruter',
    'wifi_ruter_eller_wifi_ruter_ii': 'WiFi Ruter / WiFi Ruter II',
  }
  return names[slug] ?? slug
}

export function formatArticleTitle(categorySlug: string, deviceSlug: string): string {
  const titles: Record<string, string> = {
    'ikke-pa-nett': 'Internettet virker ikke hjemme',
    'tregt-nett': 'Tregt eller ustabilt nett',
    'ustabilt-nett': 'Nett som faller ut eller varierer',
  }
  const category = titles[categorySlug] ?? formatCategoryName(categorySlug)
  const device = formatDeviceName(deviceSlug)
  return `${category} — ${device}`
}

export type ParsedAiResponse = {
  direct: string
  further: string
}

export function parseResponse(text: string): ParsedAiResponse | null {
  const directHeader = /\*\*\s*Direkte løsning\s*\*\*/i
  const furtherHeader = /\*\*\s*Videre feilsøking\s*\*\*/i

  const directMatch = directHeader.exec(text)
  const furtherMatch = furtherHeader.exec(text)

  if (!directMatch && !furtherMatch) {
    return null
  }

  const directStart = directMatch ? directMatch.index + directMatch[0].length : -1
  const furtherStart = furtherMatch ? furtherMatch.index + furtherMatch[0].length : -1

  const direct =
    directStart >= 0
      ? text
          .slice(directStart, furtherMatch ? furtherMatch.index : text.length)
          .trim()
      : ''

  const further = furtherStart >= 0 ? text.slice(furtherStart).trim() : ''

  return { direct, further }
}