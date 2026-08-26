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

/**
 * Non-throwing variant: returns undefined outside a SegmentationExpandedProvider.
 *
 * Components that render both inside and outside the provider need this. Wrapping
 * the throwing hook in try/catch instead puts a hook call inside a try block,
 * which breaks the rules of hooks and makes the React Compiler bail on the whole
 * component.
 */
export const useSegmentationExpandedOptional = () => useContext(SegmentationExpandedContext);

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
