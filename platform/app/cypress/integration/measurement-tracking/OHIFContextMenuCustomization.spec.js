describe('OHIF Context Menu', function () {
  beforeEach(function () {
    cy.checkStudyRouteInViewer('1.2.840.113619.2.5.1762583153.215519.978957063.78');

    cy.expectMinimumThumbnails(3);
    cy.initCommonElementsAliases();
    cy.initCornerstoneToolsAliases();
    cy.waitDicomImage();
  });

  it('checks context menu customization', function () {
    // Add length measurement
    cy.addLengthMeasurement();
    cy.get('[data-cy="prompt-begin-tracking-yes-btn"]').as('yesBtn').click();
    cy.get('[data-cy="measurement-item"]').as('measurementItem').click();

    const [x1, y1] = [150, 100];
    cy.get('@viewport')
      .trigger('mousedown', x1, y1, {
        which: 3,
      })
      .trigger('mouseup', x1, y1, {
        which: 3,
      });

    // Contextmenu is visible
    cy.get('[data-cy="context-menu"]').as('contextMenu').should('be.visible');
    // Click "Finding" subMenu
    cy.get('[data-cy="context-menu-item"]').as('item').contains('Finding').click();

    // Click "Finding" subMenu
    cy.get('[data-cy="context-menu-item"]').as('item').contains('Aortic insufficiency').click();
    cy.get('[data-cy="measurement-item"]').as('measure-item').contains('Aortic insufficiency');
  });
});
