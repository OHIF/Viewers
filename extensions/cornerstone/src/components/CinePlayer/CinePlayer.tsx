import React, { useCallback, useEffect, useState } from 'react';
import { CinePlayer, useCine, useViewportGrid } from '@ohif/ui';
import { Enums, eventTarget } from '@cornerstonejs/core';
import { useAppConfig } from '@state';

function WrappedCinePlayer({ enabledVPElement, viewportId, servicesManager }) {
  const {
    toolbarService,
    customizationService,
    displaySetService,
    viewportGridService,
    cineService,
  } = servicesManager.services;
  const [{ isCineEnabled, cines }] = useCine();
  const [newStackFrameRate, setNewStackFrameRate] = useState(24);
  const [appConfig] = useAppConfig();

  const { component: CinePlayerComponent = CinePlayer } =
    customizationService.get('cinePlayer') ?? {};

  const handleCineClose = () => {
    toolbarService.recordInteraction({
      groupId: 'MoreTools',
      interactionType: 'toggle',
      commands: [
        {
          commandName: 'toggleCine',
          commandOptions: {},
          toolName: 'cine',
          context: 'CORNERSTONE',
        },
      ],
    });
  };

  const cineHandler = () => {
    if (!cines || !cines[viewportId] || !enabledVPElement) {
      return;
    }

    const cine = cines[viewportId];
    const isPlaying = cine.isPlaying || false;
    const frameRate = cine.frameRate || 24;

    const validFrameRate = Math.max(frameRate, 1);

    if (isPlaying) {
      cineService.playClip(enabledVPElement, {
        framesPerSecond: validFrameRate,
      });
    } else {
      cineService.stopClip(enabledVPElement);
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
      cineService.setIsCineEnabled(isPlaying);
    }
    cineService.setCine({ id: viewportId, isPlaying, frameRate });
    setNewStackFrameRate(frameRate);
  }, [cineService, displaySetService, viewportId, viewportGridService, cines]);

  useEffect(() => {
    eventTarget.addEventListener(Enums.Events.STACK_VIEWPORT_NEW_STACK, newStackCineHandler);

    return () => {
      cineService.setCine({ id: viewportId, isPlaying: false });
      eventTarget.removeEventListener(Enums.Events.STACK_VIEWPORT_NEW_STACK, newStackCineHandler);
    };
  }, [enabledVPElement, newStackCineHandler]);

  useEffect(() => {
    if (!cines || !cines[viewportId] || !enabledVPElement) {
      return;
    }

    cineHandler();

    return () => {
      if (enabledVPElement && cines?.[viewportId]?.isPlaying) {
        cineService.stopClip(enabledVPElement);
      }
    };
  }, [cines, viewportId, cineService, enabledVPElement, cineHandler]);

  const cine = cines[viewportId];
  const isPlaying = (cine && cine.isPlaying) || false;

  return (
    isCineEnabled && (
      <CinePlayerComponent
        className="absolute left-1/2 bottom-3 -translate-x-1/2"
        frameRate={newStackFrameRate}
        isPlaying={isPlaying}
        onClose={handleCineClose}
        onPlayPauseChange={isPlaying =>
          cineService.setCine({
            id: viewportId,
            isPlaying,
          })
        }
        onFrameRateChange={frameRate =>
          cineService.setCine({
            id: viewportId,
            frameRate,
          })
        }
      />
    )
  );
}

export default WrappedCinePlayer;
