import dcmjs from 'dcmjs';
import log from 'loglevelnext';
import ndarray from 'ndarray';

import {
  rotateDirectionCosinesInPlane,
  flipImageOrientationPatient as flipIOP,
  flipMatrix2D,
  rotateMatrix902D,
} from './copiedDCMJSInternals/utilities/orientation/index.js';
import {
  encode,
  decode,
} from './copiedDCMJSInternals/utilities/compression/rleSingleSamplePerPixel';

const {
  BitArray,
  DicomMessage,
  DicomMetaDictionary,
  datasetToBlob,
} = dcmjs.data;

const { Normalizer } = dcmjs.normalizers;
const SegmentationDerivation = dcmjs.derivations.Segmentation;

const Segmentation = {
  generateSegmentation,
  generateToolState,
  fillSegmentation,
};

export default Segmentation;

/**
 *
 * @typedef {Object} BrushData
 * @property {Object} toolState - The cornerstoneTools global toolState.
 * @property {Object[]} segments - The cornerstoneTools segment metadata that corresponds to the
 *                                 seriesInstanceUid.
 */

const generateSegmentationDefaultOptions = {
  includeSliceSpacing: true,
  rleEncode: true,
};

/**
 * generateSegmentation - Generates cornerstoneTools brush data, given a stack of
 * imageIds, images and the cornerstoneTools brushData.
 *
 * @param  {object[]} images An array of cornerstone images that contain the source
 *                           data under `image.data.byteArray.buffer`.
 * @param  {Object|Object[]} inputLabelmaps3D The cornerstone `Labelmap3D` object, or an array of objects.
 * @param  {Object} userOptions Options to pass to the segmentation derivation and `fillSegmentation`.
 * @returns {Blob}
 */
function generateSegmentation(images, inputLabelmaps3D, userOptions = {}) {
  const isMultiframe = images[0].imageId.includes('?frame');
  console.log({ isMultiframe, images });
  const segmentation = _createSegFromImages(images, isMultiframe, userOptions);

  return fillSegmentation(segmentation, inputLabelmaps3D, userOptions);
}

/**
 * fillSegmentation - Fills a derived segmentation dataset with cornerstoneTools `LabelMap3D` data.
 *
 * @param  {object[]} segmentation An empty segmentation derived dataset.
 * @param  {Object|Object[]} inputLabelmaps3D The cornerstone `Labelmap3D` object, or an array of objects.
 * @param  {Object} userOptions Options object to override default options.
 * @returns {Blob}           description
 */
