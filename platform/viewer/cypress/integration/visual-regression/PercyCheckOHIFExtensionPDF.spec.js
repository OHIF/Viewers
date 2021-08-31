/*
Temporarily disabling as we transition to containerized PACS for E2E tests

describe('Visual Regression - OHIF PDF Extension', () => {
  before(() => {
    cy.checkStudyRouteInViewer(
      '1.2.826.0.13854362241694438965858641723883466450351448'
    );
    cy.expectMinimumThumbnails(5);
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
*/
