import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { useLogger } from '@ohif/ui';

import OHIF, { MODULE_TYPES, DICOMSR } from '@ohif/core';
import { withDialog } from '@ohif/ui';
import moment from 'moment';
import ConnectedHeader from './ConnectedHeader.js';
import ToolbarRow from './ToolbarRow.js';
import ConnectedStudyBrowser from './ConnectedStudyBrowser.js';
import ConnectedViewerMain from './ConnectedViewerMain.js';
import SidePanel from './../components/SidePanel.js';
import ErrorBoundaryDialog from './../components/ErrorBoundaryDialog';
import { extensionManager } from './../App.js';
import { ReconstructionIssues } from './../../../core/src/enums.js';
import dcmjs from 'dcmjs';

// Contexts
import WhiteLabelingContext from '../context/WhiteLabelingContext.js';
import UserManagerContext from '../context/UserManagerContext';
import AppContext, { withAppContext } from '../context/AppContext';

import './Viewer.css';
import * as csTools from '@cornerstonejs/tools';

class Viewer extends Component {
  static propTypes = {
    studies: PropTypes.arrayOf(
      PropTypes.shape({
        StudyInstanceUID: PropTypes.string.isRequired,
        StudyDate: PropTypes.string,
        PatientID: PropTypes.string,
        displaySets: PropTypes.arrayOf(
          PropTypes.shape({
            displaySetInstanceUID: PropTypes.string.isRequired,
            SeriesDescription: PropTypes.string,
            SeriesNumber: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
            InstanceNumber: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
            numImageFrames: PropTypes.number,
            Modality: PropTypes.string.isRequired,
            images: PropTypes.arrayOf(
              PropTypes.shape({
                getImageId: PropTypes.func.isRequired,
              })
            ),
          })
        ),
      })
    ),
    studyInstanceUIDs: PropTypes.array,
    activeServer: PropTypes.shape({
      type: PropTypes.string,
      wadoRoot: PropTypes.string,
    }),
    onTimepointsUpdated: PropTypes.func,
    onMeasurementsUpdated: PropTypes.func,
    // window.store.getState().viewports.viewportSpecificData
    viewports: PropTypes.object.isRequired,
    // window.store.getState().viewports.activeViewportIndex
    activeViewportIndex: PropTypes.number.isRequired,
    isStudyLoaded: PropTypes.bool,
    dialog: PropTypes.object,
    activeTool: PropTypes.string,
    preferences: PropTypes.object,
  };

  constructor(props) {
    super(props);

    const { activeServer } = this.props;
    const server = Object.assign({}, activeServer);

    OHIF.measurements.MeasurementApi.setConfiguration({
      dataExchange: {
        retrieve: DICOMSR.retrieveMeasurements,
        store: DICOMSR.storeMeasurements,
      },
      server,
    });

    OHIF.measurements.TimepointApi.setConfiguration({
      dataExchange: {
        retrieve: this.retrieveTimepoints,
        store: this.storeTimepoints,
        remove: this.removeTimepoint,
        update: this.updateTimepoint,
        disassociate: this.disassociateStudy,
      },
    });

    this._getActiveViewport = this._getActiveViewport.bind(this);
  }

  state = {
    isLeftSidePanelOpen: true,
    isRightSidePanelOpen: false,
    selectedRightSidePanel: '',
    selectedLeftSidePanel: 'studies', // TODO: Don't hardcode this
    thumbnails: [],
  };

  componentWillUnmount() {
    if (this.props.dialog) {
      this.props.dialog.dismissAll();
    }
  }

  retrieveTimepoints = filter => {
    OHIF.log.info('retrieveTimepoints');

    // Get the earliest and latest study date
    let earliestDate = new Date().toISOString();
    let latestDate = new Date().toISOString();
    if (this.props.studies) {
      latestDate = new Date('1000-01-01').toISOString();
      this.props.studies.forEach(study => {
        const StudyDate = moment(study.StudyDate, 'YYYYMMDD').toISOString();
        if (StudyDate < earliestDate) {
          earliestDate = StudyDate;
        }
        if (StudyDate > latestDate) {
          latestDate = StudyDate;
        }
      });
    }

    // Return a generic timepoint
    return Promise.resolve([
      {
        timepointType: 'baseline',
        timepointId: 'TimepointId',
        studyInstanceUIDs: this.props.studyInstanceUIDs,
        PatientID: filter.PatientID,
        earliestDate,
        latestDate,
        isLocked: false,
      },
    ]);
  };

