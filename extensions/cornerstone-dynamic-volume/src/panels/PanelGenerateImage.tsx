import React, { useEffect, useState, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Button, Icon, Select } from '@ohif/ui';
import { useCine, useViewportGrid } from '@ohif/ui';
import { cache, utilities as csUtils, volumeLoader, eventTarget } from '@cornerstonejs/core';
import { Enums } from '@cornerstonejs/streaming-image-volume-loader';
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
  const { cornerstoneViewportService } = servicesManager.services;
  const [options, setOptions] = useState(DEFAULT_OPTIONS);
  const [timePointsRange, setTimePointsRange] = useState([]);
  const [timePointsToUseForGenerate, setTimePointsToUseForGenerate] = useState([]);
  const [computedDisplaySet, setComputedDisplaySet] = useState(null);
  const [dynamicVolume, setDynamicVolume] = useState(null);
  const [frameRate, setFrameRate] = useState(20);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timePointRendered, setTimePointRendered] = useState(null);
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

    const { unsubscribe } = cornerstoneViewportService.subscribe(evt, evtDetails => {
      evtDetails.viewportData.data.forEach(volumeData => {
        if (volumeData.volume.isDynamicVolume()) {
          setDynamicVolume(volumeData.volume);
          uuidDynamicVolume.current = volumeData.displaySetInstanceUID;
          setTimePointsRange([1, volumeData.volume.numTimePoints]);
          setTimePointsToUseForGenerate([0, 1]);
        }
      });
    });

    return () => {
      unsubscribe();
    };
  }, [cornerstoneViewportService]);

  // useEffect(() => {
  //   const viewportInfo = cornerstoneViewportService.getViewportInfo(activeViewportId);
  //   debugger;

  //   if (volumeData.volume.isDynamicVolume()) {
  //     setDynamicVolume(volumeData.volume);
  //     uuidDynamicVolume.current = volumeData.displaySetInstanceUID;
  //     setTimePointsRange([1, volumeData.volume.numTimePoints]);
  //     setTimePointsToUseForGenerate([0, 1]);
  //   }
  // }, []);

  useEffect(() => {
    // ~~ Subscription
    const evt = Enums.Events.DYNAMIC_VOLUME_TIME_POINT_INDEX_CHANGED;

    const callback = evt => {
      setTimePointRendered(evt.detail.timePointIndex);
    };

    eventTarget.addEventListener(evt, callback);

    return () => {
      eventTarget.removeEventListener(evt, callback);
    };
  }, [cornerstoneViewportService]);

  function renderGeneratedImage(displaySet) {
    commandsManager.runCommand('swapDynamicWithComputedDisplaySet', {
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

    let computedVolume = cache.getVolume(computedVolumeId);

    if (!computedVolume) {
      await createComputedVolume(dynamicVolumeId, computedVolumeId);
      computedVolume = cache.getVolume(computedVolumeId);
    }

    const dataInTime = cstUtils.dynamicVolume.generateImageFromTimeData(
      dynamicVolume,
      options.Operation,
      timePointsToUseForGenerate
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
      const displaySet = {
        volumeLoaderSchema: computedVolume.volumeId.split(':')[0],
        displaySetInstanceUID: uuidComputedVolume.current,
        SOPClassHandlerId: SOPClassHandlerId,
        Modality: dynamicVolume.metadata.Modality,
        isMultiFrame: false,
        numImageFrames: 1,
        uid: uuidComputedVolume.current,
        referenceDisplaySetUID: dynamicVolume.volumeId.split(':')[1],
        madeInClient: true,
        FrameOfReferenceUID: dynamicVolume.metadata.FrameOfReferenceUID,
        isDerived: true,
      };
      setComputedDisplaySet(displaySet);
      renderGeneratedImage(displaySet);
    } else {
      commandsManager.runCommand('updateVolumeData', {
        volume: computedVolume,
      });
      // Check if viewport is currently displaying the computed volume, if so,
      // call render on the viewports to update the image, if not, call
      // renderGeneratedImage
      // if (!cache.getVolume(dynamicVolumeId)) {
      //   for (const viewportId of viewports.keys()) {
      //     const viewportForRendering =
      //       cornerstoneViewportService.getCornerstoneViewport(viewportId);
      //     viewportForRendering.render();
      //   }
      // } else {
      cornerstoneViewportService.getRenderingEngine().render();
      renderGeneratedImage(computedDisplaySet);
      // }
    }
  }

  const handlePlay = () => {
    setIsPlaying(true);
    const viewportInfo = cornerstoneViewportService.getViewportInfo(activeViewportId);

    if (!viewportInfo) {
      return;
    }

    const { element } = viewportInfo;
    cineService.playClip(element, { framesPerSecond: frameRate });
  };

  const handleStop = () => {
    setIsPlaying(false);
    const viewportInfo = cornerstoneViewportService.getViewportInfo(activeViewportId);
    const { element } = viewportInfo;
    cineService.stopClip(element);
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
    setTimePointsToUseForGenerate(timeFrameValuesArray);
  }

  return (
    <div className="flex flex-col">
      <div className="bg-primary-dark flex flex-col space-y-4 p-4">
        <div>
          <div className="mb-2 text-white">Frame Controls</div>
          <div className="flex space-x-2">
            <div className="flex w-2/3 justify-between">
              <Button
                onClick={handlePlay}
                className="mr-1 grow basis-0"
                disabled={!displayingComputedVolume && isPlaying}
              >
                Play
              </Button>
              <Button
                onClick={handleStop}
                className="ml-1 grow basis-0"
                disabled={!displayingComputedVolume && !isPlaying}
              >
                Pause
              </Button>
            </div>
            <div className="flex w-1/3">
              <Select
                closeMenuOnSelect={true}
                options={Array.from({ length: timePointsRange[1] }, (_, i) => ({
                  value: (i + timePointsRange[0]).toString(),
                  label: (i + timePointsRange[0]).toString(),
                }))}
                value={timePointRendered + 1}
                placeholder={(timePointRendered + 1).toString()}
                onChange={({ value }) => {
                  dynamicVolume.timePointIndex = value - timePointsRange[0];
                }}
              />
            </div>
          </div>
          <div className="space-between mt-3 flex items-center justify-center">
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
        <GenerateVolume
          rangeValues={timePointsRange}
          handleSliderChange={handleSliderChange}
          operationsUI={operationsUI}
          options={options}
          handleGenerateOptionsChange={handleGenerateOptionsChange}
          onGenerateImage={onGenerateImage}
          returnTo4D={() => commandsManager.runCommand('swapComputedWithDynamicDisplaySet', {})}
          displayingComputedVolume={displayingComputedVolume}
        />
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
