/*
TODO: Temporarily commented out because it is failing on CI due to timing issues
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

    it('checks if Series left panel can be hidden/displayed', ()=> {
      const seriesButton = '.pull-left > .RoundedButtonGroup > .roundedButtonWrapper > .roundedButton';
      const leftPanel = 'section.sidepanel.from-left';

      cy.get(seriesButton).click(); 
      cy.get(leftPanel).should('not.be.enabled')

      cy.get(seriesButton).click();
      cy.get(leftPanel).should('be.visible');
    });

    it('checks if Measurements right panel can be hidden/displayed', ()=> {
      const measurementsButton = '.pull-right > .RoundedButtonGroup > .roundedButtonWrapper > .roundedButton';
      const rightPanel = 'section.sidepanel.from-right';

      cy.get(measurementsButton).click();
      cy.get(rightPanel).should('be.visible');
      
      
      cy.get(measurementsButton).click();
      cy.get(rightPanel).should('not.be.enabled');
    });

  });
*/