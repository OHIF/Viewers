import React from 'react';
import type { IconProps } from '../types';

export const Minus = (props: IconProps) => (
  <svg
    width="24px"
    height="24px"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <g
      id="Remove"
      stroke="none"
      strokeWidth="1"
      fill="none"
      fillRule="evenodd"
    >
      <rect
        id="Rectangle"
        x="0"
        y="0"
        width="24"
        height="24"
      ></rect>
      <line
        x1="18"
        y1="12"
        x2="6"
        y2="12"
        id="Path"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></line>
    </g>
  </svg>
);

export default Minus;
