import { GET } from '../../app/api/categories/route'
import { prisma } from '../../lib/prisma'
import { jest } from '@jest/globals'

jest.mock('../../lib/prisma', () => ({
  prisma: {
    category: {
      findMany: jest.fn(),
    },
  },
}))

const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('GET /api/categories', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returnerer liste over kategorier', async () => {
    const mockCategories = [
      { id: '1', name: 'Ikke på nett', slug: 'ikke-pa-nett', icon: null, createdAt: new Date(), updatedAt: new Date() },
      { id: '2', name: 'Tregt nett', slug: 'tregt-nett', icon: null, createdAt: new Date(), updatedAt: new Date() },
    ]

    ;(mockPrisma.category.findMany as jest.Mock).mockResolvedValue(mockCategories)

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveLength(2)
    expect(data[0].slug).toBe('ikke-pa-nett')
  })

  it('returnerer 500 ved databasefeil', async () => {
    ;(mockPrisma.category.findMany as jest.Mock).mockRejectedValue(new Error('DB feil'))

    const response = await GET()

    expect(response.status).toBe(500)
  })
})