import * as types from './constants/ActionTypes.js';

import actions from './actions.js';

describe('actions', () => {
  test('exports have not changed', () => {
    const expectedExports = [
      'setViewportActive',
      'setViewportSpecificData',
      'setViewportLayoutAndData',
      'setLayout',
      'clearViewportSpecificData',
      'setActiveViewportSpecificData',
      'setUserPreferences',
      'setExtensionData',
      'setTimepoints',
      'setMeasurements',
      'setServers',
      'setStudyData',
    ].sort();

    const exports = Object.keys(actions).sort();

    expect(exports).toEqual(expectedExports);
  });

  describe('viewport action creators', () => {
    it('should create an action to set the viewport specific data', () => {
      const viewportSpecificData = {
        displaySetInstanceUID: 'ef859a23-4631-93ab-d26b-7940a822c699',
        SeriesDate: '20151026',
        SeriesTime: '082611.370000',
        SeriesInstanceUID:
          '1.3.6.1.4.1.25403.345050719074.3824.20170126085406.5',
        SeriesNumber: 2,
        SeriesDescription: 'Chest 3x3 Soft',
        numImageFrames: 126,
        Modality: 'CT',
        isMultiFrame: false,
        InstanceNumber: 1,
        StudyInstanceUID:
          '1.3.6.1.4.1.25403.345050719074.3824.20170126085406.1',
        sopClassUIDs: ['1.2.840.10008.5.1.4.1.1.2'],
        plugin: 'cornerstone',
        viewport: {
          zoomScale: null,
          rotation: 360,
          resetViewport: null,
          invert: null,
          vflip: null,
          hflip: null,
          clearTools: null,
          scrollUp: null,
          scrollDown: null,
          scrollFirstImage: null,
          scrollLastImage: null,
          previousPanel: null,
          nextPanel: null,
          nextSeries: null,
          previousSeries: null,
        },
      };

      const expectedAction = {
        type: types.SET_ACTIVE_SPECIFIC_DATA,
        viewportSpecificData,
      };

      expect(
        actions.setActiveViewportSpecificData(viewportSpecificData)
      ).toEqual(expectedAction);
    });

    it('should create an action to clear clearViewportSpecificData', () => {
      const viewportIndex = 1;
      const expectedAction = {
        type: types.CLEAR_VIEWPORT,
        viewportIndex,
      };
      expect(actions.clearViewportSpecificData(viewportIndex)).toEqual(
        expectedAction
      );
    });

    it('should create an action to set the active viewport', () => {
      const viewportIndex = 1;
      const expectedAction = {
        type: types.SET_VIEWPORT_ACTIVE,
        viewportIndex,
      };
      expect(actions.setViewportActive(viewportIndex)).toEqual(expectedAction);
    });

    it('should create an action to set the viewport layout', () => {
      const numRows = 1;
      const numColumns = 2;
      const viewports = [{ plugin: 'vtk' }, { plugin: 'vtk' }];

      const expectedAction = {
        type: types.SET_VIEWPORT_LAYOUT,
        numRows,
        numColumns,
        viewports,
      };

      expect(actions.setLayout({ numRows, numColumns, viewports })).toEqual(
        expectedAction
      );
    });
  });
});
