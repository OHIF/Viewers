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
    srDisplaySet.measurements = getMeasurements(ContentSequence);
    const mappings = MeasurementService.getSourceMappings(
      'CornerstoneTools',
      '4'
    );

    srDisplaySet.isHydrated = false;
    srDisplaySet.isRehydratable = isRehydratable(srDisplaySet, mappings);
    srDisplaySet.isLoaded = true;

    const imageDisplaySets = displaySets.filter(
      ds =>
        ds.Modality !== 'SR' &&
        ds.Modality !== 'SEG' &&
        ds.Modality !== 'RTSTRUCT' &&
        ds.Modality !== 'RTDOSE'
    );
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
      if (coord.ReferencedSOPSequence === undefined) {
        /** we miss the referenced information. We can compare the annotation SCOORD3D coordinates with
         * the ImagePatientPosition of the frames. However (WARNING!!!),
         * if more than a source series is present, this logic can find the wrong frame
         * (i.e. two source series, with the same frameOfReferenceUID,
         * that have each a frame with the same ImagePositionPatient of the annotation 3D coordinates)
         */
        for (let i = 0; i < images.length; ++i) {
          const imageMetadata = images[i].getData().metadata;
          if (
            imageMetadata.FrameOfReferenceUID !==
            coord.ReferencedFrameOfReferenceSequence
          ) {
            continue;
          }

          let sliceNormal = [0, 0, 0];
          const orientation = imageMetadata.ImageOrientationPatient;
          sliceNormal[0] =
            orientation[1] * orientation[5] - orientation[2] * orientation[4];
          sliceNormal[1] =
            orientation[2] * orientation[3] - orientation[0] * orientation[5];
          sliceNormal[2] =
            orientation[0] * orientation[4] - orientation[1] * orientation[3];

          let distanceAlongNormal = 0;
          for (let j = 0; j < 3; ++j) {
            distanceAlongNormal +=
              sliceNormal[j] * imageMetadata.ImagePositionPatient[j];
          }

          // assuming 1 mm tolerance
          if (Math.abs(distanceAlongNormal - coord.GraphicData[2]) > 1) {
            continue;
          }

          coord.ReferencedSOPSequence = {
            ReferencedSOPClassUID: imageMetadata.SOPClassUID,
            ReferencedSOPInstanceUID: imageMetadata.SOPInstanceUID,
          };

          break;
        }

        if (coord.ReferencedSOPSequence === undefined) {
          return false;
        }
      }

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
  imageDisplaySet.SRLabels = [];
  const colors = new Map();
  measurements.forEach(measurement => {
    const { coords } = measurement;
    coords.forEach((coord, index) => {
      if (coord.ReferencedSOPSequence !== undefined) {
        const imageIndex = SOPInstanceUIDs.findIndex(
          SOPInstanceUID =>
            SOPInstanceUID ===
            coord.ReferencedSOPSequence.ReferencedSOPInstanceUID
        );
        if (imageIndex > -1) {
          if (!srDisplaySet.referencedDisplaySets.includes(imageDisplaySet)) {
            srDisplaySet.referencedDisplaySets.push(imageDisplaySet);
          }

          const imageId = imageIds[imageIndex];
          const imageMetadata = images[imageIndex].getData().metadata;

          if (coord.GraphicType === 'TEXT') {
            const key =
              measurement.labels[index].label + measurement.labels[index].value;
            let color = colors.get(key);
            if (!color) {
              // random dark color
              color =
                'hsla(' + Math.floor(Math.random() * 360) + ', 70%, 30%, 1)';
              colors.set(key, color);
            }

            measurement.labels[index].color = color;
            measurement.isSRText = true;
            measurement.labels[index].visible = true;

            imageDisplaySet.SRLabels.push({
              ReferencedSOPInstanceUID:
                coord.ReferencedSOPSequence.ReferencedSOPInstanceUID,
              labels: measurement.labels[index],
            });

            if (index === 0) {
              addMeasurement(
                measurement,
                imageId,
                imageMetadata,
                imageDisplaySet.displaySetInstanceUID
              );
            }
          } else {
            addMeasurement(
              measurement,
              imageId,
              imageMetadata,
              imageDisplaySet.displaySetInstanceUID
            );
          }
        }
      }
    });
  });
};

export default parseSCOORD3D;
