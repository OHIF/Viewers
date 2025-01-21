import React from 'react';
import { utils } from '@ohif/core';
import { StudySummary } from '@ohif/ui-next';

const { formatDate } = utils;

export function SeriesSummaryFromMetadata({ displaySet }) {
  if (!displaySet) {
    return null;
  }
  console.log('displaySet=', displaySet);

  const { SeriesDate, SeriesDescription, SeriesNumber = 1 } = displaySet;
  console.log("Showing 'series' summary", SeriesDate, SeriesDescription);

  return (
    <div className="mx-2 my-0">
      <div className="text-foreground pb-1 text-sm">
        Series #{SeriesNumber} {SeriesDescription}
      </div>
      <div className="text-muted-foreground text-sm">{formatDate(SeriesDate)}</div>
    </div>
  );
}
