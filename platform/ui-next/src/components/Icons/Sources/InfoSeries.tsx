import React from 'react';
import type { IconProps } from '../types';

export const InfoSeries = (props: IconProps) => (
  <svg
    width="12px"
    height="12px"
    viewBox="0 0 12 12"
    version="1.1"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <title>info-series</title>
    <g
      id="info-series"
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
        id="series"
        transform="translate(1.5, 1.5)"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path
          d="M2.22352941,6.3 L0.370588235,6.3 C0.165918004,6.3 0,6.134082 0,5.92941176 L0,0.370588235 C0,0.165918004 0.165918004,0 0.370588235,0 L5.92941176,0 C6.134082,0 6.3,0.165918004 6.3,0.370588235 L6.3,2.22352941"
          id="Path"
        ></path>
        <rect
          id="Rectangle"
          x="2.7"
          y="2.7"
          width="6.3"
          height="6.3"
          rx="1"
        ></rect>
      </g>
    </g>
  </svg>
);

export default InfoSeries;
