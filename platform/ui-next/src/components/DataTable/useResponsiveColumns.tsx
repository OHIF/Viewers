import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { DataTableFeatures } from './DataTable';
import type { ReactTable, ColumnVisibilityState } from '@tanstack/react-table';
import type { ColumnMeta } from './types';
import { useDataTable } from './context';

// Default extra pixels required before re-showing a previously-hidden column on
// grow. Prevents oscillation at the threshold.
const DEFAULT_REGROW_SLACK_PX = 12;

type ColumnSizing = {
  id: string;
  minWidth: number;
  priority: number;
  alwaysVisible: boolean;
};

type ResponsiveColumnsContextValue = {
  unfitColumnIds: Set<string>;
  setUnfitColumnIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  /**
   * Column ids the user has explicitly hidden via the View menu. A mutable ref
   * rather than state: it is recorded synchronously at click time and read by
   * the layout algorithm, and must never itself trigger a render.
   */
  userHiddenColumnIdsRef: React.RefObject<Set<string>>;
  /** Records a user-driven visibility toggle. See useNoteUserColumnToggle. */
  noteUserColumnToggle: (columnId: string, visible: boolean) => void;
};

const ResponsiveColumnsContext = createContext<ResponsiveColumnsContextValue | null>(null);

function useResponsiveColumnsContext(): ResponsiveColumnsContextValue {
  const ctx = useContext(ResponsiveColumnsContext);
  if (!ctx) {
    throw new Error(
      'useResponsiveColumns/useUnfitColumnIds must be used within a <ResponsiveColumnsProvider>'
    );
  }
  return ctx;
}

/**
 * Holds the responsive-layout state for a single DataTable instance.
 * Rendered by `DataTableRoot` so the writer (`useResponsiveColumns`) and
 * readers (`useUnfitColumnIds`, `useToggleColumnVisibility`) can communicate.
 */
export function ResponsiveColumnsProvider({ children }: { children: ReactNode }) {
  const [unfitColumnIds, setUnfitColumnIds] = useState<Set<string>>(() => new Set());
  const userHiddenColumnIdsRef = useRef<Set<string>>(new Set());
  const noteUserColumnToggle = (columnId: string, visible: boolean) => {
    if (visible) {
      userHiddenColumnIdsRef.current.delete(columnId);
    } else {
      userHiddenColumnIdsRef.current.add(columnId);
    }
  };
  const value = { unfitColumnIds, setUnfitColumnIds, userHiddenColumnIdsRef, noteUserColumnToggle };
  return (
    <ResponsiveColumnsContext.Provider value={value}>{children}</ResponsiveColumnsContext.Provider>
  );
}

/**
 * Returns the set of column ids the responsive layout has determined don't
 * fit at the current table width. Consumed by `ViewOptions` to disable
 * toggles whose effect would be immediately reverted.
 */
export function useUnfitColumnIds(): Set<string> {
  return useResponsiveColumnsContext().unfitColumnIds;
}

/** Internal: records a toggle without writing table state. Use useToggleColumnVisibility. */
function useNoteUserColumnToggle(): (columnId: string, visible: boolean) => void {
  return useResponsiveColumnsContext().noteUserColumnToggle;
}

/**
 * Returns the one supported way to show or hide a column from outside the
 * responsive layout. The View menu uses it; consumers toggling columns
 * programmatically should too.
 *
 * It records the toggle as an explicit external decision before writing the
 * table state. That record is what makes a hide sticky (the layout algorithm
 * won't auto-restore the column on grow) and a show clear that stickiness.
 * Recording intent at its source — rather than inferring it by diffing
 * visibility state — is what makes the attribution exact: state diffs cannot
 * distinguish an external toggle from an algorithm write that lands on the
 * same value, or from a write still in flight.
 *
 * Calling column.toggleVisibility() directly still works, but the layout
 * algorithm treats the change as its own and may revert it on the next
 * width change.
 */
export function useToggleColumnVisibility(): (columnId: string, visible: boolean) => void {
  const { table } = useDataTable();
  const noteUserColumnToggle = useNoteUserColumnToggle();
  return (columnId: string, visible: boolean) => {
    noteUserColumnToggle(columnId, visible);
    table.getColumn(columnId)?.toggleVisibility(visible);
  };
}

type ComputeColumnVisibilityResult = {
  /** Column ids hidden in the applied output (algorithm-dropped or user-hidden). */
  hiddenIds: Set<string>;
  /**
   * Column ids whose View-menu toggle would have no visible effect right
   * now — i.e. the algorithm would immediately re-hide them. A user-hidden
   * column is unfit if lifting just *its* override wouldn't let it fit at
   * its position in the walk (other user-hidden columns remain hidden). A
   * non-user-hidden column is unfit if the algorithm has dropped it.
   */
  unfitIds: Set<string>;
};

