describe('OHIF MPR', () => {
  beforeEach(() => {
    cy.checkStudyRouteInViewer('1.3.6.1.4.1.25403.345050719074.3824.20170125113417.1');
    cy.expectMinimumThumbnails(3);
    cy.initCornerstoneToolsAliases();
    cy.initCommonElementsAliases();
  });

  it('should not go MPR for non reconstructible displaySets', () => {
    cy.get('[data-cy="MPR"]').should('have.class', 'ohif-disabled');
  });

  it('should go MPR for reconstructible displaySets and come back', () => {
    cy.wait(250);
    cy.get(':nth-child(3) > [data-cy="study-browser-thumbnail"]').dblclick();
    cy.wait(250);

    cy.get('[data-cy="MPR"]').click();

    cy.get('.cornerstone-canvas').should('have.length', 3);

    cy.get('[data-cy="MPR"]').click();

    cy.get('.cornerstone-canvas').should('have.length', 1);
  });

  it('should render correctly the MPR', () => {
    cy.wait(250);

    cy.get(':nth-child(3) > [data-cy="study-browser-thumbnail"]').dblclick();
    cy.wait(250);
    cy.get('[data-cy="MPR"]').click();

    cy.get('.cornerstone-canvas').should('have.length', 3);

    // check cornerstone to see if each has images
    // we can later do visual testing to match the images with a baseline
    cy.window()
      .its('cornerstone')
      .then(cornerstone => {
        const viewports = cornerstone.getRenderingEngines()[0].getViewports();

        // The stack viewport still exists after the changes to viewportId and inde
        const imageData1 = viewports[0].getImageData();
        const imageData2 = viewports[1].getImageData();
        const imageData3 = viewports[2].getImageData();

        // for some reason map doesn't work here
        cy.wrap(imageData1).should('not.be', undefined);
        cy.wrap(imageData2).should('not.be', undefined);
        cy.wrap(imageData3).should('not.be', undefined);

        cy.wrap(imageData1.dimensions).should('deep.equal', imageData2.dimensions);

        cy.wrap(imageData1.origin).should('deep.equal', imageData2.origin);
      });

    cy.get('[data-cy="MPR"]').click();

    cy.get('.cornerstone-canvas').should('have.length', 1);
  });

  it('should correctly render Crosshairs for MPR', () => {
    cy.get(':nth-child(3) > [data-cy="study-browser-thumbnail"]').dblclick();
    cy.get('[data-cy="MPR"]').click();
    cy.get('[data-cy="Crosshairs"]').click();

    cy.wait(250);

    // check cornerstone to see if each has crosshairs
    // we can later do visual testing to match the images with a baseline
    cy.window()
      .its('cornerstoneTools')
      .then(cornerstoneTools => {
        const state = cornerstoneTools.annotation.state.getAnnotationManager();

        const fORMap = state.annotations;
        const fOR = Object.keys(fORMap)[0];
        const fORAnnotation = fORMap[fOR];

        // it should have crosshairs as the only key (references lines make this 2)
        expect(Object.keys(fORAnnotation)).to.have.length(2);

        const crosshairs = fORAnnotation.Crosshairs;

        // it should have three
        expect(crosshairs).to.have.length(3);

        expect(crosshairs[0].data.handles.toolCenter).to.deep.equal(
          crosshairs[1].data.handles.toolCenter
        );
      });
  });

  it('should activate window level when the active Crosshairs tool for MPR is clicked', () => {
    cy.get(':nth-child(3) > [data-cy="study-browser-thumbnail"]').dblclick();
    cy.get('[data-cy="MPR"]').click();
    cy.get('[data-cy="Crosshairs"]').click();

    // Click the crosshairs button to deactivate it.
    cy.get('[data-cy="Crosshairs"]').click();
  });
});
