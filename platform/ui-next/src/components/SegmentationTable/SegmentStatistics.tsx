import React from 'react';
import { SegmentStatisticsProvider, useSegmentStatistics } from './contexts';
import { roundNumber } from '../../utils';

// Default statistics component
const DefaultStatsList = () => {
  const { namedStats } = useSegmentStatistics('DefaultStatsList');

  if (!namedStats) {
    return null;
  }

  // An empty segment (0 voxels) yields NaN / Infinity / -Infinity for most statistics: show a dash
  // instead of those computation artefacts.
  const NO_VALUE = '—';
  const isMissing = (value: unknown) => typeof value === 'number' && !Number.isFinite(value);

  const handleNumber = (value: number) => {
    if (value === null) {
      return '';
    }

    if (Array.isArray(value)) {
      return value.every(isMissing) ? NO_VALUE : value.map(handleNumber).join(', ');
    }

    return isMissing(value) ? NO_VALUE : roundNumber(value);
  };

  // Sort namedStats entries by order property
  const sortedStats = Object.entries(namedStats)
    .filter(([_, stat]) => stat && stat.value !== null)
    .sort((a, b) => {
      const orderA = a[1]?.order ?? Number.MAX_SAFE_INTEGER;
      const orderB = b[1]?.order ?? Number.MAX_SAFE_INTEGER;
      return orderA - orderB;
    });

  return (
    <div className="space-y-1">
      {sortedStats.map(([key, stat]) => {
        const { label, value, unit } = stat;

        return (
          <div
            key={key}
            className="flex justify-between"
          >
            <div>{label}</div>
            <div>
              <span className="text-foreground">{handleNumber(value)}</span>{' '}
              <span className="">
                {unit && unit !== 'none' && handleNumber(value) !== NO_VALUE ? unit : ''}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Root component that serves as the container and context provider
const SegmentStatisticsRoot = ({ segment, segmentationId, children }) => {
  if (!segment) {
    return null;
  }

  return (
    <SegmentStatisticsProvider
      segment={segment}
      segmentationId={segmentationId}
    >
      <div className="segment-statistics w-full">{children}</div>
    </SegmentStatisticsProvider>
  );
};

const SegmentStatisticsTitle = ({ children = null }: { children?: React.ReactNode }) => {
  return <div className="mb-2">{children}</div>;
};
const SegmentStatisticsHeader = ({ children = null }: { children?: React.ReactNode }) => {
  const { segment, segmentationId } = useSegmentStatistics('SegmentStatisticsHeader');
  const { segmentIndex } = segment;

  return (
    <div className="mb-3">
      {children &&
        React.cloneElement(children as React.ReactElement<any>, { segmentationId, segmentIndex })}
    </div>
  );
};

const SegmentStatisticsBody = ({ children = null }: { children?: React.ReactNode }) => {
  return <div className="segment-statistics-body">{children || <DefaultStatsList />}</div>;
};

const SegmentStatisticsFooter = ({ children = null }: { children?: React.ReactNode }) => {
  return <div className="mt-3">{children}</div>;
};

// Create a compound component structure
const SegmentStatistics = Object.assign(SegmentStatisticsRoot, {
  Title: SegmentStatisticsTitle,
  Header: SegmentStatisticsHeader,
  Body: SegmentStatisticsBody,
  Footer: SegmentStatisticsFooter,
});

export { SegmentStatistics };
export { useSegmentStatistics };
