// lib/mockSessions.ts

export const mockSessions = [
  {
    id: 'mock-1',
    sessionCode: 'KS-A1B2-3C4D',
    outcome: 'ESCALATED',
    completed: false,
    routerModel: 'Huawei B818',
    createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    article: {
      title: 'Ikke Pa Nett - Huawei B818',
      slug: 'ikke_pa_nett_huawei_b818',
      steps: Array(5).fill(null),
      category: { name: 'Ikke Pa Nett', slug: 'ikke-pa-nett' },
      deviceType: { name: 'Huawei B818', slug: 'huawei_b818' },
    },
    answers: [
      {
        id: 'ans-1',
        step: { title: 'ikke-pa-nett.huawei_b818.lampestatus' },
        choice: { label: 'ikke-pa-nett.huawei_b818.lampestatus.choice_0.label' },
        customText: null,
        createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      },
      {
        id: 'ans-2',
        step: { title: 'ikke-pa-nett.huawei_b818.restart_ruteren' },
        choice: { label: 'ikke-pa-nett.huawei_b818.restart_ruteren.choice_1.label' },
        customText: null,
        createdAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
      },
      {
        id: 'ans-3',
        step: { title: 'ikke-pa-nett.huawei_b818.sjekk_tilkobling' },
        choice: { label: 'ikke-pa-nett.huawei_b818.sjekk_tilkobling.choice_0.label' },
        customText: null,
        createdAt: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
      },
    ]
  },
  {
    id: 'mock-2',
    sessionCode: 'KS-E5F6-7G8H',
    outcome: 'RESOLVED',
    completed: true,
    routerModel: 'WiFi Ruter',
    createdAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    article: {
      title: 'Ustabilt Nett - Wifi Ruter Wifi Ruter Ii',
      slug: 'ustabilt_nett_wifi_ruter_wifi_ruter_ii',
      steps: Array(4).fill(null),
      category: { name: 'Ustabilt Nett', slug: 'ustabilt-nett' },
      deviceType: { name: 'Wifi Ruter Wifi Ruter Ii', slug: 'wifi_ruter_wifi_ruter_ii' },
    },
    answers: [
      {
        id: 'ans-4',
        step: { title: 'ustabilt-nett.wifi_ruter_wifi_ruter_ii.restart_ruter' },
        choice: { label: 'ustabilt-nett.wifi_ruter_wifi_ruter_ii.restart_ruter.choice_0.label' },
        customText: null,
        createdAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
      },
      {
        id: 'ans-5',
        step: { title: 'ustabilt-nett.wifi_ruter_wifi_ruter_ii.flere_pa_nett' },
        choice: { label: 'ustabilt-nett.wifi_ruter_wifi_ruter_ii.flere_pa_nett.choice_1.label' },
        customText: null,
        createdAt: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
      },
      {
        id: 'ans-6',
        step: { title: 'ustabilt-nett.wifi_ruter_wifi_ruter_ii.prov_nettverkskabel' },
        choice: { label: 'ustabilt-nett.wifi_ruter_wifi_ruter_ii.prov_nettverkskabel.choice_0.label' },
        customText: null,
        createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      },
      {
        id: 'ans-7',
        step: { title: 'ustabilt-nett.wifi_ruter_wifi_ruter_ii.nettverkskabel_ok_step' },
        choice: { label: 'ustabilt-nett.wifi_ruter_wifi_ruter_ii.nettverkskabel_ok_step.choice_0.label' },
        customText: null,
        createdAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
      },
    ]
  },
  {
    id: 'mock-3',
    sessionCode: 'KS-I9J0-1K2L',
    outcome: 'IN_PROGRESS',
    completed: false,
    routerModel: 'Zyxel P8702N',
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    article: {
      title: 'Ikke Pa Nett - Zyxel P8702n',
      slug: 'ikke_pa_nett_zyxel_p8702n',
      steps: Array(5).fill(null),
      category: { name: 'Ikke Pa Nett', slug: 'ikke-pa-nett' },
      deviceType: { name: 'Zyxel P8702n', slug: 'zyxel_p8702n' },
    },
    answers: [
      {
        id: 'ans-8',
        step: { title: 'ikke-pa-nett.zyxel_p8702n.lampestatus_step' },
        choice: { label: 'ikke-pa-nett.zyxel_p8702n.lampestatus_step.choice_0.label' },
        customText: null,
        createdAt: new Date(Date.now() - 7 * 60 * 1000).toISOString(),
      },
      {
        id: 'ans-9',
        step: { title: 'ikke-pa-nett.zyxel_p8702n.restart_ruter_ikke_nett_step' },
        choice: { label: 'ikke-pa-nett.zyxel_p8702n.restart_ruter_ikke_nett_step.choice_1.label' },
        customText: null,
        createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      },
    ]
  },
]