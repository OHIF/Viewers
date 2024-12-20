import React from 'react';
import type { IconProps } from '../types';

export const StatusSuccess = (props: IconProps) => (
  <svg
    width="24px"
    height="24px"
    viewBox="0 0 24 24"
    {...props}
  >
    <g
      id="StatusSuccess"
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
      <polyline
        id="Path"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        points="16.173913 8.52173913 11.3043478 15.1304348 7.82608696 12.3478261"
      ></polyline>
      <circle
        id="Oval"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        cx="12"
        cy="12"
        r="8"
      ></circle>
    </g>
  </svg>
);

export default StatusSuccess;