function fillSegmentation(segmentation, inputLabelmaps3D, userOptions = {}) {
  const options = Object.assign(
    {},
    generateSegmentationDefaultOptions,
    userOptions
  );

  // Use another variable so we don't redefine labelmaps3D.
  const labelmaps3D = Array.isArray(inputLabelmaps3D)
    ? inputLabelmaps3D
    : [inputLabelmaps3D];

  let numberOfFrames = 0;
  const referencedFramesPerLabelmap = [];

  for (
    let labelmapIndex = 0;
    labelmapIndex < labelmaps3D.length;
    labelmapIndex++
  ) {
    const labelmap3D = labelmaps3D[labelmapIndex];
    const { labelmaps2D, metadata } = labelmap3D;

    const referencedFramesPerSegment = [];

    for (let i = 1; i < metadata.length; i++) {
      if (metadata[i]) {
        referencedFramesPerSegment[i] = [];
      }
    }

    for (let i = 0; i < labelmaps2D.length; i++) {
      const labelmap2D = labelmaps2D[i];

      if (labelmaps2D[i]) {
        const { segmentsOnLabelmap } = labelmap2D;

        segmentsOnLabelmap.forEach(segmentIndex => {
          if (segmentIndex !== 0) {
            referencedFramesPerSegment[segmentIndex].push(i);
            numberOfFrames++;
          }
        });
      }
    }

    referencedFramesPerLabelmap[labelmapIndex] = referencedFramesPerSegment;
  }

  segmentation.setNumberOfFrames(numberOfFrames);

  for (
    let labelmapIndex = 0;
    labelmapIndex < labelmaps3D.length;
    labelmapIndex++
  ) {
    const referencedFramesPerSegment =
      referencedFramesPerLabelmap[labelmapIndex];

    const labelmap3D = labelmaps3D[labelmapIndex];
    const { metadata } = labelmap3D;

    for (
      let segmentIndex = 1;
      segmentIndex < referencedFramesPerSegment.length;
      segmentIndex++
    ) {
      const referencedFrameIndicies = referencedFramesPerSegment[segmentIndex];

      if (referencedFrameIndicies) {
        // Frame numbers start from 1.
        const referencedFrameNumbers = referencedFrameIndicies.map(element => {
          return element + 1;
        });
        const segmentMetadata = metadata[segmentIndex];
        const labelmaps = _getLabelmapsFromRefernecedFrameIndicies(
          labelmap3D,
          referencedFrameIndicies
        );

        segmentation.addSegmentFromLabelmap(
          segmentMetadata,
          labelmaps,
          segmentIndex,
          referencedFrameNumbers
        );
      }
    }
  }

  if (options.rleEncode) {
    const rleEncodedFrames = encode(
      segmentation.dataset.PixelData,
      numberOfFrames,
      segmentation.dataset.Rows,
      segmentation.dataset.Columns
    );

    // Must use fractional now to RLE encode, as the DICOM standard only allows BitStored && BitsAllocated
    // to be 1 for BINARY. This is not ideal and there should be a better format for compression in this manner
    // added to the standard.
    segmentation.assignToDataset({
      BitsAllocated: '8',
      BitsStored: '8',
      HighBit: '7',
      SegmentationType: 'FRACTIONAL',
      SegmentationFractionalType: 'PROBABILITY',
      MaximumFractionalValue: '255',
    });

    segmentation.dataset._meta.TransferSyntaxUID = {
      Value: ['1.2.840.10008.1.2.5'],
      vr: 'UI',
    };
    segmentation.dataset._vrMap.PixelData = 'OB';
    segmentation.dataset.PixelData = rleEncodedFrames;
  } else {
    // If no rleEncoding, at least bitpack the data.
    segmentation.bitPackPixelData();
  }

  const segBlob = datasetToBlob(segmentation.dataset);

  return segBlob;
}

function _getLabelmapsFromRefernecedFrameIndicies(
  labelmap3D,
  referencedFrameIndicies
) {
  const { labelmaps2D } = labelmap3D;

  const labelmaps = [];

  for (let i = 0; i < referencedFrameIndicies.length; i++) {
    const frame = referencedFrameIndicies[i];

    labelmaps.push(labelmaps2D[frame].pixelData);
  }

  return labelmaps;
}

/**
 * _createSegFromImages - description
 *
 * @param  {Object[]} images    An array of the cornerstone image objects.
 * @param  {Boolean} isMultiframe Whether the images are multiframe.
 * @returns {Object}              The Seg derived dataSet.
 */
function _createSegFromImages(images, isMultiframe, options) {
  const datasets = [];

  if (isMultiframe) {
    const image = images[0];
    const arrayBuffer = image.data.byteArray.buffer;

    const dicomData = DicomMessage.readFile(arrayBuffer);
    const dataset = DicomMetaDictionary.naturalizeDataset(dicomData.dict);

    dataset._meta = DicomMetaDictionary.namifyDataset(dicomData.meta);

    datasets.push(dataset);
  } else {
    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      const arrayBuffer = image.data.byteArray.buffer;
      const dicomData = DicomMessage.readFile(arrayBuffer);
      const dataset = DicomMetaDictionary.naturalizeDataset(dicomData.dict);

      dataset._meta = DicomMetaDictionary.namifyDataset(dicomData.meta);
      datasets.push(dataset);
    }
  }

  const multiframe = Normalizer.normalizeToDataset(datasets);

  return new SegmentationDerivation([multiframe], options);
}

/**
 * generateToolState - Given a set of cornrstoneTools imageIds and a Segmentation buffer,
 * derive cornerstoneTools toolState and brush metadata.
 *
 * @param  {string[]} imageIds    An array of the imageIds.
 * @param  {ArrayBuffer} arrayBuffer The SEG arrayBuffer.
 * @param {*} metadataProvider
 * @returns {Object}  The toolState and an object from which the
 *                    segment metadata can be derived.
 */
