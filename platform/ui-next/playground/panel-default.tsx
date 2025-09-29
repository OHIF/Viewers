import React from 'react';

export function PanelDefault({ layout }: { layout: 'right' | 'bottom' }) {
  // Layout-aware empty state can diverge later; for now text only
  return <div>Select a study</div>;
}

