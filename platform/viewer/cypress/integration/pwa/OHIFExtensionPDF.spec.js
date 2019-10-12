describe('OHIF PDF Extension', () => {
  before(() => {
    cy.openStudy('Dummy');
    cy.waitDicomImage();
    cy.waitSeriesMetadata(1);
  });

  it('checks if series thumbnails are being displayed', () => {
    cy.get('[data-cy="thumbnail-list"]')
      .its('length')
      .should('be.gt', 1);
  });

  it('drags and drop a PDF thumbnail into viewport', () => {
    cy.get('[data-cy="thumbnail-list"]:nth-child(2)') //element to be dragged
      .drag('.viewport-drop-target'); //dropzone element

    cy.get('.DicomPDFViewport')
      .its('length')
      .should('be.eq', 1);
  });
});
