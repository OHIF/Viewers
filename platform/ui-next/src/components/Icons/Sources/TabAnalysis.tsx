import React from 'react';
import type { IconProps } from '../types';

export const TabAnalysis = (props: IconProps) => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 22 22"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <g
      fill="none"
      fillRule="evenodd"
    >
      <circle
        stroke="currentColor"
        cx="11"
        cy="11"
        r="8"
      />
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 11h2l2-3 2 6 2-4 1 1h1"
      />
      <path d="M0 0h22v22H0z" />
    </g>
  </svg>
);

export default TabAnalysis;
