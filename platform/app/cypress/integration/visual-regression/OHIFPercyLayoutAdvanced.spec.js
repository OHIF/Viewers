import '@percy/cypress';

describe('OHIF Percy Layout Advanced Presets', () => {
  beforeEach(() => {
    cy.openStudyInViewer('1.3.6.1.4.1.25403.345050719074.3824.20170125113417.1');
    cy.wait(5000);
    cy.expectMinimumThumbnails(3);
  });

  it('should display each layout preset correctly', () => {
    cy.get('[data-cy="study-browser-thumbnail"]').eq(2).dblclick();
    cy.wait(200);
    cy.get('[data-cy="Layout"]').click();
    cy.wait(200);
    cy.percySnapshot('Layout tool opened');
    cy.get('div').contains('MPR').click();
    cy.wait(2000);
    cy.percySnapshot('MPR Preset');
    cy.get('[data-cy="Layout"]').click();
    cy.wait(200);
    cy.get('div').contains('3D four up').click();
    cy.wait(2000);
    cy.percySnapshot('3D four up Preset');
    cy.get('[data-cy="Layout"]').click();
    cy.wait(200);
    cy.get('div').contains('3D main').click();
    cy.wait(2000);
    cy.percySnapshot('3D main Preset');
    cy.get('[data-cy="Layout"]').click();
    cy.wait(200);
    cy.get('div').contains('Axial Primary').click();
    cy.wait(2000);
    cy.percySnapshot('Axial Primary Preset');
    cy.get('[data-cy="Layout"]').click();
    cy.wait(200);
    cy.get('div').contains('3D only').click();
    cy.wait(2000);
    cy.percySnapshot('3D only Preset');
    cy.get('[data-cy="Layout"]').click();
    cy.wait(200);
    cy.get('div').contains('3D primary').click();
    cy.wait(2000);
    cy.percySnapshot('3D primary Preset');
  });
});
