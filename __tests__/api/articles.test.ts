import { GET } from '../../app/api/articles/route'
import { prisma } from '../../lib/prisma'
import { jest, describe, it, expect, beforeEach } from '@jest/globals'

jest.mock('../../lib/prisma', () => ({
  prisma: {
    article: {
      findMany: jest.fn(),
    },
  },
}))

const mockPrisma = prisma as jest.Mocked<typeof prisma>

const mockArticle = {
  id: '1',
  title: 'Internettet virker ikke hjemme',
  slug: 'ikke-pa-nett-zyxel',
  ingress: null,
  keywords: ['internett'],
  categoryId: 'cat-1',
  deviceTypeId: 'dev-1',
  category: { id: 'cat-1', name: 'Ikke på nett', slug: 'ikke-pa-nett' },
  deviceType: { id: 'dev-1', name: 'Zyxel P8702N', slug: 'zyxel-p8702n' },
  updatedAt: new Date(),
  createdAt: new Date(),
}

describe('GET /api/articles', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returnerer alle artikler uten filter', async () => {
    ;(mockPrisma.article.findMany as jest.Mock).mockResolvedValue([mockArticle])

    const request = new Request('http://localhost:3000/api/articles')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveLength(1)
  })

  it('filtrerer på category slug', async () => {
    ;(mockPrisma.article.findMany as jest.Mock).mockResolvedValue([mockArticle])

    const request = new Request('http://localhost:3000/api/articles?category=ikke-pa-nett')
    await GET(request)

    expect(mockPrisma.article.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          category: { slug: 'ikke-pa-nett' }
        })
      })
    )
  })

  it('returnerer 500 ved databasefeil', async () => {
    ;(mockPrisma.article.findMany as jest.Mock).mockRejectedValue(new Error('DB feil'))

    const request = new Request('http://localhost:3000/api/articles')
    const response = await GET(request)

    expect(response.status).toBe(500)
  })
})