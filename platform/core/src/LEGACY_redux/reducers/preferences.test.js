import { Reducer } from 'redux-testkit';

import reducer, { defaultState } from './preferences';
import { SET_USER_PREFERENCES } from './../constants/ActionTypes.js';

describe('preferences reducer', () => {
  it('should return the initial state', () => {
    expect(reducer(undefined, {})).toEqual(defaultState);
  });

  it('should set user preferences state and properly merge with current state', () => {
    const initialState = defaultState;

    const action = {
      type: SET_USER_PREFERENCES,
      state: { generalPreferences: { language: 'es' } },
    };

    const expectedState = {
      windowLevelData: defaultState.windowLevelData,
      generalPreferences: {
        language: 'es',
      },
    };

    Reducer(reducer)
      .withState(initialState)
      .expect(action)
      .toReturnState(expectedState);
  });
});
