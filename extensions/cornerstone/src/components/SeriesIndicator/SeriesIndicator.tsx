import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSystem } from '@ohif/core';
import { useViewportGrid } from '@ohif/ui-next';
import { seriesIndicatorText } from './seriesIndicatorText';

/** A new array of the display sets in study browser order. */
function readDisplaySets(displaySetService) {
  return displaySetService.getDisplaySets
    ? displaySetService.getDisplaySets({ order: 'thumbnailTray' })
    : [...(displaySetService.getActiveDisplaySets() ?? [])];
}

/**
 * Shows which series a viewport displays and where it sits in its study:
 * "Series 3/19 · #5 LAO 30". Useful when moving through the series with the
 * next/previous series keys. Add the `seriesIndicator` button to a
 * `viewportActionMenu` toolbar section (e.g. `viewportActionMenu.topMiddle`).
 *
 * n/N counts the image series of the shown series' study in the order the
 * study browser lists them; SR, SEG and other non-image display sets show only
 * their number and description.
 */
function SeriesIndicator({ viewportId }: { viewportId?: string; [key: string]: unknown }) {
  const { servicesManager } = useSystem();
  const { displaySetService } = servicesManager.services;
  const [viewportGrid] = useViewportGrid();
  const { t } = useTranslation('Common');
  // Kept in state so a render reads the snapshot taken when the display sets
  // or their order last changed.
  const [displaySets, setDisplaySets] = useState(() => readDisplaySets(displaySetService));

  useEffect(() => {
    const update = () => setDisplaySets(readDisplaySets(displaySetService));
    update();
    const { EVENTS } = displaySetService;
    const subscriptions = [
      EVENTS.DISPLAY_SETS_ADDED,
      EVENTS.DISPLAY_SETS_CHANGED,
      EVENTS.DISPLAY_SETS_REMOVED,
      EVENTS.DISPLAY_SET_ORDER_CHANGED,
    ]
      .filter(Boolean)
      .map(event => displaySetService.subscribe(event, update));
    return () => subscriptions.forEach(subscription => subscription?.unsubscribe?.());
  }, [displaySetService]);

  const id = viewportId ?? viewportGrid?.activeViewportId;
  const viewport = id ? viewportGrid?.viewports?.get?.(id) : undefined;
  const text = seriesIndicatorText(viewport?.displaySetInstanceUIDs, displaySets);

  if (!text) {
    return null;
  }

  return (
    <div
      className="text-foreground pointer-events-none flex flex-row items-center gap-1 whitespace-nowrap px-1 text-base"
      data-cy="viewport-series-indicator"
    >
      <span>{t('Series')}</span>
      <span className="max-w-[24rem] overflow-hidden text-ellipsis">{text}</span>
    </div>
  );
}

export default SeriesIndicator;
