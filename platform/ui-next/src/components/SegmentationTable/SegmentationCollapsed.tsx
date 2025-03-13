import React from 'react';
import { useSegmentationTableContext } from './contexts';

export const SegmentationCollapsed: React.FC<{ children?: React.ReactNode }> = ({
  children = null,
}) => {
  const { mode } = useSegmentationTableContext('SegmentationCollapsed');

  if (mode !== 'collapsed') {
    return null;
  }

  debugger;

  return <div>{children}</div>;
};
