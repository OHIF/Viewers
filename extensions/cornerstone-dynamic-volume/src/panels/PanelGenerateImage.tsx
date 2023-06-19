import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import PropTypes, { array } from 'prop-types';
import { Button, Select, InputDoubleRange, Label, Icon } from '@ohif/ui';
import { useCine, useViewportGrid } from '@ohif/ui';
import { cache, utilities as csUtils, volumeLoader } from '@cornerstonejs/core';
import {
  CONSTANTS as cstConstants,
  Enums as csToolsEnums,
  segmentation as cstSegmentation,
  Types as cstTypes,
  utilities as cstUtils,
} from '@cornerstonejs/tools';

const DEFAULT_OPTIONS = {
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
    cornerstoneViewportService,
    displaySetService,
    hangingProtocolService,
  } = servicesManager.services;
  const { t } = useTranslation('PanelGenerateImage');
  const [generateOptions, setGenerateOptions] = useState(DEFAULT_OPTIONS);
  const [timeOptions, setTimeOptions] = useState([]);
  const [rangeValues, setRangeValues] = useState([]);
  const [sliderValues, setSliderValues] = useState([]);
  const [timeFramesToUse, setTimeFramesToUse] = useState([]);
  const [computedDisplaySet, setComputedDisplaySet] = useState(null);
  const [myDynamicVolume, setMyDynamicVolume] = useState(null);
  const [myComputedVolume, setMyComputedVolume] = useState(null);
  const [frameRate, setFrameRate] = useState(20);
  const [uuidComputedVolume, setUuidComputedVolume] = useState(
    csUtils.uuidv4()
  );

  // Cine states
  // cineState is passed from the reducer in cine provider, cineService is the
  // api passed from the reducer
  const [cineState, cineService] = useCine();
  const { inCineEnabled, cines } = cineState;

  const handleGenerateOptionsChange = generateOptions => {
    setGenerateOptions(prevState => {
      const newState = { ...prevState };
      Object.keys(generateOptions).forEach(key => {
        if (typeof generateOptions[key] === 'object') {
          newState[key] = {
            ...prevState[key],
            ...generateOptions[key],
          };
        } else {
          newState[key] = generateOptions[key];
        }
      });
      return newState;
    });
  };

  // Establish a reference to the viewer API context
  const { activeViewportIndex, viewports } = viewportGridService.getState();
  const displaySetInstanceUID = viewports[0].displaySetInstanceUIDs[0];
  const volumeLoaderScheme = 'cornerstoneStreamingDynamicImageVolume'; // Loader id which defines which volume loader to use
  const computedVolumeId = `cornerstoneStreamingImageVolume:${uuidComputedVolume}`;
  const dynamicVolumeId = `${volumeLoaderScheme}:${displaySetInstanceUID}`;

  useEffect(() => {
    // ~~ Subscription
    const added = cornerstoneViewportService.EVENTS.VIEWPORT_DATA_CHANGED;
    const subscriptions = [];

    // Used to make sure initialization of computed volume only runs once
    let initStatus = false;

    [added].forEach(evt => {
      subscriptions.push(
        cornerstoneViewportService.subscribe(evt, evtdetails => {
          evtdetails.viewportData.data.forEach(volumeData => {
            if (volumeData.volumeId.split(':')[0] === volumeLoaderScheme) {
              if (!initStatus) {
                initStatus = true;
                setMyDynamicVolume(volumeData.volume);
                const options = numTimePointsToOptions(
                  volumeData.volume._numTimePoints
                );
                const range = [1, volumeData.volume._numTimePoints];
                setTimeOptions(prevArray => [...prevArray, ...options]);
                setRangeValues(prevArray => [...prevArray, ...range]);
                setSliderValues(range);
                setTimeFramesToUse([0, 1]);
                const computedVolumeInit = createComputedVolume(
                  volumeData.volume.volumeId,
                  computedVolumeId
                );
                setMyComputedVolume(computedVolumeInit);
              }
            }
          });
        }).unsubscribe
      );
    });

    return () => {
      subscriptions.forEach(unsub => {
        unsub();
      });
    };
  }, []);

  // Get computed volume from cache, calculate the data across the time frames,
  // set the scalar data to the computedVolume, and create displaySet
  function onGenerateImage() {
    const computedVolume = cache.getVolume(computedVolumeId);
    const dataInTime = cstUtils.dynamicVolume.generateImageFromTimeData(
      myDynamicVolume,
      generateOptions.Operation,
      timeFramesToUse
    );

    // Add loadStatus.loaded to computed volume and set to true
    computedVolume.loadStatus = {};
    computedVolume.loadStatus.loaded = true;

    // Set computed scalar data to volume
    const scalarData = computedVolume.getScalarData();
    for (let i = 0; i < dataInTime.length; i++) {
      scalarData[i] = dataInTime[i];
    }

    // If computed display set does not exist, create an object to be used as
    // the displaySet. If it does exist, update the image data and vtkTexture
    if (!computedDisplaySet) {
      const obj = {
        [uuidComputedVolume]: {
          volumeLoaderSchema: computedVolume.volumeId.split(':')[0],
          displaySetInstanceUID: uuidComputedVolume,
          SOPClassHandlerId:
            '@ohif/extension-default.sopClassHandlerModule.stack',
          SOPClassUID: '1.2.840.10008.5.1.4.1.1.128',
          SeriesInstanceUID: 'test',
          StudyInstanceUID: 'test',
          SeriesNumber: 0,
          FrameRate: undefined,
          SeriesDescription: '',
          Modality: myDynamicVolume.metadata.Modality,
          isMultiFrame: false,
          countIcon: undefined,
          numImageFrames: 1,
          uid: uuidComputedVolume,
          averageSpacingBetweenFrames: null,
        },
      };
      setComputedDisplaySet(obj);
    } else {
      // update vtkOpenGLTexture and imageData of computed volume
      const { imageData, vtkOpenGLTexture } = computedVolume;
      const numSlices = imageData.getDimensions()[2];
      const slicesToUpdate = [...Array(numSlices).keys()];
      slicesToUpdate.forEach(i => {
        vtkOpenGLTexture.setUpdatedFrame(i);
      });
      imageData.modified();

      // Check if viewport is currently displaying the computed volume, if so,
      // call render on the viewports to update the image, if not, call
      // renderGeneratedImage
      if (!cache.getVolume(dynamicVolumeId)) {
        for (const viewport of viewports) {
          const renderingEngine = cornerstoneViewportService.getRenderingEngine();
          const viewportForRendering = renderingEngine.getViewport(
            viewport.viewportId
          );
          viewportForRendering.render();
        }
      } else {
        renderGeneratedImage(computedDisplaySet);
      }
    }
  }

  // if computedDisplaySet is defined, render when the data changes
  useEffect(() => {
    if (computedDisplaySet) {
      renderGeneratedImage(computedDisplaySet);
    }
  }, [computedDisplaySet]);

  function renderGeneratedImage(displaySet) {
    commandsManager.runCommand('setDisplaySetToViewport', {
      displaySet,
    });
  }

  function returnTo4D() {
    const displaySets = displaySetService.getDisplaySetCache();
    for (const [key, value] of displaySets) {
      if (value.volumeLoaderSchema === volumeLoaderScheme) {
        const updatedViewports = hangingProtocolService.getViewportsRequireUpdate(
          0,
          key
        );
        viewportGridService.setDisplaySetsForViewports(updatedViewports);
      }
    }
  }

  const handlePlay = () => {
    const viewportInfo = cornerstoneViewportService.viewportsById.get(
      viewports[activeViewportIndex].viewportId
    );
    const { element } = viewportInfo;
    const cine = cines[activeViewportIndex];
    if (!cine.isPlaying) {
      cineService.playClip(element, { framesPerSecond: frameRate });
      cine.isPlaying = true;
    }
  };

  const handleStop = () => {
    const viewportInfo = cornerstoneViewportService.viewportsById.get(
      viewports[activeViewportIndex].viewportId
    );
    const { element } = viewportInfo;
    const cine = cines[activeViewportIndex];
    if (cine.isPlaying) {
      cineService.stopClip(element);
      cine.isPlaying = false;
    }
  };

  const handleSetFrameRate = newFrameRate => {
    if (newFrameRate >= 1 && newFrameRate <= 50) {
      setFrameRate(newFrameRate);
    }
    const cine = cines[0];
    if (cine.isPlaying) {
      handleStop();
      handlePlay();
    }
  };

  useEffect(() => {
    handlePlay;
  }, [frameRate]);

  const handleLast = () => {
    myDynamicVolume.timePointIndex = rangeValues[1] - 1;
  };

  const handleFirst = () => {
    myDynamicVolume.timePointIndex = rangeValues[0] - 1;
  };

  function handleSliderChange(newValues) {
    setSliderValues(newValues);
    const timeFrameValuesArray = Array.from(
      { length: newValues[1] - newValues[0] + 1 },
      (_, i) => i + newValues[0] - 1
    );
    setTimeFramesToUse(timeFrameValuesArray);
  }

  return (
    <div className="flex flex-col">
      <div className="flex flex-col p-4 space-y-4 bg-primary-dark">
        <div className="w-3">
          <InputDoubleRange
            labelClassName="text-black"
            maxValue={rangeValues[1] || 2}
            minValue={rangeValues[0] || 1}
            onSliderChange={handleSliderChange}
            step={10}
            unit="%"
            valueLeft={rangeValues[0] || 1}
            valueRight={rangeValues[1] || 2}
          />
        </div>
        <Select
          label={t('Strategy')}
          closeMenuOnSelect={true}
          className="mr-2 bg-black border-primary-main text-white "
          options={operations}
          placeholder={
            operations.find(
              option => option.value === generateOptions.Operation
            ).placeHolder
          }
          value={generateOptions.Operation}
          onChange={({ value }) => {
            handleGenerateOptionsChange({
              Operation: value,
            });
          }}
        />
        <Button color="primary" onClick={onGenerateImage}>
          Generate Image
        </Button>
        <Button color="primary" onClick={returnTo4D}>
          Return To 4D
        </Button>
        <div className="flex space-between">
          <Button
            onClick={handleFirst}
            variant="contained"
            color="primary"
            border="primary"
            fullWidth={true}
          >
            {'First Frame'}
          </Button>
          <Button
            onClick={handleLast}
            variant="contained"
            color="primary"
            border="primary"
            fullWidth={true}
          >
            {'Last Frame'}
          </Button>
        </div>
        <div className="flex space-between">
          <Button
            onClick={handlePlay}
            variant="contained"
            color="primary"
            border="primary"
            startIcon={<Icon name="icon-play" />}
            fullWidth={true}
          >
            Play
          </Button>
          <Button
            onClick={handleStop}
            variant="contained"
            color="primary"
            border="primary"
            startIcon={<Icon name="icon-pause" />}
            fullWidth={true}
          >
            Pause
          </Button>
        </div>
        <div className="flex justify-center items-center space-between">
          <div
            className={`'cursor-pointer text-primary-active active:text-primary-light hover:bg-customblue-300  flex items-center justify-center rounded-l`}
            onClick={() => handleSetFrameRate(frameRate - 1)}
          >
            <Icon name="icon-prev" />
          </div>
          <div className="border border-secondary-light text-white text-center group-hover/fps:text-primary-light leading-[22px]">
            {`${frameRate} FPS`}
          </div>
          <div
            className={`${'cursor-pointer text-primary-active active:text-primary-light hover:bg-customblue-300 flex items-center justify-center'} rounded-r`}
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
    const computedVolume = await volumeLoader.createAndCacheDerivedVolume(
      dynamicVolumeId,
      {
        volumeId: computedVolumeId,
      }
    );
    return computedVolume;
  }
}

function numTimePointsToOptions(numTimePoints) {
  const options = [];
  for (let i = 0; i < numTimePoints; i++) {
    options.push({ value: `${i}`, label: `${i}`, placeHolder: `${i}` });
  }
  return options;
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
