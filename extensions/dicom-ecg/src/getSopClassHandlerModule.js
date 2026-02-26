import { SOPClassHandlerId } from './id';
import { utils } from '@ohif/core';
import { Enums as csEnums } from '@cornerstonejs/core';

/**
 * DICOM Waveform SOP Class UIDs for ECG / cardiac electrophysiology.
 * Reference: https://dicom.nema.org/medical/dicom/current/output/chtml/part04/sect_B.5.html
 */
const SOP_CLASS_UIDS = {
  TWELVE_LEAD_ECG_WAVEFORM_STORAGE: '1.2.840.10008.5.1.4.1.1.9.1.1',
  GENERAL_ECG_WAVEFORM_STORAGE: '1.2.840.10008.5.1.4.1.1.9.1.2',
  AMBULATORY_ECG_WAVEFORM_STORAGE: '1.2.840.10008.5.1.4.1.1.9.1.3',
  HEMODYNAMIC_WAVEFORM_STORAGE: '1.2.840.10008.5.1.4.1.1.9.2.1',
  CARDIAC_ELECTROPHYSIOLOGY_WAVEFORM_STORAGE: '1.2.840.10008.5.1.4.1.1.9.3.1',
};

const sopClassUids = Object.values(SOP_CLASS_UIDS);

function _getDisplaySetsFromSeries(instances, servicesManager, extensionManager) {
  return instances.map(instance => {
    const { Modality, SOPInstanceUID } = instance;
    const { SeriesDescription, SeriesNumber, SeriesDate } = instance;
    const { SeriesInstanceUID, StudyInstanceUID, SOPClassUID } = instance;

    const displaySet = {
      Modality,
      displaySetInstanceUID: utils.guid(),
      SeriesDescription,
      SeriesNumber,
      SeriesDate,
      SOPInstanceUID,
      SeriesInstanceUID,
      StudyInstanceUID,
      SOPClassHandlerId,
      SOPClassUID,
      referencedImages: null,
      measurements: null,
      viewportType: csEnums.ViewportType.ECG,
      instances: [instance],
      instance,
      thumbnailSrc: null,
      isDerivedDisplaySet: false,
      isLoaded: false,
      sopClassUids,
      numImageFrames: 0,
      numInstances: 1,
      imageIds: instance.imageId ? [instance.imageId] : [],
      supportsWindowLevel: false,
      label: SeriesDescription || 'ECG',
    };

    return displaySet;
  });
}

export default function getSopClassHandlerModule(params) {
  const { servicesManager, extensionManager } = params;
  const getDisplaySetsFromSeries = instances =>
    _getDisplaySetsFromSeries(instances, servicesManager, extensionManager);

  return [
    {
      name: 'dicom-ecg',
      sopClassUids,
      getDisplaySetsFromSeries,
    },
  ];
}
