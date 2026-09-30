import { utilities as csUtilities } from '@cornerstonejs/core';

export const UNDO_REDO_CACHE_SIZE_CUSTOMIZATION = 'cornerstone.maxUndoRedoCacheSize';

/**
 * The largest accepted history size. The history is a ring of this length, and
 * each labelmap memo can hold a full labelmap buffer, so larger values give no
 * protection against memory pressure.
 */
export const MAX_UNDO_REDO_CACHE_SIZE = 10000;

type SizedHistory = { size: number };

/** The history size before any customization was applied, per history. */
const defaultSizes = new WeakMap<SizedHistory, number>();

/**
 * Returns the value when it is a usable history size, otherwise undefined.
 * The Cornerstone `size` setter runs `new Array(size)`, which throws for a
 * fractional or too-large value, and a size of 0 breaks `push` (the position
 * becomes NaN).
 */
export function validateUndoRedoCacheSize(value: unknown): number | undefined {
  if (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= MAX_UNDO_REDO_CACHE_SIZE
  ) {
    return value;
  }
  return undefined;
}

/**
 * Applies the `cornerstone.maxUndoRedoCacheSize` customization to the
 * Cornerstone undo/redo history. An unset or invalid value restores the
 * Cornerstone default size.
 *
 * The `size` setter clears the history, so the size is only assigned when it
 * changes. That makes this safe to call on every customization change.
 */
export function applyUndoRedoCacheSize(
  customizationService: { getCustomization: (id: string) => unknown },
  history: SizedHistory = csUtilities.HistoryMemo.DefaultHistoryMemo
): void {
  if (!defaultSizes.has(history)) {
    defaultSizes.set(history, history.size);
  }

  const value = customizationService.getCustomization(UNDO_REDO_CACHE_SIZE_CUSTOMIZATION);
  let size = validateUndoRedoCacheSize(value);
  if (size === undefined) {
    if (value !== undefined && value !== null) {
      console.warn(
        `Ignoring ${UNDO_REDO_CACHE_SIZE_CUSTOMIZATION}=${String(value)}: ` +
          `expected an integer from 1 to ${MAX_UNDO_REDO_CACHE_SIZE}`
      );
    }
    size = defaultSizes.get(history);
  }

  if (history.size !== size) {
    history.size = size;
  }
}

export default applyUndoRedoCacheSize;
