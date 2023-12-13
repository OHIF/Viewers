describe('OHIF MPR', () => {
  beforeEach(() => {
    cy.checkStudyRouteInViewer('1.3.6.1.4.1.25403.345050719074.3824.20170125113417.1');
    cy.expectMinimumThumbnails(3);
    cy.initCornerstoneToolsAliases();
    cy.initCommonElementsAliases();
  });

  it('should not go MPR for non reconstructible displaySets', () => {
    cy.get('[data-cy="MPR"]').click();
    cy.get('.cornerstone-canvas').should('have.length', 1);
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

    cy.get('[data-cy="thumbnail-viewport-labels"]').should('have.length', 3);

    cy.get('.cornerstone-canvas').should('have.length', 3);

    cy.get('[data-cy="thumbnail-viewport-labels"]')
      .eq(2)
      .find('div')
      .should('have.length', 3)
      .each(($div, index) => {
        const text = $div.text();
        switch (index) {
          case 0:
            expect(text).to.equal('A');
            break;
          case 1:
            expect(text).to.equal('B');
            break;
          case 2:
            expect(text).to.equal('C');
            break;
          default:
            throw new Error(`Unexpected div found with text: ${text}`);
        }
      });

    // check cornerstone to see if each has images
    // we can later do visual testing to match the images with a baseline
    cy.window()
      .its('cornerstone')
      .then(cornerstone => {
        const viewports = cornerstone.getRenderingEngines()[0].getViewports();

        // The stack viewport still exists after the changes to viewportId and inde
        const imageData1 = viewports[1].getImageData();
        const imageData2 = viewports[2].getImageData();
        const imageData3 = viewports[3].getImageData();

        // for some reason map doesn't work here
        cy.wrap(imageData1).should('not.be', undefined);
        cy.wrap(imageData2).should('not.be', undefined);
        cy.wrap(imageData3).should('not.be', undefined);

        cy.wrap(imageData1.dimensions).should('deep.equal', imageData2.dimensions);

        cy.wrap(imageData1.origin).should('deep.equal', imageData2.origin);
      });

    cy.get('[data-cy="MPR"]').click();

    cy.get('.cornerstone-canvas').should('have.length', 1);

    // should not have any div under it
    cy.get('[data-cy="thumbnail-viewport-labels"]').eq(2).find('div').should('have.length', 0);
  });

  it('should correctly render Crosshairs for MPR', () => {
    cy.get('[data-cy="Crosshairs"]').should('not.exist');
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

        // it should have crosshairs as the only key
        expect(Object.keys(fORAnnotation)).to.have.length(1);

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

    // wait for the crosshairs tool to be active
    cy.get('[data-cy="Crosshairs"].active');

    // Click the crosshairs button to deactivate it.
    cy.get('[data-cy="Crosshairs"]').click();

    // wait for the window level button to be active
    cy.get('[data-cy="WindowLevel-split-button-primary"].active');
  });
});
