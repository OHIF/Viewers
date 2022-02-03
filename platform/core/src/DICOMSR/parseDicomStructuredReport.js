import dcmjs from 'dcmjs';
import classes from '../classes';
import parseSCOORD3D from './SCOORD3D/parseSCOORD3D';

import findInstanceMetadataBySopInstanceUID from './utils/findInstanceMetadataBySopInstanceUid';

const toArray = x => (Array.isArray(x) ? x : [x]);
const { LogManager } = classes;

/**
 * Function to parse the part10 array buffer that comes from a DICOM Structured report into measurementData
 * measurementData format is a viewer specific format to be stored into the redux and consumed by other components
 * (e.g. measurement table)
 *
 * @param {ArrayBuffer} part10SRArrayBuffer
 * @param {Array} displaySets
 * @param {object} external
 * @returns
 */
const parseDicomStructuredReport = (
  part10SRArrayBuffer,
  displaySets,
  external
) => {
  if (external && external.servicesManager) {
    parseSCOORD3D({ servicesManager: external.servicesManager, displaySets });
  }

  // Get the dicom data as an Object
  const dicomData = dcmjs.data.DicomMessage.readFile(part10SRArrayBuffer);
  const dataset = dcmjs.data.DicomMetaDictionary.naturalizeDataset(
    dicomData.dict
  );

  const { MeasurementReport } = dcmjs.adapters.Cornerstone;

  let storedMeasurementByToolType;
  try {
    storedMeasurementByToolType = storedMeasurementByToolType = MeasurementReport.generateToolState(
      dataset,
      {
        /**
         * TODO: This custom mapping for CCC uni/bidirectional annotations to
         * Cornerstone tool classes is based on very limited matching
         * of specific code values e.g. length and long axis.
         *
         * We need to use smarter matching criteria for
         * different types/complex annotations in the long term.
         *
         * Ongoing discussion/representation here: https://github.com/OHIF/Viewers/issues/1215
         */
        getToolClass: (measurementGroup, dataset, toolClasses) => {
          const measurementGroupContentSequence = toArray(
            measurementGroup.ContentSequence
          );

          const CrowdsCureCancer = {
            identifiers: ['99CCC', 'crowds-cure', 'Crowds Cure Cancer'],
            LONG_AXIS: 'G-A185',
            SHORT_AXIS: 'G-A186',
            FINDING_SITE: 'G-C0E3',
            LENGTH: 'G-D7FE',
          };

          const isCrowdsCureCancer = CrowdsCureCancer.identifiers.some(
            identifier => JSON.stringify(dataset).includes(identifier)
          );

          if (isCrowdsCureCancer) {
            const ShortAxisContentItem = measurementGroupContentSequence.find(
              contentItem =>
                contentItem.ConceptNameCodeSequence.CodeValue ===
                CrowdsCureCancer.SHORT_AXIS
            );

            const LongAxisContentItem = measurementGroupContentSequence.find(
              contentItem =>
                contentItem.ConceptNameCodeSequence.CodeValue ===
                CrowdsCureCancer.LONG_AXIS
            );

            const LengthContentItem = measurementGroupContentSequence.find(
              contentItem =>
                contentItem.ConceptNameCodeSequence.CodeValue ===
                CrowdsCureCancer.LENGTH
            );

            if (ShortAxisContentItem && LongAxisContentItem) {
              return toolClasses.find(t => t.toolType === 'Bidirectional');
            }

            if (LengthContentItem) {
              return toolClasses.find(t => t.toolType === 'Length');
            }
          } else {
            const TrackingIdentifierGroup = measurementGroupContentSequence.find(
              contentItem =>
                contentItem.ConceptNameCodeSequence.CodeMeaning ===
                TRACKING_IDENTIFIER
            );

            const TrackingIdentifierValue = TrackingIdentifierGroup.TextValue;

            toolClasses.find(tc =>
              tc.isValidCornerstoneTrackingIdentifier(TrackingIdentifierValue)
            );
          }
        },
      }
    );
  } catch (error) {
    const seriesDescription = dataset.SeriesDescription || '';
    LogManager.publish(LogManager.EVENTS.OnLog, {
      title: `Failed to parse ${seriesDescription} measurement report`,
      type: 'warning',
      message: error.message || '',
      notify: true,
    });
    return;
  }

  const measurementData = {};
  let measurementNumber = 0;

  Object.keys(storedMeasurementByToolType).forEach(toolName => {
    const measurements = storedMeasurementByToolType[toolName];
    measurementData[toolName] = [];

    measurements.forEach(measurement => {
      const instanceMetadata = findInstanceMetadataBySopInstanceUID(
        displaySets,
        measurement.sopInstanceUid
      );

      const { _study: study, _series: series } = instanceMetadata;
      const { StudyInstanceUID, PatientID } = study;
      const { SeriesInstanceUID } = series;
      const { sopInstanceUid, frameIndex } = measurement;
      const imagePath = getImagePath(
        StudyInstanceUID,
        SeriesInstanceUID,
        sopInstanceUid,
        frameIndex
      );

      const imageId = instanceMetadata.getImageId();
      if (!imageId) {
        return;
      }

      // TODO: We need the currentTimepointID set into the viewer
      const currentTimepointId = 'TimepointId';

      const toolData = Object.assign({}, measurement, {
        imageId,
        imagePath,
        SOPInstanceUID: sopInstanceUid,
        SeriesInstanceUID,
        StudyInstanceUID,
        PatientID,
        measurementNumber: ++measurementNumber,
        timepointId: currentTimepointId,
        toolType: toolName,
        _id: imageId + measurementNumber,
      });

      measurementData[toolName].push(toolData);
    });
  });

  return measurementData;
};

/**
 * Function to create imagePath with all imageData related
 * @param {string} StudyInstanceUID
 * @param {string} SeriesInstanceUID
 * @param {string} SOPInstanceUID
 * @param {string} frameIndex
 * @returns
 */
const getImagePath = (
  StudyInstanceUID,
  SeriesInstanceUID,
  SOPInstanceUID,
  frameIndex
) => {
  return [StudyInstanceUID, SeriesInstanceUID, SOPInstanceUID, frameIndex].join(
    '_'
  );
};

export default parseDicomStructuredReport;
