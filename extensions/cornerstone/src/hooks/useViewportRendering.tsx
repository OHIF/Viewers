import { useCallback, useState, useEffect, useRef } from 'react';
import { useSystem } from '@ohif/core';
import { useViewportDisplaySets } from './useViewportDisplaySets';
import { StackViewport, Types, VolumeViewport3D, utilities } from '@cornerstonejs/core';
import { WindowLevelPreset } from '../types/WindowLevel';
import { ColorbarPositionType, ColorbarOptions, ColorbarProperties } from '../types/Colorbar';
import { VolumeRenderingConfig } from '../types/VolumeRenderingConfig';
import { VolumeLightingParams } from '../types';
import { ButtonLocation } from '@ohif/core/src/services/ToolBarService/ToolbarService';

interface WindowLevelHook {
  // Viewport information
  is3DVolume: boolean;
  isViewportBackgroundLight: boolean;
  viewportDisplaySets: AppTypes.DisplaySet[] | undefined;
  voiRange: { lower: number; upper: number } | undefined;

  // Window level functions
  setWindowLevelPreset: (
    preset: { windowWidth: number; windowCenter: number },
    displaySetInstanceUID?: string
  ) => void;
  setVOIRange: (params: { lower: number; upper: number }, displaySetInstanceUID?: string) => void;
  setVOIWindowLevel: (
    params: {
      windowWidth: number;
      windowCenter: number;
    },
    displaySetInstanceUID?: string
  ) => void;
  windowLevelPresets: Array<Record<string, any>>;

  // Colorbar functions
  hasColorbar: boolean;
  toggleColorbar: (options?: Partial<ColorbarOptions>) => void;
  colorbarProperties: ColorbarProperties;
  colorbarPosition: ColorbarPositionType;
  setColorbarPosition: React.Dispatch<React.SetStateAction<ColorbarPositionType>>;

  // Colormap functions
  setColormap: (params: {
    colormap: any;
    displaySetInstanceUID: string;
    opacity?: number;
    immediate?: boolean;
  }) => void;
  getViewportColormap: (displaySetInstanceUID?: string) => any;

  // 3D volume rendering functions
  setVolumeRenderingPreset: (preset: any) => void;
  setVolumeRenderingQuality: (quality: number) => void;
  setVolumeLighting: (params: { ambient: number; diffuse: number; specular: number }) => void;
  setVolumeShading: (enabled: boolean) => void;
  volumeRenderingPresets: Array<any>;
  volumeRenderingQualityRange: { min: number; max: number; step: number };
}

const getPosition = (location: number): ColorbarPositionType => {
  switch (location) {
    case ButtonLocation.LeftMiddle:
      return 'left';
    case ButtonLocation.RightMiddle:
      return 'right';
    case ButtonLocation.BottomMiddle:
      return 'bottom';
    case ButtonLocation.TopMiddle:
      return 'top';
    default:
      return 'bottom'; // Default to bottom if location doesn't match a middle position
  }
};

/**
 * Hook to access window level functionality for a specific viewport
 *
 * @param viewportId - The ID of the viewport to get window level functionality for
 * @returns Window level API for the specified viewport
 */
