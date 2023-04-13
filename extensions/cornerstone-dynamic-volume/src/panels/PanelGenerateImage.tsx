import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import { Button, Input, Dropdown, IconButton, Icon } from '@ohif/ui';
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

  //TODO: get referenceVolumeId from viewport
  const dynamicVolumeId = `${volumeLoaderScheme}:${displaySetInstanceUID}`;
  //TODO: get the referencedVolume using cache.getVolume(referencedVolumeId)
  const dynamicVolume = cache.getVolume(dynamicVolumeId);
  // console.warn(dynamicVolume);

  // const onGenerateImage = dynamicVolumeId => {
  //   console.log(dynamicVolumeId);
  //   console.log('onGenerateImage was run');
  //   return;
  // };

  function onGenerateImage() {
    // console.log(dynamicVolumeId);
    console.log('onGenerateImage was run');
    const timeFramesArray = metadata.TimeFrames.split(',');
    for (let i = 0; i < timeFramesArray.length; i++) {
      timeFramesArray[i] = ~~timeFramesArray[i];
    }
    console.log(timeFramesArray);
    console.log(dynamicVolume);
    // const dataInTime = cstUtils.dynamicVolume.generateImageFromTimeData(
    //   dynamicVolume,
    //   metadata.Operation,
    //   timeFramesArray
    // );
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

  return (
    <div className="overflow-x-hidden overflow-y-auto invisible-scrollbar">
      {
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
            <Dropdown
              id="operation-dropdown"
              showDropdownIcon={false}
              list={[
                {
                  title: 'SUM',
                  onClick: () => {
                    // onSegmentationEdit(id);
                  },
                },
                {
                  title: 'AVERAGE',
                  onClick: () => {
                    // onSegmentationDelete(id);
                  },
                },
                {
                  title: 'SUBTRACT',
                  onClick: () => {
                    // onSegmentationDelete(id);
                  },
                },
              ]}
            >
              {/* <IconButton
                id={''}
                variant="text"
                color="inherit"
                size="initial"
                className="text-primary-active"
              >
                <Icon name="panel-group-more" />
              </IconButton> */}
            </Dropdown>
            <Button color="primary" onClick={onGenerateImage}>
              Generate Image
            </Button>
          </div>
        </div>
      }
    </div>
  );
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
