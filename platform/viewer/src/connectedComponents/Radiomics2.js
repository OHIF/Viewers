import React, { Component, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import './Radiomics.css';
import { withRouter, matchPath } from 'react-router';
import cornerstoneTools from 'cornerstone-tools';

import OHIF, { MODULE_TYPES, DICOMSR } from '@ohif/core';
import { withDialog } from '@ohif/ui';
import moment from 'moment';
import ConnectedViewerMain from './ConnectedViewerMain.js';
import ErrorBoundaryDialog from '../components/ErrorBoundaryDialog';
import { commandsManager, extensionManager } from '../App.js';
import { ReconstructionIssues } from '../../../core/src/enums.js';
import '../googleCloud/googleCloud.css';
// import Lottie from 'lottie-react';
import cornerstone from 'cornerstone-core';

import './Viewer.css';
import JobsContextUtil from './JobsContextUtil.js';
import ToolbarRow from './RadiomicsToolbarRow';
import SidePanel from '../components/SidePanel';
import ConnectedStudyBrowser from './ConnectedStudyBrowser';
import { getEnabledElement } from '../../../../extensions/cornerstone/src/state';
import eventBus from '../lib/eventBus';
import { Icon } from '../../../ui/src/elements/Icon';
import { radcadapi } from '../utils/constants';
import ReactToPrint, { PrintContextConsumer } from 'react-to-print';

const RadiomicSummary = props => {
  const printDiv = () => {
    // e.preventDefault();
    // const bodyElement = document.getElementsByTagName('body')[0];
    // bodyElement.classList.add('printing');
    // const exporter = new html2pdf(bodyElement, { filename: 'NotaSimple.pdf' });
    // exporter.getPdf(true);
    // bodyElement.classList.remove('printing');
  };

  return (
    <div
      style={{
        width: '100%',
        background: '#000000',
        borderRadius: '8px',
        padding: '20px',
      }}
    >
      <div
        style={{
          paddingBottom: '40px',
        }}
      >
        <h1
          style={{
            textAlign: 'left',
            margin: 0,
          }}
        >
          RadCard Report Summary
        </h1>
      </div>

      <div
        style={{
          height: '100%',
          flex: 1,
        }}
      >
        <div
          className=""
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'flex-start',
          }}
        >
          <h2
            className="cad"
            style={{
              color: '#00c7ee',
            }}
          >
            Patient ID :{' '}
          </h2>
          <h2>abc123 </h2>
        </div>
        <div
          className=""
          style={{
            display: 'flex',
            marginTop: 12,
            flexDirection: 'row',
            justifyContent: 'flex-start',
          }}
        >
          <h2
            className="cad"
            style={{
              color: '#00c7ee',
            }}
          >
            Classifier:{' '}
          </h2>
          <h2>Resnet-18 </h2>
        </div>

        <div
          className=""
          style={{
            display: 'flex',
            marginTop: 12,
            flexDirection: 'row',
            justifyContent: 'flex-start',
          }}
        >
          <h2
            className="cad"
            style={{
              color: '#00c7ee',
            }}
          >
            Prediction:{' '}
          </h2>
          <h2>Necrosis</h2>
        </div>

        <div
          className=""
          style={{
            display: 'flex',
            flexDirection: 'row',
            marginTop: 12,
            justifyContent: 'flex-start',
          }}
        >
          <h2
            className="cad"
            style={{
              color: '#00c7ee',
            }}
          >
            Confidence:{' '}
          </h2>
          <h2>81%</h2>
        </div>

        <div
          className=""
          style={{
            marginTop: 12,
          }}
        >
          <button
            // onClick={handlePrint}
            // style={{
            //   marginTop: '20px',
            //   border: '1px yellow solid',
            //   fontSize: '24px',
            //   background: 'black',
            //   color: 'white',
            //   padding: '12px',
            // }}
            className="btn btn-primary btn-large"
          >
            Print To PDF
          </button>
        </div>
      </div>

      <div
        style={{
          flex: 1,
        }}
      ></div>
    </div>
  );
};

