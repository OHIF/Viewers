import React, { useEffect } from 'react';
import { CinePlayer, useCine, useViewportGrid } from '@ohif/ui';
import { Enums, eventTarget } from '@cornerstonejs/core';

function WrappedCinePlayer({ enabledVPElement, viewportId, servicesManager }) {
  const { toolbarService, customizationService } = servicesManager.services;
  const [{ isCineEnabled, cines }, cineService] = useCine();
  const [{ activeViewportId }] = useViewportGrid();

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

  useEffect(() => {
    eventTarget.addEventListener(Enums.Events.STACK_VIEWPORT_NEW_STACK, cineHandler);

    return () => {
      cineService.setCine({ id: viewportId, isPlaying: false });
      eventTarget.removeEventListener(Enums.Events.STACK_VIEWPORT_NEW_STACK, cineHandler);
    };
  }, [enabledVPElement]);

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
        isPlaying={isPlaying}
        onClose={handleCineClose}
        onPlayPauseChange={isPlaying =>
          cineService.setCine({
            id: activeViewportId,
            isPlaying,
          })
        }
        onFrameRateChange={frameRate =>
          cineService.setCine({
            id: activeViewportId,
            frameRate,
          })
        }
      />
    )
  );
}

export default WrappedCinePlayer;
