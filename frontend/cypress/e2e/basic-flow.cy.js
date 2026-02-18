describe('ShadowCanvas Basic Flow', () => {
    it('loads the landing page', () => {
        cy.visit('/');
        cy.contains('ShadowCanvas');
        cy.contains('Get Started');
    });

    it('can navigate to register via Get Started button', () => {
        cy.visit('/');
        cy.contains('Get Started').first().click();
        cy.url().should('include', '/register');
    });
});
