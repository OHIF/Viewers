import React from 'react';
import type { IconProps } from '../types';

/** Icon for Assistant IA - robot head (small) */
export const TabAssistantIA = (props: IconProps) => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 22 22"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <g fill="none" fillRule="evenodd" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      {/* head */}
      <rect x="4" y="3" width="14" height="12" rx="2" />
      {/* eyes */}
      <circle cx="8" cy="8" r="1.2" fill="currentColor" />
      <circle cx="14" cy="8" r="1.2" fill="currentColor" />
      {/* antenna */}
      <path d="M11 3v-2M11 1l-1 1.5M11 1l1 1.5" strokeWidth="1.2" />
      <circle cx="11" cy="0.5" r="0.8" fill="currentColor" />
      {/* mouth */}
      <path d="M7.5 12.5h5" strokeWidth="1" />
    </g>
  </svg>
);

export default TabAssistantIA;
