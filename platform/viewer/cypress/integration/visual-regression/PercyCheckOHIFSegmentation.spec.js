describe('isual Regression - OHIF Segmentations', () => {
  before(() => {
    cy.openStudyInViewer(
      '1.3.6.1.4.1.14519.5.2.1.2744.7002.373729467545468642229382466905'
    );
    cy.expectMinimumThumbnails(3);
    //Wait thumbnails to finish loading
    cy.wait(1000);
    // Select thumbnail
    cy.get('[data-cy="thumbnail-list"]')
      .contains('PET HeadNeck_0')
      .click();
  });

  beforeEach(() => {
    cy.get(':nth-child(2) > .roundedButton')
      .as('segmentBtn')
      .should('be.visible');
    cy.initCommonElementsAliases();
    cy.wait(2000);
  });

  it('checks Segmentations panel', () => {
    cy.get('@segmentBtn').click();

    //Select Stack scroll button
    cy.get('@stackScrollBtn').click();

    //Scroll stack twice to see one segmentation in the viewport
    cy.get('@viewport')
      .trigger('mousedown', 'top', {
        which: 1,
      })
      .trigger('mousemove', 'bottom', {
        which: 1,
      })
      .trigger('mouseup')
      .trigger('mousedown', 'top', {
        which: 1,
      })
      .trigger('mousemove', 'center', {
        which: 1,
      })
      .trigger('mouseup');

    //Visual comparison
    cy.percyCanvasSnapshot(
      'Segmentations - Should display at least one segmentation inside the viewport'
    );
  });
});
