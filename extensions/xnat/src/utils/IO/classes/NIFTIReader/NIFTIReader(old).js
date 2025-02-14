import * as cornerstoneTools from '@cornerstonejs/tools';
import Nifti from 'nifti-reader-js';

const modules = cornerstoneTools.store.modules;
const tolerance = 0.1;

//TODO -> DO THIS PROPERLY. We need a label key in the ROICollection schema.
// This is why there is currently no official uploader for NIFTI. This is
// essentially hidden functionality for now.
const THEO_NAMES = [
  'Skull',
  'Scapula Right',
  'Scapula Left',
  'Clavicle Right',
  'Clavicle Left',
  'Menubrium + Sternum',
  'Spine Upper',
  'Spine Middle',
  'Spine Lower',
  'Ribs Right',
  'Ribs Left',
  'Iliac Blade Right',
  'Iliac Blade Left',
  'Sacrum',
  'Femur Right',
  'Femur Left',
  'Humerus Right',
  'Humerus Left',
];

/**
 * @class NIFTIReader - Reads a NIFTI file and returns a set of masks.
 */
export default class NIFTIReader {
  constructor(seriesInstanceUid) {
    this._seriesInstanceUid = seriesInstanceUid;
    this._metadataProvider = OHIF.viewer.metadataProvider;
  }

  /**
   * read - Reads the given NIFTI file.
   *
   * @param  {ArrayBuffer} niftiArrayBuffer The NIFTI file as an array buffer.
   * @param  {string[]} imageIds A list of imageIds in the stack.
   * @param  {object} dimensions The dimensions of the NIFTI volume.
   * @returns {object[]}  An array of masks.
   */
  read(niftiArrayBuffer, imageIds, dimensions) {
    this._niftiArrayBuffer = niftiArrayBuffer;

    // Decompress if zipped
    this._decompressIfZipped();

    if (this._isValidNifti() === false) {
      throw 'Invalid nifti file!';
    }

    this._extractHeaders();

    if (this._isValidDimensionality() === false) {
      throw `Parser unsure how to parse ${this._dimensions.dimensionality} dimensional data`;
    }

    const metadataOfFirstImage = this._metadataProvider.getMetadata(
      imageIds[0]
    );
    const imagePlaneOfFirstImage = metadataOfFirstImage.imagePlane;

    const rowPixelSpacing = imagePlaneOfFirstImage.rowPixelSpacing;
    const columnPixelSpacing = imagePlaneOfFirstImage.columnPixelSpacing;
    const imagePositionPatient = imagePlaneOfFirstImage.imagePositionPatient;

    // Only using this to check if numbers are close, default to 1 if not present.
    const orderOfSliceThickness =
      metadataOfFirstImage.instance.sliceThickness ||
      metadataOfFirstImage.instance.sliceThickness ||
      rowPixelSpacing;

    let firstVoxelInNeurologicalFrame;

    if (this._niftiHeader.sform_code > 0) {
      console.log('Mapping NIFTI using affine transformation.');
      firstVoxelInNeurologicalFrame = this._fullAffineTransformToWorldSpace(
        0,
        0,
        0
      );
    } else if (this._niftiHeader.qform_code > 0) {
      console.log('Mapping NIFTI using Quartenion transformation.');
      firstVoxelInNeurologicalFrame = this._quarternionTransformToWorldSpace(
        0,
        0,
        0
      );
    }

    // If mapping NIFTI to DICOM, we have to take the leap of faith that when converting
    // To the DICOM PCS that the frame of reference is the same... which is why DICOM is superior.
    // TODO -> Actually grab the data from the other corresponding image...? There may be
    // Orientations I have not considered.

    const firstVoxelInDicomPCSFrame = [
      -firstVoxelInNeurologicalFrame[0],
      -firstVoxelInNeurologicalFrame[1],
      firstVoxelInNeurologicalFrame[2],
    ];

    let sliceDirection = this._compareSliceDirection(
      imagePositionPatient,
      firstVoxelInDicomPCSFrame,
      orderOfSliceThickness * tolerance
    );
    let sliceOrientation = this._compareSliceOrientation(
      imagePositionPatient,
      firstVoxelInDicomPCSFrame,
      rowPixelSpacing * tolerance
    );

    this._masks = this._extractMasks(sliceDirection, sliceOrientation);

    this._generateMetadata();

    return this._masks;
  }

