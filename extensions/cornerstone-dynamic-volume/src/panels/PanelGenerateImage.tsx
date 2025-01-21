import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useCine } from '@ohif/ui';
import { useViewportGrid } from '@ohif/ui-next';
import { utilities as csUtils, volumeLoader, eventTarget, Enums, cache } from '@cornerstonejs/core';
import { utilities as cstUtils } from '@cornerstonejs/tools';
import DynamicVolumeControls from './DynamicVolumeControls';

const SOPClassHandlerId = '@ohif/extension-default.sopClassHandlerModule.stack';

export default function PanelGenerateImage({ servicesManager, commandsManager }: withAppTypes) {
  const { cornerstoneViewportService, viewportGridService, displaySetService } =
    servicesManager.services;

  const [frameRate, setFrameRate] = useState(20);
  const [{ isCineEnabled }, cineService] = useCine();
  const [{ activeViewportId, viewports }] = useViewportGrid();

  //
  const [timePointsRange, setTimePointsRange] = useState([0, 0]);
  const [timePointsRangeToUseForGenerate, setTimePointsRangeToUseForGenerate] = useState([0, 0]);
  const [computedDisplaySet, setComputedDisplaySet] = useState(null);
  const [dynamicVolume, setDynamicVolume] = useState(null);
  const [isPlaying, setIsPlaying] = useState(isCineEnabled);
  const [timePointRendered, setTimePointRendered] = useState(null);
  const [displayingComputed, setDisplayingComputed] = useState(false);

  //
  const uuidComputedVolume = useRef(csUtils.uuidv4());
  const uuidDynamicVolume = useRef(null);
  const computedVolumeId = `cornerstoneStreamingImageVolume:${uuidComputedVolume.current}`;

  const runThis = useCallback(() => {
    const displaySetUIDs = viewportGridService.getDisplaySetsUIDsForViewport(activeViewportId);

    if (!displaySetUIDs?.length) {
      return;
    }

    const displaySets = displaySetUIDs.map(displaySetService.getDisplaySetByUID);
    const dynamicVolumeDisplaySet = displaySets.find(displaySet => displaySet.isDynamicVolume);

    if (!dynamicVolumeDisplaySet) {
      setDisplayingComputed(true);
      return;
    }

    setDisplayingComputed(false);

    const dynamicVolume = cache
      .getVolumes()
      .find(volume => volume.volumeId.includes(dynamicVolumeDisplaySet.displaySetInstanceUID));

    if (!dynamicVolume) {
      return;
    }

    setDynamicVolume(dynamicVolume);
    uuidDynamicVolume.current = dynamicVolumeDisplaySet.displaySetInstanceUID;
    const newRange = [0, dynamicVolume.numTimePoints - 1];
    setTimePointsRange(newRange);
    setTimePointsRangeToUseForGenerate(newRange);
  }, [activeViewportId, viewportGridService, displaySetService]);

  useEffect(() => {
    const viewportDataChangedEvt = cornerstoneViewportService.EVENTS.VIEWPORT_DATA_CHANGED;
    const cineStateChangedEvt = servicesManager.services.cineService.EVENTS.CINE_STATE_CHANGED;

    const viewportDataChangedCallback = evtDetails => {
      evtDetails.viewportData.data.forEach(volumeData => {
        if (volumeData.volume?.isDynamicVolume()) {
          setDynamicVolume(volumeData.volume);
          uuidDynamicVolume.current = volumeData.displaySetInstanceUID;
          const newRange = [0, volumeData.volume.numTimePoints - 1];
          setTimePointsRange(newRange);
          setTimePointsRangeToUseForGenerate(newRange);
        }
      });
    };

    const cineStateChangedCallback = evt => {
      setIsPlaying(evt.isPlaying);
    };

    const { unsubscribe: unsubscribeViewportData } = cornerstoneViewportService.subscribe(
      viewportDataChangedEvt,
      viewportDataChangedCallback
    );
    const { unsubscribe: unsubscribeCineState } = servicesManager.services.cineService.subscribe(
      cineStateChangedEvt,
      cineStateChangedCallback
    );

    return () => {
      unsubscribeViewportData();
      unsubscribeCineState();
    };
  }, [cornerstoneViewportService, cineService, servicesManager.services.cineService]);

  useEffect(() => {
    const evt = Enums.Events.DYNAMIC_VOLUME_TIME_POINT_INDEX_CHANGED;

    const callback = evt => {
      setTimePointRendered(evt.detail.timePointIndex);
    };

    eventTarget.addEventListener(evt, callback);

    return () => {
      eventTarget.removeEventListener(evt, callback);
    };
  }, [cornerstoneViewportService]);

  useEffect(() => {
    runThis();
  }, [viewports, activeViewportId]);

  function renderGeneratedImage(displaySet) {
    commandsManager.runCommand('swapDynamicWithComputedDisplaySet', {
      displaySet,
    });
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
      computedVolume = await volumeLoader.createAndCacheDerivedVolume(dynamicVolumeId, {
        volumeId: computedVolumeId,
      });
    }
    const [start, end] = timePointsRangeToUseForGenerate;
    const frameNumbers = Array.from({ length: end - start + 1 }, (_, i) => i + start);

    const options = {
      frameNumbers: operationName === 'SUBTRACT' ? [start, end - 1] : frameNumbers,
      targetVolume: computedVolume,
    };

    cstUtils.dynamicVolume.updateVolumeFromTimeData(dynamicVolume, operationName, options);

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
        operationName: operationName,
        frameNumbers: frameNumbers,
        imageIds: computedVolume.imageIds,
      };
      setComputedDisplaySet(displaySet);
      renderGeneratedImage(displaySet);
    } else {
      commandsManager.runCommand('updateVolumeData', {
        volume: computedVolume,
      });
      cornerstoneViewportService.getRenderingEngine().render();
      renderGeneratedImage(computedDisplaySet);
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

  return (
    <DynamicVolumeControls
      // fps stuff
      fps={frameRate}
      minFps={1}
      maxFps={50}
      onFpsChange={handleSetFrameRate}
      // play/pause stuff
      isPlaying={isPlaying}
      onPlayPauseChange={onPlayPauseChange}
      // frame stuff
      framesLength={timePointsRange[1]}
      currentFrameIndex={timePointRendered}
      onFrameChange={timePointIndex => {
        dynamicVolume.timePointIndex = timePointIndex;
      }}
      //
      displayingComputed={displayingComputed}
      computedDisplaySet={computedDisplaySet}
      onGenerate={onGenerateImage}
      onComputedClick={computedDisplaySet ? () => renderGeneratedImage(computedDisplaySet) : null}
      onDynamicClick={displayingComputed ? () => renderDynamicImage(computedDisplaySet) : null}
      onDoubleRangeChange={handleSliderChange}
    />
  );
}
