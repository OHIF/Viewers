import * as React from 'react';

/**
 * Builds the headless state for the Study List.
 * Keeps selection, panel open state, and series view mode.
 */
export type SeriesViewMode = 'thumbnails' | 'list';

export function useStudyListState<T = any>(_options: Record<string, never> = {}) {
  const [selected, setSelected] = React.useState<T | null>(null);
  const [isPanelOpen, setPanelOpen] = React.useState(true);
  const [seriesViewMode, setSeriesViewMode] = React.useState<SeriesViewMode>('thumbnails');

  return {
    selected,
    setSelected,
    isPanelOpen,
    setPanelOpen,
    seriesViewMode,
    setSeriesViewMode,
  } as const;
}