  storeTimepoints = timepointData => {
    OHIF.log.info('storeTimepoints');
    return Promise.resolve();
  };

  updateTimepoint = (timepointData, query) => {
    OHIF.log.info('updateTimepoint');
    return Promise.resolve();
  };

  removeTimepoint = timepointId => {
    OHIF.log.info('removeTimepoint');
    return Promise.resolve();
  };

  disassociateStudy = (timepointIds, StudyInstanceUID) => {
    OHIF.log.info('disassociateStudy');
    return Promise.resolve();
  };

  onTimepointsUpdated = timepoints => {
    if (this.props.onTimepointsUpdated) {
      this.props.onTimepointsUpdated(timepoints);
    }
  };

  onMeasurementsUpdated = measurements => {
    if (this.props.onMeasurementsUpdated) {
      this.props.onMeasurementsUpdated(measurements);
    }
  };

  componentDidMount() {
    const { studies, isStudyLoaded } = this.props;
    const { TimepointApi, MeasurementApi } = OHIF.measurements;
    const currentTimepointId = 'TimepointId';

    const timepointApi = new TimepointApi(currentTimepointId, {
      onTimepointsUpdated: this.onTimepointsUpdated,
    });

    const measurementApi = new MeasurementApi(timepointApi, {
      onMeasurementsUpdated: this.onMeasurementsUpdated,
    });

    this.currentTimepointId = currentTimepointId;
    this.timepointApi = timepointApi;
    this.measurementApi = measurementApi;

    if (studies) {
      const PatientID = studies[0] && studies[0].PatientID;

      timepointApi.retrieveTimepoints({ PatientID });
      if (isStudyLoaded) {
        this.measurementApi.retrieveMeasurements(PatientID, [
          currentTimepointId,
        ]);
      }

      const activeViewport = this.props.viewports[this.props.activeViewportIndex];
      const activeDisplaySetInstanceUID =
        activeViewport ? activeViewport.displaySetInstanceUID : undefined;
      this.setState({
        thumbnails: _mapStudiesToThumbnails(studies, activeDisplaySetInstanceUID),
      });
    }
  }

  componentDidUpdate(prevProps) {
    const {
      studies,
      isStudyLoaded,
      activeViewportIndex,
      viewports
    } = this.props;

    const activeViewport = viewports[activeViewportIndex];
    const activeDisplaySetInstanceUID =
      activeViewport ? activeViewport.displaySetInstanceUID : undefined;

    const prevActiveViewport = prevProps.viewports[prevProps.activeViewportIndex];
    const prevActiveDisplaySetInstanceUID =
      prevActiveViewport ? prevActiveViewport.displaySetInstanceUID : undefined;

    if (
      studies !== prevProps.studies ||
      activeViewportIndex !== prevProps.activeViewportIndex ||
      activeDisplaySetInstanceUID !== prevActiveDisplaySetInstanceUID
    ) {
      this.setState({
        thumbnails: _mapStudiesToThumbnails(studies, activeDisplaySetInstanceUID),
      });
    }
    if (isStudyLoaded && isStudyLoaded !== prevProps.isStudyLoaded) {
      const PatientID = studies[0] && studies[0].PatientID;
      const { currentTimepointId } = this;

      this.timepointApi.retrieveTimepoints({ PatientID });
      this.measurementApi.retrieveMeasurements(PatientID, [currentTimepointId]);
    }

    if (this.props.activeTool !== prevProps.activeTool) {
      if (prevProps.activeTool === 'AIAAProbeTool') {
        csTools.setToolDisabled('AIAAProbeTool', {});
      } else if (prevProps.activeTool === 'MONAILabelProbeTool') {
        csTools.setToolDisabled('MONAILabelProbeTool', {});
      }
    }
  }

  _getActiveViewport() {
    return this.props.viewports[this.props.activeViewportIndex];
  }

