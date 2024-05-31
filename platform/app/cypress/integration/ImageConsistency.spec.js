/**
 * Add tests to ensure image consistency and quality
 */

const testPixel = (dx, dy, expectedPixel) => {
  cy.get('.cornerstone-canvas').then(v => {
    const canvas = v[0];
    cy.log(
      'testPixel canvas',
      dx,
      dy,
      expectedPixel,
      canvas.width,
      canvas.height,
      canvas.style.width,
      canvas.style.height
    );
    const ctx = canvas.getContext('2d');
    cy.window()
      .its('cornerstone')
      .then(cornerstone => {
        const { viewport } = cornerstone.getEnabledElements()[0];
        const imageData = viewport.getImageData();
        // cy.log("imageData", imageData);
        const origin = viewport.worldToCanvas(imageData.origin);
        const orX = origin[0] * devicePixelRatio;
        const orY = origin[1] * devicePixelRatio;
        const x = Math.round(orX + dx);
        const y = Math.round(orY + dy);
        cy.log('testPixel origin x,y point x,y', orX, orY, x, y);
        // cy.log('world origin', imageData.origin);
        // cy.log('focal', viewport.getCamera().focalPoint,
        // viewport.worldToCanvas(viewport.getCamera().focalPoint));
        const pixelData = ctx.getImageData(x, y, 1, 1);

        expect(pixelData.data[0]).closeTo(expectedPixel, 1);
      });
  });
};

describe('CS3D Image Consistency and Quality', () => {
  const setupStudySeries = (studyUID, seriesUID) => {
    cy.checkStudyRouteInViewer(
      studyUID,
      `&seriesInstanceUID=${seriesUID}&hangingProtocolId=@ohif/hpScale`
    );
    cy.initCornerstoneToolsAliases();
    cy.initCommonElementsAliases();
  };

  it('TG18 Resolution Test Displayed 1:1', () => {
    setupStudySeries(
      '2.16.124.113543.6004.101.103.20021117.061159.1',
      '2.16.124.113543.6004.101.103.20021117.061159.1.004'
    );
    testPixel(1018, 1028, 255);
    // Horizontal and vertical delta from this should not be contaminated
    // by values from center
    testPixel(1019, 1028, 0);
    testPixel(1018, 1029, 0);
    testPixel(1017, 1028, 0);
    testPixel(1018, 1027, 0);
  });

  // Missing test data - todo
  it.skip('8 bit image displayable', () => {
    setupStudySeries('1.3.46.670589.17.1.7.1.1.7', '1.3.46.670589.17.1.7.2.1.7');

    // Compare with dcm2jpg generated values or by manually computing WL values
    testPixel(258, 257, 171);
    testPixel(259, 257, 166);
  });

  it.skip('12 bit image displayable and zoom with pixel spacing', () => {
    setupStudySeries(
      '1.3.6.1.4.1.25403.345050719074.3824.20170125113417.1',
      '1.3.6.1.4.1.25403.345050719074.3824.20170125113608.5'
    );

    // Compare with dcm2jpg generated values or by manually computing WL values
    testPixel(258, 277, 120);
    testPixel(259, 277, 122);
  });
});
