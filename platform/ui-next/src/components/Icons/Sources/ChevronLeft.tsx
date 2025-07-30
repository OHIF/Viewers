import React from 'react';
import type { IconProps } from '../types';

export const ChevronLeft = (props: IconProps) => (
  <svg
    width="7"
    height="12"
    viewBox="0 0 7 12"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <g
      fill="none"
      fillRule="evenodd"
    >
      <path d="M0 0h7v12H0z" />
      <path
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5.757 1.757 1.515 6l4.242 4.243"
      />
    </g>
  </svg>
);

export default ChevronLeft;