function generateToolState(imageIds, arrayBuffer, metadataProvider) {
  const dicomData = DicomMessage.readFile(arrayBuffer);
  const dataset = DicomMetaDictionary.naturalizeDataset(dicomData.dict);
  dataset._meta = DicomMetaDictionary.namifyDataset(dicomData.meta);
  const multiframe = Normalizer.normalizeToDataset([dataset]);

  const imagePlaneModule = metadataProvider.get(
    'imagePlaneModule',
    imageIds[0]
  );

  const generalSeriesModule = metadataProvider.get(
    'generalSeriesModule',
    imageIds[0]
  );

  const SeriesInstanceUID = generalSeriesModule.seriesInstanceUID;

  console.warn(
    'Note the cornerstoneTools 4.0 currently assumes the labelmaps are non-overlapping. Overlapping segments will allocate incorrectly. Feel free to submit a PR to improve this behaviour!'
  );

  if (!imagePlaneModule) {
    console.warn('Insufficient metadata, imagePlaneModule missing.');
  }

  const ImageOrientationPatient = Array.isArray(imagePlaneModule.rowCosines)
    ? [...imagePlaneModule.rowCosines, ...imagePlaneModule.columnCosines]
    : [
        imagePlaneModule.rowCosines.x,
        imagePlaneModule.rowCosines.y,
        imagePlaneModule.rowCosines.z,
        imagePlaneModule.columnCosines.x,
        imagePlaneModule.columnCosines.y,
        imagePlaneModule.columnCosines.z,
      ];

  // Get IOP from ref series, compute supported orientations:
  const validOrientations = getValidOrientations(ImageOrientationPatient);

  const sliceLength = multiframe.Columns * multiframe.Rows;
  const segMetadata = getSegmentMetadata(multiframe, SeriesInstanceUID);

  const TransferSyntaxUID = multiframe._meta.TransferSyntaxUID.Value[0];

  let pixelData;
  let isFractional = false;

  if (TransferSyntaxUID === '1.2.840.10008.1.2.5') {
    const rleEncodedFrames = Array.isArray(multiframe.PixelData)
      ? multiframe.PixelData
      : [multiframe.PixelData];

    pixelData = decode(rleEncodedFrames, multiframe.Rows, multiframe.Columns);

    if (multiframe.BitsStored === 1) {
      console.warn('No implementation for rle + bitbacking.');

      return;
    }
  } else {
    const results = unpackPixelData(multiframe);

    pixelData = results.pixelData;
    isFractional = results.isFractional;

    if (!pixelData) {
      throw new Error('Fractional segmentations are not yet supported');
    }
  }

  const orientation = checkOrientation(multiframe, validOrientations, [
    imagePlaneModule.rows,
    imagePlaneModule.columns,
    imageIds.length,
  ]);
  const segmentsOnFrame = [];

  let insertFunction;

  switch (orientation) {
    case 'Planar':
      insertFunction = insertPixelDataPlanar;
      break;
    case 'Perpendicular':
      //insertFunction = insertPixelDataPerpendicular;
      throw new Error(
        'Segmentations orthogonal to the acquisition plane of the source data are not yet supported.'
      );
    case 'Oblique':
      throw new Error(
        'Segmentations oblique to the acquisition plane of the source data are not yet supported.'
      );
  }

  const arrayBufferLength = sliceLength * imageIds.length * 2; // 2 bytes per label voxel in cst4.
  const labelmapBuffer = new ArrayBuffer(arrayBufferLength);

  let probabilityMapBuffer;

  if (isFractional) {
    probabilityMapBuffer = new ArrayBuffer(sliceLength * imageIds.length);
  }

  insertFunction(
    segmentsOnFrame,
    labelmapBuffer,
    pixelData,
    multiframe,
    imageIds,
    validOrientations,
    metadataProvider,
    isFractional,
    probabilityMapBuffer
  );

  return {
    labelmapBuffer,
    probabilityMapBuffer,
    isFractional,
    segMetadata,
    segmentsOnFrame,
  };
}

