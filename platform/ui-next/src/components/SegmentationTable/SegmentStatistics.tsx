import React from 'react';
import { roundNumber } from '../../utils';

// Default statistics renderer for the body section
export const DefaultSegmentStatisticsBody = ({ namedStats }) => {
  if (!namedStats) {
    return null;
  }

  return (
    <div className="w-full">
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
    </div>
  );
};

// Title component
export const SegmentStatisticsTitle = ({ children }) => {
  return <div className="mb-2">{children}</div>;
};
SegmentStatisticsTitle.displayName = 'SegmentationTable.SegmentStatisticsTitle';

// Header component (appears before the main stats)
export const SegmentStatisticsHeader = ({ children }) => {
  return <div className="mb-3">{children}</div>;
};
SegmentStatisticsHeader.displayName = 'SegmentationTable.SegmentStatisticsHeader';

// Body component (contains the main stats)
export const SegmentStatisticsBody = ({ children, namedStats }) => {
  if (children) {
    if (React.isValidElement(children)) {
      return React.cloneElement(children, { namedStats });
    }
    return children;
  }
  return <DefaultSegmentStatisticsBody namedStats={namedStats} />;
};
SegmentStatisticsBody.displayName = 'SegmentationTable.SegmentStatisticsBody';

// Footer component (appears after the main stats)
export const SegmentStatisticsFooter = ({ children }) => {
  return <div className="mt-3">{children}</div>;
};
SegmentStatisticsFooter.displayName = 'SegmentationTable.SegmentStatisticsFooter';

// Main statistics container component
export const SegmentStatistics = ({ segment, children }) => {
  const { cachedStats } = segment || {};
  const { namedStats } = cachedStats || {};

  if (!children && !namedStats) {
    return null;
  }

  // Find specific section components among children
  const findComponent = displayName => {
    if (!children) {
      return null;
    }

    const childrenArray = React.Children.toArray(children);
    return childrenArray.find(child => child.type && child.type.displayName === displayName);
  };

  const titleComponent = findComponent('SegmentationTable.SegmentStatisticsTitle');
  const headerComponent = findComponent('SegmentationTable.SegmentStatisticsHeader');
  const bodyComponent = findComponent('SegmentationTable.SegmentStatisticsBody');
  const footerComponent = findComponent('SegmentationTable.SegmentStatisticsFooter');

  debugger;
  return (
    <div className="segment-statistics">
      {titleComponent}
      {headerComponent}
      <SegmentStatisticsBody namedStats={namedStats}>
        {bodyComponent?.props.children}
      </SegmentStatisticsBody>
      {footerComponent}
    </div>
  );
};
