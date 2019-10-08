import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { MODULE_TYPES } from '@ohif/core';
import OHIF from '@ohif/core';
import moment from 'moment';
import ConnectedHeader from './ConnectedHeader.js';
import ConnectedToolbarRow from './ConnectedToolbarRow.js';
import ConnectedLabellingOverlay from './ConnectedLabellingOverlay';
import ConnectedStudyBrowser from './ConnectedStudyBrowser.js';
import ConnectedViewportGrid from './ConnectedViewportGrid.js';
import ConnectedToolContextMenu from './ConnectedToolContextMenu.js';
import SidePanel from './../components/SidePanel.js';
import { extensionManager } from './../App.js';

// Contexts
import WhiteLabellingContext from '../context/WhiteLabellingContext.js';
import UserManagerContext from '../context/UserManagerContext';

import './Viewer.css';

class Viewer extends Component {
  static propTypes = {
    studies: PropTypes.array,
    studyInstanceUids: PropTypes.array,
    // These are measurements API. Probably shouldn't live in viewer?
    onTimepointsUpdated: PropTypes.func,
    onMeasurementsUpdated: PropTypes.func,
    numRows: PropTypes.number.isRequired,
    numColumns: PropTypes.number.isRequired,
    viewportPanes: PropTypes.arrayOf(
      PropTypes.shape({
        plugin: PropTypes.string,
        // FUTURE:
        // order?
        // columnSpan
        // rowSpan
      })
    ).isRequired,
    activeViewportIndex: PropTypes.number.isRequired,
  };

