import React from 'react';
import PropTypes from 'prop-types';
import cornerstone from 'cornerstone-core';
import csTools from 'cornerstone-tools';
import MenuIOButtons from './common/MenuIOButtons.js';
import WorkingCollectionList from './XNATContourMenu/WorkingCollectionList.js';
import LockedCollectionsList from './XNATContourMenu/LockedCollectionsList.js';
import ContourPanelSettings from './XNATContourMenu/ContourPanelSettings.js';
import unlockStructureSet from '../utils/unlockStructureSet.js';
import onIOCancel from './common/helpers/onIOCancel.js';
import getSeriesInstanceUidFromViewport from '../utils/getSeriesInstanceUidFromViewport.js';
import XNATContourExportMenu from './XNATContourExportMenu/XNATContourExportMenu.js';
import XNATContourImportMenu from './XNATContourImportMenu/XNATContourImportMenu.js';
import { refreshViewports, removeContourRoi, XNAT_EVENTS } from '../utils/index.js';
import { Icon } from '@ohif/ui';
import sessionMap from '../utils/sessionMap';

import './XNATRoiPanel.styl';

const modules = csTools.store.modules;

/**
 * @class XNATContourMenu - Renders a menu for importing, exporting, creating
 * and renaming ROI Contours. As well as setting configuration settings for
 * the Freehand3Dtool.
 */
export default class XNATContourPanel extends React.Component {
  static propTypes = {
    isOpen: PropTypes.any,
    studies: PropTypes.any,
    viewports: PropTypes.any,
    activeIndex: PropTypes.any,
    onContourItemClick: PropTypes.func,
    UIModalService: PropTypes.any,
  };

  static defaultProps = {
    isOpen: undefined,
    studies: undefined,
    viewports: undefined,
    activeIndex: undefined,
    onContourItemClick: undefined,
    UIModalService: undefined,
  };

  constructor(props = {}) {
    super(props);

    const { viewports, activeIndex } = props;

    this.onNewRoiButtonClick = this.onNewRoiButtonClick.bind(this);
    this.onRoiChange = this.onRoiChange.bind(this);
    this.confirmUnlockOnUnlockClick = this.confirmUnlockOnUnlockClick.bind(
      this
    );
    this.onUnlockCancelClick = this.onUnlockCancelClick.bind(this);
    this.onUnlockConfirmClick = this.onUnlockConfirmClick.bind(this);
    this.onIOComplete = this.onIOComplete.bind(this);
    this.onIOCancel = onIOCancel.bind(this);
    this.getRoiContourList = this.getRoiContourList.bind(this);
    this.cornerstoneEventListenerHandler = this.cornerstoneEventListenerHandler.bind(
      this
    );
    this.addEventListeners = this.addEventListeners.bind(this);
    this.removeEventListeners = this.removeEventListeners.bind(this);

    this.onRemoveRoiButtonClick = this.onRemoveRoiButtonClick.bind(this);
    this.onContourClick = this.onContourClick.bind(this);

    this.onRoiCollectionNameChange = this.onRoiCollectionNameChange.bind(this);
    this.configurationChangeHandler = this.configurationChangeHandler.bind(this);

    this.addEventListeners();

    const SeriesInstanceUID = getSeriesInstanceUidFromViewport(
      viewports,
      activeIndex
    );

    let workingCollection = [];
    let lockedCollectionIds = [];
    let activeROIContourIndex = 1;

    if (SeriesInstanceUID) {
      const roiContourList = this.getRoiContourList(SeriesInstanceUID);

      workingCollection = roiContourList.workingCollection;
      lockedCollectionIds = roiContourList.lockedCollectionIds;
      activeROIContourIndex = roiContourList.activeROIContourIndex;
    }

    this.state = {
      workingCollection,
      lockedCollectionIds,
      unlockConfirmationOpen: false,
      roiCollectionToUnlock: '',
      activeROIContourIndex,
      importing: false,
      exporting: false,
      showSettings: false,
      SeriesInstanceUID,
    };
  }

  componentDidUpdate(prevProps) {
    const { viewports, activeIndex } = this.props;
    const { SeriesInstanceUID } = this.state;

    if (
      viewports[activeIndex] &&
      viewports[activeIndex].SeriesInstanceUID !== SeriesInstanceUID
    ) {
      this.refreshRoiContourList(
        viewports[activeIndex] && viewports[activeIndex].SeriesInstanceUID
      );
    }
  }

  componentWillUnmount() {
    this.removeEventListeners();
  }

  addEventListeners() {
    this.removeEventListeners();

    document.addEventListener(
      XNAT_EVENTS.CONTOUR_ADDED,
      this.cornerstoneEventListenerHandler
    );
    document.addEventListener(
      'finishedcontourimportusingmodalevent',
      this.cornerstoneEventListenerHandler
    );
  }

