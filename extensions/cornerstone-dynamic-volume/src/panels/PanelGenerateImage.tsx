import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import PropTypes, { array } from 'prop-types';
import {
  Button,
  Select,
  InputDoubleRange,
  Label,
  Icon,
  FramePanel,
} from '@ohif/ui';
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

export default function PanelGenerateImage({
  servicesManager,
  commandsManager,
}) {
  const {
    viewportGridService,
    cornerstoneViewportService,
    // displaySetService,
    hangingProtocolService,
  } = servicesManager.services;
  const { t } = useTranslation('PanelGenerateImage');
  const [options, setOptions] = useState(DEFAULT_OPTIONS);
  const [rangeValues, setRangeValues] = useState([]);
  const [timeFramesToUse, setTimeFramesToUse] = useState([]);
  const [computedDisplaySet, setComputedDisplaySet] = useState(null);
  const [dynamicVolume, setDynamicVolume] = useState(null);
  const [frameRate, setFrameRate] = useState(20);
  const uuidComputedVolume = useRef(csUtils.uuidv4());
  const uuidDynamicVolume = useRef(null);

  // Cine states
  // cineState is passed from the reducer in cine provider, cineService is the
  // api passed from the reducer
  const [cineState, cineService] = useCine();
  const { inCineEnabled, cines } = cineState;

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

  // Establish a reference to the viewer API context
  const { activeViewportIndex, viewports } = viewportGridService.getState();
  const displaySetInstanceUID = viewports[0].displaySetInstanceUIDs[0];
  const computedVolumeId = `cornerstoneStreamingImageVolume:${uuidComputedVolume.current}`;
  const dynamicVolumeId = `${volumeLoaderScheme}:${displaySetInstanceUID}`;

  useEffect(() => {
    // ~~ Subscription
    const evt = cornerstoneViewportService.EVENTS.VIEWPORT_DATA_CHANGED;
    const subscriptions = [];

    subscriptions.push(
      cornerstoneViewportService.subscribe(evt, evtdetails => {
        evtdetails.viewportData.data.forEach(volumeData => {
          if (volumeData.volumeId.split(':')[0] === volumeLoaderScheme) {
            setDynamicVolume(volumeData.volume);
            uuidDynamicVolume.current = volumeData.displaySetInstanceUID;
            const range = [1, volumeData.volume._numTimePoints];
            setRangeValues(prevArray => [...prevArray, ...range]);
            setTimeFramesToUse([0, 1]);
          }
        });
      }).unsubscribe
    );

    return () => {
      subscriptions.forEach(unsub => {
        unsub();
      });
    };
  }, []);

  function renderGeneratedImage(displaySet) {
    commandsManager.runCommand('setDisplaySetToGridViewports', {
      displaySet,
    });
  }

  // Get computed volume from cache, calculate the data across the time frames,
  // set the scalar data to the computedVolume, and create displaySet
  async function onGenerateImage() {
    const computedVolumeInit = await createComputedVolume(
      dynamicVolume.volumeId,
      computedVolumeId
    );

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
    for (let i = 0; i < dataInTime.length; i++) {
      scalarData[i] = dataInTime[i];
    }

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
    } else {
      commandsManager.runCommand('updateVolumeTextureAndImageData', {
        volume: computedVolume,
      });

      // Check if viewport is currently displaying the computed volume, if so,
      // call render on the viewports to update the image, if not, call
      // renderGeneratedImage
      if (!cache.getVolume(dynamicVolumeId)) {
        for (const viewport of viewports) {
          const viewportForRendering = cornerstoneViewportService.getCornerstoneViewport(
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

  function returnTo4D() {
    const updatedViewports = hangingProtocolService.getViewportsRequireUpdate(
      0,
      uuidDynamicVolume.current
    );
    viewportGridService.setDisplaySetsForViewports(updatedViewports);
  }

  const handlePlay = () => {
    const viewportInfo = cornerstoneViewportService.getViewportInfo(
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
    const viewportInfo = cornerstoneViewportService.getViewportInfo(
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

  function handleSliderChange(newValues) {
    // setSliderValues(newValues);
    const timeFrameValuesArray = Array.from(
      { length: newValues[1] - newValues[0] + 1 },
      (_, i) => i + newValues[0] - 1
    );
    setTimeFramesToUse(timeFrameValuesArray);
  }

  return (
    <div className="flex flex-col">
      <div className="flex flex-col p-4 space-y-4 bg-primary-dark">
        <div className="marginBottom-10px">Frame Panel</div>
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
          options={operationsUI}
          placeholder={
            operationsUI.find(option => option.value === options.Operation)
              .placeHolder
          }
          value={options.Operation}
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
        <div className="flex justify-between">
          <Button
            onClick={() => {
              dynamicVolume.timePointIndex = rangeValues[0] - 1;
            }}
            variant="contained"
            color="primary"
            border="primary"
            fullWidth={true}
            className="flex-grow"
          >
            {'First Frame'}
          </Button>
          <Button
            onClick={() => {
              dynamicVolume.timePointIndex = rangeValues[1] - 1;
            }}
            variant="contained"
            color="primary"
            border="primary"
            fullWidth={true}
            className="flex-grow"
          >
            {'Last Frame'}
          </Button>
        </div>
        <div className="flex justify-between">
          <Button
            onClick={handlePlay}
            variant="contained"
            color="primary"
            border="primary"
            startIcon={<Icon name="icon-play" />}
            fullWidth={true}
            className="flex-grow"
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
            className="flex-grow"
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
