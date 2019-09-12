describe('OHIF Study Viewer Page', () => {
  
  before(() => {
      // cy.visit('/');
      // cy.get('#patientName')
      //   .type("Dummy");
      // cy.get('.studylistStudy > .patientName')
      //   .contains("Dummy")
      //   .click();
      cy.openStudy("MISTER^MR");
    });
  
    it('checks if series thumbnails are being displayed', ()=> {
      cy.get('.ThumbnailEntryContainer')
      .its('length')
      .should('be.gt', 1);
    });

    it('drags and drop a series thumbnail into viewport', () => {
      cy.wait(3000); 
      cy.get('.ThumbnailEntryContainer:nth-child(2)')
        .drag('.cornerstone-canvas');
      cy.wait(1000); 
      
      cy.get('div.ViewportOverlay > div.bottom-left.overlay-element > div')
      .should('have.text','Ser: 2Img: 1 1/13512 x 512Loc: -17.60 mm Thick: 3.00 mm');
    });
  
    

  });
  