describe('OHIF PDF Extension', () => {
  before(() => {
    cy.openStudy('Dummy');
    cy.expectMinimumThumbnails(3);
  });

  it('checks if series thumbnails are being displayed', () => {
    cy.get('[data-cy="thumbnail-list"]', { timeout: 15000 })
      .contains('DOC')
      .its('length')
      .should('to.be.at.least', 1);
  });

  it('drags and drop a PDF thumbnail into viewport', () => {
    cy.get('[data-cy="thumbnail-list"]', { timeout: 15000 })
      .contains('DOC')
      .drag('.viewport-drop-target');

    cy.get('.DicomPDFViewport', { timeout: 15000 })
      .its('length')
      .should('be.eq', 1);

    cy.screenshot();
    cy.percySnapshot();
  });
});