/**
 * Walk droppable columns in priority desc (tiebreaking by minWidth asc) and
 * compute both the applied visibility (after strict-priority drops and
 * user-hidden overrides) and the "unfit" set used by the View menu.
 *
 * Strict-priority drop rule: the first column whose minWidth (plus regrow
 * slack, if it is currently hidden) doesn't fit in the remaining budget is
 * dropped — and so is every lower-priority column after it, even if some of
 * them would have fit on their own.
 *
 * `isUserHidden` items are hidden in the applied output without consuming
 * budget or starting the drop, so hiding a mid-priority column via the View
 * menu doesn't force every lower-priority column down with it.
 *
 * `wasHidden` reports each id's currently-committed hidden state; this
 * controls regrow hysteresis.
 */
function computeColumnVisibility(
  droppableColumns: ColumnSizing[],
  budget: number,
  isUserHidden: (id: string) => boolean,
  wasHidden: (id: string) => boolean
): ComputeColumnVisibilityResult {
  const hiddenIds = new Set<string>();
  const unfitIds = new Set<string>();
  let cumulative = 0;
  let cascading = false;
  for (const sizing of droppableColumns) {
    const regrowSlack = wasHidden(sizing.id) ? DEFAULT_REGROW_SLACK_PX : 0;
    // Would this column fit at this exact position in the walk? Used to
    // answer "could the user re-show it?" for user-hidden columns and to
    // decide when to start dropping the rest.
    const fits = !cascading && cumulative + sizing.minWidth + regrowSlack <= budget;

    if (isUserHidden(sizing.id)) {
      hiddenIds.add(sizing.id);
      if (!fits) {
        unfitIds.add(sizing.id);
      }
      continue;
    }

    if (!fits) {
      // Either dropping already started, or this column starts it.
      hiddenIds.add(sizing.id);
      unfitIds.add(sizing.id);
      cascading = true;
      continue;
    }

    // Fits — visible, consumes budget.
    cumulative += sizing.minWidth;
  }
  return { hiddenIds, unfitIds };
}

function idSetsEqual(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) {
    return false;
  }
  for (const id of a) {
    if (!b.has(id)) {
      return false;
    }
  }
  return true;
}

/**
 * Drives responsive column visibility from a wrapper element's width.
 *
 * Setting `meta.priority` opts a column in to responsive dropping; columns
 * without a priority (or marked `enableHiding: false`) are always visible
 * and consume their `meta.minWidth` from the budget unconditionally. Among
 * the opted-in columns, higher priority is dropped last.
 *
 * Strict-priority drop rule: walk droppable columns by priority desc,
 * including each that fits the remaining budget. The first column that
 * doesn't fit — and every lower-priority column after it — is dropped, even
 * if some would have fit individually. This guarantees that on shrink
 * columns can only disappear (never reappear) and on grow they return in
 * the reverse of the order they were dropped.
 *
 * User overrides are not inferred: every user-facing toggle reports itself
 * through `useToggleColumnVisibility`, which records the column in a shared
 * user-hidden set synchronously at click time. A user-hidden column stays
 * hidden through subsequent width changes; a user-show clears its entry
 * (the algorithm may still drop it for space on the next shrink). Because
 * intent arrives explicitly, the algorithm never has to guess whether a
 * visibility change was its own write or the user's, and every run is a
 * pure function of (width, user-hidden set): re-running it is idempotent
 * and converges instead of looping.
 *
 * Publishes the "unfit" set — hidden column ids whose View-menu toggle would
 * have no visible effect because the algorithm would immediately re-hide
 * them — through `ResponsiveColumnsProvider`. The check is per-column: a
 * user-hidden column is unfit only if lifting *its* override (with other
 * user overrides intact) wouldn't free enough budget for it to fit.
 *
 * This hook must be used inside a `<ResponsiveColumnsProvider>`.
 */
