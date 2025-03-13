import React, { createContext, useContext } from 'react';

interface SegmentStatisticsContextType {
  segment: any;
  namedStats: Record<string, any> | undefined;
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
  segment: any;
  children: React.ReactNode;
}> = ({ segment, children }) => {
  const { cachedStats } = segment || {};
  const { namedStats } = cachedStats || {};

  return (
    <SegmentStatisticsContext.Provider value={{ segment, namedStats }}>
      {children}
    </SegmentStatisticsContext.Provider>
  );
};
