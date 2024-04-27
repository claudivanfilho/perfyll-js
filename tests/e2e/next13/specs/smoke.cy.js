describe("Nextjs smoke tests", () => {
  it("test if the app loads well", () => {
    cy.visit("http://localhost:3000");
    cy.get("[data-testid=status-msg]").should("contain", "App Loaded Successfully");
  });

  it("test if the api event with perfyll goes well", () => {
    cy.visit("http://localhost:3000");
    cy.get("[data-testid=test-api-button]").click();
    cy.wait(1000);
  });

  it("test when an error occurs in the front and the logError is sent", () => {
    cy.visit("http://localhost:3000");
    cy.get("[data-testid=test-error]").click();
    cy.get("[data-testid=status-msg]").should("contain", "LogError working fine");
    cy.wait(1000);
  });

  it("test when an error occurs in the back and the logError is sent", () => {
    cy.visit("http://localhost:3000");
    cy.get("[data-testid=test-error-api]").click();
    cy.get("[data-testid=status-msg]").should("contain", "LogError of Api working fine");
  });
});