const Morphology = () => {
  return (
    <div
      className=""
      style={{
        width: '100%',
        height: '100%',
        padding: '20px',
        borderRadius: '8px',
        background: '#000000',
      }}
    >
      <div className="">
        <h1
          style={{
            textAlign: 'left',
            margin: 0,
          }}
        >
          3D Morphology{' '}
        </h1>
      </div>
    </div>
  );
};

const Radiomics = props => {
  const [thumbnails, setThumbnails] = useState([]);
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [complete, setComplete] = useState(false);

  const [isRightSidePanelOpen, setRightSidePanelOpen] = useState(false);
  const [isLeftSidePanelOpen, setLeftSidePanelOpen] = useState(true);
  const [showSegments, setShowSegments] = useState(true);
  const [selectedLeftSidePanel, setSelectedLeftSidePanel] = useState('');
  const [selectedRightSidePanel, setSelectedRightSidePanel] = useState('');
  const { TimepointApi, MeasurementApi } = OHIF.measurements;

  let currentTimepointId = 'TimepointId';

  const { activeServer } = props;
  const server = Object.assign({}, activeServer);
  let measurementApi = null;
  let timepointApi = null;
  const retrieveTimepoints = filter => {
    OHIF.log.info('retrieveTimepoints');

    // Get the earliest and latest study date
    let earliestDate = new Date().toISOString();
    let latestDate = new Date().toISOString();
    if (props.studies) {
      latestDate = new Date('1000-01-01').toISOString();
      props.studies.forEach(study => {
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
        studyInstanceUIDs: props.studyInstanceUIDs,
        PatientID: filter.PatientID,
        earliestDate,
        latestDate,
        isLocked: false,
      },
    ]);
  };

  const storeTimepoints = timepointData => {
    OHIF.log.info('storeTimepoints');
    return Promise.resolve();
  };

  const updateTimepoint = (timepointData, query) => {
    OHIF.log.info('updateTimepoint');
    return Promise.resolve();
  };

  const removeTimepoint = timepointId => {
    OHIF.log.info('removeTimepoint');
    return Promise.resolve();
  };

  const disassociateStudy = (timepointIds, StudyInstanceUID) => {
    OHIF.log.info('disassociateStudy');
    return Promise.resolve();
  };

  OHIF.measurements.MeasurementApi.setConfiguration({
    dataExchange: {
      retrieve: DICOMSR.retrieveMeasurements,
      store: DICOMSR.storeMeasurements,
    },
    server,
  });

  OHIF.measurements.TimepointApi.setConfiguration({
    dataExchange: {
      retrieve: retrieveTimepoints,
      store: storeTimepoints,
      remove: removeTimepoint,
      update: updateTimepoint,
      disassociate: disassociateStudy,
    },
  });

  let fetchSeriesRef = false;
  let source_series_ref = [];
  let tim;

  const _getActiveViewport = () => {
    return props.viewports[props.activeViewportIndex];
  };

  const onTimepointsUpdated = timepoints => {
    if (props.onTimepointsUpdated) {
      props.onTimepointsUpdated(timepoints);
    }
  };

  const onMeasurementsUpdated = measurements => {
    if (props.onMeasurementsUpdated) {
      props.onMeasurementsUpdated(measurements);
    }
  };

  const handleFetchAndSetSeries = async studyInstanceUID => {
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

    fetchSeriesRef = false;
    source_series_ref = fetchedSeries;
    setLoading(false);
    setSeries(fetchedSeries);
  };

  const handleSidePanelChange = (side, selectedPanel) => {
    if (side == 'right') {
      const isSameSelectedPanel =
        selectedRightSidePanel === selectedPanel || selectedPanel === null;
      setSelectedRightSidePanel(selectedPanel || selectedRightSidePanel);

      const isClosedOrShouldClose =
        !isRightSidePanelOpen || isSameSelectedPanel;

      if (isClosedOrShouldClose) {
        setRightSidePanelOpen(!isRightSidePanelOpen);
      }
    } else if ((side = 'left')) {
      const isSameSelectedPanel =
        selectedLeftSidePanel === selectedPanel || selectedPanel === null;

      setSelectedRightSidePanel(selectedPanel || selectedLeftSidePanel);

      const isClosedOrShouldClose = !isLeftSidePanelOpen || isSameSelectedPanel;

      if (isClosedOrShouldClose) {
        setLeftSidePanelOpen(!isLeftSidePanelOpen);
      }
    }
  };

  const triggerReload = () => {
    setTimeout(() => {
      try {
        document.getElementById('trigger').click();
      } catch (error) {}
    }, 5000);
  };

  const onCornerstageLoaded = enabledEvt => {
    setTimeout(() => {
      const enabledElement = enabledEvt.detail.element;

      let tool_data = localStorage.getItem(props.studyInstanceUID);
      tool_data =
        tool_data && tool_data !== 'undefined' ? JSON.parse(tool_data) : {};
      if (enabledElement && tool_data) {
        let viewport = cornerstone.getViewport(enabledElement);
        if (tool_data.x) viewport.translation.x = tool_data.x;
        if (tool_data.y) viewport.translation.y = tool_data.y;
        if (tool_data.scale) viewport.scale = tool_data.scale;
        if (tool_data.voi) viewport.voi = tool_data.voi;
        cornerstone.setViewport(enabledElement, viewport);
      }

      handleSidePanelChange('right', 'theta-details-panel');
      handleSidePanelChange('left', 'lung-module-similarity-panel');

      //  handle radiomicsDone
      const radiomicsDone = JSON.parse(
        localStorage.getItem('radiomicsDone') || 0
      );
      setComplete(radiomicsDone == 1 ? true : false);
      triggerReload();
    }, 2000);
  };

  useEffect(() => {
    const { studies, isStudyLoaded, ...rest } = props;
    handleFetchAndSetSeries(rest.studyInstanceUIDs[0]);

    // timepointApi = new TimepointApi(currentTimepointId, {
    //   onTimepointsUpdated: onTimepointsUpdated,
    // });

    // measurementApi = new MeasurementApi(timepointApi, {
    //   onMeasurementsUpdated: onMeasurementsUpdated,
    // });

    if (studies) {
      const PatientID = studies[0] && studies[0].PatientID;

      // timepointApi.retrieveTimepoints({ PatientID });
      // if (isStudyLoaded) {
      //   measurementApi.retrieveMeasurements(PatientID, [currentTimepointId]);
      // }

      const activeViewport = props.viewports[props.activeViewportIndex];
      const activeDisplaySetInstanceUID = activeViewport
        ? activeViewport.displaySetInstanceUID
        : undefined;

      setThumbnails(
        _mapStudiesToThumbnails(studies, activeDisplaySetInstanceUID)
      );
    }

    cornerstone.events.addEventListener(
      cornerstone.EVENTS.ELEMENT_ENABLED,
      onCornerstageLoaded
    );
    return () => {
      if (props.dialog) {
        props.dialog.dismissAll();
      }
      const view_ports = cornerstone.getEnabledElements();
      const viewports = view_ports[0];
      const element = getEnabledElement(view_ports.indexOf(viewports));
      if (element)
        cornerstoneTools.globalImageIdSpecificToolStateManager.clear(element);

      cornerstone.events.removeEventListener(
        cornerstone.EVENTS.ELEMENT_ENABLED,
        onCornerstageLoaded
      );
    };
  }, []);

  useEffect(() => {
    const { studies, isStudyLoaded, activeViewportIndex, viewports } = props;

    if (studies && activeViewportIndex && activeDisplaySetInstanceUID) {
      setThumbnails(
        _mapStudiesToThumbnails(studies, activeDisplaySetInstanceUID)
      );
    }

    timepointApi = new TimepointApi(currentTimepointId, {
      onTimepointsUpdated: onTimepointsUpdated,
    });

    measurementApi = new MeasurementApi(timepointApi, {
      onMeasurementsUpdated: onMeasurementsUpdated,
    });

    if (isStudyLoaded) {
      const view_ports = cornerstone.getEnabledElements();

      const PatientID = studies[0] && studies[0].PatientID;
      timepointApi.retrieveTimepoints({ PatientID });
      measurementApi.retrieveMeasurements(PatientID, [currentTimepointId]);
    }
  }, [
    props.isStudyLoaded,
    props.studies,
    props.activeViewportIndex,
    props.activeDisplaySetInstanceUID,
  ]);

  if (loading) {
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

  let SimilarScans, CollageView, extraPanel;
  const panelExtensions = extensionManager.modules[MODULE_TYPES.PANEL];

  panelExtensions.forEach(panelExt => {
    panelExt.module.components.forEach(comp => {
      if (comp.id === selectedRightSidePanel) {
        CollageView = comp.component;
      } else if (comp.id === selectedLeftSidePanel) {
        SimilarScans = comp.component;
      }
    });
  });

  const text = '';

  return (
    <div style={{}}>
      <JobsContextUtil
        series={
          props.studies && props.studies.length > 0
            ? props.studies[0].series
            : []
        }
        overlay={false}
        instance={text}
      />
      {/* {!complete && ( */}
      {false && (
        <div
          style={{
            width: '100%',
            height: '70vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* <div className="loading-image"> */}
          <Icon name="circle-notch" className="icon-spin" />
          {/* </div> */}
        </div>
      )}

      <div
        className="printView"
        style={{
          paddingBottom: 140,
          // display: complete ? 'block' : 'none',
        }}
      >
        <div className="container"></div>
        <div className="container">
          <div className="container-item">
            <RadiomicSummary />
            {/* RIGHT */}
            <div
              style={{
                marginTop: '20px',
                width: '100%',
                borderRadius: '8px',
                background: '#000000',
                padding: '20px',
              }}
            >
              <div>
                <h1
                  style={{
                    textAlign: 'left',
                    margin: 0,
                  }}
                >
                  Similarity Looking Scans
                </h1>
              </div>

              <ErrorBoundaryDialog context="RightSidePanel">
                <div>
                  {SimilarScans && (
                    <SimilarScans
                      isOpen={true}
                      viewports={props.viewports}
                      studies={props.studies}
                      activeIndex={props.activeViewportIndex}
                      activeViewport={
                        props.viewports[props.activeViewportIndex]
                      }
                      getActiveViewport={_getActiveViewport}
                    />
                  )}
                </div>
              </ErrorBoundaryDialog>
            </div>
          </div>
          <div className="container-item-extra">
            {/* VIEWPORTS + SIDEPANELS */}
            <div
              style={{
                width: '100%',
                background: '#000000',
                borderRadius: '8px',
                padding: '20px',
              }}
            >
              <div>
                <h1
                  style={{
                    textAlign: 'left',
                    margin: 0,
                  }}
                >
                  Collage
                </h1>
              </div>

              {/* MAIN */}
              <div className="container">
                <div className="container-item-extra">
                  <div className={classNames('main-content')}>
                    <ErrorBoundaryDialog context="ViewerMain">
                      <ConnectedViewerMain
                        studies={_removeUnwantedSeries(
                          props.studies,
                          source_series_ref
                        )}
                        isStudyLoaded={props.isStudyLoaded}
                      />
                    </ErrorBoundaryDialog>

                    <div></div>
                  </div>
                </div>

                <div className="container-item">
                  <ErrorBoundaryDialog context="RightSidePanel">
                    <div>
                      {CollageView && (
                        <CollageView
                          isOpen={true}
                          viewports={props.viewports}
                          studies={props.studies}
                          activeIndex={props.activeViewportIndex}
                          activeViewport={
                            props.viewports[props.activeViewportIndex]
                          }
                          getActiveViewport={_getActiveViewport}
                        />
                      )}
                    </div>
                  </ErrorBoundaryDialog>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="container">
          {/* <div className="container-item">

          </div> */}
          <div className="container-item">
            <Morphology />
          </div>
        </div>
      </div>

      <div className="FlexboxLayout">{/* LEFT */}</div>
    </div>
  );
};

export default withRouter(withDialog(Radiomics));

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
