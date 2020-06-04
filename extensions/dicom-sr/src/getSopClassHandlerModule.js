import id from './id';
import { utils } from '@ohif/core';

const sopClassHandlerName = 'dicom-sr';

const sopClassUids = [
  '1.2.840.10008.5.1.4.1.1.88.11', //BASIC_TEXT_SR:
  '1.2.840.10008.5.1.4.1.1.88.22', //ENHANCED_SR:
  '1.2.840.10008.5.1.4.1.1.88.33', //COMPREHENSIVE_SR:
];

const scoordTypes = ['POINT', 'MULTIPOINT', 'POLYLINE', 'CIRCLE', 'ELLIPSE'];

const CodeNameCodeSequenceValues = {
  ImagingMeasurementReport: '126000',
  ImageLibrary: '111028',
  ImagingMeasurements: '126010',
  MeasurementGroup: '125007',
  ImageLibraryGroup: '126200',
  TrackingUniqueIdentifier: '112040',
};

/**
 * Basic SOPClassHandler:
 * - For all Image types that are stackable, create
 *   a displaySet with a stack of images
 *
 * @param {Array} sopClassHandlerModules List of SOP Class Modules
 * @param {SeriesMetadata} series The series metadata object from which the display sets will be created
 * @returns {Array} The list of display sets created for the given series object
 */
function getDisplaySetsFromSeries(instances) {
  // If the series has no instances, stop here
  if (!instances || !instances.length) {
    throw new Error('No instances were provided');
  }

  const instance = instances[0];

  const { StudyInstanceUID, SeriesInstanceUID, SOPInstanceUID } = instance;

  const { ConceptNameCodeSequence, ContentSequence } = instance;

  if (
    ConceptNameCodeSequence.CodeValue !==
    CodeNameCodeSequenceValues.ImagingMeasurementReport
  ) {
    console.warn(
      'Only support Imaging Measurement Report SRs (TID1500) for now'
    );
    return [];
  }

  const referencedImages = _getReferencedImagesList(ContentSequence);

  const measurements = _getMeasurements(ContentSequence, SOPInstanceUID);

  const displaySet = {
    plugin: id,
    Modality: 'SR',
    displaySetInstanceUID: utils.guid(),
    SOPInstanceUID,
    SeriesInstanceUID,
    StudyInstanceUID,
    SOPClassHandlerId: `${id}.sopClassHandlerModule.${sopClassHandlerName}`,
    referencedImages,
  };

  return [displaySet];
}

function getSopClassHandlerModule() {
  return [
    {
      name: sopClassHandlerName,
      sopClassUids,
      getDisplaySetsFromSeries,
    },
  ];
}

function _getMeasurements(
  ImagingMeasurementReportContentSequence,
  SOPInstanceUID
) {
  const ImagingMeasurements = ImagingMeasurementReportContentSequence.find(
    item =>
      item.ConceptNameCodeSequence.CodeValue ===
      CodeNameCodeSequenceValues.ImagingMeasurements
  );

  if (SOPInstanceUID === '2.25.435452399240481307327287169369305113868') {
    debugger;
  }

  const MeasurementGroups = _getSequenceAsArray(
    ImagingMeasurements.ContentSequence
  ).filter(
    item =>
      item.ConceptNameCodeSequence.CodeValue ===
      CodeNameCodeSequenceValues.MeasurementGroup
  );

  const mergedContentSequencesByTrackingUniqueIdentifiers = _getMergedContentSequencesByTrackingUniqueIdentifiers(
    MeasurementGroups
  );

  debugger;

  let allMeasurements = [];

  Object.keys(mergedContentSequencesByTrackingUniqueIdentifiers).forEach(
    trackingUniqueIdentifier => {
      const mergedContentSequence =
        mergedContentSequencesByTrackingUniqueIdentifiers[
          trackingUniqueIdentifier
        ];

      const measurements = _processMeasurement(mergedContentSequence);

      if (measurements) {
        allMeasurements = allMeasurements.concat(measurements);
      }
    }
  );
}

