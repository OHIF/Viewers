import React from 'react';
import type { IconProps } from '../types';

export const DisplayFillAndOutline = (props: IconProps) => (
  <svg
    width="18px"
    height="18px"
    viewBox="0 0 18 18"
    {...props}
  >
    <g
      id="view-outline-fill"
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
          stroke="currentColor"
          x="1.5"
          y="1.5"
          width="15"
          height="15"
          rx="1"
        ></rect>
        <rect
          id="Rectangle"
          fill="currentColor"
          x="3.5"
          y="3.5"
          width="11"
          height="11"
          rx="1"
        ></rect>
      </g>
    </g>
  </svg>
);

export default DisplayFillAndOutline;
