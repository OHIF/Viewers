import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CinePlayer, useCine } from '@ohif/ui';
import { Enums, eventTarget } from '@cornerstonejs/core';
import { useAppConfig } from '@state';

function WrappedCinePlayer({ enabledVPElement, viewportId, servicesManager }) {
  const { customizationService, displaySetService, viewportGridService } = servicesManager.services;
  const [{ isCineEnabled, cines }, api] = useCine();
  const [newStackFrameRate, setNewStackFrameRate] = useState(24);
  const [appConfig] = useAppConfig();
  const isMountedRef = useRef(null);

  const { component: CinePlayerComponent = CinePlayer } =
    customizationService.get('cinePlayer') ?? {};

  const cineHandler = () => {
    if (!cines || !cines[viewportId] || !enabledVPElement) {
      return;
    }

    const cine = cines[viewportId];
    const isPlaying = cine.isPlaying || false;
    const frameRate = cine.frameRate || 24;

    const validFrameRate = Math.max(frameRate, 1);

    if (isPlaying) {
      api.playClip(enabledVPElement, {
        framesPerSecond: validFrameRate,
      });
    } else {
      api.stopClip(enabledVPElement);
    }
  };

  const newStackCineHandler = useCallback(() => {
    const { viewports } = viewportGridService.getState();
    const { displaySetInstanceUIDs } = viewports.get(viewportId);

    let frameRate = 24;
    let isPlaying = cines[viewportId].isPlaying;
    displaySetInstanceUIDs.forEach(displaySetInstanceUID => {
      const displaySet = displaySetService.getDisplaySetByUID(displaySetInstanceUID);
      if (displaySet.FrameRate) {
        // displaySet.FrameRate corresponds to DICOM tag (0018,1063) which is defined as the the frame time in milliseconds
        // So a bit of math to get the actual frame rate.
        frameRate = Math.round(1000 / displaySet.FrameRate);
        isPlaying ||= !!appConfig.autoPlayCine;
      }
    });

    if (isPlaying) {
      api.setIsCineEnabled(isPlaying);
    }
    api.setCine({ id: viewportId, isPlaying, frameRate });
    setNewStackFrameRate(frameRate);
  }, [displaySetService, viewportId, viewportGridService, cines]);

  useEffect(() => {
    isMountedRef.current = true;

    eventTarget.addEventListener(Enums.Events.STACK_VIEWPORT_NEW_STACK, newStackCineHandler);

    return () => {
      isMountedRef.current = false;
      api.stopClip(enabledVPElement);
      api.setCine({ id: viewportId, isPlaying: false });
      eventTarget.removeEventListener(Enums.Events.STACK_VIEWPORT_NEW_STACK, newStackCineHandler);
    };
  }, [enabledVPElement, newStackCineHandler]);

  useEffect(() => {
    if (!cines || !cines[viewportId] || !enabledVPElement || !isMountedRef.current) {
      return;
    }

    cineHandler();

    return () => {
      api.stopClip(enabledVPElement);
    };
  }, [cines, viewportId, enabledVPElement, cineHandler]);

  const cine = cines[viewportId];
  const isPlaying = (cine && cine.isPlaying) || false;

  return (
    isCineEnabled && (
      <CinePlayerComponent
        className="absolute left-1/2 bottom-3 -translate-x-1/2"
        frameRate={newStackFrameRate}
        isPlaying={isPlaying}
        onClose={() => {
          // also stop the clip
          api.setCine({
            id: viewportId,
            isPlaying: false,
          });
          api.setIsCineEnabled(false);
        }}
        onPlayPauseChange={isPlaying => {
          api.setCine({
            id: viewportId,
            isPlaying,
          });
        }}
        onFrameRateChange={frameRate =>
          api.setCine({
            id: viewportId,
            frameRate,
          })
        }
      />
    )
  );
}

export default WrappedCinePlayer;
