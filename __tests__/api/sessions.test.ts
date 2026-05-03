import { POST } from '../../app/api/sessions/route'
import { prisma } from '../../lib/prisma'
import * as sessionCodeModule from '../../app/lib/sessionCode'
import { jest, describe, it, beforeEach, expect } from '@jest/globals'

jest.mock('../../lib/prisma', () => ({
  prisma: {
    article: {
      findMany: jest.fn(),
    },
    troubleshootingSession: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
    },
    sessionStepAnswer: {
      upsert: jest.fn(),
    },
  },
}))

jest.mock('../../app/lib/sessionCode', () => ({
  decodeHandoverCode: jest.fn(),
  deriveFlowId: jest.fn(),
}))

const mockPrisma = prisma as jest.Mocked<typeof prisma>
const mockDecode = jest.mocked(sessionCodeModule.decodeHandoverCode)
const mockDeriveFlowId = jest.mocked(sessionCodeModule.deriveFlowId)

describe('POST /api/sessions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('oppretter sesjon og returnerer sessionCode', async () => {
    mockDecode.mockReturnValue({ flowId: 42, choices: [] })
    mockDeriveFlowId.mockReturnValue(42)

    jest.mocked(mockPrisma.article.findMany).mockResolvedValue([
      { id: 'article-1', slug: 'internettet-virker-ikke' } as any,
    ])

    jest.mocked(mockPrisma.troubleshootingSession.upsert).mockResolvedValue({
      id: 'session-1',
      sessionCode: 'KS-A3F9',
      articleId: 'article-1',
      completed: false,
      outcome: 'IN_PROGRESS',
      createdAt: new Date(),
      article: { id: 'article-1', steps: [], category: null, deviceType: null },
      answers: [],
    } as any)

    jest.mocked(mockPrisma.troubleshootingSession.findUnique).mockResolvedValue({
      id: 'session-1',
      sessionCode: 'KS-A3F9',
      articleId: 'article-1',
      completed: false,
      outcome: 'IN_PROGRESS',
      createdAt: new Date(),
      article: { id: 'article-1', category: null, deviceType: null },
      answers: [],
    } as any)

    const request = new Request('http://localhost:3000/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionCode: 'KS-A3F9' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.sessionCode).toBe('KS-A3F9')
  })

  it('returnerer 400 hvis sessionCode mangler', async () => {
    const request = new Request('http://localhost:3000/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })

    const response = await POST(request)

    expect(response.status).toBe(400)
  })

  it('returnerer 404 hvis artikkelen ikke finnes', async () => {
    mockDecode.mockReturnValue({ flowId: 99, choices: [] })
    mockDeriveFlowId.mockReturnValue(0)

    jest.mocked(mockPrisma.article.findMany).mockResolvedValue([
      { id: 'article-1', slug: 'some-article' } as any,
    ])

    const request = new Request('http://localhost:3000/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionCode: 'KS-XXXX' }),
    })

    const response = await POST(request)

    expect(response.status).toBe(404)
  })
})