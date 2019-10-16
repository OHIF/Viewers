describe('OHIF VTK Extension', () => {
  before(() => {
    cy.openStudy('Dummy');
    cy.waitDicomImage();
    cy.expectMinimumThumbnails(1);
  });

  beforeEach(() => {
    // TODO: We shouldn't have to drag the thumbnail
    // This is a known bug; 2D MPR button does not show until viewport
    // has data from a drag-n-drop
    // Drag and drop first thumbnail into first viewport
    cy.get('[data-cy="thumbnail-list"]:nth-child(1)').drag(
      '.cornerstone-canvas'
    );

    cy.get('.PluginSwitch > .toolbar-button')
      .as('twodmprBtn')
      .should('be.visible')
      .click();

    cy.initVTKToolsAliases();
    cy.wait(1000);
  });

  it('checks if VTK buttons are displayed on the toolbar', () => {
    cy.get('@crosshairsBtn')
      .should('be.visible')
      .contains('Crosshairs');
    cy.get('@wwwcBtn')
      .should('be.visible')
      .contains('WWWC');
    cy.get('@rotateBtn')
      .should('be.visible')
      .contains('Rotate');
    cy.get('@slabSlider')
      .should('be.visible')
      .contains('Slab Thickness');
    cy.get('@modeDropdown')
      .should('be.visible')
      .contains('MIP');
    cy.get('@modeCheckbox').should('be.visible');
    cy.get('@layoutBtn')
      .should('be.visible')
      .contains('Layout');
  });
});