  cornerstoneEventListenerHandler() {
    this.refreshRoiContourList(this.state.SeriesInstanceUID);
  }

  removeEventListeners() {
    document.removeEventListener(
      XNAT_EVENTS.CONTOUR_ADDED,
      this.cornerstoneEventListenerHandler
    );
    document.removeEventListener(
      'finishedcontourimportusingmodalevent',
      this.cornerstoneEventListenerHandler
    );
  }

  configurationChangeHandler = newConfiguration => {
    const module = modules.freehand3D;
    module.configuration.lineWidth = newConfiguration.lineWidth;
    module.configuration.opacity = newConfiguration.opacity;
    refreshViewports();
  };

  /**
   * getRoiContourList - returns the workingCollection, lockedCollectionIds
   * and th activeROIContourIndex.
   *
   * @returns {null}
   */
  getRoiContourList(SeriesInstanceUID) {
    SeriesInstanceUID = SeriesInstanceUID || this.state.SeriesInstanceUID;

    let workingCollection = [];
    let lockedCollectionIds = [];
    let activeROIContourIndex = 0;

    if (SeriesInstanceUID) {
      const freehand3DModule = modules.freehand3D;

      if (freehand3DModule.getters.series(SeriesInstanceUID)) {
        activeROIContourIndex = freehand3DModule.getters.activeROIContourIndex(
          SeriesInstanceUID
        );
      }

      workingCollection = this.constructor._workingCollection(
        SeriesInstanceUID
      );
      lockedCollectionIds = this.constructor._lockedCollections(
        SeriesInstanceUID
      );
    }

    return {
      workingCollection,
      lockedCollectionIds,
      activeROIContourIndex,
    };
  }

  /**
   * refreshRoiContourList - Grabs the ROI Contours from the freehand3D store and
   * populates state.
   *
   * @returns {null}
   */
  refreshRoiContourList(SeriesInstanceUID) {
    const {
      workingCollection,
      lockedCollectionIds,
      activeROIContourIndex,
    } = this.getRoiContourList(SeriesInstanceUID);

    this.setState({
      workingCollection,
      lockedCollectionIds,
      activeROIContourIndex,
      SeriesInstanceUID,
    });
  }

  /**
   * onIOComplete - A callback executed on succesful completion of an
   * IO opperation. Recalculates the ROI Contour Collection state.
   *
   * @returns {type}  description
   */
  onIOComplete() {
    const SeriesInstanceUID = this.state.SeriesInstanceUID;
    const freehand3DStore = modules.freehand3D;
    let activeROIContourIndex = 0;

    if (modules.freehand3D.getters.series(SeriesInstanceUID)) {
      activeROIContourIndex = freehand3DStore.getters.activeROIContourIndex(
        SeriesInstanceUID
      );
    }

    const workingCollection = this.constructor._workingCollection(
      SeriesInstanceUID
    );
    const lockedCollectionIds = this.constructor._lockedCollections(
      SeriesInstanceUID
    );

    this.setState({
      workingCollection,
      lockedCollectionIds,
      activeROIContourIndex,
      importing: false,
      exporting: false,
    });
  }

  /**
   * onNewRoiButtonClick - Callback that adds a new ROIContour to the
   * active series.
   *
   * @returns {null}
   */
  onNewRoiButtonClick() {
    const SeriesInstanceUID = this.state.SeriesInstanceUID;

    const freehand3DStore = modules.freehand3D;
    let series = freehand3DStore.getters.series(SeriesInstanceUID);

    if (!series) {
      freehand3DStore.setters.series(SeriesInstanceUID);
      series = freehand3DStore.getters.series(SeriesInstanceUID);
    }

    const activeROIContourIndex = freehand3DStore.setters.ROIContourAndSetIndexActive(
      SeriesInstanceUID,
      'DEFAULT',
      'Unnamed contour ROI'
    );

    const workingCollection = this.constructor._workingCollection(
      SeriesInstanceUID
    );

    this.setState({ workingCollection, activeROIContourIndex });
  }

  /**
   * onRoiChange - Callback that changes the active ROI Contour being drawn.
   *
   * @param  {Number} roiContourIndex The index of the ROI Contour.
   * @returns {null}
   */
  onRoiChange(roiContourIndex) {
    const SeriesInstanceUID = this.state.SeriesInstanceUID;

    modules.freehand3D.setters.activeROIContourIndex(
      roiContourIndex,
      SeriesInstanceUID
    );

    this.setState({ activeROIContourIndex: roiContourIndex });
  }

  onRemoveRoiButtonClick(roiContourUid) {
    const { SeriesInstanceUID } = this.state;

    removeContourRoi(SeriesInstanceUID, 'DEFAULT', roiContourUid);

    this.refreshRoiContourList(SeriesInstanceUID);
    refreshViewports();
  }

