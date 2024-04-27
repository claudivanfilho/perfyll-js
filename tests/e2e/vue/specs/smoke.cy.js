describe("Nextjs smoke tests", () => {
  it("test if the app loads well", () => {
    cy.visit("http://localhost:5173");
    cy.get("[data-testid=status-msg]").should("contain", "App Loaded Successfully");
    cy.wait(2000);
  });

  it("test when an error occurs in the front and the logError is sent", () => {
    cy.visit("http://localhost:5173");
    cy.get("[data-testid=test-error]").click();
    cy.get("[data-testid=status-msg]").should("contain", "LogError working fine");
    cy.wait(2000);
  });
});
