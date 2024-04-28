describe("ExpressJs E2E tests", () => {
  it("test calling a trackable api route", () => {
    cy.wait(500);
    cy.request("http://localhost:3000/test").as("testMark");
    cy.get("@testMark").should((response: any) => {
      expect(response.body).to.equal("<div data-testid='status-msg'>Is streaming: true</div>");
    });
  });
});