function insertPixelDataPlanar(
  segmentsOnFrame,
  labelmapBuffer,
  pixelData,
  multiframe,
  imageIds,
  validOrientations,
  metadataProvider,
  isFractional = false,
  probabilityMapBuffer
) {
  const {
    SharedFunctionalGroupsSequence,
    PerFrameFunctionalGroupsSequence,
    Rows,
    Columns,
  } = multiframe;

  const sharedImageOrientationPatient = SharedFunctionalGroupsSequence.PlaneOrientationSequence
    ? SharedFunctionalGroupsSequence.PlaneOrientationSequence
        .ImageOrientationPatient
    : undefined;
  const sliceLength = Columns * Rows;

  for (
    let i = 0, groupsLen = PerFrameFunctionalGroupsSequence.length;
    i < groupsLen;
    ++i
  ) {
    const PerFrameFunctionalGroups = PerFrameFunctionalGroupsSequence[i];

    const ImageOrientationPatientI =
      sharedImageOrientationPatient ||
      PerFrameFunctionalGroups.PlaneOrientationSequence.ImageOrientationPatient;

    const pixelDataI2D = ndarray(
      new Uint8Array(pixelData.buffer, i * sliceLength, sliceLength),
      [Rows, Columns]
    );

    const alignedPixelDataI = alignPixelDataWithSourceData(
      pixelDataI2D,
      ImageOrientationPatientI,
      validOrientations
    );

    if (!alignedPixelDataI) {
      console.warn(
        'Individual SEG frames are out of plane with respect to the first SEG frame, this is not yet supported, skipping this frame.'
      );

      break;
    }

    const segmentIndex =
      PerFrameFunctionalGroups.SegmentIdentificationSequence
        .ReferencedSegmentNumber;

    let SourceImageSequence;

    if (multiframe.SourceImageSequence) {
      SourceImageSequence = multiframe.SourceImageSequence[i];
    } else {
      SourceImageSequence =
        PerFrameFunctionalGroups.DerivationImageSequence.SourceImageSequence;
    }

    const imageId = getImageIdOfSourceImage(
      SourceImageSequence,
      imageIds,
      metadataProvider
    );

    if (!imageId) {
      // Image not present in stack, can't import this frame.
      continue;
    }

    const imageIdIndex = imageIds.findIndex(element => element === imageId);
    const byteOffset = sliceLength * 2 * imageIdIndex; // 2 bytes/pixel

    const labelmap2DView = new Uint16Array(
      labelmapBuffer,
      byteOffset,
      sliceLength
    );

    const probabilityMap2DView = isFractional
      ? new Uint8Array(
          probabilityMapBuffer,
          sliceLength * imageIdIndex,
          sliceLength
        )
      : null;

    const data = alignedPixelDataI.data;

    if (isFractional) {
      // Fill in probability map aswell. Better to duplicate the loop then call if inside every voxel
      for (let j = 0, len = alignedPixelDataI.data.length; j < len; ++j) {
        if (data[j]) {
          for (let x = j + 1; x < len; ++x) {
            if (data[x]) {
              labelmap2DView[x] = segmentIndex;
              probabilityMap2DView[x] = data[x];
            }
          }

          if (!segmentsOnFrame[imageIdIndex]) {
            segmentsOnFrame[imageIdIndex] = [];
          }

          segmentsOnFrame[imageIdIndex].push(segmentIndex);

          break;
        }
      }
    } else {
      for (let j = 0, len = alignedPixelDataI.data.length; j < len; ++j) {
        if (data[j]) {
          for (let x = j + 1; x < len; ++x) {
            if (data[x]) {
              labelmap2DView[x] = segmentIndex;
            }
          }

          if (!segmentsOnFrame[imageIdIndex]) {
            segmentsOnFrame[imageIdIndex] = [];
          }

          segmentsOnFrame[imageIdIndex].push(segmentIndex);

          break;
        }
      }
    }

    //
  }
}

