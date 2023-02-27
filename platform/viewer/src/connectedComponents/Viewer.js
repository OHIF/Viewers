import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { withRouter, matchPath } from 'react-router';
import cornerstoneTools from 'cornerstone-tools';

import OHIF, { MODULE_TYPES, DICOMSR } from '@ohif/core';
import { withDialog } from '@ohif/ui';
import moment from 'moment';
import ToolbarRow from './ToolbarRow.js';
import ConnectedStudyBrowser from './ConnectedStudyBrowser.js';
import ConnectedViewerMain from './ConnectedViewerMain.js';
import SidePanel from './../components/SidePanel.js';
import ErrorBoundaryDialog from './../components/ErrorBoundaryDialog';
import { commandsManager, extensionManager } from './../App.js';
import { ReconstructionIssues } from './../../../core/src/enums.js';
import circularLoading from '../appExtensions/ThetaDetailsPanel/TextureFeatures/utils/circular-loading.json';
import '../googleCloud/googleCloud.css';
// import Lottie from 'lottie-react';
import cornerstone from 'cornerstone-core';

import './Viewer.css';
import JobsContextUtil from './JobsContextUtil.js';
import eventBus from '../lib/eventBus.js';
import { getEnabledElement } from '../../../../extensions/cornerstone/src/state.js';
import { radcadapi } from '../utils/constants.js';
import handleScrolltoIndex from '../utils/handleScrolltoIndex.js';
import {
  handleRestoreToolState,
  handleSaveToolState,
} from '../utils/syncrhonizeToolState.js';

