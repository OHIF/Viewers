import type { Types as CoreTypes } from '@cornerstonejs/core';
import type { ProjectionState } from '../../../projection/projectionRegistry';

export type { ProjectionState };

/**
 * Why a rendering lane cannot project right now. Every reason is a refusal the
 * service and UI surface verbatim; none of them is guessed around.
 */
export type ProjectionUnsupportedReason =
  | 'not-volume'
  | 'volume3d'
  | 'cpu-lane'
  | 'layer-unresolved'
  | 'volume-not-loaded';

export type ProjectionSupport =
  | { supported: true }
  | { supported: false; reason: ProjectionUnsupportedReason };

export interface ProjectionWriteResult {
  /** False when the layer could not be resolved to an engine object; nothing was written. */
  applied: boolean;
  /** Always false today: the adapter never renders, the caller renders exactly once. */
  rendered: boolean;
}

export interface SlabRange {
  min: number;
  max: number;
}

/**
 * Content shape of a viewport, independent of the runtime cornerstone viewport
 * type. Native ("next") viewports collapse stack/volume/MPR onto a single
 * PLANAR_NEXT runtime type, so `viewport.type` checks cannot classify them;
 * this is the lane-agnostic answer to "what is this viewport showing".
 */
export type ViewportShape = 'stack' | 'volume' | 'volume3d' | 'unknown';

export type VOIRange = { lower: number; upper: number };

export interface ViewportColormap {
  name?: string;
  opacity?: number | Array<{ value: number; opacity: number }> | number[];
  threshold?: number;
  [key: string]: unknown;
}

/**
 * Per-display-set appearance (VOI/colormap/invert). On legacy this is the
 * getProperties()/setProperties() surface; on native it is the per-binding
 * display-set presentation keyed by dataId.
 */
export interface ViewportPresentation {
  voiRange?: VOIRange;
  colormap?: ViewportColormap;
  invert?: boolean;
  isComputedVOI?: boolean;
  [key: string]: unknown;
}

/**
 * View-level state (rotation, flip, orientation, pan/zoom). On legacy this is
 * the getCamera()/setCamera() surface; on native it is the semantic
 * getViewState()/setViewState() surface. Field names follow the native shape
 * where the two overlap (rotation, flipHorizontal, flipVertical).
 */
export type ViewportViewState = Record<string, unknown>;

/**
 * The single OHIF-facing per-viewport contract over the legacy and native
 * ("next") cornerstone viewport APIs.
 *
 * The contract is NEXT-SHAPED: method names and semantics follow the native
 * API (view state, per-display-set presentation keyed by dataId, view
 * reference). `NextViewportAdapter` is a thin pass-through;
 * `LegacyViewportAdapter` is the side doing the adapting
 * (getCamera -> view state, volumeId -> dataId). When the legacy path is
 * eventually removed, the migration ends by deleting the legacy adapter — not
 * by unwinding call-site ternaries.
 *
 * Obtain an instance ONLY via `getViewportAdapter(viewport)` — the one place
 * allowed to call `csUtils.isGenericViewport`. UI code (hooks, overlays,
 * components, toolbar evaluators) must consume this interface instead of
 * probing the raw viewport surface.
 */
export interface IViewportAdapter {
  // ---- classification ----

  /** Lane-agnostic content shape (see ViewportShape). */
  getShape(): ViewportShape;

  /**
   * True when the viewport renders volume content and supports volume-only
   * appearance controls (threshold, per-layer opacity): legacy ORTHOGRAPHIC,
   * or a native viewport whose active binding is a volume.
   */
  isVolumeRendering(): boolean;

  /**
   * True when the viewport can be reoriented in place via setOrientation()
   * without being recreated: legacy ORTHOGRAPHIC, or a native viewport already
   * rendering volume content (volume slice or 3D). Differs from
   * isVolumeRendering() on native 3D viewports, which reorient in place but do
   * not support the planar volume appearance controls.
   */
  canReorientInPlace(): boolean;

  /**
   * True when a volume-mode viewport is looking down the acquisition axis
   * (legacy isInAcquisitionPlane(); native view-state orientation ACQUISITION,
   * which is also the native default when unset).
   */
  isInAcquisitionPlane(): boolean;

  /**
   * True when the viewport has renderable content bound. Legacy reports this
   * via actors; native (which has no getActors on planar viewports) via its
   * content mode.
   */
  hasContent(): boolean;

  // ---- view geometry ----

  /** Read view-level state (rotation/flip/orientation/...). Empty object when unavailable. */
  getViewState(): ViewportViewState;

