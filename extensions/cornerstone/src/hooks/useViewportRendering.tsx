import { useCallback, useState, useEffect, useMemo } from 'react';
import { useSystem } from '@ohif/core';
import { useViewportDisplaySets } from './useViewportDisplaySets';
import { StackViewport, Types, VolumeViewport3D, utilities } from '@cornerstonejs/core';
import { WindowLevelPreset } from '../types/WindowLevel';
import { ColorbarPositionType, ColorbarOptions, ColorbarProperties } from '../types/Colorbar';
import { VolumeRenderingConfig } from '../types/VolumeRenderingConfig';
import { VolumeLightingParams } from '../types';
import { ButtonLocation } from '@ohif/core/src/services/ToolBarService/ToolbarService';

interface ViewportRenderingOptions {
  location?: number;
  displaySetInstanceUID?: string;
}

interface WindowLevelHook {
  // Viewport information
  is3DVolume: boolean;
  isViewportBackgroundLight: boolean;
  viewportDisplaySets: AppTypes.DisplaySet[] | undefined;
  voiRange: { lower: number; upper: number } | undefined;

  // Window level functions
  setWindowLevel: (preset: {
    windowWidth: number;
    windowCenter: number;
    immediate?: boolean;
  }) => void;
  setVOIRange: (params: { lower: number; upper: number }) => void;
  windowLevelPresets: WindowLevelPreset[];
  allWindowLevelPresets: Array<{
    displaySetInstanceUID: string;
    modality: string;
    presets: WindowLevelPreset[];
  }>;

  // Colorbar functions
  hasColorbar: boolean;
  toggleColorbar: (options?: Partial<ColorbarOptions>) => void;
  colorbarProperties: ColorbarProperties;
  colorbarPosition: ColorbarPositionType;
  setColorbarPosition: React.Dispatch<React.SetStateAction<ColorbarPositionType>>;

