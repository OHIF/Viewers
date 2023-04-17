import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import { Button, Input, Select } from '@ohif/ui';
// import { useViewportSettings } from '@ohif/ui';
// import { useViewer } from '@ohif/ui';
// import cornerstone from 'cornerstone-core';
import {
  cache,
  eventTarget,
  getEnabledElementByIds,
  metaData,
  Types,
  utilities as csUtils,
  volumeLoader,
} from '@cornerstonejs/core';
import {
  CONSTANTS as cstConstants,
  Enums as csToolsEnums,
  segmentation as cstSegmentation,
  Types as cstTypes,
  utilities as cstUtils,
} from '@cornerstonejs/tools';

const DEFAULT_MEATADATA = {
  TimeFrames: null,
  Operation: 'SUM',
};

const SUM = 'SUM';
const AVG = 'AVERAGE';
const SUB = 'SUBTRACT';

const operations = [
  { value: SUM, label: 'SUM', placeHolder: 'SUM' },
  { value: AVG, label: 'AVERAGE', placeHolder: 'AVERAGE' },
  { value: SUB, label: 'SUBTRACT', placeHolder: 'SUBTRACT' },
];

export default function PanelGenerateImage({
  servicesManager,
  commandsManager,
}) {
  const {
    viewportGridService,
    toolGroupService,
    cornerstoneViewportService,
  } = servicesManager.services;
  const { t } = useTranslation('PanelGenerateImage');
  const [metadata, setMetadata] = useState(DEFAULT_MEATADATA);

  const handleMetadataChange = metadata => {
    setMetadata(prevState => {
      const newState = { ...prevState };
      Object.keys(metadata).forEach(key => {
        if (typeof metadata[key] === 'object') {
          newState[key] = {
            ...prevState[key],
            ...metadata[key],
          };
        } else {
          newState[key] = metadata[key];
        }
      });
      return newState;
    });
  };

  // Establish a reference to the viewer API context
  const { activeViewportIndex, viewports } = viewportGridService.getState();
  const displaySetInstanceUID = viewports[0].displaySetInstanceUIDs[0];
  const volumeLoaderScheme = 'cornerstoneStreamingDynamicImageVolume'; // Loader id which defines which volume loader to use
  const computedVolumeId = `cornerstoneStreamingImageVolume:MY_COMPUTED_VOLUME`;

  //TODO: get referenceVolumeId from viewport
  const dynamicVolumeId = `${volumeLoaderScheme}:${displaySetInstanceUID}`;
  //TODO: get the referencedVolume using cache.getVolume(referencedVolumeId)
  const dynamicVolume = cache.getVolume(dynamicVolumeId);
  const computedVolumeInit = createComputedVolume(
    dynamicVolumeId,
    computedVolumeId
  );

  function onGenerateImage() {
    console.log('onGenerateImage was run');
    const timeFramesArray = metadata.TimeFrames.split(',');
    for (let i = 0; i < timeFramesArray.length; i++) {
      timeFramesArray[i] = ~~timeFramesArray[i];
    }
    const computedVolume = cache.getVolume(computedVolumeId);

    const dataInTime = cstUtils.dynamicVolume.generateImageFromTimeData(
      dynamicVolume,
      metadata.Operation,
      timeFramesArray
    );

    const scalarData = computedVolume.getScalarData();
    for (let i = 0; i < dataInTime.length; i++) {
      scalarData[i] = dataInTime[i];
    }

    console.log(computedVolume.getScalarData());
    renderGeneratedImage();
  }

  function renderGeneratedImage() {
    console.log(viewports);
    console.log('renderGenerateImage was run');
    // const test = cornerstoneViewportService;
    const viewport1 = cornerstoneViewportService.getCornerstoneViewportByIndex(
      0
    );
    cornerstoneViewportService.set;
  }

  //TODO: uncomment this section that checks for referencedVolume
  // if (!referencedVolume) {
  //   throw new Error(
  //     `No volume found for referencedVolumeId: ${referencedVolumeId}`
  //   );
  // }

  //TODO: Derive volume to use for generating data
  // Force use of a Uint8Array SharedArrayBuffer for the segmentation to save space and so
  // it is easily compressible in worker thread.

  //NOTE: function generateImageFromTimeData(dynamicVolume, operation, frameNumbers)

  // const { viewportSpecificData } = useViewer(activeViewportIndex);

  // // Retrieve the current viewport settings
  // const { viewports } = useViewportSettings();

  // // Extract the current viewport's active tool from the viewports object
  // const activeTool = viewports[activeViewportIndex].activeTool;

  // // Use cornerstoneTools to get the image data from the active tool
  // const timeData = cornerstoneTools[activeTool].getToolState(
  //   cornerstone.getEnabledElements()[0].element,
  //   'time'
  // ).data;

  // function handleClick() {
  //   // Call the generateImageFromTimeData function from CornerstoneJS
  //   const image = cornerstone.generateImageFromTimeData(timeData[0], {});

  //   // Do something with the generated image
  //   console.log(image);
  // }
  if (!metadata.TimeFrames) {
    console.log(dynamicVolume);
  }

  return (
    <div className="flex flex-col">
      <div className="flex flex-col p-4 space-y-4 bg-primary-dark">
        <Input
          label={t('Time Frames')}
          labelClassName="text-white mb-2"
          className="mt-1"
          value={metadata.TimeFrames || ''}
          onChange={e => {
            handleMetadataChange({
              TimeFrames: e.target.value,
            });
          }}
        />
        <Select
          label={t('Strategy')}
          closeMenuOnSelect={true}
          className="mr-2 bg-black border-primary-main text-white "
          options={operations}
          placeholder={
            operations.find(option => option.value === metadata.Operation)
              .placeHolder
          }
          value={metadata.Operation}
          onChange={({ value }) => {
            handleMetadataChange({
              Operation: value,
            });
          }}
        />
        <Button color="primary" onClick={onGenerateImage}>
          Generate Image
        </Button>
      </div>
    </div>
  );
}

async function createComputedVolume(dynamicVolumeId, computedVolumeId) {
  if (!cache.getVolume(computedVolumeId)) {
    const computedVolume = await volumeLoader.createAndCacheDerivedVolume(
      dynamicVolumeId,
      {
        volumeId: computedVolumeId,
      }
    );
    return computedVolume;
  }
}

PanelGenerateImage.propTypes = {
  servicesManager: PropTypes.shape({
    services: PropTypes.shape({
      measurementService: PropTypes.shape({
        getMeasurements: PropTypes.func.isRequired,
        subscribe: PropTypes.func.isRequired,
        EVENTS: PropTypes.object.isRequired,
        VALUE_TYPES: PropTypes.object.isRequired,
      }).isRequired,
    }).isRequired,
  }).isRequired,
};
