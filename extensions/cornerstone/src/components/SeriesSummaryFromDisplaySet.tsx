import React from 'react';
import { utils } from '@ohif/core';

const { formatDate } = utils;

export function SeriesSummaryFromDisplaySet({ displaySet, isActive }) {
  if (!displaySet) {
    return null;
  }

  const { SeriesDate, SeriesDescription, SeriesNumber = 1 } = displaySet;

  return (
    <>
      <div className={`inline-flex text-base ${isActive ? 'bg-popover' : 'bg-muted'} flex-grow`}>
        Series #{SeriesNumber} {SeriesDescription}
      </div>
      <div className="text-muted-foreground text-sm">{formatDate(SeriesDate)}</div>
    </>
  );
}
