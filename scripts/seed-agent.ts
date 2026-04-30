import 'dotenv/config'
import { auth } from '../lib/auth'
import { prisma } from '../lib/prisma'

async function main() {
  const result = await auth.api.signUpEmail({
    body: {
      email: 'siri.hvamstad@kundeservice.no',
      password: 'passord123',
      name: 'Siri Hvamstad',
      firstName: 'Siri',
      lastName: 'Hvamstad',
    }
  })
  console.log('Agent opprettet:', result)
}

main().catch(console.error)