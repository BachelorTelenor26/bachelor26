import { jest, describe, it, beforeEach, afterEach, expect } from '@jest/globals'

type GenAiChunk = { text?: string }
type GenAiStream = AsyncIterable<GenAiChunk>

const mockGenerateContentStream = jest.fn<(args: unknown) => Promise<GenAiStream>>()

jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.fn().mockImplementation(() => ({
    models: {
      generateContentStream: mockGenerateContentStream,
    },
  })),
}))

jest.mock('../../lib/auth', () => ({
  auth: {
    api: {
      getSession: jest.fn(),
    },
  },
}))

jest.mock('../../lib/prisma', () => ({
  prisma: {
    troubleshootingSession: {
      findUnique: jest.fn(),
    },
    aiAssistInteraction: {
      create: jest.fn(),
    },
  },
}))

import { POST } from '../../app/api/ai-assist/route'
import { auth } from '../../lib/auth'
import { prisma } from '../../lib/prisma'

const mockAuth = auth as jest.Mocked<typeof auth>
const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('POST /api/ai-assist fallback', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.clearAllMocks()
    process.env = {
      ...originalEnv,
      GEMINI_API_KEY: 'test-key',
      AI_MODEL: 'gemini-3.1-flash-lite-preview',
      AI_BACKUP_MODEL: 'gemini-3-flash',
    }

    jest.mocked(mockAuth.api.getSession).mockResolvedValue({ user: { id: 'agent-1' } } as any)

    jest.mocked(mockPrisma.troubleshootingSession.findUnique).mockResolvedValue({
      id: 'session-1',
      outcome: 'OPEN',
      routerModel: 'Huawei B818',
      article: {
        title: 'Internettet virker ikke hjemme',
        category: { name: 'Ikke på nett' },
        deviceType: { name: 'Huawei B818', specs: null },
      },
      answers: [],
    } as any)

    jest.mocked(mockPrisma.aiAssistInteraction.create).mockResolvedValue({} as any)
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('retries with backup model when primary returns 503 and does not return 503 to client', async () => {
    mockGenerateContentStream
      .mockRejectedValueOnce({ status: 503 })
      .mockResolvedValueOnce(
        (async function* () {
          yield { text: '**Direkte løsning**\nStart ruteren.\n**Videre feilsøking**\nSjekk kabler.' }
        })()
      )

    const request = new Request('http://localhost:3000/api/ai-assist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: 'session-1', history: [] }),
    })

    const response = await POST(request as any)
    const bodyText = await response.text()

    expect(response.status).not.toBe(503)
    expect(response.status).toBe(200)
    expect(bodyText).toContain('Direkte løsning')

    expect(mockGenerateContentStream).toHaveBeenCalledTimes(2)
    expect(mockGenerateContentStream).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ model: 'gemini-3.1-flash-lite-preview' })
    )
    expect(mockGenerateContentStream).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ model: 'gemini-3-flash' })
    )

    expect(jest.mocked(mockPrisma.aiAssistInteraction.create)).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          model: 'gemini-3-flash',
        }),
      })
    )
  })
})
