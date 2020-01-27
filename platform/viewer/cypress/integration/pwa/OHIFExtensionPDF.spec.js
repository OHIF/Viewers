describe('OHIF PDF Extension', () => {
  before(() => {
    cy.openStudy('Dummy');
    cy.expectMinimumThumbnails(6);
  });

  it('checks if series thumbnails are being displayed', () => {
    cy.get('[data-cy="thumbnail-list"]')
      .contains('DOC')
      .its('length')
      .should('to.be.at.least', 1);
  });

  it('drags and drop a PDF thumbnail into viewport', () => {
    cy.get('[data-cy="thumbnail-list"]')
      .contains('DOC')
      .drag('.viewport-drop-target');

    cy.get('.DicomPDFViewport')
      .its('length')
      .should('be.eq', 1);

    // This won't work unless we switch to an extension that renders using `canvas`
    // Currently, we rely on the browser's built-in implementation
    cy.screenshot('PDF Extension - Should load PDF file');
  });
});