  /**
   * _quarternionTransformToWorldSpace - Transforms voxel (1,j,k) to the PCS
   *                                     using the quarternion information.
   *
   * @param  {type} i The x index of the voxel.
   * @param  {type} j The y index of the voxel.
   * @param  {type} k The z index of the voxel.
   * @returns {number[3]}   The tranformed coordinate.
   */
  _quarternionTransformToWorldSpace(i, j, k) {
    const niftiHeader = this._niftiHeader;
    const b = niftiHeader.quatern_b;
    const c = niftiHeader.quatern_c;
    const d = niftiHeader.quatern_d;
    const a = Math.sqrt(1 - b * b - c * c - d * d);

    const qfac = niftiHeader.pixDims[0];

    const R = [
      [a * a + b * b - c * c - d * d, 2 * (b * c - a * d), 2 * (b * d + a * c)],
      [2 * (b * c + a * d), a * a + c * c - b * b - d * d, 2 * (c * d - a * b)],
      [2 * (b * d - a * c), 2 * (c * d + a * b), a * a + d * d - b * b - c * c],
    ];

    // Here we modify k by the qfac value, which basically says if the slices
    // Are ascending/descending.
    const voxel = [i, j, qfac * k];

    // Matrix multiplication of R on the voxel column vector.
    const RVoxel = [
      R[0][0] * voxel[0] + R[0][1] * voxel[1] + R[0][2] * voxel[2],
      R[1][0] * voxel[0] + R[1][1] * voxel[1] + R[1][2] * voxel[2],
      R[2][0] * voxel[0] + R[2][1] * voxel[1] + R[2][2] * voxel[2],
    ];

    // Hardimad product of ROnVoxelCoords and pixel dimensions.
    const RVoxel_Hardamard_PixDims = [
      RVoxel[0] * niftiHeader.pixDims[1], // Note this isn't a typo, x is [1].
      RVoxel[1] * niftiHeader.pixDims[2],
      RVoxel[2] * niftiHeader.pixDims[3],
    ];

    const resultAfterOffset = [
      RVoxel_Hardamard_PixDims[0] + niftiHeader.qoffset_x,
      RVoxel_Hardamard_PixDims[1] + niftiHeader.qoffset_y,
      RVoxel_Hardamard_PixDims[2] + niftiHeader.qoffset_z,
    ];

    return resultAfterOffset;
  }

  /**
   * _fullAffineTransformToWorldSpace - Transforms voxel (1,j,k) to the PCS
   *                                    using an affine transform.
   *
   * @param  {type} i The x index of the voxel.
   * @param  {type} j The y index of the voxel.
   * @param  {type} k The z index of the voxel.
   * @returns {number[3]}   The tranformed coordinate.
   */
  _fullAffineTransformToWorldSpace(i, j, k) {
    const niftiHeader = this._niftiHeader;
    // Affine matrix.
    const a = niftiHeader.affine;

    // Voxel
    const v = [i, j, k, 1];

    // This result is the first 3 columns of the affine transform opperating on
    // the voxel column vector. The last element is not needed.
    const result = [
      a[0][0] * v[0] + a[0][1] * v[1] + a[0][2] * v[2] + a[0][3] * v[3],
      a[1][0] * v[0] + a[1][1] * v[1] + a[1][2] * v[2] + a[1][3] * v[3],
      a[2][0] * v[0] + a[2][1] * v[1] + a[2][2] * v[2] + a[2][3] * v[3],
    ];

    return result;
  }

  /**
   * _extractSegmentCount - gets the segment count from the voxel data.
   *
   * @param  {type} niftiLabelMap The extracted label map data.
   * @returns {number} The segmentat count.
   */
  _extractSegmentCount(niftiLabelMap) {
    let len = niftiLabelMap.length;
    let max = -Infinity;

    while (len--) {
      if (niftiLabelMap[len] > max) {
        max = niftiLabelMap[len];
      }
    }

    return max;
  }

  //

  /**
   * _getTheoNames - TEMP - Get the bone name for Theo's work.
   *
   * TODO -> DO THIS PROPERLY. We need a name in the ROICollection schema.
   *
   * @param  {number} segmentIndex The index of the segment.
   * @returns {string} The name of the segment.
   */
  _getTheoNames(segmentIndex) {
    return THEO_NAMES[segmentIndex];
  }

  /**
   * _generateMetadata - generates and set the segment metadata in cornerstoneTools.
   *
   * @returns {null}
   */
  _generateMetadata() {
    for (let i = 0; i < this._segmentationCount; i++) {
      // TEMP -> Generate appropriate metadata since NIFTI has none ¯\_(ツ)_/¯.
      const metadata = {
        RecommendedDisplayCIELabValue: [255, 0, 0],
        SegmentedPropertyCategoryCodeSequence: {
          CodeValue: 'T-D0050',
          CodingSchemeDesignator: 'SRT',
          CodeMeaning: 'Tissue',
        },
        SegmentLabel: `${this._getTheoNames(i)}`,
        SegmentAlgorithmType: 'MANUAL',

        SegmentedPropertyTypeCodeSequence: {
          CodeValue: 'T-D016E',
          CodingSchemeDesignator: 'SRT',
          CodeMeaning: 'Bone',
        },
      };
      this._setSegMetadata(i, metadata);
    }
  }

