import { Reducer } from 'redux-testkit';

import reducer, { defaultState } from './servers';
import * as types from './../constants/ActionTypes.js';

describe('viewports reducer', () => {
  it('should return the initial state', () => {
    expect(reducer(undefined, {})).toEqual(defaultState);
  });

  it('should result in one server when there were no servers before on ADD_SERVER', () => {
    const initialState = defaultState;

    const action = { type: types.ADD_SERVER, server: { id: 'some-server-id' } };

    const expectedState = { servers: [action.server] };

    Reducer(reducer)
      .withState(initialState)
      .expect(action)
      .toReturnState(expectedState);
  });

  it('should add to servers list on ADD_SERVER', () => {
    const initialState = {
      servers: [
        { id: 'one', active: true },
        { id: 'two', active: true },
        { id: 'three', active: true },
        { id: 'four', active: true },
      ],
    };

    const action = {
      type: types.ADD_SERVER,
      server: { id: 'five', active: true },
    };

    const expectedState = {
      servers: [...initialState.servers, action.server],
    };

    Reducer(reducer)
      .withState(initialState)
      .expect(action)
      .toReturnState(expectedState);
  });

  it('should not add duplicated servers on ADD_SERVER', () => {
    const initialState = {
      servers: [
        { id: 'one', active: true },
        { id: 'two', active: true },
        { id: 'three', active: true },
        { id: 'four', active: true },
      ],
    };

    const action = {
      type: types.ADD_SERVER,
      server: { id: 'two', active: true },
    };

    Reducer(reducer)
      .withState(initialState)
      .expect(action)
      .toReturnState(initialState);
  });

  it('should replace servers on SET_SERVERS', () => {
    const initialState = {
      servers: [{ id: 'one' }, { id: 'two' }, { id: 'three' }, { id: 'four' }],
    };

    const action = {
      type: types.SET_SERVERS,
      servers: [{ id: 'un' }, { id: 'deux' }, { id: 'trois' }],
    };

    const expectedState = {
      servers: action.servers,
    };

    Reducer(reducer)
      .withState(initialState)
      .expect(action)
      .toReturnState(expectedState);
  });
});
