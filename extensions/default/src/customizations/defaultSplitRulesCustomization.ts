import { utils } from '@ohif/core';

const { isImage } = utils;

export default {
  'splitRules.default': [
    {
      id: 'singleImageModality',
      // Rule to check if instance is SingleImageModality
      ruleSelector: instance =>
        ['CR', 'DX', 'MG'].includes(instance.Modality) &&
        isImage(instance.SOPClassUID) &&
        instance.Rows,
      splitKey: [
        instance =>
          `rows=${Math.round(instance.Rows / 64)}&cols=${Math.round(instance.Columns / 64)}`,
      ],
    },

    {
      id: 'multiFrame',
      makeSeriesInfo: (instances, seriesInfo) => {
        const { NumberOfFrames, SliceLocation } = instances[0];
        seriesInfo.isMultiFrame = NumberOfFrames > 1 && SliceLocation;
        return seriesInfo;
      },
      // Rule to check if instance is MultiFrame
      customAttributes: function ({ instance, isMultiFrame }, options) {
        //const { sliceLocation } = computeSliceLocation(instance) || {};
        return {
          isClip: true,
          numImageFrames: instance.NumberOfFrames,
          splitNumber: options?.splitNumber,
          descriptionName: options?.descriptionName,
          isMultiFrame,
        };
      },
      ruleSelector: (_instance, seriesInfo) => seriesInfo.isMultiFrame, //instance.NumberOfFrames > 1 and has SliceLocation,
      splitKey: ['SeriesInstanceUID', 'InstanceNumber'],
    },

    {
      id: 'mixedDimensionalityBValue',
      makeSeriesInfo: (instances, seriesInfo) => {
        const [instance] = instances;
        const { Modality } = instance;
        if (Modality !== 'MR') {
          return;
        }
        const hasBValue = instances.some(i => i.DiffusionBValue !== undefined);
        if (!hasBValue) {
          return;
        }
        const missingBValue = instances.some(i => i.DiffusionBValue === undefined);
        if (!missingBValue) {
          return;
        }
        seriesInfo.mixedBValue = true;
        return seriesInfo;
      },
      ruleSelector: (_instance, seriesInfo) => {
        return seriesInfo.mixedBValue;
      },
      splitKey: ['SeriesInstanceUID', (instance) => instance.DiffusionBValue === undefined],
    },

    {
      id: 'defaultImageRule',
      // Default rule is an empty object
      ruleSelector: instance => isImage(instance.SOPClassUID) && instance.Rows,
    },
  ],
};
