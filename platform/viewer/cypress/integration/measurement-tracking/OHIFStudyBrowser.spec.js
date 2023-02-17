describe('OHIF Study Viewer Page', function() {
  beforeEach(function() {
    cy.checkStudyRouteInViewer(
      '1.2.840.113619.2.5.1762583153.215519.978957063.78'
    );

    cy.expectMinimumThumbnails(3);
    cy.initCommonElementsAliases();
    cy.initCornerstoneToolsAliases();
    cy.resetViewport().wait(50);
  });

  it('checks if series thumbnails are being displayed', function() {
    cy.get('[data-cy="study-browser-thumbnail"]')
      .its('length')
      .should('be.gt', 1);
  });

  it('drags and drop a series thumbnail into viewport', function() {
    cy.get('[data-cy="study-browser-thumbnail"]:nth-child(2)') //element to be dragged
      .drag('.cornerstone-canvas'); //dropzone element

    //const expectedText =
    //  'Ser: 2Img: 1 1/13512 x 512Loc: -17.60 mm Thick: 3.00 mm';
    //cy.get('@viewportInfoBottomLeft').should('contain.text', expectedText);
  });

  it('checks if Series left panel can be hidden/displayed', function() {
    cy.get('@seriesPanel').should('exist');
    cy.get('@seriesPanel').should('be.visible');

    cy.get('@seriesBtn').click();
    cy.get('@seriesPanel').should('not.exist');

    cy.get('@seriesBtn').click();
    cy.get('@seriesPanel').should('exist');
    cy.get('@seriesPanel').should('be.visible');
  });

  it('performs double-click to load thumbnail in active viewport', () => {
    cy.get('[data-cy="study-browser-thumbnail"]:nth-child(2)').dblclick();

    //cy.get('@viewportInfoBottomLeft').should('contains.text', expectedText);
  });
});