  // Colormap functions
  setColormap: (params: { colormap: any; opacity?: number; immediate?: boolean }) => void;
  colormap: any;

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
 * @param options - Options for the hook, including location and displaySetInstanceUID
 * @returns Window level API for the specified viewport
 */
export function useViewportRendering(
  viewportId?: string,
  options?: ViewportRenderingOptions
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

  // Determine the active display set instance UID (internal only, not exposed)
  const activeDisplaySetInstanceUID = useMemo(() => {
    if (options?.displaySetInstanceUID) {
      return options.displaySetInstanceUID;
    }

    if (viewportDisplaySets && viewportDisplaySets.length > 0) {
      return viewportDisplaySets[0].displaySetInstanceUID;
    }

    return undefined;
  }, [options?.displaySetInstanceUID, viewportDisplaySets]);

  const viewportInfo = viewportId ? cornerstoneViewportService.getViewportInfo(viewportId) : null;

  const { presets, colorbarProperties, volumeRenderingPresets, volumeRenderingQualityRange } =
    getCustomizationData(customizationService);

  const backgroundColor = viewportInfo?.getViewportOptions().background;
  const isViewportBackgroundLight = backgroundColor
    ? utilities.isEqual(backgroundColor, [1, 1, 1])
    : false;

  // Get all window level presets for all display sets in the viewport
  const allWindowLevelPresets =
    viewportDisplaySets
      ?.filter(displaySet => presets?.[displaySet.Modality as string])
      .map(displaySet => {
        return {
          displaySetInstanceUID: displaySet.displaySetInstanceUID,
          modality: displaySet.Modality as string,
          presets: presets[displaySet.Modality as string],
        };
      }) || [];

  // Get the presets specifically for the active display set
  const activeDisplaySetPresets = useMemo(() => {
    if (!activeDisplaySetInstanceUID || allWindowLevelPresets.length === 0) {
      return [];
    }

    const activePresetData = allWindowLevelPresets.find(
      preset => preset.displaySetInstanceUID === activeDisplaySetInstanceUID
    );

    if (!activePresetData) {
      return [];
    }

    return activePresetData.presets;
  }, [allWindowLevelPresets, activeDisplaySetInstanceUID]);

  useEffect(() => {
    const viewport = cornerstoneViewportService.getCornerstoneViewport(viewportId);
    setIs3DVolume(viewport instanceof VolumeViewport3D);
  }, [cornerstoneViewportService, viewportId]);

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

  // Validate the active display set exists in the viewport
  const validateActiveDisplaySet = useCallback(() => {
    if (!activeDisplaySetInstanceUID) {
      throw new Error('No active display set instance UID is available');
    }

    if (viewportDisplaySets?.length === 0) {
      throw new Error('No display sets are available for this viewport');
    }

    // Verify the active display set is in the viewport
    const isDisplaySetInViewport = viewportDisplaySets?.some(
      ds => ds.displaySetInstanceUID === activeDisplaySetInstanceUID
    );

    if (!isDisplaySetInViewport) {
      throw new Error(
        `Display set with UID ${activeDisplaySetInstanceUID} is not present in the viewport`
      );
    }

    return activeDisplaySetInstanceUID;
  }, [activeDisplaySetInstanceUID, viewportDisplaySets]);

  const setWindowLevel = useCallback(
    (preset: { windowWidth: number; windowCenter: number; immediate?: boolean }) => {
      if (!viewportId) {
        return;
      }

      const displaySetInstanceUID = validateActiveDisplaySet();

      commandsManager.run({
        commandName: 'setViewportWindowLevel',
        commandOptions: {
          ...preset,
          viewportId,
          displaySetInstanceUID,
        },
        context: 'CORNERSTONE',
      });
    },
    [commandsManager, viewportId, validateActiveDisplaySet]
  );

  const setVOIRange = useCallback(
    (params: { lower: number; upper: number }) => {
      if (!viewportId) {
        return;
      }

      const windowLevel = utilities.windowLevel.toWindowLevel(params.lower, params.upper);

      setWindowLevel(windowLevel);
    },
    [viewportId, setWindowLevel]
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
    ({ colormap, opacity = 1, immediate = false }) => {
      if (!viewportId) {
        return;
      }

      const displaySetInstanceUID = validateActiveDisplaySet();

      commandsManager.run({
        commandName: 'setViewportColormap',
        commandOptions: {
          viewportId,
          colormap,
          displaySetInstanceUID,
          opacity,
          immediate,
        },
        context: 'CORNERSTONE',
      });
    },
    [commandsManager, viewportId, validateActiveDisplaySet]
  );

  // Get the current colormap for the active display set
  const colormap = useMemo(() => {
    if (!viewportId || !activeDisplaySetInstanceUID || !viewportDisplaySets?.length) {
      return null;
    }

    try {
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
        entry.referencedId.includes(activeDisplaySetInstanceUID)
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
    } catch (error) {
      console.error('Error getting viewport colormap:', error);
      return (
        colorbarProperties?.colormaps?.find(c => c.Name === 'Grayscale') ||
        colorbarProperties?.colormaps?.[0]
      );
    }
  }, [
    cornerstoneViewportService,
    viewportId,
    activeDisplaySetInstanceUID,
    viewportDisplaySets,
    colorbarProperties?.colormaps,
  ]);

  // 3D volume rendering functions
  const setVolumeRenderingPreset = useCallback(
    (preset: any) => {
      if (!viewportId) {
        return;
      }

      const displaySetInstanceUID = validateActiveDisplaySet();

      commandsManager.run({
        commandName: 'setVolumesPreset',
        commandOptions: {
          preset,
          viewportId,
          displaySetInstanceUID,
        },
      });
    },
    [commandsManager, viewportId, validateActiveDisplaySet]
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
    setWindowLevel,
    setVOIRange,
    voiRange,

    // Colorbar functions
    hasColorbar,
    toggleColorbar,

    // Colormap functions
    setColormap,
    colormap,

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
    windowLevelPresets: activeDisplaySetPresets,
    allWindowLevelPresets,
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
