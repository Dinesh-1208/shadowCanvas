describe('Canvas Flow', () => {
    const testUser = {
        name: 'Canvas E2E Tester',
        email: `canvas_${Date.now()}@example.com`,
        password: 'password123'
    };

    before(() => {
        // Register a user for canvas testing
        cy.request('POST', 'http://localhost:5000/auth/register', testUser)
          .then((response) => {
              expect(response.status).to.eq(201);
              // Save token if needed, but we can also just login via UI
          });
    });

    beforeEach(() => {
        // Login before each test
        cy.visit('/login');
        cy.get('input[placeholder="you@example.com"]').type(testUser.email);
        cy.get('input[placeholder="••••••••"]').type(testUser.password);
        cy.get('button').contains('Sign In').click();
        cy.url().should('include', '/my-canvases');
    });

    it('should create a new canvas', () => {
        cy.contains(/Create one now|New Canvas/i).click();
        cy.get('input[placeholder="e.g., My Awesome Idea"]').type('E2E Test Canvas');
        cy.get('button[type="submit"]').click();
        
        // Wait for navigation to the canvas room
        cy.url().should('include', '/canvas/');
        
        // Basic check for canvas UI elements
        cy.get('svg').should('exist');
        cy.contains('Share').should('exist');
    });

    it('should return to dashboard and list the created canvas', () => {
        cy.visit('/my-canvases');
        // Our newly created canvas should appear in the list
        cy.contains('E2E Test Canvas').should('be.visible');
    });
    
    it('should open an existing canvas from the dashboard', () => {
        cy.visit('/my-canvases');
        cy.contains('E2E Test Canvas').click();
        cy.url().should('include', '/canvas/');
        cy.get('svg').should('exist');
    });
});
