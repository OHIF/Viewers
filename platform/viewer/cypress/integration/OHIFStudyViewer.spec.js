describe('OHIF Study Viewer Page', () => {
    before(() => {
      cy.openStudy('Dummy');
    });
  
    it('checks if series thumbnails are being displayed', ()=> {
      cy.get('.ThumbnailEntryContainer')
      .its('length')
      .should('be.gt', 1);
    });

    it('drags and drop a series thumbnail into viewport', () => {
      cy.get('.ThumbnailEntryContainer:nth-child(3)')
        .drag('.cornerstone-canvas'); 
      cy.get(':nth-child(2) > h1')
        .should('have.text', 'Imaging Measurement Report (126000 - DCM)');
    });
  
    

  });
  