const MINIMUM_SIZE = 100;
const DEFAULT_SIZE = 512;
const MAX_TEXTURE_SIZE = 10000;

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
            SeriesNumber: PropTypes.number,
            InstanceNumber: PropTypes.number,
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
    this.fetchSeriesRef = false;
    this.source_series_ref = [];
  }

  state = {
    loading: true,
    isToolSet: false,
    inEditSegmentationMode: false,
    isLeftSidePanelOpen: true,
    selectedLeftSidePanel: 'studies', // TODO: Don't hardcode this
    isRightSidePanelOpen: false,
    selectedRightSidePanel: '',
    // selectedRightSidePanel: 'xnat-segmentation-panel',
    thumbnails: [],
  };

  componentWillUnmount() {
    if (this.props.dialog) {
      this.props.dialog.dismissAll();
    }

    const enabledElement = getEnabledElement(this.props.activeViewportIndex);
    if (enabledElement) {
      // cornerstoneTools.globalImageIdSpecificToolStateManager.clear(
      //   enabledElement
      // );
      let viewport = cornerstone.getViewport(enabledElement);
      const image = cornerstone.getImage(enabledElement);
      const instance_uid = image.imageId.split('/')[14];

      handleSaveToolState(instance_uid, viewport);
    }

    cornerstone.events.removeEventListener(
      cornerstone.EVENTS.ELEMENT_ENABLED,
      this.onCornerstageLoaded
    );
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
    const { studies, isStudyLoaded, ...rest } = this.props;
    const { TimepointApi, MeasurementApi } = OHIF.measurements;
    const currentTimepointId = 'TimepointId';

    this.handleFetchAndSetSeries(rest.studyInstanceUIDs[0]);

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

      const activeViewport = this.props.viewports[
        this.props.activeViewportIndex
      ];
      const activeDisplaySetInstanceUID = activeViewport
        ? activeViewport.displaySetInstanceUID
        : undefined;

      const thumbnails = _mapStudiesToThumbnails(
        studies,
        activeDisplaySetInstanceUID
      );

      this.setState({
        thumbnails,
      });

      this.loadLastActiveStudy(thumbnails);
    }

    this.setState({
      inEditSegmentationMode: matchPath(this.props.location.pathname, {
        path:
          '/edit/:project/locations/:location/datasets/:dataset/dicomStores/:dicomStore/study/:studyInstanceUIDs',
        exact: true,
      })
        ? true
        : false,
    });

    cornerstone.events.addEventListener(
      cornerstone.EVENTS.ELEMENT_ENABLED,
      this.onCornerstageLoaded
    );
  }

  onCornerstageLoaded = enabledEvt => {
    setTimeout(() => {
      if (
        matchPath(this.props.location.pathname, {
          path:
            '/edit/:project/locations/:location/datasets/:dataset/dicomStores/:dicomStore/study/:studyInstanceUIDs',
          exact: true,
        })
      ) {
        this.handleSidePanelChange('right', 'xnat-segmentation-panel');
      }
    }, 3000);

    setTimeout(() => {
      // this.loadLastActiveStudy();
      const enabledElement = enabledEvt.detail.element;

      // let tool_data = null;
      // // let tool_data = localStorage.getItem(this.props.studyInstanceUID);
      // tool_data =
      //   tool_data && tool_data !== 'undefined' ? JSON.parse(tool_data) : false;
      // if (enabledElement && tool_data) {
      try {
        // get current image
        const image = cornerstone.getImage(enabledElement);
        const instance_uid = image.imageId.split('/')[14];

        handleScrolltoIndex(enabledElement);
        handleRestoreToolState(cornerstone, enabledElement, instance_uid);

        // let viewport = cornerstone.getViewport(enabledElement);
        // // viewport.scale >1 is to counter the issue with edit step initialising to scale to <1
        // if (viewport.scale < 1) return;
        // var image = enabledElement.image;
        // var widthScale = tool_data.x;
        // var heightScale = tool_data.x;
        // if (image.rowPixelSpacing < image.columnPixelSpacing) {
        //   widthScale =
        //     widthScale * (image.columnPixelSpacing / image.rowPixelSpacing);
        // } else if (image.columnPixelSpacing < image.rowPixelSpacing) {
        //   heightScale =
        //     heightScale * (image.rowPixelSpacing / image.columnPixelSpacing);
        // }
        // viewport.scale = widthScale;
        // if (tool_data.x && viewport.translation.x != tool_data.x)
        //   viewport.translation.x = tool_data.x;
        // if (tool_data.y && viewport.translation.y != tool_data.y)
        //   viewport.translation.y = tool_data.y;
        // // if (tool_data.scale && viewport.scale != tool_data.scale)
        // //   viewport.scale = tool_data.scale;
        // if (tool_data.voi) viewport.voi = tool_data.voi;
        // cornerstone.resize(enabledElement, true);
        // cornerstone.setViewport(enabledElement, viewport);
        // cornerstone.fitToWindow(enabledElement);
      } catch (error) {
        console.error(error);
      }
      // }
    }, 2000);
  };

  async handleFetchAndSetSeries(studyInstanceUID) {
    const fetchedSeries = await (async () => {
      try {
        var requestOptions = {
          method: 'GET',
          redirect: 'follow',
        };

        const response = await fetch(
          `${radcadapi}/series?study=${studyInstanceUID}`,
          requestOptions
        );
        const result = await response.json();
        return result.series;
      } catch (error) {
        console.error('fetcheSeries caught', { error });
        return [];
      }
    })();
    this.fetchSeriesRef = false;
    this.source_series_ref = fetchedSeries;
    this.setState({
      loading: false,
      series: fetchedSeries,
    });
  }

  componentDidUpdate(prevProps, prevState) {
    const {
      studies,
      isStudyLoaded,
      activeViewportIndex,
      viewports,
    } = this.props;

    const activeViewport = viewports[activeViewportIndex];
    const activeDisplaySetInstanceUID = activeViewport
      ? activeViewport.displaySetInstanceUID
      : undefined;

    const prevActiveViewport =
      prevProps.viewports[prevProps.activeViewportIndex];
    const prevActiveDisplaySetInstanceUID = prevActiveViewport
      ? prevActiveViewport.displaySetInstanceUID
      : undefined;

    if (
      studies !== prevProps.studies ||
      activeViewportIndex !== prevProps.activeViewportIndex ||
      activeDisplaySetInstanceUID !== prevActiveDisplaySetInstanceUID
    ) {
      const thumbnails = _mapStudiesToThumbnails(
        studies,
        activeDisplaySetInstanceUID
      );

      this.setState({
        thumbnails,
      });

      // this.loadLastActiveStudy(thumbnails);

      // if (activeDisplaySetInstanceUID)
    }
    if (isStudyLoaded && isStudyLoaded !== prevProps.isStudyLoaded) {
      const PatientID = studies[0] && studies[0].PatientID;
      const { currentTimepointId } = this;

      this.timepointApi.retrieveTimepoints({ PatientID });
      this.measurementApi.retrieveMeasurements(PatientID, [currentTimepointId]);
    }
  }

  _getActiveViewport() {
    return this.props.viewports[this.props.activeViewportIndex];
  }

  loadLastActiveStudy(thumbnails) {
    // let active_study = JSON.parse(localStorage.getItem('active_study'));

    try {
      // if (thumbnails[0].thumbnails[2].displaySetInstanceUID)
      //   this.props.onThumbnailClick(
      //     thumbnails[0].thumbnails[2].displaySetInstanceUID,
      //     this.props.studies
      //   );
    } catch (error) {
      console.error(error);
    }
  }

  handleSidePanelChange = (side, selectedPanel) => {
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

    this.setState(updatedState);
  };

  render() {
    if (this.state.loading) {
      return (
        <div
          style={{
            width: '100vw',
            height: '100vh',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <p style={{ color: 'white', fontSize: '40px' }}>Loading...</p>
        </div>
      );
    }

    let VisiblePanelLeft, VisiblePanelRight;
    const panelExtensions = extensionManager.modules[MODULE_TYPES.PANEL];

    panelExtensions.forEach(panelExt => {
      panelExt.module.components.forEach(comp => {
        if (comp.id === this.state.selectedRightSidePanel) {
          VisiblePanelRight = comp.component;
        } else if (comp.id === this.state.selectedLeftSidePanel) {
          VisiblePanelLeft = comp.component;
        }
      });
    });

    const text = '';
    return (
      <>
        <JobsContextUtil
          series={
            this.props.studies && this.props.studies.length > 0
              ? this.props.studies[0].series
              : []
          }
          overlay={false}
          instance={text}
        />

        {/* TOOLBAR */}
        <ErrorBoundaryDialog context="ToolbarRow">
          <ToolbarRow
            activeViewport={
              this.props.viewports[this.props.activeViewportIndex]
            }
            inEditSegmentationMode={this.state.inEditSegmentationMode}
            isDerivedDisplaySetsLoaded={this.props.isDerivedDisplaySetsLoaded}
            isLeftSidePanelOpen={this.state.isLeftSidePanelOpen}
            isRightSidePanelOpen={this.state.isRightSidePanelOpen}
            selectedLeftSidePanel={
              this.state.isLeftSidePanelOpen
                ? this.state.selectedLeftSidePanel
                : ''
            }
            selectedRightSidePanel={
              this.state.isRightSidePanelOpen
                ? this.state.selectedRightSidePanel
                : ''
            }
            handleSidePanelChange={this.handleSidePanelChange}
            studies={this.props.studies}
          />
        </ErrorBoundaryDialog>

        {/*<ConnectedStudyLoadingMonitor studies={this.props.studies} />*/}
        {/*<StudyPrefetcher studies={this.props.studies} />*/}

        {/* VIEWPORTS + SIDEPANELS */}
        <div className="FlexboxLayout">
          {/* LEFT */}
          <ErrorBoundaryDialog context="LeftSidePanel">
            <SidePanel from="left" isOpen={this.state.isLeftSidePanelOpen}>
              {VisiblePanelLeft ? (
                <VisiblePanelLeft
                  viewports={this.props.viewports}
                  studies={this.props.studies}
                  activeIndex={this.props.activeViewportIndex}
                />
              ) : (
                <ConnectedStudyBrowser
                  studies={this.state.thumbnails}
                  studyMetadata={this.props.studies}
                />
              )}
            </SidePanel>
          </ErrorBoundaryDialog>

          {/* MAIN */}
          <div className={classNames('main-content')}>
            <ErrorBoundaryDialog context="ViewerMain">
              <ConnectedViewerMain
                studies={_removeUnwantedSeries(
                  this.props.studies,
                  this.source_series_ref
                )}
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
                />
              )}
            </SidePanel>
          </ErrorBoundaryDialog>
        </div>
      </>
    );
  }
}

