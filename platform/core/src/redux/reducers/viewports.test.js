// https://medium.com/@netxm/testing-redux-reducers-with-jest-6653abbfe3e1
import reducer from './viewports.js';
import * as types from './../constants/ActionTypes.js';

describe('viewports reducer', () => {
  it('should return the initial state', () => {
    expect(reducer(undefined, {})).toEqual({
      activeViewportIndex: 0,
      layout: {
        viewports: [
          {
            height: '100%',
            width: '100%',
          },
        ],
      },
      viewportSpecificData: {},
    });
  });

  it('should handle SET_VIEWPORT_ACTIVE', () => {
    const setViewportActiveAction = {
      type: types.SET_VIEWPORT_ACTIVE,
      viewportIndex: 100,
    };

    const updatedState = reducer({}, setViewportActiveAction);

    expect(updatedState.activeViewportIndex).toEqual(
      setViewportActiveAction.viewportIndex
    );
  });

  it('should handle SET_VIEWPORT_LAYOUT', () => {
    const setViewportLayoutAction = {
      type: types.SET_VIEWPORT_LAYOUT,
      layout: {
        viewports: [
          {
            height: '100%',
            width: '50%',
          },
          {
            height: '100%',
            width: '50%',
          },
        ],
      },
    };

    const updatedState = reducer({}, setViewportLayoutAction);

    expect(updatedState.layout).toEqual(setViewportLayoutAction.layout);
  });

  // If there were previous keys, this would have
  // "merge" behavior, not a clear & set
  // May be worth another test?
  it('should handle SET_VIEWPORT', () => {
    const viewportToSet = 0;
    const setViewportAction = {
      type: types.SET_VIEWPORT,
      viewportIndex: viewportToSet,
      data: {
        hello: 'this is that data for the viewport',
        world: 'that will be set for the viewportIndex',
      },
    };

    const updatedState = reducer(undefined, setViewportAction);
    const updatedViewport = updatedState.viewportSpecificData[viewportToSet];

    expect(updatedViewport).toEqual(setViewportAction.data);
  });

  it('should handle CLEAR_VIEWPORT', () => {
    const existingViewportData = {
      viewportSpecificData: {
        0: {
          viewportProperty: 'hello world',
        },
        1: {
          viewportProperty: 'fizzbuzz',
        },
      },
    };
    const clearViewportAction = {
      type: types.CLEAR_VIEWPORT,
      viewportIndex: 1,
    };

    const updatedState = reducer(existingViewportData, clearViewportAction);
    const clearedViewport =
      updatedState.viewportSpecificData[clearViewportAction.viewportIndex];
    const originalOtherViewport = existingViewportData.viewportSpecificData[0];
    const updatedOtherViewport = updatedState.viewportSpecificData[0];

    expect(clearedViewport).toEqual({});
    expect(updatedOtherViewport).toEqual(originalOtherViewport);
  });
});
