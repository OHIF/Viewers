describe('Visual Regression - OHIF Download Snapshot File', () => {
  before(() => {
    cy.checkStudyRouteInViewer(
      '1.2.840.113619.2.5.1762583153.215519.978957063.78'
    );
    cy.expectMinimumThumbnails(3);
  });

  beforeEach(() => {
    cy.openDownloadImageModal();
  });

  afterEach(() => {
    // Close modal
    cy.get('[data-cy="close-button"]')
      .scrollIntoView()
      .click();
  });

  it('checks displayed information for Tablet experience', function() {
    // Set Tablet resolution
    cy.viewport(1000, 660);
    // Visual comparison
    cy.percyCanvasSnapshot('Download Image Modal - Tablet experience');
  });

  it('checks displayed information for Desktop experience', function() {
    // Set Desktop resolution
    cy.viewport(1750, 720);
    // Visual comparison
    cy.percyCanvasSnapshot('Download Image Modal - Desktop experience');
  });

  it('checks if "Show Annotations" checkbox will display annotations', function() {
    // Close modal that is initially opened
    cy.get('[data-cy="close-button"]').click();

    // Add measurements in the viewport
    cy.addLengthMeasurement();
    cy.addAngleMeasurement();

    // Open Modal
    cy.openDownloadImageModal();
    // Select "Show Annotations" option
    cy.get('[data-cy="show-annotations"]').check();
    // Check image preview
    cy.get('[data-cy="image-preview"]').scrollIntoView();
    // Visual comparison
    cy.percyCanvasSnapshot('Download Image Modal - Show Annotations checked');
  });
});
