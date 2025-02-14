import React, { Component } from 'react';
import * as cornerstone from '@cornerstonejs/core';
import OHIF from '@ohif/core';
import PropTypes from 'prop-types';
import qs from 'node:querystring';

import { extensionManager, commandsManager } from '../App.js';
import ConnectedViewer from '../connectedComponents/ConnectedViewer.js';
import ConnectedViewerRetrieveStudyData from '../connectedComponents/ConnectedViewerRetrieveStudyData.js';
import NotFound from './NotFound/index.js';

import { isLoggedIn, xnatAuthenticate } from '../../../../extensions/xnat/src/index';
import retrieveDicomWebMetadata from '../lib/xnatDicomWeb/retrieveDicomWebMetadata.js';

const { log, metadata, utils } = OHIF;
const { studyMetadataManager, metadataUtils } = utils;
const { OHIFStudyMetadata } = metadata;

const VALID_BACKGROUND_MODALITIES = ['MR', 'CT'];
const VALID_OVERLAY_MODALITIES = ['PT', 'NM', 'MR'];

class XNATStandaloneRouting extends Component {
  state = {
    studies: null,
    server: null,
    studyInstanceUIDs: null,
    seriesInstanceUIDs: null,
    error: null,
    loading: true,
  };

  static propTypes = {
    location: PropTypes.object,
    store: PropTypes.object,
    setServers: PropTypes.func,
  };

