describe('OHIF HTML Extension', () => {
  before(() => {
    cy.openStudy('Dummy');
    cy.expectMinimumThumbnails(5);
  });

  it('checks if series thumbnails are being displayed', () => {
    cy.get('[data-cy="thumbnail-list"]')
      .contains('SR')
      .its('length')
      .should('to.be.at.least', 1);
  });

  it('drags and drop a SR thumbnail into viewport', () => {
    cy.get('[data-cy="thumbnail-list"]')
      .contains('SR')
      .first()
      .drag('.viewport-drop-target');

    cy.get(':nth-child(2) > h1').should(
      'contain.text',
      'Imaging Measurement Report'
    );
  });
});
