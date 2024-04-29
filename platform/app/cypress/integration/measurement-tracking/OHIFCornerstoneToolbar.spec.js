describe('OHIF Cornerstone Toolbar', () => {
  beforeEach(() => {
    cy.checkStudyRouteInViewer('1.2.840.113619.2.5.1762583153.215519.978957063.78');
    cy.expectMinimumThumbnails(3);
    cy.initCornerstoneToolsAliases();
    cy.initCommonElementsAliases();

    cy.get('[data-cy="study-browser-thumbnail"]').eq(1).click();

    //const expectedText = 'Ser: 1';
    //cy.get('@viewportInfoBottomLeft').should('contains.text', expectedText);
    cy.waitDicomImage();
  });

  it('checks if all primary buttons are being displayed', () => {
    cy.get('@zoomBtn').should('be.visible');
    cy.get('@wwwcBtnPrimary').should('be.visible');
    cy.get('@wwwcBtnSecondary').should('be.visible');
    cy.get('@panBtn').should('be.visible');
    cy.get('@measurementToolsBtnPrimary').should('be.visible');
    cy.get('@measurementToolsBtnSecondary').should('be.visible');
    cy.get('@moreBtnPrimary').should('be.visible');
    cy.get('@moreBtnSecondary').should('be.visible');
    cy.get('@layoutBtn').should('be.visible');
  });

  /*it('checks if Stack Scroll tool will navigate across all series in the viewport', () => {
    //Click on button and verify if icon is active on toolbar
    cy.get('@stackScrollBtn')
      .click()
      .then($stackScrollBtn => {
        cy.wrap($stackScrollBtn).should('have.class', 'active');
      });

    //drags the mouse inside the viewport to be able to interact with series
    cy.get('@viewport')
      .trigger('mousedown', 'center', { buttons: 1 })
      .trigger('mousemove', 'top', { buttons: 1 })
      .trigger('mouseup');
    const expectedText =
      'Ser: 1Img: 1 1/26256 x 256Loc: -30.00 mm Thick: 5.00 mm';
    cy.get('@viewportInfoBottomLeft').should('have.text', expectedText);
  });*/

  // it('checks if Zoom tool will zoom in/out an image in the viewport', () => {
  //   //Click on button and verify if icon is active on toolbar
  //   cy.get('@zoomBtn')
  //     .click()
  //     .then($zoomBtn => {
  //       cy.wrap($zoomBtn).should('have.class', 'active');
  //     });

  //   // IMPORTANT: Cypress sends out a mouseEvent which doesn't have the buttons
  //   // property. This is a workaround to simulate a mouseEvent with the buttons property
  //   // which is consumed by cornerstone
  //   cy.get('@viewport')
  //     .trigger('mousedown', 'center', { buttons: 1 })
  //     .trigger('mousemove', 'top', {
  //       buttons: 1,
  //     })
  //     .trigger('mouseup', {
  //       buttons: 1,
  //     });

  //   const expectedText = 'Zoom:0.96x';
  //   cy.get('@viewportInfoTopLeft').should('have.text', expectedText);
  // });

  it('checks if Levels tool will change the window width and center of an image', () => {
    // Wait for the DICOM image to load

    // Assign an alias to the button element
    cy.get('@wwwcBtnPrimary').as('wwwcButton');
    cy.get('@wwwcButton').click();
    cy.get('@wwwcButton').should('have.class', 'bg-primary-light');

    //drags the mouse inside the viewport to be able to interact with series
    cy.get('@viewport')
      .trigger('mousedown', 'center', { buttons: 1 })
      // Since we have scrollbar on the right side of the viewport, we need to
      // force the mousemove since it goes to another element
      .trigger('mousemove', 'right', { buttons: 1, force: true })
      .trigger('mouseup', { buttons: 1 });

    // The exact text is slightly dependent on the viewport resolution, so leave a range
    cy.get('@viewportInfoBottomLeft').should($txt => {
      const text = $txt.text();
      expect(text).to.include('W:118').include('L:479');
    });
  });

  it('checks if Pan tool will move the image inside the viewport', () => {
    // Assign an alias to the button element
    cy.get('@panBtn').as('panButton');

    // Click on the button
    cy.get('@panButton').click();

    // Assert that the button has the 'active' class
    cy.get('@panButton').should('have.class', 'bg-primary-light');

    // Trigger the pan actions on the viewport
    cy.get('@viewport')
      .trigger('mousedown', 'center', { buttons: 1 })
      .trigger('mousemove', 'bottom', { buttons: 1 })
      .trigger('mouseup', 'bottom');
  });

  it('checks if Length annotation can be added to viewport and shows up in the measurements panel', () => {
    //Click on button and verify if icon is active on toolbar
    cy.addLengthMeasurement();
    cy.get('[data-cy="viewport-notification"]').as('notif').should('exist');
    // cy.get('[data-cy="viewport-notification"]').as('notif').should('be.visible');

    cy.get('[data-cy="prompt-begin-tracking-yes-btn"]').as('yesBtn').click();

    //Verify the measurement exists in the table
    cy.get('@measurementsPanel').should('be.visible');

    cy.get('[data-cy="measurement-item"]').as('measure').its('length').should('be.at.least', 1);
  });

  /*it('checks if angle annotation can be added on viewport without causing any errors', () => {
    //Click on button and verify if icon is active on toolbar
    cy.get('@angleBtn')
      .click()
      .then($angleBtn => {
        cy.wrap($angleBtn).should('have.class', 'active'); // TODO: should we just add the 'active' class back? Or use a data property?
      });

    //Add annotation on the viewport
    const initPos = [180, 390];
    const midPos = [300, 410];
    const finalPos = [180, 450];
    cy.addAngle('@viewport', initPos, midPos, finalPos);
  });*/

  it('checks if Reset tool will reset all changes made on the image', () => {
    //Make some changes by zooming in and rotating the image
    cy.imageZoomIn();
    cy.imageContrast();

    //Click on reset button
    cy.resetViewport();

    const expectedText = 'W:958L:479';
    cy.get('@viewportInfoBottomLeft').should('have.text', expectedText);
  });

  /*it('checks if CINE tool will prompt a modal with working controls', () => {
    cy.server();
    cy.route('GET', '/!**!/studies/!**!/').as('studies');

    //Click on button
    cy.get('@cineBtn').click();

    // Verify if cine control overlay is being displayed
    cy.get('.cine-controls')
      .as('cineControls')
      .should('be.visible');

    //Test PLAY button
    cy.get('[title="Play / Stop"]').then($btn => {
      $btn.click();
      cy.wait(100);
      $btn.click();
    });

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
    cy.get('@cineBtn')
      .click()
      .then(() => {
        // Verify that cine control overlay is hidden
        cy.get('@cineControls').should('not.exist');
      });
  });*/

  /**
  it('checks if More button will prompt a modal with secondary tools', () => {
    //Click on More button
    cy.get('@moreBtnSecondary').click();

    //Verify if overlay is displayed
    cy.get('[data-cy="MoreTools-list-menu"]')
      .as('toolbarOverlay')
      .should('be.visible');

    // Click on one of the secondary tools from the overlay
    cy.get('[data-cy="Magnify"]').click();

    // Check if More button is active and if it has same icon as the secondary tool selected
    cy.get('@moreBtnPrimary').then($moreBtn => {
      cy.wrap($moreBtn)
        .should('have.class', 'active')
        .should('have.attr', 'data-tool', 'Magnify');
    });

    // Verify if overlay is hidden
    cy.get('@toolbarOverlay').should('not.be.visible');
  });
   */

  /*it('checks if Layout tool will multiply the number of viewports displayed', () => {
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
        cy.get('@layoutBtn').click();
      });

    //verify if layout has changed to 2 viewports
    cy.setLayout(1, 2);
    cy.get('.viewport-container').then($viewport => {
      cy.wrap($viewport)
        .its('length')
        .should('be.eq', 2);
    });

    cy.setLayout(2, 1);
    cy.get('.viewport-container').then($viewport => {
      cy.wrap($viewport)
        .its('length')
        .should('be.eq', 2);
    });

    //verify if layout has changed to 3 viewports
    cy.setLayout(1, 3);
    cy.get('.viewport-container').then($viewport => {
      cy.wait(1000);
      cy.wrap($viewport)
        .its('length')
        .should('be.eq', 3);
    });

    cy.setLayout(3, 1);
    cy.get('.viewport-container').then($viewport => {
      cy.wrap($viewport)
        .its('length')
        .should('be.eq', 3);
    });

    //verify if layout has changed to 4 viewports
    cy.setLayout(2, 2);
    cy.get('.viewport-container').then($viewport => {
      cy.wrap($viewport)
        .its('length')
        .should('be.eq', 4);
    });

    //verify if layout has changed to 6 viewports
    cy.setLayout(2, 3);
    cy.get('.viewport-container').then($viewport => {
      cy.wrap($viewport)
        .its('length')
        .should('be.eq', 6);
    });

    cy.setLayout(3, 2);
    cy.get('.viewport-container').then($viewport => {
      cy.wrap($viewport)
        .its('length')
        .should('be.eq', 6);
    });

    //verify if layout has changed to 9 viewports
    cy.setLayout(3, 3);
    cy.get('.viewport-container').then($viewport => {
      cy.wrap($viewport)
        .its('length')
        .should('be.eq', 9);
    });

    //verify if layout has changed to 1 viewport
    cy.setLayout(1, 1);
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
    cy.get('[data-cy="measurement-item"]')
      .its('length')
      .should('be.at.least', 2);

    //Click on More button
    cy.get('@moreBtn').click();
    //Verify if overlay is displayed
    cy.get('.tooltip-toolbar-overlay')
      .as('toolbarOverlay')
      .should('be.visible');
    //Click on Clear button
    cy.get('[data-cy="clear"]').click();

    //Verify if measurements were removed from the measurements panel

    //cy.get('.measurementItem'); //.should('not.exist');

    //Close More button overlay
    cy.get('@moreBtn').click();

    //Close the measurements panel
    cy.get('@measurementsBtn').then($btn => {
      $btn.click();
      cy.get('@measurementsPanel').should('not.be.enabled');
    });
  });

  it('check if Rotate tool will change the image orientation in the viewport', () => {
    //Click on More button
    cy.get('@moreBtn').click();
    //Verify if overlay is displayed
    cy.get('.tooltip-toolbar-overlay')
      .should('be.visible')
      .then(() => {
        //Click on Rotate button
        cy.get('[data-cy="rotate right"]').click({ force: true });
        cy.get('@viewportInfoMidLeft').should('contains.text', 'F');
        cy.get('@viewportInfoMidTop').should('contains.text', 'R');
      });

    //Click on More button to close it
    cy.get('@moreBtn').click();
  });

  it('check if Flip H tool will flip the image horizontally in the viewport', () => {
    //Click on More button
    cy.get('@moreBtn').click();
    //Verify if overlay is displayed
    cy.get('.tooltip-toolbar-overlay').should('be.visible');

    //Click on Flip H button
    cy.get('[data-cy="flip h"]').click();
    cy.get('@viewportInfoMidLeft').should('contains.text', 'L');
    cy.get('@viewportInfoMidTop').should('contains.text', 'H');

    //Click on More button to close it
    cy.get('@moreBtn').click();
    cy.get('.tooltip-toolbar-overlay').should('not.exist');
  });
*/
  it('check if Flip tool will flip the image in the viewport', () => {
    cy.get('@viewportInfoMidLeft').should('contains.text', 'R');
    cy.get('@viewportInfoMidTop').should('contains.text', 'A');

    //Click on More button
    cy.get('@moreBtnSecondary').click();

    //Click on Flip button
    cy.get('[data-cy="flipHorizontal"]').click();
    cy.waitDicomImage();
    cy.get('@viewportInfoMidLeft').should('contains.text', 'L');
    cy.get('@viewportInfoMidTop').should('contains.text', 'A');
  });

  // it('checks if stack sync is preserved on new display set and uses FOR', () => {
  //   // Active stack image sync and reference lines
  //   cy.get('[data-cy="MoreTools-split-button-secondary"]').click();
  //   cy.get('[data-cy="ImageSliceSync"]').click();
  //   // Add reference lines as that sometimes throws an exception
  //   cy.get('[data-cy="MoreTools-split-button-secondary"]').click();
  //   cy.get('[data-cy="ReferenceLines"]').click();

  //   cy.get('[data-cy="study-browser-thumbnail"]:nth-child(2)').dblclick();
  //   cy.get('body').type('{downarrow}{downarrow}');

  //   // Change the layout and double load the first
  //   cy.setLayout(2, 1);
  //   cy.get('body').type('{rightarrow}');
  //   cy.get('[data-cy="study-browser-thumbnail"]:nth-child(2)').dblclick();
  //   cy.waitDicomImage();

  //   // Now navigate down once and check that the left hand pane navigated
  //   cy.get('body').focus().type('{downarrow}');

  //   // The following lines assist in troubleshooting when/if this test were to fail.
  //   cy.get('[data-cy="viewport-pane"]')
  //     .eq(0)
  //     .find('[data-cy="viewport-overlay-top-right"]')
  //     .should('contains.text', 'I:2 (2/20)');
  //   cy.get('[data-cy="viewport-pane"]')
  //     .eq(1)
  //     .find('[data-cy="viewport-overlay-top-right"]')
  //     .should('contains.text', 'I:2 (2/20)');

  //   cy.get('body').type('{leftarrow}');
  //   cy.setLayout(1, 1);
  //   cy.get('@viewportInfoTopRight').should('contains.text', 'I:2 (2/20)');
  // });
});
