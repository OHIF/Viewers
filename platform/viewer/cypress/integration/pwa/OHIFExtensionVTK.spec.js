describe('OHIF VTK Extension', () => {
  before(() => {
    cy.openStudy('Juno');
    cy.waitDicomImage();
    cy.expectMinimumThumbnails(7);
  });

  beforeEach(() => {
    // TODO: We shouldn't have to drag the thumbnail
    // This is a known bug; 2D MPR button does not show until viewport
    // has data from a drag-n-drop
    // Drag and drop first thumbnail into first viewport
    cy.get('[data-cy="thumbnail-list"]:nth-child(3)').drag(
      '.viewport-drop-target'
    );

    cy.get('.PluginSwitch > .toolbar-button')
      .as('twodmprBtn')
      .should('be.visible')
      .then(btn => {
        if (!btn.text().includes('Exit')) {
          btn.click();
        }
      });

    cy.initVTKToolsAliases();
  });

  it('checks if VTK buttons are displayed on the toolbar', () => {
    // Wait for start reformatting
    cy.get('[data-cy="viewprt-grid"]', { timeout: 10000 }).should($grid => {
      expect($grid).to.contain.text('Reform');
    });

    // Wait for finish reformatting
    cy.get('[data-cy="viewprt-grid"]', { timeout: 30000 }).should($grid => {
      expect($grid).not.to.contain.text('Reform');
    });

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

    cy.wait(3000);
    cy.percyCanvasSnapshot('VTK Extension');
  });
});
