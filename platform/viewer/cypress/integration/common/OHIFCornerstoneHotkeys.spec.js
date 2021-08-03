describe('OHIF Cornerstone Hotkeys', () => {
  before(() => {
    cy.checkStudyRouteInViewer(
      '1.2.840.113619.2.5.1762583153.215519.978957063.78'
    );
    cy.expectMinimumThumbnails(3);
  });

  beforeEach(() => {
    cy.initCornerstoneToolsAliases();
    cy.initCommonElementsAliases();
    cy.resetViewport();
  });

  it('checks if hotkeys "R" and "L" can rotate the image', () => {
    // Hotkey R
    cy.get('body').type('R');
    cy.get('@viewportInfoMidLeft').should('contains.text', 'P');
    cy.get('@viewportInfoMidTop').should('contains.text', 'R');
    // Hotkey L
    cy.get('body').type('L');
    cy.get('@viewportInfoMidLeft').should('contains.text', 'R');
    cy.get('@viewportInfoMidTop').should('contains.text', 'A');
  });

  it('checks if hotkeys "ArrowUp" and "ArrowDown" can navigate in the stack', () => {
    // Hotkey ArrowDown
    cy.get('body').type('{downarrow}');
    cy.get('@viewportInfoBottomLeft').should('contains.text', 'Img: 2 2/26');
    // Hotkey ArrowUp
    cy.get('body').type('{uparrow}');
    cy.get('@viewportInfoBottomLeft').should('contains.text', 'Img: 1 1/26');
  });

  it('checks if hotkeys "V" and "H" can flip the image', () => {
    // Hotkey V
    cy.get('body').type('V');
    cy.get('@viewportInfoMidLeft').should('contains.text', 'L');
    cy.get('@viewportInfoMidTop').should('contains.text', 'A');
    // Hotkey H
    cy.get('body').type('H');
    cy.get('@viewportInfoMidLeft').should('contains.text', 'L');
    cy.get('@viewportInfoMidTop').should('contains.text', 'P');
  });

  it('checks if hotkeys "+", "-" and "=" can zoom in, out and fit to viewport', () => {
    // Hotkey +
    cy.get('body').type('+++'); // Press hotkey 3 times
    cy.get('@viewportInfoBottomRight').should('contains.text', 'Zoom: 256%');
    // Hotkey -
    cy.get('body').type('-');
    cy.get('@viewportInfoBottomRight').should('contains.text', 'Zoom: 241%');
    // Hotkey =
    cy.get('body').type('=');
    cy.get('@viewportInfoBottomRight').should('contains.text', 'Zoom: 211%');
  });

  it('checks if hotkey "SPACEBAR" can reset the image', () => {
    // Press multiples hotkeys
    cy.get('body').type('V+++I');
    cy.get('@viewportInfoMidLeft').should('contains.text', 'L');
    cy.get('@viewportInfoMidTop').should('contains.text', 'A');
    cy.get('@viewportInfoBottomRight').should('contains.text', 'Zoom: 256%');

    // Hotkey SPACEBAR
    cy.get('body').type(' ');
    cy.get('@viewportInfoMidLeft').should('contains.text', 'R');
    cy.get('@viewportInfoMidTop').should('contains.text', 'A');
    cy.get('@viewportInfoBottomRight').should('contains.text', 'Zoom: 211%');
  });

  it('uses hotkeys "RightArrow" and "LeftArrow" to navigate between multiple viewports', () => {
    //Select viewport layout (3,1)
    cy.setLayout(3, 1);
    cy.waitViewportImageLoading();

    // Press multiples hotkeys on viewport #1
    cy.get('body').type('VL+++I');
    cy.get('@viewportInfoMidLeft').should('contains.text', 'A');
    cy.get('@viewportInfoMidTop').should('contains.text', 'R');
    cy.get('@viewportInfoBottomRight').should('contains.text', 'Zoom: 134%');

    // Hotkey RightArrow: Move to next viewport
    cy.get('body').type('{rightarrow}');

    // Get overlay information from viewport #2
    cy.get(
      ':nth-child(2) > .viewport-wrapper > .viewport-element > .ViewportOrientationMarkers.noselect > .top-mid.orientation-marker'
    ).as('viewport2InfoMidTop');
    cy.get(
      ':nth-child(2) > .viewport-wrapper > .viewport-element > .ViewportOrientationMarkers.noselect > .left-mid.orientation-marker'
    ).as('viewport2InfoMidLeft');
    cy.get(
      ':nth-child(2) > .viewport-wrapper > .viewport-element > .OHIFCornerstoneViewportOverlay > div.bottom-right.overlay-element > div'
    ).as('viewport2InfoBottomRight');

    // Press multiples hotkeys on viewport #2
    cy.get('body').type('RR++H+++I');
    cy.get('@viewport2InfoMidLeft').should('contains.text', 'P');
    cy.get('@viewport2InfoMidTop').should('contains.text', 'H');
    cy.get('@viewport2InfoBottomRight').should('contains.text', 'Zoom: 120%');

    // Hotkey LeftArrow: Move to previous viewport
    cy.get('body').type('{leftarrow}');

    // Hotkey SPACEBAR: Reset viewport #1
    cy.get('body').type(' ');
    cy.get('@viewportInfoMidLeft').should('contains.text', 'R');
    cy.get('@viewportInfoMidTop').should('contains.text', 'A');
    cy.get('@viewportInfoBottomRight').should('contains.text', 'Zoom: 89%');

    // Hotkey RightArrow: Move to next viewport
    cy.get('body').type('{rightarrow}');

    // Hotkey SPACEBAR: Reset viewport #2
    cy.get('body').type(' ');
    cy.get('@viewport2InfoMidLeft').should('contains.text', 'A');
    cy.get('@viewport2InfoMidTop').should('contains.text', 'H');
    cy.get('@viewport2InfoBottomRight').should('contains.text', 'Zoom: 45%');

    //Select viewport layout (1,1)
    cy.setLayout(1, 1);
  });

  //TO-DO: This test is blocked by issue #1095 (https://github.com/OHIF/Viewers/issues/1095)
  //Once issue is fixed, this test can be uncommented
  // it('checks if hotkey "Z" activates zoom tool', () => {
  //   // Hotkey Z
  //   cy.get('body').type('Z');
  //   // Verify if icon is active on toolbar
  //   cy.get('@zoomBtn').should('have.class', 'active');
  // });

  //TO-DO: This test is blocked by issue #1095 (https://github.com/OHIF/Viewers/issues/1095)
  //Once issue is fixed, this test can be uncommented
  // it('checks if hotkeys "PageDown" and "PageUp" can navigate in the series thumbnails', () => {
  //   // Hotkey PageDown
  //   cy.get('body').type('{pagedown}{pagedown}'); // press hotkey twice
  //   cy.get('@viewportInfoBottomLeft').should('contains.text', 'Ser: 3');
  //   // Hotkey PageUp
  //   cy.get('body').type('{pageup}');
  //   cy.get('@viewportInfoBottomLeft').should('contains.text', 'Ser: 2');
  // });
});