  onContourClick(roiContourUid) {
    const { activeIndex, onContourItemClick, viewports } = this.props;
    const { SeriesInstanceUID } = this.state;

    const enabledElements = cornerstone.getEnabledElements();
    const element = enabledElements[activeIndex].element;
    const toolState = csTools.getToolState(element, 'stack');

    if (!toolState) {
      return;
    }

    const imageIds = toolState.data[0].imageIds;
    const imageId = modules.freehand3D.getters.imageIdOfCenterFrameOfROIContour(
      SeriesInstanceUID,
      roiContourUid,
      imageIds
    );

    const frameIndex = imageIds.indexOf(imageId);
    const SOPInstanceUID = cornerstone.metaData.get('SOPInstanceUID', imageId);
    const StudyInstanceUID = cornerstone.metaData.get('StudyInstanceUID', imageId);

    onContourItemClick({
      StudyInstanceUID,
      SOPInstanceUID,
      frameIndex,
      activeViewportIndex: activeIndex,
      displaySetInstanceUID: viewports[activeIndex].displaySetInstanceUID,
    });
  }

  /**
   * confirmUnlockOnUnlockClick - A callback that triggers confirmation of the
   * unlocking of an ROI Contour Collection.
   *
   * @param  {String} structureSetUid The UID of the structureSet.
   * @returns {null}
   */
  confirmUnlockOnUnlockClick(structureSetUid) {
    this.setState({
      unlockConfirmationOpen: true,
      roiCollectionToUnlock: structureSetUid,
    });
  }

  /**
   * onUnlockConfirmClick - A callback that unlocks an ROI Contour Collection and
   * moves the ROI Contours to the working collection.
   *
   * @returns {type}  description
   */
  onUnlockConfirmClick() {
    const { SeriesInstanceUID, roiCollectionToUnlock } = this.state;

    unlockStructureSet(SeriesInstanceUID, roiCollectionToUnlock);

    refreshViewports();

    const {
      workingCollection,
      lockedCollectionIds,
      activeROIContourIndex,
    } = this.getRoiContourList(SeriesInstanceUID);

    this.setState({
      unlockConfirmationOpen: false,
      workingCollection,
      lockedCollectionIds,
      activeROIContourIndex,
    });
  }

  /**
   * onUnlockCancelClick - A callback that closes the unlock confirmation window
   * and aborts unlocking.
   *
   * @returns {null}
   */
  onUnlockCancelClick() {
    this.setState({ unlockConfirmationOpen: false });
  }

  /**
   * _workingCollection - Returns a list of the ROI Contours
   * in the working collection.
   *
   * @returns {object[]} An array of ROI Contours.
   */
  static _workingCollection(SeriesInstanceUID) {
    const freehand3DStore = modules.freehand3D;

    let series = freehand3DStore.getters.series(SeriesInstanceUID);

    if (!series) {
      freehand3DStore.setters.series(SeriesInstanceUID);
      series = freehand3DStore.getters.series(SeriesInstanceUID);
    }

    const structureSet = freehand3DStore.getters.structureSet(
      SeriesInstanceUID
    );

    const ROIContourCollection = structureSet.ROIContourCollection;

    const workingCollection = [];

    for (let i = 0; i < ROIContourCollection.length; i++) {
      if (ROIContourCollection[i]) {
        workingCollection.push({
          index: i,
          metadata: ROIContourCollection[i],
        });
      }
    }

    return workingCollection;
  }

  /**
   * _lockedCollections - Returns a list of locked ROI Contour Collections.
   *
   * @returns {object} An array of locked ROI Contour Collections.
   */
  static _lockedCollections(SeriesInstanceUID) {
    const freehand3DStore = modules.freehand3D;

    let series = freehand3DStore.getters.series(SeriesInstanceUID);

    if (!series) {
      freehand3DStore.setters.series(SeriesInstanceUID);
      series = freehand3DStore.getters.series(SeriesInstanceUID);
    }

    const structureSetCollection = series.structureSetCollection;
    const lockedCollectionIds = [];

    for (let i = 0; i < structureSetCollection.length; i++) {
      const structureSet = structureSetCollection[i];

      if (structureSet.uid === 'DEFAULT') {
        continue;
      }

      const ROIContourCollection = structureSet.ROIContourCollection;
      const ROIContourArray = [];

      for (let j = 0; j < ROIContourCollection.length; j++) {
        if (ROIContourCollection[j]) {
          ROIContourArray.push({
            index: j,
            metadata: ROIContourCollection[j],
          });
        }
      }

      lockedCollectionIds.push(structureSet.uid);
    }

    return lockedCollectionIds;
  }

