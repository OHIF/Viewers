import { utilities as csUtils } from '@cornerstonejs/core';

/**
 * Payload registered with cornerstone's global GenericViewport dataset metadata
 * provider. The shape is family-specific and mirrors what each native viewport's
 * data provider reads (see the cornerstone genericViewport examples):
 *   - planar : imageIds (+ optional volumeId) — stack / volume-slice / MPR / 3D
 *   - video  : sourceDataId (the video imageId)
 *   - ecg    : sourceDataId (the waveform imageId)
 *   - wsi    : imageIds + a DICOMweb webClient used to fetch tiles
 */
export type DataIdPayload =
  | { kind: 'planar'; imageIds: string[]; volumeId?: string; initialImageIdIndex?: number }
  | { kind: 'video' | 'ecg'; sourceDataId: string }
  | { kind: 'wsi'; imageIds: string[]; options: { webClient: unknown } };

/**
 * Owns the lifecycle of OHIF's `dataId` registrations against cornerstone's
 * process-global `genericViewportDataSetMetadataProvider` (see migration plan §4.7).
 *
 * Why this exists: cornerstone's `removeData`/`setDisplaySets` do NOT garbage-collect
 * the global registration store (upstream blocker CS-18), so OHIF must own add/remove.
 * The MPR triptych mounts the SAME `dataId` (the displaySetInstanceUID-derived volume)
 * from N panes, so a naive add-on-every-mount / never-remove both over-registers and
 * leaks. This registry ref-counts per `dataId` and keeps a per-viewport ledger so:
 *   - `provider.add` fires only on the 0 -> 1 transition,
 *   - `provider.remove` fires only on the 1 -> 0 transition,
 *   - unmounting one pane of a shared-volume triptych does not unregister data the
 *     other panes still need.
 *
 * Used only by the native ("next") backend; the legacy backend never touches it.
 */
export class DataIdRegistry {
  // Global ref-count keyed by dataId (the provider store is a single global namespace).
  private readonly refCounts = new Map<string, number>();
  // Last payload registered per dataId, so a re-registration that promotes a
  // stack-only dataId to volume-backed can be detected and forwarded to the provider.
  private readonly payloads = new Map<string, DataIdPayload>();
  // Per-viewport ledger of the dataIds it registered, to drive release on unmount.
  private readonly byViewport = new Map<string, string[]>();

  /**
   * Builds the registration dataId for a display set. PT/CT *fusion* overlays are
   * distinct display sets with their own UIDs, so the bare displaySetInstanceUID is
   * already collision-free and is used for both source and overlay bindings (the LUT
   * presentation store keys by the same UID, giving a clean 1:1 dataId mapping). The
   * `'overlay'` suffix is reserved for the case where a source and an overlay share the
   * SAME displaySetInstanceUID but need distinct registrations — i.e. derived labelmap
   * overlays (segmentation / M4), which are not yet on the native path.
   */
  static dataIdFor(displaySetInstanceUID: string, role?: 'overlay'): string {
    return role === 'overlay' ? `${displaySetInstanceUID}::overlay` : displaySetInstanceUID;
  }

  /**
   * Registers (or ref-bumps) a dataId for a viewport. Adds to the cornerstone
   * provider only on the first reference. Idempotent payloads across panes that
   * share a dataId are expected (same imageIds/volumeId), so first-writer wins —
   * EXCEPT when a later payload promotes a previously stack-only registration to
   * a volume-backed one (gains a `volumeId`). That happens when a data overlay
   * (fusion) is added to a viewport whose source was first mounted as a vtkImage
   * stack: the source is re-registered with its volumeId so it can render as a
   * volume slice alongside the overlay. Without updating the provider here, the
   * source would keep its volumeId-less payload and stay vtkImage while the
   * overlay is a vtkVolumeSlice (broken fusion).
   */
  register(viewportId: string, dataId: string, payload: DataIdPayload): void {
    const prev = this.refCounts.get(dataId) ?? 0;
    const existing = this.payloads.get(dataId);
    const promotesToVolume =
      !!(payload as { volumeId?: string }).volumeId &&
      !(existing as { volumeId?: string } | undefined)?.volumeId;

    if (prev === 0 || promotesToVolume) {
      csUtils.genericViewportDataSetMetadataProvider.add(dataId, payload);
      this.payloads.set(dataId, payload);
    }
    this.refCounts.set(dataId, prev + 1);

    const list = this.byViewport.get(viewportId) ?? [];
    list.push(dataId);
    this.byViewport.set(viewportId, list);
  }

  /**
   * Releases every dataId a viewport registered (called on element disable).
   * Removes from the provider only when the last reference is gone.
   */
  releaseViewport(viewportId: string): void {
    const dataIds = this.byViewport.get(viewportId);
    if (!dataIds) {
      return;
    }
    for (const dataId of dataIds) {
      const next = (this.refCounts.get(dataId) ?? 1) - 1;
      if (next <= 0) {
        this.refCounts.delete(dataId);
        this.payloads.delete(dataId);
        csUtils.genericViewportDataSetMetadataProvider.remove(dataId);
      } else {
        this.refCounts.set(dataId, next);
      }
    }
    this.byViewport.delete(viewportId);
  }

  /**
   * Flushes all remaining registrations (called on service destroy). Removes each
   * dataId individually rather than `provider.clear()`, which would wipe
   * registrations owned by other rendering contexts / service instances.
   */
  destroy(): void {
    for (const dataId of this.refCounts.keys()) {
      csUtils.genericViewportDataSetMetadataProvider.remove(dataId);
    }
    this.refCounts.clear();
    this.payloads.clear();
    this.byViewport.clear();
  }
}
