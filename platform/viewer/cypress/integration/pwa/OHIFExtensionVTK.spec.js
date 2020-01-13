describe('OHIF VTK Extension', () => {
  before(() => {
    cy.openStudy('Juno');
    cy.waitDicomImage();
    cy.expectMinimumThumbnails(7);
  });

  beforeEach(() => {
    //TODO: Due to percy snapshot, the images inside the viewports are being resized
    //and once the browser continues the test execution, the images are not centered in the viewport.
    //To fix that, we need to reload the page before each test.
    //https://github.com/OHIF/Viewers/issues/1168
    cy.reload();

    //Waiting for the desired thumbnail content to be displayed
    cy.get('[data-cy="thumbnail-list"]').should($list => {
      expect($list).to.contain('CT WB 5.0  B35f');
    });

    // TODO: We shouldn't have to drag the thumbnail
    // This is a known bug; 2D MPR button does not show until viewport
    // has data from a drag-n-drop
    // Drag and drop third thumbnail into first viewport
    cy.get('[data-cy="thumbnail-list"]')
      .contains('CT WB 5.0  B35f')
      .drag('.viewport-drop-target')

    //Select 2D MPR button
    cy.get('[data-cy="2d mpr"]').click();

    //Wait Reformatting Images
    cy.waitVTKReformatting();

    cy.initVTKToolsAliases();
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

    // Visual comparison
    cy.screenshot('VTK initial state - Should display toolbar and 3 viewports');
  });

  it('checks Crosshairs tool', () => {
    cy.get('@crosshairsBtn').click();

    // Click and Move the mouse inside the viewport
    cy.get('[data-cy="viewport-container-0"]')
      .trigger('mousedown', 'center', { which: 1 })
      .trigger('mousemove', 'top', { which: 1 })
      .trigger('mouseup');

    // Visual comparison
    cy.screenshot(
      "VTK Crosshairs tool - Should display crosshairs' green lines"
    );
  });

  /* TODO: Non-deterministic behavior (const expectedText = 'W: 350 L: -1044';)
  it('checks WWWC tool', () => {
    cy.get('@wwwcBtn').click();

    // Click and Move the mouse inside the viewport
    cy.get('[data-cy="viewport-container-0"]')
      .trigger('mousedown', 'center', { which: 1 })
      .trigger('mousemove', 'top', { which: 1 })
      .trigger('mousedown', 'center', { which: 1 })
      .trigger('mousemove', 'top', { which: 1 })
      .trigger('mouseup', { which: 1 })
      .then(() => {
        const expectedText = 'W: 350 L: 40';
        cy.get('.ViewportOverlay > div.bottom-right.overlay-element').should(
          'contains.text',
          expectedText
        );
      });

    // Visual comparison
    cy.screenshot('VTK WWWC tool - Canvas should be bright');
  }); */

  it('checks Rotate tool', () => {
    cy.get('@rotateBtn').click();

    // Click and Move the mouse inside the viewport
    cy.get('[data-cy="viewport-container-0"]')
      .trigger('mousedown', 'center', { which: 1 })
      .trigger('mousemove', 'top', { which: 1 })
      .trigger('mousedown', 'center', { which: 1 })
      .trigger('mousemove', 'top', { which: 1 })
      .trigger('mouseup', { which: 1 });

    // Visual comparison
    cy.screenshot('VTK Rotate tool - Should rotate image');
  });
});
