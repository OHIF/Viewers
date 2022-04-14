import { DicomMetadataStore, classes } from '@ohif/core';
import { calculateSUVScalingFactors } from '@cornerstonejs/calculate-suv';

import getPTImageIdInstanceMetadata from './getPTImageIdInstanceMetadata';

const metadataProvider = classes.MetadataProvider;

/**
 *
 * @param {Object} servicesManager
 * @param {Object} configuration
 */
export default function init({ servicesManager, configuration }) {
  // Add
  DicomMetadataStore.subscribe(
    DicomMetadataStore.EVENTS.INSTANCES_ADDED,
    handlePETImageMetadata
  );

  // If the metadata for PET has changed by the user (e.g. manually changing the PatientWeight)
  // we need to recalculate the SUV Scaling Factors
  DicomMetadataStore.subscribe(
    DicomMetadataStore.EVENTS.SERIES_UPDATED,
    handlePETImageMetadata
  );
}

const handlePETImageMetadata = ({ SeriesInstanceUID, StudyInstanceUID }) => {
  const { instances } = DicomMetadataStore.getSeries(
    StudyInstanceUID,
    SeriesInstanceUID
  );

  const modality = instances[0].Modality;
  if (modality !== 'PT') {
    return;
  }
  const imageIds = instances.map(instance => instance.imageId);
  const InstanceMetadataArray = [];
  imageIds.forEach(imageId => {
    const instanceMetadata = getPTImageIdInstanceMetadata(imageId);
    if (instanceMetadata) {
      InstanceMetadataArray.push(instanceMetadata);
    }
  });

  if (!InstanceMetadataArray.length) {
    return;
  }

  // try except block to prevent errors when the metadata is not correct
  let suvScalingFactors;
  try {
    suvScalingFactors = calculateSUVScalingFactors(InstanceMetadataArray);
  } catch (error) {
    console.log(error);
  }

  if (!suvScalingFactors) {
    return;
  }

  InstanceMetadataArray.forEach((instanceMetadata, index) => {
    metadataProvider.addCustomMetadata(
      imageIds[index],
      'scalingModule',
      suvScalingFactors[index]
    );
  });
};