  /**
   * _compareSliceDirection - Checks which direction the NIFTI slices are in
   *                          relation to the scan data.
   *
   * @param  {object} imagePositionPatient  The imagePositionPatient of the
   *                                        first image in the series.
   * @param  {object} firstVoxelInDicomPCSFrame The position of the the first
   *                                            voxel of the NIFTI in the PCS.
   * @param  {number} tol                       The tolerance.
   * @returns {string}  A string that indicates if the NIFTI slices are ascending
   *                    or descending the scan.
   */
  _compareSliceDirection(imagePositionPatient, firstVoxelInDicomPCSFrame, tol) {
    if (Math.abs(imagePositionPatient.z - firstVoxelInDicomPCSFrame[2]) < tol) {
      return 'ascending';
    }

    return 'descending';
  }

  /**
   * _setSegMetadata - Sets the cornerstoneTools metadata for the segment.
   *
   * @param  {number} segIndex The index of the segment.
   * @param  {object} metadata The metadata.
   * @returns {null}
   */
  _setSegMetadata(segIndex, metadata) {
    modules.brush.setters.metadata(this._seriesInstanceUid, segIndex, metadata);
  }

  /**
   * _compareSliceOrientation - Checks the orientation of the NIFTI slices in
   *                            relation to the scan data.
   *
   * @param  {object} imagePositionPatient  The imagePositionPatient of the
   *                                        first image in the series.
   * @param  {object} firstVoxelInDicomPCSFrame The position of the the first
   *                                            voxel of the NIFTI in the PCS.
   * @param  {number} tol                       The tolerance.
   * @returns {string}  A string that indicates if the NIFTI slices are in the
   *                    same orienation as the DICOM or if they are flipped.
   */
  _compareSliceOrientation(
    imagePositionPatient,
    firstVoxelInDicomPCSFrame,
    tol
  ) {
    // TODO -> This isn't exhaustive yet, just the most common eventualities between NIFTI <--> DICOM.
    if (
      Math.abs(imagePositionPatient.x) -
        Math.abs(firstVoxelInDicomPCSFrame[0]) <
        tol &&
      Math.abs(imagePositionPatient.y) -
        Math.abs(firstVoxelInDicomPCSFrame[1]) <
        tol
    ) {
      // Close, are the images flipped?
      if (
        Math.sign(imagePositionPatient.x) ===
        Math.sign(firstVoxelInDicomPCSFrame[0])
      ) {
        // Same direction, each slice has same X-Y mapping.
        return 'same';
      }
      // TODO -> Maybe only one direction is flipped? You'd assume either it was in Radialogical or
      // Neurological frame of reference, but perhaps we could get some ugly half way house?
      // Assume flipped in x and y per slice.
      return 'reverse';
    }

    throw new Error(
      `x-y plane does not coincide with DICOM, Either these images have totally
      different frame of references or we need to implement more clever method to map NIFTI.`
    );
  }

  /**
   * _decompressIfZipped - If the NIFTI file is compressed, decompress it.
   *
   * @returns {null}
   */
  _decompressIfZipped() {
    if (Nifti.isCompressed(this._niftiArrayBuffer)) {
      this._niftiArrayBuffer = Nifti.decompress(this._niftiArrayBuffer);
    }
  }

  /**
   * _isValidNifti - Checks if the ArrayBuffer is a NIFTI file.
   *
   * @returns {boolean} True if the arraybuffer is a NIFTI.
   */
  _isValidNifti() {
    return Nifti.isNIFTI(this._niftiArrayBuffer);
  }

  /**
   * _isValidDimensionality - Checks that the NIFTI has at least 3 dimensions.
   *
   * @returns {boolean} True if the dimensionality is >= 3.
   */
  _isValidDimensionality() {
    if (this._dimensions.dimensionality >= 3) {
      return true;
    }

    return false;
  }

  /**
   * _extractHeaders - Extracts what little header info NIFTI files have.
   *
   * @returns {null}
   */
  _extractHeaders() {
    this._niftiHeader = Nifti.readHeader(this._niftiArrayBuffer);
    this._niftiExtension = this._extractNiftiExtension();

    this._dimensions = {
      dimensionality: this._niftiHeader.dims[0],
      x: this._niftiHeader.dims[1], // This isn't an off-by-one error, [0] contains the dimensionality.
      y: this._niftiHeader.dims[2],
      z: this._niftiHeader.dims[3],
      sliceLength: this._niftiHeader.dims[1] * this._niftiHeader.dims[2],
    };
  }

