import React, { Component } from 'react';
import PropTypes from 'prop-types';
//import OHIF from 'ohif-core';
//import { CineDialog } from 'react-viewerbase';

import OHIF from 'ohif-core';
import moment from 'moment';
import WhiteLabellingContext from '../WhiteLabellingContext.js';
import ConnectedHeader from './ConnectedHeader.js';
import ConnectedFlexboxLayout from './ConnectedFlexboxLayout.js';
import ConnectedToolbarRow from './ConnectedToolbarRow.js';
import ConnectedLabellingOverlay from './ConnectedLabellingOverlay';
import './Viewer.css';
/**
 * Inits OHIF Hanging Protocol's onReady.
 * It waits for OHIF Hanging Protocol to be ready to instantiate the ProtocolEngine
 * Hanging Protocol will use OHIF LayoutManager to render viewports properly
 */
/*const initHangingProtocol = () => {
    // When Hanging Protocol is ready
    HP.ProtocolStore.onReady(() => {

        // Gets all StudyMetadata objects: necessary for Hanging Protocol to access study metadata
        const studyMetadataList = OHIF.viewer.StudyMetadataList.all();

        // Instantiate StudyMetadataSource: necessary for Hanging Protocol to get study metadata
        const studyMetadataSource = new OHIF.studies.classes.OHIFStudyMetadataSource();

        // Get prior studies map
        const studyPriorsMap = OHIF.studylist.functions.getStudyPriorsMap(studyMetadataList);

        // Creates Protocol Engine object with required arguments
        const ProtocolEngine = new HP.ProtocolEngine(layoutManager, studyMetadataList, studyPriorsMap, studyMetadataSource);

        // Sets up Hanging Protocol engine
        HP.setEngine(ProtocolEngine);
    });
};*/

/*const viewportUtils = OHIF.viewerbase.viewportUtils;

OHIF.viewer.functionList = {
    toggleCineDialog: viewportUtils.toggleCineDialog,
    toggleCinePlay: viewportUtils.toggleCinePlay,
    clearTools: viewportUtils.clearTools,
    resetViewport: viewportUtils.resetViewport,
    invert: viewportUtils.invert
};*/

class Viewer extends Component {
  static propTypes = {
    studies: PropTypes.array,
    studyInstanceUids: PropTypes.array,
    onTimepointsUpdated: PropTypes.func,
    onMeasurementsUpdated: PropTypes.func,
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

    const patientId = studies[0] && studies[0].patientId;
    timepointApi.retrieveTimepoints({ patientId });
    measurementApi.retrieveMeasurements(patientId, [currentTimepointId]);
  }

  render() {
    return (
      <>
        <WhiteLabellingContext.Consumer>
          {whiteLabelling => (
            <ConnectedHeader home={false}>
              {whiteLabelling.logoComponent}
            </ConnectedHeader>
          )}
        </WhiteLabellingContext.Consumer>
        <div id="viewer" className="Viewer">
          <ConnectedToolbarRow />
          {/*<ConnectedStudyLoadingMonitor studies={this.props.studies} />*/}
          {/*<StudyPrefetcher studies={this.props.studies} />*/}
          <ConnectedFlexboxLayout studies={this.props.studies} />
          <ConnectedLabellingOverlay />
        </div>
      </>
    );
  }
}

export default Viewer;
