import React, { useEffect } from 'react';
import { CinePlayer, useCine, useViewportGrid } from '@ohif/ui';
import { Enums, eventTarget } from '@cornerstonejs/core';

function WrappedCinePlayer({
  enabledVPElement,
  viewportIndex,
  servicesManager,
}) {
  const { toolbarService, customizationService } = servicesManager.services;
  const [{ isCineEnabled, cines }, cineService] = useCine();
  const [{ activeViewportIndex }] = useViewportGrid();

  const { component: CinePlayerComponent = CinePlayer } =
    customizationService.get('cinePlayer') ?? {};

  const handleCineClose = () => {
    toolbarService.recordInteraction({
      groupId: 'MoreTools',
      itemId: 'cine',
      interactionType: 'toggle',
      commands: [
        {
          commandName: 'toggleCine',
          commandOptions: {},
          context: 'CORNERSTONE',
        },
      ],
    });
  };

  const cineHandler = () => {
    if (!cines || !cines[viewportIndex] || !enabledVPElement) {
      return;
    }

    const cine = cines[viewportIndex];
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
    eventTarget.addEventListener(
      Enums.Events.STACK_VIEWPORT_NEW_STACK,
      cineHandler
    );

    return () => {
      cineService.setCine({ id: viewportIndex, isPlaying: false });
      eventTarget.removeEventListener(
        Enums.Events.STACK_VIEWPORT_NEW_STACK,
        cineHandler
      );
    };
  }, [enabledVPElement]);

  useEffect(() => {
    if (!cines || !cines[viewportIndex] || !enabledVPElement) {
      return;
    }

    cineHandler();

    return () => {
      if (enabledVPElement && cines?.[viewportIndex]?.isPlaying) {
        cineService.stopClip(enabledVPElement);
      }
    };
  }, [cines, viewportIndex, cineService, enabledVPElement, cineHandler]);

  const cine = cines[viewportIndex];
  const isPlaying = (cine && cine.isPlaying) || false;

  return (
    isCineEnabled && (
      <CinePlayerComponent
        className="absolute left-1/2 -translate-x-1/2 bottom-3"
        isPlaying={isPlaying}
        onClose={handleCineClose}
        onPlayPauseChange={isPlaying =>
          cineService.setCine({
            id: activeViewportIndex,
            isPlaying,
          })
        }
        onFrameRateChange={frameRate =>
          cineService.setCine({
            id: activeViewportIndex,
            frameRate,
          })
        }
      />
    )
  );
}

export default WrappedCinePlayer;