  /**
   * _extractMasks - description
   *
   * @param  {type} [sliceDirection = 'ascending']
   *    ascending: each (x * y) elements correspond to slices [0, 1, ..., N].,
   *    descending: each (x * y) elements correspond to slices [N, N-1, ..., 0].
   * @param  {type} [sliceOrientation = 'same']
   *    same: each slice has the voxels in the same order as the source image.
   *    opposite: each slice has the voxels in reverse order.
   * @return {number[][]} An array of masks formated in the correct order for the image.
   */
  _extractMasks(sliceDirection = 'ascending', sliceOrientation = 'same') {
    const niftiLabelMap = this._getXyzPixelArray();
    const segmentationCount = this._extractSegmentCount(niftiLabelMap);

    const dimensions = this._dimensions;
    const sliceLength = dimensions.sliceLength;
    const numberOfSlices = niftiLabelMap.length / sliceLength;

    this._segmentationCount = segmentationCount;

    const masks = [];

    // Generate arrays of zeros.
    for (let i = 0; i < segmentationCount; i++) {
      masks.push(new Uint8ClampedArray(niftiLabelMap.length));
    }

    if (sliceDirection === 'ascending' && sliceOrientation === 'same') {
      for (let i = 0; i < niftiLabelMap.length; i++) {
        if (niftiLabelMap[i]) {
          // Zero-index the masks, hence niftiLabelMap[i] - 1.
          masks[niftiLabelMap[i] - 1][i] = 1;
        }
      }
    } else if (
      sliceDirection === 'ascending' &&
      sliceOrientation === 'opposite'
    ) {
      for (let slice = 0; slice < numberOfSlices; slice++) {
        // Fill each slice in reverse order.
        for (let i = 0, p = sliceLength - 1; i < sliceLength; i++, p--) {
          const niftI = slice * sliceLength + i;
          const destinationI = slice * sliceLength + p;

          if (niftiLabelMap[niftI]) {
            // Zero-index the masks, hence niftiLabelMap[i] - 1.
            masks[niftiLabelMap[niftI] - 1][destinationI] = 1;
          }
        }
      }
    } else if (sliceDirection === 'descending' && sliceOrientation === 'same') {
      // Fill slices in reverse order.
      for (
        let slice = 0, sliceToFill = numberOfSlices - 1;
        slice < numberOfSlices;
        slice++, sliceToFill--
      ) {
        for (let i = 0; i < sliceLength; i++) {
          const niftiI = slice * sliceLength + i;
          const destinationI = sliceToFill * sliceLength + i;

          if (niftiLabelMap[niftiI]) {
            // Zero-index the masks, hence niftiLabelMap[i] - 1.
            masks[niftiLabelMap[niftiI] - 1][destinationI] = 1;
          }
        }
      }
    } else if (
      sliceDirection === 'descending' &&
      sliceOrientation === 'opposite'
    ) {
      for (
        let i = 0, p = niftiLabelMap.length - 1;
        i < niftiLabelMap.length;
        i++, p--
      ) {
        if (niftiLabelMap[i]) {
          // Zero-index the masks, hence niftiLabelMap[i] - 1.
          masks[niftiLabelMap[i] - 1][p] = 1;
        }
      }
    }

    return masks;
  }

  /**
   * _extractNiftiExtension - If the NIFTI has extended metadata, extract it.
   *
   * @returns {object||null}  The extention data, or null if it doesn't exist.
   */
  _extractNiftiExtension() {
    if (Nifti.hasExtension(this._niftiHeader)) {
      return Nifti.readExtensionData(niftiHeader, niftiArrayBuffer);
    } else {
      return null;
    }
  }

  /**
   * _extractPixelData - Extracts the pixelData from the NIFTI file.
   *
   * @returns {Int8Array||Int16Array||Int32Array||null} The pixelData.
   */
  _extractPixelData() {
    const niftiImage = Nifti.readImage(
      this._niftiHeader,
      this._niftiArrayBuffer
    );
    const voxelByteLength = this._niftiHeader.numBitsPerVoxel;

    switch (voxelByteLength) {
      case 8:
        return new Int8Array(niftiImage);
      case 16:
        return new Int16Array(niftiImage);
      case 32:
        return new Int32Array(niftiImage);
      default:
        throw new Exception(
          `No method for parsing ArrayBuffer to ${voxelByteLength}-byte array`
        );
    }

    return null;
  }

  /**
   * _getXyzPixelArray - gets a datacube from the NIFTI file.
   *
   * @returns {Int8Array||Int16Array||Int32Array} The datacube.
   */
  _getXyzPixelArray() {
    const dimensions = this._dimensions;
    const dimensionality = dimensions.dimensionality;
    const numberOfElements = dimensions.x * dimensions.y * dimensions.z;

    const pixelData = this._extractPixelData();

    return pixelData.slice(0, numberOfElements);
  }

  get dimensions() {
    return this._dimensions;
  }

  get int8PixelArray() {
    return this._pixelArray;
  }
}
