import React, { useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { useCine, useViewportGrid } from '@ohif/ui';
import { cache, utilities as csUtils, volumeLoader, eventTarget } from '@cornerstonejs/core';
import { Enums } from '@cornerstonejs/streaming-image-volume-loader';
import { utilities as cstUtils } from '@cornerstonejs/tools';
import DynamicVolumeControls from './DynamicVolumeControls';

const SOPClassHandlerId = '@ohif/extension-default.sopClassHandlerModule.stack';

export default function PanelGenerateImage({ servicesManager, commandsManager }: withAppTypes) {
  const { cornerstoneViewportService, viewportGridService, displaySetService } =
    servicesManager.services;

  const [{ isCineEnabled }, cineService] = useCine();
  const [{ activeViewportId }] = useViewportGrid();

  //
  const [timePointsRange, setTimePointsRange] = useState([]);
  const [timePointsRangeToUseForGenerate, setTimePointsRangeToUseForGenerate] = useState([]);
  const [computedDisplaySet, setComputedDisplaySet] = useState(null);
  const [dynamicVolume, setDynamicVolume] = useState(null);
  const [frameRate, setFrameRate] = useState(20);
  const [isPlaying, setIsPlaying] = useState(isCineEnabled);
  const [timePointRendered, setTimePointRendered] = useState(null);
  const [displayingComputed, setDisplayingComputed] = useState(false);

  //
  const uuidComputedVolume = useRef(csUtils.uuidv4());
  const uuidDynamicVolume = useRef(null);
  const computedVolumeId = `cornerstoneStreamingImageVolume:${uuidComputedVolume.current}`;

  useEffect(() => {
    const evt = cornerstoneViewportService.EVENTS.VIEWPORT_DATA_CHANGED;

    const { unsubscribe } = cornerstoneViewportService.subscribe(evt, evtDetails => {
      evtDetails.viewportData.data.forEach(volumeData => {
        if (volumeData.volume.isDynamicVolume()) {
          setDynamicVolume(volumeData.volume);
          uuidDynamicVolume.current = volumeData.displaySetInstanceUID;
          setTimePointsRange([1, volumeData.volume.numTimePoints]);
        }
      });
    });

    return () => {
      unsubscribe();
    };
  }, [cornerstoneViewportService]);

  useEffect(() => {
    const { unsubscribe } = servicesManager.services.cineService.subscribe(
      servicesManager.services.cineService.EVENTS.CINE_STATE_CHANGED,
      evt => {
        setIsPlaying(evt.isPlaying);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [cineService]);

  useEffect(() => {
    const displaySetUIDs = viewportGridService.getDisplaySetsUIDsForViewport(activeViewportId);

    if (!displaySetUIDs || displaySetUIDs.length === 0) {
      return;
    }

    const displaySets = displaySetUIDs.map(displaySetUID =>
      displaySetService.getDisplaySetByUID(displaySetUID)
    );

    const dynamicVolumeDisplaySet = displaySets.find(displaySet => displaySet.isDynamicVolume);

    if (!dynamicVolumeDisplaySet) {
      return;
    }

    const dynamicVolume = cache
      .getVolumes()
      .find(volume => volume.volumeId.includes(dynamicVolumeDisplaySet.displaySetInstanceUID));

    if (!dynamicVolume) {
      return;
    }

    setDynamicVolume(dynamicVolume);
    uuidDynamicVolume.current = dynamicVolumeDisplaySet.displaySetInstanceUID;
    setTimePointsRange([1, dynamicVolume.numTimePoints]);
  }, [activeViewportId, cornerstoneViewportService]);

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

    setDisplayingComputed(true);
  }

  function renderDynamicImage(displaySet) {
    commandsManager.runCommand('swapComputedWithDynamicDisplaySet');
  }

  // Get computed volume from cache, calculate the data across the time frames,
  // set the scalar data to the computedVolume, and create displaySet
  async function onGenerateImage(operationName) {
    const dynamicVolumeId = dynamicVolume.volumeId;

    if (!dynamicVolumeId) {
      return;
    }

    let computedVolume = cache.getVolume(computedVolumeId);

    if (!computedVolume) {
      await createComputedVolume(dynamicVolumeId, computedVolumeId);
      computedVolume = cache.getVolume(computedVolumeId);
    }

    const vals = timePointsRangeToUseForGenerate;

    const targets = Array.from({ length: vals[1] - vals[0] + 1 }, (_, i) => i + vals[0]);

    const dataInTime = cstUtils.dynamicVolume.generateImageFromTimeData(
      dynamicVolume,
      operationName,
      operationName === 'SUBTRACT' ? vals : targets
    );

    // Add loadStatus.loaded to computed volume and set to true
    computedVolume.loadStatus = {};
    computedVolume.loadStatus.loaded = true;
    // Set computed scalar data to volume
    const scalarData = computedVolume.getScalarData();
    scalarData.set(dataInTime);

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

  const onPlayPauseChange = isPlaying => {
    isPlaying ? handlePlay() : handleStop();
  };

  const handlePlay = () => {
    setIsPlaying(true);
    const viewportInfo = cornerstoneViewportService.getViewportInfo(activeViewportId);

    if (!viewportInfo) {
      return;
    }

    const { element } = viewportInfo;
    cineService.playClip(element, { framesPerSecond: frameRate, viewportId: activeViewportId });
  };

  const handleStop = () => {
    setIsPlaying(false);
    const { element } = cornerstoneViewportService.getViewportInfo(activeViewportId);
    cineService.stopClip(element);
  };

  const handleSetFrameRate = newFrameRate => {
    setFrameRate(newFrameRate);
    handleStop();
    handlePlay();
  };

  function handleSliderChange(newValues) {
    if (
      newValues[0] === timePointsRangeToUseForGenerate[0] &&
      newValues[1] === timePointsRangeToUseForGenerate[1]
    ) {
      return;
    }

    setTimePointsRangeToUseForGenerate(newValues);
  }

  if (!dynamicVolume || timePointsRange.length === 0) {
    return null;
  }

  return (
    <DynamicVolumeControls
      fps={frameRate}
      isPlaying={isPlaying}
      onPlayPauseChange={onPlayPauseChange}
      minFps={1}
      maxFps={50}
      currentFrameIndex={timePointRendered}
      onFpsChange={handleSetFrameRate}
      framesLength={timePointsRange[1]}
      onFrameChange={timePointIndex => {
        dynamicVolume.timePointIndex = timePointIndex;
      }}
      onGenerate={onGenerateImage}
      onDynamicClick={displayingComputed ? () => renderDynamicImage(computedDisplaySet) : null}
      onDoubleRangeChange={handleSliderChange}
    />
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
