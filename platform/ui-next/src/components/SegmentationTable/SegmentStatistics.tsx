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
            <div>{label}</div>
            <div>
              <span className="text-white">{roundNumber(value)}</span>{' '}
              <span className="">{unit && unit !== 'none' ? unit : ''}</span>
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
        React.cloneElement(children as React.ReactElement, { segmentationId, segmentIndex })}
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