  render() {
    const { activeContexts, viewports, activeViewportIndex } = this.props;
    const panelExtensions = extensionManager.modules[MODULE_TYPES.PANEL];
    const activePanelExtension = _getActivePanelExtension(
      viewports,
      activeViewportIndex,
      panelExtensions
    );
    const {
      selectedLeftSidePanel,
      selectedRightSidePanel,
      VisiblePanelLeft,
      VisiblePanelRight,
      isStudyBrowserEnabled,
    } = _getSelectedSidePanels(
      activePanelExtension,
      panelExtensions,
      activeContexts
    );

    let leftPanel = null;
    if (VisiblePanelLeft !== undefined) {
      leftPanel = (
        <VisiblePanelLeft
          viewports={this.props.viewports}
          studies={this.props.studies}
          activeIndex={this.props.activeViewportIndex}
        />
      );
    } else if (isStudyBrowserEnabled) {
      leftPanel = (
        <ConnectedStudyBrowser
          studies={this.state.thumbnails}
          studyMetadata={this.props.studies}
        />
      );
    }

    return (
      <>
        {/* HEADER */}
        <WhiteLabelingContext.Consumer>
          {whiteLabeling => (
            <UserManagerContext.Consumer>
              {userManager => (
                <AppContext.Consumer>
                  {appContext => (
                    <ConnectedHeader
                      linkText={
                        appContext.appConfig.showStudyList
                          ? 'Study List'
                          : undefined
                      }
                      linkPath={
                        appContext.appConfig.showStudyList ? '/' : undefined
                      }
                      userManager={userManager}
                    >
                      {whiteLabeling &&
                        whiteLabeling.createLogoComponentFn &&
                        whiteLabeling.createLogoComponentFn(React)}
                    </ConnectedHeader>
                  )}
                </AppContext.Consumer>
              )}
            </UserManagerContext.Consumer>
          )}
        </WhiteLabelingContext.Consumer>

        {/* TOOLBAR */}
        <ErrorBoundaryDialog context="ToolbarRow">
          <ToolbarRow
            activeViewport={
              this.props.viewports[this.props.activeViewportIndex]
            }
            isDerivedDisplaySetsLoaded={this.props.isDerivedDisplaySetsLoaded}
            isLeftSidePanelOpen={this.state.isLeftSidePanelOpen}
            isRightSidePanelOpen={this.state.isRightSidePanelOpen}
            selectedLeftSidePanel={
              this.state.isLeftSidePanelOpen
                ? selectedLeftSidePanel
                : ''
            }
            selectedRightSidePanel={
              this.state.isRightSidePanelOpen
                ? selectedRightSidePanel
                : ''
            }
            handleSidePanelChange={(side, selectedPanel) => {
              const sideClicked = side && side[0].toUpperCase() + side.slice(1);
              const openKey = `is${sideClicked}SidePanelOpen`;
              const selectedKey = `selected${sideClicked}SidePanel`;
              const updatedState = Object.assign({}, this.state);

              const isOpen = updatedState[openKey];
              const prevSelectedPanel = updatedState[selectedKey];
              // RoundedButtonGroup returns `null` if selected button is clicked
              const isSameSelectedPanel =
                prevSelectedPanel === selectedPanel || selectedPanel === null;

              updatedState[selectedKey] = selectedPanel || prevSelectedPanel;

              const isClosedOrShouldClose = !isOpen || isSameSelectedPanel;
              if (isClosedOrShouldClose) {
                updatedState[openKey] = !updatedState[openKey];
              }

              if (activePanelExtension) {
                activePanelExtension.module[selectedKey] = selectedPanel;
              }

              this.setState(updatedState);
            }}
            studies={this.props.studies}
            preferences={this.props.preferences}
          />
        </ErrorBoundaryDialog>

        {/*<ConnectedStudyLoadingMonitor studies={this.props.studies} />*/}
        {/*<StudyPrefetcher studies={this.props.studies} />*/}

        {/* VIEWPORTS + SIDEPANELS */}
        <div className="FlexboxLayout">
          {/* LEFT */}
          <ErrorBoundaryDialog context="LeftSidePanel">
            <SidePanel from="left" isOpen={this.state.isLeftSidePanelOpen}>
              {leftPanel}
            </SidePanel>
          </ErrorBoundaryDialog>

          {/* MAIN */}
          <div className={classNames('main-content')}>
            <ErrorBoundaryDialog context="ViewerMain">
              <ConnectedViewerMain
                studies={this.props.studies}
                isStudyLoaded={this.props.isStudyLoaded}
              />
            </ErrorBoundaryDialog>
          </div>

          {/* RIGHT */}
          <ErrorBoundaryDialog context="RightSidePanel">
            <SidePanel from="right" isOpen={this.state.isRightSidePanelOpen}>
              {VisiblePanelRight && (
                <VisiblePanelRight
                  isOpen={this.state.isRightSidePanelOpen}
                  viewports={this.props.viewports}
                  studies={this.props.studies}
                  activeIndex={this.props.activeViewportIndex}
                  activeViewport={
                    this.props.viewports[this.props.activeViewportIndex]
                  }
                  getActiveViewport={this._getActiveViewport}
                  activeTool={this.props.activeTool}
                />
              )}
            </SidePanel>
          </ErrorBoundaryDialog>
        </div>
      </>
    );
  }
}

