describe('OHIF Cornerstone Toolbar', () => {
  
  before(() => {
      cy.openStudy("MISTER^MR");
    });

    it('checks if all primary buttons are being displayed', ()=> {
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
      
      cy.wait(5000);
    });


    it('checks if Length annotation can be added on viewport and on measurements panel', ()=> {   
      //Click on button and vefiry if icon is active on toolbar
      cy.get('.toolbar-button:nth-child(6)').as('lengthBtn')
        .click()
        .then((lengthbtn) =>{
          cy.wrap(lengthbtn)
            .should('have.class', 'active')
        })

      const initPos = [100, 150];
      const finalPos = [150, 210];
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


    it('checks if Angle annotation can be added on viewport and on measurements panel', ()=> {   
      //Click on button and vefiry if icon is active on toolbar
      cy.get('.toolbar-button:nth-child(8)').as('angleBtn')
        .click()
        .then((angleBtn) =>{
          cy.wrap(angleBtn)
            .should('have.class', 'active')
        })

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


    
    

  });