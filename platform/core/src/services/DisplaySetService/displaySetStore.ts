import {
  Enums,
  metaData,
  utilities as csMetadataUtilities,
  registerDisplaySetProviders,
} from '@cornerstonejs/metadata';
import { DisplaySet } from '../../types';

const DISPLAY_SET_MODULE = Enums.MetadataModules.DISPLAY_SET;

/**
 * Storage adapter that keeps OHIF display sets in the `@cornerstonejs/metadata`
 * DISPLAY_SET typed cache (keyed by `displaySetInstanceUID`) instead of an
 * OHIF-private map, so cornerstone-native consumers can resolve the same
 * display sets through `metaData.getTyped(Enums.MetadataModules.DISPLAY_SET, uid)`.
 *
 * The typed cache has no enumeration API, so a module-level UID index is kept
 * for iteration.  The index is module-level (like the previous module-level
 * `displaySetCache` map) so all service instances share the same store.
 *
 * Writes use `setCacheData` for exact `Map.set` overwrite semantics — the
 * `metaData.addTyped` ingest path warns and keeps the OLD value on duplicate
 * adds, which would break the re-add flows (invalidation, `addInstances`
 * merges, SR re-hydration).
 */
const displaySetUIDs = new Set<string>();

let providersRegistered = false;

/**
 * Registers the DISPLAY_SET typed providers plus the typed-provider bridge so
 * `metaData.getTyped(DISPLAY_SET, uid)` resolves even when
 * `registerDefaultProviders()` has not run (e.g. in tests).  Guarded so it
 * only runs once; `addProvider` dedupes the bridge by function identity, so
 * this cannot double-register relative to `registerDefaultProviders()`.
 */
export function ensureDisplaySetMetadataProviders(): void {
  if (providersRegistered) {
    return;
  }
  providersRegistered = true;
  metaData.addProvider(metaData.metadataModuleProvider, -1000);
  registerDisplaySetProviders();
}

/**
 * Stores a display set, overwriting any previous value for the same
 * `displaySetInstanceUID` (matching `Map.set` semantics).
 */
export function setDisplaySet(displaySet: DisplaySet): void {
  ensureDisplaySetMetadataProviders();
  const uid = displaySet.displaySetInstanceUID;
  csMetadataUtilities.setCacheData(DISPLAY_SET_MODULE, uid, displaySet);
  displaySetUIDs.add(uid);
}

/**
 * Retrieves a display set by UID.  Prunes the UID index when the underlying
 * typed cache entry has been cleared externally (e.g. by a
 * `utilities.clearCacheData()` from a loader re-initialization).
 */
export function getDisplaySet(uid: string): DisplaySet | undefined {
  const value = csMetadataUtilities.getCacheData(DISPLAY_SET_MODULE, uid) as DisplaySet | undefined;
  if (value === undefined && displaySetUIDs.has(uid)) {
    displaySetUIDs.delete(uid);
  }
  return value;
}

export function hasDisplaySet(uid: string): boolean {
  return getDisplaySet(uid) !== undefined;
}

/** Removes a display set from the store. */
export function deleteDisplaySet(uid: string): boolean {
  const existed = displaySetUIDs.delete(uid);
  csMetadataUtilities.clearTypedCacheData(DISPLAY_SET_MODULE, uid);
  return existed;
}

/**
 * Removes every display set owned by this store.  Clears per-UID rather than
 * clearing the whole DISPLAY_SET module so cornerstone-native entries written
 * by other code survive.
 */
export function clearDisplaySets(): void {
  for (const uid of displaySetUIDs) {
    csMetadataUtilities.clearTypedCacheData(DISPLAY_SET_MODULE, uid);
  }
  displaySetUIDs.clear();
}

/** All stored display sets in insertion order (matching Map iteration order). */
export function getAllDisplaySets(): DisplaySet[] {
  const result: DisplaySet[] = [];
  for (const uid of [...displaySetUIDs]) {
    const displaySet = getDisplaySet(uid);
    if (displaySet) {
      result.push(displaySet);
    }
  }
  return result;
}

/**
 * A snapshot map of the stored display sets, keyed by UID.  Returned by the
 * deprecated `DisplaySetService.getDisplaySetCache()` — mutating the snapshot
 * has no effect on the store.
 */
export function getDisplaySetSnapshot(): Map<string, DisplaySet> {
  return new Map(getAllDisplaySets().map(ds => [ds.displaySetInstanceUID, ds]));
}
