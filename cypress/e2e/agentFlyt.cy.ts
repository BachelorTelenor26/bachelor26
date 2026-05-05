describe('Agentflyt — innlogging og sesjonsoppslag', () => {
    it('feil passord gir feilmelding', () => {
  cy.visit('http://localhost:3000/agent/login')
  cy.get('input[type="email"]').type('siri.hvamstad@kundeservice.no')
  cy.get('input[type="password"]').type('feilpassord')
  cy.get('button[type="submit"]').click()
  cy.contains('Feil epost eller passord').should('be.visible')
})

  it('kan logge inn som agent', () => {
    cy.visit('http://localhost:3000/agent/login')
    cy.get('input[type="email"]').type('siri.hvamstad@kundeservice.no')
    cy.get('input[type="password"]').type('passord123')
    cy.get('button[type="submit"]').click()
    cy.url().should('include', '/agent/dashboard')
  })

it('kan slå opp en sesjon', () => {
  cy.visit('http://localhost:3000/agent/login')
  cy.get('input[type="email"]').type('siri.hvamstad@kundeservice.no')
  cy.get('input[type="password"]').type('passord123')
  cy.get('button[type="submit"]').click()
  cy.url().should('include', '/agent/dashboard')
  cy.contains('Slå opp sesjons-ID').click()
  cy.url().should('include', '/agent/session')
  cy.get('input[type="text"]').type('KS-4A67-3JV2')
  cy.get('button[type="submit"]').click()
  cy.contains('KS-4A67-3JV2').should('be.visible')
})

  it('uinnlogget bruker sendes til login', () => {
    cy.visit('http://localhost:3000/agent/dashboard')
    cy.url().should('include', '/agent/login')
  })

  it('viser feilmelding ved ugyldig sesjons-ID', () => {
  cy.visit('http://localhost:3000/agent/login')

  cy.get('input[type="email"]').type('siri.hvamstad@kundeservice.no')
  cy.get('input[type="password"]').type('passord123')
  cy.get('button[type="submit"]').click()

  cy.url().should('include', '/agent/dashboard')

  cy.contains('Slå opp sesjons-ID').click()
  cy.url().should('include', '/agent/session')

  cy.get('input[type="text"]').type('XXXX-UGYLDIG')
  cy.contains('button', 'Slå opp').click()

  cy.contains('Ugyldig sesjonskode').should('be.visible')
})

})