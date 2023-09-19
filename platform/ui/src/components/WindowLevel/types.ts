import PropTypes from 'prop-types';

export type Range = {
  min: number;
  max: number;
};

export type VOI = {
  windowWidth: number;
  windowCenter: number;
};

export type VOIRange = {
  min: number;
  max: number;
};

export type Histogram = {
  bins: number[];
  numBins: number;
  maxBin: number;
  maxBinValue: number;
  range: {
    min: number;
    max: number;
  };
};

export type Colormap = {
  Name: string;
  RGBPoints: number[];
};

export const rangePropType = PropTypes.shape({
  min: PropTypes.number.isRequired,
  max: PropTypes.number.isRequired,
});

export const voiRangePropType = PropTypes.shape({
  min: PropTypes.number.isRequired,
  max: PropTypes.number.isRequired,
});

export const voiPropType = PropTypes.shape({
  windowCenter: PropTypes.number.isRequired,
  windowWidth: PropTypes.number.isRequired,
});

export const histogramPropType = PropTypes.shape({
  bins: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.number), PropTypes.instanceOf(Int32Array)])
    .isRequired,
  numBins: PropTypes.number.isRequired,
  maxBin: PropTypes.number.isRequired,
  maxBinValue: PropTypes.number.isRequired,
  range: PropTypes.shape({
    min: PropTypes.number.isRequired,
    max: PropTypes.number.isRequired,
  }),
});

export const colormapPropType = PropTypes.shape({
  Name: PropTypes.string,
  RGBPoints: PropTypes.arrayOf(PropTypes.number),
});