  parseQueryAndRetrieveDICOMWebData(rootUrl, query) {
    return new Promise((resolve, reject) => {
      const { projectId, subjectId, experimentId, experimentLabel } = query;

      commandsManager.runCommand('xnatSetRootUrl', {
        url: rootUrl,
      });

      // Query AIAA settings
      commandsManager.runCommand('xnatCheckAndSetAiaaSettings', {
        projectId: projectId,
      });

      // Query ROI Color settings
      commandsManager.runCommand('xnatCheckAndSetRoiColorList', {
        projectId: projectId,
      });

      // Query ROI Presets from the viewer config API
      commandsManager.runCommand('xnatCheckAndSetRoiPresets', {
        projectId: projectId,
      });

      // Query user information
      getUserInformation(rootUrl);

      if (!projectId || !subjectId) {
        //return reject(new Error('No URL was specified. Use ?url=$yourURL'));
        return reject(
          new Error(
            'Not enough data specified, Use VIEWERS/?url=projectId&subjectId'
          )
        );
      }

      const parentProjectId = query.parentProjectId;
        // ? query.parentProjectId
        // : projectId;

      if (parentProjectId) {
        console.warn(
          `This experiment is shared view of ${experimentId} from ${parentProjectId}`
        );
      }

      commandsManager.runCommand('xnatCheckAndSetPermissions', {
        projectId,
        parentProjectId,
        subjectId,
      });

      // TODO -> Session Map in the XNAT extension.

      // Query params:
      //
      // Single Session:
      //   projectId, subjectId, experimentId, experimentLabel
      //
      // Single Session in shared project:
      //   projectId, subjectId, experimentId, experimentLabel, parentProjectId
      //
      // Subject:
      //   projectId, subjectId
      //
      // Subject in shared project:
      //  projectId, subjectId, parentProjectId

      if (experimentId) {
        commandsManager.runCommand('xnatSetView', {
          view: 'session',
        });

        const jsonRequestUrl = `${rootUrl}xapi/viewer/projects/${projectId}/experiments/${experimentId}`;

        console.log(jsonRequestUrl);

        // Define a request to the server to retrieve the study data
        // as JSON, given a URL that was in the Route
        const oReq = new XMLHttpRequest();

        // Add event listeners for request failure
        oReq.addEventListener('error', error => {
          log.warn('An error occurred while retrieving the JSON data');
          reject(error);
        });

        // When the JSON has been returned, parse it into a JavaScript Object
        // and render the OHIF Viewer with this data
        oReq.addEventListener('load', event => {
          if (event.target.status === 404) {
            reject(new Error('No JSON data found'));
          }

          // Parse the response content
          // https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/responseText
          if (!oReq.responseText) {
            log.warn('Response was undefined');
            reject(new Error('Response was undefined'));
          }

          let jsonString = oReq.responseText;

          // if (parentProjectId) {
          //   console.warn(
          //     `replacing ${parentProjectId} with ${projectId} so resources can be fetched`
          //   );
          //   jsonString = jsonString.replace(
          //     new RegExp(parentProjectId, 'g'),
          //     projectId
          //   );
          // }

          // log.info(JSON.stringify(jsonString, null, 2));

          const data = JSON.parse(jsonString);

          const dicomWebParameters = [];
          const studyInstanceUIDs = [];
          if (data.isDicomWeb) {
            // Possibly a DICOMweb study
            dicomWebParameters.push({
              StudyInstanceUID: data.studies[0].StudyInstanceUID,
              parentProjectId,
              projectId,
              subjectId,
              experimentId,
              experimentLabel,
            });

            return resolve({
              studies: [],
              studyInstanceUIDs,
              dicomWebParameters,
            });
          }

          const studies = data.studies.filter(
            study => study.series !== undefined
          );

          data.studies = studies;
          if (studies.length === 0) {
            return resolve({ studies: [], studyInstanceUIDs: [] });
          }

          commandsManager.runCommand('xnatSetSession', {
            json: data,
            sessionVariables: {
              experimentId,
              experimentLabel,
              subjectId,
              projectId,
              parentProjectId,
            },
          });

          data.studies[0].StudyDescription = experimentLabel || experimentId;

          console.log(data);

          resolve({
            studies: data.studies,
            studyInstanceUIDs: [],
            dicomWebParameters,
          });
        });

        // Open the Request to the server for the JSON data
        // In this case we have a server-side route called /api/
        // which responds to GET requests with the study data
        log.info(`Sending Request to: ${jsonRequestUrl}`);
        oReq.open('GET', jsonRequestUrl);
        oReq.setRequestHeader('Accept', 'application/json');

        // Fire the request to the server
        oReq.send();
      } else {
        // Subject view
        commandsManager.runCommand('xnatSetView', {
          view: 'subject',
        });

        const subjectExperimentListUrl = `${rootUrl}data/archive/projects/${projectId}/subjects/${subjectId}/experiments?format=json`;

        console.log(subjectExperimentListUrl);

        _getJson(subjectExperimentListUrl).then(json => {
          // TODO -> Fetch each json.
          // Promise.all and combine JSON.
          // Load up viewer.
          console.log(json);

          if (!json || !json.ResultSet || !json.ResultSet.Result) {
            return reject(new Error('Data cannot be accessed'));
          }

          const experimentList = json.ResultSet.Result;
          const results = [];

          for (let i = 0; i < experimentList.length; i++) {
            const experimentIdI = experimentList[i].ID;
            const experimentJSONFetchUrl = `${rootUrl}xapi/viewer/projects/${projectId}/experiments/${experimentIdI}`;

            results[i] = _getJson(experimentJSONFetchUrl);
          }

          Promise.all(results).then(jsonFiles => {
            console.log(jsonFiles);

            let studyList = {
              transactionId: subjectId,
              studies: [],
              dicomWebParameters: [],
            };

            for (let i = 0; i < jsonFiles.length; i++) {
              const experimentJsonI = jsonFiles[i];

              if (experimentJsonI.isDicomWeb) {
                // Possibly a DICOMweb study
                studyList.dicomWebParameters.push({
                  StudyInstanceUID: experimentJsonI.studies[0].StudyInstanceUID,
                  parentProjectId,
                  projectId,
                  subjectId,
                  experimentId: experimentList[i].ID,
                  experimentLabel: experimentList[i].label,
                });
                continue;
              }

              const studiesI = experimentJsonI.studies.filter(
                study => study.series !== undefined
              );

              // Exclude studies with no instances
              if (studiesI.length === 0) {
                continue;
              }

              commandsManager.runCommand('xnatSetSession', {
                json: experimentJsonI,
                sessionVariables: {
                  experimentId: experimentList[i].ID,
                  experimentLabel: experimentList[i].label,
                  subjectId,
                  projectId,
                  parentProjectId,
                },
              });

              // TODO -> clean this
              studiesI[0].StudyDescription =
                experimentList[i].label || experimentList[i].ID;
              studiesI[0].isDicomWeb = false;

              console.log(`Studies[${i}]`);

              console.log(studiesI);

              studyList.studies = [...studyList.studies, ...studiesI];
            }

            console.log(studyList);

            // if (parentProjectId) {
            //   console.log(`replacing ${parentProjectId} with ${projectId}`);
            //
            //   let jsonString = JSON.stringify(studyList);
            //
            //   jsonString = jsonString.replace(
            //     new RegExp(parentProjectId, 'g'),
            //     projectId
            //   );
            //
            //   studyList = JSON.parse(jsonString);
            // }
            //
            // console.log(studyList);

            resolve({
              studies: studyList.studies,
              studyInstanceUIDs: [],
              dicomWebParameters: studyList.dicomWebParameters,
            });
          });
        });
      }
    });
  }

