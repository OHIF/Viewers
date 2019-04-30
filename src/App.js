import React, { Component } from 'react'
import { BrowserRouter as Router } from 'react-router-dom'
import { Provider } from 'react-redux'
import { createStore, combineReducers } from 'redux'
import PropTypes from 'prop-types'
import OHIF from 'ohif-core'
import './config'
import ui from './redux/ui.js'
import OHIFStandaloneViewer from './OHIFStandaloneViewer'
import WhiteLabellingContext from './WhiteLabellingContext'
import OHIFCornerstoneExtension from 'ohif-cornerstone-extension'
import OHIFVTKExtension from 'ohif-vtk-extension'
import OHIFDicomPDFExtension from 'ohif-dicom-pdf-extension'
import OHIFDicomHtmlExtension from 'ohif-dicom-html-extension'
import OHIFDicomMicroscopyExtension from 'ohif-dicom-microscopy-extension'
import { OidcProvider, reducer as oidcReducer } from 'redux-oidc'
import {
  getUserManagerForOpenIdConnectClient,
  initWebWorkers,
} from './utils/index.js'

const Icons = 'icons.svg'
const { ExtensionManager } = OHIF.extensions
const { reducers, localStorage } = OHIF.redux

reducers.ui = ui
reducers.oidc = oidcReducer

const combined = combineReducers(reducers)
const store = createStore(combined, localStorage.loadState())

store.subscribe(() => {
  localStorage.saveState({
    preferences: store.getState().preferences,
  })
})

const defaultButtons = [
  {
    command: 'StackScroll',
    type: 'tool',
    text: 'Stack Scroll',
    svgUrl: `${Icons}#icon-tools-stack-scroll`,
    active: false,
  },
  {
    command: 'Zoom',
    type: 'tool',
    text: 'Zoom',
    svgUrl: `${Icons}#icon-tools-zoom`,
    active: false,
  },
  {
    command: 'Wwwc',
    type: 'tool',
    text: 'Levels',
    svgUrl: `${Icons}#icon-tools-levels`,
    active: true,
  },
  {
    command: 'Pan',
    type: 'tool',
    text: 'Pan',
    svgUrl: `${Icons}#icon-tools-pan`,
    active: false,
  },
  {
    command: 'Length',
    type: 'tool',
    text: 'Length',
    svgUrl: `${Icons}#icon-tools-measure-temp`,
    active: false,
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
    active: false,
  },
  {
    command: 'Bidirectional',
    type: 'tool',
    text: 'Bidirectional',
    svgUrl: `${Icons}#icon-tools-measure-target`,
    active: false,
  },
  {
    command: 'Brush',
    type: 'tool',
    text: 'Brush',
    iconClasses: 'fa fa-circle',
    active: false,
  },
  {
    command: 'FreehandMouse',
    type: 'tool',
    text: 'Freehand',
    iconClasses: 'fa fa-star',
    active: false,
  },
  {
    command: 'reset',
    type: 'command',
    text: 'Reset',
    svgUrl: `${Icons}#icon-tools-reset`,
    active: false,
  },
]

const buttonsAction = OHIF.redux.actions.setAvailableButtons(defaultButtons)

store.dispatch(buttonsAction)

const availableTools = [
  { name: 'Pan', mouseButtonMasks: [1, 4] },
  { name: 'Zoom', mouseButtonMasks: [1, 2] },
  { name: 'Wwwc', mouseButtonMasks: [1] },
  { name: 'Bidirectional', mouseButtonMasks: [1] },
  { name: 'Length', mouseButtonMasks: [1] },
  { name: 'Angle', mouseButtonMasks: [1] },
  { name: 'StackScroll', mouseButtonMasks: [1] },
  { name: 'Brush', mouseButtonMasks: [1] },
  { name: 'FreehandMouse', mouseButtonMasks: [1] },
  { name: 'PanMultiTouch' },
  { name: 'ZoomTouchPinch' },
  { name: 'StackScrollMouseWheel' },
  { name: 'StackScrollMultiTouch' },
]

const toolAction = OHIF.redux.actions.setExtensionData('cornerstone', {
  availableTools,
})

store.dispatch(toolAction)

/** TODO: extensions should be passed in as prop as soon as we have the extensions as separate packages and then registered by ExtensionsManager */
const extensions = [
  new OHIFCornerstoneExtension({}),
  new OHIFVTKExtension(),
  new OHIFDicomPDFExtension(),
  new OHIFDicomHtmlExtension(),
  new OHIFDicomMicroscopyExtension(),
]
ExtensionManager.registerExtensions(store, extensions)

// TODO[react] Use a provider when the whole tree is React
window.store = store

function handleServers(servers) {
  if (servers) {
    OHIF.utils.addServers(servers, store)
  }
}

class App extends Component {
  static propTypes = {
    routerBasename: PropTypes.string,
    relativeWebWorkerScriptsPath: PropTypes.string,
    //
    servers: PropTypes.object,
    oidc: PropTypes.array,
    userManager: PropTypes.object,
    location: PropTypes.object,
    whiteLabelling: PropTypes.object,
  }

  static defaultProps = {
    routerBasename: '/',
    relativeWebWorkerScriptsPath: '',
    whiteLabelling: {},
  }

  constructor(props) {
    super(props)

    this.userManager = getUserManagerForOpenIdConnectClient(
      store,
      this.props.oidc
    )
    handleServers(this.props.servers)
    initWebWorkers(
      this.props.routerBasename,
      this.props.relativeWebWorkerScriptsPath
    )
  }

  render() {
    const userManager = this.userManager

    if (userManager) {
      return (
        <Provider store={store}>
          <OidcProvider store={store} userManager={userManager}>
            <Router basename={this.props.routerBasename}>
              <WhiteLabellingContext.Provider value={this.props.whiteLabelling}>
                <OHIFStandaloneViewer userManager={userManager} />
              </WhiteLabellingContext.Provider>
            </Router>
          </OidcProvider>
        </Provider>
      )
    }

    return (
      <Provider store={store}>
        <Router basename={this.props.routerBasename}>
          <WhiteLabellingContext.Provider value={this.props.whiteLabelling}>
            <OHIFStandaloneViewer />
          </WhiteLabellingContext.Provider>
        </Router>
      </Provider>
    )
  }
}

export default App
