describe('OHIF HTML Extension', () => {
  before(() => {
    cy.openStudy('Dummy');
    cy.expectMinimumThumbnails(5);
  });

  it('checks if series thumbnails are being displayed', () => {
    cy.get('[data-cy="thumbnail-list"]', { timeout: 10000 })
      .contains('SR', { timeout: 10000 })
      .its('length')
      .should('to.be.at.least', 1);
  });

  it('drags and drop a SR thumbnail into viewport', () => {
    cy.get('[data-cy="thumbnail-list"]', { timeout: 10000 })
      .contains('SR', { timeout: 10000 })
      .first()
      .drag('.viewport-drop-target');

    cy.get(':nth-child(2) > h1').should(
      'contain.text',
      'Imaging Measurement Report',
      { timeout: 10000 }
    );
  });
});
