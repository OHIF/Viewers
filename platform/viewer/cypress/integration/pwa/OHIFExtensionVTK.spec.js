describe('OHIF VTK Extension', () => {
  before(() => {
    cy.openStudy('Juno');
    cy.waitDicomImage();
    cy.expectMinimumThumbnails(3);
  });

  beforeEach(() => {
    // TODO: We shouldn't have to drag the thumbnail
    // This is a known bug; 2D MPR button does not show until viewport
    // has data from a drag-n-drop
    // Drag and drop first thumbnail into first viewport
    cy.get('[data-cy="thumbnail-list"]:nth-child(3)').drag(
      '.viewport-drop-target'
    );

    cy.get('.PluginSwitch > .toolbar-button', { timeout: 10000 })
      .as('twodmprBtn')
      .should('be.visible')
      .then(btn => {
        if (!btn.text().includes('Exit')) {
          btn.click();
        }
      });

    cy.initVTKToolsAliases();
    cy.wait(1000);
  });

  it('checks if VTK buttons are displayed on the toolbar', () => {
    cy.screenshot();
    cy.percySnapshot();

    cy.get('@crosshairsBtn')
      .should('be.visible')
      .contains('Crosshairs', { timeout: 5000 });
    cy.get('@wwwcBtn')
      .should('be.visible')
      .contains('WWWC', { timeout: 5000 });
    cy.get('@rotateBtn')
      .should('be.visible')
      .contains('Rotate', { timeout: 5000 });
    cy.get('@slabSlider')
      .should('be.visible')
      .contains('Slab Thickness', { timeout: 5000 });
    cy.get('@modeDropdown')
      .should('be.visible', { timeout: 5000 })
      .contains('MIP', { timeout: 5000 });
    cy.get('@modeCheckbox').should('be.visible');
    cy.get('@layoutBtn')
      .should('be.visible')
      .contains('Layout', { timeout: 5000 });
  });
});
