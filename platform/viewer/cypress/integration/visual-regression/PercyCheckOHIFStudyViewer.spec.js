describe('Visual Regression - OHIF Study Viewer Page', function() {
  before(function() {
    cy.openStudy('MISTER^MR');
    cy.waitDicomImage();
    cy.expectMinimumThumbnails(6);
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
    cy.get('@aboutOverlay').should('not.be.enabled');
  });
});
