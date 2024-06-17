import * as importedActions from './actions';
import { utilities, Enums } from '@cornerstonejs/tools';
import { cache } from '@cornerstonejs/core';

const LABELMAP = Enums.SegmentationRepresentations.Labelmap;

const commandsModule = ({ commandsManager, servicesManager }: withAppTypes) => {
  const services = servicesManager.services;
  const { displaySetService, viewportGridService, segmentationService } = services;

  const actions = {
    ...importedActions,
    getDynamic4DDisplaySet: () => {
      const displaySets = displaySetService.getActiveDisplaySets();

      const dynamic4DDisplaySet = displaySets.find(displaySet => {
        const anInstance = displaySet.instances?.[0];

        if (anInstance) {
          return (
            anInstance.FrameReferenceTime !== undefined ||
            anInstance.NumberOfTimeSlices !== undefined ||
            anInstance.TemporalPositionIdentifier !== undefined
          );
        }

        return false;
      });

      return dynamic4DDisplaySet;
    },
    getComputedDisplaySets: () => {
      const displaySetCache = displaySetService.getDisplaySetCache();
      const cachedDisplaySets = [...displaySetCache.values()];
      const computedDisplaySets = cachedDisplaySets.filter(displaySet => {
        return displaySet.isDerived;
      });
      return computedDisplaySets;
    },
    exportTimeReportCSV: ({ segmentations, config, options, summaryStats }) => {
      const dynamic4DDisplaySet = actions.getDynamic4DDisplaySet();

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

      // empty line
      csv.push('');
      csv.push('');

      // Helper function to calculate standard deviation
      function calculateStandardDeviation(data) {
        const n = data.length;
        const mean = data.reduce((acc, value) => acc + value, 0) / n;
        const squaredDifferences = data.map(value => (value - mean) ** 2);
        const variance = squaredDifferences.reduce((acc, value) => acc + value, 0) / n;
        const stdDeviation = Math.sqrt(variance);
        return stdDeviation;
      }

      // Iterate through each segmentation to get the timeData and ijkCoords
      segmentations.forEach((segmentation, segmentationIndex) => {
        const [timeData, ijkCoords] = utilities.dynamicVolume.getDataInTime(dynamicVolume, {
          maskVolumeId: segmentation.id,
        }) as number[][];

        if (summaryStats) {
          // Adding column headers for pixel identifier and segmentation label ids
          let headers = 'Operation,Segmentation Label ID';
          const maxLength = dynamicVolume.numTimePoints;
          for (let t = 0; t < maxLength; t++) {
            headers += `,Time Point ${t}`;
          }
          csv.push(headers);
          // // perform summary statistics on the timeData including for each time point, mean, median, min, max, and standard deviation for
          // // all the voxels in the ROI
          const mean = [];
          const min = [];
          const minIJK = [];
          const max = [];
          const maxIJK = [];
          const std = [];

          const numVoxels = timeData.length;
          // Helper function to calculate standard deviation
          for (let timeIndex = 0; timeIndex < maxLength; timeIndex++) {
            // for each voxel in the ROI, get the value at the current time point
            const voxelValues = [];
            for (let voxelIndex = 0; voxelIndex < numVoxels; voxelIndex++) {
              voxelValues.push(timeData[voxelIndex][timeIndex]);
            }

            mean.push(voxelValues.reduce((acc, value) => acc + value, 0) / numVoxels);
            const minimum = Math.min(...voxelValues);
            min.push(minimum);
            minIJK.push(ijkCoords[voxelValues.indexOf(minimum)]);
            const maximum = Math.max(...voxelValues);
            max.push(maximum);
            maxIJK.push(ijkCoords[voxelValues.indexOf(maximum)]);
            std.push(calculateStandardDeviation(voxelValues));
          }

          let row = `Mean,${segmentation.label}`;
          // Generate separate rows for each statistic
          for (let t = 0; t < maxLength; t++) {
            row += `,${mean[t]}`;
          }

          csv.push(row);

          row = `Standard Deviation,${segmentation.label}`;
          for (let t = 0; t < maxLength; t++) {
            row += `,${std[t]}`;
          }

          csv.push(row);

          row = `Min,${segmentation.label}`;
          for (let t = 0; t < maxLength; t++) {
            row += `,${min[t]}`;
          }

          csv.push(row);

          row = `Max,${segmentation.label}`;
          for (let t = 0; t < maxLength; t++) {
            row += `,${max[t]}`;
          }

          csv.push(row);
        } else {
          // Adding column headers for pixel identifier and segmentation label ids
          let headers = 'Pixel Identifier (IJK),Segmentation Label ID';
          const maxLength = dynamicVolume.numTimePoints;
          for (let t = 0; t < maxLength; t++) {
            headers += `,Time Point ${t}`;
          }
          csv.push(headers);
          // Assuming timeData and ijkCoords are of the same length
          for (let i = 0; i < timeData.length; i++) {
            // Generate the pixel identifier
            const pixelIdentifier = `${ijkCoords[i][0]}_${ijkCoords[i][1]}_${ijkCoords[i][2]}`;

            // Start a new row for the current pixel
            let row = `${pixelIdentifier},${segmentation.label}`;

            // Add time data points for this pixel
            for (let t = 0; t < timeData[i].length; t++) {
              row += `,${timeData[i][t]}`;
            }

            // Append the row to the CSV array
            csv.push(row);
          }
        }
      });

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
    swapDynamicWithComputedDisplaySet: ({ displaySet }) => {
      const computedDisplaySet = displaySet;

      const displaySetCache = displaySetService.getDisplaySetCache();
      const cachedDisplaySetKeys = [displaySetCache.keys()];
      const { displaySetInstanceUID } = computedDisplaySet;
      // Check to see if computed display set is already in cache
      if (!cachedDisplaySetKeys.includes(displaySetInstanceUID)) {
        displaySetCache.set(displaySetInstanceUID, computedDisplaySet);
      }

      // Get all viewports and their corresponding indices
      const { viewports } = viewportGridService.getState();

      // get the viewports in the grid
      // iterate over them and find the ones that are showing a dynamic
      // volume (displaySet), and replace that exact displaySet with the
      // computed displaySet

      const dynamic4DDisplaySet = actions.getDynamic4DDisplaySet();

      const viewportsToUpdate = [];

      for (const [key, value] of viewports) {
        const viewport = value;
        const viewportOptions = viewport.viewportOptions;
        const { displaySetInstanceUIDs } = viewport;
        const displaySetInstanceUIDIndex = displaySetInstanceUIDs.indexOf(
          dynamic4DDisplaySet.displaySetInstanceUID
        );
        if (displaySetInstanceUIDIndex !== -1) {
          const newViewport = {
            viewportId: viewport.viewportId,
            // merge the other displaySetInstanceUIDs with the new one
            displaySetInstanceUIDs: [
              ...displaySetInstanceUIDs.slice(0, displaySetInstanceUIDIndex),
              displaySetInstanceUID,
              ...displaySetInstanceUIDs.slice(displaySetInstanceUIDIndex + 1),
            ],
            viewportOptions: {
              initialImageOptions: viewportOptions.initialImageOptions,
              viewportType: 'volume',
              orientation: viewportOptions.orientation,
              background: viewportOptions.background,
            },
          };
          viewportsToUpdate.push(newViewport);
        }
      }

      viewportGridService.setDisplaySetsForViewports(viewportsToUpdate);
    },
    swapComputedWithDynamicDisplaySet: () => {
      // Todo: this assumes there is only one dynamic display set in the viewer
      const dynamicDisplaySet = actions.getDynamic4DDisplaySet();

      const displaySetCache = displaySetService.getDisplaySetCache();
      const cachedDisplaySetKeys = [...displaySetCache.keys()]; // Fix: Spread to get the array
      const { displaySetInstanceUID } = dynamicDisplaySet;

      // Check to see if dynamic display set is already in cache
      if (!cachedDisplaySetKeys.includes(displaySetInstanceUID)) {
        displaySetCache.set(displaySetInstanceUID, dynamicDisplaySet);
      }

      // Get all viewports and their corresponding indices
      const { viewports } = viewportGridService.getState();

      // Get the computed 4D display set
      const computed4DDisplaySet = actions.getComputedDisplaySets()[0];

      const viewportsToUpdate = [];

      for (const [key, value] of viewports) {
        const viewport = value;
        const viewportOptions = viewport.viewportOptions;
        const { displaySetInstanceUIDs } = viewport;
        const displaySetInstanceUIDIndex = displaySetInstanceUIDs.indexOf(
          computed4DDisplaySet.displaySetInstanceUID
        );
        if (displaySetInstanceUIDIndex !== -1) {
          const newViewport = {
            viewportId: viewport.viewportId,
            // merge the other displaySetInstanceUIDs with the new one
            displaySetInstanceUIDs: [
              ...displaySetInstanceUIDs.slice(0, displaySetInstanceUIDIndex),
              displaySetInstanceUID,
              ...displaySetInstanceUIDs.slice(displaySetInstanceUIDIndex + 1),
            ],
            viewportOptions: {
              initialImageOptions: viewportOptions.initialImageOptions,
              viewportType: 'volume',
              orientation: viewportOptions.orientation,
              background: viewportOptions.background,
            },
          };
          viewportsToUpdate.push(newViewport);
        }
      }

      viewportGridService.setDisplaySetsForViewports(viewportsToUpdate);
    },
    createNewLabelMapForDynamicVolume: async ({ label }) => {
      const { viewports, activeViewportId } = viewportGridService.getState();

      // get the dynamic 4D display set
      const dynamic4DDisplaySet = actions.getDynamic4DDisplaySet();
      const dynamic4DDisplaySetInstanceUID = dynamic4DDisplaySet.displaySetInstanceUID;

      // check if the dynamic 4D display set is in the display, if not we might have
      // the computed volumes and we should choose them for the segmentation
      // creation

      let referenceDisplaySet;

      const activeViewport = viewports.get(activeViewportId);
      const activeDisplaySetInstanceUIDs = activeViewport.displaySetInstanceUIDs;
      const dynamicIsInActiveViewport = activeDisplaySetInstanceUIDs.includes(
        dynamic4DDisplaySetInstanceUID
      );

      if (dynamicIsInActiveViewport) {
        referenceDisplaySet = dynamic4DDisplaySet;
      }

      if (!referenceDisplaySet) {
        // try to see if there is any derived displaySet in the active viewport
        // which is referencing the dynamic 4D display set

        // Todo: this is wrong but I don't have time to fix it now
        const cachedDisplaySets = displaySetService.getDisplaySetCache();
        for (const [key, displaySet] of cachedDisplaySets) {
          if (displaySet.referenceDisplaySetUID === dynamic4DDisplaySetInstanceUID) {
            referenceDisplaySet = displaySet;
            break;
          }
        }
      }

      if (!referenceDisplaySet) {
        throw new Error('No reference display set found based on the dynamic data');
      }

      const segmentationId = await segmentationService.createSegmentationForDisplaySet(
        referenceDisplaySet.displaySetInstanceUID,
        { label }
      );

      // Add Segmentation to all toolGroupIds in the viewer
      const toolGroupIds = Array.from(
        viewports.values(),
        viewport => viewport.viewportOptions.toolGroupId
      );

      const representationType = LABELMAP;

      for (const toolGroupId of toolGroupIds) {
        const hydrateSegmentation = true;
        await segmentationService.addSegmentationRepresentationToToolGroup(
          toolGroupId,
          segmentationId,
          hydrateSegmentation,
          representationType
        );

        segmentationService.setActiveSegmentationForToolGroup(segmentationId, toolGroupId);
      }

      return segmentationId;
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
    swapDynamicWithComputedDisplaySet: {
      commandFn: actions.swapDynamicWithComputedDisplaySet,
      storeContexts: [],
      options: {},
    },
    createNewLabelMapForDynamicVolume: {
      commandFn: actions.createNewLabelMapForDynamicVolume,
      storeContexts: [],
      options: {},
    },
    swapComputedWithDynamicDisplaySet: {
      commandFn: actions.swapComputedWithDynamicDisplaySet,
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
