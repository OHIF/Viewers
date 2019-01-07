import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { createStore, combineReducers } from 'redux';
import App from './App.js';
import OHIF from 'ohif-core';
import './config';
import ui from './redux/ui.js'
import Icons from "./images/icons.svg"

const reducers = OHIF.redux.reducers;
reducers.ui = ui;

const combined = combineReducers(reducers)
const store = createStore(combined);

const defaultButtons = [
    {
        command: 'Pan',
        type: 'tool',
        text: 'Pan',
        svgUrl: `${Icons}#icon-tools-pan`,
        active: false
    },
    {
        command: 'Zoom',
        type: 'tool',
        text: 'Zoom',
        svgUrl: `${Icons}#icon-tools-zoom`,
        active: false
    },
    {
        command: 'Bidirectional',
        type: 'tool',
        text: 'Bidirectional',
        svgUrl: `${Icons}#icon-tools-measure-target`,
        active: false
    },
    {
        command: 'StackScroll',
        type: 'tool',
        text: 'Stack Scroll',
        svgUrl: `${Icons}#icon-tools-stack-scroll`,
        active: false
    },
    {
        command: 'reset',
        type: 'command',
        text: 'Reset',
        svgUrl: `${Icons}#icon-tools-reset`,
        active: false
    },
    {
        command: 'Wwwc',
        type: 'tool',
        text: 'Manual',
        svgUrl: `${Icons}#icon-tools-levels`,
        active: true
    },
];

store.dispatch({
    type: 'SET_AVAILABLE_BUTTONS',
    buttons: defaultButtons
});

const servers = {
    dicomWeb: [
        {
            "name": "DCM4CHEE",
            //"wadoUriRoot": "http://localhost:8080/dcm4chee-arc/aets/DCM4CHEE/wado",
            //"qidoRoot": "http://localhost:8080/dcm4chee-arc/aets/DCM4CHEE/rs",
            //"wadoRoot": "http://localhost:8080/dcm4chee-arc/aets/DCM4CHEE/rs",
            "wadoUriRoot": "https://dcm4che.ohif.club/dcm4chee-arc/aets/DCM4CHEE/wado",
            "qidoRoot": "https://dcm4che.ohif.club/dcm4chee-arc/aets/DCM4CHEE/rs",
            "wadoRoot": "https://dcm4che.ohif.club/dcm4chee-arc/aets/DCM4CHEE/rs",
            "qidoSupportsIncludeField": true,
            "imageRendering": "wadors",
            "thumbnailRendering": "wadors",
            "requestOptions": {
                "requestFromBrowser": true,
                "logRequests": true,
                "logResponses": false,
                "logTiming": true,
                //"auth": "admin:admin"
                "auth": "cloud:healthcare"
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
