describe("Mobilvisning", () => {
  beforeEach(() => {
    cy.viewport("iphone-6+");
  });

  it("forsiden vises korrekt på mobil", () => {
    cy.visit("http://localhost:3000");
    cy.contains("Hva trenger du hjelp med?").should("be.visible");
    cy.get('input[type="text"]').should("be.visible");
  });

  it("kan navigere til kategori på mobil", () => {
    cy.visit("http://localhost:3000");
    cy.contains("Ikke på nett").click();
    cy.url().should("include", "/feilsoking");
  });

  it("innloggingssiden vises korrekt på mobil", () => {
    cy.visit("http://localhost:3000/agent/login");
    cy.get('input[type="email"]').should("be.visible");
    cy.get('input[type="password"]').should("be.visible");
    cy.get('button[type="submit"]').should("be.visible");
  });

  it("kan navigere til kategori på mobil", () => {
    cy.visit("http://localhost:3000");
    cy.contains("Ikke på nett").click();
    cy.url().should("include", "/feilsoking/ikke-pa-nett");

    cy.contains("Huawei B818").click();
    cy.url().should("include", "/feilsoking/ikke-pa-nett");

    cy.contains("button", "Ja", { timeout: 8000 }).should("be.visible").click();
  });
});
