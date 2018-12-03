import { combineReducers } from 'redux';
import tools from './tools.js';
import viewports from './viewports.js';

const combinedReducer = combineReducers({
    tools,
    viewports
});

export default combinedReducer;
