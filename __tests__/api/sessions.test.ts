import { POST } from '../../app/api/sessions/route'
import { prisma } from '../../lib/prisma'
import { jest } from '@jest/globals'

jest.mock('../../lib/prisma', () => ({
  prisma: {
    article: {
      findUnique: jest.fn(),
    },
    troubleshootingSession: {
      create: jest.fn(),
    },
  },
}))

const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('POST /api/sessions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('oppretter sesjon og returnerer sessionCode', async () => {
    ;(mockPrisma.article.findUnique as jest.Mock).mockResolvedValue({
      id: 'article-1',
      title: 'Internettet virker ikke',
    })

    ;(mockPrisma.troubleshootingSession.create as jest.Mock).mockResolvedValue({
      id: 'session-1',
      sessionCode: 'A3F9',
      articleId: 'article-1',
      completed: false,
      outcome: 'IN_PROGRESS',
      createdAt: new Date(),
    })

    const request = new Request('http://localhost:3000/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ articleId: 'article-1' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.sessionCode).toBe('A3F9')
  })

  it('returnerer 400 hvis articleId mangler', async () => {
    const request = new Request('http://localhost:3000/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })

    const response = await POST(request)

    expect(response.status).toBe(400)
  })

  it('returnerer 404 hvis artikkelen ikke finnes', async () => {
    ;(mockPrisma.article.findUnique as jest.Mock).mockResolvedValue(null)

    const request = new Request('http://localhost:3000/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ articleId: 'finnes-ikke' }),
    })

    const response = await POST(request)

    expect(response.status).toBe(404)
  })
})