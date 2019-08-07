import { applyMiddleware, combineReducers, createStore } from "redux";

// import { createLogger } from 'redux-logger';
import layoutReducers from "./layout/reducers.js";
import { reducer as oidcReducer } from "redux-oidc";
import { redux } from "@ohif/core";
import thunkMiddleware from "redux-thunk";

// Combine our ohif-core, ui, and oidc reducers
// Set init data, using values found in localStorage
const { reducers, localStorage } = redux;
// const loggerMiddleware = createLogger();

reducers.ui = layoutReducers;
reducers.oidc = oidcReducer;

const rootReducer = combineReducers(reducers);
const store = createStore(
  rootReducer,
  localStorage.loadState(), // preloadedState
  applyMiddleware(
    thunkMiddleware // Lets us dispatch() functions
    // loggerMiddleware // neat middleware that logs actions
  )
);

// When the store's preferences change,
// Update our cached preferences in localStorage
store.subscribe(() => {
  localStorage.saveState({
    preferences: store.getState().preferences
  });
});

export default store;
