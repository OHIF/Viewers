/*
Temporarily disabling as we transition to containerized PACS for E2E tests

describe('OHIF Microscopy Extension', () => {
  before(() => {
    cy.openStudyModality('SM');
    cy.expectMinimumThumbnails(2);
  });

  it('checks if series thumbnails are being displayed', () => {
    cy.get('[data-cy="thumbnail-list"]')
      .contains('SM')
      .its('length')
      .should('to.be.at.least', 1);
  });

  it('drags and drop a SM thumbnail into viewport', () => {
    // Waiting for series list to load all displaySets (lots of SRs, before defining which dom element to grab.)
    cy.wait(3000);
    cy.get('[data-cy="thumbnail-list"]')
      .contains('SM')
      .drag('.viewport-drop-target');

    cy.get('.DicomMicroscopyViewer')
      .its('length')
      .should('be.eq', 1);

    cy.wait(3000); //Waiting for image to render before taking the snapshot
    // Visual comparison
    cy.screenshot('Microscopy Extension - Should display loaded canvas');
  });
});
*/
