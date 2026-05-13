import { POST } from '../../app/api/sessions/route'
import { prisma } from '../../lib/prisma'
import { auth } from '../../lib/auth'
import * as sessionCodeModule from '../../app/lib/sessionCode'
import { jest, describe, it, beforeEach, expect } from '@jest/globals'

jest.mock('../../lib/auth', () => ({
  auth: {
    api: {
      getSession: jest.fn(),
    },
  },
}))

jest.mock('../../lib/prisma', () => ({
  prisma: {
    article: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
    troubleshootingSession: {
      create: jest.fn(),
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
const mockAuth = auth as jest.Mocked<typeof auth>
const mockDecode = jest.mocked(sessionCodeModule.decodeHandoverCode)
const mockDeriveFlowId = jest.mocked(sessionCodeModule.deriveFlowId)

describe('POST /api/sessions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(mockAuth.api.getSession).mockResolvedValue(null as any)
  })

  it('oppretter ny sesjon fra sessionCode og returnerer sessionCode', async () => {
    mockDecode.mockReturnValue({ flowId: 42, choices: [] })
    mockDeriveFlowId.mockReturnValue(42)

    jest.mocked(mockPrisma.article.findMany).mockResolvedValue([
      { id: 'article-1', slug: 'internettet-virker-ikke' } as any,
    ])

    jest.mocked(mockPrisma.troubleshootingSession.create).mockResolvedValue({
      id: 'session-1',
      sessionCode: 'KS-A3F9',
      articleId: 'article-1',
      completed: false,
      outcome: 'IN_PROGRESS',
      createdAt: new Date(),
      origin: 'customer',
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
      origin: 'customer',
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
    expect(mockPrisma.troubleshootingSession.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          sessionCode: 'KS-A3F9',
          origin: 'customer',
        }),
      })
    )
  })

  it('returnerer 401 for agent-initiated kall uten innlogging', async () => {
    const request = new Request('http://localhost:3000/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })

    const response = await POST(request)

    expect(response.status).toBe(401)
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

  it('oppretter agent-initiated sesjon fra articleSlug uten sessionCode', async () => {
    jest.mocked(mockAuth.api.getSession).mockResolvedValue({ user: { id: 'agent-1' } } as any)

    jest.mocked(mockPrisma.article.findUnique).mockResolvedValue({
      id: 'article-2',
    } as any)

    jest.mocked(mockPrisma.troubleshootingSession.create).mockResolvedValue({
      id: 'session-2',
      sessionCode: null,
      articleId: 'article-2',
      completed: false,
      outcome: 'IN_PROGRESS',
      createdAt: new Date(),
      origin: 'customerService',
      article: { id: 'article-2', steps: [], category: null, deviceType: null },
      answers: [],
    } as any)

    jest.mocked(mockPrisma.troubleshootingSession.findUnique).mockResolvedValue({
      id: 'session-2',
      sessionCode: null,
      articleId: 'article-2',
      completed: false,
      outcome: 'IN_PROGRESS',
      createdAt: new Date(),
      origin: 'customerService',
      article: { id: 'article-2', category: null, deviceType: null },
      answers: [],
    } as any)

    const request = new Request('http://localhost:3000/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ articleSlug: 'internettet-virker-ikke', choiceIndices: [] }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.sessionCode).toBeNull()
    const createArg = jest.mocked(mockPrisma.troubleshootingSession.create).mock.calls[0][0] as {
      data: Record<string, unknown>
    }

    expect(createArg.data.origin).toBe('customerService')
    expect(createArg.data.articleId).toBe('article-2')
    expect(createArg.data).not.toHaveProperty('sessionCode')
  })
})