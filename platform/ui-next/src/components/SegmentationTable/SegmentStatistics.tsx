import React from 'react';
import { SegmentStatisticsProvider, useSegmentStatistics } from './contexts';
import { roundNumber } from '../../utils';

// Default statistics component
const DefaultStatsList = () => {
  const { namedStats } = useSegmentStatistics('DefaultStatsList');

  if (!namedStats) {
    return null;
  }

  return (
    <div className="space-y-1">
      {Object.entries(namedStats).map(([key, stat]) => {
        if (!stat) {
          return null;
        }
        const { label, value, unit } = stat;
        if (value === null) {
          return null;
        }

        return (
          <div
            key={key}
            className="flex justify-between"
          >
            <div className="">{label}</div>
            <div>
              <span className="text-white">{roundNumber(value)}</span>{' '}
              <span className="">{unit || ''}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Root component that serves as the container and context provider
const SegmentStatisticsRoot = ({ segment, children }) => {
  if (!segment) {
    return null;
  }

  return (
    <SegmentStatisticsProvider segment={segment}>
      <div className="segment-statistics w-full">{children}</div>
    </SegmentStatisticsProvider>
  );
};

// Title component
const SegmentStatisticsTitle = ({ children }) => {
  return <div className="mb-2">{children}</div>;
};

// Header component (appears before the main stats)
const SegmentStatisticsHeader = ({ children }) => {
  return <div className="mb-3">{children}</div>;
};

// Body component (contains the main stats)
const SegmentStatisticsBody = ({ children = null }) => {
  return <div className="segment-statistics-body">{children || <DefaultStatsList />}</div>;
};

// Footer component (appears after the main stats)
const SegmentStatisticsFooter = ({ children }) => {
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
