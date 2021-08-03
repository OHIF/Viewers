/*
Temporarily disabling as we transition to containerized PACS for E2E tests

describe('Visual Regression - OHIF VTK Extension', () => {
  before(() => {
    cy.checkStudyRouteInViewer(
      '1.3.6.1.4.1.25403.345050719074.3824.20170125113417.1'
    );
    cy.expectMinimumThumbnails(7);

    //Waiting for the desired thumbnail content to be displayed
    cy.get('[data-cy="thumbnail-list"]').should($list => {
      expect($list).to.contain('Chest 1x10 Soft');
    });

    // Drag and drop thumbnail into viewport
    cy.get('[data-cy="thumbnail-list"]')
      .contains('Chest 1x10 Soft')
      .drag('.viewport-drop-target');

    //Select 2D MPR button
    cy.get('[data-cy="2d mpr"]').click();

    //Wait waitVTKLoading Images
    cy.waitVTKLoading();
  });

  beforeEach(() => {
    cy.initVTKToolsAliases();
    cy.wait(1000); //Wait toolbar to finish loading
  });

  afterEach(() => {
    cy.wait(5000); //wait screen loads back after screenshot

    //Select Exit 2D MPR button
    cy.get('[data-cy="exit 2d mpr"]').should($btn => {
      expect($btn).to.be.visible;
      $btn.click();
    });
    //Select 2D MPR button
    cy.get('[data-cy="2d mpr"]').click();
  });

  it('checks if VTK buttons are displayed on the toolbar', () => {
    // Visual comparison
    cy.percyCanvasSnapshot(
      'VTK initial state - Should display toolbar and 3 viewports'
    );
  });

  it('checks Crosshairs tool', () => {
    cy.get('@crosshairsBtn').click();

    // Click and Move the mouse inside the viewport
    cy.get('[data-cy="viewport-container-0"]')
      .trigger('mousedown', 'center', { which: 1 })
      .trigger('mousemove', 'top', { which: 1 })
      .trigger('mouseup');

    // Visual comparison
    cy.percyCanvasSnapshot(
      "VTK Crosshairs tool - Should display crosshairs' green lines"
    );
  });

  it('checks WWWC tool', () => {
    cy.get('@wwwcBtn').click();

    // Click and Move the mouse inside the viewport
    cy.get('[data-cy="viewport-container-0"]')
      .trigger('mousedown', 'center', { which: 1 })
      .trigger('mousemove', 'top', { which: 1 })
      .trigger('mousedown', 'center', { which: 1 })
      .trigger('mousemove', 'top', { which: 1 })
      .trigger('mouseup', { which: 1 });

    // Visual comparison
    cy.percyCanvasSnapshot('VTK WWWC tool - Canvas should be bright');
  });

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
    cy.percyCanvasSnapshot('VTK Rotate tool - Should rotate image');
  });
});
*/
