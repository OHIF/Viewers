import { Reducer } from 'redux-testkit';

import reducer, { defaultState } from './extensions';
import * as actionTypes from './../constants/ActionTypes.js';

describe('viewports reducer', () => {
  it('should return the initial state', () => {
    expect(reducer(undefined, {})).toEqual(defaultState);
  });

  it('should set new data on first SET_EXTENSION_DATA', () => {
    const initialState = defaultState;

    const action = {
      type: actionTypes.SET_EXTENSION_DATA,
      extension: 'uber plugin',
      data: { greeting: 'Hello!' },
    };

    const expectedState = {
      'uber plugin': { greeting: 'Hello!' },
    };

    Reducer(reducer)
      .withState(initialState)
      .expect(action)
      .toReturnState(expectedState);
  });

  it('should shallow-merge extension data, keeping unmodified fields, on SET_EXTENSION_DATA', () => {
    const initialState = {
      'uber plugin': { greeting: 'Hello!', "Can't touch this": 42 },
    };

    const action = {
      type: actionTypes.SET_EXTENSION_DATA,
      extension: 'uber plugin',
      data: { greeting: 'Aloha!' },
    };

    const expectedState = {
      'uber plugin': { greeting: 'Aloha!', "Can't touch this": 42 },
    };

    Reducer(reducer)
      .withState(initialState)
      .expect(action)
      .toReturnState(expectedState);
  });
});
