describe('OHIF Cornerstone Toolbar', () => {
  before(() => {
    cy.openStudy('MISTER^MR');
    cy.waitDicomImage();
    cy.expectMinimumThumbnails(3);
  });

  beforeEach(() => {
    cy.initCornerstoneToolsAliases();
    cy.initCommonElementsAliases();
    cy.resetViewport();
  });

  it('checks if all primary buttons are being displayed', () => {
    cy.get('@stackScrollBtn')
      .should('be.visible')
      .contains('Stack Scroll');
    cy.get('@zoomBtn')
      .should('be.visible')
      .contains('Zoom');
    cy.get('@levelsBtn')
      .should('be.visible')
      .contains('Levels');
    cy.get('@panBtn')
      .should('be.visible')
      .contains('Pan');
    cy.get('@lengthBtn')
      .should('be.visible')
      .contains('Length');
    cy.get('@annotateBtn')
      .should('be.visible')
      .contains('Annotate');
    cy.get('@angleBtn')
      .should('be.visible')
      .contains('Angle');
    cy.get('@resetBtn')
      .should('be.visible')
      .contains('Reset');
    cy.get('@cineBtn')
      .should('be.visible')
      .contains('CINE');
    cy.get('@moreBtn')
      .should('be.visible')
      .contains('More');
    cy.get('@layoutBtn')
      .should('be.visible')
      .contains('Layout');
  });

  it('checks if Stack Scroll tool will navigate across all series in the viewport', () => {
    //Click on button and vefiry if icon is active on toolbar
    cy.get('@stackScrollBtn')
      .click()
      .then($stackScrollBtn => {
        cy.wrap($stackScrollBtn).should('have.class', 'active');
      });

    //drags the mouse inside the viewport to be able to interact with series
    cy.get('@viewport')
      .trigger('mousedown', 'center', { which: 1 })
      .trigger('mousemove', 'top', { which: 1 })
      .trigger('mouseup');
    const expectedText =
      'Ser: 1Img: 1 1/26256 x 256Loc: -30.00 mm Thick: 5.00 mm';
    cy.get('@viewportInfoBottomLeft').should('have.text', expectedText);
  });

  it('checks if Zoom tool will zoom in/out an image in the viewport', () => {
    //Click on button and verify if icon is active on toolbar
    cy.get('@zoomBtn')
      .click()
      .then($zoomBtn => {
        cy.wrap($zoomBtn).should('have.class', 'active');
      });

    //drags the mouse inside the viewport to be able to interact with series
    cy.get('@viewport')
      .trigger('mousedown', 'center', { which: 1 })
      .trigger('mousemove', 'top', { which: 1 })
      .trigger('mouseup');

    const expectedText = 'Zoom: 50%W: 958 L: 479Lossless / Uncompressed';
    cy.get('@viewportInfoBottomRight').should('have.text', expectedText);
  });

  it('checks if Levels tool will change the contrast and brightness of an image in the viewport', () => {
    //Click on button and vefiry if icon is active on toolbar
    cy.get('@levelsBtn')
      .click()
      .then($levelsBtn => {
        cy.wrap($levelsBtn).should('have.class', 'active');
      });

    //drags the mouse inside the viewport to be able to interact with series
    cy.get('@viewport')
      .trigger('mousedown', 'center', { which: 1 })
      .trigger('mousemove', 'top', { which: 1 })
      .trigger('mouseup')
      .trigger('mousedown', 'center', { which: 1 })
      .trigger('mousemove', 'left', { which: 1 })
      .trigger('mouseup');

    const expectedText = 'Zoom: 211%W: 635 L: 226Lossless / Uncompressed';
    cy.get('@viewportInfoBottomRight').should('have.text', expectedText);
  });

  it('checks if Pan tool will move the image inside the viewport', () => {
    //Click on button and vefiry if icon is active on toolbar
    cy.get('@panBtn')
      .click()
      .then($panBtn => {
        cy.wrap($panBtn).should('have.class', 'active');
      });

    //Get image position from cornerstone and check if y axis was modified
    let cornerstone;
    let currentPan;

    cy.window()
      .its('cornerstone')
      .then(c => {
        cornerstone = c;
        currentPan = () =>
          cornerstone.getEnabledElements()[0].viewport.translation;
      });

    cy.get('@viewport')
      .trigger('mousedown', 'center', { which: 1 })
      .trigger('mousemove', 'bottom', { which: 1 })
      .trigger('mouseup', 'bottom')
      .then(() => {
        expect(currentPan().y > 0).to.eq(true);
      });
  });

  it('checks if Length annotation can be added on viewport and on measurements panel', () => {
    //Click on button and vefiry if icon is active on toolbar
    cy.get('@lengthBtn')
      .click()
      .then($lengthbtn => {
        cy.wrap($lengthbtn).should('have.class', 'active');
      });

    //Add annotation on the viewport
    const firstClick = [150, 100];
    const secondClick = [130, 170];
    cy.addLine('@viewport', firstClick, secondClick);

    //Verify if measurement annotation was added into the measurements panel
    cy.get('@measurementsBtn')
      .click()
      .then($measurementsBtn => {
        cy.get('@measurementsPanel').should('be.visible');

        cy.get('.measurementItem')
          .its('length')
          .should('be.eq', 1);

        cy.wrap($measurementsBtn).click();
      });
  });

  it('checks if Angle annotation can be added on viewport and on measurements panel', () => {
    //Click on button and vefiry if icon is active on toolbar
    cy.get('@angleBtn')
      .click()
      .then($angleBtn => {
        cy.wrap($angleBtn).should('have.class', 'active');
      });

    //Add annotation on the viewport
    const initPos = [180, 390];
    const midPos = [300, 410];
    const finalPos = [180, 450];
    cy.addAngle('@viewport', initPos, midPos, finalPos);

    //Verify if measurement annotation was added into the measurements panel
    cy.get('@measurementsBtn')
      .click()
      .then($measurementsBtn => {
        cy.get('@measurementsPanel').should('be.visible');

        cy.get('.measurementItem')
          .its('length')
          .should('be.eq', 1);

        cy.wrap($measurementsBtn).click();
      });
  });

  it('checks if Reset tool will reset all changes made on the image', () => {
    //Make some changes by zooming in and rotating the image
    cy.imageZoomIn();
    cy.imageContrast();

    //Click on reset button
    cy.get('@resetBtn').click();

    const expectedText = 'Zoom: 211%W: 958 L: 479Lossless / Uncompressed';
    cy.get('@viewportInfoBottomRight').should('have.text', expectedText);
  });

  it('checks if CINE tool will prompt a modal with working controls', () => {
    cy.server();
    cy.route('GET', '/**/studies/**/').as('studies');

    //Click on button
    cy.get('@cineBtn').click();
    //Vefiry if cine control overlay is being displayed
    cy.get('.cine-controls')
      .as('cineControls')
      .should('be.visible');

    //Test PLAY button
    cy.get('[title="Play / Stop"]')
      .click()
      .wait(100)
      .click();

    let expectedText = 'Img: 1 1/26';
    cy.get('@viewportInfoBottomLeft', { timeout: 15000 }).should(
      'not.have.text',
      expectedText
    );

    //Test SKIP TO FIRST IMAGE button
    cy.get('[title="Skip to first Image"]')
      .click()
      .wait(1000);
    cy.get('@viewportInfoBottomLeft', { timeout: 15000 }).should(
      'contain.text',
      expectedText
    );

    //Test NEXT IMAGE button
    cy.get('[title="Next Image"]')
      .click()
      .wait(1000);
    expectedText = 'Img: 2 2/26';
    cy.get('@viewportInfoBottomLeft', { timeout: 15000 }).should(
      'contain.text',
      expectedText
    );

    //Test SKIP TO LAST IMAGE button
    cy.get('[title="Skip to last Image"]')
      .click()
      .wait(2000);
    expectedText = 'Img: 27 26/26';
    cy.get('@viewportInfoBottomLeft', { timeout: 15000 }).should(
      'contain.text',
      expectedText
    );

    //Test PREVIOUS IMAGE button
    cy.get('[title="Previous Image"]')
      .click()
      .wait(1000);
    expectedText = 'Img: 26 25/26';
    cy.get('@viewportInfoBottomLeft', { timeout: 15000 }).should(
      'contain.text',
      expectedText
    );

    //Click on Cine button
    cy.get('@cineBtn').click();
    //Vefiry if cine control overlay is hidden
    cy.get('@cineControls').should('not.be.visible');
  });

  it('checks if More button will prompt a modal with secondary tools', () => {
    cy.get('@moreBtn').click();
    //Verify if overlay is displayed
    cy.get('.tooltip-toolbar-overlay')
      .as('toolbarOverlay')
      .should('be.visible');

    let iconName;
    //Click on one of the secondary tools from the overlay
    cy.get('.tooltip-inner > :nth-child(1)')
      .click()
      .then($magnifyBtn => {
        cy.wrap($magnifyBtn)
          .should('have.class', 'active')
          .find('svg')
          .then($icon => {
            iconName = $icon.text();
          });
      });

    //Check if More button is active and if it has same icon as the secondary tool selected
    cy.get('@moreBtn')
      .click()
      .then($moreBtn => {
        cy.wrap($moreBtn)
          .should('have.class', 'active')
          .contains(iconName);
      });

    //Verify if overlay is hidden
    cy.get('@toolbarOverlay').should('not.be.visible');
  });

  it('checks if Layout tool will multiply the number of viewports displayed', () => {
    //Click on Layout button and verify if overlay is displayed
    cy.get('@layoutBtn')
      .click()
      .then(() => {
        cy.get('.layoutChooser')
          .as('layoutChooser')
          .should('be.visible')
          .find('td')
          .its('length')
          .should('be.eq', 9);
      });

    //verify if layout has changed to 2 viewports
    cy.get('tbody > :nth-child(1) > :nth-child(2)').click();
    cy.get('.viewport-container').then($viewport => {
      cy.wrap($viewport)
        .its('length')
        .should('be.eq', 2);
    });

    cy.get('@layoutBtn').click();
    cy.get('tbody > :nth-child(2) > :nth-child(1)').click();
    cy.get('.viewport-container').then($viewport => {
      cy.wrap($viewport)
        .its('length')
        .should('be.eq', 2);
    });

    //verify if layout has changed to 3 viewports
    cy.get('@layoutBtn').click();
    cy.get('tbody > :nth-child(1) > :nth-child(3)').click();
    cy.get('.viewport-container').then($viewport => {
      cy.wait(1000);
      cy.wrap($viewport)
        .its('length')
        .should('be.eq', 3);
    });

    cy.get('@layoutBtn').click();
    cy.get('tbody > :nth-child(3) > :nth-child(1)').click();
    cy.get('.viewport-container').then($viewport => {
      cy.wrap($viewport)
        .its('length')
        .should('be.eq', 3);
    });

    //verify if layout has changed to 4 viewports
    cy.get('@layoutBtn').click();
    cy.get('tbody > :nth-child(2) > :nth-child(2)').click();
    cy.get('.viewport-container').then($viewport => {
      cy.wrap($viewport)
        .its('length')
        .should('be.eq', 4);
    });

    //verify if layout has changed to 6 viewports
    cy.get('@layoutBtn').click();
    cy.get('tbody > :nth-child(2) > :nth-child(3)').click();
    cy.get('.viewport-container').then($viewport => {
      cy.wrap($viewport)
        .its('length')
        .should('be.eq', 6);
    });

    cy.get('@layoutBtn').click();
    cy.get('tbody > :nth-child(3) > :nth-child(2)').click();
    cy.get('.viewport-container').then($viewport => {
      cy.wrap($viewport)
        .its('length')
        .should('be.eq', 6);
    });

    //verify if layout has changed to 9 viewports
    cy.get('@layoutBtn').click();
    cy.get('tbody > :nth-child(3) > :nth-child(3)').click();
    cy.get('.viewport-container').then($viewport => {
      cy.wrap($viewport)
        .its('length')
        .should('be.eq', 9);
    });

    //verify if layout has changed to 1 viewport
    cy.get('@layoutBtn').click();
    cy.get('tbody > :nth-child(1) > :nth-child(1)').click();
    cy.get('.viewport-container').then($viewport => {
      cy.wrap($viewport)
        .its('length')
        .should('be.eq', 1);
    });
  });

  it('checks if the available viewport was set to active when layout is decreased', () => {
    cy.setLayout(3, 3);

    // activate the ninth viewport
    cy.get('[data-cy=viewport-container-8]')
      .click()
      .should('have.class', 'active');

    cy.setLayout(1, 1);

    // first viewport should be active
    cy.get('[data-cy=viewport-container-0]').should('have.class', 'active');
  });

  it('checks if Clear tool will delete all measurements added in the viewport', () => {
    //Add measurements in the viewport
    cy.addLengthMeasurement();
    cy.addAngleMeasurement();

    //Verify if measurement annotation was added into the measurements panel
    cy.get('@measurementsBtn').click();
    cy.get('.measurementItem')
      .its('length')
      .should('be.eq', 2);

    //Click on More button
    cy.get('@moreBtn').click();
    //Verify if overlay is displayed
    cy.get('.tooltip-toolbar-overlay')
      .as('toolbarOverlay')
      .should('be.visible');
    //Click on Clear button
    cy.get('.tooltip-inner > :nth-child(10)').click();

    //Verify if measurements were removed from the measurements panel
    cy.get('.measurementItem').should('not.exist');

    //Close More button overlay
    cy.get('@moreBtn').click();

    //Close the measurements panel
    cy.get('@measurementsBtn').then($btn => {
      $btn.click();
      cy.get('@measurementsPanel').should('not.be.enabled');
    });
  });

  it('checks if Eraser tool will remove the measurements added in the viewport', () => {
    //Add measurements in the viewport
    cy.addLengthMeasurement();
    cy.addAngleMeasurement();

    //Verify if measurement annotation was added into the measurements panel
    cy.get('@measurementsBtn').click();
    cy.get('.measurementItem')
      .its('length')
      .should('be.eq', 2);
    cy.get('@measurementsBtn')
      .click()
      .wait(2000);
    //cy.isNotInViewport('@measurementsPanel'); //TO DO: check this intermittent behaviour

    //Click More button
    cy.get('@moreBtn').click();
    //Click Eraser button
    cy.get('.tooltip-inner > :nth-child(12)').click();

    //Erase measurement #1 and Verify if it was removed from the measurements panel
    const [x1, y1] = [150, 100];
    cy.get('@viewport').click(x1, y1, { force: true });
    cy.get('.measurementItem')
      .its('length')
      .should('be.eq', 1);

    //Erase measurement #2 and Verify if it was removed from the measurements panel
    const [x2, y2] = [180, 390];
    cy.get('@viewport').click(x2, y2, { force: true });
    cy.get('.measurementItem').should('not.exist');
  });
});
