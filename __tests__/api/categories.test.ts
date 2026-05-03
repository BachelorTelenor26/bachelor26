import { GET } from '../../app/api/categories/route'
import { prisma } from '../../lib/prisma'
import { jest, describe, it, beforeEach, afterEach, expect } from '@jest/globals'

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
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('returnerer liste over kategorier', async () => {
    const mockCategories = [
      { id: '1', name: 'Ikke på nett', slug: 'ikke-pa-nett', icon: null, createdAt: new Date(), updatedAt: new Date() },
      { id: '2', name: 'Tregt nett', slug: 'tregt-nett', icon: null, createdAt: new Date(), updatedAt: new Date() },
    ]

    jest.mocked(mockPrisma.category.findMany).mockResolvedValue(mockCategories as any)

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveLength(2)
    expect(data[0].slug).toBe('ikke-pa-nett')
  })

  it('returnerer 500 ved databasefeil', async () => {
    jest.mocked(mockPrisma.category.findMany).mockRejectedValue(new Error('DB feil'))

    const response = await GET()

    expect(response.status).toBe(500)
  })
})