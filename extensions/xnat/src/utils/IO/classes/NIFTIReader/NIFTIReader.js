import * as cornerstone from '@cornerstonejs/core'
import ndarray from 'ndarray';
import * as cornerstoneNIFTIImageLoader from '@cornerstonejs/nifti-image-loader';
import {
  flipMatrix2D,
  flipImageOrientationPatient as flipIOP,
  rotateDirectionCosinesInPlane,
  rotateMatrix902D,
} from './orientation';

const dx = 1e-5;

export default class NIFTIReader {
  constructor(imageIds) {
    this._refImageIds = imageIds;
  }

  async loadFromArrayBuffer(arrayBuffer) {
    const blob = new Blob([arrayBuffer], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const data = await this.load(url);
    URL.revokeObjectURL(url);

    return data;
  }

  async load(url) {
    let maskImage;
    const maskImageSize = {
      width: 0,
      height: 0,
      numberOfFrames: 0,
    };

    const imageIds = this._refImageIds;
    const niftiImageIds = [];
    const headers = [];
    const bufferArrays = [];

    try {
      const imageIdObject = cornerstoneNIFTIImageLoader.nifti.ImageId.fromURL(
        `nifti:${url}`
      );

      headers.push(
        await cornerstoneNIFTIImageLoader.nifti.loadHeader(imageIdObject.url)
      );
      let image = await cornerstoneNIFTIImageLoader.nifti.loadImage(
        imageIdObject.url
      );
      bufferArrays.push(image.getPixelData().buffer);
      niftiImageIds.push(imageIdObject.url);

      const { voxelLength } = headers[0];
      maskImageSize.width = voxelLength[0];
      maskImageSize.height = voxelLength[1];
      maskImageSize.numberOfFrames = voxelLength[2];

      for (let s = 1; s < maskImageSize.numberOfFrames; s++) {
        imageIdObject.slice.index = s;
        headers.push(
          await cornerstoneNIFTIImageLoader.nifti.loadHeader(imageIdObject.url)
        );
        image = await cornerstoneNIFTIImageLoader.nifti.loadImage(
          imageIdObject.url
        );
        bufferArrays.push(image.getPixelData().buffer);
        niftiImageIds.push(imageIdObject.url);
      }

      // Reorient volume
      const refModules = getRefModules(imageIds[0]);
      const refIOP = getImageOrientationPatient(refModules.imagePlaneModule);

      // compute supported orientations:
      const validOrientations = getValidOrientations(refIOP);
      const orientation = checkOrientation(headers[0], validOrientations, [
        refModules.imagePlaneModule.rows,
        refModules.imagePlaneModule.columns,
        imageIds.length,
      ]);

      let insertFunction;

      switch (orientation) {
        case 'Planar':
          insertFunction = insertPixelDataPlanar;
          break;
        case 'Perpendicular':
          throw new Error(
            'Segmentations orthogonal to the acquisition plane of the source data are not yet supported.'
          );
        case 'Oblique':
          throw new Error(
            'Segmentations oblique to the acquisition plane of the source data are not yet supported.'
          );
      }

      const sliceLength = maskImageSize.width * maskImageSize.height;
      const bytesPerVoxel = headers[0].header.numBitsPerVoxel / 8;
      const maskBufferLength =
        sliceLength * maskImageSize.numberOfFrames * bytesPerVoxel;
      maskImage = new ArrayBuffer(maskBufferLength);

      insertFunction(maskImage, bufferArrays, headers, validOrientations, bytesPerVoxel);
    } catch (e) {
      console.log(e);
    }

    return {
      header: headers,
      image: maskImage,
      maskImageSize,
    };
  }
}

const concatArrayBuffers = arrays => {
  if (!arrays.length) return null;

  // sum of individual array lengths
  let totalLength = arrays.reduce((acc, value) => acc + value.byteLength, 0);

  const buffer = new ArrayBuffer(totalLength);
  const uint8 = new Uint8Array(buffer);

  // for each array - copy it over result
  // next array is copied right after the previous one
  let length = 0;
  for (let array of arrays) {
    uint8.set(new Uint8Array(array), length);
    length += array.byteLength;
  }

  return buffer;
};

const getRefModules = imageId => {
  const imagePlaneModule = cornerstone.metaData.get(
    'imagePlaneModule',
    imageId
  );

  const generalSeriesModule = cornerstone.metaData.get(
    'generalSeriesModule',
    imageId
  );

  if (!imagePlaneModule) {
    console.warn('Insufficient metadata, imagePlaneModule missing.');
  }

  return {
    imagePlaneModule,
    generalSeriesModule,
  };
};

const getImageOrientationPatient = imagePlaneModule => {
  return Array.isArray(imagePlaneModule.rowCosines)
    ? [...imagePlaneModule.rowCosines, ...imagePlaneModule.columnCosines]
    : [
        imagePlaneModule.rowCosines.x,
        imagePlaneModule.rowCosines.y,
        imagePlaneModule.rowCosines.z,
        imagePlaneModule.columnCosines.x,
        imagePlaneModule.columnCosines.y,
        imagePlaneModule.columnCosines.z,
      ];
};

/**
 * getValidOrientations - returns an array of valid orientations.
 *
 * @param  {Number[6]} iop The row (0..2) an column (3..5) direction cosines.
 * @return {Number[8][6]} An array of valid orientations.
 */
const getValidOrientations = iop => {
  const orientations = [];

  // [0,  1,  2]: 0,   0hf,   0vf
  // [3,  4,  5]: 90,  90hf,  90vf
  // [6, 7]:      180, 270

  orientations[0] = iop;
  orientations[1] = flipIOP.h(iop);
  orientations[2] = flipIOP.v(iop);

  const iop90 = rotateDirectionCosinesInPlane(iop, Math.PI / 2);

  orientations[3] = iop90;
  orientations[4] = flipIOP.h(iop90);
  orientations[5] = flipIOP.v(iop90);

  orientations[6] = rotateDirectionCosinesInPlane(iop, Math.PI);
  orientations[7] = rotateDirectionCosinesInPlane(iop, 1.5 * Math.PI);

  return orientations;
};

const checkOrientation = (
  niftiMetadata,
  validOrientations,
  sourceDataDimensions
) => {
  const { imageOrientationPatient: iop, rows: Rows } = niftiMetadata;

  const inPlane = validOrientations.some(operation =>
    compareIOP(iop, operation)
  );

  if (inPlane) {
    return 'Planar';
  }

  if (
    checkIfPerpendicular(iop, validOrientations[0]) &&
    sourceDataDimensions.includes(Rows) &&
    sourceDataDimensions.includes(Rows)
  ) {
    // Perpendicular and fits on same grid.
    return 'Perpendicular';
  }

  return 'Oblique';
};

/**
 * compareIOP - Returns true if iop1 and iop2 are equal
 * within a tollerance, dx.
 *
 * @param  {Number[6]} iop1 An ImageOrientationPatient array.
 * @param  {Number[6]} iop2 An ImageOrientationPatient array.
 * @return {Boolean}      True if iop1 and iop2 are equal.
 */
const compareIOP = (iop1, iop2) => {
  return (
    Math.abs(iop1[0] - iop2[0]) < dx &&
    Math.abs(iop1[1] - iop2[1]) < dx &&
    Math.abs(iop1[2] - iop2[2]) < dx &&
    Math.abs(iop1[3] - iop2[3]) < dx &&
    Math.abs(iop1[4] - iop2[4]) < dx &&
    Math.abs(iop1[5] - iop2[5]) < dx
  );
};

/**
 * compareIOP - Returns true if iop1 and iop2 are equal
 * within a tollerance, dx.
 *
 * @param  {Number[6]} iop1 An ImageOrientationPatient array.
 * @param  {Number[6]} iop2 An ImageOrientationPatient array.
 * @return {Boolean}      True if iop1 and iop2 are equal.
 */
const checkIfPerpendicular = (iop1, iop2) => {
  const absDotColumnCosines = Math.abs(
    iop1[0] * iop2[0] + iop1[1] * iop2[1] + iop1[2] * iop2[2]
  );
  const absDotRowCosines = Math.abs(
    iop1[3] * iop2[3] + iop1[4] * iop2[4] + iop1[5] * iop2[5]
  );

  return (
    (absDotColumnCosines < dx || Math.abs(absDotColumnCosines - 1) < dx) &&
    (absDotRowCosines < dx || Math.abs(absDotRowCosines - 1) < dx)
  );
};

const insertPixelDataPlanar = (
  maskImage,
  niftiBufferArrays,
  niftiMetadataArray,
  validOrientations,
  bytesPerVoxel
) => {
  const {
    imageOrientationPatient: sharedIOP,
    rows: Rows,
    columns: Columns,
    numberOfFrames,
    dataType,
  } = niftiMetadataArray[0];

  const typedArray = dataType.TypedArrayConstructor;
  const sliceLength = Columns * Rows;
  const maskBufferLength2D = sliceLength * bytesPerVoxel;

  for (let i = 0; i < numberOfFrames; i++) {
    // const iopI = niftiMetadataArray[i].imageOrientationPatient || sharedIOP;
    const iopI = sharedIOP;

    const byteOffset = maskBufferLength2D * i;

    const pixelDataI2D = ndarray(
      new typedArray(niftiBufferArrays[i]),
      [Rows, Columns]
    );

    const alignedPixelDataI = alignPixelDataWithSourceData(
      pixelDataI2D,
      iopI,
      validOrientations,
      typedArray
    );

    if (!alignedPixelDataI) {
      console.warn(
        'Individual NIfTI frames are out of plane with respect to the first frame, this is not yet supported, skipping this frame.'
      );
      // break;
      continue;
    }

    const maskImage2DView = new typedArray(maskImage, byteOffset, sliceLength);

    const data = alignedPixelDataI.data;
    maskImage2DView.set(data);
  }
};

/**
 * alignPixelDataWithSourceData -
 *
 * @param {Ndarray} pixelData2D The data to align.
 * @param  {Number[6]} iop The orientation of the image slice.
 * @param  {Number[8][6]} orientations   An array of valid imageOrientationPatient values.
 * @return {Ndarray}                         The aligned pixelData.
 */
const alignPixelDataWithSourceData = (
  pixelData2D,
  iop,
  orientations,
  typedArray
) => {
  if (compareIOP(iop, orientations[0])) {
    //Same orientation.
    return pixelData2D;
  } else if (compareIOP(iop, orientations[1])) {
    //Flipped vertically.
    return flipMatrix2D.v(pixelData2D, typedArray);
  } else if (compareIOP(iop, orientations[2])) {
    //Flipped horizontally.
    return flipMatrix2D.h(pixelData2D, typedArray);
  } else if (compareIOP(iop, orientations[3])) {
    //Rotated 90 degrees.
    return rotateMatrix902D(pixelData2D, typedArray);
  } else if (compareIOP(iop, orientations[4])) {
    //Rotated 90 degrees and fliped horizontally.
    return flipMatrix2D.h(
      rotateMatrix902D(pixelData2D, typedArray),
      typedArray
    );
  } else if (compareIOP(iop, orientations[5])) {
    //Rotated 90 degrees and fliped vertically.
    return flipMatrix2D.v(
      rotateMatrix902D(pixelData2D, typedArray),
      typedArray
    );
  } else if (compareIOP(iop, orientations[6])) {
    //Rotated 180 degrees. // TODO -> Do this more effeciently, there is a 1:1 mapping like 90 degree rotation.
    return rotateMatrix902D(
      rotateMatrix902D(pixelData2D, typedArray),
      typedArray
    );
  } else if (compareIOP(iop, orientations[7])) {
    //Rotated 270 degrees.  // TODO -> Do this more effeciently, there is a 1:1 mapping like 90 degree rotation.
    return rotateMatrix902D(
      rotateMatrix902D(
        rotateMatrix902D(pixelData2D, typedArray),
        typedArray),
      typedArray
    );
  }
};
