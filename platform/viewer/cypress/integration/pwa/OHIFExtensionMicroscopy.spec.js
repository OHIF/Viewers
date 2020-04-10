describe('OHIF Microscopy Extension', () => {
  before(() => {
    cy.openStudyInViewer(
      '1.2.392.200140.2.1.1.1.2.799008771.2448.1519719572.518'
    );
    cy.expectMinimumThumbnails(6);
    // Wait for all thumbnails to finish loading
    // This will make this test less flaky
    cy.wait(1000);
  });

  it('checks if series thumbnails are being displayed', () => {
    cy.get('[data-cy="thumbnail-list"]')
      .contains('SM')
      .its('length')
      .should('to.be.at.least', 1);
  });

  it('drags and drop a SM thumbnail into viewport', () => {
    cy.get('[data-cy="thumbnail-list"]')
      .contains('SM')
      .drag('.viewport-drop-target');

    cy.get('.DicomMicroscopyViewer')
      .its('length')
      .should('be.eq', 1);
  });
});