export function useResponsiveColumns<TData>(
  table: ReactTable<DataTableFeatures, TData>,
  wrapperRef: React.RefObject<HTMLElement | null>
): void {
  const { setUnfitColumnIds, userHiddenColumnIdsRef } = useResponsiveColumnsContext();

  // The last "unfit" set we published. Used to diff against the next run so
  // we only call setUnfitColumnIds when the set actually changes.
  const lastUnfitColumnIdsRef = useRef<Set<string>>(new Set());

  // Snapshot column sizing data once per columns change. TanStack memoizes
  // getAllLeafColumns() internally, so the array reference is stable across
  // renders until the column definitions themselves change.
  const leafColumns = table.getAllLeafColumns();
  const columnSizings: ColumnSizing[] = leafColumns.map(col => {
    const meta = (col.columnDef.meta as ColumnMeta | undefined) ?? undefined;
    const minWidth = typeof meta?.minWidth === 'number' ? meta.minWidth : 0;
    const enableHiding = col.columnDef.enableHiding !== false;
    const hasPriority = typeof meta?.priority === 'number';
    return {
      id: col.id,
      minWidth,
      priority: hasPriority ? (meta!.priority as number) : 0,
      // Setting meta.priority opts a column in to responsive hiding;
      // enableHiding: false opts it out. Columns without a priority are
      // treated as always-visible and consume their minWidth from the budget.
      alwaysVisible: !enableHiding || !hasPriority,
    };
  });

  // Droppable columns sorted in strict priority order (highest first), with
  // minWidth ascending as a tiebreaker. computeColumnVisibility walks this list.
  const droppableColumns: ColumnSizing[] = columnSizings
    .filter(s => !s.alwaysVisible)
    .sort((a, b) => b.priority - a.priority || a.minWidth - b.minWidth);

  // The one manual memoization kept in this file: runAlgorithm feeds two
  // effect dependency arrays, and react-hooks/exhaustive-deps is not
  // compiler-aware — it cannot see that the compiler already caches this
  // function on exactly these deps (verified in compiled output) and warns
  // as if it churned every render. The wrapper restates what the compiler
  // does; remove it if the rule ever learns to trust compiled memoization.
  const runAlgorithm = useCallback(
    (containerWidth: number) => {
      if (droppableColumns.length === 0) {
        return;
      }

      // Always-visible columns consume budget unconditionally; the walk
      // operates on what remains.
      let budget = containerWidth;
      for (const sizing of columnSizings) {
        if (sizing.alwaysVisible) {
          budget -= sizing.minWidth;
        }
      }

      // The currently-committed visibility. Feeds the regrow hysteresis
      // (a hidden column must clear extra slack before re-showing) and the
      // did-anything-change check below.
      const currentVisibility = table.atoms.columnVisibility.get();

      // Single walk produces both the applied visibility (honoring user-
      // hidden columns) and the unfit set (columns whose View-menu toggle
      // would have no effect because the algorithm would immediately re-hide
      // them).
      const { hiddenIds: appliedHidden, unfitIds: nextUnfit } = computeColumnVisibility(
        droppableColumns,
        budget,
        (id: string) => userHiddenColumnIdsRef.current.has(id),
        (id: string) => currentVisibility[id] === false
      );

      // Build the visibility map and apply it only if it changes anything.
      const nextVisibility: ColumnVisibilityState = {};
      for (const sizing of droppableColumns) {
        nextVisibility[sizing.id] = !appliedHidden.has(sizing.id);
      }
      let appliedChanged = false;
      for (const key of Object.keys(nextVisibility)) {
        if ((currentVisibility[key] !== false) !== (nextVisibility[key] !== false)) {
          appliedChanged = true;
          break;
        }
      }
      if (appliedChanged) {
        table.setColumnVisibility(prev => ({ ...prev, ...nextVisibility }));
      }

      // Publish the unfit set if it changed.
      const lastUnfit = lastUnfitColumnIdsRef.current;
      lastUnfitColumnIdsRef.current = nextUnfit;
      if (!idSetsEqual(lastUnfit, nextUnfit)) {
        setUnfitColumnIds(nextUnfit);
      }
    },
    [droppableColumns, table, columnSizings, setUnfitColumnIds, userHiddenColumnIdsRef]
  );

  // Track and react to the table's width.
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper || droppableColumns.length === 0) {
      return;
    }
    runAlgorithm(wrapper.clientWidth);
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        runAlgorithm(entry.contentRect.width);
      }
    });
    observer.observe(wrapper);
    return () => observer.disconnect();
  }, [runAlgorithm, wrapperRef, droppableColumns]);

  // Re-run whenever the committed visibility changes: a user toggle landing
  // (its intent was already recorded synchronously at click time via
  // useToggleColumnVisibility — this run applies the consequences, e.g. a
  // user-hide freeing budget for a lower-priority column), one of our own
  // writes landing, or a programmatic change by a consumer. Runs are
  // idempotent — same width and user-hidden set recompute the same map and
  // write nothing — so this converges instead of looping.
  const columnVisibility = table.state.columnVisibility;
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper || droppableColumns.length === 0) {
      return;
    }
    runAlgorithm(wrapper.clientWidth);
  }, [columnVisibility, runAlgorithm, wrapperRef, droppableColumns]);
}
