import { combineReducers, createStore } from 'redux';

import layoutReducers from './layout/reducers.js';
import { reducer as oidcReducer } from 'redux-oidc';
import { redux } from 'ohif-core';

// Combine our ohif-core, ui, and oidc reducers
// Set init data, using values found in localStorage
const { reducers, localStorage } = redux;

reducers.ui = layoutReducers;
reducers.oidc = oidcReducer;

const combined = combineReducers(reducers);
const store = createStore(combined, localStorage.loadState());

// When the store's preferences change,
// Update our cached preferences in localStorage
store.subscribe(() => {
  localStorage.saveState({
    preferences: store.getState().preferences,
  });
});

export default store;
