/*
Temporarily disabling as we transition to containerized PACS for E2E tests

describe('Visual Regression - OHIF Microscopy Extension', () => {
  before(() => {
    cy.openStudyModality('SM');
    cy.expectMinimumThumbnails(6);
  });

  it('drags and drop a SM thumbnail into viewport', () => {
    cy.get('[data-cy="thumbnail-list"]')
      .contains('SM')
      .drag('.viewport-drop-target');

    cy.get('.DicomMicroscopyViewer')
      .its('length')
      .should('be.eq', 1);

    cy.wait(3000); //Waiting for image to render before taking the snapshot
    // Visual comparison
    cy.percyCanvasSnapshot(
      'Microscopy Extension - Should display loaded canvas'
    );
  });
});
*/
