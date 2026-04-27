export interface Article {
  slug: string
  title: string
  category: string
  updatedAt: string
}

export const articles: Article[] = [
  {
    slug: 'internettet-virker-ikke',
    title: 'Internettet virker ikke hjemme',
    category: 'Ingen internettforbindelse',
    updatedAt: '12. mars 2026',
  },
  {
    slug: 'tregt-ustabilt-nett',
    title: 'Trådløst nett er tregt eller mister signal',
    category: 'Tregt eller ustabilt nett',
    updatedAt: '2. feb 2026',
  },
  {
    slug: 'fiberboks-lyser-rodt',
    title: 'Fiberboksen lyser rødt eller blinker',
    category: 'Fiberboks og signallys',
    updatedAt: '28. mars 2026',
  },
  {
    slug: 'hoy-ping-forsinkelse',
    title: 'Høy ping og forsinkelse (lagg) på nettet',
    category: 'Tregt eller ustabilt nett',
    updatedAt: '18. mars 2026',
  },
  {
    slug: 'enheter-kobler-ikke-til-wifi',
    title: 'Enheter kobler seg ikke til Wi-Fi',
    category: 'Trådløst nettverk (Wi-Fi)',
    updatedAt: '5. mars 2026',
  },
  {
    slug: 'restart-ruter-og-modem',
    title: 'Slik starter du ruteren og modemet på nytt',
    category: 'Ingen internettforbindelse',
    updatedAt: '20. mars 2026',
  },
  {
    slug: 'wifi-faller-ut-i-hele-huset',
    title: 'Wi-Fi faller ut i deler av huset',
    category: 'Trådløst nettverk (Wi-Fi)',
    updatedAt: '16. mars 2026',
  },
  {
    slug: 'bytte-kanal-pa-wifi',
    title: 'Bytt kanal på Wi-Fi for bedre hastighet',
    category: 'Tregt eller ustabilt nett',
    updatedAt: '27. mars 2026',
  },
  {
    slug: 'feilsoke-hoy-ping-spill',
    title: 'Feilsøk høy ping når du spiller',
    category: 'Tregt eller ustabilt nett',
    updatedAt: '14. mars 2026',
  },
  {
    slug: 'koble-til-ny-enhet-wifi',
    title: 'Koble en ny mobil eller PC til Wi-Fi',
    category: 'Trådløst nettverk (Wi-Fi)',
    updatedAt: '22. mars 2026',
  },
  {
    slug: 'innlogging-kundeservice-app',
    title: 'Problemer med innlogging i appen',
    category: 'Konto og innlogging',
    updatedAt: '11. mars 2026',
  },
  {
    slug: 'nullstille-ruteren',
    title: 'Når og hvordan du nullstiller ruteren',
    category: 'Rutere og utstyr',
    updatedAt: '3. april 2026',
  },
]