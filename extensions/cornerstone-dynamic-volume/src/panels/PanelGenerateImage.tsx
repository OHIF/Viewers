import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import PropTypes, { array } from 'prop-types';
import { Button, Input, Select, InputDoubleRange, Label, Icon } from '@ohif/ui';
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
import debounce from 'lodash.debounce';

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

const timeFrameOptions = [
  { value: '1', label: '1', placeHolder: '1' },
  { value: '2', label: '2', placeHolder: '2' },
  { value: '3', label: '3', placeHolder: '3' },
  { value: '4', label: '4', placeHolder: '4' },
  { value: '5', label: '5', placeHolder: '5' },
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
  const [timeOptions, setTimeOptions] = useState([]);
  const [rangeValues, setRangeValues] = useState([]);
  const [sliderValues, setSliderValues] = useState([]);
  const [timeFramesToUse, setTimeFramesToUse] = useState([]);
  const [computedDisplaySet, setComputedDisplaySet] = useState(null);
  const [myDynamicVolume, setMyDynamicVolume] = useState(null);
  const [myComputedVolume, setMyComputedVolume] = useState(null);
  const [uuidComputedVolume, setUuidComputedVolume] = useState(
    csUtils.uuidv4()
  );

  console.log(uuidComputedVolume);

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

  // Get toolGroupIds for setting PT color map
  const toolGroupIds = toolGroupService.getToolGroupIds();

  const volumeLoaderScheme = 'cornerstoneStreamingDynamicImageVolume'; // Loader id which defines which volume loader to use
  const computedVolumeId = `cornerstoneStreamingImageVolume:${uuidComputedVolume}`;

  //TODO: get referenceVolumeId from viewport
  const dynamicVolumeId = `${volumeLoaderScheme}:${displaySetInstanceUID}`;
  //TODO: get the referencedVolume using cache.getVolume(referencedVolumeId)
  const dynamicVolume = cache.getVolume(dynamicVolumeId);

  // console.log(timeOptions);
  let testDynamicVolume;

  // console.log(`rangeValues: ${rangeValues}`);

  useEffect(() => {
    // ~~ Subscription
    const added = cornerstoneViewportService.EVENTS.VIEWPORT_DATA_CHANGED;
    const subscriptions = [];

    [added].forEach(evt => {
      subscriptions.push(
        cornerstoneViewportService.subscribe(evt, evtdetails => {
          console.log('EVTDETAILS');
          console.log(evtdetails.viewportData.data);
          if (!Array.isArray(evtdetails.viewportData.data)) {
            return;
          }
          evtdetails.viewportData.data.forEach(volumeData => {
            if (volumeData.volumeId.split(':')[0] === volumeLoaderScheme) {
              if (testDynamicVolume === undefined) {
                testDynamicVolume = volumeData.volume;
                setMyDynamicVolume(volumeData.volume);
                const { metadata } = testDynamicVolume;
                console.log(metadata);
                const opp = numTimePointsToOptions(
                  testDynamicVolume._numTimePoints
                );
                const range = [1, testDynamicVolume._numTimePoints];
                console.log(range);
                setTimeOptions(prevArray => [...prevArray, ...opp]);
                setRangeValues(prevArray => [...prevArray, ...range]);
                setSliderValues(range);
                const computedVolumeInit = createComputedVolume(
                  testDynamicVolume.volumeId,
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
    console.log('onGenerateImage was run');
    const computedVolume = cache.getVolume(computedVolumeId);

    const dataInTime = cstUtils.dynamicVolume.generateImageFromTimeData(
      dynamicVolume,
      metadata.Operation,
      timeFramesToUse
    );

    const scalarData = computedVolume.getScalarData();
    for (let i = 0; i < dataInTime.length; i++) {
      scalarData[i] = dataInTime[i];
    }
    if (!computedDisplaySet) {
      const computedUuid = csUtils.uuidv4();
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
    }
    // renderGeneratedImage(dynamicVolumeId);
  }

  // if computedDisplaySet is defined, render when the data changes
  useEffect(() => {
    if (computedDisplaySet) {
      renderGeneratedImage(computedDisplaySet);
    }
  }, [computedDisplaySet]);

  function renderGeneratedImage(displaySet) {
    // console.log(viewports);
    console.log('renderGenerateImage was run');
    console.log(displaySet);
    // const test = cornerstoneViewportService;
    // const viewport1 = cornerstoneViewportService.getCornerstoneViewportByIndex(
    //   0
    // );
    // cornerstoneViewportService.set;
    commandsManager.runCommand('setVolumeToViewport', {
      displaySet,
    });
  }

  function returnTo4D() {
    renderGeneratedImage(testDynamicVolume.volumeId);
  }

  function callRender() {
    renderGeneratedImage(computedVolumeId);
  }

  if (!metadata.TimeFrames) {
    // console.log(dynamicVolume);
  }

  const handleChange = (leftVal, rightVal) => {
    console.log('Left value:', leftVal);
    console.log('Right value:', rightVal);
  };

  function handleSliderChange(newValues) {
    setSliderValues(newValues);
    const timeFrameValuesArray = Array.from(
      { length: newValues[1] - newValues[0] + 1 },
      (_, i) => i + newValues[0] - 1
    );
    setTimeFramesToUse(timeFrameValuesArray);
    console.log(`newValues: ${newValues}`);
  }

  console.log(`timeFramesToUse: ${timeFramesToUse}`);

  return (
    <div className="flex flex-col">
      <div className="flex flex-col p-4 space-y-4 bg-primary-dark">
        <div className="w-3">
          <InputDoubleRange
            labelClassName="text-black"
            maxValue={rangeValues[1] || 2}
            minValue={rangeValues[0] || 1}
            onSliderChange={handleSliderChange}
            onChange={handleChange}
            step={10}
            unit="%"
            valueLeft={rangeValues[0] || 1}
            valueRight={rangeValues[1] || 2}
          />
        </div>
        {/* <Input
          labelClassName="text-white mb-2"
          className="mt-1"
          value={metadata.TimeFrames || ''}
          onChange={e => {
            handleMetadataChange({
              TimeFrames: e.target.value,
            });
          }}
        /> */}
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
        {/* <Button color="primary" onClick={callRender}>
          Render Generated Image
        </Button> */}
        <Button color="primary" onClick={returnTo4D}>
          Return To 4D
        </Button>
        <div className="flex space-between">
          <Button
            onClick={() => {}}
            variant="contained"
            color="primary"
            border="primary"
            startIcon={<Icon name="icon-play" />}
            fullWidth={true}
          >
            Play
          </Button>
          <Button
            onClick={() => {}}
            variant="contained"
            color="primary"
            border="primary"
            startIcon={<Icon name="icon-pause" />}
            fullWidth={true}
          >
            Pause
          </Button>
        </div>
        {/* <Select
          label={t('TimeFrameOptions')}
          closeMenuOnSelect={false}
          className="mr-2 bg-black border-primary-main text-white "
          options={timeOptions}
          placeholder={timeOptions.length ? timeOptions[0].placeHolder : ''}
          value={timeOptions}
          isMulti={true}
          onChange={e => {
            handleMetadataChange({
              TimeFrames: e.target.value,
            });
          }}
        /> */}
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

async function getDynamicVolumeFromCache(dynamicVolumeId) {
  const dynamicVolumeFromCache = await cache.getVolume(dynamicVolumeId);
  return dynamicVolumeFromCache;
}

function numTimePointsToOptions(numTimePoints) {
  const options = [];
  for (let i = 0; i < numTimePoints; i++) {
    options.push({ value: `${i}`, label: `${i}`, placeHolder: `${i}` });
  }
  return options;
}

async function getTimeFrames(dynamicVolumeId) {}

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
