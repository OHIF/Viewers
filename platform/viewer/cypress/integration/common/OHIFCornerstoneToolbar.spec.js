describe('OHIF Cornerstone Toolbar', () => {
  
  before(() => {
      cy.openStudy("MISTER^MR");
      cy.waitDicomImage();
    });

    it('checks if all primary buttons are being displayed', () => {
      //Creating Aliases
      cy.get('.toolbar-button:nth-child(2)').as('stackScrollBtn');
      cy.get('.toolbar-button:nth-child(3)').as('zoomBtn');
      cy.get('.toolbar-button:nth-child(4)').as('levelsBtn');
      cy.get('.toolbar-button:nth-child(5)').as('panBtn');
      cy.get('.toolbar-button:nth-child(6)').as('lengthBtn');
      cy.get('.toolbar-button:nth-child(7)').as('annotateBtn');
      cy.get('.toolbar-button:nth-child(8)').as('angleBtn');
      cy.get('.toolbar-button:nth-child(9)').as('resetBtn');
      cy.get('.toolbar-button:nth-child(10)').as('cineBtn');
      cy.get('.expandableToolMenu').as('moreBtn');
      cy.get('.PluginSwitch > .toolbar-button').as('twodmprBtn');
      cy.get('.btn-group > .toolbar-button').as('layoutBtn');

      cy.get('@stackScrollBtn').should('be.visible').contains('Stack Scroll');
      cy.get('@zoomBtn').should('be.visible').contains('Zoom');
      cy.get('@levelsBtn').should('be.visible').contains('Levels');
      cy.get('@panBtn').should('be.visible').contains('Pan');
      cy.get('@lengthBtn').should('be.visible').contains('Length');
      cy.get('@annotateBtn').should('be.visible').contains('Annotate');
      cy.get('@angleBtn').should('be.visible').contains('Angle');
      cy.get('@resetBtn').should('be.visible').contains('Reset');
      cy.get('@cineBtn').should('be.visible').contains('CINE');
      cy.get('@moreBtn').should('be.visible').contains('More');
      cy.get('@twodmprBtn').should('be.visible').contains('2D MPR');
      cy.get('@layoutBtn').should('be.visible').contains('Layout');
    });


    it('checks if Stack Scroll tool will navigate across all series in the viewport', () => {
      cy.waitDicomImage();
      //Click on button and vefiry if icon is active on toolbar
      cy.get('.toolbar-button:nth-child(2)').as('stackScrollBtn')
        .click()
        .then(($stackScrollBtn) =>{
          cy.wrap($stackScrollBtn)
            .should('have.class', 'active')
        })

      //drags the mouse inside the viewport to be able to interact with series
      cy.get('.viewport-element')
        .trigger('mousedown', 'top', { which: 1 })
        .trigger('mousemove', 'center', { which: 1 })
        .trigger('mouseup');

      const overlaySeriesInformation = 'div.ViewportOverlay > div.bottom-left.overlay-element > div';
      const expectedText = 'Ser: 1Img: 14 14/26256 x 256Loc: 0.00 mm Thick: 5.00 mm';   
      cy.get(overlaySeriesInformation)
        .should('have.text', expectedText);

      cy.resetViewport();
    });


    it('checks if Zoom tool will zoom in/out an image in the viewport', () => {
      //Click on button and vefiry if icon is active on toolbar
      cy.get('.toolbar-button:nth-child(3)').as('zoomBtn')
        .click()
        .then(($zoomBtn) =>{
          cy.wrap($zoomBtn)
            .should('have.class', 'active')
        })

      //drags the mouse inside the viewport to be able to interact with series
      cy.get('.viewport-element')
        .trigger('mousedown', 'top', { which: 1 })
        .trigger('mousemove', 'center', { which: 1 })
        .trigger('mouseup');

      const overlaySeriesInformation = 'div.ViewportOverlay > div.bottom-right.overlay-element > div';
      const expectedText = 'Zoom: 884%W: 820 L: 410Lossless / Uncompressed';   
      cy.get(overlaySeriesInformation)
        .should('have.text', expectedText);

      cy.resetViewport();
    });


    it('checks if Levels tool will change the contrast and brightness of an image in the viewport', () => {
      //Click on button and vefiry if icon is active on toolbar
      cy.get('.toolbar-button:nth-child(4)').as('levelsBtn')
        .click()
        .then(($levelsBtn) =>{
          cy.wrap($levelsBtn)
            .should('have.class', 'active')
        })

      //drags the mouse inside the viewport to be able to interact with series
      cy.get('.viewport-element')
        .trigger('mousedown', 'top', { which: 1 })
        .trigger('mousemove', 'center', { which: 1 })
        .trigger('mouseup')
        .trigger('mousedown', 'center', { which: 1 })
        .trigger('mousemove', 'left', { which: 1 })
        .trigger('mouseup');

      const overlaySeriesInformation = 'div.ViewportOverlay > div.bottom-right.overlay-element > div';
      const expectedText = 'Zoom: 211%W: 544 L: 626Lossless / Uncompressed';
      cy.get(overlaySeriesInformation)
        .should('have.text', expectedText);

      cy.resetViewport();
    });
    

    it('checks if Pan tool will move the image inside the viewport', () => {
      //Click on button and vefiry if icon is active on toolbar
      cy.get('.toolbar-button:nth-child(5)').as('panBtn')
        .click()
        .then(($panBtn) =>{
          cy.wrap($panBtn)
            .should('have.class', 'active')
        })
      
      //Get image position from cornerstone and check if y axis was modified
      let cornerstone;
      let currentPan;

      cy.window()
        .its('cornerstone')
        .then((c) => {
          cornerstone = c;
          currentPan = () => cornerstone.getEnabledElements()[0].viewport.translation;
        });

      cy.get('.viewport-element')
        .trigger('mousedown', 'center', { which: 1 })
        .trigger('mousemove', 'bottom', { which: 1 })
        .trigger('mouseup', 'bottom')
        .then(() => {
          expect(currentPan().y > 0).to.eq(true);
        });

        cy.resetViewport();
    });


    it('checks if Length annotation can be added on viewport and on measurements panel', () => {   
      //Click on button and vefiry if icon is active on toolbar
      cy.get('.toolbar-button:nth-child(6)').as('lengthBtn')
        .click()
        .then(($lengthbtn) =>{
          cy.wrap($lengthbtn)
            .should('have.class', 'active')
        })

      //Add annotation on the viewport
      const initPos = [150, 150];
      const finalPos = [150, 170];
      cy.addLine('.cornerstone-canvas', initPos, finalPos)
      
      //Verify if measurement annotation was added into the measurements panel
      cy.get('.pull-right > .RoundedButtonGroup > .roundedButtonWrapper > .roundedButton')
        .as('measurementsBtn')
        .click()
        .then($measurementsBtn => {
          cy.get('section.sidepanel.from-right')
            .as('measurementsPanel')
            .should('be.visible');
            
          cy.get('.measurementItem')
            .its('length')
            .should('be.eq', 1);

          cy.wrap($measurementsBtn)
          .click();
        })
    });


    it('checks if Angle annotation can be added on viewport and on measurements panel', () => {   
      //Click on button and vefiry if icon is active on toolbar
      cy.get('.toolbar-button:nth-child(8)').as('angleBtn')
        .click()
        .then(($angleBtn) =>{
          cy.wrap($angleBtn)
            .should('have.class', 'active')
        })

      //Add annotation on the viewport
      const initPos = [180, 390];
      const midPos = [300, 410];
      const finalPos = [180, 450];
      cy.addAngle('.cornerstone-canvas', initPos, midPos, finalPos);

      //Verify if measurement annotation was added into the measurements panel
      cy.get('.pull-right > .RoundedButtonGroup > .roundedButtonWrapper > .roundedButton')
        .as('measurementsBtn')
        .click()
        .then($measurementsBtn => {
          cy.get('section.sidepanel.from-right')
            .as('measurementsPanel')
            .should('be.visible');
            
          cy.get('.measurementItem')
            .its('length')
            .should('be.eq', 2);

          cy.wrap($measurementsBtn)
          .click();
        })
    });


    it('checks if Reset tool will reset all changes made on the image', () => {
      //Make some changes by zooming in and rotating the image
      cy.window()
        .its('cornerstone')
        .then(($cornerstone) => {
          $cornerstone.getEnabledElements()[0].viewport.scale = 4;
         $cornerstone.getEnabledElements()[0].viewport.rotation = 90;
        });

      //Click on reset button
      cy.get('.toolbar-button:nth-child(9)').click()
   
      const overlaySeriesInformation = 'div.ViewportOverlay > div.bottom-right.overlay-element > div';
      const expectedText = 'Zoom: 211%W: 820 L: 410Lossless / Uncompressed';
      cy.get(overlaySeriesInformation)
        .should('have.text', expectedText);
    });
    
    
    

  });