  onRoiCollectionNameChange(evt) {
    const name = evt.target.value;
    const { SeriesInstanceUID } = this.state;

    let newName = '_';

    if (name.replace(' ', '').length > 0) {
      newName = name;
    }

    const freehand3DModule = modules.freehand3D;

    // const structureSet = freehand3DModule.getters.structureSet(
    //   SeriesInstanceUID
    // );

    freehand3DModule.setters.structureSetName(
      newName,
      SeriesInstanceUID,
      'DEFAULT'
    );

    return newName;
  }

  render() {
    const {
      workingCollection,
      lockedCollectionIds,
      unlockConfirmationOpen,
      roiCollectionToUnlock,
      activeROIContourIndex,
      importing,
      exporting,
      showSettings,
      SeriesInstanceUID,
    } = this.state;

    const { viewports, activeIndex } = this.props;
    const freehand3DStore = modules.freehand3D;

    let exportDisabledMessage;
    if (!sessionMap.hasCreatePermission()) {
      exportDisabledMessage = 'Contour collection export is not permitted.';
    }

    let component;

    if (showSettings) {
      component = (
        <ContourPanelSettings
          configuration={modules.freehand3D.configuration}
          onChange={this.configurationChangeHandler}
          onBack={() => this.setState({ showSettings: false })}
        />
      );
    } else if (importing) {
      component = (
        <XNATContourImportMenu
          onImportComplete={this.onIOComplete}
          onImportCancel={this.onIOCancel}
          SeriesInstanceUID={SeriesInstanceUID}
          viewportData={viewports[activeIndex]}
        />
      );
    } else if (exporting) {
      component = (
        <XNATContourExportMenu
          onExportComplete={this.onIOComplete}
          onExportCancel={this.onIOCancel}
          onRoiCollectionNameChange={this.onRoiCollectionNameChange}
          SeriesInstanceUID={SeriesInstanceUID}
          viewportData={viewports[activeIndex]}
        />
      );
    } else if (unlockConfirmationOpen) {
      const collection = freehand3DStore.getters.structureSet(
        SeriesInstanceUID,
        roiCollectionToUnlock
      );

      const collectionName = collection.name;

      component = (
        <div className="xnatPanel">
          <div>
            <h4 style={{ marginTop: 10 }}>Confirm unlock</h4>
            <p>
              Unlock <strong>{collectionName}</strong> for editing? The ROIs
              will be moved to the Working ROI Collection.
            </p>
          </div>
          <div>
            <button onClick={this.onUnlockConfirmClick}>Yes</button>
            <button onClick={this.onUnlockCancelClick}>No</button>
          </div>
        </div>
      );
    } else {
      component = (
        <div className="xnatPanel">
          <div className="panelHeader">
            <div className="title-with-icon">
              <h3>Contour-based ROIs</h3>
              <Icon
                className="settings-icon"
                name="cog"
                width="20px"
                height="20px"
                onClick={() => this.setState({ showSettings: true })}
                title="Contour ROI Settings"
              />
            </div>
            <MenuIOButtons
              ImportCallbackOrComponent={XNATContourImportMenu}
              ExportCallbackOrComponent={XNATContourExportMenu}
              onImportButtonClick={() => this.setState({ importing: true })}
              onExportButtonClick={() => this.setState({ exporting: true })}
              exportDisabledMessage={exportDisabledMessage}
            />
          </div>

          {/* CONTOUR COLLECTION LISTS */}
          <div className="roiCollectionBody">
            {/* WORKING COLLECTIONS */}
            <div className="workingCollectionHeader">
              <h4> In-Progress Contour Collection </h4>
            </div>
            {SeriesInstanceUID && (
              <WorkingCollectionList
                workingCollection={workingCollection}
                activeROIContourIndex={activeROIContourIndex}
                onRoiChange={this.onRoiChange}
                onRoiRemove={this.onRemoveRoiButtonClick}
                SeriesInstanceUID={SeriesInstanceUID}
                onContourClick={this.onContourClick}
                onRoiCollectionNameChange={this.onRoiCollectionNameChange}
                onNewRoiButtonClick={this.onNewRoiButtonClick}
              />
            )}
            {/* LOCKED COLLECTIONS */}
            {lockedCollectionIds.length !== 0 && (
              <>
                <div className="lockedCollectionHeader">
                  <h4> Imported Contour Collections </h4>
                </div>
                <LockedCollectionsList
                  lockedCollectionIds={lockedCollectionIds}
                  onUnlockClick={this.confirmUnlockOnUnlockClick}
                  SeriesInstanceUID={SeriesInstanceUID}
                  onContourClick={this.onContourClick}
                />
              </>
            )}
          </div>
        </div>
      );
    }

    return <React.Fragment>{component}</React.Fragment>;
  }
}
