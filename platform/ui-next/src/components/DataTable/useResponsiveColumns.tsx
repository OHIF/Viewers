import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { Table as TanStackTable, VisibilityState } from '@tanstack/react-table';
import type { ColumnMeta } from './types';

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
 * reader (`useUnfitColumnIds`) can communicate.
 */
export function ResponsiveColumnsProvider({ children }: { children: ReactNode }) {
  const [unfitColumnIds, setUnfitColumnIds] = useState<Set<string>>(() => new Set());
  const value = { unfitColumnIds, setUnfitColumnIds };
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
 * slack, if it was hidden on the previous run) doesn't fit in the remaining
 * budget is dropped — and so is every lower-priority column after it, even
 * if some of them would have fit on their own.
 *
 * `isUserHidden` items are hidden in the applied output without consuming
 * budget or starting the drop, so hiding a mid-priority column via the View
 * menu doesn't force every lower-priority column down with it.
 *
 * `wasHidden` reports each id's hidden state on the previous run; this
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
 * User overrides via the View menu are tracked separately: a column the
 * user hides is added to a userHidden set and stays hidden through subsequent
 * width changes. Re-showing a column via the View menu clears its entry; the
 * algorithm may still drop it for space on the next shrink.
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
  table: TanStackTable<TData>,
  wrapperRef: React.RefObject<HTMLElement | null>
): void {
  const { setUnfitColumnIds } = useResponsiveColumnsContext();

  // Snapshot of the visibility map the algorithm last applied. Used to detect
  // user-driven toggles by diffing against the table's current state.
  const lastColumnVisibilityRef = useRef<VisibilityState>({});
  // Column ids the user has explicitly hidden via the View menu.
  const userHiddenRef = useRef<Set<string>>(new Set());
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

  // Guards the first algorithm invocation so we don't mistake the table's
  // initial visibility for a user override.
  const isFirstRunRef = useRef(true);

  const runAlgorithm = (containerWidth: number) => {
    if (droppableColumns.length === 0) {
      return;
    }

    if (isFirstRunRef.current) {
      // Seed the "last applied" snapshot with the table's current state so
      // any initialVisibility from the consumer is treated as the algorithm's
      // baseline, not as a user override.
      lastColumnVisibilityRef.current = { ...table.getState().columnVisibility };
      isFirstRunRef.current = false;
    } else {
      // Diff the table's current visibility against what we last applied;
      // any divergence is a user toggle (via DataTable.ViewOptions).
      const current = table.getState().columnVisibility;
      const last = lastColumnVisibilityRef.current;
      for (const sizing of droppableColumns) {
        // Default visibility when a key is absent from VisibilityState is true.
        const currentVisible = current[sizing.id] !== false;
        const lastVisible = last[sizing.id] !== false;
        if (currentVisible === lastVisible) {
          continue;
        }
        if (currentVisible) {
          // User re-showed a column: clear stickiness so the algorithm
          // can manage it again. May still be dropped on the next shrink.
          userHiddenRef.current.delete(sizing.id);
        } else {
          // User hid a column: remember so we don't auto-restore on grow.
          userHiddenRef.current.add(sizing.id);
        }
      }
    }

    // Always-visible columns consume budget unconditionally; the walk
    // operates on what remains.
    let budget = containerWidth;
    for (const sizing of columnSizings) {
      if (sizing.alwaysVisible) {
        budget -= sizing.minWidth;
      }
    }

    // Single walk produces both the applied visibility (honoring user-
    // hidden columns) and the unfit set (columns whose View-menu toggle
    // would have no effect because the algorithm would immediately re-hide
    // them).
    const lastVisibility = lastColumnVisibilityRef.current;
    const { hiddenIds: appliedHidden, unfitIds: nextUnfit } = computeColumnVisibility(
      droppableColumns,
      budget,
      (id: string) => userHiddenRef.current.has(id),
      (id: string) => lastVisibility[id] === false
    );

    // Build and apply the visibility map.
    const nextVisibility: VisibilityState = {};
    for (const sizing of droppableColumns) {
      nextVisibility[sizing.id] = !appliedHidden.has(sizing.id);
    }
    const currentVisibility = table.getState().columnVisibility;
    let appliedChanged = false;
    for (const key of Object.keys(nextVisibility)) {
      if ((currentVisibility[key] !== false) !== (nextVisibility[key] !== false)) {
        appliedChanged = true;
        break;
      }
    }
    lastColumnVisibilityRef.current = nextVisibility;
    if (appliedChanged) {
      table.setColumnVisibility(prev => ({ ...prev, ...nextVisibility }));
    }

    // Publish the unfit set if it changed.
    const lastUnfit = lastUnfitColumnIdsRef.current;
    lastUnfitColumnIdsRef.current = nextUnfit;
    if (!idSetsEqual(lastUnfit, nextUnfit)) {
      setUnfitColumnIds(nextUnfit);
    }
  };

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

  // Re-run when columnVisibility changes from outside (e.g. a user toggle via
  // the View menu). Without this, a user-hide that frees budget for a lower-
  // priority column wouldn't take effect until the next resize. The diffs
  // inside runAlgorithm make this a no-op when the change was algorithm-
  // driven, so there's no feedback loop.
  //
  // Skipped on the initial mount: the width-driven effect above has already
  // run the algorithm by this point, but table.getState() still reflects the
  // pre-commit state (TanStack updates only when the parent re-renders),
  // which would make the diff misinterpret the algorithm's own output as a
  // user override. We only want this effect to react to subsequent changes.
  const hasMountedRef = useRef(false);
  const columnVisibility = table.getState().columnVisibility;
  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }
    const wrapper = wrapperRef.current;
    if (!wrapper || droppableColumns.length === 0) {
      return;
    }
    runAlgorithm(wrapper.clientWidth);
  }, [columnVisibility, runAlgorithm, wrapperRef, droppableColumns]);
}