  async componentDidMount() {
    document.addEventListener('contextmenu', e => {
      e.preventDefault();
    });
    try {
      let { search } = this.props.location;

      // Remove ? prefix which is included for some reason
      search = search.slice(1, search.length);
      const query = qs.parse(search);

      let rootUrl = getRootUrl();

      if (process.env.NODE_ENV === 'development') {
        console.info('XNATStandaloneRouting Development mode! .........');
        rootUrl = process.env.XNAT_PROXY;
        // Authenticate to XNAT
        const loggedIn = await isLoggedIn();
        console.info('Logged in XNAT? ' + loggedIn);
        if (!loggedIn) {
          await xnatAuthenticate();
        }
      }

      console.log(`rootUrl: ${rootUrl}`);

      let {
        server,
        studies,
        studyInstanceUIDs,
        seriesInstanceUIDs,
        dicomWebParameters,
      } = await this.parseQueryAndRetrieveDICOMWebData(rootUrl, query);

      if (dicomWebParameters.length > 0) {
        console.log('DICOMweb Parameters:');
        console.log(dicomWebParameters);
        const dicomWebStudies = await retrieveDicomWebMetadata(
          commandsManager,
          rootUrl,
          dicomWebParameters
        );
        if (dicomWebStudies && dicomWebStudies.length > 0) {
          studies = [...studies, ...dicomWebStudies];
        }
      }

      if (studies && studies.length > 0) {
        // Set document title
        let documentTitle = studies[0].PatientID || studies[0].PatientName;
        documentTitle = documentTitle
          ? `${documentTitle} | XNAT OHIF Viewer`
          : 'XNAT OHIF Viewer';
        document.title = documentTitle;

        // Remove series with no instances
        studies = studies.filter(study => {
          study.series = study.series.filter(series => {
            return series.instances.length > 0;
          });
          return study.series !== undefined;
        });

        // Reassign instance URLs
        reassignInstanceUrls(studies, rootUrl);

        // Parse data here and add to metadata provider
        await updateMetaDataProvider(studies);

        const {
          studies: updatedStudies,
          studyInstanceUIDs: updatedStudiesInstanceUIDs,
        } = _mapStudiesToNewFormat(studies);
        studies = updatedStudies;
        studyInstanceUIDs = updatedStudiesInstanceUIDs;
      } else {
        throw new Error(
          'There are no scans compatible with the XNAT OHIF Viewer.'
        );
      }

      this.setState({
        studies,
        server,
        studyInstanceUIDs,
        seriesInstanceUIDs,
        loading: false,
      });
    } catch (error) {
      console.error(error);
      this.setState({ error: error.message, loading: false });
    }
  }

