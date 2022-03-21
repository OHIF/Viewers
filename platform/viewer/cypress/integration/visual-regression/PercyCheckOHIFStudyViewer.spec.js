describe('Visual Regression - OHIF Study Viewer Page', function() {
  before(() => {
    cy.checkStudyRouteInViewer(
      '1.2.840.113619.2.5.1762583153.215519.978957063.78'
    );
    cy.expectMinimumThumbnails(3);
  });

  beforeEach(function() {
    cy.initCommonElementsAliases();
    cy.resetViewport();
  });

  it('checks if series thumbnails are being displayed', function() {
    cy.percyCanvasSnapshot('Series Thumbnails - Should Display Thumbnails');
  });

  it('opens About modal and verify the displayed information', function() {
    cy.get('[data-cy="options-menu"]')
      .first()
      .click();
    cy.get('[data-cy="dd-item-menu"]')
      .first()
      .click();
    cy.get('[data-cy="about-modal"]')
      .as('aboutOverlay')
      .should('be.visible');

    // Visual comparison
    cy.percyCanvasSnapshot('About modal - Should display modal');

    //close modal
    cy.get('[data-cy="close-button"]').click();
    cy.get('@aboutOverlay').should('not.exist');
  });
});
