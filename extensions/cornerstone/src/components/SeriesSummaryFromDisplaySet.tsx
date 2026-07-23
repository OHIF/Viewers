import React from 'react';
import { utils } from '@ohif/core';

const { formatDate } = utils;

export function SeriesSummaryFromDisplaySet({ displaySet }) {
  if (!displaySet) {
    return null;
  }

  const { SeriesDate, SeriesDescription, SeriesNumber = 1 } = displaySet;

  return (
    <div className="mx-2 my-0">
      <div className="text-foreground pb-1 text-sm">
        Series #{SeriesNumber} {SeriesDescription}
      </div>
      <div className="text-muted-foreground text-sm">{formatDate(SeriesDate)}</div>
    </div>
  );
}
