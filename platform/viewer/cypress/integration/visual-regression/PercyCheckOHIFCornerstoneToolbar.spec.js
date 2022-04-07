describe('Visual Regression - OHIF Cornerstone Toolbar', () => {
  before(() => {
    cy.checkStudyRouteInViewer(
      '1.2.840.113619.2.5.1762583153.215519.978957063.78'
    );
    cy.expectMinimumThumbnails(3);
  });

  beforeEach(() => {
    cy.initCornerstoneToolsAliases();
    cy.initCommonElementsAliases();
    cy.resetViewport();
  });

  it('checks if Pan tool will move the image inside the viewport', () => {
    //Click on button and verify if icon is active on toolbar
    cy.get('@panBtn')
      .click()
      .then($panBtn => {
        cy.wrap($panBtn).should('have.class', 'active');
      });

    cy.get('@viewport')
      .trigger('mousedown', 'center', { which: 1 })
      .trigger('mousemove', 'bottom', { which: 1 })
      .trigger('mouseup', 'bottom');

    // Visual comparison
    cy.percyCanvasSnapshot('Pan tool moved the image inside the viewport');
  });

  it('check if Invert tool will change the colors of the image in the viewport', () => {
    // Click on More button
    cy.get('@moreBtn').click();
    // Verify if overlay is displayed
    cy.get('.tooltip-toolbar-overlay').should('be.visible');

    // Click on Invert button
    cy.get('[data-cy="invert"]').click();

    // Visual comparison
    cy.percyCanvasSnapshot('Invert tool - Should Invert Canvas');
  });

  it('check if Rotate tool will change the image orientation in the viewport', () => {
    //Click on More button
    cy.get('@moreBtn').click();
    //Verify if overlay is displayed
    cy.get('.tooltip-toolbar-overlay')
      .should('be.visible')
      .then(() => {
        //Click on Rotate button
        cy.get('[data-cy="rotate right"]').click({ force: true });
      });

    // Visual comparison
    cy.percyCanvasSnapshot('Rotate tool - Should Rotate Image to Right');
  });

  it('check if Flip H tool will flip the image horizontally in the viewport', () => {
    //Click on More button
    cy.get('@moreBtn').click();
    //Verify if overlay is displayed
    cy.get('.tooltip-toolbar-overlay').should('be.visible');

    //Click on Flip H button
    cy.get('[data-cy="flip h"]').click();

    // Visual comparison
    cy.percyCanvasSnapshot('Flip H tool - Should Flip Image on Y axis');
  });

  it('check if Flip V tool will flip the image vertically in the viewport', () => {
    //Click on More button
    cy.get('@moreBtn').click();
    //Verify if overlay is displayed
    cy.get('.tooltip-toolbar-overlay').should('be.visible');

    //Click on Flip V button
    cy.get('[data-cy="flip v"]').click();

    // Visual comparison
    cy.percyCanvasSnapshot('Flip V tool - Should Flip Image on X axis');
  });
});
