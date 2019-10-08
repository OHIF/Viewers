import * as types from './constants/ActionTypes.js';

import actions from './actions.js';

describe('actions', () => {
  test('exports have not changed', () => {
    const expectedExports = [
      'setViewportActive',
      'updateViewport',
      'setLayout',
      'clearViewportSpecificData',
      'setStudyLoadingProgress',
      'clearStudyLoadingProgress',
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
      const layout = {
        viewports: [
          {
            height: '100%',
            width: '100%',
          },
        ],
      };
      const expectedAction = {
        type: types.SET_VIEWPORT_LAYOUT,
        layout,
      };
      expect(actions.setLayout(layout)).toEqual(expectedAction);
    });
  });
});
