import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { createStore, combineReducers } from 'redux';
import { loadUser, reducer as oidcReducer, OidcProvider} from 'redux-oidc';
import OHIF from 'ohif-core';
import OHIFCornerstoneViewportPlugin from "./connectedComponents/OHIFCornerstoneViewportPlugin/OHIFCornerstoneViewportPlugin.js";
import './config';
import ui from './redux/ui.js';
import App from './App.js';
import userManager from './userManager.js';
import ConnectedExampleViewportPlugin from './components/ConnectedExampleViewportPlugin.js';

const reducers = OHIF.redux.reducers;
reducers.ui = ui;
reducers.oidc = oidcReducer;

const Icons = '/icons.svg';

const combined = combineReducers(reducers)

const store = createStore(combined);
loadUser(store, userManager);

const defaultButtons = [
    {
        command: 'StackScroll',
        type: 'tool',
        text: 'Stack Scroll',
        svgUrl: `${Icons}#icon-tools-stack-scroll`,
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
        command: 'Wwwc',
        type: 'tool',
        text: 'Levels',
        svgUrl: `${Icons}#icon-tools-levels`,
        active: true
    },
    {
        command: 'Pan',
        type: 'tool',
        text: 'Pan',
        svgUrl: `${Icons}#icon-tools-pan`,
        active: false
    },
    {
        command: 'Length',
        type: 'tool',
        text: 'Length',
        svgUrl: `${Icons}#icon-tools-measure-temp`,
        active: false
    },
    /*{
        command: 'Annotate',
        type: 'tool',
        text: 'Annotate',
        svgUrl: `${Icons}#icon-tools-measure-non-target`,
        active: false
    },*/
    {
        command: 'Angle',
        type: 'tool',
        text: 'Angle',
        iconClasses: 'fa fa-angle-left',
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
        command: 'reset',
        type: 'command',
        text: 'Reset',
        svgUrl: `${Icons}#icon-tools-reset`,
        active: false
    },
];

const buttonsAction = OHIF.redux.actions.setAvailableButtons(defaultButtons);

store.dispatch(buttonsAction);

// Uncomment this and comment the Cornerstone version to see how the
// example plugin works
/*const pluginAction = OHIF.redux.actions.addPlugin({
  id: 'example',
  type: 'viewport',
  component: ConnectedExampleViewportPlugin
});*/

const pluginAction = OHIF.redux.actions.addPlugin({
  id: 'cornerstone',
  type: 'viewport',
  component: OHIFCornerstoneViewportPlugin
});

store.dispatch(pluginAction);

const servers = {
    dicomWeb: [
        {
            "name": "DCM4CHEE",
            //"wadoUriRoot": "http://localhost:8080/dcm4chee-arc/aets/DCM4CHEE/wado",
            //"qidoRoot": "http://localhost:8080/dcm4chee-arc/aets/DCM4CHEE/rs",
            //"wadoRoot": "http://localhost:8080/dcm4chee-arc/aets/DCM4CHEE/rs",
            //"wadoUriRoot": "https://dcm4che.ohif.club/dcm4chee-arc/aets/DCM4CHEE/wado",
            //"qidoRoot": "https://dcm4che.ohif.club/dcm4chee-arc/aets/DCM4CHEE/rs",
            //"wadoRoot": "https://dcm4che.ohif.club/dcm4chee-arc/aets/DCM4CHEE/rs",
            "wadoUriRoot": "https://cancer.crowds-cure.org/dcm4chee-arc/aets/DCM4CHEE/wado",
            "qidoRoot": "https://cancer.crowds-cure.org/dcm4chee-arc/aets/DCM4CHEE/rs",
            "wadoRoot": "https://cancer.crowds-cure.org/dcm4chee-arc/aets/DCM4CHEE/rs",
            "qidoSupportsIncludeField": true,
            "imageRendering": "wadors",
            "thumbnailRendering": "wadors",
            "requestOptions": {
                "requestFromBrowser": true,
                "logRequests": true,
                "logResponses": false,
                "logTiming": true,
                //"auth": "admin:admin"
                //"auth": "cloud:healthcare"
            }
        }
    ]
};

OHIF.utils.addServers(servers, store);

// TODO[react] Use a provider when the whole tree is React
window.store = store;

ReactDOM.render(
    <Provider store={store}>
        <OidcProvider store={store} userManager={userManager}>
            <BrowserRouter>
                <App/>
            </BrowserRouter>
        </OidcProvider>
    </Provider>,
    document.getElementById('root')
);
