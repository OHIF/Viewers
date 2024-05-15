import '@percy/cypress';

describe('OHIF Percy PDF Display', () => {
  beforeEach(() => {
    cy.openStudyInViewer('1.2.826.0.13854362241694438965858641723883466450351448');
    cy.wait(5000);
    cy.expectMinimumThumbnails(1);
  });

  it('should display PDFs correctly', () => {
    cy.percyCanvasSnapshot('PDF');
  });
});
