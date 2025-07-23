import React, { createContext, useContext } from 'react';

// Context for expanded segmentation panel
interface SegmentationExpandedContextType {
  segmentation: any;
  representation: any;
  isActive: boolean;
}

// Create a named context
const SegmentationExpandedContext = createContext<SegmentationExpandedContextType | undefined>(
  undefined
);
SegmentationExpandedContext.displayName = 'SegmentationExpandedContext';

export const useSegmentationExpanded = (componentName?: string) => {
  const context = useContext(SegmentationExpandedContext);

  if (context === undefined) {
    throw new Error(
      `useSegmentationExpanded must be used within a SegmentationExpandedProvider` +
        (componentName ? ` (called from ${componentName})` : '')
    );
  }

  return context;
};

export const SegmentationExpandedProvider: React.FC<{
  segmentation: any;
  representation: any;
  isActive: boolean;
  children: React.ReactNode;
}> = ({ segmentation, representation, isActive, children }) => {
  return (
    <SegmentationExpandedContext.Provider value={{ segmentation, representation, isActive }}>
      {children}
    </SegmentationExpandedContext.Provider>
  );
};
