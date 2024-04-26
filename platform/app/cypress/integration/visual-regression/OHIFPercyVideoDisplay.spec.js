import '@percy/cypress';

describe('OHIF Percy Video Display', () => {
  beforeEach(() => {
    cy.openStudyInViewer('2.25.96975534054447904995905761963464388233');
    cy.wait(5000);
    cy.expectMinimumThumbnails(0);
  });

  it('should display Videos correctly', () => {
    cy.percyCanvasSnapshot('Video');
  });
});
