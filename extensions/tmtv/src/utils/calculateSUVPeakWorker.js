import { utilities } from '@cornerstonejs/tools';
import { vec3 } from 'gl-matrix';
import vtkImageData from '@kitware/vtk.js/Common/DataModel/ImageData';
import vtkDataArray from '@kitware/vtk.js/Common/Core/DataArray';
import { expose } from 'comlink';

const createVolume = ({ dimensions, origin, direction, spacing, scalarData, metadata }) => {
  const imageData = vtkImageData.newInstance();
  imageData.setDimensions(dimensions);
  imageData.setOrigin(origin);
  imageData.setDirection(direction);
  imageData.setSpacing(spacing);

  const scalarArray = vtkDataArray.newInstance({
    name: 'Pixels',
    numberOfComponents: 1,
    values: scalarData,
  });

  imageData.getPointData().setScalars(scalarArray);

  imageData.modified();

  return {
    imageData,
    metadata,
    getScalarData: () => scalarData,
  };
};
/**
 * This method calculates the SUV peak on a segmented ROI from a reference PET
 * volume. If a rectangle annotation is provided, the peak is calculated within that
 * rectangle. Otherwise, the calculation is performed on the entire volume which
 * will be slower but same result.
 * @param viewport Viewport to use for the calculation
 * @param labelmap Labelmap from which the mask is taken
 * @param referenceVolume PET volume to use for SUV calculation
 * @param toolData [Optional] list of toolData to use for SUV calculation
 * @param segmentIndex The index of the segment to use for masking
 * @returns
 */
function calculateSuvPeak({ labelmapProps, referenceVolumeProps, annotations, segmentIndex = 1 }) {
  const labelmap = createVolume(labelmapProps);
  const referenceVolume = createVolume(referenceVolumeProps);

  if (referenceVolume.metadata.Modality !== 'PT') {
    return;
  }

  const labelmapData = labelmap.getScalarData();
  const referenceVolumeData = referenceVolume.getScalarData();

  if (labelmapData.length !== referenceVolumeData.length) {
    throw new Error('labelmap and referenceVolume must have the same number of pixels');
  }

  const { dimensions, imageData: labelmapImageData } = labelmap;
  const { imageData: referenceVolumeImageData } = referenceVolume;

  let boundsIJK;
  // Todo: using the first annotation for now
  if (annotations?.length && annotations[0].data?.cachedStats) {
    const { projectionPoints } = annotations[0].data.cachedStats;
    const pointsToUse = [].concat(...projectionPoints); // cannot use flat() because of typescript compiler right now

    const rectangleCornersIJK = pointsToUse.map(world => {
      const ijk = vec3.fromValues(0, 0, 0);
      referenceVolumeImageData.worldToIndex(world, ijk);
      return ijk;
    });

    boundsIJK = utilities.boundingBox.getBoundingBoxAroundShape(rectangleCornersIJK, dimensions);
  }

  let max = 0;
  let maxIJK = [0, 0, 0];
  let maxLPS = [0, 0, 0];

  const callback = ({ pointIJK, pointLPS }) => {
    const offset = referenceVolumeImageData.computeOffsetIndex(pointIJK);
    const value = labelmapData[offset];

    if (value !== segmentIndex) {
      return;
    }

    const referenceValue = referenceVolumeData[offset];

    if (referenceValue > max) {
      max = referenceValue;
      maxIJK = pointIJK;
      maxLPS = pointLPS;
    }
  };

  utilities.pointInShapeCallback(labelmapImageData, () => true, callback, boundsIJK);

  const direction = labelmapImageData.getDirection().slice(0, 3);

  /**
   * 2. Find the bottom and top of the great circle for the second sphere (1cc sphere)
   * V = (4/3)πr3
   */
  const radius = Math.pow(1 / ((4 / 3) * Math.PI), 1 / 3) * 10;
  const diameter = radius * 2;

  const secondaryCircleWorld = vec3.create();
  const bottomWorld = vec3.create();
  const topWorld = vec3.create();
  referenceVolumeImageData.indexToWorld(maxIJK, secondaryCircleWorld);
  vec3.scaleAndAdd(bottomWorld, secondaryCircleWorld, direction, -diameter / 2);
  vec3.scaleAndAdd(topWorld, secondaryCircleWorld, direction, diameter / 2);
  const suvPeakCirclePoints = [bottomWorld, topWorld];

  /**
   * 3. Find the Mean and Max of the 1cc sphere centered on the suv Max of the previous
   * sphere
   */
  let count = 0;
  let acc = 0;
  const suvPeakMeanCallback = ({ value }) => {
    acc += value;
    count += 1;
  };

  utilities.pointInSurroundingSphereCallback(
    referenceVolumeImageData,
    suvPeakCirclePoints,
    suvPeakMeanCallback
  );

  const mean = acc / count;

  return {
    max,
    maxIJK,
    maxLPS,
    mean,
  };
}

const obj = {
  calculateSuvPeak,
};

expose(obj);
