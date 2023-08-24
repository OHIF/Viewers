import { DicomMetadataStore, classes, utils } from '@ohif/core';

import * as cs from '@cornerstonejs/core';
import * as csTools from '@cornerstonejs/tools';

import { SOPClassHandlerName, SOPClassHandlerId } from './id';

const { utilities: csToolsUtils } = csTools;

const CHART_MODALITY = 'CHT';
const LABELMAP = csTools.Enums.SegmentationRepresentations.Labelmap;
const SegSeriesInstanceUidTemplate =
  '1.3.6.1.4.1.12842.1.1.14.4.{date}.{time}.435.{id}';

// Private SOPClassUid for chart data
const ChartDataSOPClassUid = '1.9.451.13215.7.3.2.7.6.1';

const sopClassUids = [ChartDataSOPClassUid];

const makeChartDataDisplaySet = (instance, sopClassUids) => {
  const {
    StudyInstanceUID,
    SeriesInstanceUID,
    SOPInstanceUID,
    SeriesDescription,
    SeriesNumber,
    SeriesDate,
    SOPClassUID,
    chartData,
  } = instance;

  return {
    Modality: CHART_MODALITY,
    loading: false,
    isReconstructable: false,
    displaySetInstanceUID: utils.guid(),
    SeriesDescription,
    SeriesNumber,
    SeriesDate,
    SOPInstanceUID,
    SeriesInstanceUID,
    StudyInstanceUID,
    SOPClassHandlerId,
    SOPClassUID,
    isDerivedDisplaySet: true,
    isLoaded: true,
    sopClassUids,
    instance,
    instances: [instance],
    chartData,
  };
};

function getSopClassUids(instances) {
  const uniqueSopClassUidsInSeries = new Set();
  instances.forEach(instance => {
    uniqueSopClassUidsInSeries.add(instance.SOPClassUID);
  });
  const sopClassUids = Array.from(uniqueSopClassUidsInSeries);

  return sopClassUids;
}

function _getDisplaySetsFromSeries(appContext, instances) {
  // If the series has no instances, stop here
  if (!instances || !instances.length) {
    throw new Error('No instances were provided');
  }

  const sopClassUids = getSopClassUids(instances);
  const displaySets = instances.map(instance => {
    if (instance.Modality === CHART_MODALITY) {
      return makeChartDataDisplaySet(instance, sopClassUids);
    }

    throw new Error('Unsupported modality');
  });

  return displaySets;
}

function _getDateTimeStr() {
  const now = new Date();
  const date =
    now.getFullYear() +
    ('0' + now.getUTCMonth()).slice(-2) +
    ('0' + now.getUTCDate()).slice(-2);
  const time =
    ('0' + now.getUTCHours()).slice(-2) +
    ('0' + now.getUTCMinutes()).slice(-2) +
    ('0' + now.getUTCSeconds()).slice(-2);

  return { date, time };
}

function _getNewSeriesInstanceUid(seriesDate, seriesTime) {
  return SegSeriesInstanceUidTemplate.replace('{date}', seriesDate)
    .replace('{time}', seriesTime)
    .replace(
      '{id}',
      `0000000000${Math.round(Math.random() * 1e12)}`.slice(-10)
    );
}

function _getTimePointsDataByTagName(volume, timePointsTag) {
  const uniqueTimePoints = volume.imageIds.reduce((timePoints, imageId) => {
    const instance = DicomMetadataStore.getInstanceByImageId(imageId);
    const timePointValue = instance[timePointsTag];

    if (timePointValue !== undefined) {
      timePoints.add(timePointValue);
    }

    return timePoints;
  }, new Set());

  return Array.from(uniqueTimePoints).sort();
}

function _convertTimePointsUnit(timePoints, timePointsUnit) {
  const validUnits = ['ms', 's', 'm', 'h'];
  const divisors = [1000, 60, 60];
  const currentUnitIndex = validUnits.indexOf(timePointsUnit);
  let divisor = 1;

  if (currentUnitIndex !== -1) {
    for (let i = currentUnitIndex; i < validUnits.length - 1; i++) {
      const newDivisor = divisor * divisors[i];
      const greaterThanDivisor = timePoints.every(
        timePoint => timePoint > newDivisor
      );

      if (!greaterThanDivisor) {
        break;
      }

      divisor = newDivisor;
      timePointsUnit = validUnits[i + 1];
    }

    if (divisor > 1) {
      timePoints = timePoints.map(timePoint => timePoint / divisor);
    }
  }

  return { timePoints, timePointsUnit };
}