export default withDialog(withAppContext(Viewer));

/**
 * Async function to check if there are any inconsistences in the series.
 *
 * For segmentation checks that the geometry is consistent with the source images:
 * 1) no frames out of plane;
 * 2) have the same width and height.
 *
 * For reconstructable 3D volume:
 * 1) Is series multiframe?
 * 2) Do the frames have different dimensions/number of components/orientations?
 * 3) Has the series any missing frames or irregular spacing?
 * 4) Is the series 4D?
 *
 * If not reconstructable, MPR is disabled.
 * The actual computations are done in isDisplaySetReconstructable.
 *
 * @param {*object} displaySet
 * @returns {[string]} an array of strings containing the warnings
 */
const _checkForSeriesInconsistencesWarnings = async function (displaySet, studies) {
  if (displaySet.inconsistencyWarnings) {
    // warnings already checked and cached in displaySet
    return displaySet.inconsistencyWarnings;
  }
  const inconsistencyWarnings = [];

  if (displaySet.Modality !== 'SEG') {
    if (displaySet.reconstructionIssues && displaySet.reconstructionIssues.length !== 0) {
      displaySet.reconstructionIssues.forEach(warning => {
        switch (warning) {
          case ReconstructionIssues.DATASET_4D:
            inconsistencyWarnings.push('The dataset is 4D.');
            break;
          case ReconstructionIssues.VARYING_IMAGESDIMENSIONS:
            inconsistencyWarnings.push('The dataset frames have different dimensions (rows, columns).');
            break;
          case ReconstructionIssues.VARYING_IMAGESCOMPONENTS:
            inconsistencyWarnings.push('The dataset frames have different components (Sample per pixel).');
            break;
          case ReconstructionIssues.VARYING_IMAGESORIENTATION:
            inconsistencyWarnings.push('The dataset frames have different orientation.');
            break;
          case ReconstructionIssues.IRREGULAR_SPACING:
            inconsistencyWarnings.push('The dataset frames have different irregular spacing.');
            break;
          case ReconstructionIssues.MULTIFRAMES:
            inconsistencyWarnings.push('The dataset is multi-frame.');
            break;
          default:
            break;
        }
      });
      inconsistencyWarnings.push('The dataset is not a reconstructable 3D volume. MPR mode is not available.');
    }

    if (displaySet.missingFrames) {
      inconsistencyWarnings.push(
        'The dataset is missing frames: ' + displaySet.missingFrames + '.'
      );
    }
  } else {
    const segMetadata = displaySet.metadata;
    if (!segMetadata) {
      displaySet.inconsistencyWarnings = inconsistencyWarnings;
      return inconsistencyWarnings;
    }

    const { referencedDisplaySet } = displaySet.getSourceDisplaySet(studies, false);
    if (!referencedDisplaySet) {
      displaySet.inconsistencyWarnings = inconsistencyWarnings;
      return inconsistencyWarnings;
    }

    const imageIds = referencedDisplaySet.images.map(image => image.getImageId());
    if (!imageIds || imageIds.length === 0) {
      displaySet.inconsistencyWarnings = inconsistencyWarnings;
      return inconsistencyWarnings;
    }

    for (
      let i = 0, groupsLen = segMetadata.PerFrameFunctionalGroupsSequence.length;
      i < groupsLen;
      ++i
    ) {
      const PerFrameFunctionalGroups = segMetadata.PerFrameFunctionalGroupsSequence[i];
      if (!PerFrameFunctionalGroups) {
        continue;
      }

      let SourceImageSequence = undefined;
      if (segMetadata.SourceImageSequence) {
        SourceImageSequence = segMetadata.SourceImageSequence[i];
      } else if (PerFrameFunctionalGroups.DerivationImageSequence) {
        SourceImageSequence =
          PerFrameFunctionalGroups.DerivationImageSequence
            .SourceImageSequence;
      }
      if (!SourceImageSequence) {
        if (inconsistencyWarnings.length === 0) {
          const warningMessage = 'The segmentation ' +
            'has frames out of plane respect to the source images.';
            inconsistencyWarnings.push(warningMessage);
        }
        continue;
      }

      const {
        ReferencedSOPInstanceUID,
      } = SourceImageSequence;

      const imageId = imageIds.find(imageId => {
        const sopCommonModule = cornerstone.metaData.get(
            "sopCommonModule",
            imageId
        );
        if (!sopCommonModule) {
            return;
        }

        return sopCommonModule.sopInstanceUID === ReferencedSOPInstanceUID;
      });

      if (!imageId) {
        continue;
      }

      const sourceImageMetadata = cornerstone.metaData.get(
        "instance",
        imageId
      );
      if (
        segMetadata.Rows !== sourceImageMetadata.Rows ||
        segMetadata.Columns !== sourceImageMetadata.Columns
      ) {
        const warningMessage = 'The segmentation ' +
          'has frames with different geometry ' +
          'dimensions (Rows and Columns) respect to the source images.';
          inconsistencyWarnings.push(warningMessage);
        break;
      }
    }

    if (inconsistencyWarnings.length !== 0) {
      const warningMessage = 'The segmentation format is not supported yet. ' +
        'The segmentation data (segments) could not be loaded.';
        inconsistencyWarnings.push(warningMessage);
    }
  }

  // cache the warnings
  displaySet.inconsistencyWarnings = inconsistencyWarnings;
  return inconsistencyWarnings;
}

