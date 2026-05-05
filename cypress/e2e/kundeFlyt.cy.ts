describe('Kundeflyt — feilsøking', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000')
  })

  it('viser forsiden med kategorier og søkefelt', () => {
    cy.contains('Hva trenger du hjelp med?').should('be.visible')
    cy.get('input[type="text"]').should('be.visible')
  })

  it('kan navigere til en kategori', () => {
    cy.contains('Ikke på nett').click()
    cy.url().should('include', '/feilsoking')
  })

  it('kan velge rutermodell', () => {
    cy.contains('Ikke på nett').click()
    cy.contains('Huawei B818').click()
    cy.url().should('include', '/feilsoking')
  })
  

it('kan gjennomføre feilsøkingssteg', () => {
  cy.contains('Ikke på nett').click()
  cy.url().should('include', '/feilsoking/ikke-pa-nett')

  cy.contains('Huawei B818').click()
  cy.url().should('include', '/feilsoking/ikke-pa-nett')

  cy.contains('button', 'Ja', { timeout: 8000 })
    .should('be.visible')
    .click()
})

it('søkefelt fungerer', () => {
  cy.get('input[type="text"]').first().type('internett')
  cy.get('input[type="text"]').first().should('have.value', 'internett')
})


})