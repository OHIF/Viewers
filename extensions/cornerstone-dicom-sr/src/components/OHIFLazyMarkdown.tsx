import React, { lazy, Suspense } from 'react';

// 1. Define the lazy-loaded component.
// The dynamic import must return a module with a 'default' export.
const Markdown = lazy(() => import('marked-react'));
// 2. Create the component that uses the lazy import.
const OHIFLazyMarkdownComponent = ({ markdownContent }) => {
  return (
    // 3. Wrap the lazy component in a Suspense boundary.
    // The 'fallback' prop displays content while the component is loading.
    <Suspense fallback={<div>Loading Markdown...</div>}>
      <Markdown>{markdownContent}</Markdown>
    </Suspense>
  );
};

export default OHIFLazyMarkdownComponent;
