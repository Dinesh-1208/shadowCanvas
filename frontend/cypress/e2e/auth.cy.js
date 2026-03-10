describe('Authentication Flow', () => {
    let testUser;

    before(() => {
        // Generate ONE test user per FULL run of this spec
        testUser = {
            name: 'Cypress Tester',
            email: `tester_${Date.now()}@example.com`,
            password: 'password123'
        };
    });

    it('should successfully register a new user', () => {
        cy.visit('/register');
        
        cy.get('input[placeholder="Full Name"]').type(testUser.name);
        cy.get('input[placeholder="Email address"]').type(testUser.email);
        cy.get('input[placeholder="Password"]').type(testUser.password);
        cy.get('input[placeholder="Confirm Password"]').type(testUser.password);
        cy.get('button').contains('CREATE ACCOUNT →').click();

        cy.url().should('include', '/my-canvases');
    });

    it('should successfully login an existing user', () => {
        cy.visit('/login');
        
        // This will now use the exact same testUser.email that was just registered!
        cy.get('input[placeholder="you@example.com"]').type(testUser.email);
        cy.get('input[placeholder="••••••••"]').type(testUser.password);
        cy.get('button').contains('Sign In').click();

        cy.url().should('include', '/my-canvases');
        cy.contains('My Canvases').should('be.visible');
    });

    it('should show error on invalid credentials', () => {
        cy.visit('/login');
        
        cy.get('input[placeholder="you@example.com"]').type('invalid_user_never_created@example.com');
        cy.get('input[placeholder="••••••••"]').type('wrongpassword');
        cy.get('button').contains('Sign In').click();

        cy.contains('Email not registered').should('be.visible');
        cy.url().should('include', '/login');
    });

    it('should navigate to forgot password page', () => {
        cy.visit('/login');
        cy.contains('Forgot password?').click();
        cy.url().should('include', '/forgot-password');
    });
});
