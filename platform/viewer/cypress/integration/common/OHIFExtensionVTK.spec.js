describe('OHIF VTK Extension', () => {
  before(() => {
    cy.openStudy('Dummy');
    cy.waitDicomImage();
  });

  beforeEach(() => {
    cy.get('.PluginSwitch > .toolbar-button')
      .as('twodmprBtn')
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
