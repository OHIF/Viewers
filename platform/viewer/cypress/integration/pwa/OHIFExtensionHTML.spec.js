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

  it('checks if the HTML viewport has been set to active by interaction', () => {
    cy.setLayout('3', '3');

    // check if viewport has been set as active by CLICKING
    cy.get('[data-cy=viewprt-grid] > :nth-child(4)')
      .click()
      .then($viewport => {
        cy.wrap($viewport).should('have.class', 'active');
      });

    // check if viewport has been set as active by SCROLLING
    cy.get('[data-cy=viewprt-grid] > :nth-child(7)').then($viewport => {
      cy.wrap($viewport)
        .find('[data-cy=dicom-html-viewport]')
        .scrollTo('bottom');
      cy.wrap($viewport).should('have.class', 'active');
    });
  });
});
