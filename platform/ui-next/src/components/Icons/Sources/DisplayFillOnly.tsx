import React from 'react';
import type { IconProps } from '../types';

export const DisplayFillOnly = (props: IconProps) => (
  <svg
    width="18px"
    height="18px"
    viewBox="0 0 18 18"
    {...props}
  >
    <g
      id="view-fill"
      stroke="none"
      strokeWidth="1"
      fill="none"
      fillRule="evenodd"
    >
      <g id="Group-13">
        <rect
          id="Rectangle"
          x="0"
          y="0"
          width="18"
          height="18"
        ></rect>
        <rect
          id="Rectangle"
          fill="currentColor"
          x="2"
          y="2"
          width="14"
          height="14"
          rx="1"
        ></rect>
      </g>
    </g>
  </svg>
);

export default DisplayFillOnly;