  constructor(props) {
    super(props);
    OHIF.measurements.MeasurementApi.setConfiguration({
      dataExchange: {
        retrieve: this.retrieveMeasurements,
        store: this.storeMeasurements,
      },
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
  }

  state = {
    isLeftSidePanelOpen: true,
    isRightSidePanelOpen: false,
    selectedRightSidePanel: '',
    selectedLeftSidePanel: 'studies', // TODO: Don't hardcode this
    thumbnails: [],
  };

  retrieveMeasurements = (patientId, timepointIds) => {
    OHIF.log.info('retrieveMeasurements');
    // TODO: Retrieve the measurements from the latest available SR
    return Promise.resolve();
  };

  storeMeasurements = (measurementData, timepointIds) => {
    OHIF.log.info('storeMeasurements');
    // TODO: Store the measurements into a new SR sent to the active server
    return Promise.resolve();
  };

  retrieveTimepoints = filter => {
    OHIF.log.info('retrieveTimepoints');

    // Get the earliest and latest study date
    let earliestDate = new Date().toISOString();
    let latestDate = new Date().toISOString();
    if (this.props.studies) {
      latestDate = new Date('1000-01-01').toISOString();
      this.props.studies.forEach(study => {
        const studyDate = moment(study.studyDate, 'YYYYMMDD').toISOString();
        if (studyDate < earliestDate) {
          earliestDate = studyDate;
        }
        if (studyDate > latestDate) {
          latestDate = studyDate;
        }
      });
    }

    // Return a generic timepoint
    return Promise.resolve([
      {
        timepointType: 'baseline',
        timepointId: 'TimepointId',
        studyInstanceUids: this.props.studyInstanceUids,
        patientId: filter.patientId,
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

  disassociateStudy = (timepointIds, studyInstanceUid) => {
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
    const { studies } = this.props;
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
      const patientId = studies[0] && studies[0].patientId;
      this.fillEmptyViewportPanes(studies);

      timepointApi.retrieveTimepoints({ patientId });
      measurementApi.retrieveMeasurements(patientId, [currentTimepointId]);

      this.setState({
        thumbnails: _mapStudiesToThumbnails(studies),
      });
    }
  }

  componentDidUpdate(prevProps) {
    const { studies, numRows, numColumns, viewportPanes } = this.props;
    const {
      numRows: prevNumRows,
      numColumns: prevNumColumns,
      viewportPanes: prevViewportPanes, // May need a better equality check here
    } = prevProps;

    const layoutHasChanged =
      numRows !== prevNumRows ||
      numColumns !== prevNumColumns ||
      viewportPanes !== prevViewportPanes;

    if (studies !== prevProps.studies || layoutHasChanged) {
      const patientId = studies[0] && studies[0].patientId;
      const currentTimepointId = this.currentTimepointId;
      this.fillEmptyViewportPanes(studies);

      this.timepointApi.retrieveTimepoints({ patientId });
      this.measurementApi.retrieveMeasurements(patientId, [currentTimepointId]);

      this.setState({
        thumbnails: _mapStudiesToThumbnails(studies),
      });
    }
  }

  componentWillUnmount() {
    // Clear the entire viewport specific data
    const { viewportPanes } = this.props;
    for (let i = 0; i < viewportPanes.length; i++) {
      this.props.clearViewportSpecificData(i);
    }
  }

  /*
   * fillEmptyViewportPanes should eventually be replaced by simplified/correct state
   *   - Could use a "selector" instead of updating in component
   */
  fillEmptyViewportPanes = studies => {
    const dirtyViewportPanes = [];
    const { viewportPanes } = this.props;

    // If the viewport is empty, get one available in study
    // This is how we grab "next available"
    const allDisplaySets = [];

    studies.forEach(study => {
      // console.log(study);
      const studyWadoRoot = study.wadoRoot;
      const studyWadoUri = study.wadoUriRoot;

      study.displaySets.forEach(dSet => {
        console.log(dSet);
        // dSet has a `dicomWebClient`....
        allDisplaySets.push({
          displaySetInstanceUid: dSet.displaySetInstanceUid,
          studyInstanceUid: dSet.studyInstanceUid, // Could be multiple?
          seriesInstanceUid: dSet.seriesInstanceUid,
          plugin: dSet.plugin || 'cornerstone',
          //
          authorizationHeaders: dSet.authorizationHeaders,
          // modality
          // sopInstanceUid: dSet.sopInstanceUid
          sopClassUids: dSet.sopClassUids,
          // May not exist on display set (ever)
          wadoRoot: dSet.wadoRoot || studyWadoRoot,
          wadoUri: dSet.wadoUri || studyWadoUri,
        });
      });
    });

    // No display sets to show
    if (!allDisplaySets.length) {
      return;
    }

    for (let i = 0; i < viewportPanes.length; i++) {
      const viewportIndex = i;
      const viewportPane = viewportPanes[i];
      const isNonEmptyViewport =
        viewportPane &&
        viewportPane.studyInstanceUid &&
        viewportPane.displaySetInstanceUid;

      if (isNonEmptyViewport) {
        dirtyViewportPanes.push(undefined);
        continue;
      }

      const foundDisplaySet =
        // First unused display set
        allDisplaySets.find(
          ds =>
            !viewportPanes.some(
              v => v && v.displaySetInstanceUid === ds.displaySetInstanceUid
            ) &&
            !dirtyViewportPanes.some(
              v => v && v.displaySetInstanceUid === ds.displaySetInstanceUid
            )
        ) ||
        // Or last display set
        allDisplaySets[allDisplaySets.length - 1];

      if (!foundDisplaySet) {
        dirtyViewportPanes.push(undefined);
        continue;
      }

      const {
        studyInstanceUid,
        seriesInstanceUid,
        displaySetInstanceUid,
        plugin,
        authorizationHeaders,
        sopClassUids,
        wadoRoot,
        wadoUri,
      } = foundDisplaySet;

      dirtyViewportPanes.push({
        viewportIndex,
        studyInstanceUid,
        seriesInstanceUid,
        displaySetInstanceUid,
        plugin: viewportPane.plugin || plugin,
        authorizationHeaders,
        sopClassUids,
        wadoRoot,
        wadoUri,
      });
    }

    dirtyViewportPanes.forEach((vp, i) => {
      if (vp) {
        console.warn('UPDATE VP: ', vp);
        this.props.updateViewport(i, vp);
      }
    });
  };

  setViewportData = ({
    viewportIndex,
    studyInstanceUid,
    displaySetInstanceUid,
  }) => {
    const displaySet = this.findDisplaySet(
      this.props.studies,
      studyInstanceUid,
      displaySetInstanceUid
    );


    this.props.updateViewport(viewportIndex, displaySet);
  };

  findDisplaySet(studies, studyInstanceUid, displaySetInstanceUid) {
    const study = studies.find(study => {
      return study.studyInstanceUid === studyInstanceUid;
    });

    if (!study) {
      return;
    }

    return study.displaySets.find(displaySet => {
      return displaySet.displaySetInstanceUid === displaySetInstanceUid;
    });
  }

  render() {
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

    return (
      <>
        {/* HEADER */}
        <WhiteLabellingContext.Consumer>
          {whiteLabelling => (
            <UserManagerContext.Consumer>
              {userManager => (
                <ConnectedHeader home={false} userManager={userManager}>
                  {whiteLabelling.logoComponent}
                </ConnectedHeader>
              )}
            </UserManagerContext.Consumer>
          )}
        </WhiteLabellingContext.Consumer>

        {/* TOOLBAR */}
        <ConnectedToolbarRow
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

            this.setState(updatedState);
          }}
        />

        {/*<ConnectedStudyLoadingMonitor studies={this.props.studies} />*/}
        {/*<StudyPrefetcher studies={this.props.studies} />*/}

        {/* VIEWPORTS + SIDEPANELS */}
        <div className="FlexboxLayout">
          {/* LEFT */}
          <SidePanel from="left" isOpen={this.state.isLeftSidePanelOpen}>
            {VisiblePanelLeft ? (
              <VisiblePanelLeft
                viewports={this.props.viewports}
                activeIndex={this.props.activeViewportIndex}
              />
            ) : (
              <ConnectedStudyBrowser studies={this.state.thumbnails} />
            )}
          </SidePanel>

          {/* MAIN */}
          <div className={classNames('main-content')}>
            {this.props.viewportPanes && (
              <ConnectedViewportGrid
                studies={this.props.studies}
                numRows={this.props.numRows}
                numColumns={this.props.numColumns}
                viewportPanes={this.props.viewportPanes}
                setViewportData={this.setViewportData}
              >
                {/* Children to add to each viewport that support children */}
                <ConnectedToolContextMenu />
              </ConnectedViewportGrid>
            )}
          </div>

          {/* RIGHT */}
          <SidePanel from="right" isOpen={this.state.isRightSidePanelOpen}>
            {VisiblePanelRight && (
              <VisiblePanelRight
                viewports={this.props.viewports}
                activeIndex={this.props.activeViewportIndex}
              />
            )}
          </SidePanel>
        </div>
        <ConnectedLabellingOverlay />
      </>
    );
  }
}

export default Viewer;

/**
 * What types are these? Why do we have "mapping" dropped in here instead of in
 * a mapping layer?
 *
 * TODO[react]:
 * - Add sorting of display sets
 * - Add showStackLoadingProgressBar option
 *
 * @param {Study[]} studies
 * @param {DisplaySet[]} studies[].displaySets
 */
const _mapStudiesToThumbnails = function(studies) {
  return studies.map(study => {
    const { studyInstanceUid } = study;

    const thumbnails = study.displaySets.map(displaySet => {
      const {
        displaySetInstanceUid,
        seriesDescription,
        seriesNumber,
        instanceNumber,
        numImageFrames,
      } = displaySet;

      let imageId;
      let altImageText;

      if (displaySet.modality && displaySet.modality === 'SEG') {
        // TODO: We want to replace this with a thumbnail showing
        // the segmentation map on the image, but this is easier
        // and better than what we have right now.
        altImageText = 'SEG';
      } else if (displaySet.images && displaySet.images.length) {
        const imageIndex = Math.floor(displaySet.images.length / 2);

        imageId = displaySet.images[imageIndex].getImageId();
      } else {
        altImageText = displaySet.modality ? displaySet.modality : 'UN';
      }

      return {
        imageId,
        altImageText,
        displaySetInstanceUid,
        seriesDescription,
        seriesNumber,
        instanceNumber,
        numImageFrames,
      };
    });

    return {
      studyInstanceUid,
      thumbnails,
    };
  });
};
