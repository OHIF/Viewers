import React from 'react';
import type { IconProps } from '../types';

export const Add = (props: IconProps) => (
  <svg
    width="24px"
    height="24px"
    viewBox="0 0 24 24"
    {...props}
  >
    <g
      id="Add"
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
      <g
        id="Group"
        transform="translate(6, 6)"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line
          x1="6"
          y1="0"
          x2="6"
          y2="12"
          id="Path"
        ></line>
        <line
          x1="12"
          y1="6"
          x2="0"
          y2="6"
          id="Path"
        ></line>
      </g>
    </g>
  </svg>
);

export default Add;
