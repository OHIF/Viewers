import axios from 'axios';
import Pako from 'pako';
import {
  add,
  index,
  matrix,
  max,
  range,
  reshape,
  resize,
  size,
  squeeze,
  subset,
} from 'mathjs';
import Zlib from 'react-zlib-js';
import { flatten } from 'mathjs';

const math = require('mathjs');

export const client = axios.create({
  baseURL: 'https://radcadapi.thetatech.ai',
  timeout: 900000,
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

const reconstructSegs = ({ arr, rows, cols, slices }) => {
  console.log('reconstructSegs', { arr });
  const reshaped = reshape(arr, [slices, rows * cols]);
  console.log({ reshaped });
  return reshaped;
};

export const uncompress = ({ segmentation, shape }) => {
  const compressData = atob(segmentation);
  const splitCompressData = compressData.split('').map(function(e) {
    return e.charCodeAt(0);
  });
  const binData = new Uint8Array(splitCompressData);
  const data = Pako.inflate(binData);
  // const decoded = U8.decode(data);
  // const dc = new TextDecoder().decode(data);
  // console.log({ data, decoded, dc });
  const dataArr = Array.from(data);
  const reconstructed = reconstructSegs({
    arr: dataArr,
    ...shape,
  });
  console.log({
    dataArr,
    // dc,
    // buffer: data.buffer,
    reconstructed,
  });
  return reconstructed; //data.buffer;
};

export const compressSeg = data => {
  console.log('compressSeg');
  return new Promise((res, rej) => {
    var array = new Uint8Array(data);
    console.log({ array });

    Zlib.deflate(array, async (err, buffer) => {
      if (err) {
        console.error('An error occurred:', err);
        process.exitCode = 1;
      }

      const compStr = await buffer.toString('base64');
      // const compStr = new Buffer(buffer).toString('base64');
      console.log({ compStr, buffer });

      res(compStr);
    });
  });
};

export const getSegArray = ({ segmentations, numSlices, rows, columns }) => {
  console.log({
    segmentations,
    numSlices,
    rows,
    columns,
    str: JSON.stringify(segmentations),
  });
  const flattened = Array(numSlices).fill(Array(rows * columns).fill(0));
  console.log({ flattened });
  segmentations.forEach((item, index) => {
    console.log({ item, index });

    flattened[index] = Array.from(item.pixelData);
    return;
  });

  console.log({ flattened });

  const mathFlat = flatten(flattened);

  console.log('final', { flattened, mathFlat });
  return mathFlat;
};

export const getSplitSegArray = ({ flatSegmentationArray, index }) => {
  console.log('getSplitSegArray', { index, flatSegmentationArray });
  return flatSegmentationArray.map((item, i) => {
    if (item === index) {
      return 1;
    }
    return 0;
  });
};

export const mergePixelData = ({ currPixelData, item, segmentIndex }) => {
  console.log('mergePixelData', { currPixelData, item, segmentIndex });
  if (currPixelData) {
    item.map((val, index) => {
      if (val === 1) {
        currPixelData[index] = segmentIndex;
      }
    });

    console.log({ currPixelData, item });
    return currPixelData;
  } else {
    console.log('no pixel data... returning imported pixels');
    return item.map((val, index) => {
      if (val === 1) {
        return segmentIndex;
      }
    });
  }
};

export const getUpdatedSegments = ({
  segmentation,
  segmentIndex,
  currPixelData,
}) => {
  console.log({ segmentIndex, segmentation, currPixelData });
  const segmentsOnLabelmap = Array(segmentIndex + 1)
    .fill(0)
    .map((_, index) => {
      console.log('segmentsOnLabelmap', { index });
      return index;
    });
  console.log({ segmentsOnLabelmap });

  console.log({ segmentsOnLabelmap });
  return segmentation.map((item, i) => {
    const updatedPixelData = mergePixelData({
      currPixelData: currPixelData[i] ? currPixelData[i].pixelData : false,
      item,
      segmentIndex,
    });

    return {
      pixelData: updatedPixelData,
      segmentsOnLabelmap,
    };
  });
};

export const compressedToMatrix = (compressed_data, shape) => {
  const inflated = inflate(compressed_data);
  const matrix = math.matrix(Array.from(inflated));
  return reshape(matrix, [shape.rows, shape.cols, shape.slices]);
};

export const inflate = compressed_data => {
  const decoded = atob(compressed_data);
  const splitCompressData = decoded.split('').map(function(e) {
    return e.charCodeAt(0);
  });
  const binData = new Uint8Array(splitCompressData);
  const inflated = Pako.inflate(binData);
  return inflated;
};

export const flattenData = (which_slice, seg_matrix, h, w) => {
  const rows = size(seg_matrix)._data[0];
  const cols = size(seg_matrix)._data[1];

  const slice_data = squeeze(
    subset(seg_matrix, index(range(0, rows), range(0, cols), which_slice))
  );

  const resized_data = resize(slice_data, [h, w], 0);
  const flattened_data = squeeze(reshape(resized_data, [h * w, 1]));
  return flattened_data;
};

export const renderSegmentation = (
  element,
  which_slice,
  seg_matrix,
  stack_slice,
  h,
  w,
  getters
) => {
  const flattened_data = flattenData(which_slice, seg_matrix, h, w);

  if (max(flattened_data) == 0) {
    return;
  }

  // Create a labelmap if it doesn't exist
  getters.labelmap2D(element);

  const labelmap2d = getters.labelmap2DByImageIdIndex(
    getters.labelmap3D(element, 0),
    stack_slice,
    h,
    w
  );

  const summed_data = add(
    flattened_data,
    matrix(Array.from(labelmap2d.pixelData))
  );

  labelmap2d.pixelData.set(summed_data._data);
};
