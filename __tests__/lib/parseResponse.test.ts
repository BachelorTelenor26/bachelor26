import { describe, expect, it } from '@jest/globals'
import { parseResponse } from '@/app/lib/utils'

describe('parseResponse', () => {
  it('parses a fully formatted response with both sections', () => {
    const input = [
      '**Direkte løsning**',
      '1. Start ruteren på nytt.',
      '',
      '**Videre feilsøking**',
      '1. Sjekk WAN-kabel.',
    ].join('\n')

    expect(parseResponse(input)).toEqual({
      direct: '1. Start ruteren på nytt.',
      further: '1. Sjekk WAN-kabel.',
    })
  })

  it('handles weird spacing and no line breaks around headers', () => {
    const input = '**  Direkte løsning   **  Start på nytt  **  Videre feilsøking  **  Sjekk kabel  '

    expect(parseResponse(input)).toEqual({
      direct: 'Start på nytt',
      further: 'Sjekk kabel',
    })
  })

  it('parses incomplete streaming output with only direct section', () => {
    const input = '**Direkte løsning**\nKjør omstart av ruter nå'

    expect(parseResponse(input)).toEqual({
      direct: 'Kjør omstart av ruter nå',
      further: '',
    })
  })

  it('returns null when no expected headers exist', () => {
    const input = 'Prøv å starte utstyret på nytt og test igjen.'

    expect(parseResponse(input)).toBeNull()
  })
})
