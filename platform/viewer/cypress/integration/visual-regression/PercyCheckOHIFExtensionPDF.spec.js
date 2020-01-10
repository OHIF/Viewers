describe('Visual Regression - OHIF PDF Extension', () => {
  before(() => {
    cy.openStudy('Dummy');
    cy.expectMinimumThumbnails(6);
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
    cy.percyCanvasSnapshot('PDF Extension - Should load PDF file');
  });
});
