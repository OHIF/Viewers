import { inv, multiply } from 'mathjs';

// TODO -> This is pulled out of some internal logic from Dicom Microscopy Viewer,
// We should likely just expose this there.

export default function coordinateFormatScoord3d2Geometry(coordinates, pyramid) {
  let transform = false;
  if (!Array.isArray(coordinates[0])) {
    coordinates = [coordinates];
    transform = true;
  }
  const metadata = pyramid[pyramid.length - 1];
  const orientation = metadata.ImageOrientationSlide;
  const spacing = _getPixelSpacing(metadata);
  const origin = metadata.TotalPixelMatrixOriginSequence[0];
  const offset = [
    Number(origin.XOffsetInSlideCoordinateSystem),
    Number(origin.YOffsetInSlideCoordinateSystem),
  ];

  coordinates = coordinates.map(c => {
    const slideCoord = [c[0], c[1]];
    const pixelCoord = mapSlideCoord2PixelCoord({
      offset,
      orientation,
      spacing,
      point: slideCoord,
    });
    return [pixelCoord[0], -(pixelCoord[1] + 1), 0];
  });
  if (transform) {
    return coordinates[0];
  }
  return coordinates;
}

function _getPixelSpacing(metadata) {
  if (metadata.PixelSpacing) {
    return metadata.PixelSpacing;
  }
  const functionalGroup = metadata.SharedFunctionalGroupsSequence[0];
  const pixelMeasures = functionalGroup.PixelMeasuresSequence[0];
  return pixelMeasures.PixelSpacing;
}

function mapSlideCoord2PixelCoord(options) {
  // X and Y Offset in Slide Coordinate System
  if (!('offset' in options)) {
    throw new Error('Option "offset" is required.');
  }
  if (!Array.isArray(options.offset)) {
    throw new Error('Option "offset" must be an array.');
  }
  if (options.offset.length !== 2) {
    throw new Error('Option "offset" must be an array with 2 elements.');
  }
  const offset = options.offset;

  // Image Orientation Slide with direction cosines for Row and Column direction
  if (!('orientation' in options)) {
    throw new Error('Option "orientation" is required.');
  }
  if (!Array.isArray(options.orientation)) {
    throw new Error('Option "orientation" must be an array.');
  }
  if (options.orientation.length !== 6) {
    throw new Error('Option "orientation" must be an array with 6 elements.');
  }
  const orientation = options.orientation;

  // Pixel Spacing along the Row and Column direction
  if (!('spacing' in options)) {
    throw new Error('Option "spacing" is required.');
  }
  if (!Array.isArray(options.spacing)) {
    throw new Error('Option "spacing" must be an array.');
  }
  if (options.spacing.length !== 2) {
    throw new Error('Option "spacing" must be an array with 2 elements.');
  }
  const spacing = options.spacing;

  // X and Y coordinate in the Slide Coordinate System
  if (!('point' in options)) {
    throw new Error('Option "point" is required.');
  }
  if (!Array.isArray(options.point)) {
    throw new Error('Option "point" must be an array.');
  }
  if (options.point.length !== 2) {
    throw new Error('Option "point" must be an array with 2 elements.');
  }
  const point = options.point;

  const m = [
    [orientation[0] * spacing[1], orientation[3] * spacing[0], offset[0]],
    [orientation[1] * spacing[1], orientation[4] * spacing[0], offset[1]],
    [0, 0, 1],
  ];
  const mInverted = inv(m);

  const vSlide = [[point[0]], [point[1]], [1]];

  const vImage = multiply(mInverted, vSlide);

  const row = Number(vImage[1][0].toFixed(4));
  const col = Number(vImage[0][0].toFixed(4));
  return [col, row];
}
