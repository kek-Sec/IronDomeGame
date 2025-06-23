// cypress/e2e/game.cy.ts

interface CustomWindow extends Window {
  gameState: any;
}

describe('Iron Dome Game E2E', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should load the start screen and successfully start a game on Veteran difficulty', () => {
    // Assert that the start screen modal is visible
    cy.get('#modal-container').should('be.visible');
    cy.get('h1').contains('IRON DOME').should('be.visible');

    // Find and click the 'Veteran' difficulty button
    cy.get('#start-normal').should('be.visible');
    cy.get('#start-normal').click();

    // Assert that the game has started
    cy.get('#modal-container').should('not.be.visible');
    cy.get('#ui-container').should('be.visible');

    // Check the internal game state, retrying until the state is correct
    cy.window().its('gameState.gameState').should('eq', 'IN_WAVE');

    // Once the state is correct, check other properties
    cy.window().should((win) => {
      // Correctly cast the window object
      const gameWin = win as unknown as CustomWindow;
      expect(gameWin.gameState.difficulty).to.equal('normal');
      expect(gameWin.gameState.currentWave).to.equal(0);
    });
  });
});