function checkOrientation(multiframe, validOrientations, sourceDataDimensions) {
  const {
    SharedFunctionalGroupsSequence,
    PerFrameFunctionalGroupsSequence,
  } = multiframe;

  const sharedImageOrientationPatient = SharedFunctionalGroupsSequence.PlaneOrientationSequence
    ? SharedFunctionalGroupsSequence.PlaneOrientationSequence
        .ImageOrientationPatient
    : undefined;

  // Check if in plane.
  const PerFrameFunctionalGroups = PerFrameFunctionalGroupsSequence[0];

  const iop =
    sharedImageOrientationPatient ||
    PerFrameFunctionalGroups.PlaneOrientationSequence.ImageOrientationPatient;

  const inPlane = validOrientations.some(operation =>
    compareIOP(iop, operation)
  );

  if (inPlane) {
    return 'Planar';
  }

  if (
    checkIfPerpendicular(iop, validOrientations[0]) &&
    sourceDataDimensions.includes(multiframe.Rows) &&
    sourceDataDimensions.includes(multiframe.Rows)
  ) {
    // Perpendicular and fits on same grid.
    return 'Perpendicular';
  }

  return 'Oblique';
}

/**
 * compareIOP - Returns true if iop1 and iop2 are equal
 * within a tollerance, dx.
 *
 * @param  {Number[6]} iop1 An ImageOrientationPatient array.
 * @param  {Number[6]} iop2 An ImageOrientationPatient array.
 * @return {Boolean}      True if iop1 and iop2 are equal.
 */
function checkIfPerpendicular(iop1, iop2) {
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
}

/**
 * unpackPixelData - Unpacks bitpacked pixelData if the Segmentation is BINARY.
 *
 * @param  {Object} multiframe The multiframe dataset.
 * @return {Uint8Array}      The unpacked pixelData.
 */
function unpackPixelData(multiframe) {
  const segType = multiframe.SegmentationType;

  if (segType === 'BINARY') {
    return {
      pixelData: BitArray.unpack(multiframe.PixelData),
      isFractional: false,
    };
  }

  const pixelData = new Uint8Array(multiframe.PixelData);

  const max = multiframe.MaximumFractionalValue;
  const onlyMaxAndZero =
    pixelData.find(element => element !== 0 && element !== max) === undefined;

  if (!onlyMaxAndZero) {
    log.warn(
      'This segmentation object is actually binary... processing as such.'
    );
  }

  return { pixelData, isFractional: !onlyMaxAndZero };
}

/**
 * getImageIdOfSourceImage - Returns the Cornerstone imageId of the source image.
 *
 * @param  {Object} SourceImageSequence Sequence describing the source image.
 * @param  {String[]} imageIds          A list of imageIds.
 * @param  {Object} metadataProvider    A Cornerstone metadataProvider to query
 *                                      metadata from imageIds.
 * @return {String}                     The corresponding imageId.
 */
function getImageIdOfSourceImage(
  SourceImageSequence,
  imageIds,
  metadataProvider
) {
  const {
    ReferencedSOPInstanceUID,
    ReferencedFrameNumber,
  } = SourceImageSequence;

  return ReferencedFrameNumber
    ? getImageIdOfReferencedFrame(
        ReferencedSOPInstanceUID,
        ReferencedFrameNumber,
        imageIds,
        metadataProvider
      )
    : getImageIdOfReferencedSingleFramedSOPInstance(
        ReferencedSOPInstanceUID,
        imageIds,
        metadataProvider
      );
}

/**
 * getImageIdOfReferencedSingleFramedSOPInstance - Returns the imageId
 * corresponding to the specified sopInstanceUid for single-frame images.
 *
 * @param  {String} sopInstanceUid   The sopInstanceUid of the desired image.
 * @param  {String[]} imageIds         The list of imageIds.
 * @param  {Object} metadataProvider The metadataProvider to obtain sopInstanceUids
 *                                 from the cornerstone imageIds.
 * @return {String}                  The imageId that corresponds to the sopInstanceUid.
 */
function getImageIdOfReferencedSingleFramedSOPInstance(
  sopInstanceUid,
  imageIds,
  metadataProvider
) {
  return imageIds.find(imageId => {
    const sopCommonModule = metadataProvider.get('sopCommonModule', imageId);
    if (!sopCommonModule) {
      return;
    }

    return sopCommonModule.sopInstanceUID === sopInstanceUid;
  });
}

/**
 * getImageIdOfReferencedFrame - Returns the imageId corresponding to the
 * specified sopInstanceUid and frameNumber for multi-frame images.
 *
 * @param  {String} sopInstanceUid   The sopInstanceUid of the desired image.
 * @param  {Number} frameNumber      The frame number.
 * @param  {String} imageIds         The list of imageIds.
 * @param  {Object} metadataProvider The metadataProvider to obtain sopInstanceUids
 *                                   from the cornerstone imageIds.
 * @return {String}                  The imageId that corresponds to the sopInstanceUid.
 */
