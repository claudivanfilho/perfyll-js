describe("Vuejs E2E tests", () => {
  it("test if the mark event is sent to the cloud", () => {
    cy.visit("http://localhost:5173");
    cy.get("[data-testid=status-msg]").should("contain", "App Loaded Successfully");
    cy.intercept("POST", /\/analytics$/).as("postMark");
    cy.wait("@postMark").then((interception) => {
      const req = interception.request;
      expect(req.body.hash).to.exist;
      expect(req.body.main).to.equal("testVue3Front");
      expect(req.body.marks[0][0]).to.equal("testVue3Front");
      expect(req.body.marks[0][1]).to.greaterThan(Date.now() - 10000);
      expect(req.body.marks[0][2]).to.greaterThan(Date.now() - 10000);
      expect(JSON.stringify(req.body.marks[0][3])).to.equal("{}");
      expect(req.headers["x-api-key"]).to.exist;
    });
  });

  it("test if the logError event is sent to the cloud", () => {
    cy.visit("http://localhost:5173");
    cy.get("[data-testid=test-error]").click();
    cy.get("[data-testid=status-msg]").should("contain", "LogError working fine");
    cy.intercept("POST", /\/log$/).as("postLogError");
    cy.wait("@postLogError").then((interception) => {
      const req = interception.request;
      expect(req.body.action).to.equal("log");
      expect(req.body.type).to.equal("error");
      expect(req.body.date).to.greaterThan(Date.now() - 10000);
      expect(req.body.error.message).to.equal("Failed to fetch");
      expect(req.body.error.name).to.equal("TypeError");
      expect(req.body.extra.framework).to.equal("Vue3");
      expect(req.body.extra.mode).to.equal("frontend");
      expect(req.headers["x-api-key"]).to.exist;
    });
  });
});