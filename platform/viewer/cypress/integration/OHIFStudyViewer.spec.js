describe('OHIF Study Viewer Page', () => {
  
  before(() => {
      cy.visit('/');
      cy.get('#patientName')
        .type("Dummy");
      cy.get('.studylistStudy > .patientName')
        .contains("Dummy")
        .click();
    });
  
    it('checks if series thumbnails are being displayed', ()=> {
      cy.get('.ThumbnailEntryContainer')
      .its('length')
      .should('be.gt', 1);
    });

    it('drags and drop a series thumbnail into viewport', () => {
      cy.wait(3000); 
      cy.get('.ThumbnailEntryContainer:nth-child(3)')
        .drag('.cornerstone-canvas');
      cy.wait(1000); 
      cy.get(':nth-child(2) > h1')
        .should('have.text', 'Imaging Measurement Report (126000 - DCM)');
    });
  
    

  });
  