export default withRouter(withDialog(Viewer));

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
const _checkForSeriesInconsistencesWarnings = async function(
  displaySet,
  studies
) {
  if (displaySet.inconsistencyWarnings) {
    // warnings already checked and cached in displaySet
    return displaySet.inconsistencyWarnings;
  }
  const inconsistencyWarnings = [];

  if (displaySet.Modality !== 'SEG') {
    if (
      displaySet.reconstructionIssues &&
      displaySet.reconstructionIssues.length !== 0
    ) {
      displaySet.reconstructionIssues.forEach(warning => {
        switch (warning) {
          case ReconstructionIssues.DATASET_4D:
            inconsistencyWarnings.push('The dataset is 4D.');
            break;
          case ReconstructionIssues.VARYING_IMAGESDIMENSIONS:
            inconsistencyWarnings.push(
              'The dataset frames have different dimensions (rows, columns).'
            );
            break;
          case ReconstructionIssues.VARYING_IMAGESCOMPONENTS:
            inconsistencyWarnings.push(
              'The dataset frames have different components (Sample per pixel).'
            );
            break;
          case ReconstructionIssues.VARYING_IMAGESORIENTATION:
            inconsistencyWarnings.push(
              'The dataset frames have different orientation.'
            );
            break;
          case ReconstructionIssues.IRREGULAR_SPACING:
            inconsistencyWarnings.push(
              'The dataset frames have different pixel spacing.'
            );
            break;
          case ReconstructionIssues.MULTIFFRAMES:
            inconsistencyWarnings.push('The dataset is a multiframes.');
            break;
          default:
            break;
        }
      });
      inconsistencyWarnings.push(
        'The datasets is not a reconstructable 3D volume. MPR mode is not available.'
      );
    }

    if (
      displaySet.missingFrames &&
      (!displaySet.reconstructionIssues ||
        (displaySet.reconstructionIssues &&
          !displaySet.reconstructionIssues.find(
            warn => warn === ReconstructionIssues.DATASET_4D
          )))
    ) {
      inconsistencyWarnings.push(
        'The datasets is missing frames: ' + displaySet.missingFrames + '.'
      );
    }
  } else {
    const segMetadata = displaySet.metadata;
    if (!segMetadata) {
      displaySet.inconsistencyWarnings = inconsistencyWarnings;
      return inconsistencyWarnings;
    }

    const { referencedDisplaySet } = displaySet.getSourceDisplaySet(
      studies,
      false
    );
    if (!referencedDisplaySet) {
      displaySet.inconsistencyWarnings = inconsistencyWarnings;
      return inconsistencyWarnings;
    }

    const imageIds = referencedDisplaySet.images.map(image =>
      image.getImageId()
    );
    if (!imageIds || imageIds.length === 0) {
      displaySet.inconsistencyWarnings = inconsistencyWarnings;
      return inconsistencyWarnings;
    }

    for (
      let i = 0,
        groupsLen = segMetadata.PerFrameFunctionalGroupsSequence.length;
      i < groupsLen;
      ++i
    ) {
      const PerFrameFunctionalGroups =
        segMetadata.PerFrameFunctionalGroupsSequence[i];
      if (!PerFrameFunctionalGroups) {
        continue;
      }

      let SourceImageSequence = undefined;
      if (segMetadata.SourceImageSequence) {
        SourceImageSequence = segMetadata.SourceImageSequence[i];
      } else if (PerFrameFunctionalGroups.DerivationImageSequence) {
        SourceImageSequence =
          PerFrameFunctionalGroups.DerivationImageSequence.SourceImageSequence;
      }
      if (!SourceImageSequence) {
        if (inconsistencyWarnings.length === 0) {
          const warningMessage =
            'The segmentation ' +
            'has frames out of plane respect to the source images.';
          inconsistencyWarnings.push(warningMessage);
        }
        continue;
      }

      const { ReferencedSOPInstanceUID } = SourceImageSequence;

      const imageId = imageIds.find(imageId => {
        const sopCommonModule = cornerstone.metaData.get(
          'sopCommonModule',
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

      const sourceImageMetadata = cornerstone.metaData.get('instance', imageId);
      if (
        segMetadata.Rows !== sourceImageMetadata.Rows ||
        segMetadata.Columns !== sourceImageMetadata.Columns
      ) {
        const warningMessage =
          'The segmentation ' +
          'has frames with different geometry ' +
          'dimensions (Rows and Columns) respect to the source images.';
        inconsistencyWarnings.push(warningMessage);
        break;
      }
    }

    if (inconsistencyWarnings.length !== 0) {
      const warningMessage =
        'The segmentation format is not supported yet. ' +
        'The segmentation data (segments) could not be loaded.';
      inconsistencyWarnings.push(warningMessage);
    }
  }

  // cache the warnings
  displaySet.inconsistencyWarnings = inconsistencyWarnings;
  return inconsistencyWarnings;
};

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
  if (
    displaySet.Modality !== 'SEG' &&
    displaySet.Modality !== 'RTSTRUCT' &&
    displaySet.Modality !== 'RTDOSE'
  ) {
    active = activeDisplaySetInstanceUID === displaySetInstanceUID;
  } else if (displaySet.getSourceDisplaySet) {
    if (displaySet.Modality === 'SEG') {
      const { referencedDisplaySet } = displaySet.getSourceDisplaySet(
        studies,
        false
      );
      active = referencedDisplaySet
        ? activeDisplaySetInstanceUID ===
          referencedDisplaySet.displaySetInstanceUID
        : false;
    } else {
      const referencedDisplaySet = displaySet.getSourceDisplaySet(
        studies,
        false
      );
      active = referencedDisplaySet
        ? activeDisplaySetInstanceUID ===
          referencedDisplaySet.displaySetInstanceUID
        : false;
    }
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
    const { StudyInstanceUID } = study;
    const thumbnails = study.displaySets.map(displaySet => {
      const {
        displaySetInstanceUID,
        SeriesDescription,
        InstanceNumber,
        numImageFrames,
        SeriesNumber,
      } = displaySet;

      let imageId;
      let altImageText;

      if (displaySet.Modality && displaySet.Modality === 'SEG') {
        // TODO: We want to replace this with a thumbnail showing
        // the segmentation map on the image, but this is easier
        // and better than what we have right now.
        altImageText = 'SEG';
      } else if (displaySet.images && displaySet.images.length) {
        const imageIndex = Math.floor(displaySet.images.length / 2);
        imageId = displaySet.images[imageIndex].getImageId();
      } else {
        altImageText = displaySet.Modality ? displaySet.Modality : 'UN';
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
      };
    });

    return {
      StudyInstanceUID,
      thumbnails,
    };
  });
};

const _removeUnwantedSeries = function(studies, source_series) {
  const allData = studies;

  const filteredDatasets = [];

  // const source_series = [
  // '1.3.6.1.4.1.14519.5.2.1.6450.4012.137394205856739469389144102217',
  // ];

  if (allData.length > 0) {
    // filtering through the displaySets for source data (same can be done for the series)
    allData[0].displaySets.filter(data => {
      source_series.filter(seriesUID => {
        // console.log({ seriesUID, dataSeries: data.SeriesInstanceUID });
        if (data.SeriesInstanceUID === seriesUID) {
          // console.log({ Found: 'Found series!!!' });
          filteredDatasets.push(data);
        }
      });
    });

    // remapping the data to have the filtered displaySets
    allData.map(data => {
      data.displaySets = filteredDatasets;
    });
  }

  return allData;
};
