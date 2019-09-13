describe('OHIF Study Viewer Page', () => {
  
  before(() => {
      cy.openStudy("MISTER^MR");
    });
  
    it('checks if series thumbnails are being displayed', ()=> {
      cy.get('.ThumbnailEntryContainer')
      .its('length')
      .should('be.gt', 1);
    });

    it('drags and drop a series thumbnail into viewport', () => {
      cy.get('.ThumbnailEntryContainer:nth-child(2)') //element to be dragged
        .drag('.cornerstone-canvas'); //dropzone element
      
      const overlaySeriesInformation = 'div.ViewportOverlay > div.bottom-left.overlay-element > div';
      const expectedText = 'Ser: 2Img: 1 1/13512 x 512Loc: -17.60 mm Thick: 3.00 mm';
        
      cy.get(overlaySeriesInformation)
        .should('have.text', expectedText);
    });
  
    

  });
  