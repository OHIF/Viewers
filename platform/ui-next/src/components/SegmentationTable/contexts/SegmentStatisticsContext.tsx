import React, { createContext, useContext } from 'react';

interface SegmentStatisticsContextType {
  segment: {
    segmentIndex: number;
    cachedStats: any;
  };
  namedStats: Record<string, any> | undefined;
  segmentationId: string;
}

// Create a named context
const SegmentStatisticsContext = createContext<SegmentStatisticsContextType | undefined>(undefined);
SegmentStatisticsContext.displayName = 'SegmentStatisticsContext';

export const useSegmentStatistics = (componentName?: string) => {
  const context = useContext(SegmentStatisticsContext);

  if (context === undefined) {
    throw new Error(
      `useSegmentStatistics must be used within a SegmentStatisticsProvider` +
        (componentName ? ` (called from ${componentName})` : '')
    );
  }

  return context;
};

export const SegmentStatisticsProvider: React.FC<{
  segment: {
    segmentIndex: number;
    cachedStats: any;
  };
  segmentationId: string;
  children: React.ReactNode;
}> = ({ segment, segmentationId, children }) => {
  const { cachedStats } = segment || {};
  const { namedStats } = cachedStats || {};

  return (
    <SegmentStatisticsContext.Provider value={{ segment, namedStats, segmentationId }}>
      {children}
    </SegmentStatisticsContext.Provider>
  );
};
