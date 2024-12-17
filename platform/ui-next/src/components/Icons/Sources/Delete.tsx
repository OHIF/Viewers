import React from 'react';
import type { IconProps } from '../types';

export const Delete = (props: IconProps) => (
  <svg
    width="24px"
    height="24px"
    viewBox="0 0 24 24"
    {...props}
  >
    <g
      id="Delete"
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
      <circle
        id="Oval"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        cx="12"
        cy="12"
        r="7"
      ></circle>
      <line
        x1="8.95652174"
        y1="8.95652174"
        x2="15.0434783"
        y2="15.0434783"
        id="Path"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></line>
      <line
        x1="15.0434783"
        y1="8.95652174"
        x2="8.95652174"
        y2="15.0434783"
        id="Path"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></line>
    </g>
  </svg>
);

export default Delete;
