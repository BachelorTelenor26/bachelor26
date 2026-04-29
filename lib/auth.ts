import 'dotenv/config'
import { betterAuth } from 'better-auth'
import { prisma } from './prisma'
import { prismaAdapter } from 'better-auth/adapters/prisma'

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql'
  }),
  emailAndPassword: {
    enabled: true,
  },
  session: {
    expiresIn: 60 * 60 * 8,
  },
  user: {
    additionalFields: {
      firstName: { type: 'string', required: true },
      lastName: { type: 'string', required: true },
      role: { type: 'string', required: false, defaultValue: 'AGENT' },
    }
  },
  advanced: {
    database: {
      generateId: false
    }
  }
})