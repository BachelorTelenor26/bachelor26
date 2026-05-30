import 'dotenv/config'
import { betterAuth } from 'better-auth'
import { prisma } from './prisma'
import { prismaAdapter } from 'better-auth/adapters/prisma'

const authBaseUrl = process.env.BETTER_AUTH_URL
const useSecureCookies = authBaseUrl?.startsWith('https://') ?? false

export const auth = betterAuth({
  baseURL: authBaseUrl,
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
    useSecureCookies,
    trustedProxyHeaders: true,
    database: {
      generateId: false
    }
  }
})