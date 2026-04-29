// scripts/rewrite-klarsprak.js
// Skriver om tittel og body i alle JSON-filer til klarspråk
// Regler: korte setninger, aktiv stemme, hverdagsspråk

const fs = require('fs')
const path = require('path')

const localesDir = path.join(__dirname, '../public/locales')

// Helper: bygg paragraph-blokk
const p = text => ({ type: 'paragraph', content: [{ text }] })

// Helper: bygg ordered-list-blokk
const ol = items => ({
  type: 'ordered-list',
  items: items.map(t => [{ text: t }])
})

// Helper: bygg unordered-list-blokk
const ul = items => ({
  type: 'unordered-list',
  items: items.map(t => [{ text: t }])
})

// Klarspråk-data per fil (relativePath → { title, body })
const rewrites = {

  // ─── IKKE-PÅ-NETT ───────────────────────────────────────────────

  'ikke-pa-nett/huawei_b818/andre_enheter_wifi.json': {
    title: 'Virker WiFi på andre enheter?',
    body: [p('Prøv å koble til WiFi på en annen enhet — for eksempel en mobil, PC eller nettbrett.')]
  },
  'ikke-pa-nett/huawei_b818/blaa_mode.json': {
    title: 'Du er koblet til 3G',
    body: [p('Ruteren er koblet til mobilnettet på 3G.')]
  },
  'ikke-pa-nett/huawei_b818/endre_plassering_av_ruter.json': {
    title: 'Flytt ruteren til et annet sted',
    body: [
      p('Plasser ruteren et annet sted for å få bedre signal. MODE-lampen skifter farge når du får 4G/4G+.'),
      p('Vi anbefaler å plassere ruteren:'),
      ul(['Høyt oppe', 'Sentralt i huset', 'Nær et vindu']),
      p('Sjekk mobilsignalet ditt for å finne det beste stedet.')
    ]
  },
  'ikke-pa-nett/huawei_b818/gul_mode.json': {
    title: 'Du er koblet til 2G',
    body: [
      p('Ruteren er koblet til 2G. 2G er for tregt til vanlig nettsurfing.'),
      p('Sjekk dekningen i ditt område for å se om du kan få 4G.')
    ]
  },
  'ikke-pa-nett/huawei_b818/hvilken_aksess.json': {
    title: 'Hvilken type internett har du?',
    body: [
      p('Vi leverer internett på flere måter. Velg det som passer deg:'),
      ul([
        'Mobilt Bredbånd — fungerer overalt med mobildekning, med en fast datamengde per måned.',
        'Trådløst Bredbånd — fungerer kun på adressen der du bor.'
      ])
    ]
  },
  'ikke-pa-nett/huawei_b818/installasjon_av_ruter.json': {
    title: 'Sett opp ruteren',
    body: [
      ol([
        'Koble til ruteren med WiFi eller nettverkskabel.',
        'En nettside åpner seg automatisk. Klikk deg gjennom for å fullføre oppsettet.'
      ]),
      p('Åpner ikke siden seg? Skriv 192.168.1.1 i adressefeltet. Vi anbefaler Chrome, Safari, Edge eller Firefox.')
    ]
  },
  'ikke-pa-nett/huawei_b818/koble_til_wifi.json': {
    title: 'Koble til WiFi',
    body: [
      p('Du må koble til WiFi på enheten din.'),
      p('Passordet står på undersiden av ruteren, etter WiFi Key.')
    ]
  },
  'ikke-pa-nett/huawei_b818/lampestatus.json': {
    title: 'Sjekk lampene',
    body: [p('POWER-lampen skal lyse stabilt grønt. MODE-lampen skal lyse turkis når du er koblet til 4G/4G+.')]
  },
  'ikke-pa-nett/huawei_b818/mode_lyser_rodt.json': {
    title: 'Ruteren er ikke koblet til mobilnettet',
    body: [
      p('Ruteren finner ikke SIM-kortet. Prøv dette:'),
      ol([
        'Trekk ut strømkabelen.',
        'Ta SIM-kortet ut av ruteren.',
        'Sett SIM-kortet tilbake.',
        'Koble til strøm og vent opptil 5 minutter.'
      ])
    ]
  },
  'ikke-pa-nett/huawei_b818/nullstill_ruter.json': {
    title: 'Nullstill ruteren',
    body: [
      p('OBS: Ha PIN-koden til SIM-kortet klar. Nullstilling sletter alle innstillinger.'),
      ol([
        'Finn en penn eller tynn gjenstand.',
        'Stikk den inn i hullet merket RESET.',
        'Hold inne i 20 sekunder og slipp.',
        'Vent opptil 5 minutter mens ruteren starter opp.'
      ])
    ]
  },
  'ikke-pa-nett/huawei_b818/power_lyser_ikke.json': {
    title: 'Sjekk strømtilkoblingen',
    body: [ul([
      'Sjekk at strømkabelen sitter godt i ruteren og i stikkontakten.',
      'Sjekk at ruteren er skrudd på.',
      'Prøv et annet strømuttak du vet fungerer.'
    ])]
  },
  'ikke-pa-nett/huawei_b818/restart_ruteren.json': {
    title: 'Start ruteren på nytt',
    body: [
      p('Start ruteren på nytt. Dette løser ofte problemet.'),
      ol([
        'Trekk ut strømkabelen.',
        'Vent 10 sekunder.',
        'Koble til strømmen igjen. Vent 2 minutter — det tar litt tid.'
      ])
    ]
  },
  'ikke-pa-nett/huawei_b818/sjekk_tilkobling.json': {
    title: 'Sjekk tilkoblingen',
    body: [ul([
      'Sjekk at enheten din er koblet til ruteren via WiFi eller kabel.',
      'Har du en annen enhet? Sjekk om problemet er det samme der også.'
    ])]
  },
  'ikke-pa-nett/huawei_b818/wifi_status.json': {
    title: 'Er du koblet til WiFi?',
    body: [p('Sjekk om WiFi-ikonet på PC eller mobil viser at du er koblet til. På PC holder du musepekeren over ikonet. På mobil går du til Innstillinger og deretter WiFi.')]
  },
  'ikke-pa-nett/jeg_har_en_annen_ruter/annen_ruter_result.json': {
    title: 'Har du en eldre ruter?',
    body: [
      p('Du finner hjelp til lampestatus, nettverksnavn og passord på vår utstyrsoversikt.'),
      p('Eldre utstyr kan gi problemer med internett. Ved å oppgradere kan du få et mer stabilt nett og bedre WiFi-dekning.')
    ]
  },
  'ikke-pa-nett/shared/alltid_wifi_result.json': {
    title: 'Kontakt oss',
    body: [p('Ring oss på 915 09000, så hjelper vi deg videre.')]
  },
  'ikke-pa-nett/shared/defekt_ruter_result.json': {
    title: 'Ruteren kan være ødelagt',
    body: [p('Ruteren din kan være ødelagt. Ring kundeservice, så bestiller vi en ny til deg.')]
  },
  'ikke-pa-nett/shared/flere_enheter.json': {
    title: 'Virker WiFi på andre enheter?',
    body: [p('Prøv å koble til WiFi på en annen enhet — for eksempel en mobil, PC eller nettbrett.')]
  },
  'ikke-pa-nett/shared/ikke_pa_nett_start.json': {
    title: 'Ikke internett hjemme?',
    body: [p('Trykk Start så hjelper vi deg steg for steg.')]
  },
  'ikke-pa-nett/shared/koble_til_wifi_step.json': {
    title: 'Koble til WiFi',
    body: [p('Du må koble til WiFi på enheten din. Passordet finner du på undersiden av ruteren.')]
  },
  'ikke-pa-nett/shared/kontakt_leverandor_result.json': {
    title: 'Problemet er på enheten din',
    body: [p('Problemet ligger på enheten din, ikke internettforbindelsen. Kontakt leverandøren av enheten for mer hjelp.')]
  },
  'ikke-pa-nett/shared/kontakt_oss_result.json': {
    title: 'Kontakt oss',
    body: [p('Vi trenger å undersøke dette nærmere. Ring kundeservice, så hjelper vi deg videre.')]
  },
  'ikke-pa-nett/shared/nettverkskabel_ok_step.json': {
    title: 'Problemet er på WiFi',
    body: [
      p('Du kommer på nett med kabel. Problemet ligger på WiFi, ikke på linjen vår.'),
      p('Du kan fortsette å bruke internett med kabel, eller feilsøke videre.')
    ]
  },
  'ikke-pa-nett/shared/nullstill_ruter_wifi_step.json': {
    title: 'Nullstill ruteren',
    body: [ol([
      'Finn en penn eller tynn gjenstand.',
      'Stikk den inn i hullet merket RESET.',
      'Hold inne i 10 sekunder og slipp.',
      'Vent opptil 5 minutter mens ruteren starter opp.'
    ])]
  },
  'ikke-pa-nett/shared/problem_lost_result.json': {
    title: 'Problemet er løst!',
    body: [p('Bra! Vi er glad problemet er løst. Opplever du dette ofte? Ring oss på 915 09000.')]
  },
  'ikke-pa-nett/shared/prov_nettverkskabel.json': {
    title: 'Prøv nettverkskabel',
    body: [p('Koble en nettverkskabel mellom ruteren og PC-en. Da kan vi finne ut om problemet er på WiFi. Hopp over hvis PC-en ikke har kabeluttak.')]
  },
  'ikke-pa-nett/shared/restart_antenne.json': {
    title: 'Start utendørsantennen på nytt',
    body: [ol([
      'Trekk ut antenne-adapteret fra stikkontakten.',
      'Vent minst 10 sekunder.',
      'Sett det tilbake. Vent noen minutter.'
    ])]
  },
  'ikke-pa-nett/shared/restart_enhet_step.json': {
    title: 'Start enheten på nytt',
    body: [p('Problemet ser ut til å ligge på enheten din. Prøv å slå den av og på.')]
  },
  'ikke-pa-nett/shared/restart_modem_step.json': {
    title: 'Start modemet på nytt',
    body: [ol(['Ta ut strømkabelen.', 'Vent 10 sekunder.', 'Koble til igjen. Vent noen minutter.'])]
  },
  'ikke-pa-nett/shared/restart_ont_step.json': {
    title: 'Start fiberboksen på nytt',
    body: [ol(['Ta ut strømkabelen.', 'Vent 1 minutt.', 'Koble til igjen. Vent noen minutter.'])]
  },
  'ikke-pa-nett/shared/sjekk_kabling.json': {
    title: 'Sjekk kablene',
    body: [p('En eller flere kabler kan sitte feil. Sjekk at alle kabler er koblet til riktig.')]
  },
  'ikke-pa-nett/shared/wifi_tilkoblet.json': {
    title: 'Er du koblet til WiFi?',
    body: [p('Sjekk om WiFi-ikonet på PC eller mobil viser at du er koblet til. På PC holder du musepekeren over ikonet. På mobil går du til Innstillinger og deretter WiFi.')]
  },

  // WiFi Ruter
  'ikke-pa-nett/wifi_ruter/andre_enheter_step.json': {
    title: 'Virker WiFi på andre enheter?',
    body: [p('Prøv å koble til WiFi på en annen enhet — mobil, PC eller nettbrett.')]
  },
  'ikke-pa-nett/wifi_ruter/bruker_du_wifi.json': {
    title: 'Bruker du WiFi?',
    body: [p('Lampene lyser som de skal. Siden du fortsatt har problemer, kan det skyldes WiFi eller noe utstyr.')]
  },
  'ikke-pa-nett/wifi_ruter/hvilken_aksess.json': {
    title: 'Hvilken type internett har du?',
    body: [p('Vi leverer internett på flere måter. Er du usikker, sjekk hvordan utstyret ditt er koblet opp.')]
  },
  'ikke-pa-nett/wifi_ruter/internettlampe.json': {
    title: 'Sjekk internettlampen',
    body: [p('Ruteren er koblet til strøm. Sjekk hvordan internettlampen lyser — fargen forteller oss hvor feilen kan ligge.')]
  },
  'ikke-pa-nett/wifi_ruter/internettlampe_step.json': {
    title: 'Sjekk internettlampen',
    body: [p('Ruteren er koblet til strøm. Sjekk hvordan internettlampen lyser — fargen forteller oss hvor feilen kan ligge.')]
  },
  'ikke-pa-nett/wifi_ruter/koble_til_wifi_step.json': {
    title: 'Koble til WiFi',
    body: [p('Du må koble til WiFi på enheten din. Passordet finner du på undersiden av ruteren.')]
  },
  'ikke-pa-nett/wifi_ruter/lampestatus.json': {
    title: 'Sjekk lampene',
    body: [p('Den øverste lampen (internett) skal lyse stabilt grønt. Den nederste (strøm) skal lyse stabilt hvitt.')]
  },
  'ikke-pa-nett/wifi_ruter/lampestatus_step.json': {
    title: 'Sjekk lampene',
    body: [p('Den øverste lampen (internett) skal lyse stabilt grønt. Den nederste (strøm) skal lyse stabilt hvitt.')]
  },
  'ikke-pa-nett/wifi_ruter/lampestatus_step_v2.json': {
    title: 'Sjekk lampene',
    body: [p('Den øverste lampen (internett) skal lyse stabilt grønt. Den nederste (strøm) skal lyse stabilt hvitt.')]
  },
  'ikke-pa-nett/wifi_ruter/nullstill_ruter_generell_step.json': {
    title: 'Nullstill ruteren',
    body: [
      p('OBS: Nullstilling sletter nettverksnavn, passord og alle innstillinger.'),
      ol(['Finn en penn eller tynn gjenstand.', 'Stikk den inn i hullet merket RESET.', 'Hold inne i 10 sekunder og slipp.', 'Vent opptil 5 minutter.'])
    ]
  },
  'ikke-pa-nett/wifi_ruter/nullstill_ruter_wifi_step.json': {
    title: 'Nullstill ruteren',
    body: [ol(['Finn en penn eller tynn gjenstand.', 'Stikk den inn i hullet merket RESET.', 'Hold inne i 10 sekunder og slipp.', 'Vent opptil 5 minutter.'])]
  },
  'ikke-pa-nett/wifi_ruter/prov_nettverkskabel_step.json': {
    title: 'Prøv nettverkskabel',
    body: [p('Koble en nettverkskabel mellom ruteren og PC-en. Da kan vi finne ut om problemet er på WiFi. Hopp over hvis PC-en ikke har kabeluttak.')]
  },
  'ikke-pa-nett/wifi_ruter/restart_ruter_ikke_nett_step.json': {
    title: 'Start ruteren på nytt',
    body: [ol(['Trekk ut strømkabelen.', 'Vent 10 sekunder.', 'Koble til igjen. Vent 2 minutter.'])]
  },
  'ikke-pa-nett/wifi_ruter/sjekk_kabling_step.json': {
    title: 'Sjekk kablene',
    body: [p('En eller flere kabler kan sitte feil. Sjekk at alle kabler er koblet til riktig.')]
  },
  'ikke-pa-nett/wifi_ruter/sjekk_kabling_step_v2.json': {
    title: 'Sjekk kablene',
    body: [p('En eller flere kabler kan sitte feil. Sjekk at alle kabler er koblet til riktig.')]
  },
  'ikke-pa-nett/wifi_ruter/tilkoblet_stroem_step.json': {
    title: 'Sjekk strømtilkoblingen',
    body: [ul(['Sjekk at strømkabelen sitter godt i ruteren og i stikkontakten.', 'Sjekk at av/på-bryteren står på.', 'Prøv et annet strømuttak du vet fungerer.'])]
  },
  'ikke-pa-nett/wifi_ruter/tilkoblet_strom.json': {
    title: 'Sjekk strømtilkoblingen',
    body: [ul(['Sjekk at strømkabelen sitter godt i ruteren og i stikkontakten.', 'Sjekk at av/på-bryteren står på.', 'Prøv et annet strømuttak du vet fungerer.'])]
  },
  'ikke-pa-nett/wifi_ruter/tilkoblet_strom_step.json': {
    title: 'Sjekk strømtilkoblingen',
    body: [ul(['Sjekk at strømkabelen sitter godt i ruteren og i stikkontakten.', 'Sjekk at av/på-bryteren står på.', 'Prøv et annet strømuttak du vet fungerer.'])]
  },
  'ikke-pa-nett/wifi_ruter/tilkoblet_wifi_step.json': {
    title: 'Bruker du WiFi?',
    body: [p('Lampene lyser som de skal. Siden du fortsatt har problemer, kan det skyldes WiFi eller noe utstyr.')]
  },
  'ikke-pa-nett/wifi_ruter/wifi_status_step.json': {
    title: 'Er du koblet til WiFi?',
    body: [p('Sjekk om WiFi-ikonet på PC eller mobil viser at du er koblet til. På PC holder du musepekeren over ikonet. På mobil går du til Innstillinger og deretter WiFi.')]
  },

  // WiFi Ruter II
  'ikke-pa-nett/wifi_ruter_ii/andre_enheter_step.json': {
    title: 'Virker WiFi på andre enheter?',
    body: [p('Prøv å koble til WiFi på en annen enhet — mobil, PC eller nettbrett.')]
  },
  'ikke-pa-nett/wifi_ruter_ii/bruker_du_wifi.json': {
    title: 'Bruker du WiFi?',
    body: [p('Lampene lyser som de skal. Siden du fortsatt har problemer, kan det skyldes WiFi eller noe utstyr.')]
  },
  'ikke-pa-nett/wifi_ruter_ii/hvilken_aksess_wr2.json': {
    title: 'Hvilken type internett har du?',
    body: [p('Vi leverer internett på flere måter. Er du usikker, sjekk hvordan utstyret ditt er koblet opp.')]
  },
  'ikke-pa-nett/wifi_ruter_ii/internettlampe_step.json': {
    title: 'Sjekk internettlampen',
    body: [p('Ruteren er koblet til strøm. Sjekk hvordan internettlampen lyser — fargen forteller oss hvor feilen kan ligge.')]
  },
  'ikke-pa-nett/wifi_ruter_ii/internettlampe_step_v2.json': {
    title: 'Sjekk internettlampen',
    body: [p('Ruteren er koblet til strøm. Sjekk hvordan internettlampen lyser — fargen forteller oss hvor feilen kan ligge.')]
  },
  'ikke-pa-nett/wifi_ruter_ii/internettlampe_step_v3.json': {
    title: 'Sjekk internettlampen',
    body: [p('Ruteren er koblet til strøm. Sjekk hvordan internettlampen lyser — fargen forteller oss hvor feilen kan ligge.')]
  },
  'ikke-pa-nett/wifi_ruter_ii/lampestatus.json': {
    title: 'Sjekk lampene',
    body: [p('Den øverste lampen (internett) skal lyse stabilt grønt. Den nederste (strøm) skal lyse stabilt hvitt.')]
  },
  'ikke-pa-nett/wifi_ruter_ii/lampestatus_step.json': {
    title: 'Sjekk lampene',
    body: [p('Den øverste lampen (internett) skal lyse stabilt grønt. Den nederste (strøm) skal lyse stabilt hvitt.')]
  },
  'ikke-pa-nett/wifi_ruter_ii/lampestatus_step_v2.json': {
    title: 'Sjekk lampene',
    body: [p('Den øverste lampen (internett) skal lyse stabilt grønt. Den nederste (strøm) skal lyse stabilt hvitt.')]
  },
  'ikke-pa-nett/wifi_ruter_ii/nettverkskabel_ok_step.json': {
    title: 'Problemet er på WiFi',
    body: [
      p('Du kommer på nett med kabel. Problemet ligger på WiFi, ikke på linjen vår.'),
      p('Har du eldre enheter? De kan ha problemer med ny sikkerhetsstandard (WPA3).')
    ]
  },
  'ikke-pa-nett/wifi_ruter_ii/nullstill_ruter_generell_step.json': {
    title: 'Nullstill ruteren',
    body: [ol(['Finn en penn eller tynn gjenstand.', 'Stikk den inn i hullet merket RESET.', 'Hold inne i 10 sekunder og slipp.', 'Vent opptil 5 minutter.'])]
  },
  'ikke-pa-nett/wifi_ruter_ii/prov_nettverkskabel_step.json': {
    title: 'Prøv nettverkskabel',
    body: [p('Koble en nettverkskabel mellom ruteren og PC-en. Da kan vi finne ut om problemet er på WiFi. Hopp over hvis PC-en ikke har kabeluttak.')]
  },
  'ikke-pa-nett/wifi_ruter_ii/restart_antenne.json': {
    title: 'Start utendørsantennen på nytt',
    body: [ol(['Trekk ut antenne-adapteret.', 'Vent 10 sekunder.', 'Sett det tilbake. Vent noen minutter.'])]
  },
  'ikke-pa-nett/wifi_ruter_ii/restart_modem_step.json': {
    title: 'Start modemet på nytt',
    body: [ol(['Ta ut strømkabelen.', 'Vent 10 sekunder.', 'Koble til igjen. Vent noen minutter.'])]
  },
  'ikke-pa-nett/wifi_ruter_ii/restart_ruter_wr2.json': {
    title: 'Start ruteren på nytt',
    body: [ol(['Trekk ut strømkabelen.', 'Vent 10 sekunder.', 'Koble til igjen. Vent 2 minutter.'])]
  },
  'ikke-pa-nett/wifi_ruter_ii/sjekk_kabling.json': {
    title: 'Sjekk kablene',
    body: [p('En eller flere kabler kan sitte feil. Sjekk at alle kabler er koblet til riktig.')]
  },
  'ikke-pa-nett/wifi_ruter_ii/sjekk_kabling_step.json': {
    title: 'Sjekk kablene',
    body: [p('En eller flere kabler kan sitte feil. Sjekk at alle kabler er koblet til riktig.')]
  },
  'ikke-pa-nett/wifi_ruter_ii/sjekk_kabling_step_v2.json': {
    title: 'Sjekk kablene',
    body: [p('En eller flere kabler kan sitte feil. Sjekk at alle kabler er koblet til riktig.')]
  },
  'ikke-pa-nett/wifi_ruter_ii/tilkoblet_strom_step.json': {
    title: 'Sjekk strømtilkoblingen',
    body: [
      ul(['Sjekk at strømkabelen sitter godt i ruteren og i stikkontakten.', 'Sjekk at av/på-bryteren står på.', 'Prøv et annet strømuttak du vet fungerer.']),
      p('Noen strømforsyninger har en liten lampe — sjekk om den lyser.')
    ]
  },
  'ikke-pa-nett/wifi_ruter_ii/tilkoblet_strom_step_v2.json': {
    title: 'Sjekk strømtilkoblingen',
    body: [ul(['Sjekk at strømkabelen sitter godt i ruteren og i stikkontakten.', 'Sjekk at av/på-bryteren står på.', 'Prøv et annet strømuttak du vet fungerer.'])]
  },
  'ikke-pa-nett/wifi_ruter_ii/tilkoblet_strom_step_v3.json': {
    title: 'Sjekk strømtilkoblingen',
    body: [ul(['Sjekk at strømkabelen sitter godt i ruteren og i stikkontakten.', 'Sjekk at av/på-bryteren står på.', 'Prøv et annet strømuttak du vet fungerer.'])]
  },
  'ikke-pa-nett/wifi_ruter_ii/tilkoblet_wifi_step.json': {
    title: 'Bruker du WiFi?',
    body: [p('Lampene lyser som de skal. Siden du fortsatt har problemer, kan det skyldes WiFi eller noe utstyr.')]
  },
  'ikke-pa-nett/wifi_ruter_ii/wifi_status_step.json': {
    title: 'Er du koblet til WiFi?',
    body: [p('Sjekk om WiFi-ikonet på PC eller mobil viser at du er koblet til. På PC holder du musepekeren over ikonet. På mobil går du til Innstillinger og deretter WiFi.')]
  },

  // Zyxel P8702N
  'ikke-pa-nett/zyxel_p8702n/andre_enheter_step.json': {
    title: 'Virker WiFi på andre enheter?',
    body: [p('Prøv å koble til WiFi på en annen enhet — mobil, PC eller nettbrett.')]
  },
  'ikke-pa-nett/zyxel_p8702n/boot_loop_step.json': {
    title: 'Ruteren starter ikke',
    body: [
      p('Blinker Power-lampen blått i mer enn 5 minutter, eller lyser den stabilt rødt? Det tyder på feil på ruteren.'),
      p('OBS: Nullstilling sletter nettverksnavn, passord og alle innstillinger.'),
      ol([
        'Skru av ruteren med av/på-bryteren.',
        'Finn en penn eller tynn gjenstand.',
        'Stikk den inn i hullet merket RESET.',
        'Skru på ruteren mens du holder pennen inne.',
        'Hold inne i 30 sekunder og slipp.',
        'Vent opptil 5 minutter.'
      ])
    ]
  },
  'ikke-pa-nett/zyxel_p8702n/boot_loop_step_v2.json': {
    title: 'Ruteren starter ikke',
    body: [
      p('Blinker Power-lampen blått i mer enn 5 minutter, eller lyser den stabilt rødt? Det tyder på feil på ruteren.'),
      p('OBS: Nullstilling sletter nettverksnavn, passord og alle innstillinger.'),
      ol([
        'Skru av ruteren med av/på-bryteren.',
        'Finn en penn eller tynn gjenstand.',
        'Stikk den inn i hullet merket RESET.',
        'Skru på ruteren mens du holder pennen inne.',
        'Hold inne i 30 sekunder og slipp.',
        'Vent opptil 5 minutter.'
      ])
    ]
  },
  'ikke-pa-nett/zyxel_p8702n/defekt_ruter_result.json': {
    title: 'Ruteren er ødelagt',
    body: [p('Ruteren din er ødelagt. Ring kundeservice, så bestiller vi en ny til deg.')]
  },
  'ikke-pa-nett/zyxel_p8702n/hvilken_aksess_zyxel8702.json': {
    title: 'Hvilken type internett har du?',
    body: [p('Vi leverer internett på flere måter. Er du usikker, sjekk hvordan utstyret ditt er koblet opp.')]
  },
  'ikke-pa-nett/zyxel_p8702n/internettlampe_step.json': {
    title: 'Sjekk internettlampen',
    body: [p('Ruteren er koblet til strøm. Sjekk hvordan internettlampen lyser — fargen forteller oss hvor feilen kan ligge.')]
  },
  'ikke-pa-nett/zyxel_p8702n/internettlampe_step_v2.json': {
    title: 'Sjekk internettlampen',
    body: [p('Ruteren er koblet til strøm. Sjekk hvordan internettlampen lyser — fargen forteller oss hvor feilen kan ligge.')]
  },
  'ikke-pa-nett/zyxel_p8702n/internettlampe_step_v3.json': {
    title: 'Sjekk internettlampen',
    body: [p('Ruteren er koblet til strøm. Sjekk hvordan internettlampen lyser — fargen forteller oss hvor feilen kan ligge.')]
  },
  'ikke-pa-nett/zyxel_p8702n/koble_til_wifi_step.json': {
    title: 'Koble til WiFi',
    body: [
      p('Du må koble til WiFi på enheten din.'),
      ul(['Sjekk at Trådløst-lampen lyser. Lyser den ikke, trykk på den blå knappen.', 'Passordet finner du på undersiden av ruteren, etter WPA2.'])
    ]
  },
  'ikke-pa-nett/zyxel_p8702n/lampestatus_step.json': {
    title: 'Sjekk lampene',
    body: [
      p('Trykk kort på den store blå knappen for å slå på lampene. De slukker automatisk etter 30 sekunder (unntatt Power og Trådløst).'),
      p('Lampene lyser riktig når: Power er stabilt blå, WAN er gul eller grønn, og Internett er grønn.')
    ]
  },
  'ikke-pa-nett/zyxel_p8702n/lampestatus_step_v2.json': {
    title: 'Sjekk lampene',
    body: [
      p('Trykk kort på den store blå knappen for å slå på lampene. De slukker automatisk etter 30 sekunder (unntatt Power og Trådløst).'),
      p('Lampene lyser riktig når: Power er stabilt blå, WAN er gul eller grønn, og Internett er grønn.')
    ]
  },
  'ikke-pa-nett/zyxel_p8702n/lampestatus_step_v3.json': {
    title: 'Sjekk lampene',
    body: [
      p('Trykk kort på den store blå knappen for å slå på lampene. De slukker automatisk etter 30 sekunder (unntatt Power og Trådløst).'),
      p('Lampene lyser riktig når: Power er stabilt blå, WAN er gul eller grønn, og Internett er grønn.')
    ]
  },
  'ikke-pa-nett/zyxel_p8702n/nettverkskabel_ok_step.json': {
    title: 'Problemet er på WiFi',
    body: [p('Du kommer på nett med kabel. Problemet ligger på WiFi, ikke på linjen vår. Du kan fortsette å bruke kabel, eller feilsøke videre.')]
  },
  'ikke-pa-nett/zyxel_p8702n/nullstill_ruter_generell_step.json': {
    title: 'Nullstill ruteren',
    body: [
      p('OBS: Nullstilling sletter nettverksnavn, passord og alle innstillinger.'),
      ol(['Finn en penn eller tynn gjenstand.', 'Stikk den inn i hullet merket RESET.', 'Hold inne i 10 sekunder og slipp.', 'Vent opptil 5 minutter.'])
    ]
  },
  'ikke-pa-nett/zyxel_p8702n/nullstill_ruter_wifi_step.json': {
    title: 'Nullstill ruteren',
    body: [ol(['Finn en penn eller tynn gjenstand.', 'Stikk den inn i hullet merket RESET.', 'Hold inne i 10 sekunder og slipp.', 'Vent opptil 5 minutter.'])]
  },
  'ikke-pa-nett/zyxel_p8702n/prov_nettverkskabel.json': {
    title: 'Prøv nettverkskabel',
    body: [p('Koble en nettverkskabel mellom ruteren og PC-en. Da kan vi finne ut om problemet er på WiFi. Hopp over hvis PC-en ikke har kabeluttak.')]
  },
  'ikke-pa-nett/zyxel_p8702n/restart_modem_step.json': {
    title: 'Start modemet på nytt',
    body: [ol(['Ta ut strømkabelen.', 'Vent 10 sekunder.', 'Koble til igjen. Vent noen minutter.'])]
  },
  'ikke-pa-nett/zyxel_p8702n/restart_ont_step.json': {
    title: 'Start fiberboksen på nytt',
    body: [ol(['Ta ut strømkabelen.', 'Vent 1 minutt.', 'Koble til igjen. Vent noen minutter.'])]
  },
  'ikke-pa-nett/zyxel_p8702n/restart_ruter_ikke_nett_step.json': {
    title: 'Start ruteren på nytt',
    body: [ol(['Trekk ut strømkabelen.', 'Vent 10 sekunder.', 'Koble til igjen. Vent 2 minutter.'])]
  },
  'ikke-pa-nett/zyxel_p8702n/sjekk_kabling_step.json': {
    title: 'Sjekk kablene',
    body: [p('En eller flere kabler kan sitte feil. Sjekk at alle kabler er koblet til riktig.')]
  },
  'ikke-pa-nett/zyxel_p8702n/sjekk_kabling_step_v2.json': {
    title: 'Sjekk kablene',
    body: [p('En eller flere kabler kan sitte feil. Sjekk at alle kabler er koblet til riktig.')]
  },
  'ikke-pa-nett/zyxel_p8702n/sjekk_kabling_step_v3.json': {
    title: 'Sjekk kablene',
    body: [p('En eller flere kabler kan sitte feil. Sjekk at alle kabler er koblet til riktig.')]
  },
  'ikke-pa-nett/zyxel_p8702n/tilkoblet_strom.json': {
    title: 'Sjekk strømtilkoblingen',
    body: [ul(['Sjekk at strømkabelen sitter godt i ruteren og i stikkontakten.', 'Sjekk at av/på-bryteren står på.', 'Prøv et annet strømuttak du vet fungerer.'])]
  },
  'ikke-pa-nett/zyxel_p8702n/tilkoblet_strom_step.json': {
    title: 'Sjekk strømtilkoblingen',
    body: [ul(['Sjekk at strømkabelen sitter godt i ruteren og i stikkontakten.', 'Sjekk at av/på-bryteren står på.', 'Prøv et annet strømuttak du vet fungerer.'])]
  },
  'ikke-pa-nett/zyxel_p8702n/tilkoblet_strom_v2.json': {
    title: 'Sjekk strømtilkoblingen',
    body: [ul(['Sjekk at strømkabelen sitter godt i ruteren og i stikkontakten.', 'Sjekk at av/på-bryteren står på.', 'Prøv et annet strømuttak du vet fungerer.'])]
  },
  'ikke-pa-nett/zyxel_p8702n/tilkoblet_wifi_step.json': {
    title: 'Bruker du WiFi?',
    body: [p('Lampene lyser som de skal. Siden du fortsatt har problemer, kan det skyldes WiFi eller noe utstyr.')]
  },
  'ikke-pa-nett/zyxel_p8702n/wifi_status_step.json': {
    title: 'Er du koblet til WiFi?',
    body: [p('Sjekk om WiFi-ikonet på PC eller mobil viser at du er koblet til. På PC holder du musepekeren over ikonet. På mobil går du til Innstillinger og deretter WiFi.')]
  },

  // ─── TREGT NETT ─────────────────────────────────────────────────

  'tregt-nett/nei/huawei_b818/endre_plassering_av_ruter_step.json': {
    title: 'Flytt ruteren til et annet sted',
    body: [
      p('Plasser ruteren et annet sted for å få bedre signal. MODE-lampen skifter farge når du får 4G/4G+.'),
      ul(['Høyt oppe', 'Sentralt i huset', 'Nær et vindu']),
      p('Sjekk mobilsignalet ditt for å finne det beste stedet.')
    ]
  },
  'tregt-nett/nei/huawei_b818/hvilken_aksess.json': {
    title: 'Hvilken type internett har du?',
    body: [p('Vi leverer internett på flere måter. Velg det som passer deg.')]
  },
  'tregt-nett/nei/huawei_b818/lampestatus_mode_step.json': {
    title: 'Sjekk MODE-lampen',
    body: [p('MODE-lampen viser hvilken type mobildekning ruteren har.')]
  },
  'tregt-nett/nei/huawei_b818/mode_lyser_blaatt_step.json': {
    title: 'Du er koblet til 3G',
    body: [p('Ruteren er koblet til 3G. Du får bedre hastighet med 4G. Sjekk dekningen i ditt område.')]
  },
  'tregt-nett/nei/huawei_b818/mode_lyser_cyan_step.json': {
    title: 'Du er koblet til 4G/4G+',
    body: [p('Ruteren er koblet til 4G/4G+. Sjekk at du mottar sterke signaler.')]
  },
  'tregt-nett/nei/huawei_b818/mode_lyser_gult_step.json': {
    title: 'Du er koblet til 2G',
    body: [p('Ruteren er koblet til 2G. 2G er for tregt til vanlig nettsurfing. Sjekk dekningen i ditt område.')]
  },
  'tregt-nett/nei/huawei_b818/plassering_4g.json': {
    title: 'Flytt ruteren til et annet sted',
    body: [
      p('Plasser ruteren et annet sted for å få bedre signal.'),
      ul(['Høyt oppe', 'Sentralt i huset', 'Nær et vindu']),
      p('Sjekk mobilsignalet ditt for å finne det beste stedet.')
    ]
  },
  'tregt-nett/nei/jeg_har_en_annen_ruter/annen_ruter_result.json': {
    title: 'Har du en eldre ruter?',
    body: [p('Du finner hjelp på vår utstyrsoversikt. Eldre utstyr kan gi problemer — vurder å oppgradere.')]
  },
  'tregt-nett/nei/wifi_ruter_eller_wifi_ruter_ii/1_enhet_pa_nett.json': {
    title: 'Koble fra andre enheter',
    body: [
      p('Koble fra internett på alle enheter unntatt den du bruker nå.'),
      ul(['Slå av enhetene', 'Dra ut nettverkskabelen', 'Koble fra WiFi']),
      p('Test hastigheten etterpå.')
    ]
  },
  'tregt-nett/nei/wifi_ruter_eller_wifi_ruter_ii/copy_of_restart_ruter_tregt_step.json': {
    title: 'Start ruteren på nytt',
    body: [ol(['Trekk ut strømkabelen.', 'Vent 10 sekunder.', 'Koble til igjen. Vent 2 minutter.'])]
  },
  'tregt-nett/nei/wifi_ruter_eller_wifi_ruter_ii/flere_paa_nett_step.json': {
    title: 'Er det mange på nett?',
    body: [p('Mange enheter på samme nett kan gjøre det tregere for alle. Eksempel: hvis hele familien ser på strømmetjenester samtidig, deles hastigheten.')]
  },
  'tregt-nett/nei/zyxel_p8702n/1_enhet_pa_nett.json': {
    title: 'Koble fra andre enheter',
    body: [
      p('Koble fra internett på alle enheter unntatt den du bruker nå.'),
      ul(['Slå av enhetene', 'Dra ut nettverkskabelen', 'Koble fra WiFi']),
      p('Test hastigheten etterpå.')
    ]
  },
  'tregt-nett/nei/zyxel_p8702n/flere_pa_nett.json': {
    title: 'Er det mange på nett?',
    body: [p('Mange enheter på samme nett kan gjøre det tregere for alle.')]
  },
  'tregt-nett/nei/zyxel_p8702n/kontakt_leverandor_result.json': {
    title: 'Problemet er på enheten din',
    body: [p('Problemet ligger på enheten din. Kontakt leverandøren for mer hjelp.')]
  },
  'tregt-nett/nei/zyxel_p8702n/nettverkskabel_ok_step.json': {
    title: 'Problemet er på WiFi',
    body: [p('Du får riktig hastighet med kabel. Problemet ligger på WiFi, ikke på linjen vår.')]
  },
  'tregt-nett/nei/zyxel_p8702n/nullstill_ruter_generell_step.json': {
    title: 'Nullstill ruteren',
    body: [
      p('OBS: Nullstilling sletter nettverksnavn, passord og alle innstillinger.'),
      ol(['Finn en penn eller tynn gjenstand.', 'Stikk den inn i hullet merket RESET.', 'Hold inne i 10 sekunder og slipp.', 'Vent opptil 5 minutter.'])
    ]
  },
  'tregt-nett/nei/zyxel_p8702n/nullstill_ruter_wifi_step.json': {
    title: 'Nullstill ruteren',
    body: [ol(['Finn en penn eller tynn gjenstand.', 'Stikk den inn i hullet merket RESET.', 'Hold inne i 10 sekunder og slipp.', 'Vent opptil 5 minutter.'])]
  },
  'tregt-nett/nei/zyxel_p8702n/prov_nettverkskabel.json': {
    title: 'Prøv nettverkskabel',
    body: [p('Koble en nettverkskabel mellom ruteren og PC-en. Sjekk at kabelen ikke er skadet. Hopp over hvis PC-en ikke har kabeluttak.')]
  },
  'tregt-nett/nei/zyxel_p8702n/restart_ruter_tregt_step.json': {
    title: 'Start ruteren på nytt',
    body: [ol(['Trekk ut strømkabelen.', 'Vent 10 sekunder.', 'Koble til igjen. Vent 2 minutter.'])]
  },
  'tregt-nett/nei/zyxel_p8702n/sjekk_kabler_step.json': {
    title: 'Sjekk nettverkskabelen',
    body: [ul(['Sjekk at kabelen ikke er skadet.', 'Bytt LAN-uttak på baksiden av ruteren.', 'Bytt ut kabelen med en annen.'])]
  },
  'tregt-nett/nei/zyxel_p8702n/wifi_step.json': {
    title: 'Bruker du WiFi?',
    body: [p('WiFi kan bli tregere av forstyrrelser i hjemmet. En nettverkskabel gir vanligvis mer stabil tilkobling.')]
  },
  'tregt-nett/shared/1_enhet_pa_nett.json': {
    title: 'Koble fra andre enheter',
    body: [
      p('Koble fra internett på alle enheter unntatt den du bruker nå.'),
      ul(['Slå av enhetene', 'Dra ut nettverkskabelen', 'Koble fra WiFi']),
      p('Test stabiliteten etterpå.')
    ]
  },
  'tregt-nett/shared/1_enhet_pa_nett_v2.json': {
    title: 'Koble fra andre enheter',
    body: [
      p('Koble fra internett på alle enheter unntatt den du bruker nå.'),
      ul(['Slå av enhetene', 'Dra ut nettverkskabelen', 'Koble fra WiFi']),
      p('Test stabiliteten etterpå.')
    ]
  },
  'tregt-nett/shared/alltid_wifi_result.json': {
    title: 'Kontakt oss',
    body: [p('Ring oss på 915 09000, så hjelper vi deg videre.')]
  },
  'tregt-nett/shared/flere_pa_nett.json': {
    title: 'Er det mange på nett?',
    body: [p('Mange enheter på samme nett kan gjøre det tregere for alle. Eksempel: hvis hele familien ser på strømmetjenester samtidig, deles hastigheten.')]
  },
  'tregt-nett/shared/flere_pa_nett_v2.json': {
    title: 'Er det mange på nett?',
    body: [p('Mange enheter på samme nett kan gjøre det tregere for alle.')]
  },
  'tregt-nett/shared/godt_signal_gronn.json': {
    title: 'Du har sterkt signal',
    body: [p('Grønt lys betyr at forsterkeren mottar sterkt signal og fungerer bra.')]
  },
  'tregt-nett/shared/godt_signal_gul.json': {
    title: 'Du har godt signal',
    body: [p('Gult lys betyr godt signal. Prøv å plassere forsterkeren nærmere ruteren for enda bedre dekning.')]
  },
  'tregt-nett/shared/har_du_forsterker_step.json': {
    title: 'Har du en WiFi-forsterker?',
    body: [p('En WiFi-forsterker sender signalet videre fra ruteren for å gi dekning på et større område. Har du en?')]
  },
  'tregt-nett/shared/hastighetstest.json': {
    title: 'Sjekk hastigheten din',
    body: [p('Sjekk hastigheten med speedometeret vårt. Er du usikker på hvilken hastighet du har? Sjekk Mine sider.')]
  },
  'tregt-nett/shared/ikke_hastighetsproblem_result.json': {
    title: 'Hastigheten er riktig',
    body: [p('Du får riktig hastighet for abonnementet ditt. Opplever du at det varierer? Det kan være ustabilt nett.')]
  },
  'tregt-nett/shared/ingen_signal_mork.json': {
    title: 'Ingen signal',
    body: [p('Mørk lampe betyr at forsterkeren ikke mottar signal. Sjekk at den er koblet til ruteren.')]
  },
  'tregt-nett/shared/kontakt_oss_result.json': {
    title: 'Kontakt oss',
    body: [p('Vi trenger å undersøke dette nærmere. Ring kundeservice, så hjelper vi deg videre.')]
  },
  'tregt-nett/shared/nettverkskabel_ok_step.json': {
    title: 'Problemet er på WiFi',
    body: [p('Du får riktig hastighet med kabel. Problemet ligger på WiFi, ikke på linjen vår.')]
  },
  'tregt-nett/shared/nettverkskabel_ok_step_v2.json': {
    title: 'Problemet er på WiFi',
    body: [p('Du får riktig hastighet med kabel. Problemet ligger på WiFi, ikke på linjen vår.')]
  },
  'tregt-nett/shared/nettverkskabel_ok_step_v3.json': {
    title: 'Problemet er på WiFi',
    body: [p('Du får riktig hastighet med kabel. Problemet ligger på WiFi, ikke på linjen vår.')]
  },
  'tregt-nett/shared/nullstill_ruter_begge.json': {
    title: 'Nullstill ruteren',
    body: [
      p('OBS: Nullstilling sletter nettverksnavn, passord og alle innstillinger.'),
      ol(['Finn en penn eller tynn gjenstand.', 'Stikk den inn i hullet merket RESET.', 'Hold inne i 10 sekunder og slipp.', 'Vent opptil 5 minutter.'])
    ]
  },
  'tregt-nett/shared/nullstill_ruter_generell_step.json': {
    title: 'Nullstill ruteren',
    body: [
      p('OBS: Nullstilling sletter nettverksnavn, passord og alle innstillinger.'),
      ol(['Finn en penn eller tynn gjenstand.', 'Stikk den inn i hullet merket RESET.', 'Hold inne i 10 sekunder og slipp.', 'Vent opptil 5 minutter.'])
    ]
  },
  'tregt-nett/shared/nullstill_ruter_wifi_forsterker_step.json': {
    title: 'Nullstill ruteren',
    body: [
      p('OBS: Nullstilling sletter nettverksnavn, passord og alle innstillinger.'),
      ol(['Finn en penn eller tynn gjenstand.', 'Stikk den inn i hullet merket RESET.', 'Hold inne i 10 sekunder og slipp.', 'Vent opptil 5 minutter.'])
    ]
  },
  'tregt-nett/shared/problemer_med_kapasitet_step.json': {
    title: 'Bruker du WiFi?',
    body: [p('Problemet oppstår kanskje fordi dere er mange på nett samtidig. Det kan skyldes for lav hastighet, feil på linjen vår, eller svakt WiFi.')]
  },
  'tregt-nett/shared/problemer_med_kapasitet_step_v2.json': {
    title: 'Bruker du WiFi?',
    body: [p('Problemet oppstår kanskje fordi det er mange på nett samtidig.')]
  },
  'tregt-nett/shared/problemer_med_kapasitet_step_v3.json': {
    title: 'Bruker du WiFi?',
    body: [p('Problemet oppstår kanskje fordi dere er mange på nett samtidig.')]
  },
  'tregt-nett/shared/problem_lost_result.json': {
    title: 'Problemet er løst!',
    body: [p('Bra! Vi er glad problemet er løst. Opplever du dette ofte? Ring oss på 915 09000.')]
  },
  'tregt-nett/shared/prov_nettverkskabel.json': {
    title: 'Prøv nettverkskabel',
    body: [p('Koble en nettverkskabel mellom ruteren og PC-en. Sjekk at kabelen ikke er skadet. Hopp over hvis PC-en ikke har kabeluttak.')]
  },
  'tregt-nett/shared/prov_nettverkskabel_step.json': {
    title: 'Prøv nettverkskabel',
    body: [p('Koble en nettverkskabel mellom ruteren og PC-en. Sjekk at kabelen ikke er skadet. Hopp over hvis PC-en ikke har kabeluttak.')]
  },
  'tregt-nett/shared/prov_nettverkskabel_v2.json': {
    title: 'Prøv nettverkskabel',
    body: [p('Koble en nettverkskabel mellom ruteren og PC-en. Sjekk at kabelen ikke er skadet. Hopp over hvis PC-en ikke har kabeluttak.')]
  },
  'tregt-nett/shared/restart_ruter_step.json': {
    title: 'Start ruteren på nytt',
    body: [ol(['Trekk ut strømkabelen.', 'Vent 10 sekunder.', 'Koble til igjen. Vent 2 minutter.'])]
  },
  'tregt-nett/shared/restart_ruter_ustabilt_step.json': {
    title: 'Start ruteren på nytt',
    body: [ol(['Trekk ut strømkabelen.', 'Vent 10 sekunder.', 'Koble til igjen. Vent 2 minutter.'])]
  },
  'tregt-nett/shared/signalstyrke_step.json': {
    title: 'Sjekk signalstyrken',
    body: [p('Lampen på forsterkeren viser hvor godt signal den mottar.')]
  },
  'tregt-nett/shared/sjekk_kabler_step.json': {
    title: 'Sjekk nettverkskabelen',
    body: [ul(['Sjekk at kabelen ikke er skadet.', 'Bytt LAN-uttak på baksiden av ruteren.', 'Bytt ut kabelen med en annen.'])]
  },
  'tregt-nett/shared/sjekk_kabler_step_v2.json': {
    title: 'Sjekk nettverkskabelen',
    body: [ul(['Sjekk at kabelen ikke er skadet.', 'Bytt LAN-uttak på baksiden av ruteren.', 'Bytt ut kabelen med en annen.'])]
  },
  'tregt-nett/shared/sjekk_kabler_step_v3.json': {
    title: 'Sjekk nettverkskabelen',
    body: [ul(['Sjekk at kabelen ikke er skadet.', 'Bytt LAN-uttak på baksiden av ruteren.', 'Bytt ut kabelen med en annen.'])]
  },
  'tregt-nett/shared/svakt_signal_step.json': {
    title: 'Svakt signal',
    body: [p('Rød lampe betyr svakt signal. Plasser forsterkeren nærmere ruteren.')]
  },
  'tregt-nett/shared/tregt_nett_start.json': {
    title: 'Tregt internett hjemme?',
    body: [p('Trykk Start så hjelper vi deg steg for steg.')]
  },
  'tregt-nett/shared/tregt_step.json': {
    title: 'Start ruteren på nytt',
    body: [ol(['Trekk ut strømkabelen.', 'Vent 10 sekunder.', 'Koble til igjen. Vent 2 minutter.'])]
  },
  'tregt-nett/shared/wifi_step.json': {
    title: 'Bruker du WiFi?',
    body: [p('WiFi kan bli ustabilt av forstyrrelser i hjemmet. En nettverkskabel gir vanligvis mer stabil tilkobling.')]
  },
  'tregt-nett/shared/wifi_step_v2.json': {
    title: 'Bruker du WiFi?',
    body: [p('WiFi kan bli tregere av forstyrrelser i hjemmet. En nettverkskabel gir vanligvis mer stabil tilkobling.')]
  },
  'tregt-nett/shared/wifi_step_v3.json': {
    title: 'Bruker du WiFi?',
    body: [p('WiFi kan bli ustabilt av forstyrrelser i hjemmet. En nettverkskabel gir vanligvis mer stabil tilkobling.')]
  },

  // ─── USTABILT NETT ──────────────────────────────────────────────

  'ustabilt-nett/huawei_b818/endre_plassering_av_ruter_step.json': {
    title: 'Flytt ruteren til et annet sted',
    body: [
      p('Plasser ruteren et annet sted for å få bedre signal. MODE-lampen skifter farge når du får 4G/4G+.'),
      ul(['Høyt oppe', 'Sentralt i huset', 'Nær et vindu']),
      p('Sjekk mobilsignalet ditt for å finne det beste stedet.')
    ]
  },
  'ustabilt-nett/huawei_b818/lampestatus_mode_step.json': {
    title: 'Sjekk MODE-lampen',
    body: [p('MODE-lampen viser hvilken type mobildekning ruteren har.')]
  },
  'ustabilt-nett/huawei_b818/mode_lyser_blaatt_step.json': {
    title: 'Du er koblet til 3G',
    body: [p('Ruteren er koblet til 3G. Du får bedre hastighet med 4G. Sjekk dekningen i ditt område.')]
  },
  'ustabilt-nett/huawei_b818/mode_lyser_cyan_step.json': {
    title: 'Du er koblet til 4G/4G+',
    body: [p('Ruteren er koblet til 4G/4G+. Sjekk at du mottar sterke signaler.')]
  },
  'ustabilt-nett/huawei_b818/mode_lyser_gult_step.json': {
    title: 'Du er koblet til 2G',
    body: [p('Ruteren er koblet til 2G. 2G er for tregt til vanlig nettsurfing. Sjekk dekningen i ditt område.')]
  },
  'ustabilt-nett/huawei_b818/plassering_4g.json': {
    title: 'Flytt ruteren til et annet sted',
    body: [
      p('Plasser ruteren et annet sted for å få bedre signal.'),
      ul(['Høyt oppe', 'Sentralt i huset', 'Nær et vindu']),
      p('Sjekk mobilsignalet ditt for å finne det beste stedet.')
    ]
  },
  'ustabilt-nett/huawei_b818/restart_ruter_step.json': {
    title: 'Start ruteren på nytt',
    body: [ol(['Trekk ut strømkabelen.', 'Vent 10 sekunder.', 'Koble til igjen. Vent 2 minutter.'])]
  },
  'ustabilt-nett/jeg_har_en_annen_ruter/annen_ruter_result.json': {
    title: 'Har du en eldre ruter?',
    body: [p('Du finner hjelp på vår utstyrsoversikt. Eldre utstyr kan gi problemer — vurder å oppgradere.')]
  },
  'ustabilt-nett/shared/kontakt_oss_result.json': {
    title: 'Kontakt oss',
    body: [p('Vi trenger å undersøke dette nærmere. Ring kundeservice, så hjelper vi deg videre.')]
  },
  'ustabilt-nett/shared/problem_lost_result.json': {
    title: 'Problemet er løst!',
    body: [p('Bra! Vi er glad problemet er løst. Opplever du dette ofte? Ring oss på 915 09000.')]
  },
  'ustabilt-nett/shared/ustabilt_nett_start.json': {
    title: 'Ustabilt internett hjemme?',
    body: [p('Trykk Start så hjelper vi deg steg for steg.')]
  },
  'ustabilt-nett/wifi_ruter_wifi_ruter_ii/1_enhet_pa_nett.json': {
    title: 'Koble fra andre enheter',
    body: [
      p('Koble fra internett på alle enheter unntatt den du bruker nå.'),
      ul(['Slå av enhetene', 'Dra ut nettverkskabelen', 'Koble fra WiFi']),
      p('Test stabiliteten etterpå.')
    ]
  },
  'ustabilt-nett/wifi_ruter_wifi_ruter_ii/alltid_wifi_result.json': {
    title: 'Kontakt oss',
    body: [p('Ring oss på 915 09000, så hjelper vi deg videre.')]
  },
  'ustabilt-nett/wifi_ruter_wifi_ruter_ii/flere_pa_nett.json': {
    title: 'Er det mange på nett?',
    body: [p('Mange enheter på samme nett kan gjøre det tregere for alle.')]
  },
  'ustabilt-nett/wifi_ruter_wifi_ruter_ii/godt_signal_gronn.json': {
    title: 'Du har sterkt signal',
    body: [p('Grønt lys betyr at forsterkeren mottar sterkt signal og fungerer bra.')]
  },
  'ustabilt-nett/wifi_ruter_wifi_ruter_ii/godt_signal_gul.json': {
    title: 'Du har godt signal',
    body: [p('Gult lys betyr godt signal. Prøv å plassere forsterkeren nærmere ruteren.')]
  },
  'ustabilt-nett/wifi_ruter_wifi_ruter_ii/har_du_forsterker_step.json': {
    title: 'Har du en WiFi-forsterker?',
    body: [p('En WiFi-forsterker sender signalet videre fra ruteren. Har du en?')]
  },
  'ustabilt-nett/wifi_ruter_wifi_ruter_ii/ingen_signal_mork.json': {
    title: 'Ingen signal',
    body: [p('Mørk lampe betyr at forsterkeren ikke mottar signal. Sjekk at den er koblet til ruteren.')]
  },
  'ustabilt-nett/wifi_ruter_wifi_ruter_ii/nettverkskabel_ok_step.json': {
    title: 'Problemet er på WiFi',
    body: [p('Du får riktig hastighet med kabel. Problemet ligger på WiFi, ikke på linjen vår.')]
  },
  'ustabilt-nett/wifi_ruter_wifi_ruter_ii/nullstill_ruter_begge.json': {
    title: 'Nullstill ruteren',
    body: [
      p('OBS: Nullstilling sletter nettverksnavn, passord og alle innstillinger.'),
      ol(['Finn en penn eller tynn gjenstand.', 'Stikk den inn i hullet merket RESET.', 'Hold inne i 10 sekunder og slipp.', 'Vent opptil 5 minutter.'])
    ]
  },
  'ustabilt-nett/wifi_ruter_wifi_ruter_ii/nullstill_ruter_generell_step.json': {
    title: 'Nullstill ruteren',
    body: [
      p('OBS: Nullstilling sletter nettverksnavn, passord og alle innstillinger.'),
      ol(['Finn en penn eller tynn gjenstand.', 'Stikk den inn i hullet merket RESET.', 'Hold inne i 10 sekunder og slipp.', 'Vent opptil 5 minutter.'])
    ]
  },
  'ustabilt-nett/wifi_ruter_wifi_ruter_ii/nullstill_ruter_wifi_forsterker_step.json': {
    title: 'Nullstill ruteren',
    body: [
      p('OBS: Nullstilling sletter nettverksnavn, passord og alle innstillinger.'),
      ol(['Finn en penn eller tynn gjenstand.', 'Stikk den inn i hullet merket RESET.', 'Hold inne i 10 sekunder og slipp.', 'Vent opptil 5 minutter.'])
    ]
  },
  'ustabilt-nett/wifi_ruter_wifi_ruter_ii/problemer_med_kapasitet_step.json': {
    title: 'Bruker du WiFi?',
    body: [p('Problemet oppstår kanskje fordi dere er mange på nett samtidig.')]
  },
  'ustabilt-nett/wifi_ruter_wifi_ruter_ii/prov_nettverkskabel.json': {
    title: 'Prøv nettverkskabel',
    body: [p('Koble en nettverkskabel mellom ruteren og PC-en. Sjekk at kabelen ikke er skadet. Hopp over hvis PC-en ikke har kabeluttak.')]
  },
  'ustabilt-nett/wifi_ruter_wifi_ruter_ii/signalstyrke_step.json': {
    title: 'Sjekk signalstyrken',
    body: [p('Lampen på forsterkeren viser hvor godt signal den mottar.')]
  },
  'ustabilt-nett/wifi_ruter_wifi_ruter_ii/sjekk_kabler_step.json': {
    title: 'Sjekk nettverkskabelen',
    body: [ul(['Sjekk at kabelen ikke er skadet.', 'Bytt LAN-uttak på baksiden av ruteren.', 'Bytt ut kabelen med en annen.'])]
  },
  'ustabilt-nett/wifi_ruter_wifi_ruter_ii/svakt_signal_step.json': {
    title: 'Svakt signal',
    body: [p('Rød lampe betyr svakt signal. Plasser forsterkeren nærmere ruteren.')]
  },
  'ustabilt-nett/wifi_ruter_wifi_ruter_ii/tregt_step.json': {
    title: 'Start ruteren på nytt',
    body: [ol(['Trekk ut strømkabelen.', 'Vent 10 sekunder.', 'Koble til igjen. Vent 2 minutter.'])]
  },
  'ustabilt-nett/wifi_ruter_wifi_ruter_ii/wifi_step.json': {
    title: 'Bruker du WiFi?',
    body: [p('WiFi kan bli ustabilt av forstyrrelser i hjemmet. En nettverkskabel gir vanligvis mer stabil tilkobling.')]
  },
  'ustabilt-nett/zyxel_p8702n/1_enhet_pa_nett.json': {
    title: 'Koble fra andre enheter',
    body: [
      p('Koble fra internett på alle enheter unntatt den du bruker nå.'),
      ul(['Slå av enhetene', 'Dra ut nettverkskabelen', 'Koble fra WiFi']),
      p('Test stabiliteten etterpå.')
    ]
  },
  'ustabilt-nett/zyxel_p8702n/flere_pa_nett.json': {
    title: 'Er det mange på nett?',
    body: [p('Mange enheter på samme nett kan gjøre det tregere for alle.')]
  },
  'ustabilt-nett/zyxel_p8702n/kontakt_leverandor_result.json': {
    title: 'Problemet er på enheten din',
    body: [p('Problemet ligger på enheten din. Kontakt leverandøren for mer hjelp.')]
  },
  'ustabilt-nett/zyxel_p8702n/nettverkskabel_ok_step.json': {
    title: 'Problemet er på WiFi',
    body: [p('Du får riktig hastighet med kabel. Problemet ligger på WiFi, ikke på linjen vår.')]
  },
  'ustabilt-nett/zyxel_p8702n/nullstill_ruter_generell_step.json': {
    title: 'Nullstill ruteren',
    body: [
      p('OBS: Nullstilling sletter nettverksnavn, passord og alle innstillinger.'),
      ol(['Finn en penn eller tynn gjenstand.', 'Stikk den inn i hullet merket RESET.', 'Hold inne i 10 sekunder og slipp.', 'Vent opptil 5 minutter.'])
    ]
  },
  'ustabilt-nett/zyxel_p8702n/nullstill_ruter_wifi_step.json': {
    title: 'Nullstill ruteren',
    body: [ol(['Finn en penn eller tynn gjenstand.', 'Stikk den inn i hullet merket RESET.', 'Hold inne i 10 sekunder og slipp.', 'Vent opptil 5 minutter.'])]
  },
  'ustabilt-nett/zyxel_p8702n/problemer_med_kapasitet_step.json': {
    title: 'Bruker du WiFi?',
    body: [p('Problemet oppstår kanskje fordi dere er mange på nett samtidig.')]
  },
  'ustabilt-nett/zyxel_p8702n/prov_nettverkskabel.json': {
    title: 'Prøv nettverkskabel',
    body: [p('Koble en nettverkskabel mellom ruteren og PC-en. Sjekk at kabelen ikke er skadet. Hopp over hvis PC-en ikke har kabeluttak.')]
  },
  'ustabilt-nett/zyxel_p8702n/restart_ruter_ustabilt_step.json': {
    title: 'Start ruteren på nytt',
    body: [ol(['Trekk ut strømkabelen.', 'Vent 10 sekunder.', 'Koble til igjen. Vent 2 minutter.'])]
  },
  'ustabilt-nett/zyxel_p8702n/sjekk_kabler_step.json': {
    title: 'Sjekk nettverkskabelen',
    body: [ul(['Sjekk at kabelen ikke er skadet.', 'Bytt LAN-uttak på baksiden av ruteren.', 'Bytt ut kabelen med en annen.'])]
  },
  'ustabilt-nett/zyxel_p8702n/wifi_step.json': {
    title: 'Bruker du WiFi?',
    body: [p('WiFi kan bli ustabilt av forstyrrelser i hjemmet. En nettverkskabel gir vanligvis mer stabil tilkobling.')]
  }
}

// ─── KJØR OPPDATERING ───────────────────────────────────────────

function updateFile(filePath, relativePath) {
  const normalized = relativePath.replace(/\\/g, '/')
  const rewrite = rewrites[normalized]
  if (!rewrite) return

  let json
  try {
    json = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  } catch (e) {
    console.error('Parse error:', filePath)
    return
  }

  if (rewrite.title !== undefined) json.title = rewrite.title
  if (rewrite.body !== undefined) json.body = rewrite.body

  fs.writeFileSync(filePath, JSON.stringify(json, null, 2), 'utf-8')
  console.log('✓', normalized)
}

function processDir(dir, baseDir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      processDir(fullPath, baseDir)
    } else if (entry.name.endsWith('.json')) {
      updateFile(fullPath, path.relative(baseDir, fullPath))
    }
  }
}

processDir(localesDir, localesDir)
console.log(`\nFerdig! ${Object.keys(rewrites).length} filer behandlet.`)