// It currently supports only one tag but a few other will be added soon
// Supported 4D Tags
//   (0018,1060) Trigger Time                   [NOK]
//   (0018,0081) Echo Time                      [NOK]
//   (0018,0086) Echo Number                    [NOK]
//   (0020,0100) Temporal Position Identifier   [NOK]
//   (0054,1300) FrameReferenceTime             [OK]
function _getTimePointsData(volume) {
  const timePointsTags = {
    FrameReferenceTime: {
      unit: 'ms',
    },
  };

  const timePointsTagNames = Object.keys(timePointsTags);
  let timePoints;
  let timePointsUnit;

  for (let i = 0; i < timePointsTagNames.length; i++) {
    const tagName = timePointsTagNames[i];
    const curTimePoints = _getTimePointsDataByTagName(volume, tagName);

    if (curTimePoints.length) {
      timePoints = curTimePoints;
      timePointsUnit = timePointsTags[tagName].unit;
      break;
    }
  }

  if (!timePoints.length) {
    const concatTagNames = timePointsTagNames.join(', ');

    throw new Error(
      `Could not extract time points data for the following tags: ${concatTagNames}`
    );
  }

  const convertedTimePoints = _convertTimePointsUnit(
    timePoints,
    timePointsUnit
  );

  timePoints = convertedTimePoints.timePoints;
  timePointsUnit = convertedTimePoints.timePointsUnit;

  return { timePoints, timePointsUnit };
}

function _getSegmentationData(segmentation, volumesTimePointsCache) {
  const { representationData } = segmentation;
  const { referencedVolumeId } = representationData[LABELMAP];
  const referencedVolume = cs.cache.getVolume(referencedVolumeId);
  const {
    StudyInstanceUID,
    StudyDescription,
  } = DicomMetadataStore.getInstanceByImageId(referencedVolume.imageIds[0]);

  const segPixelDataInTime = csToolsUtils.dynamicVolume.getDataInTime(
    referencedVolume,
    {
      maskVolumeId: segmentation.id,
    }
  ) as number[][];

  const pixelCount = segPixelDataInTime.length;

  if (pixelCount === 0) {
    return [];
  }

  let timePointsData = volumesTimePointsCache.get(referencedVolume);

  if (!timePointsData) {
    timePointsData = _getTimePointsData(referencedVolume);
    volumesTimePointsCache.set(referencedVolume, timePointsData);
  }

  const { timePoints, timePointsUnit } = timePointsData;

  if (timePoints.length !== segPixelDataInTime[0].length) {
    throw new Error('Invalid number of time points returned');
  }

  const timepointsCount = timePoints.length;
  const chartSeriesData = new Array(timepointsCount);

  for (let i = 0; i < timepointsCount; i++) {
    const average = segPixelDataInTime.reduce(
      (acc, cur) => acc + cur[i] / pixelCount,
      0
    );

    chartSeriesData[i] = [timePoints[i], average];
  }

  return {
    StudyInstanceUID,
    StudyDescription,
    chartData: {
      series: {
        label: segmentation.label,
        points: chartSeriesData,
      },
      axis: {
        x: {
          label: `Time (${timePointsUnit})`,
        },
        y: {
          label: `Vl (Bq/ml)`,
        },
      },
    },
  };
}

function _getInstanceFromSegmentations(segmentations) {
  if (!segmentations.length) {
    return;
  }

  const volumesTimePointsCache = new WeakMap();
  const segmentationsData = segmentations.map(segmentation =>
    _getSegmentationData(segmentation, volumesTimePointsCache)
  );

  const { date: seriesDate, time: seriesTime } = _getDateTimeStr();
  const seriesInstanceUid = _getNewSeriesInstanceUid(seriesDate, seriesTime);

  const instance = {
    SOPClassUID: ChartDataSOPClassUid,
    Modality: CHART_MODALITY,
    SeriesDate: seriesDate,
    SeriesTime: seriesTime,
    SeriesInstanceUID: seriesInstanceUid,
    StudyInstanceUID: segmentationsData[0].StudyInstanceUID,
    StudyDescription: segmentationsData[0].StudyDescription,
    SeriesNumber: 100,
    SeriesDescription: 'Segmentation chart series data',
    chartData: {
      series: segmentationsData.reduce(
        (allSeries, curSegData) => [...allSeries, curSegData.chartData.series],
        []
      ),
      axis: { ...segmentationsData[0].chartData.axis },
    },
  };

  const seriesMetadata = {
    StudyInstanceUID: instance.StudyInstanceUID,
    StudyDescription: instance.StudyDescription,
    SeriesInstanceUID: instance.SeriesInstanceUID,
    SeriesDescription: instance.SeriesDescription,
    SeriesNumber: instance.SeriesNumber,
    SeriesTime: instance.SeriesTime,
    SOPClassUID: instance.SOPClassUID,
    Modality: instance.Modality,
  };

  return { seriesMetadata, instance };
}

function _updateSegmentationsDisplaySets(appContext) {
  const { servicesManager } = appContext;
  const { segmentationService } = servicesManager.services;

  const segmentations = segmentationService.getSegmentations();
  const { seriesMetadata, instance } = _getInstanceFromSegmentations(
    segmentations
  );

  // An event is triggered after adding the instance and the displaySet is created
  DicomMetadataStore.addSeriesMetadata([seriesMetadata], true);
  DicomMetadataStore.addInstances([instance], true);
}

function getSopClassHandlerModule(appContext) {
  const getDisplaySetsFromSeries = instances =>
    _getDisplaySetsFromSeries(appContext, instances);
  const updateSegmentationsDisplaySets = () =>
    _updateSegmentationsDisplaySets(appContext);

  return [
    {
      name: SOPClassHandlerName,
      sopClassUids,
      getDisplaySetsFromSeries,
      updateSegmentationsDisplaySets,
    },
  ];
}

export { getSopClassHandlerModule as default };
