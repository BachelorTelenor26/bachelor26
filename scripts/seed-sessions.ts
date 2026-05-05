import 'dotenv/config'
import { prisma } from '../lib/prisma'
import { randomBytes } from 'crypto'


async function main() {
  // Artikkler fra databasen
  const artikkelHuawei = 'cmokepyux00027kmclogiqkiw'
  const artikkelWifiRuter = 'cmokepzi00001p7kmcas04caly'
  const artikkelZyxel = 'cmokepzm000t7kmcweov0ahz'

  // Steg fra Huawei-artikkelen
  const step1 = 'cmokepyvf00037kmcamnpdqnv'
  const step2 = 'cmokepyw600047kmc09f3i1uv'
  const step3 = 'cmokepywb00057kmch7dsjdjm'
  const step4 = 'cmokepywf00067kmc21xw5q2s'

  // Valg fra Huawei-artikkelen
  const choice1_ja = 'cmokepyyp000n7kmc8a63mi9n'
  const choice2_nei = 'cmokepyyy000p7kmcwkmujteb'

  // Sesjon 1 — Eskalert, Huawei B818
  await prisma.troubleshootingSession.create({
    data: {
      sessionCode: 'KS-A1B2-3C4D',
      articleId: artikkelHuawei,
      outcome: 'ESCALATED',
      completed: false,
      routerModel: 'Huawei B818',
      createdAt: new Date(Date.now() - 2 * 60 * 1000), // 2 min siden
      answers: {
        create: [
          { stepId: step1, choiceId: choice1_ja },
          { stepId: step2, choiceId: choice1_ja },
          { stepId: step3, choiceId: choice2_nei },
        ]
      }
    }
  })

  // Sesjon 2 — Løst, WiFi Ruter
  await prisma.troubleshootingSession.create({
    data: {
      sessionCode: 'KS-E5F6-7G8H',
      articleId: artikkelWifiRuter,
      outcome: 'RESOLVED',
      completed: true,
      routerModel: 'WiFi Ruter',
      createdAt: new Date(Date.now() - 12 * 60 * 1000), // 12 min siden
      answers: {
        create: [
          { stepId: step1, choiceId: choice1_ja },
          { stepId: step2, choiceId: choice1_ja },
          { stepId: step3, choiceId: choice1_ja },
          { stepId: step4, choiceId: choice1_ja },
        ]
      }
    }
  })

  // Sesjon 3 — Pågår, Zyxel
  await prisma.troubleshootingSession.create({
    data: {
      sessionCode: 'KS-I9J0-1K2L',
      articleId: artikkelZyxel,
      outcome: 'IN_PROGRESS',
      completed: false,
      routerModel: 'Zyxel P8702N',
      createdAt: new Date(Date.now() - 5 * 60 * 1000), // 5 min siden
      answers: {
        create: [
          { stepId: step1, choiceId: choice1_ja },
          { stepId: step2, choiceId: choice2_nei },
        ]
      }
    }
  })

  console.log('✓ 3 testsesjoner opprettet')
  console.log('  KS-A1B2-3C4D — Eskalert')
  console.log('  KS-E5F6-7G8H — Løst')
  console.log('  KS-I9J0-1K2L — Pågår')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())