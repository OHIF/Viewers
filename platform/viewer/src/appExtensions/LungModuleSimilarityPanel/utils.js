import axios from 'axios';
import Pako from 'pako';
import { reshape } from 'mathjs';
import Zlib from 'react-zlib-js';
import { flatten } from 'mathjs';
import { radcadapi } from '../../utils/constants';

export const client = axios.create({
  baseURL: radcadapi,
  timeout: 900000,
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

const reconstructSegs = ({ arr, rows, cols, slices, isNnunet }) => {
  console.log('reconstructSegs', { arr });
  let reshaped;
  // if (isNnunet) reshaped = reshape(arr, [rows, cols * slices]);
  // else reshaped = reshape(arr, [slices, rows * cols]);
  reshaped = reshape(arr, [slices, rows * cols]);

  console.log({ reshaped });
  return reshaped;
};

export const uncompress = ({ segmentation, shape, isNnunet }) => {
  const compressData = window.atob(segmentation);
  const splitCompressData = compressData.split('').map(function(e) {
    return e.charCodeAt(0);
  });
  const binData = new Uint8Array(splitCompressData);
  const data = Pako.inflate(binData);
  const dataArr = Array.from(data);
  console.log('starting uncompress');
  console.log({
    isNnunet,
    shape,
  });
  console.log(
    'Has Values Greater Than Zeroes',
    dataArr.some((val, index, arr) => val > 0)
  );
  const reconstructed = reconstructSegs({
    arr: dataArr,
    isNnunet,
    ...shape,
  });
  console.log({
    dataArr,
    reconstructed,
  });
  return reconstructed;
};

export const compressSeg = data => {
  console.log('compressSeg', { data });
  return new Promise((res, rej) => {
    var array = new Uint8Array(data);
    console.log({ array });

    Zlib.deflate(array, async (err, buffer) => {
      if (err) {
        console.error('An error occurred:', err);
        process.exitCode = 1;
      }

      const compStr = await buffer.toString('base64');
      console.log({ compStr, buffer });

      res(compStr);
    });
  });
};

export const getSegArray = ({ segmentations, numSlices, rows, columns }) => {
  console.log('getSegArray', {
    segmentations,
    numSlices,
    rows,
    columns,
    str: JSON.stringify(segmentations),
  });
  const flattened = Array(numSlices).fill(Array(rows * columns).fill(0));
  console.log({ flattened });
  segmentations.forEach((item, index) => {
    // console.log({ item, index });

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
  // console.log('mergePixelData', { currPixelData, item, segmentIndex });
  if (currPixelData) {
    item.map((val, index) => {
      if (val === 1) {
        currPixelData[index] = segmentIndex;
      }
    });

    // console.log({ currPixelData, item });
    return currPixelData;
  } else {
    // console.log('no pixel data... returning imported pixels');
    return item.map((val, index) => {
      if (val === 1) {
        return segmentIndex;
      } else return 0;
    });
  }
};

export const getUpdatedSegments = ({
  segmentation,
  segmentIndex,
  currPixelData,
}) => {
  console.log('getUpdatedSegments', {
    segmentIndex,
    segmentation,
    currPixelData,
  });

  const segmentsOnLabelmap = Array(segmentIndex + 1)
    .fill(0)
    .map((_, index) => {
      // console.log('segmentsOnLabelmap', { index });
      return index;
    });

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