  componentWillUnmount() {
    commandsManager.runCommand('clearStudyLoadingListener', {});
  }

  render() {
    const message = this.state.error
      ? `Error: ${JSON.stringify(this.state.error)}`
      : 'Loading...';
    if (this.state.error || this.state.loading) {
return <NotFound message={message} showGoBackButton={Boolean(this.state.error)} />;    }

    return this.state.studies ? (
      <ConnectedViewer
        studies={this.state.studies}
        studyInstanceUIDs={this.state.studyInstanceUIDs}
        // seriesInstanceUIDs={this.state.seriesInstanceUIDs}
      />
    ) : (
      <ConnectedViewerRetrieveStudyData
        studyInstanceUIDs={this.state.studyInstanceUIDs}
        seriesInstanceUIDs={this.state.seriesInstanceUIDs}
        server={this.state.server}
      />
    );
  }
}

const _mapStudiesToNewFormat = studies => {
  studyMetadataManager.purge();

  /* Map studies to new format, update metadata manager? */
  const uniqueStudyUIDs = new Set();
  const updatedStudies = studies.map(study => {
    const isDicomWeb = study.isDicomWeb;
    const studyMetadata = new OHIFStudyMetadata(study, study.StudyInstanceUID);

    const sopClassHandlerModules =
      extensionManager.modules['sopClassHandlerModule'];
    study.displaySets =
      study.displaySets ||
      studyMetadata.createDisplaySets(sopClassHandlerModules);
    study.displaySets.forEach(ds => (ds.isDicomWeb = isDicomWeb));

    studyMetadataManager.add(studyMetadata);
    uniqueStudyUIDs.add(study.StudyInstanceUID);

    // Create display sets for substacks, where applicable
    studyMetadata.createDisplaySetsForSubStacks();

    return study;
  });

  checkDuplicateSeriesNumbers(updatedStudies);

  updateXnatSessionMap(updatedStudies);

  setValidOverlaySeries(updatedStudies);

  commandsManager.runCommand('initStudyLoadingListener', {
    studies: updatedStudies,
  });

  return {
    studies: updatedStudies,
    studyInstanceUIDs: Array.from(uniqueStudyUIDs),
  };
};

export default XNATStandaloneRouting;

function _getJson(url) {
  return new Promise((resolve, reject) => {
    // Define a request to the server to retrieve the session data as JSON.
    const xhr = new XMLHttpRequest();

    xhr.onload = () => {
      console.log(`GET ${url}... ${xhr.status}`);

      resolve(xhr.response);
    };

    xhr.onerror = () => {
      reject(xhr.responseText);
    };

    xhr.open('GET', url);
    xhr.responseType = 'json';
    xhr.send();
  });
}

async function getUserInformation(rootUrl) {
  const userInfo = {
    loginName: '',
    name: '',
  };
  window.ohif.userInfo = userInfo;

  const promise = new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = () => {
      if (xhr.status === 200) {
        resolve(xhr);
      } else {
        reject(new Error(xhr.statusText ? xhr.statusText : 'Unknown error'));
      }
    };
    xhr.onerror = () => {
      reject(new Error(xhr.statusText ? xhr.statusText : 'Unknown error'));
    };
    xhr.open('GET', `${rootUrl}xapi/users/username`);
    xhr.responseType = 'text';
    // xhr.setRequestHeader('X-Requested-With','XMLHttpRequest');
    xhr.send();
  });

  promise
    .then(result => {
      const { response } = result;
      userInfo.loginName = response;

      return _getJson(`${rootUrl}xapi/users/profile/${response}`);
    })
    .then(result => {
      const { firstName, lastName } = result;
      if (firstName && lastName) {
        userInfo.name = `${lastName}, ${firstName}`;
      }
    })
    .catch(error => {
      console.warn(
        `Could not retrieve user information from XNAT. ${error.message}.`
      );
    });
}

