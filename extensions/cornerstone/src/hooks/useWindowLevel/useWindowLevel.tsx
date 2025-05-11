import { useCallback, useState, useEffect } from 'react';
import { useSystem } from '@ohif/core';
import { useViewportDisplaySets } from '../useViewportDisplaySets';
import { StackViewport, Types, VolumeViewport3D, utilities } from '@cornerstonejs/core';
import { WindowLevelPreset } from '../../types/WindowLevel';
import { ColorbarPositionType, ColorbarOptions, ColorbarProperties } from '../../types/Colorbar';
import { VolumeRenderingConfig } from '../../types/VolumeRenderingConfig';

// Interface for the return value of the useWindowLevel hook
interface WindowLevelHook {
  // Viewport information
  is3DVolume: boolean;
  isViewportBackgroundLight: boolean;
  displaySets: AppTypes.DisplaySet[] | undefined;

  // Window level functions
  setWindowLevelPreset: (preset: WindowLevelPreset) => void;

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
  getViewportColormap: (displaySet: AppTypes.DisplaySet) => any;

  // 3D volume rendering functions
  setVolumeRenderingPreset: (preset: any) => void;
  setVolumeRenderingQuality: (quality: number) => void;
  setVolumeLighting: (params: { ambient: number; diffuse: number; specular: number }) => void;
  setVolumeShading: (enabled: boolean) => void;

  // Presets
  windowLevelPresets: Array<Record<string, any>>;
  volumeRenderingPresets: Array<any>;
  volumeRenderingQualityRange: { min: number; max: number; step: number };
}

/**
 * Hook to access window level functionality for a specific viewport
 *
 * @param viewportId - The ID of the viewport to get window level functionality for
 * @returns Window level API for the specified viewport
 */
export function useWindowLevel(viewportId?: string): WindowLevelHook {
  const { servicesManager, commandsManager } = useSystem();
  const { cornerstoneViewportService, colorbarService, customizationService } =
    servicesManager.services;

  const { viewportDisplaySets: displaySets } = useViewportDisplaySets(viewportId);

  const viewportInfo = viewportId ? cornerstoneViewportService.getViewportInfo(viewportId) : null;

  // Get customizations
  const presets = customizationService.getCustomization('cornerstone.windowLevelPresets') || {};
  const colorbarProperties =
    (customizationService.getCustomization('cornerstone.colorbar') as ColorbarProperties) || {};

  const {
    volumeRenderingPresets = [],
    volumeRenderingQualityRange = { min: 0, max: 1, step: 0.1 },
  } =
    (customizationService.getCustomization(
      'cornerstone.3dVolumeRendering'
    ) as VolumeRenderingConfig) || {};

  // State
  const [is3DVolume, setIs3DVolume] = useState(false);
  const [hasColorbar, setHasColorbar] = useState(colorbarService.hasColorbar(viewportId));
  const [colorbarPosition, setColorbarPosition] = useState<ColorbarPositionType>(
    colorbarProperties?.colorbarContainerPosition || 'bottom'
  );

  // Get background color for light/dark detection
  const backgroundColor = viewportInfo?.getViewportOptions().background;
  const isViewportBackgroundLight = backgroundColor
    ? utilities.isEqual(backgroundColor, [1, 1, 1])
    : false;

  // Calculate filtered presets
  const windowLevelPresets =
    displaySets
      ?.filter(displaySet => presets?.[displaySet.Modality as string])
      .map(displaySet => {
        return { [displaySet.Modality as string]: presets[displaySet.Modality as string] };
      }) || [];

  // Check if viewport is 3D
  useEffect(() => {
    const viewport = cornerstoneViewportService.getCornerstoneViewport(viewportId);
    setIs3DVolume(viewport instanceof VolumeViewport3D);
  }, [cornerstoneViewportService, viewportId, displaySets]);

  // Update colorbar state when it changes
  useEffect(() => {
    // Only subscribe if viewportId is valid
    if (!viewportId) {
      return;
    }

    const updateColorbarState = () => {
      const hasColorbarValue = colorbarService.hasColorbar(viewportId);
      setHasColorbar(hasColorbarValue);
    };

    // Initial state check
    updateColorbarState();

    const { unsubscribe } = colorbarService.subscribe(
      colorbarService.EVENTS.STATE_CHANGED,
      updateColorbarState
    );

    return () => {
      unsubscribe();
    };
  }, [colorbarService, viewportId]);

  // Window level functions
  const setWindowLevelPreset = useCallback(
    (preset: WindowLevelPreset) => {
      if (!viewportId) {
        return;
      }

      commandsManager.run({
        commandName: 'setViewportWindowLevel',
        commandOptions: {
          ...preset,
          viewportId,
        },
        context: 'CORNERSTONE',
      });
    },
    [commandsManager, viewportId]
  );

  // Colorbar functions
  const toggleColorbar = useCallback(
    (options?: Partial<ColorbarOptions>) => {
      // Ensure viewportId is defined
      if (!viewportId) {
        console.error('Cannot toggle colorbar: viewportId is undefined');
        return;
      }

      // Ensure we have display sets
      if (!displaySets || displaySets.length === 0) {
        console.warn('Cannot toggle colorbar: no display sets available for viewport', viewportId);
        return;
      }

      // Ensure we have colorbar properties
      if (!colorbarProperties) {
        console.error('Cannot toggle colorbar: colorbar properties not available');
        return;
      }

      const {
        width: colorbarWidth,
        colorbarTickPosition,
        colorbarInitialColormap,
      } = colorbarProperties as ColorbarProperties;

      const colorbarOptions = {
        viewportId,
        colormaps: colorbarProperties.colormaps || {},
        ticks: {
          position: colorbarTickPosition || 'top',
        },
        width: colorbarWidth,
        position: colorbarPosition || 'bottom',
        activeColormapName: colorbarInitialColormap || 'Grayscale',
        ...options,
      };

      // If light background, adjust tick style
      if (isViewportBackgroundLight) {
        colorbarOptions.ticks = {
          position: 'left',
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

      const displaySetInstanceUIDs = displaySets.map(ds => ds.displaySetInstanceUID);

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
      displaySets,
      colorbarPosition,
    ]
  );

  // Colormap functions
  interface SetColormapParams {
    colormap: any;
    displaySetInstanceUID: string;
    opacity?: number;
    immediate?: boolean;
  }

  const setColormap = useCallback(
    ({ colormap, displaySetInstanceUID, opacity = 1, immediate = false }: SetColormapParams) => {
      if (!viewportId) {
        return;
      }

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
    [commandsManager, viewportId]
  );

  const getViewportColormap = useCallback(
    (displaySet: AppTypes.DisplaySet) => {
      if (!displaySet) {
        return null;
      }

      const { displaySetInstanceUID } = displaySet;
      if (!viewportId) {
        return null;
      }

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
        entry.referencedId.includes(displaySetInstanceUID)
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
    [cornerstoneViewportService, viewportId, colorbarProperties?.colormaps]
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
        },
      });
    },
    [commandsManager, viewportId]
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

  interface VolumeLightingParams {
    ambient: number;
    diffuse: number;
    specular: number;
  }

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
    displaySets,

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

export default useWindowLevel;
