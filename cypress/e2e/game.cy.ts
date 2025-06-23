// cypress/e2e/game.cy.ts

// This interface is needed to tell TypeScript about the custom `gameState` property we added to the window
interface CustomWindow extends Window {
  gameState: any; // Use a more specific type if you have one, 'any' is fine for now
}

describe('Iron Dome Game E2E', () => {
  beforeEach(() => {
    // Visit the game's base URL before each test
    cy.visit('/');
  });

  it('should load the start screen and successfully start a game on Veteran difficulty', () => {
    // 1. Assert that the start screen modal is visible
    cy.get('#modal-container').should('be.visible');
    cy.get('h1').contains('IRON DOME').should('be.visible');

    // 2. Find and click the 'Veteran' difficulty button
    cy.get('#start-normal').should('be.visible');
    cy.get('#start-normal').click();

    // 3. Assert that the game has started
    // The modal should disappear
    cy.get('#modal-container').should('not.be.visible');
    cy.get('#ui-container').should('be.visible');

    // 4. Check the internal game state using our backdoor
    // This will retry until the gameState is 'IN_WAVE' or it times out.
    cy.window().its('gameState.gameState').should('eq', 'IN_WAVE');

    // 5. Once we know the state is correct, we can check the other properties.
    cy.window().should((win: Cypress.AUTWindow | CustomWindow) => {
      const gameWin = win as CustomWindow;
      expect(gameWin.gameState.difficulty).to.equal('normal');
      expect(gameWin.gameState.currentWave).to.equal(0);
    });
  });
});