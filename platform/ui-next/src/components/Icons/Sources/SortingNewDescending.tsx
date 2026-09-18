import React from 'react';
import type { IconProps } from '../types';

export const SortingNewDescending = (props: IconProps) => (
  <svg
    width="10"
    height="16"
    viewBox="0 0 10 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <line
      x1="2.06066"
      y1="8"
      x2="5"
      y2="10.9393"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <line
      x1="0.75"
      y1="-0.75"
      x2="4.90685"
      y2="-0.75"
      transform="matrix(-0.707107 0.707107 0.707107 0.707107 9 8)"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

export default SortingNewDescending;
