// cypress/e2e/game_spec.cy.ts

interface CustomWindow extends Window {
    gameState: any;
}

describe('Gameplay Mechanics', () => {
    beforeEach(() => {
        cy.visit('/');
        // Start the game on Recruit difficulty for each test in this suite
        cy.get('#start-easy').click();
        // Wait until the game is actively in a wave
        cy.window().its('gameState.gameState').should('eq', 'IN_WAVE');
    });

    it('should fire 4 interceptors when multishot is at max level', () => {
        // Wait for at least one rocket to spawn to have a target
        cy.window({ timeout: 10000 }).its('gameState.rockets.0').should('exist');

        // Get the initial number of interceptors (should be 0)
        cy.window()
            .its('gameState.interceptors.length')
            .then((initialInterceptorCount) => {
                // Use a .then() block to ensure gameState is available
                cy.window().then((win) => {
                    const gameWin = win as unknown as CustomWindow;

                    // Manually set the multishot level to max for this test
                    gameWin.gameState.multishotLevel = 3;

                    // Get the first available rocket to target
                    const targetRocket = gameWin.gameState.rockets[0];
                    expect(targetRocket, 'Ensure target rocket exists').to.exist;

                    // --- FIX: Simulate a user targeting the rocket ---
                    // 1. Trigger a mousemove event over the rocket to allow the game to target it
                    cy.get('#gameCanvas').trigger('mousemove', { clientX: targetRocket.x, clientY: targetRocket.y });

                    // 2. Wait for the game to process the mouse move and update the targetedRocket state
                    cy.window().its('gameState.targetedRocket').should('not.be.null');

                    // 3. Now, click anywhere on the canvas to fire the interceptors at the locked target
                    cy.get('#gameCanvas').click();

                    // 4. Assert that 4 new interceptors have been created
                    cy.window()
                        .its('gameState.interceptors.length')
                        .should('eq', initialInterceptorCount + 4);

                    // 5. Optional but good: Assert that all new interceptors are targeting the same rocket
                    cy.window().then((finalWin) => {
                        const finalGameWin = finalWin as unknown as CustomWindow;
                        finalGameWin.gameState.interceptors.forEach((interceptor: any) => {
                            expect(interceptor.target.id).to.equal(targetRocket.id);
                        });
                    });
                });
            });
    });
});
