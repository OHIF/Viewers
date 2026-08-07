import React, { useCallback, useState, useEffect, useMemo } from 'react';
import { useSystem } from '@ohif/core';
import { useViewportDisplaySets } from './useViewportDisplaySets';
import { useViewportState } from './useViewportState';
import { Types, utilities } from '@cornerstonejs/core';
import { isVolume3DViewportType } from '../utils/getLegacyViewportType';
import { getViewportAdapter, LEGACY_OPACITY_GAMMA } from '../services/ViewportService/adapter';
import { WindowLevelPreset } from '../types/WindowLevel';
import { ColorbarPositionType, ColorbarOptions, ColorbarProperties } from '../types/Colorbar';
import { VolumeRenderingConfig } from '../types/VolumeRenderingConfig';
import { VolumeLightingParams } from '../types';
import { ButtonLocation } from '@ohif/core/src/services/ToolBarService/ToolbarService';

interface ViewportRenderingOptions {
  location?: number;
  displaySetInstanceUID?: string;
}

interface PixelValueRange {
  min: number;
  max: number;
}

interface WindowLevelHook {
  // Viewport information
  is3DVolume: boolean;
  isViewportBackgroundLight: boolean;
  viewportDisplaySets: AppTypes.DisplaySet[] | undefined;
  voiRange: { lower: number; upper: number } | undefined;
  windowLevel: { windowWidth: number; windowCenter: number } | undefined;

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

  // Opacity functions
  opacity: number | undefined;
  setOpacity: (opacity: number) => void;
  opacityLinear: number | undefined;
  setOpacityLinear: (opacityLinear: number) => void;

