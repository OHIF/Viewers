import { useCallback, useEffect, useState } from 'react';
import { useSystem } from '@ohif/core';
import { Enums as csEnums, eventTarget } from '@cornerstonejs/core';
import type { ProjectionSnapshot } from '../services/ProjectionService';
import {
  getUiExposedProjectableModes,
  type ProjectionModeDefinition,
  type ProjectionModeId,
} from '../projection/projectionRegistry';
import { DEFAULT_SLAB_THICKNESS } from '../projection/projectionConstants';

export interface UseViewportProjectionOptions {
  /** Layer to control; defaults to the service's foreground-layer rule. */
  displaySetInstanceUID?: string;
}

export interface ViewportProjectionHook {
  /** Engine read-back for the layer; undefined while nothing is resolvable. */
  snapshot: ProjectionSnapshot | undefined;
  /** True when the engine currently projects this layer (derived, never stored). */
  isProjecting: boolean;
  /** Current registry mode id, 'none' when off. */
  modeId: ProjectionModeId;
  /** Slab thickness to show: the engine value when projecting, else the stored preference. */
  slabThickness: number;
  slabRange: { min: number; max: number } | undefined;
  /** The engine can project this layer right now. */
  supported: boolean;
  /**
   * The user may switch projection on: either supported now, or a 2D stack
   * viewport on reconstructable data that the service promotes to a volume
   * viewport on first enable.
   */
  canEnable: boolean;
  /** Human-readable refusal when projection cannot be enabled at all. */
  unsupportedReason: string | undefined;
  /** Projectable modes the UI offers; one entry means an on/off toggle. */
  modes: ProjectionModeDefinition[];
  setMode: (modeId: ProjectionModeId) => Promise<unknown>;
  setSlabThickness: (slabThickness: number) => Promise<unknown>;
}

/**
 * Projection (MIP) state for one viewport layer, derived from the engine on
 * every relevant event (service PROJECTION_CHANGED, viewport data/volume
 * changes, volume load completion). There is no separately stored "is MIP on"
 * boolean anywhere: `isProjecting` is `snapshot.projection.blendOp !== 'none'`.
 */
export function useViewportProjection(
  viewportId?: string,
  options?: UseViewportProjectionOptions
): ViewportProjectionHook {
  const { servicesManager, commandsManager } = useSystem();
  const { projectionService, cornerstoneViewportService } = servicesManager.services;
  const displaySetInstanceUID = options?.displaySetInstanceUID;

  const read = useCallback(
    () => projectionService?.snapshot({ viewportId, displaySetInstanceUID }),
    [projectionService, viewportId, displaySetInstanceUID]
  );

  const [snapshot, setSnapshot] = useState<ProjectionSnapshot | undefined>(read);
  const [storedThickness, setStoredThickness] = useState<number | undefined>(() =>
    projectionService?.getStoredSlabThickness({ viewportId, displaySetInstanceUID })
  );

  useEffect(() => {
    const refresh = () => {
      setSnapshot(read());
      setStoredThickness(
        projectionService?.getStoredSlabThickness({ viewportId, displaySetInstanceUID })
      );
    };
    refresh();

    const subscriptions = [
      projectionService?.subscribe(
        projectionService.EVENTS.PROJECTION_CHANGED,
        ({ viewportId: eventViewportId }) => {
          if (!viewportId || eventViewportId === viewportId) {
            refresh();
          }
        }
      ),
      cornerstoneViewportService?.subscribe(
        cornerstoneViewportService.EVENTS.VIEWPORT_DATA_CHANGED,
        refresh
      ),
      cornerstoneViewportService?.subscribe(
        cornerstoneViewportService.EVENTS.VIEWPORT_VOLUMES_CHANGED,
        refresh
      ),
    ].filter(Boolean);

    eventTarget.addEventListener(csEnums.Events.IMAGE_VOLUME_LOADING_COMPLETED, refresh);

    return () => {
      subscriptions.forEach(subscription => subscription.unsubscribe());
      eventTarget.removeEventListener(csEnums.Events.IMAGE_VOLUME_LOADING_COMPLETED, refresh);
    };
  }, [read, projectionService, cornerstoneViewportService, viewportId, displaySetInstanceUID]);

  const setMode = useCallback(
    (modeId: ProjectionModeId): Promise<unknown> =>
      Promise.resolve(
        commandsManager.run('setProjectionMode', { viewportId, modeId, displaySetInstanceUID })
      ),
    [commandsManager, viewportId, displaySetInstanceUID]
  );

  const setSlabThickness = useCallback(
    (slabThickness: number): Promise<unknown> =>
      Promise.resolve(
        commandsManager.run('setSlabThickness', {
          viewportId,
          slabThickness,
          displaySetInstanceUID,
        })
      ),
    [commandsManager, viewportId, displaySetInstanceUID]
  );

  const projection = snapshot?.projection;
  const isProjecting = !!projection && projection.blendOp !== 'none';
  const support = snapshot?.support;
  const canEnable = !!support?.supported || !!snapshot?.promotionAvailable;

  return {
    snapshot,
    isProjecting,
    modeId: snapshot?.modeId ?? 'none',
    slabThickness: isProjecting
      ? projection.slabThickness
      : (storedThickness ?? DEFAULT_SLAB_THICKNESS),
    slabRange: snapshot?.slabRange,
    supported: !!support?.supported,
    canEnable,
    unsupportedReason: support && !support.supported && !canEnable ? support.reason : undefined,
    modes: getUiExposedProjectableModes(),
    setMode,
    setSlabThickness,
  };
}

export default useViewportProjection;
