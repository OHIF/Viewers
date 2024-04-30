import '@percy/cypress';

describe('OHIF Percy TMTV', () => {
  beforeEach(() => {
    cy.openStudyInViewer(
      '1.3.6.1.4.1.14519.5.2.1.7009.2403.334240657131972136850343327463',
      '',
      '/tmtv'
    );
    cy.wait(10000);
  });

  it('should maintain VOI when going 1 up and back', () => {
    cy.percyCanvasSnapshot('TMTV Loaded');
    cy.get('[data-viewport-uid="mipSagittal"] > .viewport-element > .cornerstone-canvas').dblclick(
      100,
      100
    );
    cy.wait(500);
    cy.percyCanvasSnapshot('TMTV One up view loaded');
    cy.get('[data-viewport-uid="mipSagittal"] > .viewport-element > .cornerstone-canvas').dblclick(
      100,
      100
    );
    cy.wait(500);
    cy.percyCanvasSnapshot('TMTV Back to original view');
  });
});
