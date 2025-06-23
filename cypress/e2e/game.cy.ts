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
    cy.get('#modal-container').should('not.be.visible');
    cy.get('#ui-container').should('be.visible');

    // 4. Check the internal game state using our backdoor
    cy.window().should((win: Cypress.AUTWindow | CustomWindow) => {
      const gameWin = win as CustomWindow;
      expect(gameWin.gameState).to.exist;
      expect(gameWin.gameState.gameState).to.equal('IN_WAVE');
      expect(gameWin.gameState.difficulty).to.equal('normal');
      expect(gameWin.gameState.currentWave).to.equal(0);
    });
  });
});