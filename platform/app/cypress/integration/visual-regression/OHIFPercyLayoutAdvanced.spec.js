import '@percy/cypress';

describe('OHIF Percy Layout Advanced Presets', () => {
  beforeEach(() => {
    cy.openStudyInViewer('1.3.6.1.4.1.25403.345050719074.3824.20170125113417.1');
    cy.wait(5000);
    cy.expectMinimumThumbnails(3);
  });

  it('should display each layout preset correctly', () => {
    cy.get('[data-cy="study-browser-thumbnail"]').eq(2).dblclick();
    cy.selectLayoutPreset('MPR', true);
    cy.percyCanvasSnapshot('MPR Preset');
    cy.selectLayoutPreset('3D four up');
    cy.percyCanvasSnapshot('3D four up Preset');
    cy.selectLayoutPreset('3D main');
    cy.percyCanvasSnapshot('3D main Preset');
    cy.selectLayoutPreset('Axial Primary');
    cy.percyCanvasSnapshot('Axial Primary Preset');
    cy.selectLayoutPreset('3D only');
    cy.percyCanvasSnapshot('3D only Preset');
    cy.selectLayoutPreset('3D primary');
    cy.percyCanvasSnapshot('3D primary Preset');
  });
});
