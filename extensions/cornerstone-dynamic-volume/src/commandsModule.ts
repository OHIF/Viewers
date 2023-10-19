import * as importedActions from './actions';
import { utilities } from '@cornerstonejs/tools';
import { cache } from '@cornerstonejs/core';

const commandsModule = ({ commandsManager, servicesManager }) => {
  const actions = {
    ...importedActions,
    exportTimeReportCSV: ({ segmentations, config, options }) => {
      const services = servicesManager.services;
      const { displaySetService } = services;
      const displaySets = displaySetService.getActiveDisplaySets();
      const dynamic4DDisplaySet = displaySets.find(displaySet => {
        const anInstance = displaySet.instances?.[0];

        if (anInstance) {
          return (
            anInstance.FrameReferenceTime !== undefined ||
            anInstance.NumberOfTimeSlices !== undefined
          );
        }

        return false;
      });

      const volumeId = dynamic4DDisplaySet?.displaySetInstanceUID;

      // cache._volumeCache is a map that has a key that includes the volumeId
      // it is not exactly the volumeId, but it is the key that includes the volumeId
      // so we can't do cache._volumeCache.get(volumeId) we should iterate
      // over the keys and find the one that includes the volumeId
      let volumeCacheKey: string | undefined;

      for (const [key] of cache._volumeCache) {
        if (key.includes(volumeId)) {
          volumeCacheKey = key;
          break;
        }
      }

      let dynamicVolume;
      if (volumeCacheKey) {
        dynamicVolume = cache.getVolume(volumeCacheKey);
      }

      const instance = dynamic4DDisplaySet.instances[0];

      const csv = [];

      // CSV header information with placeholder empty values for the metadata lines
      csv.push(`Patient ID,${instance.PatientID},`);
      csv.push(`Study Date,${instance.StudyDate},`);
      csv.push(`StudyInstanceUID,${instance.StudyInstanceUID},`);
      csv.push(`StudyDescription,${instance.StudyDescription},`);
      csv.push(`SeriesInstanceUID,${instance.SeriesInstanceUID},`);

      // Iterate through each segmentation to get the 2D array data and include it in the CSV
      for (let i = 0; i < segmentations.length; i++) {
        const segmentation = segmentations[i];
        const timeData = utilities.dynamicVolume.getDataInTime(dynamicVolume, {
          maskVolumeId: segmentation.id,
        }) as number[][];

        // Add column headers for this segmentation
        const numColumns = timeData.length; // Assuming timeData is 2D array [numColumns][numRows]
        for (let j = 1; j <= numColumns; j++) {
          csv[0] += `,Seg_${i + 1}_Element_${j}`;
        }

        // Populate CSV rows with the 2D array data
        const numRows = timeData[0].length;
        for (let row = 0; row < numRows; row++) {
          if (csv[row + 5] === undefined) {
            csv[row + 5] = ',';
          }

          for (let col = 0; col < numColumns; col++) {
            csv[row + 5] += `,${timeData[col][row]}`;
          }
        }
      }

      // Convert to CSV string
      const csvContent = csv.join('\n');

      // Generate filename and trigger download
      const filename = `${instance.PatientID}.csv`;
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
  };
  const definitions = {
    updateSegmentationsChartDisplaySet: {
      commandFn: actions.updateSegmentationsChartDisplaySet,
      storeContexts: [],
      options: {},
    },
    exportTimeReportCSV: {
      commandFn: actions.exportTimeReportCSV,
      storeContexts: [],
      options: {},
    },
  };

  return {
    actions,
    definitions,
    defaultContext: 'DYNAMIC-VOLUME:CORNERSTONE',
  };
};

export default commandsModule;
