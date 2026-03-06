import React from 'react';
import type { IconProps } from '../types';

/** Icon for Plugins - extension / puzzle piece (4 connected blocks) */
export const TabPlugin = (props: IconProps) => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 22 22"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5">
      <rect x="2" y="2" width="8" height="8" rx="1" />
      <rect x="12" y="2" width="8" height="8" rx="1" />
      <rect x="2" y="12" width="8" height="8" rx="1" />
      <rect x="12" y="12" width="8" height="8" rx="1" />
      <path d="M10 6h2M11 6v2" strokeWidth="1.2" />
    </g>
  </svg>
);

export default TabPlugin;