function _getMergedContentSequencesByTrackingUniqueIdentifiers(
  MeasurementGroups
) {
  const mergedContentSequencesByTrackingUniqueIdentifiers = {};

  MeasurementGroups.forEach(MeasurementGroup => {
    debugger;

    const ContentSequence = _getSequenceAsArray(
      MeasurementGroup.ContentSequence
    );

    const TrackingUniqueIdentifierItem = ContentSequence.find(
      item =>
        item.ConceptNameCodeSequence.CodeValue ===
        CodeNameCodeSequenceValues.TrackingUniqueIdentifier
    );

    if (!TrackingUniqueIdentifierItem) {
      console.warn(
        'No Tracking Unique Identifier, skipping ambiguous measurement.'
      );
    }

    const trackingUniqueIdentifier = TrackingUniqueIdentifierItem.UID;

    if (
      mergedContentSequencesByTrackingUniqueIdentifiers[
        trackingUniqueIdentifier
      ] === undefined
    ) {
      // Add the full ContentSequence
      mergedContentSequencesByTrackingUniqueIdentifiers[
        trackingUniqueIdentifier
      ] = [...ContentSequence];
    } else {
      // Add the ContentSequence minus the tracking identifier, as we have this
      // Information in the merged ContentSequence anyway.
      ContentSequence.forEach(item => {
        if (
          item.ConceptNameCodeSequence.CodeValue !==
          CodeNameCodeSequenceValues.TrackingUniqueIdentifier
        ) {
          mergedContentSequencesByTrackingUniqueIdentifiers[
            trackingUniqueIdentifier
          ].push(item);
        }
      });
    }
  });

  return mergedContentSequencesByTrackingUniqueIdentifiers;
}

function _processMeasurement(mergedContentSequence) {
  debugger;

  if (
    mergedContentSequence.some(
      group => group.ValueType === 'SCOORD' || group.ValueType === 'SCOORD3D'
    )
  ) {
    return _processTID1410Measurement(mergedContentSequence);
  }

  const NUMContentItems = mergedContentSequence.filter(
    group => group.ValueType === 'NUM'
  );

  NUMContentItems.forEach(item => {
    debugger;
  });

  // Need to deal with TID 1410 style measurements, which will have a SCOORD or SCOORD3D at the top level,
  // And non-geometric representations where each NUM has "INFERRED FROM" SCOORD/SCOORD3D

  // TODO -> Look at RelationshipType => Contains means

  debugger;

  return [];
}

function _processTID1410Measurement(mergedContentSequence) {
  // TODO
  console.error('TODO => Process TID1410Measurement');
  debugger;

  return [ß];
}

function _getReferencedImagesList(ImagingMeasurementReportContentSequence) {
  const ImageLibrary = ImagingMeasurementReportContentSequence.find(
    item =>
      item.ConceptNameCodeSequence.CodeValue ===
      CodeNameCodeSequenceValues.ImageLibrary
  );

  const ImageLibraryGroup = _getSequenceAsArray(
    ImageLibrary.ContentSequence
  ).find(
    item =>
      item.ConceptNameCodeSequence.CodeValue ===
      CodeNameCodeSequenceValues.ImageLibraryGroup
  );

  const referencedImages = [];

  _getSequenceAsArray(ImageLibraryGroup.ContentSequence).forEach(item => {
    const { ReferencedSOPSequence } = item;
    const {
      ReferencedSOPClassUID,
      ReferencedSOPInstanceUID,
    } = ReferencedSOPSequence;

    referencedImages.push({ ReferencedSOPClassUID, ReferencedSOPInstanceUID });
  });

  return referencedImages;
}

function _getSequenceAsArray(sequence) {
  return Array.isArray(sequence) ? sequence : [sequence];
}

export default getSopClassHandlerModule;
