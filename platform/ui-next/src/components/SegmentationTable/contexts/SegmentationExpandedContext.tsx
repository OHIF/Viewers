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

/**
 * Returns the expanded-segmentation context, or undefined when rendered outside a
 * SegmentationExpandedProvider.
 *
 * Deliberately does not throw. Most consumers render both inside and outside the
 * provider and treat absence as a normal fallback case; when this hook threw,
 * every one of them wrapped it in try/catch, which puts a hook call inside a try
 * block - a rules-of-hooks violation that also makes the React Compiler bail on
 * the whole component. The `| undefined` return type is the guard instead: it
 * makes callers state what they do when the context is absent, at compile time.
 *
 * A consumer that genuinely requires the provider should assert for itself (see
 * SegmentationCollapsedSelector), so the error names the component that has the
 * requirement.
 */
export const useSegmentationExpanded = (): SegmentationExpandedContextType | undefined =>
  useContext(SegmentationExpandedContext);

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
