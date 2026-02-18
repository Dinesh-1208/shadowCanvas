describe('ShadowCanvas Basic Flow', () => {
    it('loads the landing page', () => {
        cy.visit('/');
        cy.contains('ShadowCanvas');
        cy.contains('Create Free Canvas');
    });

    it('can navigate to login', () => {
        cy.visit('/');
        cy.contains('Login').click();
        cy.url().should('include', '/login');
    });
});
