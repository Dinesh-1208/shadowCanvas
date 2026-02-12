describe("Routing Test - Login Navigation", () => {

  it("Direct URL access to /login should work", () => {
    cy.visit("http://localhost:5173/login");
    cy.url().should("include", "/login");
  });

  it("Navbar Login should redirect to /login", () => {
    cy.visit("http://localhost:5173");
    cy.contains("Login").click();
    cy.url().should("include", "/login");
  });

});
