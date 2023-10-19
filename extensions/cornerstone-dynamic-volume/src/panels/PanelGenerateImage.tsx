import React, { useEffect, useState, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Button, Icon } from '@ohif/ui';
import { useCine, useViewportGrid } from '@ohif/ui';
import { cache, utilities as csUtils, volumeLoader } from '@cornerstonejs/core';
import { utilities as cstUtils } from '@cornerstonejs/tools';
import GenerateVolume from './GenerateVolume';

const DEFAULT_OPTIONS = {
  TimeFrames: null,
  Operation: 'SUM',
};

const OPERATION = {
  SUM: 'SUM',
  AVG: 'AVERAGE',
  SUB: 'SUBTRACT',
};

const operationsUI = [
  { value: OPERATION.SUM, label: 'SUM', placeHolder: 'SUM' },
  { value: OPERATION.AVG, label: 'AVERAGE', placeHolder: 'AVERAGE' },
  { value: OPERATION.SUB, label: 'SUBTRACT', placeHolder: 'SUBTRACT' },
];

const volumeLoaderScheme = 'cornerstoneStreamingDynamicImageVolume'; // Loader id which defines which volume loader to use
const SOPClassHandlerId = '@ohif/extension-default.sopClassHandlerModule.stack';

export default function PanelGenerateImage({ servicesManager, commandsManager }) {
  const { viewportGridService, cornerstoneViewportService, hangingProtocolService } =
    servicesManager.services;
  const [options, setOptions] = useState(DEFAULT_OPTIONS);
  const [rangeValues, setRangeValues] = useState([]);
  const [timeFramesToUse, setTimeFramesToUse] = useState([]);
  const [computedDisplaySet, setComputedDisplaySet] = useState(null);
  const [dynamicVolume, setDynamicVolume] = useState(null);
  const [frameRate, setFrameRate] = useState(20);
  const [isPlaying, setIsPlaying] = useState(false);
  const [displayingComputedVolume, setDisplayingComputedVolume] = useState(false);
  const uuidComputedVolume = useRef(csUtils.uuidv4());
  const uuidDynamicVolume = useRef(null);
  const computedVolumeId = `cornerstoneStreamingImageVolume:${uuidComputedVolume.current}`;

  // Cine states
  // cineState is passed from the reducer in cine provider, cineService is the
  // api passed from the reducer
  const [cineState, cineService] = useCine();
  const { cines } = cineState;

  const handleGenerateOptionsChange = options => {
    setOptions(prevState => {
      const newState = { ...prevState };
      Object.keys(options).forEach(key => {
        if (typeof options[key] === 'object') {
          newState[key] = {
            ...prevState[key],
            ...options[key],
          };
        } else {
          newState[key] = options[key];
        }
      });
      return newState;
    });
  };

  const [viewportGrid] = useViewportGrid();
  const { activeViewportId, viewports } = viewportGrid;
  const activeViewport = activeViewportId ? viewports.get(activeViewportId) : undefined;

  const getDynamicVolumeId = useCallback(() => {
    const displaySetInstanceUID = activeViewport?.displaySetInstanceUIDs?.[0];

    return displaySetInstanceUID ? `${volumeLoaderScheme}:${displaySetInstanceUID}` : undefined;
  }, [activeViewport]);

  useEffect(() => {
    // ~~ Subscription
    const evt = cornerstoneViewportService.EVENTS.VIEWPORT_DATA_CHANGED;
    let unsubscribe;

    unsubscribe = cornerstoneViewportService.subscribe(evt, evtdetails => {
      evtdetails.viewportData.data.forEach(volumeData => {
        if (volumeData.volume.isDynamicVolume()) {
          setDynamicVolume(volumeData.volume);
          uuidDynamicVolume.current = volumeData.displaySetInstanceUID;
          const range = [1, volumeData.volume.numTimePoints];
          setRangeValues(range);
          setTimeFramesToUse([0, 1]);
        }
      });
    }).unsubscribe;

    return () => {
      unsubscribe();
    };
  }, [cornerstoneViewportService]);

  function renderGeneratedImage(displaySet) {
    commandsManager.runCommand('setDerviedDisplaySetsInGridViewports', {
      displaySet,
    });
  }

  // Get computed volume from cache, calculate the data across the time frames,
  // set the scalar data to the computedVolume, and create displaySet
  async function onGenerateImage() {
    const dynamicVolumeId = getDynamicVolumeId();

    if (!dynamicVolumeId) {
      return;
    }

    await createComputedVolume(dynamicVolume.volumeId, computedVolumeId);

    const computedVolume = cache.getVolume(computedVolumeId);
    const dataInTime = cstUtils.dynamicVolume.generateImageFromTimeData(
      dynamicVolume,
      options.Operation,
      timeFramesToUse
    );
    // Add loadStatus.loaded to computed volume and set to true
    computedVolume.loadStatus = {};
    computedVolume.loadStatus.loaded = true;
    // Set computed scalar data to volume
    const scalarData = computedVolume.getScalarData();
    scalarData.set(dataInTime);
    setDisplayingComputedVolume(true);

    // If computed display set does not exist, create an object to be used as
    // the displaySet. If it does exist, update the image data and vtkTexture
    if (!computedDisplaySet) {
      const obj = {
        [uuidComputedVolume.current]: {
          volumeLoaderSchema: computedVolume.volumeId.split(':')[0],
          displaySetInstanceUID: uuidComputedVolume.current,
          SOPClassHandlerId: SOPClassHandlerId,
          Modality: dynamicVolume.metadata.Modality,
          isMultiFrame: false,
          numImageFrames: 1,
          uid: uuidComputedVolume.current,
        },
      };
      setComputedDisplaySet(obj);
      renderGeneratedImage(obj);
    } else {
      commandsManager.runCommand('updateVolumeData', {
        volume: computedVolume,
      });
      // Check if viewport is currently displaying the computed volume, if so,
      // call render on the viewports to update the image, if not, call
      // renderGeneratedImage
      if (!cache.getVolume(dynamicVolumeId)) {
        for (const viewportId of viewports.keys()) {
          const viewportForRendering =
            cornerstoneViewportService.getCornerstoneViewport(viewportId);
          viewportForRendering.render();
        }
      } else {
        renderGeneratedImage(computedDisplaySet);
      }
    }
  }

  function returnTo4D() {
    const updatedViewports = hangingProtocolService.getViewportsRequireUpdate(
      activeViewportId,
      uuidDynamicVolume.current
    );
    viewportGridService.setDisplaySetsForViewports(updatedViewports);
    setDisplayingComputedVolume(false);
  }

  const handlePlay = () => {
    setIsPlaying(true);
    const viewportInfo = cornerstoneViewportService.getViewportInfo(activeViewportId);

    if (!viewportInfo) {
      return;
    }

    const { element } = viewportInfo;
    const cine = cines[activeViewportId];
    if (cine && !cine.isPlaying) {
      cineService.playClip(element, { framesPerSecond: frameRate });
      cine.isPlaying = true;
    }
  };

  const handleStop = () => {
    setIsPlaying(false);
    const viewportInfo = cornerstoneViewportService.getViewportInfo(activeViewportId);
    const { element } = viewportInfo;
    const cine = cines[activeViewportId];
    if (cine?.isPlaying) {
      cineService.stopClip(element);
      cine.isPlaying = false;
    }
  };

  const handleSetFrameRate = newFrameRate => {
    if (newFrameRate >= 1 && newFrameRate <= 50) {
      setFrameRate(newFrameRate);
    }
    const cine = cines[activeViewportId];
    if (cine?.isPlaying) {
      handleStop();
      handlePlay();
    }
  };

  function handleSliderChange(newValues) {
    const timeFrameValuesArray = Array.from(
      { length: newValues[1] - newValues[0] + 1 },
      (_, i) => i + newValues[0] - 1
    );
    setTimeFramesToUse(timeFrameValuesArray);
  }

  return (
    <div className="flex flex-col">
      <div className="bg-primary-dark flex flex-col space-y-4 p-4">
        <GenerateVolume
          rangeValues={rangeValues}
          handleSliderChange={handleSliderChange}
          operationsUI={operationsUI}
          options={options}
          handleGenerateOptionsChange={handleGenerateOptionsChange}
          onGenerateImage={onGenerateImage}
          returnTo4D={returnTo4D}
          displayingComputedVolume={displayingComputedVolume}
        />
        <div className="flex justify-between">
          <Button
            onClick={() => {
              dynamicVolume.timePointIndex = rangeValues[0] - 1;
            }}
            className="mr-1 grow basis-0"
          >
            First Frame
          </Button>
          <Button
            onClick={() => {
              dynamicVolume.timePointIndex = rangeValues[1] - 1;
            }}
            className="ml-1 grow basis-0"
          >
            Last Frame
          </Button>
        </div>
        <div className="flex justify-between">
          <Button
            onClick={handlePlay}
            startIcon={<Icon name="icon-play" />}
            className="mr-1 grow basis-0"
            disabled={isPlaying}
          >
            Play
          </Button>
          <Button
            onClick={handleStop}
            startIcon={<Icon name="icon-pause" />}
            className="ml-1 grow basis-0"
            disabled={!isPlaying}
          >
            Pause
          </Button>
        </div>
        <div className="space-between flex items-center justify-center">
          <div
            className={
              'text-primary-active active:text-primary-light hover:bg-customblue-300 flex  cursor-pointer items-center justify-center rounded-l'
            }
            onClick={() => handleSetFrameRate(frameRate - 1)}
          >
            <Icon name="icon-prev" />
          </div>
          <div className="border-secondary-light group-hover/fps:text-primary-light mx-1 border px-2 text-center leading-[22px] text-white">
            {`${frameRate} FPS`}
          </div>
          <div
            className={`${'text-primary-active active:text-primary-light hover:bg-customblue-300 flex cursor-pointer items-center justify-center'} rounded-r`}
            onClick={() => handleSetFrameRate(frameRate + 1)}
          >
            <Icon name="icon-next" />
          </div>
        </div>
      </div>
    </div>
  );
}

async function createComputedVolume(dynamicVolumeId, computedVolumeId) {
  if (!cache.getVolume(computedVolumeId)) {
    const computedVolume = await volumeLoader.createAndCacheDerivedVolume(dynamicVolumeId, {
      volumeId: computedVolumeId,
    });
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
