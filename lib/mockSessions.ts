export const mockSessions = [
  {
    id: '1',
    sessionCode: 'KS-A1B2-3C4D',
    outcome: 'ESCALATED',
    completed: false,
    routerModel: 'Huawei B818',
    createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    article: {
      title: 'Internettet virker ikke hjemme',
      category: { name: 'Ikke på nett' },
      deviceType: { name: 'Huawei B818' },
      steps: Array(5).fill(null),
    },
    answers: [
      { id: '1', step: { title: 'Sjekk lampene' }, choice: { label: 'Ja' }, customText: null },
      { id: '2', step: { title: 'Start ruteren på nytt' }, choice: { label: 'Nei' }, customText: null },
      { id: '3', step: { title: 'Sjekk fiberboksen' }, choice: { label: 'Nei' }, customText: null },
    ]
  },
  {
    id: '2',
    sessionCode: 'KS-E5F6-7G8H',
    outcome: 'RESOLVED',
    completed: true,
    routerModel: 'WiFi Ruter',
    createdAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    article: {
      title: 'Tregt eller ustabilt nett',
      category: { name: 'Tregt nett' },
      deviceType: { name: 'WiFi Ruter' },
      steps: Array(4).fill(null),
    },
    answers: [
      { id: '4', step: { title: 'Sjekk hastigheten' }, choice: { label: 'Ja' }, customText: null },
      { id: '5', step: { title: 'Koble fra andre enheter' }, choice: { label: 'Ja' }, customText: null },
      { id: '6', step: { title: 'Start ruteren på nytt' }, choice: { label: 'Ja' }, customText: null },
      { id: '7', step: { title: 'Prøv nettverkskabel' }, choice: { label: 'Ja' }, customText: null },
    ]
  },
  {
    id: '3',
    sessionCode: 'KS-I9J0-1K2L',
    outcome: 'IN_PROGRESS',
    completed: false,
    routerModel: 'Zyxel P8702N',
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    article: {
      title: 'Internettet virker ikke hjemme',
      category: { name: 'Ikke på nett' },
      deviceType: { name: 'Zyxel P8702N' },
      steps: Array(5).fill(null),
    },
    answers: [
      { id: '8', step: { title: 'Sjekk lampene' }, choice: { label: 'Ja' }, customText: null },
      { id: '9', step: { title: 'Start ruteren på nytt' }, choice: { label: 'Nei' }, customText: null },
    ]
  },
]