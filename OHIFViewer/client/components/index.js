import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import App from './App.js';
import { OHIF } from 'meteor/ohif:core';

const store = createStore(OHIF.viewerbase.redux.combinedReducer);

// TODO[react] Use a provider when the whole tree is React
window.store = store;

Meteor.startup(() => {
    ReactDOM.render(
        <Provider store={store}>
            <BrowserRouter>
                <App store={store}/>
            </BrowserRouter>
        </Provider>,
        document.getElementById('root')
    );
});
