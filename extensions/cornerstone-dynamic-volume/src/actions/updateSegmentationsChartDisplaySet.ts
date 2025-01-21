import { DicomMetadataStore, utils } from '@ohif/core';

import * as cs from '@cornerstonejs/core';
import * as csTools from '@cornerstonejs/tools';

const CHART_MODALITY = 'CHT';
const SEG_CHART_INSTANCE_UID = utils.guid();

// Private SOPClassUid for chart data
const ChartDataSOPClassUid = '1.9.451.13215.7.3.2.7.6.1';

const { utilities: csToolsUtils } = csTools;

function _getDateTimeStr() {
  const now = new Date();
  const date =
    now.getFullYear() + ('0' + now.getUTCMonth()).slice(-2) + ('0' + now.getUTCDate()).slice(-2);
  const time =
    ('0' + now.getUTCHours()).slice(-2) +
    ('0' + now.getUTCMinutes()).slice(-2) +
    ('0' + now.getUTCSeconds()).slice(-2);

  return { date, time };
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

  return Array.from(uniqueTimePoints).sort((a: number, b: number) => a - b);
}

function _convertTimePointsUnit(timePoints, timePointsUnit) {
  const validUnits = ['ms', 's', 'm', 'h'];
  const divisors = [1000, 60, 60];
  const currentUnitIndex = validUnits.indexOf(timePointsUnit);
  let divisor = 1;

  if (currentUnitIndex !== -1) {
    for (let i = currentUnitIndex; i < validUnits.length - 1; i++) {
      const newDivisor = divisor * divisors[i];
      const greaterThanDivisorCount = timePoints.filter(timePoint => timePoint > newDivisor).length;

      // Change the scale only if more than 50% of the time points are
      // greater than the new divisor.
      if (greaterThanDivisorCount <= timePoints.length / 2) {
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

    throw new Error(`Could not extract time points data for the following tags: ${concatTagNames}`);
  }

  const convertedTimePoints = _convertTimePointsUnit(timePoints, timePointsUnit);

  timePoints = convertedTimePoints.timePoints;
  timePointsUnit = convertedTimePoints.timePointsUnit;

  return { timePoints, timePointsUnit };
}

function _getSegmentationData(
  segmentation,
  volumesTimePointsCache,
  { servicesManager }: { servicesManager: AppTypes.ServicesManager }
) {
  const { displaySetService, segmentationService, viewportGridService } = servicesManager.services;
  const displaySets = displaySetService.getActiveDisplaySets();

  const dynamic4DDisplaySet = displaySets.find(displaySet => {
    const anInstance = displaySet.instances?.[0];

    if (anInstance) {
      return (
        anInstance.FrameReferenceTime !== undefined || anInstance.NumberOfTimeSlices !== undefined
      );
    }

    return false;
  });

  // const referencedDynamicVolume = cs.cache.getVolume(dynamic4DDisplaySet.displaySetInstanceUID);
  let volumeCacheKey: string | undefined;
  const volumeId = dynamic4DDisplaySet.displaySetInstanceUID;

  for (const [key] of cs.cache._volumeCache) {
    if (key.includes(volumeId)) {
      volumeCacheKey = key;
      break;
    }
  }

  let referencedDynamicVolume;
  if (volumeCacheKey) {
    referencedDynamicVolume = cs.cache.getVolume(volumeCacheKey);
  }

  const { StudyInstanceUID, StudyDescription } = DicomMetadataStore.getInstanceByImageId(
    referencedDynamicVolume.imageIds[0]
  );

  const segmentationVolume = segmentationService.getLabelmapVolume(segmentation.segmentationId);
  const maskVolumeId = segmentationVolume?.volumeId;

  const [timeData, _] = csToolsUtils.dynamicVolume.getDataInTime(referencedDynamicVolume, {
    maskVolumeId,
  }) as number[][];

  const pixelCount = timeData.length;

  if (pixelCount === 0) {
    return [];
  }

  // Todo: this is useless we should be able to grab color with just segRepUID and segmentIndex
  // const color = csTools.segmentation.config.color.getSegmentIndexColor(
  //   segmentationRepresentationUID,
  //   1 // segmentIndex
  // );
  const viewportId = viewportGridService.getActiveViewportId();
  const color = segmentationService.getSegmentColor(viewportId, segmentation.segmentationId, 1);

  const hexColor = cs.utilities.color.rgbToHex(color[0], color[1], color[2]);
  let timePointsData = volumesTimePointsCache.get(referencedDynamicVolume);

  if (!timePointsData) {
    timePointsData = _getTimePointsData(referencedDynamicVolume);
    volumesTimePointsCache.set(referencedDynamicVolume, timePointsData);
  }

  const { timePoints, timePointsUnit } = timePointsData;

  if (timePoints.length !== timeData[0].length) {
    throw new Error('Invalid number of time points returned');
  }

  const timepointsCount = timePoints.length;
  const chartSeriesData = new Array(timepointsCount);

  for (let i = 0; i < timepointsCount; i++) {
    const average = timeData.reduce((acc, cur) => acc + cur[i] / pixelCount, 0);

    chartSeriesData[i] = [timePoints[i], average];
  }

  return {
    StudyInstanceUID,
    StudyDescription,
    chartData: {
      series: {
        label: segmentation.label,
        points: chartSeriesData,
        color: hexColor,
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

function _getInstanceFromSegmentations(segmentations, { servicesManager }) {
  if (!segmentations.length) {
    return;
  }

  const volumesTimePointsCache = new WeakMap();
  const segmentationsData = segmentations.map(segmentation =>
    _getSegmentationData(segmentation, volumesTimePointsCache, { servicesManager })
  );

  const { date: seriesDate, time: seriesTime } = _getDateTimeStr();
  const series = segmentationsData.reduce((allSeries, curSegData) => {
    return [...allSeries, curSegData.chartData.series];
  }, []);

  const instance = {
    SOPClassUID: ChartDataSOPClassUid,
    Modality: CHART_MODALITY,
    SOPInstanceUID: utils.guid(),
    SeriesDate: seriesDate,
    SeriesTime: seriesTime,
    SeriesInstanceUID: SEG_CHART_INSTANCE_UID,
    StudyInstanceUID: segmentationsData[0].StudyInstanceUID,
    StudyDescription: segmentationsData[0].StudyDescription,
    SeriesNumber: 100,
    SeriesDescription: 'Segmentation chart series data',
    chartData: {
      series,
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

function updateSegmentationsChartDisplaySet({ servicesManager }: withAppTypes): void {
  const { segmentationService } = servicesManager.services;
  const segmentations = segmentationService.getSegmentations();
  const { seriesMetadata, instance } =
    _getInstanceFromSegmentations(segmentations, { servicesManager }) ?? {};

  if (seriesMetadata && instance) {
    // An event is triggered after adding the instance and the displaySet is created
    DicomMetadataStore.addSeriesMetadata([seriesMetadata], true);
    DicomMetadataStore.addInstances([instance], true);
  }
}

export { updateSegmentationsChartDisplaySet as default };