  /** Apply a partial view-state patch; unspecified fields are preserved. */
  setViewState(patch: ViewportViewState): void;

  /** Current view-plane normal (legacy camera; native view reference). */
  getViewPlaneNormal(): CoreTypes.Point3 | undefined;

  /** World-space focal point / slice center (legacy camera; native view reference). */
  getFocalPoint(): CoreTypes.Point3 | undefined;

  // ---- per-display-set appearance ----

  /**
   * Read appearance (voiRange/colormap/invert/...) for a display set binding.
   * Defaults to the active source binding when no dataId is given. On native,
   * a VOI matching the binding's computed default is stamped
   * `isComputedVOI: true` so LUT-presentation capture strips it (matching
   * legacy StackViewport behavior).
   */
  getPresentation(dataId?: string): ViewportPresentation;

  /** Write appearance for a display set binding (active source binding when no dataId). */
  setPresentation(props: ViewportPresentation, dataId?: string): void;

  /** The binding's computed default VOI (native only; legacy returns undefined). */
  getDefaultVOIRange(dataId?: string): VOIRange | undefined;

  /**
   * The colormap currently applied to a display set's layer, or undefined when
   * none (callers supply their own fallback, e.g. Grayscale).
   */
  getColormap(displaySetInstanceUID: string): ViewportColormap | undefined;

  /**
   * Merge an opacity into the display set layer's colormap. Returns true when
   * applied (caller renders); false when the viewport/layer does not support it.
   */
  setLayerOpacity(displaySetInstanceUID: string, opacity: number): boolean;

  /**
   * Apply a threshold to the display set layer's colormap. Returns true when
   * applied (caller renders); false when unsupported.
   */
  setLayerThreshold(displaySetInstanceUID: string, threshold: number): boolean;

  /**
   * Gamma applied between the fusion opacity slider position and the rendered
   * opacity. Native renders a linear blend (gamma 1); legacy rendering expects
   * its historical 1/5 curve.
   */
  getOpacityGamma(): number;

  // ---- data addressing ----

  /**
   * Resolve the dataId to address a display set's binding on this viewport:
   * the bare display set UID on native; the matching volumeId on legacy volume
   * viewports; undefined on legacy single-actor viewports (callers fall back
   * to the active binding).
   */
  getDataIdForDisplaySet(displaySetInstanceUID: string): string | undefined;

  /**
   * The legacy volumeIds bound to this viewport ([] on native and on legacy
   * stack viewports). For legacy-only features such as per-volume histograms.
   */
  getVolumeIds(): string[];

  /** Voxel data access (getRange etc.) for a display set's volume, when available. */
  getVoxelManagerForDisplaySet(
    displaySetInstanceUID: string
  ): { getRange?: () => [number, number]; [key: string]: unknown } | undefined;

  // ---- projection (MIP / MinIP / AIP) ----
  //
  // The last code before the engine for slab projection. Slab thickness on this
  // surface always means the TOTAL width in world units (planes at focal +/- t/2);
  // each lane normalises to its mapper's native convention (legacy volume
  // mapper clipping planes sit at focal +/- t, the next reslice mapper marches
  // to t/2 each side). The layer is a display set UID; each lane resolves it to
  // its own engine key (legacy actor uid via referencedId, next dataId) and
  // refuses (applied: false) when it cannot, never falling through to an empty
  // filter that the engine treats as "every layer".

  /** Whether the lane can project the given layer right now (false for stack/3D/CPU/unloaded). */
  supportsProjection(displaySetInstanceUID?: string): ProjectionSupport;

  /**
   * Read the projection back from the engine (never from remembered state).
   * `undefined` when the layer cannot be resolved or the engine holds a blend the
   * registry does not offer (e.g. a labelmap edge blend).
   */
  getProjection(displaySetInstanceUID?: string): ProjectionState | undefined;

  /**
   * Write blend operation AND slab thickness together. `blendOp: 'none'` is the
   * off path: it restores composite rendering and clears the slab through the
   * lane's explicit reset, never by writing thickness 0 to the legacy engine.
   * Does not render.
   */
  setProjection(projection: ProjectionState, displaySetInstanceUID?: string): ProjectionWriteResult;

  /** Valid slab range for the layer's volume: [engine minimum, volume diagonal]. */
  getSlabRange(displaySetInstanceUID?: string): SlabRange | undefined;

  // ---- capture ----

  /**
   * Mount this viewport's currently-displayed data onto another (same-lane)
   * viewport and copy its appearance + view state. Used by the download/
   * capture form; the caller renders the target afterwards.
   */
  copyDisplayedContentTo(target: CoreTypes.IViewport): Promise<void>;
}
