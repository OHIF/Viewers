describe('OHIF Segmentations', () => {
  before(() => {
    cy.checkStudyRouteInViewer(
      '1.3.6.1.4.1.14519.5.2.1.2744.7002.373729467545468642229382466905'
    );
    cy.expectMinimumThumbnails(3);
  });

  beforeEach(() => {
    cy.get(':nth-child(2) > .roundedButton')
      .as('segmentBtn')
      .should('be.visible');
    cy.wait(2000);
  });

  it('checks Segmentations panel', () => {
    // Open Segmentations Panel
    cy.get('@segmentBtn').click();
    cy.get('[data-cy="segmentation-panel"]').should('be.visible');
    // Check Segmentations header
    cy.get('.tableListHeaderTitle').should('have.text', 'Segments');
    cy.get('.numberOfItems').should('have.text', '11');
    // Click on Segmentations Settings icon
    cy.get('.cog-icon')
      .as('segmentationSettings')
      .click();
    cy.get('.dcmseg-segmentation-settings').should('be.visible');
    // Click on Back button
    cy.get('.return-button').click();
    // Should be back to Segmentations panel
    cy.get('[data-cy="segmentation-panel"]').should('be.visible');
  });
});
