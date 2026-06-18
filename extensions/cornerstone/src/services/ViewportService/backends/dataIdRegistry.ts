import { utilities as csUtils } from '@cornerstonejs/core';

/**
 * Payload registered with cornerstone's global GenericViewport dataset metadata
 * provider. Mirrors the shape the native mount paths pass to
 * `genericViewportDataSetMetadataProvider.add`.
 */
export type DataIdPayload = {
  kind: 'planar';
  imageIds: string[];
  volumeId?: string;
  initialImageIdIndex?: number;
};

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
  // Per-viewport ledger of the dataIds it registered, to drive release on unmount.
  private readonly byViewport = new Map<string, string[]>();

  /**
   * Builds the registration dataId for a display set (optionally scoped to an
   * overlay role for fusion / labelmap overlays). For M0 only the bare source id
   * is used; the overlay suffix lands here so call sites do not change later.
   */
  static dataIdFor(displaySetInstanceUID: string, role?: 'overlay'): string {
    return role === 'overlay' ? `${displaySetInstanceUID}::overlay` : displaySetInstanceUID;
  }

  /**
   * Registers (or ref-bumps) a dataId for a viewport. Adds to the cornerstone
   * provider only on the first reference. Idempotent payloads across panes that
   * share a dataId are expected (same imageIds/volumeId), so first-writer wins.
   */
  register(viewportId: string, dataId: string, payload: DataIdPayload): void {
    const prev = this.refCounts.get(dataId) ?? 0;
    if (prev === 0) {
      csUtils.genericViewportDataSetMetadataProvider.add(dataId, payload);
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
    this.byViewport.clear();
  }
}
