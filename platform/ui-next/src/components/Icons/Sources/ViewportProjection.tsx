import React from 'react';
import type { IconProps } from '../types';

/** Stacked slab planes with a highlighted projection axis (MIP). */
export const ViewportProjection = (props: IconProps) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <g
      stroke="currentColor"
      strokeLinejoin="round"
    >
      <path d="M4.5 8.5 12 5l7.5 3.5L12 12 4.5 8.5Z" />
      <path
        opacity="0.6"
        d="M4.5 12 12 15.5 19.5 12"
      />
      <path
        opacity="0.35"
        d="M4.5 15.5 12 19l7.5-3.5"
      />
    </g>
    <path
      d="M12 5v14"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

export default ViewportProjection;
