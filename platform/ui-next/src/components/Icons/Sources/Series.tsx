import React from 'react';
import type { IconProps } from '../types';

export const Series = (props: IconProps) => (
  <svg
    width="24px"
    height="24px"
    viewBox="0 0 24 24"
    {...props}
  >
    <g
      id="Series"
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
      <path
        d="M8.17391304,15.826087 L4.69565217,15.826087 C4.31145409,15.826087 4,15.5146329 4,15.1304348 L4,4.69565217 C4,4.31145409 4.31145409,4 4.69565217,4 L15.1304348,4 C15.5146329,4 15.826087,4.31145409 15.826087,4.69565217 L15.826087,8.17391304"
        id="Path"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></path>
      <rect
        id="Rectangle"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        x="8.17391304"
        y="8.17391304"
        width="11.826087"
        height="11.826087"
        rx="1"
      ></rect>
    </g>
  </svg>
);

export default Series;
