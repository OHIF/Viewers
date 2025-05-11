import React, { createContext, ReactNode, useCallback, useEffect, useState } from 'react';
import { useSystem } from '@ohif/core';
import { StackViewport, Types, VolumeViewport3D, utilities } from '@cornerstonejs/core';
import { WindowLevelPreset } from '../../types/WindowLevel';
import { ColorbarProperties, ColorbarOptions, ColorbarPositionType } from '../../types/Colorbar';
import { ViewportPreset, VolumeRenderingQualityRange } from '../../types/ViewportPresets';
import { useViewportDisplaySets } from '../useViewportDisplaySets';

type WindowLevelContextType = {
  // Viewport info
  viewportId: string;
  is3DVolume: boolean;
  isLight: boolean;

  // Window level functions
  setWindowLevelPreset: (preset: WindowLevelPreset) => void;

  // Colorbar functions
  hasColorbar: boolean;
  toggleColorbar: (options?: Partial<ColorbarOptions>) => void;

  // Colormap functions
  setColormap: (options: {
    colormap: any;
    displaySetInstanceUID: string;
    opacity?: number;
    immediate?: boolean;
  }) => void;
  getViewportColormap: (displaySet: any) => any;

  // 3D volume rendering functions
  setVolumeRenderingPreset: (preset: ViewportPreset) => void;
  setVolumeRenderingQuality: (quality: number) => void;
  setVolumeLighting: (options: { ambient: number; diffuse: number; specular: number }) => void;
  setVolumeShading: (enabled: boolean) => void;

  // Active display set
  displaySets: Array<any>;
  activeDisplaySet: any;
  setActiveDisplaySet: (displaySet: any) => void;

  // Colorbar properties
  colorbarProperties: ColorbarProperties;
  colorbarPosition: ColorbarPositionType;
  setColorbarPosition: (position: ColorbarPositionType) => void;

  // Presets
  presets: Array<Record<string, Array<WindowLevelPreset>>>;
  volumeRenderingPresets: Array<ViewportPreset>;
  volumeRenderingQualityRange: VolumeRenderingQualityRange;
};

const WindowLevelContext = createContext<WindowLevelContextType | undefined>(undefined);

export type WindowLevelProviderProps = {
  children: ReactNode;
  viewportId: string;
  element?: HTMLElement;
};

export const WindowLevelProvider: React.FC<WindowLevelProviderProps> = ({
  children,
  viewportId,
  element,
}) => {
  const { servicesManager, commandsManager } = useSystem();
  const { cornerstoneViewportService, colorbarService, customizationService } =
    servicesManager.services;

  // Get viewport info
  const viewportInfo = cornerstoneViewportService.getViewportInfo(viewportId);
  const viewport = cornerstoneViewportService.getCornerstoneViewport(viewportId);

  // Get display sets using the hook
  const { viewportDisplaySets: displaySets } = useViewportDisplaySets(viewportId);

  // Get customizations
  const presets = customizationService.getCustomization('cornerstone.windowLevelPresets');
  const colorbarProperties = customizationService.getCustomization('cornerstone.colorbar');
  const { volumeRenderingPresets, volumeRenderingQualityRange } =
    customizationService.getCustomization('cornerstone.3dVolumeRendering');

  // State
  const [is3DVolume, setIs3DVolume] = useState(false);
  const [hasColorbar, setHasColorbar] = useState(colorbarService.hasColorbar(viewportId));
  const [activeDisplaySet, setActiveDisplaySet] = useState(displaySets[0]);
  const [colorbarPosition, setColorbarPosition] = useState<ColorbarPositionType>(
    colorbarProperties?.colorbarContainerPosition || 'bottom'
  );

  // Get background color for light/dark detection
  const backgroundColor = viewportInfo?.getViewportOptions().background;
  const isLight = backgroundColor ? utilities.isEqual(backgroundColor, [1, 1, 1]) : false;

  // Calculate filtered presets
  const displaySetPresets = displaySets
    .filter(displaySet => presets[displaySet.Modality])
    .map(displaySet => {
      return { [displaySet.Modality]: presets[displaySet.Modality] };
    });

  // Check if viewport is 3D
  useEffect(() => {
    const viewport = cornerstoneViewportService.getCornerstoneViewport(viewportId);
    setIs3DVolume(viewport instanceof VolumeViewport3D);
  }, [cornerstoneViewportService, viewportId, displaySets]);

  // Update colorbar state when it changes
  useEffect(() => {
    const updateColorbarState = () => {
      setHasColorbar(colorbarService.hasColorbar(viewportId));
    };

    const { unsubscribe } = colorbarService.subscribe(
      colorbarService.EVENTS.STATE_CHANGED,
      updateColorbarState
    );

    return () => {
      unsubscribe();
    };
  }, [colorbarService, viewportId]);

  // Set default active display set
  useEffect(() => {
    if (displaySets.length > 0) {
      setActiveDisplaySet(displaySets[0]);
    }
  }, [displaySets]);

  // Window level functions
  const setWindowLevelPreset = useCallback(
    (preset: WindowLevelPreset) => {
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
      const {
        width: colorbarWidth,
        colorbarTickPosition,
        colorbarContainerPosition,
        colormaps,
        colorbarInitialColormap,
      } = colorbarProperties;

      const colorbarOptions = {
        viewportId,
        colormaps,
        ticks: {
          position: colorbarTickPosition,
        },
        width: colorbarWidth,
        position: colorbarPosition,
        activeColormapName: colorbarInitialColormap,
        ...options,
      };

      // If light background, adjust tick style
      if (isLight) {
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

      commandsManager.run('toggleViewportColorbar', {
        viewportId,
        options: colorbarOptions,
        displaySetInstanceUIDs,
      });
    },
    [commandsManager, viewportId, colorbarProperties, isLight, displaySets, colorbarPosition]
  );

  // Colormap functions
  const setColormap = useCallback(
    ({ colormap, displaySetInstanceUID, opacity = 1, immediate = false }) => {
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
    displaySet => {
      const { displaySetInstanceUID } = displaySet;
      const viewport = cornerstoneViewportService.getCornerstoneViewport(viewportId);

      if (viewport instanceof StackViewport) {
        const { colormap } = viewport.getProperties();
        if (!colormap) {
          return (
            colorbarProperties.colormaps.find(c => c.Name === 'Grayscale') ||
            colorbarProperties.colormaps[0]
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
          colorbarProperties.colormaps.find(c => c.Name === 'Grayscale') ||
          colorbarProperties.colormaps[0]
        );
      }

      const { colormap } = (viewport as Types.IVolumeViewport).getProperties(
        actorEntry.referencedId
      );

      if (!colormap) {
        return (
          colorbarProperties.colormaps.find(c => c.Name === 'Grayscale') ||
          colorbarProperties.colormaps[0]
        );
      }

      return colormap;
    },
    [cornerstoneViewportService, viewportId, colorbarProperties.colormaps]
  );

  // 3D volume rendering functions
  const setVolumeRenderingPreset = useCallback(
    (preset: ViewportPreset) => {
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
    ({ ambient, diffuse, specular }) => {
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

  const value = {
    // Viewport info
    viewportId,
    is3DVolume,
    isLight,

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

    // Active display set
    displaySets,
    activeDisplaySet,
    setActiveDisplaySet,

    // Colorbar properties
    colorbarProperties,
    colorbarPosition,
    setColorbarPosition,

    // Presets
    presets: displaySetPresets,
    volumeRenderingPresets,
    volumeRenderingQualityRange,
  };

  return <WindowLevelContext.Provider value={value}>{children}</WindowLevelContext.Provider>;
};

export default WindowLevelContext;