/**
 * Checks if display set is active, i.e. if the series is currently shown
 * in the active viewport.
 *
 * For data display set, this functions checks if the active
 * display set instance uid in the current active viewport is the same of the
 * thumbnail one.
 *
 * For derived modalities (e.g., SEG and RTSTRUCT), the function gets the
 * reference display set and then checks the reference uid with the active
 * display set instance uid.
 *
 * @param {displaySet} displaySet
 * @param {Study[]} studies
 * @param {string} activeDisplaySetInstanceUID
 * @returns {boolean} is active.
 */
const _isDisplaySetActive = function(
  displaySet,
  studies,
  activeDisplaySetInstanceUID
) {
  let active = false;

  const { displaySetInstanceUID } = displaySet;

  // TO DO: in the future, we could possibly support new modalities
  // we should have a list of all modalities here, instead of having hard coded checks
  if (displaySet.Modality !== 'SEG' &&
    displaySet.Modality !== 'RTSTRUCT' &&
    displaySet.Modality !== 'RTDOSE') {
    active = activeDisplaySetInstanceUID === displaySetInstanceUID;
  } else if (displaySet.getSourceDisplaySet){
    if (displaySet.Modality === 'SEG') {
      const { referencedDisplaySet } = displaySet.getSourceDisplaySet(studies, false);
      active = referencedDisplaySet ?
        activeDisplaySetInstanceUID === referencedDisplaySet.displaySetInstanceUID :
          false;
    } else {
      const referencedDisplaySet = displaySet.getSourceDisplaySet(studies, false);
      active = referencedDisplaySet ?
        activeDisplaySetInstanceUID === referencedDisplaySet.displaySetInstanceUID :
          false;
    }
  }

  if (displaySet.isValidMultiStack && displaySet.getSubStackGroupData) {
    const subStackGroupData = displaySet.getSubStackGroupData();
    active = subStackGroupData.hasActiveDisplaySet(activeDisplaySetInstanceUID);
  }

  if (displaySet.hasMultiDisplaySets && displaySet.subDisplaySetGroupData) {
    active = displaySet.subDisplaySetGroupData.hasActiveDisplaySet(
      activeDisplaySetInstanceUID
    );
  }

  return active;
};

