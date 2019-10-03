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
    
    
    it('checks if CINE tool will prompt a modal with working controls', () => {
      //Click on button
      cy.get('.toolbar-button:nth-child(10)').as('cineBtn')
        .click();
        //Vefiry if cine control overlay is being displayed
        cy.get('.cine-controls').as('cineControls')
          .should('be.visible');

        //Test PLAY button
        cy.get('[title="Play / Stop"]')
          .click()
          .wait(100)
          .click();
        
        const overlaySeriesInformation = 'div.ViewportOverlay > div.bottom-left.overlay-element > div';
        let expectedText = 'Img: 1 1/26';  
        cy.get(overlaySeriesInformation)
          .should('not.have.text', expectedText);

        //Test SKIP TO FIRST IMAGE button
        cy.get('[title="Skip to first Image"]')
          .click()
        cy.get(overlaySeriesInformation)
          .should('contain.text', expectedText);

        //Test NEXT IMAGE button
        cy.get('[title="Play Image"]') //Title is wrong and was reported on bug #995: https://github.com/OHIF/Viewers/issues/995
          .click()
          expectedText = 'Img: 2 2/26'; 
        cy.get(overlaySeriesInformation)
          .should('contain.text', expectedText);  

        //Test SKIP TO LAST IMAGE button
        cy.get('[title="Skip, to last Image"]') //Title is wrong and was reported on bug #995: https://github.com/OHIF/Viewers/issues/995
          .click()
        expectedText = 'Img: 27 26/26';  
        cy.get(overlaySeriesInformation)
          .should('contain.text', expectedText);

        //Test PREVIOUS IMAGE button
        cy.get('[title="Previous Image"]')
          .click()
        expectedText = 'Img: 26 25/26'; 
        cy.get(overlaySeriesInformation)
          .should('contain.text', expectedText);  

        //Click on Cine button
        cy.get('@cineBtn')
        .click();
        //Vefiry if cine control overlay is hidden
        cy.get('@cineControls')
          .should('not.be.visible'); 
    });
    

    it('checks if More button will prompt a modal with secondary tools', () => {
      cy.get('.expandableToolMenu')
        .click();
      //Verify if overlay is displayed
      cy.get('.tooltip-toolbar-overlay')
        .should('be.visible');

      let iconName;
        //Click on one of the secondary tools from the overlay
      cy.get('.tooltip-inner > :nth-child(1)')
        .click()
        .then(($magnifyBtn) =>{
          cy.wrap($magnifyBtn)
            .should('have.class', 'active')
            .find('svg').then(($icon)=>{
                iconName = $icon.text();
            })
        })

        //Check if More button is active and if it has same icon as the secondary tool selected
        cy.get('.expandableToolMenu')
        .click()
        .then(($moreBtn) =>{
          cy.wrap($moreBtn)
            .should('have.class', 'active')
            .find('svg').should(($icon2)=>{
              expect($icon2.text()).to.contain(iconName)
            })
        })

      //Verify if overlay is hidden
      cy.get('.tooltip-toolbar-overlay')
        .should('not.be.visible');
    });


    it('checks if Layout tool will multiply the number of viewports displayed', () => {
      //Click on Layout button and verify if overlay is displayed
      cy.get('.btn-group > .toolbar-button').as('layoutBtn')
        .click().then(() => {
          cy.get('.layoutChooser')
            .should('be.visible')
            .find('td')
            .its('length')
            .should('be.eq', 9);
        })

        //verify if layout has changed to 2 viewports 
        cy.get('tbody > :nth-child(1) > :nth-child(2)').click();
        cy.get('.viewport-container').then(($viewport) =>{
          cy.wrap($viewport)
            .should('have.attr', 'style', 'height: 100%; width: 50%;')//checking if the layout is correct
            .its('length')
            .should('be.eq', 2);
        })
          
        cy.get('@layoutBtn').click();
        cy.get('tbody > :nth-child(2) > :nth-child(1)').click();
        cy.get('.viewport-container').then(($viewport) =>{
          cy.wrap($viewport)
            .should('have.attr', 'style', 'height: 50%; width: 100%;')//checking if the layout is correct
            .its('length')
            .should('be.eq', 2);
        })

        //verify if layout has changed to 3 viewports 
        cy.get('@layoutBtn').click();
        cy.get('tbody > :nth-child(1) > :nth-child(3)').click();
        cy.get('.viewport-container').then(($viewport) =>{
          cy.wrap($viewport)
            .should('have.attr', 'style', 'height: 100%; width: 33.3333%;')//checking if the layout is correct
            .its('length')
            .should('be.eq', 3);
        })
          
        cy.get('@layoutBtn').click();
        cy.get('tbody > :nth-child(3) > :nth-child(1)').click();
        cy.get('.viewport-container').then(($viewport) =>{
          cy.wrap($viewport)
            .should('have.attr', 'style', 'height: 33.3333%; width: 100%;')//checking if the layout is correct
            .its('length')
            .should('be.eq', 3);
        })

        //verify if layout has changed to 4 viewports 
        cy.get('@layoutBtn').click();
        cy.get('tbody > :nth-child(2) > :nth-child(2)').click();
        cy.get('.viewport-container').then(($viewport) =>{
          cy.wrap($viewport)
            .should('have.attr', 'style', 'height: 50%; width: 50%;')//checking if the layout is correct
            .its('length')
            .should('be.eq', 4);
        })

        //verify if layout has changed to 6 viewports 
        cy.get('@layoutBtn').click();
        cy.get('tbody > :nth-child(2) > :nth-child(3)').click();
        cy.get('.viewport-container').then(($viewport) =>{
          cy.wrap($viewport)
            .should('have.attr', 'style', 'height: 50%; width: 33.3333%;')//checking if the layout is correct
            .its('length')
            .should('be.eq', 6);
        })

        cy.get('@layoutBtn').click();
        cy.get('tbody > :nth-child(3) > :nth-child(2)').click();
        cy.get('.viewport-container').then(($viewport) =>{
          cy.wrap($viewport)
            .should('have.attr', 'style', 'height: 33.3333%; width: 50%;')//checking if the layout is correct
            .its('length')
            .should('be.eq', 6);
        })

        //verify if layout has changed to 9 viewports 
        cy.get('@layoutBtn').click();
        cy.get('tbody > :nth-child(3) > :nth-child(3)').click();
        cy.get('.viewport-container').then(($viewport) =>{
          cy.wrap($viewport)
            .should('have.attr', 'style', 'height: 33.3333%; width: 33.3333%;')//checking if the layout is correct
            .its('length')
            .should('be.eq', 9);
        })

         //verify if layout has changed to 1 viewport 
         cy.get('@layoutBtn').click();
         cy.get('tbody > :nth-child(1) > :nth-child(1)').click();
         cy.get('.viewport-container').then(($viewport) =>{
           cy.wrap($viewport)
             .should('have.attr', 'style', 'height: 100%; width: 100%;')//checking if the layout is correct
             .its('length')
             .should('be.eq', 1);
         })
    });


    it('check if Invert tool will change the colors of the image in the viewport', () => {
      //Click on More button
      cy.get('.expandableToolMenu').click();
      //Verify if overlay is displayed
      cy.get('.tooltip-toolbar-overlay')
        .should('be.visible');

      //Click on Invert button
      cy.get('.tooltip-inner > :nth-child(6)')
        .click();

      //check on cornerstone if image was inverted
      cy.window()
        .its('cornerstone')
        .then(($cornerstone) => {
          expect($cornerstone.getEnabledElements()[0].viewport.invert).to.be.true
        });

      cy.resetViewport();
    });


    it('check if Rotate tool will change the image orientation in the viewport', () => {
      //Click on More button
      cy.get('.expandableToolMenu').click();
      //Verify if overlay is displayed
      cy.get('.tooltip-toolbar-overlay')
        .should('be.visible');

      //Click on Rotate button
      cy.get('.tooltip-inner > :nth-child(7)')
        .click();

      //Check on cornerstone if image was rotated
      cy.window()
        .its('cornerstone')
        .then(($cornerstone) => {
          expect($cornerstone.getEnabledElements()[0].viewport.rotation).to.equal(90)
        });

      cy.resetViewport();
    });


    it('check if Flip H tool will flip the image horizontally in the viewport', () => {
      //Click on More button
      cy.get('.expandableToolMenu').click();
      //Verify if overlay is displayed
      cy.get('.tooltip-toolbar-overlay')
        .should('be.visible');

      //Click on Rotate button
      cy.get('.tooltip-inner > :nth-child(8)')
        .click();

      //Check on cornerstone if image was flipped horizontally
      cy.window()
        .its('cornerstone')
        .then(($cornerstone) => {
          expect($cornerstone.getEnabledElements()[0].viewport.hflip).to.be.true
        });

      cy.resetViewport();
    });


    it('check if Flip V tool will flip the image vertically in the viewport', () => {
      //Click on More button
      cy.get('.expandableToolMenu').click();
      //Verify if overlay is displayed
      cy.get('.tooltip-toolbar-overlay')
        .should('be.visible');

      //Click on Rotate button
      cy.get('.tooltip-inner > :nth-child(9)')
        .click();

      //Check on cornerstone if image was flipped vertically
      cy.window()
        .its('cornerstone')
        .then(($cornerstone) => {
          expect($cornerstone.getEnabledElements()[0].viewport.vflip).to.be.true
        });

      cy.resetViewport();
    });

  });