import { SOPClassHandlerName, SOPClassHandlerId } from './id';
import { utils, classes } from '@ohif/core';

const { ImageSet } = classes;

const SOP_CLASS_UIDS = {
  TWELVE_LEAD_WAVEFORM_STORAGE: '1.2.840.10008.5.1.4.1.1.9.1.1',
};

const sopClassUids = Object.values(SOP_CLASS_UIDS);

const _getDisplaySetsFromSeries = (instances, servicesManager, extensionManager) => {
  return instances
    .map(instance => {
      const { Modality, SOPInstanceUID, SeriesDescription = "ECG" } = instance;
      const { SeriesDate, SeriesNumber, SeriesInstanceUID, StudyInstanceUID } = instance;
      const displaySet = {
        //plugin: id,
        Modality,
        displaySetInstanceUID: utils.guid(),
        SeriesDescription,
        SeriesNumber: SeriesNumber || 1,
        SeriesDate,
        SOPInstanceUID,
        SeriesInstanceUID,
        StudyInstanceUID,
        SOPClassHandlerId,
        referencedImages: null,
        measurements: null,
        others: [instance],
        isDerivedDisplaySet: true,
        isLoaded: false,
        sopClassUids,
        numImageFrames: 0,
        instance,
      };
      return displaySet;
    });
};

export default function getSopClassHandlerModule({ servicesManager, extensionManager }) {
  const getDisplaySetsFromSeries = instances => {
    return _getDisplaySetsFromSeries(
      instances,
      servicesManager,
      extensionManager
    );
  };

  return [
    {
      name: SOPClassHandlerName,
      sopClassUids,
      getDisplaySetsFromSeries,
    },
  ];
}
