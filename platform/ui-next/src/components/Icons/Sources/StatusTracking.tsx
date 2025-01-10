import React from 'react';
import type { IconProps } from '../types';

export const StatusTracking = (props: IconProps) => (
  <svg
    width="24px"
    height="24px"
    viewBox="0 0 24 24"
    version="1.1"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <title>status-tracking</title>
    <g
      id="status-tracking"
      stroke="none"
      strokeWidth="1"
      fill="none"
      fillRule="evenodd"
    >
      <g>
        <rect
          id="Rectangle"
          x="0"
          y="0"
          width="24"
          height="24"
        ></rect>
        <rect
          id="Rectangle"
          stroke="#5ACCE6"
          fill="#5ACCE6"
          x="4.5"
          y="4.5"
          width="15"
          height="15"
          rx="7.5"
        ></rect>
        <path
          d="M15.388889,9 L11.7739644,14.5948033 C11.6112717,14.8456871 11.3630166,15.0025668 11.0931982,15.0249993 C10.8233798,15.0474318 10.5584004,14.9332222 10.3665704,14.7118131 L8.5,12.5449644"
          id="Path"
          stroke="#090C29"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        ></path>
      </g>
    </g>
  </svg>
);

export default StatusTracking;
