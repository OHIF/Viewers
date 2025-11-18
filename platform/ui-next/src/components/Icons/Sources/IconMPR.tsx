import React from 'react';
import type { IconProps } from '../types';

export const IconMPR = (props: IconProps) => (
  <svg
    width="12px"
    height="12px"
    viewBox="0 0 12 12"
    version="1.1"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <title>info-mpr</title>
    <g
      id="info-mpr"
      stroke="none"
      strokeWidth="1"
      fill="none"
      fillRule="evenodd"
    >
      <rect
        id="Rectangle"
        x="0"
        y="0"
        width="12"
        height="12"
      ></rect>
      <g
        id="mpr"
        transform="translate(1.5, 1.5)"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polygon
          id="Path"
          points="4.5 0 0 1.90909091 4.5 3.81818182 9 1.90909091"
        ></polygon>
        <polyline
          id="Path"
          points="0 1.90909091 0 7.09090909 4.5 9 9 7.09090909 9 1.90909091"
        ></polyline>
        <line
          x1="4.5"
          y1="3.81818182"
          x2="4.5"
          y2="9"
          id="Path"
        ></line>
      </g>
    </g>
  </svg>
);

export default IconMPR;