  // Threshold functions
  threshold: number | undefined;
  setThreshold: (threshold: number) => void;
  pixelValueRange: PixelValueRange;

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
 * Normalizes a colormap opacity value to a single 0..1 scalar for the opacity
 * slider. `colormap.opacity` may be a plain number or an array of
 * `{ value, opacity }` points (e.g. the HP fusion opacity ramp); for the array
 * case we represent it by its maximum opacity. (A prior reduce ran over the point
 * objects directly, producing NaN and a mispositioned slider.)
 */
const resolveOpacityScalar = (opacityVal: unknown): number | undefined => {
  if (opacityVal === undefined || opacityVal === null) {
    return undefined;
  }

  if (Array.isArray(opacityVal)) {
    return opacityVal.reduce((max: number, point) => {
      const value = typeof point === 'number' ? point : (point?.opacity ?? 0);
      return Math.max(max, value);
    }, 0);
  }

  return opacityVal as number;
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

  const [hasColorbar, setHasColorbar] = useState(colorbarService.hasColorbar(viewportId));
  const [colorbarPosition, setColorbarPosition] = useState<ColorbarPositionType>(
    options?.location ? getPosition(options.location) : 'bottom'
  );
  const [voiRange, setVoiRange] = useState<{ lower: number; upper: number } | undefined>();
  const voiRangeRef = React.useRef<{ lower: number; upper: number } | undefined>();
  // Viewport from service; kept in state so effects re-run when it becomes available
  const [viewport, setViewport] = useState<Types.IViewport | null>(() =>
    viewportId ? (cornerstoneViewportService.getCornerstoneViewport(viewportId) ?? null) : null
  );
  const [is3DVolume, setIs3DVolume] = useState(isVolume3DViewportType(viewport));
  // Runtime-channel phase (plan section 4.7); transitions on mount/render/rebind
  // and drives the getCornerstoneViewport reads below.
  const runtimePhase = useViewportState(viewportId ?? '', snapshot => snapshot.phase);

  // The opacity slider gamma follows the rendering path (linear on native,
  // the historical 1/5 curve on legacy), so the slider feel and its initial
  // position match what is rendered.
  const opacityGamma = viewport
    ? getViewportAdapter(viewport).getOpacityGamma()
    : LEGACY_OPACITY_GAMMA;
  const linearToOpacity = useCallback(
    (linearValue: number): number => Math.pow(linearValue, opacityGamma),
    [opacityGamma]
  );
  const opacityToLinear = useCallback(
    (opacityValue: number): number => Math.pow(opacityValue, 1.0 / opacityGamma),
    [opacityGamma]
  );

  const [opacity, setOpacityState] = useState<number | undefined>();
  const [opacityLinear, setOpacityLinearState] = useState<number | undefined>();
  const [threshold, setThresholdState] = useState<number | undefined>();
  const [pixelValueRange, setPixelValueRange] = useState<PixelValueRange>({ min: 0, max: 255 });

  const { viewportDisplaySets, foregroundDisplaySets } = useViewportDisplaySets(viewportId);
  const { displaySetService } = servicesManager.services;

  // Determine the active display set instance UID (internal only, not exposed)
  const activeDisplaySetInstanceUID = useMemo(() => {
    if (options?.displaySetInstanceUID) {
      return options.displaySetInstanceUID;
    }

    // Window-level / colormap / threshold controls operate on the foreground
    // layer (e.g. the PT in a PET/CT fusion), not the grayscale background (CT).
    // Use the topmost foreground display set when present; otherwise fall back to
    // the (single) primary display set. SEG/derived overlays are already excluded
    // from foregroundDisplaySets.
    if (foregroundDisplaySets && foregroundDisplaySets.length > 0) {
      return foregroundDisplaySets[foregroundDisplaySets.length - 1].displaySetInstanceUID;
    }

    if (viewportDisplaySets && viewportDisplaySets.length > 0) {
      return viewportDisplaySets[0].displaySetInstanceUID;
    }

    return undefined;
  }, [options?.displaySetInstanceUID, viewportDisplaySets, foregroundDisplaySets]);

  const viewportInfo = viewportId ? cornerstoneViewportService.getViewportInfo(viewportId) : null;

  const { presets, colorbarProperties, volumeRenderingPresets, volumeRenderingQualityRange } =
    getCustomizationData(customizationService);

  const backgroundColor = viewportInfo?.getViewportOptions().background;
  const isViewportBackgroundLight = backgroundColor
    ? utilities.isEqual(backgroundColor, [1, 1, 1])
    : false;

  const allWindowLevelPresets = useMemo(() => {
    return (
      viewportDisplaySets
        ?.filter(displaySet => presets?.[displaySet.Modality as string])
        .map(displaySet => {
          return {
            displaySetInstanceUID: displaySet.displaySetInstanceUID,
            modality: displaySet.Modality as string,
            presets: presets[displaySet.Modality as string],
          };
        }) || []
    );
  }, [viewportDisplaySets, presets]);

  // Reset the viewport when the target viewport changes.
  useEffect(() => {
    setViewport(
      viewportId ? (cornerstoneViewportService.getCornerstoneViewport(viewportId) ?? null) : null
    );
  }, [viewportId, cornerstoneViewportService]);

  // Runtime-channel phase changes replace the VIEWPORT_DATA_CHANGED
  // subscription: the channel binds (and its phase moves) right before that
  // event broadcasts, so re-reading here picks up the viewport once mounted.
  useEffect(() => {
    if (!viewportId) {
      return;
    }
    const next = cornerstoneViewportService.getCornerstoneViewport(viewportId);
    if (next) {
      setViewport(next);
    }
  }, [viewportId, cornerstoneViewportService, runtimePhase]);

  // Calculate pixel value range for the active display set
  useEffect(() => {
    if (!activeDisplaySetInstanceUID) {
      return;
    }

    const selectedDisplaySet = displaySetService.getDisplaySetByUID(activeDisplaySetInstanceUID);
    if (!selectedDisplaySet?.imageIds?.length) {
      return;
    }

    if (!viewport) {
      return;
    }

    const voxelManager = getViewportAdapter(viewport).getVoxelManagerForDisplaySet(
      activeDisplaySetInstanceUID
    );

    if (!voxelManager?.getRange) {
      return;
    }

    const range = voxelManager.getRange();

    setPixelValueRange({ min: range[0], max: range[1] });
  }, [activeDisplaySetInstanceUID, displaySetService, viewport]);

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

  // Seed VOI/opacity/threshold from the viewport and keep them current over
  // the runtime channel: the channel already bumps on VOI_MODIFIED and
  // COLORMAP_MODIFIED (among other events), so a value-guarded re-read replaces
  // the previous raw element listeners. The per-display-set read stays on the
  // adapter because the channel snapshot's presentation is the active binding,
  // not the foreground layer this hook targets.
  useEffect(() => {
    setIs3DVolume(isVolume3DViewportType(viewport));

    if (!viewportId || !viewport || !activeDisplaySetInstanceUID) {
      return;
    }

    const syncPresentationState = () => {
      try {
        const adapter = getViewportAdapter(viewport);
        const dataId = adapter.getDataIdForDisplaySet(activeDisplaySetInstanceUID);
        const properties = adapter.getPresentation(dataId ?? activeDisplaySetInstanceUID);

        if (!properties) {
          return;
        }

        // Native ("next") viewports store only explicit VOI overrides in the
        // per-display-set presentation; a freshly shown series has none, so fall
        // back to its computed default VOI (undefined on legacy, whose
        // getProperties always returns the applied VOI). Without this, changing
        // the series left the overlay showing the previous series' window level.
        const nextVoiRange =
          properties.voiRange ?? adapter.getDefaultVOIRange(dataId ?? activeDisplaySetInstanceUID);

        if (
          nextVoiRange &&
          (!voiRangeRef.current || !areVoiRangesClose(voiRangeRef.current, nextVoiRange))
        ) {
          voiRangeRef.current = nextVoiRange;
          setVoiRange(nextVoiRange);
        }

        if (properties.colormap?.opacity !== undefined) {
          const opacity = resolveOpacityScalar(properties.colormap.opacity);
          if (opacity !== undefined) {
            setOpacityState(opacity);
            setOpacityLinearState(opacityToLinear(opacity));
          }
        }

        if (properties.colormap?.threshold !== undefined) {
          setThresholdState(properties.colormap.threshold);
        }
      } catch (error) {
        console.error('Error initializing VOI range:', error);
      }
    };

    syncPresentationState();

    const unsubscribe = cornerstoneViewportService.subscribeViewportRuntime(
      viewportId,
      syncPresentationState
    );

    return () => {
      unsubscribe();
    };
  }, [
    activeDisplaySetInstanceUID,
    viewport,
    viewportId,
    cornerstoneViewportService,
    opacityToLinear,
  ]);

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

      // Update voiRange as well, to ensure immediate UI updates
      const { lower, upper } = utilities.windowLevel.toLowHighRange(
        preset.windowWidth,
        preset.windowCenter
      );

      const newVoiRange = { lower, upper };

      if (!voiRangeRef.current || !areVoiRangesClose(voiRangeRef.current, newVoiRange)) {
        voiRangeRef.current = newVoiRange;
        setVoiRange(newVoiRange);

        commandsManager.run({
          commandName: 'setViewportWindowLevel',
          commandOptions: {
            ...preset,
            viewportId,
            displaySetInstanceUID,
          },
          context: 'CORNERSTONE',
        });
      }
    },
    [commandsManager, viewportId, validateActiveDisplaySet]
  );

  const setVOIRange = useCallback(
    (params: { lower: number; upper: number }) => {
      if (!viewportId) {
        return;
      }

      // Only update if VOI values have actually changed
      if (!voiRangeRef.current || !areVoiRangesClose(voiRangeRef.current, params)) {
        // Update the ref and state immediately to avoid race conditions with the event listener
        voiRangeRef.current = params;
        setVoiRange(params);

        const windowLevel = utilities.windowLevel.toWindowLevel(params.lower, params.upper);

        // Set window level using the command manager directly to avoid circular calls
        const displaySetInstanceUID = validateActiveDisplaySet();
        commandsManager.run({
          commandName: 'setViewportWindowLevel',
          commandOptions: {
            ...windowLevel,
            viewportId,
            displaySetInstanceUID,
          },
          context: 'CORNERSTONE',
        });
      }
    },
    [viewportId, commandsManager, validateActiveDisplaySet]
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

      // Update local opacity state
      if (opacity !== undefined) {
        setOpacityState(opacity);
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
    [commandsManager, validateActiveDisplaySet, viewport, viewportId]
  );

  const setOpacity = useCallback(
    (opacityValue: number) => {
      if (!viewport) {
        return;
      }

      // Apply the actual opacity value
      setOpacityState(opacityValue);
      // Update the linear value for UI
      setOpacityLinearState(opacityToLinear(opacityValue));

      const displaySetInstanceUID = validateActiveDisplaySet();

      if (getViewportAdapter(viewport).setLayerOpacity(displaySetInstanceUID, opacityValue)) {
        viewport.render();
      }
    },
    [validateActiveDisplaySet, opacityToLinear, viewport]
  );

  const setOpacityLinear = useCallback(
    (linearValue: number) => {
      // Convert linear UI value to actual opacity value and apply it
      const actualOpacity = linearToOpacity(linearValue);
      setOpacity(actualOpacity);
    },
    [linearToOpacity, setOpacity]
  );

  const setThreshold = useCallback(
    (thresholdValue: number) => {
      if (!viewport) {
        return;
      }

      const displaySetInstanceUID = validateActiveDisplaySet();
      setThresholdState(thresholdValue);

      if (getViewportAdapter(viewport).setLayerThreshold(displaySetInstanceUID, thresholdValue)) {
        viewport.render();
      }
    },
    [validateActiveDisplaySet, viewport]
  );

  // Get the current colormap for the active display set
  const colormap = useMemo(() => {
    if (!activeDisplaySetInstanceUID || !viewportDisplaySets?.length) {
      return null;
    }

    try {
      if (!viewport) {
        return null;
      }

      const colormap = getViewportAdapter(viewport).getColormap(activeDisplaySetInstanceUID);

      return (
        colormap ||
        colorbarProperties?.colormaps?.find(c => c.Name === 'Grayscale') ||
        colorbarProperties?.colormaps?.[0]
      );
    } catch (error) {
      console.error('Error getting viewport colormap:', error);
      return (
        colorbarProperties?.colormaps?.find(c => c.Name === 'Grayscale') ||
        colorbarProperties?.colormaps?.[0]
      );
    }
  }, [activeDisplaySetInstanceUID, viewportDisplaySets, colorbarProperties?.colormaps, viewport]);

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
    windowLevel: voiRange
      ? utilities.windowLevel.toWindowLevel(voiRange?.lower, voiRange?.upper)
      : { windowCenter: null, windowWidth: null },

    // Colorbar functions
    hasColorbar,
    toggleColorbar,

    // Colormap functions
    setColormap,
    colormap,

    // Opacity functions
    opacity,
    setOpacity,
    opacityLinear,
    setOpacityLinear,

    // Threshold functions
    threshold,
    setThreshold,
    pixelValueRange,

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

/**
 * Helper function to compare two VOI ranges with a small tolerance.
 * @param rangeA - The first VOI range { lower, upper }.
 * @param rangeB - The second VOI range { lower, upper }.
 * @param epsilon - The tolerance for comparison.
 * @returns True if the ranges are considered close, false otherwise.
 */
function areVoiRangesClose(
  rangeA: { lower: number; upper: number },
  rangeB: { lower: number; upper: number },
  epsilon = 0.001
): boolean {
  if (!rangeA || !rangeB) {
    return false;
  }
  return (
    Math.abs(rangeA.lower - rangeB.lower) < epsilon &&
    Math.abs(rangeA.upper - rangeB.upper) < epsilon
  );
}

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
