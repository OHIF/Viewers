import { Reducer } from 'redux-testkit';

import reducer, { DEFAULT_STATE } from './viewports.js';
import * as types from './../constants/ActionTypes.js';

describe('viewports reducer', () => {
  it('should return the initial state', () => {
    expect(reducer(undefined, {})).toEqual(DEFAULT_STATE);
  });

  it('should handle SET_VIEWPORT_ACTIVE with inexistent viewport index', () => {
    const initialState = {
      numRows: 4,
      numColumns: 4,
      activeViewportIndex: 0,
    };

    const action = {
      type: types.SET_VIEWPORT_ACTIVE,
      viewportIndex: 100,
    };

    const expectedToChangeInState = {
      activeViewportIndex: 0,
    };

    Reducer(reducer)
      .withState(initialState)
      .expect(action)
      .toChangeInState(expectedToChangeInState);
  });

  it('should handle SET_VIEWPORT_ACTIVE with existent viewport index', () => {
    const initialState = {
      numRows: 4,
      numColumns: 4,
      activeViewportIndex: 0,
    };

    const action = {
      type: types.SET_VIEWPORT_ACTIVE,
      viewportIndex: 5,
    };

    const expectedToChangeInState = {
      activeViewportIndex: 5,
    };

    Reducer(reducer)
      .withState(initialState)
      .expect(action)
      .toChangeInState(expectedToChangeInState);
  });

  it('should handle SET_VIEWPORT_LAYOUT', () => {
    const initialState = DEFAULT_STATE;

    const action = {
      type: types.SET_VIEWPORT_LAYOUT,
      numRows: 1,
      numColumns: 2,
      viewports: [
        {
          plugin: 'cornerstone',
        },
        {
          plugin: 'vtk',
        },
      ],
    };

    const expectedToChangeInState = {
      numRows: 1,
      numColumns: 2,
      layout: {
        viewports: [
          {
            plugin: 'cornerstone',
          },
          {
            plugin: 'vtk',
          },
        ],
      },
    };

    Reducer(reducer)
      .withState(initialState)
      .expect(action)
      .toChangeInState(expectedToChangeInState);
  });

  it('should handle SET_VIEWPORT_LAYOUT when we reduce the number of viewports', () => {
    const initialState = {
      numRows: 1,
      numColumns: 2,
      viewportSpecificData: {
        0: { viewportData0: 'viewportData0' },
        1: { viewportData1: 'viewportData1' },
      },
      layout: {
        viewports: [],
      },
      activeViewportIndex: 0,
    };

    const action = {
      type: types.SET_VIEWPORT_LAYOUT,
      numRows: 1,
      numColumns: 1,
      viewports: [],
    };

    const expectedState = {
      numRows: 1,
      numColumns: 1,
      viewportSpecificData: {
        0: { viewportData0: 'viewportData0' },
      },
      layout: {
        viewports: [],
      },
      activeViewportIndex: 0,
    };

    Reducer(reducer)
      .withState(initialState)
      .expect(action)
      .toReturnState(expectedState);
  });

  it('should handle SET_VIEWPORT_LAYOUT_AND_DATA', () => {
    const initialState = {
      numRows: 1,
      numColumns: 1,
      viewportSpecificData: {
        0: { viewportData0: 'data0' },
      },
      layout: {
        viewports: [{ plugin: 'cornerstone' }],
      },
      activeViewportIndex: 0,
    };

    const action = {
      type: types.SET_VIEWPORT_LAYOUT_AND_DATA,
      numRows: 1,
      numColumns: 2,
      viewports: [{ plugin: 'cornerstone' }, { plugin: 'cornerstone' }],
      viewportSpecificData: {
        0: { viewportData0: 'NEWdata0' },
        1: { viewportData1: 'NEWdata1' },
      },
    };

    const expectedState = {
      numRows: 1,
      numColumns: 2,
      viewportSpecificData: {
        0: { viewportData0: 'NEWdata0' },
        1: { viewportData1: 'NEWdata1' },
      },
      layout: {
        viewports: [{ plugin: 'cornerstone' }, { plugin: 'cornerstone' }],
      },
      activeViewportIndex: 0,
    };

    Reducer(reducer)
      .withState(initialState)
      .expect(action)
      .toReturnState(expectedState);
  });

  it('should handle SET_VIEWPORT_LAYOUT_AND_DATA when we reduce the number of viewports', () => {
    const initialState = {
      numRows: 1,
      numColumns: 3,
      viewportSpecificData: {
        0: { viewportData0: 'vtkData0' },
        1: { viewportData1: 'vtkData1' },
        2: { viewportData2: 'vtkData2' },
      },
      layout: {
        viewports: [{ plugin: 'vtk' }, { plugin: 'vtk' }, { plugin: 'vtk' }],
      },
      activeViewportIndex: 0,
    };

    const action = {
      type: types.SET_VIEWPORT_LAYOUT_AND_DATA,
      numRows: 1,
      numColumns: 1,
      viewports: [{ plugin: 'cornerstone' }],
      viewportSpecificData: {
        0: { viewportData0: 'cornerstoneData0' },
      },
    };

    const expectedState = {
      numRows: 1,
      numColumns: 1,
      viewportSpecificData: {
        0: { viewportData0: 'cornerstoneData0' },
      },
      layout: {
        viewports: [{ plugin: 'cornerstone' }],
      },
      activeViewportIndex: 0,
    };

    Reducer(reducer)
      .withState(initialState)
      .expect(action)
      .toReturnState(expectedState);
  });

  it('should handle SET_VIEWPORT when we only set one viewport specific data', () => {
    const initialState = {
      numRows: 1,
      numColumns: 2,
      viewportSpecificData: {
        0: { viewportData0: 'data0' },
        1: { viewportData1: 'data1' },
      },
      layout: {
        viewports: [{ plugin: 'cornerstone' }, { plugin: 'cornerstone' }],
      },
      activeViewportIndex: 0,
    };

    const action = {
      type: types.SET_VIEWPORT,
      viewportIndex: 1,
      viewportSpecificData: {
        viewportData1: 'NEWdata1',
      },
    };

    const expectedState = {
      numRows: 1,
      numColumns: 2,
      viewportSpecificData: {
        0: { viewportData0: 'data0' },
        1: { viewportData1: 'NEWdata1' },
      },
      layout: {
        viewports: [{ plugin: 'cornerstone' }, { plugin: 'cornerstone' }],
      },
      activeViewportIndex: 0,
    };

    Reducer(reducer)
      .withState(initialState)
      .expect(action)
      .toReturnState(expectedState);
  });

  it('should handle SET_VIEWPORT', () => {
    const viewportToSet = 0;
    const setViewportAction = {
      type: types.SET_VIEWPORT,
      viewportIndex: viewportToSet,
      viewportSpecificData: {
        hello: 'this is that data for the viewport',
        world: 'that will be set for the viewportIndex',
      },
    };

    const updatedState = reducer(undefined, setViewportAction);
    const updatedViewport = updatedState.viewportSpecificData[viewportToSet];

    expect(updatedViewport).toEqual(setViewportAction.viewportSpecificData);
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