/**
 * What types are these? Why do we have "mapping" dropped in here instead of in
 * a mapping layer?
 *
 * TODO[react]:
 * - Add showStackLoadingProgressBar option
 *
 * @param {Study[]} studies
 * @param {string} activeDisplaySetInstanceUID
 */
const _mapStudiesToThumbnails = function(studies, activeDisplaySetInstanceUID) {
  return studies.map(study => {
    const { StudyInstanceUID, StudyDescription } = study;

    const thumbnailEnabledDisplaySets = study.displaySets.filter(
      displaySet => displaySet.isThumbnailViewEnabled
    );

    const thumbnails = thumbnailEnabledDisplaySets.map(displaySet => {
      const {
        displaySetInstanceUID,
        SeriesDescription,
        InstanceNumber,
        numImageFrames,
        SeriesNumber,
        seriesNotation,
        isValidMultiStack,
        hasMultiDisplaySets,
      } = displaySet;

      const modality = displaySet.Modality || 'UN';

      let imageId;
      let altImageText;
      let SOPInstanceUID;

      if (displaySet.Modality && displaySet.Modality === 'SEG') {
        // TODO: We want to replace this with a thumbnail showing
        // the segmentation map on the image, but this is easier
        // and better than what we have right now.
        altImageText = 'SEG';
      } else if (displaySet.images && displaySet.images.length) {
        const imageIndex = displaySet.middleImageIndex;
        if (displaySet.isMultiFrame) {
          imageId = `${displaySet.images[0].getImageId()}?frame=${imageIndex}`;
          SOPInstanceUID = displaySet.images[0].getData().metadata
            .SOPInstanceUID;
        } else {
          imageId = displaySet.images[imageIndex].getImageId();
          SOPInstanceUID = displaySet.images[imageIndex].getData().metadata
            .SOPInstanceUID;
        }
      } else if (displaySet.thumbnailImageId) {
        imageId = displaySet.thumbnailImageId;
      } else {
        altImageText = modality;
      }

      const hasWarnings = _checkForSeriesInconsistencesWarnings(
        displaySet,
        studies
      );
      const active = _isDisplaySetActive(
        displaySet,
        studies,
        activeDisplaySetInstanceUID
      );

      return {
        active,
        imageId,
        altImageText,
        displaySetInstanceUID,
        SeriesDescription,
        InstanceNumber,
        numImageFrames,
        SeriesNumber,
        hasWarnings,
        seriesNotation,
        SOPInstanceUID,
        modality,
        isValidMultiStack,
        hasMultiDisplaySets,
      };
    });

    return {
      StudyInstanceUID,
      StudyDescription,
      thumbnails,
    };
  });
};

const _getActivePanelExtension = (
  viewports,
  activeViewportIndex,
  panelExtensions
) => {
  if (!viewports || !viewports[activeViewportIndex]) {
    return;
  }
  const activeViewport = viewports[activeViewportIndex];
  let pluginId = activeViewport.plugin;
  if (pluginId === 'cornerstone') {
    pluginId = 'xnat';
  }
  return panelExtensions.find(ext => ext.extensionId === pluginId);
};

const _getSelectedSidePanels = (
  activePanelExtension,
  panelExtensions,
  activeContexts
) => {
  let selectedLeftSidePanel = '';
  let selectedRightSidePanel = '';
  let VisiblePanelLeft;
  let VisiblePanelRight;
  const isStudyBrowserEnabled = !activeContexts.includes(
    'ACTIVE_VIEWPORT::VTK'
  );

  if (activePanelExtension) {
    selectedLeftSidePanel = activePanelExtension.module.selectedLeftSidePanel;
    selectedRightSidePanel = activePanelExtension.module.selectedRightSidePanel;

    panelExtensions.forEach(panelExt => {
      const isActiveExt = panelExt.module.defaultContext.some(ctx =>
        activeContexts.includes(ctx)
      );
      if (!isActiveExt) {
        return;
      }
      panelExt.module.components.forEach(comp => {
        if (comp.id === selectedLeftSidePanel) {
          VisiblePanelLeft = comp.component;
        } else if (comp.id === selectedRightSidePanel) {
          VisiblePanelRight = comp.component;
        }
      });
    });
  }

  return {
    selectedLeftSidePanel,
    selectedRightSidePanel,
    VisiblePanelLeft,
    VisiblePanelRight,
    isStudyBrowserEnabled,
  };
};
