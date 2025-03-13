import React, { createContext, useContext } from 'react';

// Create a context to share segment data with all child components
const SegmentStatisticsContext = createContext(null);

export const useSegmentStatistics = () => {
  const context = useContext(SegmentStatisticsContext);
  if (!context) {
    throw new Error('useSegmentStatistics must be used within a SegmentStatisticsProvider');
  }
  return context;
};

export const SegmentStatisticsProvider = ({ segment, children }) => {
  const { cachedStats } = segment || {};
  const { namedStats } = cachedStats || {};

  // Share segment and namedStats with all children
  const value = {
    segment,
    namedStats,
  };

  return (
    <SegmentStatisticsContext.Provider value={value}>{children}</SegmentStatisticsContext.Provider>
  );
};
