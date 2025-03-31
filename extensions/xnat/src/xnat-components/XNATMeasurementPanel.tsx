import React from 'react';
import PropTypes from 'prop-types';
import cornerstone from 'cornerstone-core';
import csTools from 'cornerstone-tools';
import MenuIOButtons from './common/MenuIOButtons.js';
import onIOCancel from './common/helpers/onIOCancel.js';
import {
  xnatMeasurementApi,
  MeasurementWorkingCollection,
  MeasurementImportedCollection,
  MeasurementExportMenu,
  MeasurementImportMenu,
  assignViewportParameters,
} from '../XNATMeasurement';
import { refreshViewports, XNAT_EVENTS } from '../utils/index.js';
import sessionMap from '../utils/sessionMap.js';

import './XNATRoiPanel.styl';

export default class XNATMeasurementPanel extends React.Component {
  static propTypes = {
    isOpen: PropTypes.any,
    studies: PropTypes.any,
    viewports: PropTypes.any,
    activeIndex: PropTypes.any,
    onJumpToItem: PropTypes.func.isRequired,
  };

  static defaultProps = {
    isOpen: undefined,
    studies: undefined,
    viewports: undefined,
    activeIndex: undefined,
  };

  constructor(props = {}) {
    super(props);

    const { viewports, activeIndex } = props;

    const displaySetInstanceUID = viewports[activeIndex].displaySetInstanceUID;

    const seriesCollection = xnatMeasurementApi.getMeasurementCollections(
      displaySetInstanceUID
    );

    this.state = {
      importing: false,
      exporting: false,
      showSettings: false,
      displaySetInstanceUID,
      seriesCollection,
      selectedKey: '',
    };

    this.onIOComplete = this.onIOComplete.bind(this);
    this.onIOCancel = onIOCancel.bind(this);
    this.cornerstoneEventListenerHandler = this.cornerstoneEventListenerHandler.bind(
      this
    );
    this.addEventListeners = this.addEventListeners.bind(this);
    this.removeEventListeners = this.removeEventListeners.bind(this);
    this.onItemRemove = this.onItemRemove.bind(this);
    this.onJumpToItem = this.onJumpToItem.bind(this);
    this.onResetViewport = this.onResetViewport.bind(this);
    this.onUnlockImportedCollection = this.onUnlockImportedCollection.bind(
      this
    );
    this.onRemoveImportedCollection = this.onRemoveImportedCollection.bind(
      this
    );

    this.addEventListeners();
  }

  componentDidUpdate(prevProps) {
    const { viewports, activeIndex } = this.props;
    const { displaySetInstanceUID } = this.state;

    if (
      viewports[activeIndex] &&
      viewports[activeIndex].displaySetInstanceUID !== displaySetInstanceUID
    ) {
      this.refreshMeasurementList();
    }
  }

  componentWillUnmount() {
    this.removeEventListeners();
  }

  addEventListeners() {
    this.removeEventListeners();

    csTools.store.state.enabledElements.forEach(enabledElement => {
      // enabledElement.addEventListener(
      //   XNAT_EVENTS.MEASUREMENT_ADDED,
      //   this.cornerstoneEventListenerHandler
      // );
      enabledElement.addEventListener(
        XNAT_EVENTS.MEASUREMENT_REMOVED,
        this.cornerstoneEventListenerHandler
      );
      enabledElement.addEventListener(
        XNAT_EVENTS.MEASUREMENT_MODIFIED,
        this.cornerstoneEventListenerHandler
      );
      enabledElement.addEventListener(
        XNAT_EVENTS.MEASUREMENT_COMPLETED,
        this.cornerstoneEventListenerHandler
      );
    });
  }

  removeEventListeners() {
    csTools.store.state.enabledElements.forEach(enabledElement => {
      // enabledElement.removeEventListener(
      //   XNAT_EVENTS.MEASUREMENT_ADDED,
      //   this.cornerstoneEventListenerHandler
      // );
      enabledElement.removeEventListener(
        XNAT_EVENTS.MEASUREMENT_REMOVED,
        this.cornerstoneEventListenerHandler
      );
      enabledElement.removeEventListener(
        XNAT_EVENTS.MEASUREMENT_MODIFIED,
        this.cornerstoneEventListenerHandler
      );
      enabledElement.removeEventListener(
        XNAT_EVENTS.MEASUREMENT_COMPLETED,
        this.cornerstoneEventListenerHandler
      );
    });
  }

  cornerstoneEventListenerHandler() {
    this.refreshMeasurementList();
  }

  refreshMeasurementList() {
    const { viewports, activeIndex } = this.props;
    if (viewports[activeIndex]) {
      const { displaySetInstanceUID } = viewports[activeIndex];
      const seriesCollection = xnatMeasurementApi.getMeasurementCollections(
        displaySetInstanceUID
      );
      this.setState({ displaySetInstanceUID, seriesCollection });
    }
  }

