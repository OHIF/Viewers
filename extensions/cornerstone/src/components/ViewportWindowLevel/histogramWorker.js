import { expose } from 'comlink';
import vtkImageData from '@kitware/vtk.js/Common/DataModel/ImageData';
import vtkDataArray from '@kitware/vtk.js/Common/Core/DataArray';

/**
 * This object simulates a heavy task by implementing a sleep function and a recursive Fibonacci function.
 * It's used for testing or demonstrating purposes where a heavy or time-consuming task is needed.
 */
const obj = {
  getRange: ({ dimensions, origin, direction, spacing, scalarData }) => {
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

    const range = imageData.computeHistogram(imageData.getBounds());

    return range;
  },
  calcHistogram: ({ data, options }) => {
    if (options === undefined) {
      options = {};
    }
    const histogram = {
      numBins: options.numBins || 256,
      range: { min: 0, max: 0 },
      bins: new Int32Array(1),
      maxBin: 0,
      maxBinValue: 0,
    };

    let minToUse = options.min;
    let maxToUse = options.max;

    if (minToUse === undefined || maxToUse === undefined) {
      let min = Infinity;
      let max = -Infinity;
      let index = data.length;

      while (index--) {
        const value = data[index];
        if (value < min) {
          min = value;
        }
        if (value > max) {
          max = value;
        }
      }

      minToUse = min;
      maxToUse = max;
    }

    histogram.range = { min: minToUse, max: maxToUse };

    const bins = new Int32Array(histogram.numBins);
    const binScale = histogram.numBins / (maxToUse - minToUse);

    for (let index = 0; index < data.length; index++) {
      const value = data[index];
      if (value < minToUse) {
        continue;
      }
      if (value > maxToUse) {
        continue;
      }
      const bin = Math.floor((value - minToUse) * binScale);
      bins[bin] += 1;
    }

    histogram.bins = bins;
    histogram.maxBin = 0;
    histogram.maxBinValue = 0;

    for (let bin = 0; bin < histogram.numBins; bin++) {
      if (histogram.bins[bin] > histogram.maxBinValue) {
        histogram.maxBin = bin;
        histogram.maxBinValue = histogram.bins[bin];
      }
    }

    return histogram;
  },
};

expose(obj);