function getRootUrl() {
  let rootPlusPort = window.location.origin;

  const pathLessViewer = window.location.pathname.split('VIEWER')[0];

  rootPlusPort += pathLessViewer;

  return rootPlusPort;
}

function reassignInstanceUrls(studies, rootUrl) {
  const archiveUrl = '/data/archive/';
  // remove protocol
  let xnatRoot = rootUrl.replace(/(^\w+:|^)\/\//, '').replace(/\/$/, '');
  let dicomweb = 'dicomweb://';
  if (process.env.NODE_ENV === 'development') {
    dicomweb = 'dicomweb:';
  }

  studies.forEach(study => {
    study.series.forEach(series => {
      series.instances.forEach(instance => {
        let relUrl = instance.url;
        if (!relUrl) {
          return;
        }
        if (relUrl.startsWith('dicomweb')) {
          // Strip to relative URL
          const idx = relUrl.indexOf(archiveUrl);
          relUrl = relUrl.substring(idx);
        }
        instance.url = `${dicomweb}${xnatRoot}${relUrl}`;
      });
    });
  });
}

async function updateMetaDataProvider(studies) {
  const metadataProvider = OHIF.cornerstone.metadataProvider;
  let StudyInstanceUID;
  let SeriesInstanceUID;

  for (let study of studies) {
    StudyInstanceUID = study.StudyInstanceUID;
    for (let series of study.series) {
      SeriesInstanceUID = series.SeriesInstanceUID;
      const series4DConfig = metadataUtils.isDataset4D(series.instances);
      series._4DConfig = series4DConfig;
      // Check if the series is 4D multi-stack
      series.isMultiStack =
        series4DConfig.isValid4D &&
        metadataUtils.isSameOrientation(series.instances);

      await Promise.all(
        series.instances.map(async (instance, instanceIndex) => {
          const { url: imageId, metadata: naturalizedDicom } = instance;
          naturalizedDicom.PatientID = study.PatientID;
          naturalizedDicom.PatientName = { Alphabetic: study.PatientName };
          // naturalizedDicom.StudyDescription = study.StudyDescription;
          naturalizedDicom.StudyInstanceUID = study.StudyInstanceUID;
          naturalizedDicom.StudyDate = study.StudyDate;
          naturalizedDicom.StudyTime = study.StudyTime;
          naturalizedDicom.SeriesNumber = series.SeriesNumber;
          naturalizedDicom.SeriesDescription = series.SeriesDescription;
          if (!naturalizedDicom.PlanarConfiguration) {
            naturalizedDicom.PlanarConfiguration = 0;
          }
          naturalizedDicom.Modality = series.Modality;
          naturalizedDicom.SeriesInstanceUID = series.SeriesInstanceUID;
          naturalizedDicom.SeriesDate = series.SeriesDate;
          naturalizedDicom.SeriesTime = series.SeriesTime;
          // PaletteColorLookupTableData is loaded conditionally in metadataProvider.addInstance
          // OverlayData is loaded conditionally in metadataProvider.addInstance

          const isEnhancedSOP = metadataUtils.isEnhancedSOP(
            naturalizedDicom.SOPClassUID
          );
          let shouldFetchDataset = false;
          if (
            naturalizedDicom.NumberOfFrames === 1 &&
            naturalizedDicom.PhotometricInterpretation === 'PALETTE COLOR'
          ) {
            shouldFetchDataset = true;
          } else if (
            series.isMultiStack &&
            series4DConfig.sameIppIndices.includes(instanceIndex)
          ) {
            shouldFetchDataset = true;
          } else if (isEnhancedSOP && !series4DConfig.hasMultiFrameInstances) {
            shouldFetchDataset = true;
          }

          // Add instance to metadata provider.
          const addedInstance = await metadataProvider.addInstance(
            naturalizedDicom,
            {
              imageId,
              shouldFetchDataset,
            }
          );

          if (isEnhancedSOP) {
            // NM modality
            if (addedInstance.SOPClassUID === '1.2.840.10008.5.1.4.1.1.20') {
              series.isEnhanced = true;
            } else if (series4DConfig.hasMultiFrameInstances) {
              // ToDo: should we add further flags here?
            } else {
              // Create individual frame metadata from the enhanced instance
              const naturalizedMetadataList = metadataUtils.parseEnhancedSOP(
                addedInstance
              );
              if (
                naturalizedMetadataList &&
                naturalizedMetadataList.length > 0
              ) {
                const subInstances = [];
                for (let j = 0; j < naturalizedMetadataList.length; j++) {
                  subInstances.push({
                    metadata: naturalizedMetadataList[j],
                    url: `${imageId}?frame=${j}`,
                  });
                }
                series.isEnhanced = isEnhancedSOP;
                const isUniformOrientation = metadataUtils.isSameOrientation(
                  subInstances
                );
                // Update the series 4D config from sub-instances
                const series4DConfig = metadataUtils.isDataset4D(subInstances);
                series._4DConfig = series4DConfig;
                series.subInstances = subInstances;
                if (isUniformOrientation && series4DConfig.isValid4D) {
                  series.isMultiStack = true;
                }
              }
            }
          }

          // Add imageId specific mapping to this data as the URL isn't necessarily WADO-URI.
          // I.e. here the imageId is added w/o frame number for multi-frame images
          // Also added in StackManager => createAndAddStack for WADO-URI
          metadataProvider.addImageIdToUIDs(imageId, {
            StudyInstanceUID,
            SeriesInstanceUID,
            SOPInstanceUID: naturalizedDicom.SOPInstanceUID,
          });
        })
      );
    }
  }

  // Parse Enhanced SOPs, if exists, and add their forked
  // instances to the MetadataProvider
  for (const study of studies) {
    StudyInstanceUID = study.StudyInstanceUID;
    for (const series of study.series) {
      SeriesInstanceUID = series.SeriesInstanceUID;
      if (series.subInstances) {
        series.subInstances.forEach(instance => {
          const { url: imageId, metadata: naturalizedDicom } = instance;
          metadataProvider.addInstancesFromEnhancedSOP(naturalizedDicom);
          metadataProvider.addImageIdToUIDs(imageId, {
            StudyInstanceUID,
            SeriesInstanceUID,
            SOPInstanceUID: naturalizedDicom.SOPInstanceUID,
          });
        });
      }
    }
  }
}

function checkDuplicateSeriesNumbers(studies) {
  const numberToCode = num => {
    let code = '';
    while (num >= 0) {
      code = 'abcdefghijklmnopqrstuvwxyz'[num % 26] + code;
      num = Math.floor(num / 26) - 1;
    }
    return code;
  };

  studies.forEach(study => {
    const displaySets = study.displaySets;
    for (let i = 0; i < displaySets.length; i++) {
      const displaySetI = displaySets[i];
      if (displaySetI.seriesNotation) {
        continue;
      }
      let notationIndex = 0;
      for (let j = i + 1; j < displaySets.length; j++) {
        const displaySetJ = displaySets[j];
        if (displaySetI.SeriesNumber === displaySetJ.SeriesNumber) {
          if (!displaySetI.seriesNotation) {
            displaySetI.seriesNotation = numberToCode(notationIndex++);
          }
          displaySetJ.seriesNotation = numberToCode(notationIndex++);
        }
      }
    }
  });
}

function updateXnatSessionMap(studies) {
  const xnatScans = commandsManager.runCommand('xnatGetScan', {});

  studies.forEach(study => {
    study.displaySets.forEach(displaySet => {
      const xnatScan = xnatScans.find(
        scan => scan.seriesInstanceUid === displaySet.SeriesInstanceUID
      );
      if (xnatScan) {
        xnatScan.displaySets.push({
          // sopInstanceUids: displaySet.images.map(
          //   image => image._data.metadata.SOPInstanceUID
          // ),
          seriesNotation: displaySet.seriesNotation,
        });
      }
    });
  });
}

function setValidOverlaySeries(studies) {
  studies.forEach((study, studyIndex, studies) => {
    study.displaySets.forEach((displaySet, displaySetIndex, displaySets) => {
      displaySet.validOverlayDisplaySets = {};
      if (VALID_BACKGROUND_MODALITIES.includes(displaySet.Modality)) {
        // Exclude multi-frame images
        if (displaySet.isMultiFrame && !displaySet.isEnhanced) {
          return;
        }
        // Add series within this study
        const refIop = getImageOrientationPatient(displaySet);
        if (!refIop) {
          return;
        }
        const sameStudyOverlays = [];
        for (let i = 0; i < displaySets.length; i++) {
          if (i !== displaySetIndex) {
            if (isValidOverlayDisplaySet(displaySet, refIop, displaySets[i])) {
              sameStudyOverlays.push(displaySets[i].displaySetInstanceUID);
            }
          }
        }
        if (sameStudyOverlays.length) {
          // Handle duplicate StudyInstanceUID by adding study index
          displaySet.validOverlayDisplaySets[
            `${displaySet.StudyInstanceUID}_${studyIndex}`
          ] = sameStudyOverlays;
        }

        // Use FrameOfReferenceUID to match in other studies
        for (let i = 0; i < studies.length; i++) {
          if (i !== studyIndex) {
            const otherStudyOverlays = [];
            studies[i].displaySets.forEach(ds => {
              if (
                displaySet.FrameOfReferenceUID === ds.FrameOfReferenceUID &&
                VALID_OVERLAY_MODALITIES.includes(ds.Modality) &&
                !ds.isMultiFrame &&
                !ds.isSubStack
              ) {
                otherStudyOverlays.push(ds.displaySetInstanceUID);
              }
            });
            if (otherStudyOverlays.length) {
              displaySet.validOverlayDisplaySets[
                `${studies[i].StudyInstanceUID}_${i}`
              ] = otherStudyOverlays;
            }
          }
        }
      }
    });
  });
}

function isValidOverlayDisplaySet(displaySetI, refIop, displaySetJ) {
  if (!VALID_OVERLAY_MODALITIES.includes(displaySetJ.Modality)) {
    return;
  }
  // Exclude parent displaySet
  if (displaySetI.isSubStack) {
    const refUid = displaySetI.refDisplaySet.displaySetInstanceUID;
    if (refUid === displaySetJ.displaySetInstanceUID) {
      return;
    }
  }
  // Exclude substacks
  if (displaySetJ.isSubStack) {
    return;
  }
  // Exclude multiframe images without extracted frame metadata
  if (displaySetJ.isMultiFrame && !displaySetJ.isEnhanced) {
    return;
  }
  // Check orientation
  const iop = getImageOrientationPatient(displaySetJ);
  if (!metadataUtils.isSameArray(refIop, iop)) {
    return;
  }
  return true;
}

function getImageOrientationPatient(displaySet) {
  const firstImage = displaySet.images[0];
  let imageId = firstImage.getData().url;

  if (displaySet.Modality === 'NM') {
    const instance = cornerstone.metaData.get('instance', imageId);
    if (instance) {
      const {
        ImageOrientationPatient,
      } = metadataUtils.getImagePlaneInformation(instance, 0);
      return ImageOrientationPatient;
    }
  } else {
    if (displaySet.isMultiFrame) {
      imageId += '?frame=0';
    }
    const { imageOrientationPatient } = cornerstone.metaData.get(
      'imagePlaneModule',
      imageId
    );
    return imageOrientationPatient;
  }
}