function getImageIdOfReferencedFrame(
  sopInstanceUid,
  frameNumber,
  imageIds,
  metadataProvider
) {
  const imageId = imageIds.find(imageId => {
    const sopCommonModule = metadataProvider.get('sopCommonModule', imageId);
    if (!sopCommonModule) {
      return;
    }

    const imageIdFrameNumber = Number(imageId.split('frame=')[1]);

    return (
      //frameNumber is zero indexed for cornerstoneWADOImageLoader image Ids.
      sopCommonModule.sopInstanceUID === sopInstanceUid &&
      imageIdFrameNumber === frameNumber - 1
    );
  });

  return imageId;
}

/**
 * getValidOrientations - returns an array of valid orientations.
 *
 * @param  {Number[6]} iop The row (0..2) an column (3..5) direction cosines.
 * @return {Number[8][6]} An array of valid orientations.
 */
function getValidOrientations(iop) {
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
}

/**
 * alignPixelDataWithSourceData -
 *
 * @param {Ndarray} pixelData2D The data to align.
 * @param  {Number[6]} iop The orientation of the image slice.
 * @param  {Number[8][6]} orientations   An array of valid imageOrientationPatient values.
 * @return {Ndarray}                         The aligned pixelData.
 */
function alignPixelDataWithSourceData(pixelData2D, iop, orientations) {
  if (compareIOP(iop, orientations[0])) {
    //Same orientation.
    return pixelData2D;
  } else if (compareIOP(iop, orientations[1])) {
    //Flipped vertically.
    return flipMatrix2D.v(pixelData2D);
  } else if (compareIOP(iop, orientations[2])) {
    //Flipped horizontally.
    return flipMatrix2D.h(pixelData2D);
  } else if (compareIOP(iop, orientations[3])) {
    //Rotated 90 degrees.
    return rotateMatrix902D(pixelData2D);
  } else if (compareIOP(iop, orientations[4])) {
    //Rotated 90 degrees and fliped horizontally.
    return flipMatrix2D.h(rotateMatrix902D(pixelData2D));
  } else if (compareIOP(iop, orientations[5])) {
    //Rotated 90 degrees and fliped vertically.
    return flipMatrix2D.v(rotateMatrix902D(pixelData2D));
  } else if (compareIOP(iop, orientations[6])) {
    //Rotated 180 degrees. // TODO -> Do this more effeciently, there is a 1:1 mapping like 90 degree rotation.
    return rotateMatrix902D(rotateMatrix902D(pixelData2D));
  } else if (compareIOP(iop, orientations[7])) {
    //Rotated 270 degrees.  // TODO -> Do this more effeciently, there is a 1:1 mapping like 90 degree rotation.
    return rotateMatrix902D(rotateMatrix902D(rotateMatrix902D(pixelData2D)));
  }
}

const dx = 1e-5;

/**
 * compareIOP - Returns true if iop1 and iop2 are equal
 * within a tollerance, dx.
 *
 * @param  {Number[6]} iop1 An ImageOrientationPatient array.
 * @param  {Number[6]} iop2 An ImageOrientationPatient array.
 * @return {Boolean}      True if iop1 and iop2 are equal.
 */
function compareIOP(iop1, iop2) {
  return (
    Math.abs(iop1[0] - iop2[0]) < dx &&
    Math.abs(iop1[1] - iop2[1]) < dx &&
    Math.abs(iop1[2] - iop2[2]) < dx &&
    Math.abs(iop1[3] - iop2[3]) < dx &&
    Math.abs(iop1[4] - iop2[4]) < dx &&
    Math.abs(iop1[5] - iop2[5]) < dx
  );
}

function getSegmentMetadata(multiframe, seriesInstanceUid) {
  const segmentSequence = multiframe.SegmentSequence;
  let data = [];

  if (Array.isArray(segmentSequence)) {
    data = [undefined, ...segmentSequence];
  } else {
    // Only one segment, will be stored as an object.
    data = [undefined, segmentSequence];
  }

  return {
    seriesInstanceUid,
    data,
  };
}
