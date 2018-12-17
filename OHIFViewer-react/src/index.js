import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import App from './App.js';
import OHIF from 'ohif-core';
import './config';

const store = createStore(OHIF.redux.combinedReducer);

const servers = {
    dicomWeb: [
        {
            "name": "DCM4CHEE",
            "wadoUriRoot": "http://localhost:8080/dcm4chee-arc/aets/DCM4CHEE/wado",
            "qidoRoot": "http://localhost:8080/dcm4chee-arc/aets/DCM4CHEE/rs",
            "wadoRoot": "http://localhost:8080/dcm4chee-arc/aets/DCM4CHEE/rs",
            "qidoSupportsIncludeField": true,
            "imageRendering": "wadors",
            "thumbnailRendering": "wadors",
            "requestOptions": {
                "requestFromBrowser": true,
                "logRequests": true,
                "logResponses": false,
                "logTiming": true,
                "auth": "admin:admin"
            }
        }
    ]
};

OHIF.utils.addServers(servers, store);

// TODO[react] Use a provider when the whole tree is React
window.store = store;

ReactDOM.render(
    <Provider store={store}>
        <BrowserRouter>
            <App store={store}/>
        </BrowserRouter>
    </Provider>,
    document.getElementById('root')
);
