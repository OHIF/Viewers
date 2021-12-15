import { ImageSet } from '../../classes';
import getMeasurements from './utils/getMeasurements';
import getReferencedImagesList from './utils/getReferencedImagesList';
import isRehydratable from './utils/isRehydratable';
import addMeasurement from './utils/addMeasurement';

const parseSCOORD3D = ({ servicesManager, displaySets }) => {
  const { MeasurementService } = servicesManager.services;

  const srDisplaySets = displaySets.filter(ds => ds.Modality === 'SR');

  srDisplaySets.forEach(srDisplaySet => {
    const firstInstance = srDisplaySet.metadata;
    if (!firstInstance) {
      return;
    }

    const { ContentSequence } = firstInstance;

    srDisplaySet.referencedImages = getReferencedImagesList(ContentSequence);
    srDisplaySet.measurements = getMeasurements(ContentSequence, srDisplaySet);

    const mappings = MeasurementService.getSourceMappings(
      'CornerstoneTools',
      '4'
    );

    srDisplaySet.isHydrated = false;
    srDisplaySet.isRehydratable = isRehydratable(srDisplaySet, mappings);
    srDisplaySet.isLoaded = true;

    const imageDisplaySets = displaySets.filter(ds => ds.Modality !== 'SR');
    imageDisplaySets.forEach(imageDisplaySet => {
      // Check currently added displaySets and add measurements if the sources exist.
      checkIfCanAddMeasurementsToDisplaySet(srDisplaySet, imageDisplaySet);
    });
  });
};

const checkIfCanAddMeasurementsToDisplaySet = (
  srDisplaySet,
  imageDisplaySet
) => {
  let measurements = srDisplaySet.measurements;

  /**
   * Look for image sets.
   * This also filters out _this_ displaySet, as it is not an image set.
   */
  if (!(imageDisplaySet instanceof ImageSet)) {
    return;
  }

  const { sopClassUIDs, images } = imageDisplaySet;

  /**
   * Filter measurements that references the correct sop class.
   */
  measurements = measurements.filter(measurement => {
    return measurement.coords.some(coord => {
      return sopClassUIDs.includes(
        coord.ReferencedSOPSequence.ReferencedSOPClassUID
      );
    });
  });

  /**
   * New display set doesn't have measurements that references the correct sop class.
   */
  if (measurements.length === 0) {
    return;
  }

  const imageIds = images.map(i => i.getImageId());
  const SOPInstanceUIDs = images.map(i => i.SOPInstanceUID);

  measurements.forEach(measurement => {
    const { coords } = measurement;

    coords.forEach(coord => {
      const imageIndex = SOPInstanceUIDs.findIndex(
        SOPInstanceUID =>
          SOPInstanceUID ===
          coord.ReferencedSOPSequence.ReferencedSOPInstanceUID
      );
      if (imageIndex > -1) {
        const imageId = imageIds[imageIndex];
        const imageMetadata = images[imageIndex].getData().metadata;
        addMeasurement(
          measurement,
          imageId,
          imageMetadata,
          imageDisplaySet.displaySetInstanceUID
        );
      }
    });
  });
};

export default parseSCOORD3D;
