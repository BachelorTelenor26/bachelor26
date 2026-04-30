import { jest } from '@jest/globals'
import { prisma } from '../../lib/prisma'

jest.mock('../../lib/prisma', () => ({
  prisma: {
    category: {
      findMany: jest.fn(),
    },
    article: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    troubleshootingSession: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    sessionStepAnswer: {
      upsert: jest.fn(),
    },
  },
}))

export const prismaMock = prisma as jest.Mocked<typeof prisma>