export function useViewportRendering(
  viewportId?: string,
  options?: { location?: number; displaySetInstanceUID?: string }
): WindowLevelHook {
  const { servicesManager, commandsManager } = useSystem();
  const { cornerstoneViewportService, colorbarService, customizationService } =
    servicesManager.services;

  const [is3DVolume, setIs3DVolume] = useState(false);
  const [hasColorbar, setHasColorbar] = useState(colorbarService.hasColorbar(viewportId));
  const [colorbarPosition, setColorbarPosition] = useState<ColorbarPositionType>(
    options?.location ? getPosition(options.location) : 'bottom'
  );
  const [voiRange, setVoiRange] = useState<{ lower: number; upper: number } | undefined>();

  const { viewportDisplaySets } = useViewportDisplaySets(viewportId);

  const viewportInfo = viewportId ? cornerstoneViewportService.getViewportInfo(viewportId) : null;

  const { presets, colorbarProperties, volumeRenderingPresets, volumeRenderingQualityRange } =
    getCustomizationData(customizationService);

  const backgroundColor = viewportInfo?.getViewportOptions().background;
  const isViewportBackgroundLight = backgroundColor
    ? utilities.isEqual(backgroundColor, [1, 1, 1])
    : false;

  const windowLevelPresets =
    viewportDisplaySets
      ?.filter(displaySet => presets?.[displaySet.Modality as string])
      .map(displaySet => {
        return { [displaySet.Modality as string]: presets[displaySet.Modality as string] };
      }) || [];

  useEffect(() => {
    const viewport = cornerstoneViewportService.getCornerstoneViewport(viewportId);
    setIs3DVolume(viewport instanceof VolumeViewport3D);
  }, [cornerstoneViewportService, viewportId]);

  // useEffect(() => {
  //   if (!viewportId) {
  //     return;
  //   }

  //   const viewport = cornerstoneViewportService.getCornerstoneViewport(viewportId);
  //   if (!viewport) {
  //     return;
  //   }

  //   // Initialize VOI range state from current properties
  //   const updateVOIFromViewport = () => {
  //     if (viewport instanceof StackViewport) {
  //       const { voiRange: currentVoiRange } = viewport.getProperties();
  //       if (currentVoiRange) {
  //         setVoiRange(currentVoiRange);
  //       }
  //     } else if (viewport instanceof BaseVolumeViewport) {
  //       if (displaySets && displaySets.length > 0) {
  //         throw new Error('Volume viewports with display sets are not yet supported');
  //       }
  //     }
  //   };

  //   updateVOIFromViewport();

  //   const callback = evt => {
  //     const { viewportId: eventViewportId, voiRange: newVoiRange } = evt.detail;
  //     if (eventViewportId === viewportId && newVoiRange) {
  //       setVoiRange(newVoiRange);
  //     }
  //   };

  //   const element = viewport.element;
  //   if (element) {
  //     element.addEventListener(EVENTS.VOI_MODIFIED, callback);

  //     voiEventUnsubscribe.current = () => {
  //       element.removeEventListener(EVENTS.VOI_MODIFIED, callback);
  //     };
  //   }

  //   return () => {
  //     if (voiEventUnsubscribe.current) {
  //       voiEventUnsubscribe.current();
  //       voiEventUnsubscribe.current = null;
  //     }
  //   };
  // }, [viewportId, cornerstoneViewportService, displaySets]);

  useEffect(() => {
    if (!viewportId) {
      return;
    }

    const updateColorbarState = () => {
      const hasColorbarValue = colorbarService.hasColorbar(viewportId);
      setHasColorbar(hasColorbarValue);
    };

    updateColorbarState();

    const { unsubscribe } = colorbarService.subscribe(
      colorbarService.EVENTS.STATE_CHANGED,
      updateColorbarState
    );

    return () => {
      unsubscribe();
    };
  }, [colorbarService, viewportId]);

  const setWindowLevelPreset = useCallback(
    (preset: WindowLevelPreset, displaySetInstanceUID?: string) => {
      if (!viewportId) {
        return;
      }

      if (!displaySetInstanceUID && viewportDisplaySets.length > 1) {
        throw new Error(
          'You need to provide a displaySetInstanceUID when there are multiple display sets to setWindowLevelPreset'
        );
      }

      const displaySetInstanceUIDToUse =
        displaySetInstanceUID ?? viewportDisplaySets[0].displaySetInstanceUID;

      commandsManager.run({
        commandName: 'setViewportWindowLevel',
        commandOptions: {
          ...preset,
          viewportId,
          displaySetInstanceUID: displaySetInstanceUIDToUse,
        },
        context: 'CORNERSTONE',
      });
    },
    [commandsManager, viewportId, viewportDisplaySets]
  );

  const toggleColorbar = useCallback(
    (options?: Partial<ColorbarOptions>) => {
      if (!viewportId) {
        return;
      }

      if (viewportDisplaySets?.length === 0) {
        return;
      }

      if (!colorbarProperties) {
        return;
      }

      const {
        width: colorbarWidth,
        colorbarTickPosition,
        colorbarInitialColormap,
      } = colorbarProperties as ColorbarProperties;

      let appropriateTickPosition = colorbarTickPosition || 'top';

      if (colorbarPosition === 'left' || colorbarPosition === 'right') {
        appropriateTickPosition = colorbarPosition === 'left' ? 'right' : 'left';
      } else {
        appropriateTickPosition = colorbarPosition === 'top' ? 'bottom' : 'top';
      }

      const colorbarOptions = {
        viewportId,
        colormaps: colorbarProperties.colormaps || {},
        ticks: {
          position: appropriateTickPosition,
        },
        width: colorbarWidth,
        position: colorbarPosition,
        activeColormapName: colorbarInitialColormap || 'Grayscale',
        ...options,
      };

      // If light background, adjust tick style but keep the appropriate position
      if (isViewportBackgroundLight) {
        colorbarOptions.ticks = {
          position: appropriateTickPosition,
          style: {
            font: '13px Inter',
            color: '#000000',
            maxNumTicks: 8,
            tickSize: 5,
            tickWidth: 1,
            labelMargin: 3,
          },
        };
      }

      const displaySetInstanceUIDs = viewportDisplaySets.map(ds => ds.displaySetInstanceUID);

      try {
        commandsManager.run('toggleViewportColorbar', {
          viewportId,
          options: colorbarOptions,
          displaySetInstanceUIDs,
        });
      } catch (error) {
        console.error('Error toggling colorbar:', error);
      }
    },
    [
      commandsManager,
      viewportId,
      colorbarProperties,
      isViewportBackgroundLight,
      viewportDisplaySets,
      colorbarPosition,
    ]
  );

  const setColormap = useCallback(
    ({ colormap, displaySetInstanceUID, opacity = 1, immediate = false }) => {
      if (!viewportId) {
        return;
      }

      if (!displaySetInstanceUID && viewportDisplaySets.length > 1) {
        throw new Error(
          'You need to provide a displaySetInstanceUID when there are multiple display sets to setColormap'
        );
      }

      const displaySetInstanceUIDToUse =
        displaySetInstanceUID ?? viewportDisplaySets[0].displaySetInstanceUID;

      commandsManager.run({
        commandName: 'setViewportColormap',
        commandOptions: {
          viewportId,
          colormap,
          displaySetInstanceUID: displaySetInstanceUIDToUse,
          opacity,
          immediate,
        },
        context: 'CORNERSTONE',
      });
    },
    [commandsManager, viewportId, viewportDisplaySets]
  );

  const getViewportColormap = useCallback(
    (displaySetInstanceUID?: string) => {
      if (!displaySetInstanceUID && viewportDisplaySets.length > 1) {
        throw new Error(
          'You need to provide a displaySetInstanceUID when there are multiple display sets to getViewportColormap'
        );
      }

      if (!displaySetInstanceUID || !viewportId) {
        return null;
      }

      const displaySetInstanceUIDToUse =
        displaySetInstanceUID ?? viewportDisplaySets[0].displaySetInstanceUID;

      const viewport = cornerstoneViewportService.getCornerstoneViewport(viewportId);

      if (!viewport) {
        return null;
      }

      if (viewport instanceof StackViewport) {
        const { colormap } = viewport.getProperties();
        if (!colormap) {
          return (
            colorbarProperties?.colormaps?.find(c => c.Name === 'Grayscale') ||
            colorbarProperties?.colormaps?.[0]
          );
        }
        return colormap;
      }

      const actorEntries = viewport.getActors();
      const actorEntry = actorEntries?.find(entry =>
        entry.referencedId.includes(displaySetInstanceUIDToUse)
      );

      if (!actorEntry) {
        return (
          colorbarProperties?.colormaps?.find(c => c.Name === 'Grayscale') ||
          colorbarProperties?.colormaps?.[0]
        );
      }

      const { colormap } = (viewport as Types.IVolumeViewport).getProperties(
        actorEntry.referencedId
      );

      if (!colormap) {
        return (
          colorbarProperties?.colormaps?.find(c => c.Name === 'Grayscale') ||
          colorbarProperties?.colormaps?.[0]
        );
      }

      return colormap;
    },
    [cornerstoneViewportService, viewportId, viewportDisplaySets, colorbarProperties?.colormaps]
  );

  // 3D volume rendering functions
  const setVolumeRenderingPreset = useCallback(
    (preset: any) => {
      if (!viewportId) {
        return;
      }

      commandsManager.run({
        commandName: 'setVolumesPreset',
        commandOptions: {
          preset,
          viewportId,
          displaySetInstanceUID: displaySetInstanceUIDToUse,
        },
      });
    },
    [commandsManager, viewportId, viewportDisplaySets]
  );

  const setVolumeRenderingQuality = useCallback(
    (quality: number) => {
      if (!viewportId) {
        return;
      }

      commandsManager.run({
        commandName: 'setVolumeRenderingQuality',
        commandOptions: {
          quality,
          viewportId,
        },
      });
    },
    [commandsManager, viewportId]
  );

  const setVolumeLighting = useCallback(
    ({ ambient, diffuse, specular }: VolumeLightingParams) => {
      if (!viewportId) {
        return;
      }

      commandsManager.run({
        commandName: 'setVolumeLighting',
        commandOptions: {
          ambient,
          diffuse,
          specular,
          viewportId,
        },
      });
    },
    [commandsManager, viewportId]
  );

  const setVolumeShading = useCallback(
    (enabled: boolean) => {
      if (!viewportId) {
        return;
      }

      commandsManager.run({
        commandName: 'setVolumeShading',
        commandOptions: {
          enabled,
          viewportId,
        },
      });
    },
    [commandsManager, viewportId]
  );

  return {
    is3DVolume,
    isViewportBackgroundLight,

    // Window level functions
    setWindowLevelPreset,
    // setVOIRange,
    // setVOIWindowLevel,
    voiRange,

    // Colorbar functions
    hasColorbar,
    toggleColorbar,

    // Colormap functions
    setColormap,
    getViewportColormap,

    // 3D volume rendering functions
    setVolumeRenderingPreset,
    setVolumeRenderingQuality,
    setVolumeLighting,
    setVolumeShading,

    // Display sets
    viewportDisplaySets,

    // Colorbar properties
    colorbarProperties,
    colorbarPosition,
    setColorbarPosition,

    // Presets
    windowLevelPresets,
    volumeRenderingPresets,
    volumeRenderingQualityRange,
  };
}

export default useViewportRendering;

function getCustomizationData(customizationService) {
  const presets = customizationService.getCustomization('cornerstone.windowLevelPresets');
  const colorbarProperties = customizationService.getCustomization(
    'cornerstone.colorbar'
  ) as ColorbarProperties;

  const {
    volumeRenderingPresets = [],
    volumeRenderingQualityRange = { min: 0, max: 1, step: 0.1 },
  } =
    (customizationService.getCustomization(
      'cornerstone.3dVolumeRendering'
    ) as VolumeRenderingConfig) || {};

  return {
    presets,
    colorbarProperties,
    volumeRenderingPresets,
    volumeRenderingQualityRange,
  };
}
