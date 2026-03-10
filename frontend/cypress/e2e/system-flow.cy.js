describe('System Test: Full User Journey', () => {
    const timestamp = Date.now();
    const email = `testuser_${timestamp}@example.com`;
    const password = 'Password123!';

    it('allows a user to register, login, and create a canvas', () => {
        // 1. Register
        cy.visit('/register');
        cy.get('input[placeholder="Full Name"]').type('Test User');
        cy.get('input[placeholder="Email address"]').type(email);
        cy.get('input[placeholder="Password"]').type(password);
        cy.get('input[placeholder="Confirm Password"]').type(password);
        cy.get('button').contains('CREATE ACCOUNT →').click();

        // 2. Verify Auto-Login & Redirect
        // Registering auto-logs in and redirects to /my-canvases
        cy.url().should('include', '/my-canvases');

        // 3. Logout (to test login)
        cy.window().then((win) => win.localStorage.removeItem('token'));
        cy.visit('/login');

        // 4. Login
        cy.get('input[placeholder="you@example.com"]').type(email);
        cy.get('input[placeholder="••••••••"]').type(password);
        cy.get('button').contains('Sign In').click();

        // Should be redirected to My Canvases
        cy.url().should('include', '/my-canvases');

        // 5. Create New Canvas
        cy.contains(/Create one now|New Canvas/i).click();
        cy.get('input[placeholder="e.g., My Awesome Idea"]').type('System Flow Canvas');
        cy.get('button[type="submit"]').click();

        // 6. Verify Redirect to Canvas Room
        cy.url().should('include', '/canvas/');
        cy.get('svg').should('exist'); // Verify canvas exists
    });
});
