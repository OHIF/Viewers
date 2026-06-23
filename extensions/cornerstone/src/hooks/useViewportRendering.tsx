import React, { useCallback, useState, useEffect, useMemo } from 'react';
import { useSystem } from '@ohif/core';
import { useViewportDisplaySets } from './useViewportDisplaySets';
import { Types, utilities, Enums, cache } from '@cornerstonejs/core';
import { getDataIdForViewport } from '../utils/getDataIdForViewport';
import { getViewportProperties, setViewportProperties } from '../utils/getViewportPresentation';
import {
  isStackViewportType,
  isVolumeViewportType,
  isVolume3DViewportType,
} from '../utils/getLegacyViewportType';
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

// Opacity slider gamma. The legacy fusion path applies the slider value through
// a gamma curve (1/5) that the legacy rendering expects. Native ("next") volume
// viewports render the fusion as a volume *slice* whose blend is linear in the
// opacity scalar, so they use an identity mapping (gamma = 1) instead, making the
// slider position equal the applied opacity. See `opacityGamma` below, which
// selects between the two based on the active viewport.
const LEGACY_OPACITY_GAMMA = 1 / 5;

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
  // Viewport from service; kept in state so we can subscribe to VIEWPORT_DATA_CHANGED when null and re-run effects when it becomes available
  const [viewport, setViewport] = useState<Types.IViewport | null>(() =>
    viewportId ? (cornerstoneViewportService.getCornerstoneViewport(viewportId) ?? null) : null
  );
  const [is3DVolume, setIs3DVolume] = useState(isVolume3DViewportType(viewport));

  // Native ("next") volume viewports render fusion as a linear volume slice, so
  // the opacity slider maps 1:1 (gamma = 1). The legacy path keeps its gamma
  // curve. linear<->opacity conversions below use this, so the slider feel and
  // its initial position match the rendering path.
  const opacityGamma = viewport && utilities.isGenericViewport(viewport) ? 1 : LEGACY_OPACITY_GAMMA;
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

  // Keep viewport in state; when not available, subscribe to VIEWPORT_DATA_CHANGED so we set it when the viewport is ready
  useEffect(() => {
    if (!viewportId) {
      setViewport(null);
      return;
    }
    const vp = cornerstoneViewportService.getCornerstoneViewport(viewportId);
    setViewport(vp ?? null);
    if (vp) {
      return;
    }
    const { unsubscribe } = cornerstoneViewportService.subscribe(
      cornerstoneViewportService.EVENTS.VIEWPORT_DATA_CHANGED,
      ({ viewportId: eventViewportId }) => {
        if (eventViewportId !== viewportId) {
          return;
        }
        const next = cornerstoneViewportService.getCornerstoneViewport(viewportId);
        if (next) {
          setViewport(next);
        }
      }
    );
    return () => {
      unsubscribe();
    };
  }, [viewportId, cornerstoneViewportService]);

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

    // Native ("next") volume viewports have no getAllVolumeIds/getImageData(volumeId),
    // and isVolumeViewportType is true for them (requestedType ORTHOGRAPHIC), so the
    // legacy actor lookup would throw. Resolve the active display set's volume from
    // the cornerstone cache instead; legacy volume viewports keep their actor lookup.
    let voxelManager;
    if (utilities.isGenericViewport(viewport)) {
      const volume = cache
        .getVolumes()
        .find(v => v.volumeId?.includes(activeDisplaySetInstanceUID));
      voxelManager = volume?.voxelManager;
    } else if (isVolumeViewportType(viewport)) {
      const volumeIds = viewport.getAllVolumeIds();
      const volumeId = volumeIds.find(id => id.includes(activeDisplaySetInstanceUID));

      if (!volumeId) {
        return;
      }

      const imageData = viewport.getImageData(volumeId);
      voxelManager = imageData?.imageData?.get('voxelManager')?.voxelManager;
    } else {
      return;
    }

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

  useEffect(() => {
    setIs3DVolume(isVolume3DViewportType(viewport));

    if (!viewport || !activeDisplaySetInstanceUID) {
      return;
    }
    try {
      const dataId = getDataIdForViewport(viewport as unknown, activeDisplaySetInstanceUID);

      // Native Generic ("next") viewports expose per-display-set appearance via
      // getDisplaySetPresentation rather than getProperties; the helper bridges
      // both so this VOI/colormap initialization works regardless of backend.
      const properties = getViewportProperties(viewport, dataId ?? activeDisplaySetInstanceUID);

      if (!properties) {
        return;
      }

      if (properties.voiRange) {
        setVoiRange(properties.voiRange);
        voiRangeRef.current = properties.voiRange;
      } else if (utilities.isGenericViewport(viewport)) {
        // Native ("next") viewports store only explicit VOI overrides in the
        // per-display-set presentation; a freshly shown series has none, so fall
        // back to its computed default VOI. Without this, changing the series left
        // the overlay showing the previous series' window level (legacy
        // getProperties always returns the applied VOI, so only native was stale).
        const defaultVOIRange = (
          viewport as unknown as {
            getDefaultVOIRange?: (id?: string) => { lower: number; upper: number } | undefined;
          }
        ).getDefaultVOIRange?.(dataId ?? activeDisplaySetInstanceUID);

        if (defaultVOIRange) {
          setVoiRange(defaultVOIRange);
          voiRangeRef.current = defaultVOIRange;
        }
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
  }, [activeDisplaySetInstanceUID, viewport]);

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

  useEffect(() => {
    if (!activeDisplaySetInstanceUID || !viewport?.element) {
      return;
    }

    const element = viewport.element;

    const updateVOI = eventDetail => {
      const { range } = eventDetail.detail;

      if (!range) {
        return;
      }

      // Check if this update is coming from our own setVOIRange or setWindowLevel call
      // If so, we already updated our state and don't need to do it again
      const isInternalUpdate = voiRangeRef.current && areVoiRangesClose(voiRangeRef.current, range);

      if (!isInternalUpdate) {
        voiRangeRef.current = range;
        setVoiRange(range);
      }
    };

    const updateColormap = eventDetail => {
      const { colormap } = eventDetail.detail;

      if (!colormap) {
        return;
      }

      // Extract threshold from colormap in the event detail
      if (colormap.threshold !== undefined) {
        setThresholdState(colormap.threshold);
      }

      if (colormap.opacity !== undefined) {
        const opacity = resolveOpacityScalar(colormap.opacity);
        if (opacity !== undefined) {
          setOpacityState(opacity);
          setOpacityLinearState(opacityToLinear(opacity));
        }
      }
    };

    element.addEventListener(Enums.Events.VOI_MODIFIED, updateVOI);
    element.addEventListener(Enums.Events.COLORMAP_MODIFIED, updateColormap);

    return () => {
      element.removeEventListener(Enums.Events.VOI_MODIFIED, updateVOI);
      element.removeEventListener(Enums.Events.COLORMAP_MODIFIED, updateColormap);
    };
  }, [activeDisplaySetInstanceUID, viewport, opacityToLinear]);

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

      // Native ("next") volume viewports apply appearance via
      // setDisplaySetPresentation (no getAllVolumeIds/getProperties/setProperties).
      // Merge the opacity into the existing colormap so its name/threshold persist,
      // targeting the active binding by its dataId (the bare display set UID).
      if (utilities.isGenericViewport(viewport)) {
        const current = getViewportProperties(viewport, displaySetInstanceUID);
        const currentColormap = (current?.colormap as Record<string, unknown>) || {};
        // Apply a uniform (flat) opacity so the slider behaves as a linear CT<->PT
        // blend: 0 = background only, 1 = the foreground layer fully opaque ("100%
        // PT"). The default presentation is also flat (see the fusion hanging
        // protocol), so the slider position matches what is rendered and small
        // moves produce small changes.
        setViewportProperties(
          viewport,
          { colormap: { ...currentColormap, opacity: opacityValue } },
          displaySetInstanceUID
        );
        viewport.render();
        return;
      }

      if (!isVolumeViewportType(viewport)) {
        return;
      }

      const volumeIds = viewport.getAllVolumeIds();
      const volumeId = volumeIds.find(id => id.includes(displaySetInstanceUID));

      if (!volumeId) {
        return;
      }

      // Get current properties including colormap
      const properties = viewport.getProperties(volumeId);
      const currentColormap = properties.colormap || {};

      // Update colormap with new opacity
      const updatedColormap = {
        ...currentColormap,
        opacity: opacityValue,
      };

      // Apply updated colormap
      viewport.setProperties(
        {
          colormap: updatedColormap,
        },
        volumeId
      );

      viewport.render();
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

      // Native ("next") volume viewports apply per-display-set appearance through
      // setDisplaySetPresentation (no getAllVolumeIds/setProperties). Merge the
      // threshold into the existing colormap so its name/opacity persist, targeting
      // the active (e.g. PT) binding by its dataId (the bare display set UID). The
      // threshold is an absolute pixel/SUV value, matching the legacy volume path.
      if (utilities.isGenericViewport(viewport)) {
        const current = getViewportProperties(viewport, displaySetInstanceUID);
        const currentColormap = (current?.colormap as Record<string, unknown>) || {};
        setViewportProperties(
          viewport,
          { colormap: { ...currentColormap, threshold: thresholdValue } },
          displaySetInstanceUID
        );
        viewport.render();
        return;
      }

      if (!isVolumeViewportType(viewport)) {
        return;
      }

      const volumeIds = viewport.getAllVolumeIds();
      const volumeId = volumeIds.find(id => id.includes(displaySetInstanceUID));

      if (!volumeId) {
        return;
      }

      viewport.setProperties(
        {
          colormap: {
            threshold: thresholdValue,
          },
        },
        volumeId
      );

      viewport.render();
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

      // Native Generic ("next") viewports (stack or volume) expose colormap via
      // getDisplaySetPresentation rather than getProperties/getActors; the helper
      // reads it for both backends.
      if (utilities.isGenericViewport(viewport)) {
        const { colormap } = getViewportProperties(viewport, activeDisplaySetInstanceUID);
        return (
          colormap ||
          colorbarProperties?.colormaps?.find(c => c.Name === 'Grayscale') ||
          colorbarProperties?.colormaps?.[0]
        );
      }

      if (isStackViewportType(viewport)) {
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
        entry.referencedId?.includes(activeDisplaySetInstanceUID)
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
