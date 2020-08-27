import cornerstone from 'cornerstone-core';
import cornerstoneTools from 'cornerstone-tools';
import TOOL_NAMES from '../tools/toolNames';
import * as dcmjs from 'dcmjs';
import { labelToSegmentNumberMap } from '../constants/labels';

const { pointInFreehand } = cornerstoneTools.importInternal(
  'util/freehandUtils'
);

const { Colors, datasetToBlob, DicomMetaDictionary } = dcmjs.data;
const { Segmentation } = dcmjs.derivations;
const { Normalizer } = dcmjs.normalizers;

const { KINDERSPITAL_FREEHAND_ROI_TOOL } = TOOL_NAMES;

const { globalImageIdSpecificToolStateManager } = cornerstoneTools;

export default async function generateSegmenationFromContours(displaySet) {
  const globalToolState = globalImageIdSpecificToolStateManager.saveToolState();

  const imageIds = Object.keys(globalToolState);
  const referencedImageIds = [];
  const contourData = [];

  for (let i = 0; i < imageIds.length; i++) {
    const imageId = imageIds[i];
    const imageIdSpecificToolState = globalToolState[imageId];

    const freehandToolData =
      imageIdSpecificToolState[KINDERSPITAL_FREEHAND_ROI_TOOL];

    if (
      freehandToolData &&
      freehandToolData.data &&
      freehandToolData.data.length
    ) {
      if (!referencedImageIds.includes(imageId)) {
        referencedImageIds.push(imageId);
      }

      freehandToolData.data.forEach(data => {
        contourData.push({
          data,
          imageId,
        });
      });
    }
  }

  const imageIdsToPassToSegmentation = [...referencedImageIds];

  if (referencedImageIds.length === 1) {
    const referencedImageId = referencedImageIds[0];

    // Add another imageId as we need 2 images referenced for the DICOM SEG to be valid.'

    const images = displaySet.images[0]; // First time point;

    const image = images.find(
      image => image.getImageId() !== referencedImageId
    );

    imageIdsToPassToSegmentation.push(image.getImageId());
  }

  // TODO - >

  const segmentation = await generateTemplateSegmentation(
    imageIdsToPassToSegmentation
  );

  // Allocate the correct ammount of statically allocated memory.
  segmentation.setNumberOfFrames(contourData.length);

  const { Rows, Columns } = segmentation.dataset;

  // Generate a SEG frame for each contour.
  contourData.forEach(contour => {
    const { data, imageId } = contour;
    const frameIndex = referencedImageIds.findIndex(
      refImageId => refImageId === imageId
    );

    const FrameNumber = frameIndex + 1;

    const Segment = getSegmentMetadata(data.label);
    const pixelData = new Uint8Array(Rows * Columns);

    let pixelIndex = 0;

    for (let x = 0; x < Columns; x++) {
      for (let y = 0; y < Rows; y++) {
        if (pointInFreehand(data.handles.points, { x: x + 0.5, y: y + 0.5 })) {
          pixelData[pixelIndex] = 1;
        }

        pixelIndex++;
      }
    }

    segmentation.addSegment(Segment, pixelData, [FrameNumber]);
  });

  segmentation.bitPackPixelData();

  const segBlob = datasetToBlob(segmentation.dataset);

  // TEMP - Create a URL for the binary.
  var objectUrl = URL.createObjectURL(segBlob);
  window.open(objectUrl);

  // Pass these in and package this up.
  // Add metadata.
}

function getSegmentMetadata(label) {
  const RecommendedDisplayCIELabValue = Colors.rgb2DICOMLAB([1, 0, 0]);

  const SegmentNumber = labelToSegmentNumberMap[label];

  return {
    SegmentedPropertyCategoryCodeSequence: {
      CodeValue: 'T-D0050',
      CodingSchemeDesignator: 'SRT',
      CodeMeaning: 'Tissue',
    },
    SegmentNumber: SegmentNumber.toString(),
    SegmentLabel: label,
    SegmentAlgorithmType: 'MANUAL',
    SegmentAlgorithmName: 'Manual',
    RecommendedDisplayCIELabValue,
    SegmentedPropertyTypeCodeSequence: {
      CodeValue: 'T-D0050',
      CodingSchemeDesignator: 'SRT',
      CodeMeaning: 'Tissue',
    },
  };
}

async function generateTemplateSegmentation(imageIds) {
  const datasets = [];

  for (let i = 0; i < imageIds.length; i++) {
    const imageId = imageIds[i];
    const dataset = cornerstone.metaData.get('instance', imageId);

    dataset._meta = _meta;

    datasets.push(dataset);
  }

  const multiframe = Normalizer.normalizeToDataset(datasets);

  return new Segmentation([multiframe]);
}

const fileMetaInformationVersionArray = new Uint8Array(2);
fileMetaInformationVersionArray[1] = 1;

const _meta = {
  FileMetaInformationVersion: {
    Value: [fileMetaInformationVersionArray.buffer],
    vr: 'OB',
  },
  TransferSyntaxUID: {
    Value: ['1.2.840.10008.1.2.1'],
    vr: 'UI',
  },
  ImplementationClassUID: {
    Value: [DicomMetaDictionary.uid()],
    vr: 'UI',
  },
  ImplementationVersionName: {
    Value: ['dcmjs'],
    vr: 'SH',
  },
};
