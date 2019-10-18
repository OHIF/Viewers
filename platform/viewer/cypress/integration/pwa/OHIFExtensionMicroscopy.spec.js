describe('OHIF Microscopy Extension', () => {
  before(() => {
    cy.openStudyModality('SM');
    cy.expectMinimumThumbnails(2);
  });

  it('checks if series thumbnails are being displayed', () => {
    cy.get('[data-cy="thumbnail-list"]', { timeout: 15000 })
      .contains('SM', { timeout: 15000 })
      .its('length')
      .should('to.be.at.least', 1);
  });

  it('drags and drop a SM thumbnail into viewport', () => {
    cy.get('[data-cy="thumbnail-list"]', { timeout: 15000 })
      .contains('SM', { timeout: 15000 })
      .drag('.viewport-drop-target');

    cy.get('.DicomMicroscopyViewer', { timeout: 15000 })
      .its('length')
      .should('be.eq', 1);

    cy.wait(3000);
    cy.screenshot();
    cy.percySnapshot();
  });
});