  onJumpToItem(measurement, switchViewport = false) {
    const { viewports, activeIndex, onJumpToItem } = this.props;

    const enabledElements = cornerstone.getEnabledElements();
    const element = enabledElements[activeIndex].element;
    const toolState = csTools.getToolState(element, 'stack');

    if (!toolState) {
      return;
    }

    const { internal, viewport: itemViewport } = measurement;
    const { imageId } = internal;

    const imageIds = toolState.data[0].imageIds;
    const frameIndex = imageIds.indexOf(imageId);
    const SOPInstanceUID = cornerstone.metaData.get('SOPInstanceUID', imageId);
    const StudyInstanceUID = cornerstone.metaData.get(
      'StudyInstanceUID',
      imageId
    );

    const jumpToData = {
      StudyInstanceUID,
      SOPInstanceUID,
      frameIndex,
      activeViewportIndex: activeIndex,
      displaySetInstanceUID: viewports[activeIndex].displaySetInstanceUID,
    };

    if (switchViewport) {
      const viewport = cornerstone.getViewport(element);
      assignViewportParameters(viewport, itemViewport);
      cornerstone.setViewport(element, viewport);
      jumpToData.windowingType = 'Manual';
    }

    onJumpToItem(jumpToData);
  }

  onResetViewport(measurement) {
    const { activeIndex } = this.props;
    const itemViewport = measurement.viewport;

    const enabledElements = cornerstone.getEnabledElements();
    const element = enabledElements[activeIndex].element;
    const viewport = cornerstone.getViewport(element);
    assignViewportParameters(itemViewport, viewport);
  }

  onItemRemove(measurementReference) {
    xnatMeasurementApi.removeMeasurement(measurementReference, true);
    refreshViewports();
    this.refreshMeasurementList();
  }

  onIOComplete() {
    this.setState({
      importing: false,
      exporting: false,
    });
  }

  onUnlockImportedCollection(collectionUuid) {
    const { displaySetInstanceUID } = this.state;
    xnatMeasurementApi.unlockImportedCollection(
      collectionUuid,
      displaySetInstanceUID
    );
    this.refreshMeasurementList();
  }

  onRemoveImportedCollection(collectionUuid) {
    const { displaySetInstanceUID } = this.state;
    xnatMeasurementApi.removeImportedCollection(
      collectionUuid,
      displaySetInstanceUID
    );
    refreshViewports();
    this.refreshMeasurementList();
  }

  render() {
    const {
      importing,
      exporting,
      showSettings,
      displaySetInstanceUID,
      seriesCollection,
      selectedKey,
    } = this.state;

    if (!seriesCollection) {
      return <div />;
    }

    const { viewports, activeIndex } = this.props;

    let exportDisabledMessage;
    if (!sessionMap.hasCreatePermission()) {
      exportDisabledMessage = 'Measurements export is not permitted.';
    }

    let component;

    if (showSettings) {
      component = <div>Measurement Settings</div>;
    } else if (importing) {
      const { SeriesInstanceUID } = viewports[activeIndex];
      component = (
        <MeasurementImportMenu
          onImportComplete={this.onIOComplete}
          onImportCancel={this.onIOCancel}
          SeriesInstanceUID={SeriesInstanceUID}
          displaySetInstanceUID={displaySetInstanceUID}
          seriesCollection={seriesCollection}
        />
      );
    } else if (exporting) {
      component = (
        <MeasurementExportMenu
          onExportComplete={this.onIOComplete}
          onExportCancel={this.onIOCancel}
          seriesCollection={seriesCollection}
        />
      );
    } else {
      component = (
        <div
          className="xnatPanel"
          onClick={() => this.setState({ selectedKey: '' })}
        >
          <div className="panelHeader">
            <div className="title-with-icon">
              <h3>Measurement Annotations</h3>
            </div>
            <MenuIOButtons
              ImportCallbackOrComponent={MeasurementImportMenu}
              ExportCallbackOrComponent={MeasurementExportMenu}
              onImportButtonClick={() => this.setState({ importing: true })}
              onExportButtonClick={() => this.setState({ exporting: true })}
              exportDisabledMessage={exportDisabledMessage}
            />
          </div>

          <div className="roiCollectionBody">
            <div className="workingCollectionHeader">
              <h4> In-Progress Measurement Collection </h4>
            </div>
            {/* WORKING COLLECTION */}
            <MeasurementWorkingCollection
              collection={seriesCollection.workingCollection}
              selectedKey={selectedKey}
              onItemRemove={this.onItemRemove}
              onJumpToItem={this.onJumpToItem}
              onResetViewport={this.onResetViewport}
            />
            {/* IMPORTED COLLECTIONS */}
            {seriesCollection.importedCollections.length !== 0 && (
              <>
                <div className="lockedCollectionHeader">
                  <h4> Imported Measurement Collections </h4>
                </div>
                {seriesCollection.importedCollections.map(
                  importedCollection => (
                    <MeasurementImportedCollection
                      key={importedCollection.metadata.uuid}
                      collection={importedCollection}
                      onJumpToItem={this.onJumpToItem}
                      onUnlockCollection={this.onUnlockImportedCollection}
                      onRemoveCollection={this.onRemoveImportedCollection}
                    />
                  )
                )}
              </>
            )}
          </div>
        </div>
      );
    }

    return <React.Fragment>{component}</React.Fragment>;
  }
}
